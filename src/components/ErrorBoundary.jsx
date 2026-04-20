import { Component } from "react";

// Class component — required by React for error boundaries
// Catches any unexpected JS errors in the component tree
// and shows a clean fallback UI instead of a blank page
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // In production this would send to an error monitoring
    // service like Sentry — log for now
    console.error("ErrorBoundary caught:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-neutral flex items-center justify-center p-6">
          <div className="bg-white rounded-2xl border border-border shadow-sm p-8 max-w-md w-full text-center">
            {/* Icon */}
            <div className="h-16 w-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">⚠️</span>
            </div>

            <h1 className="text-xl font-semibold text-text-main mb-2">
              Something went wrong
            </h1>
            <p className="text-sm text-muted mb-6 leading-relaxed">
              An unexpected error occurred. This has been noted. Please
              try refreshing the page — if the problem persists, contact
              support.
            </p>

            {/* Error details — only in development */}
            {import.meta.env.DEV && this.state.error && (
              <details className="text-left mb-6">
                <summary className="text-xs font-medium text-muted cursor-pointer mb-2">
                  Error details (dev only)
                </summary>
                <pre className="text-xs text-danger bg-red-50 p-3 rounded-lg overflow-auto max-h-32">
                  {this.state.error.toString()}
                </pre>
              </details>
            )}

            <button
              onClick={() => window.location.reload()}
              className="w-full px-4 py-2.5 bg-accent text-white text-sm font-medium rounded-lg hover:bg-accent/90 transition-colors"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;