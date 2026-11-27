import { readProvidedSecret, secretMatches } from "@/lib/store";
import { viewerFromRequest } from "@/lib/view-auth";

export type Access = "secret" | "viewer";

export function accessFromRequest(request: Request): Access | null {
  if (secretMatches(readProvidedSecret(request))) return "secret";
  if (viewerFromRequest(request)) return "viewer";
  return null;
}
