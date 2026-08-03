import { redirect } from "next/navigation";
import { isClerkConfigured } from "../auth";
import { SignOutClient } from "./sign-out-client";

export const dynamic = "force-dynamic";

export default function SignOutPage() {
  if (!isClerkConfigured()) redirect("/");
  return <SignOutClient />;
}
