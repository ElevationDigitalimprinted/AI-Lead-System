import Link from "next/link";
import { signInAction } from "@/actions/auth";
import { AuthForm, Field } from "@/components/auth/auth-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; confirmed?: string; error?: string }>;
}) {
  const params = await searchParams;

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-6 py-16">
      <Link href="/" className="mb-8 text-sm font-semibold uppercase tracking-[0.14em] text-ink">
        Elevation Pipeline
      </Link>
      <h1 className="text-4xl font-semibold tracking-tight text-ink">Welcome back.</h1>
      <p className="mt-2 text-muted">Sign in to your Elevation Pipeline workspace.</p>
      {params.confirmed === "0" ? (
        <p className="mt-4 rounded-lg border border-line bg-card px-3 py-2 text-sm text-muted">
          Check your email to confirm the account, then sign in.
        </p>
      ) : null}
      {params.error ? (
        <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          Authentication failed. Try signing in again.
        </p>
      ) : null}
      <div className="mt-8">
        <AuthForm action={signInAction} submitLabel="Sign in">
          <input type="hidden" name="next" value={params.next ?? "/dashboard"} />
          <Field
            label="Email"
            name="email"
            type="email"
            required
            autoComplete="email"
          />
          <Field
            label="Password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
          />
        </AuthForm>
      </div>
      <p className="mt-6 text-sm text-muted">
        New shop?{" "}
        <Link href="/signup" className="font-medium text-ink underline">
          Create an account
        </Link>
      </p>
    </div>
  );
}
