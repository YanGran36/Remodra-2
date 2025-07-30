import React from 'react';

interface RemodraLogoProps {
  size?: number;
  className?: string;
}

export default function RemodraLogo({ size = 64, className = '' }: RemodraLogoProps) {
  return (
    <img
      src={`/remodra-logo.png?v=${Date.now()}`}
      alt="Remodra Logo"
      className={`object-contain ${className}`}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        minWidth: `${size}px`,
        minHeight: `${size}px`
      }}
      onError={(e) => {
        console.error('Logo failed to load, using fallback');
        // Fallback to a simple styled div if image fails
        e.currentTarget.style.display = 'none';
        const fallback = document.createElement('div');
        fallback.className = `flex items-center justify-center rounded-lg bg-gradient-to-br from-amber-400 to-yellow-600 text-slate-900 font-bold shadow-lg ${className}`;
        fallback.style.cssText = `
          width: ${size}px;
          height: ${size}px;
          min-width: ${size}px;
          min-height: ${size}px;
          font-size: ${size * 0.4}px;
        `;
        fallback.textContent = 'R';
        e.currentTarget.parentNode?.appendChild(fallback);
      }}
    />
  );
} 