import { useId } from 'react'

export interface AgentOrbProps {
  size?: number
  className?: string
}

/**
 * AgentOrb — the AgrowNex assistant's face. A small 3D-styled robot head:
 * radial-gradient shaded body lit from the top-left, specular highlight,
 * glass visor with two glowing eyes (they blink), antenna and side pods.
 * Pure vector, self-coloured (ignores currentColor), so it stays identical
 * in light/dark mode and at any size.
 */
export function AgentOrb({ size = 22, className }: AgentOrbProps) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, '')
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      className={className}
      aria-hidden
      focusable="false"
    >
      <defs>
        {/* Body shading — lit top-left → deep floor */}
        <radialGradient id={`body-${id}`} cx="34%" cy="24%" r="88%">
          <stop offset="0%" stopColor="#A8EDCC" />
          <stop offset="34%" stopColor="#4CB283" />
          <stop offset="72%" stopColor="#2F8C64" />
          <stop offset="100%" stopColor="#155742" />
        </radialGradient>
        {/* Glass visor */}
        <linearGradient id={`visor-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#10362B" />
          <stop offset="100%" stopColor="#06150F" />
        </linearGradient>
        {/* Specular highlight */}
        <radialGradient id={`spec-${id}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.52" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
        {/* Under-glow */}
        <radialGradient id={`glow-${id}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#46B083" stopOpacity="0.42" />
          <stop offset="100%" stopColor="#46B083" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* under glow */}
      <ellipse cx="24" cy="43" rx="13.5" ry="4.6" fill={`url(#glow-${id})`} />

      {/* antenna */}
      <line x1="24" y1="6.2" x2="24" y2="10.8" stroke="#2F8C64" strokeWidth="2.4" strokeLinecap="round" />
      <circle cx="24" cy="5" r="2.9" fill="#8BF2C4" stroke="#175640" strokeWidth="1.1" />
      <circle cx="24" cy="4.1" r="0.9" fill="#EAFFF6" opacity="0.85" />

      {/* side pods */}
      <circle cx="4.1" cy="25.5" r="3" fill="#2F8C64" stroke="#175640" strokeWidth="0.9" />
      <circle cx="43.9" cy="25.5" r="3" fill="#267A56" stroke="#175640" strokeWidth="0.9" />

      {/* head */}
      <circle cx="24" cy="25.5" r="18.5" fill={`url(#body-${id})`} />
      {/* bottom rim light */}
      <path
        d="M8.6 32.2 A18.5 18.5 0 0 0 39.4 32.2"
        fill="none"
        stroke="rgba(255,255,255,0.22)"
        strokeWidth="2"
        strokeLinecap="round"
      />

      {/* visor */}
      <rect x="9.5" y="19" width="29" height="15.5" rx="7.75" fill={`url(#visor-${id})`} stroke="rgba(255,255,255,0.16)" strokeWidth="1" />
      {/* eyes — blink via CSS (.agent-orb-eyes) */}
      <g className="agent-orb-eyes" fill="#7FF5C8">
        <circle cx="18.2" cy="26.6" r="2.7" />
        <circle cx="29.8" cy="26.6" r="2.7" />
      </g>

      {/* specular highlight */}
      <ellipse cx="16.5" cy="12.8" rx="7.6" ry="4.5" fill={`url(#spec-${id})`} transform="rotate(-19 16.5 12.8)" />
    </svg>
  )
}
