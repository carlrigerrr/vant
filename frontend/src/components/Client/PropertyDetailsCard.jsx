/**
 * PropertyDetailsCard - Client Bible Self-Service Component
 * Allows clients to update their property details
 */
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import Card from '../common/Card';
import Button from '../common/Button';
import Input from '../common/Input';
import {
    HomeIcon,
    PencilIcon,
    CheckIcon,
    CheckCircleIcon,
    KeyIcon,
    LockClosedIcon,
    UserGroupIcon,
    SparklesIcon,
    CameraIcon,
    UploadIcon,
    ExclamationIcon,
    TruckIcon,
    HeartIcon,
    XIcon
} from '@heroicons/react/outline';

const PropertyDetailsCard = ({ propertyDetails, onUpdate }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [photos, setPhotos] = useState([]);
    const [uploading, setUploading] = useState(false);
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
        areasToAvoid: ''
    });

    // Initialize form data from props
    useEffect(() => {
        if (propertyDetails) {
            setFormData({
                entryInstructions: propertyDetails.entryInstructions || '',
                alarmCode: propertyDetails.alarmCode || '',
                gateCode: propertyDetails.gateCode || '',
                keyLocation: propertyDetails.keyLocation || '',
                lockboxCode: propertyDetails.lockboxCode || '',
                wifiPassword: propertyDetails.wifiPassword || '',
                parkingInstructions: propertyDetails.parkingInstructions || '',
                petInfo: propertyDetails.petInfo || '',
                clientPreferences: propertyDetails.clientPreferences || '',
                areasToAvoid: propertyDetails.areasToAvoid || ''
            });
            setPhotos(propertyDetails.photos || []);
        }
    }, [propertyDetails]);

    const handleChange = (e) => {
        setFormData(prev => ({
            ...prev,
            [e.target.name]: e.target.value
        }));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const response = await axios.put('/api/client/property-details', formData);
            if (onUpdate) {
                onUpdate(response.data.propertyDetails);
            }
            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 3000);
            setIsEditing(false);
        } catch (error) {
            console.error('Error saving property details:', error);
            alert('Failed to save. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const handlePhotoUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploading(true);

        const formDataUpload = new FormData();
        formDataUpload.append('photo', file);

        try {
            const response = await new Promise((resolve, reject) => {
                const xhr = new XMLHttpRequest();
                xhr.open('POST', '/api/client/property-photos');
                xhr.withCredentials = true;

                xhr.onload = function () {
                    if (xhr.status >= 200 && xhr.status < 300) {
                        resolve(JSON.parse(xhr.responseText));
                    } else {
                        reject(new Error(xhr.responseText || 'Upload failed'));
                    }
                };

                xhr.onerror = function () {
                    reject(new Error('Network error'));
                };

                xhr.send(formDataUpload);
            });

            setPhotos(response.photos);
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
            await axios.delete(`/api/client/property-photos/${index}`);
            setPhotos(prev => prev.filter((_, i) => i !== index));
        } catch (error) {
            console.error('Error deleting photo:', error);
            alert('Failed to delete photo');
        }
    };

    const hasInfo = Object.values(formData).some(v => v && v.trim() !== '');

    return (
        <Card>
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-[var(--text-heading)] flex items-center gap-2">
                    <HomeIcon className="w-6 h-6 text-blue-600" /> My Property Details
                </h3>
                {!isEditing ? (
                    <Button
                        onClick={() => setIsEditing(true)}
                        variant="soft-primary"
                        size="sm"
                        className="flex items-center gap-1"
                    >
                        <PencilIcon className="w-4 h-4" /> Edit
                    </Button>
                ) : (
                    <div className="flex gap-2">
                        <Button
                            onClick={() => setIsEditing(false)}
                            variant="secondary"
                            size="sm"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSave}
                            disabled={saving}
                            variant="success"
                            size="sm"
                            className="flex items-center gap-1"
                        >
                            {saving ? 'Saving...' : <><CheckIcon className="w-4 h-4" /> Save</>}
                        </Button>
                    </div>
                )}
            </div>

            {showSuccess && (
                <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-[10px] border border-green-100 flex items-center gap-2">
                    <CheckCircleIcon className="w-5 h-5" /> <span>Property details saved successfully!</span>
                </div>
            )}

            <p className="text-sm text-[var(--text-body)] mb-6">
                Help your cleaning team access your home smoothly. This info is shared only with assigned employees.
            </p>

            {isEditing ? (
                /* Edit Mode */
                <div className="space-y-6">
                    {/* Access Section */}
                    <div className="border-b border-gray-100 pb-6">
                        <h4 className="text-sm font-bold text-[var(--text-heading)] mb-4 flex items-center gap-2">
                            <KeyIcon className="w-4 h-4" /> Access Information
                        </h4>
                        <div className="grid md:grid-cols-2 gap-4">
                            <Input
                                label="Entry Instructions"
                                type="textarea"
                                name="entryInstructions"
                                value={formData.entryInstructions}
                                onChange={handleChange}
                                placeholder="e.g., Use side gate, ring doorbell twice"
                                rows={2}
                            />
                            <Input
                                label="Key Location"
                                type="text"
                                name="keyLocation"
                                value={formData.keyLocation}
                                onChange={handleChange}
                                placeholder="e.g., Under blue pot by back door"
                            />
                        </div>
                    </div>

                    {/* Codes Section */}
                    <div className="border-b border-gray-100 pb-6">
                        <h4 className="text-sm font-bold text-[var(--text-heading)] mb-4 flex items-center gap-2">
                            <LockClosedIcon className="w-4 h-4" /> Security Codes
                        </h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <Input
                                label="Alarm Code"
                                type="text"
                                name="alarmCode"
                                value={formData.alarmCode}
                                onChange={handleChange}
                                placeholder="1234"
                            />
                            <Input
                                label="Gate Code"
                                type="text"
                                name="gateCode"
                                value={formData.gateCode}
                                onChange={handleChange}
                                placeholder="#5678"
                            />
                            <Input
                                label="Lockbox Code"
                                type="text"
                                name="lockboxCode"
                                value={formData.lockboxCode}
                                onChange={handleChange}
                                placeholder="0000"
                            />
                            <Input
                                label="WiFi Password"
                                type="text"
                                name="wifiPassword"
                                value={formData.wifiPassword}
                                onChange={handleChange}
                                placeholder="(if needed)"
                            />
                        </div>
                    </div>

                    {/* Additional Info Section */}
                    <div className="border-b border-gray-100 pb-6">
                        <h4 className="text-sm font-bold text-[var(--text-heading)] mb-4 flex items-center gap-2">
                            <UserGroupIcon className="w-4 h-4" /> Household Info
                        </h4>
                        <div className="grid md:grid-cols-2 gap-4">
                            <Input
                                label="Pet Information"
                                type="textarea"
                                name="petInfo"
                                value={formData.petInfo}
                                onChange={handleChange}
                                placeholder="e.g., Friendly dog named Max, cat hides under bed"
                                rows={2}
                            />
                            <Input
                                label="Parking Instructions"
                                type="textarea"
                                name="parkingInstructions"
                                value={formData.parkingInstructions}
                                onChange={handleChange}
                                placeholder="e.g., Park on street, not in driveway"
                                rows={2}
                            />
                        </div>
                    </div>

                    {/* Preferences Section */}
                    <div className="border-b border-gray-100 pb-6">
                        <h4 className="text-sm font-bold text-[var(--text-heading)] mb-4 flex items-center gap-2">
                            <SparklesIcon className="w-4 h-4" /> Cleaning Preferences
                        </h4>
                        <div className="grid md:grid-cols-2 gap-4">
                            <Input
                                label="Special Preferences"
                                type="textarea"
                                name="clientPreferences"
                                value={formData.clientPreferences}
                                onChange={handleChange}
                                placeholder="e.g., Use our vacuum, no bleach on counters"
                                rows={2}
                            />
                            <Input
                                label="Areas to Avoid"
                                type="textarea"
                                name="areasToAvoid"
                                value={formData.areasToAvoid}
                                onChange={handleChange}
                                placeholder="e.g., Don't clean home office, husband works from home"
                                rows={2}
                            />
                        </div>
                    </div>

                    {/* Photos Section */}
                    <div>
                        <h4 className="text-sm font-bold text-[var(--text-heading)] mb-4 flex items-center gap-2">
                            <CameraIcon className="w-4 h-4" /> Property Photos
                        </h4>
                        <div className="flex gap-2 mb-4">
                            <input type="file" ref={fileInputRef} accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                            <Button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={uploading}
                                variant="soft-teal"
                                size="sm"
                                className="flex items-center gap-1"
                            >
                                {uploading ? 'Uploading...' : <><UploadIcon className="w-4 h-4" /> Upload Photo</>}
                            </Button>
                        </div>
                        {photos.length > 0 && (
                            <div className="grid grid-cols-3 gap-3">
                                {photos.map((photo, index) => (
                                    <div key={index} className="relative group rounded-xl overflow-hidden shadow-sm">
                                        <img src={photo.url} alt={`Photo ${index + 1}`} className="w-full h-24 object-cover" />
                                        <button type="button" onClick={() => handleDeletePhoto(index)}
                                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity shadow-md hover:bg-red-600">
                                            <XIcon className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                /* View Mode */
                <div>
                    {hasInfo ? (
                        <div className="space-y-4">
                            {/* Access & Codes */}
                            {(formData.entryInstructions || formData.keyLocation || formData.alarmCode || formData.gateCode) && (
                                <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
                                    <h4 className="text-sm font-bold text-[var(--text-heading)] mb-3 flex items-center gap-2">
                                        <KeyIcon className="w-4 h-4" /> Access/Codes
                                    </h4>
                                    <div className="grid md:grid-cols-2 gap-y-3 gap-x-6 text-sm">
                                        {formData.entryInstructions && (
                                            <div><span className="text-gray-500 block text-xs uppercase tracking-wider mb-1">Entry</span> <span className="text-gray-800">{formData.entryInstructions}</span></div>
                                        )}
                                        {formData.keyLocation && (
                                            <div><span className="text-gray-500 block text-xs uppercase tracking-wider mb-1">Key</span> <span className="text-gray-800">{formData.keyLocation}</span></div>
                                        )}
                                        {formData.alarmCode && (
                                            <div><span className="text-gray-500 block text-xs uppercase tracking-wider mb-1">Alarm</span> <span className="font-mono bg-white px-2 py-1 rounded border border-gray-200 text-blue-600 font-bold">{formData.alarmCode}</span></div>
                                        )}
                                        {formData.gateCode && (
                                            <div><span className="text-gray-500 block text-xs uppercase tracking-wider mb-1">Gate</span> <span className="font-mono bg-white px-2 py-1 rounded border border-gray-200 text-blue-600 font-bold">{formData.gateCode}</span></div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Household */}
                            {(formData.petInfo || formData.parkingInstructions) && (
                                <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
                                    <h4 className="text-sm font-bold text-[var(--text-heading)] mb-3 flex items-center gap-2">
                                        <UserGroupIcon className="w-4 h-4" /> Household
                                    </h4>
                                    <div className="space-y-3 text-sm">
                                        {formData.petInfo && (
                                            <div className="flex items-start gap-1"><span className="text-gray-500 font-medium flex items-center gap-1 min-w-[3.5rem]"><HeartIcon className="w-3 h-3" /> Pets:</span> <span className="text-gray-800 ml-1">{formData.petInfo}</span></div>
                                        )}
                                        {formData.parkingInstructions && (
                                            <div className="flex items-start gap-1"><span className="text-gray-500 font-medium flex items-center gap-1 min-w-[4.5rem]"><TruckIcon className="w-3 h-3" /> Parking:</span> <span className="text-gray-800 ml-1">{formData.parkingInstructions}</span></div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Preferences */}
                            {(formData.clientPreferences || formData.areasToAvoid) && (
                                <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
                                    <h4 className="text-sm font-bold text-[var(--text-heading)] mb-3 flex items-center gap-2">
                                        <SparklesIcon className="w-4 h-4" /> Preferences
                                    </h4>
                                    <div className="space-y-3 text-sm">
                                        {formData.clientPreferences && (
                                            <div><span className="text-gray-500 font-medium">Preferences:</span> <span className="text-gray-800 ml-1">{formData.clientPreferences}</span></div>
                                        )}
                                        {formData.areasToAvoid && (
                                            <div className="flex items-start gap-1"><span className="text-gray-500 font-medium text-red-500 flex items-center gap-1"><ExclamationIcon className="w-3 h-3" /> Avoid:</span> <span className="text-gray-800 ml-1">{formData.areasToAvoid}</span></div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {photos.length > 0 && (
                                <div>
                                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Photos</h4>
                                    <div className="grid grid-cols-4 gap-2">
                                        {photos.map((photo, index) => (
                                            <img key={index} src={photo.url} alt="Property" className="w-full h-16 object-cover rounded-lg border border-gray-100" />
                                        ))}
                                    </div>
                                </div>
                            )}

                            {propertyDetails?.lastUpdated && (
                                <p className="text-xs text-gray-400 text-right mt-2">
                                    Last updated: {new Date(propertyDetails.lastUpdated).toLocaleDateString()}
                                </p>
                            )}
                        </div>
                    ) : (
                        <div className="text-center py-10 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                            <p className="text-gray-500 mb-2 font-medium">No property details yet</p>
                            <p className="text-sm text-gray-400">
                                Click "Edit" to add entry instructions, alarm codes, and more
                            </p>
                        </div>
                    )}
                </div>
            )}
        </Card>
    );
};

export default PropertyDetailsCard;
