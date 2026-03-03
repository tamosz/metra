import { Component, type ReactNode } from 'react';

interface ErrorBoundaryProps {
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  children: ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.props.onError?.(error, errorInfo);
  }

  render() {
    if (this.state.error) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="mx-auto my-12 max-w-md rounded-lg border border-red-700/30 bg-red-950/20 p-6 text-center">
          <p className="mb-1 text-sm font-medium text-red-400">Something went wrong</p>
          <p className="mb-4 text-xs text-text-dim">{this.state.error.message}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="cursor-pointer rounded border border-border-default bg-bg-raised px-3 py-1.5 text-xs text-text-muted hover:text-text-primary transition-colors"
          >
            Reload page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
