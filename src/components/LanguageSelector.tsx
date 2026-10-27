import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { Globe, Check, ChevronDown } from 'lucide-react';
import { SupportedLanguage } from '../translations';

interface LanguageSelectorProps {
  variant?: 'compact' | 'standard' | 'minimal';
  className?: string;
  dropdownAlign?: 'left' | 'right';
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  variant = 'standard',
  className = '',
  dropdownAlign = 'right',
}) => {
  const { language, setLanguage, languages, currentLangInfo, t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSelect = (code: SupportedLanguage) => {
    setLanguage(code);
    setIsOpen(false);
  };

  return (
    <div className={`relative inline-block ${className}`} ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 rounded-xl transition-all cursor-pointer font-medium select-none ${
          variant === 'minimal'
            ? 'p-2 text-emerald-300 hover:text-white hover:bg-emerald-950/60'
            : variant === 'compact'
            ? 'px-2.5 py-1.5 bg-[#081e11] border border-emerald-800/70 text-xs text-emerald-200 hover:border-emerald-500 shadow-sm'
            : 'px-3 py-1.5 bg-[#081e11] border border-emerald-800/70 text-xs text-emerald-200 hover:border-emerald-500 hover:text-white shadow-sm'
        }`}
        title={t('select_language')}
        aria-label={t('select_language')}
        aria-expanded={isOpen}
      >
        <span className="text-sm leading-none">{currentLangInfo.flag}</span>
        {variant !== 'minimal' && (
          <span className="font-semibold text-xs text-emerald-100">{currentLangInfo.nativeName}</span>
        )}
        <ChevronDown className={`w-3.5 h-3.5 text-emerald-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div
          className={`absolute mt-2 w-48 bg-[#07190f] border border-emerald-600/50 rounded-2xl shadow-2xl overflow-hidden py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150 ${
            dropdownAlign === 'left' ? 'left-0' : 'right-0'
          }`}
        >
          <div className="px-3.5 py-1.5 text-[10px] font-mono text-emerald-400/80 border-b border-emerald-900/60 flex items-center justify-between">
            <span>{t('select_language')}</span>
            <Globe className="w-3 h-3 text-emerald-500/70" />
          </div>

          <div className="max-h-72 overflow-y-auto py-1 space-y-0.5">
            {languages.map((l) => {
              const isSelected = language === l.code;
              return (
                <button
                  key={l.code}
                  type="button"
                  onClick={() => handleSelect(l.code)}
                  className={`w-full flex items-center justify-between px-3.5 py-2 text-xs text-left transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-500/20 text-emerald-300 font-bold border-l-2 border-emerald-400'
                      : 'text-zinc-200 hover:bg-emerald-950/80 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-base leading-none">{l.flag}</span>
                    <div>
                      <div className="font-medium text-white">{l.nativeName}</div>
                      <div className="text-[10px] font-mono text-emerald-500/70">{l.name}</div>
                    </div>
                  </div>
                  {isSelected && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
