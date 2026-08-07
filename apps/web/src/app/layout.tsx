import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { PwaRegister } from "@/components/pwa-register";
import { ThemeProvider } from "@/shared/theme/theme-provider";
import { AppShell } from "@/components/layout/app-shell";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: { default: "GrowPilot", template: "%s · GrowPilot" },
  description: "AI Personal Growth OS",
  applicationName: "GrowPilot",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "GrowPilot" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#6147d7",
};

// FOUC-prevention bootstrap: read persisted theme/motion before React
// hydrates and set html attributes so the first paint uses the right theme.
const THEME_BOOTSTRAP = `(function(){try{
  var t=localStorage.getItem("growpilot.theme.v1");
  var m=localStorage.getItem("growpilot.motion.v1");
  var d=document.documentElement;
  d.setAttribute("data-theme", t==="night"||t==="dusk" ? t : "day");
  d.setAttribute("data-motion", m==="full"||m==="reduced"||m==="off" ? m : "system");
}catch(e){}})();`;

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOTSTRAP }} />
      </head>
      <body>
        <PwaRegister />
        <ThemeProvider>
          <AppShell>{children}</AppShell>
        </ThemeProvider>
      </body>
    </html>
  );
}
