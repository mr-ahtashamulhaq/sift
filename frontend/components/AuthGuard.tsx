import { useEffect } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/lib/auth";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  const isDemo =
    router.query.demo === "true" ||
    (typeof window !== "undefined" && localStorage.getItem("sb_demo") === "1");

  useEffect(() => {
    if (!loading && !user && !isDemo) {
      router.replace(`/login?next=${encodeURIComponent(router.asPath)}`);
    }
  }, [user, loading, router, isDemo]);

  if (isDemo) return <>{children}</>;

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div className="spinner" />
      </div>
    );
  }

  if (!user) return null;
  return <>{children}</>;
}
