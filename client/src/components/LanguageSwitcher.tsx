import { useLanguage } from '../contexts/LanguageContext';

interface LanguageSwitcherProps {
  variant?: 'light' | 'dark';
}

export default function LanguageSwitcher({ variant = 'dark' }: LanguageSwitcherProps) {
  const { language, setLanguage } = useLanguage();

  const languages = [
    { code: 'zh' as const, label: '中文', flag: '🇨🇳' },
    { code: 'en' as const, label: 'English', flag: '🇺🇸' },
    { code: 'es' as const, label: 'Español', flag: '🇲🇽' },
  ];

  if (variant === 'light') {
    // 用户端浅色背景样式
    return (
      <div className="flex items-center gap-1 bg-gray-100 rounded-xl px-2 py-2 border border-gray-200">
        {languages.map((lang) => (
          <button
            key={lang.code}
            onClick={() => setLanguage(lang.code)}
            className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all duration-300 flex items-center gap-2 ${
              language === lang.code
                ? 'bg-sb-green text-white shadow-md'
                : 'text-gray-700 hover:bg-gray-200'
            }`}
            title={lang.label}
          >
            <span className="text-base">{lang.flag}</span>
            <span className="hidden sm:inline">{lang.label}</span>
          </button>
        ))}
      </div>
    );
  }

  // 商家端深色背景样式
  return (
    <div className="flex items-center gap-1 bg-white/10 backdrop-blur-md rounded-xl px-2 py-2 border border-white/20">
      {languages.map((lang) => (
        <button
          key={lang.code}
          onClick={() => setLanguage(lang.code)}
          className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all duration-300 flex items-center gap-2 ${
            language === lang.code
              ? 'bg-white text-indigo-600 shadow-lg'
              : 'text-white/80 hover:text-white hover:bg-white/10'
          }`}
          title={lang.label}
        >
          <span className="text-base">{lang.flag}</span>
          <span className="hidden sm:inline">{lang.label}</span>
        </button>
      ))}
    </div>
  );
}

