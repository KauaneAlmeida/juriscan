"use client";

interface TribunalData {
  label: string;
  value: number;
  color: string;
}

interface TribunalChartProps {
  data: TribunalData[];
}

export default function TribunalChart({ data }: TribunalChartProps) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-800 mb-6">
        Performance por Tribunal
      </h3>

      <div className="space-y-4">
        {data.map((item, index) => (
          <div key={index} className="flex items-center gap-4">
            <span className="text-sm font-medium text-gray-600 w-12">
              {item.label}
            </span>
            <div className="flex-1 h-8 bg-gray-100 rounded-lg overflow-hidden">
              <div
                className="h-full rounded-lg flex items-center justify-end pr-3 transition-all"
                style={{
                  width: `${item.value}%`,
                  backgroundColor: item.color,
                }}
              >
                <span className="text-xs font-semibold text-white">
                  {item.value}%
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
