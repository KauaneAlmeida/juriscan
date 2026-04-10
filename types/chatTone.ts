export type TomDeResposta = 'formal' | 'humanizado' | 'executivo' | 'minuta'

export interface TomConfig {
  id: TomDeResposta
  label: string
  descricao: string
  icone: string
  instrucao: string
}

export const TONS_DE_RESPOSTA: TomConfig[] = [
  {
    id: 'formal',
    label: 'Formal',
    descricao: 'Linguagem técnica e estruturada, com referências legais',
    icone: '⚖️',
    instrucao: `Responda em linguagem jurídica formal brasileira. Use terminologia técnica precisa, cite dispositivos legais relevantes quando aplicável (artigos, incisos, parágrafos), estruture a resposta em parágrafos bem organizados com fundamentação sólida. O tom deve ser de um parecer jurídico profissional. Evite linguagem coloquial.`,
  },
  {
    id: 'humanizado',
    label: 'Humanizado',
    descricao: 'Linguagem clara e direta, sem jargão excessivo',
    icone: '💬',
    instrucao: `Responda de forma clara, direta e acessível. Use linguagem simples sem abrir mão da precisão jurídica. Explique termos técnicos quando necessário. O tom deve ser de um advogado experiente explicando o caso para um cliente inteligente mas não jurista. Seja objetivo e empático.`,
  },
  {
    id: 'executivo',
    label: 'Executivo',
    descricao: 'Resposta concisa em tópicos, com probabilidade e próximos passos',
    icone: '📊',
    instrucao: `Responda de forma extremamente concisa e estruturada. Sempre inicie com uma linha de conclusão direta (ex: "Probabilidade de êxito: alta (75-80%)"). Use bullet points para os pontos principais. Termine com uma seção "Próximos passos recomendados" em 3 itens no máximo. Não use parágrafos longos. Priorize dados e ações concretas.`,
  },
  {
    id: 'minuta',
    label: 'Minuta',
    descricao: 'Output formatado como documento pronto para adaptar',
    icone: '📄',
    instrucao: `Formate a resposta como um documento jurídico estruturado pronto para ser adaptado. Inclua: cabeçalho com identificação do tipo de documento, corpo com seções numeradas (I, II, III...), fundamentação legal destacada, e conclusão/requerimento quando aplicável. Use formatação markdown para estrutura (##, **negrito**). O resultado deve parecer uma minuta de petição, parecer ou contrato — não uma resposta de chat.`,
  },
]
