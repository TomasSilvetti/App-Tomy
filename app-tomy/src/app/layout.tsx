import type { Metadata, Viewport } from "next";
import { Archivo_Black, Space_Grotesk, Geist_Mono } from "next/font/google";
import { Sidebar } from "@/components/Sidebar";
import { PushRegistrar } from "@/components/PushRegistrar";
import "./globals.css";

const archivoBlack = Archivo_Black({
  variable: "--font-archivo-black",
  subsets: ["latin"],
  weight: "400",
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Tomy",
  description: "App personal de preguntas con recordatorios",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#253551",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="es"
      className={`${archivoBlack.variable} ${spaceGrotesk.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col md:flex-row bg-surface">
        <Sidebar />
        <main className="flex-1 min-w-0">{children}</main>
        <PushRegistrar />
      </body>
    </html>
  );
}
