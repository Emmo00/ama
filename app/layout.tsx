import type React from "react";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { APP_URL, APP_NAME, APP_DESCRIPTION } from "@/lib/constants";
import { Providers } from "./providers";
import { getFarcasterDomainManifest } from "@/lib/utils";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AMA - Ask Me Anything on Farcaster",
  description:
    "Host and join AMA sessions on Farcaster. Ask questions tip creators with USDC.",
  openGraph: {
    title: APP_NAME,
    description: APP_DESCRIPTION,
  },
  other: {
    "fc:frame": JSON.stringify(getFarcasterDomainManifest()),
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className} suppressHydrationWarning={true}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
