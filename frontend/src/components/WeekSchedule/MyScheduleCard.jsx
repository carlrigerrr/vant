import React, { useState } from 'react';
import { ClockIcon, OfficeBuildingIcon, LocationMarkerIcon, AnnotationIcon, ChevronDownIcon, ChevronUpIcon, SwitchHorizontalIcon, CalendarIcon, HomeIcon, KeyIcon, BellIcon, LockClosedIcon, TruckIcon, HeartIcon, StarIcon, ExclamationIcon, UserGroupIcon, ChatAltIcon, ClipboardListIcon, CheckCircleIcon, MapIcon, ExclamationCircleIcon, EmojiHappyIcon, HandIcon } from '@heroicons/react/outline';
import axios from 'axios';
import AskTipsModal from './AskTipsModal';
import Button from './../common/Button';
import Badge from './../common/Badge';

const MyScheduleCard = ({ shift, date, onRequestAction }) => {
    const [showPrevious, setShowPrevious] = useState(false);
    const [previousEmployees, setPreviousEmployees] = useState([]);
    const [loadingHistory, setLoadingHistory] = useState(false);
    const [historyFetched, setHistoryFetched] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [showRequestMenu, setShowRequestMenu] = useState(false);
    const [requestType, setRequestType] = useState(null); // 'dayoff' | 'swap'
    const [requestReason, setRequestReason] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [requestSent, setRequestSent] = useState(false);
    const [showPropertyInfo, setShowPropertyInfo] = useState(false);

    const getShiftStyles = (type) => {
        const styles = {
            morning: {
                border: 'border-l-emerald-500',
                bg: 'bg-white',
                badge: 'bg-emerald-100 text-emerald-800',
                icon: 'text-emerald-500'
            },
            mid: {
                border: 'border-l-sky-500',
                bg: 'bg-white',
                badge: 'bg-sky-100 text-sky-800',
                icon: 'text-sky-500'
            },
            evening: {
                border: 'border-l-purple-500',
                bg: 'bg-white',
                badge: 'bg-purple-100 text-purple-800',
                icon: 'text-purple-500'
            },
            custom: {
                border: 'border-l-orange-500',
                bg: 'bg-white',
                badge: 'bg-orange-100 text-orange-800',
                icon: 'text-orange-500'
            }
        };
        return styles[type] || styles.morning;
    };

    const fetchPreviousEmployees = async () => {
        if (!shift.clientId || historyFetched) return;

        setLoadingHistory(true);
        try {
            const response = await axios.get(`/api/client-history/${shift.clientId}`);
            setPreviousEmployees(response.data || []);
            setHistoryFetched(true);
        } catch (error) {
            console.error('Error fetching client history:', error);
        } finally {
            setLoadingHistory(false);
        }
    };

    const handleTogglePrevious = () => {
        if (!showPrevious && !historyFetched) {
            fetchPreviousEmployees();
        }
        setShowPrevious(!showPrevious);
    };

    const handleAskTips = (employee) => {
        setSelectedEmployee(employee);
        setModalOpen(true);
    };

    const handleRequestSubmit = async () => {
        if (!requestType) return;

        setSubmitting(true);
        try {
            if (requestType === 'dayoff') {
                // Use existing block-date endpoint
                await axios.post('/block-date', {
                    date: date, // The date in format from the schedule
                    comment: requestReason || `Day off request for shift at ${shift.clientName}`
                });
            } else if (requestType === 'swap') {
                // Use new swap request endpoint
                await axios.post('/api/shift-swap-request', {
                    shiftId: shift.id,
                    shiftDate: date,
                    clientId: shift.clientId,
                    clientName: shift.clientName,
                    reason: requestReason
                });
            }

            setRequestSent(true);
            setRequestReason('');
            setShowRequestMenu(false);

            // Notify parent if callback provided
            if (onRequestAction) {
                onRequestAction({ type: requestType, shift, date });
            }
        } catch (error) {
            console.error('Error submitting request:', error);
            alert(error.response?.data?.msg || 'Failed to submit request');
        } finally {
            setSubmitting(false);
        }
    };

    const styles = getShiftStyles(shift.shiftType || 'morning');

    return (
        <>
            <div className={`bg-white rounded-[1.375rem] shadow-[var(--shadow-soft)] border-l-[6px] ${styles.border} p-6 transition-all hover:shadow-lg mb-6 relative overflow-hidden`}>
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    {/* Time & Status */}
                    <div className="flex items-center gap-4">
                        <div className={`flex flex-col items-center justify-center w-16 h-16 rounded-lg ${styles.badge} bg-opacity-20`}>
                            <ClockIcon className={`w-6 h-6 ${styles.icon} mb-1`} />
                            <span className={`text-xs font-bold uppercase tracking-wider ${styles.icon}`}>
                                {shift.shiftType || 'Morning'}
                            </span>
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-gray-900">
                                {shift.startTime} - {shift.endTime}
                            </h3>
                            <p className="text-sm text-gray-500 font-medium">{date}</p>
                        </div>
                    </div>

                    {/* Client Info */}
                    <div className="flex-1 md:border-l md:border-gray-100 md:pl-6 space-y-2">
                        <div className="flex items-start gap-2">
                            <OfficeBuildingIcon className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                            <div className="flex-1">
                                <p className="text-sm font-semibold text-gray-900">
                                    {shift.clientName || 'No Client Assigned'}
                                </p>
                                {shift.clientAddress && (
                                    <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                                        <LocationMarkerIcon className="w-3 h-3" />
                                        {shift.clientAddress}
                                    </p>
                                )}


                                {/* Action Buttons Row */}
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {/* Get Directions Button */}
                                    {shift.clientLocation?.coordinates?.lat && shift.clientLocation?.coordinates?.lng && (
                                        <a
                                            href={`https://www.google.com/maps/dir/?api=1&destination=${shift.clientLocation.coordinates.lat},${shift.clientLocation.coordinates.lng}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >
                                            <Button variant="primary" size="xs" className="!bg-blue-600 hover:!bg-blue-700 text-white">
                                                <MapIcon className="w-3 h-3 mr-1" /> Get Directions
                                            </Button>
                                        </a>
                                    )}

                                    {/* Ask Previous Employees Button */}
                                    {shift.clientId && (
                                        <Button
                                            onClick={handleTogglePrevious}
                                            variant="soft-purple"
                                            size="xs"
                                        >
                                            <UserGroupIcon className="w-3 h-3 mr-1" /> Ask Previous
                                            {showPrevious ? (
                                                <ChevronUpIcon className="w-3 h-3 ml-1" />
                                            ) : (
                                                <ChevronDownIcon className="w-3 h-3 ml-1" />
                                            )}
                                        </Button>
                                    )}

                                    {/* Property Info Button */}
                                    {shift.propertyDetails && (
                                        <Button
                                            onClick={() => setShowPropertyInfo(!showPropertyInfo)}
                                            variant="soft-teal"
                                            size="xs"
                                        >
                                            <HomeIcon className="w-3 h-3 mr-1" />
                                            Property Info
                                            {showPropertyInfo ? (
                                                <ChevronUpIcon className="w-3 h-3 ml-1" />
                                            ) : (
                                                <ChevronDownIcon className="w-3 h-3 ml-1" />
                                            )}
                                        </Button>
                                    )}

                                    {/* Request Actions Button */}
                                    {!requestSent && (
                                        <Button
                                            onClick={() => setShowRequestMenu(!showRequestMenu)}
                                            variant="soft-orange"
                                            size="xs"
                                        >
                                            <ClipboardListIcon className="w-3 h-3 mr-1" /> Request Change
                                            {showRequestMenu ? (
                                                <ChevronUpIcon className="w-3 h-3 ml-1" />
                                            ) : (
                                                <ChevronDownIcon className="w-3 h-3 ml-1" />
                                            )}
                                        </Button>
                                    )}

                                    {requestSent && (
                                        <Badge variant="success" size="lg" rounded="lg" className="flex items-center gap-1">
                                            <CheckCircleIcon className="w-4 h-4" /> Request Submitted
                                        </Badge>
                                    )}
                                </div>

                                {/* Request Menu (Expandable) */}
                                {showRequestMenu && (
                                    <div className="mt-3 p-4 bg-orange-50 rounded-lg border border-orange-200">
                                        <p className="text-sm font-medium text-gray-700 mb-3">What would you like to request?</p>

                                        <div className="flex gap-2 mb-3">
                                            <button
                                                onClick={() => setRequestType('dayoff')}
                                                className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${requestType === 'dayoff'
                                                    ? 'bg-red-500 text-white'
                                                    : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                                                    }`}
                                            >
                                                <CalendarIcon className="w-4 h-4" />
                                                Day Off
                                            </button>
                                            <button
                                                onClick={() => setRequestType('swap')}
                                                className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${requestType === 'swap'
                                                    ? 'bg-blue-500 text-white'
                                                    : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                                                    }`}
                                            >
                                                <SwitchHorizontalIcon className="w-4 h-4" />
                                                Swap Shift
                                            </button>
                                        </div>

                                        {requestType && (
                                            <>
                                                <textarea
                                                    value={requestReason}
                                                    onChange={(e) => setRequestReason(e.target.value)}
                                                    placeholder={requestType === 'dayoff'
                                                        ? "Reason for day off (optional)..."
                                                        : "Why do you want to swap this shift?"}
                                                    className="w-full p-2 text-sm border border-gray-200 rounded-lg resize-none"
                                                    rows={2}
                                                />
                                                <div className="flex gap-2 mt-3">
                                                    <button
                                                        onClick={() => { setShowRequestMenu(false); setRequestType(null); setRequestReason(''); }}
                                                        className="flex-1 px-3 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300"
                                                    >
                                                        Cancel
                                                    </button>
                                                    <button
                                                        onClick={handleRequestSubmit}
                                                        disabled={submitting}
                                                        className="flex-1 px-3 py-2 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600 disabled:opacity-50"
                                                    >
                                                        {submitting ? 'Submitting...' : 'Submit Request'}
                                                    </button>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                )}

                                {/* Property Info Section (Expandable) */}
                                {showPropertyInfo && shift.propertyDetails && (
                                    <div className="mt-3 p-3 bg-teal-50 rounded-lg border border-teal-200">
                                        <p className="text-xs font-semibold text-teal-700 mb-2 flex items-center gap-1">
                                            <HomeIcon className="w-3 h-3" /> Client Property Details
                                        </p>
                                        <div className="grid grid-cols-2 gap-2 text-xs">
                                            {shift.propertyDetails.entryInstructions && (
                                                <div className="col-span-2 bg-white p-2 rounded flex items-start gap-1">
                                                    <span className="text-gray-500 flex items-center gap-1"><KeyIcon className="w-3 h-3" /> Entry:</span> {shift.propertyDetails.entryInstructions}
                                                </div>
                                            )}
                                            {shift.propertyDetails.keyLocation && (
                                                <div className="bg-white p-2 rounded flex items-start gap-1">
                                                    <span className="text-gray-500 flex items-center gap-1"><KeyIcon className="w-3 h-3" /> Key:</span> {shift.propertyDetails.keyLocation}
                                                </div>
                                            )}
                                            {shift.propertyDetails.alarmCode && (
                                                <div className="bg-white p-2 rounded flex items-start gap-1">
                                                    <span className="text-gray-500 flex items-center gap-1"><BellIcon className="w-3 h-3" /> Alarm:</span> <span className="font-mono">{shift.propertyDetails.alarmCode}</span>
                                                </div>
                                            )}
                                            {shift.propertyDetails.gateCode && (
                                                <div className="bg-white p-2 rounded flex items-start gap-1">
                                                    <span className="text-gray-500 flex items-center gap-1"><LockClosedIcon className="w-3 h-3" /> Gate:</span> <span className="font-mono">{shift.propertyDetails.gateCode}</span>
                                                </div>
                                            )}
                                            {shift.propertyDetails.parkingInstructions && (
                                                <div className="bg-white p-2 rounded flex items-start gap-1">
                                                    <span className="text-gray-500 flex items-center gap-1"><TruckIcon className="w-3 h-3" /> Parking:</span> {shift.propertyDetails.parkingInstructions}
                                                </div>
                                            )}
                                            {shift.propertyDetails.petInfo && (
                                                <div className="col-span-2 bg-yellow-50 p-2 rounded border border-yellow-200 flex items-start gap-1">
                                                    <span className="text-yellow-700 flex items-center gap-1"><HeartIcon className="w-3 h-3" /> Pets:</span> {shift.propertyDetails.petInfo}
                                                </div>
                                            )}
                                            {shift.propertyDetails.clientPreferences && (
                                                <div className="col-span-2 bg-white p-2 rounded flex items-start gap-1">
                                                    <span className="text-gray-500 flex items-center gap-1"><StarIcon className="w-3 h-3" /> Preferences:</span> {shift.propertyDetails.clientPreferences}
                                                </div>
                                            )}
                                            {shift.propertyDetails.areasToAvoid && (
                                                <div className="col-span-2 bg-red-50 p-2 rounded border border-red-200 flex items-start gap-1">
                                                    <span className="text-red-700 flex items-center gap-1"><ExclamationCircleIcon className="w-3 h-3" /> Avoid:</span> {shift.propertyDetails.areasToAvoid}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Previous Employees Section (Expandable) */}
                                {showPrevious && (
                                    <div className="mt-3 p-3 bg-purple-50 rounded-lg">
                                        {loadingHistory ? (
                                            <p className="text-xs text-gray-500">Loading...</p>
                                        ) : previousEmployees.length > 0 ? (
                                            <div className="space-y-2">
                                                <p className="text-xs font-medium text-gray-600 mb-2">
                                                    Previous employees at this location:
                                                </p>
                                                {previousEmployees.map((emp) => (
                                                    <div
                                                        key={emp.employeeId}
                                                        className="flex items-center justify-between bg-white p-2 rounded-lg"
                                                    >
                                                        <div>
                                                            <span className="text-sm font-medium text-gray-800">
                                                                {emp.employeeName}
                                                            </span>
                                                            <span className="text-xs text-gray-500 ml-2">
                                                                ({emp.serviceCount} {emp.serviceCount === 1 ? 'visit' : 'visits'})
                                                            </span>
                                                        </div>
                                                        <button
                                                            onClick={() => handleAskTips(emp)}
                                                            className="px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 transition-all"
                                                        >
                                                            <ChatAltIcon className="w-3 h-3 mr-1" /> Ask
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-xs text-gray-500">
                                                No previous employees found for this client.
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {shift.notes && (
                            <div className="flex items-start gap-2">
                                <AnnotationIcon className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                                <p className="text-sm text-gray-600 italic">
                                    "{shift.notes}"
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Action / Status Badge */}
                    <div className="flex items-center justify-end md:flex-col md:justify-center gap-2">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Confirmed
                        </span>
                    </div>
                </div>
            </div>

            {/* Ask Tips Modal */}
            <AskTipsModal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                employee={selectedEmployee}
                clientName={shift.clientName}
            />
        </>
    );
};

export default MyScheduleCard;
