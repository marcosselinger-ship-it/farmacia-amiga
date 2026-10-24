import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Farmácia Amiga — Alertas de medicação para pacientes e farmácias",
  description:
    "Plataforma que conecta sua farmácia aos seus pacientes com alertas de horário de medicação, atendimento farmacêutico e orientação sem fila.",
  openGraph: {
    title: "Farmácia Amiga",
    description:
      "Alertas de medicação, atendimento farmacêutico e orientação profissional sem precisar enfrentar uma fila.",
    locale: "pt_BR",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
