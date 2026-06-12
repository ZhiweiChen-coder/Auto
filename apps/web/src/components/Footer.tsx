/**
 * Global footer. Carries the trademark disclaimer required because tool cards
 * display third-party brand logos for identification (nominative use). Keep the
 * "no affiliation / no endorsement" language — it's what keeps that use safe.
 */
export function Footer() {
  return (
    <footer className="mt-auto border-t border-canvas-border px-6 py-6 text-center text-xs leading-relaxed text-canvas-muted sm:px-8">
      <p className="mx-auto max-w-2xl">
        Product names and logos belong to their owners. Auto is an independent
        directory — not affiliated with or endorsed by any listed tool, and uses
        logos only to identify them.
      </p>
      <p className="mt-2 text-canvas-muted/80">
        © {new Date().getFullYear()} Auto
      </p>
    </footer>
  );
}
