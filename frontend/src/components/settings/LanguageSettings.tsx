import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CheckIcon, GlobeAltIcon } from '@heroicons/react/24/outline';
import { useSettings } from '../../contexts/SettingsContext';
import type { Language } from '../../contexts/SettingsContext';

interface LanguageOptionProps {
  language: Language;
  currentLanguage: Language;
  label: string;
  nativeLabel: string;
  flag: string;
  onClick: () => void;
  disabled?: boolean;
}

const LanguageOption: React.FC<LanguageOptionProps> = ({
  language,
  currentLanguage,
  label,
  nativeLabel,
  flag,
  onClick,
  disabled = false
}) => {
  const isSelected = currentLanguage === language;
  
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-full p-4 rounded-lg border-2 transition-all ${
        isSelected
          ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      <div className="flex items-center space-x-4">
        <div className="text-2xl">{flag}</div>
        
        <div className="flex-1 text-left">
          <h3 className={`font-medium ${
            isSelected 
              ? 'text-indigo-900 dark:text-indigo-100' 
              : 'text-gray-900 dark:text-white'
          }`}>
            {label}
          </h3>
          <p className={`text-sm ${
            isSelected 
              ? 'text-indigo-700 dark:text-indigo-300' 
              : 'text-gray-600 dark:text-gray-400'
          }`}>
            {nativeLabel}
          </p>
        </div>
        
        {isSelected && (
          <CheckIcon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
        )}
      </div>
    </button>
  );
};

export const LanguageSettings: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { settings, changeLanguage } = useSettings();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleLanguageChange = async (language: Language) => {
    if (language === settings.language) return;
    
    setIsLoading(true);
    setMessage(null);

    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      changeLanguage(language);
      setMessage({ type: 'success', text: t('settingsSaved') });
      
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: t('updateError') });
    } finally {
      setIsLoading(false);
    }
  };

  const languageOptions = [
    {
      language: 'en' as Language,
      label: t('english'),
      nativeLabel: 'English',
      flag: '🇺🇸'
    },
    {
      language: 'zh' as Language,
      label: t('chinese'),
      nativeLabel: '中文',
      flag: '🇨🇳'
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          {t('languageSettings')}
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Choose your preferred language for the interface
        </p>
      </div>

      {message && (
        <div className={`p-4 rounded-lg ${
          message.type === 'success' 
            ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800'
            : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800'
        }`}>
          {message.text}
        </div>
      )}

      {/* Language Selection */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center space-x-2">
          <GlobeAltIcon className="w-5 h-5" />
          <span>{t('selectLanguage')}</span>
        </h3>
        
        <div className="space-y-3">
          {languageOptions.map((option) => (
            <LanguageOption
              key={option.language}
              language={option.language}
              currentLanguage={settings.language}
              label={option.label}
              nativeLabel={option.nativeLabel}
              flag={option.flag}
              onClick={() => handleLanguageChange(option.language)}
              disabled={isLoading}
            />
          ))}
        </div>
      </div>

      {/* Language Info */}
      <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
        <h3 className="text-lg font-medium text-blue-900 dark:text-blue-300 mb-2">
          Language Information
        </h3>
        <div className="space-y-2 text-sm text-blue-700 dark:text-blue-400">
          <p>• The language setting affects the entire interface</p>
          <p>• Changes take effect immediately</p>
          <p>• Your language preference is saved locally</p>
          <p>• Message content language is not affected by this setting</p>
        </div>
      </div>

      {/* Current Status */}
      <div className="mt-8 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
          Current Settings
        </h3>
        
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-gray-600 dark:text-gray-400">Interface Language:</span>
            <div className="flex items-center space-x-2">
              <span className="text-lg">
                {languageOptions.find(opt => opt.language === settings.language)?.flag}
              </span>
              <span className="font-medium text-gray-900 dark:text-white">
                {languageOptions.find(opt => opt.language === settings.language)?.nativeLabel}
              </span>
            </div>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-gray-600 dark:text-gray-400">Browser Language:</span>
            <span className="font-medium text-gray-900 dark:text-white">
              {navigator.language || 'Unknown'}
            </span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-gray-600 dark:text-gray-400">Fallback Language:</span>
            <span className="font-medium text-gray-900 dark:text-white">
              English
            </span>
          </div>
        </div>
      </div>

      {/* Preview */}
      <div className="mt-8 p-6 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Interface Preview
        </h3>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-700 rounded-lg">
            <span className="text-gray-900 dark:text-white">{t('settings')}</span>
            <span className="text-sm text-gray-500 dark:text-gray-400">Navigation</span>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-700 rounded-lg">
            <span className="text-gray-900 dark:text-white">{t('save')}</span>
            <span className="text-sm text-gray-500 dark:text-gray-400">Button</span>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-700 rounded-lg">
            <span className="text-gray-900 dark:text-white">{t('profileSettings')}</span>
            <span className="text-sm text-gray-500 dark:text-gray-400">Section Title</span>
          </div>
        </div>
      </div>
    </div>
  );
};
