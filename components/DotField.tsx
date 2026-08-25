/**
 * Decorative overlapping-dot field. Generated in code — no images.
 * Tweak DOTS below; `intensity` is the main readability dial (0–1).
 */
export const DOTS = {
  intensity: 0.42,
  count: 120,
  minR: 0.45,
  maxR: 2.2,
  seed: 1201,
  colors: [
    "#6E2E18",
    "#2F3A2C",
    "#6B4E1E",
    "#3A4638",
    "#8A3200",
    "#14524C",
    "#4A2480",
    "#8A1458",
    "#003A66",
    "#8A4A18",
  ],
};

function mulberry32(seed: number) {
  return function next() {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Circle = { cx: number; cy: number; r: number; fill: string };

function buildCircles(): Circle[] {
  const rand = mulberry32(DOTS.seed);
  const circles: Circle[] = [];
  for (let i = 0; i < DOTS.count; i++) {
    circles.push({
      cx: rand() * 108 - 4,
      cy: rand() * 108 - 4,
      r: DOTS.minR + rand() * (DOTS.maxR - DOTS.minR),
      fill: DOTS.colors[Math.floor(rand() * DOTS.colors.length)],
    });
  }
  return circles;
}

const CIRCLES = buildCircles();

export default function DotField({ className = "" }: { className?: string }) {
  return (
    <svg
      aria-hidden
      className={`pointer-events-none ${className}`}
      viewBox="0 0 100 100"
      preserveAspectRatio="xMidYMid slice"
    >
      {CIRCLES.map((c, i) => (
        <circle
          key={i}
          cx={c.cx}
          cy={c.cy}
          r={c.r}
          fill={c.fill}
          opacity={DOTS.intensity}
        />
      ))}
    </svg>
  );
}
