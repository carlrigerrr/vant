import React, { useState } from 'react';
import { closestCenter, DndContext, PointerSensor, useSensor } from '@dnd-kit/core';
import { arrayMove, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import ShiftCard from './ShiftCard';
import EditShiftModal from './EditShiftModal';

export default function ScheduleDesktopView({
  table,
  setTable,
  datesArr,
  sunday,
  setSunday,
  monday,
  setMonday,
  tuesday,
  setTuesday,
  wednesday,
  setWednesday,
  thursday,
  setThursday,
  friday,
  setFriday,
  allUsers = [],
}) {
  const sensors = [
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
  ];
  const [showAddDropdown, setShowAddDropdown] = useState(null);
  const [editingShift, setEditingShift] = useState(null);
  const [editingDayIndex, setEditingDayIndex] = useState(null);

  const daySetters = [setSunday, setMonday, setTuesday, setWednesday, setThursday, setFriday];
  const days = [sunday, monday, tuesday, wednesday, thursday, friday];

  // Detect time conflicts for an employee across all days
  const detectConflicts = (employeeId, currentDayIndex) => {
    const conflicts = [];
    days.forEach((day, dayIndex) => {
      if (!day) return;
      const employeeShifts = day.filter(shift =>
        shift._id === employeeId || shift.employeeId === employeeId
      );

      if (employeeShifts.length > 1) {
        conflicts.push({
          dayIndex,
          type: 'multiple',
          message: `Multiple shifts on same day`
        });
      }

      // Check for back-to-back shifts (if next day has shift starting early)
      if (dayIndex < 5 && days[dayIndex + 1]) {
        const nextDayShift = days[dayIndex + 1].find(s =>
          (s._id === employeeId || s.employeeId === employeeId)
        );
        const currentLastShift = employeeShifts[employeeShifts.length - 1];

        if (currentLastShift && nextDayShift) {
          const endTime = currentLastShift.endTime || '12:00';
          const nextStartTime = nextDayShift.startTime || '08:00';

          if (endTime >= '20:00' && nextStartTime <= '08:00') {
            conflicts.push({
              dayIndex,
              type: 'back-to-back',
              message: `Late shift followed by early shift next day`
            });
          }
        }
      }
    });

    return conflicts;
  };

  const getShiftConflictInfo = (shift, dayIndex) => {
    const conflicts = detectConflicts(shift._id || shift.employeeId, dayIndex);
    const dayConflicts = conflicts.filter(c => c.dayIndex === dayIndex);

    if (dayConflicts.length > 0) {
      return {
        hasConflict: true,
        message: dayConflicts.map(c => c.message).join('; ')
      };
    }
    return { hasConflict: false, message: '' };
  };

  const handleUpdateShift = (dayIndex, shiftId, updatedData) => {
    const setter = daySetters[dayIndex];
    setter(prev => prev.map(shift =>
      shift.id === shiftId
        ? { ...shift, ...updatedData }
        : shift
    ));
  };

  const handleRemoveShift = (dayIndex, shiftId) => {
    const setter = daySetters[dayIndex];
    setter(prev => prev.filter(shift => shift.id !== shiftId));
  };

  const handleDuplicateShift = (dayIndex, shift) => {
    const setter = daySetters[dayIndex];
    const newId = `${dayIndex}-${Date.now()}`;
    setter(prev => [...prev, {
      ...shift,
      id: newId,
      notes: shift.notes ? `${shift.notes} (Copy)` : '(Copy)'
    }]);
  };

  const handleAddUser = (dayIndex, user) => {
    const setter = daySetters[dayIndex];
    const newId = `${dayIndex}-${Date.now()}`;

    // Determine default shift type based on position
    const currentDayLength = days[dayIndex]?.length || 0;
    let defaultShiftType = 'morning';
    let defaultStartTime = '08:00';
    let defaultEndTime = '12:00';

    if (currentDayLength >= 2) {
      defaultShiftType = 'mid';
      defaultStartTime = '12:00';
      defaultEndTime = '16:00';
    }
    if (currentDayLength >= 4) {
      defaultShiftType = 'evening';
      defaultStartTime = '16:00';
      defaultEndTime = '20:00';
    }

    setter(prev => [...prev, {
      ...user,
      id: newId,
      employeeId: user._id,
      employeeName: user.username,
      shiftType: defaultShiftType,
      startTime: defaultStartTime,
      endTime: defaultEndTime,
      clientId: '',
      clientName: '',
      notes: '',
      status: 'scheduled'
    }]);
    setShowAddDropdown(null);
  };

  const getAvailableUsers = (dayIndex) => {
    if (!allUsers) return []; // Guard against null users
    const currentDay = days[dayIndex] || [];
    const assignedUserIds = currentDay.map(emp => emp._id || emp.employeeId);
    return allUsers.filter(user => !assignedUserIds.includes(user._id) && !user.admin);
  };

  const handleDragEnd = ({ active, over }) => {
    if (!over || active.id === over.id) return;

    const dayIndex = parseInt(active.id.slice(0, 1));
    if (dayIndex >= 0 && dayIndex <= 5) {
      const day = days[dayIndex];
      const setter = daySetters[dayIndex];
      const oldIndex = day.findIndex((emp) => emp.id === active.id);
      const newIndex = day.findIndex((emp) => emp.id === over.id);
      setter(arrayMove(day, oldIndex, newIndex));
    }
  };

  const renderDay = (dayIndex) => {
    const day = days[dayIndex] || [];
    const availableUsers = getAvailableUsers(dayIndex);

    return (
      <div key={`column-${dayIndex}`} className="flex flex-col h-full bg-gray-50/30 rounded-lg border border-gray-200/60 hover:border-gray-300 transition-colors duration-200">
        <div className="flex-1 p-2 space-y-2">
          <SortableContext
            items={day.map((shift) => shift.id)}
            strategy={verticalListSortingStrategy}
            key={`sortable-context-${dayIndex}`}
          >
            {day.length === 0 ? (
              <div className="h-32 flex flex-col items-center justify-center border-2 border-dashed border-gray-100 rounded-lg transition-colors hover:border-gray-200 group">
                <div className="p-3 rounded-full bg-gray-50 group-hover:bg-white transition-colors">
                  <span className="text-xl text-gray-300 group-hover:text-gray-400">📅</span>
                </div>
                <p className="text-xs font-medium text-gray-400 mt-2">No Shifts</p>
              </div>
            ) : (
              day.map((shift) => {
                const conflictInfo = getShiftConflictInfo(shift, dayIndex);
                return (
                  <ShiftCard
                    key={shift.id}
                    shift={shift}
                    onEdit={(shift) => {
                      setEditingShift(shift);
                      setEditingDayIndex(dayIndex);
                    }}
                    onRemove={(shiftId) => handleRemoveShift(dayIndex, shiftId)}
                    onDuplicate={(shiftData) => handleDuplicateShift(dayIndex, shiftData)}
                    hasConflict={conflictInfo.hasConflict}
                    conflictMessage={conflictInfo.message}
                  />
                );
              })
            )}
          </SortableContext>
        </div>

        {/* Add Shift Button Footer */}
        <div className="p-2 pt-0 border-t border-transparent hover:border-gray-100 transition-colors">
          {showAddDropdown === dayIndex ? (
            <div className="bg-white border border-blue-200 rounded-lg shadow-sm p-3 animate-in fade-in zoom-in duration-200">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-2">
                Assign Employee
              </label>
              <select
                className="w-full p-2 bg-gray-50 border border-gray-200 rounded text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow"
                onChange={(e) => {
                  if (e.target.value && allUsers) {
                    const user = allUsers.find(u => u._id === e.target.value);
                    if (user) handleAddUser(dayIndex, user);
                  }
                }}
                defaultValue=""
                autoFocus
              >
                <option value="">Select employee...</option>
                {availableUsers.length === 0 ? (
                  <option disabled>All employees assigned</option>
                ) : (
                  availableUsers.map(user => (
                    <option key={user._id} value={user._id}>
                      {user.username}
                    </option>
                  ))
                )}
              </select>
              <button
                onClick={() => setShowAddDropdown(null)}
                className="w-full mt-2 text-xs text-gray-500 hover:text-gray-800 hover:bg-gray-50 py-1.5 rounded transition-colors"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowAddDropdown(dayIndex)}
              className="group w-full py-2 flex items-center justify-center gap-2 text-xs font-medium text-gray-400 hover:text-blue-600 hover:bg-blue-50/50 rounded-md transition-all duration-200 border border-transparent hover:border-blue-100/50 dashed"
            >
              <span className="w-5 h-5 flex items-center justify-center rounded-full bg-gray-100 group-hover:bg-blue-100 text-gray-500 group-hover:text-blue-600 transition-colors">
                +
              </span>
              Add Shift
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="grid grid-cols-6 gap-4">
        {table && (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
            key="dnd-context-0"
          >
            {[0, 1, 2, 3, 4, 5].map((dayIndex) => renderDay(dayIndex))}
          </DndContext>
        )}
      </div>

      <EditShiftModal
        shift={editingShift}
        isOpen={!!editingShift}
        shiftDate={editingDayIndex !== null && datesArr ? datesArr[editingDayIndex] : null}
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

    </>
  );
}
