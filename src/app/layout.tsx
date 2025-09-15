import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

import Header from "@/components/header";
import { Toaster } from "sonner";

import { ClerkProvider } from '@clerk/nextjs'

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: "Welth",
  description: "One stop Finance Platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body
          className={`${inter.className}`}
        >
          {/* header */}
          <Header />

          <main className="min-h-screen">{children}</main>
          <Toaster richColors />

          {/* footer */}
          <footer className="bg-blue-50 py-12">
            <div className="container mx-auto px-4 text-center text-gray-600">
              <p>Made with 🩷 by Naman</p>
            </div>
          </footer>
        </body>
      </html>
    </ClerkProvider>
  );
}
