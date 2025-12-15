import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    PlusIcon,
    MailIcon,
    DocumentDownloadIcon,
    CheckCircleIcon,
    XCircleIcon,
    RefreshIcon,
    CurrencyDollarIcon,
    EyeIcon,
    TrashIcon,
    ExclamationIcon
} from '@heroicons/react/outline';

const InvoicesPage = () => {
    const [invoices, setInvoices] = useState([]);
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [message, setMessage] = useState(null);
    const [stats, setStats] = useState(null);

    const [formData, setFormData] = useState({
        clientId: '',
        items: [{ description: '', quantity: 1, unitPrice: 0, amount: 0 }],
        notes: ''
    });

    useEffect(() => {
        fetchInvoices();
        fetchClients();
        fetchStats();
    }, []);

    const fetchInvoices = async () => {
        try {
            const res = await axios.get('/api/invoices');
            setInvoices(res.data);
        } catch (error) {
            console.error('Error fetching invoices:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchClients = async () => {
        try {
            const res = await axios.get('/api/clients');
            setClients(res.data);
        } catch (error) {
            console.error('Error fetching clients:', error);
        }
    };

    const fetchStats = async () => {
        try {
            const res = await axios.get('/api/invoices/stats/summary');
            setStats(res.data);
        } catch (error) {
            console.error('Error fetching stats:', error);
        }
    };

    const handleItemChange = (index, field, value) => {
        const newItems = [...formData.items];
        newItems[index][field] = value;
        if (field === 'quantity' || field === 'unitPrice') {
            newItems[index].amount = newItems[index].quantity * newItems[index].unitPrice;
        }
        setFormData({ ...formData, items: newItems });
    };

    const addItem = () => {
        setFormData({
            ...formData,
            items: [...formData.items, { description: '', quantity: 1, unitPrice: 0, amount: 0 }]
        });
    };

    const removeItem = (index) => {
        if (formData.items.length > 1) {
            const newItems = formData.items.filter((_, i) => i !== index);
            setFormData({ ...formData, items: newItems });
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            await axios.post('/api/invoices', formData);
            setMessage({ type: 'success', text: 'Invoice created!' });
            fetchInvoices();
            fetchStats();
            setShowModal(false);
            setFormData({
                clientId: '',
                items: [{ description: '', quantity: 1, unitPrice: 0, amount: 0 }],
                notes: ''
            });
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to create invoice' });
        }
    };

    const handleSend = async (id) => {
        try {
            await axios.post(`/api/invoices/${id}/send`);
            setMessage({ type: 'success', text: 'Invoice sent!' });
            fetchInvoices();
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to send invoice' });
        }
    };

    const handleGeneratePdf = async (id, invoiceNumber) => {
        try {
            // First generate the PDF
            await axios.post(`/api/invoices/${id}/generate-pdf`);

            // Then download it using axios (so proxy works correctly)
            const response = await axios.get(`/api/invoices/${id}/pdf`, {
                responseType: 'blob'
            });

            // Create download link
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `${invoiceNumber || 'invoice'}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);

            setMessage({ type: 'success', text: 'PDF downloaded!' });
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to generate PDF' });
        }
    };

    const handleMarkPaid = async (id) => {
        try {
            await axios.post(`/api/invoices/${id}/mark-paid`);
            setMessage({ type: 'success', text: 'Invoice marked as paid' });
            fetchInvoices();
            fetchStats();
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to update invoice' });
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this invoice?')) return;
        try {
            await axios.delete(`/api/invoices/${id}`);
            fetchInvoices();
            fetchStats();
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to delete' });
        }
    };

    const statusColors = {
        draft: 'bg-gray-100 text-gray-800',
        sent: 'bg-blue-100 text-blue-800',
        viewed: 'bg-purple-100 text-purple-800',
        paid: 'bg-green-100 text-green-800',
        overdue: 'bg-red-100 text-red-800',
        cancelled: 'bg-gray-100 text-gray-500'
    };

    const getTotal = () => {
        return formData.items.reduce((sum, item) => sum + (item.amount || 0), 0);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <RefreshIcon className="w-8 h-8 animate-spin text-blue-500" />
            </div>
        );
    }

    return (
        <div className="p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Invoices</h1>
                    <p className="text-gray-500">Create, send, and track payments</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                >
                    <PlusIcon className="w-5 h-5" />
                    New Invoice
                </button>
            </div>

            {/* Message */}
            {message && (
                <div className={`mb-4 p-4 rounded-lg flex items-center gap-2 ${message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
                    }`}>
                    {message.type === 'success' ? <CheckCircleIcon className="w-5 h-5" /> : <XCircleIcon className="w-5 h-5" />}
                    {message.text}
                </div>
            )}

            {/* Stats */}
            {stats && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white p-4 rounded-lg shadow-sm border">
                        <div className="text-2xl font-bold text-green-600">${(stats.totalRevenue || 0).toFixed(2)}</div>
                        <div className="text-sm text-gray-500">Total Paid</div>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow-sm border">
                        <div className="text-2xl font-bold text-orange-600">${(stats.outstanding || 0).toFixed(2)}</div>
                        <div className="text-sm text-gray-500">Outstanding</div>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow-sm border">
                        <div className="text-2xl font-bold text-blue-600">{stats.byStatus?.sent?.count || 0}</div>
                        <div className="text-sm text-gray-500">Awaiting Payment</div>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow-sm border">
                        <div className="text-2xl font-bold text-red-600">{stats.byStatus?.overdue?.count || 0}</div>
                        <div className="text-sm text-gray-500">Overdue</div>
                    </div>
                </div>
            )}

            {/* Invoices Table/Cards */}
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                {/* Desktop Table - Hidden on mobile */}
                <table className="w-full hidden md:table">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Invoice</th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Client</th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Amount</th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Due Date</th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Status</th>
                            <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {invoices.length === 0 ? (
                            <tr>
                                <td colSpan="6" className="px-4 py-8 text-center text-gray-500">
                                    No invoices yet. Click "New Invoice" to create one!
                                </td>
                            </tr>
                        ) : (
                            invoices.map(invoice => (
                                <tr key={invoice._id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3">
                                        <div className="font-medium text-gray-900">{invoice.invoiceNumber}</div>
                                        <div className="text-sm text-gray-500">
                                            {new Date(invoice.invoiceDate).toLocaleDateString()}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="text-sm">{invoice.clientName}</div>
                                        <div className="text-sm text-gray-500">{invoice.clientEmail}</div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="text-lg font-semibold text-gray-900">
                                            ${invoice.total.toFixed(2)}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="text-sm">
                                            {new Date(invoice.dueDate).toLocaleDateString()}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${statusColors[invoice.status]}`}>
                                            {invoice.status}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            {invoice.status !== 'paid' && (
                                                <>
                                                    <button
                                                        onClick={() => handleSend(invoice._id)}
                                                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                                                        title="Send Invoice"
                                                    >
                                                        <MailIcon className="w-5 h-5" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleMarkPaid(invoice._id)}
                                                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                                                        title="Mark as Paid"
                                                    >
                                                        <CheckCircleIcon className="w-5 h-5" />
                                                    </button>
                                                </>
                                            )}
                                            <button
                                                onClick={() => handleGeneratePdf(invoice._id, invoice.invoiceNumber)}
                                                className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg"
                                                title="Download PDF"
                                            >
                                                <DocumentDownloadIcon className="w-5 h-5" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(invoice._id)}
                                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                                                title="Delete"
                                            >
                                                <TrashIcon className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>

                {/* Mobile Cards - Visible only on small screens */}
                <div className="md:hidden divide-y divide-gray-200">
                    {invoices.length === 0 ? (
                        <div className="px-4 py-8 text-center text-gray-500">
                            No invoices yet. Click "New Invoice" to create one!
                        </div>
                    ) : (
                        invoices.map(invoice => (
                            <div key={invoice._id} className="p-4">
                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <div className="font-medium text-gray-900">{invoice.invoiceNumber}</div>
                                        <div className="text-sm text-gray-500">{invoice.clientName}</div>
                                    </div>
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${statusColors[invoice.status]}`}>
                                        {invoice.status}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center mb-3">
                                    <div className="text-xl font-bold text-green-600">
                                        ${invoice.total.toFixed(2)}
                                    </div>
                                    <div className="text-sm text-gray-500">
                                        Due: {new Date(invoice.dueDate).toLocaleDateString()}
                                    </div>
                                </div>
                                <div className="flex gap-2 pt-2 border-t">
                                    {invoice.status !== 'paid' && (
                                        <>
                                            <button
                                                onClick={() => handleSend(invoice._id)}
                                                className="flex-1 py-2 text-blue-600 bg-blue-50 rounded-lg text-sm font-medium flex items-center justify-center gap-1"
                                            >
                                                <MailIcon className="w-4 h-4" /> Send
                                            </button>
                                            <button
                                                onClick={() => handleMarkPaid(invoice._id)}
                                                className="flex-1 py-2 text-green-600 bg-green-50 rounded-lg text-sm font-medium flex items-center justify-center gap-1"
                                            >
                                                <CheckCircleIcon className="w-4 h-4" /> Paid
                                            </button>
                                        </>
                                    )}
                                    <button
                                        onClick={() => handleGeneratePdf(invoice._id, invoice.invoiceNumber)}
                                        className="flex-1 py-2 text-purple-600 bg-purple-50 rounded-lg text-sm font-medium flex items-center justify-center gap-1"
                                    >
                                        <DocumentDownloadIcon className="w-4 h-4" /> PDF
                                    </button>
                                    <button
                                        onClick={() => handleDelete(invoice._id)}
                                        className="py-2 px-3 text-red-600 bg-red-50 rounded-lg"
                                    >
                                        <TrashIcon className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Create Invoice Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b">
                            <h2 className="text-xl font-bold">Create Invoice</h2>
                        </div>
                        <form onSubmit={handleCreate} className="p-6 space-y-4">
                            {/* Client Selection */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Client *</label>
                                <select
                                    required
                                    value={formData.clientId}
                                    onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">Select a client...</option>
                                    {clients.map(client => (
                                        <option key={client._id} value={client._id}>
                                            {client.name} ({client.email})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Line Items */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Line Items</label>
                                <div className="space-y-2">
                                    {formData.items.map((item, index) => (
                                        <div key={index} className="flex gap-2 items-center">
                                            <input
                                                type="text"
                                                placeholder="Description"
                                                value={item.description}
                                                onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                                                className="flex-1 px-3 py-2 border rounded-lg text-sm"
                                                required
                                            />
                                            <input
                                                type="number"
                                                placeholder="Qty"
                                                value={item.quantity}
                                                onChange={(e) => handleItemChange(index, 'quantity', Number(e.target.value))}
                                                className="w-16 px-3 py-2 border rounded-lg text-sm"
                                                min="1"
                                            />
                                            <input
                                                type="number"
                                                placeholder="Price"
                                                value={item.unitPrice}
                                                onChange={(e) => handleItemChange(index, 'unitPrice', Number(e.target.value))}
                                                className="w-24 px-3 py-2 border rounded-lg text-sm"
                                                min="0"
                                                step="0.01"
                                            />
                                            <span className="w-24 text-right font-medium">${item.amount.toFixed(2)}</span>
                                            {formData.items.length > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={() => removeItem(index)}
                                                    className="p-1 text-red-500 hover:bg-red-50 rounded"
                                                >
                                                    <XCircleIcon className="w-5 h-5" />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                                <button
                                    type="button"
                                    onClick={addItem}
                                    className="mt-2 text-blue-600 text-sm hover:underline"
                                >
                                    + Add item
                                </button>
                            </div>

                            {/* Total */}
                            <div className="flex justify-end">
                                <div className="text-xl font-bold text-green-600">
                                    Total: ${getTotal().toFixed(2)}
                                </div>
                            </div>

                            {/* Notes */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                                <textarea
                                    value={formData.notes}
                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                    rows={2}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                    placeholder="Thank you for your business!"
                                />
                            </div>

                            <div className="flex justify-end gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="px-4 py-2 text-gray-700 border rounded-lg hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                >
                                    Create Invoice
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default InvoicesPage;
