import { requireAdminUser, signOutPath } from "../auth";
import { getDashboardData } from "../../db/queries";
import { AdminDashboard } from "../components/AdminDashboard";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const user = await requireAdminUser("/admin");
  const data = await getDashboardData();
  return <AdminDashboard user={user} data={data} signOutPath={signOutPath("/")} />;
}
