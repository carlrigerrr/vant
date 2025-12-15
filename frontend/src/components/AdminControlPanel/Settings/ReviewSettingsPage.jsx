import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    CogIcon,
    MailIcon,
    CheckCircleIcon,
    ExclamationCircleIcon,
    RefreshIcon,
    StarIcon,
    KeyIcon,
    EyeIcon,
    EyeOffIcon,
    CalendarIcon
} from '@heroicons/react/outline';

const ReviewSettingsPage = () => {
    const [settings, setSettings] = useState({
        companyName: '',
        smtp: {
            host: 'smtp.gmail.com',
            port: 465,
            secure: true,
            user: '',
            pass: '',
            senderName: ''
        },
        reviewRequests: {
            enabled: false,
            delayHours: 2,
            googleReviewUrl: '',
            emailSubject: 'How was your cleaning today?',
            emailTemplate: ''
        },
        jobCompletionEmails: {
            sendToClient: true,
            sendToAdmin: false,
            adminEmail: '',
            includePhotos: true
        },
        mileageReimbursement: {
            enabled: true,
            ratePerMile: 0.65,
            trackAutomatically: true
        }
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [smtpStatus, setSmtpStatus] = useState(null);
    const [stats, setStats] = useState(null);
    const [showPassword, setShowPassword] = useState(false);
    const [newChecklistItem, setNewChecklistItem] = useState('');

    useEffect(() => {
        fetchSettings();
        fetchStats();
    }, []);

    const fetchSettings = async () => {
        try {
            const res = await axios.get('/api/settings');
            setSettings(res.data);
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to load settings' });
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const res = await axios.get('/api/settings/review-stats');
            setStats(res.data);
        } catch (error) {
            console.error('Failed to load stats');
        }
    };

    const handleSave = async () => {
        setSaving(true);
        setMessage({ type: '', text: '' });
        try {
            await axios.put('/api/settings', settings);
            setMessage({ type: 'success', text: 'Settings saved successfully!' });
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to save settings' });
        } finally {
            setSaving(false);
        }
    };

    const testSmtp = async () => {
        setSmtpStatus('testing');
        try {
            const res = await axios.post('/api/settings/test-smtp');
            setSmtpStatus(res.data.success ? 'success' : 'error');
            setMessage({
                type: res.data.success ? 'success' : 'error',
                text: res.data.message
            });
        } catch (error) {
            setSmtpStatus('error');
            setMessage({ type: 'error', text: 'SMTP test failed' });
        }
    };

    const processNow = async () => {
        try {
            const res = await axios.post('/api/settings/process-reviews');
            setMessage({ type: 'success', text: `Processed: ${res.data.processed || 0} sent, ${res.data.failed || 0} failed` });
            fetchStats();
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to process reviews' });
        }
    };

    const sendDailyBriefings = async () => {
        try {
            setMessage({ type: '', text: '' });
            const res = await axios.post('/api/settings/send-daily-briefings');
            setMessage({
                type: 'success',
                text: `Daily briefings sent to ${res.data.sent || 0} employees!`
            });
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to send daily briefings' });
        }
    };

    const updateReviewSetting = (key, value) => {
        setSettings(prev => ({
            ...prev,
            reviewRequests: {
                ...prev.reviewRequests,
                [key]: value
            }
        }));
    };

    const updateSmtpSetting = (key, value) => {
        setSettings(prev => ({
            ...prev,
            smtp: {
                ...prev.smtp,
                [key]: value
            }
        }));
    };

    const updateScheduleNotificationSetting = (key, value) => {
        setSettings(prev => ({
            ...prev,
            scheduleNotifications: {
                ...prev.scheduleNotifications,
                [key]: value
            }
        }));
    };

    const updateJobCompletionEmailSetting = (key, value) => {
        setSettings(prev => ({
            ...prev,
            jobCompletionEmails: {
                ...prev.jobCompletionEmails,
                [key]: value
            }
        }));
    };

    const updateMileageReimbursementSetting = (key, value) => {
        setSettings(prev => ({
            ...prev,
            mileageReimbursement: {
                ...prev.mileageReimbursement,
                [key]: value
            }
        }));
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <RefreshIcon className="w-8 h-8 animate-spin text-blue-500" />
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto p-6">
            <div className="flex items-center gap-3 mb-6">
                <CogIcon className="w-8 h-8 text-blue-600" />
                <h1 className="text-2xl font-bold text-gray-900">Review Request Settings</h1>
            </div>

            {message.text && (
                <div className={`mb-6 p-4 rounded-lg flex items-center gap-2 ${message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
                    }`}>
                    {message.type === 'success' ? (
                        <CheckCircleIcon className="w-5 h-5" />
                    ) : (
                        <ExclamationCircleIcon className="w-5 h-5" />
                    )}
                    {message.text}
                </div>
            )}

            {/* Stats Card */}
            {stats && (
                <div className="bg-gradient-to-r from-purple-500 to-indigo-600 rounded-xl p-6 mb-6 text-white">
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-white">
                        <StarIcon className="w-5 h-5 text-white" /> Review Request Stats
                    </h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center">
                            <div className="text-3xl font-bold">{stats.stats?.sent || 0}</div>
                            <div className="text-sm opacity-80">Sent</div>
                        </div>
                        <div className="text-center">
                            <div className="text-3xl font-bold">{stats.stats?.pending || 0}</div>
                            <div className="text-sm opacity-80">Pending</div>
                        </div>
                        <div className="text-center">
                            <div className="text-3xl font-bold">{stats.stats?.failed || 0}</div>
                            <div className="text-sm opacity-80">Failed</div>
                        </div>
                        <div className="text-center">
                            <div className="text-3xl font-bold">{stats.stats?.skipped || 0}</div>
                            <div className="text-sm opacity-80">Skipped</div>
                        </div>
                    </div>
                </div>
            )}

            {/* Schedule Notifications Settings */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
                <div className="p-6 bg-gradient-to-r from-green-500 to-teal-600">
                    <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                        <CalendarIcon className="w-5 h-5" />
                        Schedule Notifications
                    </h2>
                    <p className="text-green-100 text-sm mt-1">Send daily schedule briefings and change alerts to employees</p>
                </div>

                {/* Enable Daily Briefings */}
                <div className="p-6 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="font-semibold text-gray-900">Daily Schedule Briefings</h3>
                            <p className="text-sm text-gray-500">Send employees their schedule every morning</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={settings.scheduleNotifications?.enabled !== false}
                                onChange={(e) => updateScheduleNotificationSetting('enabled', e.target.checked)}
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                        </label>
                    </div>
                </div>

                {/* Daily Briefing Time */}
                <div className="p-6 border-b border-gray-200">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Daily Briefing Time
                    </label>
                    <input
                        type="time"
                        value={settings.scheduleNotifications?.dailyBriefingTime || '06:00'}
                        onChange={(e) => updateScheduleNotificationSetting('dailyBriefingTime', e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                    <p className="text-sm text-gray-500 mt-1">Employees receive their schedule at this time each day</p>
                </div>

                {/* Notify on Schedule Changes */}
                <div className="p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="font-semibold text-gray-900">Notify on Schedule Changes</h3>
                            <p className="text-sm text-gray-500">Alert employees when their schedule is modified</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={settings.scheduleNotifications?.notifyOnChanges !== false}
                                onChange={(e) => updateScheduleNotificationSetting('notifyOnChanges', e.target.checked)}
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                        </label>
                    </div>
                </div>
            </div>

            {/* Job Completion Email Settings */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
                <div className="p-6 bg-gradient-to-r from-emerald-500 to-teal-600">
                    <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                        📧 Job Completion Emails
                    </h2>
                    <p className="text-emerald-100 text-sm mt-1">Send before/after photos when jobs are completed</p>
                </div>

                {/* Send to Client */}
                <div className="p-6 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="font-semibold text-gray-900">Send to Client</h3>
                            <p className="text-sm text-gray-500">Email job photos to the client when marked complete</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={settings.jobCompletionEmails?.sendToClient !== false}
                                onChange={(e) => updateJobCompletionEmailSetting('sendToClient', e.target.checked)}
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                        </label>
                    </div>
                </div>

                {/* Send to Admin */}
                <div className="p-6 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="font-semibold text-gray-900">Send to Admin</h3>
                            <p className="text-sm text-gray-500">Also send a copy to admin for quality review</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={settings.jobCompletionEmails?.sendToAdmin === true}
                                onChange={(e) => updateJobCompletionEmailSetting('sendToAdmin', e.target.checked)}
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                        </label>
                    </div>
                </div>

                {/* Admin Email Override */}
                {settings.jobCompletionEmails?.sendToAdmin && (
                    <div className="p-6 bg-gray-50">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Admin Email (optional - defaults to SMTP sender)
                        </label>
                        <input
                            type="email"
                            value={settings.jobCompletionEmails?.adminEmail || ''}
                            onChange={(e) => updateJobCompletionEmailSetting('adminEmail', e.target.value)}
                            placeholder="admin@example.com"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        />
                    </div>
                )}
            </div>

            {/* Mileage Reimbursement Settings */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
                <div className="p-6 bg-gradient-to-r from-cyan-500 to-blue-600">
                    <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                        🚗 Mileage Reimbursement
                    </h2>
                    <p className="text-cyan-100 text-sm mt-1">Track employee mileage for reimbursement</p>
                </div>

                {/* Enable Tracking */}
                <div className="p-6 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="font-semibold text-gray-900">Enable Mileage Tracking</h3>
                            <p className="text-sm text-gray-500">Auto-calculate distance when employees check out</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={settings.mileageReimbursement?.enabled !== false}
                                onChange={(e) => updateMileageReimbursementSetting('enabled', e.target.checked)}
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-cyan-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-600"></div>
                        </label>
                    </div>
                </div>

                {/* Rate per Mile */}
                <div className="p-6 border-b border-gray-200">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Rate per Mile ($)
                    </label>
                    <div className="flex items-center gap-3">
                        <span className="text-gray-500">$</span>
                        <input
                            type="number"
                            min="0"
                            max="5"
                            step="0.01"
                            value={settings.mileageReimbursement?.ratePerMile || 0.65}
                            onChange={(e) => updateMileageReimbursementSetting('ratePerMile', parseFloat(e.target.value) || 0.65)}
                            className="w-32 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500"
                        />
                        <span className="text-gray-500">per mile</span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">IRS standard rate is $0.67/mile (2024)</p>
                </div>

                {/* Auto Track */}
                <div className="p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="font-semibold text-gray-900">Auto-Track on Check-out</h3>
                            <p className="text-sm text-gray-500">Automatically calculate distance when employees check out</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={settings.mileageReimbursement?.trackAutomatically !== false}
                                onChange={(e) => updateMileageReimbursementSetting('trackAutomatically', e.target.checked)}
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-cyan-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-600"></div>
                        </label>
                    </div>
                </div>
            </div>

            {/* Payment & Invoice Settings */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
                <div className="p-6 bg-gradient-to-r from-violet-500 to-purple-600">
                    <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                        💳 Payment & Invoice Settings
                    </h2>
                    <p className="text-violet-100 text-sm mt-1">Configure payment processing and invoice settings</p>
                </div>

                {/* Test Mode Toggle */}
                <div className="p-6 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="font-semibold text-gray-900">Test Mode</h3>
                            <p className="text-sm text-gray-500">When ON, payments are simulated (no real charges)</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={settings.payment?.testMode !== false}
                                onChange={(e) => setSettings(prev => ({
                                    ...prev,
                                    payment: { ...prev.payment, testMode: e.target.checked }
                                }))}
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-violet-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-violet-600"></div>
                        </label>
                    </div>
                    {settings.payment?.testMode && (
                        <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
                            ⚠️ Test Mode is ON - All payments will be simulated
                        </div>
                    )}
                </div>

                {/* Tax Rate */}
                <div className="p-6 border-b border-gray-200">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tax Rate (%)
                    </label>
                    <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        value={settings.payment?.taxRate || 0}
                        onChange={(e) => setSettings(prev => ({
                            ...prev,
                            payment: { ...prev.payment, taxRate: parseFloat(e.target.value) || 0 }
                        }))}
                        className="w-32 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500"
                        placeholder="0"
                    />
                    <p className="text-sm text-gray-500 mt-1">Applied to all invoices</p>
                </div>

                {/* Company Details for Invoice */}
                <div className="p-6 border-b border-gray-200">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Company Address (for invoices)
                    </label>
                    <input
                        type="text"
                        value={settings.payment?.companyAddress || ''}
                        onChange={(e) => setSettings(prev => ({
                            ...prev,
                            payment: { ...prev.payment, companyAddress: e.target.value }
                        }))}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500"
                        placeholder="123 Main St, City, State 12345"
                    />
                </div>

                {/* Stripe Settings (for future) */}
                <div className="p-6 bg-gray-50">
                    <h4 className="font-medium text-gray-700 mb-3">Stripe API Keys (for live payments)</h4>
                    <p className="text-sm text-gray-500 mb-4">Leave empty while using Test Mode. Add your Stripe keys when ready for real payments.</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Public Key</label>
                            <input
                                type="text"
                                value={settings.payment?.stripePublicKey || ''}
                                onChange={(e) => setSettings(prev => ({
                                    ...prev,
                                    payment: { ...prev.payment, stripePublicKey: e.target.value }
                                }))}
                                className="w-full px-3 py-2 border rounded-lg text-sm"
                                placeholder="pk_live_..."
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Secret Key</label>
                            <input
                                type="password"
                                value={settings.payment?.stripeSecretKey || ''}
                                onChange={(e) => setSettings(prev => ({
                                    ...prev,
                                    payment: { ...prev.payment, stripeSecretKey: e.target.value }
                                }))}
                                className="w-full px-3 py-2 border rounded-lg text-sm"
                                placeholder="sk_live_..."
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Default Checklist Templates */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
                <div className="p-6 bg-gradient-to-r from-teal-500 to-cyan-600">
                    <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                        ✓ Default Job Checklist
                    </h2>
                    <p className="text-teal-100 text-sm mt-1">Define standard tasks that appear on every job</p>
                </div>

                <div className="p-6">
                    {/* Existing checklist items */}
                    <div className="space-y-2 mb-4">
                        {(settings.defaultChecklist || []).map((item, index) => {
                            // Handle both string and object formats
                            const label = typeof item === 'string' ? item : (item?.label || item?.text || JSON.stringify(item));
                            const isRequired = typeof item === 'object' ? item?.required !== false : true;

                            return (
                                <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border">
                                    <span className="flex-1 font-medium" style={{ color: '#1f2937' }}>{label}</span>
                                    <span className={`text-xs px-2 py-1 rounded ${isRequired ? 'bg-red-100 text-red-700' : 'bg-gray-200 text-gray-600'}`}>
                                        {isRequired ? 'Required' : 'Optional'}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSettings(prev => ({
                                                ...prev,
                                                defaultChecklist: prev.defaultChecklist.filter((_, i) => i !== index)
                                            }));
                                        }}
                                        className="text-red-500 hover:bg-red-50 p-1 rounded"
                                    >
                                        ✕
                                    </button>
                                </div>
                            );
                        })}
                        {(!settings.defaultChecklist || settings.defaultChecklist.length === 0) && (
                            <p className="text-gray-500 text-center py-4">No checklist items yet. Add some below!</p>
                        )}
                    </div>

                    {/* Add new item */}
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={newChecklistItem}
                            onChange={(e) => setNewChecklistItem(e.target.value)}
                            placeholder="e.g., Empty all trash cans"
                            className="flex-1 px-3 py-2 border rounded-lg"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && newChecklistItem.trim()) {
                                    setSettings(prev => ({
                                        ...prev,
                                        defaultChecklist: [...(prev.defaultChecklist || []), { label: newChecklistItem.trim(), required: true }]
                                    }));
                                    setNewChecklistItem('');
                                }
                            }}
                        />
                        <button
                            type="button"
                            onClick={() => {
                                if (newChecklistItem.trim()) {
                                    setSettings(prev => ({
                                        ...prev,
                                        defaultChecklist: [...(prev.defaultChecklist || []), { label: newChecklistItem.trim(), required: true }]
                                    }));
                                    setNewChecklistItem('');
                                }
                            }}
                            className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
                        >
                            Add
                        </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">Press Enter or click Add. Items will be applied to new shifts.</p>
                </div>
            </div>

            {/* Review Request Settings Form */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                {/* Enable Toggle */}
                <div className="p-6 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="font-semibold text-gray-900">Auto Review Requests</h3>
                            <p className="text-sm text-gray-500">Automatically ask clients for reviews after service</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={settings.reviewRequests?.enabled || false}
                                onChange={(e) => updateReviewSetting('enabled', e.target.checked)}
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                    </div>
                </div>

                {/* Company Name */}
                <div className="p-6 border-b border-gray-200">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Company Name
                    </label>
                    <input
                        type="text"
                        value={settings.companyName || ''}
                        onChange={(e) => setSettings(prev => ({ ...prev, companyName: e.target.value }))}
                        placeholder="Your Cleaning Company"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <p className="text-sm text-gray-500 mt-1">Used in email signatures</p>
                </div>

                {/* SMTP Configuration Section */}
                <div className="p-6 border-b border-gray-200 bg-gray-50">
                    <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <MailIcon className="w-5 h-5 text-gray-600" />
                        Email Configuration (SMTP)
                    </h3>

                    {/* Email Sender Name */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Sender Name (shown in emails)
                        </label>
                        <input
                            type="text"
                            value={settings.smtp?.senderName || ''}
                            onChange={(e) => updateSmtpSetting('senderName', e.target.value)}
                            placeholder="Your Company Name"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                        <p className="text-sm text-gray-500 mt-1">This appears as the "From" name in emails (e.g., "Your Company" instead of "Shift Scheduler")</p>
                    </div>

                    {/* Gmail Email */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Gmail Email Address
                        </label>
                        <input
                            type="email"
                            value={settings.smtp?.user || ''}
                            onChange={(e) => updateSmtpSetting('user', e.target.value)}
                            placeholder="your-business@gmail.com"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>

                    {/* App Password */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                            <KeyIcon className="w-4 h-4" />
                            Gmail App Password
                        </label>
                        <div className="relative">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={settings.smtp?.pass || ''}
                                onChange={(e) => updateSmtpSetting('pass', e.target.value)}
                                placeholder="16-character app password"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-10"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                            >
                                {showPassword ? <EyeOffIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                            </button>
                        </div>
                        <p className="text-sm text-gray-500 mt-1">
                            <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                Generate App Password
                            </a> (requires 2FA enabled)
                        </p>
                    </div>
                </div>

                {/* Delay Hours */}
                <div className="p-6 border-b border-gray-200">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Send After (Hours)
                    </label>
                    <input
                        type="number"
                        min="0"
                        max="168"
                        step="0.01"
                        value={settings.reviewRequests?.delayHours ?? 2}
                        onChange={(e) => updateReviewSetting('delayHours', parseFloat(e.target.value) || 0)}
                        className="w-32 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <p className="text-sm text-gray-500 mt-1">Hours after job completion (0-168, use 0.01 for testing)</p>
                </div>

                {/* Google Review URL */}
                <div className="p-6 border-b border-gray-200">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Google Review Link
                    </label>
                    <input
                        type="url"
                        value={settings.reviewRequests?.googleReviewUrl || ''}
                        onChange={(e) => updateReviewSetting('googleReviewUrl', e.target.value)}
                        placeholder="https://g.page/r/your-business/review"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <p className="text-sm text-gray-500 mt-1">
                        Get your link from Google Business Profile → Share → Ask for Reviews
                    </p>
                </div>

                {/* Email Subject */}
                <div className="p-6 border-b border-gray-200">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email Subject
                    </label>
                    <input
                        type="text"
                        value={settings.reviewRequests?.emailSubject || ''}
                        onChange={(e) => updateReviewSetting('emailSubject', e.target.value)}
                        placeholder="How was your cleaning today?"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>

                {/* Email Template */}
                <div className="p-6 border-b border-gray-200">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email Template
                    </label>
                    <textarea
                        value={settings.reviewRequests?.emailTemplate || ''}
                        onChange={(e) => updateReviewSetting('emailTemplate', e.target.value)}
                        rows={8}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                        placeholder="Hi {{clientName}},..."
                    />
                    <p className="text-sm text-gray-500 mt-1">
                        Variables: {'{{clientName}}'}, {'{{reviewLink}}'}, {'{{companyName}}'}
                    </p>
                </div>

                {/* Actions */}
                <div className="p-6 bg-gray-50 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                    <div className="flex flex-col sm:flex-row gap-3">
                        <button
                            onClick={testSmtp}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center justify-center gap-2"
                        >
                            <MailIcon className="w-4 h-4" />
                            Test SMTP
                            {smtpStatus === 'testing' && <RefreshIcon className="w-4 h-4 animate-spin" />}
                            {smtpStatus === 'success' && <CheckCircleIcon className="w-4 h-4 text-green-500" />}
                            {smtpStatus === 'error' && <ExclamationCircleIcon className="w-4 h-4 text-red-500" />}
                        </button>
                        <button
                            onClick={processNow}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center justify-center gap-2"
                        >
                            <RefreshIcon className="w-4 h-4" />
                            Process Reviews
                        </button>
                        <button
                            onClick={sendDailyBriefings}
                            className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 flex items-center justify-center gap-2"
                        >
                            <CalendarIcon className="w-4 h-4" />
                            Send Daily Briefings
                        </button>
                    </div>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {saving ? <RefreshIcon className="w-4 h-4 animate-spin" /> : <CheckCircleIcon className="w-4 h-4" />}
                        Save Settings
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ReviewSettingsPage;
