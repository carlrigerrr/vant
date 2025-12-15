import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import {
    TruckIcon,
    DocumentDownloadIcon,
    RefreshIcon,
    FilterIcon,
    CashIcon,
    LocationMarkerIcon
} from '@heroicons/react/outline';

const MileageReport = () => {
    const [loading, setLoading] = useState(true);
    const [report, setReport] = useState({
        records: [],
        summary: { totalMiles: 0, totalReimbursement: 0, ratePerMile: 0.65, recordCount: 0 },
        byEmployee: []
    });
    const [employees, setEmployees] = useState([]);
    const [filters, setFilters] = useState({
        startDate: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
        endDate: format(endOfMonth(new Date()), 'yyyy-MM-dd'),
        employeeId: ''
    });

    useEffect(() => {
        fetchEmployees();
        fetchReport();
    }, []);

    const fetchEmployees = async () => {
        try {
            const response = await axios.get('/api/users');
            setEmployees(response.data.filter(u => !u.admin));
        } catch (error) {
            console.error('Error fetching employees:', error);
        }
    };

    const fetchReport = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (filters.startDate) params.append('startDate', filters.startDate);
            if (filters.endDate) params.append('endDate', filters.endDate);
            if (filters.employeeId) params.append('employeeId', filters.employeeId);

            const response = await axios.get(`/api/attendance/mileage-report?${params.toString()}`);
            setReport(response.data);
        } catch (error) {
            console.error('Error fetching mileage report:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const handleApplyFilters = () => {
        fetchReport();
    };

    const setPresetRange = (preset) => {
        const today = new Date();
        let start, end;

        switch (preset) {
            case 'thisMonth':
                start = startOfMonth(today);
                end = endOfMonth(today);
                break;
            case 'lastMonth':
                start = startOfMonth(subMonths(today, 1));
                end = endOfMonth(subMonths(today, 1));
                break;
            case 'last3Months':
                start = startOfMonth(subMonths(today, 2));
                end = endOfMonth(today);
                break;
            default:
                return;
        }

        setFilters(prev => ({
            ...prev,
            startDate: format(start, 'yyyy-MM-dd'),
            endDate: format(end, 'yyyy-MM-dd')
        }));
    };

    const exportToCSV = () => {
        const headers = ['Date', 'Employee', 'Client', 'Miles', 'Reimbursement'];
        const rows = report.records.map(r => [
            format(new Date(r.date), 'MM/dd/yyyy'),
            r.employeeName,
            r.clientName,
            r.distanceMiles.toFixed(2),
            `$${r.reimbursement.toFixed(2)}`
        ]);

        const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `mileage-report-${filters.startDate}-to-${filters.endDate}.csv`;
        a.click();
    };

    return (
        <div className="p-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-xl text-white">
                        <TruckIcon className="w-7 h-7" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Mileage Report</h1>
                        <p className="text-gray-500 text-sm">Track employee mileage for reimbursement</p>
                    </div>
                </div>
                <button
                    onClick={exportToCSV}
                    disabled={report.records.length === 0}
                    className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <DocumentDownloadIcon className="w-5 h-5" />
                    Export CSV
                </button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <TruckIcon className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Total Miles</p>
                            <p className="text-2xl font-bold text-gray-900">{report.summary.totalMiles.toFixed(1)}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-100 rounded-lg">
                            <CashIcon className="w-6 h-6 text-green-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Total Reimbursement</p>
                            <p className="text-2xl font-bold text-green-600">${report.summary.totalReimbursement.toFixed(2)}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-100 rounded-lg">
                            <LocationMarkerIcon className="w-6 h-6 text-purple-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Total Trips</p>
                            <p className="text-2xl font-bold text-gray-900">{report.summary.recordCount}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-orange-100 rounded-lg">
                            <CashIcon className="w-6 h-6 text-orange-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Rate per Mile</p>
                            <p className="text-2xl font-bold text-gray-900">${report.summary.ratePerMile.toFixed(2)}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
                <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-2">
                        <FilterIcon className="w-5 h-5 text-gray-400" />
                        <span className="text-sm font-medium text-gray-700">Filters:</span>
                    </div>

                    {/* Date Range Presets */}
                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={() => setPresetRange('thisMonth')}
                            className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                        >
                            This Month
                        </button>
                        <button
                            onClick={() => setPresetRange('lastMonth')}
                            className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                        >
                            Last Month
                        </button>
                        <button
                            onClick={() => setPresetRange('last3Months')}
                            className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                        >
                            Last 3 Months
                        </button>
                    </div>

                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                        <input
                            type="date"
                            value={filters.startDate}
                            onChange={(e) => handleFilterChange('startDate', e.target.value)}
                            className="w-full sm:w-auto px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
                        />
                        <span className="text-gray-400 hidden sm:inline">to</span>
                        <input
                            type="date"
                            value={filters.endDate}
                            onChange={(e) => handleFilterChange('endDate', e.target.value)}
                            className="w-full sm:w-auto px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
                        />
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2">
                        <select
                            value={filters.employeeId}
                            onChange={(e) => handleFilterChange('employeeId', e.target.value)}
                            className="w-full sm:w-auto px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
                        >
                            <option value="">All Employees</option>
                            {employees.map(emp => (
                                <option key={emp._id} value={emp._id}>{emp.username}</option>
                            ))}
                        </select>

                        <button
                            onClick={handleApplyFilters}
                            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-1.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
                        >
                            <RefreshIcon className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                            Apply
                        </button>
                    </div>
                </div>
            </div>

            {/* Employee Summary */}
            {report.byEmployee.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">By Employee</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {report.byEmployee.map((emp, idx) => (
                            <div key={idx} className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                                <p className="font-semibold text-gray-900">{emp.employeeName}</p>
                                <div className="flex justify-between mt-2 text-sm">
                                    <span className="text-gray-500">{emp.trips} trips</span>
                                    <span className="text-gray-700">{emp.totalMiles.toFixed(1)} mi</span>
                                    <span className="text-green-600 font-medium">${emp.totalReimbursement.toFixed(2)}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Records Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Date</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Employee</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Client</th>
                                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Miles</th>
                                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Reimbursement</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center">
                                        <RefreshIcon className="w-8 h-8 animate-spin text-blue-500 mx-auto" />
                                    </td>
                                </tr>
                            ) : report.records.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                                        No mileage records found for this period
                                    </td>
                                </tr>
                            ) : (
                                report.records.map((record) => (
                                    <tr key={record.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {format(new Date(record.date), 'MMM d, yyyy')}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            {record.employeeName}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                            {record.clientName}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                                            {record.distanceMiles.toFixed(2)} mi
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600 text-right">
                                            ${record.reimbursement.toFixed(2)}
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

export default MileageReport;
