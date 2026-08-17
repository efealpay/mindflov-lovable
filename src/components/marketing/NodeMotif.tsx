export function NodeMotif({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 400 240"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <g fill="none" stroke="currentColor" strokeWidth="1">
        <line x1="60" y1="120" x2="180" y2="50" />
        <line x1="60" y1="120" x2="180" y2="120" />
        <line x1="60" y1="120" x2="180" y2="190" />
        <line x1="180" y1="50" x2="320" y2="30" />
        <line x1="180" y1="50" x2="320" y2="90" />
        <line x1="180" y1="120" x2="320" y2="140" />
        <line x1="180" y1="190" x2="320" y2="200" />
      </g>
      <circle cx="60" cy="120" r="10" className="fill-indigo-400" />
      <circle cx="180" cy="50" r="6" className="fill-slate-500" />
      <circle cx="180" cy="120" r="6" className="fill-slate-500" />
      <circle cx="180" cy="190" r="6" className="fill-slate-500" />
      <circle cx="320" cy="30" r="4" className="fill-emerald-400" />
      <circle cx="320" cy="90" r="4" className="fill-emerald-400" />
      <circle cx="320" cy="140" r="4" className="fill-emerald-400" />
      <circle cx="320" cy="200" r="4" className="fill-emerald-400" />
    </svg>
  );
}

export function LineMotif({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 400 60" className={className} aria-hidden="true" focusable="false">
      <line x1="10" y1="30" x2="390" y2="30" stroke="currentColor" strokeWidth="1" />
      <circle cx="10" cy="30" r="5" className="fill-indigo-400" />
      <circle cx="140" cy="30" r="5" className="fill-slate-500" />
      <circle cx="270" cy="30" r="5" className="fill-slate-500" />
      <circle cx="390" cy="30" r="5" className="fill-slate-500" />
    </svg>
  );
}
