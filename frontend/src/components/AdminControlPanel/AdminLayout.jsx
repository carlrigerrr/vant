import React, { Fragment, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Dialog, Transition, Menu } from '@headlessui/react';
import {
    HomeIcon,
    InboxInIcon,
    CalendarIcon,
    ClockIcon,
    UserGroupIcon,
    BriefcaseIcon,
    RefreshIcon,
    SpeakerphoneIcon,
    ChartBarIcon,
    XIcon,
    MenuIcon,
    RewindIcon,
    CurrencyDollarIcon,
    CogIcon,
    UserAddIcon,
    DocumentTextIcon,
    TruckIcon
} from '@heroicons/react/outline';
import { useUserContext } from '../useUserContext';
import logoLg from './../../logos/logo__full-color.svg';
import logoSm from './../../logos/logo__small.svg';
import axios from 'axios';

const navigation = [
    { name: 'Dashboard', href: '/admin', icon: HomeIcon, color: 'text-blue-600', bg: 'bg-blue-50' },
    // Schedule Management
    { name: 'Create Schedule', href: '/admin/schedule', icon: CalendarIcon, color: 'text-purple-600', bg: 'bg-purple-50' },
    { name: 'Schedule History', href: '/admin/schedule-history', icon: ClockIcon, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    // People Management
    { name: 'Employees', href: '/admin/users', icon: UserGroupIcon, color: 'text-sky-600', bg: 'bg-sky-50' },
    { name: 'Clients', href: '/admin/clients', icon: BriefcaseIcon, color: 'text-orange-600', bg: 'bg-orange-50' },
    { name: 'Leads', href: '/admin/leads', icon: UserAddIcon, color: 'text-teal-600', bg: 'bg-teal-50' },
    // Requests & Attendance
    { name: 'Employee Requests', href: '/admin/requests', icon: InboxInIcon, color: 'text-pink-600', bg: 'bg-pink-50' },
    { name: 'Client Requests', href: '/admin/reschedule', icon: RefreshIcon, color: 'text-rose-600', bg: 'bg-rose-50' },
    { name: 'Attendance', href: '/admin/attendance', icon: ClockIcon, color: 'text-green-600', bg: 'bg-green-50' },
    // Communications
    { name: 'Announcements', href: '/admin/announcements', icon: SpeakerphoneIcon, color: 'text-yellow-600', bg: 'bg-yellow-50' },
    // Billing
    { name: 'Invoices', href: '/admin/invoices', icon: DocumentTextIcon, color: 'text-violet-600', bg: 'bg-violet-50' },
    { name: 'Payroll', href: '/admin/payroll', icon: CurrencyDollarIcon, color: 'text-lime-600', bg: 'bg-lime-50' },
    // Reports
    { name: 'Performance', href: '/admin/performance', icon: ChartBarIcon, color: 'text-cyan-600', bg: 'bg-cyan-50' },
    { name: 'Revenue', href: '/admin/revenue', icon: CurrencyDollarIcon, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { name: 'Mileage', href: '/admin/mileage', icon: TruckIcon, color: 'text-blue-600', bg: 'bg-blue-50' },
    // Settings
    { name: 'Settings', href: '/admin/settings', icon: CogIcon, color: 'text-gray-600', bg: 'bg-gray-50' },
];

function classNames(...classes) {
    return classes.filter(Boolean).join(' ');
}

const AdminLayout = ({ children }) => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const { user } = useUserContext();
    const location = useLocation();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await axios.post('/logout');
        navigate('/login');
    };

    return (
        <div className="min-h-screen">
            {/* Mobile sidebar */}
            <Transition.Root show={sidebarOpen} as={Fragment}>
                <Dialog as="div" className="relative z-40 md:hidden" onClose={setSidebarOpen}>
                    <Transition.Child
                        as={Fragment}
                        enter="transition-opacity ease-linear duration-300"
                        enterFrom="opacity-0"
                        enterTo="opacity-100"
                        leave="transition-opacity ease-linear duration-300"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                    >
                        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" />
                    </Transition.Child>

                    <div className="fixed inset-0 flex z-40">
                        <Transition.Child
                            as={Fragment}
                            enter="transition ease-in-out duration-300 transform"
                            enterFrom="-translate-x-full"
                            enterTo="translate-x-0"
                            leave="transition ease-in-out duration-300 transform"
                            leaveFrom="translate-x-0"
                            leaveTo="-translate-x-full"
                        >
                            <Dialog.Panel className="relative flex-1 flex flex-col max-w-xs w-full bg-white">
                                <Transition.Child
                                    as={Fragment}
                                    enter="ease-in-out duration-300"
                                    enterFrom="opacity-0"
                                    enterTo="opacity-100"
                                    leave="ease-in-out duration-300"
                                    leaveFrom="opacity-100"
                                    leaveTo="opacity-0"
                                >
                                    <div className="absolute top-0 right-0 -mr-12 pt-2">
                                        <button
                                            type="button"
                                            className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                                            onClick={() => setSidebarOpen(false)}
                                        >
                                            <span className="sr-only">Close sidebar</span>
                                            <XIcon className="h-6 w-6 text-white" aria-hidden="true" />
                                        </button>
                                    </div>
                                </Transition.Child>
                                <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
                                    <div className="flex-shrink-0 flex items-center px-4">
                                        <img className="h-8 w-auto" src={logoLg} alt="Vant" />
                                    </div>
                                    <nav className="mt-8 px-4 space-y-2">
                                        {navigation.map((item) => {
                                            const current = location.pathname === item.href;
                                            return (
                                                <Link
                                                    key={item.name}
                                                    to={item.href}
                                                    className={classNames(
                                                        current ? 'bg-gray-50 text-gray-900 border-r-4 border-[var(--primary)]' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
                                                        'group flex items-center px-3 py-2.5 text-sm font-medium rounded-r-xl transition-all duration-200'
                                                    )}
                                                >
                                                    <div className={classNames(
                                                        current ? item.bg + ' ' + item.color : 'bg-gray-100 text-gray-400 group-hover:bg-white group-hover:text-gray-500',
                                                        "mr-3 flex-shrink-0 h-10 w-10 flex items-center justify-center rounded-lg transition-colors duration-200"
                                                    )}>
                                                        <item.icon className="h-6 w-6" aria-hidden="true" />
                                                    </div>
                                                    {item.name}
                                                </Link>
                                            );
                                        })}
                                    </nav>
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                        <div className="flex-shrink-0 w-14">{/* Force sidebar to shrink to fit close icon */}</div>
                    </div>
                </Dialog>
            </Transition.Root>

            {/* Static sidebar for desktop */}
            <div className="hidden md:flex md:w-72 md:flex-col md:fixed md:inset-y-0 shadow-[var(--shadow-soft)] bg-white border-r border-gray-100 z-30">
                <div className="flex-1 flex flex-col min-h-0">
                    <div className="flex-1 flex flex-col pt-6 pb-4 overflow-y-auto">
                        <div className="flex items-center flex-shrink-0 px-6 mb-8">
                            <img className="h-9 w-auto" src={logoLg} alt="Vant" />
                        </div>
                        <nav className="flex-1 px-4 space-y-2">
                            {navigation.map((item) => {
                                const current = location.pathname === item.href;
                                return (
                                    <Link
                                        key={item.name}
                                        to={item.href}
                                        className={classNames(
                                            current ? 'bg-gray-50 text-gray-900 shadow-sm' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
                                            'group flex items-center px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 relative overflow-hidden'
                                        )}
                                    >
                                        {current && (
                                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-[var(--primary)] rounded-l-xl"></div>
                                        )}
                                        <div className={classNames(
                                            current ? item.bg + ' ' + item.color : 'bg-gray-100 text-gray-400 group-hover:bg-white group-hover:shadow-sm group-hover:text-gray-500',
                                            "mr-3 flex-shrink-0 h-10 w-10 flex items-center justify-center rounded-lg transition-colors duration-200"
                                        )}>
                                            <item.icon className="h-6 w-6" aria-hidden="true" />
                                        </div>
                                        {item.name}
                                    </Link>
                                );
                            })}
                        </nav>
                    </div>
                    <div className="flex-shrink-0 flex border-t border-gray-100 p-4">
                        <Link to="/admin/profile" className="flex-shrink-0 w-full group block">
                            <div className="flex items-center">
                                <div className="ml-3">
                                    <p className="text-sm font-medium text-gray-900">{user?.username || 'Admin'}</p>
                                    <p className="text-xs font-medium text-gray-400 group-hover:text-blue-500 transition-colors cursor-pointer">View Profile</p>
                                </div>
                            </div>
                        </Link>
                    </div>
                </div>
            </div>

            {/* Main content column */}
            <div className="md:pl-72 flex flex-col flex-1 transition-all duration-300">
                {/* Top header */}
                <div className="sticky top-0 z-20 flex-shrink-0 flex h-20 bg-white/80 backdrop-blur-md shadow-sm border-b border-gray-100/50">
                    <button
                        type="button"
                        className="px-4 border-r border-gray-200 text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500 md:hidden"
                        onClick={() => setSidebarOpen(true)}
                    >
                        <span className="sr-only">Open sidebar</span>
                        <MenuIcon className="h-6 w-6" aria-hidden="true" />
                    </button>
                    <div className="flex-1 px-8 flex justify-between items-center">
                        <div className="flex-1 flex">
                            {/* Optional search bar could go here */}
                            <h2 className="text-xl font-semibold text-[var(--text-heading)] hidden lg:block">Admin Dashboard</h2>
                        </div>
                        <div className="ml-4 flex items-center md:ml-6">
                            {/* User Side Button */}
                            <Link to="/">
                                <button
                                    type="button"
                                    className="flex items-center px-4 py-2 border border-blue-100 shadow-sm text-sm leading-4 font-medium rounded-lg text-blue-700 bg-white hover:bg-blue-50 focus:outline-none transition-all mr-4"
                                >
                                    User Side
                                    <RewindIcon className="ml-2 -mr-0.5 h-4 w-4" aria-hidden="true" />
                                </button>
                            </Link>

                            {/* Profile dropdown */}
                            <Menu as="div" className="ml-3 relative">
                                <div>
                                    <Menu.Button className="max-w-xs bg-white flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--primary)]">
                                        <span className="sr-only">Open user menu</span>
                                        <div className="h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center text-[var(--primary)] font-bold text-lg shadow-sm">
                                            {user?.username?.charAt(0).toUpperCase()}
                                        </div>
                                    </Menu.Button>
                                </div>
                                <Transition
                                    as={Fragment}
                                    enter="transition ease-out duration-100"
                                    enterFrom="transform opacity-0 scale-95"
                                    enterTo="transform opacity-100 scale-100"
                                    leave="transition ease-in duration-75"
                                    leaveFrom="transform opacity-100 scale-100"
                                    leaveTo="transform opacity-0 scale-95"
                                >
                                    <Menu.Items className="origin-top-right absolute right-0 mt-2 w-48 rounded-xl shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none">
                                        <Menu.Item>
                                            {({ active }) => (
                                                <button
                                                    onClick={handleLogout}
                                                    className={classNames(
                                                        active ? 'bg-gray-50' : '',
                                                        'block px-4 py-2 text-sm text-gray-700 w-full text-left'
                                                    )}
                                                >
                                                    Logout
                                                </button>
                                            )}
                                        </Menu.Item>
                                    </Menu.Items>
                                </Transition>
                            </Menu>
                        </div>
                    </div>
                </div>

                {/* Main content area */}
                <main className="flex-1">
                    <div className="py-8">
                        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
                            {children}
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default AdminLayout;
