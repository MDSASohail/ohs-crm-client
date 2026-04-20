import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  createPayment,
  getPayment,
  updatePayment,
  addTransaction,
  updateTransaction,
  deleteTransaction,
  addExpense,
  updateExpense,
  deleteExpense,
} from "../../services/payment.service";

// ─── Async Thunks ─────────────────────────────────────────────────────────────

export const createPaymentThunk = createAsyncThunk(
  "payments/create",
  async (data, { rejectWithValue }) => {
    try {
      const response = await createPayment(data);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to create payment record."
      );
    }
  }
);

export const fetchPayment = createAsyncThunk(
  "payments/fetch",
  async (enrollmentId, { rejectWithValue }) => {
    try {
      const response = await getPayment(enrollmentId);
      return response.data.data;
    } catch (error) {
      // 404 means no payment record yet — not a hard error
      if (error.response?.status === 404) return null;
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch payment."
      );
    }
  }
);

export const updatePaymentThunk = createAsyncThunk(
  "payments/update",
  async ({ enrollmentId, data }, { rejectWithValue }) => {
    try {
      const response = await updatePayment(enrollmentId, data);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to update payment."
      );
    }
  }
);

// ── Transactions ──────────────────────────────────────────────────────────────

export const addTransactionThunk = createAsyncThunk(
  "payments/addTransaction",
  async ({ enrollmentId, data }, { rejectWithValue }) => {
    try {
      const response = await addTransaction(enrollmentId, data);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to add transaction."
      );
    }
  }
);

export const updateTransactionThunk = createAsyncThunk(
  "payments/updateTransaction",
  async ({ enrollmentId, transactionId, data }, { rejectWithValue }) => {
    try {
      const response = await updateTransaction(enrollmentId, transactionId, data);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to update transaction."
      );
    }
  }
);

export const deleteTransactionThunk = createAsyncThunk(
  "payments/deleteTransaction",
  async ({ enrollmentId, transactionId }, { rejectWithValue }) => {
    try {
      const response = await deleteTransaction(enrollmentId, transactionId);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to delete transaction."
      );
    }
  }
);

// ── Expenses ──────────────────────────────────────────────────────────────────

export const addExpenseThunk = createAsyncThunk(
  "payments/addExpense",
  async ({ enrollmentId, data }, { rejectWithValue }) => {
    try {
      const response = await addExpense(enrollmentId, data);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to add expense."
      );
    }
  }
);

export const updateExpenseThunk = createAsyncThunk(
  "payments/updateExpense",
  async ({ enrollmentId, expenseId, data }, { rejectWithValue }) => {
    try {
      const response = await updateExpense(enrollmentId, expenseId, data);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to update expense."
      );
    }
  }
);

export const deleteExpenseThunk = createAsyncThunk(
  "payments/deleteExpense",
  async ({ enrollmentId, expenseId }, { rejectWithValue }) => {
    try {
      const response = await deleteExpense(enrollmentId, expenseId);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to delete expense."
      );
    }
  }
);

// ─── Slice ────────────────────────────────────────────────────────────────────

const initialState = {
  // Current payment record being viewed
  current: null,
  loading: false,
  error: null,

  // Mutation state — any add/update/delete
  mutating: false,
  mutateError: null,
};

// Helper — all fulfilled thunks that return the updated payment record
const handlePaymentFulfilled = (state, action) => {
  state.mutating = false;
  state.mutateError = null;
  if (action.payload) state.current = action.payload;
};

const paymentsSlice = createSlice({
  name: "payments",
  initialState,
  reducers: {
    clearPayment: (state) => {
      state.current = null;
      state.error = null;
      state.mutateError = null;
    },
    clearMutateError: (state) => {
      state.mutateError = null;
    },
  },
  extraReducers: (builder) => {
    // ── Fetch ──────────────────────────────────────────────────────────────
    builder
      .addCase(fetchPayment.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.current = null;
      })
      .addCase(fetchPayment.fulfilled, (state, action) => {
        state.loading = false;
        state.current = action.payload; // null if 404
      })
      .addCase(fetchPayment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // ── Create ─────────────────────────────────────────────────────────────
    builder
      .addCase(createPaymentThunk.pending, (state) => {
        state.mutating = true;
        state.mutateError = null;
      })
      .addCase(createPaymentThunk.fulfilled, handlePaymentFulfilled)
      .addCase(createPaymentThunk.rejected, (state, action) => {
        state.mutating = false;
        state.mutateError = action.payload;
      });

    // ── Update payment ─────────────────────────────────────────────────────
    builder
      .addCase(updatePaymentThunk.pending, (state) => {
        state.mutating = true;
        state.mutateError = null;
      })
      .addCase(updatePaymentThunk.fulfilled, handlePaymentFulfilled)
      .addCase(updatePaymentThunk.rejected, (state, action) => {
        state.mutating = false;
        state.mutateError = action.payload;
      });

    // ── Add transaction ────────────────────────────────────────────────────
    builder
      .addCase(addTransactionThunk.pending, (state) => {
        state.mutating = true;
        state.mutateError = null;
      })
      .addCase(addTransactionThunk.fulfilled, handlePaymentFulfilled)
      .addCase(addTransactionThunk.rejected, (state, action) => {
        state.mutating = false;
        state.mutateError = action.payload;
      });

    // ── Update transaction ─────────────────────────────────────────────────
    builder
      .addCase(updateTransactionThunk.pending, (state) => {
        state.mutating = true;
        state.mutateError = null;
      })
      .addCase(updateTransactionThunk.fulfilled, handlePaymentFulfilled)
      .addCase(updateTransactionThunk.rejected, (state, action) => {
        state.mutating = false;
        state.mutateError = action.payload;
      });

    // ── Delete transaction ─────────────────────────────────────────────────
    builder
      .addCase(deleteTransactionThunk.pending, (state) => {
        state.mutating = true;
        state.mutateError = null;
      })
      .addCase(deleteTransactionThunk.fulfilled, handlePaymentFulfilled)
      .addCase(deleteTransactionThunk.rejected, (state, action) => {
        state.mutating = false;
        state.mutateError = action.payload;
      });

    // ── Add expense ────────────────────────────────────────────────────────
    builder
      .addCase(addExpenseThunk.pending, (state) => {
        state.mutating = true;
        state.mutateError = null;
      })
      .addCase(addExpenseThunk.fulfilled, handlePaymentFulfilled)
      .addCase(addExpenseThunk.rejected, (state, action) => {
        state.mutating = false;
        state.mutateError = action.payload;
      });

    // ── Update expense ─────────────────────────────────────────────────────
    builder
      .addCase(updateExpenseThunk.pending, (state) => {
        state.mutating = true;
        state.mutateError = null;
      })
      .addCase(updateExpenseThunk.fulfilled, handlePaymentFulfilled)
      .addCase(updateExpenseThunk.rejected, (state, action) => {
        state.mutating = false;
        state.mutateError = action.payload;
      });

    // ── Delete expense ─────────────────────────────────────────────────────
    builder
      .addCase(deleteExpenseThunk.pending, (state) => {
        state.mutating = true;
        state.mutateError = null;
      })
      .addCase(deleteExpenseThunk.fulfilled, handlePaymentFulfilled)
      .addCase(deleteExpenseThunk.rejected, (state, action) => {
        state.mutating = false;
        state.mutateError = action.payload;
      });
  },
});

export const { clearPayment, clearMutateError } = paymentsSlice.actions;
export default paymentsSlice.reducer;