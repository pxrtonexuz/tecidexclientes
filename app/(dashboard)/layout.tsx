import { requireTenantSession } from "@/lib/auth";
import { Sidebar } from "@/components/layout/sidebar";
import { AutoRefresh } from "@/components/layout/auto-refresh";
import { Toaster } from "@/components/ui/sonner";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { tenant, user } = await requireTenantSession();

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar
        companyName={tenant.company_name}
        userEmail={user.email ?? ""}
        preferredName={typeof user.user_metadata?.preferred_name === "string" ? user.user_metadata.preferred_name : undefined}
        fullName={typeof user.user_metadata?.full_name === "string" ? user.user_metadata.full_name : undefined}
        accessRole={typeof user.user_metadata?.access_role === "string" ? user.user_metadata.access_role : undefined}
        avatarUrl={typeof user.user_metadata?.avatar_url === "string" ? user.user_metadata.avatar_url : undefined}
      />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
      <AutoRefresh intervalMs={60_000} />
      <Toaster />
    </div>
  );
}
