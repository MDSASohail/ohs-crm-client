import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as service from '../../services/vaultDocument.service';

// ─── Async Thunks ─────────────────────────────────────────────────────────────

export const fetchVaultDocuments = createAsyncThunk(
  'vaultDocument/fetchAll',
  async (params, { rejectWithValue }) => {
    try {
      const res = await service.getVaultDocuments(params);
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch documents');
    }
  }
);

export const uploadVaultDocument = createAsyncThunk(
  'vaultDocument/upload',
  async (formData, { rejectWithValue }) => {
    try {
      const res = await service.uploadVaultDocument(formData);
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to upload document');
    }
  }
);

export const renameVaultDocument = createAsyncThunk(
  'vaultDocument/rename',
  async ({ id, name }, { rejectWithValue }) => {
    try {
      const res = await service.renameVaultDocument(id, name);
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to rename document');
    }
  }
);

export const updateVaultDocumentTags = createAsyncThunk(
  'vaultDocument/updateTags',
  async ({ id, tags }, { rejectWithValue }) => {
    try {
      const res = await service.updateVaultDocumentTags(id, tags);
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to update tags');
    }
  }
);

export const updateVaultDocumentNote = createAsyncThunk(
  'vaultDocument/updateNote',
  async ({ id, note }, { rejectWithValue }) => {
    try {
      const res = await service.updateVaultDocumentNote(id, note);
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to update note');
    }
  }
);

export const deleteVaultDocument = createAsyncThunk(
  'vaultDocument/delete',
  async (id, { rejectWithValue }) => {
    try {
      await service.deleteVaultDocument(id);
      return id;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to delete document');
    }
  }
);

// ─── Slice ────────────────────────────────────────────────────────────────────

const initialState = {
  items: [],
  pagination: {},
  listLoading: false,
  listError: null,
  mutating: false,
  mutateError: null,
};

const vaultDocumentSlice = createSlice({
  name: 'vaultDocument',
  initialState,
  reducers: {
    clearVaultError(state) {
      state.mutateError = null;
      state.listError = null;
    },
  },
  extraReducers: (builder) => {
    // ── Fetch ──────────────────────────────────────────────────────────────
    builder
      .addCase(fetchVaultDocuments.pending, (state) => {
        state.listLoading = true;
        state.listError = null;
      })
      .addCase(fetchVaultDocuments.fulfilled, (state, action) => {
        state.listLoading = false;
        state.items = action.payload.documents;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchVaultDocuments.rejected, (state, action) => {
        state.listLoading = false;
        state.listError = action.payload;
      });

    // ── Upload ─────────────────────────────────────────────────────────────
    builder
      .addCase(uploadVaultDocument.pending, (state) => {
        state.mutating = true;
        state.mutateError = null;
      })
      .addCase(uploadVaultDocument.fulfilled, (state, action) => {
        state.mutating = false;
        state.items.unshift(action.payload); // add to top of list
        if (state.pagination.total !== undefined) state.pagination.total += 1;
      })
      .addCase(uploadVaultDocument.rejected, (state, action) => {
        state.mutating = false;
        state.mutateError = action.payload;
      });

    // ── Rename ─────────────────────────────────────────────────────────────
    builder
      .addCase(renameVaultDocument.pending, (state) => {
        state.mutating = true;
        state.mutateError = null;
      })
      .addCase(renameVaultDocument.fulfilled, (state, action) => {
        state.mutating = false;
        const idx = state.items.findIndex((d) => d._id === action.payload._id);
        if (idx !== -1) state.items[idx] = action.payload;
      })
      .addCase(renameVaultDocument.rejected, (state, action) => {
        state.mutating = false;
        state.mutateError = action.payload;
      });

    // ── Update Tags ────────────────────────────────────────────────────────
    builder
      .addCase(updateVaultDocumentTags.pending, (state) => {
        state.mutating = true;
        state.mutateError = null;
      })
      .addCase(updateVaultDocumentTags.fulfilled, (state, action) => {
        state.mutating = false;
        const idx = state.items.findIndex((d) => d._id === action.payload._id);
        if (idx !== -1) state.items[idx] = action.payload;
      })
      .addCase(updateVaultDocumentTags.rejected, (state, action) => {
        state.mutating = false;
        state.mutateError = action.payload;
      });

    // ── Update Note ────────────────────────────────────────────────────────
    builder
      .addCase(updateVaultDocumentNote.pending, (state) => {
        state.mutating = true;
        state.mutateError = null;
      })
      .addCase(updateVaultDocumentNote.fulfilled, (state, action) => {
        state.mutating = false;
        const idx = state.items.findIndex((d) => d._id === action.payload._id);
        if (idx !== -1) state.items[idx] = action.payload;
      })
      .addCase(updateVaultDocumentNote.rejected, (state, action) => {
        state.mutating = false;
        state.mutateError = action.payload;
      });

    // ── Delete ─────────────────────────────────────────────────────────────
    builder
      .addCase(deleteVaultDocument.pending, (state) => {
        state.mutating = true;
        state.mutateError = null;
      })
      .addCase(deleteVaultDocument.fulfilled, (state, action) => {
        state.mutating = false;
        state.items = state.items.filter((d) => d._id !== action.payload);
        if (state.pagination.total !== undefined) state.pagination.total -= 1;
      })
      .addCase(deleteVaultDocument.rejected, (state, action) => {
        state.mutating = false;
        state.mutateError = action.payload;
      });
  },
});

export const { clearVaultError } = vaultDocumentSlice.actions;
export default vaultDocumentSlice.reducer;