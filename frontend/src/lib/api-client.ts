import ky from "ky";

const apiClient = ky.create({
  prefix: "/api",
  headers: {
    "Content-Type": "application/json",
  },
  hooks: {
    beforeError: [
      async (error) => {
        const response = error.response as Response;
        if (response?.body) {
          try {
            const body = (await response.clone().json()) as { message?: string };
            // Attach message so callers can read error.message
            (error as Error).message = body.message ?? response.statusText;
          } catch {
            // JSON parse failed — leave message as-is
          }
        }
        return error;
      },
    ],
  },
});

export default apiClient;
