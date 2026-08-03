import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export type AdminUser = {
  displayName: string;
  email: string;
};

export function isClerkConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
      process.env.CLERK_SECRET_KEY,
  );
}

export async function getAdminUser(): Promise<AdminUser | null> {
  if (!isClerkConfigured()) return null;

  const { userId } = await auth();
  if (!userId) return null;

  const user = await currentUser();
  const email = user?.primaryEmailAddress?.emailAddress;
  if (!user || !email) return null;

  const allowlist = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
  if (allowlist.length > 0 && !allowlist.includes(email.toLowerCase())) {
    return null;
  }

  const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ");
  return { displayName: fullName || email, email };
}

export async function requireAdminUser(returnTo = "/admin") {
  const user = await getAdminUser();
  if (user) return user;
  redirect(`/sign-in?redirect_url=${encodeURIComponent(returnTo)}`);
}

export function signOutPath(returnTo = "/") {
  return `/sign-out?return_to=${encodeURIComponent(returnTo)}`;
}
