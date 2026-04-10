"use client";

import { useState } from "react";
import { TomDeResposta, TONS_DE_RESPOSTA } from "@/types/chatTone";
import useMediaQuery from "@/hooks/useMediaQuery";

interface Props {
  tomAtual: TomDeResposta;
  onChange: (tom: TomDeResposta) => void;
  disabled?: boolean;
}

export default function TomDeRespostaSelector({ tomAtual, onChange, disabled }: Props) {
  const [aberto, setAberto] = useState(false);
  const isMobile = useMediaQuery("(max-width: 639px)");
  const tomConfig = TONS_DE_RESPOSTA.find((t) => t.id === tomAtual) ?? TONS_DE_RESPOSTA[0];

  const chipBackground =
    tomAtual === "formal"
      ? "#f5f7fa"
      : tomAtual === "humanizado"
      ? "#f0fdf4"
      : tomAtual === "executivo"
      ? "#eff4ff"
      : "#faf5ff";

  const fechar = () => setAberto(false);
  const selecionar = (id: TomDeResposta) => {
    onChange(id);
    fechar();
  };

  // Painel de opções reutilizado entre dropdown (desktop) e bottom sheet (mobile)
  const listaOpcoes = (
    <>
      {/* Header */}
      <div
        style={{
          padding: isMobile ? "4px 14px 14px" : "8px 10px 12px",
          borderBottom: "1px solid #f0f4f8",
          marginBottom: "6px",
        }}
      >
        <div
          style={{
            fontSize: isMobile ? "15px" : "12px",
            fontWeight: 600,
            color: "#0f1923",
            marginBottom: "4px",
          }}
        >
          Tom de Resposta
        </div>
        <div style={{ fontSize: isMobile ? "13px" : "11px", color: "#9ab0c8" }}>
          Como você quer que a IA redija essa resposta?
        </div>
      </div>

      {/* Opções */}
      {TONS_DE_RESPOSTA.map((tom) => {
        const ativo = tomAtual === tom.id;
        return (
          <button
            key={tom.id}
            type="button"
            onClick={() => selecionar(tom.id)}
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "12px",
              width: "100%",
              padding: isMobile ? "14px 12px" : "10px 12px",
              minHeight: isMobile ? "56px" : "auto",
              borderRadius: "10px",
              border: "none",
              cursor: "pointer",
              textAlign: "left",
              transition: "background 0.1s",
              background: ativo ? "#eff4ff" : "transparent",
            }}
            onMouseEnter={(e) => {
              if (!ativo) e.currentTarget.style.background = "#f5f7fa";
            }}
            onMouseLeave={(e) => {
              if (!ativo) e.currentTarget.style.background = "transparent";
            }}
          >
            <span
              style={{
                fontSize: isMobile ? "20px" : "18px",
                width: isMobile ? "40px" : "32px",
                height: isMobile ? "40px" : "32px",
                borderRadius: "10px",
                background: ativo ? "#dbeafe" : "#f5f7fa",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              {tom.icone}
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: isMobile ? "15px" : "13px",
                  fontWeight: 600,
                  color: ativo ? "#1a4fd6" : "#1a2435",
                  marginBottom: "3px",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                {tom.label}
                {ativo && (
                  <svg width="14" height="14" viewBox="0 0 12 12" fill="none">
                    <path
                      d="M2 6l3 3 5-5"
                      stroke="#1a4fd6"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      fill="none"
                    />
                  </svg>
                )}
              </div>
              <div
                style={{
                  fontSize: isMobile ? "13px" : "11.5px",
                  color: "#7a9ab8",
                  lineHeight: 1.4,
                }}
              >
                {tom.descricao}
              </div>
            </div>
          </button>
        );
      })}

      {/* Footer informativo */}
      <div
        style={{
          padding: isMobile ? "12px 14px 4px" : "10px 10px 4px",
          borderTop: "1px solid #f0f4f8",
          marginTop: "6px",
          fontSize: isMobile ? "12px" : "11px",
          color: "#b0bec8",
          textAlign: isMobile ? "center" : "left",
        }}
      >
        O tom se aplica apenas à próxima mensagem enviada.
      </div>
    </>
  );

  return (
    <div style={{ position: "relative", flexShrink: 0 }}>
      {/* Botão trigger — chip compacto.
          No mobile muito estreito, esconde o label pra não apertar o input. */}
      <button
        type="button"
        onClick={() => setAberto(!aberto)}
        disabled={disabled}
        title={`Tom de resposta: ${tomConfig.label}`}
        aria-label={`Tom de resposta: ${tomConfig.label}. Toque para trocar.`}
        aria-expanded={aberto}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          padding: isMobile ? "8px 10px" : "6px 12px",
          minHeight: isMobile ? "36px" : "auto",
          borderRadius: "20px",
          border: "1px solid #e5e9ef",
          background: chipBackground,
          cursor: disabled ? "not-allowed" : "pointer",
          fontSize: "12px",
          fontWeight: 500,
          color: "#1a2435",
          whiteSpace: "nowrap",
          transition: "all 0.15s",
          flexShrink: 0,
          opacity: disabled ? 0.5 : 1,
        }}
      >
        <span style={{ fontSize: isMobile ? "15px" : "13px" }}>{tomConfig.icone}</span>
        {!isMobile && <span>{tomConfig.label}</span>}
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
          <path
            d={aberto ? "M2 7l3-3 3 3" : "M2 3l3 3 3-3"}
            stroke="#7a9ab8"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {/* Mobile: bottom sheet ocupando a largura da tela, ancorado no rodapé */}
      {aberto && isMobile && (
        <>
          {/* Backdrop escuro clicável para fechar */}
          <div
            onClick={fechar}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(15, 25, 35, 0.55)",
              zIndex: 90,
              animation: "fadeInUp 0.15s ease",
            }}
          />
          {/* Sheet */}
          <div
            role="dialog"
            aria-label="Tom de Resposta"
            style={{
              position: "fixed",
              left: "12px",
              right: "12px",
              bottom: "calc(12px + env(safe-area-inset-bottom, 0px))",
              zIndex: 100,
              background: "#ffffff",
              borderRadius: "16px",
              border: "1px solid #e5e9ef",
              boxShadow: "0 -12px 40px rgba(0,0,0,0.18)",
              padding: "12px 8px 10px",
              maxHeight: "80vh",
              overflowY: "auto",
              animation: "fadeInUp 0.18s ease",
            }}
          >
            {/* Grip visual estilo iOS */}
            <div
              style={{
                width: "40px",
                height: "4px",
                borderRadius: "2px",
                background: "#e5e9ef",
                margin: "0 auto 8px",
              }}
            />
            {listaOpcoes}
          </div>
        </>
      )}

      {/* Desktop: dropdown ancorado acima do chip */}
      {aberto && !isMobile && (
        <>
          <div
            onClick={fechar}
            style={{ position: "fixed", inset: 0, zIndex: 40 }}
          />
          <div
            style={{
              position: "absolute",
              bottom: "calc(100% + 8px)",
              right: 0,
              zIndex: 50,
              background: "#ffffff",
              borderRadius: "12px",
              border: "1px solid #e5e9ef",
              boxShadow: "0 8px 30px rgba(0,0,0,0.12)",
              padding: "8px",
              width: "300px",
              maxWidth: "calc(100vw - 32px)",
              animation: "fadeInUp 0.15s ease",
            }}
          >
            {listaOpcoes}
          </div>
        </>
      )}
    </div>
  );
}
