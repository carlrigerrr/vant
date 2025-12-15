import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import HashLoader from 'react-spinners/HashLoader';
import { useUserContext } from './../useUserContext';
import { addDays, eachDayOfInterval, nextSunday, getISOWeek, parseISO, format } from 'date-fns';
import enUS from 'date-fns/locale/en-US';
import MyScheduleView from './MyScheduleView';
import axios from 'axios';

const WeekSchedule = () => {
  const { user } = useUserContext();
  const [datesArr, setDatesArr] = useState(null);
  const [table, setTable] = useState(null);
  const [showSchedule, setShowSchedule] = useState(true);

  const fetchSchedule = () => {
    const response = axios.get('/getSchedule');
    response.then((res) => {
      if (res.data && res.data.length > 0) {
        // Use shifts[] format instead of data[] to get full shift details including client info, times, etc.
        setTable(res.data[0].shifts || res.data[0].data);

        // Use the saved startDate if available
        if (res.data[0].startDate) {
          const start = new Date(res.data[0].startDate);
          if (!isNaN(start.getTime())) {
            const end = addDays(start, 5);
            setDatesArr(eachDayOfInterval({ start, end }));
          }
        } else if (res.data[0].date) {
          // Legacy fallback: use the date field
          const scheduleDate = parseISO(res.data[0].date);
          if (!isNaN(scheduleDate.getTime())) {
            const start = scheduleDate;
            const end = addDays(start, 5);
            setDatesArr(eachDayOfInterval({ start, end }));
          }
        }

        // Only check week number if date is valid
        if (res.data[0].date) {
          const parsedDate = parseISO(res.data[0].date);
          if (!isNaN(parsedDate.getTime())) {
            const scheduleWeekNumber = getISOWeek(parsedDate);
            const currentWeekNumber = getISOWeek(new Date());
            if (scheduleWeekNumber !== currentWeekNumber) setShowSchedule(false);
          }
        }
      }
    }).catch((err) => {
      console.error('Error fetching schedule:', err);
    });
  };

  useEffect(() => {
    fetchSchedule();
  }, []);

  // Poll for schedule updates every 60 seconds
  useEffect(() => {
    if (!user) return;

    const pollInterval = setInterval(() => {
      fetchSchedule();
    }, 60000); // Poll every 60 seconds

    return () => clearInterval(pollInterval);
  }, [user]);

  let navigate = useNavigate();

  if (!user) {
    return (
      <div className="grid w-screen h-screen place-items-center">
        <HashLoader className="content-center" size={100} />
        <h3>Loading, please wait...</h3>
      </div>
    );
  }

  if (user && user.isAuthenticated === false) {
    navigate('/login');
    return null;
  }

  const formatDay = (date) => {
    return format(date, 'd LLLL', { locale: enUS });
  };

  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* Header */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="md:flex md:items-center md:justify-between">
          <div className="min-w-0 flex-1">
            <h2 className="text-2xl font-bold leading-7 text-[var(--text-heading)] sm:truncate sm:text-3xl sm:tracking-tight">
              My Schedule
            </h2>
            {datesArr && (
              <p className="mt-2 text-sm text-gray-500 font-medium">
                Week to Display: <span className="text-[var(--primary)]">{formatDay(datesArr[0])} - {formatDay(datesArr[5])}</span>
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto">
        {table ? (
          <MyScheduleView
            table={table}
            datesArr={datesArr}
            user={user}
          />
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h3 className="text-xl font-medium text-gray-900">No Schedule Published</h3>
              <p className="mt-2 text-gray-500">
                The schedule for this week hasn't been published yet.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WeekSchedule;
