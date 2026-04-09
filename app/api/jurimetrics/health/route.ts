/**
 * API Health Check - Legal Data Providers
 * Verifica status dos providers de dados jurídicos
 */

import { apiHandler, successResponse } from '@/lib/api';
import { getLegalDataGateway } from '@/src/infrastructure/gateways/LegalDataGateway';

/**
 * GET /api/jurimetrics/health
 * Retorna status de saúde dos providers (público para monitoramento)
 */
export const GET = apiHandler(async () => {
  const gateway = getLegalDataGateway();

  const healthMap = await gateway.healthCheck();

  // Converter Map para objeto
  const health: Record<string, unknown> = {};
  for (const [provider, status] of Array.from(healthMap.entries())) {
    health[provider] = status;
  }

  // Determinar status geral
  const allHealthy = Array.from(healthMap.values()).every(
    (h) => h.status === 'healthy'
  );
  const anyHealthy = Array.from(healthMap.values()).some(
    (h) => h.status === 'healthy'
  );

  return successResponse({
    status: allHealthy ? 'healthy' : anyHealthy ? 'degraded' : 'unhealthy',
    providers: health,
    active_providers: gateway.getActiveProviders(),
    cache_stats: gateway.getCacheStats(),
    timestamp: new Date().toISOString(),
  });
}, { requireAuth: false });
