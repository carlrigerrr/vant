/**
 * Socket.io Real-time Communication Module
 * Handles WebSocket connections for real-time notifications
 */

const { Server } = require('socket.io');

let io = null;
const connectedUsers = new Map(); // userId -> socketId
const connectedClients = new Map(); // clientId -> socketId
const adminSockets = new Set(); // admin socket IDs

const initializeSocket = (httpServer) => {
    io = new Server(httpServer, {
        cors: {
            origin: ["http://localhost:3000", "http://localhost:4080"],
            methods: ["GET", "POST"],
            credentials: true
        }
    });

    io.on('connection', (socket) => {
        console.log('🔌 New socket connection:', socket.id);

        // User (employee) authentication
        socket.on('auth:user', (data) => {
            const { userId, isAdmin, username } = data;
            console.log(`👤 User authenticated: ${username} (${userId}), Admin: ${isAdmin}`);

            socket.userId = userId;
            socket.username = username;
            socket.isAdmin = isAdmin;
            socket.userType = 'employee';

            connectedUsers.set(userId, socket.id);

            if (isAdmin) {
                adminSockets.add(socket.id);
            }

            // Join user-specific room
            socket.join(`user:${userId}`);

            // Admins join admin room
            if (isAdmin) {
                socket.join('admins');
            }

            socket.emit('auth:success', { message: 'Connected to real-time updates' });
        });

        // Client (customer) authentication
        socket.on('auth:client', (data) => {
            const { clientId, name } = data;
            console.log(`🏠 Client authenticated: ${name} (${clientId})`);

            socket.clientId = clientId;
            socket.clientName = name;
            socket.userType = 'client';

            connectedClients.set(clientId, socket.id);

            // Join client-specific room
            socket.join(`client:${clientId}`);

            socket.emit('auth:success', { message: 'Connected to real-time updates' });
        });

        // Handle disconnection
        socket.on('disconnect', () => {
            console.log('🔌 Socket disconnected:', socket.id);

            if (socket.userId) {
                connectedUsers.delete(socket.userId);
            }
            if (socket.clientId) {
                connectedClients.delete(socket.clientId);
            }
            if (socket.isAdmin) {
                adminSockets.delete(socket.id);
            }
        });

        // Request notification permission status
        socket.on('notification:permission', (status) => {
            console.log(`🔔 Notification permission for ${socket.userId || socket.clientId}: ${status}`);
        });
    });

    console.log('✅ Socket.io initialized');
    return io;
};

// ==================== EMIT FUNCTIONS ====================

/**
 * Emit to all admins
 */
const emitToAdmins = (event, data) => {
    if (io) {
        io.to('admins').emit(event, data);
        console.log(`📣 Emitted "${event}" to admins`);
    }
};

/**
 * Emit to a specific user (employee)
 */
const emitToUser = (userId, event, data) => {
    if (io) {
        io.to(`user:${userId}`).emit(event, data);
        console.log(`📣 Emitted "${event}" to user ${userId}`);
    }
};

/**
 * Emit to a specific client
 */
const emitToClient = (clientId, event, data) => {
    if (io) {
        io.to(`client:${clientId}`).emit(event, data);
        console.log(`📣 Emitted "${event}" to client ${clientId}`);
    }
};

/**
 * Emit to all connected sockets
 */
const emitToAll = (event, data) => {
    if (io) {
        io.emit(event, data);
        console.log(`📣 Broadcast "${event}" to all`);
    }
};

// ==================== NOTIFICATION EVENTS ====================

/**
 * Notify when employee checks in
 */
const notifyCheckIn = (data) => {
    const { employeeId, employeeName, clientId, clientName, time, location } = data;

    // Notify admins
    emitToAdmins('employee:checkin', {
        type: 'checkin',
        title: '✅ Employee Checked In',
        message: `${employeeName} has checked in at ${clientName}`,
        employeeId,
        clientId,
        time,
        location,
        timestamp: new Date()
    });

    // Notify the client
    if (clientId) {
        emitToClient(clientId, 'service:update', {
            type: 'employee_arrived',
            title: '🏠 Employee Arrived',
            message: `${employeeName} has arrived and started working`,
            employeeName,
            time,
            timestamp: new Date()
        });
    }
};

/**
 * Notify when employee checks out
 */
const notifyCheckOut = (data) => {
    const { employeeId, employeeName, clientId, clientName, time, duration } = data;

    // Notify admins
    emitToAdmins('employee:checkout', {
        type: 'checkout',
        title: '👋 Employee Checked Out',
        message: `${employeeName} has checked out from ${clientName} (${duration})`,
        employeeId,
        clientId,
        time,
        duration,
        timestamp: new Date()
    });

    // Notify the client
    if (clientId) {
        emitToClient(clientId, 'service:update', {
            type: 'employee_left',
            title: '👋 Service Complete',
            message: `${employeeName} has finished working`,
            employeeName,
            time,
            duration,
            timestamp: new Date()
        });
    }
};

/**
 * Notify when job is marked complete
 */
const notifyJobComplete = (data) => {
    const { employeeId, employeeName, clientId, clientName } = data;

    // Notify admins
    emitToAdmins('job:complete', {
        type: 'job_complete',
        title: '✅ Job Completed',
        message: `${employeeName} marked job complete at ${clientName}`,
        employeeId,
        clientId,
        timestamp: new Date()
    });

    // Notify the client
    if (clientId) {
        emitToClient(clientId, 'service:update', {
            type: 'job_complete',
            title: '✅ Job Completed',
            message: `${employeeName} has marked the job as complete`,
            employeeName,
            timestamp: new Date()
        });
    }
};

/**
 * Notify when new day-off request is submitted
 */
const notifyDayOffRequest = (data) => {
    const { employeeId, employeeName, date, reason } = data;

    emitToAdmins('request:dayoff', {
        type: 'dayoff_request',
        title: '📅 Day Off Request',
        message: `${employeeName} requested ${date} off: ${reason || 'No reason given'}`,
        employeeId,
        date,
        reason,
        timestamp: new Date()
    });
};

/**
 * Notify when new shift swap request is submitted
 */
const notifyShiftSwapRequest = (data) => {
    const { employeeId, employeeName, date, clientName, reason } = data;

    emitToAdmins('request:swap', {
        type: 'swap_request',
        title: '🔄 Shift Swap Request',
        message: `${employeeName} requested to swap ${date} at ${clientName}`,
        employeeId,
        date,
        reason,
        timestamp: new Date()
    });
};

/**
 * Notify employee when their request is approved/denied
 */
const notifyRequestResponse = (data) => {
    const { employeeId, type, approved, date, adminNote } = data;

    emitToUser(employeeId, 'request:response', {
        type: type,
        title: approved ? '✅ Request Approved' : '❌ Request Denied',
        message: approved
            ? `Your ${type === 'dayoff' ? 'day off' : 'shift swap'} request for ${date} has been approved`
            : `Your ${type === 'dayoff' ? 'day off' : 'shift swap'} request for ${date} has been denied`,
        approved,
        date,
        adminNote,
        timestamp: new Date()
    });
};

/**
 * Notify GPS warning (late check-in, location mismatch)
 */
const notifyGPSWarning = (data) => {
    const { employeeId, employeeName, clientName, warningType, details } = data;

    emitToAdmins('gps:warning', {
        type: 'gps_warning',
        title: '⚠️ GPS Warning',
        message: `${employeeName} at ${clientName}: ${warningType}`,
        employeeId,
        details,
        timestamp: new Date()
    });
};

/**
 * Notify new message
 */
const notifyNewMessage = (data) => {
    const { recipientId, senderId, senderName, preview } = data;

    emitToUser(recipientId, 'message:new', {
        type: 'new_message',
        title: '💬 New Message',
        message: `${senderName}: ${preview}`,
        senderId,
        senderName,
        timestamp: new Date()
    });
};

/**
 * Notify new announcement
 */
const notifyAnnouncement = (data) => {
    const { title, preview, priority } = data;

    emitToAll('announcement:new', {
        type: 'announcement',
        title: `📢 ${title}`,
        message: preview,
        priority,
        timestamp: new Date()
    });
};

/**
 * Notify client when employee is en route
 */
const notifyEnRoute = (data) => {
    const { employeeId, employeeName, clientId, clientName, estimatedMinutes, estimatedArrivalTime } = data;

    // Notify admins
    emitToAdmins('employee:enroute', {
        type: 'en_route',
        title: '🚗 Employee En Route',
        message: `${employeeName} is on the way to ${clientName} (ETA: ${estimatedMinutes} min)`,
        employeeId,
        clientId,
        estimatedMinutes,
        estimatedArrivalTime,
        timestamp: new Date()
    });

    // Notify the client
    if (clientId) {
        emitToClient(clientId, 'service:update', {
            type: 'employee_en_route',
            title: '🚗 Employee On The Way',
            message: `${employeeName} is on their way! Arriving in approximately ${estimatedMinutes} minutes`,
            employeeName,
            estimatedMinutes,
            estimatedArrivalTime,
            timestamp: new Date()
        });
    }
};

module.exports = {
    initializeSocket,
    emitToAdmins,
    emitToUser,
    emitToClient,
    emitToAll,
    notifyCheckIn,
    notifyCheckOut,
    notifyJobComplete,
    notifyDayOffRequest,
    notifyShiftSwapRequest,
    notifyRequestResponse,
    notifyGPSWarning,
    notifyNewMessage,
    notifyAnnouncement,
    notifyEnRoute
};
