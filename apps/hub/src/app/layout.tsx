import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Khai Space Hub — Internal Directory & Projects",
  description: "Internal workspace and project directory for Khai Space.",
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
      <body className="antialiased selection:bg-[#347A63]/15 selection:text-[#0C2340]">
        {children}
      </body>
    </html>
  );
}
