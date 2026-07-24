import React from 'react';

interface OrangeFolderIconProps {
  size?: number;
  className?: string;
  /** Soft drop-shadow for depth */
  shadowed?: boolean;
}

/**
 * Windows 10/11 Explorer–style yellow folder.
 * Classic tabbed folder with soft 3D shading — not a flat lucide icon.
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
      height={Math.round(size * 0.875)}
      viewBox="0 0 128 112"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
      style={
        shadowed
          ? { filter: 'drop-shadow(0 3px 6px rgba(139, 90, 20, 0.28))' }
          : undefined
      }
    >
      <defs>
        {/* Back panel (slightly darker, shows behind front) */}
        <linearGradient
          id={`back-${uid}`}
          x1="20"
          y1="20"
          x2="110"
          y2="95"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#E8A020" />
          <stop offset="1" stopColor="#C87818" />
        </linearGradient>

        {/* Tab */}
        <linearGradient
          id={`tab-${uid}`}
          x1="18"
          y1="14"
          x2="55"
          y2="32"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#F8C848" />
          <stop offset="1" stopColor="#E09820" />
        </linearGradient>

        {/* Front face — bright classic Windows yellow */}
        <linearGradient
          id={`front-${uid}`}
          x1="18"
          y1="38"
          x2="110"
          y2="100"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#FFE566" />
          <stop offset="0.4" stopColor="#FFCC33" />
          <stop offset="1" stopColor="#F0B429" />
        </linearGradient>

        {/* Soft top sheen */}
        <linearGradient
          id={`sheen-${uid}`}
          x1="64"
          y1="38"
          x2="64"
          y2="70"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#FFFFFF" stopOpacity="0.45" />
          <stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Soft ground shadow */}
      {shadowed && (
        <ellipse cx="64" cy="102" rx="42" ry="5" fill="#000000" opacity="0.12" />
      )}

      {/* Back panel (slightly visible behind) */}
      <path
        d="M18 30
           C18 27.2 20.2 25 23 25
           H50
           L56 31
           H105
           C108.3 31 111 33.7 111 37
           V55
           H18 Z"
        fill={`url(#win-tab-${uid})`}
      />

      {/* Tab */}
      <path
        d="M18 22
           C18 19.2 20.2 17 23 17
           H48
           C49.5 17 50.8 17.7 51.5 19
           L56 26
           H18 Z"
        fill={`url(#win-tab-${uid})`}
      />
      <path
        d="M23 18.5 H47 L51.5 25 H23 Z"
        fill="#FFE9A0"
        opacity="0.5"
      />

      {/* Front body — the classic big Windows folder face */}
      <path
        d="M16 38
           C16 34.7 18.7 32 22 32
           H106
           C109.3 32 112 34.7 112 38
           V90
           C112 94.4 108.4 98 104 98
           H24
           C19.6 98 16 94.4 16 90
           Z"
        fill={`url(#win-body-${uid})`}
      />

      {/* Top lip of front body */}
      <path
        d="M22 32 H106 C109.3 32 112 34.7 112 38 V44 H16 V38 C16 34.7 18.7 32 22 32 Z"
        fill={`url(#lip-${uid})`}
      />

      {/* Soft inner top shadow under lip */}
      <path
        d="M18 44 H110 V50 H18 Z"
        fill="#C87818"
        opacity="0.18"
      />

      {/* Subtle paper lines inside (very light, Windows detail) */}
      <path
        d="M28 58 H90"
        stroke="#FFFFFF"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.28"
      />
      <path
        d="M28 66 H78"
        stroke="#FFFFFF"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.18"
      />

      {/* Crisp outline */}
      <path
        d="M16 38
           C16 34.7 18.7 32 22 32
           H106
           C109.3 32 112 34.7 112 38
           V90
           C112 94.4 108.4 98 104 98
           H24
           C19.6 98 16 94.4 16 90
           Z"
        stroke="#C87818"
        strokeWidth="1.5"
        fill="none"
        opacity="0.4"
      />
    </svg>
  );
}
