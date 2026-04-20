import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
    getEnrollments,
    getEnrollmentById,
    createEnrollment,
    updateEnrollment,
    deleteEnrollment,
    markStepDone as markStepDoneService,
    markStepUndone as markStepUndoneService,
    skipStep as skipStepService,
} from "../../services/enrollment.service";

// ─── Async Thunks ─────────────────────────────────────────────────────────────

export const fetchEnrollments = createAsyncThunk(
    "enrollments/fetchAll",
    async (params, { rejectWithValue }) => {
        try {
            const response = await getEnrollments(params);
            return response.data.data; // { enrollments, pagination }
        } catch (error) {
            return rejectWithValue(
                error.response?.data?.message || "Failed to fetch enrollments."
            );
        }
    }
);

export const fetchEnrollmentById = createAsyncThunk(
    "enrollments/fetchById",
    async (id, { rejectWithValue }) => {
        try {
            const response = await getEnrollmentById(id);
            return response.data.data;
        } catch (error) {
            return rejectWithValue(
                error.response?.data?.message || "Failed to fetch enrollment."
            );
        }
    }
);

export const addEnrollment = createAsyncThunk(
    "enrollments/add",
    async (data, { rejectWithValue }) => {
        try {
            const response = await createEnrollment(data);
            return response.data.data;
        } catch (error) {
            return rejectWithValue(
                error.response?.data?.message || "Failed to create enrollment."
            );
        }
    }
);

export const editEnrollment = createAsyncThunk(
    "enrollments/edit",
    async ({ id, data }, { rejectWithValue }) => {
        try {
            const response = await updateEnrollment(id, data);
            return response.data.data;
        } catch (error) {
            return rejectWithValue(
                error.response?.data?.message || "Failed to update enrollment."
            );
        }
    }
);

export const removeEnrollment = createAsyncThunk(
    "enrollments/remove",
    async (id, { rejectWithValue }) => {
        try {
            await deleteEnrollment(id);
            return id;
        } catch (error) {
            return rejectWithValue(
                error.response?.data?.message || "Failed to delete enrollment."
            );
        }
    }
);

export const markStepDoneThunk = createAsyncThunk(
    "enrollments/markStepDone",
    async ({ enrollmentId, stepId, data }, { rejectWithValue }) => {
        try {
            const response = await markStepDoneService(enrollmentId, stepId, data);
            return response.data.data;
        } catch (error) {
            return rejectWithValue(
                error.response?.data?.message || "Failed to mark step as done."
            );
        }
    }
);

export const markStepUndoneThunk = createAsyncThunk(
    "enrollments/markStepUndone",
    async ({ enrollmentId, stepId }, { rejectWithValue }) => {
        try {
            const response = await markStepUndoneService(enrollmentId, stepId);
            return response.data.data;
        } catch (error) {
            return rejectWithValue(
                error.response?.data?.message || "Failed to unmark step."
            );
        }
    }
);

export const skipStepThunk = createAsyncThunk(
    "enrollments/skipStep",
    async ({ enrollmentId, stepId, data }, { rejectWithValue }) => {
        try {
            const response = await skipStepService(enrollmentId, stepId, data);
            return response.data.data;
        } catch (error) {
            return rejectWithValue(
                error.response?.data?.message || "Failed to skip step."
            );
        }
    }
);

// ─── Slice ────────────────────────────────────────────────────────────────────

const initialState = {
    enrollments: [],
    pagination: {
        total: 0,
        page: 1,
        limit: 20,
        totalPages: 1,
    },
    listLoading: false,
    listError: null,

    selected: null,
    detailLoading: false,
    detailError: null,

    mutating: false,
    mutateError: null,
};

const enrollmentsSlice = createSlice({
    name: "enrollments",
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
            .addCase(fetchEnrollments.pending, (state) => {
                state.listLoading = true;
                state.listError = null;
            })
            .addCase(fetchEnrollments.fulfilled, (state, action) => {
                state.listLoading = false;
                state.enrollments = action.payload.enrollments;
                state.pagination = action.payload.pagination;
            })
            .addCase(fetchEnrollments.rejected, (state, action) => {
                state.listLoading = false;
                state.listError = action.payload;
            });

        // ── Fetch by ID ────────────────────────────────────────────────────────
        builder
            .addCase(fetchEnrollmentById.pending, (state) => {
                state.detailLoading = true;
                state.detailError = null;
                state.selected = null;
            })
            .addCase(fetchEnrollmentById.fulfilled, (state, action) => {
                state.detailLoading = false;
                state.selected = action.payload;
            })
            .addCase(fetchEnrollmentById.rejected, (state, action) => {
                state.detailLoading = false;
                state.detailError = action.payload;
            });

        // ── Add ────────────────────────────────────────────────────────────────
        builder
            .addCase(addEnrollment.pending, (state) => {
                state.mutating = true;
                state.mutateError = null;
            })
            .addCase(addEnrollment.fulfilled, (state, action) => {
                state.mutating = false;
                state.enrollments.unshift(action.payload);
            })
            .addCase(addEnrollment.rejected, (state, action) => {
                state.mutating = false;
                state.mutateError = action.payload;
            });

        // ── Edit ───────────────────────────────────────────────────────────────
        builder
            .addCase(editEnrollment.pending, (state) => {
                state.mutating = true;
                state.mutateError = null;
            })
            .addCase(editEnrollment.fulfilled, (state, action) => {
                state.mutating = false;
                const index = state.enrollments.findIndex(
                    (e) => e._id === action.payload._id
                );
                if (index !== -1) state.enrollments[index] = action.payload;
                if (state.selected?._id === action.payload._id) {
                    state.selected = action.payload;
                }
            })
            .addCase(editEnrollment.rejected, (state, action) => {
                state.mutating = false;
                state.mutateError = action.payload;
            });

        // ── Remove ─────────────────────────────────────────────────────────────
        builder
            .addCase(removeEnrollment.pending, (state) => {
                state.mutating = true;
                state.mutateError = null;
            })
            .addCase(removeEnrollment.fulfilled, (state, action) => {
                state.mutating = false;
                state.enrollments = state.enrollments.filter(
                    (e) => e._id !== action.payload
                );
            })
            .addCase(removeEnrollment.rejected, (state, action) => {
                state.mutating = false;
                state.mutateError = action.payload;
            });

        // ── Update checklist step ──────────────────────────────────────────────
        // ── Mark step done ─────────────────────────────────────────────────────
        builder
            .addCase(markStepDoneThunk.pending, (state) => {
                state.mutating = true;
                state.mutateError = null;
            })
            .addCase(markStepDoneThunk.fulfilled, (state, action) => {
                state.mutating = false;
                if (state.selected?._id === action.payload._id) {
                    state.selected = action.payload;
                }
            })
            .addCase(markStepDoneThunk.rejected, (state, action) => {
                state.mutating = false;
                state.mutateError = action.payload;
            });

        // ── Mark step undone ───────────────────────────────────────────────────
        builder
            .addCase(markStepUndoneThunk.pending, (state) => {
                state.mutating = true;
                state.mutateError = null;
            })
            .addCase(markStepUndoneThunk.fulfilled, (state, action) => {
                state.mutating = false;
                if (state.selected?._id === action.payload._id) {
                    state.selected = action.payload;
                }
            })
            .addCase(markStepUndoneThunk.rejected, (state, action) => {
                state.mutating = false;
                state.mutateError = action.payload;
            });

        // ── Skip step ──────────────────────────────────────────────────────────
        builder
            .addCase(skipStepThunk.pending, (state) => {
                state.mutating = true;
                state.mutateError = null;
            })
            .addCase(skipStepThunk.fulfilled, (state, action) => {
                state.mutating = false;
                if (state.selected?._id === action.payload._id) {
                    state.selected = action.payload;
                }
            })
            .addCase(skipStepThunk.rejected, (state, action) => {
                state.mutating = false;
                state.mutateError = action.payload;
            });
    },
});

export const { clearSelected, clearMutateError } = enrollmentsSlice.actions;
export default enrollmentsSlice.reducer;