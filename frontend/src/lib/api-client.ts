import ky from "ky";

const apiClient = ky.create({
  prefix: "/api",
  headers: {
    "Content-Type": "application/json",
  },
});

export default apiClient;
