import type { Metadata } from "next";
import { Montserrat, DM_Mono } from "next/font/google";
import "./globals.css";

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-display",
});

const dmMono = DM_Mono({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "Tecidex Client",
  description: "Painel de gestão do agente de IA Nexuz",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`dark ${montserrat.variable} ${dmMono.variable}`}>
      <body className="antialiased">
        {/* Emerald ambient blobs */}
        <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
          <div
            className="absolute rounded-full"
            style={{
              width: "60vw", height: "60vw",
              top: "-20%", right: "-15%",
              background: "radial-gradient(circle, rgba(5,150,105,0.09) 0%, transparent 70%)",
              filter: "blur(80px)",
              animation: "emerald-drift 20s ease-in-out infinite alternate",
            }}
          />
          <div
            className="absolute rounded-full"
            style={{
              width: "40vw", height: "40vw",
              bottom: "-15%", left: "-10%",
              background: "radial-gradient(circle, rgba(5,150,105,0.06) 0%, transparent 70%)",
              filter: "blur(100px)",
              animation: "emerald-drift 28s ease-in-out infinite alternate-reverse",
            }}
          />
        </div>
        <div className="relative z-[1]">
          {children}
        </div>
      </body>
    </html>
  );
}
