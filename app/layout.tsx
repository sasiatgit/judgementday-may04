import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Tamil Nadu Election Results Dashboard",
  description: "SSR election results dashboard for Tamil Nadu assembly constituencies."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
