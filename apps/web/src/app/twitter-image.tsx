import { ImageResponse } from "next/og";

export const alt =
  "amarbhaiya.in — Learn from Bhaiya. School-first learning for Class 6 to 12 students.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function TwitterImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#0e0e1a",
          color: "#f7f3ea",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "28px",
          }}
        >
          <div
            style={{
              width: "120px",
              height: "120px",
              borderRadius: "999px",
              backgroundColor: "#F5A623",
            }}
          />
          <div
            style={{
              fontSize: "72px",
              fontWeight: 900,
              letterSpacing: "-0.04em",
            }}
          >
            Learn from Bhaiya.
          </div>
          <div style={{ fontSize: "32px", opacity: 0.75 }}>
            Notes · Courses · Guidance — for Class 6 to 12 students
          </div>
        </div>
      </div>
    ),
    size
  );
}