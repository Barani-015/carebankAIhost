function niceMax(value) {
  if (value <= 0) return 100;
  const magnitude = Math.pow(10, Math.floor(Math.log10(value)));
  const residual = value / magnitude;
  let niceResidual;
  if (residual > 5) niceResidual = 10;
  else if (residual > 2) niceResidual = 5;
  else if (residual > 1) niceResidual = 2;
  else niceResidual = 1;
  return niceResidual * magnitude;
}

function formatTick(n) {
  if (n >= 1000) return `${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}k`;
  return `${n}`;
}

export default function BarChart({ data, currencySymbol = "$", height = 380 }) {
  const max = niceMax(Math.max(...data.map((d) => d.value), 0));
  const tickCount = 5;
  const ticks = Array.from({ length: tickCount + 1 }, (_, i) => (max / tickCount) * i).reverse();

  const chartHeight = height;
  const barAreaTop = 1;
  const barAreaBottom = chartHeight - 32;
  const usableHeight = barAreaBottom - barAreaTop;

  return (
    <div className="flex gap-3" style={{ height: chartHeight }}>
      <div
        className="flex flex-col justify-between text-[10px] font-mono text-bone/35 shrink-0 pb-8 pt-[12px] text-right"
        style={{ width: 44 }}
      >
        {ticks.map((t, i) => (
          <span key={i}>
            {currencySymbol}
            {formatTick(Math.round(t))}
          </span>
        ))}
      </div>

      <div className="flex-1 relative mt-[1px]">
        <div
          className="absolute inset-x-0 flex flex-col justify-between"
          style={{ top: barAreaTop, bottom: 32 }}
        >
          {ticks.map((_, i) => (
            <div key={i} className="h-px bg-void-600/50" />
          ))}
        </div>

        <div className="relative flex items-end justify-around h-full gap-3 px-1" style={{ paddingBottom: 32 }}>
          {data.map((d) => {
            const barHeight = max > 0 ? Math.max((d.value / max) * usableHeight, d.value > 0 ? 4 : 0) : 0;
            return (
              <div
                key={d.label}
                className="relative flex-1 max-w-[72px] flex flex-col items-center justify-end h-full group"
              >
                <span className="mb-1.5 text-[10px] font-mono text-bone/50 opacity-0 group-hover:opacity-100 transition-opacity">
                  {currencySymbol}
                  {Math.round(d.value).toLocaleString()}
                </span>
                <div
                  className="w-full rounded-t-md bg-gradient-to-t from-amber-600 to-amber-400 shadow-[0_0_16px_rgba(245,169,63,0.25)] transition-all"
                  style={{ height: barHeight }}
                />
                <span className="absolute -bottom-6 text-[11px] text-bone/50 truncate max-w-full">
                  {d.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
