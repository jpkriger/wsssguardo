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
        if (error instanceof HTTPError) {
          const { response } = error;
          if (response?.body) {
            try {
              const body = (await response.clone().json()) as { message?: string };
              error.message = body.message ?? response.statusText;
            } catch {
              // JSON parse failed — leave message as-is
            }
          }
        }
        return state.error;
      },
    ],
  },
});

export default apiClient;
