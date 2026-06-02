import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { api } from "@/lib/api";
import { clearToken } from "@/lib/auth";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [{ title: "Dashboard" }] }),
  component: Dashboard,
});

function Dashboard() {
  const user = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) navigate({ to: "/login" });
  }, [user, navigate]);

  if (!user) return null;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <header className="flex items-center justify-between border-b pb-4">
        <div>
          <h1 className="text-xl font-semibold">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Signed in as {user.email ?? "unknown"} ({user.role ?? "no role"})
          </p>
        </div>
        <button
          onClick={() => {
            clearToken();
            window.dispatchEvent(new Event("auth:logout"));
            navigate({ to: "/login" });
          }}
          className="rounded border px-3 py-1.5 text-sm hover:bg-accent"
        >
          Logout
        </button>
      </header>

      <section className="mt-8 grid gap-4 md:grid-cols-2">
        <PublicCard />
        {user.role === "USER" || user.role === "ADMIN" ? <UserCard /> : null}
        {user.role === "ADMIN" ? <AdminCard /> : null}
      </section>

      {!user.role && (
        <p className="mt-6 text-sm text-muted-foreground">
          Your token didn't include a role we recognise. Check the JWT claims —
          this UI expects <code>role</code>, <code>roles</code>, or{" "}
          <code>authorities</code> with <code>USER</code> / <code>ADMIN</code>{" "}
          (optionally <code>ROLE_</code> prefixed).
        </p>
      )}

      <p className="mt-8 text-xs text-muted-foreground">
        API base URL:{" "}
        <code>
          {(import.meta.env.VITE_API_BASE_URL as string | undefined) ??
            "http://localhost:8080"}
        </code>{" "}
        — set <code>VITE_API_BASE_URL</code> to change it.{" "}
        <Link to="/login" className="underline">
          Login
        </Link>{" "}
        ·{" "}
        <Link to="/register" className="underline">
          Register
        </Link>
      </p>
    </div>
  );
}

function EndpointCard({
  title,
  path,
  description,
}: {
  title: string;
  path: string;
  description: string;
}) {
  const q = useQuery({
    queryKey: ["endpoint", path],
    queryFn: async () => {
      const { data } = await api.get(path);
      return data;
    },
    retry: false,
  });

  return (
    <div className="rounded border p-4">
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="font-medium">{title}</h2>
        <code className="text-xs text-muted-foreground">{path}</code>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>

      <div className="mt-3 rounded bg-muted px-3 py-2 text-xs">
        {q.isLoading && <span>Loading…</span>}
        {q.isError && (
          <span className="text-destructive">
            {(q.error as any)?.response?.status
              ? `HTTP ${(q.error as any).response.status}`
              : "Request failed"}
          </span>
        )}
        {q.data !== undefined && (
          <pre className="whitespace-pre-wrap break-words">
            {typeof q.data === "string"
              ? q.data
              : JSON.stringify(q.data, null, 2)}
          </pre>
        )}
      </div>
    </div>
  );
}

function PublicCard() {
  return (
    <EndpointCard
      title="Public"
      path="/api/public"
      description="Anyone can read this."
    />
  );
}

function UserCard() {
  return (
    <EndpointCard
      title="User content"
      path="/api/user"
      description="Visible to USER and ADMIN."
    />
  );
}

function AdminCard() {
  return (
    <EndpointCard
      title="Admin content"
      path="/api/admin"
      description="ADMIN only."
    />
  );
}
