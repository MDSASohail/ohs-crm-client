import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as service from '../../services/requiredDocTemplate.service';

// ─── Thunks ───────────────────────────────────────────────────────────────────

export const fetchTemplate = createAsyncThunk(
  'requiredDocTemplate/fetch',
  async (courseId, { rejectWithValue }) => {
    try {
      const res = await service.getTemplate(courseId);
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch template');
    }
  }
);

export const addTemplateSlot = createAsyncThunk(
  'requiredDocTemplate/addSlot',
  async ({ courseId, data }, { rejectWithValue }) => {
    try {
      const res = await service.addSlot(courseId, data);
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to add slot');
    }
  }
);

export const editTemplateSlot = createAsyncThunk(
  'requiredDocTemplate/editSlot',
  async ({ courseId, slotId, data }, { rejectWithValue }) => {
    try {
      const res = await service.editSlot(courseId, slotId, data);
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to edit slot');
    }
  }
);

export const deleteTemplateSlot = createAsyncThunk(
  'requiredDocTemplate/deleteSlot',
  async ({ courseId, slotId }, { rejectWithValue }) => {
    try {
      const res = await service.deleteSlot(courseId, slotId);
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to delete slot');
    }
  }
);

// ─── Slice ────────────────────────────────────────────────────────────────────

const initialState = {
  template: null,
  listLoading: false,
  listError: null,
  mutating: false,
  mutateError: null,
};

const requiredDocTemplateSlice = createSlice({
  name: 'requiredDocTemplate',
  initialState,
  reducers: {
    clearTemplate: (state) => {
      state.template = null;
      state.listError = null;
      state.mutateError = null;
    },
  },
  extraReducers: (builder) => {
    // fetch
    builder
      .addCase(fetchTemplate.pending, (state) => {
        state.listLoading = true;
        state.listError = null;
      })
      .addCase(fetchTemplate.fulfilled, (state, action) => {
        state.listLoading = false;
        state.template = action.payload;
      })
      .addCase(fetchTemplate.rejected, (state, action) => {
        state.listLoading = false;
        state.listError = action.payload;
      });

    // addSlot
    builder
      .addCase(addTemplateSlot.pending, (state) => {
        state.mutating = true;
        state.mutateError = null;
      })
      .addCase(addTemplateSlot.fulfilled, (state, action) => {
        state.mutating = false;
        state.template = action.payload;
      })
      .addCase(addTemplateSlot.rejected, (state, action) => {
        state.mutating = false;
        state.mutateError = action.payload;
      });

    // editSlot
    builder
      .addCase(editTemplateSlot.pending, (state) => {
        state.mutating = true;
        state.mutateError = null;
      })
      .addCase(editTemplateSlot.fulfilled, (state, action) => {
        state.mutating = false;
        state.template = action.payload;
      })
      .addCase(editTemplateSlot.rejected, (state, action) => {
        state.mutating = false;
        state.mutateError = action.payload;
      });

    // deleteSlot
    builder
      .addCase(deleteTemplateSlot.pending, (state) => {
        state.mutating = true;
        state.mutateError = null;
      })
      .addCase(deleteTemplateSlot.fulfilled, (state, action) => {
        state.mutating = false;
        state.template = action.payload;
      })
      .addCase(deleteTemplateSlot.rejected, (state, action) => {
        state.mutating = false;
        state.mutateError = action.payload;
      });
  },
});

export const { clearTemplate } = requiredDocTemplateSlice.actions;
export default requiredDocTemplateSlice.reducer;