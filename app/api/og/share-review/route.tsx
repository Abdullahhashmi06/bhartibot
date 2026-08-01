import { ImageResponse } from "next/og";

export const runtime = "edge";

/**
 * GET /api/og/share-review?name=...&position=...&org=...&score=...
 *
 * Generates a dynamic Open Graph image (1200×630 PNG) for social previews
 * of shared candidate reviews. The image includes:
 *   - InternIQ branded header
 *   - Candidate name
 *   - Position & organization
 *   - AI match score (if provided)
 *
 * Edge Runtime — fast, serverless, globally distributed.
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const name = searchParams.get("name") ?? "Candidate";
    const position = searchParams.get("position") ?? "Internship";
    const org = searchParams.get("org") ?? "Organization";
    const score = searchParams.get("score");

    // Load Inter font for consistent branding across all edge workers
    const fontData = await fetch(
      "https://fonts.cdnfonts.com/s/19795/Inter_18pt-Bold.woff"
    ).then((res) => res.arrayBuffer());

    const fontDataRegular = await fetch(
      "https://fonts.cdnfonts.com/s/19795/Inter_18pt-Regular.woff"
    ).then((res) => res.arrayBuffer());

    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            background: "linear-gradient(135deg, #0B1F3A 0%, #16233B 100%)",
            fontFamily: "Inter",
          }}
        >
          {/* Inner content container with subtle grid pattern */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              flex: 1,
              margin: 24,
              padding: 40,
              borderRadius: 20,
              background:
                "linear-gradient(180deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 100%)",
              border: "1px solid rgba(255,255,255,0.12)",
              justifyContent: "space-between",
            }}
          >
            {/* Top section: Brand + Tag */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
              }}
            >
              {/* InternIQ Logo */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    background:
                      "linear-gradient(135deg, #17C6B5 0%, #6F52ED 100%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
                      stroke="white"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <span
                  style={{
                    fontSize: 24,
                    fontWeight: 800,
                    color: "#FFFFFF",
                    letterSpacing: "-0.5px",
                  }}
                >
                  InternIQ
                </span>
              </div>

              {/* Badge */}
              <div
                style={{
                  display: "flex",
                  padding: "8px 16px",
                  borderRadius: 100,
                  background: "rgba(23, 198, 181, 0.2)",
                  border: "1px solid rgba(23, 198, 181, 0.3)",
                  fontSize: 14,
                  fontWeight: 600,
                  color: "#17C6B5",
                }}
              >
                AI Candidate Review
              </div>
            </div>

            {/* Center section: Candidate details */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 12,
              }}
            >
              {/* Candidate Name */}
              <h1
                style={{
                  fontSize: 52,
                  fontWeight: 800,
                  color: "#FFFFFF",
                  margin: 0,
                  lineHeight: 1.1,
                  letterSpacing: "-1px",
                  maxWidth: 700,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {name}
              </h1>

              {/* Position & Organization */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 16,
                  fontSize: 20,
                  color: "rgba(255,255,255,0.7)",
                }}
              >
                <span style={{ fontWeight: 500 }}>{position}</span>
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: "#17C6B5",
                    display: "inline-block",
                  }}
                />
                <span style={{ fontWeight: 400 }}>{org}</span>
              </div>
            </div>

            {/* Bottom section: Score + Meta */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-end",
              }}
            >
              {/* Match Score */}
              {score && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                  }}
                >
                  <div
                    style={{
                      width: 64,
                      height: 64,
                      borderRadius: 16,
                      background:
                        "linear-gradient(135deg, #17C6B5 0%, #0F9B8E 100%)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 28,
                      fontWeight: 800,
                      color: "#FFFFFF",
                    }}
                  >
                    {score}%
                  </div>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 2,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 14,
                        fontWeight: 600,
                        color: "#17C6B5",
                        textTransform: "uppercase",
                        letterSpacing: "1px",
                      }}
                    >
                      AI Match Score
                    </span>
                    <span
                      style={{
                        fontSize: 13,
                        color: "rgba(255,255,255,0.5)",
                      }}
                    >
                      Evaluated against job requirements
                    </span>
                  </div>
                </div>
              )}

              {/* Footer */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  fontSize: 13,
                  color: "rgba(255,255,255,0.4)",
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
                    stroke="rgba(255,255,255,0.4)"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span>Read-Only · Securely Shared</span>
              </div>
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
        fonts: [
          {
            name: "Inter",
            data: fontData,
            weight: 800,
            style: "normal",
          },
          {
            name: "Inter",
            data: fontDataRegular,
            weight: 400,
            style: "normal",
          },
        ],
      }
    );
  } catch (err) {
    // If image generation fails, return a plain response.
    // Social platforms will fall back to og:title / og:description.
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[OG Image] Generation failed:", message);

    return new Response("OG image generation failed", { status: 500 });
  }
}
