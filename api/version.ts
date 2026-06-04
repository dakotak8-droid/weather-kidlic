import type { VercelRequest, VercelResponse } from "@vercel/node";

export default function handler(req: VercelRequest, res: VercelResponse) {
  res.status(200).json({
    prompt_version: "historical_archive_v1",
    generator_path: "api_generate_story",
    build_timestamp: "2026-06-04T19:32:55Z"
  });
}
