"use client";

import { Star } from "lucide-react";

interface StarRatingProps {
  value: number | null;
  onChange: (value: number) => void;
  label: string;
}

export default function StarRating({ value, onChange, label }: StarRatingProps) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-sm text-gray-700 flex-1">{label}</span>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className="p-1 transition-transform hover:scale-110 active:scale-95"
          >
            <Star
              className={`w-6 h-6 transition-colors ${
                value && star <= value
                  ? "fill-amber-400 text-amber-400"
                  : "text-gray-300"
              }`}
            />
          </button>
        ))}
      </div>
    </div>
  );
}
