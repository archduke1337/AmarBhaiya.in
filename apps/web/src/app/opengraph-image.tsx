import { ImageResponse } from "next/og";

export const alt =
  "amarbhaiya.in — Learn from Bhaiya. School-first learning for Class 6 to 12 students.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
          backgroundColor: "#0e0e1a",
          color: "#f7f3ea",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div
            style={{
              width: "28px",
              height: "28px",
              borderRadius: "999px",
              backgroundColor: "#F5A623",
            }}
          />
          <div style={{ fontSize: "28px", fontWeight: 700, letterSpacing: "0.06em" }}>
            amarbhaiya.in
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          <div
            style={{
              fontSize: "84px",
              fontWeight: 900,
              lineHeight: 1.05,
              letterSpacing: "-0.04em",
            }}
          >
            Learn from Bhaiya.
          </div>
          <div style={{ fontSize: "34px", opacity: 0.75, maxWidth: "900px" }}>
            Notes, courses, and practical guidance for Class 6 to 12 students —
            with skills and career growth layered in later.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "20px",
            fontSize: "22px",
            opacity: 0.6,
          }}
        >
          <span>School-first learning</span>
          <span style={{ width: "8px", height: "8px", borderRadius: "999px", backgroundColor: "#F5A623" }} />
          <span>Made in India</span>
        </div>
      </div>
    ),
    size
  );
}