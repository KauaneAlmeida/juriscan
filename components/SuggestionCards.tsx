"use client";

interface Suggestion {
  text: string;
}

interface SuggestionCardsProps {
  suggestions: Suggestion[];
  onSuggestionClick: (text: string) => void;
}

export default function SuggestionCards({
  suggestions,
  onSuggestionClick,
}: SuggestionCardsProps) {
  return (
    <div className="mt-4 sm:mt-6">
      <p className="text-xs sm:text-sm text-gray-500 mb-2 sm:mb-3">
        Análises estratégicas sugeridas:
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
        {suggestions.map((suggestion, index) => (
          <button
            key={index}
            onClick={() => onSuggestionClick(suggestion.text)}
            className="bg-white rounded-xl p-3 sm:p-4 border border-gray-200 hover:border-blue-500 active:border-blue-500 active:bg-gray-50 hover:bg-gray-50 transition-all text-left min-h-[48px]"
          >
            <p className="text-xs sm:text-sm text-gray-700 leading-relaxed">{suggestion.text}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
