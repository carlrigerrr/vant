import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { HashLoader } from 'react-spinners';
import { format } from 'date-fns';
import {
  UserGroupIcon,
  OfficeBuildingIcon,
  CheckCircleIcon,
  ClipboardCheckIcon,
  LoginIcon,
  LogoutIcon,
  CalendarIcon,
  LightningBoltIcon,
  BellIcon,
  ChatIcon,
  LocationMarkerIcon,
  ShieldCheckIcon,
  PlusIcon,
  ViewListIcon,
  ClockIcon
} from '@heroicons/react/outline';
import Card from '../common/Card';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboardStats = async () => {
    try {
      const response = await axios.get('/api/stats/dashboard');
      setStats(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardStats();
    // Refresh every 30 seconds
    const interval = setInterval(fetchDashboardStats, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <HashLoader size={50} color="#1362FC" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 text-red-600 p-4 rounded-lg text-center border border-red-100">
          {error}
          <button
            onClick={fetchDashboardStats}
            className="ml-4 px-4 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const { summary, pending, activeEmployees } = stats || {};

  // Modern Stat Card
  const StatCard = ({ icon: Icon, label, value, subtext, colorClass, linkTo }) => {
    const content = (
      <Card className="h-full transition-all duration-200 hover:translate-y-[-2px] hover:shadow-md cursor-pointer group">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-[var(--text-muted)] group-hover:text-[var(--primary)] transition-colors">{label}</p>
            <p className="text-3xl font-bold text-[var(--text-heading)] mt-2 font-display">{value}</p>
            {subtext && <p className="text-xs text-[var(--text-muted)] mt-1">{subtext}</p>}
          </div>
          <div className={`p-3 rounded-xl ${colorClass}`}>
            <Icon className="w-8 h-8 opacity-80" />
          </div>
        </div>
      </Card>
    );

    if (linkTo) {
      return <Link to={linkTo} className="block h-full">{content}</Link>;
    }
    return <div className="h-full">{content}</div>;
  };

  // Modern Alert Card Item
  const AlertItem = ({ icon: Icon, label, count, linkTo, colorClass, textClass }) => {
    if (count === 0) return null;
    return (
      <Link to={linkTo} className={`flex items-center gap-4 p-4 rounded-xl ${colorClass} hover:opacity-90 transition-opacity border border-transparent hover:border-current`}>
        <div className={`p-2 rounded-lg bg-white/60`}>
          <Icon className={`w-6 h-6 ${textClass}`} />
        </div>
        <div className="flex-1">
          <p className={`font-semibold ${textClass}`}>{label}</p>
        </div>
        <div className={`px-3 py-1 rounded-lg bg-white/60 font-bold ${textClass}`}>
          {count}
        </div>
      </Link>
    );
  };

  return (
    <div className="p-4 md:p-8 max-w-[1600px] mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[var(--text-heading)] tracking-tight">Dashboard Overview</h1>
          <p className="text-[var(--text-body)] mt-1 flex items-center gap-2">
            <ClockIcon className="w-4 h-4 text-[var(--text-muted)]" />
            <span className="text-[var(--text-muted)]">Last updated: {format(new Date(stats?.timestamp || new Date()), 'HH:mm:ss')}</span>
          </p>
        </div>
        <button
          onClick={fetchDashboardStats}
          className="px-5 py-2.5 bg-white border border-gray-200 text-[var(--text-body)] rounded-xl hover:bg-gray-50 transition-colors flex items-center gap-2 font-medium shadow-sm hover:shadow active:scale-95 duration-150"
        >
          <svg className="w-5 h-5 text-[var(--text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh Data
        </button>
      </div>

      {/* Primary Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={UserGroupIcon}
          label="Total Employees"
          value={summary?.totalEmployees || 0}
          colorClass="bg-blue-50 text-blue-600"
          linkTo="/admin/users"
        />
        <StatCard
          icon={OfficeBuildingIcon}
          label="Total Clients"
          value={summary?.totalClients || 0}
          colorClass="bg-purple-50 text-purple-600"
          linkTo="/admin/clients"
        />
        <StatCard
          icon={CheckCircleIcon}
          label="Active Now"
          value={summary?.activeNow || 0}
          subtext="Currently on site"
          colorClass="bg-green-50 text-green-600"
          linkTo="/admin/attendance"
        />
        <StatCard
          icon={ClipboardCheckIcon}
          label="Jobs Done"
          value={summary?.jobsCompletedToday || 0}
          subtext="Completed today"
          colorClass="bg-emerald-50 text-emerald-600"
        />
      </div>

      {/* Activity Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={LoginIcon}
          label="Checked In"
          value={summary?.checkedInToday || 0}
          subtext="Today's check-ins"
          colorClass="bg-cyan-50 text-cyan-600"
        />
        <StatCard
          icon={LogoutIcon}
          label="Checked Out"
          value={summary?.checkedOutToday || 0}
          subtext="Today's check-outs"
          colorClass="bg-slate-100 text-slate-600"
        />
        <StatCard
          icon={CalendarIcon}
          label="Weekly Activity"
          value={summary?.weeklyCheckIns || 0}
          subtext="Total check-ins this week"
          colorClass="bg-indigo-50 text-indigo-600"
        />
        <StatCard
          icon={LightningBoltIcon}
          label="Completion Rate"
          value={summary?.checkedInToday > 0
            ? Math.round((summary?.jobsCompletedToday / summary?.checkedInToday) * 100) + '%'
            : '-'}
          subtext="Jobs vs Check-ins"
          colorClass="bg-yellow-50 text-yellow-600"
        />
      </div>

      {/* Main Content Info */}
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Pending Items */}
        <Card className="h-full">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-yellow-50 rounded-lg">
              <BellIcon className="w-6 h-6 text-yellow-600" />
            </div>
            <h2 className="text-xl font-bold text-[var(--text-heading)]">Requires Attention</h2>
          </div>

          <div className="space-y-4">
            <AlertItem
              icon={ClockIcon}
              label="Reschedule Requests"
              count={pending?.clientRequests || 0}
              linkTo="/admin/reschedule"
              colorClass="bg-amber-50"
              textClass="text-amber-700"
            />
            <AlertItem
              icon={ChatIcon}
              label="Unread Messages"
              count={pending?.unreadMessages || 0}
              linkTo="/messages"
              colorClass="bg-blue-50"
              textClass="text-blue-700"
            />
            <AlertItem
              icon={LocationMarkerIcon}
              label="GPS Warnings"
              count={pending?.gpsWarnings || 0}
              linkTo="/admin/attendance"
              colorClass="bg-orange-50"
              textClass="text-orange-700"
            />
            <AlertItem
              icon={ShieldCheckIcon}
              label="Safety Pending"
              count={pending?.safetyConfirmations || 0}
              linkTo="/admin/attendance"
              colorClass="bg-red-50"
              textClass="text-red-700"
            />

            {(pending?.clientRequests || 0) === 0 &&
              (pending?.unreadMessages || 0) === 0 &&
              (pending?.gpsWarnings || 0) === 0 &&
              (pending?.safetyConfirmations || 0) === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="w-16 h-16 bg-gradient-to-tr from-green-400 to-green-600 rounded-full flex items-center justify-center mb-4 shadow-lg shadow-green-200">
                    <CheckCircleIcon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-800">All caught up!</h3>
                  <p className="text-gray-500 mt-1">No pending actions required.</p>
                </div>
              )}
          </div>
        </Card>

        {/* Active Employees */}
        <Card className="h-full">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-green-50 rounded-lg">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse ring-4 ring-green-100"></div>
            </div>
            <h2 className="text-xl font-bold text-[var(--text-heading)]">Live Activity</h2>
          </div>

          {activeEmployees && activeEmployees.length > 0 ? (
            <div className="space-y-4">
              {activeEmployees.map((employee, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors border border-gray-100">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                      {employee.employeeName.charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold text-gray-800">{employee.employeeName}</p>
                      <p className="text-sm text-gray-500 flex items-center gap-1 mt-0.5">
                        <LocationMarkerIcon className="w-3.5 h-3.5" />
                        {employee.clientName || 'Unknown location'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-600 bg-white px-2 py-1 rounded shadow-sm">
                      {employee.checkInTime ? format(new Date(employee.checkInTime), 'HH:mm') : '-'}
                    </p>
                    {employee.safetyConfirmed ? (
                      <span className="flex items-center justify-end gap-1 text-xs text-green-600 mt-1 font-medium">
                        <ShieldCheckIcon className="w-3 h-3" /> Safe
                      </span>
                    ) : (
                      <span className="flex items-center justify-end gap-1 text-xs text-amber-600 mt-1 font-medium">
                        <ClockIcon className="w-3 h-3" /> Pending check
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center text-gray-400">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <OfficeBuildingIcon className="w-8 h-8 text-gray-400" />
              </div>
              <p className="font-medium">No employees currently on site</p>
              <p className="text-sm mt-1 opacity-70">Check back later</p>
            </div>
          )}
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="bg-gradient-to-r from-[#1362FC] to-[#0B4FCD] rounded-2xl shadow-lg p-6 md:p-8 text-white">
        <div className="flex items-center gap-3 mb-6">
          <LightningBoltIcon className="w-7 h-7 text-white" />
          <h2 className="text-xl font-bold text-white">Quick Actions</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link to="/admin/schedule" className="bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-xl p-4 flex flex-col items-center justify-center gap-3 transition-all hover:scale-105 active:scale-95 border border-white/10">
            <CalendarIcon className="w-8 h-8" />
            <span className="font-medium">Create Schedule</span>
          </Link>
          <Link to="/admin/users" className="bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-xl p-4 flex flex-col items-center justify-center gap-3 transition-all hover:scale-105 active:scale-95 border border-white/10">
            <PlusIcon className="w-8 h-8" />
            <span className="font-medium">Add Employee</span>
          </Link>
          <Link to="/admin/clients" className="bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-xl p-4 flex flex-col items-center justify-center gap-3 transition-all hover:scale-105 active:scale-95 border border-white/10">
            <OfficeBuildingIcon className="w-8 h-8" />
            <span className="font-medium">Add Client</span>
          </Link>
          <Link to="/admin/attendance" className="bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-xl p-4 flex flex-col items-center justify-center gap-3 transition-all hover:scale-105 active:scale-95 border border-white/10">
            <ViewListIcon className="w-8 h-8" />
            <span className="font-medium">View Attendance</span>
          </Link>
        </div>
      </div>
    </div>
  );
};


export default Dashboard;
