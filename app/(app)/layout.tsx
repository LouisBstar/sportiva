import BottomNav from "@/components/navigation/BottomNav";
import Sidebar from "@/components/navigation/Sidebar";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <main className="safe-bottom lg:pb-8 lg:ml-64">
        <div className="max-w-3xl mx-auto">{children}</div>
      </main>
      <BottomNav />
    </div>
  );
}
