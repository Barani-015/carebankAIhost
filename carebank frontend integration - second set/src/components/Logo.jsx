export default function Logo({ className = "" }) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <div className="relative w-7 h-7 flex items-center justify-center">
        <div className="absolute inset-0 rounded-full bg-amber-500/20 animate-pulseSoft" />
        <div className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-glow" />
        <svg viewBox="0 0 32 32" className="absolute inset-0 w-full h-full">
          <circle
            cx="16"
            cy="16"
            r="14"
            fill="none"
            stroke="rgba(245,169,63,0.4)"
            strokeWidth="1"
            strokeDasharray="4 5"
          />
        </svg>
      </div>
      <span className="font-display font-semibold tracking-[0.15em] text-bone text-lg">
        CAREBANK
      </span>
    </div>
  );
}
