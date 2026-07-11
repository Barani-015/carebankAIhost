export default function Panel({ children, className = "", label, corner = true }) {
  return (
    <div
      className={`relative bg-void-850/70 border border-void-600/60 backdrop-blur-sm ${
        corner ? "corner-frame" : ""
      } ${className}`}
    >
      {label && (
        <div className="absolute -top-2.5 left-4 bg-void-950 px-2 text-[10px] tracking-[0.2em] text-amber-500/80 font-mono uppercase">
          {label}
        </div>
      )}
      {children}
    </div>
  );
}
