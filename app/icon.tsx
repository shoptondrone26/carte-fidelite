import { pwaIconImage } from "@/lib/pwa/icon-response";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return pwaIconImage(32);
}
