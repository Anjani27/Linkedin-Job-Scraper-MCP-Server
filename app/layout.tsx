import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LinkedIn Job Scraper — Dashboard",
  description:
    "Powerful LinkedIn job scraper with real-time dashboard. Search, filter, and export job listings effortlessly.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body suppressHydrationWarning>
        <div className="bg-mesh" />
        <div style={{ position: "relative", zIndex: 1 }}>{children}</div>
      </body>
    </html>
  );
}
