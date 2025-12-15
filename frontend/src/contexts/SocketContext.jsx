/**
 * Socket.io Context for Real-time Updates
 * Provides WebSocket connection and notification handling throughout the app
 */
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext(null);

export const useSocket = () => useContext(SocketContext);

// Notification permission helper
const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
        console.log('This browser does not support notifications');
        return 'unsupported';
    }

    if (Notification.permission === 'granted') {
        return 'granted';
    }

    if (Notification.permission !== 'denied') {
        const permission = await Notification.requestPermission();
        return permission;
    }

    return Notification.permission;
};

// Show browser notification
const showBrowserNotification = (title, options = {}) => {
    if (Notification.permission === 'granted') {
        const notification = new Notification(title, {
            icon: '/favicon.ico',
            badge: '/favicon.ico',
            ...options
        });

        // Auto close after 5 seconds
        setTimeout(() => notification.close(), 5000);

        // Focus window on click
        notification.onclick = () => {
            window.focus();
            notification.close();
        };

        return notification;
    }
};

export const SocketProvider = ({ children, user, client }) => {
    const [socket, setSocket] = useState(null);
    const [connected, setConnected] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [notificationPermission, setNotificationPermission] = useState('default');

    // Add notification to state
    const addNotification = useCallback((notification) => {
        const newNotification = {
            id: Date.now(),
            ...notification,
            read: false
        };

        setNotifications(prev => [newNotification, ...prev].slice(0, 50)); // Keep last 50

        // Show browser notification if permitted
        if (notificationPermission === 'granted') {
            showBrowserNotification(notification.title, {
                body: notification.message,
                tag: notification.type
            });
        }
    }, [notificationPermission]);

    // Mark notification as read
    const markAsRead = useCallback((id) => {
        setNotifications(prev =>
            prev.map(n => n.id === id ? { ...n, read: true } : n)
        );
    }, []);

    // Clear all notifications
    const clearNotifications = useCallback(() => {
        setNotifications([]);
    }, []);

    // Request notification permission
    useEffect(() => {
        requestNotificationPermission().then(permission => {
            setNotificationPermission(permission);
        });
    }, []);

    // Initialize socket connection
    useEffect(() => {
        // Only connect if we have a user or client
        if (!user && !client) return;

        const socketUrl = process.env.REACT_APP_SOCKET_URL || 'http://localhost:4080';

        const newSocket = io(socketUrl, {
            withCredentials: true,
            transports: ['websocket', 'polling']
        });

        newSocket.on('connect', () => {
            console.log('🔌 Socket connected:', newSocket.id);
            setConnected(true);

            // Authenticate based on user type
            if (user) {
                newSocket.emit('auth:user', {
                    userId: user.id,
                    username: user.username,
                    isAdmin: user.admin
                });
            } else if (client) {
                newSocket.emit('auth:client', {
                    clientId: client._id,
                    name: client.name
                });
            }

            // Send notification permission status
            newSocket.emit('notification:permission', notificationPermission);
        });

        newSocket.on('disconnect', () => {
            console.log('🔌 Socket disconnected');
            setConnected(false);
        });

        newSocket.on('auth:success', (data) => {
            console.log('✅ Socket authenticated:', data.message);
        });

        // ==================== EVENT HANDLERS ====================

        // Employee check-in (for admins)
        newSocket.on('employee:checkin', (data) => {
            addNotification(data);
        });

        // Employee check-out (for admins)
        newSocket.on('employee:checkout', (data) => {
            addNotification(data);
        });

        // Job complete (for admins)
        newSocket.on('job:complete', (data) => {
            addNotification(data);
        });

        // Day off request (for admins)
        newSocket.on('request:dayoff', (data) => {
            addNotification(data);
        });

        // Shift swap request (for admins)
        newSocket.on('request:swap', (data) => {
            addNotification(data);
        });

        // Request response (for employees)
        newSocket.on('request:response', (data) => {
            addNotification(data);
        });

        // GPS warning (for admins)
        newSocket.on('gps:warning', (data) => {
            addNotification(data);
        });

        // New message
        newSocket.on('message:new', (data) => {
            addNotification(data);
        });

        // Announcement
        newSocket.on('announcement:new', (data) => {
            addNotification(data);
        });

        // Service update (for clients)
        newSocket.on('service:update', (data) => {
            addNotification(data);
        });

        setSocket(newSocket);

        return () => {
            newSocket.close();
        };
    }, [user, client, notificationPermission, addNotification]);

    const value = {
        socket,
        connected,
        notifications,
        unreadCount: notifications.filter(n => !n.read).length,
        addNotification,
        markAsRead,
        clearNotifications,
        notificationPermission,
        requestPermission: requestNotificationPermission
    };

    return (
        <SocketContext.Provider value={value}>
            {children}
        </SocketContext.Provider>
    );
};

export default SocketContext;
