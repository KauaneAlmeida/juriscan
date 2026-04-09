import type { Metadata, Viewport } from "next";
import { Inter, Playfair_Display, DM_Sans } from "next/font/google";
import { Providers } from "@/lib/providers";
import { themeInitScript } from "@/lib/theme";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["700", "800"],
  variable: "--font-playfair",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-dm-sans",
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "Juriscan - Plataforma Jurídica Inteligente",
  description: "Plataforma de Jurimetria, IA Jurídica e Automação para Advogados",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        {/* Anti-flash: applies the persisted theme class on <html> before
            React hydrates so users with dark mode saved don't see a white
            flash on first paint. */}
        <script
          dangerouslySetInnerHTML={{ __html: themeInitScript }}
        />
      </head>
      <body
        className={`${inter.variable} ${playfair.variable} ${dmSans.variable} font-inter antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
