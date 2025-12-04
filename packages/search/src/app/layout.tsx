import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Wisdom Island - Search",
  description: "A gamified knowledge sharing platform.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased m-0 p-0 min-h-screen bg-[#1a1a1a]">
        {children}
      </body>
    </html>
  );
}
