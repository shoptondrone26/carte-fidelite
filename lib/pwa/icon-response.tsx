import { ImageResponse } from "next/og";

export function pwaIconImage(size: number) {
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
          background: "linear-gradient(145deg, #18181b 0%, #09090b 55%, #27272a 100%)",
          borderRadius: size >= 180 ? size * 0.22 : size * 0.18,
          border: "3px solid rgba(251,191,36,0.35)",
          boxShadow: "0 12px 40px rgba(0,0,0,0.45)",
        }}
      >
        <div
          style={{
            fontSize: size * 0.22,
            fontWeight: 700,
            letterSpacing: "-0.04em",
            color: "#fafafa",
            fontFamily: "system-ui, sans-serif",
          }}
        >
          Carte
        </div>
        <div
          style={{
            marginTop: size * 0.04,
            fontSize: size * 0.065,
            fontWeight: 600,
            letterSpacing: "0.35em",
            textTransform: "uppercase",
            color: "rgba(251,191,36,0.9)",
            fontFamily: "system-ui, sans-serif",
          }}
        >
          Fidélité
        </div>
      </div>
    ),
    { width: size, height: size },
  );
}
