import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";

export const metadata: Metadata = {
  title: "Wisdom Island - Cloud",
  description: "Explore trending topics in Wisdom Island.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head />
      <body className="antialiased m-0 p-0">
        {/* TagCanvas library from official source */}
        <Script
          src="https://www.goat1000.com/tagcanvas.min.js"
          strategy="beforeInteractive"
        />
        {children}
      </body>
    </html>
  );
}
