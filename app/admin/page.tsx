import { ensureDefaultDriverAccounts, listManagedUsers, requirePortalUser, signOutPath } from "../auth";
import { getDashboardData } from "../../db/queries";
import { AdminDashboard } from "../components/AdminDashboard";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const user = await requirePortalUser("/admin");
  const data = await getDashboardData();
  const users = user.role === "admin" ? await (async () => {
    await ensureDefaultDriverAccounts();
    return listManagedUsers();
  })() : [];
  const visibleData = user.role === "driver" ? { ...data, requests: [], users } : { ...data, users };
  return <AdminDashboard user={user} data={visibleData} signOutPath={signOutPath("/")} />;
}
