/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
import "./src/env.js";

/** @type {import("next").NextConfig} */
const config = {
  allowedDevOrigins: ["umop-episdn.org"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "placehold.co",
      },
      {
        protocol: "https",
        hostname: "aux2ydyw5rlsjw67bialhehdom0tfmmb.lambda-url.us-east-1.on.aws",
      },
    ],
  },
};

export default config;
