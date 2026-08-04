"use client";

import { useClerk } from "@clerk/nextjs";
import { useEffect } from "react";

export function SignOutClient() {
  const { signOut } = useClerk();

  useEffect(() => {
    const returnTo = new URLSearchParams(window.location.search).get("return_to") || "/";
    void signOut({ redirectUrl: returnTo });
  }, [signOut]);

  return <main className="auth-shell"><p>Keluar dari portal admin…</p></main>;
}
