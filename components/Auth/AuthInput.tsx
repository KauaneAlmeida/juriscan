"use client";

import { useState, forwardRef, InputHTMLAttributes } from "react";
import { Eye, EyeOff, AlertCircle, Check } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface AuthInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "size"> {
  label: string;
  icon?: React.ReactNode;
  error?: string;
  success?: boolean;
  showPasswordToggle?: boolean;
}

const AuthInput = forwardRef<HTMLInputElement, AuthInputProps>(
  ({ label, icon, error, success, showPasswordToggle, type = "text", className, value, onChange, onFocus, onBlur, ...props }, ref) => {
    const [isFocused, setIsFocused] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const hasValue = value !== undefined && value !== "";
    const isFloating = isFocused || hasValue;
    const inputType = showPasswordToggle ? (showPassword ? "text" : "password") : type;

    return (
      <div className={cn("relative", className)}>
        <div
          className={cn(
            "relative flex items-center rounded-xl border-2 transition-all duration-300",
            "bg-gray-50 hover:bg-gray-100/50",
            isFocused && "bg-white ring-4 ring-blue-500/10",
            error
              ? "border-red-300 focus-within:border-red-500"
              : success
                ? "border-green-300 focus-within:border-green-500"
                : "border-gray-200 focus-within:border-blue-500",
            error && "animate-shake"
          )}
        >
          {icon && (
            <span
              className={cn(
                "absolute left-4 transition-colors duration-200",
                isFocused ? "text-blue-500" : "text-gray-400"
              )}
            >
              {icon}
            </span>
          )}

          <input
            ref={ref}
            type={inputType}
            value={value}
            className={cn(
              "w-full h-14 bg-transparent outline-none transition-all duration-200",
              icon ? "pl-12 pr-4" : "px-4",
              showPasswordToggle && "pr-12",
              "text-gray-900 placeholder-transparent",
              "pt-4 text-base"
            )}
            placeholder={label}
            onFocus={(e) => {
              setIsFocused(true);
              onFocus?.(e);
            }}
            onBlur={(e) => {
              setIsFocused(false);
              onBlur?.(e);
            }}
            onChange={onChange}
            {...props}
          />

          <label
            className={cn(
              "absolute transition-all duration-200 pointer-events-none",
              icon ? "left-12" : "left-4",
              isFloating
                ? "top-2 text-xs font-medium"
                : "top-1/2 -translate-y-1/2 text-base",
              isFocused
                ? "text-blue-500"
                : error
                  ? "text-red-500"
                  : "text-gray-500"
            )}
          >
            {label}
          </label>

          {showPasswordToggle && (
            <button
              type="button"
              onPointerDown={(e) => {
                e.preventDefault();
                setShowPassword((prev) => !prev);
              }}
              className="absolute right-1 z-10 flex items-center justify-center w-11 h-11 rounded-full text-gray-400 hover:text-gray-600 active:bg-gray-200/50 transition-colors"
              tabIndex={-1}
              aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          )}

          {!showPasswordToggle && (error || success) && (
            <span className="absolute right-4">
              {error ? (
                <AlertCircle className="w-5 h-5 text-red-500" />
              ) : success ? (
                <Check className="w-5 h-5 text-green-500" />
              ) : null}
            </span>
          )}
        </div>

        {error && (
          <p className="mt-2 text-sm text-red-500 flex items-center gap-1 animate-fade-in">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </p>
        )}
      </div>
    );
  }
);

AuthInput.displayName = "AuthInput";

export default AuthInput;
