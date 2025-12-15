import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useUserContext } from '../useUserContext';
import Card from '../common/Card';
import Input from '../common/Input';
import Button from '../common/Button';
import {
    UserIcon,
    MailIcon,
    PhoneIcon,
    LockClosedIcon,
    BellIcon,
    CheckCircleIcon,
    ExclamationCircleIcon,
    ArrowLeftIcon,
    ShieldCheckIcon,
    CalendarIcon
} from '@heroicons/react/outline';

const ProfilePage = ({ isAdmin = false }) => {
    const navigate = useNavigate();
    const { user, refresh } = useUserContext();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [changingPassword, setChangingPassword] = useState(false);
    const [message, setMessage] = useState(null);

    // Profile data
    const [profile, setProfile] = useState({
        username: '',
        email: '',
        phone: '',
        memberSince: '',
        jobsCompleted: 0,
        notificationPreferences: {
            dailyBriefing: true,
            scheduleChanges: true
        }
    });

    // Password change form
    const [passwordForm, setPasswordForm] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const response = await axios.get('/api/profile');
            setProfile(response.data);
        } catch (error) {
            console.error('Error fetching profile:', error);
            setMessage({ type: 'error', text: 'Failed to load profile' });
        } finally {
            setLoading(false);
        }
    };

    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        setSaving(true);
        setMessage(null);
        try {
            await axios.put('/api/profile', {
                email: profile.email,
                phone: profile.phone,
                notificationPreferences: profile.notificationPreferences
            });
            setMessage({ type: 'success', text: 'Profile updated successfully!' });
            refresh(); // Refresh user context
        } catch (error) {
            setMessage({ type: 'error', text: error.response?.data?.msg || 'Failed to update profile' });
        } finally {
            setSaving(false);
        }
    };

    const handlePasswordChange = async (e) => {
        e.preventDefault();
        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            setMessage({ type: 'error', text: 'New passwords do not match' });
            return;
        }
        if (passwordForm.newPassword.length < 6) {
            setMessage({ type: 'error', text: 'Password must be at least 6 characters' });
            return;
        }

        setChangingPassword(true);
        setMessage(null);
        try {
            await axios.put('/api/profile/password', {
                currentPassword: passwordForm.currentPassword,
                newPassword: passwordForm.newPassword
            });
            setMessage({ type: 'success', text: 'Password changed successfully!' });
            setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (error) {
            setMessage({ type: 'error', text: error.response?.data?.msg || 'Failed to change password' });
        } finally {
            setChangingPassword(false);
        }
    };

    const handleNotificationToggle = (key) => {
        setProfile(prev => ({
            ...prev,
            notificationPreferences: {
                ...prev.notificationPreferences,
                [key]: !prev.notificationPreferences[key]
            }
        }));
    };

    const getPasswordStrength = (password) => {
        if (!password) return { label: '', color: '', width: '0%' };
        if (password.length < 6) return { label: 'Too short', color: 'bg-red-500', width: '25%' };
        if (password.length < 8) return { label: 'Weak', color: 'bg-orange-500', width: '50%' };
        if (password.length < 12) return { label: 'Good', color: 'bg-yellow-500', width: '75%' };
        return { label: 'Strong', color: 'bg-green-500', width: '100%' };
    };

    const passwordStrength = getPasswordStrength(passwordForm.newPassword);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-6 max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
                <button
                    onClick={() => navigate(isAdmin ? '/admin' : '/')}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                    <ArrowLeftIcon className="w-5 h-5 text-gray-500" />
                </button>
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-[var(--text-heading)] flex items-center gap-3">
                        <UserIcon className="w-8 h-8 text-blue-600" />
                        My Profile
                    </h1>
                    <p className="text-[var(--text-body)] mt-1">Manage your account settings and preferences</p>
                </div>
            </div>

            {/* Message Banner */}
            {message && (
                <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 ${message.type === 'success'
                        ? 'bg-green-50 text-green-700 border border-green-100'
                        : 'bg-red-50 text-red-700 border border-red-100'
                    }`}>
                    {message.type === 'success'
                        ? <CheckCircleIcon className="w-5 h-5" />
                        : <ExclamationCircleIcon className="w-5 h-5" />
                    }
                    {message.text}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Personal Information Card */}
                <Card className="p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-blue-50 rounded-lg">
                            <UserIcon className="w-5 h-5 text-blue-600" />
                        </div>
                        <h2 className="text-lg font-semibold text-[var(--text-heading)]">Personal Information</h2>
                    </div>

                    <form onSubmit={handleProfileUpdate} className="space-y-4">
                        {/* Username (read-only) */}
                        <div>
                            <label className="block text-sm font-medium text-[var(--text-heading)] mb-1.5">
                                Username
                            </label>
                            <div className="flex items-center gap-2 px-4 py-3 bg-gray-100 rounded-[10px] text-gray-500">
                                <UserIcon className="w-4 h-4" />
                                {profile.username}
                                <span className="ml-auto text-xs bg-gray-200 px-2 py-0.5 rounded">Read-only</span>
                            </div>
                        </div>

                        {/* Email */}
                        <Input
                            label="Email Address"
                            type="email"
                            value={profile.email}
                            onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                            placeholder="your@email.com"
                        />

                        {/* Phone */}
                        <Input
                            label="Phone Number"
                            type="tel"
                            value={profile.phone}
                            onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                            placeholder="+1 (555) 000-0000"
                        />

                        {/* Member Since (read-only) */}
                        <div>
                            <label className="block text-sm font-medium text-[var(--text-heading)] mb-1.5">
                                Member Since
                            </label>
                            <div className="flex items-center gap-2 px-4 py-3 bg-gray-100 rounded-[10px] text-gray-500">
                                <CalendarIcon className="w-4 h-4" />
                                {profile.memberSince || 'N/A'}
                            </div>
                        </div>

                        <Button
                            type="submit"
                            variant="primary"
                            size="lg"
                            disabled={saving}
                            className="w-full mt-4"
                        >
                            {saving ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </form>
                </Card>

                {/* Security Card */}
                <Card className="p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-amber-50 rounded-lg">
                            <LockClosedIcon className="w-5 h-5 text-amber-600" />
                        </div>
                        <h2 className="text-lg font-semibold text-[var(--text-heading)]">Security</h2>
                    </div>

                    <form onSubmit={handlePasswordChange} className="space-y-4">
                        <Input
                            label="Current Password"
                            type="password"
                            value={passwordForm.currentPassword}
                            onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                            placeholder="••••••••"
                            required
                        />

                        <div>
                            <Input
                                label="New Password"
                                type="password"
                                value={passwordForm.newPassword}
                                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                                placeholder="••••••••"
                                required
                            />
                            {/* Password Strength Indicator */}
                            {passwordForm.newPassword && (
                                <div className="mt-2">
                                    <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full ${passwordStrength.color} transition-all duration-300`}
                                            style={{ width: passwordStrength.width }}
                                        ></div>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">{passwordStrength.label}</p>
                                </div>
                            )}
                        </div>

                        <Input
                            label="Confirm New Password"
                            type="password"
                            value={passwordForm.confirmPassword}
                            onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                            placeholder="••••••••"
                            required
                        />

                        <Button
                            type="submit"
                            variant="warning"
                            size="lg"
                            disabled={changingPassword}
                            className="w-full mt-4"
                        >
                            {changingPassword ? 'Changing...' : 'Change Password'}
                        </Button>
                    </form>
                </Card>

                {/* Notification Preferences Card */}
                <Card className="p-6 lg:col-span-2">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-purple-50 rounded-lg">
                            <BellIcon className="w-5 h-5 text-purple-600" />
                        </div>
                        <h2 className="text-lg font-semibold text-[var(--text-heading)]">Notification Preferences</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Daily Briefing Toggle */}
                        <div
                            className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${profile.notificationPreferences?.dailyBriefing
                                    ? 'border-blue-500 bg-blue-50'
                                    : 'border-gray-200 hover:border-gray-300'
                                }`}
                            onClick={() => handleNotificationToggle('dailyBriefing')}
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <MailIcon className={`w-5 h-5 ${profile.notificationPreferences?.dailyBriefing ? 'text-blue-600' : 'text-gray-400'
                                        }`} />
                                    <div>
                                        <p className="font-medium text-[var(--text-heading)]">Daily Briefing</p>
                                        <p className="text-sm text-gray-500">Get your schedule summary each morning</p>
                                    </div>
                                </div>
                                <div className={`w-12 h-6 rounded-full p-1 transition-colors ${profile.notificationPreferences?.dailyBriefing ? 'bg-blue-600' : 'bg-gray-300'
                                    }`}>
                                    <div className={`w-4 h-4 rounded-full bg-white transition-transform ${profile.notificationPreferences?.dailyBriefing ? 'translate-x-6' : 'translate-x-0'
                                        }`}></div>
                                </div>
                            </div>
                        </div>

                        {/* Schedule Changes Toggle */}
                        <div
                            className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${profile.notificationPreferences?.scheduleChanges
                                    ? 'border-blue-500 bg-blue-50'
                                    : 'border-gray-200 hover:border-gray-300'
                                }`}
                            onClick={() => handleNotificationToggle('scheduleChanges')}
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <CalendarIcon className={`w-5 h-5 ${profile.notificationPreferences?.scheduleChanges ? 'text-blue-600' : 'text-gray-400'
                                        }`} />
                                    <div>
                                        <p className="font-medium text-[var(--text-heading)]">Schedule Changes</p>
                                        <p className="text-sm text-gray-500">Get notified when your schedule updates</p>
                                    </div>
                                </div>
                                <div className={`w-12 h-6 rounded-full p-1 transition-colors ${profile.notificationPreferences?.scheduleChanges ? 'bg-blue-600' : 'bg-gray-300'
                                    }`}>
                                    <div className={`w-4 h-4 rounded-full bg-white transition-transform ${profile.notificationPreferences?.scheduleChanges ? 'translate-x-6' : 'translate-x-0'
                                        }`}></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-6 flex justify-end">
                        <Button
                            onClick={handleProfileUpdate}
                            variant="primary"
                            disabled={saving}
                        >
                            {saving ? 'Saving...' : 'Save Preferences'}
                        </Button>
                    </div>
                </Card>

                {/* Account Stats Card (Employee Only) */}
                {!isAdmin && (
                    <Card className="p-6 lg:col-span-2">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-green-50 rounded-lg">
                                <ShieldCheckIcon className="w-5 h-5 text-green-600" />
                            </div>
                            <h2 className="text-lg font-semibold text-[var(--text-heading)]">Your Stats</h2>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="text-center p-4 bg-gray-50 rounded-xl">
                                <p className="text-3xl font-bold text-blue-600">{profile.jobsCompleted || 0}</p>
                                <p className="text-sm text-gray-500 mt-1">Jobs Completed</p>
                            </div>
                            <div className="text-center p-4 bg-gray-50 rounded-xl">
                                <p className="text-3xl font-bold text-yellow-500">
                                    {user?.averageRating ? user.averageRating.toFixed(1) : 'N/A'}
                                </p>
                                <p className="text-sm text-gray-500 mt-1">Average Rating</p>
                            </div>
                            <div className="text-center p-4 bg-gray-50 rounded-xl">
                                <p className="text-3xl font-bold text-green-600">{user?.totalRatings || 0}</p>
                                <p className="text-sm text-gray-500 mt-1">Total Reviews</p>
                            </div>
                            <div className="text-center p-4 bg-gray-50 rounded-xl">
                                <p className="text-3xl font-bold text-purple-600">
                                    {profile.admin ? 'Admin' : 'Employee'}
                                </p>
                                <p className="text-sm text-gray-500 mt-1">Role</p>
                            </div>
                        </div>
                    </Card>
                )}
            </div>
        </div>
    );
};

export default ProfilePage;
