import React from 'react';
import type { Mode } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

interface ModeToggleProps {
  mode: Mode;
  onChange: (mode: Mode) => void;
  disabled?: boolean;
}

const MODES: Mode[] = ['simple', 'technical'];

const ModeToggle: React.FC<ModeToggleProps> = ({ mode, onChange, disabled }) => {
  const { t } = useLanguage();

  return (
    <div>
      <div
        role="group"
        aria-label={t('chat.mode.label')}
        className="inline-flex rounded-lg bg-slate-100 dark:bg-slate-700 p-1"
      >
        {MODES.map((value) => {
          const active = mode === value;
          return (
            <button
              key={value}
              type="button"
              aria-pressed={active}
              disabled={disabled}
              onClick={() => onChange(value)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors duration-200 disabled:opacity-60 ${
                active
                  ? 'bg-white dark:bg-slate-900 text-blue-700 dark:text-blue-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {t(`chat.mode.${value}`)}
            </button>
          );
        })}
      </div>
      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{t(`chat.mode.${mode}.hint`)}</p>
    </div>
  );
};

export default ModeToggle;
