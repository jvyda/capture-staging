import { VideoEditPage } from "@/components/videos/VideoEditPage";

// Mock video IDs - replace with actual data source
const mockVideoIds = ["1", "2", "3", "4", "5"];

export function generateStaticParams() {
  return mockVideoIds.map((id) => ({
    id: id,
  }));
}

export default function Page({ params }: { params: { id: string } }) {
  return <VideoEditPage params={params} />;
}