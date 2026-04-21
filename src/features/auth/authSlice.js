import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { loginService, getMeService, logoutService, refreshTokenService } from "../../services/auth.service";

// ─── Async Thunks ─────────────────────────────────────────────────────────────

// Login thunk — called from LoginPage on form submit
export const loginThunk = createAsyncThunk(
  "auth/login",
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await loginService(credentials);
      return response.data.data; // { accessToken, user }
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Login failed. Please try again."
      );
    }
  }
);

// Check auth thunk — called on app load to restore session from refresh token cookie
export const checkAuthThunk = createAsyncThunk(
  "auth/checkAuth",
  async (_, { rejectWithValue }) => {
    try {
      // Step 1 — get a fresh access token from the refresh cookie
      const refreshResponse = await refreshTokenService();
      const accessToken = refreshResponse.data.data.accessToken;

      // Step 2 — call /auth/me with the new token directly in the header
      // We cannot rely on Redux here because the store hasn't been updated yet
      const meResponse = await getMeService(accessToken);
      return {
        accessToken,
        user: meResponse.data.data, // /auth/me returns user directly at data.data
      };
    } catch (error) {
      return rejectWithValue("Session expired");
    }
  }
);

// Logout thunk — called from Topbar
export const logoutThunk = createAsyncThunk(
  "auth/logout",
  async (_, { rejectWithValue }) => {
    try {
      await logoutService();
    } catch {
      // Even if server call fails, we still clear client state
    }
  }
);

// ─── Slice ────────────────────────────────────────────────────────────────────

const initialState = {
  user: null,
  accessToken: null,
  isAuthenticated: false,
  isLoading: false,         // login form loading
  isCheckingAuth: true,     // true on first app load until session is verified
  error: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    // Update access token after silent refresh by Axios interceptor
    tokenRefreshed: (state, action) => {
      state.accessToken = action.payload.accessToken;
    },

    // Manually clear error
    clearAuthError: (state) => {
      state.error = null;
    },

    // Direct logout without API call — used by Axios interceptor on refresh failure
    logout: (state) => {
      state.user = null;
      state.accessToken = null;
      state.isAuthenticated = false;
      state.isCheckingAuth = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    console.log("Builder", builder)
    // ── Login ──────────────────────────────────────────────────────────────
    builder
      .addCase(loginThunk.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginThunk.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.accessToken = action.payload.accessToken;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(loginThunk.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
        state.isAuthenticated = false;
      });

    // ── Check Auth (page refresh) ──────────────────────────────────────────
    builder
      .addCase(checkAuthThunk.pending, (state) => {
        state.isCheckingAuth = true;
      })
      .addCase(checkAuthThunk.fulfilled, (state, action) => {
        state.isCheckingAuth = false;
        state.user = action.payload.user;
        state.accessToken = action.payload.accessToken;
        state.isAuthenticated = true;
      })
      .addCase(checkAuthThunk.rejected, (state) => {
        state.isCheckingAuth = false;
        state.isAuthenticated = false;
        state.user = null;
        state.accessToken = null;
      });

    // ── Logout ─────────────────────────────────────────────────────────────
    builder
      .addCase(logoutThunk.fulfilled, (state) => {
        state.user = null;
        state.accessToken = null;
        state.isAuthenticated = false;
        state.isCheckingAuth = false;
        state.error = null;
      });
  },
});

export const { tokenRefreshed, clearAuthError, logout } = authSlice.actions;
export default authSlice.reducer;