import type { Metadata } from "next";
import { Roboto } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import { NotificationsProvider } from "@/components/notifications/NotificationsProvider";
import { AuthInitializer } from "@/components/auth/AuthInitializer";

// 🔤 Configuración de fuente Roboto (del Figma)
const roboto = Roboto({
  subsets: ["latin"],
  weight: ["300", "400", "500", "700", "900"],
  variable: "--font-roboto",
  display: "swap",
});

// 📝 Metadatos de Proogia
export const metadata: Metadata = {
  title: {
    default: "Proogia - PaaS para Desarrollo Impulsado por IA",
    template: "%s | Proogia",
  },
  description:
    "Sincronizá, desarrollá y simplificá con Proogia. Plataforma como Servicio (PaaS) para entornos de desarrollo con IA, patrones BFF y Sidecar, y sincronización en tiempo real.",
  keywords: [
    "PaaS",
    "desarrollo de software",
    "inteligencia artificial",
    "patrones de diseño",
    "BFF",
    "Sidecar",
    "sincronización tiempo real",
    "frontend development",
    "backend for frontend",
  ],
  authors: [{ name: "Proogia Team" }],
  creator: "Proogia",
  publisher: "STORYSINC",

  // 🖼️ Iconos y favicon
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/logo-icon.svg", sizes: "48x48", type: "image/svg+xml" },
    ],
    shortcut: "/favicon.svg",
    apple: "/logo-icon.svg",
  },

  // 🌐 URL base para Open Graph
  metadataBase: new URL("https://proogia.com"),

  // 🔗 Open Graph (Redes sociales)
  openGraph: {
    type: "website",
    locale: "es_ES",
    url: "https://proogia.com",
    siteName: "Proogia",
    title: "Proogia - PaaS para Desarrollo Impulsado por IA",
    description:
      "Sincronizá, desarrollá y simplificá con patrones de diseño avanzados y IA integrada.",
    images: [
      {
        url: "/logo.svg",
        width: 200,
        height: 60,
        alt: "Proogia Logo",
      },
    ],
  },

  // 🐦 Twitter Card
  twitter: {
    card: "summary_large_image",
    title: "Proogia - PaaS para Desarrollo Impulsado por IA",
    description:
      "Sincronizá, desarrollá y simplificá con patrones de diseño avanzados y IA integrada.",
    images: ["/logo.svg"],
    creator: "@proogia",
  },

  // 🤖 Robots
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={roboto.variable}>
      <body className={`${roboto.className} antialiased`}>
        <NotificationsProvider />
        <AuthInitializer />
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            style: { fontFamily: "Roboto, sans-serif", fontWeight: 500 },
            success: { style: { background: "#e6f9ec", color: "#1a7f37" } },
            error: { style: { background: "#fff0f0", color: "#d32f2f" } },
          }}
        />
      </body>
    </html>
  );
}
