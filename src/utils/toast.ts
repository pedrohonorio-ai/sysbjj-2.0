type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

type Listener = (toasts: Toast[]) => void;

let toasts: Toast[] = [];
const listeners = new Set<Listener>();

function emit() {
  listeners.forEach(listener => listener([...toasts]));
}

export const toast = {
  success(message: string, duration = 4000) {
    const id = Math.random().toString(36).substring(2, 9);
    toasts.push({ id, type: 'success', message, duration });
    emit();
    setTimeout(() => this.dismiss(id), duration);
    return id;
  },
  error(message: string, duration = 4000) {
    const id = Math.random().toString(36).substring(2, 9);
    toasts.push({ id, type: 'error', message, duration });
    emit();
    setTimeout(() => this.dismiss(id), duration);
    return id;
  },
  info(message: string, duration = 4000) {
    const id = Math.random().toString(36).substring(2, 9);
    toasts.push({ id, type: 'info', message, duration });
    emit();
    setTimeout(() => this.dismiss(id), duration);
    return id;
  },
  dismiss(id: string) {
    toasts = toasts.filter(t => t.id !== id);
    emit();
  },
  subscribe(listener: Listener) {
    listeners.add(listener);
    listener([...toasts]);
    return () => {
      listeners.delete(listener);
    };
  }
};

