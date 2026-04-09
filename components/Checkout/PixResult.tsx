"use client";

import { useState, useEffect, useRef } from "react";
import { Copy, Check, Clock } from "lucide-react";
import QRCode from "qrcode";

interface PixResultProps {
  qrCode: string;
  qrCodeUrl?: string;
  expiresAt: string;
  onPaymentConfirmed?: () => void;
  mode?: "subscription" | "credits";
  initialBalance?: number;
}

export default function PixResult({
  qrCode,
  expiresAt,
  onPaymentConfirmed,
  mode = "subscription",
  initialBalance,
}: PixResultProps) {
  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState("");
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const confirmedRef = useRef(false);

  // Generate QR code locally from the PIX text
  useEffect(() => {
    if (!qrCode) return;
    QRCode.toDataURL(qrCode, { width: 256, margin: 2 })
      .then(setQrDataUrl)
      .catch(() => setQrDataUrl(null));
  }, [qrCode]);

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const expiry = new Date(expiresAt).getTime();
      const diff = expiry - now;

      if (diff <= 0) {
        setTimeLeft("Expirado");
        clearInterval(timer);
        return;
      }

      const minutes = Math.floor(diff / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${minutes}:${seconds.toString().padStart(2, "0")}`);
    }, 1000);

    return () => clearInterval(timer);
  }, [expiresAt]);

  // Listen for payment confirmation via polling
  useEffect(() => {
    if (!onPaymentConfirmed) return;

    const pollTimer = setInterval(async () => {
      if (confirmedRef.current) return;

      try {
        const res = await fetch("/api/credits");
        if (!res.ok) return;

        const data = await res.json();

        if (mode === "credits") {
          // For credit purchases, check if balance increased
          const currentBalance = data.data?.balance ?? data.data?.credits ?? 0;
          if (initialBalance !== undefined && currentBalance > initialBalance) {
            confirmedRef.current = true;
            onPaymentConfirmed();
            clearInterval(pollTimer);
          }
        } else {
          // For subscriptions, check if subscription is active
          if (data.data?.subscription?.status === "active") {
            confirmedRef.current = true;
            onPaymentConfirmed();
            clearInterval(pollTimer);
          }
        }
      } catch {
        // Ignore polling errors
      }
    }, 5000);

    return () => clearInterval(pollTimer);
  }, [onPaymentConfirmed, mode, initialBalance]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(qrCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="text-center space-y-4">
      <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-yellow-50 text-yellow-700 rounded-lg text-sm">
        <Clock className="w-4 h-4" />
        <span>Expira em {timeLeft}</span>
      </div>

      <div className="flex justify-center">
        {qrDataUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={qrDataUrl}
            alt="QR Code PIX"
            className="w-48 h-48 rounded-lg border border-gray-200"
          />
        ) : (
          <div className="w-48 h-48 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 text-sm">
            Gerando QR Code...
          </div>
        )}
      </div>

      <div>
        <p className="text-sm text-gray-500 mb-2">Ou copie o código PIX:</p>
        <div className="flex items-center gap-2">
          <input
            type="text"
            readOnly
            value={qrCode}
            className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-600 truncate"
          />
          <button
            onClick={handleCopy}
            className="px-3 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors flex items-center gap-1.5 text-sm"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4" />
                Copiado
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                Copiar
              </>
            )}
          </button>
        </div>
      </div>

      <p className="text-xs text-gray-400">
        Abra o app do seu banco e escaneie o QR Code ou cole o código PIX
      </p>
    </div>
  );
}
