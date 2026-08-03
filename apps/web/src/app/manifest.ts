import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "GrowPilot — AI Personal Growth OS",
    short_name: "GrowPilot",
    description: "把长期目标变成每日行动、记录和复盘。",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#f3f6f4",
    theme_color: "#6147d7",
    orientation: "portrait-primary",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" }],
  };
}
