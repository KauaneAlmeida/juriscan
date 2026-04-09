import type {
  Report,
  PredictiveAnalysisResult,
  JurimetricsResult,
  JudgeProfileResult,
} from "@/types/reports";
import { REPORT_TYPE_INFO } from "@/types/reports";

type ReportResult =
  | PredictiveAnalysisResult
  | JurimetricsResult
  | JudgeProfileResult;

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function generateTXT(report: Report, result: ReportResult): string {
  const divider = "\u2550".repeat(60);
  const subDivider = "\u2500".repeat(60);
  let text = "";

  // Header
  text += `${divider}\n`;
  text += `JURISCAN - RELATORIO ESTRATEGICO\n`;
  text += `${divider}\n\n`;
  text += `Titulo: ${report.title}\n`;
  text += `Tipo: ${REPORT_TYPE_INFO[report.type]?.label}\n`;
  text += `Data de Geracao: ${formatDate(report.generated_at || report.created_at)}\n`;
  text += `\n${subDivider}\n\n`;

  if (report.type === "PREDICTIVE_ANALYSIS") {
    const data = result as PredictiveAnalysisResult;
    text += `ANALISE PREDITIVA\n\n`;
    text += `Probabilidade de Exito: ${data.probabilidade_exito}%\n`;
    text += `Nivel de Confianca: ${data.confianca.toUpperCase()}\n\n`;

    text += `${subDivider}\nRESUMO EXECUTIVO\n${subDivider}\n`;
    text += `${data.resumo_executivo}\n\n`;

    text += `${subDivider}\nFATORES FAVORAVEIS\n${subDivider}\n`;
    data.fatores_favoraveis.forEach((f, i) => {
      text += `${i + 1}. ${f}\n`;
    });
    text += `\n`;

    text += `${subDivider}\nFATORES DESFAVORAVEIS\n${subDivider}\n`;
    data.fatores_desfavoraveis.forEach((f, i) => {
      text += `${i + 1}. ${f}\n`;
    });
    text += `\n`;

    text += `${subDivider}\nRECOMENDACOES ESTRATEGICAS\n${subDivider}\n`;
    data.recomendacoes.forEach((r, i) => {
      text += `${i + 1}. ${r}\n`;
    });
    text += `\n`;

    if (data.jurisprudencia.length > 0) {
      text += `${subDivider}\nJURISPRUDENCIA RELEVANTE\n${subDivider}\n`;
      data.jurisprudencia.forEach((j) => {
        text += `* ${j.tribunal} - ${j.numero}\n`;
        text += `  ${j.resumo}\n\n`;
      });
    }

    if (data.riscos.length > 0) {
      text += `${subDivider}\nRISCOS IDENTIFICADOS\n${subDivider}\n`;
      data.riscos.forEach((r, i) => {
        text += `${i + 1}. ${r}\n`;
      });
    }
  } else if (report.type === "JURIMETRICS") {
    const data = result as JurimetricsResult;
    text += `ANALISE DE JURIMETRIA\n\n`;
    text += `Tribunal: ${data.tribunal}\n`;
    text += `Periodo: ${data.periodo_analise.inicio} a ${data.periodo_analise.fim}\n\n`;

    text += `${subDivider}\nESTATISTICAS\n${subDivider}\n`;
    text += `Volume Total de Processos: ${data.volume_total.toLocaleString()}\n`;
    text += `Taxa de Procedencia: ${data.taxa_procedencia}%\n`;
    text += `Taxa de Improcedencia: ${data.taxa_improcedencia}%\n`;
    text += `Taxa Parcial: ${data.taxa_parcial}%\n`;
    text += `Taxa de Acordo: ${data.taxa_acordo}%\n`;
    text += `Tempo Medio ate Sentenca: ${data.tempo_medio_sentenca_dias} dias\n`;
    text += `Tempo Medio ate Transito: ${data.tempo_medio_transito_dias} dias\n\n`;

    text += `${subDivider}\nCOMPARATIVO NACIONAL\n${subDivider}\n`;
    text += `${data.comparativo_nacional.acima_media ? "Acima" : "Abaixo"} da media nacional\n`;
    text += `Diferenca: ${data.comparativo_nacional.diferenca_percentual > 0 ? "+" : ""}${data.comparativo_nacional.diferenca_percentual}%\n\n`;

    text += `${subDivider}\nTENDENCIAS\n${subDivider}\n`;
    data.tendencias.forEach((t, i) => {
      text += `${i + 1}. ${t}\n`;
    });
    text += `\n`;

    text += `${subDivider}\nINSIGHTS\n${subDivider}\n`;
    data.insights.forEach((ins, i) => {
      text += `${i + 1}. ${ins}\n`;
    });
  } else if (report.type === "RELATOR_PROFILE") {
    const data = result as JudgeProfileResult;
    text += `PERFIL DO MAGISTRADO\n\n`;
    text += `Nome: ${data.magistrado.nome}\n`;
    text += `Tribunal: ${data.magistrado.tribunal}\n`;
    text += `Vara/Camara: ${data.magistrado.vara_camara}\n`;
    text += `Tempo de Atuacao: ${data.magistrado.tempo_atuacao_anos} anos\n\n`;

    text += `${subDivider}\nESTATISTICAS\n${subDivider}\n`;
    text += `Total de Decisoes: ${data.estatisticas.total_decisoes}\n`;
    text += `Taxa de Procedencia: ${data.estatisticas.taxa_procedencia}%\n`;
    text += `Taxa de Reforma: ${data.estatisticas.taxa_reforma}%\n`;
    text += `Tempo Medio para Decisao: ${data.estatisticas.tempo_medio_decisao_dias} dias\n\n`;

    const favoreceLabel =
      data.tendencias.favorece === "autor"
        ? "Autor"
        : data.tendencias.favorece === "reu"
          ? "Reu"
          : "Neutro";
    text += `${subDivider}\nTENDENCIA\n${subDivider}\n`;
    text += `Favorece: ${favoreceLabel}\n`;
    text += `Intensidade: ${data.tendencias.intensidade}\n\n`;

    text += `${subDivider}\nTIPOS DE CASO MAIS FREQUENTES\n${subDivider}\n`;
    data.tipos_caso_frequentes.forEach((t) => {
      text += `* ${t.tipo}: ${t.percentual}%\n`;
    });
    text += `\n`;

    text += `${subDivider}\nRECOMENDACOES ESTRATEGICAS\n${subDivider}\n`;
    data.recomendacoes_estrategicas.forEach((r, i) => {
      text += `${i + 1}. ${r}\n`;
    });
  }

  // Footer
  text += `\n${divider}\n`;
  text += `AVISO LEGAL\n`;
  text += `${divider}\n`;
  text += `Esta analise e baseada em padroes estatisticos e jurisprudencia\n`;
  text += `historica. Nao constitui garantia de resultado nem substitui\n`;
  text += `parecer juridico profissional.\n\n`;
  text += `Gerado por Juriscan - ${new Date().toLocaleDateString("pt-BR")}\n`;

  return text;
}
