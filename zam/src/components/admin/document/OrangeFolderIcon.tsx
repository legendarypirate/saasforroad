import React from 'react';

interface OrangeFolderIconProps {
  size?: number;
  className?: string;
  /** Soft drop-shadow (Windows-like depth) */
  shadowed?: boolean;
}

/**
 * Large Windows Explorer–style folder glyph for DMS views.
 */
export default function OrangeFolderIcon({
  size = 72,
  className,
  shadowed = true,
}: OrangeFolderIconProps) {
  const uid = React.useId().replace(/:/g, '');

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 128 112"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <defs>
        {/* Tab (back flap) */}
        <linearGradient id={`win-tab-${uid}`} x1="16" y1="18" x2="58" y2="42" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FFE08A" />
          <stop offset="0.45" stopColor="#F6C34A" />
          <stop offset="1" stopColor="#E8A820" />
        </linearGradient>
        {/* Main body — classic Windows yellow */}
        <linearGradient id={`win-body-${uid}`} x1="14" y1="36" x2="114" y2="96" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FFD966" />
          <stop offset="0.35" stopColor="#F5C242" />
          <stop offset="0.75" stopColor="#E8A91C" />
          <stop offset="1" stopColor="#D4920F" />
        </linearGradient>
        {/* Front panel highlight */}
        <linearGradient id={`win-front-${uid}`} x1="18" y1="48" x2="110" y2="100" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FFF1B8" stopOpacity="0.95" />
          <stop offset="0.4" stopColor="#FFD76A" stopOpacity="0.55" />
          <stop offset="1" stopColor="#E8A820" stopOpacity="0.15" />
        </linearGradient>
        {/* Inner pocket shadow */}
        <linearGradient id={`win-pocket-${uid}`} x1="20" y1="44" x2="108" y2="52" gradientUnits="userSpaceOnUse">
          <stop stopColor="#C98912" stopOpacity="0.35" />
          <stop offset="1" stopColor="#C98912" stopOpacity="0" />
        </linearGradient>
        <linearGradient id={`win-edge-${uid}`} x1="14" y1="36" x2="14" y2="100" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FFF6D0" stopOpacity="0.7" />
          <stop offset="1" stopColor="#FFF6D0" stopOpacity="0" />
        </linearGradient>
        {shadowed ? (
          <filter id={`win-shadow-${uid}`} x="-15%" y="-10%" width="130%" height="140%">
            <feDropShadow dx="0" dy="4" stdDeviation="3.5" floodColor="#8B6914" floodOpacity="0.32" />
          </filter>
        ) : null}
      </defs>

      <g filter={shadowed ? `url(#win-shadow-${uid})` : undefined}>
        {/* Back tab — Windows folder tab */}
        <path
          d="M16 28C16 24.6863 18.6863 22 22 22H48.2C49.8 22 51.3 22.75 52.2 24L58.5 32H104C107.314 32 110 34.6863 110 38V42H16V28Z"
          fill={`url(#win-tab-${uid})`}
        />
        {/* Tab top highlight */}
        <path
          d="M22 24H47.5C48.3 24 49.05 24.35 49.55 24.95L54.2 31H22V24Z"
          fill="#FFF3C0"
          opacity="0.55"
        />

        {/* Main folder body */}
        <path
          d="M14 40C14 36.6863 16.6863 34 20 34H108C111.314 34 114 36.6863 114 40V92C114 95.3137 111.314 98 108 98H20C16.6863 98 14 95.3137 14 92V40Z"
          fill={`url(#win-body-${uid})`}
        />

        {/* Opening / pocket line */}
        <path
          d="M18 46H110"
          stroke={`url(#win-pocket-${uid})`}
          strokeWidth="6"
          strokeLinecap="round"
        />

        {/* Front face sheen (Windows glass-ish highlight) */}
        <path
          d="M20 50C20 47.7909 21.7909 46 24 46H104C106.209 46 108 47.7909 108 50V88C108 90.2091 106.209 92 104 92H24C21.7909 92 20 90.2091 20 88V50Z"
          fill={`url(#win-front-${uid})`}
        />

        {/* Left rim light */}
        <path
          d="M20 42V90"
          stroke={`url(#win-edge-${uid})`}
          strokeWidth="3"
          strokeLinecap="round"
        />

        {/* Bottom depth edge */}
        <path
          d="M22 94H106"
          stroke="#B87A0A"
          strokeWidth="2"
          strokeLinecap="round"
          opacity="0.35"
        />

        {/* Outer stroke for crisp Windows silhouette */}
        <path
          d="M16 28C16 24.6863 18.6863 22 22 22H48.2C49.8 22 51.3 22.75 52.2 24L58.5 32H104C107.314 32 110 34.6863 110 38V42M14 40C14 36.6863 16.6863 34 20 34H108C111.314 34 114 36.6863 114 40V92C114 95.3137 111.314 98 108 98H20C16.6863 98 14 95.3137 14 92V40Z"
          stroke="#C98912"
          strokeWidth="1.25"
          strokeLinejoin="round"
          opacity="0.55"
        />
      </g>
    </svg>
  );
}
