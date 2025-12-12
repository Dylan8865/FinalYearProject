import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Wisdom Island Admin",
  description: "Admin portal for Wisdom Island.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-[#1E1E1E] antialiased m-0 p-0">
        {children}
      </body>
    </html>
  );
}
