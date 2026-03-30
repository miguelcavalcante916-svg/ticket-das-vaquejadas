import type { Metadata } from "next";
import { Bebas_Neue, Inter } from "next/font/google";

import { cn } from "@/lib/utils";
import "./globals.css";

const fontSans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

const fontDisplay = Bebas_Neue({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-display",
});

export const metadata: Metadata = {
  title: {
    default: "Ticket das Vaquejadas",
    template: "%s • Ticket das Vaquejadas",
  },
  description:
    "Plataforma profissional para divulgação e venda antecipada de ingressos de vaquejadas no Brasil.",
  applicationName: "Ticket das Vaquejadas",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="dark">
      <body
        className={cn(
          fontSans.variable,
          fontDisplay.variable,
          "min-h-screen bg-background text-foreground font-sans antialiased",
        )}
      >
        {children}
      </body>
    </html>
  );
}
