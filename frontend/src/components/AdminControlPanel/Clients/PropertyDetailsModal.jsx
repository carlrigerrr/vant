/**
 * PropertyDetailsModal - Admin modal for editing client property details
 */
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const PropertyDetailsModal = ({ isOpen, client, onClose, onSave }) => {
    const [saving, setSaving] = useState(false);
    const [photos, setPhotos] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [caption, setCaption] = useState('');
    const fileInputRef = useRef(null);
    const [formData, setFormData] = useState({
        entryInstructions: '',
        alarmCode: '',
        gateCode: '',
        keyLocation: '',
        lockboxCode: '',
        wifiPassword: '',
        parkingInstructions: '',
        petInfo: '',
        clientPreferences: '',
        areasToAvoid: '',
        internalNotes: ''
    });

    useEffect(() => {
        if (client?.propertyDetails) {
            setFormData({
                entryInstructions: client.propertyDetails.entryInstructions || '',
                alarmCode: client.propertyDetails.alarmCode || '',
                gateCode: client.propertyDetails.gateCode || '',
                keyLocation: client.propertyDetails.keyLocation || '',
                lockboxCode: client.propertyDetails.lockboxCode || '',
                wifiPassword: client.propertyDetails.wifiPassword || '',
                parkingInstructions: client.propertyDetails.parkingInstructions || '',
                petInfo: client.propertyDetails.petInfo || '',
                clientPreferences: client.propertyDetails.clientPreferences || '',
                areasToAvoid: client.propertyDetails.areasToAvoid || '',
                internalNotes: client.propertyDetails.internalNotes || ''
            });
            setPhotos(client.propertyDetails.photos || []);
        }
    }, [client]);

    // Don't render if modal is not open or no client selected (AFTER all hooks)
    if (!isOpen || !client) return null;

    const handleChange = (e) => {
        setFormData(prev => ({
            ...prev,
            [e.target.name]: e.target.value
        }));
    };

    const handlePhotoUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file || !client?._id) return;

        setUploading(true);
        const formDataUpload = new FormData();
        formDataUpload.append('photo', file);
        formDataUpload.append('caption', caption);

        try {
            const response = await axios.post(`/api/clients/${client._id}/property-photos`, formDataUpload);
            setPhotos(response.data.photos);
            setCaption('');
        } catch (error) {
            console.error('Error uploading photo:', error);
            alert('Failed to upload photo');
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleDeletePhoto = async (index) => {
        if (!window.confirm('Delete this photo?')) return;
        try {
            await axios.delete(`/api/clients/${client._id}/property-photos/${index}`);
            setPhotos(prev => prev.filter((_, i) => i !== index));
        } catch (error) {
            console.error('Error deleting photo:', error);
            alert('Failed to delete photo');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const response = await axios.put(`/api/clients/${client._id}/property-details`, formData);
            if (onSave) {
                onSave(response.data.propertyDetails);
            }
            onClose();
        } catch (error) {
            console.error('Error saving property details:', error);
            alert('Failed to save property details');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-bold text-gray-800">📋 Property Details</h2>
                        <p className="text-sm text-gray-500">{client?.name}</p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">
                        ×
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Entry & Access Section */}
                    <fieldset className="border border-gray-200 rounded-lg p-4">
                        <legend className="text-sm font-semibold text-green-700 px-2">🚪 Entry & Access</legend>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Entry Instructions
                                </label>
                                <textarea
                                    name="entryInstructions"
                                    value={formData.entryInstructions}
                                    onChange={handleChange}
                                    placeholder="e.g., Use side gate, ring doorbell twice..."
                                    className="w-full p-3 border rounded-lg text-sm resize-none"
                                    rows={2}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Key Location
                                </label>
                                <input
                                    type="text"
                                    name="keyLocation"
                                    value={formData.keyLocation}
                                    onChange={handleChange}
                                    placeholder="e.g., Under blue pot by back door"
                                    className="w-full p-3 border rounded-lg text-sm"
                                />
                            </div>
                        </div>
                    </fieldset>

                    {/* Security Codes Section */}
                    <fieldset className="border border-gray-200 rounded-lg p-4">
                        <legend className="text-sm font-semibold text-red-700 px-2">🔐 Security Codes</legend>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Alarm Code</label>
                                <input
                                    type="text"
                                    name="alarmCode"
                                    value={formData.alarmCode}
                                    onChange={handleChange}
                                    placeholder="1234"
                                    className="w-full p-3 border rounded-lg text-sm font-mono"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Gate Code</label>
                                <input
                                    type="text"
                                    name="gateCode"
                                    value={formData.gateCode}
                                    onChange={handleChange}
                                    placeholder="#5678"
                                    className="w-full p-3 border rounded-lg text-sm font-mono"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Lockbox</label>
                                <input
                                    type="text"
                                    name="lockboxCode"
                                    value={formData.lockboxCode}
                                    onChange={handleChange}
                                    placeholder="0000"
                                    className="w-full p-3 border rounded-lg text-sm font-mono"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">WiFi</label>
                                <input
                                    type="text"
                                    name="wifiPassword"
                                    value={formData.wifiPassword}
                                    onChange={handleChange}
                                    placeholder="password"
                                    className="w-full p-3 border rounded-lg text-sm font-mono"
                                />
                            </div>
                        </div>
                    </fieldset>

                    {/* Household Info Section */}
                    <fieldset className="border border-gray-200 rounded-lg p-4">
                        <legend className="text-sm font-semibold text-blue-700 px-2">🏠 Household Info</legend>
                        <div className="grid md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Pet Information</label>
                                <textarea
                                    name="petInfo"
                                    value={formData.petInfo}
                                    onChange={handleChange}
                                    placeholder="e.g., Friendly dog named Max, cat hides under bed"
                                    className="w-full p-3 border rounded-lg text-sm resize-none"
                                    rows={2}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Parking Instructions</label>
                                <textarea
                                    name="parkingInstructions"
                                    value={formData.parkingInstructions}
                                    onChange={handleChange}
                                    placeholder="e.g., Park on street, not in driveway"
                                    className="w-full p-3 border rounded-lg text-sm resize-none"
                                    rows={2}
                                />
                            </div>
                        </div>
                    </fieldset>

                    {/* Preferences Section */}
                    <fieldset className="border border-gray-200 rounded-lg p-4">
                        <legend className="text-sm font-semibold text-purple-700 px-2">✨ Cleaning Preferences</legend>
                        <div className="grid md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Special Preferences</label>
                                <textarea
                                    name="clientPreferences"
                                    value={formData.clientPreferences}
                                    onChange={handleChange}
                                    placeholder="e.g., Use their vacuum, no bleach on counters"
                                    className="w-full p-3 border rounded-lg text-sm resize-none"
                                    rows={2}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Areas to Avoid</label>
                                <textarea
                                    name="areasToAvoid"
                                    value={formData.areasToAvoid}
                                    onChange={handleChange}
                                    placeholder="e.g., Don't clean home office, husband works from home"
                                    className="w-full p-3 border rounded-lg text-sm resize-none"
                                    rows={2}
                                />
                            </div>
                        </div>
                    </fieldset>

                    {/* Internal Notes Section (Admin Only) */}
                    <fieldset className="border border-orange-200 bg-orange-50 rounded-lg p-4">
                        <legend className="text-sm font-semibold text-orange-700 px-2">📝 Internal Notes (Admin Only)</legend>
                        <p className="text-xs text-orange-600 mb-2">These notes are NOT visible to employees or clients.</p>
                        <textarea
                            name="internalNotes"
                            value={formData.internalNotes}
                            onChange={handleChange}
                            placeholder="e.g., Client prefers morning slots, always pays late, etc."
                            className="w-full p-3 border border-orange-200 rounded-lg text-sm resize-none bg-white"
                            rows={3}
                        />
                    </fieldset>

                    {/* Property Photos Section */}
                    <fieldset className="border border-gray-200 rounded-lg p-4">
                        <legend className="text-sm font-semibold text-teal-700 px-2">📷 Property Photos</legend>

                        {/* Upload Section */}
                        <div className="flex gap-2 mb-4">
                            <input
                                type="text"
                                value={caption}
                                onChange={(e) => setCaption(e.target.value)}
                                placeholder="Photo caption (optional)"
                                className="flex-1 p-2 border rounded-lg text-sm"
                            />
                            <input
                                type="file"
                                ref={fileInputRef}
                                accept="image/*"
                                onChange={handlePhotoUpload}
                                className="hidden"
                            />
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={uploading}
                                className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 text-sm"
                            >
                                {uploading ? '⏳ Uploading...' : '📤 Upload Photo'}
                            </button>
                        </div>

                        {/* Photo Grid */}
                        {photos.length > 0 ? (
                            <div className="grid grid-cols-3 gap-3">
                                {photos.map((photo, index) => (
                                    <div key={index} className="relative group">
                                        <img
                                            src={photo.url}
                                            alt={photo.caption || `Photo ${index + 1}`}
                                            className="w-full h-24 object-cover rounded-lg border"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => handleDeletePhoto(index)}
                                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            ×
                                        </button>
                                        {photo.caption && (
                                            <p className="text-xs text-gray-500 truncate mt-1">{photo.caption}</p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-gray-400 text-center py-4">No photos uploaded yet</p>
                        )}
                    </fieldset>

                    {/* Footer */}
                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                        >
                            {saving ? 'Saving...' : '💾 Save Property Details'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default PropertyDetailsModal;
