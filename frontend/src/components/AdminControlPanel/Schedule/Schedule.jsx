import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom'; // Added useLocation
import axios from 'axios';
import { format, addDays, eachDayOfInterval, nextSunday, isFriday, parseISO } from 'date-fns';
import enUS from 'date-fns/locale/en-US';
import chunk from 'lodash/chunk';
import sampleSize from 'lodash/sampleSize';
import ScheduleDesktopView from './ScheduleDesktopView';
import ScheduleMobileView from './ScheduleMobileView';
import { useUserContext } from '../../useUserContext';
import { useUsersContext } from '../useUsersContext';
import _ from 'lodash';
import Msg from './../../general/Msg';
import Swal from 'sweetalert2';
import { Alert } from '@mantine/core';
import { FiAlertCircle } from 'react-icons/fi';

const Schedule = () => {
  const { user } = useUserContext();
  const { users, refreshAllUsers } = useUsersContext();
  const [status, setStatus] = useState(null);
  const [button, setButton] = useState(true);
  const location = useLocation(); // Access location for edit state

  // const [employees, setEmployees] = useState(null);
  const [datesArr, setDatesArr] = useState(null);
  const [table, setTable] = useState(null);
  const [sunday, setSunday] = useState(null);
  const [monday, setMonday] = useState(null);
  const [tuesday, setTuesday] = useState(null);
  const [wednesday, setWednesday] = useState(null);
  const [thursday, setThursday] = useState(null);
  const [friday, setFriday] = useState(null);
  const [overworkedEmployees, setOverworkedEmployees] = useState([]);
  const [shiftStats, setShiftStats] = useState([]);
  const [editingId, setEditingId] = useState(null); // Track ID if editing

  // Detect overworked employees (>5 shifts per week) and calculate shift fairness
  const detectOverwork = () => {
    if (!sunday || !monday || !tuesday || !wednesday || !thursday || !friday) return;

    const allDays = [sunday, monday, tuesday, wednesday, thursday, friday];
    const shiftCount = {};

    allDays.forEach(day => {
      if (Array.isArray(day)) {
        day.forEach(emp => {
          if (emp && emp.username) {
            shiftCount[emp.username] = (shiftCount[emp.username] || 0) + 1;
          }
        });
      }
    });

    const overworked = Object.entries(shiftCount)
      .filter(([_, count]) => count > 5)
      .map(([name, count]) => ({ name, count }));

    setOverworkedEmployees(overworked);

    // Calculate fairness stats for all employees
    const stats = Object.entries(shiftCount)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    setShiftStats(stats);
  };

  // Run overwork detection when schedule changes
  useEffect(() => {
    detectOverwork();
  }, [sunday, monday, tuesday, wednesday, thursday, friday]);

  useEffect(() => {
    refreshAllUsers();

    // Check for edit state passed from ScheduleHistory
    if (location.state && location.state.editSchedule) {
      const { editSchedule } = location.state;

      // Populate table from existing schedule
      // editSchedule.data is the array of days
      const scheduleData = editSchedule.data;
      setTable(scheduleData);

      // Set days
      setSunday(scheduleData[0]);
      setMonday(scheduleData[1]);
      setTuesday(scheduleData[2]);
      setWednesday(scheduleData[3]);
      setThursday(scheduleData[4]);
      setFriday(scheduleData[5]);

      // Use the saved startDate if available, otherwise fall back to calculation
      let historyStart;
      if (editSchedule.startDate) {
        historyStart = new Date(editSchedule.startDate);
      } else {
        // Legacy fallback for schedules without startDate
        historyStart = new Date(editSchedule.date);
      }
      const historyEnd = addDays(historyStart, 5);
      setDatesArr(eachDayOfInterval({ start: historyStart, end: historyEnd }));

      setEditingId(editSchedule._id); // Enable Edit Mode
    } else {
      // Start from TODAY - gives flexibility to schedule for current day
      const currentDate = new Date();
      const end = addDays(currentDate, 5); // 6 days including today
      setDatesArr(eachDayOfInterval({ start: currentDate, end }));
    }
  }, [location.state]); // Add location.state dependency

  const handleSubmit = (e) => {
    e.preventDefault();
  };

  const handleSchedule = async (e) => {
    e.preventDefault();
    setEditingId(null); // Reset edit mode if creating new
    // refreshAllUsers();

    // Remove unnecessary properties & admins from the users object
    const employees = Object.assign([], users);
    employees.forEach((employee, index) => {
      delete employee.hash;
      delete employee.salt;
      if (employee.admin) {
        employees.splice(index, 1);
      }
    });

    const schedule = [];

    for (let i = 0; i < datesArr.length; i++) {
      const morningShift = _.shuffle([...employees]);
      const formattedDate = format(datesArr[i], 'dd-MM-yyyy');

      morningShift.forEach((employee) => {
        employee.blockedDates.forEach((blockedDate) => {
          if (blockedDate.date === formattedDate && blockedDate.approved) {
            morningShift.splice(morningShift.indexOf(employee), 1);
            console.log(`Removed ${employee.username} from ${formattedDate}`);
          }
        });
      });

      const luckyEmployees = sampleSize(morningShift, 4);

      luckyEmployees.forEach((employee) => {
        const index = morningShift.indexOf(employee);
        morningShift.splice(index, 1);
      });

      const employeeSplit = chunk(luckyEmployees, 2);

      const [middleShift = [], eveningShift = []] = employeeSplit;

      let newShift = [];
      if (!isFriday(datesArr[i])) {
        newShift = [...morningShift, ...middleShift, ...eveningShift];
      } else {
        const fridayShift = _.sample(morningShift);
        newShift = [fridayShift];
      }
      schedule[i] = newShift;
    }

    const scheduleUID = schedule.map((day, dayIndex) =>
      day.map((employeeData, employeeIndex) => {
        return { ...employeeData, id: `${dayIndex}-${employeeIndex}` };
      })
    );
    setTable(scheduleUID);

    setSunday(scheduleUID[0]);
    setMonday(scheduleUID[1]);
    setTuesday(scheduleUID[2]);
    setWednesday(scheduleUID[3]);
    setThursday(scheduleUID[4]);
    setFriday(scheduleUID[5]);
  };

  const uploadSchedule = async (e) => {
    e.preventDefault();
    setButton(false);
    setTimeout(() => {
      setButton(true);
    }, 3000);

    const savedSchedule = [sunday, monday, tuesday, wednesday, thursday, friday];
    const savedBy = user.username;

    // Implement warnings if someone has bad shifts
    const badShifts = [];
    savedSchedule.map((day, dayIndex) => {
      if (dayIndex < 5) {
        day.map((user, userIndex) => {
          if (day.length - 4 <= userIndex) {
            badShifts.push(user);
          }
        });
      }
    });
    console.log(badShifts);
    const sortedBadShifts = chunk(badShifts, 4);

    let middleShift = [];
    let eveningShift = [];
    sortedBadShifts.map((day) => {
      day.map((user, userIndex) => {
        if (userIndex < 2) {
          // if middle
          middleShift.push(user.username);
        } else if (userIndex >= 2) {
          // if evening
          eveningShift.push(user.username);
        }
      });
    });

    const findBadShifts = (shiftArray) => {
      let users = [];
      [...new Set(shiftArray)].forEach((person) => {
        let count = shiftArray.filter((x) => x === person).length;
        if (count > 1) {
          users.push(person);
        }
      });
      return users || null;
    };

    const warnMiddle = findBadShifts(middleShift);
    const warnEvening = findBadShifts(eveningShift);
    console.log(warnMiddle, warnEvening);

    const handleWarningText = () => {
      let text = ``;

      if (warnMiddle.length > 0) {
        text += `<div class="mb-3"><p class="font-medium">Two or more mid shifts:</p>${warnMiddle
          .map((e) => e)
          .join(', ')}</div>`;
      }
      if (warnEvening.length > 0) {
        text += `<div class="mb-3"><p class="font-medium">Two or more evening shifts:</p>${warnEvening
          .map((e) => e)
          .join(', ')}</div>`;
      }
      text += `<div class="flex-grow border-t my-2 border-gray-200"><p border-t border-gray-400></div>Continue?</p>`;
      return text || null;
    };

    const saveToBackend = async () => {
      const payload = {
        savedSchedule,
        savedBy,
        startDate: datesArr && datesArr[0] ? datesArr[0].toISOString() : new Date().toISOString()
      };
      if (editingId) {
        payload._id = editingId; // Pass ID for updates
      }

      const response = await axios.post('/postSchedule', payload);
      if (response.data === 'Success') {
        const successMsg = editingId ? 'Schedule updated successfully!' : 'Schedule uploaded successfully!';
        Swal.fire(
          successMsg,
          'Everyone can now see the schedule on the home page.',
          'success'
        );
        if (editingId) {
          // Optional: Navigate back to history after edit
          // navigate('/admin/schedule-history');
        }
      } else if (response.data === 'Error') {
        setStatus({
          OK: false,
          bolded: 'Error!',
          msg: 'Schedule not uploaded',
        });
      }
    };

    if (warnMiddle.length > 0 || warnEvening.length > 0) {
      Swal.fire({
        html: handleWarningText(),
        title: 'Warning!',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        cancelButtonText: 'Cancel',
        confirmButtonText: 'Confirm, shifts are correct',
      }).then((result) => {
        if (result.isConfirmed) {
          saveToBackend();
        } else {
          setButton(true);
        }
      });
    }

    if (warnMiddle.length === 0 && warnEvening.length === 0) {
      saveToBackend();
    }
  };

  const reHandleSchedule = (e) => {
    Swal.fire({
      title: 'Continue?',
      text: 'All changes will be lost and cannot be restored!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      cancelButtonText: 'Cancel',
      confirmButtonText: 'Re-create Schedule',
    }).then((result) => {
      if (result.isConfirmed) {
        handleSchedule(e);
      }
    });
  };

  const formatDay = (date) => {
    return format(date, 'd LLLL', { locale: enUS });
  };

  const days = {
    sunday,
    monday,
    tuesday,
    wednesday,
    thursday,
    friday,
    setSunday,
    setMonday,
    setTuesday,
    setWednesday,
    setThursday,
    setFriday,
  };

  return (
    <>
      <div>
        <div className="grid mt-5 place-items-center">
          <div className="flex justify-between w-11/12 lg:w-4/6 flex-end">
            <div>
              <h1 className="text-3xl font-semibold">
                {editingId ? 'Edit Work Schedule' : 'Create New Work Schedule'}
              </h1>
              {editingId && (
                <p className="text-sm text-blue-600 font-medium mt-1">
                  ✏️ You are editing an existing schedule. Changes will be visible to employees immediately.
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center px-4 md:px-0">
          {users && users.length <= 6 && (
            <div className="w-full md:w-5/6 lg:w-4/6 mt-5">
              <Alert icon={<FiAlertCircle />} title="Warning" color="yellow">
                <p>Few registered users detected.</p>
                <p>
                  With fewer than 4 users (non-admins), automatic schedule generation will not work properly.
                </p>
              </Alert>
            </div>
          )}

          {/* Overwork Alert */}
          {overworkedEmployees.length > 0 && (
            <div className="w-full md:w-5/6 lg:w-4/6 mt-3">
              <Alert icon={<FiAlertCircle />} title="⚠️ Overwork Alert" color="red">
                <p className="font-medium">The following employees are scheduled more than 5 times:</p>
                <ul className="mt-1">
                  {overworkedEmployees.map(emp => (
                    <li key={emp.name}>• {emp.name}: <strong>{emp.count} shifts</strong></li>
                  ))}
                </ul>
                <p className="mt-2 text-sm">Consider redistributing shifts to prevent burnout.</p>
              </Alert>
            </div>
          )}
          <div className="hidden w-full mt-10 md:block md:w-5/6 lg:w-4/6">
            {table ? (
              <div className="mb-4">
                <div className="grid grid-cols-6 gap-4">
                  {[0, 1, 2, 3, 4, 5].map((index) => (
                    <div key={index} className="text-center">
                      <span className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                        {format(datesArr[index], 'EEEE', { locale: enUS })}
                      </span>
                      <div className="inline-block px-3 py-1 bg-white rounded-full shadow-sm border border-gray-100 text-sm font-semibold text-gray-700">
                        {format(datesArr[index], 'd MMM', { locale: enUS })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <h3 className="text-lg text-center">Click "Create Schedule" to create a new work schedule.</h3>
            )}

            <ScheduleDesktopView table={table} setTable={setTable} datesArr={datesArr} allUsers={users} {...days} />
          </div>

          {/* Mobile View */}
          <ScheduleMobileView
            table={table}
            datesArr={datesArr}
            formatDay={formatDay}
            days={days}
          />

          {/* Shift Fairness Summary */}
          {table && shiftStats.length > 0 && (
            <div className="w-full md:w-5/6 lg:w-4/6 mt-6 mx-auto">
              <div className="bg-white rounded-lg shadow p-4">
                <h3 className="text-lg font-semibold mb-3">📊 Shift Distribution Summary</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {shiftStats.map(emp => {
                    const maxShifts = Math.max(...shiftStats.map(s => s.count));
                    const minShifts = Math.min(...shiftStats.map(s => s.count));
                    const diff = maxShifts - minShifts;

                    // Color coding: Red for overworked, Yellow for high, Green for balanced
                    let bgColor = 'bg-green-100 border-green-300';
                    let textColor = 'text-green-700';
                    if (emp.count > 5) {
                      bgColor = 'bg-red-100 border-red-300';
                      textColor = 'text-red-700';
                    } else if (emp.count === maxShifts && diff > 2) {
                      bgColor = 'bg-yellow-100 border-yellow-300';
                      textColor = 'text-yellow-700';
                    } else if (emp.count === minShifts && diff > 2) {
                      bgColor = 'bg-blue-100 border-blue-300';
                      textColor = 'text-blue-700';
                    }

                    return (
                      <div key={emp.name} className={`${bgColor} border rounded-lg p-3 text-center`}>
                        <p className={`font-medium ${textColor}`}>{emp.name}</p>
                        <p className={`text-2xl font-bold ${textColor}`}>{emp.count}</p>
                        <p className="text-xs text-gray-500">shifts</p>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-3 text-xs text-gray-500 flex flex-wrap gap-2 md:gap-4 justify-center">
                  <span>🟢 Balanced</span>
                  <span>🟡 High</span>
                  <span>🔴 Overworked</span>
                  <span>🔵 Low</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="flex justify-center my-5">
          {!table && (
            <button
              onClick={handleSchedule}
              className="px-4 py-3 text-lg font-semibold text-white rounded-full bg-sky-600 focus:outline-none focus:ring focus:ring-blue-300 hover:bg-sky-700"
            >
              Create Schedule
            </button>
          )}
          {table && (
            <button
              onClick={reHandleSchedule}
              className="px-4 py-3 text-lg font-semibold text-white rounded-full bg-sky-600 focus:outline-none focus:ring focus:ring-blue-300 hover:bg-sky-700"
            >
              Re-create Schedule {table && ' '} ⌘
            </button>
          )}
        </form>

        {table && (
          <form onSubmit={uploadSchedule} className="flex justify-center mt-5 mb-20">
            <div className="grid place-items-center">
              {button && (
                <button
                  type="submit"
                  className={`px-4 py-3 text-lg font-semibold text-white rounded-full focus:outline-none focus:ring ${editingId
                    ? 'bg-blue-600 focus:ring-blue-300 hover:bg-blue-700'
                    : 'bg-green-600 focus:ring-green-300 hover:bg-green-700'
                    }`}
                >
                  {editingId ? '💾 Update Schedule' : '📤 Upload Schedule'}
                </button>
              )}
              {!button && (
                <button
                  className="px-4 py-3 text-lg font-semibold text-white bg-gray-600 rounded-full focus:ring hover:cursor-no-drop"
                  disabled
                >
                  {editingId ? 'Update Schedule' : 'Upload Schedule'}
                </button>
              )}
              {status?.OK === false && (
                <Msg bolded={status.bolded} msg={status.msg} OK={status.OK} />
              )}
            </div>
          </form>
        )}
      </div>
    </>
  );
};

export default Schedule;
