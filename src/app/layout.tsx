import type { Metadata } from "next";
import { Instrument_Sans, JetBrains_Mono } from "next/font/google";
import { ToastProvider } from "@/components/kit/toast";
import "@/styles/globals.scss";

const instrument = Instrument_Sans({
  variable: "--font-instrument",
  subsets: ["latin"],
});

const jetbrains = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AI Academy",
  description: "Leer effectief en verantwoord werken met AI.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="nl">
      <body className={`${instrument.variable} ${jetbrains.variable}`}>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
