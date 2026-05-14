import type { ReactNode } from 'react';

interface Props {
  title?: string;
  icon?: ReactNode;
  right?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function GlassCard({ title, icon, right, children, className = '' }: Props) {
  return (
    <div className={`glass rounded-2xl p-4 animate-fade-in ${className}`}>
      {(title || icon || right) && (
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-ink-300 text-[11px] uppercase tracking-[0.18em] font-semibold">
            {icon}
            {title}
          </div>
          {right}
        </div>
      )}
      {children}
    </div>
  );
}
