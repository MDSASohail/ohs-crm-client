import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { Toaster } from "react-hot-toast";
import ErrorBoundary from "./components/ErrorBoundary";
import { store } from "./app/store";
import "./index.css";
import App from "./App";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ErrorBoundary>
      <Provider store={store}>
        <App />
        <Toaster
          position="top-right"
          gutter={8}
          toastOptions={{
            duration: 4000,
            style: {
              fontSize: "14px",
              fontFamily: "Inter, sans-serif",
              borderRadius: "10px",
              padding: "12px 16px",
              boxShadow:
                "0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)",
            },
            success: {
              duration: 3000,
              style: {
                background: "#f0fdf4",
                color: "#166534",
                border: "1px solid #bbf7d0",
              },
              iconTheme: {
                primary: "#27AE60",
                secondary: "#f0fdf4",
              },
            },
            error: {
              duration: 5000,
              style: {
                background: "#fef2f2",
                color: "#991b1b",
                border: "1px solid #fecaca",
              },
              iconTheme: {
                primary: "#E74C3C",
                secondary: "#fef2f2",
              },
            },
            loading: {
              style: {
                background: "#eff6ff",
                color: "#1e40af",
                border: "1px solid #bfdbfe",
              },
            },
          }}
        />
      </Provider>
    </ErrorBoundary>
  </StrictMode>
);