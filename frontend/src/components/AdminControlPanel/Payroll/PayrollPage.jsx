import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    CurrencyDollarIcon,
    ClockIcon,
    DocumentDownloadIcon,
    RefreshIcon,
    CalendarIcon,
    UserGroupIcon,
    ChevronDownIcon,
    ChevronUpIcon
} from '@heroicons/react/outline';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subDays } from 'date-fns';

const PayrollPage = () => {
    const [loading, setLoading] = useState(false);
    const [report, setReport] = useState(null);
    const [startDate, setStartDate] = useState(format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd'));
    const [endDate, setEndDate] = useState(format(endOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd'));
    const [expandedEmployee, setExpandedEmployee] = useState(null);
    const [employeeDetails, setEmployeeDetails] = useState({});

    const quickRanges = [
        { label: 'This Week', getRange: () => ({ start: startOfWeek(new Date(), { weekStartsOn: 1 }), end: endOfWeek(new Date(), { weekStartsOn: 1 }) }) },
        { label: 'Last Week', getRange: () => ({ start: startOfWeek(subDays(new Date(), 7), { weekStartsOn: 1 }), end: endOfWeek(subDays(new Date(), 7), { weekStartsOn: 1 }) }) },
        { label: 'This Month', getRange: () => ({ start: startOfMonth(new Date()), end: endOfMonth(new Date()) }) },
        { label: 'Last 30 Days', getRange: () => ({ start: subDays(new Date(), 30), end: new Date() }) },
    ];

    const generateReport = async () => {
        setLoading(true);
        try {
            const res = await axios.get('/api/payroll/report', {
                params: { startDate, endDate }
            });
            setReport(res.data);
            setExpandedEmployee(null);
            setEmployeeDetails({});
        } catch (error) {
            console.error('Error generating report:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchEmployeeDetails = async (employeeId) => {
        if (employeeDetails[employeeId]) return;
        try {
            const res = await axios.get(`/api/payroll/employee/${employeeId}`, {
                params: { startDate, endDate }
            });
            setEmployeeDetails(prev => ({ ...prev, [employeeId]: res.data }));
        } catch (error) {
            console.error('Error fetching employee details:', error);
        }
    };

    const toggleEmployee = (employeeId) => {
        if (expandedEmployee === employeeId) {
            setExpandedEmployee(null);
        } else {
            setExpandedEmployee(employeeId);
            fetchEmployeeDetails(employeeId);
        }
    };

    const exportCSV = () => {
        if (!report) return;

        const headers = ['Employee', 'Email', 'Total Shifts', 'Total Hours', 'Avg Hours/Shift'];
        const rows = report.employees.map(emp => [
            emp.employeeName,
            emp.employeeEmail,
            emp.totalShifts,
            emp.totalHours,
            emp.avgHoursPerShift
        ]);

        // Add totals row
        rows.push(['TOTAL', '', report.totals.totalShifts, report.totals.totalHours, '']);

        const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `payroll_${startDate}_to_${endDate}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const setQuickRange = (range) => {
        const { start, end } = range.getRange();
        setStartDate(format(start, 'yyyy-MM-dd'));
        setEndDate(format(end, 'yyyy-MM-dd'));
    };

    useEffect(() => {
        generateReport();
    }, []);

    return (
        <div className="p-4 sm:p-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <CurrencyDollarIcon className="w-6 h-6 sm:w-8 sm:h-8 text-green-600" />
                        Payroll Report
                    </h1>
                    <p className="text-gray-500 text-sm sm:text-base">Track employee hours and generate payroll data</p>
                </div>
            </div>

            {/* Date Range Controls */}
            <div className="bg-white rounded-xl shadow-sm border p-4 sm:p-6 mb-6">
                <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-end">
                    {/* Date Inputs */}
                    <div className="flex flex-col sm:flex-row gap-4 flex-1">
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                            <div className="relative">
                                <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                                />
                            </div>
                        </div>
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                            <div className="relative">
                                <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Quick Ranges */}
                    <div className="flex flex-wrap gap-2">
                        {quickRanges.map((range, i) => (
                            <button
                                key={i}
                                onClick={() => setQuickRange(range)}
                                className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg"
                            >
                                {range.label}
                            </button>
                        ))}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                        <button
                            onClick={generateReport}
                            disabled={loading}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 disabled:opacity-50"
                        >
                            {loading ? <RefreshIcon className="w-5 h-5 animate-spin" /> : <RefreshIcon className="w-5 h-5" />}
                            Generate
                        </button>
                        {report && (
                            <button
                                onClick={exportCSV}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                            >
                                <DocumentDownloadIcon className="w-5 h-5" />
                                <span className="hidden sm:inline">Export CSV</span>
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Summary Cards */}
            {report && (
                <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-6">
                    <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-4 sm:p-6 rounded-xl">
                        <UserGroupIcon className="w-6 sm:w-8 h-6 sm:h-8 mb-2 opacity-80" />
                        <div className="text-2xl sm:text-3xl font-bold">{report.totals.employees}</div>
                        <div className="text-blue-100 text-sm">Employees</div>
                    </div>
                    <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-4 sm:p-6 rounded-xl">
                        <CalendarIcon className="w-6 sm:w-8 h-6 sm:h-8 mb-2 opacity-80" />
                        <div className="text-2xl sm:text-3xl font-bold">{report.totals.totalShifts}</div>
                        <div className="text-purple-100 text-sm">Total Shifts</div>
                    </div>
                    <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-4 sm:p-6 rounded-xl">
                        <ClockIcon className="w-6 sm:w-8 h-6 sm:h-8 mb-2 opacity-80" />
                        <div className="text-2xl sm:text-3xl font-bold">{report.totals.totalHours}</div>
                        <div className="text-green-100 text-sm">Total Hours</div>
                    </div>
                </div>
            )}

            {/* Desktop Table */}
            {report && (
                <div className="hidden md:block bg-white rounded-xl shadow-sm border overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Employee</th>
                                <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">Shifts</th>
                                <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">Total Hours</th>
                                <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">Avg Hours/Shift</th>
                                <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">Details</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {report.employees.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-4 py-8 text-center text-gray-500">
                                        No attendance records found for this period
                                    </td>
                                </tr>
                            ) : (
                                report.employees.map(emp => (
                                    <React.Fragment key={emp._id}>
                                        <tr className="hover:bg-gray-50">
                                            <td className="px-4 py-3">
                                                <div className="font-medium text-gray-900">{emp.employeeName}</div>
                                                <div className="text-sm text-gray-500">{emp.employeeEmail}</div>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full font-medium">
                                                    {emp.totalShifts}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <span className="text-lg font-bold text-green-600">{emp.totalHours}</span>
                                            </td>
                                            <td className="px-4 py-3 text-center text-gray-600">
                                                {emp.avgHoursPerShift}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <button
                                                    onClick={() => toggleEmployee(emp._id)}
                                                    className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
                                                >
                                                    {expandedEmployee === emp._id ? <ChevronUpIcon className="w-5 h-5" /> : <ChevronDownIcon className="w-5 h-5" />}
                                                </button>
                                            </td>
                                        </tr>
                                        {expandedEmployee === emp._id && employeeDetails[emp._id] && (
                                            <tr>
                                                <td colSpan="5" className="bg-gray-50 px-6 py-4">
                                                    <div className="text-sm font-medium text-gray-700 mb-2">Shift Details</div>
                                                    <div className="space-y-2 max-h-60 overflow-y-auto">
                                                        {employeeDetails[emp._id].map((shift, i) => (
                                                            <div key={i} className="flex justify-between items-center bg-white p-3 rounded-lg border">
                                                                <div>
                                                                    <div className="font-medium">{format(new Date(shift.date), 'EEE, MMM d, yyyy')}</div>
                                                                    <div className="text-sm text-gray-500">{shift.client}</div>
                                                                </div>
                                                                <div className="text-right">
                                                                    <div className="text-sm text-gray-600">
                                                                        {format(new Date(shift.checkIn), 'h:mm a')} - {format(new Date(shift.checkOut), 'h:mm a')}
                                                                    </div>
                                                                    <div className="font-medium text-green-600">{shift.hours} hrs</div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                ))
                            )}
                        </tbody>
                        {report.employees.length > 0 && (
                            <tfoot className="bg-gray-100">
                                <tr className="font-bold">
                                    <td className="px-4 py-3 text-gray-900">TOTAL</td>
                                    <td className="px-4 py-3 text-center text-purple-700">{report.totals.totalShifts}</td>
                                    <td className="px-4 py-3 text-center text-green-600">{report.totals.totalHours}</td>
                                    <td className="px-4 py-3 text-center">-</td>
                                    <td className="px-4 py-3"></td>
                                </tr>
                            </tfoot>
                        )}
                    </table>
                </div>
            )}

            {/* Mobile Cards */}
            {report && (
                <div className="md:hidden space-y-3">
                    {report.employees.length === 0 ? (
                        <div className="bg-white rounded-xl shadow-sm border p-6 text-center text-gray-500">
                            No attendance records found for this period
                        </div>
                    ) : (
                        report.employees.map(emp => (
                            <div key={emp._id} className="bg-white rounded-xl shadow-sm border overflow-hidden">
                                <div className="p-4">
                                    <div className="flex items-start justify-between mb-3">
                                        <div>
                                            <div className="font-medium text-gray-900">{emp.employeeName}</div>
                                            <div className="text-sm text-gray-500">{emp.employeeEmail}</div>
                                        </div>
                                        <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                                            {emp.totalShifts} shifts
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3 text-sm">
                                        <div>
                                            <div className="text-gray-500">Total Hours</div>
                                            <div className="text-lg font-bold text-green-600">{emp.totalHours}</div>
                                        </div>
                                        <div>
                                            <div className="text-gray-500">Avg/Shift</div>
                                            <div className="font-medium">{emp.avgHoursPerShift} hrs</div>
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => toggleEmployee(emp._id)}
                                    className="w-full py-2 text-sm text-gray-600 bg-gray-50 hover:bg-gray-100 flex items-center justify-center gap-1"
                                >
                                    {expandedEmployee === emp._id ? (
                                        <><ChevronUpIcon className="w-4 h-4" /> Hide Details</>
                                    ) : (
                                        <><ChevronDownIcon className="w-4 h-4" /> View Details</>
                                    )}
                                </button>
                                {expandedEmployee === emp._id && employeeDetails[emp._id] && (
                                    <div className="border-t p-4 bg-gray-50 space-y-2 max-h-60 overflow-y-auto">
                                        {employeeDetails[emp._id].map((shift, i) => (
                                            <div key={i} className="bg-white p-3 rounded-lg border text-sm">
                                                <div className="flex justify-between mb-1">
                                                    <span className="font-medium">{format(new Date(shift.date), 'MMM d')}</span>
                                                    <span className="text-green-600 font-medium">{shift.hours} hrs</span>
                                                </div>
                                                <div className="text-gray-500">{shift.client}</div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* Loading State */}
            {loading && !report && (
                <div className="flex items-center justify-center h-64">
                    <RefreshIcon className="w-8 h-8 animate-spin text-green-500" />
                </div>
            )}
        </div>
    );
};

export default PayrollPage;
