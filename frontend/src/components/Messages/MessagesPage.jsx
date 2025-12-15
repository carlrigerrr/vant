import React, { useState, useEffect, useRef } from 'react';
import { ChatAlt2Icon, PlusIcon, ArrowLeftIcon, XIcon, PaperAirplaneIcon } from '@heroicons/react/outline';
import axios from 'axios';
import { useUserContext } from '../useUserContext';
import useNotifications from '../../hooks/useNotifications';

const MessagesPage = () => {
    const { user } = useUserContext();
    const { notifyNewMessage } = useNotifications();
    const [conversations, setConversations] = useState([]);
    const [selectedConversation, setSelectedConversation] = useState(null);
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingThread, setLoadingThread] = useState(false);
    const [showNewMessage, setShowNewMessage] = useState(false);
    const [users, setUsers] = useState([]);
    const [newMessage, setNewMessage] = useState({ receiverId: '', content: '' });
    const [replyContent, setReplyContent] = useState('');
    const [sending, setSending] = useState(false);
    const messagesEndRef = useRef(null);
    const lastConversationIdRef = useRef(null);

    useEffect(() => {
        if (user) {
            fetchConversations();
            fetchUsers();
        }
    }, [user]);

    // Poll for new messages every 15 seconds
    useEffect(() => {
        if (!user) return;
        const pollInterval = setInterval(() => {
            fetchConversations();
            if (selectedConversation) {
                fetchThread(selectedConversation.partnerId, true);
            }
        }, 15000);
        return () => clearInterval(pollInterval);
    }, [user, selectedConversation]);

    // Scroll to bottom when messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const fetchConversations = async () => {
        try {
            const response = await axios.get('/api/messages/conversations');
            const newConversations = Array.isArray(response.data) ? response.data : [];

            // Check for new messages
            if (newConversations.length > 0 && lastConversationIdRef.current) {
                const topConvo = newConversations[0];
                if (topConvo.unreadCount > 0 && topConvo.partnerId !== lastConversationIdRef.current) {
                    notifyNewMessage(topConvo.partnerName, topConvo.lastMessage);
                }
            }
            if (newConversations.length > 0) {
                lastConversationIdRef.current = newConversations[0].partnerId;
            }

            setConversations(newConversations);
        } catch (error) {
            console.error('Error fetching conversations:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchUsers = async () => {
        try {
            const response = await axios.get('/api/messages/users');
            setUsers(Array.isArray(response.data) ? response.data : []);
        } catch (error) {
            console.error('Error fetching users:', error);
        }
    };

    const fetchThread = async (partnerId, silent = false) => {
        if (!silent) setLoadingThread(true);
        try {
            const response = await axios.get(`/api/messages/thread/${partnerId}`);
            setMessages(Array.isArray(response.data) ? response.data : []);
            // Refresh conversations to update unread count
            if (!silent) fetchConversations();
        } catch (error) {
            console.error('Error fetching thread:', error);
        } finally {
            setLoadingThread(false);
        }
    };

    const handleSelectConversation = (convo) => {
        setSelectedConversation(convo);
        fetchThread(convo.partnerId);
    };

    const handleSendReply = async (e) => {
        e.preventDefault();
        if (!replyContent.trim() || !selectedConversation) return;

        setSending(true);
        try {
            await axios.post('/api/messages', {
                receiverId: selectedConversation.partnerId,
                content: replyContent
            });
            setReplyContent('');
            fetchThread(selectedConversation.partnerId);
            fetchConversations();
        } catch (error) {
            alert('Error sending message');
        } finally {
            setSending(false);
        }
    };

    const handleStartNewConversation = async (e) => {
        e.preventDefault();
        if (!newMessage.receiverId || !newMessage.content.trim()) return;

        setSending(true);
        try {
            await axios.post('/api/messages', newMessage);
            setNewMessage({ receiverId: '', content: '' });
            setShowNewMessage(false);
            fetchConversations();
            // Select the new conversation
            const selectedUser = users.find(u => u._id === newMessage.receiverId);
            if (selectedUser) {
                setSelectedConversation({
                    partnerId: selectedUser._id,
                    partnerName: selectedUser.username
                });
                fetchThread(selectedUser._id);
            }
        } catch (error) {
            alert('Error sending message');
        } finally {
            setSending(false);
        }
    };

    const formatTime = (date) => {
        const d = new Date(date);
        const now = new Date();
        const diff = now - d;
        const mins = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (mins < 1) return 'now';
        if (mins < 60) return `${mins}m`;
        if (hours < 24) return `${hours}h`;
        if (days < 7) return `${days}d`;
        return d.toLocaleDateString();
    };

    const formatMessageTime = (date) => {
        return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    if (!user) {
        return <div className="text-center py-10">Loading...</div>;
    }

    return (
        <div className="h-[calc(100vh-80px)] flex flex-col">
            {/* Header */}
            <div className="bg-white border-b px-4 py-3 flex justify-between items-center">
                <h1 className="text-xl font-bold flex items-center gap-2">
                    <ChatAlt2Icon className="w-6 h-6 text-blue-600" /> Messages
                </h1>
                <button
                    onClick={() => setShowNewMessage(true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-blue-700 flex items-center gap-1"
                >
                    <PlusIcon className="w-4 h-4" /> New
                </button>
            </div>

            <div className="flex flex-1 overflow-hidden">
                {/* Left Panel - Conversations List */}
                <div className={`w-full md:w-80 border-r bg-white flex flex-col ${selectedConversation ? 'hidden md:flex' : 'flex'}`}>
                    <div className="flex-1 overflow-y-auto">
                        {loading ? (
                            <div className="p-4 text-center text-gray-500">Loading...</div>
                        ) : conversations.length === 0 ? (
                            <div className="p-8 text-center text-gray-500">
                                <ChatAlt2Icon className="w-16 h-16 mx-auto mb-2 text-gray-300" />
                                <p>No conversations yet</p>
                                <button
                                    onClick={() => setShowNewMessage(true)}
                                    className="mt-2 text-blue-600 hover:underline"
                                >
                                    Start a conversation
                                </button>
                            </div>
                        ) : (
                            conversations.map((convo) => (
                                <div
                                    key={convo.partnerId}
                                    onClick={() => handleSelectConversation(convo)}
                                    className={`p-4 border-b cursor-pointer hover:bg-gray-50 transition-colors ${selectedConversation?.partnerId === convo.partnerId ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                                        }`}
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                                            {convo.partnerName?.[0]?.toUpperCase() || '?'}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-center">
                                                <span className={`font-medium ${convo.unreadCount > 0 ? 'text-black' : 'text-gray-700'}`}>
                                                    {convo.partnerName}
                                                </span>
                                                <span className="text-xs text-gray-400">{formatTime(convo.lastMessageTime)}</span>
                                            </div>
                                            <p className={`text-sm truncate ${convo.unreadCount > 0 ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>
                                                {convo.lastMessageIsFromMe && <span className="text-gray-400">You: </span>}
                                                {convo.lastMessage}
                                            </p>
                                        </div>
                                        {convo.unreadCount > 0 && (
                                            <span className="bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                                                {convo.unreadCount}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Right Panel - Conversation Thread */}
                <div className={`flex-1 flex flex-col bg-gray-50 ${!selectedConversation ? 'hidden md:flex' : 'flex'}`}>
                    {selectedConversation ? (
                        <>
                            {/* Thread Header */}
                            <div className="bg-white border-b px-4 py-3 flex items-center gap-3">
                                <button
                                    onClick={() => setSelectedConversation(null)}
                                    className="md:hidden text-gray-500 hover:text-gray-700"
                                >
                                    <ArrowLeftIcon className="w-6 h-6" />
                                </button>
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                                    {selectedConversation.partnerName?.[0]?.toUpperCase()}
                                </div>
                                <span className="font-semibold">{selectedConversation.partnerName}</span>
                            </div>

                            {/* Messages */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                                {loadingThread ? (
                                    <div className="text-center text-gray-500">Loading...</div>
                                ) : messages.length === 0 ? (
                                    <div className="text-center text-gray-400 py-8">
                                        Start the conversation!
                                    </div>
                                ) : (
                                    messages.map((msg) => (
                                        <div key={msg._id} className={`flex ${msg.isFromMe ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`max-w-[75%] px-4 py-2 rounded-2xl ${msg.isFromMe
                                                ? 'bg-blue-600 text-white rounded-br-md'
                                                : 'bg-white text-gray-800 rounded-bl-md shadow-sm'
                                                }`}>
                                                <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                                                <p className={`text-xs mt-1 ${msg.isFromMe ? 'text-blue-200' : 'text-gray-400'}`}>
                                                    {formatMessageTime(msg.createdAt)}
                                                </p>
                                            </div>
                                        </div>
                                    ))
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Reply Input */}
                            <form onSubmit={handleSendReply} className="bg-white border-t p-3">
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={replyContent}
                                        onChange={(e) => setReplyContent(e.target.value)}
                                        placeholder="Type a message..."
                                        className="flex-1 px-4 py-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                    <button
                                        type="submit"
                                        disabled={!replyContent.trim() || sending}
                                        className="bg-blue-600 text-white px-4 py-2 rounded-full font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
                                    >
                                        {sending ? '...' : <><PaperAirplaneIcon className="w-4 h-4 rotate-90" /> Send</>}
                                    </button>
                                </div>
                            </form>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                            <ChatAlt2Icon className="w-24 h-24 mb-4 text-gray-300" />
                            <p className="text-lg">Select a conversation</p>
                            <p className="text-sm">or start a new one</p>
                        </div>
                    )}
                </div>
            </div>

            {/* New Message Modal */}
            {showNewMessage && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-bold">New Message</h2>
                            <button onClick={() => setShowNewMessage(false)} className="text-gray-500 hover:text-gray-700"><XIcon className="w-6 h-6" /></button>
                        </div>
                        <form onSubmit={handleStartNewConversation} className="space-y-4">
                            <select
                                value={newMessage.receiverId}
                                onChange={(e) => setNewMessage({ ...newMessage, receiverId: e.target.value })}
                                required
                                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="">Select recipient...</option>
                                {users.map((u) => (
                                    <option key={u._id} value={u._id}>
                                        {u.username} {u.admin ? '(Admin)' : ''}
                                    </option>
                                ))}
                            </select>
                            <textarea
                                value={newMessage.content}
                                onChange={(e) => setNewMessage({ ...newMessage, content: e.target.value })}
                                placeholder="Write your message..."
                                required
                                rows={4}
                                className="w-full p-3 border rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => setShowNewMessage(false)}
                                    className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={sending}
                                    className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300"
                                >
                                    {sending ? 'Sending...' : 'Send'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MessagesPage;
