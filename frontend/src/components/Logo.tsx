import React from 'react';

interface LogoProps {
  className?: string;
  size?: number;
}

export default function Logo({ className = '', size = 24 }: LogoProps) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 22 22" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="operon-logo-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#f97316" /> {/* Orange-500 */}
          <stop offset="50%" stopColor="#ea580c" /> {/* Orange-600 */}
          <stop offset="100%" stopColor="#f59e0b" /> {/* Amber-500 */}
        </linearGradient>
      </defs>
      <path 
        d="M7 8C5.34315 8 4 9.34315 4 11C4 12.6569 5.34315 14 7 14C8.65685 14 10 12.6569 11 11C12 9.34315 13.3431 8 15 8C16.6569 8 18 9.34315 18 11C18 12.6569 16.6569 14 15 14C13.3431 14 12 12.6569 11 11C10 9.34315 8.65685 8 7 8Z" 
        stroke="url(#operon-logo-gradient)" 
        strokeWidth="2.8" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
    </svg>
  );
}
