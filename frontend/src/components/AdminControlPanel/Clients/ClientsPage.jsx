import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useUserContext } from '../../useUserContext';
import PropertyDetailsModal from './PropertyDetailsModal';
import Card from '../../common/Card';
import Button from '../../common/Button';
import { LocationMarkerIcon, EyeIcon, EyeOffIcon, RefreshIcon, BookOpenIcon } from '@heroicons/react/outline';

const ClientsPage = () => {
    const { user } = useUserContext();
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingClient, setEditingClient] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        address: '',
        password: ''
    });
    const [showRotationModal, setShowRotationModal] = useState(false);
    const [rotationClient, setRotationClient] = useState(null);
    const [rotationStats, setRotationStats] = useState([]);
    const [suggestions, setSuggestions] = useState([]);
    const [showPropertyModal, setShowPropertyModal] = useState(false);
    const [propertyClient, setPropertyClient] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        if (user && user.admin) {
            fetchClients();
        }
    }, [user]);

    const fetchClients = async () => {
        try {
            const response = await axios.get('/api/clients');
            setClients(Array.isArray(response.data) ? response.data : []);
        } catch (error) {
            console.error('Error fetching clients:', error);
            setClients([]);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingClient) {
                await axios.put(`/api/clients/${editingClient._id}`, formData);
            } else {
                await axios.post('/api/clients', formData);
            }
            setShowModal(false);
            setEditingClient(null);
            setFormData({ name: '', email: '', phone: '', address: '', password: '' });
            fetchClients();
        } catch (error) {
            alert(error.response?.data?.msg || 'Error saving client');
        }
    };

    const handleEdit = (client) => {
        setEditingClient(client);
        setFormData({
            name: client.name,
            email: client.email,
            phone: client.phone || '',
            address: client.address || '',
            password: ''
        });
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this client?')) {
            try {
                await axios.delete(`/api/clients/${id}`);
                fetchClients();
            } catch (error) {
                alert('Error deleting client');
            }
        }
    };

    const toggleActive = async (client) => {
        try {
            await axios.put(`/api/clients/${client._id}`, { active: !client.active });
            fetchClients();
        } catch (error) {
            alert('Error updating client status');
        }
    };

    const handleStatusChange = async (clientId, newStatus) => {
        try {
            await axios.put(`/api/clients/${clientId}`, { serviceStatus: newStatus });
            fetchClients();
        } catch (error) {
            alert('Error updating service status');
        }
    };

    const handleToggleHide = async (clientId, hideContacts) => {
        try {
            await axios.put(`/api/clients/${clientId}`, { hideContacts });
            fetchClients();
        } catch (error) {
            alert('Error updating hide contacts setting');
        }
    };

    const openRotationModal = async (client) => {
        setRotationClient(client);
        setShowRotationModal(true);
        try {
            const [statsRes, suggestRes] = await Promise.all([
                axios.get(`/api/rotation/rotation/${client._id}`),
                axios.get(`/api/rotation/suggest/${client._id}`)
            ]);
            setRotationStats(Array.isArray(statsRes.data) ? statsRes.data : []);
            setSuggestions(Array.isArray(suggestRes.data) ? suggestRes.data : []);
        } catch (error) {
            console.error('Error fetching rotation data:', error);
        }
    };

    const openPropertyModal = (client) => {
        setPropertyClient(client);
        setShowPropertyModal(true);
    };

    const handlePropertySave = () => {
        fetchClients(); // Refresh clients list after saving property details
    };

    if (!user) {
        return <div className="text-center py-10">Loading...</div>;
    }

    if (!user.admin) {
        return <div className="text-center mt-10">Unauthorized - Admin access required</div>;
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text-heading)]">Clients</h1>
                    <p className="mt-1 text-sm text-[var(--text-body)]">Create and manage your client list</p>
                </div>
                <button
                    onClick={() => {
                        setEditingClient(null);
                        setFormData({ name: '', email: '', phone: '', address: '', password: '' });
                        setShowModal(true);
                    }}
                    className="w-full sm:w-auto bg-blue-600 text-white px-4 py-2.5 rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2 font-medium"
                >
                    <span className="text-lg">+</span> Add Client
                </button>
            </div>

            <Card className="overflow-hidden">

                {loading ? (
                    <div className="text-center py-10">Loading...</div>
                ) : clients.length === 0 ? (
                    <div className="text-center py-10 text-gray-500">
                        No clients yet. Click "Add Client" to create one.
                    </div>
                ) : (
                    <>
                        {/* Desktop Table View */}
                        <div className="hidden lg:block bg-white rounded-lg shadow overflow-hidden">
                            <table className="w-full">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Name</th>
                                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Email</th>
                                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Location</th>
                                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Status</th>
                                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Hide</th>
                                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {clients.map((client) => (
                                        <tr key={client._id} className="hover:bg-gray-50">
                                            <td className="px-4 py-3">
                                                <div>{client.name}</div>
                                                <div className="text-xs text-gray-500">{client.phone || '-'}</div>
                                            </td>
                                            <td className="px-4 py-3 text-gray-600">{client.email}</td>
                                            <td className="px-4 py-3">
                                                {client.location?.coordinates?.lat && client.location?.coordinates?.lng ? (
                                                    <a
                                                        href={`https://www.google.com/maps?q=${client.location.coordinates.lat},${client.location.coordinates.lng}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium hover:bg-green-200 transition"
                                                    >
                                                        <LocationMarkerIcon className="w-3 h-3" /> View Map
                                                    </a>
                                                ) : client.address ? (
                                                    <span className="text-xs text-gray-500 flex items-center gap-1" title={client.address}>
                                                        <LocationMarkerIcon className="w-3 h-3" /> {client.address.substring(0, 20)}...
                                                    </span>
                                                ) : (
                                                    <span className="text-xs text-gray-400">No location</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3">
                                                <select
                                                    value={client.serviceStatus || 'pending'}
                                                    onChange={(e) => handleStatusChange(client._id, e.target.value)}
                                                    className={`px-2 py-1 rounded text-xs font-medium border-0 cursor-pointer
                                                    ${client.serviceStatus === 'scheduled' ? 'bg-blue-100 text-blue-700' :
                                                            client.serviceStatus === 'in-progress' ? 'bg-orange-100 text-orange-700' :
                                                                client.serviceStatus === 'completed' ? 'bg-green-100 text-green-700' :
                                                                    client.serviceStatus === 'cancelled' ? 'bg-red-100 text-red-700' :
                                                                        'bg-gray-100 text-gray-700'}`}
                                                >
                                                    <option value="pending">Pending</option>
                                                    <option value="scheduled">Scheduled</option>
                                                    <option value="in-progress">In Progress</option>
                                                    <option value="completed">Completed</option>
                                                    <option value="cancelled">Cancelled</option>
                                                </select>
                                            </td>

                                            <td className="px-4 py-3">
                                                <button
                                                    onClick={() => handleToggleHide(client._id, !client.hideContacts)}
                                                    className={`px-2 py-1 rounded text-xs font-medium flex items-center gap-1 ${client.hideContacts
                                                        ? 'bg-purple-100 text-purple-700'
                                                        : 'bg-gray-100 text-gray-500'
                                                        }`}
                                                    title={client.hideContacts ? 'Contacts hidden from employees' : 'Contacts visible to employees'}
                                                >
                                                    {client.hideContacts ? (
                                                        <><EyeOffIcon className="w-3 h-3" /> Hidden</>
                                                    ) : (
                                                        <><EyeIcon className="w-3 h-3" /> Visible</>
                                                    )}
                                                </button>
                                            </td>
                                            <td className="px-4 py-3">
                                                <button
                                                    onClick={() => handleEdit(client)}
                                                    className="text-blue-600 hover:text-blue-800 mr-2"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => openRotationModal(client)}
                                                    className="text-green-600 hover:text-green-800 mr-2"
                                                    title="Rotation History"
                                                >
                                                    <RefreshIcon className="w-5 h-5" />
                                                </button>
                                                <button
                                                    onClick={() => openPropertyModal(client)}
                                                    className="text-purple-600 hover:text-purple-800 mr-2"
                                                    title="Property Details (Client Bible)"
                                                >
                                                    <BookOpenIcon className="w-5 h-5" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(client._id)}
                                                    className="text-red-600 hover:text-red-800"
                                                >
                                                    Delete
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile/Tablet Card View */}
                        <div className="lg:hidden space-y-4">
                            {clients.map((client) => (
                                <div key={client._id} className="bg-white rounded-lg shadow p-4">
                                    <div className="flex justify-between items-start mb-3">
                                        <h3 className="font-semibold text-lg">{client.name}</h3>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleEdit(client)}
                                                className="text-blue-600 hover:text-blue-800 text-sm"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => openRotationModal(client)}
                                                className="text-green-600 hover:text-green-800 text-sm"
                                                title="Rotation History"
                                            >
                                                <RefreshIcon className="w-5 h-5" />
                                            </button>
                                            <button
                                                onClick={() => openPropertyModal(client)}
                                                className="text-purple-600 hover:text-purple-800 text-sm"
                                                title="Property Details (Client Bible)"
                                            >
                                                <BookOpenIcon className="w-5 h-5" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(client._id)}
                                                className="text-red-600 hover:text-red-800 text-sm"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                    <div className="space-y-1 text-sm text-gray-600 mb-3">
                                        <p>📧 {client.email}</p>
                                        <p>📱 {client.phone || 'No phone'}</p>
                                        {client.location?.coordinates?.lat && client.location?.coordinates?.lng ? (
                                            <a
                                                href={`https://www.google.com/maps?q=${client.location.coordinates.lat},${client.location.coordinates.lng}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium hover:bg-green-200 transition"
                                            >
                                                <LocationMarkerIcon className="w-3 h-3" /> View on Map
                                            </a>
                                        ) : client.address ? (
                                            <p className="flex items-center gap-1"><LocationMarkerIcon className="w-3 h-3" /> {client.address}</p>
                                        ) : null}
                                    </div>
                                    <div className="flex flex-wrap gap-2 items-center">
                                        <select
                                            value={client.serviceStatus || 'pending'}
                                            onChange={(e) => handleStatusChange(client._id, e.target.value)}
                                            className={`px-2 py-1 rounded text-xs font-medium border-0 cursor-pointer
                                                ${client.serviceStatus === 'scheduled' ? 'bg-blue-100 text-blue-700' :
                                                    client.serviceStatus === 'in-progress' ? 'bg-orange-100 text-orange-700' :
                                                        client.serviceStatus === 'completed' ? 'bg-green-100 text-green-700' :
                                                            client.serviceStatus === 'cancelled' ? 'bg-red-100 text-red-700' :
                                                                'bg-gray-100 text-gray-700'}`}
                                        >
                                            <option value="pending">Pending</option>
                                            <option value="scheduled">Scheduled</option>
                                            <option value="in-progress">In Progress</option>
                                            <option value="completed">Completed</option>
                                            <option value="cancelled">Cancelled</option>
                                        </select>
                                        <button
                                            onClick={() => handleToggleHide(client._id, !client.hideContacts)}
                                            className={`px-2 py-1 rounded text-xs font-medium flex items-center gap-1 ${client.hideContacts
                                                ? 'bg-purple-100 text-purple-700'
                                                : 'bg-gray-100 text-gray-500'
                                                }`}
                                        >
                                            {client.hideContacts ? (
                                                <><EyeOffIcon className="w-3 h-3" /> Hidden</>
                                            ) : (
                                                <><EyeIcon className="w-3 h-3" /> Visible</>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )
                }

                {/* Modal */}
                {
                    showModal && (
                        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                            <div className="bg-white rounded-lg p-6 w-full max-w-md">
                                <h2 className="text-xl font-bold mb-4">
                                    {editingClient ? 'Edit Client' : 'Add New Client'}
                                </h2>
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <input
                                        type="text"
                                        placeholder="Name *"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        required
                                        className="w-full px-3 py-2 border rounded-lg"
                                    />
                                    <input
                                        type="email"
                                        placeholder="Email *"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        required
                                        className="w-full px-3 py-2 border rounded-lg"
                                    />
                                    <input
                                        type="tel"
                                        placeholder="Phone"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        className="w-full px-3 py-2 border rounded-lg"
                                    />
                                    <input
                                        type="text"
                                        placeholder="Address"
                                        value={formData.address}
                                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                        className="w-full px-3 py-2 border rounded-lg"
                                    />
                                    <input
                                        type="password"
                                        placeholder={editingClient ? "New Password (leave blank to keep)" : "Password *"}
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        required={!editingClient}
                                        className="w-full px-3 py-2 border rounded-lg"
                                    />
                                    <div className="flex justify-end gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setShowModal(false)}
                                            className="px-4 py-2 text-gray-600 hover:text-gray-800"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                        >
                                            Save
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )
                }

                {/* Rotation Modal */}
                {
                    showRotationModal && rotationClient && (
                        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                            <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                                <div className="flex justify-between items-center mb-4">
                                    <h2 className="text-xl font-bold">Rotation History: {rotationClient.name}</h2>
                                    <button onClick={() => setShowRotationModal(false)} className="text-gray-500 hover:text-gray-700">✕</button>
                                </div>

                                <div className="mb-6">
                                    <h3 className="font-semibold mb-2">Suggested Next Employees</h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                        {suggestions.map((sugg, idx) => (
                                            <div key={idx} className="border p-2 rounded bg-green-50">
                                                <p className="font-medium">{sugg.username}</p>
                                                <p className="text-xs text-gray-600">Score: {sugg.score} (Last: {sugg.lastServiceDate ? new Date(sugg.lastServiceDate).toLocaleDateString() : 'Never'})</p>
                                            </div>
                                        ))}
                                        {suggestions.length === 0 && <p className="text-gray-500 text-sm">No suggestions available</p>}
                                    </div>
                                </div>

                                <div>
                                    <h3 className="font-semibold mb-2">Service History</h3>
                                    <div className="space-y-2">
                                        {rotationStats.map((stat, idx) => (
                                            <div key={idx} className="border p-2 rounded flex justify-between items-center">
                                                <div>
                                                    <p className="font-medium">{stat.employeeName}</p>
                                                    <p className="text-xs text-gray-500">{new Date(stat.serviceDate).toLocaleDateString()}</p>
                                                </div>
                                                <span className="text-sm bg-gray-100 px-2 py-1 rounded">{stat.serviceType || 'Service'}</span>
                                            </div>
                                        ))}
                                        {rotationStats.length === 0 && <p className="text-gray-500 text-sm">No history found</p>}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )
                }

                {/* Property Details Modal */}
                <PropertyDetailsModal
                    isOpen={showPropertyModal}
                    onClose={() => {
                        setShowPropertyModal(false);
                        setPropertyClient(null);
                    }}
                    client={propertyClient}
                    onSave={handlePropertySave}
                />
            </Card>
        </div >
    );
};

export default ClientsPage;
