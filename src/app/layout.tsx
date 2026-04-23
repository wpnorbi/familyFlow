import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import "./globals.css";
import SideNav from "@/components/SideNav";

const manrope = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "CsaládiNexus",
  description: "A te családod irányítóközpontja",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="hu" className="h-full">
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=block"
        />
      </head>
      <body
        className={`${manrope.className} flex min-h-screen w-full bg-background text-on-background antialiased`}
      >
        <SideNav />
        <main className="flex-1 md:ml-28 flex flex-col min-h-screen">
          {children}
        </main>
      </body>
    </html>
  );
}
