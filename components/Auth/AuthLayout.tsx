"use client";

import { cn } from "@/lib/utils/cn";
import FloatingShapes from "./FloatingShapes";
import AnimatedLogo from "./AnimatedLogo";

interface AuthLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  showBackButton?: boolean;
  onBack?: () => void;
}

export default function AuthLayout({
  children,
  title,
  subtitle,
  showBackButton,
  onBack,
}: AuthLayoutProps) {
  return (
    <>
      {/* ===== MOBILE LAYOUT ===== */}
      <div className="lg:hidden min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 relative overflow-hidden">
        <FloatingShapes />

        <div className="relative z-10 min-h-screen flex flex-col">
          <div style={{ paddingTop: "var(--safe-area-top)" }} />

          {showBackButton && (
            <header className="flex items-center h-14 px-4 flex-shrink-0">
              <button
                onClick={onBack}
                className="flex items-center justify-center w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 active:bg-white/30 transition-colors"
              >
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            </header>
          )}

          <div
            className={cn(
              "flex flex-col items-center justify-center px-6 flex-shrink-0",
              showBackButton ? "pt-2 pb-6" : "pt-8 pb-8"
            )}
          >
            <AnimatedLogo size="lg" />
            {title && (
              <h1 className="mt-4 text-xl font-bold text-white text-center animate-fade-in-up" style={{ animationDelay: "200ms" }}>
                {title}
              </h1>
            )}
            {subtitle && (
              <p className="mt-1.5 text-sm text-blue-200 text-center animate-fade-in-up" style={{ animationDelay: "300ms" }}>
                {subtitle}
              </p>
            )}
          </div>

          <div
            className="flex-1 bg-white rounded-t-[2rem] px-5 sm:px-6 pt-6 shadow-2xl animate-slide-up overflow-y-auto overscroll-contain"
            style={{ paddingBottom: "max(2rem, env(safe-area-inset-bottom, 2rem))" }}
          >
            {children}
          </div>
        </div>
      </div>

      {/* ===== DESKTOP LAYOUT ===== */}
      <div className="hidden lg:flex min-h-screen">
        {/* Left panel - gradient branding */}
        <div className="w-1/2 xl:w-2/5 bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 relative overflow-hidden">
          <FloatingShapes />

          <div className="relative z-10 flex flex-col items-center justify-center w-full h-full p-12">
            <AnimatedLogo size="xl" />

            <div className="mt-12 text-center max-w-md">
              <h1 className="text-3xl font-bold text-white animate-fade-in-up">
                {title || "Bem-vindo de volta"}
              </h1>
              <p className="mt-4 text-lg text-blue-200 animate-fade-in-up" style={{ animationDelay: "200ms" }}>
                {subtitle || "Analise juridica avancada com inteligencia artificial"}
              </p>
            </div>

            <div className="mt-12 p-6 bg-white/10 backdrop-blur-sm rounded-2xl max-w-md animate-fade-in-up" style={{ animationDelay: "400ms" }}>
              <p className="text-white/90 italic">
                &ldquo;O Juriscan revolucionou a forma como analiso meus casos.
                A jurimetria nunca foi tao acessivel.&rdquo;
              </p>
              <div className="mt-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-400/30 flex items-center justify-center">
                  <span className="text-white font-semibold">DR</span>
                </div>
                <div>
                  <p className="text-white font-medium">Dr. Rafael Santos</p>
                  <p className="text-blue-300 text-sm">Advogado Tributarista</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right panel - form */}
        <div className="flex-1 flex items-center justify-center p-6 lg:p-12 bg-gray-50">
          <div className="w-full max-w-md">
            <div className="bg-white rounded-2xl shadow-xl p-8 animate-fade-in-up">
              {children}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
