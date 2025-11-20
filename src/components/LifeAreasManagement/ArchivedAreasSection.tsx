import { useState } from "react";
import { LifeArea } from "../../types";
import LifeAreaCardWithActions from "./LifeAreaCardWithActions";

interface ArchivedAreasSectionProps {
  areas: LifeArea[];
  onRestore: (id: number) => void;
}

export default function ArchivedAreasSection({
  areas,
  onRestore,
}: ArchivedAreasSectionProps) {
  const [showArchived, setShowArchived] = useState(false);

  if (areas.length === 0) {
    return null;
  }

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-900">
          Archived Areas ({areas.length})
        </h2>
        <button
          onClick={() => setShowArchived(!showArchived)}
          className="text-sm text-gray-600 hover:text-gray-900"
        >
          {showArchived ? "Hide" : "Show"} Archived
        </button>
      </div>
      {showArchived && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {areas.map((area) => (
            <LifeAreaCardWithActions
              key={area.id}
              area={area}
              onRestore={() => onRestore(area.id)}
              isArchived={true}
            />
          ))}
        </div>
      )}
    </section>
  );
}

