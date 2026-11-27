import { cookies } from "next/headers";
import { CrewHQ } from "@/components/crew-hq";
import { LoginGate } from "@/components/login-gate";
import { VIEW_COOKIE, verifyViewToken, viewPassword } from "@/lib/view-auth";

export const instant = false;

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ denied?: string | string[] }>;
}) {
  const jar = await cookies();
  if (!verifyViewToken(jar.get(VIEW_COOKIE)?.value)) {
    const params = await searchParams;
    const denied = params.denied === "1" || (Array.isArray(params.denied) && params.denied.includes("1"));
    return <LoginGate denied={denied} configured={viewPassword() !== null} />;
  }
  return <CrewHQ />;
}
