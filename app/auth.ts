import { auth, clerkClient, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export type PortalRole = "admin" | "driver";
export type PortalUser = {
  id: string;
  displayName: string;
  email: string;
  username: string;
  role: PortalRole;
};

export type ManagedUser = {
  id: string;
  displayName: string;
  username: string;
  email: string;
  role: PortalRole;
  active: boolean;
  lastSignInAt: number | null;
};

const DRIVER_DOMAIN = "driver.simkedis.vercel.app";
const DEFAULT_PASSWORD = "ArmadaDIY#2026!";
const DEFAULT_DRIVERS = ["budi", "arfangi", "ipnu", "agus"] as const;

export function isClerkConfigured() {
  return Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY);
}

function adminAllowlist() {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
}

function isAdminEmail(email: string) {
  const allowlist = adminAllowlist();
  return allowlist.length === 0 ? !email.endsWith(`@${DRIVER_DOMAIN}`) : allowlist.includes(email.toLowerCase());
}

export async function getPortalUser(): Promise<PortalUser | null> {
  if (!isClerkConfigured()) return null;
  const { userId } = await auth();
  if (!userId) return null;
  const user = await currentUser();
  const email = user?.primaryEmailAddress?.emailAddress;
  if (!user || !email || user.banned) return null;
  const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ");
  if (isAdminEmail(email)) return { id: user.id, displayName: fullName || email, email, username: email, role: "admin" };
  const metadata = user.publicMetadata as { role?: unknown; active?: unknown; username?: unknown };
  if (metadata.role !== "driver" || metadata.active === false) return null;
  const username = typeof metadata.username === "string" ? metadata.username : email.split("@")[0];
  return { id: user.id, displayName: fullName || username, email, username, role: "driver" };
}

export async function getAdminUser() {
  const user = await getPortalUser();
  return user?.role === "admin" ? user : null;
}

export async function getOperatorUser() {
  return getPortalUser();
}

export async function requirePortalUser(returnTo = "/admin") {
  const user = await getPortalUser();
  if (user) return user;
  redirect(`/sign-in?redirect_url=${encodeURIComponent(returnTo)}`);
}

export async function requireAdminUser(returnTo = "/admin") {
  const user = await getAdminUser();
  if (user) return user;
  redirect(`/sign-in?mode=admin&redirect_url=${encodeURIComponent(returnTo)}`);
}

function normalizedUsername(value: unknown) {
  const username = String(value ?? "").trim().toLowerCase();
  if (!/^[a-z0-9._-]{3,32}$/.test(username)) throw new Error("Username harus 3-32 karakter berupa huruf kecil, angka, titik, garis bawah, atau tanda hubung");
  return username;
}

async function createDriverAccount(username: string, displayName: string, password = DEFAULT_PASSWORD) {
  const client = await clerkClient();
  return client.users.createUser({
    emailAddress: [`${username}@${DRIVER_DOMAIN}`],
    firstName: displayName,
    password,
    skipPasswordChecks: false,
    publicMetadata: { role: "driver", active: true, username },
  });
}

export async function ensureDefaultDriverAccounts() {
  const client = await clerkClient();
  const emails = DEFAULT_DRIVERS.map((username) => `${username}@${DRIVER_DOMAIN}`);
  const existing = await client.users.getUserList({ emailAddress: emails, limit: 20 });
  const existingEmails = new Set(existing.data.flatMap((user) => user.emailAddresses.map((item) => item.emailAddress.toLowerCase())));
  for (const username of DEFAULT_DRIVERS) {
    if (!existingEmails.has(`${username}@${DRIVER_DOMAIN}`)) {
      await createDriverAccount(username, username.charAt(0).toUpperCase() + username.slice(1));
    }
  }
}

export async function listManagedUsers(): Promise<ManagedUser[]> {
  const client = await clerkClient();
  const response = await client.users.getUserList({ limit: 100, orderBy: "+first_name" });
  return response.data.flatMap((user) => {
    const email = user.primaryEmailAddress?.emailAddress ?? user.emailAddresses[0]?.emailAddress ?? "";
    const metadata = user.publicMetadata as { role?: unknown; active?: unknown; username?: unknown };
    const role: PortalRole | null = isAdminEmail(email) ? "admin" : metadata.role === "driver" ? "driver" : null;
    if (!role) return [];
    const username = role === "admin" ? email : typeof metadata.username === "string" ? metadata.username : email.split("@")[0];
    return [{
      id: user.id,
      displayName: [user.firstName, user.lastName].filter(Boolean).join(" ") || username,
      username,
      email,
      role,
      active: role === "admin" || (!user.banned && metadata.active !== false),
      lastSignInAt: user.lastSignInAt,
    }];
  });
}

export async function createManagedDriver(input: Record<string, unknown>) {
  const username = normalizedUsername(input.username);
  const displayName = String(input.displayName ?? "").trim();
  if (!displayName) throw new Error("Nama pengguna wajib diisi");
  const password = String(input.password || DEFAULT_PASSWORD);
  if (password.length < 10) throw new Error("Password minimal 10 karakter");
  const existing = await (await clerkClient()).users.getUserList({ emailAddress: [`${username}@${DRIVER_DOMAIN}`], limit: 1 });
  if (existing.totalCount > 0) throw new Error("Username sudah digunakan");
  const user = await createDriverAccount(username, displayName, password);
  return { id: user.id, username };
}

export async function updateManagedDriver(userId: string, input: Record<string, unknown>) {
  const client = await clerkClient();
  const user = await client.users.getUser(userId);
  const metadata = user.publicMetadata as { role?: unknown; active?: unknown };
  if (metadata.role !== "driver") throw new Error("Hanya akun driver yang dapat dikelola");
  const action = String(input.action ?? "");
  if (action === "edit") {
    const username = normalizedUsername(input.username);
    const displayName = String(input.displayName ?? "").trim();
    if (!displayName) throw new Error("Nama pengguna wajib diisi");
    const newEmail = `${username}@${DRIVER_DOMAIN}`;
    const currentEmail = user.primaryEmailAddress?.emailAddress.toLowerCase();
    if (currentEmail !== newEmail) {
      const existing = await client.users.getUserList({ emailAddress: [newEmail], limit: 1 });
      if (existing.totalCount > 0) throw new Error("Username sudah digunakan");
      await client.emailAddresses.createEmailAddress({ userId, emailAddress: newEmail, primary: true, verified: true });
      const oldAddress = user.emailAddresses.find((address) => address.emailAddress.toLowerCase() === currentEmail);
      if (oldAddress) await client.emailAddresses.deleteEmailAddress(oldAddress.id);
    }
    await client.users.updateUser(userId, { firstName: displayName });
    await client.users.updateUserMetadata(userId, { publicMetadata: { ...metadata, username } });
    return { id: userId, username, displayName };
  }
  if (action === "reset-password") {
    await client.users.updateUser(userId, { password: DEFAULT_PASSWORD, skipPasswordChecks: false, signOutOfOtherSessions: true });
    return { passwordReset: true };
  }
  if (action === "toggle-active") {
    const active = user.banned || metadata.active === false;
    if (active) await client.users.unbanUser(userId);
    else await client.users.banUser(userId);
    await client.users.updateUserMetadata(userId, { publicMetadata: { active } });
    return { active };
  }
  throw new Error("Aksi pengguna tidak valid");
}

export function signOutPath(returnTo = "/") {
  return `/sign-out?return_to=${encodeURIComponent(returnTo)}`;
}
