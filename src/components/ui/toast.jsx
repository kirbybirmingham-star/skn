import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';

const Toast = ({
  id,
  title,
  description,
  variant = 'default',
  onClose,
  duration = 5000,
  action
}) => {
  const [isVisible, setIsVisible] = React.useState(true);

  React.useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(onClose, 300); // Allow exit animation
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const getVariantStyles = () => {
    switch (variant) {
      case 'success':
        return {
          icon: <CheckCircle className="w-5 h-5 text-green-500" />,
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          titleColor: 'text-green-800',
          descriptionColor: 'text-green-700'
        };
      case 'error':
      case 'destructive':
        return {
          icon: <AlertCircle className="w-5 h-5 text-red-500" />,
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          titleColor: 'text-red-800',
          descriptionColor: 'text-red-700'
        };
      case 'warning':
        return {
          icon: <AlertTriangle className="w-5 h-5 text-yellow-500" />,
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          titleColor: 'text-yellow-800',
          descriptionColor: 'text-yellow-700'
        };
      case 'info':
        return {
          icon: <Info className="w-5 h-5 text-blue-500" />,
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          titleColor: 'text-blue-800',
          descriptionColor: 'text-blue-700'
        };
      default:
        return {
          icon: <Info className="w-5 h-5 text-primary" />,
          bgColor: 'bg-card',
          borderColor: 'border-border',
          titleColor: 'text-foreground',
          descriptionColor: 'text-muted-foreground'
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className={`relative pointer-events-auto flex w-full max-w-md rounded-lg border p-4 shadow-lg ${styles.bgColor} ${styles.borderColor}`}
        >
          <div className="flex items-start gap-3 w-full">
            <div className="flex-shrink-0">
              {styles.icon}
            </div>
            <div className="flex-1 min-w-0">
              {title && (
                <div className={`text-sm font-semibold ${styles.titleColor}`}>
                  {title}
                </div>
              )}
              {description && (
                <div className={`text-sm ${styles.descriptionColor} mt-1`}>
                  {description}
                </div>
              )}
              {action && (
                <div className="mt-3">
                  {action}
                </div>
              )}
            </div>
            <button
              onClick={() => {
                setIsVisible(false);
                setTimeout(onClose, 300);
              }}
              className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// ToastProvider and related components for compatibility
const ToastProvider = ({ children }) => (
  <div className="fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]">
    {children}
  </div>
);

const ToastViewport = () => null;
const ToastTitle = ({ children }) => <div className="text-sm font-semibold">{children}</div>;
const ToastDescription = ({ children }) => <div className="text-sm opacity-90">{children}</div>;
const ToastClose = ({ onClick }) => (
  <button onClick={onClick} className="absolute right-2 top-2 rounded-md p-1 text-foreground/50 opacity-0 transition-opacity hover:text-foreground focus:opacity-100 focus:outline-none focus:ring-2 group-hover:opacity-100 group-[.destructive]:text-red-300 group-[.destructive]:hover:text-red-50 group-[.destructive]:focus:ring-red-400 group-[.destructive]:focus:ring-offset-red-600">
    <X className="h-4 w-4" />
  </button>
);

export {
  Toast,
  ToastProvider,
  ToastViewport,
  ToastTitle,
  ToastDescription,
  ToastClose
};