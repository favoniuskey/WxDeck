interface Props {
  className?: string;
  strokeWidth?: number;
}

export function TowerIcon({ className = 'w-6 h-6', strokeWidth = 1.6 }: Props) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M10.5 3.2a1.5 1.5 0 0 1 3 0v1.3h-3z" />
      <line x1="12" y1="2" x2="12" y2="1.2" />
      <rect x="8.2" y="4.5" width="7.6" height="3.6" rx="0.3" />
      <line x1="10" y1="4.8" x2="10" y2="8.1" />
      <line x1="12" y1="4.8" x2="12" y2="8.1" />
      <line x1="14" y1="4.8" x2="14" y2="8.1" />
      <rect x="6.2" y="9" width="11.6" height="3.6" rx="0.3" />
      <line x1="9" y1="9.3" x2="9" y2="12.6" />
      <line x1="12" y1="9.3" x2="12" y2="12.6" />
      <line x1="15" y1="9.3" x2="15" y2="12.6" />
      <line x1="9.8" y1="12.7" x2="9.8" y2="20.5" />
      <line x1="14.2" y1="12.7" x2="14.2" y2="20.5" />
      <line x1="7.8" y1="21" x2="16.2" y2="21" />
      <path d="M18 5.6l2.4 -1.2 m-0.9 0.5 l-0.4 -0.8 m0.4 0.8 l0.8 -0.4 m-0.8 0.4 l-1.2 1" />
    </svg>
  );
}
