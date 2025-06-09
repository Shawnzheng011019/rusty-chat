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

interface RadioGroupProps {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string; description?: string }[];
  disabled?: boolean;
}

const RadioGroup: React.FC<RadioGroupProps> = ({ value, onChange, options, disabled = false }) => {
  return (
    <div className="space-y-3">
      {options.map((option) => (
        <label key={option.value} className="flex items-start space-x-3 cursor-pointer">
          <input
            type="radio"
            value={option.value}
            checked={value === option.value}
            onChange={(e) => !disabled && onChange(e.target.value)}
            disabled={disabled}
            className="mt-1 h-4 w-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
          />
          <div className="flex-1">
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              {option.label}
            </span>
            {option.description && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {option.description}
              </p>
            )}
          </div>
        </label>
      ))}
    </div>
  );
};

export const PrivacySettings: React.FC = () => {
  const { t } = useTranslation();
  const { settings, updatePrivacy } = useSettings();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleToggle = async (key: 'showOnlineStatus' | 'readReceipts', value: boolean) => {
    setIsLoading(true);
    setMessage(null);

    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      
      updatePrivacy({ [key]: value });
      setMessage({ type: 'success', text: t('settingsSaved') });
      
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: t('updateError') });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRadioChange = async (key: 'friendRequests' | 'groupInvites', value: string) => {
    setIsLoading(true);
    setMessage(null);

    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      
      updatePrivacy({ [key]: value as 'everyone' | 'friends' | 'none' });
      setMessage({ type: 'success', text: t('settingsSaved') });
      
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: t('updateError') });
    } finally {
      setIsLoading(false);
    }
  };

  const friendRequestOptions = [
    {
      value: 'everyone',
      label: t('allowFromEveryone'),
      description: 'Anyone can send you friend requests'
    },
    {
      value: 'friends',
      label: t('allowFromFriends'),
      description: 'Only friends of friends can send requests'
    },
    {
      value: 'none',
      label: t('allowFromNone'),
      description: 'Disable friend requests completely'
    }
  ];

  const groupInviteOptions = [
    {
      value: 'everyone',
      label: t('allowFromEveryone'),
      description: 'Anyone can invite you to groups'
    },
    {
      value: 'friends',
      label: t('allowFromFriends'),
      description: 'Only friends can invite you to groups'
    },
    {
      value: 'none',
      label: t('allowFromNone'),
      description: 'Disable group invitations'
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          {t('privacySettings')}
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Control your privacy and who can interact with you
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

      <div className="space-y-8">
        {/* Online Status */}
        <div className="flex items-center justify-between py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex-1">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              {t('onlineStatus')}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Allow others to see when you're online
            </p>
          </div>
          
          <div className="ml-4">
            <ToggleSwitch
              enabled={settings.privacy.showOnlineStatus}
              onChange={(value) => handleToggle('showOnlineStatus', value)}
              disabled={isLoading}
            />
          </div>
        </div>

        {/* Read Receipts */}
        <div className="flex items-center justify-between py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex-1">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              {t('readReceipts')}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Let others know when you've read their messages
            </p>
          </div>
          
          <div className="ml-4">
            <ToggleSwitch
              enabled={settings.privacy.readReceipts}
              onChange={(value) => handleToggle('readReceipts', value)}
              disabled={isLoading}
            />
          </div>
        </div>

        {/* Friend Requests */}
        <div className="py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
            {t('friendRequests')}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Control who can send you friend requests
          </p>
          
          <RadioGroup
            value={settings.privacy.friendRequests}
            onChange={(value) => handleRadioChange('friendRequests', value)}
            options={friendRequestOptions}
            disabled={isLoading}
          />
        </div>

        {/* Group Invites */}
        <div className="py-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
            {t('groupInvites')}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Control who can invite you to groups
          </p>
          
          <RadioGroup
            value={settings.privacy.groupInvites}
            onChange={(value) => handleRadioChange('groupInvites', value)}
            options={groupInviteOptions}
            disabled={isLoading}
          />
        </div>
      </div>

      {/* Privacy Summary */}
      <div className="mt-8 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
          Privacy Summary
        </h3>
        
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Online status visible:</span>
            <span className={`font-medium ${settings.privacy.showOnlineStatus ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {settings.privacy.showOnlineStatus ? 'Yes' : 'No'}
            </span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Read receipts:</span>
            <span className={`font-medium ${settings.privacy.readReceipts ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {settings.privacy.readReceipts ? 'Enabled' : 'Disabled'}
            </span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Friend requests:</span>
            <span className="font-medium text-gray-900 dark:text-white">
              {friendRequestOptions.find(opt => opt.value === settings.privacy.friendRequests)?.label}
            </span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Group invites:</span>
            <span className="font-medium text-gray-900 dark:text-white">
              {groupInviteOptions.find(opt => opt.value === settings.privacy.groupInvites)?.label}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
