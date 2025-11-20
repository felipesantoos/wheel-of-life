import { useState } from "react";
import { useLifeAreas, useScores } from "../lib/hooks";
import type { Page } from "../types";
import HistoryPageHeader from "../components/History/HistoryPageHeader";
import AreaSelectionSection from "../components/History/AreaSelectionSection";
import ScoreChartSection from "../components/History/ScoreChartSection";
import EmptyState from "../components/History/EmptyState";

interface HistoryPageProps {
  onNavigate: (page: Page, data?: any) => void;
}

export default function HistoryPage({ onNavigate }: HistoryPageProps) {
  const { areas } = useLifeAreas(false);
  const [selectedArea, setSelectedArea] = useState<number | null>(null);

  // Get scores for selected area
  const { scores: areaScores } = useScores(selectedArea || undefined);

  const selectedAreaData = areas.find((a) => a.id === selectedArea);

  return (
    <div className="h-full flex flex-col">
      <HistoryPageHeader onNavigate={() => onNavigate("home")} />

      <div className="flex-1 overflow-y-auto space-y-6">
        <AreaSelectionSection
          areas={areas}
          selectedArea={selectedArea}
          onAreaSelect={setSelectedArea}
        />

        {selectedArea && selectedAreaData && (
          <ScoreChartSection area={selectedAreaData} scores={areaScores} />
        )}

        {!selectedArea && <EmptyState />}
      </div>
    </div>
  );
}

