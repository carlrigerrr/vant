/**
 * NotificationToast Component
 * Displays real-time notifications in a toast/popup format
 */
import React, { useState, useEffect } from 'react';
import { useSocket } from '../contexts/SocketContext';

const NotificationToast = () => {
    const { notifications, markAsRead, connected, unreadCount } = useSocket() || {};
    const [showPanel, setShowPanel] = useState(false);
    const [latestToast, setLatestToast] = useState(null);

    // Show toast for new notifications
    useEffect(() => {
        if (notifications && notifications.length > 0) {
            const latest = notifications[0];
            if (!latest.read) {
                setLatestToast(latest);
                // Auto-hide toast after 5 seconds
                const timer = setTimeout(() => {
                    setLatestToast(null);
                    markAsRead?.(latest.id);
                }, 5000);
                return () => clearTimeout(timer);
            }
        }
    }, [notifications, markAsRead]);

    if (!connected) return null;

    const getTypeIcon = (type) => {
        const icons = {
            'checkin': '✅',
            'checkout': '👋',
            'job_complete': '✅',
            'dayoff_request': '📅',
            'swap_request': '🔄',
            'gps_warning': '⚠️',
            'new_message': '💬',
            'announcement': '📢',
            'employee_arrived': '🏠',
            'employee_left': '👋',
            'default': '🔔'
        };
        return icons[type] || icons.default;
    };

    const getTypeColor = (type) => {
        const colors = {
            'checkin': 'bg-green-500',
            'checkout': 'bg-blue-500',
            'job_complete': 'bg-emerald-500',
            'dayoff_request': 'bg-yellow-500',
            'swap_request': 'bg-purple-500',
            'gps_warning': 'bg-orange-500',
            'new_message': 'bg-indigo-500',
            'announcement': 'bg-red-500',
            'employee_arrived': 'bg-green-500',
            'employee_left': 'bg-blue-500',
            'default': 'bg-gray-500'
        };
        return colors[type] || colors.default;
    };

    return (
        <>
            {/* Toast Notification - appears in top right */}
            {latestToast && (
                <div
                    className="fixed top-4 right-4 z-50 animate-slide-in"
                    onClick={() => {
                        setLatestToast(null);
                        markAsRead?.(latestToast.id);
                    }}
                >
                    <div className={`flex items-start gap-3 p-4 rounded-lg shadow-lg cursor-pointer max-w-sm ${getTypeColor(latestToast.type)} text-white`}>
                        <span className="text-2xl">{getTypeIcon(latestToast.type)}</span>
                        <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm">{latestToast.title}</p>
                            <p className="text-sm opacity-90 truncate">{latestToast.message}</p>
                            <p className="text-xs opacity-75 mt-1">
                                {new Date(latestToast.timestamp).toLocaleTimeString()}
                            </p>
                        </div>
                        <button
                            className="text-white/70 hover:text-white"
                            onClick={(e) => {
                                e.stopPropagation();
                                setLatestToast(null);
                                markAsRead?.(latestToast.id);
                            }}
                        >
                            ✕
                        </button>
                    </div>
                </div>
            )}

            {/* Connection Status Indicator */}
            <div className="fixed bottom-4 right-4 z-40">
                <div
                    className="flex items-center gap-2 px-3 py-2 bg-white rounded-full shadow-md cursor-pointer hover:shadow-lg transition-shadow"
                    onClick={() => setShowPanel(!showPanel)}
                >
                    <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                    </span>
                    <span className="text-sm text-gray-600">Live</span>
                    {unreadCount > 0 && (
                        <span className="bg-red-500 text-white text-xs rounded-full px-2 py-0.5">
                            {unreadCount}
                        </span>
                    )}
                </div>
            </div>

            {/* Notification Panel */}
            {showPanel && (
                <div className="fixed bottom-16 right-4 z-40 w-80 max-h-96 overflow-y-auto bg-white rounded-lg shadow-xl border border-gray-200">
                    <div className="sticky top-0 bg-white border-b border-gray-200 p-3 flex justify-between items-center">
                        <h3 className="font-semibold text-gray-800">Notifications</h3>
                        <button
                            onClick={() => setShowPanel(false)}
                            className="text-gray-400 hover:text-gray-600"
                        >
                            ✕
                        </button>
                    </div>

                    {notifications?.length === 0 ? (
                        <div className="p-4 text-center text-gray-500">
                            No notifications yet
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-100">
                            {notifications?.map((notif) => (
                                <div
                                    key={notif.id}
                                    className={`p-3 hover:bg-gray-50 cursor-pointer ${!notif.read ? 'bg-blue-50' : ''}`}
                                    onClick={() => markAsRead?.(notif.id)}
                                >
                                    <div className="flex items-start gap-2">
                                        <span className="text-lg">{getTypeIcon(notif.type)}</span>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-800">{notif.title}</p>
                                            <p className="text-xs text-gray-600 truncate">{notif.message}</p>
                                            <p className="text-xs text-gray-400 mt-1">
                                                {new Date(notif.timestamp).toLocaleTimeString()}
                                            </p>
                                        </div>
                                        {!notif.read && (
                                            <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            <style>{`
                @keyframes slide-in {
                    from {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
                .animate-slide-in {
                    animation: slide-in 0.3s ease-out;
                }
            `}</style>
        </>
    );
};

export default NotificationToast;
