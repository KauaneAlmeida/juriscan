/**
 * API de Jurimetria
 * Endpoints para buscar dados jurimétricos e gerar relatórios
 */

import { NextResponse } from 'next/server';
import { apiHandler, successResponse, parseBody, ValidationError } from '@/lib/api';
import { createGenerateJurimetricsReportUseCase } from '@/src/application/use-cases/reports';
import { getLegalDataGateway } from '@/src/infrastructure/gateways/LegalDataGateway';
import { z } from 'zod';

/**
 * Schema de validação para busca de jurimetria
 */
const jurimetricsQuerySchema = z.object({
  tribunal: z.string().min(2).max(20),
  periodo: z.object({
    inicio: z.string().transform((s) => new Date(s)),
    fim: z.string().transform((s) => new Date(s)),
  }),
  filtros: z
    .object({
      classe: z.string().optional(),
      assunto: z.string().optional(),
      materia: z.string().optional(),
    })
    .optional(),
});

/**
 * Schema para geração de relatório
 */
const generateReportSchema = jurimetricsQuerySchema.extend({
  titulo: z.string().optional(),
  formato: z.enum(['json', 'html']).optional().default('json'),
});

/**
 * GET /api/jurimetrics
 * Retorna dados jurimétricos para um tribunal e período
 */
export const GET = apiHandler(async (request) => {
  const { searchParams } = new URL(request.url);

  // Extrair parâmetros
  const tribunal = searchParams.get('tribunal');
  const inicio = searchParams.get('inicio');
  const fim = searchParams.get('fim');
  const classe = searchParams.get('classe');
  const assunto = searchParams.get('assunto');
  const materia = searchParams.get('materia');

  // Validar parâmetros obrigatórios
  if (!tribunal) {
    throw new ValidationError('Parâmetro "tribunal" é obrigatório');
  }
  if (!inicio || !fim) {
    throw new ValidationError('Parâmetros "inicio" e "fim" são obrigatórios');
  }

  // Validar datas
  const dataInicio = new Date(inicio);
  const dataFim = new Date(fim);

  if (isNaN(dataInicio.getTime()) || isNaN(dataFim.getTime())) {
    throw new ValidationError('Datas inválidas. Use formato ISO: YYYY-MM-DD');
  }

  if (dataFim < dataInicio) {
    throw new ValidationError('Data fim deve ser posterior à data início');
  }

  // Buscar dados de jurimetria
  const gateway = getLegalDataGateway();

  const jurimetrics = await gateway.getJurimetrics({
    tribunal,
    classe: classe || undefined,
    assunto: assunto || undefined,
    materia: materia || undefined,
    periodo: {
      inicio: dataInicio,
      fim: dataFim,
    },
  });

  return successResponse({
    jurimetrics,
    metadata: {
      providers: gateway.getActiveProviders(),
      cache_stats: gateway.getCacheStats(),
    },
  });
});

/**
 * POST /api/jurimetrics
 * Gera um relatório completo de jurimetria com insights de IA
 */
export const POST = apiHandler(async (request, { user }) => {
  const body = await parseBody(request, generateReportSchema);

  // Criar e executar use case
  const useCase = createGenerateJurimetricsReportUseCase();

  const result = await useCase.execute({
    tribunal: body.tribunal,
    periodo: body.periodo,
    filtros: body.filtros,
    userId: user?.id,
  });

  if (!result.success) {
    throw new Error(result.error || 'Erro ao gerar relatório de jurimetria');
  }

  // Retornar formato solicitado
  if (body.formato === 'html' && result.report?.html) {
    return new NextResponse(result.report.html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': `inline; filename="${result.report.titulo}.html"`,
      },
    });
  }

  return successResponse({
    report: result.report,
    metadata: result.metadata,
  });
});
