"use client";

import { useState, useRef, useEffect } from "react";
import { Play, Pause, X, Send, RotateCcw } from "lucide-react";
import { formatAudioDuration } from "@/types/chat";

interface AudioPreviewProps {
  audioUrl: string;
  duration: number;
  onConfirm: () => void;
  onDiscard: () => void;
  onReRecord: () => void;
  isUploading?: boolean;
}

export default function AudioPreview({
  audioUrl,
  duration,
  onConfirm,
  onDiscard,
  onReRecord,
  isUploading = false,
}: AudioPreviewProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("pause", handlePause);
    };
  }, []);

  const togglePlayback = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    const progress = progressRef.current;
    if (!audio || !progress) return;

    const rect = progress.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = clickX / rect.width;
    audio.currentTime = percentage * duration;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-purple-50 rounded-full border border-purple-200">
      <audio ref={audioRef} src={audioUrl} preload="metadata" />

      {/* Play/Pause button */}
      <button
        onClick={togglePlayback}
        disabled={isUploading}
        className="p-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white rounded-full transition-colors"
        aria-label={isPlaying ? "Pausar" : "Reproduzir"}
      >
        {isPlaying ? (
          <Pause className="w-4 h-4" />
        ) : (
          <Play className="w-4 h-4 ml-0.5" />
        )}
      </button>

      {/* Progress bar */}
      <div className="flex-1 flex items-center gap-2 min-w-[100px]">
        <div
          ref={progressRef}
          onClick={handleProgressClick}
          className="flex-1 h-2 bg-purple-200 rounded-full cursor-pointer overflow-hidden"
        >
          <div
            className="h-full bg-purple-500 transition-all duration-100"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="text-xs text-purple-600 font-medium min-w-[40px] text-right">
          {formatAudioDuration(Math.floor(currentTime))} / {formatAudioDuration(duration)}
        </span>
      </div>

      {/* Re-record button */}
      <button
        onClick={onReRecord}
        disabled={isUploading}
        className="p-1.5 text-gray-500 hover:text-purple-600 hover:bg-purple-100 disabled:opacity-50 rounded-full transition-colors"
        aria-label="Gravar novamente"
        title="Gravar novamente"
      >
        <RotateCcw className="w-4 h-4" />
      </button>

      {/* Discard button */}
      <button
        onClick={onDiscard}
        disabled={isUploading}
        className="p-1.5 text-gray-500 hover:text-red-500 hover:bg-red-50 disabled:opacity-50 rounded-full transition-colors"
        aria-label="Descartar áudio"
        title="Descartar"
      >
        <X className="w-4 h-4" />
      </button>

      {/* Confirm/Send button */}
      <button
        onClick={onConfirm}
        disabled={isUploading}
        className="p-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white rounded-full transition-colors"
        aria-label="Enviar áudio"
        title="Enviar"
      >
        {isUploading ? (
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
        ) : (
          <Send className="w-4 h-4" />
        )}
      </button>
    </div>
  );
}
