import { useState, useEffect } from 'react';
import {
    ClockIcon,
    CheckCircleIcon,
    XCircleIcon,
    OfficeBuildingIcon,
    LocationMarkerIcon,
    MapIcon,
    ExclamationIcon,
    CameraIcon,
    FlagIcon,
    SparklesIcon,
    ShieldCheckIcon,
    CheckIcon,
    TruckIcon
} from '@heroicons/react/outline';
import axios from 'axios';
import { useUserContext } from '../../useUserContext';
import Msg from '../../general/Msg';
import { HashLoader } from 'react-spinners';
import { format } from 'date-fns';
import PropertyInfoDisplay from './PropertyInfoDisplay';

const CheckInCheckOut = () => {
    const { user } = useUserContext();
    const [status, setStatus] = useState('loading'); // loading, checked-in, checked-out
    const [startTime, setStartTime] = useState(null);
    const [currentLocation, setCurrentLocation] = useState(null);
    const [currentClient, setCurrentClient] = useState(null);
    const [msg, setMsg] = useState(null);
    const [loading, setLoading] = useState(false);
    const [photos, setPhotos] = useState([]); // Multiple completion photos
    const [beforePhotos, setBeforePhotos] = useState([]); // Multiple before photos
    const [safetyConfirmed, setSafetyConfirmed] = useState(false);

    // Client selection
    const [assignments, setAssignments] = useState([]);
    const [completedAssignments, setCompletedAssignments] = useState([]);
    const [selectedClientId, setSelectedClientId] = useState('');
    const [loadingAssignments, setLoadingAssignments] = useState(true);

    // GPS verification
    const [gpsWarning, setGpsWarning] = useState(null);
    const [locationConfirmed, setLocationConfirmed] = useState(false);

    // Job completion tracking
    const [jobCompleted, setJobCompleted] = useState(false);
    const [justCheckedOut, setJustCheckedOut] = useState(false);
    const [lastCheckedOutClient, setLastCheckedOutClient] = useState(null);

    // En-route tracking
    const [enRouteInfo, setEnRouteInfo] = useState(null);
    const [startingEnRoute, setStartingEnRoute] = useState(false);

    // Checklist tracking
    const [checklist, setChecklist] = useState([]);
    const [checklistLoading, setChecklistLoading] = useState(false);

    const fetchStatus = async () => {
        console.log('Fetching attendance status...');
        try {
            const response = await axios.get('/api/attendance/status');
            console.log('Status response:', response.data);
            setStatus(response.data.status);
            if (response.data.startTime) {
                setStartTime(new Date(response.data.startTime));
            }
            if (response.data.location) {
                setCurrentLocation(response.data.location);
            }
            if (response.data.safetyConfirmed !== undefined) {
                setSafetyConfirmed(response.data.safetyConfirmed);
            }
            if (response.data.clientId) {
                setCurrentClient(response.data.client);
            }
        } catch (error) {
            console.error('Error fetching status:', error);
        }
    };

    const fetchAssignments = async () => {
        setLoadingAssignments(true);
        try {
            const response = await axios.get('/api/attendance/today-assignments');
            const allAssignments = response.data.assignments || [];
            const available = allAssignments.filter(a => !a.alreadyCheckedIn);
            const completed = allAssignments.filter(a => a.alreadyCheckedIn);

            setAssignments(available);
            setCompletedAssignments(completed);

            if (available.length === 1) {
                setSelectedClientId(available[0].clientId);
            }
        } catch (error) {
            console.error('Error fetching assignments:', error);
        } finally {
            setLoadingAssignments(false);
        }
    };

    const fetchChecklist = async () => {
        setChecklistLoading(true);
        try {
            const response = await axios.get('/api/attendance/checklist');
            setChecklist(response.data.checklist || []);
        } catch (error) {
            console.error('Error fetching checklist:', error);
        } finally {
            setChecklistLoading(false);
        }
    };

    const toggleChecklistItem = async (index) => {
        try {
            const newCompleted = !checklist[index].completed;
            const response = await axios.post('/api/attendance/checklist/toggle', {
                itemIndex: index,
                completed: newCompleted
            });
            setChecklist(response.data.checklist);
        } catch (error) {
            console.error('Error toggling checklist:', error);
            setMsg({ bold: 'Error', msg: 'Failed to update checklist', OK: false });
        }
    };

    useEffect(() => {
        if (user) {
            fetchStatus();
            fetchAssignments();
        }
    }, [user]);

    // Fetch checklist when checked in
    useEffect(() => {
        if (status === 'checked-in') {
            fetchChecklist();
        }
    }, [status]);

    const getLocation = () => {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error('Geolocation is not supported by your browser'));
            } else {
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        resolve({
                            lat: position.coords.latitude,
                            lng: position.coords.longitude,
                        });
                    },
                    (error) => {
                        reject(error);
                    }
                );
            }
        });
    };

    const handleCheckIn = async (forceConfirm = false) => {
        if (!selectedClientId) {
            setMsg({ bold: 'Error', msg: 'Please select a client first.', OK: false });
            return;
        }

        setLoading(true);
        setMsg(null);
        setGpsWarning(null);

        try {
            const location = await getLocation();
            const formData = new FormData();
            formData.append('location', JSON.stringify(location));
            formData.append('clientId', selectedClientId);

            // Find the selected assignment to get its shiftId for independent tracking
            const selectedAssignment = assignments.find(a => a.clientId === selectedClientId || a.clientId.toString() === selectedClientId);
            if (selectedAssignment?.shiftId) {
                formData.append('shiftId', selectedAssignment.shiftId);
            }

            if (forceConfirm || locationConfirmed) {
                formData.append('locationConfirmed', 'true');
            }

            if (beforePhotos.length > 0) {
                beforePhotos.forEach(file => {
                    formData.append('photos', file);
                });
            }

            const response = await new Promise((resolve, reject) => {
                const xhr = new XMLHttpRequest();
                xhr.open('POST', '/api/attendance/check-in');
                xhr.withCredentials = true;

                xhr.onload = function () {
                    const data = JSON.parse(xhr.responseText);
                    if (xhr.status >= 200 && xhr.status < 300) {
                        resolve(data);
                    } else {
                        reject(data);
                    }
                };

                xhr.onerror = function () {
                    reject({ msg: 'Network error' });
                };

                xhr.send(formData);
            });

            // Success - use selectedAssignment declared above
            setStatus('checked-in');
            setStartTime(new Date());
            setCurrentLocation(location);
            setCurrentClient(selectedAssignment);
            setBeforePhotos([]);
            setSelectedClientId('');
            setLocationConfirmed(false);
            setMsg({ bold: 'Success!', msg: `Checked in at ${selectedAssignment?.clientName}`, OK: true });
            fetchAssignments(); // Refresh to remove this from list

        } catch (error) {
            console.error('Check-in error:', error);

            // GPS verification required
            if (error.requiresConfirmation) {
                setGpsWarning({
                    distance: error.distanceMeters,
                    clientName: error.clientName
                });
                setMsg({
                    bold: 'Warning',
                    msg: `You appear to be ${error.distanceMeters}m away from ${error.clientName}`,
                    OK: false
                });
            } else {
                let errorMessage = error.msg || 'Failed to check in.';
                if (error.code === 1) errorMessage = 'Location permission denied.';
                else if (error.code === 2) errorMessage = 'Location unavailable.';
                else if (error.code === 3) errorMessage = 'Location request timed out.';
                setMsg({ bold: 'Error', msg: errorMessage, OK: false });
            }
        } finally {
            setLoading(false);
        }
    };

    const handleCheckOut = async () => {
        setLoading(true);
        setMsg(null);
        try {
            const location = await getLocation();
            const formData = new FormData();
            formData.append('location', JSON.stringify(location));
            if (photos.length > 0) {
                photos.forEach(file => {
                    formData.append('photos', file);
                });
            }

            await new Promise((resolve, reject) => {
                const xhr = new XMLHttpRequest();
                xhr.open('POST', '/api/attendance/check-out');
                xhr.withCredentials = true;

                xhr.onload = function () {
                    if (xhr.status >= 200 && xhr.status < 300) {
                        const response = JSON.parse(xhr.responseText);
                        // Show mileage in success message if available
                        let successMsg = 'Checked out successfully. Don\'t forget to mark job as complete!';
                        if (response.mileage && response.mileage.miles > 0) {
                            successMsg = `Checked out successfully! Distance: ${response.mileage.miles.toFixed(2)} miles`;
                        }
                        setMsg({ bold: 'Success!', msg: successMsg, OK: true });
                        resolve(response);
                    } else {
                        reject(new Error(xhr.statusText || 'Request failed'));
                    }
                };

                xhr.onerror = function () {
                    reject(new Error('Network error'));
                };

                xhr.send(formData);
            });

            setLastCheckedOutClient(currentClient);
            setStatus('checked-out');
            setStartTime(null);
            setCurrentLocation(null);
            setCurrentClient(null);
            setPhotos([]);
            setSafetyConfirmed(false);
            setJustCheckedOut(true);
            setJobCompleted(false);
            fetchAssignments(); // Refresh assignments
        } catch (error) {
            console.error('Check-out error:', error);
            setMsg({ bold: 'Error', msg: 'Failed to check out.', OK: false });
        } finally {
            setLoading(false);
        }
    };

    const handleConfirmSafety = async () => {
        setLoading(true);
        setMsg(null);
        try {
            await axios.post('/api/attendance/confirm-safety');
            setSafetyConfirmed(true);
            setMsg({ bold: 'Success!', msg: 'Safety confirmed! Stay safe.', OK: true });
        } catch (error) {
            console.error('Safety confirmation error:', error);
            setMsg({ bold: 'Error', msg: 'Failed to confirm safety.', OK: false });
        } finally {
            setLoading(false);
        }
    };

    const handleMarkComplete = async () => {
        setLoading(true);
        setMsg(null);
        try {
            await axios.post('/api/attendance/mark-complete');
            setJobCompleted(true);
            setJustCheckedOut(false);
            setLastCheckedOutClient(null);
            setMsg({ bold: 'Success!', msg: 'Job marked as complete! Great work! 🎉', OK: true });
            // Refresh assignments to get remaining jobs
            fetchAssignments();
        } catch (error) {
            console.error('Mark complete error:', error);
            setMsg({ bold: 'Error', msg: error.response?.data?.msg || 'Failed to mark job as complete.', OK: false });
        } finally {
            setLoading(false);
        }
    };

    const handleStartEnRoute = async (nextClientId) => {
        setStartingEnRoute(true);
        setMsg(null);
        try {
            // Get current location
            let location = { lat: 0, lng: 0 };
            if (navigator.geolocation) {
                const position = await new Promise((resolve, reject) => {
                    navigator.geolocation.getCurrentPosition(resolve, reject, {
                        enableHighAccuracy: true,
                        timeout: 10000
                    });
                });
                location = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };
            }

            const response = await axios.post('/api/attendance/start-en-route', {
                clientId: nextClientId,
                currentLocation: location
            });

            setEnRouteInfo({
                clientName: response.data.clientName,
                eta: response.data.eta
            });
            setJobCompleted(false); // Reset so the en-route info shows
            setMsg({
                bold: '🚗 En Route!',
                msg: `Heading to ${response.data.clientName}. ETA: ${response.data.eta.minutes} min`,
                OK: true
            });
        } catch (error) {
            console.error('Start en-route error:', error);
            setMsg({ bold: 'Error', msg: error.response?.data?.msg || 'Failed to start en-route.', OK: false });
        } finally {
            setStartingEnRoute(false);
        }
    };

    if (!user) {
        return (
            <div className="grid w-screen h-screen place-items-center">
                <HashLoader className="content-center" size={100} />
            </div>
        );
    }

    const selectedAssignment = assignments.find(a => a.clientId === selectedClientId);

    return (
        <>
            <div className="flex flex-col items-center justify-center mt-10 px-4">
                <div className="w-full max-w-md p-6 bg-white rounded-xl shadow-lg">
                    <h1 className="mb-6 text-2xl font-bold text-center text-gray-800 flex items-center justify-center gap-2">
                        <ClockIcon className="w-8 h-8 text-blue-600" /> Attendance
                    </h1>

                    <div className="flex flex-col items-center space-y-5">
                        {/* Current Status */}
                        <div className="w-full text-center p-4 rounded-lg bg-gray-50">
                            <p className="text-sm text-gray-500 mb-1">Current Status</p>
                            <div className={`text-2xl font-bold flex items-center justify-center gap-2 ${status === 'checked-in' ? 'text-green-600' : 'text-gray-600'}`}>
                                {status === 'loading' ? 'Loading...' : status === 'checked-in' ? (
                                    <><CheckCircleIcon className="w-8 h-8" /> Checked In</>
                                ) : (
                                    <><XCircleIcon className="w-8 h-8" /> Not Checked In</>
                                )}
                            </div>

                            {/* Show current client when checked in */}
                            {status === 'checked-in' && currentClient && (
                                <div className="mt-3 p-3 bg-green-50 rounded-lg">
                                    <p className="text-sm font-medium text-green-800 flex items-center gap-2 justify-center">
                                        <OfficeBuildingIcon className="w-4 h-4" /> {currentClient.clientName || currentClient.name}
                                    </p>
                                    {currentClient.clientAddress && (
                                        <p className="text-xs text-green-600 mt-1 flex items-center gap-1 justify-center">
                                            <LocationMarkerIcon className="w-3 h-3" /> {currentClient.clientAddress}
                                        </p>
                                    )}
                                </div>
                            )}

                            {status === 'checked-in' && startTime && (
                                <p className="text-sm text-gray-500 mt-2">
                                    Since: {format(startTime, 'HH:mm')}
                                </p>
                            )}
                        </div>

                        {/* Job Checklist - Show when checked in */}
                        {status === 'checked-in' && checklist.length > 0 && (
                            <div className="w-full mt-4">
                                <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-3 rounded-t-lg">
                                    <h3 className="font-semibold flex items-center gap-2">
                                        <CheckIcon className="w-5 h-5" /> Job Checklist
                                    </h3>
                                    <p className="text-xs text-blue-100">Complete all required items before checking out</p>
                                </div>
                                <div className="border border-t-0 rounded-b-lg divide-y">
                                    {checklist.map((item, index) => (
                                        <label
                                            key={index}
                                            className={`flex items-center gap-3 p-3 cursor-pointer hover:bg-gray-50 transition-colors ${item.completed ? 'bg-green-50' : ''}`}
                                            onClick={() => toggleChecklistItem(index)}
                                        >
                                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${item.completed
                                                ? 'bg-green-500 border-green-500 text-white'
                                                : 'border-gray-300'
                                                }`}>
                                                {item.completed && <CheckIcon className="w-4 h-4" />}
                                            </div>
                                            <span className={`flex-1 ${item.completed ? 'text-gray-500 line-through' : 'text-gray-800'}`}>
                                                {item.label}
                                            </span>
                                            {item.required && !item.completed && (
                                                <span className="text-xs text-red-500 font-medium">Required</span>
                                            )}
                                        </label>
                                    ))}
                                </div>
                                {/* Progress */}
                                <div className="mt-2 flex items-center justify-between text-sm">
                                    <span className="text-gray-600">
                                        {checklist.filter(c => c.completed).length} / {checklist.length} completed
                                    </span>
                                    {checklist.every(c => c.completed) && (
                                        <span className="text-green-600 font-medium flex items-center gap-1">
                                            <CheckCircleIcon className="w-4 h-4" /> Ready to check out!
                                        </span>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Client Selection - Only show when NOT checked in */}
                        {status === 'checked-out' && (
                            <div className="w-full">
                                <label className="block mb-2 text-sm font-medium text-gray-700 flex items-center gap-1">
                                    <OfficeBuildingIcon className="w-4 h-4" /> Select Client
                                </label>
                                {loadingAssignments ? (
                                    <div className="text-center py-3 text-gray-500">Loading assignments...</div>
                                ) : assignments.length === 0 && completedAssignments.length === 0 ? (
                                    <div className="text-center py-3 text-gray-500 bg-gray-50 rounded-lg">
                                        No assignments for today
                                    </div>
                                ) : assignments.length === 0 ? (
                                    <div className="text-center py-3 text-green-600 bg-green-50 rounded-lg flex items-center justify-center gap-2">
                                        <CheckCircleIcon className="w-5 h-5" /> All assignments completed!
                                    </div>
                                ) : (
                                    <select
                                        value={selectedClientId}
                                        onChange={(e) => {
                                            setSelectedClientId(e.target.value);
                                            setGpsWarning(null);
                                            setLocationConfirmed(false);
                                        }}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                    >
                                        <option value="">-- Select Client --</option>
                                        {assignments.map((a) => (
                                            <option key={a.clientId} value={a.clientId}>
                                                {a.clientName} ({a.startTime} - {a.endTime})
                                            </option>
                                        ))}
                                    </select>
                                )}

                                {/* Show selected client details */}
                                {selectedAssignment && (
                                    <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                                        <p className="text-sm font-medium text-blue-800 flex items-center gap-1">
                                            <LocationMarkerIcon className="w-4 h-4" /> {selectedAssignment.clientAddress || 'No address'}
                                        </p>
                                        {selectedAssignment.clientLocation?.coordinates && (
                                            <a
                                                href={`https://www.google.com/maps/dir/?api=1&destination=${selectedAssignment.clientLocation.coordinates.lat},${selectedAssignment.clientLocation.coordinates.lng}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-xs text-blue-600 hover:text-blue-800 mt-1 inline-flex items-center gap-1"
                                            >
                                                <MapIcon className="w-3 h-3" /> Get Directions →
                                            </a>
                                        )}
                                    </div>
                                )}

                                {/* Property Info - Client Bible */}
                                {selectedAssignment?.propertyDetails && (
                                    <PropertyInfoDisplay
                                        propertyDetails={selectedAssignment.propertyDetails}
                                        clientName={selectedAssignment.clientName}
                                    />
                                )}

                                {/* Completed Assignments Today */}
                                {completedAssignments.length > 0 && (
                                    <div className="mt-4 pt-4 border-t border-gray-200">
                                        <p className="text-xs text-gray-500 mb-2">Completed today:</p>
                                        {completedAssignments.map((a) => (
                                            <div key={a.clientId} className="flex items-center gap-2 text-sm text-green-600 py-1">
                                                <CheckCircleIcon className="w-4 h-4" />
                                                <span>{a.clientName}</span>
                                                <span className="text-gray-400">({a.startTime} - {a.endTime})</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* GPS Warning */}
                        {gpsWarning && (
                            <div className="w-full p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                                <p className="text-sm font-medium text-yellow-800 mb-3 flex items-center gap-1">
                                    <ExclamationIcon className="w-4 h-4" /> You are {gpsWarning.distance}m away from {gpsWarning.clientName}
                                </p>
                                <label className="flex items-center gap-2 text-sm text-yellow-700 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={locationConfirmed}
                                        onChange={(e) => setLocationConfirmed(e.target.checked)}
                                        className="w-4 h-4 text-yellow-600 rounded focus:ring-yellow-500"
                                    />
                                    I confirm I am at the correct location
                                </label>
                                {locationConfirmed && (
                                    <button
                                        onClick={() => handleCheckIn(true)}
                                        disabled={loading}
                                        className="mt-3 w-full py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 font-medium text-sm"
                                    >
                                        Proceed with Check-In
                                    </button>
                                )}
                            </div>
                        )}

                        {/* Before Photo - shown when NOT checked in */}
                        {status === 'checked-out' && !gpsWarning && (
                            <div className="w-full">
                                <label className="block mb-2 text-sm font-medium text-gray-700 flex items-center gap-1">
                                    <CameraIcon className="w-4 h-4" /> Before Photo (Optional)
                                </label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    capture="environment"
                                    onChange={(e) => setBeforePhotos(Array.from(e.target.files))}
                                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
                                />
                                {beforePhotos.length > 0 && (
                                    <p className="text-sm text-green-600 mt-1">{beforePhotos.length} photo(s) selected</p>
                                )}
                            </div>
                        )}

                        {/* After Photo - shown when checked in */}
                        {status === 'checked-in' && (
                            <div className="w-full">
                                <label className="block mb-2 text-sm font-medium text-gray-700 flex items-center gap-1">
                                    <CameraIcon className="w-4 h-4" /> Completion Photo (Optional)
                                </label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    capture="environment"
                                    onChange={(e) => setPhotos(Array.from(e.target.files))}
                                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                />
                                {photos.length > 0 && (
                                    <p className="text-sm text-blue-600 mt-1">{photos.length} photo(s) selected</p>
                                )}
                            </div>
                        )}

                        {/* Safety Confirmation */}
                        {status === 'checked-in' && (
                            <div className="w-full">
                                {safetyConfirmed ? (
                                    <div className="w-full px-4 py-2 text-center text-green-700 bg-green-100 border border-green-300 rounded-lg flex items-center justify-center gap-2">
                                        <ShieldCheckIcon className="w-5 h-5" /> Safety Confirmed
                                    </div>
                                ) : (
                                    <button
                                        onClick={handleConfirmSafety}
                                        disabled={loading}
                                        className="w-full px-4 py-2 text-sm font-bold text-white transition-colors bg-blue-500 rounded-lg hover:bg-blue-600 flex items-center justify-center gap-2"
                                    >
                                        <ShieldCheckIcon className="w-5 h-5" /> I Arrived Safely
                                    </button>
                                )}
                            </div>
                        )}

                        {/* Main Action Button */}
                        {status !== 'loading' && !gpsWarning && !justCheckedOut && (
                            <button
                                onClick={status === 'checked-in' ? handleCheckOut : () => handleCheckIn(false)}
                                disabled={loading || (status === 'checked-out' && !selectedClientId)}
                                className={`w-full px-4 py-3 text-white font-bold rounded-lg transition-colors ${loading || (status === 'checked-out' && !selectedClientId)
                                    ? 'bg-gray-400 cursor-not-allowed'
                                    : status === 'checked-in'
                                        ? 'bg-red-500 hover:bg-red-600'
                                        : 'bg-green-500 hover:bg-green-600'
                                    }`}
                            >
                                {loading ? (
                                    <div className="flex items-center justify-center">
                                        <HashLoader size={20} color="#ffffff" />
                                        <span className="ml-2">Processing...</span>
                                    </div>
                                ) : status === 'checked-in' ? (
                                    <span className="flex items-center justify-center gap-2"><FlagIcon className="w-5 h-5" /> Check Out</span>
                                ) : (
                                    <span className="flex items-center justify-center gap-2"><LocationMarkerIcon className="w-5 h-5" /> Check In</span>
                                )}
                            </button>
                        )}

                        {/* Job Done Section - After Checkout */}
                        {justCheckedOut && !jobCompleted && (
                            <div className="w-full p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl">
                                <div className="text-center mb-4">
                                    <p className="text-lg font-bold text-green-800 flex items-center justify-center gap-2">
                                        <CheckCircleIcon className="w-6 h-6" /> Checked Out Successfully!
                                    </p>
                                    {lastCheckedOutClient && (
                                        <p className="text-sm text-green-600 mt-1">
                                            from {lastCheckedOutClient.clientName || lastCheckedOutClient.name}
                                        </p>
                                    )}
                                </div>
                                <button
                                    onClick={handleMarkComplete}
                                    disabled={loading}
                                    className="w-full px-4 py-4 text-white font-bold rounded-xl transition-all transform hover:scale-[1.02] bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 shadow-lg"
                                >
                                    {loading ? (
                                        <div className="flex items-center justify-center">
                                            <HashLoader size={20} color="#ffffff" />
                                            <span className="ml-2">Processing...</span>
                                        </div>
                                    ) : (
                                        <span className="flex items-center justify-center gap-2"><CheckCircleIcon className="w-5 h-5" /> Mark Job Done</span>
                                    )}
                                </button>
                                <button
                                    onClick={() => {
                                        setJustCheckedOut(false);
                                        setLastCheckedOutClient(null);
                                    }}
                                    className="w-full mt-2 px-4 py-2 text-gray-600 font-medium text-sm hover:text-gray-800"
                                >
                                    Skip for now
                                </button>
                            </div>
                        )}

                        {/* Job Completed Badge */}
                        {jobCompleted && (
                            <div className="w-full p-4 bg-green-100 border-2 border-green-300 rounded-xl text-center">
                                <p className="text-xl font-bold text-green-700 flex items-center justify-center gap-2">
                                    <SparklesIcon className="w-6 h-6" /> Job Completed!
                                </p>
                                <p className="text-sm text-green-600 mt-1">Great work today!</p>

                                {/* Show next assignment option if available */}
                                {assignments.length > 0 && (
                                    <div className="mt-4 pt-4 border-t border-green-200">
                                        <p className="text-sm font-medium text-gray-700 mb-3">
                                            🗓️ You have {assignments.length} more assignment{assignments.length > 1 ? 's' : ''} today
                                        </p>
                                        {assignments.slice(0, 1).map(assignment => (
                                            <button
                                                key={assignment.clientId}
                                                onClick={() => handleStartEnRoute(assignment.clientId)}
                                                disabled={startingEnRoute}
                                                className="w-full px-4 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-indigo-700 transition-all shadow-md flex items-center justify-center gap-2"
                                            >
                                                {startingEnRoute ? (
                                                    <>
                                                        <HashLoader size={16} color="#ffffff" />
                                                        <span>Getting directions...</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <TruckIcon className="w-5 h-5" />
                                                        <span>Start En Route to {assignment.clientName}</span>
                                                    </>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* En-Route Info Banner */}
                        {enRouteInfo && (
                            <div className="w-full p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-blue-500 rounded-full">
                                        <TruckIcon className="w-6 h-6 text-white" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-bold text-blue-800">En Route to {enRouteInfo.clientName}</p>
                                        <p className="text-sm text-blue-600">
                                            ETA: {enRouteInfo.eta.minutes} minutes
                                            {enRouteInfo.eta.distance && ` (${enRouteInfo.eta.distance})`}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setEnRouteInfo(null)}
                                    className="w-full mt-3 py-2 text-sm text-blue-600 hover:text-blue-800 font-medium"
                                >
                                    Dismiss
                                </button>
                            </div>
                        )}

                        {msg && <Msg bolded={msg.bold} msg={msg.msg} OK={msg.OK} />}
                    </div>
                </div>
            </div >
        </>
    );
};

export default CheckInCheckOut;
