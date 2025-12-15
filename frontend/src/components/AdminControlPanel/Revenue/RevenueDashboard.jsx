import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useUserContext } from '../../useUserContext';
import { CashIcon, CheckCircleIcon, ClockIcon, XCircleIcon } from '@heroicons/react/outline';

const RevenueDashboard = () => {
    const { user } = useUserContext();
    const [stats, setStats] = useState({
        totalRevenue: 0,
        monthlyRevenue: 0,
        weeklyRevenue: 0,
        paidRevenue: 0,
        pendingRevenue: 0,
        cancelledRevenue: 0,
        avgServicePrice: 0
    });
    const [byClient, setByClient] = useState([]);
    const [byEmployee, setByEmployee] = useState([]);
    const [recentTransactions, setRecentTransactions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user?.admin) {
            fetchRevenueData();
        }
    }, [user]);

    const fetchRevenueData = async () => {
        try {
            const [statsRes, clientRes, employeeRes, transactionsRes] = await Promise.all([
                axios.get('/api/revenue/stats'),
                axios.get('/api/revenue/by-client'),
                axios.get('/api/revenue/by-employee'),
                axios.get('/api/revenue/recent-transactions?limit=10')
            ]);

            setStats(statsRes.data);
            setByClient(clientRes.data);
            setByEmployee(employeeRes.data);
            setRecentTransactions(transactionsRes.data);
        } catch (error) {
            console.error('Error fetching revenue data:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    const getStatusBadge = (status) => {
        const styles = {
            paid: 'bg-green-100 text-green-700',
            pending: 'bg-yellow-100 text-yellow-700',
            cancelled: 'bg-red-100 text-red-700'
        };
        return (
            <span className={`px-2 py-1 rounded text-xs font-medium ${styles[status] || styles.pending}`}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
        );
    };

    if (!user) return <div className="text-center py-10">Loading...</div>;
    if (!user.admin) return <div className="text-center py-10 text-red-500">Admin access required</div>;

    return (
        <div className="max-w-7xl mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-8 flex items-center gap-3">
                <CashIcon className="w-10 h-10 text-green-600" /> Revenue Dashboard
            </h1>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-white p-6 rounded-lg shadow border-l-4 border-green-500">
                    <h3 className="text-gray-500 text-sm font-medium uppercase">Total Revenue</h3>
                    <p className="text-3xl font-bold text-gray-800 mt-2">{formatCurrency(stats.totalRevenue)}</p>
                    <p className="text-xs text-gray-400 mt-1">All time earnings</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow border-l-4 border-blue-500">
                    <h3 className="text-gray-500 text-sm font-medium uppercase">This Month</h3>
                    <p className="text-3xl font-bold text-gray-800 mt-2">{formatCurrency(stats.monthlyRevenue)}</p>
                    <p className="text-xs text-gray-400 mt-1">Current month revenue</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow border-l-4 border-purple-500">
                    <h3 className="text-gray-500 text-sm font-medium uppercase">This Week</h3>
                    <p className="text-3xl font-bold text-gray-800 mt-2">{formatCurrency(stats.weeklyRevenue)}</p>
                    <p className="text-xs text-gray-400 mt-1">Current week revenue</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow border-l-4 border-orange-500">
                    <h3 className="text-gray-500 text-sm font-medium uppercase">Avg Service</h3>
                    <p className="text-3xl font-bold text-gray-800 mt-2">{formatCurrency(stats.avgServicePrice)}</p>
                    <p className="text-xs text-gray-400 mt-1">Average price per service</p>
                </div>
            </div>

            {/* Payment Status Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-green-50 p-6 rounded-lg shadow">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-green-700 text-sm font-medium uppercase">Paid</h3>
                            <p className="text-2xl font-bold text-green-800 mt-2">{formatCurrency(stats.paidRevenue)}</p>
                        </div>
                        <CheckCircleIcon className="w-12 h-12 text-green-500" />
                    </div>
                </div>
                <div className="bg-yellow-50 p-6 rounded-lg shadow">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-yellow-700 text-sm font-medium uppercase">Pending</h3>
                            <p className="text-2xl font-bold text-yellow-800 mt-2">{formatCurrency(stats.pendingRevenue)}</p>
                        </div>
                        <ClockIcon className="w-12 h-12 text-yellow-500" />
                    </div>
                </div>
                <div className="bg-red-50 p-6 rounded-lg shadow">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-red-700 text-sm font-medium uppercase">Cancelled</h3>
                            <p className="text-2xl font-bold text-red-800 mt-2">{formatCurrency(stats.cancelledRevenue)}</p>
                        </div>
                        <XCircleIcon className="w-12 h-12 text-red-500" />
                    </div>
                </div>
            </div>

            {/* Revenue Tables */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* By Client */}
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h2 className="text-xl font-semibold text-gray-800">Revenue by Client</h2>
                    </div>
                    <div className="overflow-x-auto" style={{ maxHeight: '400px' }}>
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50 sticky top-0">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Client</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Services</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {byClient.length === 0 ? (
                                    <tr>
                                        <td colSpan="3" className="px-6 py-4 text-center text-gray-500">No revenue data</td>
                                    </tr>
                                ) : (
                                    byClient.map((client) => (
                                        <tr key={client.clientId} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div>
                                                    <div className="font-medium text-gray-900">{client.clientName}</div>
                                                    <div className="text-xs text-gray-500">{client.clientEmail}</div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap font-semibold text-gray-900">
                                                {formatCurrency(client.totalRevenue)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                                                {client.serviceCount}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* By Employee */}
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h2 className="text-xl font-semibold text-gray-800">Revenue by Employee</h2>
                    </div>
                    <div className="overflow-x-auto" style={{ maxHeight: '400px' }}>
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50 sticky top-0">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Avg/Service</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {byEmployee.length === 0 ? (
                                    <tr>
                                        <td colSpan="3" className="px-6 py-4 text-center text-gray-500">No revenue data</td>
                                    </tr>
                                ) : (
                                    byEmployee.map((emp) => (
                                        <tr key={emp.employeeId} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                                                {emp.employeeName}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap font-semibold text-gray-900">
                                                {formatCurrency(emp.totalRevenue)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                                                {formatCurrency(emp.avgPerService)}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Recent Transactions */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h2 className="text-xl font-semibold text-gray-800">Recent Transactions</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Client</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {recentTransactions.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-4 text-center text-gray-500">No transactions yet</td>
                                </tr>
                            ) : (
                                recentTransactions.map((txn) => (
                                    <tr key={txn._id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                                            {formatDate(txn.serviceDate)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="font-medium text-gray-900">{txn.clientId?.name || 'N/A'}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                                            {txn.employeeId?.username || 'N/A'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap font-semibold text-gray-900">
                                            {formatCurrency(txn.amount)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {getStatusBadge(txn.paymentStatus)}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default RevenueDashboard;
