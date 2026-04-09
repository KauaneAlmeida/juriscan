"use client";

import { useState } from "react";
import { CreditCard } from "lucide-react";

interface CardFormProps {
  onCardDataChange: (data: {
    number: string;
    holderName: string;
    expMonth: string;
    expYear: string;
    cvv: string;
  }) => void;
}

function formatCardNumber(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 16);
  return digits.replace(/(\d{4})(?=\d)/g, "$1 ");
}

function formatExpiry(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 4);
  if (digits.length >= 3) {
    return digits.slice(0, 2) + "/" + digits.slice(2);
  }
  return digits;
}

export default function CardForm({ onCardDataChange }: CardFormProps) {
  const [number, setNumber] = useState("");
  const [holderName, setHolderName] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");

  const updateParent = (
    field: string,
    value: string,
    currentState: Record<string, string>
  ) => {
    const updated = { ...currentState, [field]: value };
    const digits = updated.number.replace(/\D/g, "");
    const expiryParts = updated.expiry.split("/");
    onCardDataChange({
      number: digits,
      holderName: updated.holderName,
      expMonth: expiryParts[0] || "",
      expYear: expiryParts[1] || "",
      cvv: updated.cvv,
    });
  };

  const state = { number, holderName, expiry, cvv };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Número do cartão
        </label>
        <div className="relative">
          <input
            type="text"
            inputMode="numeric"
            placeholder="0000 0000 0000 0000"
            value={number}
            onChange={(e) => {
              const formatted = formatCardNumber(e.target.value);
              setNumber(formatted);
              updateParent("number", formatted, state);
            }}
            className="w-full px-4 py-2.5 pr-10 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
          <CreditCard className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Nome no cartão
        </label>
        <input
          type="text"
          placeholder="Nome como está no cartão"
          value={holderName}
          onChange={(e) => {
            setHolderName(e.target.value);
            updateParent("holderName", e.target.value, state);
          }}
          className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Validade
          </label>
          <input
            type="text"
            inputMode="numeric"
            placeholder="MM/AA"
            value={expiry}
            onChange={(e) => {
              const formatted = formatExpiry(e.target.value);
              setExpiry(formatted);
              updateParent("expiry", formatted, state);
            }}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            CVV
          </label>
          <input
            type="text"
            inputMode="numeric"
            placeholder="000"
            maxLength={4}
            value={cvv}
            onChange={(e) => {
              const val = e.target.value.replace(/\D/g, "").slice(0, 4);
              setCvv(val);
              updateParent("cvv", val, state);
            }}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>
      </div>
    </div>
  );
}
