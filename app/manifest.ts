import type { MetadataRoute } from "next";

/**
 * Web App Manifest — generated at /manifest.webmanifest by Next.js App Router.
 * Brand colors: deep emerald #0E8A6D → teal #17C6B5 → mint #4EE0B8.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "InternIQ",
    short_name: "InternIQ",
    description: "AI-powered Internship Recruitment Platform",
    id: "/",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait-primary",
    background_color: "#F7F9FC",
    theme_color: "#0E8A6D",
    categories: ["business", "productivity", "education"],
    lang: "en",
    dir: "ltr",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-256.png", sizes: "256x256", type: "image/png", purpose: "any" },
      { src: "/icons/icon-384.png", sizes: "384x384", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      {
        src: "/icons/maskable-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/monochrome-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "monochrome",
      },
    ],
    shortcuts: [
      {
        name: "Applicant Dashboard",
        short_name: "Dashboard",
        description: "Open your applicant dashboard",
        url: "/applicant",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }],
      },
      {
        name: "Find Internships",
        short_name: "Internships",
        description: "Browse recommended internships",
        url: "/applicant/internships",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }],
      },
      {
        name: "Saved Jobs",
        short_name: "Saved",
        description: "View your saved jobs",
        url: "/applicant/saved",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }],
      },
      {
        name: "Recruiter Dashboard",
        short_name: "Recruiter",
        description: "Open the recruiter dashboard",
        url: "/dashboard",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }],
      },
      {
        name: "Profile",
        short_name: "Profile",
        description: "Manage your profile",
        url: "/applicant/profile",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }],
      },
    ],
  };
}
