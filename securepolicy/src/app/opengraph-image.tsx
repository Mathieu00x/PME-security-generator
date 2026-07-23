import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <svg width="96" height="96" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M16 2L4 7V16C4 22.6 9.2 28.8 16 30C22.8 28.8 28 22.6 28 16V7L16 2Z" fill="#3b82f6" />
            <path
              d="M16 5.5L7 9.5V16C7 21 11.2 25.8 16 27C20.8 25.8 25 21 25 16V9.5L16 5.5Z"
              fill="none"
              stroke="white"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
            <path
              d="M11.5 16L14.5 19L20.5 13"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <div style={{ display: "flex", fontSize: 80, fontWeight: 700, color: "white", letterSpacing: -2 }}>
            Secure<span style={{ color: "#60a5fa" }}>Pilot</span>
          </div>
        </div>
        <div style={{ display: "flex", marginTop: 24, fontSize: 28, color: "#cbd5e1" }}>
          Scan. Secure. Comply.
        </div>
      </div>
    ),
    { ...size }
  );
}
