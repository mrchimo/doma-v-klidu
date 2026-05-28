import Link from "next/link";
import { signOutAction } from "@/app/actions";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function Shell({ children }: { children: React.ReactNode }) {
  return <main className="mx-auto min-h-screen w-full max-w-6xl px-4 py-5 sm:px-6 lg:px-8">{children}</main>;
}

export function Header({ role }: { role?: string }) {
  const dashboardHref = role === "admin" ? "/admin" : role === "owner" ? "/owner/dashboard" : role ? "/sitter/dashboard" : "/sign-in";

  return (
    <header className="mb-6 flex items-center justify-between gap-4">
      <Link href="/" className="text-lg font-bold tracking-tight text-forest-800">
        Doma v klidu
      </Link>
      <nav className="flex items-center gap-1 text-sm sm:gap-2">
        <Link className="rounded-full px-3 py-2 font-medium text-forest-800 hover:bg-white/70" href="/sitters">
          Sitteři
        </Link>
        {role ? (
          <Link className="rounded-full px-3 py-2 font-medium text-forest-800 hover:bg-white/70" href={dashboardHref}>
            Přehled
          </Link>
        ) : null}
        {role ? (
          <form action={signOutAction}>
            <button className="rounded-full bg-forest-700 px-4 py-2 font-semibold text-white hover:bg-forest-800">Odhlásit</button>
          </form>
        ) : (
          <Link className="rounded-full bg-forest-700 px-4 py-2 font-semibold text-white hover:bg-forest-800" href="/sign-in">
            Přihlásit
          </Link>
        )}
      </nav>
    </header>
  );
}

export function Card({ children, className, ...props }: React.ComponentProps<"section">) {
  return <section className={cn("rounded-lg border border-forest-100 bg-white p-4 shadow-soft", className)} {...props}>{children}</section>;
}

export function ButtonLink({ href, children, variant = "primary" }: { href: string; children: React.ReactNode; variant?: "primary" | "secondary" }) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex min-h-11 items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold",
        variant === "primary" ? "bg-forest-700 text-white hover:bg-forest-800" : "border border-forest-200 bg-white text-forest-800 hover:bg-forest-50"
      )}
    >
      {children}
    </Link>
  );
}

export function SubmitButton({ children, className }: { children: React.ReactNode; className?: string }) {
  return <button className={cn("min-h-11 rounded-lg bg-forest-700 px-4 py-2 text-sm font-semibold text-white hover:bg-forest-800", className)}>{children}</button>;
}

export function Field({ label, name, children }: { label: string; name?: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-1.5 text-sm font-medium text-forest-800" htmlFor={name}>
      <span>{label}</span>
      {children}
    </label>
  );
}

export const inputClass = "min-h-11 rounded-lg border border-forest-100 bg-white px-3 py-2 text-ink outline-none ring-forest-600/20 focus:ring-4";
export const textAreaClass = "min-h-28 rounded-lg border border-forest-100 bg-white px-3 py-2 text-ink outline-none ring-forest-600/20 focus:ring-4";

export function Badge({ children, tone = "green" }: { children: React.ReactNode; tone?: "green" | "amber" | "muted" | "red" }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-1 text-xs font-semibold",
        tone === "green" && "bg-forest-50 text-forest-800",
        tone === "amber" && "bg-amber-100 text-amber-900",
        tone === "muted" && "bg-stone-100 text-stone-700",
        tone === "red" && "bg-red-100 text-red-800"
      )}
    >
      {children}
    </span>
  );
}

export function EmptyState({ title, text, action }: { title: string; text: string; action?: React.ReactNode }) {
  return (
    <Card className="text-center shadow-none">
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-stone-600">{text}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </Card>
  );
}

export function InfoBox({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
      <p className="text-sm font-semibold text-amber-950">{title}</p>
      <div className="mt-1 text-sm leading-6 text-stone-700">{children}</div>
    </div>
  );
}
