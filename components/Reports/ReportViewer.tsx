"use client";

import { X, Loader2, AlertCircle, CheckCircle, TrendingUp, TrendingDown, Minus } from "lucide-react";
import type { Report, PredictiveAnalysisResult, JurimetricsResult, JudgeProfileResult } from "@/types/reports";
import { REPORT_TYPE_INFO } from "@/types/reports";
import ExportDropdown from "./ExportDropdown";

interface ReportViewerProps {
  report: Report;
  isOpen: boolean;
  onClose: () => void;
  onGenerate: () => Promise<void>;
  isGenerating: boolean;
}

export default function ReportViewer({
  report,
  isOpen,
  onClose,
  onGenerate,
  isGenerating,
}: ReportViewerProps) {
  if (!isOpen) return null;

  const content = report.content as {
    parameters?: Record<string, unknown>;
    result?: PredictiveAnalysisResult | JurimetricsResult | JudgeProfileResult;
    error?: string;
  } | null;

  const result = content?.result;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const renderPredictiveResult = (data: PredictiveAnalysisResult) => (
    <div className="space-y-6">
      {/* Probability */}
      <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-xl p-6">
        <div className="text-center">
          <p className="text-sm text-gray-600 mb-2">Probabilidade de Êxito</p>
          <p className="text-4xl sm:text-5xl font-bold text-primary mb-2">{data.probabilidade_exito}%</p>
          <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${
            data.confianca === "alta" ? "bg-green-100 text-green-700" :
            data.confianca === "media" ? "bg-amber-100 text-amber-700" :
            "bg-red-100 text-red-700"
          }`}>
            Confiança {data.confianca}
          </span>
        </div>
      </div>

      {/* Summary */}
      <div>
        <h4 className="font-semibold text-gray-800 mb-2">Resumo Executivo</h4>
        <p className="text-sm text-gray-600 leading-relaxed">{data.resumo_executivo}</p>
      </div>

      {/* Factors */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-green-50 rounded-xl p-4">
          <h4 className="font-semibold text-green-800 mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Fatores Favoráveis
          </h4>
          <ul className="space-y-2">
            {data.fatores_favoraveis.map((fator, i) => (
              <li key={i} className="text-sm text-green-700 flex items-start gap-2">
                <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                {fator}
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-red-50 rounded-xl p-4">
          <h4 className="font-semibold text-red-800 mb-3 flex items-center gap-2">
            <TrendingDown className="w-4 h-4" />
            Fatores Desfavoráveis
          </h4>
          <ul className="space-y-2">
            {data.fatores_desfavoraveis.map((fator, i) => (
              <li key={i} className="text-sm text-red-700 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                {fator}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Recommendations */}
      <div>
        <h4 className="font-semibold text-gray-800 mb-3">Recomendações Estratégicas</h4>
        <ul className="space-y-2">
          {data.recomendacoes.map((rec, i) => (
            <li key={i} className="text-sm text-gray-600 flex items-start gap-2 bg-gray-50 p-3 rounded-lg">
              <span className="w-5 h-5 bg-primary text-white text-xs font-bold rounded-full flex items-center justify-center flex-shrink-0">
                {i + 1}
              </span>
              {rec}
            </li>
          ))}
        </ul>
      </div>

      {/* Jurisprudence */}
      {data.jurisprudencia.length > 0 && (
        <div>
          <h4 className="font-semibold text-gray-800 mb-3">Jurisprudência Relevante</h4>
          <div className="space-y-2">
            {data.jurisprudencia.map((j, i) => (
              <div key={i} className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm font-medium text-gray-800">{j.tribunal} - {j.numero}</p>
                <p className="text-sm text-gray-600 mt-1">{j.resumo}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Risks */}
      {data.riscos.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <h4 className="font-semibold text-amber-800 mb-2">Riscos Identificados</h4>
          <ul className="space-y-1">
            {data.riscos.map((risco, i) => (
              <li key={i} className="text-sm text-amber-700">• {risco}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );

  const renderJurimetricsResult = (data: JurimetricsResult) => (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4">
        <div className="bg-gray-50 rounded-xl p-3 sm:p-4 text-center">
          <p className="text-lg sm:text-2xl font-bold text-gray-800">{data.volume_total.toLocaleString()}</p>
          <p className="text-[10px] sm:text-xs text-gray-500">Processos Analisados</p>
        </div>
        <div className="bg-green-50 rounded-xl p-3 sm:p-4 text-center">
          <p className="text-lg sm:text-2xl font-bold text-green-600">{data.taxa_procedencia}%</p>
          <p className="text-[10px] sm:text-xs text-gray-500">Procedentes</p>
        </div>
        <div className="bg-red-50 rounded-xl p-3 sm:p-4 text-center">
          <p className="text-lg sm:text-2xl font-bold text-red-600">{data.taxa_improcedencia}%</p>
          <p className="text-[10px] sm:text-xs text-gray-500">Improcedentes</p>
        </div>
        <div className="bg-blue-50 rounded-xl p-3 sm:p-4 text-center">
          <p className="text-lg sm:text-2xl font-bold text-blue-600">{data.tempo_medio_sentenca_dias}</p>
          <p className="text-[10px] sm:text-xs text-gray-500">Dias até Sentença</p>
        </div>
      </div>

      {/* Comparativo */}
      <div className={`rounded-xl p-4 flex items-center justify-between ${
        data.comparativo_nacional.acima_media ? "bg-green-50" : "bg-amber-50"
      }`}>
        <div className="flex items-center gap-3">
          {data.comparativo_nacional.acima_media ? (
            <TrendingUp className="w-6 h-6 text-green-600" />
          ) : (
            <TrendingDown className="w-6 h-6 text-amber-600" />
          )}
          <div>
            <p className="font-medium text-gray-800">Comparativo Nacional</p>
            <p className="text-sm text-gray-600">
              {data.comparativo_nacional.acima_media ? "Acima" : "Abaixo"} da média nacional
            </p>
          </div>
        </div>
        <span className={`text-lg font-bold ${
          data.comparativo_nacional.acima_media ? "text-green-600" : "text-amber-600"
        }`}>
          {data.comparativo_nacional.diferenca_percentual > 0 ? "+" : ""}
          {data.comparativo_nacional.diferenca_percentual}%
        </span>
      </div>

      {/* Tendências */}
      <div>
        <h4 className="font-semibold text-gray-800 mb-3">Tendências Identificadas</h4>
        <ul className="space-y-2">
          {data.tendencias.map((t, i) => (
            <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
              <Minus className="w-4 h-4 text-primary mt-0.5" />
              {t}
            </li>
          ))}
        </ul>
      </div>

      {/* Insights */}
      <div>
        <h4 className="font-semibold text-gray-800 mb-3">Insights</h4>
        <div className="grid gap-2">
          {data.insights.map((insight, i) => (
            <div key={i} className="bg-primary/5 p-3 rounded-lg text-sm text-gray-700">
              {insight}
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderJudgeProfileResult = (data: JudgeProfileResult) => (
    <div className="space-y-6">
      {/* Magistrado Info */}
      <div className="bg-gray-50 rounded-xl p-5">
        <h4 className="font-semibold text-gray-800 text-lg">{data.magistrado.nome}</h4>
        <p className="text-sm text-gray-600">{data.magistrado.tribunal} - {data.magistrado.vara_camara}</p>
        <p className="text-xs text-gray-500 mt-1">{data.magistrado.tempo_atuacao_anos} anos de atuação</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4">
        <div className="bg-white border rounded-xl p-3 sm:p-4 text-center">
          <p className="text-lg sm:text-2xl font-bold text-gray-800">{data.estatisticas.total_decisoes}</p>
          <p className="text-[10px] sm:text-xs text-gray-500">Total de Decisões</p>
        </div>
        <div className="bg-white border rounded-xl p-3 sm:p-4 text-center">
          <p className="text-lg sm:text-2xl font-bold text-green-600">{data.estatisticas.taxa_procedencia}%</p>
          <p className="text-[10px] sm:text-xs text-gray-500">Taxa Procedência</p>
        </div>
        <div className="bg-white border rounded-xl p-3 sm:p-4 text-center">
          <p className="text-lg sm:text-2xl font-bold text-amber-600">{data.estatisticas.taxa_reforma}%</p>
          <p className="text-[10px] sm:text-xs text-gray-500">Taxa de Reforma</p>
        </div>
        <div className="bg-white border rounded-xl p-3 sm:p-4 text-center">
          <p className="text-lg sm:text-2xl font-bold text-blue-600">{data.estatisticas.tempo_medio_decisao_dias}</p>
          <p className="text-[10px] sm:text-xs text-gray-500">Dias para Decisão</p>
        </div>
      </div>

      {/* Tendência */}
      <div className={`rounded-xl p-4 ${
        data.tendencias.favorece === "autor" ? "bg-green-50" :
        data.tendencias.favorece === "reu" ? "bg-amber-50" :
        "bg-gray-50"
      }`}>
        <p className="font-medium text-gray-800">Tendência Identificada</p>
        <p className="text-sm text-gray-600">
          Favorece {data.tendencias.favorece === "autor" ? "o Autor" : data.tendencias.favorece === "reu" ? "o Réu" : "Neutro"}
          {" "}com intensidade {data.tendencias.intensidade}
        </p>
      </div>

      {/* Tipos de Caso */}
      <div>
        <h4 className="font-semibold text-gray-800 mb-3">Tipos de Caso Mais Frequentes</h4>
        <div className="space-y-2">
          {data.tipos_caso_frequentes.map((tipo, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="flex-1 bg-gray-100 rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full"
                  style={{ width: `${tipo.percentual}%` }}
                />
              </div>
              <span className="text-sm text-gray-600 w-24">{tipo.tipo}</span>
              <span className="text-sm font-medium text-gray-800 w-12 text-right">{tipo.percentual}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* Recomendações */}
      <div>
        <h4 className="font-semibold text-gray-800 mb-3">Recomendações Estratégicas</h4>
        <ul className="space-y-2">
          {data.recomendacoes_estrategicas.map((rec, i) => (
            <li key={i} className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
              {rec}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );

  const renderContent = () => {
    if (report.status === "DRAFT") {
      return (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-amber-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Relatório em Rascunho</h3>
          <p className="text-gray-500 mb-6 max-w-sm mx-auto">
            Clique em &quot;Gerar Relatório&quot; para processar os dados e criar o conteúdo com IA.
          </p>
          <button
            onClick={onGenerate}
            disabled={isGenerating}
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary-hover disabled:bg-gray-300 text-white font-medium rounded-lg transition-colors"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Gerando...
              </>
            ) : (
              "Gerar Relatório"
            )}
          </button>
        </div>
      );
    }

    if (report.status === "GENERATING") {
      return (
        <div className="text-center py-12">
          <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Gerando Relatório...</h3>
          <p className="text-gray-500">Isso pode levar alguns segundos.</p>
        </div>
      );
    }

    if (report.status === "FAILED") {
      return (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Falha ao Gerar</h3>
          <p className="text-gray-500 mb-6">{content?.error || "Erro desconhecido"}</p>
          <button
            onClick={onGenerate}
            disabled={isGenerating}
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary-hover text-white font-medium rounded-lg"
          >
            Tentar Novamente
          </button>
        </div>
      );
    }

    if (report.status === "COMPLETED" && result) {
      switch (report.type) {
        case "PREDICTIVE_ANALYSIS":
          return renderPredictiveResult(result as PredictiveAnalysisResult);
        case "JURIMETRICS":
          return renderJurimetricsResult(result as JurimetricsResult);
        case "RELATOR_PROFILE":
          return renderJudgeProfileResult(result as JudgeProfileResult);
        default:
          return <p className="text-gray-500">Tipo de relatório não suportado para visualização.</p>;
      }
    }

    return null;
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">{report.title}</h2>
            <p className="text-sm text-gray-500">
              {REPORT_TYPE_INFO[report.type]?.label} • {formatDate(report.created_at)}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {report.status === "COMPLETED" && result && (
              <ExportDropdown report={report} result={result} />
            )}
            <button
              onClick={onClose}
              className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center text-gray-400 hover:text-gray-600 active:text-gray-800 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {renderContent()}
        </div>

        {/* Disclaimer */}
        {report.status === "COMPLETED" && (
          <div className="p-4 bg-gray-50 border-t">
            <p className="text-xs text-gray-500 text-center">
              Esta análise é baseada em padrões estatísticos e jurisprudência histórica.
              Não constitui garantia de resultado nem substitui parecer jurídico profissional.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
