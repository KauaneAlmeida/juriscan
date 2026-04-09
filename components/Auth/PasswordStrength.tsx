"use client";

import { useMemo } from "react";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { PASSWORD_RULES } from "@/lib/validation/password";

interface PasswordStrengthProps {
  password: string;
}

const requirements = PASSWORD_RULES;

export default function PasswordStrength({ password }: PasswordStrengthProps) {
  const strength = useMemo(() => {
    if (!password) return { score: 0, label: "", color: "bg-gray-200" };

    const passed = requirements.filter((req) => req.test(password)).length;
    const score = (passed / requirements.length) * 100;

    if (score <= 25) return { score, label: "Fraca", color: "bg-red-500" };
    if (score <= 50) return { score, label: "Media", color: "bg-orange-500" };
    if (score <= 75) return { score, label: "Boa", color: "bg-yellow-500" };
    return { score, label: "Forte", color: "bg-green-500" };
  }, [password]);

  const passedRequirements = useMemo(
    () => requirements.map((req) => ({ ...req, passed: req.test(password) })),
    [password]
  );

  if (!password) return null;

  return (
    <div className="mt-3 space-y-3 animate-fade-in">
      <div className="space-y-1.5">
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-500">Forca da senha</span>
          <span
            className={cn(
              "text-xs font-medium",
              strength.score <= 50 ? "text-red-500" : strength.score <= 75 ? "text-yellow-600" : "text-green-600"
            )}
          >
            {strength.label}
          </span>
        </div>
        <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={cn("h-full rounded-full transition-all duration-500 ease-out", strength.color)}
            style={{ width: `${strength.score}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {passedRequirements.map((req, i) => (
          <div
            key={i}
            className={cn(
              "flex items-center gap-1.5 text-xs transition-colors duration-200",
              req.passed ? "text-green-600" : "text-gray-400"
            )}
          >
            {req.passed ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
            <span>{req.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
