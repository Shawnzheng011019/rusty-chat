import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  SunIcon, 
  MoonIcon, 
  ComputerDesktopIcon,
  CheckIcon 
} from '@heroicons/react/24/outline';
import { useSettings } from '../../contexts/SettingsContext';
import type { Theme, FontSize } from '../../contexts/SettingsContext';

interface ThemeOptionProps {
  theme: Theme;
  currentTheme: Theme;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  onClick: () => void;
  disabled?: boolean;
}

const ThemeOption: React.FC<ThemeOptionProps> = ({
  theme,
  currentTheme,
  icon: Icon,
  title,
  description,
  onClick,
  disabled = false
}) => {
  const isSelected = currentTheme === theme;
  
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`relative w-full p-4 rounded-lg border-2 transition-all ${
        isSelected
          ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      <div className="flex items-center space-x-3">
        <div className={`p-2 rounded-lg ${
          isSelected 
            ? 'bg-indigo-100 dark:bg-indigo-800' 
            : 'bg-gray-100 dark:bg-gray-800'
        }`}>
          <Icon className={`w-6 h-6 ${
            isSelected 
              ? 'text-indigo-600 dark:text-indigo-400' 
              : 'text-gray-600 dark:text-gray-400'
          }`} />
        </div>
        
        <div className="flex-1 text-left">
          <h3 className={`font-medium ${
            isSelected 
              ? 'text-indigo-900 dark:text-indigo-100' 
              : 'text-gray-900 dark:text-white'
          }`}>
            {title}
          </h3>
          <p className={`text-sm ${
            isSelected 
              ? 'text-indigo-700 dark:text-indigo-300' 
              : 'text-gray-600 dark:text-gray-400'
          }`}>
            {description}
          </p>
        </div>
        
        {isSelected && (
          <CheckIcon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
        )}
      </div>
    </button>
  );
};

interface FontSizeOptionProps {
  size: FontSize;
  currentSize: FontSize;
  label: string;
  example: string;
  onClick: () => void;
  disabled?: boolean;
}

const FontSizeOption: React.FC<FontSizeOptionProps> = ({
  size,
  currentSize,
  label,
  example,
  onClick,
  disabled = false
}) => {
  const isSelected = currentSize === size;
  
  const sizeClasses = {
    small: 'text-sm',
    medium: 'text-base',
    large: 'text-lg'
  };
  
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
      <div className="flex items-center justify-between">
        <div className="text-left">
          <h3 className={`font-medium ${
            isSelected 
              ? 'text-indigo-900 dark:text-indigo-100' 
              : 'text-gray-900 dark:text-white'
          }`}>
            {label}
          </h3>
          <p className={`${sizeClasses[size]} ${
            isSelected 
              ? 'text-indigo-700 dark:text-indigo-300' 
              : 'text-gray-600 dark:text-gray-400'
          } mt-1`}>
            {example}
          </p>
        </div>
        
        {isSelected && (
          <CheckIcon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
        )}
      </div>
    </button>
  );
};

export const ThemeSettings: React.FC = () => {
  const { t } = useTranslation();
  const { settings, updateSettings } = useSettings();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleThemeChange = async (theme: Theme) => {
    setIsLoading(true);
    setMessage(null);

    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      
      updateSettings({ theme });
      setMessage({ type: 'success', text: t('settingsSaved') });
      
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: t('updateError') });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFontSizeChange = async (fontSize: FontSize) => {
    setIsLoading(true);
    setMessage(null);

    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      
      updateSettings({ fontSize });
      setMessage({ type: 'success', text: t('settingsSaved') });
      
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: t('updateError') });
    } finally {
      setIsLoading(false);
    }
  };

  const themeOptions = [
    {
      theme: 'light' as Theme,
      icon: SunIcon,
      title: t('lightMode'),
      description: 'Use light theme'
    },
    {
      theme: 'dark' as Theme,
      icon: MoonIcon,
      title: t('darkMode'),
      description: 'Use dark theme'
    },
    {
      theme: 'system' as Theme,
      icon: ComputerDesktopIcon,
      title: t('systemMode'),
      description: 'Follow system preference'
    }
  ];

  const fontSizeOptions = [
    {
      size: 'small' as FontSize,
      label: t('small'),
      example: 'Small text example'
    },
    {
      size: 'medium' as FontSize,
      label: t('medium'),
      example: 'Medium text example'
    },
    {
      size: 'large' as FontSize,
      label: t('large'),
      example: 'Large text example'
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          {t('themeSettings')}
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Customize the appearance of the application
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

      {/* Theme Selection */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          {t('appearance')}
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {themeOptions.map((option) => (
            <ThemeOption
              key={option.theme}
              theme={option.theme}
              currentTheme={settings.theme}
              icon={option.icon}
              title={option.title}
              description={option.description}
              onClick={() => handleThemeChange(option.theme)}
              disabled={isLoading}
            />
          ))}
        </div>
      </div>

      {/* Font Size Selection */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          {t('fontSize')}
        </h3>
        
        <div className="space-y-3">
          {fontSizeOptions.map((option) => (
            <FontSizeOption
              key={option.size}
              size={option.size}
              currentSize={settings.fontSize}
              label={option.label}
              example={option.example}
              onClick={() => handleFontSizeChange(option.size)}
              disabled={isLoading}
            />
          ))}
        </div>
      </div>

      {/* Preview */}
      <div className="mt-8 p-6 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Preview
        </h3>
        
        <div className="space-y-4">
          <div className="p-4 bg-white dark:bg-gray-700 rounded-lg shadow-sm">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-900 rounded-full flex items-center justify-center">
                <span className="text-indigo-600 dark:text-indigo-400 text-sm font-medium">JD</span>
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white">John Doe</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">2 minutes ago</p>
              </div>
            </div>
            <p className="text-gray-800 dark:text-gray-200">
              This is how your messages will look with the current theme and font size settings.
            </p>
          </div>
          
          <div className="flex justify-end">
            <div className="p-4 bg-indigo-600 text-white rounded-lg max-w-xs">
              <p>Your reply will appear like this.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
