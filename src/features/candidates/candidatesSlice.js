import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  getCandidates,
  getCandidateById,
  createCandidate,
  updateCandidate,
  deleteCandidate,
} from "../../services/candidate.service";

// ─── Async Thunks ─────────────────────────────────────────────────────────────

export const fetchCandidates = createAsyncThunk(
  "candidates/fetchAll",
  async (params, { rejectWithValue }) => {
    try {
      const response = await getCandidates(params);
      return response.data.data; // { candidates, pagination }
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch candidates."
      );
    }
  }
);

export const fetchCandidateById = createAsyncThunk(
  "candidates/fetchById",
  async (id, { rejectWithValue }) => {
    try {
      const response = await getCandidateById(id);
      return response.data.data; // single candidate object
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch candidate."
      );
    }
  }
);

export const addCandidate = createAsyncThunk(
  "candidates/add",
  async (data, { rejectWithValue }) => {
    try {
      const response = await createCandidate(data);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to create candidate."
      );
    }
  }
);

export const editCandidate = createAsyncThunk(
  "candidates/edit",
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await updateCandidate(id, data);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to update candidate."
      );
    }
  }
);

export const removeCandidate = createAsyncThunk(
  "candidates/remove",
  async (id, { rejectWithValue }) => {
    try {
      await deleteCandidate(id);
      return id; // return id so we can remove from list in state
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to delete candidate."
      );
    }
  }
);

// ─── Slice ────────────────────────────────────────────────────────────────────

const initialState = {
  // List state
  candidates: [],
  pagination: {
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 1,
  },
  listLoading: false,
  listError: null,

  // Single candidate state
  selected: null,
  detailLoading: false,
  detailError: null,

  // Mutation state — add, edit, delete
  mutating: false,
  mutateError: null,
};

const candidatesSlice = createSlice({
  name: "candidates",
  initialState,
  reducers: {
    clearSelected: (state) => {
      state.selected = null;
      state.detailError = null;
    },
    clearMutateError: (state) => {
      state.mutateError = null;
    },
  },
  extraReducers: (builder) => {
    // ── Fetch all ──────────────────────────────────────────────────────────
    builder
      .addCase(fetchCandidates.pending, (state) => {
        state.listLoading = true;
        state.listError = null;
      })
      .addCase(fetchCandidates.fulfilled, (state, action) => {
        state.listLoading = false;
        state.candidates = action.payload.candidates;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchCandidates.rejected, (state, action) => {
        state.listLoading = false;
        state.listError = action.payload;
      });

    // ── Fetch by ID ────────────────────────────────────────────────────────
    builder
      .addCase(fetchCandidateById.pending, (state) => {
        state.detailLoading = true;
        state.detailError = null;
        state.selected = null;
      })
      .addCase(fetchCandidateById.fulfilled, (state, action) => {
        state.detailLoading = false;
        state.selected = action.payload;
      })
      .addCase(fetchCandidateById.rejected, (state, action) => {
        state.detailLoading = false;
        state.detailError = action.payload;
      });

    // ── Add ────────────────────────────────────────────────────────────────
    builder
      .addCase(addCandidate.pending, (state) => {
        state.mutating = true;
        state.mutateError = null;
      })
      .addCase(addCandidate.fulfilled, (state, action) => {
        state.mutating = false;
        state.candidates.unshift(action.payload); // add to top of list
      })
      .addCase(addCandidate.rejected, (state, action) => {
        state.mutating = false;
        state.mutateError = action.payload;
      });

    // ── Edit ───────────────────────────────────────────────────────────────
    builder
      .addCase(editCandidate.pending, (state) => {
        state.mutating = true;
        state.mutateError = null;
      })
      .addCase(editCandidate.fulfilled, (state, action) => {
        state.mutating = false;
        // Update in list if present
        const index = state.candidates.findIndex(
          (c) => c._id === action.payload._id
        );
        if (index !== -1) state.candidates[index] = action.payload;
        // Update selected if open
        if (state.selected?._id === action.payload._id) {
          state.selected = action.payload;
        }
      })
      .addCase(editCandidate.rejected, (state, action) => {
        state.mutating = false;
        state.mutateError = action.payload;
      });

    // ── Remove ─────────────────────────────────────────────────────────────
    builder
      .addCase(removeCandidate.pending, (state) => {
        state.mutating = true;
        state.mutateError = null;
      })
      .addCase(removeCandidate.fulfilled, (state, action) => {
        state.mutating = false;
        state.candidates = state.candidates.filter(
          (c) => c._id !== action.payload
        );
      })
      .addCase(removeCandidate.rejected, (state, action) => {
        state.mutating = false;
        state.mutateError = action.payload;
      });
  },
});

export const { clearSelected, clearMutateError } = candidatesSlice.actions;
export default candidatesSlice.reducer;