'use client';
import React from 'react';

interface C8LTVLogoProps {
  size?: number;
  className?: string;
}

export function C8LTVLogo({ size = 24, className = "" }: C8LTVLogoProps) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 26 26" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg" 
      className={`inline-block select-none ${className}`}
    >
      <defs>
        <linearGradient id="c8l-tv-logo-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FF0055" /> {/* Rosa Neon */}
          <stop offset="100%" stopColor="#8A2BE2" /> {/* Morado Neon */}
        </linearGradient>
      </defs>
      
      {/* TV Antennae */}
      <path 
        d="M7 4L13 9L19 4" 
        stroke="url(#c8l-tv-logo-gradient)" 
        strokeWidth="2.5" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
      />
      
      {/* TV Body / Rounded Rectangle with Cel-Shaded black outline */}
      <rect 
        x="2.5" 
        y="9.5" 
        width="21" 
        height="14" 
        rx="3.5" 
        fill="url(#c8l-tv-logo-gradient)" 
        stroke="#000000"
        strokeWidth="2"
      />
      
      {/* Play Button Symbol */}
      <polygon 
        points="11 13.5 11 19.5 16.5 16.5" 
        fill="#FFFFFF" 
        stroke="#000000"
        strokeWidth="0.5"
        strokeLinejoin="round"
      />
      
      {/* Screen Glare Highlight */}
      <path 
        d="M4.5 11.5C4.5 11.5 6.5 10.5 8 10.5" 
        stroke="#FFFFFF" 
        strokeWidth="1.5" 
        strokeLinecap="round" 
        opacity="0.75" 
      />
    </svg>
  );
}
