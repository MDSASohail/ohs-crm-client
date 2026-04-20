import api from "../config/axios";

// Login — sends email + password, returns accessToken + user
export const loginService = (credentials) =>
  api.post("/auth/login", credentials);

// Logout — clears httpOnly refresh token cookie on server
export const logoutService = () =>
  api.post("/auth/logout");

// Refresh token — sends cookie automatically, returns new accessToken
export const refreshTokenService = () =>
  api.post("/auth/refresh");

// Get current logged in user — called after refresh to restore session
// Get current logged in user — accessToken passed directly on page refresh
// because Redux store is empty at that point
export const getMeService = (accessToken = null) =>
  api.get("/auth/me", {
    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
  });