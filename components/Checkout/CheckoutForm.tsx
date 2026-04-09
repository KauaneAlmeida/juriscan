"use client";

import { useState } from "react";
import { CreditCard, QrCode, FileBarChart, Loader2, AlertCircle } from "lucide-react";
import CardForm from "./CardForm";
import PixResult from "./PixResult";
import BoletoResult from "./BoletoResult";
import type { PaymentMethod } from "@/lib/pagarme/types";

interface CheckoutFormProps {
  mode: "subscription" | "credits";
  planId?: string;
  creditPackageId?: string;
  onSuccess: () => void | Promise<void>;
  onError: (message: string) => void;
}

const ALL_PAYMENT_METHODS: Array<{
  id: PaymentMethod;
  label: string;
  icon: typeof CreditCard;
  subscriptionOnly?: boolean;
  creditsOnly?: boolean;
}> = [
  { id: "credit_card", label: "Cartão", icon: CreditCard },
  { id: "pix", label: "PIX", icon: QrCode, creditsOnly: true },
  { id: "boleto", label: "Boleto", icon: FileBarChart },
];

const PAGARME_TOKEN_URL = "https://api.pagar.me/core/v5/tokens";

export default function CheckoutForm({
  mode,
  planId,
  creditPackageId,
  onSuccess,
  onError,
}: CheckoutFormProps) {
  // PIX is only available for one-time credit purchases (Pagar.me V5 limitation)
  const availablePaymentMethods = ALL_PAYMENT_METHODS.filter((m) => {
    if (mode === "subscription" && m.creditsOnly) return false;
    if (mode === "credits" && m.subscriptionOnly) return false;
    return true;
  });

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("credit_card");
  const [document, setDocument] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [phone, setPhone] = useState("");
  const [cardData, setCardData] = useState({
    number: "",
    holderName: "",
    expMonth: "",
    expYear: "",
    cvv: "",
  });

  // Billing address (required by Pagar.me for credit card)
  const [cep, setCep] = useState("");
  const [addressNumber, setAddressNumber] = useState("");
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");
  const [addressState, setAddressState] = useState("");

  // Balance snapshot before payment (for credit purchase polling)
  const [balanceBeforePayment, setBalanceBeforePayment] = useState<number | undefined>(undefined);

  // Async payment result states
  const [pixData, setPixData] = useState<{
    qr_code: string;
    qr_code_url: string;
    expires_at: string;
  } | null>(null);
  const [boletoData, setBoletoData] = useState<{
    barcode: string;
    line: string;
    pdf: string;
    due_at: string;
  } | null>(null);

  const formatPhone = (value: string): string => {
    const digits = value.replace(/\D/g, "").slice(0, 11);
    if (digits.length <= 2) return digits;
    if (digits.length <= 7)
      return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  };

  const formatDocument = (value: string): string => {
    const digits = value.replace(/\D/g, "").slice(0, 14);
    if (digits.length <= 11) {
      return digits
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
    }
    return digits
      .replace(/(\d{2})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1/$2")
      .replace(/(\d{4})(\d{1,2})$/, "$1-$2");
  };

  const formatCep = (value: string): string => {
    const digits = value.replace(/\D/g, "").slice(0, 8);
    if (digits.length > 5) return `${digits.slice(0, 5)}-${digits.slice(5)}`;
    return digits;
  };

  const handleCepChange = async (value: string) => {
    const formatted = formatCep(value);
    setCep(formatted);
    const digits = formatted.replace(/\D/g, "");
    if (digits.length === 8) {
      try {
        const res = await fetch(`/api/cep/${digits}`);
        const data = await res.json();
        if (!data.erro) {
          setStreet(data.logradouro || "");
          setCity(data.localidade || "");
          setAddressState(data.uf || "");
        }
      } catch (e) {
        console.error("[Checkout] ViaCEP error:", e);
      }
    }
  };

  const showError = (message: string) => {
    setFormError(message);
    onError(message);
  };

  const tokenizeCard = async (): Promise<string> => {
    const publicKey = process.env.NEXT_PUBLIC_PAGARME_PUBLIC_KEY;
    if (!publicKey) {
      throw new Error("Chave pública do Pagar.me não configurada. Verifique NEXT_PUBLIC_PAGARME_PUBLIC_KEY.");
    }

    console.log("[Checkout] Tokenizing card...", {
      hasNumber: !!cardData.number,
      numberLength: cardData.number.length,
      hasHolder: !!cardData.holderName,
      expMonth: cardData.expMonth,
      expYear: cardData.expYear,
      hasCvv: !!cardData.cvv,
    });

    // Validate card data before sending
    if (!cardData.number || cardData.number.length < 13) {
      throw new Error("Número do cartão inválido");
    }
    if (!cardData.holderName) {
      throw new Error("Nome no cartão é obrigatório");
    }
    if (!cardData.expMonth || !cardData.expYear) {
      throw new Error("Data de validade inválida");
    }
    if (!cardData.cvv || cardData.cvv.length < 3) {
      throw new Error("CVV inválido");
    }

    const tokenPayload = {
      type: "card",
      card: {
        number: cardData.number,
        holder_name: cardData.holderName,
        exp_month: parseInt(cardData.expMonth),
        exp_year: parseInt("20" + cardData.expYear),
        cvv: cardData.cvv,
      },
    };

    console.log("[Checkout] Token request payload:", {
      ...tokenPayload,
      card: { ...tokenPayload.card, number: "****" + cardData.number.slice(-4), cvv: "***" },
    });

    let response: Response;
    try {
      response = await fetch(`${PAGARME_TOKEN_URL}?appId=${publicKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(tokenPayload),
      });
    } catch (fetchError) {
      console.error("[Checkout] Token fetch failed:", fetchError);
      throw new Error("Erro de conexão ao processar cartão. Verifique sua internet.");
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[Checkout] Token API error:", response.status, errorText);
      try {
        const errorJson = JSON.parse(errorText);
        const msg = errorJson.message || errorJson.errors?.[0]?.message || "Dados do cartão recusados";
        throw new Error(`Erro no cartão: ${msg}`);
      } catch (parseErr) {
        if (parseErr instanceof Error && parseErr.message.startsWith("Erro no cartão:")) throw parseErr;
        throw new Error(`Erro ao processar cartão (${response.status})`);
      }
    }

    const data = await response.json();
    console.log("[Checkout] Token created:", data.id ? "OK" : "MISSING ID", { keys: Object.keys(data) });

    if (!data.id) {
      throw new Error("Token do cartão não foi gerado. Verifique os dados.");
    }

    return data.id;
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    setFormError(null);
    setPixData(null);
    setBoletoData(null);

    try {
      const rawDocument = document.replace(/\D/g, "");
      if (rawDocument.length < 11) {
        showError("CPF/CNPJ inválido");
        return;
      }

      const rawPhone = phone.replace(/\D/g, "");
      if (rawPhone.length < 10) {
        showError("Telefone celular é obrigatório");
        return;
      }

      // Capture current balance before payment (for credit purchase PIX polling)
      if (mode === "credits" && paymentMethod !== "credit_card") {
        try {
          const balanceRes = await fetch("/api/credits");
          if (balanceRes.ok) {
            const balanceData = await balanceRes.json();
            setBalanceBeforePayment(balanceData.data?.balance ?? balanceData.data?.credits ?? 0);
          }
        } catch {
          // Non-fatal, polling will still work but may not detect the first change
        }
      }

      // Validate billing address for credit card
      if (paymentMethod === "credit_card") {
        const rawCep = cep.replace(/\D/g, "");
        if (rawCep.length !== 8) {
          showError("CEP inválido");
          return;
        }
        if (!addressNumber.trim()) {
          showError("Número do endereço é obrigatório");
          return;
        }
        if (!street.trim()) {
          showError("Rua é obrigatória");
          return;
        }
        if (!city.trim()) {
          showError("Cidade é obrigatória");
          return;
        }
        if (!addressState.trim() || addressState.trim().length !== 2) {
          showError("Estado inválido (use 2 letras, ex: SP)");
          return;
        }
      }

      let cardToken: string | undefined;
      if (paymentMethod === "credit_card") {
        cardToken = await tokenizeCard();
      }

      const endpoint =
        mode === "subscription"
          ? "/api/pagarme/subscribe"
          : "/api/pagarme/purchase-credits";

      const body: Record<string, unknown> = {
        paymentMethod,
        document: rawDocument,
        documentType: rawDocument.length <= 11 ? "CPF" : "CNPJ",
      };

      if (cardToken) body.cardToken = cardToken;
      if (rawPhone) body.phone = rawPhone;
      if (mode === "subscription") body.planId = planId;
      if (mode === "credits") body.creditPackageId = creditPackageId;
      if (paymentMethod === "credit_card") {
        body.billingAddress = {
          line_1: `${street}, ${addressNumber}`,
          zip_code: cep.replace(/\D/g, ""),
          city,
          state: addressState.toUpperCase(),
          country: "BR",
        };
      }

      console.log("[Checkout] Sending to", endpoint, { ...body, cardToken: cardToken ? "token_***" : undefined });

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        let errorMessage = "Erro no pagamento";
        try {
          const errorData = await response.json();
          errorMessage = errorData.error?.message || errorData.message || errorMessage;
        } catch {
          const text = await response.text().catch(() => "");
          console.error("[Checkout] Non-JSON error response:", response.status, text);
          errorMessage = `Erro do servidor (${response.status})`;
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      const data = result.data;

      console.log("[Checkout] Response:", {
        status: data.status,
        chargeStatus: data.chargeStatus,
        isPaid: data.isPaid,
        hasPix: !!data.pix,
        hasBoleto: !!data.boleto,
      });

      if (data.pix) {
        setPixData(data.pix);
      } else if (data.boleto) {
        setBoletoData(data.boleto);
      } else if (data.isPaid) {
        await onSuccess();
      } else {
        // Payment was NOT confirmed (e.g. card declined, insufficient funds)
        throw new Error(
          "Pagamento não foi aprovado. Verifique os dados do cartão e o limite disponível."
        );
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro inesperado";
      console.error("[Checkout] Error:", message);
      showError(message);
    } finally {
      setIsLoading(false);
    }
  };

  // Show async payment results
  if (pixData) {
    return (
      <PixResult
        qrCode={pixData.qr_code}
        qrCodeUrl={pixData.qr_code_url}
        expiresAt={pixData.expires_at}
        onPaymentConfirmed={onSuccess}
        mode={mode}
        initialBalance={balanceBeforePayment}
      />
    );
  }

  if (boletoData) {
    return (
      <BoletoResult
        barcode={boletoData.barcode}
        line={boletoData.line}
        pdfUrl={boletoData.pdf}
        dueAt={boletoData.due_at}
      />
    );
  }

  return (
    <div className="space-y-5">
      {/* Inline error display */}
      {formError && (
        <div className="flex items-start gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
          <p className="text-sm text-red-700">{formError}</p>
        </div>
      )}

      {/* Payment method tabs */}
      <div className="flex gap-2">
        {availablePaymentMethods.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => { setPaymentMethod(id); setFormError(null); }}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 text-sm font-medium rounded-lg border transition-colors ${
              paymentMethod === id
                ? "border-primary bg-primary/5 text-primary"
                : "border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* CPF/CNPJ */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          CPF/CNPJ
        </label>
        <input
          type="text"
          inputMode="numeric"
          placeholder="000.000.000-00"
          value={document}
          onChange={(e) => setDocument(formatDocument(e.target.value))}
          className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
        />
      </div>

      {/* Phone (required by Pagar.me for all payment methods) */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Telefone celular
        </label>
        <input
          type="text"
          inputMode="tel"
          placeholder="(11) 99999-9999"
          value={phone}
          onChange={(e) => setPhone(formatPhone(e.target.value))}
          className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
        />
      </div>

      {/* Card form (only for credit card) */}
      {paymentMethod === "credit_card" && (
        <>
          <CardForm onCardDataChange={setCardData} />

          {/* Billing address */}
          <div className="space-y-3 pt-4 border-t border-gray-100">
            <p className="text-sm font-medium text-gray-700">Endereço de cobrança</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">CEP</label>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="00000-000"
                  value={cep}
                  onChange={(e) => handleCepChange(e.target.value)}
                  maxLength={9}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Número</label>
                <input
                  type="text"
                  placeholder="123"
                  value={addressNumber}
                  onChange={(e) => setAddressNumber(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Rua</label>
              <input
                type="text"
                placeholder="Preenchido pelo CEP"
                value={street}
                onChange={(e) => setStreet(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Cidade</label>
                <input
                  type="text"
                  placeholder="Preenchido pelo CEP"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Estado</label>
                <input
                  type="text"
                  placeholder="SP"
                  value={addressState}
                  onChange={(e) => setAddressState(e.target.value.replace(/[^a-zA-Z]/g, "").slice(0, 2).toUpperCase())}
                  maxLength={2}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
            </div>
          </div>
        </>
      )}

      {/* PIX / Boleto info */}
      {paymentMethod === "pix" && (
        <div className="bg-blue-50 rounded-lg p-4 text-sm text-blue-700">
          Após confirmar, você receberá um QR Code PIX para pagamento imediato.
        </div>
      )}
      {paymentMethod === "boleto" && (
        <div className="bg-yellow-50 rounded-lg p-4 text-sm text-yellow-700">
          O boleto será gerado com vencimento em 3 dias úteis. A ativação ocorre após a confirmação do pagamento.
        </div>
      )}

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={isLoading}
        className="w-full px-6 py-3 bg-primary text-white font-medium rounded-lg hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Processando...
          </>
        ) : (
          "Confirmar pagamento"
        )}
      </button>
    </div>
  );
}
