'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

interface BackButtonProps {
  className?: string;
  fallbackHref?: string;
  label?: string;
  showIcon?: boolean;
}

export default function BackButton({ 
  className = "text-[#10B981] font-bold flex items-center hover:underline cursor-pointer",
  fallbackHref = "/notizie",
  label = "Torna Indietro",
  showIcon = true
}: BackButtonProps) {
  const router = useRouter();

  const handleBack = () => {
    if (typeof window !== 'undefined') {
      // Se c'è una history valida o se veniamo dallo stesso sito
      if (window.history.length > 2 || (document.referrer && document.referrer.includes(window.location.host))) {
        router.back();
      } else {
        router.push(fallbackHref);
      }
    }
  };

  return (
    <button 
      onClick={handleBack} 
      className={className}
      type="button"
    >
      {showIcon && <ArrowLeft className="w-5 h-5 mr-2" />}
      {label}
    </button>
  );
}
