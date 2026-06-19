import {createRoot} from 'react-dom/client';
import App from './App';
import './index.css';
import { LabelProvider } from '@/context/LabelContext';
import { LanguageProvider } from '@/context/LanguageContext';

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

createRoot(document.getElementById('root')!).render(
  <LabelProvider>
    <LanguageProvider>
      <App />
    </LanguageProvider>
  </LabelProvider>
);
