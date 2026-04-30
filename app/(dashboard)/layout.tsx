import { requireTenantSession } from "@/lib/auth";
import { Sidebar } from "@/components/layout/sidebar";
import { Toaster } from "@/components/ui/sonner";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { tenant, user } = await requireTenantSession();

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar companyName={tenant.company_name} userEmail={user.email ?? ""} />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
      <Toaster />
    </div>
  );
}
