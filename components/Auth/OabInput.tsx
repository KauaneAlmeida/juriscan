"use client";

import { useState, useRef, useCallback } from "react";
import { Loader2, CheckCircle, AlertCircle, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils/cn";

const UFS = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA",
  "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN",
  "RS", "RO", "RR", "SC", "SP", "SE", "TO",
] as const;

type VerifyStatus = "idle" | "loading" | "valid" | "error";

interface OabInputProps {
  onValidOab: (oabCompact: string | null) => void;
  error?: string;
  disabled?: boolean;
  currentUserId?: string;
}

export default function OabInput({ onValidOab, error: externalError, disabled, currentUserId }: OabInputProps) {
  const [uf, setUf] = useState("");
  const [numero, setNumero] = useState("");
  const [status, setStatus] = useState<VerifyStatus>("idle");
  const [message, setMessage] = useState("");
  const [seccional, setSeccional] = useState("");
  const [ufFocused, setUfFocused] = useState(false);
  const [numFocused, setNumFocused] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const requestIdRef = useRef(0);
  const lastVerifiedRef = useRef<string>("");
  // Ref to always access latest callback without triggering re-renders
  const onValidOabRef = useRef(onValidOab);
  onValidOabRef.current = onValidOab;

  const verify = useCallback(async (oabString: string) => {
    // Skip if already verified this exact value
    if (oabString === lastVerifiedRef.current) return;
    lastVerifiedRef.current = oabString;

    // Increment request ID to invalidate previous in-flight requests
    const currentRequestId = ++requestIdRef.current;

    setStatus("loading");
    setMessage("");
    setSeccional("");

    try {
      const res = await fetch("/api/auth/verify-oab", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ oab: oabString, currentUserId }),
      });

      const json = await res.json();

      // Ignore stale responses
      if (requestIdRef.current !== currentRequestId) return;

      if (!res.ok) {
        setStatus("error");
        setMessage(json.error?.message || "Número de OAB inválido");
        onValidOabRef.current(null);
        return;
      }

      if (json.data?.valid) {
        setStatus("valid");
        setMessage(json.data.formatted);
        // Mostrar nome do advogado confirmado pelo CNA
        const nomeInfo = json.data.nomeAdvogado
          ? `${json.data.nomeAdvogado} — ${json.data.seccional}`
          : json.data.seccional;
        setSeccional(nomeInfo);
        onValidOabRef.current(json.data.compacto);
      } else {
        setStatus("error");
        setMessage(json.data?.error || "OAB inválida");
        onValidOabRef.current(null);
      }
    } catch {
      // Ignore stale responses
      if (requestIdRef.current !== currentRequestId) return;
      setStatus("error");
      setMessage("Não foi possível verificar a OAB. Tente novamente.");
      onValidOabRef.current(null);
    }
  }, [currentUserId]);

  // Debounce via onChange handlers — no useEffect
  const scheduleVerification = useCallback((currentUf: string, currentNumber: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!currentUf || !currentNumber || currentNumber.length < 3) {
      setStatus("idle");
      setMessage("");
      setSeccional("");
      onValidOabRef.current(null);
      return;
    }

    const oabString = `${currentUf}${currentNumber}`;
    debounceRef.current = setTimeout(() => verify(oabString), 1200);
  }, [verify]);

  const handleUfChange = (newUf: string) => {
    setUf(newUf);
    lastVerifiedRef.current = ""; // Reset to allow re-verification
    scheduleVerification(newUf, numero);
  };

  const handleNumberChange = (value: string) => {
    const val = value.replace(/\D/g, "").slice(0, 7);
    setNumero(val);
    lastVerifiedRef.current = ""; // Reset to allow re-verification
    scheduleVerification(uf, val);
  };

  const displayError = externalError || (status === "error" ? message : "");
  const borderColor = displayError
    ? "border-red-300 focus-within:border-red-500"
    : status === "valid"
      ? "border-green-300 focus-within:border-green-500"
      : "border-gray-200 focus-within:border-blue-500";

  return (
    <div>
      {/* Label */}
      <label className="block text-sm font-medium text-gray-500 mb-1.5 ml-1">
        Número da OAB
      </label>

      {/* Two separate fields side by side */}
      <div className="flex gap-2">
        {/* UF Select */}
        <div
          className={cn(
            "relative w-24 flex-shrink-0 rounded-xl border-2 transition-all duration-300",
            "bg-gray-50 hover:bg-gray-100/50",
            ufFocused && "bg-white ring-4 ring-blue-500/10",
            borderColor
          )}
        >
          <select
            value={uf}
            onChange={(e) => handleUfChange(e.target.value)}
            onFocus={() => setUfFocused(true)}
            onBlur={() => setUfFocused(false)}
            disabled={disabled}
            className={cn(
              "w-full h-14 bg-transparent outline-none pl-4 pr-8 text-base appearance-none cursor-pointer",
              uf ? "text-gray-900" : "text-gray-400"
            )}
            aria-label="Estado da OAB"
          >
            <option value="">UF</option>
            {UFS.map((state) => (
              <option key={state} value={state}>{state}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>

        {/* Number Input */}
        <div
          className={cn(
            "relative flex-1 flex items-center rounded-xl border-2 transition-all duration-300",
            "bg-gray-50 hover:bg-gray-100/50",
            numFocused && "bg-white ring-4 ring-blue-500/10",
            borderColor
          )}
        >
          <input
            type="text"
            inputMode="numeric"
            value={numero}
            onChange={(e) => handleNumberChange(e.target.value)}
            onFocus={() => setNumFocused(true)}
            onBlur={() => setNumFocused(false)}
            placeholder="123456"
            disabled={disabled}
            className="w-full h-14 bg-transparent outline-none px-4 text-base text-gray-900 placeholder-gray-400"
            aria-label="Número da OAB"
          />

          {/* Status indicator */}
          {status !== "idle" && (
            <span className="absolute right-4">
              {status === "loading" && <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />}
              {status === "valid" && <CheckCircle className="w-5 h-5 text-green-500" />}
              {status === "error" && <AlertCircle className="w-5 h-5 text-red-500" />}
            </span>
          )}
        </div>
      </div>

      {/* Error message */}
      {displayError && (
        <p className="mt-2 text-sm text-red-500 flex items-center gap-1 animate-fade-in">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {displayError}
        </p>
      )}

      {/* Success info */}
      {status === "valid" && seccional && (
        <p className="mt-2 text-sm text-green-600 flex items-center gap-1 animate-fade-in">
          <CheckCircle className="w-4 h-4 flex-shrink-0" />
          {seccional}
        </p>
      )}
    </div>
  );
}
