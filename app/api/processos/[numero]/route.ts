/**
 * API de Processo por Número
 * Endpoint para buscar processo específico pelo número CNJ
 */

import { apiHandler, successResponse, NotFoundError, ValidationError } from '@/lib/api';
import { getLegalDataGateway } from '@/src/infrastructure/gateways/LegalDataGateway';

/**
 * GET /api/processos/[numero]
 * Busca processo por número CNJ
 */
export const GET = apiHandler(async (request, { params }) => {
  const { numero } = params;

  if (!numero) {
    throw new ValidationError('Número do processo é obrigatório');
  }

  // Validar formato do número (aceita com ou sem formatação)
  const numeroLimpo = numero.replace(/\D/g, '');
  if (numeroLimpo.length !== 20) {
    throw new ValidationError(
      'Número do processo inválido. Use o formato CNJ: NNNNNNN-DD.AAAA.J.TR.OOOO'
    );
  }

  // Buscar processo
  const gateway = getLegalDataGateway();
  const processo = await gateway.getProcesso(numeroLimpo);

  if (!processo) {
    throw new NotFoundError(`Processo ${numero} não encontrado`);
  }

  return successResponse({
    processo,
    metadata: {
      providers: gateway.getActiveProviders(),
      cache_stats: gateway.getCacheStats(),
    },
  });
});
