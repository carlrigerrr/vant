import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AvailabilityPage from './User/EmployeeAvailability/AvailabilityPage';
import Login from './Login/LoginPage';
import { useUserContext } from './useUserContext';
import Schedule from './AdminControlPanel/Schedule';
import RequestsPage from './AdminControlPanel/Requests/RequestsPage';
import Users from './AdminControlPanel/Users';
import MyRequests from './User/Requests/MyRequests';
import Dashboard from './AdminControlPanel/Dashboard';
// Footer removed
import WeekSchedule from './WeekSchedule';
import ScheduleHistory from './AdminControlPanel/ScheduleHistory';
import CheckInCheckOut from './User/Attendance/CheckInCheckOut';
import ClientLogin from './Client/ClientLogin';
import ClientDashboard from './Client/ClientDashboard';
import ClientOnboardingForm from './Client/ClientOnboardingForm';
import ClientsPage from './AdminControlPanel/Clients/ClientsPage';
import RescheduleRequestsPage from './AdminControlPanel/Reschedule/RescheduleRequestsPage';
import MessagesPage from './Messages/MessagesPage';
import AnnouncementsPage from './AdminControlPanel/Announcements/AnnouncementsPage';
import AnnouncementsViewPage from './Announcements/AnnouncementsViewPage';
import AttendancePage from './AdminControlPanel/Attendance/AttendancePage';
import MileageReport from './AdminControlPanel/Attendance/MileageReport';
import PerformanceDashboard from './AdminControlPanel/Performance/PerformanceDashboard';
import RevenueDashboard from './AdminControlPanel/Revenue/RevenueDashboard';
import ReviewSettingsPage from './AdminControlPanel/Settings/ReviewSettingsPage';
import LeadsPage from './AdminControlPanel/Leads/LeadsPage';
import InvoicesPage from './AdminControlPanel/Invoices/InvoicesPage';
import PayrollPage from './AdminControlPanel/Payroll/PayrollPage';
import AdminLayout from './AdminControlPanel/AdminLayout';
import LandingPage from './LandingPage/LandingPage';
import UserLayout from './User/UserLayout';
import ProfilePage from './Profile/ProfilePage';
import { AppShell } from '@mantine/core';

const Main = () => {
  const { refresh } = useUserContext();

  useEffect(() => {
    refresh();
  }, []);
  return (
    <>
      <AppShell padding={0} fixed={true}>
        <BrowserRouter>
          <Routes>
            {/* User Routes wrapped in UserLayout */}
            <Route path="/login" element={<Login />} />
            <Route path="/block" element={<UserLayout><AvailabilityPage /></UserLayout>} />
            <Route path="/attendance" element={<UserLayout><CheckInCheckOut /></UserLayout>} />
            <Route path="/" element={<UserLayout><WeekSchedule /></UserLayout>} />
            <Route path="/requests" element={<UserLayout><MyRequests /></UserLayout>} />
            <Route path="/messages" element={<UserLayout><MessagesPage /></UserLayout>} />
            <Route path="/announcements" element={<UserLayout><AnnouncementsViewPage /></UserLayout>} />
            <Route path="/profile" element={<UserLayout><ProfilePage isAdmin={false} /></UserLayout>} />

            {/* Admin Routes wrapped in AdminLayout */}
            <Route path="/admin" element={<AdminLayout><Dashboard /></AdminLayout>} />
            <Route path="/admin/schedule" element={<AdminLayout><Schedule /></AdminLayout>} />
            <Route path="/admin/schedule-history" element={<AdminLayout><ScheduleHistory /></AdminLayout>} />
            <Route path="/admin/requests" element={<AdminLayout><RequestsPage /></AdminLayout>} />
            <Route path="/admin/users" element={<AdminLayout><Users /></AdminLayout>} />
            <Route path="/admin/clients" element={<AdminLayout><ClientsPage /></AdminLayout>} />
            <Route path="/admin/leads" element={<AdminLayout><LeadsPage /></AdminLayout>} />
            <Route path="/admin/invoices" element={<AdminLayout><InvoicesPage /></AdminLayout>} />
            <Route path="/admin/payroll" element={<AdminLayout><PayrollPage /></AdminLayout>} />
            <Route path="/admin/reschedule" element={<AdminLayout><RescheduleRequestsPage /></AdminLayout>} />
            <Route path="/admin/announcements" element={<AdminLayout><AnnouncementsPage /></AdminLayout>} />
            <Route path="/admin/attendance" element={<AdminLayout><AttendancePage /></AdminLayout>} />
            <Route path="/admin/performance" element={<AdminLayout><PerformanceDashboard /></AdminLayout>} />
            <Route path="/admin/revenue" element={<AdminLayout><RevenueDashboard /></AdminLayout>} />
            <Route path="/admin/mileage" element={<AdminLayout><MileageReport /></AdminLayout>} />
            <Route path="/admin/settings" element={<AdminLayout><ReviewSettingsPage /></AdminLayout>} />
            <Route path="/admin/profile" element={<AdminLayout><ProfilePage isAdmin={true} /></AdminLayout>} />

            <Route path="/client/login" element={<ClientLogin />} />
            <Route path="/client/dashboard" element={<ClientDashboard />} />
            <Route path="/client/onboarding" element={<ClientOnboardingForm />} />
            <Route path="/landing" element={<LandingPage />} />
            <Route path="*" element={<Login />} />
          </Routes>
        </BrowserRouter>
      </AppShell>
    </>
  );
};

export default Main;
