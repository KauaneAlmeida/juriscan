/**
 * API de Tribunais
 * Lista tribunais disponíveis para consulta de jurimetria
 */

import { apiHandler, successResponse } from '@/lib/api';
import { getLegalDataGateway } from '@/src/infrastructure/gateways/LegalDataGateway';

/**
 * GET /api/jurimetrics/tribunais
 * Retorna lista de tribunais disponíveis (público)
 */
export const GET = apiHandler(async () => {
  const gateway = getLegalDataGateway();

  const tribunais = await gateway.listTribunais();

  return successResponse({
    tribunais,
    total: tribunais.length,
  });
}, { requireAuth: false });
