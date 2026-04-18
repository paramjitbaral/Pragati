import * as React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    (this as any).state = {
      hasError: false,
      error: null,
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  private handleReset = () => {
    (this as any).setState({ hasError: false, error: null });
    window.location.reload();
  };

  private handleGoHome = () => {
    (this as any).setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  public render() {
    const state = (this as any).state as State;
    if (state.hasError) {
      let errorMessage = "An unexpected error occurred.";
      let isFirestoreError = false;

      try {
        if (state.error?.message) {
          const parsed = JSON.parse(state.error.message);
          if (parsed.error && parsed.operationType) {
            errorMessage = `Database Error: ${parsed.error} during ${parsed.operationType} on ${parsed.path || 'unknown path'}`;
            isFirestoreError = true;
          }
        }
      } catch (e) {
        errorMessage = state.error?.message || errorMessage;
      }

      return (
        <div className="min-h-screen bg-surface flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white rounded-[2rem] shadow-2xl p-12 text-center border border-error/10">
            <div className="w-20 h-20 rounded-full bg-error/10 flex items-center justify-center text-error mx-auto mb-8">
              <AlertTriangle className="w-12 h-12" />
            </div>
            
            <h2 className="font-headline font-black text-3xl text-primary mb-4">
              {isFirestoreError ? 'Access Denied' : 'System Failure'}
            </h2>
            
            <p className="text-outline font-medium text-sm leading-relaxed mb-8">
              {errorMessage}
            </p>

            <div className="space-y-3">
              <button
                onClick={this.handleReset}
                className="w-full bg-primary text-white py-3.5 rounded-xl font-bold uppercase tracking-widest text-[10px] flex items-center justify-center gap-2.5 hover:bg-primary-container transition-all active:scale-[0.98]"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Restart Session
              </button>
              
              <button
                onClick={this.handleGoHome}
                className="w-full bg-surface-container-high text-primary py-3.5 rounded-xl font-bold uppercase tracking-widest text-[10px] flex items-center justify-center gap-2.5 hover:bg-surface-container-highest transition-all active:scale-[0.98]"
              >
                <Home className="w-3.5 h-3.5" /> Return to Base
              </button>
            </div>
            
            {isFirestoreError && (
              <p className="mt-8 text-[10px] text-outline font-bold uppercase tracking-widest opacity-50">
                Security Protocol Violation Detected
              </p>
            )}
          </div>
        </div>
      );
    }

    return (this as any).props.children;
  }
}
