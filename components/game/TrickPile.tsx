"use client";

/**
 * Der Stapel gewonnener Stiche der laufenden Runde. Waechst genau
 * dann, wenn die Karten des Stichs beim Gewinner ankommen.
 */
export function TrickPile({
  count,
  highlight = false,
  label,
}: {
  count: number;
  highlight?: boolean;
  label?: string;
}) {
  const shown = Math.min(count, 6);

  const size: React.CSSProperties = {
    height: "clamp(1.6rem, 4.2vh, 2.6rem)",
    aspectRatio: "5 / 7",
  };

  return (
    <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
      <div
        className={[
          "relative shrink-0 transition-transform duration-300",
          highlight ? "scale-125" : "scale-100",
        ].join(" ")}
        style={size}
      >
        {count === 0 ? (
          <div className="h-full w-full rounded border border-dashed border-white/15" />
        ) : (
          Array.from({ length: shown }, (_, index) => (
            <div
              key={index}
              className={[
                "absolute inset-0 rounded border bg-gradient-to-br from-slate-900 to-black shadow",
                highlight ? "border-amber-300/70" : "border-amber-400/25",
              ].join(" ")}
              style={{
                transform: `translate(${index * 2}px, ${-index * 2}px) rotate(${
                  index % 2 === 0 ? -3 : 3
                }deg)`,
              }}
            />
          ))
        )}
      </div>

      <div className="leading-tight">
        <div
          className={[
            "font-black transition-colors duration-300",
            highlight ? "text-amber-300" : "text-white",
          ].join(" ")}
          style={{ fontSize: "clamp(0.8rem, 2.2vh, 1.1rem)" }}
        >
          {count}
        </div>

        {label && (
          <div className="text-[9px] uppercase tracking-[0.15em] text-white/40">
            {label}
          </div>
        )}
      </div>
    </div>
  );
}
