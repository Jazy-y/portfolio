import { ImageResponse } from "next/og";
import { profile } from "@/content/profile";

export const alt = `${profile.name} — ${profile.shortTitle}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          background: "radial-gradient(900px 500px at 85% 0%, rgba(45,212,191,0.28), transparent 60%), #05070c",
          color: "white",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 18,
              border: "2px solid rgba(94,234,212,0.6)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#99f6e4",
              fontSize: 26,
              fontWeight: 700,
            }}
          >
            YM
          </div>
          <div style={{ fontSize: 24, color: "#94a3b8", letterSpacing: 4 }}>PORTFOLIO</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 92, fontWeight: 700, lineHeight: 1 }}>{profile.name}</div>
          <div style={{ fontSize: 36, color: "#5eead4", marginTop: 18 }}>{profile.title}</div>
          <div style={{ fontSize: 26, color: "#cbd5e1", marginTop: 26, maxWidth: 900 }}>
            React · Next.js · React Native · TypeScript · Firebase · Node.js
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 22, color: "#64748b" }}>
          <span>github.com/{profile.githubHandle}</span>
          <span>{profile.location}</span>
        </div>
      </div>
    ),
    size,
  );
}
