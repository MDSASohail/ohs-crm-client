import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as service from '../../services/candidateRequiredDoc.service';

// ─── Thunks ───────────────────────────────────────────────────────────────────

export const fetchCandidateRequiredDocs = createAsyncThunk(
  'candidateRequiredDoc/fetchAll',
  async (candidateId, { rejectWithValue }) => {
    try {
      const res = await service.getCandidateRequiredDocs(candidateId);
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch required docs');
    }
  }
);

export const uploadRequiredDocFile = createAsyncThunk(
  'candidateRequiredDoc/uploadFile',
  async ({ candidateId, docId, file, name }, { rejectWithValue }) => {
    try {
      const res = await service.uploadFileToSlot(candidateId, docId, file, name);
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to upload file');
    }
  }
);

export const renameRequiredDocFile = createAsyncThunk(
  'candidateRequiredDoc/renameFile',
  async ({ candidateId, docId, fileId, name }, { rejectWithValue }) => {
    try {
      const res = await service.renameFile(candidateId, docId, fileId, name);
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to rename file');
    }
  }
);

export const deleteRequiredDocFile = createAsyncThunk(
  'candidateRequiredDoc/deleteFile',
  async ({ candidateId, docId, fileId }, { rejectWithValue }) => {
    try {
      const res = await service.deleteFile(candidateId, docId, fileId);
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to delete file');
    }
  }
);

// ─── Slice ────────────────────────────────────────────────────────────────────

const initialState = {
  docs: [],
  listLoading: false,
  listError: null,
  mutating: false,
  mutateError: null,
};

const candidateRequiredDocSlice = createSlice({
  name: 'candidateRequiredDoc',
  initialState,
  reducers: {
    clearRequiredDocs: (state) => {
      state.docs = [];
      state.listError = null;
      state.mutateError = null;
    },
  },
  extraReducers: (builder) => {
    // fetchAll
    builder
      .addCase(fetchCandidateRequiredDocs.pending, (state) => {
        state.listLoading = true;
        state.listError = null;
      })
      .addCase(fetchCandidateRequiredDocs.fulfilled, (state, action) => {
        state.listLoading = false;
        state.docs = action.payload;
      })
      .addCase(fetchCandidateRequiredDocs.rejected, (state, action) => {
        state.listLoading = false;
        state.listError = action.payload;
      });

    // uploadFile — replace the matching doc in the array
    builder
      .addCase(uploadRequiredDocFile.pending, (state) => {
        state.mutating = true;
        state.mutateError = null;
      })
      .addCase(uploadRequiredDocFile.fulfilled, (state, action) => {
        state.mutating = false;
        const index = state.docs.findIndex((d) => d._id === action.payload._id);
        if (index !== -1) state.docs[index] = action.payload;
      })
      .addCase(uploadRequiredDocFile.rejected, (state, action) => {
        state.mutating = false;
        state.mutateError = action.payload;
      });

    // renameFile — replace the matching doc in the array
    builder
      .addCase(renameRequiredDocFile.pending, (state) => {
        state.mutating = true;
        state.mutateError = null;
      })
      .addCase(renameRequiredDocFile.fulfilled, (state, action) => {
        state.mutating = false;
        const index = state.docs.findIndex((d) => d._id === action.payload._id);
        if (index !== -1) state.docs[index] = action.payload;
      })
      .addCase(renameRequiredDocFile.rejected, (state, action) => {
        state.mutating = false;
        state.mutateError = action.payload;
      });

    // deleteFile — replace the matching doc in the array
    builder
      .addCase(deleteRequiredDocFile.pending, (state) => {
        state.mutating = true;
        state.mutateError = null;
      })
      .addCase(deleteRequiredDocFile.fulfilled, (state, action) => {
        state.mutating = false;
        const index = state.docs.findIndex((d) => d._id === action.payload._id);
        if (index !== -1) state.docs[index] = action.payload;
      })
      .addCase(deleteRequiredDocFile.rejected, (state, action) => {
        state.mutating = false;
        state.mutateError = action.payload;
      });
  },
});

export const { clearRequiredDocs } = candidateRequiredDocSlice.actions;
export default candidateRequiredDocSlice.reducer;