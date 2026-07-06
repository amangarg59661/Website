import { ImageResponse } from "next/og";
import { site } from "@/config/site";

export const runtime = "edge";

export function GET() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: 80,
        background: "#171717",
        color: "#fbf9f9",
        fontFamily: "serif",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 16,
          fontSize: 22,
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          opacity: 0.65,
        }}
      >
        <div style={{ width: 8, height: 8, background: "#D4AF37", borderRadius: 999 }} />
        <span>
          {site.name} · Est {site.founded}
        </span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
        <div
          style={{
            fontSize: 96,
            lineHeight: 1,
            letterSpacing: "-0.045em",
            maxWidth: 940,
            fontWeight: 400,
          }}
        >
          The studio you hire when the work has to be right.
        </div>
        <div style={{ fontSize: 26, opacity: 0.75, maxWidth: 900, lineHeight: 1.4 }}>
          {site.description}
        </div>
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          fontSize: 20,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          opacity: 0.7,
        }}
      >
        <span>{site.hq}</span>
        <span>{site.url.replace(/^https?:\/\//, "")}</span>
      </div>
    </div>,
    { width: 1200, height: 630 },
  );
}
