import { useLanguage } from '../contexts/LanguageContext';

interface LanguageSwitcherProps {
  variant?: 'light' | 'dark';
}

export default function LanguageSwitcher({ variant = 'dark' }: LanguageSwitcherProps) {
  const { language, setLanguage } = useLanguage();

  const languages = [
    { code: 'zh' as const, label: '中文', short: 'zh' },
    { code: 'en' as const, label: 'English', short: 'en' },
    { code: 'es' as const, label: 'Español', short: 'es' },
  ];

  if (variant === 'light') {
    // 用户端浅色背景样式
    return (
      <div className="flex items-center gap-1 bg-gray-100 rounded-lg px-1 py-1 border border-gray-200">
        {languages.map((lang) => (
          <button
            key={lang.code}
            onClick={() => setLanguage(lang.code)}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all duration-300 ${
              language === lang.code
                ? 'bg-sb-green text-white shadow-sm'
                : 'text-gray-600 hover:bg-gray-200'
            }`}
            title={lang.label}
          >
            {lang.short}
          </button>
        ))}
      </div>
    );
  }

  // 商家端深色背景样式
  return (
    <div className="flex items-center gap-1 bg-white/10 backdrop-blur-md rounded-lg px-1 py-1 border border-white/20">
      {languages.map((lang) => (
        <button
          key={lang.code}
          onClick={() => setLanguage(lang.code)}
          className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all duration-300 ${
            language === lang.code
              ? 'bg-white text-indigo-600 shadow-sm'
              : 'text-white/80 hover:text-white hover:bg-white/10'
          }`}
          title={lang.label}
        >
          {lang.short}
        </button>
      ))}
    </div>
  );
}

