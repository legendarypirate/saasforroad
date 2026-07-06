import React from 'react';

interface OrangeFolderIconProps {
  size?: number;
}

export default function OrangeFolderIcon({ size = 72 }: OrangeFolderIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 80 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M6 18H34L40 24H74C76.2 24 78 25.8 78 28V54C78 56.2 76.2 58 74 58H6C3.8 58 2 56.2 2 54V22C2 19.8 3.8 18 6 18Z"
        fill="#E8912D"
      />
      <path
        d="M6 14H30L36 20H6V14Z"
        fill="#F5B84A"
      />
      <path
        d="M4 26H76V54C76 56.2 74.2 58 72 58H8C5.8 58 4 56.2 4 54V26Z"
        fill="#F5C04A"
      />
      <path
        d="M10 32H66"
        stroke="#FFE7A3"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.65"
      />
      <path
        d="M6 18H34L40 24H74"
        stroke="#C9781F"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}
