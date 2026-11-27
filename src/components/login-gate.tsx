import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function LoginGate({ denied, configured }: { denied: boolean; configured: boolean }) {
  return (
    <main className="grid min-h-dvh place-items-center bg-[#07091a] px-4 text-white">
      <form action="/api/login" method="post" className="w-full max-w-sm rounded-3xl border border-white/10 bg-[#12142b] p-6 shadow-2xl">
        <input className="sr-only" type="text" name="username" autoComplete="username" defaultValue="enzo" tabIndex={-1} readOnly aria-hidden />
        <p className="font-display text-3xl leading-none">The Crew HQ</p>
        <p className="mt-2 text-sm text-white/70">Private floor. The viewer password opens it. Bots still check in with their own secret.</p>
        {configured ? null : (
          <p className="mt-4 rounded-2xl bg-amber-300/15 px-3 py-2 text-sm text-amber-100">
            This host has not set CREW_HQ_VIEW_PASSWORD, so the floor stays locked.
          </p>
        )}
        {denied ? (
          <p className="mt-4 rounded-2xl bg-rose-400/15 px-3 py-2 text-sm text-rose-100">That password didn&apos;t match.</p>
        ) : null}
        <label className="mt-5 block text-sm font-extrabold" htmlFor="password">
          Viewer password
          <Input
            id="password"
            className="mt-2"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            disabled={!configured}
          />
        </label>
        <Button className="mt-4 w-full" type="submit" disabled={!configured}>
          Open the floor
        </Button>
      </form>
    </main>
  );
}
