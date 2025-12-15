/**
 * Schedule Notification Service
 * Handles daily briefings and schedule change alerts
 */

const Settings = require('../models/Settings');
const User = require('../models/User');
const Shift = require('../models/Shift');
const { sendEmail, processTemplate } = require('./emailService');

/**
 * Send daily schedule briefing to all employees
 * Called by cron job at configured time (default 6 AM)
 */
const sendDailyBriefings = async () => {
    try {
        const settings = await Settings.getSettings();

        // Check if notifications are enabled
        if (!settings.scheduleNotifications?.enabled) {
            console.log('[DailyBriefing] Feature disabled, skipping...');
            return { sent: 0, message: 'Feature disabled' };
        }

        // Get today's date info
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Get the latest schedule
        const schedule = await Shift.find().sort({ _id: -1 }).limit(1);
        if (!schedule || schedule.length === 0 || !schedule[0].shifts) {
            console.log('[DailyBriefing] No schedule found');
            return { sent: 0, message: 'No schedule found' };
        }

        // Calculate day index
        let dayIndex = -1;
        if (schedule[0].startDate) {
            const startDate = new Date(schedule[0].startDate);
            startDate.setHours(0, 0, 0, 0);
            const diffTime = today.getTime() - startDate.getTime();
            const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
            if (diffDays >= 0 && diffDays <= 5) {
                dayIndex = diffDays;
            }
        }

        if (dayIndex < 0 || dayIndex > 5) {
            console.log('[DailyBriefing] Today is outside schedule range');
            return { sent: 0, message: 'Today outside schedule range' };
        }

        // Get all employees with emails who want daily briefings
        const employees = await User.find({
            admin: false,
            email: { $ne: '', $exists: true },
            'notificationPreferences.dailyBriefing': { $ne: false }
        });

        console.log(`[DailyBriefing] Found ${employees.length} employees to notify`);

        let sentCount = 0;

        for (const employee of employees) {
            // Find this employee's shifts for today
            const myShifts = schedule[0].shifts.filter(shift => {
                const isMyShift = (shift.employeeId && shift.employeeId.toString() === employee._id.toString()) ||
                    (shift.employeeName && shift.employeeName === employee.username);

                let shiftDayIndex = -1;
                if (typeof shift.day === 'number') {
                    shiftDayIndex = shift.day;
                } else if (shift.id && typeof shift.id === 'string' && shift.id.includes('-')) {
                    shiftDayIndex = parseInt(shift.id.split('-')[0]);
                }

                return isMyShift && shiftDayIndex === dayIndex;
            });

            if (myShifts.length === 0) {
                console.log(`[DailyBriefing] No shifts today for ${employee.username}`);
                continue;
            }

            // Build schedule summary
            const scheduleList = myShifts.map(shift =>
                `• ${shift.clientName || 'TBD'} - ${shift.startTime} to ${shift.endTime}`
            ).join('\n');

            const emailBody = `Hi ${employee.username},

Here's your schedule for today (${today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}):

${scheduleList}

Have a great day!

${settings.companyName || 'Your Cleaning Company'}`;

            try {
                await sendEmail({
                    to: employee.email,
                    subject: `Your Schedule for Today - ${today.toLocaleDateString()}`,
                    text: emailBody,
                    html: emailBody.replace(/\n/g, '<br>')
                });
                sentCount++;
                console.log(`[DailyBriefing] Sent to ${employee.email}`);
            } catch (emailError) {
                console.error(`[DailyBriefing] Failed to send to ${employee.email}:`, emailError.message);
            }
        }

        console.log(`[DailyBriefing] Complete: ${sentCount} emails sent`);
        return { sent: sentCount };
    } catch (error) {
        console.error('[DailyBriefing] Error:', error);
        return { sent: 0, error: error.message };
    }
};

/**
 * Notify employees about schedule changes
 * @param {Object} changes - { added: [], removed: [], modified: [] }
 * @param {Date} scheduleDate - The date of the affected schedule
 */
const notifyScheduleChanges = async (changes, scheduleDate) => {
    try {
        const settings = await Settings.getSettings();

        if (!settings.scheduleNotifications?.enabled) {
            return { sent: 0, message: 'Feature disabled' };
        }

        const affectedEmployeeIds = new Set();

        // Collect all affected employee IDs
        [...(changes.added || []), ...(changes.removed || []), ...(changes.modified || [])].forEach(shift => {
            if (shift.employeeId) affectedEmployeeIds.add(shift.employeeId.toString());
        });

        if (affectedEmployeeIds.size === 0) {
            return { sent: 0, message: 'No employees affected' };
        }

        // Get affected employees
        const employees = await User.find({
            _id: { $in: Array.from(affectedEmployeeIds) },
            email: { $ne: '', $exists: true },
            'notificationPreferences.scheduleChanges': { $ne: false }
        });

        let sentCount = 0;

        for (const employee of employees) {
            const employeeId = employee._id.toString();

            // Find changes affecting this employee
            const addedShifts = (changes.added || []).filter(s => s.employeeId?.toString() === employeeId);
            const removedShifts = (changes.removed || []).filter(s => s.employeeId?.toString() === employeeId);
            const modifiedShifts = (changes.modified || []).filter(s => s.employeeId?.toString() === employeeId);

            let changeDescription = '';

            if (addedShifts.length > 0) {
                changeDescription += 'NEW ASSIGNMENT:\n' + addedShifts.map(s =>
                    `• ${s.clientName || 'TBD'} - ${s.startTime} to ${s.endTime}`
                ).join('\n') + '\n\n';
            }

            if (removedShifts.length > 0) {
                changeDescription += 'REMOVED FROM:\n' + removedShifts.map(s =>
                    `• ${s.clientName || 'TBD'} - ${s.startTime} to ${s.endTime}`
                ).join('\n') + '\n\n';
            }

            if (modifiedShifts.length > 0) {
                changeDescription += 'MODIFIED:\n' + modifiedShifts.map(s =>
                    `• ${s.clientName || 'TBD'} - ${s.startTime} to ${s.endTime}`
                ).join('\n') + '\n\n';
            }

            const emailBody = `Hi ${employee.username},

Your schedule has been updated:

${changeDescription}
Please check the app for full details.

${settings.companyName || 'Your Cleaning Company'}`;

            try {
                await sendEmail({
                    to: employee.email,
                    subject: `⚠️ Schedule Update - ${scheduleDate?.toLocaleDateString() || 'Upcoming'}`,
                    text: emailBody,
                    html: emailBody.replace(/\n/g, '<br>')
                });
                sentCount++;
                console.log(`[ScheduleChange] Notified ${employee.email}`);
            } catch (emailError) {
                console.error(`[ScheduleChange] Failed to notify ${employee.email}:`, emailError.message);
            }
        }

        return { sent: sentCount };
    } catch (error) {
        console.error('[ScheduleChange] Error:', error);
        return { sent: 0, error: error.message };
    }
};

/**
 * Compare two schedule versions to detect changes
 */
const detectScheduleChanges = (oldShifts = [], newShifts = []) => {
    const oldMap = new Map(oldShifts.map(s => [s.id || `${s.employeeId}-${s.clientId}`, s]));
    const newMap = new Map(newShifts.map(s => [s.id || `${s.employeeId}-${s.clientId}`, s]));

    const added = [];
    const removed = [];
    const modified = [];

    // Find added and modified shifts
    for (const [id, shift] of newMap) {
        if (!oldMap.has(id)) {
            added.push(shift);
        } else {
            const oldShift = oldMap.get(id);
            if (JSON.stringify(oldShift) !== JSON.stringify(shift)) {
                modified.push(shift);
            }
        }
    }

    // Find removed shifts
    for (const [id, shift] of oldMap) {
        if (!newMap.has(id)) {
            removed.push(shift);
        }
    }

    return { added, removed, modified };
};

module.exports = {
    sendDailyBriefings,
    notifyScheduleChanges,
    detectScheduleChanges
};
