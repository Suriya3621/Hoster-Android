import { Check } from 'lucide-react';
import { THEME_META } from '../../themes/themes';
import { useTheme } from '../../contexts/ThemeContext';

export default function ThemeSelector() {
  const { themeId, setThemeId } = useTheme();

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {THEME_META.map((t) => (
        <button
          key={t.id}
          onClick={() => setThemeId(t.id)}
          className={`card p-4 text-left relative hover:border-accent/50 transition-colors ${
            themeId === t.id ? 'border-accent' : ''
          }`}
        >
          <div className="flex items-center gap-2 mb-2">
            <span className="w-5 h-5 rounded-full" style={{ backgroundColor: t.swatch }} />
            <span className="text-sm font-medium">{t.name}</span>
            {themeId === t.id && <Check size={14} className="text-accent ml-auto" />}
          </div>
          <p className="text-xs text-text-muted">{t.description}</p>
        </button>
      ))}
    </div>
  );
}
