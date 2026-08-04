import { ensureDefaultDriverAccounts, listManagedUsers, requirePortalUser, signOutPath } from "../auth";
import { getDashboardData } from "../../db/queries";
import { AdminDashboard } from "../components/AdminDashboard";
import type { AdminTab } from "../components/AdminDashboard";

export const dynamic = "force-dynamic";

export default async function AdminPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const requestedTab = (await searchParams).tab;
  const user = await requirePortalUser(requestedTab ? `/admin?tab=${encodeURIComponent(requestedTab)}` : "/admin");
  const data = await getDashboardData();
  const users = user.role === "admin" ? await (async () => {
    await ensureDefaultDriverAccounts();
    return listManagedUsers();
  })() : [];
  const visibleData = user.role === "driver" ? { ...data, requests: [], users } : { ...data, users };
  const permittedTabs = user.role === "admin"
    ? ["Ringkasan", "Kendaraan", "Pengemudi", "Permohonan", "Pemeliharaan", "Bahan Bakar", "Jadwal KIR", "Kontak Person", "Pengelolaan User"]
    : ["Pemeliharaan", "Bahan Bakar", "Jadwal KIR"];
  const initialTab = permittedTabs.includes(requestedTab ?? "")
    ? requestedTab as AdminTab
    : user.role === "driver" ? "Pemeliharaan" : "Ringkasan";
  return <AdminDashboard user={user} data={visibleData} initialTab={initialTab} signOutPath={signOutPath("/")} />;
}
