import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, Lock, ArrowRight, Loader2, AlertCircle } from "lucide-react";
import { AuthLayout } from "../layouts/AuthLayout";
import { Button } from "../components/ui";
import { appConfig } from "../config/app";
import { mockSignIn } from "../services/api";

interface FormErrors {
  email?: string;
  password?: string;
}

function validateEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitError(null);

    const nextErrors: FormErrors = {};
    if (!email) {
      nextErrors.email = "Enter your email address.";
    } else if (!validateEmail(email)) {
      nextErrors.email = "Enter a valid email address.";
    }
    if (!password) {
      nextErrors.password = "Enter your password.";
    } else if (password.length < 6) {
      nextErrors.password = "Password must be at least 6 characters.";
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setIsSubmitting(true);
    mockSignIn(email, password)
      .then((res) => {
        if (!res.success) {
          setSubmitError(res.message ?? "Couldn't sign in. Check your details and try again.");
          return;
        }
        navigate(appConfig.defaultAuthenticatedRoute);
      })
      .catch(() => {
        setSubmitError("Couldn't sign in. Check your details and try again.");
      })
      .finally(() => {
        setIsSubmitting(false);
      });
  }

  return (
    <AuthLayout>
      <div className="rounded-(--radius-xl) border border-border bg-surface p-6 shadow-(--shadow-md)">
        <div className="mb-6">
          <h1 className="text-[17px] font-semibold text-text-primary tracking-tight">
            Welcome back
          </h1>
          <p className="mt-1 text-[13px] text-text-secondary">
            Sign in to continue to {appConfig.name}.
          </p>
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          {submitError && (
            <div
              role="alert"
              className="flex items-start gap-2 rounded-(--radius-md) border border-error-500/30 bg-error-500/10 px-3 py-2.5 text-[12.5px] text-error-400"
            >
              <AlertCircle className="size-3.5 shrink-0 mt-0.5" />
              {submitError}
            </div>
          )}

          <div>
            <label
              htmlFor="email"
              className="mb-1.5 block text-[12px] font-medium text-text-secondary"
            >
              Email
            </label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-muted" />
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                disabled={isSubmitting}
                aria-invalid={Boolean(errors.email)}
                aria-describedby={errors.email ? "email-error" : undefined}
                className="h-10 w-full rounded-(--radius-md) border border-border-strong bg-surface-raised pl-9 pr-3 text-[13px] text-text-primary placeholder:text-text-muted outline-none transition-colors focus:border-accent-500 disabled:opacity-50"
              />
            </div>
            {errors.email && (
              <p id="email-error" className="mt-1.5 flex items-center gap-1 text-[12px] text-error-400">
                <AlertCircle className="size-3.5 shrink-0" />
                {errors.email}
              </p>
            )}
          </div>

          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label htmlFor="password" className="block text-[12px] font-medium text-text-secondary">
                Password
              </label>
              <button
                type="button"
                tabIndex={-1}
                className="text-[12px] text-text-muted hover:text-text-secondary transition-colors"
              >
                Forgot password?
              </button>
            </div>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-muted" />
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                disabled={isSubmitting}
                aria-invalid={Boolean(errors.password)}
                aria-describedby={errors.password ? "password-error" : undefined}
                className="h-10 w-full rounded-(--radius-md) border border-border-strong bg-surface-raised pl-9 pr-3 text-[13px] text-text-primary placeholder:text-text-muted outline-none transition-colors focus:border-accent-500 disabled:opacity-50"
              />
            </div>
            {errors.password && (
              <p id="password-error" className="mt-1.5 flex items-center gap-1 text-[12px] text-error-400">
                <AlertCircle className="size-3.5 shrink-0" />
                {errors.password}
              </p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full mt-2"
            isLoading={isSubmitting}
            icon={!isSubmitting ? <ArrowRight className="size-4" /> : <Loader2 className="size-4" />}
            iconPosition="right"
          >
            {isSubmitting ? "Signing in…" : "Sign in"}
          </Button>
        </form>
      </div>

      <p className="mt-5 text-center text-[12px] text-text-muted">
        New to {appConfig.name}?{" "}
        <button className="font-medium text-accent-400 hover:text-accent-300 transition-colors">
          Request access
        </button>
      </p>
    </AuthLayout>
  );
}
