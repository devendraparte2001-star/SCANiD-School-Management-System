import React from 'react';
import { cn } from '@/lib/utils';
import { motion } from 'motion/react';
import { useSystemLabels } from '@/context/LabelContext';

interface LogoProps {
  className?: string;
  isCollapsed?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const Logo: React.FC<LogoProps> = ({ className, isCollapsed, size = 'md' }) => {
  const { labels } = useSystemLabels();
  
  const primaryText = labels.logoTextPrimary || 'SCAN';
  const secondaryText = labels.logoTextSecondary || 'iD';
  const subtitleText = labels.logoSubtitle || 'SCANiD SYSTEMS PVT. LTD.';
  const logoImage = labels.logoImage || '';

  const sizes = {
    sm: { text: 'text-lg', bar: 'text-[6px]', height: 'h-8' },
    md: { text: 'text-2xl', bar: 'text-[8px]', height: 'h-12' },
    lg: { text: 'text-4xl', bar: 'text-[10px]', height: 'h-16' },
  };

  const currentSize = sizes[size];

  if (isCollapsed) {
    return (
      <motion.div
        layoutId="logo-collapsed"
        className={cn(
          "flex items-center justify-center bg-slate-900 rounded-lg p-1.5 border border-slate-800",
          className
        )}
      >
        {logoImage ? (
          <img src={logoImage} alt="Logo" className="h-6 w-6 object-contain" referrerPolicy="no-referrer" />
        ) : (
          <div className="flex items-center justify-center">
            <span className="font-black text-purple-600 text-xs">{primaryText.charAt(0)}</span>
            <span className="font-black text-orange-500 text-xs">{secondaryText.slice(0, 2)}</span>
          </div>
        )}
      </motion.div>
    );
  }

  return (
    <motion.div
      layoutId="logo-full"
      className={cn("flex flex-col items-center justify-center select-none w-full", className)}
    >
      {logoImage ? (
        <div className="flex flex-col items-center gap-1.5 w-full">
          <img 
            src={logoImage} 
            alt="Logo" 
            className={cn("object-contain", size === 'sm' ? 'h-8' : size === 'lg' ? 'h-16' : 'h-12')} 
            referrerPolicy="no-referrer" 
          />
          <div className="bg-purple-700 px-2 py-0.5 w-full flex justify-center items-center rounded-sm">
            <span className={cn("text-white font-bold tracking-[0.1em] whitespace-nowrap", currentSize.bar)}>
              {subtitleText}
            </span>
          </div>
        </div>
      ) : (
        <>
          <div className={cn("font-black tracking-tighter flex items-baseline", currentSize.text)}>
            <span className="text-purple-600 uppercase">{primaryText}</span>
            <span className="text-orange-500">{secondaryText}</span>
            <span className="text-[10px] text-slate-500 ml-0.5 align-top">®</span>
          </div>
          <div className="bg-purple-700 px-2 py-0.5 mt-[-2px] w-full flex justify-center items-center rounded-sm">
            <span className={cn("text-white font-bold tracking-[0.1em] whitespace-nowrap", currentSize.bar)}>
              {subtitleText}
            </span>
          </div>
        </>
      )}
    </motion.div>
  );
};
