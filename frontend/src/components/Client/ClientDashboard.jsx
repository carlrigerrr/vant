import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import RateEmployeeModal from './RateEmployeeModal';
import LocationCard from './LocationCard';
import PropertyDetailsCard from './PropertyDetailsCard';
import Card from '../common/Card';
import Button from '../common/Button';
import Badge from '../common/Badge';
import Input from '../common/Input';
import { useSocket } from '../../contexts/SocketContext';
import {
    HomeIcon,
    ChartBarIcon,
    CalendarIcon,
    ClockIcon,
    UserIcon,
    LocationMarkerIcon,
    PhoneIcon,
    MailIcon,
    PencilAltIcon,
    ClipboardListIcon,
    CheckCircleIcon,
    XCircleIcon,
    RefreshIcon,
    ChatAltIcon,
    QuestionMarkCircleIcon,
    StarIcon,
    HandIcon,
    TruckIcon
} from '@heroicons/react/outline';
import logo from './../../logos/logo__small.svg';

const ClientDashboard = () => {
    const [client, setClient] = useState(null);
    const [loading, setLoading] = useState(true);
    const [requests, setRequests] = useState([]);
    const [shifts, setShifts] = useState([]);
    const [liveShifts, setLiveShifts] = useState([]);
    const [serviceHistory, setServiceHistory] = useState([]);
    const [activeTab, setActiveTab] = useState('upcoming'); // 'upcoming' | 'live' | 'history'
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        originalDate: '',
        requestedDate: '',
        reason: ''
    });
    const navigate = useNavigate();

    // Socket context for real-time updates
    const { notifications } = useSocket() || {};

    // En-route tracking - look for en-route notifications
    const enRouteNotification = notifications?.find(n => n.type === 'employee_en_route' && !n.dismissed);

    useEffect(() => {
        checkAuth();
    }, []);

    // Poll for updates - live shifts more frequently (30s), others every 60s
    useEffect(() => {
        if (!client) return;

        // Live status updates every 30 seconds
        const liveInterval = setInterval(() => {
            fetchLiveShifts();
        }, 30000);

        // Other data every 60 seconds
        const pollInterval = setInterval(() => {
            fetchRequests();
            fetchShifts();
            fetchServiceHistory();
            // Refresh client data
            axios.get('/api/client/me').then((response) => {
                if (response.data.isAuthenticated) {
                    setClient(response.data.client);
                }
            }).catch((err) => {
                console.error('Error refreshing client data:', err);
            });
        }, 60000);

        return () => {
            clearInterval(liveInterval);
            clearInterval(pollInterval);
        };
    }, [client]);

    const checkAuth = async () => {
        try {
            const response = await axios.get('/api/client/me');
            if (response.data.isAuthenticated) {
                setClient(response.data.client);
                fetchRequests();
                fetchShifts();
                fetchLiveShifts();
                fetchServiceHistory();
            } else {
                navigate('/client/login');
            }
        } catch (err) {
            navigate('/client/login');
        } finally {
            setLoading(false);
        }
    };

    const fetchRequests = async () => {
        try {
            const response = await axios.get('/api/reschedule/my-requests');
            setRequests(Array.isArray(response.data) ? response.data : []);
        } catch (err) {
            console.error('Error fetching requests:', err);
        }
    };

    const fetchShifts = async () => {
        try {
            const response = await axios.get('/api/client/my-shifts');
            setShifts(response.data.shifts || []);
        } catch (err) {
            console.error('Error fetching shifts:', err);
        }
    };

    const fetchLiveShifts = async () => {
        try {
            const response = await axios.get('/api/client/my-shifts-live');
            setLiveShifts(response.data.shifts || []);
        } catch (err) {
            console.error('Error fetching live shifts:', err);
        }
    };

    const fetchServiceHistory = async () => {
        try {
            const response = await axios.get('/api/client/service-history');
            setServiceHistory(response.data.history || []);
        } catch (err) {
            console.error('Error fetching service history:', err);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.post('/api/reschedule', formData);
            setShowForm(false);
            setFormData({ originalDate: '', requestedDate: '', reason: '' });
            fetchRequests();
            alert('Reschedule request submitted successfully!');
        } catch (err) {
            alert(err.response?.data?.msg || 'Error submitting request');
        }
    };

    const handleLogout = async () => {
        try {
            await axios.get('/api/client/logout');
            navigate('/client/login');
        } catch (err) {
            console.error('Logout error:', err);
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    const getStatusBadge = (status) => {
        const variants = {
            pending: 'warning',
            approved: 'success',
            denied: 'danger'
        };
        return (
            <Badge variant={variants[status] || 'secondary'} rounded="md">
                {status.charAt(0).toUpperCase() + status.slice(1)}
            </Badge>
        );
    };

    const getServiceStatusBadge = (status) => {
        const variants = {
            'pending': 'secondary',
            'scheduled': 'primary',
            'in-progress': 'warning',
            'completed': 'success',
            'cancelled': 'danger'
        };
        const colorMap = {
            'in-progress': 'orange'
        };

        const labels = {
            'pending': 'Pending',
            'scheduled': 'Scheduled',
            'in-progress': 'In Progress',
            'completed': 'Completed',
            'cancelled': 'Cancelled'
        };
        return (
            <Badge variant={colorMap[status] || variants[status] || 'secondary'} rounded="full" size="lg" className="flex items-center gap-1">
                {status === 'completed' && <CheckCircleIcon className="w-4 h-4" />}
                {status === 'scheduled' && <CalendarIcon className="w-4 h-4" />}
                {status === 'in-progress' && <RefreshIcon className="w-4 h-4 animate-spin" />}
                {labels[status] || 'Pending'}
            </Badge>
        );
    };

    const getLiveStatusBadge = (status) => {
        const variants = {
            'scheduled': 'secondary',
            'on_site': 'success',
            'checked_out': 'info',
            'completed': 'success'
        };
        const labels = {
            'scheduled': 'Scheduled',
            'on_site': 'On Site Now!',
            'checked_out': 'Left',
            'completed': 'Job Done'
        };
        return (
            <Badge
                variant={variants[status] || 'secondary'}
                rounded="full"
                size="lg"
                className={status === 'on_site' ? 'animate-pulse flex items-center gap-1' : 'flex items-center gap-1'}
            >
                {status === 'on_site' && <LocationMarkerIcon className="w-4 h-4" />}
                {labels[status] || 'Scheduled'}
            </Badge>
        );
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <RefreshIcon className="w-8 h-8 text-blue-500 animate-spin" />
                    <div className="text-xl text-gray-600">Loading...</div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[var(--bg-body)]">
            {/* Header */}
            <header className="bg-white/80 backdrop-blur-md sticky top-0 z-50 shadow-sm border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 flex items-center justify-center">
                            <img src={logo} alt="Vant" className="w-8 h-8" />
                        </div>
                        <h1 className="text-xl font-bold text-[var(--text-heading)]">Client Portal</h1>
                    </div>
                    <Button
                        onClick={handleLogout}
                        variant="ghost"
                        size="sm"
                        className="text-gray-500 hover:text-red-600"
                    >
                        Logout
                    </Button>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Welcome Card */}
                <Card className="mb-6 p-8 bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg border-none">
                    <h2 className="text-3xl font-bold mb-2 text-white flex items-center gap-2">
                        Welcome, {client?.name}! <HandIcon className="w-8 h-8 text-yellow-300" />
                    </h2>
                    <p className="text-blue-100 text-lg">
                        Manage your property services, view schedule, and request changes.
                    </p>
                </Card>

                {/* En-Route ETA Banner */}
                {enRouteNotification && (
                    <Card className="mb-6 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 shadow-md">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-blue-500 rounded-full animate-pulse">
                                <TruckIcon className="w-8 h-8 text-white" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-lg font-bold text-blue-800">
                                    🚗 Employee On The Way!
                                </h3>
                                <p className="text-blue-600">
                                    {enRouteNotification.employeeName} is heading to your location.
                                    {enRouteNotification.estimatedMinutes && (
                                        <span className="font-semibold"> ETA: ~{enRouteNotification.estimatedMinutes} minutes</span>
                                    )}
                                </p>
                            </div>
                        </div>
                    </Card>
                )}

                {/* Service Status Card */}
                <Card className="mb-6">
                    <h3 className="text-lg font-bold text-[var(--text-heading)] mb-4 flex items-center gap-2">
                        <div className="p-1.5 bg-blue-50 rounded-lg text-blue-600">
                            <ChartBarIcon className="w-5 h-5" />
                        </div>
                        Service Status
                    </h3>
                    <div className="flex flex-col md:flex-row md:items-center gap-6">
                        <div className="flex-1 space-y-3">
                            <div className="flex items-center gap-3">
                                <span className="text-gray-500 font-medium">Current Status:</span>
                                {getServiceStatusBadge(client?.serviceStatus || 'pending')}
                            </div>
                            {client?.nextServiceDate && (
                                <p className="text-[var(--text-body)] flex items-center gap-2">
                                    <CalendarIcon className="w-5 h-5 text-[var(--primary)]" />
                                    <span>Next Service: <span className="font-bold text-[var(--primary)]">{formatDate(client.nextServiceDate)}</span></span>
                                </p>
                            )}
                            {client?.lastServiceDate && (
                                <p className="text-sm text-gray-400 flex items-center gap-2">
                                    <ClockIcon className="w-4 h-4" />
                                    Last Service: {formatDate(client.lastServiceDate)}
                                </p>
                            )}
                        </div>
                        {client?.serviceNotes && (
                            <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4 flex-1">
                                <div className="text-sm text-blue-700">
                                    <span className="font-semibold flex items-center gap-2 mb-1">
                                        <ClipboardListIcon className="w-4 h-4" /> Notes:
                                    </span>
                                    {client.serviceNotes}
                                </div>
                            </div>
                        )}
                    </div>
                </Card>

                {/* Info Grid */}
                <div className="grid lg:grid-cols-2 gap-6">
                    {/* Contact Info */}
                    <Card>
                        <h3 className="text-lg font-bold text-[var(--text-heading)] mb-4 flex items-center gap-2">
                            <div className="p-1.5 bg-purple-50 rounded-lg text-purple-600">
                                <UserIcon className="w-5 h-5" />
                            </div>
                            Your Information
                        </h3>
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 text-[var(--text-body)] p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                                <div className="p-2 bg-white rounded-lg text-gray-500 shadow-sm">
                                    <MailIcon className="w-5 h-5" />
                                </div>
                                <span className="font-medium">{client?.email}</span>
                            </div>
                            <div className="flex items-center gap-3 text-[var(--text-body)] p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                                <div className="p-2 bg-white rounded-lg text-gray-500 shadow-sm">
                                    <PhoneIcon className="w-5 h-5" />
                                </div>
                                <span className="font-medium">{client?.phone || 'Not provided'}</span>
                            </div>
                            <div className="flex items-center gap-3 text-[var(--text-body)] p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                                <div className="p-2 bg-white rounded-lg text-gray-500 shadow-sm">
                                    <LocationMarkerIcon className="w-5 h-5" />
                                </div>
                                <span className="font-medium">{client?.address || 'Not provided'}</span>
                            </div>
                        </div>
                    </Card>

                    {/* Location Card & Property Details */}
                    <div className="space-y-6">
                        <LocationCard
                            client={client}
                            onLocationUpdate={(data) => {
                                setClient(prev => ({
                                    ...prev,
                                    location: data.location,
                                    shareLocation: data.shareLocation,
                                    address: data.address || prev.address
                                }));
                            }}
                        />

                        <PropertyDetailsCard
                            propertyDetails={client?.propertyDetails}
                            onUpdate={(updatedPropertyDetails) => {
                                setClient(prev => ({
                                    ...prev,
                                    propertyDetails: updatedPropertyDetails
                                }));
                            }}
                        />
                    </div>

                    {/* Request Reschedule Form */}
                    <Card>
                        <h3 className="text-lg font-bold text-[var(--text-heading)] mb-4 flex items-center gap-2">
                            <div className="p-1.5 bg-orange-50 rounded-lg text-orange-600">
                                <CalendarIcon className="w-5 h-5" />
                            </div>
                            Request Reschedule
                        </h3>
                        {!showForm ? (
                            <Button
                                onClick={() => setShowForm(true)}
                                variant="soft-primary"
                                className="w-full justify-center py-4 text-base border-dashed border-2 flex items-center gap-2"
                            >
                                <PencilAltIcon className="w-5 h-5" />
                                Request a Reschedule
                            </Button>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <Input
                                    label="Current Scheduled Date"
                                    type="date"
                                    value={formData.originalDate}
                                    onChange={(e) => setFormData({ ...formData, originalDate: e.target.value })}
                                    required
                                />
                                <Input
                                    label="Preferred New Date"
                                    type="date"
                                    value={formData.requestedDate}
                                    onChange={(e) => setFormData({ ...formData, requestedDate: e.target.value })}
                                    required
                                />
                                <Input
                                    label="Reason (optional)"
                                    type="textarea"
                                    rows={3}
                                    value={formData.reason}
                                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                                    placeholder="Why do you need to reschedule?"
                                />
                                <div className="flex gap-3 pt-2">
                                    <Button
                                        type="button"
                                        onClick={() => setShowForm(false)}
                                        variant="secondary"
                                        className="flex-1 justify-center"
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        variant="primary"
                                        className="flex-1 justify-center"
                                    >
                                        Submit Request
                                    </Button>
                                </div>
                            </form>
                        )}
                    </Card>
                </div>

                {/* Services Section with Tabs */}
                <Card className="mt-8 overflow-hidden p-0">
                    {/* Tab Navigation */}
                    <div className="flex border-b border-gray-100 bg-gray-50/50 overflow-x-auto">
                        <button
                            onClick={() => setActiveTab('live')}
                            className={`relative flex items-center gap-2 px-6 py-4 text-sm font-medium transition-all whitespace-nowrap ${activeTab === 'live'
                                ? 'bg-white text-green-600 border-t-2 border-t-green-500 shadow-sm'
                                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                                }`}
                        >
                            <span className={activeTab === 'live' ? '' : 'grayscale'}>🔴</span> Live Status
                            {liveShifts.some(s => s.liveStatus === 'on_site') && (
                                <span className="absolute top-3 right-2 w-2 h-2 bg-green-500 rounded-full animate-ping"></span>
                            )}
                        </button>
                        <button
                            onClick={() => setActiveTab('upcoming')}
                            className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-all whitespace-nowrap ${activeTab === 'upcoming'
                                ? 'bg-white text-[var(--primary)] border-t-2 border-t-[var(--primary)] shadow-sm'
                                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                                }`}
                        >
                            <CalendarIcon className="w-4 h-4" />
                            Upcoming ({shifts.length})
                        </button>
                        <button
                            onClick={() => setActiveTab('history')}
                            className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-all whitespace-nowrap ${activeTab === 'history'
                                ? 'bg-white text-purple-600 border-t-2 border-t-purple-500 shadow-sm'
                                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                                }`}
                        >
                            <ClipboardListIcon className="w-4 h-4" />
                            History ({serviceHistory.length})
                        </button>
                    </div>

                    {/* Tab Content */}
                    <div className="p-6 sm:p-8">
                        {/* Live Status Tab */}
                        {activeTab === 'live' && (
                            <div>
                                <div className="flex items-center justify-between mb-6">
                                    <p className="text-sm text-[var(--text-body)]">Real-time status of your upcoming services</p>
                                    <Button
                                        onClick={() => fetchLiveShifts()}
                                        variant="ghost"
                                        size="xs"
                                        className="flex items-center gap-1"
                                    >
                                        <RefreshIcon className="w-3 h-3" /> Refresh
                                    </Button>
                                </div>
                                {liveShifts.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-12 text-gray-400 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-100">
                                        <div className="p-4 bg-white rounded-full mb-3 shadow-sm">
                                            <CalendarIcon className="w-8 h-8 text-gray-300" />
                                        </div>
                                        <p>No upcoming services this week</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {liveShifts.map((shift, index) => (
                                            <div
                                                key={index}
                                                className={`border rounded-[1.25rem] p-5 transition-all ${shift.liveStatus === 'on_site'
                                                    ? 'border-green-200 bg-green-50 shadow-md ring-1 ring-green-100'
                                                    : shift.isToday
                                                        ? 'border-blue-100 bg-blue-50/30'
                                                        : 'border-gray-100 bg-white hover:border-gray-200'
                                                    }`}
                                            >
                                                <div className="flex justify-between items-start mb-4">
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <p className="font-bold text-gray-800 text-lg">{formatDate(shift.date)}</p>
                                                            {shift.isToday && (
                                                                <Badge variant="primary" size="sm" rounded="full">TODAY</Badge>
                                                            )}
                                                        </div>
                                                        <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                                                            <ClockIcon className="w-4 h-4 text-gray-400" /> {shift.startTime} - {shift.endTime}
                                                        </p>
                                                    </div>
                                                    {getLiveStatusBadge(shift.liveStatus)}
                                                </div>

                                                <div className="flex items-center gap-4 text-sm bg-white/50 rounded-lg p-3 border border-gray-100">
                                                    <span className="text-gray-700 flex items-center gap-2">
                                                        <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs">
                                                            <UserIcon className="w-4 h-4" />
                                                        </div>
                                                        <span className="font-medium">{shift.employeeName}</span>
                                                    </span>
                                                    {shift.checkInTime && (
                                                        <span className="text-green-600 font-medium text-xs bg-green-50 px-2 py-1 rounded flex items-center gap-1">
                                                            <CheckCircleIcon className="w-3 h-3" /> Arrived {shift.checkInTime}
                                                        </span>
                                                    )}
                                                    {shift.checkOutTime && (
                                                        <span className="text-blue-600 font-medium text-xs bg-blue-50 px-2 py-1 rounded flex items-center gap-1">
                                                            <XCircleIcon className="w-3 h-3" /> Left {shift.checkOutTime}
                                                        </span>
                                                    )}
                                                </div>

                                                {shift.liveStatus === 'on_site' && (
                                                    <div className="mt-4 p-4 bg-green-100 rounded-xl flex items-center gap-3 animate-pulse">
                                                        <div className="bg-green-500 w-2 h-2 rounded-full"></div>
                                                        <p className="text-green-800 font-bold">
                                                            Service in progress! Our team is at your property.
                                                        </p>
                                                    </div>
                                                )}

                                                {shift.notes && (
                                                    <p className="mt-3 text-sm text-gray-600 bg-yellow-50 rounded-lg p-3 border border-yellow-100 flex items-start gap-2">
                                                        <ClipboardListIcon className="w-4 h-4 mt-0.5 text-yellow-600" />
                                                        <span><span className="font-medium">Note:</span> {shift.notes}</span>
                                                    </p>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Upcoming Tab */}
                        {activeTab === 'upcoming' && (
                            <div>
                                {shifts.length === 0 ? (
                                    <div className="text-gray-500 text-center py-12">No services scheduled yet</div>
                                ) : (
                                    <div className="space-y-4">
                                        {shifts.map((shift, index) => (
                                            <div key={index} className="border border-gray-100 rounded-2xl p-5 hover:bg-gray-50 transition hover:shadow-sm">
                                                <div className="flex justify-between items-start mb-3">
                                                    <div>
                                                        <p className="font-bold text-gray-800 text-lg">
                                                            {formatDate(shift.date)}
                                                        </p>
                                                        <p className="text-sm text-[var(--primary)] font-medium bg-blue-50 inline-block px-2 py-0.5 rounded-md mt-1">{shift.scheduleName}</p>
                                                    </div>
                                                    <Badge variant={
                                                        shift.shiftType === 'morning' ? 'success' :
                                                            shift.shiftType === 'mid' ? 'primary' :
                                                                shift.shiftType === 'evening' ? 'purple' : 'warning'
                                                    } rounded="lg">
                                                        {shift.shiftType === 'morning' ? '🌅 Morning' :
                                                            shift.shiftType === 'mid' ? '☀️ Midday' :
                                                                shift.shiftType === 'evening' ? '🌙 Evening' :
                                                                    '⏰ Custom'}
                                                    </Badge>
                                                </div>
                                                <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                                                    <span className="flex items-center gap-1"><UserIcon className="w-4 h-4" /> <span className="font-medium">{shift.employeeName}</span></span>
                                                    <span className="flex items-center gap-1"><ClockIcon className="w-4 h-4" /> {shift.startTime} - {shift.endTime}</span>
                                                </div>
                                                {shift.notes && (
                                                    <p className="text-sm text-gray-500 bg-gray-50 rounded-lg p-3 border border-gray-100 flex items-start gap-2">
                                                        <ClipboardListIcon className="w-4 h-4 mt-0.5" />
                                                        {shift.notes}
                                                    </p>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* History Tab */}
                        {activeTab === 'history' && (
                            <div>
                                <p className="text-sm text-gray-500 mb-6">Your past service records</p>
                                {serviceHistory.length === 0 ? (
                                    <div className="text-gray-500 text-center py-12">No service history yet</div>
                                ) : (
                                    <div className="space-y-4">
                                        {serviceHistory.map((service) => (
                                            <div key={service._id} className="border border-gray-100 rounded-2xl p-5 hover:bg-gray-50 transition">
                                                <div className="flex justify-between items-start mb-2">
                                                    <div>
                                                        <p className="font-bold text-gray-800">
                                                            {formatDate(service.date)}
                                                        </p>
                                                        <p className="text-sm text-gray-600 mt-1 flex items-center gap-1">
                                                            <UserIcon className="w-3 h-3" /> Serviced by: <span className="font-medium">{service.employeeName}</span>
                                                        </p>
                                                    </div>
                                                    <div className="text-right">
                                                        {service.duration && (
                                                            <p className="text-sm text-gray-500 mb-1 flex items-center justify-end gap-1"><ClockIcon className="w-3 h-3" /> {service.duration}</p>
                                                        )}
                                                        {service.jobCompleted && (
                                                            <Badge variant="success" size="sm">Completed</Badge>
                                                        )}
                                                    </div>
                                                </div>

                                                {service.rating && (
                                                    <div className="mt-3 p-3 bg-yellow-50 rounded-xl border border-yellow-100">
                                                        <div className="flex items-center gap-2">
                                                            <div className="flex text-yellow-400">
                                                                {[...Array(5)].map((_, i) => (
                                                                    <StarIcon key={i} className={`w-4 h-4 ${i < service.rating.score ? 'fill-current' : 'text-gray-300'}`} />
                                                                ))}
                                                            </div>
                                                            <span className="text-sm text-gray-600 font-medium">
                                                                ({service.rating.score}/5)
                                                            </span>
                                                        </div>
                                                        {service.rating.comment && (
                                                            <p className="text-sm text-gray-600 mt-1 italic pl-1 border-l-2 border-yellow-300">
                                                                "{service.rating.comment}"
                                                            </p>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </Card>

                {/* Rating Section */}
                <div className="mt-8">
                    <RateEmployeeModal />
                </div>

                {/* My Requests */}
                {requests.length > 0 && (
                    <Card className="mt-8">
                        <h3 className="text-lg font-bold text-[var(--text-heading)] mb-4 flex items-center gap-2">
                            <div className="p-1.5 bg-gray-100 rounded-lg">
                                <ClipboardListIcon className="w-5 h-5 text-gray-600" />
                            </div>
                            My Reschedule Requests
                        </h3>
                        <div className="space-y-3">
                            {requests.map((req) => (
                                <div key={req._id} className="border border-gray-100 rounded-xl p-4 flex justify-between items-center bg-gray-50">
                                    <div>
                                        <p className="font-medium text-gray-800 flex items-center gap-2">
                                            {formatDate(req.originalDate)} <span className="text-gray-400">→</span> {formatDate(req.requestedDate)}
                                        </p>
                                        {req.reason && <p className="text-sm text-gray-500 mt-1">{req.reason}</p>}
                                        {req.adminNote && (
                                            <p className="text-sm text-blue-600 mt-2 bg-blue-50 p-2 rounded-lg inline-block flex items-center gap-1">
                                                <ChatAltIcon className="w-3 h-3" /> Admin: {req.adminNote}
                                            </p>
                                        )}
                                    </div>
                                    {getStatusBadge(req.status)}
                                </div>
                            ))}
                        </div>
                    </Card>
                )}

                {/* Help Section */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-[1.375rem] shadow-lg p-8 mt-8 text-white relative overflow-hidden">
                    <div className="relative z-10">
                        <h3 className="text-xl font-bold mb-2 flex items-center gap-2 text-white">
                            <QuestionMarkCircleIcon className="w-6 h-6" /> Need Help?
                        </h3>
                        <p className="opacity-90 max-w-xl text-white">
                            Contact your cleaning service provider for urgent changes, special requests, or to report an issue. We are here to help!
                        </p>
                        <Button
                            className="mt-4 bg-white text-blue-600 hover:bg-gray-100 border-none shadow-md"
                            size="sm"
                        >
                            Contact Support
                        </Button>
                    </div>
                    {/* Decoral circles */}
                    <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
                    <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
                </div>
            </main>
        </div>
    );
};

export default ClientDashboard;
