import type Anthropic from "@anthropic-ai/sdk";

// Definicao das ferramentas (tools) que o Claude pode chamar durante
// uma conversa do chat juridico. Cada tool aqui precisa ter um handler
// correspondente em app/api/chat/route.ts (funcao executeChatTool).

export const CHAT_TOOLS: Anthropic.Tool[] = [
  {
    name: "buscar_jurisprudencia",
    description: `Busca jurisprudencia real e atualizada na base oficial do CNJ (DataJud).
Use esta ferramenta SEMPRE que o usuario:
- Pedir jurisprudencia, acordaos, precedentes ou decisoes judiciais sobre qualquer tema
- Mencionar um tribunal especifico (STJ, STF, TST, TJSP, TJRJ etc.)
- Pedir decisoes dos "ultimos X anos/meses"
- Quiser saber como determinado tribunal decide sobre um tema
- Pedir jurimetria ou estatisticas de julgamentos
Nao use para perguntas conceituais (ex: "o que e prescricao?") nem para
analise de documentos que o usuario ja enviou.`,
    input_schema: {
      type: "object" as const,
      properties: {
        tema: {
          type: "string",
          description:
            'Tema juridico a buscar. Seja especifico. Ex: "dano moral negativacao indevida", "vinculo empregaticio motorista aplicativo", "usucapiao extraordinario prazo". Evite termos genericos.',
        },
        tribunal: {
          type: "string",
          description:
            "Sigla do tribunal: stj, stf, tst, tjsp, tjrj, tjmg, tjrs, tjpr, tjsc, tjba, tjpe, tjce, tjdft, trf1, trf2, trf3, trf4, trf5, trt2, trt15, etc. Se o usuario nao especificar, use stj para materia federal/civil ou tst para trabalhista.",
        },
        quantidade: {
          type: "number",
          description:
            "Quantidade de decisoes a retornar. Use 3 para consultas rapidas, 5 para analise completa, maximo 8.",
        },
        dataInicio: {
          type: "string",
          description:
            'Data minima de ajuizamento, formato YYYY-MM-DD. Use quando o usuario pedir decisoes dos "ultimos X anos". Para "ultimos 2 anos" use a data de 2 anos atras.',
        },
      },
      required: ["tema", "tribunal"],
    },
  },
];
