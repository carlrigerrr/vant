import React, { Fragment, useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Dialog, Transition, Menu } from '@headlessui/react';
import {
    CalendarIcon,
    ClockIcon,
    InboxInIcon,
    ChatAlt2Icon,
    SpeakerphoneIcon,
    CheckCircleIcon,
    XIcon,
    MenuIcon,
    StatusOnlineIcon
} from '@heroicons/react/outline';
import { useUserContext } from '../useUserContext';
import logoLg from './../../logos/logo__full-color.svg';
import axios from 'axios';
import Button from '../common/Button';

const navigation = [
    { name: 'Work Schedule', href: '/dashboard', icon: CalendarIcon, color: 'text-blue-600', bg: 'bg-blue-50' },
    { name: 'Availability', href: '/block', icon: ClockIcon, color: 'text-purple-600', bg: 'bg-purple-50' },
    { name: 'My Requests', href: '/requests', icon: InboxInIcon, color: 'text-pink-600', bg: 'bg-pink-50' },
    { name: 'Messages', href: '/messages', icon: ChatAlt2Icon, color: 'text-green-600', bg: 'bg-green-50' },
    { name: 'Announcements', href: '/announcements', icon: SpeakerphoneIcon, color: 'text-orange-600', bg: 'bg-orange-50' },
    { name: 'Attendance', href: '/attendance', icon: CheckCircleIcon, color: 'text-sky-600', bg: 'bg-sky-50' },
];

function classNames(...classes) {
    return classes.filter(Boolean).join(' ');
}

const UserLayout = ({ children }) => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const { user } = useUserContext();
    const location = useLocation();
    const navigate = useNavigate();

    // Fetch unread message count
    useEffect(() => {
        if (!user) return;

        const fetchUnreadCount = async () => {
            try {
                const response = await axios.get('/api/messages/unread-count');
                setUnreadCount(response.data.count || 0);
            } catch (error) {
                console.error('Error fetching unread count:', error);
            }
        };

        fetchUnreadCount();

        // Poll every 30 seconds
        const pollInterval = setInterval(fetchUnreadCount, 30000);
        return () => clearInterval(pollInterval);
    }, [user]);

    // Reset unread count when visiting messages page
    useEffect(() => {
        if (location.pathname === '/messages') {
            // Refetch after a short delay to account for messages being marked as read
            const timeout = setTimeout(() => {
                axios.get('/api/messages/unread-count')
                    .then(res => setUnreadCount(res.data.count || 0))
                    .catch(() => { });
            }, 1000);
            return () => clearTimeout(timeout);
        }
    }, [location.pathname]);

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
                                            const showBadge = item.name === 'Messages' && unreadCount > 0;
                                            return (
                                                <Link
                                                    key={item.name}
                                                    to={item.href}
                                                    className={classNames(
                                                        current ? 'bg-gray-50 text-gray-900 border-r-4 border-[var(--primary)]' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
                                                        'group flex items-center px-3 py-2.5 text-sm font-medium rounded-r-xl transition-all duration-200'
                                                    )}
                                                >
                                                    <div className="relative mr-3">
                                                        <div className={classNames(
                                                            current ? item.bg + ' ' + item.color : 'bg-gray-100 text-gray-400 group-hover:bg-white group-hover:text-gray-500',
                                                            "h-9 w-9 flex items-center justify-center rounded-lg transition-colors duration-200"
                                                        )}>
                                                            <item.icon className="h-5 w-5" aria-hidden="true" />
                                                        </div>
                                                        {showBadge && (
                                                            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-4 w-4 flex items-center justify-center shadow-sm border-2 border-white">
                                                                {unreadCount > 9 ? '9+' : unreadCount}
                                                            </span>
                                                        )}
                                                    </div>
                                                    {item.name}
                                                </Link>
                                            );
                                        })}
                                    </nav>
                                </div>
                                <div className="flex-shrink-0 flex flex-col border-t border-gray-100 p-4">
                                    <Link to="/profile" className="flex-shrink-0 w-full group block" onClick={() => setSidebarOpen(false)}>
                                        <div className="flex items-center">
                                            <div className="ml-3">
                                                <p className="text-sm font-medium text-gray-900">{user?.username || 'User'}</p>
                                                <p className="text-xs font-medium text-gray-400 group-hover:text-blue-500 transition-colors cursor-pointer">View Profile</p>
                                            </div>
                                        </div>
                                    </Link>
                                    <div className="mt-3 pt-3 border-t border-gray-100 space-y-2">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs text-gray-500">Jobs Completed:</span>
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                                                {user?.jobsCompleted || 0}
                                            </span>
                                        </div>
                                        {user?.averageRating > 0 && (
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs text-gray-500">Your Rating:</span>
                                                <div className="flex items-center gap-1">
                                                    <span className="text-yellow-400 text-sm">★</span>
                                                    <span className="text-xs font-semibold text-gray-700">{user.averageRating.toFixed(1)}</span>
                                                    <span className="text-xs text-gray-400">({user.totalRatings || 0})</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
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
                                const showBadge = item.name === 'Messages' && unreadCount > 0;
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
                                        <div className="relative mr-3">
                                            <div className={classNames(
                                                current ? item.bg + ' ' + item.color : 'bg-gray-100 text-gray-400 group-hover:bg-white group-hover:shadow-sm group-hover:text-gray-500',
                                                "h-9 w-9 flex items-center justify-center rounded-lg transition-colors duration-200"
                                            )}>
                                                <item.icon className="h-5 w-5" aria-hidden="true" />
                                            </div>
                                            {showBadge && (
                                                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-4 w-4 flex items-center justify-center shadow-sm border-2 border-white">
                                                    {unreadCount > 9 ? '9+' : unreadCount}
                                                </span>
                                            )}
                                        </div>
                                        {item.name}
                                    </Link>
                                );
                            })}
                        </nav>
                    </div>
                    <div className="flex-shrink-0 flex flex-col border-t border-gray-100 p-4">
                        <Link to="/profile" className="flex-shrink-0 w-full group block">
                            <div className="flex items-center">
                                <div className="ml-3">
                                    <p className="text-sm font-medium text-gray-900">{user?.username || 'User'}</p>
                                    <p className="text-xs font-medium text-gray-400 group-hover:text-blue-500 transition-colors cursor-pointer">View Profile</p>
                                </div>
                            </div>
                        </Link>
                        <div className="mt-3 pt-3 border-t border-gray-100 space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-gray-500">Jobs Completed:</span>
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                                    {user?.jobsCompleted || 0}
                                </span>
                            </div>
                            {user?.averageRating > 0 && (
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-gray-500">Your Rating:</span>
                                    <div className="flex items-center gap-1">
                                        <span className="text-yellow-400 text-sm">★</span>
                                        <span className="text-xs font-semibold text-gray-700">{user.averageRating.toFixed(1)}</span>
                                        <span className="text-xs text-gray-400">({user.totalRatings || 0})</span>
                                    </div>
                                </div>
                            )}
                        </div>
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
                            <h2 className="text-xl font-semibold text-[var(--text-heading)] hidden lg:block">Employee Dashboard</h2>
                        </div>
                        <div className="ml-4 flex items-center md:ml-6">

                            {/* Admin Button (only for admins) */}
                            {user?.admin && (
                                <Link to="/admin" className="mr-4">
                                    <Button
                                        variant="soft-danger"
                                        size="sm"
                                        className="border-red-100 bg-white hover:bg-red-50 text-red-600 shadow-sm"
                                    >
                                        Admin
                                        <StatusOnlineIcon className="ml-2 -mr-0.5 h-4 w-4" aria-hidden="true" />
                                    </Button>
                                </Link>
                            )}

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

export default UserLayout;
