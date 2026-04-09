"use client";

interface NpsSelectorProps {
  value: number | null;
  onChange: (value: number) => void;
}

export default function NpsSelector({ value, onChange }: NpsSelectorProps) {
  const getColor = (n: number) => {
    if (n <= 6) return value === n ? "bg-red-500 text-white ring-2 ring-red-300" : "bg-red-50 text-red-700 hover:bg-red-100";
    if (n <= 8) return value === n ? "bg-amber-500 text-white ring-2 ring-amber-300" : "bg-amber-50 text-amber-700 hover:bg-amber-100";
    return value === n ? "bg-emerald-500 text-white ring-2 ring-emerald-300" : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100";
  };

  return (
    <div>
      <p className="text-sm font-medium text-gray-800 mb-3">
        Em uma escala de 0 a 10, qual a probabilidade de recomendar o Juriscan para um colega?
      </p>
      <div className="flex gap-1.5 sm:gap-2 flex-wrap justify-center">
        {Array.from({ length: 11 }, (_, i) => i).map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className={`w-10 h-10 sm:w-11 sm:h-11 rounded-lg text-sm font-semibold transition-all ${getColor(n)}`}
          >
            {n}
          </button>
        ))}
      </div>
      <div className="flex justify-between mt-2 text-xs text-gray-400 px-1">
        <span>Nada provável</span>
        <span>Muito provável</span>
      </div>
    </div>
  );
}
