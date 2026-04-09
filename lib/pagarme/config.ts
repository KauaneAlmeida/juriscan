// Plans configuration
export const PLANS = {
  free: {
    id: "free",
    name: "Gratuito",
    description: "Sem plano ativo",
    price: 0,
    credits: 20,
    features: ["20 créditos (único)", "Chat jurídico com IA"],
    pagarmePlanId: null,
    highlighted: false,
    badge: null,
  },
  starter: {
    id: "starter",
    name: "Starter",
    description: "Ideal para advogados autônomos",
    price: 69,
    credits: 100,
    features: [
      "100 créditos/mês",
      "Chat jurídico com IA",
      "Análise de documentos PDF",
      "Histórico de conversas",
      "Suporte por email",
    ],
    pagarmePlanId: process.env.PAGARME_PLAN_STARTER || null,
    highlighted: false,
    badge: null,
  },
  pro: {
    id: "pro",
    name: "Pro",
    description: "Para escritórios em crescimento",
    price: 129,
    credits: 300,
    features: [
      "300 créditos/mês",
      "Tudo do Starter",
      "Relatórios em PDF",
      "Jurimetria avançada",
      "Análises preditivas",
      "Suporte prioritário",
    ],
    pagarmePlanId: process.env.PAGARME_PLAN_PRO || null,
    highlighted: true,
    badge: "Mais popular",
  },
  business: {
    id: "business",
    name: "Business",
    description: "Para escritórios de médio e grande porte",
    price: 299,
    credits: 800,
    features: [
      "800 créditos/mês",
      "Tudo do Pro",
      "Análises em lote",
      "Relatórios ilimitados",
      "Suporte dedicado",
    ],
    pagarmePlanId: process.env.PAGARME_PLAN_BUSINESS || null,
    highlighted: false,
    badge: null,
  },
} as const;

export type PlanId = keyof typeof PLANS;

// Extra credits: R$ 1,29 per credit
export const EXTRA_CREDIT_PRICE = 1.29;

// Credit packages for one-time purchases
export const CREDIT_PACKAGES = [
  {
    id: "credits_10",
    credits: 10,
    price: 12.9,
    pricePerCredit: 1.29,
    popular: false,
  },
  {
    id: "credits_50",
    credits: 50,
    price: 64.5,
    pricePerCredit: 1.29,
    popular: true,
  },
  {
    id: "credits_100",
    credits: 100,
    price: 129,
    pricePerCredit: 1.29,
    popular: false,
  },
] as const;
