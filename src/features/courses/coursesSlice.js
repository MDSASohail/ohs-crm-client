import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  getCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse,
  deactivateCourse,
  activateCourse,
  getChecklistTemplate,
  createChecklistTemplate,
  addChecklistStep,
  updateChecklistStep,
  deleteChecklistStep,
  reorderChecklistSteps,
} from "../../services/course.service";

// ─── Async Thunks ─────────────────────────────────────────────────────────────

export const fetchCourses = createAsyncThunk(
  "courses/fetchAll",
  async (params, { rejectWithValue }) => {
    try {
      const response = await getCourses(params);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch courses."
      );
    }
  }
);

export const fetchCourseById = createAsyncThunk(
  "courses/fetchById",
  async (id, { rejectWithValue }) => {
    try {
      const response = await getCourseById(id);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch course."
      );
    }
  }
);

export const addCourse = createAsyncThunk(
  "courses/add",
  async (data, { rejectWithValue }) => {
    try {
      const response = await createCourse(data);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to create course."
      );
    }
  }
);

export const editCourse = createAsyncThunk(
  "courses/edit",
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await updateCourse(id, data);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to update course."
      );
    }
  }
);

export const removeCourse = createAsyncThunk(
  "courses/remove",
  async (id, { rejectWithValue }) => {
    try {
      await deleteCourse(id);
      return id;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to delete course."
      );
    }
  }
);

export const deactivateCourseThunk = createAsyncThunk(
  "courses/deactivate",
  async (id, { rejectWithValue }) => {
    try {
      const response = await deactivateCourse(id);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to deactivate course."
      );
    }
  }
);

export const activateCourseThunk = createAsyncThunk(
  "courses/activate",
  async (id, { rejectWithValue }) => {
    try {
      const response = await activateCourse(id);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to activate course."
      );
    }
  }
);

// ── Checklist template thunks ─────────────────────────────────────────────────

export const fetchChecklistTemplate = createAsyncThunk(
  "courses/fetchChecklist",
  async (courseId, { rejectWithValue }) => {
    try {
      const response = await getChecklistTemplate(courseId);
      return response.data.data;
    } catch (error) {
      if (error.response?.status === 404) return null;
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch checklist."
      );
    }
  }
);

export const createChecklistThunk = createAsyncThunk(
  "courses/createChecklist",
  async ({ courseId, data }, { rejectWithValue }) => {
    try {
      const response = await createChecklistTemplate(courseId, data);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to create checklist."
      );
    }
  }
);

export const addStepThunk = createAsyncThunk(
  "courses/addStep",
  async ({ courseId, data }, { rejectWithValue }) => {
    try {
      const response = await addChecklistStep(courseId, data);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to add step."
      );
    }
  }
);

export const updateStepThunk = createAsyncThunk(
  "courses/updateStep",
  async ({ courseId, stepId, data }, { rejectWithValue }) => {
    try {
      const response = await updateChecklistStep(courseId, stepId, data);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to update step."
      );
    }
  }
);

export const deleteStepThunk = createAsyncThunk(
  "courses/deleteStep",
  async ({ courseId, stepId }, { rejectWithValue }) => {
    try {
      const response = await deleteChecklistStep(courseId, stepId);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to delete step."
      );
    }
  }
);

export const reorderStepsThunk = createAsyncThunk(
  "courses/reorderSteps",
  async ({ courseId, steps }, { rejectWithValue }) => {
    try {
      const response = await reorderChecklistSteps(courseId, { steps });
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to reorder steps."
      );
    }
  }
);

// ─── Slice ────────────────────────────────────────────────────────────────────

const initialState = {
  courses: [],
  listLoading: false,
  listError: null,

  selected: null,
  detailLoading: false,
  detailError: null,

  checklist: null,
  checklistLoading: false,
  checklistError: null,

  mutating: false,
  mutateError: null,
};

// Helper — update course in list and selected
const handleCourseFulfilled = (state, action) => {
  state.mutating = false;
  state.mutateError = null;
  if (action.payload?._id) {
    state.selected = action.payload;
    const index = state.courses.findIndex(
      (c) => c._id === action.payload._id
    );
    if (index !== -1) state.courses[index] = action.payload;
  }
};

// Helper — update checklist in state
const handleChecklistFulfilled = (state, action) => {
  state.mutating = false;
  state.mutateError = null;
  if (action.payload) state.checklist = action.payload;
};

const coursesSlice = createSlice({
  name: "courses",
  initialState,
  reducers: {
    clearSelected: (state) => {
      state.selected = null;
      state.checklist = null;
      state.detailError = null;
      state.checklistError = null;
    },
    clearMutateError: (state) => {
      state.mutateError = null;
    },
  },
  extraReducers: (builder) => {
    // ── Fetch all ──────────────────────────────────────────────────────────
    builder
      .addCase(fetchCourses.pending, (state) => {
        state.listLoading = true;
        state.listError = null;
      })
      .addCase(fetchCourses.fulfilled, (state, action) => {
        state.listLoading = false;
        state.courses = action.payload;
      })
      .addCase(fetchCourses.rejected, (state, action) => {
        state.listLoading = false;
        state.listError = action.payload;
      });

    // ── Fetch by ID ────────────────────────────────────────────────────────
    builder
      .addCase(fetchCourseById.pending, (state) => {
        state.detailLoading = true;
        state.detailError = null;
        state.selected = null;
      })
      .addCase(fetchCourseById.fulfilled, (state, action) => {
        state.detailLoading = false;
        state.selected = action.payload;
      })
      .addCase(fetchCourseById.rejected, (state, action) => {
        state.detailLoading = false;
        state.detailError = action.payload;
      });

    // ── Add ────────────────────────────────────────────────────────────────
    builder
      .addCase(addCourse.pending, (state) => {
        state.mutating = true;
        state.mutateError = null;
      })
      .addCase(addCourse.fulfilled, (state, action) => {
        state.mutating = false;
        state.courses.unshift(action.payload);
      })
      .addCase(addCourse.rejected, (state, action) => {
        state.mutating = false;
        state.mutateError = action.payload;
      });

    // ── Edit ───────────────────────────────────────────────────────────────
    builder
      .addCase(editCourse.pending, (state) => {
        state.mutating = true;
        state.mutateError = null;
      })
      .addCase(editCourse.fulfilled, handleCourseFulfilled)
      .addCase(editCourse.rejected, (state, action) => {
        state.mutating = false;
        state.mutateError = action.payload;
      });

    // ── Remove ─────────────────────────────────────────────────────────────
    builder
      .addCase(removeCourse.pending, (state) => {
        state.mutating = true;
        state.mutateError = null;
      })
      .addCase(removeCourse.fulfilled, (state, action) => {
        state.mutating = false;
        state.courses = state.courses.filter(
          (c) => c._id !== action.payload
        );
      })
      .addCase(removeCourse.rejected, (state, action) => {
        state.mutating = false;
        state.mutateError = action.payload;
      });

    // ── Deactivate / Activate ──────────────────────────────────────────────
    builder
      .addCase(deactivateCourseThunk.pending, (state) => {
        state.mutating = true;
        state.mutateError = null;
      })
      .addCase(deactivateCourseThunk.fulfilled, handleCourseFulfilled)
      .addCase(deactivateCourseThunk.rejected, (state, action) => {
        state.mutating = false;
        state.mutateError = action.payload;
      });

    builder
      .addCase(activateCourseThunk.pending, (state) => {
        state.mutating = true;
        state.mutateError = null;
      })
      .addCase(activateCourseThunk.fulfilled, handleCourseFulfilled)
      .addCase(activateCourseThunk.rejected, (state, action) => {
        state.mutating = false;
        state.mutateError = action.payload;
      });

    // ── Fetch checklist ────────────────────────────────────────────────────
    builder
      .addCase(fetchChecklistTemplate.pending, (state) => {
        state.checklistLoading = true;
        state.checklistError = null;
      })
      .addCase(fetchChecklistTemplate.fulfilled, (state, action) => {
        state.checklistLoading = false;
        state.checklist = action.payload;
      })
      .addCase(fetchChecklistTemplate.rejected, (state, action) => {
        state.checklistLoading = false;
        state.checklistError = action.payload;
      });

    // ── All checklist mutations ────────────────────────────────────────────
    const checklistMutations = [
      createChecklistThunk,
      addStepThunk,
      updateStepThunk,
      deleteStepThunk,
      reorderStepsThunk,
    ];

    checklistMutations.forEach((thunk) => {
      builder
        .addCase(thunk.pending, (state) => {
          state.mutating = true;
          state.mutateError = null;
        })
        .addCase(thunk.fulfilled, handleChecklistFulfilled)
        .addCase(thunk.rejected, (state, action) => {
          state.mutating = false;
          state.mutateError = action.payload;
        });
    });
  },
});

export const { clearSelected, clearMutateError } = coursesSlice.actions;
export default coursesSlice.reducer;