import { supabase } from "./supabase";

// Attach the Supabase session token to same-origin /api calls that don't set their own.
export function installAuthFetch() {
  const originalFetch = window.fetch.bind(window);
  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    try {
      const url = typeof input === "string" ? input : input instanceof URL ? input.pathname : input.url;
      const isApi = url.startsWith("/api/") || url.startsWith(`${window.location.origin}/api/`);
      if (isApi) {
        const headers = new Headers(init?.headers || (input instanceof Request ? input.headers : undefined));
        if (!headers.has("Authorization")) {
          const { data } = await supabase.auth.getSession();
          const token = data.session?.access_token;
          if (token) headers.set("Authorization", `Bearer ${token}`);
        }
        return originalFetch(input, { ...init, headers });
      }
    } catch {
      // fall through to the plain request
    }
    return originalFetch(input, init);
  };
}
