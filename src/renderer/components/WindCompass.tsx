interface Props {
  direction: number | 'VRB';
  speed: number;
  gust?: number;
}

export function WindCompass({ direction, speed, gust }: Props) {
  const isVrb = direction === 'VRB';
  const rotation = isVrb ? 0 : ((direction as number) + 180) % 360;
  const cardinals = ['N', 'E', 'S', 'W'];

  return (
    <div className="relative w-56 h-56 mx-auto">
      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/[0.04] to-transparent border border-white/10 backdrop-blur-md" />
      <svg viewBox="0 0 200 200" className="absolute inset-0 -rotate-0">
        <defs>
          <linearGradient id="needle" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#f87171" stopOpacity="0.9" />
          </linearGradient>
        </defs>
        {Array.from({ length: 36 }).map((_, i) => {
          const angle = i * 10;
          const long = i % 9 === 0;
          return (
            <line
              key={i}
              x1="100"
              y1={long ? 14 : 18}
              x2="100"
              y2={long ? 24 : 22}
              stroke="rgba(255,255,255,0.35)"
              strokeWidth={long ? 1.6 : 0.8}
              transform={`rotate(${angle} 100 100)`}
            />
          );
        })}
        {cardinals.map((c, i) => (
          <text
            key={c}
            x="100"
            y={i === 0 ? 10 : i === 2 ? 196 : 104}
            textAnchor="middle"
            transform={i === 1 ? 'translate(90 0)' : i === 3 ? 'translate(-90 0)' : ''}
            fill="rgba(226,232,240,0.55)"
            fontSize="10"
            fontWeight="600"
            letterSpacing="0.1em"
          >
            {c}
          </text>
        ))}
        {!isVrb && (
          <g style={{ transform: `rotate(${rotation}deg)`, transformOrigin: '100px 100px', transition: 'transform 800ms ease' }}>
            <polygon points="100,30 92,52 100,46 108,52" fill="url(#needle)" />
            <line x1="100" y1="46" x2="100" y2="100" stroke="rgba(251,191,36,0.4)" strokeWidth="2" />
          </g>
        )}
        <circle cx="100" cy="100" r="3" fill="rgba(255,255,255,0.6)" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <div className="text-5xl font-bold tabular-nums tracking-tight">
          {isVrb ? 'VRB' : String(direction).padStart(3, '0')}
        </div>
        <div className="text-xs text-ink-400 uppercase tracking-[0.2em] mt-1">Direction</div>
        <div className="mt-3 flex items-baseline gap-1">
          <span className="text-2xl font-semibold tabular-nums">{Math.round(speed)}</span>
          <span className="text-xs text-ink-400 uppercase">kt</span>
          {gust && gust > 0 && (
            <span className="text-xs text-accent-warm ml-1">G{Math.round(gust)}</span>
          )}
        </div>
      </div>
    </div>
  );
}
