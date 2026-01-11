import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import zh from '../locales/zh';
import en from '../locales/en';
import es from '../locales/es';

export type Language = 'zh' | 'en' | 'es';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  isAdmin: boolean;
  setIsAdmin: (admin: boolean) => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const translations = {
  zh,
  en,
  es,
};

// 根据浏览器语言自动检测
function detectLanguage(isAdmin: boolean): Language {
  // 优先从localStorage读取用户选择的语言
  const saved = localStorage.getItem(isAdmin ? 'adminLanguage' : 'userLanguage');
  if (saved === 'es' || saved === 'en' || saved === 'zh') {
    return saved as Language;
  }
  
  if (isAdmin) {
    // 商家后台：如果没有保存的语言，默认中文
    return 'zh';
  } else {
    // 用户端：根据浏览器语言自动检测
    const browserLang = navigator.language || (navigator as any).userLanguage || '';
    const langLower = browserLang.toLowerCase();
    if (langLower.startsWith('es')) {
      return 'es'; // 西班牙语
    } else if (langLower.startsWith('en')) {
      return 'en'; // 英语
    } else if (langLower.startsWith('zh')) {
      return 'zh'; // 中文
    }
    // 默认使用英语
    return 'en';
  }
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [language, setLanguageState] = useState<Language>(() => detectLanguage(isAdmin));

  useEffect(() => {
    // 当isAdmin改变时，重新检测语言
    const detectedLang = detectLanguage(isAdmin);
    setLanguageState(detectedLang);
  }, [isAdmin]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    // 保存语言选择到localStorage
    localStorage.setItem(isAdmin ? 'adminLanguage' : 'userLanguage', lang);
  };

  // 翻译函数：支持嵌套路径，如 'menu.title' 或 'admin.dashboard.title'
  const t = (key: string): string => {
    const keys = key.split('.');
    let value: unknown = translations[language];
    
    for (const k of keys) {
      if (value && typeof value === 'object' && value !== null && k in value) {
        value = (value as Record<string, unknown>)[k];
      } else {
        // 如果找不到翻译，尝试从中文获取
        let fallback: unknown = translations.zh;
        for (const k2 of keys) {
          if (fallback && typeof fallback === 'object' && fallback !== null && k2 in fallback) {
            fallback = (fallback as Record<string, unknown>)[k2];
          } else {
            return key; // 如果都找不到，返回key本身
          }
        }
        return typeof fallback === 'string' ? fallback : key;
      }
    }
    
    return typeof value === 'string' ? value : key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, isAdmin, setIsAdmin }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
}
