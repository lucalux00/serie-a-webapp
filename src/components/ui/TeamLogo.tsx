"use client";

import React, { useState } from 'react';
import Image from 'next/image';

interface TeamLogoProps {
  src?: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  fallbackText?: string;
  fill?: boolean;
}

export default function TeamLogo({ src, alt, width, height, className = "", fallbackText, fill }: TeamLogoProps) {
  const [error, setError] = useState(false);

  const text = fallbackText || alt.substring(0, 1).toUpperCase();

  if (!src || error) {
    return (
      <div 
        className={`flex items-center justify-center bg-[#334155] rounded-full text-white font-bold border border-white/10 ${className}`}
        style={!fill ? { width: width || 40, height: height || 40 } : { width: '100%', height: '100%' }}
      >
        {text}
      </div>
    );
  }

  const props = fill 
    ? { fill: true, className: `object-contain ${className}` }
    : { width: width || 40, height: height || 40, className: `object-contain ${className}` };

  return (
    <div className={fill ? `relative ${className}` : ''}>
      <Image
        src={src}
        alt={alt}
        onError={() => setError(true)}
        unoptimized={true}
        {...props}
      />
    </div>
  );
}
