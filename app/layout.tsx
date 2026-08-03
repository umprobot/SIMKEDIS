import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { headers } from "next/headers";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "localhost:3000";
  const protocol = requestHeaders.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const metadataBase = new URL(`${protocol}://${host}`);
  return {
    metadataBase,
    title: { default: "SIMKEDIS — Sistem Informasi Kendaraan Dinas", template: "%s · SIMKEDIS" },
    description: "Layanan terpadu untuk pengelolaan armada, permohonan kendaraan, pajak, dan kesiapan operasional kendaraan dinas.",
    applicationName: "SIMKEDIS",
    openGraph: {
      title: "SIMKEDIS — Kendaraan dinas lebih tertib",
      description: "Kelola armada dan permohonan kendaraan dinas dalam satu layanan.",
      type: "website",
      locale: "id_ID",
      images: [{ url: "/og.png", width: 1536, height: 1024, alt: "SIMKEDIS — Kendaraan dinas, lebih tertib." }],
    },
    twitter: { card: "summary_large_image", title: "SIMKEDIS", description: "Kendaraan dinas lebih tertib.", images: ["/og.png"] },
  };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const document = <html lang="id"><body>{children}</body></html>;
  return process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
    ? <ClerkProvider>{document}</ClerkProvider>
    : document;
}
