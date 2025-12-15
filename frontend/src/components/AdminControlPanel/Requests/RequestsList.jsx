import { useEffect, useState } from 'react';
import { useUserContext } from '../../useUserContext';
import { useUsersContext } from '../useUsersContext';
import axios from 'axios';
import RequestsListTableRow from './RequestsListTableRow';
import { Button, Collapse } from '@mantine/core';
import { parse, isAfter, format, isSameDay, startOfDay } from 'date-fns';
import { CalendarIcon, SwitchHorizontalIcon, RefreshIcon } from '@heroicons/react/outline';

export default function RequestsList() {
  const { user } = useUserContext();
  const { users, refreshAllUsers } = useUsersContext();
  const [opened, setOpen] = useState(false);
  const [showAllRequests, setShowAllRequests] = useState(false);
  const [activeTab, setActiveTab] = useState('dayoff'); // 'dayoff' or 'swap'
  const [swapRequests, setSwapRequests] = useState([]);
  const [loadingSwaps, setLoadingSwaps] = useState(false);
  const [processingId, setProcessingId] = useState(null);
  const { username } = user;

  // Ensure swapRequests is always an array
  const safeSwapRequests = Array.isArray(swapRequests) ? swapRequests : [];

  useEffect(() => {
    !users && refreshAllUsers();
    checkNoRequests();
  }, [users]);

  // Fetch shift swap requests
  const fetchSwapRequests = async () => {
    setLoadingSwaps(true);
    try {
      const response = await axios.get('/api/shift-swap-request/all');
      // Ensure we always get an array
      const data = response.data;
      if (Array.isArray(data)) {
        setSwapRequests(data);
      } else if (data && Array.isArray(data.requests)) {
        setSwapRequests(data.requests);
      } else {
        console.warn('Unexpected swap requests response format:', data);
        setSwapRequests([]);
      }
    } catch (error) {
      console.error('Error fetching swap requests:', error);
      setSwapRequests([]); // Reset to empty array on error
    } finally {
      setLoadingSwaps(false);
    }
  };

  useEffect(() => {
    fetchSwapRequests();
  }, []);

  // Poll for new requests every 45 seconds
  useEffect(() => {
    if (!user) return;

    const pollInterval = setInterval(() => {
      refreshAllUsers();
      fetchSwapRequests();
    }, 45000);

    return () => clearInterval(pollInterval);
  }, [user, refreshAllUsers]);

  const toggleStatus = async (e, employeeID, dateID) => {
    e.preventDefault();
    await axios.post('/toggle-request-status', {
      dateID,
      employeeID,
      approverUsername: username,
    });
  };

  const handleSwapResponse = async (requestId, action) => {
    setProcessingId(requestId);
    try {
      await axios.post(`/api/shift-swap-request/${requestId}/respond`, {
        action,
        adminNote: action === 'approve' ? 'Approved by admin' : 'Denied by admin'
      });
      await fetchSwapRequests();
    } catch (error) {
      console.error('Error responding to swap request:', error);
      alert(error.response?.data?.message || 'Failed to process request');
    } finally {
      setProcessingId(null);
    }
  };

  const blockRequests = (user, date, functional = false) => {
    if (functional) {
      return (
        <RequestsListTableRow
          key={date._id}
          name={user.username}
          comment={date.comment}
          date={date.date}
          status={date.approved}
          onClick={async (e) => {
            await toggleStatus(e, user._id, date._id);
            await refreshAllUsers();
          }}
        />
      );
    } else {
      return (
        <RequestsListTableRow
          key={date._id}
          name={user.username}
          comment={date.comment}
          date={date.date}
          status={date.approved}
        />
      );
    }
  };

  const checkNoRequests = async () => {
    if (users) {
      for (let i = 0; i < users.length; i++) {
        if (users[i].blockedDates.length > 0) {
          setShowAllRequests(true);
          break;
        }
      }
    }
  };

  // Count pending requests for badges
  const pendingDayOffCount = users
    ? users.reduce((count, u) => {
      const today = startOfDay(new Date());
      return count + u.blockedDates.filter(d => {
        // Try parsing with different formats
        let parsedDate = parse(d.date, 'EEEE, dd MMMM yyyy', new Date());
        if (isNaN(parsedDate.getTime())) {
          parsedDate = parse(d.date, 'dd-MM-yyyy', new Date());
        }
        return !isNaN(parsedDate.getTime()) && (isAfter(parsedDate, today) || isSameDay(parsedDate, today)) && !d.approved;
      }).length;
    }, 0)
    : 0;

  const pendingSwapCount = safeSwapRequests.filter(r => r.status === 'pending').length;

  const renderSwapRequestCard = (request) => {
    const isPending = request.status === 'pending';
    const isProcessing = processingId === request._id;

    return (
      <div
        key={request._id}
        className="p-4 mb-4 bg-white border border-gray-200 rounded-lg shadow-sm"
      >
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <SwitchHorizontalIcon className="w-6 h-6 text-blue-500" />
              <h3 className="text-lg font-semibold text-gray-800">
                Shift Swap Request
              </h3>
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${request.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                request.status === 'approved' ? 'bg-green-100 text-green-700' :
                  request.status === 'denied' ? 'bg-red-100 text-red-700' :
                    'bg-gray-100 text-gray-700'
                }`}>
                {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
              </span>
            </div>

            <div className="grid gap-2 text-sm md:grid-cols-2">
              <div>
                <span className="text-gray-500">From:</span>{' '}
                <span className="font-medium">{request.requesterName}</span>
              </div>
              <div>
                <span className="text-gray-500">To:</span>{' '}
                <span className="font-medium">{request.targetEmployeeName || 'Any available'}</span>
              </div>
              <div>
                <span className="text-gray-500">Date:</span>{' '}
                <span className="font-medium">
                  {request.shiftDate ? format(new Date(request.shiftDate), 'dd MMM yyyy') : 'N/A'}
                </span>
              </div>
              <div>
                <span className="text-gray-500">Client:</span>{' '}
                <span className="font-medium">{request.clientName || 'N/A'}</span>
              </div>
            </div>

            {request.reason && (
              <div className="mt-2 text-sm">
                <span className="text-gray-500">Reason:</span>{' '}
                <span className="italic text-gray-700">{request.reason}</span>
              </div>
            )}

            {request.adminNote && request.status !== 'pending' && (
              <div className="mt-2 text-sm">
                <span className="text-gray-500">Admin Note:</span>{' '}
                <span className="text-gray-700">{request.adminNote}</span>
              </div>
            )}

            <div className="mt-2 text-xs text-gray-400">
              Submitted: {format(new Date(request.createdAt), 'dd MMM yyyy, HH:mm')}
            </div>
          </div>

          {isPending && (
            <div className="flex gap-2 mt-3 md:mt-0 md:flex-col">
              <button
                onClick={() => handleSwapResponse(request._id, 'approve')}
                disabled={isProcessing}
                className="flex-1 px-4 py-2 text-sm font-medium text-white transition-colors bg-green-500 rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? '...' : '✓ Approve'}
              </button>
              <button
                onClick={() => handleSwapResponse(request._id, 'deny')}
                disabled={isProcessing}
                className="flex-1 px-4 py-2 text-sm font-medium text-white transition-colors bg-red-500 rounded-lg hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? '...' : '✕ Deny'}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="w-11/12 mx-auto my-5 md:w-5/6 lg:w-4/6">
        {/* Tab Navigation */}
        <div className="flex mb-4 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('dayoff')}
            className={`relative px-4 py-3 text-sm font-medium transition-colors flex items-center gap-2 ${activeTab === 'dayoff'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
              }`}
          >
            <CalendarIcon className="w-5 h-5" /> Day Off Requests
            {pendingDayOffCount > 0 && (
              <span className="absolute top-1 -right-1 px-1.5 py-0.5 text-xs font-bold text-white bg-red-500 rounded-full">
                {pendingDayOffCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('swap')}
            className={`relative px-4 py-3 text-sm font-medium transition-colors ml-4 flex items-center gap-2 ${activeTab === 'swap'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
              }`}
          >
            <SwitchHorizontalIcon className="w-5 h-5" /> Shift Swap Requests
            {pendingSwapCount > 0 && (
              <span className="absolute top-1 -right-1 px-1.5 py-0.5 text-xs font-bold text-white bg-red-500 rounded-full">
                {pendingSwapCount}
              </span>
            )}
          </button>
        </div>

        {/* Day Off Requests Tab */}
        {activeTab === 'dayoff' && (
          <div className="pb-6 border border-gray-200 rounded-lg">
            <div className="flex items-center justify-between px-6 py-3 border-b border-gray-200">
              <p className="text-lg font-semibold leading-tight text-gray-800 lg:text-xl">
                Day Off Requests
              </p>
              <button
                onClick={() => refreshAllUsers()}
                className="px-3 py-1 text-sm text-gray-600 transition-colors bg-gray-100 rounded-lg hover:bg-gray-200 flex items-center gap-1"
              >
                <RefreshIcon className="w-4 h-4" /> Refresh
              </button>
            </div>
            <div className="px-4 pt-4">
              <table className="w-full">
                <tbody>
                  {users
                    ? users.map((user) => {
                      return user.blockedDates.map((date) => {
                        // Try parsing with different formats
                        let parsedDate = parse(date.date, 'EEEE, dd MMMM yyyy', new Date());
                        if (isNaN(parsedDate.getTime())) {
                          // Fallback to old format
                          parsedDate = parse(date.date, 'dd-MM-yyyy', new Date());
                        }
                        const today = startOfDay(new Date());

                        // Show as actionable if date is today or in the future (and date is valid)
                        if (!isNaN(parsedDate.getTime()) && (isAfter(parsedDate, today) || isSameDay(parsedDate, today))) {
                          const functional = true;
                          return blockRequests(user, date, functional);
                        }
                        return null;
                      });
                    })
                    : null}
                </tbody>
              </table>
              {showAllRequests ? (
                <div className="flex justify-center mt-5">
                  <Button className="text-lg bg-gray-600" onClick={() => setOpen((o) => !o)}>
                    {opened ? 'Hide Past Requests' : 'See All Past Requests'}
                  </Button>
                </div>
              ) : null}
              <Collapse in={opened}>
                <div className="mt-4 border-t border-gray-200 pt-4">
                  <p className="text-sm text-gray-500 mb-2">Past Requests (Read-only)</p>
                  <table className="w-full mt-2">
                    <tbody>
                      {users
                        ? users.map((user) =>
                          user.blockedDates.map((date) => blockRequests(user, date))
                        )
                        : null}
                    </tbody>
                  </table>
                </div>
              </Collapse>
              {!showAllRequests ? (
                <h1 className="text-2xl font-medium text-center my-28 text-slate-800">
                  No day off requests
                </h1>
              ) : null}
            </div>
          </div>
        )}

        {/* Shift Swap Requests Tab */}
        {activeTab === 'swap' && (
          <div className="pb-6 border border-gray-200 rounded-lg">
            <div className="flex items-center justify-between px-6 py-3 border-b border-gray-200">
              <p className="text-lg font-semibold leading-tight text-gray-800 lg:text-xl">
                Shift Swap Requests
              </p>
              <button
                onClick={() => fetchSwapRequests()}
                className="px-3 py-1 text-sm text-gray-600 transition-colors bg-gray-100 rounded-lg hover:bg-gray-200 flex items-center gap-1"
              >
                <RefreshIcon className="w-4 h-4" /> Refresh
              </button>
            </div>
            <div className="px-4 pt-4">
              {loadingSwaps ? (
                <div className="py-8 text-center text-gray-500">
                  Loading swap requests...
                </div>
              ) : safeSwapRequests.length === 0 ? (
                <h1 className="text-2xl font-medium text-center my-28 text-slate-800">
                  No shift swap requests
                </h1>
              ) : (
                <div>
                  {/* Pending requests first */}
                  {safeSwapRequests.filter(r => r.status === 'pending').length > 0 && (
                    <div className="mb-6">
                      <h3 className="mb-3 text-sm font-semibold text-gray-500 uppercase">
                        Pending ({safeSwapRequests.filter(r => r.status === 'pending').length})
                      </h3>
                      {safeSwapRequests
                        .filter(r => r.status === 'pending')
                        .map(renderSwapRequestCard)}
                    </div>
                  )}

                  {/* Processed requests */}
                  {safeSwapRequests.filter(r => r.status !== 'pending').length > 0 && (
                    <div>
                      <h3 className="mb-3 text-sm font-semibold text-gray-500 uppercase">
                        Processed ({safeSwapRequests.filter(r => r.status !== 'pending').length})
                      </h3>
                      {safeSwapRequests
                        .filter(r => r.status !== 'pending')
                        .sort((a, b) => new Date(b.processedAt || b.createdAt) - new Date(a.processedAt || a.createdAt))
                        .map(renderSwapRequestCard)}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
