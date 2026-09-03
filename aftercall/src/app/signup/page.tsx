import Link from "next/link";
import { signUpAction } from "@/actions/auth";
import { AuthForm, Field } from "@/components/auth/auth-form";

export default function SignupPage() {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-6 py-16">
      <Link href="/" className="mb-8 text-sm font-semibold uppercase tracking-[0.14em] text-ink">
        Elevation Pipeline
      </Link>
      <h1 className="text-4xl font-semibold tracking-tight text-ink">Open your workspace.</h1>
      <p className="mt-2 text-muted">
        One owner account, one organization, isolated lead data.
      </p>
      <div className="mt-8">
        <AuthForm action={signUpAction} submitLabel="Create shop">
          <Field label="Your name" name="fullName" required autoComplete="name" />
          <Field
            label="Shop name"
            name="organizationName"
            required
            placeholder="Coastal Pressure Washing"
          />
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
            autoComplete="new-password"
          />
          <Field
            label="Shop phone"
            name="businessPhone"
            placeholder="+17205551234"
          />
          <Field
            label="Service area"
            name="serviceArea"
            placeholder="Myrtle Beach, SC"
          />
        </AuthForm>
      </div>
      <p className="mt-6 text-sm text-muted">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-ink underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
