import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Khai Space Hub — Command Center",
  description: "Internal command center and project telemetry dashboard for Khai Space.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased selection:bg-cyan-500/20 selection:text-cyan-300">
        {children}
      </body>
    </html>
  );
}
