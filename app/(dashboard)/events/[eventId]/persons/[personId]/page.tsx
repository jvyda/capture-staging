import { PersonDetailsPage } from "@/components/people/PersonDetailsPage";

// Mock person IDs - replace with actual data source
const mockPersonIds = ["1", "2", "3", "4", "5"];

export function generateStaticParams() {
  return mockPersonIds.map((id) => ({
    id: id,
  }));
}

export default function PersonPage({ params }: { params: { id: string } }) {
  return <PersonDetailsPage personId={params.id} />;
}