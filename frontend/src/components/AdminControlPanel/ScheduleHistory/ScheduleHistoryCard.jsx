import React from 'react';
import { CalendarIcon, ClockIcon, UserIcon, PencilIcon, TrashIcon, EyeIcon } from '@heroicons/react/outline';
import { format } from 'date-fns';

const ScheduleHistoryCard = ({ shift, index, onEdit, onDelete, onView }) => {
    const date = new Date(Date.parse(shift.date));
    const publishTime = format(date, 'HH:mm, dd MMM yyyy');

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition-all duration-200 flex flex-col h-full">
            {/* Header */}
            <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                    <div className="bg-blue-50 text-blue-600 w-10 h-10 rounded-lg flex items-center justify-center font-bold text-lg shadow-sm">
                        #{index}
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-900 text-sm line-clamp-1" title={shift.name}>
                            {shift.name || `Schedule #${index}`}
                        </h3>
                        <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                            <CalendarIcon className="w-3 h-3" />
                            Week {format(date, 'w')}
                        </p>
                    </div>
                </div>
            </div>

            {/* Details */}
            <div className="space-y-3 flex-1">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                    <ClockIcon className="w-4 h-4 text-gray-400" />
                    <span>Published: <span className="font-medium text-gray-900">{publishTime}</span></span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                    <UserIcon className="w-4 h-4 text-gray-400" />
                    <span>By: <span className="font-medium text-gray-900">{shift.savedBy}</span></span>
                </div>
            </div>

            {/* Actions Footer */}
            <div className="mt-5 pt-4 border-t border-gray-100 flex items-center gap-2">
                <button
                    onClick={() => onView(shift)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-gray-50 text-gray-700 text-xs font-medium hover:bg-gray-100 transition-colors"
                >
                    <EyeIcon className="w-3.5 h-3.5" /> View
                </button>
                
                {/* Edit Button */}
                <button
                    onClick={() => onEdit(shift)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-blue-50 text-blue-700 text-xs font-medium hover:bg-blue-100 transition-colors"
                >
                    <PencilIcon className="w-3.5 h-3.5" /> Edit
                </button>

                {/* Delete Button */}
                <button
                    onClick={() => onDelete(shift._id)}
                    className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                    title="Delete Schedule"
                >
                    <TrashIcon className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
};

export default ScheduleHistoryCard;
