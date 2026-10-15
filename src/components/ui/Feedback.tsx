import { Loader2, type LucideIcon } from 'lucide-react';

export function Spinner({ className = '' }: { className?: string }) {
  return <Loader2 className={`h-5 w-5 animate-spin text-blue-600 ${className}`} />;
}

export function LoadingOverlay({ message }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3">
      <Spinner className="h-8 w-8" />
      {message && <p className="text-sm text-slate-500">{message}</p>}
    </div>
  );
}

export function TableSkeleton({ rows = 5, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="overflow-hidden">
      <div className="space-y-0">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex gap-4 px-6 py-4 border-b border-slate-100">
            {Array.from({ length: cols }).map((_, j) => (
              <div
                key={j}
                className="h-4 bg-slate-100 rounded animate-pulse flex-1"
                style={{ animationDelay: `${(i + j) * 80}ms` }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function FullPageLoader() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <div className="relative">
        <div className="h-12 w-12 rounded-full border-4 border-slate-200" />
        <div className="absolute inset-0 h-12 w-12 rounded-full border-4 border-blue-600 border-t-transparent animate-spin" />
      </div>
      <p className="text-sm text-slate-500 font-medium">Loading...</p>
    </div>
  );
}

export function ButtonSpinner() {
  return <Loader2 className="h-4 w-4 animate-spin" />;
}

export function EmptyState({
  icon: Icon,
  title,
  message,
  action,
}: {
  icon: LucideIcon;
  title: string;
  message: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
        <Icon className="h-8 w-8 text-slate-400" />
      </div>
      <h3 className="text-base font-bold text-slate-700 mb-1">{title}</h3>
      <p className="text-sm text-slate-500 max-w-sm mb-4">{message}</p>
      {action}
    </div>
  );
}
