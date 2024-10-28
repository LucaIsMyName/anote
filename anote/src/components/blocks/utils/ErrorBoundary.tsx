// src/components/ErrorBoundary.tsx
import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode; // Optional custom fallback UI
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * @description A component that catches JavaScript errors anywhere in its child component tree.
 * It logs those errors, and displays a fallback UI instead of crashing the entire application.
 * @example
 * ```tsx
<ErrorBoundary>
  <MyComponent />
</ErrorBoundary>
```
  * @example
```tsx
<ErrorBoundary fallback={<CustomErrorUI />}>
  <MyComponent />
</ErrorBoundary>
```
 */
class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // You can log the error to an error reporting service here
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        this.props.fallback || (
          <div className="p-4 rounded-lg bg-red-50 border border-red-200">
            <h2 className="text-lg font-semibold text-red-800">Something went wrong</h2>
            <details className="mt-2 text-sm text-red-700">
              <summary>Error details</summary>
              <pre className="mt-2 whitespace-pre-wrap">{this.state.error?.toString()}</pre>
            </details>
          </div>
        )
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
