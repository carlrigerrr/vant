import React, { useState } from 'react';
import axios from 'axios';

const AskTipsModal = ({ isOpen, onClose, employee, clientName }) => {
    const [message, setMessage] = useState(
        `Hi ${employee?.employeeName}! I'm assigned to ${clientName} today. Any tips about parking, access codes, or the best way to get there? Thanks!`
    );
    const [sending, setSending] = useState(false);
    const [sent, setSent] = useState(false);
    const [error, setError] = useState('');

    const handleSend = async () => {
        if (!message.trim()) return;

        setSending(true);
        setError('');

        try {
            await axios.post('/api/messages', {
                receiverId: employee.employeeId,
                subject: `Tips for ${clientName}`,
                content: message
            });
            setSent(true);
            setTimeout(() => {
                onClose();
                setSent(false);
                setMessage(`Hi ${employee?.employeeName}! I'm assigned to ${clientName} today. Any tips about parking, access codes, or the best way to get there? Thanks!`);
            }, 1500);
        } catch (err) {
            setError('Failed to send message. Please try again.');
        } finally {
            setSending(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 relative">
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                >
                    ✕
                </button>

                {sent ? (
                    <div className="text-center py-8">
                        <div className="text-5xl mb-4">✅</div>
                        <h3 className="text-xl font-semibold text-gray-800">Message Sent!</h3>
                        <p className="text-gray-500 mt-2">
                            {employee?.employeeName} will receive your message
                        </p>
                    </div>
                ) : (
                    <>
                        <h3 className="text-lg font-semibold text-gray-800 mb-1">
                            💬 Ask for Tips
                        </h3>
                        <p className="text-sm text-gray-500 mb-4">
                            Message <span className="font-medium text-gray-700">{employee?.employeeName}</span> about {clientName}
                        </p>

                        {error && (
                            <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
                                {error}
                            </div>
                        )}

                        <textarea
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            rows={4}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                            placeholder="Type your message..."
                        />

                        <div className="flex gap-3 mt-4">
                            <button
                                onClick={onClose}
                                className="flex-1 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSend}
                                disabled={sending || !message.trim()}
                                className="flex-1 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {sending ? (
                                    <>
                                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                        </svg>
                                        Sending...
                                    </>
                                ) : (
                                    <>📤 Send Message</>
                                )}
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default AskTipsModal;
