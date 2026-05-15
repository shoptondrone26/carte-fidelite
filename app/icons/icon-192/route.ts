import { pwaIconImage } from "@/lib/pwa/icon-response";

export const runtime = "edge";

export async function GET() {
  return pwaIconImage(192);
}
