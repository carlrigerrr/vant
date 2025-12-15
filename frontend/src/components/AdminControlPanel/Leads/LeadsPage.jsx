import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    UserAddIcon,
    MailIcon,
    PencilIcon,
    TrashIcon,
    CheckCircleIcon,
    XCircleIcon,
    RefreshIcon,
    CurrencyDollarIcon,
    CalculatorIcon,
    PlusIcon,
    SparklesIcon
} from '@heroicons/react/outline';

const LeadsPage = () => {
    const [leads, setLeads] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingLead, setEditingLead] = useState(null);
    const [message, setMessage] = useState(null);
    const [stats, setStats] = useState(null);

    // Smart Quote Calculator
    const [templates, setTemplates] = useState([]);
    const [showQuoteCalc, setShowQuoteCalc] = useState(false);
    const [showTemplateModal, setShowTemplateModal] = useState(false);
    const [quoteInputs, setQuoteInputs] = useState({
        templateId: '',
        rooms: 0,
        bathrooms: 0,
        sqFt: 0,
        hours: 0,
        extras: [],
        frequency: 'oneTime'
    });
    const [calculatedQuote, setCalculatedQuote] = useState(null);
    const [targetLeadId, setTargetLeadId] = useState(null);

    // Template editing
    const [templateForm, setTemplateForm] = useState({
        name: '',
        description: '',
        basePrice: 0,
        pricePerRoom: 0,
        pricePerBathroom: 0,
        pricePerSqFt: 0,
        pricePerHour: 0,
        extras: []
    });
    const [newExtra, setNewExtra] = useState({ name: '', price: 0 });

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        address: '',
        serviceType: 'regular',
        frequency: 'weekly',
        quoteAmount: '',
        notes: ''
    });

    useEffect(() => {
        fetchLeads();
        fetchStats();
        fetchTemplates();
    }, []);

    const fetchLeads = async () => {
        try {
            const res = await axios.get('/api/leads');
            setLeads(res.data);
        } catch (error) {
            console.error('Error fetching leads:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const res = await axios.get('/api/leads/stats/summary');
            setStats(res.data);
        } catch (error) {
            console.error('Error fetching stats:', error);
        }
    };

    const fetchTemplates = async () => {
        try {
            const res = await axios.get('/api/service-templates');
            setTemplates(res.data);
        } catch (error) {
            console.error('Error fetching templates:', error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingLead) {
                await axios.put(`/api/leads/${editingLead._id}`, formData);
                setMessage({ type: 'success', text: 'Lead updated!' });
            } else {
                await axios.post('/api/leads', formData);
                setMessage({ type: 'success', text: 'Lead created!' });
            }
            fetchLeads();
            fetchStats();
            closeModal();
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to save lead' });
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this lead?')) return;
        try {
            await axios.delete(`/api/leads/${id}`);
            fetchLeads();
            fetchStats();
            setMessage({ type: 'success', text: 'Lead deleted' });
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to delete' });
        }
    };

    const handleSendQuote = async (lead) => {
        if (!lead.quoteAmount || lead.quoteAmount <= 0) {
            setMessage({ type: 'error', text: 'Please set a quote amount first' });
            return;
        }
        try {
            await axios.post(`/api/leads/${lead._id}/send-quote`);
            fetchLeads();
            setMessage({ type: 'success', text: `Quote sent to ${lead.email}!` });
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to send quote' });
        }
    };

    const openModal = (lead = null) => {
        if (lead) {
            setEditingLead(lead);
            setFormData({
                name: lead.name || '',
                email: lead.email || '',
                phone: lead.phone || '',
                address: lead.address || '',
                serviceType: lead.serviceType || 'regular',
                frequency: lead.frequency || 'weekly',
                quoteAmount: lead.quoteAmount || '',
                notes: lead.notes || ''
            });
        } else {
            setEditingLead(null);
            setFormData({
                name: '', email: '', phone: '', address: '',
                serviceType: 'regular', frequency: 'weekly', quoteAmount: '', notes: ''
            });
        }
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingLead(null);
    };

    // Smart Quote Calculator
    const openQuoteCalc = (leadId = null) => {
        setTargetLeadId(leadId);
        setQuoteInputs({
            templateId: templates[0]?._id || '',
            rooms: 0,
            bathrooms: 0,
            sqFt: 0,
            hours: 0,
            extras: [],
            frequency: 'oneTime'
        });
        setCalculatedQuote(null);
        setShowQuoteCalc(true);
    };

    const calculateQuote = async () => {
        if (!quoteInputs.templateId) {
            setMessage({ type: 'error', text: 'Please select a template' });
            return;
        }
        try {
            const res = await axios.post('/api/service-templates/calculate', quoteInputs);
            setCalculatedQuote(res.data);
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to calculate quote' });
        }
    };

    const applyQuoteToLead = async () => {
        if (!calculatedQuote || !targetLeadId) return;
        try {
            await axios.put(`/api/leads/${targetLeadId}`, { quoteAmount: calculatedQuote.total });
            fetchLeads();
            setShowQuoteCalc(false);
            setMessage({ type: 'success', text: `Quote of $${calculatedQuote.total} applied!` });
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to apply quote' });
        }
    };

    // Template Management
    const saveTemplate = async () => {
        try {
            await axios.post('/api/service-templates', templateForm);
            fetchTemplates();
            setShowTemplateModal(false);
            setTemplateForm({
                name: '', description: '', basePrice: 0, pricePerRoom: 0,
                pricePerBathroom: 0, pricePerSqFt: 0, pricePerHour: 0, extras: []
            });
            setMessage({ type: 'success', text: 'Template created!' });
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to create template' });
        }
    };

    const addExtra = () => {
        if (newExtra.name && newExtra.price > 0) {
            setTemplateForm(prev => ({
                ...prev,
                extras: [...prev.extras, { ...newExtra }]
            }));
            setNewExtra({ name: '', price: 0 });
        }
    };

    const selectedTemplate = templates.find(t => t._id === quoteInputs.templateId);

    const statusColors = {
        new: 'bg-blue-100 text-blue-800',
        contacted: 'bg-yellow-100 text-yellow-800',
        quoted: 'bg-purple-100 text-purple-800',
        approved: 'bg-green-100 text-green-800',
        converted: 'bg-emerald-100 text-emerald-800',
        lost: 'bg-red-100 text-red-800'
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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Lead Management</h1>
                    <p className="text-gray-500 text-sm sm:text-base">Track prospects and send quotes</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setShowTemplateModal(true)}
                        className="flex-1 sm:flex-none px-3 sm:px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center justify-center gap-2 text-sm sm:text-base"
                    >
                        <SparklesIcon className="w-5 h-5" />
                        <span className="hidden sm:inline">Templates</span>
                    </button>
                    <button
                        onClick={() => openModal()}
                        className="flex-1 sm:flex-none px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2 text-sm sm:text-base"
                    >
                        <UserAddIcon className="w-5 h-5" />
                        <span>Add Lead</span>
                    </button>
                </div>
            </div>

            {/* Message */}
            {message && (
                <div className={`mb-4 p-3 sm:p-4 rounded-lg flex items-center gap-2 text-sm sm:text-base ${message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
                    }`}>
                    {message.type === 'success' ? <CheckCircleIcon className="w-5 h-5 flex-shrink-0" /> : <XCircleIcon className="w-5 h-5 flex-shrink-0" />}
                    <span className="flex-1">{message.text}</span>
                    <button onClick={() => setMessage(null)} className="ml-auto">✕</button>
                </div>
            )}

            {/* Stats */}
            {stats && (
                <div className="grid grid-cols-3 md:grid-cols-6 gap-2 sm:gap-4 mb-6">
                    <div className="bg-white p-2 sm:p-4 rounded-lg shadow-sm border text-center">
                        <div className="text-lg sm:text-2xl font-bold text-gray-900">{stats.total || 0}</div>
                        <div className="text-xs sm:text-sm text-gray-500">Total</div>
                    </div>
                    {['new', 'quoted', 'approved', 'converted', 'lost'].map(status => (
                        <div key={status} className="bg-white p-2 sm:p-4 rounded-lg shadow-sm border text-center">
                            <div className="text-lg sm:text-2xl font-bold text-gray-900">{stats.byStatus?.[status] || 0}</div>
                            <div className={`text-xs capitalize ${statusColors[status]} px-1 sm:px-2 py-0.5 rounded inline-block mt-1`}>
                                {status}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Desktop Table - Hidden on mobile */}
            <div className="hidden md:block bg-white rounded-xl shadow-sm border overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Name</th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Contact</th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Service</th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Quote</th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Status</th>
                            <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {leads.length === 0 ? (
                            <tr>
                                <td colSpan="6" className="px-4 py-8 text-center text-gray-500">
                                    No leads yet. Click "Add Lead" to get started!
                                </td>
                            </tr>
                        ) : (
                            leads.map(lead => (
                                <tr key={lead._id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3">
                                        <div className="font-medium text-gray-900">{lead.name}</div>
                                        <div className="text-sm text-gray-500">{lead.address}</div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="text-sm">{lead.email}</div>
                                        <div className="text-sm text-gray-500">{lead.phone}</div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="text-sm capitalize">{lead.serviceType}</div>
                                        <div className="text-sm text-gray-500 capitalize">{lead.frequency}</div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2">
                                            <div className="text-lg font-semibold text-green-600">
                                                ${lead.quoteAmount || 0}
                                            </div>
                                            <button
                                                onClick={() => openQuoteCalc(lead._id)}
                                                className="p-1 text-purple-600 hover:bg-purple-50 rounded"
                                                title="Smart Quote"
                                            >
                                                <CalculatorIcon className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${statusColors[lead.status]}`}>
                                            {lead.status}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            {lead.status !== 'converted' && lead.status !== 'lost' && (
                                                <button
                                                    onClick={() => handleSendQuote(lead)}
                                                    className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg"
                                                    title="Send Quote"
                                                >
                                                    <MailIcon className="w-5 h-5" />
                                                </button>
                                            )}
                                            <button
                                                onClick={() => openModal(lead)}
                                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                                                title="Edit"
                                            >
                                                <PencilIcon className="w-5 h-5" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(lead._id)}
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
            </div>

            {/* Mobile Cards - Visible only on mobile */}
            <div className="md:hidden space-y-3">
                {leads.length === 0 ? (
                    <div className="bg-white rounded-xl shadow-sm border p-6 text-center text-gray-500">
                        No leads yet. Click "Add Lead" to get started!
                    </div>
                ) : (
                    leads.map(lead => (
                        <div key={lead._id} className="bg-white rounded-xl shadow-sm border p-4">
                            {/* Header Row */}
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex-1">
                                    <div className="font-medium text-gray-900">{lead.name}</div>
                                    <div className="text-sm text-gray-500">{lead.email}</div>
                                </div>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${statusColors[lead.status]}`}>
                                    {lead.status}
                                </span>
                            </div>

                            {/* Info Grid */}
                            <div className="grid grid-cols-2 gap-3 mb-3 text-sm">
                                <div>
                                    <div className="text-gray-500">Phone</div>
                                    <div>{lead.phone || '-'}</div>
                                </div>
                                <div>
                                    <div className="text-gray-500">Service</div>
                                    <div className="capitalize">{lead.serviceType}</div>
                                </div>
                                <div>
                                    <div className="text-gray-500">Frequency</div>
                                    <div className="capitalize">{lead.frequency}</div>
                                </div>
                                <div>
                                    <div className="text-gray-500">Quote</div>
                                    <div className="text-green-600 font-semibold flex items-center gap-1">
                                        ${lead.quoteAmount || 0}
                                        <button
                                            onClick={() => openQuoteCalc(lead._id)}
                                            className="p-1 text-purple-600"
                                        >
                                            <CalculatorIcon className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {lead.address && (
                                <div className="text-sm text-gray-500 mb-3 truncate">
                                    📍 {lead.address}
                                </div>
                            )}

                            {/* Actions */}
                            <div className="flex items-center gap-2 pt-3 border-t">
                                {lead.status !== 'converted' && lead.status !== 'lost' && (
                                    <button
                                        onClick={() => handleSendQuote(lead)}
                                        className="flex-1 py-2 text-purple-600 bg-purple-50 hover:bg-purple-100 rounded-lg text-sm font-medium flex items-center justify-center gap-1"
                                    >
                                        <MailIcon className="w-4 h-4" />
                                        Send Quote
                                    </button>
                                )}
                                <button
                                    onClick={() => openModal(lead)}
                                    className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg"
                                >
                                    <PencilIcon className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={() => handleDelete(lead._id)}
                                    className="p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg"
                                >
                                    <TrashIcon className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Lead Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b">
                            <h2 className="text-xl font-bold">{editingLead ? 'Edit Lead' : 'Add New Lead'}</h2>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                                    <input
                                        type="email"
                                        required
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                                    <input
                                        type="tel"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                                <input
                                    type="text"
                                    value={formData.address}
                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Service Type</label>
                                    <select
                                        value={formData.serviceType}
                                        onChange={(e) => setFormData({ ...formData, serviceType: e.target.value })}
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="regular">Regular Cleaning</option>
                                        <option value="deep-clean">Deep Cleaning</option>
                                        <option value="move-out">Move-Out</option>
                                        <option value="move-in">Move-In</option>
                                        <option value="one-time">One-Time</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Frequency</label>
                                    <select
                                        value={formData.frequency}
                                        onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="weekly">Weekly</option>
                                        <option value="biweekly">Bi-Weekly</option>
                                        <option value="monthly">Monthly</option>
                                        <option value="one-time">One-Time</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Quote Amount ($)</label>
                                <div className="relative">
                                    <CurrencyDollarIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={formData.quoteAmount}
                                        onChange={(e) => setFormData({ ...formData, quoteAmount: e.target.value })}
                                        className="w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                        placeholder="150.00"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                                <textarea
                                    value={formData.notes}
                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                    rows={3}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div className="flex justify-end gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="px-4 py-2 text-gray-700 border rounded-lg hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                >
                                    {editingLead ? 'Save Changes' : 'Add Lead'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Smart Quote Calculator Modal */}
            {showQuoteCalc && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-t-xl">
                            <h2 className="text-xl font-bold flex items-center gap-2">
                                <CalculatorIcon className="w-6 h-6" /> Smart Quote Calculator
                            </h2>
                            <p className="text-purple-100 text-sm">Calculate accurate quotes instantly</p>
                        </div>

                        <div className="p-6 space-y-4">
                            {templates.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">
                                    <SparklesIcon className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                                    <p>No templates yet. Create one first!</p>
                                    <button
                                        onClick={() => { setShowQuoteCalc(false); setShowTemplateModal(true); }}
                                        className="mt-2 text-purple-600 hover:underline"
                                    >
                                        Create Template
                                    </button>
                                </div>
                            ) : (
                                <>
                                    {/* Template Selection */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Service Template</label>
                                        <select
                                            value={quoteInputs.templateId}
                                            onChange={(e) => setQuoteInputs({ ...quoteInputs, templateId: e.target.value })}
                                            className="w-full px-3 py-2 border rounded-lg"
                                        >
                                            {templates.map(t => (
                                                <option key={t._id} value={t._id}>{t.name} (${t.basePrice} base)</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Inputs Grid */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Rooms (${selectedTemplate?.pricePerRoom || 0}/room)
                                            </label>
                                            <input
                                                type="number"
                                                min="0"
                                                value={quoteInputs.rooms}
                                                onChange={(e) => setQuoteInputs({ ...quoteInputs, rooms: e.target.value })}
                                                className="w-full px-3 py-2 border rounded-lg"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Bathrooms (${selectedTemplate?.pricePerBathroom || 0}/bath)
                                            </label>
                                            <input
                                                type="number"
                                                min="0"
                                                value={quoteInputs.bathrooms}
                                                onChange={(e) => setQuoteInputs({ ...quoteInputs, bathrooms: e.target.value })}
                                                className="w-full px-3 py-2 border rounded-lg"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Sq. Ft. (${selectedTemplate?.pricePerSqFt || 0}/sqft)
                                            </label>
                                            <input
                                                type="number"
                                                min="0"
                                                value={quoteInputs.sqFt}
                                                onChange={(e) => setQuoteInputs({ ...quoteInputs, sqFt: e.target.value })}
                                                className="w-full px-3 py-2 border rounded-lg"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Frequency</label>
                                            <select
                                                value={quoteInputs.frequency}
                                                onChange={(e) => setQuoteInputs({ ...quoteInputs, frequency: e.target.value })}
                                                className="w-full px-3 py-2 border rounded-lg"
                                            >
                                                <option value="weekly">Weekly (-15%)</option>
                                                <option value="biweekly">Bi-Weekly (-10%)</option>
                                                <option value="monthly">Monthly (-5%)</option>
                                                <option value="oneTime">One-Time</option>
                                            </select>
                                        </div>
                                    </div>

                                    {/* Extras */}
                                    {selectedTemplate?.extras?.length > 0 && (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Add-ons</label>
                                            <div className="flex flex-wrap gap-2">
                                                {selectedTemplate.extras.map((extra, i) => (
                                                    <label key={i} className={`px-3 py-2 rounded-lg border cursor-pointer transition-colors ${quoteInputs.extras.includes(extra.name)
                                                        ? 'bg-purple-100 border-purple-500 text-purple-700'
                                                        : 'hover:bg-gray-50'
                                                        }`}>
                                                        <input
                                                            type="checkbox"
                                                            className="sr-only"
                                                            checked={quoteInputs.extras.includes(extra.name)}
                                                            onChange={(e) => {
                                                                if (e.target.checked) {
                                                                    setQuoteInputs({ ...quoteInputs, extras: [...quoteInputs.extras, extra.name] });
                                                                } else {
                                                                    setQuoteInputs({ ...quoteInputs, extras: quoteInputs.extras.filter(n => n !== extra.name) });
                                                                }
                                                            }}
                                                        />
                                                        {extra.name} (+${extra.price})
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Calculate Button */}
                                    <button
                                        onClick={calculateQuote}
                                        className="w-full py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium"
                                    >
                                        Calculate Quote
                                    </button>

                                    {/* Result */}
                                    {calculatedQuote && (
                                        <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg border border-green-200">
                                            <div className="text-sm text-gray-600 mb-2">Quote Breakdown:</div>
                                            <div className="space-y-1 text-sm">
                                                <div className="flex justify-between">
                                                    <span>Base Price:</span>
                                                    <span>${calculatedQuote.breakdown?.basePrice || 0}</span>
                                                </div>
                                                {calculatedQuote.breakdown?.roomsCharge > 0 && (
                                                    <div className="flex justify-between">
                                                        <span>Rooms:</span>
                                                        <span>+${calculatedQuote.breakdown.roomsCharge}</span>
                                                    </div>
                                                )}
                                                {calculatedQuote.breakdown?.bathroomsCharge > 0 && (
                                                    <div className="flex justify-between">
                                                        <span>Bathrooms:</span>
                                                        <span>+${calculatedQuote.breakdown.bathroomsCharge}</span>
                                                    </div>
                                                )}
                                                {calculatedQuote.breakdown?.sqFtCharge > 0 && (
                                                    <div className="flex justify-between">
                                                        <span>Sq. Ft.:</span>
                                                        <span>+${calculatedQuote.breakdown.sqFtCharge}</span>
                                                    </div>
                                                )}
                                                {calculatedQuote.breakdown?.extras?.map((e, i) => (
                                                    <div key={i} className="flex justify-between">
                                                        <span>{e.name}:</span>
                                                        <span>+${e.price}</span>
                                                    </div>
                                                ))}
                                                <div className="border-t pt-1 flex justify-between">
                                                    <span>Subtotal:</span>
                                                    <span>${calculatedQuote.subtotal}</span>
                                                </div>
                                                {calculatedQuote.discount > 0 && (
                                                    <div className="flex justify-between text-green-600">
                                                        <span>Frequency Discount ({calculatedQuote.discountPercent}%):</span>
                                                        <span>-${calculatedQuote.discount}</span>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="mt-3 pt-3 border-t flex justify-between items-center">
                                                <span className="text-lg font-bold">Total:</span>
                                                <span className="text-2xl font-bold text-green-600">${calculatedQuote.total}</span>
                                            </div>
                                            {targetLeadId && (
                                                <button
                                                    onClick={applyQuoteToLead}
                                                    className="w-full mt-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                                                >
                                                    Apply to Lead
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </>
                            )}
                        </div>

                        <div className="p-4 border-t flex justify-end">
                            <button
                                onClick={() => setShowQuoteCalc(false)}
                                className="px-4 py-2 text-gray-700 border rounded-lg hover:bg-gray-50"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Template Management Modal */}
            {showTemplateModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 bg-gradient-to-r from-purple-600 to-pink-600 rounded-t-xl">
                            <h2 className="text-xl font-bold flex items-center gap-2 text-white">
                                <SparklesIcon className="w-6 h-6 text-white" /> Service Templates
                            </h2>
                            <p className="text-white text-sm opacity-90">Manage pricing templates for quick quotes</p>
                        </div>

                        <div className="p-6">
                            {/* Existing Templates */}
                            {templates.length > 0 && (
                                <div className="mb-6">
                                    <h3 className="font-medium text-gray-700 mb-2">Existing Templates</h3>
                                    <div className="space-y-2">
                                        {templates.map(t => (
                                            <div key={t._id} className="p-3 bg-gray-50 rounded-lg flex justify-between items-center">
                                                <div>
                                                    <div className="font-medium">{t.name}</div>
                                                    <div className="text-sm text-gray-500">
                                                        Base: ${t.basePrice} | Room: ${t.pricePerRoom} | Bath: ${t.pricePerBathroom}
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={async () => {
                                                        await axios.delete(`/api/service-templates/${t._id}`);
                                                        fetchTemplates();
                                                    }}
                                                    className="text-red-500 p-1 hover:bg-red-50 rounded"
                                                >
                                                    <TrashIcon className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* New Template Form */}
                            <h3 className="font-medium text-gray-700 mb-2">Create New Template</h3>
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Template Name</label>
                                        <input
                                            type="text"
                                            value={templateForm.name}
                                            onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
                                            className="w-full px-3 py-2 border rounded-lg"
                                            placeholder="e.g., Deep Clean"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Base Price ($)</label>
                                        <input
                                            type="number"
                                            value={templateForm.basePrice}
                                            onChange={(e) => setTemplateForm({ ...templateForm, basePrice: parseFloat(e.target.value) || 0 })}
                                            className="w-full px-3 py-2 border rounded-lg"
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">$ per Room</label>
                                        <input
                                            type="number"
                                            value={templateForm.pricePerRoom}
                                            onChange={(e) => setTemplateForm({ ...templateForm, pricePerRoom: parseFloat(e.target.value) || 0 })}
                                            className="w-full px-3 py-2 border rounded-lg"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">$ per Bathroom</label>
                                        <input
                                            type="number"
                                            value={templateForm.pricePerBathroom}
                                            onChange={(e) => setTemplateForm({ ...templateForm, pricePerBathroom: parseFloat(e.target.value) || 0 })}
                                            className="w-full px-3 py-2 border rounded-lg"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">$ per Sq. Ft.</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={templateForm.pricePerSqFt}
                                            onChange={(e) => setTemplateForm({ ...templateForm, pricePerSqFt: parseFloat(e.target.value) || 0 })}
                                            className="w-full px-3 py-2 border rounded-lg"
                                        />
                                    </div>
                                </div>

                                {/* Extras */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Add-ons</label>
                                    <div className="flex gap-2 mb-2">
                                        <input
                                            type="text"
                                            value={newExtra.name}
                                            onChange={(e) => setNewExtra({ ...newExtra, name: e.target.value })}
                                            className="flex-1 px-3 py-2 border rounded-lg"
                                            placeholder="e.g., Oven cleaning"
                                        />
                                        <input
                                            type="number"
                                            value={newExtra.price}
                                            onChange={(e) => setNewExtra({ ...newExtra, price: parseFloat(e.target.value) || 0 })}
                                            className="w-24 px-3 py-2 border rounded-lg"
                                            placeholder="$"
                                        />
                                        <button
                                            onClick={addExtra}
                                            className="px-3 py-2 bg-gray-100 rounded-lg hover:bg-gray-200"
                                        >
                                            <PlusIcon className="w-5 h-5" />
                                        </button>
                                    </div>
                                    {templateForm.extras.length > 0 && (
                                        <div className="flex flex-wrap gap-2">
                                            {templateForm.extras.map((e, i) => (
                                                <span key={i} className="px-2 py-1 bg-purple-100 text-purple-700 rounded-lg text-sm flex items-center gap-1">
                                                    {e.name} (${e.price})
                                                    <button onClick={() => setTemplateForm({ ...templateForm, extras: templateForm.extras.filter((_, j) => j !== i) })}>✕</button>
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <button
                                    onClick={saveTemplate}
                                    disabled={!templateForm.name || templateForm.basePrice <= 0}
                                    className="w-full py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                                >
                                    Create Template
                                </button>
                            </div>
                        </div>

                        <div className="p-4 border-t flex justify-end">
                            <button
                                onClick={() => setShowTemplateModal(false)}
                                className="px-4 py-2 text-gray-700 border rounded-lg hover:bg-gray-50"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LeadsPage;

