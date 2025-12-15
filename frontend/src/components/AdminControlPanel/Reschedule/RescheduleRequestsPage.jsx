import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useUserContext } from '../../useUserContext';
import { MailIcon, PhoneIcon } from '@heroicons/react/outline';

const RescheduleRequestsPage = () => {
    const { user } = useUserContext();
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user && user.admin) {
            fetchRequests();
        }
    }, [user]);

    const fetchRequests = async () => {
        try {
            const response = await axios.get('/api/reschedule/all');
            setRequests(Array.isArray(response.data) ? response.data : []);
        } catch (error) {
            console.error('Error fetching requests:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (id, status, adminNote = '') => {
        try {
            await axios.put(`/api/reschedule/${id}`, { status, adminNote });
            fetchRequests();
        } catch (error) {
            alert('Error updating request');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Delete this request?')) {
            try {
                await axios.delete(`/api/reschedule/${id}`);
                fetchRequests();
            } catch (error) {
                alert('Error deleting request');
            }
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric'
        });
    };

    const getStatusBadge = (status) => {
        const styles = {
            pending: 'bg-yellow-100 text-yellow-700',
            approved: 'bg-green-100 text-green-700',
            denied: 'bg-red-100 text-red-700'
        };
        return (
            <span className={`px-2 py-1 rounded text-xs font-medium ${styles[status]}`}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
        );
    };

    if (!user) {
        return <div className="text-center py-10">Loading...</div>;
    }

    if (!user.admin) {
        return <div className="text-center mt-10">Unauthorized</div>;
    }

    return (
        <div className="max-w-6xl mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-6">Reschedule Requests</h1>

            {loading ? (
                <div className="text-center py-10">Loading...</div>
            ) : requests.length === 0 ? (
                <div className="text-center py-10 text-gray-500 bg-white rounded-lg shadow">
                    No reschedule requests yet.
                </div>
            ) : (
                <div className="space-y-4">
                    {requests.map((req) => (
                        <div key={req._id} className="bg-white rounded-lg shadow p-4">
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="font-semibold text-lg">{req.clientId?.name || 'Unknown Client'}</span>
                                        {getStatusBadge(req.status)}
                                    </div>
                                    <p className="text-gray-600 flex items-center gap-3">
                                        <span className="flex items-center gap-1">
                                            <MailIcon className="w-4 h-4" /> {req.clientId?.email}
                                        </span>
                                        <span className="text-gray-300">|</span>
                                        <span className="flex items-center gap-1">
                                            <PhoneIcon className="w-4 h-4" /> {req.clientId?.phone || 'N/A'}
                                        </span>
                                    </p>
                                    <p className="mt-2">
                                        <span className="font-medium">Change:</span>{' '}
                                        {formatDate(req.originalDate)} → {formatDate(req.requestedDate)}
                                    </p>
                                    {req.reason && (
                                        <p className="text-gray-500 text-sm mt-1">
                                            <span className="font-medium">Reason:</span> {req.reason}
                                        </p>
                                    )}
                                </div>

                                {req.status === 'pending' && (
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleStatusUpdate(req._id, 'approved')}
                                            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                                        >
                                            ✓ Approve
                                        </button>
                                        <button
                                            onClick={() => {
                                                const note = prompt('Reason for denial (optional):');
                                                handleStatusUpdate(req._id, 'denied', note || '');
                                            }}
                                            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                                        >
                                            ✗ Deny
                                        </button>
                                    </div>
                                )}

                                {req.status !== 'pending' && (
                                    <button
                                        onClick={() => handleDelete(req._id)}
                                        className="text-red-600 hover:text-red-800"
                                    >
                                        Delete
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default RescheduleRequestsPage;
