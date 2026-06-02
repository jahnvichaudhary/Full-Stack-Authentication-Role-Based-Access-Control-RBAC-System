import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { useState } from "react";
import { api } from "@/lib/api";
import { setToken } from "@/lib/auth";

type Form = { email: string; password: string };

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [{ title: "Login" }],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [serverError, setServerError] = useState<string | null>(null);
  const { register, handleSubmit, formState } = useForm<Form>();

  async function onSubmit(values: Form) {
    setServerError(null);
    try {
      const { data } = await api.post("/api/auth/login", values);
      const token = data?.token ?? data?.accessToken ?? data?.jwt;
      if (!token) throw new Error("No token in response");
      setToken(token);
      navigate({ to: "/" });
    } catch (err: any) {
      setServerError(
        err?.response?.data?.message ?? err?.message ?? "Login failed",
      );
    }
  }

  return (
    <div className="mx-auto max-w-sm px-4 py-16">
      <h1 className="text-2xl font-semibold">Login</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Sign in to your account.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
        <label className="block">
          <span className="text-sm">Email</span>
          <input
            type="email"
            autoComplete="email"
            className="mt-1 w-full rounded border px-3 py-2 text-sm"
            {...register("email", { required: "Email is required" })}
          />
          {formState.errors.email && (
            <span className="text-xs text-destructive">
              {formState.errors.email.message}
            </span>
          )}
        </label>

        <label className="block">
          <span className="text-sm">Password</span>
          <input
            type="password"
            autoComplete="current-password"
            className="mt-1 w-full rounded border px-3 py-2 text-sm"
            {...register("password", { required: "Password is required" })}
          />
          {formState.errors.password && (
            <span className="text-xs text-destructive">
              {formState.errors.password.message}
            </span>
          )}
        </label>

        {serverError && (
          <div className="rounded border border-destructive/40 bg-destructive/5 px-3 py-2 text-xs text-destructive">
            {serverError}
          </div>
        )}

        <button
          type="submit"
          disabled={formState.isSubmitting}
          className="w-full rounded bg-primary px-3 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60"
        >
          {formState.isSubmitting ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <p className="mt-4 text-sm text-muted-foreground">
        No account?{" "}
        <Link to="/register" className="underline">
          Register
        </Link>
      </p>
    </div>
  );
}
