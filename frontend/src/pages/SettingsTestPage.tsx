import React from 'react';
import { useTranslation } from 'react-i18next';
import { useSettings } from '../contexts/SettingsContext';

export const SettingsTestPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { settings, profile, changeLanguage, updateSettings } = useSettings();

  const handleLanguageToggle = () => {
    const newLang = settings.language === 'en' ? 'zh' : 'en';
    changeLanguage(newLang);
  };

  const handleThemeToggle = () => {
    const themes = ['light', 'dark', 'system'] as const;
    const currentIndex = themes.indexOf(settings.theme);
    const nextIndex = (currentIndex + 1) % themes.length;
    updateSettings({ theme: themes[nextIndex] });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
          {t('settings')} - Test Page
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Language Test */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              {t('language')} Test
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Current: {settings.language} ({t('selectLanguage')})
            </p>
            <button
              onClick={handleLanguageToggle}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              Toggle Language
            </button>
          </div>

          {/* Theme Test */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              {t('theme')} Test
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Current: {settings.theme}
            </p>
            <button
              onClick={handleThemeToggle}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              Toggle Theme
            </button>
          </div>

          {/* Settings Display */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow md:col-span-2">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Current Settings
            </h2>
            <pre className="text-sm text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 p-4 rounded overflow-auto">
              {JSON.stringify({ settings, profile }, null, 2)}
            </pre>
          </div>

          {/* Translation Test */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow md:col-span-2">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Translation Test
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <strong>{t('settings')}:</strong> {t('settings')}
              </div>
              <div>
                <strong>{t('profile')}:</strong> {t('profile')}
              </div>
              <div>
                <strong>{t('notifications')}:</strong> {t('notifications')}
              </div>
              <div>
                <strong>{t('privacy')}:</strong> {t('privacy')}
              </div>
              <div>
                <strong>{t('theme')}:</strong> {t('theme')}
              </div>
              <div>
                <strong>{t('language')}:</strong> {t('language')}
              </div>
              <div>
                <strong>{t('account')}:</strong> {t('account')}
              </div>
              <div>
                <strong>{t('save')}:</strong> {t('save')}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center">
          <a
            href="/settings"
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 inline-block"
          >
            Go to Full Settings Page
          </a>
        </div>
      </div>
    </div>
  );
};
