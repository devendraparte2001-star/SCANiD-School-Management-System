import {createRoot} from 'react-dom/client';
import React, { Component, ErrorInfo, ReactNode } from 'react';
import App from './App';
import './index.css';
import { LabelProvider } from '@/context/LabelContext';
import { LanguageProvider } from '@/context/LanguageContext';

console.log("[main.tsx] Script loaded and executing...");

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("[main.tsx] Uncaught error in React render tree:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: "30px", background: "#1e293b", color: "#f8fafc", fontFamily: "monospace", minHeight: "100vh" }}>
          <h1 style={{ color: "#ef4444", fontSize: "24px", marginBottom: "15px" }}>⚠️ Application Failed to Render</h1>
          <p style={{ fontSize: "16px", marginBottom: "10px" }}>An unexpected runtime error occurred inside the React render tree.</p>
          <pre style={{ background: "#0f172a", padding: "15px", borderRadius: "8px", overflowX: "auto", border: "1px solid #334155" }}>
            {this.state.error?.stack || this.state.error?.message || String(this.state.error)}
          </pre>
          <button 
            style={{ marginTop: "15px", padding: "10px 20px", background: "#3b82f6", border: "none", color: "#fff", borderRadius: "5px", cursor: "pointer" }}
            onClick={() => { localStorage.clear(); window.location.reload(); }}
          >
            Clear Cache & Reload
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Safely suppress benign ResizeObserver loop errors/warnings from chart resizing events to keep development console clean
if (typeof window !== "undefined") {
  const preventResizeObserverError = (e: ErrorEvent) => {
    if (
      e.message === "ResizeObserver loop limit exceeded" ||
      e.message === "ResizeObserver loop completed with undelivered notifications"
    ) {
      e.stopImmediatePropagation();
    }
  };
  window.addEventListener("error", preventResizeObserverError);
}

console.log("[main.tsx] Mounting React root...");
try {
  const container = document.getElementById('root');
  if (!container) {
    console.error("[main.tsx] Fatal: Root element '#root' not found in document!");
  } else {
    const root = createRoot(container);
    root.render(
      <React.StrictMode>
        <ErrorBoundary>
          <LabelProvider>
            <LanguageProvider>
              <App />
            </LanguageProvider>
          </LabelProvider>
        </ErrorBoundary>
      </React.StrictMode>
    );
    console.log("[main.tsx] Render triggered successfully.");
  }
} catch (err) {
  console.error("[main.tsx] Fatal error during React mounting:", err);
}

