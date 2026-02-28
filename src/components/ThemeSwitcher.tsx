import { useState, useEffect } from 'react';
import './ThemeSwitcher.css';

type Theme = 'green' | 'purple' | 'blue';
type Mode = 'dark' | 'light';

const THEME_KEY = 'alexx-theme';
const MODE_KEY = 'alexx-mode';

export function ThemeSwitcher() {
  const [theme, setTheme] = useState<Theme>(() => {
    return (localStorage.getItem(THEME_KEY) as Theme) || 'green';
  });
  
  const [mode, setMode] = useState<Mode>(() => {
    return (localStorage.getItem(MODE_KEY) as Mode) || 'dark';
  });

  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.setAttribute('data-mode', mode);
    localStorage.setItem(THEME_KEY, theme);
    localStorage.setItem(MODE_KEY, mode);
  }, [theme, mode]);

  const themes: { value: Theme; label: string; color: string }[] = [
    { value: 'green', label: 'Emerald', color: '#22c55e' },
    { value: 'purple', label: 'Purple', color: '#a855f7' },
    { value: 'blue', label: 'Ocean', color: '#3b82f6' },
  ];

  return (
    <div className="theme-switcher">
      <button 
        className="theme-toggle"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Theme settings"
        title="Theme settings"
      >
        <span className="theme-icon" style={{ background: themes.find(t => t.value === theme)?.color }} />
        <span className="mode-icon">{mode === 'dark' ? '🌙' : '☀️'}</span>
      </button>
      
      {isOpen && (
        <div className="theme-dropdown">
          <div className="theme-section">
            <span className="theme-section-label">Theme</span>
            <div className="theme-options">
              {themes.map(t => (
                <button
                  key={t.value}
                  className={`theme-option ${theme === t.value ? 'active' : ''}`}
                  onClick={() => setTheme(t.value)}
                  title={t.label}
                >
                  <span className="theme-color" style={{ background: t.color }} />
                  <span className="theme-label">{t.label}</span>
                </button>
              ))}
            </div>
          </div>
          
          <div className="theme-section">
            <span className="theme-section-label">Mode</span>
            <div className="mode-options">
              <button
                className={`mode-option ${mode === 'dark' ? 'active' : ''}`}
                onClick={() => setMode('dark')}
              >
                🌙 Dark
              </button>
              <button
                className={`mode-option ${mode === 'light' ? 'active' : ''}`}
                onClick={() => setMode('light')}
              >
                ☀️ Light
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ThemeSwitcher;
