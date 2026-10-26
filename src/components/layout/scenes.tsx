import type { CSSProperties } from 'react'

/**
 * Original SVG agricultural scenes — used instead of external stock photos so
 * the site is fully self-contained, offline-safe, and visually consistent.
 * Each scene is decorative; callers should not rely on them for content.
 */

const grainURL =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")"

function Grain({ opacity = 0.06 }: { opacity?: number }) {
  return <span aria-hidden style={{ backgroundImage: grainURL, opacity, mixBlendMode: 'overlay' }} className="absolute inset-0 pointer-events-none" />
}

/** Cinematic dawn over layered field rows — the flagship hero scene. */
export function SceneDawnField({ className, style }: { className?: string; style?: CSSProperties }) {
  return (
    <svg viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice" role="img" aria-label="Illustration: dawn light over layered crop rows" className={className} style={style}>
      <defs>
        <linearGradient id="sc-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#F8F7F2" />
          <stop offset="0.45" stopColor="#F3E9D8" />
          <stop offset="0.78" stopColor="#EAD9B4" />
          <stop offset="1" stopColor="#E3CE9E" />
        </linearGradient>
        <radialGradient id="sc-sun" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#FBF3DC" />
          <stop offset="0.55" stopColor="#F4E2B4" stopOpacity="0.9" />
          <stop offset="1" stopColor="#F4E2B4" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="sc-h1" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#9DBE9A" />
          <stop offset="1" stopColor="#8CB08C" />
        </linearGradient>
        <linearGradient id="sc-h2" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#6E9B78" />
          <stop offset="1" stopColor="#5E8A6B" />
        </linearGradient>
        <linearGradient id="sc-h3" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#416D51" />
          <stop offset="1" stopColor="#355B45" />
        </linearGradient>
        <linearGradient id="sc-h4" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#20402E" />
          <stop offset="1" stopColor="#17301F" />
        </linearGradient>
      </defs>
      <rect width="1440" height="900" fill="url(#sc-sky)" />
      <circle cx="1010" cy="330" r="190" fill="url(#sc-sun)" />
      <circle cx="1010" cy="330" r="54" fill="#F8F0D6" opacity="0.95" />
      {/* mist band */}
      <rect y="540" width="1440" height="70" fill="#F5EFE2" opacity="0.5" />
      {/* distant ridge */}
      <path d="M0 560 C 200 520, 380 540, 560 520 C 760 498, 900 540, 1080 524 C 1240 510, 1340 528, 1440 516 L 1440 620 L 0 620 Z" fill="url(#sc-h1)" opacity="0.9" />
      <path d="M0 610 C 220 585, 420 605, 640 588 C 880 570, 1020 606, 1200 592 C 1330 582, 1390 592, 1440 586 L 1440 700 L 0 700 Z" fill="url(#sc-h2)" />
      <path d="M0 672 C 260 650, 480 672, 720 658 C 980 642, 1140 676, 1300 664 C 1370 658, 1410 664, 1440 660 L 1440 780 L 0 780 Z" fill="url(#sc-h3)" />
      {/* foreground rows with perspective convergence */}
      <g>
        <path d="M0 760 C 300 742, 560 752, 860 746 C 1100 742, 1300 750, 1440 746 L 1440 900 L 0 900 Z" fill="url(#sc-h4)" />
        {[786, 806, 828, 852, 878].map((y, i) => (
          <path
            key={y}
            d={`M0 ${y} C 320 ${y - 7}, 620 ${y + 3}, 1440 ${y - 2}`}
            stroke="#8FB98D"
            strokeOpacity={0.5 - i * 0.06}
            strokeWidth={2 + i}
            fill="none"
            strokeLinecap="round"
          />
        ))}
      </g>
      {/* crop shafts */}
      <g stroke="#B7D2AE" strokeOpacity="0.75" strokeLinecap="round">
        {Array.from({ length: 42 }).map((_, i) => {
          const x = 20 + i * 34
          const y = 884 - (i % 3) * 6
          const h = 26 + ((i * 13) % 18)
          return <path key={i} d={`M${x} ${y} l ${(i % 5) - 2} -${h}`} strokeWidth="2.4" />
        })}
      </g>
      <Grain />
    </svg>
  )
}

/** Layered terraces — features / research band. */
export function SceneTerraces({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 1200 630" preserveAspectRatio="xMidYMid slice" role="img" aria-label="Illustration: layered terraced fields" className={className}>
      <defs>
        <linearGradient id="sc-t-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#102A24" />
          <stop offset="1" stopColor="#173D32" />
        </linearGradient>
      </defs>
      <rect width="1200" height="630" fill="url(#sc-t-sky)" />
      <circle cx="930" cy="150" r="70" fill="#EAD9B4" opacity="0.9" />
      <circle cx="930" cy="150" r="130" fill="#EAD9B4" opacity="0.14" />
      <path d="M0 210 C 180 190, 320 210, 470 196 C 650 180, 780 208, 940 192 C 1070 182, 1140 196, 1200 188 L 1200 320 L 0 320 Z" fill="#1F4B3D" />
      <path d="M0 300 C 150 284, 330 300, 500 288 C 700 274, 870 302, 1040 290 C 1130 284, 1170 292, 1200 288 L 1200 420 L 0 420 Z" fill="#267A56" opacity="0.85" />
      <path d="M0 396 C 200 380, 380 400, 560 388 C 760 374, 920 402, 1080 390 L 1200 384 L 1200 510 L 0 510 Z" fill="#2F8C64" opacity="0.75" />
      <path d="M0 488 C 220 470, 420 492, 640 480 C 840 470, 1000 494, 1200 482 L 1200 630 L 0 630 Z" fill="#355B45" />
      <Grain opacity={0.08} />
    </svg>
  )
}

/** Stylized leaf closeup — about / explanation vignettes. */
export function SceneLeafMacro({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 640 640" preserveAspectRatio="xMidYMid slice" role="img" aria-label="Illustration: a close-up leaf with veins" className={className}>
      <defs>
        <linearGradient id="sc-leaf-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#EAF1E6" />
          <stop offset="1" stopColor="#D7E4CE" />
        </linearGradient>
        <linearGradient id="sc-leaf" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#2F8C64" />
          <stop offset="1" stopColor="#173D32" />
        </linearGradient>
      </defs>
      <rect width="640" height="640" fill="url(#sc-leaf-bg)" />
      <circle cx="120" cy="120" r="140" fill="#F4E2B4" opacity="0.5" />
      <g transform="rotate(-18 320 320)">
        <path d="M320 560 C 180 500, 130 380, 170 240 C 190 220 220 214 258 214 C 460 214, 560 340, 552 500 C 549 542 518 566 476 576 C 424 588 366 576 320 560 Z" fill="url(#sc-leaf)" />
        <path d="M200 548 C 260 452, 350 350, 470 268" stroke="#A9C8A8" strokeWidth="5" strokeLinecap="round" fill="none" />
        {[0, 1, 2, 3, 4].map((i) => {
          const t = i / 5
          const x = 220 + t * 230
          const y = 520 - t * 230
          return (
            <g key={i} stroke="#A9C8A8" strokeOpacity="0.65" strokeWidth="2.6" strokeLinecap="round">
              <path d={`M${x} ${y} q 26 4 44 -12`} fill="none" />
              <path d={`M${x + 8} ${y + 26} q -22 10 -40 4`} fill="none" />
            </g>
          )
        })}
      </g>
      <Grain opacity={0.05} />
    </svg>
  )
}
