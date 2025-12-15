import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useUserContext } from '../../useUserContext';
import { ChartBarIcon } from '@heroicons/react/outline';

const PerformanceDashboard = () => {
    const { user } = useUserContext();
    const [summary, setSummary] = useState({
        totalServices: 0,
        servicesThisMonth: 0,
        topPerformer: 'N/A',
        onTimeRate: 100
    });
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user?.admin) {
            fetchData();
        }
    }, [user]);

    const fetchData = async () => {
        try {
            const [summaryRes, employeesRes] = await Promise.all([
                axios.get('/api/performance/summary'),
                axios.get('/api/performance/employees')
            ]);
            setSummary(summaryRes.data);
            setEmployees(employeesRes.data);
        } catch (error) {
            console.error('Error fetching performance data:', error);
        } finally {
            setLoading(false);
        }
    };

    if (!user) return <div className="text-center py-10">Loading...</div>;
    if (!user.admin) return <div className="text-center py-10 text-red-500">Admin access required</div>;

    return (
        <>
            <div className="max-w-6xl mx-auto px-4 py-8">
                <h1 className="text-3xl font-bold mb-8 flex items-center gap-3">
                    <ChartBarIcon className="w-10 h-10 text-blue-600" /> Performance Dashboard
                </h1>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white p-6 rounded-lg shadow border-l-4 border-blue-500">
                        <h3 className="text-gray-500 text-sm font-medium uppercase">Total Services</h3>
                        <p className="text-3xl font-bold text-gray-800 mt-2">{summary.totalServices}</p>
                        <p className="text-xs text-gray-400 mt-1">Lifetime completed jobs</p>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow border-l-4 border-green-500">
                        <h3 className="text-gray-500 text-sm font-medium uppercase">This Month</h3>
                        <p className="text-3xl font-bold text-gray-800 mt-2">{summary.servicesThisMonth}</p>
                        <p className="text-xs text-gray-400 mt-1">Jobs completed this month</p>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow border-l-4 border-purple-500">
                        <h3 className="text-gray-500 text-sm font-medium uppercase">Top Performer</h3>
                        <p className="text-2xl font-bold text-gray-800 mt-2 truncate" title={summary.topPerformer}>
                            {summary.topPerformer}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">Most jobs this month</p>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow border-l-4 border-orange-500">
                        <h3 className="text-gray-500 text-sm font-medium uppercase">On-Time Rate</h3>
                        <p className="text-3xl font-bold text-gray-800 mt-2">{summary.onTimeRate}%</p>
                        <p className="text-xs text-gray-400 mt-1">Overall attendance score</p>
                    </div>
                </div>

                {/* Employee Table */}
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h2 className="text-xl font-semibold text-gray-800">Employee Performance</h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rating</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Jobs Completed</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Jobs</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unique Clients</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Attendance</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">On-Time Rate</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {loading ? (
                                    <tr>
                                        <td colSpan="7" className="px-6 py-4 text-center text-gray-500">Loading data...</td>
                                    </tr>
                                ) : employees.length === 0 ? (
                                    <tr>
                                        <td colSpan="7" className="px-6 py-4 text-center text-gray-500">No employee data found</td>
                                    </tr>
                                ) : (
                                    employees.map((emp) => (
                                        <tr key={emp._id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{emp.username}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {emp.averageRating > 0 ? (
                                                    <div className="flex items-center">
                                                        <span className="text-yellow-500 text-lg mr-1">★</span>
                                                        <span className="font-semibold text-gray-900">{emp.averageRating.toFixed(1)}</span>
                                                        <span className="text-xs text-gray-400 ml-1">({emp.totalRatings || 0})</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-400 text-sm">No ratings</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-blue-100 text-blue-800">
                                                    {emp.jobsCompleted || 0}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-gray-500">{emp.totalServices}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-gray-500">{emp.uniqueClients}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-gray-500">{emp.attendanceCount} records</td>
                                            <td className="px-6 py-4 whitespace-nowrap align-middle">
                                                <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-200 max-w-[100px]">
                                                    <div
                                                        className={`h-2.5 rounded-full ${emp.onTimeRate >= 90 ? 'bg-green-600' :
                                                            emp.onTimeRate >= 75 ? 'bg-yellow-400' : 'bg-red-600'
                                                            }`}
                                                        style={{ width: `${emp.onTimeRate}%` }}
                                                    ></div>
                                                </div>
                                                <span className="text-xs text-gray-500 mt-1 inline-block">{emp.onTimeRate}%</span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </>
    );
};

export default PerformanceDashboard;
