import { ImageResponse } from "next/og";

export const runtime = "edge";

/** Splash iPhone (format large commun) — fond brand, sans texte critique. */
export async function GET() {
  const w = 1284;
  const h = 2778;

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
          background: "linear-gradient(165deg, #09090b 0%, #18181b 40%, #27272a 100%)",
        }}
      >
        <div
          style={{
            fontSize: 96,
            fontWeight: 700,
            color: "#fafafa",
            letterSpacing: "-0.05em",
            fontFamily: "system-ui, sans-serif",
          }}
        >
          Carte
        </div>
        <div
          style={{
            marginTop: 28,
            fontSize: 28,
            fontWeight: 600,
            letterSpacing: "0.4em",
            textTransform: "uppercase",
            color: "rgba(251,191,36,0.95)",
            fontFamily: "system-ui, sans-serif",
          }}
        >
          Fidélité
        </div>
      </div>
    ),
    { width: w, height: h },
  );
}
