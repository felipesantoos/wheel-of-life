import { LifeArea } from "../../types";

interface AreaSelectionSectionProps {
  areas: LifeArea[];
  selectedArea: number | null;
  onAreaSelect: (areaId: number) => void;
}

export default function AreaSelectionSection({
  areas,
  selectedArea,
  onAreaSelect,
}: AreaSelectionSectionProps) {
  return (
    <section className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">
        Select Area to View History
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {areas.map((area) => (
          <button
            key={area.id}
            onClick={() => onAreaSelect(area.id)}
            className={`p-4 rounded-lg border-2 transition-all text-left ${
              selectedArea === area.id
                ? "border-blue-500 bg-blue-50"
                : "border-gray-200 hover:border-gray-300"
            }`}
            style={
              selectedArea === area.id
                ? { borderColor: area.color }
                : undefined
            }
          >
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: area.color }}
              />
              <span className="font-semibold text-sm">{area.name}</span>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}

