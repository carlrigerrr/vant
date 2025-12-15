import { useUserContext } from '../../useUserContext';
import RequestsListTableRow from './RequestsListTableRow';
import { parse, isAfter, format } from 'date-fns';
import { useState, useEffect } from 'react';
import { Button, Collapse } from '@mantine/core';
import axios from 'axios';
import { CalendarIcon, RefreshIcon, SwitchHorizontalIcon, OfficeBuildingIcon, UserIcon, ChatAltIcon, XCircleIcon } from '@heroicons/react/outline';

export default function RequestsList() {
  const { user, refresh } = useUserContext();
  const [opened, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('dayoff'); // 'dayoff' or 'swap'
  const [swapRequests, setSwapRequests] = useState([]);
  const [loadingSwaps, setLoadingSwaps] = useState(false);
  const [cancellingId, setCancellingId] = useState(null);

  // Ensure swapRequests is always an array
  const safeSwapRequests = Array.isArray(swapRequests) ? swapRequests : [];

  // Fetch user's swap requests
  const fetchMySwapRequests = async () => {
    setLoadingSwaps(true);
    try {
      const response = await axios.get('/api/shift-swap-request/my');
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
      setSwapRequests([]);
    } finally {
      setLoadingSwaps(false);
    }
  };

  useEffect(() => {
    fetchMySwapRequests();
  }, []);

  // Poll for request status updates every 30 seconds
  useEffect(() => {
    if (!user) return;

    const pollInterval = setInterval(() => {
      refresh();
      fetchMySwapRequests();
    }, 30000);

    return () => clearInterval(pollInterval);
  }, [user, refresh]);

  const handleCancelSwap = async (requestId) => {
    setCancellingId(requestId);
    try {
      await axios.post(`/api/shift-swap-request/${requestId}/cancel`);
      await fetchMySwapRequests();
    } catch (error) {
      console.error('Error cancelling request:', error);
      alert(error.response?.data?.message || 'Failed to cancel request');
    } finally {
      setCancellingId(null);
    }
  };

  const blockedDates = [...user.blockedDates];

  blockedDates.forEach((date, i) => {
    const parsedDate = parse(date.date, 'dd-MM-yyyy', new Date());

    if (!isAfter(parsedDate, new Date())) {
      delete blockedDates[i];
    }
  });

  // Count pending requests for badges
  const pendingDayOffCount = blockedDates.filter(d => d && !d.approved).length;
  const pendingSwapCount = safeSwapRequests.filter(r => r.status === 'pending').length;

  const getStatusBadge = (status) => {
    const badges = {
      pending: 'bg-yellow-100 text-yellow-700',
      approved: 'bg-green-100 text-green-700',
      denied: 'bg-red-100 text-red-700',
      cancelled: 'bg-gray-100 text-gray-500'
    };
    return badges[status] || badges.pending;
  };

  const renderSwapCard = (request) => {
    const isPending = request.status === 'pending';
    const isCancelling = cancellingId === request._id;

    return (
      <div
        key={request._id}
        className="p-4 mb-4 bg-white border border-gray-200 rounded-lg shadow-sm"
      >
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="bg-blue-50 p-1.5 rounded-lg text-blue-600">
                <SwitchHorizontalIcon className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-gray-800">Shift Swap Request</h3>
            </div>
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(request.status)}`}>
              {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
            </span>
          </div>

          <div className="grid gap-2 text-sm">
            <div className="flex items-center gap-2">
              <CalendarIcon className="w-4 h-4 text-gray-400" />
              <span className="text-gray-500">Date:</span>
              <span className="font-medium">
                {request.shiftDate ? format(new Date(request.shiftDate), 'EEEE, dd MMM yyyy') : 'N/A'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <OfficeBuildingIcon className="w-4 h-4 text-gray-400" />
              <span className="text-gray-500">Client:</span>
              <span className="font-medium">{request.clientName || 'N/A'}</span>
            </div>
            {request.targetEmployeeName && (
              <div className="flex items-center gap-2">
                <UserIcon className="w-4 h-4 text-gray-400" />
                <span className="text-gray-500">Swap with:</span>
                <span className="font-medium">{request.targetEmployeeName}</span>
              </div>
            )}
            {request.reason && (
              <div className="flex items-start gap-2">
                <ChatAltIcon className="w-4 h-4 text-gray-400 mt-0.5" />
                <span className="text-gray-500">Reason:</span>
                <span className="text-gray-700 italic">{request.reason}</span>
              </div>
            )}
          </div>

          {request.adminNote && request.status !== 'pending' && (
            <div className="p-2 bg-gray-50 rounded-lg text-sm">
              <span className="text-gray-500">Admin note:</span>{' '}
              <span className="text-gray-700">{request.adminNote}</span>
            </div>
          )}

          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-gray-400">
              Submitted: {format(new Date(request.createdAt), 'dd MMM yyyy, HH:mm')}
            </span>
            {isPending && (
              <button
                onClick={() => handleCancelSwap(request._id)}
                disabled={isCancelling}
                className="px-3 py-1 text-xs font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50"
              >
                {isCancelling ? 'Cancelling...' : <span className="flex items-center gap-1"><XCircleIcon className="w-3 h-3" /> Cancel Request</span>}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="mx-auto mt-5 md:w-5/6 lg:w-4/6">
        {/* Tab Navigation */}
        <div className="flex mb-4 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('dayoff')}
            className={`relative px-4 py-3 text-sm font-medium transition-colors ${activeTab === 'dayoff'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
              }`}
          >
            <div className="flex items-center gap-1">
              <CalendarIcon className="w-4 h-4" />
              <span>Day Off Requests</span>
            </div>
            {pendingDayOffCount > 0 && (
              <span className="absolute top-1 -right-1 px-1.5 py-0.5 text-xs font-bold text-white bg-yellow-500 rounded-full">
                {pendingDayOffCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('swap')}
            className={`relative px-4 py-3 text-sm font-medium transition-colors ml-4 ${activeTab === 'swap'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
              }`}
          >
            <div className="flex items-center gap-1">
              <SwitchHorizontalIcon className="w-4 h-4" />
              <span>Shift Swaps</span>
            </div>
            {pendingSwapCount > 0 && (
              <span className="absolute top-1 -right-1 px-1.5 py-0.5 text-xs font-bold text-white bg-yellow-500 rounded-full">
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
                My Day Off Requests
              </p>
              <button
                onClick={() => refresh()}
                className="px-3 py-1 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                <span className="flex items-center gap-1"><RefreshIcon className="w-3 h-3" /> Refresh</span>
              </button>
            </div>
            <div className="px-4 pt-4">
              {blockedDates.length !== 0 && (
                <table className="w-full">
                  <tbody>
                    {blockedDates
                      .slice(0)
                      .reverse()
                      .map((date) => {
                        if (!date) return null;
                        return (
                          <RequestsListTableRow
                            key={date._id}
                            comment={date.comment}
                            date={date.date}
                            status={date.approved}
                            dateID={date._id}
                          />
                        );
                      })}
                  </tbody>
                </table>
              )}

              {blockedDates.length > 0 ? (
                <div className="flex justify-center mt-5">
                  <Button className="text-lg bg-gray-600" onClick={() => setOpen((o) => !o)}>
                    {opened ? 'Hide Past Requests' : 'See All Past Requests'}
                  </Button>
                </div>
              ) : (
                <h1 className="text-2xl font-medium text-center my-28 text-slate-800">
                  No day off requests
                </h1>
              )}
              <Collapse in={opened}>
                <div className="mt-4 border-t border-gray-200 pt-4">
                  <p className="text-sm text-gray-500 mb-2">All Requests (including past)</p>
                  <table className="w-full mt-2">
                    <tbody>
                      {user.blockedDates
                        .slice(0)
                        .reverse()
                        .map((date) => {
                          return (
                            <RequestsListTableRow
                              key={date._id}
                              comment={date.comment}
                              date={date.date}
                              status={date.approved}
                              dateID={date._id}
                            />
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </Collapse>
            </div>
          </div>
        )}

        {/* Shift Swap Requests Tab */}
        {activeTab === 'swap' && (
          <div className="pb-6 border border-gray-200 rounded-lg">
            <div className="flex items-center justify-between px-6 py-3 border-b border-gray-200">
              <p className="text-lg font-semibold leading-tight text-gray-800 lg:text-xl">
                My Shift Swap Requests
              </p>
              <button
                onClick={() => fetchMySwapRequests()}
                className="px-3 py-1 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                <span className="flex items-center gap-1"><RefreshIcon className="w-3 h-3" /> Refresh</span>
              </button>
            </div>
            <div className="px-4 pt-4">
              {loadingSwaps ? (
                <div className="py-8 text-center text-gray-500">Loading swap requests...</div>
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
                        .map(renderSwapCard)}
                    </div>
                  )}

                  {/* Processed requests */}
                  {safeSwapRequests.filter(r => r.status !== 'pending').length > 0 && (
                    <div>
                      <h3 className="mb-3 text-sm font-semibold text-gray-500 uppercase">
                        Past Requests ({safeSwapRequests.filter(r => r.status !== 'pending').length})
                      </h3>
                      {safeSwapRequests
                        .filter(r => r.status !== 'pending')
                        .sort((a, b) => new Date(b.processedAt || b.createdAt) - new Date(a.processedAt || a.createdAt))
                        .map(renderSwapCard)}
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
