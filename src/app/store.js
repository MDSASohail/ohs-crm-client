import { configureStore } from "@reduxjs/toolkit";
import authReducer from "../features/auth/authSlice";
import candidatesReducer from "../features/candidates/candidatesSlice";
import enrollmentsReducer from "../features/enrollments/enrollmentsSlice";
import paymentsReducer from "../features/payments/paymentsSlice";
import institutesReducer from "../features/institutes/institutesSlice";
import coursesReducer from "../features/courses/coursesSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    candidates: candidatesReducer,
    enrollments: enrollmentsReducer,
    payments: paymentsReducer,
     institutes: institutesReducer,
     courses: coursesReducer,
  },
});