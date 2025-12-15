import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useUserContext } from '../../useUserContext';
import { SpeakerphoneIcon, StarIcon, PlusIcon } from '@heroicons/react/outline';

const AnnouncementsPage = () => {
    const { user } = useUserContext();
    const [announcements, setAnnouncements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingAnnouncement, setEditingAnnouncement] = useState(null);
    const [formData, setFormData] = useState({
        title: '',
        content: '',
        priority: 'normal',
        pinned: false,
        expiresAt: ''
    });

    useEffect(() => {
        if (user?.admin) {
            fetchAnnouncements();
        }
    }, [user]);

    const fetchAnnouncements = async () => {
        try {
            const response = await axios.get('/api/announcements/all');
            setAnnouncements(Array.isArray(response.data) ? response.data : []);
        } catch (error) {
            console.error('Error fetching announcements:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingAnnouncement) {
                await axios.put(`/api/announcements/${editingAnnouncement._id}`, formData);
            } else {
                await axios.post('/api/announcements', formData);
            }
            setShowModal(false);
            setEditingAnnouncement(null);
            setFormData({ title: '', content: '', priority: 'normal', pinned: false, expiresAt: '' });
            fetchAnnouncements();
        } catch (error) {
            alert('Error saving announcement');
        }
    };

    const handleEdit = (announcement) => {
        setEditingAnnouncement(announcement);
        setFormData({
            title: announcement.title,
            content: announcement.content,
            priority: announcement.priority || 'normal',
            pinned: announcement.pinned || false,
            expiresAt: announcement.expiresAt ? new Date(announcement.expiresAt).toISOString().split('T')[0] : ''
        });
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this announcement?')) return;
        try {
            await axios.delete(`/api/announcements/${id}`);
            fetchAnnouncements();
        } catch (error) {
            alert('Error deleting announcement');
        }
    };

    const getPriorityBadge = (priority) => {
        const styles = {
            urgent: 'bg-red-100 text-red-700',
            important: 'bg-orange-100 text-orange-700',
            normal: 'bg-gray-100 text-gray-700'
        };
        return styles[priority] || styles.normal;
    };

    if (!user) {
        return <div className="text-center py-10">Loading...</div>;
    }

    if (!user.admin) {
        return <div className="text-center py-10 text-red-500">Admin access required</div>;
    }

    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold flex items-center gap-3">
                    <SpeakerphoneIcon className="w-8 h-8 text-blue-600" /> Announcements
                </h1>
                <button
                    onClick={() => {
                        setEditingAnnouncement(null);
                        setFormData({ title: '', content: '', priority: 'normal', pinned: false, expiresAt: '' });
                        setShowModal(true);
                    }}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
                >
                    <PlusIcon className="w-5 h-5" /> New Announcement
                </button>
            </div>

            {loading ? (
                <div className="text-center py-10">Loading...</div>
            ) : announcements.length === 0 ? (
                <div className="text-center py-10 text-gray-500 bg-white rounded-lg shadow">
                    No announcements yet. Create one to broadcast to all employees.
                </div>
            ) : (
                <div className="space-y-4">
                    {announcements.map((ann) => (
                        <div key={ann._id} className={`bg-white rounded-lg shadow p-4 ${ann.pinned ? 'border-l-4 border-blue-500' : ''}`}>
                            <div className="flex justify-between items-start">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        {ann.pinned && <StarIcon className="w-5 h-5 text-yellow-500" />}
                                        <h3 className="font-semibold text-lg">{ann.title}</h3>
                                        <span className={`px-2 py-0.5 rounded text-xs ${getPriorityBadge(ann.priority)}`}>
                                            {ann.priority}
                                        </span>
                                    </div>
                                    <p className="text-gray-600 whitespace-pre-wrap">{ann.content}</p>
                                    <div className="text-xs text-gray-400 mt-2">
                                        By {ann.authorId?.username || 'Admin'} • {new Date(ann.createdAt).toLocaleDateString()}
                                        {ann.expiresAt && (
                                            <span className={new Date(ann.expiresAt) < new Date() ? ' text-red-500' : ''}>
                                                {' '}• Expires: {new Date(ann.expiresAt).toLocaleDateString()}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className="flex gap-2 ml-4">
                                    <button
                                        onClick={() => handleEdit(ann)}
                                        className="text-blue-600 hover:text-blue-800 text-sm"
                                    >
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => handleDelete(ann._id)}
                                        className="text-red-600 hover:text-red-800 text-sm"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg p-6 w-full max-w-lg">
                        <h2 className="text-xl font-bold mb-4">
                            {editingAnnouncement ? 'Edit Announcement' : 'New Announcement'}
                        </h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <input
                                type="text"
                                placeholder="Title"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                required
                                className="w-full p-3 border rounded-lg"
                            />
                            <textarea
                                placeholder="Announcement content..."
                                value={formData.content}
                                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                                required
                                rows={4}
                                className="w-full p-3 border rounded-lg resize-none"
                            />
                            <div className="flex gap-4">
                                <select
                                    value={formData.priority}
                                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                                    className="flex-1 p-3 border rounded-lg"
                                >
                                    <option value="normal">Normal</option>
                                    <option value="important">Important</option>
                                    <option value="urgent">Urgent</option>
                                </select>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={formData.pinned}
                                        onChange={(e) => setFormData({ ...formData, pinned: e.target.checked })}
                                        className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    <StarIcon className={`w-5 h-5 ${formData.pinned ? 'text-yellow-500' : 'text-gray-400'}`} />
                                    <span>Pin to top</span>
                                </label>
                            </div>
                            <div>
                                <label className="text-sm text-gray-600">Expires (optional)</label>
                                <input
                                    type="date"
                                    value={formData.expiresAt}
                                    onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                                    className="w-full p-3 border rounded-lg"
                                />
                            </div>
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                >
                                    {editingAnnouncement ? 'Update' : 'Publish'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AnnouncementsPage;
