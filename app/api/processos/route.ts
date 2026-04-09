/**
 * API de Busca de Processos
 * Endpoints para buscar processos judiciais
 */

import { apiHandler, successResponse, ValidationError } from '@/lib/api';
import { getLegalDataGateway } from '@/src/infrastructure/gateways/LegalDataGateway';
import { z } from 'zod';

/**
 * Schema de validação para busca
 */
const searchSchema = z.object({
  tribunal: z.string().optional(),
  classe: z.string().optional(),
  assunto: z.string().optional(),
  parte: z.string().optional(),
  inicio: z.string().optional(),
  fim: z.string().optional(),
  limit: z.string().optional().transform((v) => (v ? parseInt(v) : 20)),
  offset: z.string().optional().transform((v) => (v ? parseInt(v) : 0)),
});

/**
 * GET /api/processos
 * Busca processos por filtros
 */
export const GET = apiHandler(async (request) => {
  const { searchParams } = new URL(request.url);

  // Extrair e validar parâmetros
  const params = searchSchema.parse({
    tribunal: searchParams.get('tribunal'),
    classe: searchParams.get('classe'),
    assunto: searchParams.get('assunto'),
    parte: searchParams.get('parte'),
    inicio: searchParams.get('inicio'),
    fim: searchParams.get('fim'),
    limit: searchParams.get('limit'),
    offset: searchParams.get('offset'),
  });

  // Pelo menos um filtro é necessário
  if (!params.tribunal && !params.classe && !params.parte) {
    throw new ValidationError(
      'Pelo menos um filtro é necessário: tribunal, classe ou parte'
    );
  }

  // Construir período se fornecido
  let periodo: { inicio: Date; fim: Date } | undefined;
  if (params.inicio && params.fim) {
    const inicio = new Date(params.inicio);
    const fim = new Date(params.fim);

    if (isNaN(inicio.getTime()) || isNaN(fim.getTime())) {
      throw new ValidationError('Datas inválidas. Use formato ISO: YYYY-MM-DD');
    }

    periodo = { inicio, fim };
  }

  // Buscar processos
  const gateway = getLegalDataGateway();

  const result = await gateway.searchProcessos({
    tribunal: params.tribunal || undefined,
    classe: params.classe || undefined,
    assunto: params.assunto || undefined,
    parte: params.parte || undefined,
    periodo,
    limit: params.limit,
    offset: params.offset,
  });

  return successResponse({
    processos: result.items,
    pagination: {
      total: result.total,
      limit: result.limit,
      offset: result.offset,
      hasMore: result.hasMore,
    },
    metadata: {
      providers: gateway.getActiveProviders(),
    },
  });
});
