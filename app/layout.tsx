import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Shell } from "@/components/Shell";
import { buildIndex } from "@/lib/search";
import { titleMap } from "@/lib/content";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

const title = "ansem docs";
const description =
  "CHANSE: a memecoin economy with its own chain, fair-launch launchpad, AMM, Solana bridge and community-governed proposals.";

export const metadata: Metadata = {
  title: { default: title, template: "%s · ansem" },
  description,
  icons: { icon: "/favicon.png", apple: "/ansem.png" },
  openGraph: { title, description },
  twitter: { card: "summary", title, description },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <Shell index={buildIndex()} titles={titleMap()}>
          {children}
        </Shell>
      </body>
    </html>
  );
}
