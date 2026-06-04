import ky, { isHTTPError } from "ky";
import { ApiErrorResponse, apiErrorFromBody } from "@/api/errors";

/** Chave do localStorage onde o email do usuário fica para recompor o SECRET_HASH no refresh. */
export const AUTH_EMAIL_KEY = "wss.authEmail";

/** Evento disparado quando a sessão expira e o refresh falha — o AuthProvider escuta para deslogar. */
export const AUTH_LOGOUT_EVENT = "wss:auth-logout";

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(
    new RegExp("(?:^|; )" + name.replace(/([.$?*|{}()[\]\\/+^])/g, "\\$1") + "=([^;]*)"),
  );
  return match ? decodeURIComponent(match[1]) : null;
}

function isAuthEndpoint(url: string): boolean {
  return url.includes("/api/auth/");
}

// Garante uma única chamada de refresh concorrente: várias requisições que tomam 401
// ao mesmo tempo compartilham a mesma promessa de refresh.
let refreshInFlight: Promise<boolean> | null = null;

function runRefresh(): Promise<boolean> {
  if (refreshInFlight) return refreshInFlight;

  const email = localStorage.getItem(AUTH_EMAIL_KEY);
  if (!email) return Promise.resolve(false);

  // ky "cru" (sem o afterResponse abaixo) para não recursar no tratamento de 401.
  refreshInFlight = ky
    .post("/api/auth/refresh", {
      searchParams: { email },
      credentials: "include",
    })
    .then(() => true)
    .catch(() => false)
    .finally(() => {
      refreshInFlight = null;
    });

  return refreshInFlight;
}

const apiClient = ky.create({
  prefix: "/api",
  credentials: "include",
  headers: {
    "Content-Type": "application/json",
  },
  hooks: {
    beforeRequest: [
      ({ request }) => {
        const method = request.method.toUpperCase();
        if (method !== "GET" && method !== "HEAD") {
          const token = readCookie("XSRF-TOKEN");
          if (token) request.headers.set("X-XSRF-TOKEN", token);
        }
      },
    ],
    afterResponse: [
      async ({ request, response, retryCount }) => {
        if (response.status !== 401) return response;
        // Só tenta refresh no primeiro 401 e fora dos próprios endpoints de auth.
        if (retryCount > 0 || isAuthEndpoint(request.url)) return response;

        const refreshed = await runRefresh();
        if (!refreshed) {
          if (typeof window !== "undefined") {
            window.dispatchEvent(new Event(AUTH_LOGOUT_EVENT));
          }
          return response;
        }
        return ky.retry({ request: new Request(request), code: "TOKEN_REFRESHED" });
      },
    ],
    beforeError: [
      ({ error }) => {
        // O ky já consome o corpo da resposta em `error.data` — não dá para reler/clonar.
        if (isHTTPError(error) && error.response) {
          const res = error.response;
          return apiErrorFromBody(error.data, res.status, res.statusText, res.url);
        }
        return error;
      },
    ],

  },
});

export default apiClient;
export { ApiErrorResponse };
