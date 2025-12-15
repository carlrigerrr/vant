import React from 'react';
import useNotifications from '../../hooks/useNotifications';

const NotificationSettings = () => {
    const { supported, permission, requestPermission } = useNotifications();

    if (!supported) {
        return (
            <div className="bg-gray-100 p-4 rounded-lg text-gray-500 text-sm">
                Your browser does not support notifications
            </div>
        );
    }

    const handleEnable = async () => {
        const granted = await requestPermission();
        if (granted) {
            alert('Notifications enabled! You will receive alerts for new messages.');
        } else {
            alert('Notification permission denied. You can enable it in your browser settings.');
        }
    };

    return (
        <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="font-semibold mb-2">🔔 Browser Notifications</h3>
            {permission === 'granted' ? (
                <div className="flex items-center gap-2 text-green-600">
                    <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                    <span>Notifications enabled</span>
                </div>
            ) : permission === 'denied' ? (
                <div className="text-gray-500 text-sm">
                    <p>Notifications blocked. Enable in browser settings:</p>
                    <p className="text-xs mt-1">Click the 🔒 icon in the address bar → Site settings → Notifications → Allow</p>
                </div>
            ) : (
                <button
                    onClick={handleEnable}
                    className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                    Enable Notifications
                </button>
            )}
        </div>
    );
};

export default NotificationSettings;
