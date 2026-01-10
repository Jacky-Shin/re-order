import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';

export default function ScanPage() {
  const [tableNumber, setTableNumber] = useState('');
  const navigate = useNavigate();
  const { t } = useLanguage();

  const handleScan = () => {
    if (tableNumber.trim()) {
      navigate(`/menu?table=${tableNumber}`);
    } else {
      navigate('/menu');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sb-green to-sb-dark-green flex items-center justify-center p-4 safe-area-inset">
      <div className="bg-white rounded-2xl shadow-2xl p-6 md:p-8 max-w-md w-full text-center">
        <div className="mb-6">
          <div className="w-20 h-20 md:w-24 md:h-24 mx-auto mb-4 bg-sb-green rounded-full flex items-center justify-center">
            <svg className="w-10 h-10 md:w-12 md:h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
            </svg>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-sb-dark-green mb-2">{t('menu.title')}</h1>
          <p className="text-gray-600 text-sm md:text-base">{t('scan.subtitle')}</p>
        </div>

        <div className="mb-6">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 md:p-8 mb-4">
            <svg className="w-12 h-12 md:w-16 md:h-16 mx-auto text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
            </svg>
            <p className="text-xs md:text-sm text-gray-500">{t('scan.scanQRCode')}</p>
            <p className="text-xs text-gray-400 mt-1">{t('scan.orClick')}</p>
          </div>
          
          <div className="text-left">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('scan.enterTableNumber')}
            </label>
            <input
              type="text"
              value={tableNumber}
              onChange={(e) => setTableNumber(e.target.value)}
              placeholder={t('scan.tableNumberPlaceholder')}
              className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-sb-green focus:border-transparent"
              inputMode="text"
            />
          </div>
        </div>

        <button
          onClick={handleScan}
          className="w-full bg-sb-green text-white py-3 md:py-3 rounded-lg font-semibold hover:bg-opacity-90 active:bg-opacity-80 transition-colors text-base md:text-lg touch-manipulation"
        >
          {t('scan.startOrdering')}
        </button>

        <p className="text-xs text-gray-500 mt-4 leading-relaxed">
          {t('scan.terms')}
        </p>
      </div>
    </div>
  );
}
