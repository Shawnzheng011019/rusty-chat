import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSettings } from '../../contexts/SettingsContext';

interface ToggleSwitchProps {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  disabled?: boolean;
}

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({ enabled, onChange, disabled = false }) => {
  return (
    <button
      type="button"
      onClick={() => !disabled && onChange(!enabled)}
      disabled={disabled}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
        enabled 
          ? 'bg-indigo-600' 
          : 'bg-gray-200 dark:bg-gray-700'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          enabled ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );
};

export const NotificationSettings: React.FC = () => {
  const { t } = useTranslation();
  const { settings, updateNotifications } = useSettings();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleToggle = async (key: keyof typeof settings.notifications, value: boolean) => {
    setIsLoading(true);
    setMessage(null);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 300));
      
      updateNotifications({ [key]: value });
      setMessage({ type: 'success', text: t('settingsSaved') });
      
      // Clear message after 3 seconds
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: t('updateError') });
    } finally {
      setIsLoading(false);
    }
  };

  const notificationOptions = [
    {
      key: 'messageNotifications' as const,
      title: t('messageNotifications'),
      description: 'Receive notifications for new messages',
    },
    {
      key: 'soundAlerts' as const,
      title: t('soundAlerts'),
      description: 'Play sound when receiving notifications',
    },
    {
      key: 'desktopNotifications' as const,
      title: t('desktopNotifications'),
      description: 'Show desktop notifications',
    },
    {
      key: 'emailNotifications' as const,
      title: t('emailNotifications'),
      description: 'Send email notifications for important updates',
    },
    {
      key: 'pushNotifications' as const,
      title: t('pushNotifications'),
      description: 'Send push notifications to your devices',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          {t('notificationSettings')}
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Manage how you receive notifications
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

      <div className="space-y-6">
        {notificationOptions.map((option) => (
          <div key={option.key} className="flex items-center justify-between py-4 border-b border-gray-200 dark:border-gray-700 last:border-b-0">
            <div className="flex-1">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                {option.title}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {option.description}
              </p>
            </div>
            
            <div className="ml-4">
              <ToggleSwitch
                enabled={settings.notifications[option.key]}
                onChange={(value) => handleToggle(option.key, value)}
                disabled={isLoading}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Notification Preview */}
      <div className="mt-8 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
          Notification Preview
        </h3>
        
        <div className="space-y-3">
          {settings.notifications.messageNotifications && (
            <div className="flex items-center space-x-3 p-3 bg-white dark:bg-gray-700 rounded-lg shadow-sm">
              <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900 rounded-full flex items-center justify-center">
                <span className="text-indigo-600 dark:text-indigo-400 text-sm font-medium">JD</span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-white">John Doe</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Hey, how are you doing?</p>
              </div>
              <span className="text-xs text-gray-500 dark:text-gray-400">2m ago</span>
            </div>
          )}
          
          {!settings.notifications.messageNotifications && (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <p>Message notifications are disabled</p>
            </div>
          )}
        </div>
      </div>

      {/* Browser Permissions */}
      <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
        <h3 className="text-lg font-medium text-blue-900 dark:text-blue-300 mb-2">
          Browser Permissions
        </h3>
        <p className="text-sm text-blue-700 dark:text-blue-400 mb-3">
          To receive desktop notifications, you need to grant permission in your browser.
        </p>
        
        <button
          onClick={() => {
            if ('Notification' in window) {
              Notification.requestPermission().then((permission) => {
                if (permission === 'granted') {
                  new Notification('Notifications enabled!', {
                    body: 'You will now receive desktop notifications.',
                    icon: '/favicon.ico'
                  });
                }
              });
            }
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
        >
          Enable Desktop Notifications
        </button>
      </div>
    </div>
  );
};
