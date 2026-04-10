// Cliente leve para a API publica do DataJud (CNJ).
// Usado pela tool "buscar_jurisprudencia" exposta ao Claude no chat.
//
// Ja existe um adapter mais completo em src/infrastructure/adapters/legal-data/DataJudAdapter.ts,
// mas ele e usado para enrichment de prompt (jurimetria/volumes). Esta camada e
// especializada em busca textual de acordaos por tema, retornando ementas reais
// para o LLM sintetizar.

export interface DatajudResultado {
  numeroProcesso: string;
  dataJulgamento: string;
  ementa: string;
  relator: string | null;
  orgaoJulgador: string | null;
  classe: string | null;
  tribunal: string;
}

export interface DatajudResposta {
  resultados: DatajudResultado[];
  total: number;
  tribunal: string;
  tema: string;
}

// Mapeia siglas comuns para os slugs reais usados nos indices do DataJud.
// Apenas tribunais com indice publicado pelo CNJ. A lista completa de
// indices esta documentada na Wiki: https://datajud-wiki.cnj.jus.br/api-publica/endpoints
const TRIBUNAL_SLUGS: Record<string, string> = {
  // Tribunais superiores
  stj: "stj",
  stf: "stf",
  tst: "tst",
  tse: "tse",
  stm: "stm",
  // Tribunais estaduais (TJs)
  tjac: "tjac",
  tjal: "tjal",
  tjam: "tjam",
  tjap: "tjap",
  tjba: "tjba",
  tjce: "tjce",
  tjdf: "tjdft",
  tjdft: "tjdft",
  tjes: "tjes",
  tjgo: "tjgo",
  tjma: "tjma",
  tjmg: "tjmg",
  tjms: "tjms",
  tjmt: "tjmt",
  tjpa: "tjpa",
  tjpb: "tjpb",
  tjpe: "tjpe",
  tjpi: "tjpi",
  tjpr: "tjpr",
  tjrj: "tjrj",
  tjrn: "tjrn",
  tjro: "tjro",
  tjrr: "tjrr",
  tjrs: "tjrs",
  tjsc: "tjsc",
  tjse: "tjse",
  tjsp: "tjsp",
  tjto: "tjto",
  // Tribunais regionais federais
  trf1: "trf1",
  trf2: "trf2",
  trf3: "trf3",
  trf4: "trf4",
  trf5: "trf5",
  trf6: "trf6",
  // Tribunais regionais do trabalho
  trt1: "trt1",
  trt2: "trt2",
  trt3: "trt3",
  trt4: "trt4",
  trt5: "trt5",
  trt6: "trt6",
  trt7: "trt7",
  trt8: "trt8",
  trt9: "trt9",
  trt10: "trt10",
  trt11: "trt11",
  trt12: "trt12",
  trt13: "trt13",
  trt14: "trt14",
  trt15: "trt15",
  trt16: "trt16",
  trt17: "trt17",
  trt18: "trt18",
  trt19: "trt19",
  trt20: "trt20",
  trt21: "trt21",
  trt22: "trt22",
  trt23: "trt23",
  trt24: "trt24",
};

function normalizarTribunal(tribunal: string): string {
  const lower = tribunal.toLowerCase().replace(/[^a-z0-9]/g, "");
  return TRIBUNAL_SLUGS[lower] || lower;
}

function normalizarData(dataStr: string | null): string {
  if (!dataStr) return "Data nao informada";
  try {
    return new Date(dataStr).toLocaleDateString("pt-BR");
  } catch {
    return dataStr;
  }
}

export async function buscarJurisprudencia(params: {
  tema: string;
  tribunal: string;
  quantidade?: number;
  dataInicio?: string;
}): Promise<DatajudResposta> {
  const apiKey = process.env.DATAJUD_API_KEY;
  if (!apiKey) {
    throw new Error("DATAJUD_API_KEY nao configurada no ambiente");
  }

  const tribunalSlug = normalizarTribunal(params.tribunal);
  const quantidade = Math.min(Math.max(params.quantidade || 5, 1), 8);
  const url = `https://api-publica.datajud.cnj.jus.br/api_publica_${tribunalSlug}/_search`;

  const filtros: Array<Record<string, unknown>> = [];
  if (params.dataInicio) {
    filtros.push({
      range: {
        dataAjuizamento: {
          gte: params.dataInicio,
          format: "yyyy-MM-dd",
        },
      },
    });
  }

  // O DataJud usa Elasticsearch. O dataset publico nao tem campo
  // "ementa" universal — ele varia por tribunal. Usamos multi_match
  // sobre os campos de assunto e classe, que sao consistentes.
  const body = {
    size: quantidade,
    query: {
      bool: {
        must: [
          {
            multi_match: {
              query: params.tema,
              fields: [
                "assuntos.nome^3",
                "classe.nome^2",
                "movimentos.nome",
              ],
              type: "best_fields",
              fuzziness: "AUTO",
            },
          },
        ],
        ...(filtros.length > 0 ? { filter: filtros } : {}),
      },
    },
    sort: [{ dataAjuizamento: { order: "desc" } }],
  };

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `APIKey ${apiKey}`,
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(15000),
  });

  if (!response.ok) {
    const erro = await response.text();
    throw new Error(`DataJud retornou ${response.status}: ${erro.slice(0, 300)}`);
  }

  const data = await response.json();
  const hits = data?.hits?.hits || [];
  const total = data?.hits?.total?.value || 0;

  const resultados: DatajudResultado[] = hits.map(
    (hit: { _source?: Record<string, unknown> }) => {
      const src = hit._source || {};
      const assuntos = (src.assuntos as Array<{ nome?: string }> | undefined) || [];
      const classe = src.classe as { nome?: string } | undefined;
      const orgao = src.orgaoJulgador as { nome?: string } | undefined;

      // Como o dataset publico nao tem "ementa" textual, montamos um
      // resumo do que esta disponivel: classe + assuntos + ultimo movimento.
      const movimentos =
        (src.movimentos as Array<{ nome?: string; dataHora?: string }> | undefined) ||
        [];
      const ultimoMov = movimentos[movimentos.length - 1];
      const resumoMov = ultimoMov?.nome
        ? `Ultimo movimento: ${ultimoMov.nome}${
            ultimoMov.dataHora ? ` (${normalizarData(ultimoMov.dataHora)})` : ""
          }`
        : "";
      const assuntosTxt = assuntos
        .slice(0, 5)
        .map((a) => a.nome)
        .filter(Boolean)
        .join("; ");
      const ementa =
        [
          classe?.nome ? `Classe: ${classe.nome}` : "",
          assuntosTxt ? `Assuntos: ${assuntosTxt}` : "",
          resumoMov,
        ]
          .filter(Boolean)
          .join(" | ") || "Sem detalhes adicionais";

      return {
        numeroProcesso:
          (src.numeroProcesso as string) || "Numero nao disponivel",
        dataJulgamento: normalizarData(
          (src.dataAjuizamento as string | null) || null
        ),
        ementa,
        relator: null,
        orgaoJulgador: orgao?.nome || null,
        classe: classe?.nome || null,
        tribunal: params.tribunal.toUpperCase(),
      };
    }
  );

  return {
    resultados,
    total,
    tribunal: params.tribunal.toUpperCase(),
    tema: params.tema,
  };
}
