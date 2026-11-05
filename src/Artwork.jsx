import { useId } from 'react';

function Car({ x = 210, y = 110, scale = 1, angle = -18, color = '#ee7851' }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${angle}) scale(${scale})`}>
      <ellipse cx="0" cy="52" rx="83" ry="19" fill="#171a30" opacity=".2" />
      <rect x="-65" y="-7" width="21" height="55" rx="8" fill="#252c32" />
      <rect x="44" y="-7" width="21" height="55" rx="8" fill="#252c32" />
      <rect x="-65" y="-66" width="21" height="39" rx="8" fill="#252c32" />
      <rect x="44" y="-66" width="21" height="39" rx="8" fill="#252c32" />
      <path d="M-49-79Q0-98 49-79L57 35Q0 60-57 35Z" fill={color} />
      <path d="M-49-79Q0-98 49-79L46-48Q0-59-46-48Z" fill="#ffb38a" />
      <path d="M-38-40Q0-57 38-40L43-1Q0-13-43-1Z" fill="#263f4e" />
      <path d="M-28-38L-34-9M-18-41L-24-11" stroke="#7bb2b1" strokeWidth="5" />
      <path d="M-39 8Q0-1 39 8L35 34Q0 46-35 34Z" fill="#d35a37" />
      <path d="M-18-83V-57M-18 4V43M-6-85V-58M-6 3V45" stroke="#ffe8bc" strokeWidth="6" />
      <rect x="-45" y="22" width="14" height="8" rx="3" fill="#fff5b2" />
      <rect x="31" y="22" width="14" height="8" rx="3" fill="#fff5b2" />
      <path d="M-54 36Q0 56 54 36" fill="none" stroke="#9e422f" strokeWidth="6" />
    </g>
  );
}
export function HeroArt() {
  return (
    <svg className="hero-art" viewBox="0 0 670 440" aria-hidden="true">
      <defs>
        <linearGradient id="road" x2="0" y2="1">
          <stop stopColor="#66628a" />
          <stop offset="1" stopColor="#37394c" />
        </linearGradient>
      </defs>
      <circle cx="470" cy="146" r="116" fill="#d6fa67" />
      <circle cx="470" cy="146" r="96" fill="none" stroke="#bedb65" strokeWidth="1" />
      <path d="M359 175Q442 75 498 153T670 167V440H232Q281 263 359 175" fill="#9f91ce" />
      <path
        d="M380 128Q406 102 449 116"
        fill="none"
        stroke="#ede4ff"
        strokeWidth="22"
        strokeLinecap="round"
      />
      <path d="M608 122h52m-39-8h22" stroke="#f3edff" strokeWidth="16" strokeLinecap="round" />
      <path
        d="M640 172C420 137 610 281 453 297S289 363 240 456"
        fill="none"
        stroke="#ece5fc"
        strokeWidth="146"
      />
      <path
        d="M640 172C420 137 610 281 453 297S289 363 240 456"
        fill="none"
        stroke="url(#road)"
        strokeWidth="128"
      />
      <path
        d="M640 172C420 137 610 281 453 297S289 363 240 456"
        fill="none"
        stroke="#e7deef"
        strokeWidth="4"
        strokeDasharray="22 24"
      />
      <path
        d="M617 172C421 144 611 270 448 286S281 356 231 446"
        fill="none"
        stroke="#a49bb7"
        strokeWidth="2"
      />
      <Car x={459} y={278} scale={1.3} angle={-29} />
      <g transform="translate(334 133) rotate(-13)">
        <path d="M0 0V100" stroke="#414047" strokeWidth="5" />
        <path d="M2 0h65v42H2Z" fill="#fff8e8" />
        {Array.from({ length: 12 }, (_, i) => (
          <rect
            key={i}
            x={2 + (i % 6) * 10.8}
            y={Math.floor(i / 6) * 21}
            width="10.8"
            height="21"
            fill={(i + Math.floor(i / 6)) % 2 ? '#fff8e8' : '#34323a'}
          />
        ))}
      </g>
      <g fill="#786ba2">
        <path d="M280 280l13-36 13 36Z" />
        <path d="M589 376l17-49 17 49Z" />
        <path d="M606 405l22-58 22 58Z" />
      </g>
      <g stroke="#efecff" strokeWidth="4" strokeLinecap="round">
        <path d="M364 347l-34 22m20-39-20 10m185-126 22-13" />
      </g>
      <g transform="translate(590 53) rotate(12)">
        <path d="M0-19v38m-19-19h38m-32-13 26 26m0-26-26 26" stroke="#605184" strokeWidth="5" />
      </g>
    </svg>
  );
}
