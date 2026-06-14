const getApiBase = () => {
  if (typeof window !== "undefined") {
    const hostname = window.location.hostname;
    if (hostname !== "localhost" && hostname !== "127.0.0.1") {
      return "/api";
    }
    return "http://127.0.0.1:8000";
  }
  // Server-side (SSR / Server Components / Build time)
  if (process.env.NODE_ENV === "production") {
    return "https://operon-vk6e.onrender.com";
  }
  return "http://127.0.0.1:8000";
};

export const API_BASE = getApiBase();
