import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { useState } from "react";
import { api } from "@/lib/api";
import { setToken, type Role } from "@/lib/auth";

type Form = {
  name: string;
  email: string;
  password: string;
  role: Role;
};

export const Route = createFileRoute("/register")({
  head: () => ({ meta: [{ title: "Register" }] }),
  component: RegisterPage,
});

function RegisterPage() {
  const navigate = useNavigate();
  const [serverError, setServerError] = useState<string | null>(null);
  const { register, handleSubmit, formState } = useForm<Form>({
    defaultValues: { role: "USER" },
  });

  async function onSubmit(values: Form) {
    setServerError(null);
    try {
      const { data } = await api.post("/api/auth/register", values);
      const token = data?.token ?? data?.accessToken ?? data?.jwt;
      if (token) {
        setToken(token);
        navigate({ to: "/" });
      } else {
        navigate({ to: "/login" });
      }
    } catch (err: any) {
      setServerError(
        err?.response?.data?.message ??
          err?.message ??
          "Registration failed",
      );
    }
  }

  return (
    <div className="mx-auto max-w-sm px-4 py-16">
      <h1 className="text-2xl font-semibold">Create an account</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
        <label className="block">
          <span className="text-sm">Name</span>
          <input
            className="mt-1 w-full rounded border px-3 py-2 text-sm"
            {...register("name", { required: "Name is required" })}
          />
          {formState.errors.name && (
            <span className="text-xs text-destructive">
              {formState.errors.name.message}
            </span>
          )}
        </label>

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
            autoComplete="new-password"
            className="mt-1 w-full rounded border px-3 py-2 text-sm"
            {...register("password", {
              required: "Password is required",
              minLength: { value: 8, message: "Minimum 8 characters" },
            })}
          />
          {formState.errors.password && (
            <span className="text-xs text-destructive">
              {formState.errors.password.message}
            </span>
          )}
        </label>

        <label className="block">
          <span className="text-sm">Role</span>
          <select
            className="mt-1 w-full rounded border px-3 py-2 text-sm"
            {...register("role", { required: true })}
          >
            <option value="USER">USER</option>
            <option value="ADMIN">ADMIN</option>
          </select>
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
          {formState.isSubmitting ? "Creating…" : "Create account"}
        </button>
      </form>

      <p className="mt-4 text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link to="/login" className="underline">
          Login
        </Link>
      </p>
    </div>
  );
}
