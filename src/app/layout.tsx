import type { Metadata } from "next";
import { DM_Sans, JetBrains_Mono } from "next/font/google";
import { Providers } from "./providers";
import { Navbar } from "@/components/Navbar";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const jetbrains = JetBrains_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "ClimateLens — Interactive Climate Data Explorer",
  description:
    "Explore Earth's climate through beautiful, interactive visualizations and data-driven insights.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${dmSans.variable} ${jetbrains.variable} font-sans antialiased min-h-screen bg-[#0a0f1a] text-slate-200`}
      >
        <Providers>
          <Navbar />
          <main className="pt-[72px]">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
