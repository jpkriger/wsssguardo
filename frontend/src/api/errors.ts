export interface ApiErrorPayload {
  status: number;
  error: string;
  message: string;
  timestamp: string;
  path: string;
}

function isApiErrorPayload(value: unknown): value is ApiErrorPayload {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  return (
    typeof candidate.status === "number" &&
    typeof candidate.error === "string" &&
    typeof candidate.message === "string" &&
    typeof candidate.timestamp === "string" &&
    typeof candidate.path === "string"
  );
}

export class ApiErrorResponse extends Error {
  readonly status: number;
  readonly errorType: string;
  readonly timestamp: string;
  readonly path: string;

  constructor(payload: ApiErrorPayload) {
    super(payload.message);
    this.name = "ApiErrorResponse";
    this.status = payload.status;
    this.errorType = payload.error;
    this.timestamp = payload.timestamp;
    this.path = payload.path;
    Object.setPrototypeOf(this, new.target.prototype);
  }

  getUserMessage(): string {
    if (this.status >= 500) {
      return "Erro interno do servidor. Tente novamente em instantes.";
    }

    if (this.status === 400) {
      return `Dados inválidos: ${this.message}`;
    }

    if (this.status === 404) {
      return `Recurso não encontrado: ${this.message}`;
    }

    return this.message;
  }
}

export async function parseApiErrorResponse(
  response: Response,
  fallbackPath: string,
): Promise<ApiErrorResponse> {
  let parsed: unknown;

  try {
    parsed = await response.json();
  } catch {
    parsed = null;
  }

  if (isApiErrorPayload(parsed)) {
    return new ApiErrorResponse(parsed);
  }

  return new ApiErrorResponse({
    status: response.status,
    error: response.statusText || "HTTP Error",
    message: `Falha na requisição (HTTP ${response.status})`,
    timestamp: new Date().toISOString(),
    path: fallbackPath,
  });
}
