import { Calendar } from "lucide-react";

export default function EmptyState() {
  return (
    <div className="bg-gray-50 rounded-lg p-12 text-center">
      <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
      <p className="text-gray-600">
        Select an area above to view its score history
      </p>
    </div>
  );
}

