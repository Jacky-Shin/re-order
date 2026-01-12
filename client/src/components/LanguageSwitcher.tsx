import { useLanguage } from '../contexts/LanguageContext';

interface LanguageSwitcherProps {
  variant?: 'light' | 'dark';
}

export default function LanguageSwitcher({ variant = 'dark' }: LanguageSwitcherProps) {
  const { language, setLanguage } = useLanguage();

  // 只保留西班牙语，默认西班牙语
  const languages = [
    { code: 'es' as const, label: 'Español', short: 'es', color: 'bg-green-500', hoverColor: 'hover:bg-green-600' },
  ];

  if (variant === 'light') {
    // 用户端浅色背景样式 - 分段控制器样式
    return (
      <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1 border border-gray-200 shadow-sm">
        {languages.map((lang) => (
          <button
            key={lang.code}
            onClick={() => setLanguage(lang.code)}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all duration-300 ${
              language === lang.code
                ? `${lang.color} text-white shadow-md transform scale-105`
                : 'text-gray-600 hover:bg-gray-200'
            }`}
            title={lang.label}
          >
            {lang.short.toUpperCase()}
          </button>
        ))}
      </div>
    );
  }

  // 商家端深色背景样式 - 分段控制器样式
  return (
    <div className="flex items-center gap-1 bg-white/10 backdrop-blur-md rounded-lg p-1 border border-white/20 shadow-lg">
      {languages.map((lang) => (
        <button
          key={lang.code}
          onClick={() => setLanguage(lang.code)}
          className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all duration-300 ${
            language === lang.code
              ? `${lang.color} text-white shadow-md transform scale-105`
              : 'text-white/80 hover:text-white hover:bg-white/10'
          }`}
          title={lang.label}
        >
          {lang.short.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
