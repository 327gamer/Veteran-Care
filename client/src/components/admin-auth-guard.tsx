import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ShieldAlert, LogIn, AlertTriangle } from "lucide-react";
import { useLocation } from "wouter";

export function useAdminKey() {
  const [adminKey, setAdminKey] = useState<string | null>(() =>
    typeof window !== "undefined" ? localStorage.getItem("adminKey") : null
  );

  const clearKey = () => {
    localStorage.removeItem("adminKey");
    setAdminKey(null);
  };

  const saveKey = (key: string) => {
    localStorage.setItem("adminKey", key);
    setAdminKey(key);
  };

  return { adminKey, clearKey, saveKey };
}

export function getAdminHeaders(): Record<string, string> {
  const adminKey = typeof window !== "undefined" ? localStorage.getItem("adminKey") : null;
  const h: Record<string, string> = { "Content-Type": "application/json" };
  if (adminKey) h["x-admin-key"] = adminKey;
  return h;
}

export function adminFetch(url: string, options?: RequestInit): Promise<Response> {
  const headers = getAdminHeaders();
  return fetch(url, { ...options, headers: { ...headers, ...(options?.headers || {}) } }).then((res) => {
    if (res.status === 401 || res.status === 403) {
      throw new AdminAuthError("Admin authentication failed — please log in again.");
    }
    if (!res.ok) {
      throw new Error(`Request failed: ${res.status}`);
    }
    return res;
  });
}

export class AdminAuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AdminAuthError";
  }
}

export function AdminAuthGuard({ children }: { children: React.ReactNode }) {
  const { adminKey } = useAdminKey();
  const [, navigate] = useLocation();

  if (!adminKey) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-sm" data-testid="card-admin-auth-required">
          <CardContent className="pt-8 pb-6 text-center space-y-4">
            <div className="mx-auto w-14 h-14 bg-amber-100 rounded-full flex items-center justify-center">
              <ShieldAlert className="w-7 h-7 text-amber-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Admin Authentication Required</h2>
              <p className="text-sm text-muted-foreground mt-1">
                You need to log in with your admin key to access this page.
              </p>
            </div>
            <Button
              className="w-full"
              onClick={() => navigate("/admin")}
              data-testid="button-go-admin-login"
            >
              <LogIn className="w-4 h-4 mr-2" />
              Go to Admin Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}

export function AdminAuthErrorBanner({ error, onRetry }: { error: Error | null; onRetry?: () => void }) {
  const [, navigate] = useLocation();

  if (!error) return null;

  const isAuthError = error instanceof AdminAuthError
    || error.message?.includes("Unauthorized")
    || error.message?.includes("authentication")
    || error.message?.includes("401");

  if (!isAuthError) return null;

  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3" data-testid="banner-auth-error">
      <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
      <div className="flex-1">
        <p className="text-sm font-medium text-red-800">Invalid or expired admin key</p>
        <p className="text-xs text-red-600 mt-0.5">Your admin session may have expired. Please log in again.</p>
        <div className="flex items-center gap-2 mt-3">
          <Button
            size="sm"
            variant="outline"
            className="h-8 text-xs border-red-300 text-red-700 hover:bg-red-50"
            onClick={() => {
              localStorage.removeItem("adminKey");
              navigate("/admin");
            }}
            data-testid="button-relogin"
          >
            <LogIn className="w-3 h-3 mr-1" />
            Log In Again
          </Button>
          {onRetry && (
            <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={onRetry} data-testid="button-retry">
              Retry
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
