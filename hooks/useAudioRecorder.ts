"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { CHAT_ATTACHMENT_LIMITS } from "@/types/chat";

interface AudioRecorderState {
  isRecording: boolean;
  isPaused: boolean;
  duration: number;
  audioBlob: Blob | null;
  audioUrl: string | null;
  error: string | null;
  isSupported: boolean;
}

interface UseAudioRecorderOptions {
  onWaveformData?: (data: Uint8Array) => void;
  fftSize?: number;
}

interface UseAudioRecorderReturn extends AudioRecorderState {
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  pauseRecording: () => void;
  resumeRecording: () => void;
  resetRecording: () => void;
  cancelRecording: () => void;
  getWaveformData: () => Uint8Array | null;
}

// Get supported MIME type for the browser
function getSupportedMimeType(): string {
  if (typeof window === "undefined") return "audio/webm";

  const types = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/mp4",
    "audio/ogg;codecs=opus",
    "audio/ogg",
  ];

  for (const type of types) {
    if (MediaRecorder.isTypeSupported(type)) {
      console.log("🎤 Using MIME type:", type);
      return type;
    }
  }

  console.warn("🎤 No supported MIME type found, defaulting to audio/webm");
  return "audio/webm";
}

export function useAudioRecorder(options: UseAudioRecorderOptions = {}): UseAudioRecorderReturn {
  const { onWaveformData, fftSize = 256 } = options;

  const [state, setState] = useState<AudioRecorderState>({
    isRecording: false,
    isPaused: false,
    duration: 0,
    audioBlob: null,
    audioUrl: null,
    error: null,
    isSupported: false,
  });

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);
  const pausedDurationRef = useRef<number>(0);
  const mimeTypeRef = useRef<string>("audio/webm");

  // Audio analysis refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const waveformDataRef = useRef<Uint8Array<ArrayBuffer> | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Flag to track if recording was cancelled
  const cancelledRef = useRef<boolean>(false);

  // Check support on client
  useEffect(() => {
    const checkSupport = () => {
      const hasMediaDevices = !!navigator?.mediaDevices?.getUserMedia;
      const hasMediaRecorder = typeof MediaRecorder !== "undefined";
      const isSupported = hasMediaDevices && hasMediaRecorder;

      console.log("🎤 Audio recording support:", {
        hasMediaDevices,
        hasMediaRecorder,
        isSupported,
      });

      if (isSupported) {
        mimeTypeRef.current = getSupportedMimeType();
      }

      setState((prev) => ({ ...prev, isSupported }));
    };

    checkSupport();
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const stopAnalyser = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  }, []);

  // Get current waveform data
  const getWaveformData = useCallback((): Uint8Array | null => {
    if (!analyserRef.current || !waveformDataRef.current) return null;
    const data = waveformDataRef.current;
    analyserRef.current.getByteTimeDomainData(data);
    return data;
  }, []);

  // Animation loop for waveform data
  const updateWaveform = useCallback(() => {
    if (analyserRef.current && waveformDataRef.current && onWaveformData) {
      analyserRef.current.getByteTimeDomainData(waveformDataRef.current);
      onWaveformData(waveformDataRef.current);
    }
    animationFrameRef.current = requestAnimationFrame(updateWaveform);
  }, [onWaveformData]);

  const stopRecording = useCallback(() => {
    console.log("🎤 Stopping recording...");
    stopTimer();
    stopAnalyser();

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
  }, [stopTimer, stopAnalyser]);

  const startTimer = useCallback(() => {
    startTimeRef.current = Date.now() - pausedDurationRef.current * 1000;

    timerRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);

      // Check duration limit
      if (elapsed >= CHAT_ATTACHMENT_LIMITS.maxAudioDuration) {
        console.log("🎤 Max duration reached, stopping...");
        stopRecording();
        return;
      }

      setState((prev) => ({ ...prev, duration: elapsed }));
    }, 100);
  }, [stopRecording]);

  const startRecording = useCallback(async () => {
    console.log("🎤 startRecording() called");
    cancelledRef.current = false;

    // Check support directly (not from state which might be stale)
    const hasMediaDevices = !!navigator?.mediaDevices?.getUserMedia;
    const hasMediaRecorder = typeof MediaRecorder !== "undefined";
    const supported = hasMediaDevices && hasMediaRecorder;

    console.log("🎤 Support check:", { hasMediaDevices, hasMediaRecorder, supported });

    if (!supported) {
      console.error("🎤 Audio recording not supported");
      setState((prev) => ({
        ...prev,
        error: "Gravação de áudio não suportada neste navegador",
      }));
      return;
    }

    try {
      // Reset state
      chunksRef.current = [];
      pausedDurationRef.current = 0;

      if (state.audioUrl) {
        URL.revokeObjectURL(state.audioUrl);
      }

      // Request microphone permission - THIS WILL OPEN BROWSER POPUP
      console.log("🎤 Calling navigator.mediaDevices.getUserMedia() - browser popup should appear...");
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        },
      });

      console.log("🎤 Microphone permission granted, stream:", stream.id);
      streamRef.current = stream;

      // Setup audio analysis for waveform
      try {
        audioContextRef.current = new AudioContext();
        analyserRef.current = audioContextRef.current.createAnalyser();
        analyserRef.current.fftSize = fftSize;
        sourceRef.current = audioContextRef.current.createMediaStreamSource(stream);
        sourceRef.current.connect(analyserRef.current);
        waveformDataRef.current = new Uint8Array(analyserRef.current.frequencyBinCount);

        // Start waveform animation if callback provided
        if (onWaveformData) {
          updateWaveform();
        }
      } catch (audioErr) {
        console.warn("🎤 Audio analysis not available:", audioErr);
      }

      // Create MediaRecorder with supported MIME type
      const mimeType = mimeTypeRef.current;
      console.log("🎤 Creating MediaRecorder with mimeType:", mimeType);

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType,
        audioBitsPerSecond: 128000,
      });

      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        console.log("🎤 Data available:", event.data.size, "bytes");
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        console.log("🎤 Recording stopped, chunks:", chunksRef.current.length, "cancelled:", cancelledRef.current);

        // Cleanup audio context
        if (sourceRef.current) {
          sourceRef.current.disconnect();
          sourceRef.current = null;
        }
        if (audioContextRef.current) {
          audioContextRef.current.close();
          audioContextRef.current = null;
        }
        analyserRef.current = null;

        // If cancelled, don't create blob
        if (cancelledRef.current) {
          setState((prev) => ({
            ...prev,
            isRecording: false,
            isPaused: false,
            duration: 0,
            audioBlob: null,
            audioUrl: null,
          }));
          return;
        }

        if (chunksRef.current.length === 0) {
          console.error("🎤 No audio data collected!");
          setState((prev) => ({
            ...prev,
            isRecording: false,
            error: "Nenhum áudio foi gravado. Tente novamente.",
          }));
          return;
        }

        const blob = new Blob(chunksRef.current, { type: mimeType });
        const url = URL.createObjectURL(blob);

        console.log("🎤 Audio blob created:", blob.size, "bytes");

        setState((prev) => ({
          ...prev,
          isRecording: false,
          isPaused: false,
          audioBlob: blob,
          audioUrl: url,
        }));

        // Stop stream
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
          streamRef.current = null;
        }
      };

      mediaRecorder.onerror = (event) => {
        console.error("🎤 MediaRecorder error:", event);
        stopTimer();
        stopAnalyser();
        setState((prev) => ({
          ...prev,
          isRecording: false,
          error: "Erro ao gravar áudio. Tente novamente.",
        }));
      };

      // Start recording - request data every 1 second
      mediaRecorder.start(1000);
      startTimer();

      console.log("🎤 Recording started!");

      setState((prev) => ({
        ...prev,
        isRecording: true,
        isPaused: false,
        duration: 0,
        audioBlob: null,
        audioUrl: null,
        error: null,
      }));
    } catch (error) {
      console.error("🎤 Error starting recording:", error);

      let errorMessage = "Erro ao iniciar gravação";
      if (error instanceof Error) {
        console.error("🎤 Error details:", error.name, error.message);

        if (error.name === "NotAllowedError" || error.name === "PermissionDeniedError") {
          // Check if HTTPS
          const isSecure = typeof window !== "undefined" &&
            (window.location.protocol === "https:" || window.location.hostname === "localhost");

          if (!isSecure) {
            errorMessage = "Gravação de áudio requer conexão segura (HTTPS).";
          } else {
            errorMessage = "Permissão de microfone negada. Para habilitar:\n1. Clique no ícone 🔒 na barra de endereço\n2. Encontre 'Microfone' e selecione 'Permitir'\n3. Recarregue a página";
          }
        } else if (error.name === "NotFoundError") {
          errorMessage = "Nenhum microfone encontrado. Conecte um microfone e tente novamente.";
        } else if (error.name === "NotReadableError") {
          errorMessage = "Microfone está sendo usado por outro aplicativo. Feche outros apps e tente novamente.";
        } else if (error.name === "OverconstrainedError") {
          errorMessage = "Configuração de microfone não suportada.";
        } else if (error.name === "SecurityError") {
          errorMessage = "Erro de segurança. Verifique se o site está em HTTPS.";
        } else {
          errorMessage = `Erro ao acessar microfone: ${error.message}`;
        }
      }

      setState((prev) => ({ ...prev, error: errorMessage }));
    }
  }, [state.audioUrl, fftSize, onWaveformData, startTimer, stopTimer, stopAnalyser, updateWaveform]);

  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      console.log("🎤 Pausing recording...");
      mediaRecorderRef.current.pause();
      stopTimer();
      stopAnalyser();
      pausedDurationRef.current = state.duration;
      setState((prev) => ({ ...prev, isPaused: true }));
    }
  }, [state.duration, stopTimer, stopAnalyser]);

  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "paused") {
      console.log("🎤 Resuming recording...");
      mediaRecorderRef.current.resume();
      startTimer();
      if (onWaveformData) {
        updateWaveform();
      }
      setState((prev) => ({ ...prev, isPaused: false }));
    }
  }, [startTimer, onWaveformData, updateWaveform]);

  // Cancel recording without saving
  const cancelRecording = useCallback(() => {
    console.log("🎤 Cancelling recording...");
    cancelledRef.current = true;
    stopTimer();
    stopAnalyser();

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    chunksRef.current = [];
    pausedDurationRef.current = 0;
    mediaRecorderRef.current = null;

    setState((prev) => ({
      ...prev,
      isRecording: false,
      isPaused: false,
      duration: 0,
      audioBlob: null,
      audioUrl: null,
      error: null,
    }));
  }, [stopTimer, stopAnalyser]);

  const resetRecording = useCallback(() => {
    console.log("🎤 Resetting recording...");
    stopTimer();
    stopAnalyser();

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (state.audioUrl) {
      URL.revokeObjectURL(state.audioUrl);
    }

    chunksRef.current = [];
    pausedDurationRef.current = 0;
    mediaRecorderRef.current = null;

    setState((prev) => ({
      ...prev,
      isRecording: false,
      isPaused: false,
      duration: 0,
      audioBlob: null,
      audioUrl: null,
      error: null,
    }));
  }, [state.audioUrl, stopTimer, stopAnalyser]);

  return {
    ...state,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    resetRecording,
    cancelRecording,
    getWaveformData,
  };
}
