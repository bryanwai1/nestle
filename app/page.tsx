import NavHeader from "@/components/NavHeader";
import HomeDashboard from "@/components/HomeDashboard";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-50 max-w-2xl mx-auto">
      <NavHeader />
      <HomeDashboard />
    </div>
  );
}
