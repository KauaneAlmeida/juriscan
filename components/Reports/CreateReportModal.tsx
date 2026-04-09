"use client";

import { useState, useEffect } from "react";
import {
  X,
  BarChart3,
  TrendingUp,
  UserCircle2,
  Loader2,
  Lightbulb,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import type { ReportType, CreateReportInput } from "@/types/reports";
import { REPORT_COSTS } from "@/lib/credits/costs";

interface CreateReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (input: CreateReportInput) => Promise<void>;
  isCreating: boolean;
  balance: number;
}

type StepIndex = 1 | 2 | 3;

interface ReportTypeOption {
  type: ReportType;
  label: string;
  description: string;
  /** Tailwind background utility for the icon tile */
  iconBg: string;
  /** Tailwind text color utility for the icon */
  iconColor: string;
  Icon: typeof BarChart3;
}

const REPORT_TYPE_OPTIONS: ReportTypeOption[] = [
  {
    type: "PREDICTIVE_ANALYSIS",
    label: "Análise Preditiva",
    description:
      "Previsão de êxito com análise de riscos e recomendações estratégicas",
    iconBg: "bg-[#eff4ff]",
    iconColor: "text-[#1a4fd6]",
    Icon: BarChart3,
  },
  {
    type: "JURIMETRICS",
    label: "Jurimetria por Tribunal",
    description:
      "Estatísticas por tribunal, vara, tipo de ação e tempo médio de julgamento",
    iconBg: "bg-[#f0fdf4]",
    iconColor: "text-[#16a34a]",
    Icon: TrendingUp,
  },
  {
    type: "RELATOR_PROFILE",
    label: "Perfil de Relator",
    description:
      "Histórico de decisões do magistrado e tendências decisórias por tipo de ação",
    iconBg: "bg-[#faf5ff]",
    iconColor: "text-[#7c3aed]",
    Icon: UserCircle2,
  },
];

const TYPE_LABEL: Record<ReportType, string> = {
  PREDICTIVE_ANALYSIS: "Análise Preditiva",
  JURIMETRICS: "Jurimetria por Tribunal",
  RELATOR_PROFILE: "Perfil de Relator",
  EXECUTIVE_SUMMARY: "Resumo Executivo",
  CUSTOM: "Personalizado",
};

const STEP_SUBTITLES: Record<StepIndex, string> = {
  1: "Escolha o tipo de análise",
  2: "Configure os parâmetros",
  3: "Confirme e gere o relatório",
};

function getTitlePlaceholder(type: ReportType): string {
  const today = new Date().toLocaleDateString("pt-BR");
  switch (type) {
    case "PREDICTIVE_ANALYSIS":
      return `Ex: Análise - Ação de Cobrança ABC Ltda · ${today}`;
    case "JURIMETRICS":
      return "Ex: Jurimetria TJSP - Ações Trabalhistas 2025";
    case "RELATOR_PROFILE":
      return "Ex: Perfil Dr. José Silva - 3ª Vara Cível SP";
    default:
      return "";
  }
}

interface FormState {
  title: string;
  tipo_acao: string;
  tribunal: string;
  nome_juiz: string;
  vara_camara: string;
  argumentos: string;
}

const EMPTY_FORM: FormState = {
  title: "",
  tipo_acao: "",
  tribunal: "",
  nome_juiz: "",
  vara_camara: "",
  argumentos: "",
};

type FieldKey = keyof FormState;

export default function CreateReportModal({
  isOpen,
  onClose,
  onCreate,
  isCreating,
  balance,
}: CreateReportModalProps) {
  const [step, setStep] = useState<StepIndex>(1);
  const [selectedType, setSelectedType] = useState<ReportType>("PREDICTIVE_ANALYSIS");
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<Record<FieldKey, string>>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Reset everything when the modal closes from outside
  useEffect(() => {
    if (!isOpen) {
      setStep(1);
      setSelectedType("PREDICTIVE_ANALYSIS");
      setForm(EMPTY_FORM);
      setErrors({});
      setSubmitError(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const cost = REPORT_COSTS[selectedType];
  const balanceAfter = balance - cost;
  const canAfford = balance >= cost;

  // Has the user typed anything? Used by the dirty-close confirm.
  const isDirty =
    form.title.trim() !== "" ||
    form.tipo_acao.trim() !== "" ||
    form.tribunal.trim() !== "" ||
    form.nome_juiz.trim() !== "" ||
    form.vara_camara.trim() !== "" ||
    form.argumentos.trim() !== "";

  const handleClose = () => {
    if (
      (step === 2 || step === 3) &&
      isDirty &&
      !confirm("Tem certeza? Os dados preenchidos serão perdidos.")
    ) {
      return;
    }
    onClose();
  };

  const updateField = (key: FieldKey, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

  // Required fields per report type
  const requiredFields = (type: ReportType): FieldKey[] => {
    switch (type) {
      case "PREDICTIVE_ANALYSIS":
        return ["tipo_acao", "tribunal"];
      case "JURIMETRICS":
        return ["tipo_acao", "tribunal"];
      case "RELATOR_PROFILE":
        return ["nome_juiz", "vara_camara"];
      default:
        return [];
    }
  };

  const validateStep2 = (): boolean => {
    const required = requiredFields(selectedType);
    const next: Partial<Record<FieldKey, string>> = {};
    for (const key of required) {
      if (!form[key].trim()) {
        next[key] = "Este campo é obrigatório";
      }
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleNext = () => {
    if (step === 1) {
      if (!canAfford) return;
      setStep(2);
      return;
    }
    if (step === 2) {
      if (!validateStep2()) return;
      setStep(3);
      return;
    }
  };

  const handleBack = () => {
    if (step === 1) return;
    setStep((prev) => (prev - 1) as StepIndex);
  };

  // Build the parameters payload for the API. We use the same field IDs the
  // existing pipeline expects (tipo_acao, tribunal, argumentos, nome_juiz) so
  // downstream report generation keeps working. vara_camara is an additional
  // key the schema accepts (z.record(z.string(), z.any())).
  const buildParameters = (): Record<string, string> => {
    const trimmed = (s: string) => s.trim();
    switch (selectedType) {
      case "PREDICTIVE_ANALYSIS":
        return {
          tipo_acao: trimmed(form.tipo_acao),
          tribunal: trimmed(form.tribunal),
          argumentos: trimmed(form.argumentos),
          // Existing pipeline expects 'pedidos' too — leave empty when not collected
          pedidos: "",
        };
      case "JURIMETRICS":
        return {
          tribunal: trimmed(form.tribunal),
          tipo_acao: trimmed(form.tipo_acao),
        };
      case "RELATOR_PROFILE":
        return {
          nome_juiz: trimmed(form.nome_juiz),
          tribunal: trimmed(form.vara_camara),
          vara_camara: trimmed(form.vara_camara),
          argumentos: trimmed(form.argumentos),
        };
      default:
        return {};
    }
  };

  const handleSubmit = async () => {
    if (!canAfford) {
      setSubmitError(
        `Créditos insuficientes. Você precisa de ${cost} créditos.`
      );
      return;
    }
    setSubmitError(null);
    try {
      await onCreate({
        type: selectedType,
        title:
          form.title.trim() ||
          `${TYPE_LABEL[selectedType]} - ${new Date().toLocaleDateString("pt-BR")}`,
        parameters: buildParameters() as unknown as CreateReportInput["parameters"],
      });
      onClose();
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : "Erro ao criar relatório"
      );
    }
  };

  const showsTipoAcao =
    selectedType === "PREDICTIVE_ANALYSIS" || selectedType === "JURIMETRICS";
  const showsRelator = selectedType === "RELATOR_PROFILE";

  // Maximum number of reports of the selected type the user can afford
  const maxReports = Math.floor(balance / cost);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      style={{ backgroundColor: "rgba(15, 25, 35, 0.55)" }}
      onClick={handleClose}
    >
      <div
        className="bg-white w-full sm:w-[440px] sm:max-w-[calc(100vw-32px)] sm:max-h-[calc(100vh-32px)] overflow-y-auto rounded-t-[12px] sm:rounded-[12px]"
        style={{ padding: 28 }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Novo Relatório"
      >
        {/* HEADER */}
        <div className="flex items-start justify-between" style={{ marginBottom: 6 }}>
          <div className="min-w-0">
            <h2
              style={{
                fontSize: 17,
                fontWeight: 700,
                color: "#0f1923",
                lineHeight: 1.2,
              }}
            >
              Novo Relatório
            </h2>
            <p
              style={{
                fontSize: 12,
                color: "#9ab0c8",
                marginTop: 3,
                lineHeight: 1.3,
              }}
            >
              Passo {step} de 3 · {STEP_SUBTITLES[step]}
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Fechar"
            className="flex items-center justify-center hover:text-[#0f1923] transition-colors"
            style={{
              fontSize: 22,
              color: "#9ab0c8",
              lineHeight: 1,
              width: 32,
              height: 32,
            }}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* PROGRESS BAR */}
        <div className="flex gap-1.5" style={{ marginBottom: 24, marginTop: 14 }}>
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className="flex-1"
              style={{
                height: 4,
                borderRadius: 2,
                backgroundColor: s <= step ? "#1a4fd6" : "#e5e9ef",
              }}
            />
          ))}
        </div>

        {/* SUBMIT ERROR */}
        {submitError && (
          <div
            className="mb-4 rounded-lg flex items-start gap-2"
            style={{
              backgroundColor: "#fef2f2",
              border: "1px solid #fecaca",
              padding: "10px 14px",
            }}
          >
            <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
            <p style={{ fontSize: 12, color: "#991b1b" }}>{submitError}</p>
          </div>
        )}

        {/* ============ STEP 1 ============ */}
        {step === 1 && (
          <div>
            {REPORT_TYPE_OPTIONS.map((opt) => {
              const isSelected = selectedType === opt.type;
              const optCost = REPORT_COSTS[opt.type];
              return (
                <button
                  key={opt.type}
                  type="button"
                  onClick={() => setSelectedType(opt.type)}
                  className="w-full text-left transition-all"
                  style={{
                    border: `1.5px solid ${isSelected ? "#1a4fd6" : "#e5e9ef"}`,
                    borderRadius: 10,
                    padding: "14px 16px",
                    marginBottom: 10,
                    backgroundColor: isSelected ? "#f8faff" : "#ffffff",
                    cursor: "pointer",
                  }}
                >
                  <div className="flex items-center gap-3.5">
                    <div
                      className={`${opt.iconBg} flex items-center justify-center flex-shrink-0`}
                      style={{ width: 38, height: 38, borderRadius: 9 }}
                    >
                      <opt.Icon className={`w-5 h-5 ${opt.iconColor}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        style={{
                          fontSize: 13.5,
                          fontWeight: 600,
                          color: "#1a2435",
                          lineHeight: 1.25,
                        }}
                      >
                        {opt.label}
                      </p>
                      <p
                        style={{
                          fontSize: 12,
                          color: "#7a9ab8",
                          lineHeight: 1.35,
                          marginTop: 2,
                        }}
                      >
                        {opt.description}
                      </p>
                    </div>
                    <span
                      className="flex-shrink-0"
                      style={{
                        backgroundColor: isSelected ? "#1a4fd6" : "#eff4ff",
                        color: isSelected ? "#ffffff" : "#1a4fd6",
                        fontSize: 12,
                        fontWeight: 700,
                        padding: "4px 10px",
                        borderRadius: 20,
                      }}
                    >
                      {optCost} créditos
                    </span>
                  </div>
                </button>
              );
            })}

            {/* Info banner — credits available vs cost */}
            {canAfford ? (
              <div
                className="flex items-start gap-2"
                style={{
                  backgroundColor: "#eff4ff",
                  borderRadius: 8,
                  padding: "10px 14px",
                  marginTop: 4,
                }}
              >
                <Lightbulb
                  className="w-4 h-4 flex-shrink-0 mt-0.5"
                  style={{ color: "#1e40af" }}
                />
                <p style={{ fontSize: 12, color: "#1e40af", lineHeight: 1.45 }}>
                  Você tem <strong>{balance}</strong> créditos · suficiente para{" "}
                  <strong>{maxReports}</strong> relatórios do tipo selecionado
                </p>
              </div>
            ) : (
              <div
                className="flex items-start gap-2"
                style={{
                  backgroundColor: "#fff7ed",
                  borderRadius: 8,
                  padding: "10px 14px",
                  marginTop: 4,
                }}
              >
                <AlertTriangle
                  className="w-4 h-4 flex-shrink-0 mt-0.5"
                  style={{ color: "#92400e" }}
                />
                <p style={{ fontSize: 12, color: "#92400e", lineHeight: 1.45 }}>
                  Créditos insuficientes para este tipo. Você tem{" "}
                  <strong>{balance}</strong> créditos e este relatório custa{" "}
                  <strong>{cost}</strong>.
                </p>
              </div>
            )}
          </div>
        )}

        {/* ============ STEP 2 ============ */}
        {step === 2 && (
          <div>
            {/* Real-time cost banner */}
            <div
              className="flex items-center justify-between"
              style={{
                backgroundColor: "#f0fdf4",
                border: "1px solid #bbf7d0",
                borderRadius: 8,
                padding: "10px 14px",
                marginBottom: 16,
              }}
            >
              <span style={{ fontSize: 13, color: "#166534" }}>
                Custo estimado: {TYPE_LABEL[selectedType]}
              </span>
              <div className="text-right">
                <div
                  style={{
                    fontSize: 15,
                    fontWeight: 700,
                    color: "#166534",
                    lineHeight: 1.1,
                  }}
                >
                  {cost} créditos
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: "#16a34a",
                    marginTop: 2,
                  }}
                >
                  Saldo após geração: {balanceAfter} créditos
                </div>
              </div>
            </div>

            {/* Field — Title (optional) */}
            <Field
              label="Título"
              optionalText="(opcional)"
              error={errors.title}
            >
              <input
                type="text"
                value={form.title}
                onChange={(e) => updateField("title", e.target.value)}
                placeholder={getTitlePlaceholder(selectedType)}
                className="w-full"
                style={inputStyle(false)}
              />
            </Field>

            {/* Tipo de Ação — required for Predictive + Jurimetrics */}
            {showsTipoAcao && (
              <Field
                label="Tipo de Ação"
                required
                error={errors.tipo_acao}
                hint="Seja específico para uma análise mais precisa"
              >
                <input
                  type="text"
                  value={form.tipo_acao}
                  onChange={(e) => updateField("tipo_acao", e.target.value)}
                  placeholder="Ex: Ação de Cobrança, Trabalhista, Indenizatória por Danos Morais"
                  className="w-full"
                  style={inputStyle(!!errors.tipo_acao)}
                />
              </Field>
            )}

            {/* Tribunal — required for Predictive + Jurimetrics */}
            {showsTipoAcao && (
              <Field
                label="Tribunal"
                required
                error={errors.tribunal}
              >
                <input
                  type="text"
                  value={form.tribunal}
                  onChange={(e) => updateField("tribunal", e.target.value)}
                  placeholder="Ex: TJSP, TRT2, STJ, TJMG"
                  className="w-full"
                  style={inputStyle(!!errors.tribunal)}
                />
              </Field>
            )}

            {/* Relator-specific fields */}
            {showsRelator && (
              <>
                <Field
                  label="Nome do Relator"
                  required
                  error={errors.nome_juiz}
                >
                  <input
                    type="text"
                    value={form.nome_juiz}
                    onChange={(e) => updateField("nome_juiz", e.target.value)}
                    placeholder="Ex: Dr. João Carlos Saletti"
                    className="w-full"
                    style={inputStyle(!!errors.nome_juiz)}
                  />
                </Field>
                <Field
                  label="Vara / Câmara"
                  required
                  error={errors.vara_camara}
                >
                  <input
                    type="text"
                    value={form.vara_camara}
                    onChange={(e) => updateField("vara_camara", e.target.value)}
                    placeholder="Ex: 15ª Câmara de Direito Privado do TJSP"
                    className="w-full"
                    style={inputStyle(!!errors.vara_camara)}
                  />
                </Field>
              </>
            )}

            {/* Argumentos — optional for everyone */}
            <Field
              label="Argumentos e Contexto"
              optionalText="(opcional, mas recomendado)"
              hint="Este campo não é obrigatório, mas melhora significativamente a precisão da análise."
            >
              <textarea
                value={form.argumentos}
                onChange={(e) => updateField("argumentos", e.target.value)}
                placeholder="Descreva brevemente os argumentos principais e contexto do caso. Quanto mais detalhes, mais precisa será a análise."
                rows={3}
                className="w-full"
                style={{ ...inputStyle(false), resize: "none" }}
              />
            </Field>
          </div>
        )}

        {/* ============ STEP 3 ============ */}
        {step === 3 && (
          <div className="text-center">
            <div
              className="flex items-center justify-center mx-auto"
              style={{ marginBottom: 16 }}
            >
              <CheckCircle2
                className="text-emerald-500"
                style={{ width: 48, height: 48 }}
              />
            </div>
            <h3
              style={{
                fontSize: 16,
                fontWeight: 700,
                color: "#1a2435",
                marginBottom: 8,
              }}
            >
              Tudo pronto para gerar!
            </h3>
            <p
              style={{
                fontSize: 13,
                color: "#7a9ab8",
                marginBottom: 20,
                lineHeight: 1.5,
              }}
            >
              Confirme os dados abaixo antes de gerar. Os créditos serão
              descontados apenas após a geração.
            </p>

            {/* Summary card */}
            <div
              className="text-left"
              style={{
                backgroundColor: "#f5f7fa",
                borderRadius: 10,
                padding: "16px 18px",
              }}
            >
              <SummaryRow label="Tipo" value={TYPE_LABEL[selectedType]} />
              <SummaryRow
                label="Tribunal"
                value={
                  showsRelator
                    ? form.vara_camara || "—"
                    : form.tribunal || "—"
                }
              />
              <SummaryRow
                label={showsRelator ? "Relator" : "Tipo de Ação"}
                value={
                  showsRelator
                    ? form.nome_juiz || "—"
                    : form.tipo_acao || "—"
                }
              />
              <SummaryRow
                label="Custo"
                value={`${cost} créditos`}
                valueStyle={{ fontWeight: 700, color: "#1a4fd6" }}
              />
              <SummaryRow label="Saldo atual" value={`${balance} créditos`} />
              <SummaryRow
                label="Saldo após geração"
                value={`${balanceAfter} créditos`}
                valueStyle={
                  balanceAfter < 5 ? { color: "#e74c3c", fontWeight: 600 } : undefined
                }
                isLast
              />
            </div>

            {/* Low balance warning */}
            {balanceAfter < 5 && balanceAfter >= 0 && (
              <div
                className="text-left flex items-start gap-2"
                style={{
                  backgroundColor: "#fff7ed",
                  border: "1px solid #fed7aa",
                  borderRadius: 8,
                  padding: "10px 14px",
                  marginTop: 12,
                  fontSize: 12,
                  color: "#92400e",
                }}
              >
                <AlertTriangle
                  className="w-4 h-4 flex-shrink-0 mt-0.5"
                  style={{ color: "#92400e" }}
                />
                <span>
                  Após gerar este relatório você terá poucos créditos. Considere
                  comprar um pacote.
                </span>
              </div>
            )}
          </div>
        )}

        {/* FOOTER */}
        <div
          className="flex items-center justify-between"
          style={{
            marginTop: 24,
            paddingTop: 16,
            borderTop: "1px solid #e5e9ef",
          }}
        >
          <button
            type="button"
            onClick={step === 1 ? handleClose : handleBack}
            disabled={isCreating}
            className="hover:bg-gray-50 disabled:opacity-50 transition-colors"
            style={{
              backgroundColor: "transparent",
              border: "1px solid #e5e9ef",
              color: "#4a5568",
              padding: "9px 16px",
              borderRadius: 8,
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            {step === 1 ? "Cancelar" : "← Voltar"}
          </button>

          {step < 3 ? (
            <button
              type="button"
              onClick={handleNext}
              disabled={step === 1 && !canAfford}
              className="hover:bg-[#1640b8] disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              style={{
                backgroundColor: "#1a4fd6",
                color: "#ffffff",
                padding: "9px 18px",
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Próximo →
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isCreating || !canAfford}
              className="hover:bg-[#1640b8] disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              style={{
                backgroundColor: "#1a4fd6",
                color: "#ffffff",
                padding: "9px 18px",
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              {isCreating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Gerando...
                </>
              ) : (
                "✓ Gerar Relatório"
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ============ helpers ============ */

function inputStyle(hasError: boolean): React.CSSProperties {
  return {
    fontSize: 13,
    padding: "9px 12px",
    border: `1px solid ${hasError ? "#e74c3c" : "#e5e9ef"}`,
    borderRadius: 8,
    backgroundColor: "#ffffff",
    color: "#1a2435",
    outline: "none",
  };
}

interface FieldProps {
  label: string;
  required?: boolean;
  optionalText?: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}

function Field({ label, required, optionalText, hint, error, children }: FieldProps) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label className="flex items-baseline gap-1.5" style={{ marginBottom: 5 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: "#4a5568" }}>
          {label}
        </span>
        {required && (
          <span style={{ color: "#e74c3c", fontWeight: 700 }} aria-hidden="true">
            *
          </span>
        )}
        {optionalText && (
          <span style={{ fontSize: 11, fontWeight: 400, color: "#9ab0c8" }}>
            {optionalText}
          </span>
        )}
      </label>
      {children}
      {error ? (
        <p style={{ fontSize: 11, color: "#e74c3c", marginTop: 4 }}>{error}</p>
      ) : hint ? (
        <p style={{ fontSize: 11, color: "#9ab0c8", marginTop: 4, lineHeight: 1.4 }}>
          {hint}
        </p>
      ) : null}
    </div>
  );
}

interface SummaryRowProps {
  label: string;
  value: string;
  valueStyle?: React.CSSProperties;
  isLast?: boolean;
}

function SummaryRow({ label, value, valueStyle, isLast }: SummaryRowProps) {
  return (
    <div
      className="flex items-baseline justify-between gap-3"
      style={{
        fontSize: 13,
        color: "#4a5568",
        paddingBottom: isLast ? 0 : 8,
        marginBottom: isLast ? 0 : 8,
        borderBottom: isLast ? "none" : "1px solid #e5e9ef",
      }}
    >
      <span>{label}</span>
      <span style={{ color: "#1a2435", fontWeight: 500, ...valueStyle }}>
        {value}
      </span>
    </div>
  );
}
