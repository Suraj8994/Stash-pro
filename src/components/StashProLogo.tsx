import React from 'react';

interface StashProLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showTagline?: boolean;
}

export const StashProLogo: React.FC<StashProLogoProps> = ({
  className = '',
  size = 'md',
  showTagline = false,
}) => {
  const isSm = size === 'sm';
  const isLg = size === 'lg';

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      {/* Product-Inspired Icon Badge with angled kraft fold and distinct bold lettering */}
      <div
        className={`relative shrink-0 flex items-center overflow-hidden rounded-xl border border-emerald-500/40 shadow-lg shadow-emerald-950/80 transition-transform hover:scale-105 ${
          isSm ? 'h-9 w-9' : isLg ? 'h-13 w-13' : 'h-10 w-10'
        } bg-[#073822]`}
        style={{
          boxShadow: '0 4px 14px -1px rgba(10, 77, 46, 0.7), inset 0 1px 0 rgba(255, 255, 255, 0.15)',
        }}
      >
        {/* Angled Brown Kraft accent on left edge like the stash-pro pack */}
        <div className="absolute left-0 top-0 bottom-0 w-2.5 bg-gradient-to-b from-[#e5a64b] via-[#c6822c] to-[#995d18] border-r border-emerald-950/60 flex items-center justify-center">
          <span className="text-[6px] font-black tracking-tighter text-slate-950 rotate-90 uppercase select-none font-mono">
            BRN
          </span>
        </div>

        {/* Emerald green body with bold white lettermark & registered mark */}
        <div className="ml-2.5 flex-1 flex flex-col items-center justify-center pr-1 select-none">
          <div className="flex items-center tracking-tighter font-extrabold text-white leading-none">
            <span className={isSm ? 'text-[10px]' : isLg ? 'text-sm' : 'text-xs'}>stāsh</span>
            <span className={`text-[#d99b43] font-mono ${isSm ? 'text-[9px]' : isLg ? 'text-xs' : 'text-[10px]'}`}>-pro</span>
          </div>
          <span className="text-[6px] tracking-widest text-emerald-300 font-bold uppercase mt-0.5">
            DISTRI
          </span>
        </div>
      </div>

      {/* Brand Name Text with stash-pro styling */}
      <div className="min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="font-extrabold tracking-tight text-white flex items-center text-sm sm:text-base md:text-lg">
            <span className="text-emerald-300">stāsh</span>
            <span className="text-[#d99b43]">-pro</span>
            <span className="text-slate-100 ml-1 font-bold hidden sm:inline">DistriTrack</span>
          </span>
          <span className="hidden md:inline-flex text-[9px] uppercase font-mono px-1.5 py-0.5 rounded font-black tracking-wider bg-[#d99b43]/20 text-[#f6cb82] border border-[#d99b43]/40">
            OFFICIAL
          </span>
        </div>
        {showTagline && (
          <p className="text-[11px] text-emerald-300/80 font-medium truncate">
            Authorized Field Supply & Retail Distribution Ops
          </p>
        )}
      </div>
    </div>
  );
};
