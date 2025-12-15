import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import { HashLoader } from 'react-spinners';
import { ClipboardListIcon, CalendarIcon, PlayIcon, CheckCircleIcon, ExclamationIcon, RefreshIcon, DownloadIcon, ShieldCheckIcon, ClockIcon, CheckIcon } from '@heroicons/react/outline';

const AttendancePage = () => {
    const [attendanceData, setAttendanceData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterUser, setFilterUser] = useState('');
    const [filterDate, setFilterDate] = useState('');
    const [filterClient, setFilterClient] = useState('');
    const [quickFilter, setQuickFilter] = useState('all'); // all, today, week, month
    const [statusFilter, setStatusFilter] = useState('all'); // all, active, completed
    const [issuesOnly, setIssuesOnly] = useState(false);
    const [selectedRecords, setSelectedRecords] = useState(new Set());
    const [photoGallery, setPhotoGallery] = useState(null); // { photos: [], title: '' }

    useEffect(() => {
        fetchAttendanceData();
    }, []);

    const fetchAttendanceData = async () => {
        try {
            const response = await axios.get('/api/attendance/all');
            setAttendanceData(Array.isArray(response.data) ? response.data : []);
        } catch (error) {
            console.error('Error fetching attendance data:', error);
        } finally {
            setLoading(false);
        }
    };

    const calculateDuration = (start, end) => {
        if (!start || !end) return '-';
        const startTime = new Date(start);
        const endTime = new Date(end);
        const diffMs = endTime - startTime;
        const diffHrs = Math.floor((diffMs % 86400000) / 3600000);
        const diffMins = Math.round(((diffMs % 86400000) % 3600000) / 60000);
        return `${diffHrs}h ${diffMins}m`;
    };

    const openMap = (location) => {
        if (!location || !location.lat || !location.lng) return;
        window.open(`https://www.google.com/maps?q=${location.lat},${location.lng}`, '_blank');
    };

    // Bulk selection handlers
    const toggleSelectRecord = (id) => {
        setSelectedRecords(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) {
                newSet.delete(id);
            } else {
                newSet.add(id);
            }
            return newSet;
        });
    };

    const toggleSelectAll = () => {
        if (selectedRecords.size === filteredData.length) {
            setSelectedRecords(new Set());
        } else {
            setSelectedRecords(new Set(filteredData.map(r => r._id)));
        }
    };

    const exportToCSV = () => {
        const recordsToExport = selectedRecords.size > 0
            ? filteredData.filter(r => selectedRecords.has(r._id))
            : filteredData;

        const headers = ['Employee', 'Client', 'Date', 'Check In', 'Check Out', 'Duration', 'Status', 'Safety Confirmed', 'Job Completed', 'GPS Warning'];
        const rows = recordsToExport.map(record => [
            record.userId?.username || 'Unknown',
            record.clientId?.name || 'Not assigned',
            record.checkIn?.time ? format(new Date(record.checkIn.time), 'yyyy-MM-dd') : '-',
            record.checkIn?.time ? format(new Date(record.checkIn.time), 'HH:mm') : '-',
            record.checkOut?.time ? format(new Date(record.checkOut.time), 'HH:mm') : '-',
            calculateDuration(record.checkIn?.time, record.checkOut?.time),
            record.status,
            record.safetyConfirmed?.confirmed ? 'Yes' : 'No',
            record.jobCompleted?.confirmed ? 'Yes' : 'No',
            record.gpsWarning || 'None'
        ]);

        const csvContent = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `attendance_${format(new Date(), 'yyyy-MM-dd_HHmm')}.csv`;
        link.click();
    };

    // Date helpers for quick filters
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const filteredData = attendanceData.filter(record => {
        // Text filters
        const matchesUser = !filterUser || (record.userId?.username?.toLowerCase().includes(filterUser.toLowerCase()) || false);
        const matchesClient = !filterClient || (record.clientId?.name?.toLowerCase().includes(filterClient.toLowerCase()) || false);
        const matchesDate = !filterDate || (record.checkIn?.time && format(new Date(record.checkIn.time), 'yyyy-MM-dd') === filterDate);

        // Quick date filters
        let matchesQuickFilter = true;
        if (quickFilter === 'today' && record.checkIn?.time) {
            const checkInDate = new Date(record.checkIn.time);
            checkInDate.setHours(0, 0, 0, 0);
            matchesQuickFilter = checkInDate.getTime() === today.getTime();
        } else if (quickFilter === 'week' && record.checkIn?.time) {
            const checkInDate = new Date(record.checkIn.time);
            matchesQuickFilter = checkInDate >= startOfWeek;
        } else if (quickFilter === 'month' && record.checkIn?.time) {
            const checkInDate = new Date(record.checkIn.time);
            matchesQuickFilter = checkInDate >= startOfMonth;
        }

        // Status filter
        let matchesStatus = true;
        if (statusFilter === 'active') {
            matchesStatus = record.status === 'checked-in';
        } else if (statusFilter === 'completed') {
            matchesStatus = record.status === 'checked-out';
        }

        // Issues filter (GPS warnings, missing safety confirmation when checked out)
        let matchesIssues = true;
        if (issuesOnly) {
            const hasGpsWarning = !!record.gpsWarning;
            const missingSafety = record.status === 'checked-out' && !record.safetyConfirmed?.confirmed;
            const missingJobDone = record.status === 'checked-out' && !record.jobCompleted?.confirmed;
            matchesIssues = hasGpsWarning || missingSafety || missingJobDone;
        }

        return matchesUser && matchesClient && matchesDate && matchesQuickFilter && matchesStatus && matchesIssues;
    });

    if (loading) {
        return (
            <div className="flex justify-center items-center h-full">
                <HashLoader size={50} color="#36d7b7" />
            </div>
        );
    }

    // Mobile Card Component
    const MobileAttendanceCard = ({ record }) => (
        <div className="bg-white rounded-lg shadow-md p-4 mb-3">
            {/* Header: Employee & Status */}
            <div className="flex justify-between items-start mb-3">
                <div>
                    <h3 className="font-semibold text-gray-900">{record.userId?.username || 'Unknown'}</h3>
                    <p className="text-sm text-gray-500">{record.clientId?.name || 'Not assigned'}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                    {record.checkOut?.time ? (
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-600 flex items-center gap-1">
                            <CheckIcon className="w-3 h-3" /> Completed
                        </span>
                    ) : (
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-600 flex items-center gap-1">
                            <PlayIcon className="w-3 h-3" /> Active
                        </span>
                    )}
                    {record.safetyConfirmed?.confirmed ? (
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800 flex items-center gap-1">
                            <ShieldCheckIcon className="w-3 h-3" /> Safe
                        </span>
                    ) : (
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800 flex items-center gap-1">
                            <ClockIcon className="w-3 h-3" /> Pending
                        </span>
                    )}
                    {record.jobCompleted?.confirmed && (
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 flex items-center gap-1">
                            <CheckCircleIcon className="w-3 h-3" /> Job Done
                        </span>
                    )}
                </div>
            </div>

            {/* Date & Time Info */}
            <div className="grid grid-cols-3 gap-2 text-sm mb-3 bg-gray-50 rounded-lg p-3">
                <div>
                    <p className="text-gray-500 text-xs">Date</p>
                    <p className="font-medium">{record.checkIn?.time ? format(new Date(record.checkIn.time), 'MMM d') : '-'}</p>
                </div>
                <div>
                    <p className="text-gray-500 text-xs">Check In</p>
                    <p className="font-medium text-green-600">{record.checkIn?.time ? format(new Date(record.checkIn.time), 'HH:mm') : '-'}</p>
                </div>
                <div>
                    <p className="text-gray-500 text-xs">Check Out</p>
                    <p className="font-medium text-red-600">{record.checkOut?.time ? format(new Date(record.checkOut.time), 'HH:mm') : '-'}</p>
                </div>
            </div>

            {/* Duration & Actions */}
            <div className="flex justify-between items-center">
                <div className="text-sm">
                    <span className="text-gray-500">Duration: </span>
                    <span className="font-medium">{calculateDuration(record.checkIn?.time, record.checkOut?.time)}</span>
                </div>
                <div className="flex gap-2">
                    {record.checkIn?.location && (
                        <button
                            onClick={() => openMap(record.checkIn?.location)}
                            className="px-3 py-1 text-xs bg-blue-50 text-blue-600 rounded-full hover:bg-blue-100 flex items-center gap-1"
                        >
                            📍 Map
                        </button>
                    )}
                    {/* Photos - mobile-friendly click to view */}
                    {(record.checkIn?.beforePhoto || record.checkIn?.photos?.length > 0 ||
                        record.checkOut?.completionPhoto || record.checkOut?.photos?.length > 0) && (
                            <div className="flex gap-1 flex-wrap">
                                {/* Check-in photos */}
                                {(record.checkIn?.photos?.length > 0 || record.checkIn?.beforePhoto) && (
                                    <button
                                        onClick={() => {
                                            const photos = record.checkIn.photos?.length > 0
                                                ? record.checkIn.photos
                                                : [record.checkIn.beforePhoto];
                                            setPhotoGallery({ photos, title: 'Before Photos' });
                                        }}
                                        className="px-3 py-1 text-xs bg-green-50 text-green-600 rounded-full hover:bg-green-100 flex items-center gap-1"
                                    >
                                        📷 Before
                                        {record.checkIn?.photos?.length > 0 && (
                                            <span className="ml-1 px-1.5 py-0.5 bg-green-200 rounded-full text-xs">
                                                {record.checkIn.photos.length}
                                            </span>
                                        )}
                                    </button>
                                )}
                                {/* Check-out photos */}
                                {(record.checkOut?.photos?.length > 0 || record.checkOut?.completionPhoto) && (
                                    <button
                                        onClick={() => {
                                            const photos = record.checkOut.photos?.length > 0
                                                ? record.checkOut.photos
                                                : [record.checkOut.completionPhoto];
                                            setPhotoGallery({ photos, title: 'After Photos' });
                                        }}
                                        className="px-3 py-1 text-xs bg-blue-50 text-blue-600 rounded-full hover:bg-blue-100 flex items-center gap-1"
                                    >
                                        📷 After
                                        {record.checkOut?.photos?.length > 0 && (
                                            <span className="ml-1 px-1.5 py-0.5 bg-blue-200 rounded-full text-xs">
                                                {record.checkOut.photos.length}
                                            </span>
                                        )}
                                    </button>
                                )}
                            </div>
                        )}
                </div>
            </div>
        </div>
    );

    const clearAllFilters = () => {
        setFilterUser('');
        setFilterDate('');
        setFilterClient('');
        setQuickFilter('all');
        setStatusFilter('all');
        setIssuesOnly(false);
    };

    // Quick filter pill button component
    const FilterPill = ({ label, icon: Icon, active, onClick, color = 'blue' }) => (
        <button
            onClick={onClick}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors flex items-center gap-2 ${active
                ? `bg-${color}-500 text-white`
                : `bg-gray-100 text-gray-600 hover:bg-gray-200`
                }`}
        >
            {Icon && <Icon className="w-4 h-4" />}
            {label}
        </button>
    );

    return (
        <div className="p-4 md:p-6">
            <h1 className="text-2xl md:text-3xl font-bold mb-4 md:mb-6 text-gray-800 flex items-center gap-3">
                <ClipboardListIcon className="w-8 h-8 text-blue-600" /> Employee Attendance
            </h1>

            <div className="bg-white rounded-lg shadow-md p-4 md:p-6 mb-6">
                {/* Quick Filter Pills */}
                <div className="flex flex-wrap gap-2 mb-4 pb-4 border-b border-gray-100">
                    <FilterPill
                        label="All"
                        icon={ClipboardListIcon}
                        active={quickFilter === 'all'}
                        onClick={() => setQuickFilter('all')}
                    />
                    <FilterPill
                        label="Today"
                        icon={CalendarIcon}
                        active={quickFilter === 'today'}
                        onClick={() => setQuickFilter('today')}
                    />
                    <FilterPill
                        label="This Week"
                        icon={CalendarIcon}
                        active={quickFilter === 'week'}
                        onClick={() => setQuickFilter('week')}
                    />
                    <FilterPill
                        label="This Month"
                        icon={CalendarIcon}
                        active={quickFilter === 'month'}
                        onClick={() => setQuickFilter('month')}
                    />
                    <div className="w-px h-6 bg-gray-300 mx-1 self-center" />
                    <FilterPill
                        label="Active Only"
                        icon={PlayIcon}
                        active={statusFilter === 'active'}
                        onClick={() => setStatusFilter(statusFilter === 'active' ? 'all' : 'active')}
                        color="green"
                    />
                    <FilterPill
                        label="Completed"
                        icon={CheckCircleIcon}
                        active={statusFilter === 'completed'}
                        onClick={() => setStatusFilter(statusFilter === 'completed' ? 'all' : 'completed')}
                        color="gray"
                    />
                    <FilterPill
                        label="Issues"
                        icon={ExclamationIcon}
                        active={issuesOnly}
                        onClick={() => setIssuesOnly(!issuesOnly)}
                        color="orange"
                    />
                </div>

                {/* Detailed Filters - Stack on mobile, row on desktop */}
                <div className="flex flex-col md:flex-row flex-wrap gap-3 md:gap-4 mb-4">
                    <input
                        type="text"
                        placeholder="Filter by employee..."
                        value={filterUser}
                        onChange={(e) => setFilterUser(e.target.value)}
                        className="p-2 border rounded-md flex-1 min-w-[200px]"
                    />
                    <input
                        type="text"
                        placeholder="Filter by client..."
                        value={filterClient}
                        onChange={(e) => setFilterClient(e.target.value)}
                        className="p-2 border rounded-md flex-1 min-w-[200px]"
                    />
                    <input
                        type="date"
                        value={filterDate}
                        onChange={(e) => { setFilterDate(e.target.value); setQuickFilter('all'); }}
                        className="p-2 border rounded-md"
                    />
                    <div className="flex gap-2">
                        <button
                            onClick={clearAllFilters}
                            className="flex-1 md:flex-none px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors">
                            Clear All
                        </button>
                        <button
                            onClick={fetchAttendanceData}
                            className="flex-1 md:flex-none px-4 py-2 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 transition-colors flex items-center gap-2"
                        >
                            <RefreshIcon className="w-5 h-5" /> Refresh
                        </button>
                        <button
                            onClick={exportToCSV}
                            className="flex-1 md:flex-none px-4 py-2 bg-green-50 text-green-600 rounded-md hover:bg-green-100 transition-colors flex items-center gap-2"
                        >
                            <DownloadIcon className="w-5 h-5" /> Export CSV
                        </button>
                    </div>
                </div>

                {/* Bulk Action Bar */}
                {selectedRecords.size > 0 && (
                    <div className="flex items-center gap-4 mb-4 p-3 bg-blue-50 rounded-lg">
                        <span className="text-sm text-blue-700 font-medium">
                            {selectedRecords.size} record{selectedRecords.size > 1 ? 's' : ''} selected
                        </span>
                        <button
                            onClick={exportToCSV}
                            className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 flex items-center gap-2"
                        >
                            <DownloadIcon className="w-4 h-4" /> Export Selected
                        </button>
                        <button
                            onClick={() => setSelectedRecords(new Set())}
                            className="px-3 py-1 bg-gray-200 text-gray-700 text-sm rounded hover:bg-gray-300"
                        >
                            Clear Selection
                        </button>
                    </div>
                )}

                {/* Results count */}
                <div className="text-sm text-gray-500 mb-4">
                    Showing {filteredData.length} of {attendanceData.length} records
                </div>

                {/* Mobile View - Cards */}
                <div className="md:hidden">
                    {filteredData.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            No attendance records found
                        </div>
                    ) : (
                        filteredData.map((record) => (
                            <MobileAttendanceCard key={record._id} record={record} />
                        ))
                    )}
                </div>

                {/* Desktop View - Table */}
                <div className="hidden md:block overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Check In</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Check Out</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Miles</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Photos</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredData.length === 0 ? (
                                <tr>
                                    <td colSpan="9" className="px-6 py-4 text-center text-gray-500">
                                        No attendance records found
                                    </td>
                                </tr>
                            ) : (
                                filteredData.map((record) => (
                                    <tr key={record._id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">{record.userId?.username || 'Unknown'}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-500">{record.clientId?.name || 'Not assigned'}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {record.checkIn?.time ? format(new Date(record.checkIn.time), 'MMM d, yyyy') : '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {record.checkIn?.time ? format(new Date(record.checkIn.time), 'HH:mm') : '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {record.checkOut?.time ? format(new Date(record.checkOut.time), 'HH:mm') : <span className="text-green-600 font-semibold inline-flex items-center gap-1"><PlayIcon className="w-3 h-3" /> Active</span>}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {calculateDuration(record.checkIn?.time, record.checkOut?.time)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            {record.mileage?.distanceMiles ? (
                                                <span className="text-blue-600 font-medium">{record.mileage.distanceMiles.toFixed(2)} mi</span>
                                            ) : '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 cursor-pointer hover:underline" onClick={() => openMap(record.checkIn?.location)}>
                                            {record.checkIn?.location ? 'View Map' : '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex flex-col gap-1">
                                                {record.safetyConfirmed?.confirmed ? (
                                                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 items-center gap-1">
                                                        <ShieldCheckIcon className="w-3 h-3" /> Safe
                                                    </span>
                                                ) : (
                                                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800 items-center gap-1">
                                                        <ClockIcon className="w-3 h-3" /> Pending
                                                    </span>
                                                )}
                                                {record.jobCompleted?.confirmed && (
                                                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800 items-center gap-1">
                                                        <CheckCircleIcon className="w-3 h-3" /> Done
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 flex gap-2">
                                            {record.checkIn?.beforePhoto && (
                                                <a href={`http://localhost:4080${record.checkIn.beforePhoto}`} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-700">Before</a>
                                            )}
                                            {record.checkIn?.beforePhoto && record.checkOut?.completionPhoto && <span>|</span>}
                                            {record.checkOut?.completionPhoto && (
                                                <a href={`http://localhost:4080${record.checkOut.completionPhoto}`} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-700">After</a>
                                            )}
                                            {!record.checkIn?.beforePhoto && !record.checkOut?.completionPhoto && '-'}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Photo Gallery Modal */}
            {photoGallery && (
                <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4" onClick={() => setPhotoGallery(null)}>
                    <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                        <div className="p-4 border-b flex items-center justify-between sticky top-0 bg-white">
                            <h3 className="font-bold text-lg">{photoGallery.title}</h3>
                            <button
                                onClick={() => setPhotoGallery(null)}
                                className="p-2 hover:bg-gray-100 rounded-full"
                            >
                                ✕
                            </button>
                        </div>
                        <div className="p-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {photoGallery.photos.map((photo, i) => (
                                <a
                                    key={i}
                                    href={`http://localhost:4080${photo}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="block aspect-square"
                                >
                                    <img
                                        src={`http://localhost:4080${photo}`}
                                        alt={`Photo ${i + 1}`}
                                        className="w-full h-full object-cover rounded-lg hover:opacity-90 transition-opacity"
                                    />
                                </a>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AttendancePage;
