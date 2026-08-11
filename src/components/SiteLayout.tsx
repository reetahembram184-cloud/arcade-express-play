import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

const NAV = [
  { to: "/", label: "Home" },
  { to: "/games", label: "Games" },
  { to: "/leaderboard", label: "Leaderboard" },
  { to: "/developer", label: "Developer" },
  { to: "/about", label: "About" },
] as const;

const MOBILE_NAV = NAV.filter((n) => n.label !== "About");

function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2" aria-label="OP Play Games home">
      <span
        aria-hidden
        className="grid h-9 w-9 place-items-center rounded-xl bg-primary font-display text-sm font-bold text-primary-foreground"
      >
        OP
      </span>
      <span className="flex flex-col leading-none">
        <span className="font-display text-base font-bold">OP Play Games</span>
        <span className="text-[0.62rem] uppercase tracking-[0.22em] text-muted-foreground">
          Play. Score. Have Fun.
        </span>
      </span>
    </Link>
  );
}

export function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur-lg">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <Logo />
          <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                activeProps={{ className: "bg-surface-2 text-foreground" }}
                className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-surface-2 hover:text-foreground"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <Link
            to="/games"
            className="hidden rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 md:inline-flex"
          >
            Play Now
          </Link>
        </div>
      </header>

      <main className="flex-1 pb-24 md:pb-0">{children}</main>

      <footer className="border-t border-border/70 bg-surface/40">
        <div className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-10 pb-28 sm:grid-cols-2 md:grid-cols-3 md:pb-10">
          <div className="space-y-3">
            <Logo />
            <p className="max-w-xs text-sm text-muted-foreground">
              Free browser mini games with instant play, local high scores and a
              developer embed system.
            </p>
          </div>
          <div className="space-y-2 text-sm">
            <h3 className="font-display text-sm uppercase tracking-[0.2em] text-muted-foreground">
              Explore
            </h3>
            {NAV.map((item) => (
              <Link key={item.to} to={item.to} className="block text-muted-foreground hover:text-foreground">
                {item.label}
              </Link>
            ))}
          </div>
          <div className="space-y-2 text-sm">
            <h3 className="font-display text-sm uppercase tracking-[0.2em] text-muted-foreground">
              Developers
            </h3>
            <Link to="/developer" className="block text-muted-foreground hover:text-foreground">
              Developer portal
            </Link>
            <Link to="/developer/login" className="block text-muted-foreground hover:text-foreground">
              Sign in
            </Link>
            <Link to="/developer/register" className="block text-muted-foreground hover:text-foreground">
              Create account
            </Link>
          </div>
        </div>
        <p className="px-4 pb-6 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} OP Play Games. All games are original works.
        </p>
      </footer>

      <nav
        aria-label="Mobile"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-border/70 bg-background/95 backdrop-blur-lg md:hidden"
      >
        <ul className="mx-auto flex max-w-md">
          {MOBILE_NAV.map((item) => (
            <li key={item.to} className="flex-1">
              <Link
                to={item.to}
                activeProps={{ className: "text-primary" }}
                className="flex flex-col items-center gap-1 px-2 py-3 text-[0.7rem] font-medium text-muted-foreground"
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
