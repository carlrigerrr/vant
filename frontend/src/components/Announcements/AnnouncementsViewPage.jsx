import React, { useState, useEffect } from 'react';
import { SpeakerphoneIcon, InboxInIcon, SupportIcon, ExclamationCircleIcon, ExclamationIcon, InformationCircleIcon } from '@heroicons/react/outline';
import axios from 'axios';
import { useUserContext } from '../useUserContext';

const AnnouncementsViewPage = () => {
    const { user } = useUserContext();
    const [announcements, setAnnouncements] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) {
            fetchAnnouncements();
        }
    }, [user]);

    // Poll for new announcements every 60 seconds
    useEffect(() => {
        if (!user) return;

        const pollInterval = setInterval(() => {
            fetchAnnouncements();
        }, 60000); // Poll every 60 seconds

        return () => clearInterval(pollInterval);
    }, [user]);

    const fetchAnnouncements = async () => {
        try {
            const response = await axios.get('/api/announcements');
            setAnnouncements(Array.isArray(response.data) ? response.data : []);
        } catch (error) {
            console.error('Error fetching announcements:', error);
        } finally {
            setLoading(false);
        }
    };

    const getPriorityStyle = (priority) => {
        switch (priority) {
            case 'urgent':
                return 'border-l-4 border-red-500 bg-red-50';
            case 'important':
                return 'border-l-4 border-orange-500 bg-orange-50';
            default:
                return 'border-l-4 border-blue-500 bg-white';
        }
    };

    const getPriorityBadge = (priority) => {
        const styles = {
            urgent: 'bg-red-100 text-red-700',
            important: 'bg-orange-100 text-orange-700',
            normal: 'bg-blue-100 text-blue-700'
        };
        return styles[priority] || styles.normal;
    };

    if (!user) {
        return (
            <>
                <div className="text-center py-10">Loading...</div>
            </>
        );
    }

    return (
        <>
            <div className="max-w-3xl mx-auto px-4 py-8">
                <h1 className="text-3xl font-bold mb-6 flex items-center gap-2">
                    <SpeakerphoneIcon className="w-8 h-8 text-blue-600" /> Announcements
                </h1>

                {loading ? (
                    <div className="text-center py-10">Loading...</div>
                ) : announcements.length === 0 ? (
                    <div className="text-center py-10 text-gray-500 bg-white rounded-lg shadow">
                        <InboxInIcon className="w-16 h-16 mx-auto mb-2 text-gray-400" />
                        <p>No announcements at this time</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {announcements.map((ann) => (
                            <div
                                key={ann._id}
                                className={`rounded-lg shadow p-5 ${getPriorityStyle(ann.priority)}`}
                            >
                                <div className="flex items-start justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        {ann.pinned && <SupportIcon className="w-5 h-5 text-red-500 transform rotate-45" />}
                                        <h2 className="text-xl font-semibold">{ann.title}</h2>
                                    </div>
                                    <span className={`px-2 py-1 rounded text-xs font-medium flex items-center gap-1 ${getPriorityBadge(ann.priority)}`}>
                                        {ann.priority === 'urgent' ? <><ExclamationCircleIcon className="w-3 h-3" /> Urgent</> :
                                            ann.priority === 'important' ? <><ExclamationIcon className="w-3 h-3" /> Important</> : <><InformationCircleIcon className="w-3 h-3" /> Info</>}
                                    </span>
                                </div>
                                <p className="text-gray-700 whitespace-pre-wrap mb-3">{ann.content}</p>
                                <div className="text-xs text-gray-500">
                                    Posted by {ann.authorId?.username || 'Admin'} • {new Date(ann.createdAt).toLocaleDateString()}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </>
    );
};

export default AnnouncementsViewPage;
