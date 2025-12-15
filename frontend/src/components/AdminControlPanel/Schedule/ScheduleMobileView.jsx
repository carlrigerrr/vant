import React, { useState } from 'react';
import EditShiftModal from './EditShiftModal';

export default function ScheduleMobileView({ table, datesArr, formatDay, days }) {
  const [editingShift, setEditingShift] = useState(null);
  const [editingDayIndex, setEditingDayIndex] = useState(null);

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  
  // Extract setters safely from the 'days' prop object
  const daySetters = days ? [
      days.setSunday, 
      days.setMonday, 
      days.setTuesday, 
      days.setWednesday, 
      days.setThursday, 
      days.setFriday
  ] : [];
  
  const dayData = days ? [days.sunday, days.monday, days.tuesday, days.wednesday, days.thursday, days.friday] : [];

  const getShiftStyles = (type) => {
    const styles = {
      morning: {
        bg: 'bg-emerald-50',
        border: 'border-l-emerald-500',
        avatar: 'bg-emerald-200 text-emerald-800',
        text: 'text-emerald-900'
      },
      mid: {
        bg: 'bg-sky-50',
        border: 'border-l-sky-500',
        avatar: 'bg-sky-200 text-sky-800',
        text: 'text-sky-900'
      },
      evening: {
        bg: 'bg-violet-50',
        border: 'border-l-violet-500',
        avatar: 'bg-violet-200 text-violet-800',
        text: 'text-violet-900'
      },
      custom: {
        bg: 'bg-orange-50',
        border: 'border-l-orange-500',
        avatar: 'bg-orange-200 text-orange-800',
        text: 'text-orange-900'
      }
    };
    return styles[type] || styles.morning;
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name
        .split(' ')
        .map(word => word[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
  };

  const handleUpdateShift = (dayIndex, shiftId, updatedData) => {
    const setter = daySetters[dayIndex];
    setter(prev => prev.map(shift =>
      shift.id === shiftId
        ? { ...shift, ...updatedData }
        : shift
    ));
  };

  if (!table || dayData.length === 0) {
    return (
      <div className="md:hidden w-full px-4 mt-5">
        <h3 className="text-center text-lg text-gray-600">Click "Create Schedule" to create a new work schedule.</h3>
      </div>
    );
  }

  return (
    <div className="md:hidden w-full px-4 mt-5 mb-20">
      <div className="space-y-4">
        {datesArr && datesArr.map((date, dayIndex) => {
          const day = dayData[dayIndex] || [];

          return (
            <div key={dayIndex} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              {/* Day Header */}
              <div className="bg-gray-50 px-4 py-3 border-b border-gray-100 flex justify-between items-center">
                <h3 className="font-bold text-gray-800 text-sm uppercase tracking-wide">{dayNames[dayIndex]}</h3>
                <span className="text-xs font-semibold px-2.5 py-1 bg-white rounded-md border border-gray-200 text-gray-600 shadow-sm">
                    {formatDay(date)}
                </span>
              </div>

              {/* Shifts Grid */}
              <div className="p-3 grid grid-cols-2 gap-2">
                {day.length === 0 ? (
                  <p className="col-span-2 text-gray-400 italic text-center text-xs py-3">No shifts assigned</p>
                ) : (
                  day.map((shift) => {
                    const styles = getShiftStyles(shift.shiftType || 'morning');
                    return (
                      <div
                        key={shift.id}
                        onClick={() => {
                            setEditingShift(shift);
                            setEditingDayIndex(dayIndex);
                        }}
                        className={`relative rounded-md border-l-[3px] px-2 py-2 transition-all active:scale-95 flex items-center gap-2.5 ${styles.bg} ${styles.border}`}
                      >
                        {/* Avatar */}
                        <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-bold shadow-sm ${styles.avatar}`}>
                            {getInitials(shift.employeeName || shift.username)}
                        </div>

                        {/* Info Stack */}
                        <div className="min-w-0 flex-1 flex flex-col justify-center">
                            <div className={`text-[10px] font-bold ${styles.text} leading-none mb-1`}>
                                {shift.startTime} - {shift.endTime}
                            </div>
                            <div className="text-xs font-bold text-gray-900 truncate leading-none">
                                {shift.employeeName || shift.username}
                            </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit Modal */}
      <EditShiftModal 
        shift={editingShift}
        isOpen={!!editingShift}
        onClose={() => {
            setEditingShift(null);
            setEditingDayIndex(null);
        }}
        onSave={(shiftId, data) => {
            if (editingDayIndex !== null) {
                handleUpdateShift(editingDayIndex, shiftId, data);
            }
        }}
      />
    </div>
  );
}