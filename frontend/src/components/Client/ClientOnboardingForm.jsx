/**
 * ClientOnboardingForm - Public form for new clients to submit their property details
 * This form is accessible without login and creates/updates client records
 */
import React, { useState } from 'react';
import axios from 'axios';

const ClientOnboardingForm = () => {
    const [step, setStep] = useState(1);
    const [submitted, setSubmitted] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({
        // Contact Info
        name: '',
        email: '',
        phone: '',
        address: '',
        // Property Details
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

    const handleChange = (e) => {
        setFormData(prev => ({
            ...prev,
            [e.target.name]: e.target.value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError('');

        try {
            await axios.post('/api/client/onboarding', formData);
            setSubmitted(true);
        } catch (err) {
            setError(err.response?.data?.msg || 'Something went wrong. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    if (submitted) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-green-50 to-teal-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md text-center">
                    <div className="text-6xl mb-4">✅</div>
                    <h1 className="text-2xl font-bold text-gray-800 mb-2">Thank You!</h1>
                    <p className="text-gray-600 mb-4">
                        Your property details have been submitted successfully. Our team will be in touch soon!
                    </p>
                    <p className="text-sm text-gray-500">
                        You can close this page now.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-8 px-4">
            <div className="max-w-2xl mx-auto">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">🏠 Welcome!</h1>
                    <p className="text-gray-600">
                        Help us provide the best service by sharing your property details
                    </p>
                </div>

                {/* Progress Steps */}
                <div className="flex justify-center mb-8">
                    <div className="flex items-center gap-2">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${step >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'}`}>1</div>
                        <div className={`w-16 h-1 ${step >= 2 ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${step >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'}`}>2</div>
                        <div className={`w-16 h-1 ${step >= 3 ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${step >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'}`}>3</div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-xl p-6 md:p-8">
                    {error && (
                        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg">
                            {error}
                        </div>
                    )}

                    {/* Step 1: Contact Info */}
                    {step === 1 && (
                        <div className="space-y-4 animate-fadeIn">
                            <h2 className="text-xl font-semibold text-gray-800 mb-4">📋 Contact Information</h2>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                                <input type="text" name="name" value={formData.name} onChange={handleChange} required
                                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="John Smith" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                                <input type="email" name="email" value={formData.email} onChange={handleChange} required
                                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="john@example.com" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
                                <input type="tel" name="phone" value={formData.phone} onChange={handleChange} required
                                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="(555) 123-4567" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Service Address *</label>
                                <textarea name="address" value={formData.address} onChange={handleChange} required
                                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                                    rows={2} placeholder="123 Main St, City, State 12345" />
                            </div>
                        </div>
                    )}

                    {/* Step 2: Access & Security */}
                    {step === 2 && (
                        <div className="space-y-4 animate-fadeIn">
                            <h2 className="text-xl font-semibold text-gray-800 mb-4">🔐 Access & Security</h2>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Entry Instructions</label>
                                <textarea name="entryInstructions" value={formData.entryInstructions} onChange={handleChange}
                                    className="w-full p-3 border rounded-lg resize-none" rows={2}
                                    placeholder="e.g., Use side gate, ring doorbell, knock twice..." />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Key Location</label>
                                <input type="text" name="keyLocation" value={formData.keyLocation} onChange={handleChange}
                                    className="w-full p-3 border rounded-lg"
                                    placeholder="e.g., Under blue pot by back door" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Alarm Code</label>
                                    <input type="text" name="alarmCode" value={formData.alarmCode} onChange={handleChange}
                                        className="w-full p-3 border rounded-lg font-mono" placeholder="1234" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Gate Code</label>
                                    <input type="text" name="gateCode" value={formData.gateCode} onChange={handleChange}
                                        className="w-full p-3 border rounded-lg font-mono" placeholder="#5678" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Lockbox Code</label>
                                    <input type="text" name="lockboxCode" value={formData.lockboxCode} onChange={handleChange}
                                        className="w-full p-3 border rounded-lg font-mono" placeholder="0000" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">WiFi Password</label>
                                    <input type="text" name="wifiPassword" value={formData.wifiPassword} onChange={handleChange}
                                        className="w-full p-3 border rounded-lg font-mono" placeholder="(if needed)" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Parking Instructions</label>
                                <input type="text" name="parkingInstructions" value={formData.parkingInstructions} onChange={handleChange}
                                    className="w-full p-3 border rounded-lg"
                                    placeholder="e.g., Park on street, driveway OK, visitor parking..." />
                            </div>
                        </div>
                    )}

                    {/* Step 3: Household & Preferences */}
                    {step === 3 && (
                        <div className="space-y-4 animate-fadeIn">
                            <h2 className="text-xl font-semibold text-gray-800 mb-4">🐕 Household & Preferences</h2>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Pet Information</label>
                                <textarea name="petInfo" value={formData.petInfo} onChange={handleChange}
                                    className="w-full p-3 border rounded-lg resize-none" rows={2}
                                    placeholder="e.g., Friendly dog named Max, cat hides under bed..." />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Cleaning Preferences</label>
                                <textarea name="clientPreferences" value={formData.clientPreferences} onChange={handleChange}
                                    className="w-full p-3 border rounded-lg resize-none" rows={2}
                                    placeholder="e.g., Use our vacuum, no bleach on counters..." />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Areas to Avoid / Special Notes</label>
                                <textarea name="areasToAvoid" value={formData.areasToAvoid} onChange={handleChange}
                                    className="w-full p-3 border rounded-lg resize-none" rows={2}
                                    placeholder="e.g., Don't clean home office, husband works from home..." />
                            </div>
                        </div>
                    )}

                    {/* Navigation */}
                    <div className="flex justify-between mt-8 pt-4 border-t">
                        {step > 1 ? (
                            <button type="button" onClick={() => setStep(s => s - 1)}
                                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
                                ← Back
                            </button>
                        ) : <div />}

                        {step < 3 ? (
                            <button type="button" onClick={() => setStep(s => s + 1)}
                                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                                Next →
                            </button>
                        ) : (
                            <button type="submit" disabled={submitting}
                                className="px-8 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50">
                                {submitting ? 'Submitting...' : '✓ Submit'}
                            </button>
                        )}
                    </div>
                </form>

                <p className="text-center text-sm text-gray-500 mt-4">
                    Your information is secure and only shared with your assigned cleaning team.
                </p>
            </div>
        </div>
    );
};

export default ClientOnboardingForm;
