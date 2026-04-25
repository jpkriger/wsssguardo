import ky, { HTTPError } from "ky";

const apiClient = ky.create({
  prefix: "/api",
  headers: {
    "Content-Type": "application/json",
  },
  hooks: {
    beforeError: [
      async (state) => {
        const { error } = state;
        if (error instanceof HTTPError && error.response?.body) {
          try {
            const body = (await error.response.clone().json()) as { message?: string };
            error.message = body.message ?? error.response.statusText;
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
