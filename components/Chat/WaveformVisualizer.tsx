"use client";

import { useRef, useEffect, memo } from "react";

interface WaveformVisualizerProps {
  data: Uint8Array | null;
  isActive: boolean;
  width?: number;
  height?: number;
  barWidth?: number;
  barGap?: number;
  barColor?: string;
  backgroundColor?: string;
  className?: string;
}

function WaveformVisualizerComponent({
  data,
  isActive,
  width = 120,
  height = 32,
  barWidth = 3,
  barGap = 2,
  barColor = "#9333ea",
  backgroundColor = "transparent",
  className = "",
}: WaveformVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas resolution for sharp rendering
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    const draw = () => {
      // Clear canvas
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, width, height);

      const barCount = Math.floor(width / (barWidth + barGap));
      const centerY = height / 2;

      if (data && isActive) {
        // Draw waveform from audio data
        const step = Math.floor(data.length / barCount);

        for (let i = 0; i < barCount; i++) {
          const dataIndex = i * step;
          // Normalize value (0-255) to bar height
          const value = data[dataIndex] || 128;
          const normalized = Math.abs(value - 128) / 128;
          const barHeight = Math.max(4, normalized * (height - 4));

          const x = i * (barWidth + barGap);
          const y = centerY - barHeight / 2;

          ctx.fillStyle = barColor;
          ctx.beginPath();
          ctx.roundRect(x, y, barWidth, barHeight, barWidth / 2);
          ctx.fill();
        }
      } else {
        // Draw idle/paused state with minimal bars
        for (let i = 0; i < barCount; i++) {
          const x = i * (barWidth + barGap);
          const barHeight = 4;
          const y = centerY - barHeight / 2;

          ctx.fillStyle = barColor;
          ctx.globalAlpha = 0.3;
          ctx.beginPath();
          ctx.roundRect(x, y, barWidth, barHeight, barWidth / 2);
          ctx.fill();
          ctx.globalAlpha = 1;
        }
      }

      if (isActive) {
        animationRef.current = requestAnimationFrame(draw);
      }
    };

    draw();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [data, isActive, width, height, barWidth, barGap, barColor, backgroundColor]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width, height }}
      className={className}
    />
  );
}

export const WaveformVisualizer = memo(WaveformVisualizerComponent);
