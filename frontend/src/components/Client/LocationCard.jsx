import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Card from '../common/Card';
import Button from '../common/Button';
import Input from '../common/Input';
import { LocationMarkerIcon, MapIcon, CheckIcon, CursorClickIcon } from '@heroicons/react/outline';

const LocationCard = ({ client, onLocationUpdate }) => {
    const [location, setLocation] = useState({
        lat: client?.location?.coordinates?.lat || null,
        lng: client?.location?.coordinates?.lng || null
    });
    const [formattedAddress, setFormattedAddress] = useState(
        client?.location?.formattedAddress || client?.address || ''
    );
    const [shareLocation, setShareLocation] = useState(
        client?.shareLocation !== false
    );
    const [loading, setLoading] = useState(false);
    const [gpsLoading, setGpsLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    useEffect(() => {
        if (client?.location) {
            setLocation({
                lat: client.location.coordinates?.lat || null,
                lng: client.location.coordinates?.lng || null
            });
            setFormattedAddress(client.location.formattedAddress || client.address || '');
            setShareLocation(client.shareLocation !== false);
        }
    }, [client]);

    const handleGetGPS = () => {
        if (!navigator.geolocation) {
            setMessage({ type: 'error', text: 'Geolocation is not supported by your browser' });
            return;
        }

        setGpsLoading(true);
        setMessage({ type: '', text: '' });

        navigator.geolocation.getCurrentPosition(
            (position) => {
                setLocation({
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                });
                setGpsLoading(false);
                setMessage({ type: 'success', text: 'GPS location captured!' });
            },
            (error) => {
                setGpsLoading(false);
                let errorMsg = 'Unable to get location';
                if (error.code === 1) errorMsg = 'Location access denied. Please enable location permissions.';
                if (error.code === 2) errorMsg = 'Position unavailable. Try again.';
                if (error.code === 3) errorMsg = 'Location request timed out. Try again.';
                setMessage({ type: 'error', text: errorMsg });
            }
        );
    };

    const handleSave = async () => {
        setLoading(true);
        setMessage({ type: '', text: '' });

        try {
            const response = await axios.put('/api/client/location', {
                lat: location.lat,
                lng: location.lng,
                formattedAddress,
                source: location.lat ? 'gps' : 'manual',
                shareLocation
            });

            setMessage({ type: 'success', text: response.data.msg || 'Location saved!' });
            if (onLocationUpdate) {
                onLocationUpdate(response.data);
            }
        } catch (error) {
            setMessage({ type: 'error', text: error.response?.data?.msg || 'Failed to save location' });
        } finally {
            setLoading(false);
        }
    };

    const hasLocation = location.lat && location.lng;

    return (
        <Card>
            <h3 className="text-lg font-bold text-[var(--text-heading)] mb-4 flex items-center gap-2">
                <LocationMarkerIcon className="w-6 h-6 text-red-500" /> My Location
            </h3>

            {/* Message Alert */}
            {message.text && (
                <div className={`mb-4 p-3 rounded-lg text-sm ${message.type === 'error'
                    ? 'bg-red-50 text-red-700 border border-red-200'
                    : 'bg-green-50 text-green-700 border border-green-200'
                    }`}>
                    {message.text}
                </div>
            )}

            {/* GPS Button */}
            <Button
                onClick={handleGetGPS}
                disabled={gpsLoading}
                variant="soft-primary"
                className="w-full mb-4 justify-center py-3 flex items-center gap-2"
            >
                {gpsLoading ? (
                    <>
                        <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Getting Location...
                    </>
                ) : (
                    <><CursorClickIcon className="w-5 h-5" /> Use My Current Location</>
                )}
            </Button>

            {/* Manual Address Input */}
            <div className="mb-4">
                <Input
                    label="Address / Description"
                    type="textarea"
                    value={formattedAddress}
                    onChange={(e) => setFormattedAddress(e.target.value)}
                    placeholder="Enter your service address..."
                    rows={2}
                    className="resize-none"
                />
            </div>

            {/* Coordinates Display */}
            {hasLocation && (
                <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                    <div className="flex flex-wrap gap-4 text-sm">
                        <div>
                            <span className="text-gray-500">Lat:</span>{' '}
                            <span className="font-mono">{location.lat?.toFixed(6)}</span>
                        </div>
                        <div>
                            <span className="text-gray-500">Lng:</span>{' '}
                            <span className="font-mono">{location.lng?.toFixed(6)}</span>
                        </div>
                    </div>
                    {/* View on Google Maps */}
                    <a
                        href={`https://www.google.com/maps?q=${location.lat},${location.lng}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 mt-2 text-sm text-blue-600 hover:text-blue-800"
                    >
                        <MapIcon className="w-4 h-4" /> View on Google Maps →
                    </a>
                </div>
            )}

            {/* Privacy Toggle */}
            <div className="mb-4 p-3 bg-blue-50/50 rounded-[10px] border border-blue-100">
                <label className="flex items-center gap-3 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={shareLocation}
                        onChange={(e) => setShareLocation(e.target.checked)}
                        className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                        <span className="font-medium text-[var(--text-heading)]">Share my exact location</span>
                        <p className="text-xs text-[var(--text-muted)]">
                            When off, employees will only see your address text
                        </p>
                    </div>
                </label>
            </div>

            {/* Save Button */}
            <Button
                onClick={handleSave}
                disabled={loading}
                variant="success"
                className="w-full justify-center flex items-center gap-2"
            >
                {loading ? 'Saving...' : <><CheckIcon className="w-5 h-5" /> Save Location</>}
            </Button>
        </Card>
    );
};

export default LocationCard;
