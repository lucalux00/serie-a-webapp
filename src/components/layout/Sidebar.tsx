import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShieldAlert, FileText, Info } from 'lucide-react';
import Link from 'next/link';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay scuro */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-[#0F172A]/80 backdrop-blur-sm z-50"
          />
          
          {/* Menu laterale */}
          <motion.div 
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
            className="fixed top-0 left-0 bottom-0 w-3/4 max-w-sm bg-[#1E293B] border-r border-[#334155] shadow-2xl z-50 flex flex-col"
          >
            <div className="flex items-center justify-between p-4 border-b border-[#334155]">
              <div className="font-bold text-lg text-[#F8FAFC]">
                <span className="text-[#10B981]">TATTICA</span> MENU
              </div>
              <button onClick={onClose} className="p-2 text-[#94A3B8]">
                <X size={24} />
              </button>
            </div>
            
            <div className="flex-1 py-4 flex flex-col space-y-2 px-4">
              <Link href="/notizie" onClick={onClose} className="flex items-center p-3 text-[#F8FAFC] hover:bg-[#334155] rounded-xl transition-colors bg-blue-500/10 border border-blue-500/20">
                <FileText size={20} className="mr-3 text-blue-400" />
                <span className="font-bold text-blue-400">Notizie Live</span>
              </Link>
              <Link href="/impostazioni" onClick={onClose} className="flex items-center p-3 text-[#F8FAFC] hover:bg-[#334155] rounded-xl transition-colors">
                <Info size={20} className="mr-3 text-[#0EA5E9]" />
                <span className="font-semibold">Info App</span>
              </Link>
              <Link href="/privacy" onClick={onClose} className="flex items-center p-3 text-[#F8FAFC] hover:bg-[#334155] rounded-xl transition-colors">
                <ShieldAlert size={20} className="mr-3 text-[#0EA5E9]" />
                <span className="font-semibold">Privacy Policy</span>
              </Link>
              <Link href="/termini" onClick={onClose} className="flex items-center p-3 text-[#F8FAFC] hover:bg-[#334155] rounded-xl transition-colors">
                <FileText size={20} className="mr-3 text-[#0EA5E9]" />
                <span className="font-semibold">Termini e Condizioni</span>
              </Link>
            </div>
            
            <div className="p-4 border-t border-[#334155] text-xs text-[#94A3B8] text-center">
              © 2026 Tattica & Pronostici<br/>Aggregatore RSS conforme al copyright.
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
