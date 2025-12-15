import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { XIcon } from '@heroicons/react/outline';
import { format, isToday, isBefore, parse } from 'date-fns';

const EditShiftModal = ({ shift, isOpen, onClose, onSave, shiftDate }) => {
    const [clients, setClients] = useState([]);
    const [editData, setEditData] = useState({
        clientId: '',
        startTime: '08:00',
        endTime: '12:00',
        notes: '',
        shiftType: 'morning'
    });
    const [timeWarning, setTimeWarning] = useState('');

    useEffect(() => {
        if (shift) {
            setEditData({
                clientId: shift.clientId || '',
                startTime: shift.startTime || '08:00',
                endTime: shift.endTime || '12:00',
                notes: shift.notes || '',
                shiftType: shift.shiftType || 'morning'
            });
        }
    }, [shift]);

    useEffect(() => {
        if (isOpen) {
            fetchClients();
        }
    }, [isOpen]);

    // Validate time when it changes
    useEffect(() => {
        if (shiftDate && isToday(shiftDate)) {
            const now = new Date();
            const currentTime = format(now, 'HH:mm');

            if (editData.startTime < currentTime) {
                setTimeWarning(`⚠️ ${editData.startTime} has already passed today (current time: ${currentTime})`);
            } else {
                setTimeWarning('');
            }
        } else {
            setTimeWarning('');
        }
    }, [editData.startTime, shiftDate]);

    const fetchClients = async () => {
        try {
            const response = await axios.get('/api/clients');
            setClients(response.data);
        } catch (error) {
            console.error('Error fetching clients:', error);
        }
    };

    const handleSave = () => {
        const selectedClient = clients.find(c => c._id === editData.clientId);
        onSave(shift.id, {
            ...editData,
            clientName: selectedClient?.name || '',
            clientPriority: selectedClient?.priority || 'regular'
        });
        onClose();
    };

    // Get minimum time for today
    const getMinTime = () => {
        if (shiftDate && isToday(shiftDate)) {
            const now = new Date();
            // Round up to next 15 minutes
            const minutes = Math.ceil(now.getMinutes() / 15) * 15;
            now.setMinutes(minutes);
            return format(now, 'HH:mm');
        }
        return undefined;
    };

    if (!isOpen || !shift) return null;

    const minTime = getMinTime();

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto overflow-x-hidden bg-black/50 backdrop-blur-sm p-4 md:p-0">
            <div className="relative w-full max-w-md rounded-xl bg-white shadow-2xl ring-1 ring-black/5 transition-all transform animate-in fade-in zoom-in duration-200">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900">Edit Shift</h3>
                        <p className="text-sm text-gray-500">
                            Editing for <span className="font-medium text-gray-900">{shift.employeeName || shift.username}</span>
                            {shiftDate && (
                                <span className="ml-1 text-blue-600">• {format(shiftDate, 'EEE, d MMM')}</span>
                            )}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-500 transition-colors"
                    >
                        <XIcon className="h-5 w-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="px-5 py-5 space-y-4">
                    {/* Time Warning */}
                    {timeWarning && (
                        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
                            {timeWarning}
                        </div>
                    )}

                    {/* Time Range */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Start Time</label>
                            <input
                                type="time"
                                value={editData.startTime}
                                min={minTime}
                                onChange={(e) => setEditData({ ...editData, startTime: e.target.value })}
                                className={`w-full rounded-lg border-gray-300 bg-gray-50 px-3 py-2 text-sm focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-500 outline-none border transition-colors ${timeWarning ? 'border-yellow-400' : ''}`}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">End Time</label>
                            <input
                                type="time"
                                value={editData.endTime}
                                onChange={(e) => setEditData({ ...editData, endTime: e.target.value })}
                                className="w-full rounded-lg border-gray-300 bg-gray-50 px-3 py-2 text-sm focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-500 outline-none border transition-colors"
                            />
                        </div>
                    </div>

                    {/* Shift Type */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Shift Type</label>
                        <select
                            value={editData.shiftType}
                            onChange={(e) => setEditData({ ...editData, shiftType: e.target.value })}
                            className="w-full rounded-lg border-gray-300 bg-gray-50 px-3 py-2 text-sm focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-500 outline-none border transition-colors appearance-none"
                        >
                            <option value="morning">🌅 Morning (08:00 - 12:00)</option>
                            <option value="mid">🌆 Mid Day (12:00 - 16:00)</option>
                            <option value="evening">🌙 Evening (16:00 - 20:00)</option>
                            <option value="custom">⚙️ Custom</option>
                        </select>
                    </div>

                    {/* Client */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Client Assignment</label>
                        <select
                            value={editData.clientId}
                            onChange={(e) => setEditData({ ...editData, clientId: e.target.value })}
                            className="w-full rounded-lg border-gray-300 bg-gray-50 px-3 py-2 text-sm focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-500 outline-none border transition-colors appearance-none"
                        >
                            <option value="">-- No Client Assigned --</option>
                            {clients.map(client => (
                                <option key={client._id} value={client._id}>
                                    {client.name} {client.priority === 'vip' ? '⭐' : client.priority === 'new' ? '🆕' : ''}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Notes */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Notes & Instructions</label>
                        <textarea
                            value={editData.notes}
                            onChange={(e) => setEditData({ ...editData, notes: e.target.value })}
                            rows="3"
                            placeholder="Add any special instructions for this shift..."
                            className="w-full rounded-lg border-gray-300 bg-gray-50 px-3 py-2 text-sm focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-500 outline-none border transition-colors resize-none"
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 bg-gray-50 px-5 py-4 rounded-b-xl border-t border-gray-100">
                    <button
                        onClick={onClose}
                        className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-200 hover:text-gray-800 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        className="rounded-lg bg-blue-600 px-6 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 hover:shadow-md transition-all focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    >
                        Save Changes
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EditShiftModal;
