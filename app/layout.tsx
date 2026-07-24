import type { Metadata } from "next";
import { Public_Sans, Geist_Mono, Lora } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import { Toaster } from "@/components/ui/sonner";

// Public Sans - the USWDS (US Web Design System) typeface, built for
// civic/government data tools: high legibility at small sizes for dense
// tables, distinct from the default Next.js starter font (Geist).
const publicSans = Public_Sans({
  variable: "--font-public-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Display face for headings/branding app-wide - data tables and form inputs
// stay on Public Sans for maximum legibility at small sizes.
const lora = Lora({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Holistic Assessment Management System",
  description: "A comprehensive assessment system for DHIS2",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${publicSans.variable} ${geistMono.variable} ${lora.variable} antialiased`}
      >
        <AuthProvider>
          {children}
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
