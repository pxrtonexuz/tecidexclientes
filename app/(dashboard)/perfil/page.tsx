import { requireTenantSession } from "@/lib/auth";
import { ProfileSettings } from "@/components/profile/profile-settings";

export default async function PerfilPage() {
  const { user } = await requireTenantSession();

  return (
    <ProfileSettings
      email={user.email ?? ""}
      fullName={typeof user.user_metadata?.full_name === "string" ? user.user_metadata.full_name : ""}
      preferredName={typeof user.user_metadata?.preferred_name === "string" ? user.user_metadata.preferred_name : ""}
      accessRole={typeof user.user_metadata?.access_role === "string" ? user.user_metadata.access_role : "Admin"}
      avatarUrl={typeof user.user_metadata?.avatar_url === "string" ? user.user_metadata.avatar_url : ""}
    />
  );
}
