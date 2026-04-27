<<<<<<< HEAD
import ky, { HTTPError } from "ky"
=======
import ky, { type BeforeErrorState, type HTTPError } from "ky";
>>>>>>> 10a2ec3a363ec844d7365edae99578e9823f5f77

const apiClient = ky.create({
  prefix: "/api",
  headers: {
    "Content-Type": "application/json",
  },
  hooks: {
    beforeError: [
      async (state: BeforeErrorState): Promise<Error> => {
        const error = state.error as HTTPError;
        if (error.response?.body) {
          try {
            const body = (await error.response.clone().json()) as { message?: string };
            error.message = body.message ?? error.response.statusText;
          } catch { /* ignore */ }
        }
        return error;
      },
    ],
  },
});

export default apiClient;
