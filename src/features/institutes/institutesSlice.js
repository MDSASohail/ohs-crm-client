import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  getInstitutes,
  getInstituteById,
  createInstitute,
  updateInstitute,
  deleteInstitute,
  deactivateInstitute,
  activateInstitute,
  addContact,
  updateContact,
  deleteContact,
  addCourseOffered,
  updateCourseOffered,
  deleteCourseOffered,
} from "../../services/institute.service";

// ─── Async Thunks ─────────────────────────────────────────────────────────────

export const fetchInstitutes = createAsyncThunk(
  "institutes/fetchAll",
  async (params, { rejectWithValue }) => {
    try {
      const response = await getInstitutes(params);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch institutes."
      );
    }
  }
);

export const fetchInstituteById = createAsyncThunk(
  "institutes/fetchById",
  async (id, { rejectWithValue }) => {
    try {
      const response = await getInstituteById(id);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch institute."
      );
    }
  }
);

export const addInstitute = createAsyncThunk(
  "institutes/add",
  async (data, { rejectWithValue }) => {
    try {
      const response = await createInstitute(data);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to create institute."
      );
    }
  }
);

export const editInstitute = createAsyncThunk(
  "institutes/edit",
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await updateInstitute(id, data);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to update institute."
      );
    }
  }
);

export const removeInstitute = createAsyncThunk(
  "institutes/remove",
  async (id, { rejectWithValue }) => {
    try {
      await deleteInstitute(id);
      return id;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to delete institute."
      );
    }
  }
);

export const deactivateInstituteThunk = createAsyncThunk(
  "institutes/deactivate",
  async (id, { rejectWithValue }) => {
    try {
      const response = await deactivateInstitute(id);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to deactivate institute."
      );
    }
  }
);

export const activateInstituteThunk = createAsyncThunk(
  "institutes/activate",
  async (id, { rejectWithValue }) => {
    try {
      const response = await activateInstitute(id);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to activate institute."
      );
    }
  }
);

// ── Contacts ──────────────────────────────────────────────────────────────────

export const addContactThunk = createAsyncThunk(
  "institutes/addContact",
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await addContact(id, data);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to add contact."
      );
    }
  }
);

export const updateContactThunk = createAsyncThunk(
  "institutes/updateContact",
  async ({ id, contactId, data }, { rejectWithValue }) => {
    try {
      const response = await updateContact(id, contactId, data);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to update contact."
      );
    }
  }
);

export const deleteContactThunk = createAsyncThunk(
  "institutes/deleteContact",
  async ({ id, contactId }, { rejectWithValue }) => {
    try {
      const response = await deleteContact(id, contactId);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to delete contact."
      );
    }
  }
);

// ── Courses offered ───────────────────────────────────────────────────────────

export const addCourseOfferedThunk = createAsyncThunk(
  "institutes/addCourseOffered",
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await addCourseOffered(id, data);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to add course."
      );
    }
  }
);

export const updateCourseOfferedThunk = createAsyncThunk(
  "institutes/updateCourseOffered",
  async ({ id, courseOfferedId, data }, { rejectWithValue }) => {
    try {
      const response = await updateCourseOffered(id, courseOfferedId, data);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to update course."
      );
    }
  }
);

export const deleteCourseOfferedThunk = createAsyncThunk(
  "institutes/deleteCourseOffered",
  async ({ id, courseOfferedId }, { rejectWithValue }) => {
    try {
      const response = await deleteCourseOffered(id, courseOfferedId);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to remove course."
      );
    }
  }
);

// ─── Slice ────────────────────────────────────────────────────────────────────

const initialState = {
  institutes: [],
  listLoading: false,
  listError: null,

  selected: null,
  detailLoading: false,
  detailError: null,

  mutating: false,
  mutateError: null,
};

// Helper — update selected and list after any mutation that returns institute
const handleInstituteFulfilled = (state, action) => {
  state.mutating = false;
  state.mutateError = null;
  if (action.payload && action.payload._id) {
    state.selected = action.payload;
    const index = state.institutes.findIndex(
      (i) => i._id === action.payload._id
    );
    if (index !== -1) state.institutes[index] = action.payload;
  }
};

const institutesSlice = createSlice({
  name: "institutes",
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
      .addCase(fetchInstitutes.pending, (state) => {
        state.listLoading = true;
        state.listError = null;
      })
      .addCase(fetchInstitutes.fulfilled, (state, action) => {
        state.listLoading = false;
        state.institutes = action.payload;
      })
      .addCase(fetchInstitutes.rejected, (state, action) => {
        state.listLoading = false;
        state.listError = action.payload;
      });

    // ── Fetch by ID ────────────────────────────────────────────────────────
    builder
      .addCase(fetchInstituteById.pending, (state) => {
        state.detailLoading = true;
        state.detailError = null;
        state.selected = null;
      })
      .addCase(fetchInstituteById.fulfilled, (state, action) => {
        state.detailLoading = false;
        state.selected = action.payload;
      })
      .addCase(fetchInstituteById.rejected, (state, action) => {
        state.detailLoading = false;
        state.detailError = action.payload;
      });

    // ── Add ────────────────────────────────────────────────────────────────
    builder
      .addCase(addInstitute.pending, (state) => {
        state.mutating = true;
        state.mutateError = null;
      })
      .addCase(addInstitute.fulfilled, (state, action) => {
        state.mutating = false;
        state.institutes.unshift(action.payload);
      })
      .addCase(addInstitute.rejected, (state, action) => {
        state.mutating = false;
        state.mutateError = action.payload;
      });

    // ── Edit ───────────────────────────────────────────────────────────────
    builder
      .addCase(editInstitute.pending, (state) => {
        state.mutating = true;
        state.mutateError = null;
      })
      .addCase(editInstitute.fulfilled, handleInstituteFulfilled)
      .addCase(editInstitute.rejected, (state, action) => {
        state.mutating = false;
        state.mutateError = action.payload;
      });

    // ── Remove ─────────────────────────────────────────────────────────────
    builder
      .addCase(removeInstitute.pending, (state) => {
        state.mutating = true;
        state.mutateError = null;
      })
      .addCase(removeInstitute.fulfilled, (state, action) => {
        state.mutating = false;
        state.institutes = state.institutes.filter(
          (i) => i._id !== action.payload
        );
      })
      .addCase(removeInstitute.rejected, (state, action) => {
        state.mutating = false;
        state.mutateError = action.payload;
      });

    // ── Deactivate ─────────────────────────────────────────────────────────
    builder
      .addCase(deactivateInstituteThunk.pending, (state) => {
        state.mutating = true;
        state.mutateError = null;
      })
      .addCase(deactivateInstituteThunk.fulfilled, handleInstituteFulfilled)
      .addCase(deactivateInstituteThunk.rejected, (state, action) => {
        state.mutating = false;
        state.mutateError = action.payload;
      });

    // ── Activate ───────────────────────────────────────────────────────────
    builder
      .addCase(activateInstituteThunk.pending, (state) => {
        state.mutating = true;
        state.mutateError = null;
      })
      .addCase(activateInstituteThunk.fulfilled, handleInstituteFulfilled)
      .addCase(activateInstituteThunk.rejected, (state, action) => {
        state.mutating = false;
        state.mutateError = action.payload;
      });

    // ── All contact and course mutations ───────────────────────────────────
    const contactAndCourseCases = [
      addContactThunk,
      updateContactThunk,
      deleteContactThunk,
      addCourseOfferedThunk,
      updateCourseOfferedThunk,
      deleteCourseOfferedThunk,
    ];

    contactAndCourseCases.forEach((thunk) => {
      builder
        .addCase(thunk.pending, (state) => {
          state.mutating = true;
          state.mutateError = null;
        })
        .addCase(thunk.fulfilled, handleInstituteFulfilled)
        .addCase(thunk.rejected, (state, action) => {
          state.mutating = false;
          state.mutateError = action.payload;
        });
    });
  },
});

export const { clearSelected, clearMutateError } = institutesSlice.actions;
export default institutesSlice.reducer;