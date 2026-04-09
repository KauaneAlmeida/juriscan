"use client";

import Link from "next/link";

interface PriorityAction {
  type: "high" | "medium" | "info";
  badge: {
    text: string;
    background: string;
    color: string;
  };
  title: string;
  description: string;
  actionText: string;
  indicatorColor: string;
}

interface PriorityActionsProps {
  actions: PriorityAction[];
}

export default function PriorityActions({ actions }: PriorityActionsProps) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm mb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">
          Ações Prioritárias
        </h3>
        <Link
          href="/acoes"
          className="text-sm text-[#3B82F6] hover:underline"
        >
          Ver todas →
        </Link>
      </div>

      {/* Actions List */}
      <div className="space-y-3">
        {actions.map((action, index) => (
          <div
            key={index}
            className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl relative overflow-hidden"
          >
            {/* Left Indicator */}
            <div
              className="absolute left-0 top-0 bottom-0 w-1"
              style={{ backgroundColor: action.indicatorColor }}
            />

            {/* Content */}
            <div className="flex-1 ml-2">
              <div className="flex items-center gap-2 mb-1">
                <span
                  className="text-xs font-medium px-2 py-0.5 rounded"
                  style={{
                    backgroundColor: action.badge.background,
                    color: action.badge.color,
                  }}
                >
                  {action.badge.text}
                </span>
              </div>
              <p className="text-sm font-medium text-gray-800">
                {action.title}
              </p>
              <p className="text-sm text-gray-500 mt-0.5">
                {action.description}
              </p>
            </div>

            {/* Action Link */}
            <Link
              href="#"
              className="text-sm text-[#3B82F6] hover:underline whitespace-nowrap"
            >
              {action.actionText}
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
