import "./globals.css";
import { Inter } from "next/font/google";
import type { Metadata } from "next";
import PageNotFound from "@/features/island/components/Shared/PageNotFound";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "404 - Page Not Found",
  description: "The page you are looking for does not exist.",
};

export default function GlobalNotFound() {
  return (
    <html lang="en" className={inter.className}>
      <body>
        <PageNotFound />
      </body>
    </html>
  );
}
