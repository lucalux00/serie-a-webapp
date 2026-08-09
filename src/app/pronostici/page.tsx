import PredictionsSection from "@/components/domain/PredictionsSection";
import { predictionsData } from "@/data/predictionsData";

export default function PronosticiPage() {
  return <PredictionsSection data={predictionsData} />;
}
