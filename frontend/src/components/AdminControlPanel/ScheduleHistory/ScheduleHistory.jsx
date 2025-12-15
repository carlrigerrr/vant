import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import HashLoader from 'react-spinners/HashLoader';
import { useUserContext } from '../../useUserContext';
import Swal from 'sweetalert2';
import { ArchiveIcon, PlusIcon } from '@heroicons/react/outline';
import { format } from 'date-fns';

const ScheduleHistory = () => {
    const { user } = useUserContext();
    const [shifts, setShifts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    let navigate = useNavigate();

    const refreshShifts = async () => {
        setIsLoading(true);
        try {
            const response = await axios.get('/getScheduleHistory');
            setShifts(Array.isArray(response.data) ? response.data : []);
        } catch (error) {
            console.error("Error fetching history:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        refreshShifts();
    }, []);

    // Poll for schedule updates every 90 seconds
    useEffect(() => {
        if (!user) return;

        const pollInterval = setInterval(() => {
            refreshShifts();
        }, 90000); // Poll every 90 seconds

        return () => clearInterval(pollInterval);
    }, [user]);

    if (!user) {
        return (
            <div className="grid w-screen h-screen place-items-center">
                <HashLoader className="content-center" size={100} />
                <h3>Loading, please wait...</h3>
            </div>
        );
    }

    if (user && user.admin === false) {
        navigate('/');
        return null;
    }

    const handleRemove = async (id) => {
        Swal.fire({
            title: 'Delete Schedule?',
            text: 'This action cannot be undone.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Yes, delete it',
            cancelButtonText: 'Cancel'
        }).then((result) => {
            if (result.isConfirmed) {
                axios.post('/removeSchedule', { id });
                setShifts(prev => prev.filter(s => s._id !== id));
                Swal.fire('Deleted!', 'Schedule has been removed.', 'success');
            }
        });
    };

    const handleEdit = (shift) => {
        navigate('/admin/schedule', { state: { editSchedule: shift } });
    };

    const getShiftTypeColor = (index) => {
        const colors = [
            'bg-emerald-500',
            'bg-sky-500',
            'bg-violet-500',
            'bg-orange-500',
            'bg-pink-500',
            'bg-teal-500'
        ];
        return colors[index % colors.length];
    };

    return (
        <div className="min-h-screen bg-gray-50/50 p-4 md:p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Work Schedules</h1>
                        <p className="mt-1 text-sm text-gray-500">View and manage published work schedules.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-200 text-sm font-medium text-gray-600">
                            Total: <span className="text-gray-900 font-bold">{shifts.length}</span>
                        </div>
                        <button
                            onClick={() => navigate('/admin/schedule')}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                        >
                            <PlusIcon className="w-4 h-4" />
                            New Schedule
                        </button>
                    </div>
                </div>

                {/* Content */}
                {isLoading ? (
                    <div className="flex justify-center py-20">
                        <HashLoader size={50} color="#3b82f6" />
                    </div>
                ) : shifts.length > 0 ? (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        {/* Table Header */}
                        <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-4 bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            <div className="col-span-1 text-center">#</div>
                            <div className="col-span-4">Schedule</div>
                            <div className="col-span-3">Published</div>
                            <div className="col-span-2">Created By</div>
                            <div className="col-span-2 text-right">Actions</div>
                        </div>

                        {/* Table Body */}
                        <div className="divide-y divide-gray-100">
                            {(shifts || []).slice().reverse().map((shift, i) => {
                                const date = new Date(Date.parse(shift.date));
                                const index = shifts.length - i;

                                return (
                                    <div
                                        key={shift._id}
                                        className="grid grid-cols-1 md:grid-cols-12 gap-4 px-6 py-4 hover:bg-gray-50 transition-colors items-center"
                                    >
                                        {/* Index */}
                                        <div className="hidden md:flex col-span-1 justify-center">
                                            <span className={`w-8 h-8 rounded-lg ${getShiftTypeColor(i)} text-white flex items-center justify-center text-sm font-bold`}>
                                                {index}
                                            </span>
                                        </div>

                                        {/* Schedule Info */}
                                        <div className="col-span-4 flex items-center gap-3">
                                            <span className={`md:hidden w-8 h-8 rounded-lg ${getShiftTypeColor(i)} text-white flex items-center justify-center text-sm font-bold flex-shrink-0`}>
                                                {index}
                                            </span>
                                            <div>
                                                <h3 className="font-semibold text-gray-900 text-sm">
                                                    {shift.name || `Schedule #${index}`}
                                                </h3>
                                                <p className="text-xs text-gray-500 mt-0.5">
                                                    Week {format(date, 'w, yyyy')}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Published Date/Time */}
                                        <div className="col-span-3">
                                            <p className="text-sm text-gray-900 font-medium">
                                                {format(date, 'dd MMM yyyy')}
                                            </p>
                                            <p className="text-xs text-gray-500 mt-0.5">
                                                {format(date, 'HH:mm')}
                                            </p>
                                        </div>

                                        {/* Created By */}
                                        <div className="col-span-2">
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center text-[10px] font-bold text-gray-600">
                                                    {shift.savedBy?.charAt(0).toUpperCase() || '?'}
                                                </div>
                                                <span className="text-sm text-gray-700 font-medium">{shift.savedBy || 'Unknown'}</span>
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="col-span-2 flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => handleEdit(shift)}
                                                className="px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => handleRemove(shift._id)}
                                                className="px-3 py-1.5 text-xs font-medium text-red-700 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-24 text-center bg-white rounded-2xl border-2 border-dashed border-gray-200">
                        <div className="bg-gray-50 p-4 rounded-full mb-4">
                            <ArchiveIcon className="w-10 h-10 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900">No schedules found</h3>
                        <p className="mt-1 text-gray-500 max-w-sm">
                            You haven't published any work schedules yet. Click below to create your first one.
                        </p>
                        <button
                            onClick={() => navigate('/admin/schedule')}
                            className="mt-6 flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            <PlusIcon className="w-4 h-4" />
                            Create Schedule
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ScheduleHistory;