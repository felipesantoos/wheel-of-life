import { LifeArea, Score } from "../../types";
import LifeAreaCardWithActions from "./LifeAreaCardWithActions";

interface ActiveAreasSectionProps {
  areas: LifeArea[];
  scores: Score[];
  onAreaClick: (areaId: number) => void;
  onEdit: (area: LifeArea) => void;
  onArchive: (id: number) => void;
  onCreateFirst: () => void;
}

export default function ActiveAreasSection({
  areas,
  scores,
  onAreaClick,
  onEdit,
  onArchive,
  onCreateFirst,
}: ActiveAreasSectionProps) {
  if (areas.length === 0) {
    return (
      <section>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Active Areas (0)
        </h2>
        <div className="bg-gray-50 rounded-lg p-8 text-center">
          <p className="text-gray-500 mb-4">No active areas yet</p>
          <button
            onClick={onCreateFirst}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Create Your First Area
          </button>
        </div>
      </section>
    );
  }

  return (
    <section>
      <h2 className="text-xl font-semibold text-gray-900 mb-4">
        Active Areas ({areas.length})
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {areas.map((area) => {
          const score = scores.find((s) => s.area_id === area.id);
          return (
            <LifeAreaCardWithActions
              key={area.id}
              area={area}
              currentScore={score?.value}
              onClick={() => onAreaClick(area.id)}
              onEdit={() => onEdit(area)}
              onArchive={() => onArchive(area.id)}
            />
          );
        })}
      </div>
    </section>
  );
}

