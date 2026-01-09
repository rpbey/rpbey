'use client';

import Alert, { type AlertColor } from '@mui/material/Alert';
import Slide, { type SlideProps } from '@mui/material/Slide';
import Snackbar from '@mui/material/Snackbar';
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useState,
} from 'react';

interface ToastMessage {
  id: number;
  message: string;
  severity: AlertColor;
  duration?: number;
}

interface ToastContextValue {
  showToast: (
    message: string,
    severity?: AlertColor,
    duration?: number,
  ) => void;
  showSuccess: (message: string, duration?: number) => void;
  showError: (message: string, duration?: number) => void;
  showWarning: (message: string, duration?: number) => void;
  showInfo: (message: string, duration?: number) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

function SlideTransition(props: SlideProps) {
  return <Slide {...props} direction="up" />;
}

interface ToastProviderProps {
  children: ReactNode;
  maxToasts?: number;
}

export function ToastProvider({ children, maxToasts = 3 }: ToastProviderProps) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [counter, setCounter] = useState(0);

  const showToast = useCallback(
    (message: string, severity: AlertColor = 'info', duration = 4000) => {
      const id = counter;
      setCounter((prev) => prev + 1);

      setToasts((prev) => {
        const newToasts = [...prev, { id, message, severity, duration }];
        // Limit number of toasts
        if (newToasts.length > maxToasts) {
          return newToasts.slice(-maxToasts);
        }
        return newToasts;
      });
    },
    [counter, maxToasts],
  );

  const showSuccess = useCallback(
    (message: string, duration?: number) =>
      showToast(message, 'success', duration),
    [showToast],
  );

  const showError = useCallback(
    (message: string, duration?: number) =>
      showToast(message, 'error', duration),
    [showToast],
  );

  const showWarning = useCallback(
    (message: string, duration?: number) =>
      showToast(message, 'warning', duration),
    [showToast],
  );

  const showInfo = useCallback(
    (message: string, duration?: number) =>
      showToast(message, 'info', duration),
    [showToast],
  );

  const handleClose = useCallback((id: number) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  return (
    <ToastContext.Provider
      value={{ showToast, showSuccess, showError, showWarning, showInfo }}
    >
      {children}
      {toasts.map((toast, index) => (
        <Snackbar
          key={toast.id}
          open
          autoHideDuration={toast.duration}
          onClose={() => handleClose(toast.id)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          TransitionComponent={SlideTransition}
          sx={{
            bottom: { xs: 24 + index * 60, sm: 24 + index * 60 },
          }}
        >
          <Alert
            onClose={() => handleClose(toast.id)}
            severity={toast.severity}
            variant="filled"
            sx={{ width: '100%', minWidth: 280 }}
          >
            {toast.message}
          </Alert>
        </Snackbar>
      ))}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
