// Browser Notifications Utility Hook
import { useState, useEffect, useCallback } from 'react';

export const useNotifications = () => {
    const [permission, setPermission] = useState('default');
    const [supported, setSupported] = useState(false);

    useEffect(() => {
        // Check if browser supports notifications
        if ('Notification' in window) {
            setSupported(true);
            setPermission(Notification.permission);
        }
    }, []);

    const requestPermission = useCallback(async () => {
        if (!supported) return false;

        try {
            const result = await Notification.requestPermission();
            setPermission(result);
            return result === 'granted';
        } catch (error) {
            console.error('Error requesting notification permission:', error);
            return false;
        }
    }, [supported]);

    const sendNotification = useCallback((title, options = {}) => {
        if (!supported || permission !== 'granted') {
            return null;
        }

        try {
            const notification = new Notification(title, {
                icon: '/favicon.ico',
                badge: '/favicon.ico',
                ...options
            });

            // Auto-close after 5 seconds
            setTimeout(() => notification.close(), 5000);

            // Handle click - focus window
            notification.onclick = () => {
                window.focus();
                notification.close();
                if (options.onClick) options.onClick();
            };

            return notification;
        } catch (error) {
            console.error('Error sending notification:', error);
            return null;
        }
    }, [supported, permission]);

    const notifyNewMessage = useCallback((senderName, preview) => {
        return sendNotification(`New message from ${senderName}`, {
            body: preview.substring(0, 100),
            tag: 'new-message',
            requireInteraction: false
        });
    }, [sendNotification]);

    const notifyNewAnnouncement = useCallback((title, priority) => {
        const priorityEmoji = priority === 'urgent' ? '🚨' : priority === 'important' ? '⚠️' : '📢';
        return sendNotification(`${priorityEmoji} ${title}`, {
            body: 'New announcement posted',
            tag: 'announcement',
            requireInteraction: priority === 'urgent'
        });
    }, [sendNotification]);

    return {
        supported,
        permission,
        requestPermission,
        sendNotification,
        notifyNewMessage,
        notifyNewAnnouncement
    };
};

export default useNotifications;
