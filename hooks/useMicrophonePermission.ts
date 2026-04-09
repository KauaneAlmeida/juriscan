"use client";

import { useState, useEffect, useCallback } from "react";

export type MicrophonePermissionState = "prompt" | "granted" | "denied" | "unsupported";

interface UseMicrophonePermissionReturn {
  permission: MicrophonePermissionState;
  isChecking: boolean;
  error: string | null;
  requestPermission: () => Promise<boolean>;
  checkPermission: () => Promise<MicrophonePermissionState>;
}

export function useMicrophonePermission(): UseMicrophonePermissionReturn {
  const [permission, setPermission] = useState<MicrophonePermissionState>("prompt");
  const [isChecking, setIsChecking] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check if the browser supports the required APIs
  const isSupported = useCallback(() => {
    if (typeof window === "undefined") return false;
    return !!(navigator?.mediaDevices?.getUserMedia);
  }, []);

  // Check current permission status
  const checkPermission = useCallback(async (): Promise<MicrophonePermissionState> => {
    if (!isSupported()) {
      setPermission("unsupported");
      return "unsupported";
    }

    try {
      // Try using the Permissions API first (more reliable)
      if (navigator.permissions) {
        const result = await navigator.permissions.query({ name: "microphone" as PermissionName });
        const state = result.state as MicrophonePermissionState;
        setPermission(state);

        // Listen for permission changes
        result.onchange = () => {
          setPermission(result.state as MicrophonePermissionState);
        };

        return state;
      }

      // Fallback: we don't know the state, assume "prompt"
      setPermission("prompt");
      return "prompt";
    } catch {
      // Permissions API might not be available for microphone
      // This is fine, we'll check when requesting
      setPermission("prompt");
      return "prompt";
    }
  }, [isSupported]);

  // Request microphone permission
  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!isSupported()) {
      setError("Gravação de áudio não é suportada neste navegador");
      setPermission("unsupported");
      return false;
    }

    setError(null);
    setIsChecking(true);

    try {
      // Request access to the microphone
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
        },
      });

      // Permission granted - stop the stream immediately
      stream.getTracks().forEach((track) => track.stop());

      setPermission("granted");
      setIsChecking(false);
      return true;
    } catch (err) {
      setIsChecking(false);

      if (err instanceof Error) {
        console.error("🎤 Permission error:", err.name, err.message);

        switch (err.name) {
          case "NotAllowedError":
          case "PermissionDeniedError":
            setPermission("denied");
            // Check if it's an HTTPS issue
            const isSecure =
              window.location.protocol === "https:" ||
              window.location.hostname === "localhost";

            if (!isSecure) {
              setError("Gravação de áudio requer conexão segura (HTTPS)");
            } else {
              setError("Permissão de microfone negada. Clique no ícone 🔒 na barra de endereço para permitir.");
            }
            break;

          case "NotFoundError":
            setError("Nenhum microfone encontrado. Conecte um microfone e tente novamente.");
            break;

          case "NotReadableError":
            setError("Microfone está sendo usado por outro aplicativo.");
            break;

          case "OverconstrainedError":
            setError("Configuração de microfone não suportada.");
            break;

          case "SecurityError":
            setError("Erro de segurança. Verifique se o site está em HTTPS.");
            break;

          default:
            setError(`Erro ao acessar microfone: ${err.message}`);
        }
      } else {
        setError("Erro desconhecido ao acessar microfone");
      }

      return false;
    }
  }, [isSupported]);

  // Check permission on mount
  useEffect(() => {
    const init = async () => {
      setIsChecking(true);
      await checkPermission();
      setIsChecking(false);
    };

    init();
  }, [checkPermission]);

  return {
    permission,
    isChecking,
    error,
    requestPermission,
    checkPermission,
  };
}
