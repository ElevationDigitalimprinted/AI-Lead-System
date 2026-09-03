import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-6">
      <h1 className="text-4xl font-semibold tracking-tight text-ink">Page not found</h1>
      <p className="mt-2 text-muted">That route does not exist in Elevation Pipeline.</p>
      <Link href="/" className="mt-6 font-medium text-ink underline">
        Back home
      </Link>
    </div>
  );
}
