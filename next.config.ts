import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {};

export default nextConfig;

// Gives `next dev` access to the D1 binding (local SQLite under .wrangler/).
initOpenNextCloudflareForDev();
