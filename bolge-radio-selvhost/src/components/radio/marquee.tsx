import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export function MarqueeText({
  text,
  className,
}: {
  text: string;
  className?: string;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLSpanElement>(null);
  const [overflows, setOverflows] = useState(false);
  const [duration, setDuration] = useState(12);

  useEffect(() => {
    const wrap = wrapRef.current;
    const measure = measureRef.current;
    if (!wrap || !measure) return;

    const update = () => {
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const extra = measure.scrollWidth - wrap.clientWidth;
      const should = !reduce && extra > 4;
      setOverflows(should);
      if (should) {
        const seconds = Math.min(48, Math.max(9, (measure.scrollWidth + 40) / 42));
        setDuration(seconds);
      }
    };

    update();
    const ro = new ResizeObserver(update);
    ro.observe(wrap);
    ro.observe(measure);
    return () => ro.disconnect();
  }, [text]);

  return (
    <div
      ref={wrapRef}
      className={cn("marquee-wrap", !overflows && "is-static", className)}
    >
      <span ref={measureRef} className="marquee-measure">
        {text}
      </span>
      {overflows ? (
        <div className="marquee-track" style={{ animationDuration: `${duration}s` }}>
          <span className="marquee-item">{text}</span>
          <span className="marquee-item" aria-hidden="true">
            {text}
          </span>
        </div>
      ) : (
        <span className="block truncate">{text}</span>
      )}
    </div>
  );
}
