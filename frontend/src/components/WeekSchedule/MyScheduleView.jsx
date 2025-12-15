import React from 'react';
import { format } from 'date-fns';
import enUS from 'date-fns/locale/en-US';
import MyScheduleCard from './MyScheduleCard';
import { CalendarIcon } from '@heroicons/react/outline';

const MyScheduleView = ({ table, datesArr, user }) => {
    // Flatten and filter schedule to find user's shifts
    const myShifts = [];

    if (table && datesArr) {
        // Check if this is the NEW shifts format (flat array with employeeId) or LEGACY format (nested arrays)
        const isNewFormat = table.length > 0 && table[0] && (table[0].employeeId || table[0].employeeName);

        // DEBUG: Log what we're working with
        console.log('=== MyScheduleView Debug ===');
        console.log('User:', { id: user.id, username: user.username });
        console.log('Table format:', isNewFormat ? 'NEW (flat shifts array)' : 'LEGACY (nested arrays)');
        console.log('Table data:', table);
        console.log('Dates array length:', datesArr.length);

        if (isNewFormat) {
            // NEW FORMAT: shifts is a flat array of all shift assignments
            // Group by day index (id format: "dayIndex-shiftIndex" or just iterate)
            table.forEach((shift) => {
                // Check if this shift belongs to the current user
                const isMyShift =
                    (shift.employeeId && shift.employeeId.toString() === user.id) ||
                    (shift.employeeName && shift.employeeName === user.username) ||
                    (shift.username && shift.username === user.username) ||
                    (shift._id && shift._id.toString() === user.id);

                if (isMyShift && datesArr.length > 0) {
                    // Extract day index from shift.id if available (format: "0-0", "1-0", etc.)
                    let dayIndex = 0;
                    if (shift.id && typeof shift.id === 'string' && shift.id.includes('-')) {
                        dayIndex = parseInt(shift.id.split('-')[0]) || 0;
                    }

                    // Make sure dayIndex is within bounds
                    if (dayIndex >= 0 && dayIndex < datesArr.length) {
                        console.log('Found my shift:', {
                            clientName: shift.clientName,
                            clientAddress: shift.clientAddress,
                            clientLocation: shift.clientLocation,
                            hasCoords: !!(shift.clientLocation?.coordinates?.lat)
                        });
                        myShifts.push({
                            ...shift,
                            dateObject: datesArr[dayIndex],
                            formattedDate: format(datesArr[dayIndex], 'EEEE, d MMMM yyyy', { locale: enUS })
                        });
                    }
                }

            });
        } else {
            // LEGACY FORMAT: table is array of 6 days, each day is array of employees
            table.forEach((dayShifts, dayIndex) => {
                if (Array.isArray(dayShifts)) {
                    const userShift = dayShifts.find(
                        shift => shift.username === user.username ||
                            shift.employeeId === user.id ||
                            (shift._id && shift._id.toString() === user.id)
                    );

                    if (userShift) {
                        myShifts.push({
                            ...userShift,
                            dateObject: datesArr[dayIndex],
                            formattedDate: format(datesArr[dayIndex], 'EEEE, d MMMM yyyy', { locale: enUS })
                        });
                    }
                }
            });
        }
    }


    if (myShifts.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                <div className="bg-gray-50 p-4 rounded-full mb-4">
                    <CalendarIcon className="w-12 h-12 text-gray-300" />
                </div>
                <h3 className="text-lg font-medium text-gray-900">No shifts assigned this week</h3>
                <p className="text-gray-500 mt-1 max-w-sm">
                    You haven't been assigned any shifts for the selected week. Enjoy your time off!
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-4 max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
            {myShifts.map((shift, index) => (
                <MyScheduleCard
                    key={`${shift.dateObject}-${index}`}
                    shift={shift}
                    date={shift.formattedDate}
                />
            ))}
        </div>
    );
};

export default MyScheduleView;
