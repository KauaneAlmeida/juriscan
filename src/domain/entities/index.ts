/**
 * Domain Entities - Barrel Export
 */

export * from './Tribunal';
export * from './Vara';
export * from './Juiz';
export * from './Parte';
export * from './Movimentacao';
export * from './Processo';
export * from './Jurisprudencia';
// Export Jurimetrics with renamed function to avoid conflict with Juiz
export {
  type PeriodoAnalise as JurimetricsPeriodo,
  type EscopoAnalise,
  type TaxasJurimetria,
  type TemposJurimetria,
  type ValoresJurimetria,
  type VolumeJurimetria,
  type DistribuicaoJurimetria,
  type TendenciaJurimetrica,
  type ComparativoJurimetrico,
  type MetricasJurimetria,
  type JurimetricsData,
  createJurimetricsData,
  calcularTendencia as calcularTendenciaJurimetrica,
  formatarTaxas,
  formatarTempo,
  formatarValor,
} from './Jurimetrics';
