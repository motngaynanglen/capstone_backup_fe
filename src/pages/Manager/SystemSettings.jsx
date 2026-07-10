import React, { useState } from 'react';

const SystemSettings = () => {
  const [settings, setSettings] = useState({
    paymentMethods: {
      creditCard: true,
      paypal: true,
      bankTransfer: true
    },
    zaloOA: {
      enabled: true,
      apiKey: '******'
    },
    notifications: {
      email: true,
      sms: false,
      zalo: true
    }
  });

  const handleToggle = (category, key) => {
    setSettings({
      ...settings,
      [category]: {
        ...settings[category],
        [key]: !settings[category][key]
      }
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-gray-800">Cài đặt hệ thống</h1>

      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold mb-6 text-gray-800">Payment Methods</h2>
          <div className="space-y-4">
            <label className="flex items-center justify-between cursor-pointer">
              <span className="font-medium text-gray-800">Credit Card</span>
              <input
                type="checkbox"
                checked={settings.paymentMethods.creditCard}
                onChange={() => handleToggle('paymentMethods', 'creditCard')}
                className="w-5 h-5"
              />
            </label>
            <label className="flex items-center justify-between cursor-pointer">
              <span className="font-medium text-gray-800">PayPal</span>
              <input
                type="checkbox"
                checked={settings.paymentMethods.paypal}
                onChange={() => handleToggle('paymentMethods', 'paypal')}
                className="w-5 h-5"
              />
            </label>
            <label className="flex items-center justify-between cursor-pointer">
              <span className="font-medium text-gray-800">Bank Transfer</span>
              <input
                type="checkbox"
                checked={settings.paymentMethods.bankTransfer}
                onChange={() => handleToggle('paymentMethods', 'bankTransfer')}
                className="w-5 h-5"
              />
            </label>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold mb-6 text-gray-800">Zalo OA Integration</h2>
          <div className="space-y-4">
            <label className="flex items-center justify-between cursor-pointer">
              <span className="font-medium text-gray-800">Enable Zalo Notifications</span>
              <input
                type="checkbox"
                checked={settings.zaloOA.enabled}
                onChange={() => handleToggle('zaloOA', 'enabled')}
                className="w-5 h-5"
              />
            </label>
            <div>
              <label className="block mb-2 font-medium text-gray-800">API Key</label>
              <input
                type="password"
                value={settings.zaloOA.apiKey}
                onChange={(e) => setSettings({
                  ...settings,
                  zaloOA: { ...settings.zaloOA, apiKey: e.target.value }
                })}
                className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:border-indigo-600"
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold mb-6 text-gray-800">Notification Settings</h2>
          <div className="space-y-4">
            <label className="flex items-center justify-between cursor-pointer">
              <span className="font-medium text-gray-800">Email Notifications</span>
              <input
                type="checkbox"
                checked={settings.notifications.email}
                onChange={() => handleToggle('notifications', 'email')}
                className="w-5 h-5"
              />
            </label>
            <label className="flex items-center justify-between cursor-pointer">
              <span className="font-medium text-gray-800">SMS Notifications</span>
              <input
                type="checkbox"
                checked={settings.notifications.sms}
                onChange={() => handleToggle('notifications', 'sms')}
                className="w-5 h-5"
              />
            </label>
            <label className="flex items-center justify-between cursor-pointer">
              <span className="font-medium text-gray-800">Zalo Notifications</span>
              <input
                type="checkbox"
                checked={settings.notifications.zalo}
                onChange={() => handleToggle('notifications', 'zalo')}
                className="w-5 h-5"
              />
            </label>
          </div>
        </div>

        <div className="flex justify-end">
          <button className="py-3 px-8 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors">
            Save Settings
          </button>
        </div>
      </div>
      </div>
    </div>
  );
};

export default SystemSettings;

