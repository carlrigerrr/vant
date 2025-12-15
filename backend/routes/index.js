const express = require('express');
const router = express.Router();
const passport = require('passport');
const User = require('./../models/User');
const Shift = require('./../models/Shift');
const Rating = require('./../models/Rating');
const ShiftSwapRequest = require('./../models/ShiftSwapRequest');
const genPassword = require('./../passport/passwordFunctions').genPassword;
const isAdmin = require('./middleware/isAdmin');
const _ = require('lodash');
const { nextSunday, getISOWeek, format } = require('date-fns');

// Socket notifications
const {
  notifyCheckIn,
  notifyCheckOut,
  notifyJobComplete,
  notifyDayOffRequest,
  notifyShiftSwapRequest,
  notifyRequestResponse
} = require('./../socket');

// USER API
router.get('/api/user', async (req, res) => {
  if (req.isAuthenticated()) {
    const { id, username, admin, blockedDates, jobsCompleted } = req.user;

    // Calculate average rating
    const ratings = await Rating.find({ employeeId: id });
    const averageRating = ratings.length > 0
      ? parseFloat((ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length).toFixed(1))
      : 0;

    res.json({
      id,
      username,
      admin,
      blockedDates,
      jobsCompleted: jobsCompleted || 0,
      averageRating,
      totalRatings: ratings.length,
      isAuthenticated: true
    });
  } else {
    res.json({ isAuthenticated: false });
  }
});

// ADMIN GET ALL USERS API
router.get('/api/users', isAdmin, async (req, res) => {
  if (req.isAuthenticated()) {
    const users = await User.find({});
    res.json(users);
  } else {
    res.json({ isAuthenticated: false });
  }
});

// PUBLIC API - Get employee names for rating (accessible to clients)
router.get('/api/employees/list', async (req, res) => {
  try {
    const employees = await User.find({ admin: false }).select('_id username');
    res.json(employees);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});

// REGISTER (admin only), LOGIN & LOGOUT
router.post('/register', isAdmin, async (req, res, next) => {
  try {
    User.findOne({ username: req.body.username }, function (err, user) {
      if (err) res.json(err.msg);
      if (user) res.json('UserAlreadyExists');
      if (!user && req.body.username !== '') {
        const saltHash = genPassword(req.body.password);
        const { salt, hash } = saltHash;
        const newUser = new User({
          username: req.body.username,
          hash: hash,
          salt: salt,
        });

        newUser.save().then((user) => {
          res.json('Registered');
        });
      }
    });
  } catch (error) {
    console.error(error);
  }
});

router.post('/login', passport.authenticate('local'), (req, res) => {
  res.send('loginSuccessful');
});

router.post('/logout', (req, res) => {
  req.logout();
  req.session.destroy(function (err) {
    if (!err) {
      res.status(200).clearCookie('connect.sid', { path: '/' }).json({ status: 'Success' });
    } else {
      console.error(err);
    }
  });
});

// BLOCK DATE REQUEST
router.post('/block-date', async (req, res) => {
  if (req.isAuthenticated()) {
    try {
      const { date, comment } = req.body;
      const username = req.user.username;
      const [employee] = await User.find({ username });

      if (employee.blockedDates.find((element) => element.date === date)) {
        return res.json({ msg: 'BlockAlreadyRequested' });
      } else {
        await User.findOneAndUpdate(
          { username },
          { $push: { blockedDates: { date, comment, approved: false, approvedBy: '' } } }
        );
        return res.json({ msg: 'BlockRequestSuccess' });
      }
    } catch (error) {
      console.error(error);
    }
  } else {
    res.json('Invalid user.');
  }
});

// GET BLOCK REQUEST INFO
router.get('/api/request-info', async (req, res) => {
  try {
    const { employeeID, dateID } = req.query;

    const foundUser = await User.findById(employeeID);

    const filteredDate = _.filter(foundUser.blockedDates, { id: dateID });
    res.send(filteredDate);
  } catch (error) {
    console.error(error);
  }
});

// USER REMOVE REQUESTS
router.post('/delete-request', async (req, res) => {
  try {
    const { employeeID, dateID } = req.body;

    await User.findOneAndUpdate(
      { _id: employeeID },
      {
        $pull: { blockedDates: { _id: dateID } },
      }
    );
    res.send({ msg: 'RequestDeletionSuccess' });
  } catch (error) {
    console.error(error);
    res.send('Error');
  }
});

// ==================== SHIFT SWAP REQUESTS ====================

// CREATE SHIFT SWAP REQUEST (Employee)
router.post('/api/shift-swap-request', async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ msg: 'Unauthorized' });
  }

  try {
    const { shiftId, shiftDate, clientId, clientName, targetEmployeeId, reason } = req.body;

    // Check if there's already a pending request for this shift
    const existingRequest = await ShiftSwapRequest.findOne({
      requesterId: req.user._id,
      shiftDate,
      clientId,
      status: 'pending'
    });

    if (existingRequest) {
      return res.status(400).json({ msg: 'You already have a pending request for this shift' });
    }

    const newRequest = new ShiftSwapRequest({
      requesterId: req.user._id,
      requesterName: req.user.username,
      shiftId,
      shiftDate,
      clientId,
      clientName,
      targetEmployeeId,
      reason,
      status: 'pending'
    });

    await newRequest.save();
    console.log('Shift swap request created:', newRequest._id);

    // Emit real-time notification to admins
    try {
      notifyShiftSwapRequest({
        employeeId: req.user._id,
        employeeName: req.user.username,
        date: shiftDate,
        clientName: clientName || 'Unknown',
        reason
      });
    } catch (socketError) {
      console.error('Socket notification error:', socketError);
    }

    res.json({ msg: 'Swap request submitted successfully', request: newRequest });
  } catch (error) {
    console.error('Error creating shift swap request:', error);
    res.status(500).json({ msg: 'Server error' });
  }
});

// GET MY SHIFT SWAP REQUESTS (Employee)
router.get('/api/shift-swap-request/my', async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ msg: 'Unauthorized' });
  }

  try {
    const requests = await ShiftSwapRequest.find({ requesterId: req.user._id })
      .populate('targetEmployeeId', 'username')
      .populate('clientId', 'name')
      .sort({ createdAt: -1 });

    res.json(requests);
  } catch (error) {
    console.error('Error fetching shift swap requests:', error);
    res.status(500).json({ msg: 'Server error' });
  }
});

// GET ALL SHIFT SWAP REQUESTS (Admin)
router.get('/api/shift-swap-request/all', isAdmin, async (req, res) => {
  try {
    const requests = await ShiftSwapRequest.find({})
      .populate('requesterId', 'username')
      .populate('targetEmployeeId', 'username')
      .populate('clientId', 'name')
      .populate('processedBy', 'username')
      .sort({ createdAt: -1 });

    res.json(requests);
  } catch (error) {
    console.error('Error fetching all shift swap requests:', error);
    res.status(500).json({ msg: 'Server error' });
  }
});

// RESPOND TO SHIFT SWAP REQUEST (Admin)
router.post('/api/shift-swap-request/:id/respond', isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminNote } = req.body;

    if (!['approved', 'denied'].includes(status)) {
      return res.status(400).json({ msg: 'Invalid status' });
    }

    const request = await ShiftSwapRequest.findByIdAndUpdate(
      id,
      {
        status,
        adminNote,
        processedBy: req.user._id,
        processedAt: new Date()
      },
      { new: true }
    );

    if (!request) {
      return res.status(404).json({ msg: 'Request not found' });
    }

    console.log(`Shift swap request ${id} ${status} by ${req.user.username}`);

    // Notify the employee about the response
    try {
      notifyRequestResponse({
        employeeId: request.requesterId,
        type: 'swap',
        approved: status === 'approved',
        date: request.shiftDate,
        adminNote
      });
    } catch (socketError) {
      console.error('Socket notification error:', socketError);
    }

    res.json({ msg: `Request ${status}`, request });
  } catch (error) {
    console.error('Error responding to shift swap request:', error);
    res.status(500).json({ msg: 'Server error' });
  }
});

// CANCEL SHIFT SWAP REQUEST (Employee - their own request only)
router.post('/api/shift-swap-request/:id/cancel', async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ msg: 'Unauthorized' });
  }

  try {
    const { id } = req.params;

    const request = await ShiftSwapRequest.findOne({ _id: id, requesterId: req.user._id });

    if (!request) {
      return res.status(404).json({ msg: 'Request not found' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ msg: 'Can only cancel pending requests' });
    }

    request.status = 'cancelled';
    await request.save();

    res.json({ msg: 'Request cancelled', request });
  } catch (error) {
    console.error('Error cancelling shift swap request:', error);
    res.status(500).json({ msg: 'Server error' });
  }
});

// GET PREVIOUS EMPLOYEES WHO WORKED WITH A CLIENT
// Returns top 3 employees who have checked in at this client, sorted by service count
router.get('/api/client-history/:clientId', async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ msg: 'Unauthorized' });
  }

  try {
    const { clientId } = req.params;
    const Attendance = require('./../models/Attendance');
    const currentUserId = req.user._id.toString();

    // Aggregate attendance records to find employees who worked with this client
    const history = await Attendance.aggregate([
      // Match attendance records for this client
      { $match: { clientId: require('mongoose').Types.ObjectId(clientId) } },
      // Group by employee
      {
        $group: {
          _id: '$userId',
          serviceCount: { $sum: 1 },
          lastServed: { $max: '$checkIn.time' }
        }
      },
      // Sort by service count (most experienced first)
      { $sort: { serviceCount: -1 } },
      // Limit to top 3
      { $limit: 3 },
      // Lookup employee details
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'employee'
        }
      },
      { $unwind: '$employee' },
      // Project final shape
      {
        $project: {
          employeeId: '$_id',
          employeeName: '$employee.username',
          serviceCount: 1,
          lastServed: 1
        }
      }
    ]);

    // Filter out current user from the list
    const filteredHistory = history.filter(h => h.employeeId.toString() !== currentUserId);

    res.json(filteredHistory);
  } catch (error) {
    console.error('Error fetching client history:', error);
    res.status(500).json({ msg: 'Server error' });
  }
});

// USER GET SCHEDULE
router.get('/getSchedule', async (req, res) => {
  try {
    const shifts = await Shift.find().sort({ _id: -1 }).limit(1);

    if (!shifts || shifts.length === 0) {
      return res.send([]);
    }

    // Convert to plain object so we can modify it
    const scheduleData = shifts[0].toObject();

    // Populate client location data for shifts
    if (scheduleData.shifts && scheduleData.shifts.length > 0) {
      const Client = require('./../models/Client');

      // Get all unique client IDs from shifts
      const clientIds = [...new Set(
        scheduleData.shifts
          .filter(s => s.clientId)
          .map(s => s.clientId.toString())
      )];

      // Fetch client data including location
      const clients = await Client.find({ _id: { $in: clientIds } })
        .select('_id name address location shareLocation');

      // Create a map for quick lookup
      const clientMap = {};
      clients.forEach(c => {
        clientMap[c._id.toString()] = c;
      });

      // Enrich shifts with client location (respecting shareLocation privacy)
      scheduleData.shifts = scheduleData.shifts.map(s => {
        if (s.clientId && clientMap[s.clientId.toString()]) {
          const client = clientMap[s.clientId.toString()];
          return {
            ...s,
            clientAddress: client.address,
            clientLocation: client.shareLocation !== false ? client.location : null
          };
        }
        return s;
      });
    }

    res.send([scheduleData]);
  } catch (error) {
    console.error(error);
    res.send('Error');
  }
});



// ADMIN SAVE SCHEDULE
router.post('/postSchedule', isAdmin, async (req, res) => {
  try {
    // save schedule to database
    const { savedSchedule, savedBy, _id } = req.body; // Accept optional _id for updates
    const currentDate = new Date();
    const upcomingSunday = nextSunday(currentDate);
    const name = `(WN ${getISOWeek(upcomingSunday)}) ${format(upcomingSunday, `dd-MM-yyyy`)}`;

    // Get default checklist from settings
    const Settings = require('./../models/Settings');
    const settings = await Settings.getSettings();
    const defaultChecklist = (settings.defaultChecklist || []).map(item => ({
      label: typeof item === 'string' ? item : (item.label || ''),
      completed: false,
      required: item.required !== false,
      completedAt: null
    }));

    console.log('[Schedule] Applying default checklist:', defaultChecklist.length, 'items');

    // Get today's completed attendance shiftIds to avoid collisions
    // Use EXACT same date calculation as the employee today-assignments endpoint
    const Attendance = require('./../models/Attendance');
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    console.log('[Schedule] Looking for completed attendance between:', startOfDay.toISOString(), 'and', endOfDay.toISOString());

    const completedAttendance = await Attendance.find({
      status: 'checked-out',
      'checkIn.time': { $gte: startOfDay, $lte: endOfDay }
    }).select('shiftId');

    const completedShiftIds = new Set(completedAttendance.map(a => a.shiftId));
    console.log('[Schedule] Completed shiftIds today:', [...completedShiftIds]);

    // Transform savedSchedule to new shifts format
    const shifts = [];
    savedSchedule.forEach((day, dayIndex) => {
      if (Array.isArray(day)) {
        day.forEach((employee) => {
          // Check if this shift ID was already completed - if so, regenerate a new ID
          let shiftId = employee.id;
          if (shiftId && completedShiftIds.has(shiftId)) {
            // Generate new unique ID for this shift so employee can check in again
            shiftId = `${dayIndex}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
            console.log(`[Schedule] Regenerated shiftId from ${employee.id} to ${shiftId} (was completed today)`);
          }

          shifts.push({
            employeeId: employee._id || employee.employeeId,
            employeeName: employee.username || employee.employeeName,
            clientId: employee.clientId || null,
            clientName: employee.clientName || '',
            shiftType: employee.shiftType || 'morning',
            startTime: employee.startTime || '08:00',
            endTime: employee.endTime || '12:00',
            notes: employee.notes || '',
            status: employee.status || 'scheduled',
            id: shiftId,
            // Add default checklist to each shift
            checklist: defaultChecklist.length > 0 ? [...defaultChecklist] : []
          });
        });
      }
    });

    if (_id) {
      // UPDATE existing schedule
      await Shift.findByIdAndUpdate(_id, {
        data: savedSchedule,
        shifts,
        savedBy,
        startDate: req.body.startDate ? new Date(req.body.startDate) : undefined
      });
      res.send('Success');
    } else {
      // CREATE new schedule
      const newShift = await new Shift({
        name,
        data: savedSchedule, // Keep legacy format for backward compatibility
        shifts, // New structured format
        savedBy,
        date: currentDate,
        startDate: req.body.startDate ? new Date(req.body.startDate) : currentDate
      });
      newShift.save();
      res.send('Success');
    }

  } catch (error) {
    console.error(error);
    res.send(error.msg);
  }
});

// ADMIN REMOVE SCHEDULE
router.post('/removeSchedule', isAdmin, async (req, res) => {
  try {
    const { id } = req.body;
    console.log(id);

    await Shift.findByIdAndDelete(id);
  } catch (error) {
    console.log(error);
    res.send('Error');
  }
});

// ADMIN GET ALL SCHEDULE HISTORY
router.get('/getScheduleHistory', isAdmin, async (req, res) => {
  try {
    const shifts = await Shift.find({});
    res.send(shifts);
  } catch (error) {
    console.log(error);
    res.send('Error');
  }
});

// ADMIN GET USERS
router.get('/getUsers', isAdmin, async (req, res) => {
  try {
    const employees = await User.find({});
    res.json(employees);
  } catch (error) {
    console.error(error);
  }
});

// ADMIN MANAGE USERS REQUESTS
router.post('/toggle-request-status', isAdmin, async (req, res) => {
  try {
    const { dateID, employeeID, approverUsername } = req.body;
    const foundUser = await User.findById(employeeID);

    const filteredDate = _.filter(foundUser.blockedDates, { id: dateID });

    const [{ approved: isCurrentlyApproved }] = filteredDate;

    await User.findOneAndUpdate(
      { blockedDates: { $elemMatch: { _id: dateID } } },
      {
        $set: {
          'blockedDates.$.approved': !isCurrentlyApproved,
          'blockedDates.$.approvedBy': !isCurrentlyApproved ? approverUsername : '',
        },
      }
    );

    res.send({ msg: 'Success', operatedUser: foundUser.username, operation: !isCurrentlyApproved });
  } catch (error) {
    console.error(error);
  }
});

// ADMIN MANAGE USERS
router.post('/update-user', isAdmin, async (req, res) => {
  try {
    const { _id: id, username, password, email, phone, notificationPreferences } = req.body.modalData;

    if (!username) {
      res.send('UsernameIsEmpty');
      return;
    }

    const foundUser = await User.findOne({ username });

    // Build update object with all fields
    const updateFields = { username };
    if (email !== undefined) updateFields.email = email;
    if (phone !== undefined) updateFields.phone = phone;
    if (notificationPreferences !== undefined) updateFields.notificationPreferences = notificationPreferences;

    switch (true) {
      case foundUser === null:
        console.log('User not found, creating update');
        await User.findOneAndUpdate({ _id: id }, updateFields);
        res.send('Success');
        break;
      case foundUser.username === username && foundUser.id !== id:
        console.log('username taken');
        res.send('UsernameTaken');
        break;
      case foundUser.username === username:
        // Same user, update email/phone/prefs anyway
        await User.findOneAndUpdate({ _id: id }, updateFields);
        res.send('Success');
        break;
      default:
        console.log('hit default');
        break;
    }

    if (password) {
      const saltHash = genPassword(password);
      const { salt, hash } = saltHash;
      await User.findOneAndUpdate({ _id: id }, { $set: { salt, hash } });
    }
  } catch (error) {
    console.error(error);
    res.send(error.msg);
  }
});

// ADMIN DELETE USER
router.post('/delete-user', isAdmin, async (req, res) => {
  try {
    const { _id } = req.body;
    console.log(_id);
    await User.findByIdAndDelete(_id);
    res.send('RequestDeletionSuccess');
  } catch (error) {
    console.log(error);
    res.send(error.msg);
  }
});


// MULTER CONFIG (must be before routes that use it)
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = path.join(__dirname, '..', 'uploads');

if (!fs.existsSync(uploadDir)) {
  console.log('Creating uploads directory at:', uploadDir);
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({ storage: storage });

// ATTENDANCE API
const Attendance = require('./../models/Attendance');

// Calculate distance between two GPS coordinates (in meters)
function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371000; // Earth's radius in meters
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// GET TODAY'S CLIENT ASSIGNMENTS FOR EMPLOYEE
router.get('/api/attendance/today-assignments', async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ msg: 'Unauthorized' });
  }

  try {
    const userId = req.user.id;
    const Client = require('./../models/Client');

    // Get the latest schedule
    const schedule = await Shift.find().sort({ _id: -1 }).limit(1);

    if (!schedule || schedule.length === 0 || !schedule[0].shifts) {
      return res.json({ assignments: [] });
    }

    // Calculate which day index "today" is relative to the schedule's startDate
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize to start of day

    let dayIndex = -1;
    if (schedule[0].startDate) {
      const startDate = new Date(schedule[0].startDate);
      startDate.setHours(0, 0, 0, 0);
      const diffTime = today.getTime() - startDate.getTime();
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

      // Check if today is within the 6-day schedule range (0-5)
      if (diffDays >= 0 && diffDays <= 5) {
        dayIndex = diffDays;
      }
    } else {
      // Legacy fallback: use day of week mapping (old behavior)
      const dayOfWeek = today.getDay();
      dayIndex = dayOfWeek === 0 ? 5 : dayOfWeek - 1;
    }

    console.log('Today date:', today.toISOString());
    console.log('Schedule startDate:', schedule[0].startDate);
    console.log('Calculated dayIndex:', dayIndex);

    // If today is not within the schedule range, return empty
    if (dayIndex < 0 || dayIndex > 5) {
      return res.json({ assignments: [], debug: { reason: 'Today is outside schedule range', dayIndex } });
    }

    // Filter shifts for this employee on today's day index
    console.log('Total shifts in schedule:', schedule[0].shifts.length);
    console.log('Looking for userId:', userId, 'username:', req.user.username);

    // First, log all shifts to see their structure
    schedule[0].shifts.forEach((shift, i) => {
      console.log(`Shift ${i}:`, {
        id: shift.id,
        day: shift.day,
        employeeId: shift.employeeId?.toString(),
        employeeName: shift.employeeName,
        clientId: shift.clientId?.toString()
      });
    });

    const myShifts = schedule[0].shifts.filter(shift => {
      const isMyShift = (shift.employeeId && shift.employeeId.toString() === userId) ||
        (shift.employeeName && shift.employeeName === req.user.username);

      // Check if shift's id starts with today's dayIndex OR if shift.day matches
      let shiftDayIndex = -1;

      // Method 1: Check shift.day property (newer structure)
      if (typeof shift.day === 'number') {
        shiftDayIndex = shift.day;
      }
      // Method 2: Parse from shift.id (older structure like "0-1")
      else if (shift.id && typeof shift.id === 'string' && shift.id.includes('-')) {
        shiftDayIndex = parseInt(shift.id.split('-')[0]);
      }

      console.log('Checking shift:', {
        employeeName: shift.employeeName,
        shiftDay: shift.day,
        parsedDayIndex: shiftDayIndex,
        neededDayIndex: dayIndex,
        isMyShift,
        match: isMyShift && shiftDayIndex === dayIndex
      });

      return isMyShift && shiftDayIndex === dayIndex;
    });

    // Get client details for each shift
    console.log('myShifts found:', myShifts.length);
    const clientIds = [...new Set(myShifts.filter(s => s.clientId).map(s => s.clientId.toString()))];
    console.log('Client IDs to lookup:', clientIds);

    const clients = await Client.find({ _id: { $in: clientIds } })
      .select('_id name address location propertyDetails');
    console.log('Clients found in DB:', clients.length, clients.map(c => ({ id: c._id.toString(), name: c.name })));

    const clientMap = {};
    clients.forEach(c => {
      clientMap[c._id.toString()] = c;
    });

    // Build assignments with client info
    const assignments = myShifts
      .filter(s => {
        const hasClient = s.clientId && clientMap[s.clientId.toString()];
        console.log('Shift clientId:', s.clientId?.toString(), 'found in map:', !!clientMap[s.clientId?.toString()]);
        return hasClient;
      })
      .map(s => {
        const client = clientMap[s.clientId.toString()];
        return {
          shiftId: s._id || s.id,
          clientId: client._id,
          clientName: client.name,
          clientAddress: client.address,
          clientLocation: client.location,
          startTime: s.startTime,
          endTime: s.endTime,
          shiftType: s.shiftType,
          // Client Bible - property details for employee
          propertyDetails: client.propertyDetails ? {
            entryInstructions: client.propertyDetails.entryInstructions,
            alarmCode: client.propertyDetails.alarmCode,
            gateCode: client.propertyDetails.gateCode,
            keyLocation: client.propertyDetails.keyLocation,
            parkingInstructions: client.propertyDetails.parkingInstructions,
            petInfo: client.propertyDetails.petInfo,
            clientPreferences: client.propertyDetails.clientPreferences,
            areasToAvoid: client.propertyDetails.areasToAvoid
          } : null
        };
      });

    console.log('Final assignments count:', assignments.length);

    // Check which SHIFTS already have COMPLETED check-ins today (by shiftId, not clientId)
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    console.log('Checking attendance between:', startOfDay.toISOString(), 'and', endOfDay.toISOString());
    console.log('For userId:', userId);

    // Get all shiftIds from today's assignments
    const assignmentShiftIds = assignments.map(a => a.shiftId?.toString()).filter(Boolean);
    console.log('Assignment shift IDs:', assignmentShiftIds);

    // Only count as "completed" if the status is 'checked-out' AND matches a specific shiftId
    const todayAttendance = await Attendance.find({
      userId,
      status: 'checked-out',
      'checkIn.time': { $gte: startOfDay, $lte: endOfDay }
    });

    console.log('Today COMPLETED attendance records found:', todayAttendance.length);
    todayAttendance.forEach(a => {
      console.log('Attendance record:', {
        shiftId: a.shiftId?.toString(),
        clientId: a.clientId?.toString(),
        status: a.status,
        checkInTime: a.checkIn?.time,
        checkOutTime: a.checkOut?.time
      });
    });

    // Get completed shiftIds (not clientIds)
    const completedShiftIds = todayAttendance.map(a => a.shiftId?.toString()).filter(Boolean);
    console.log('Completed shift IDs today:', completedShiftIds);

    // Mark assignments as already checked in based on SHIFT ID (not client ID)
    const enrichedAssignments = assignments.map(a => ({
      ...a,
      alreadyCheckedIn: completedShiftIds.includes(a.shiftId?.toString())
    }));

    console.log('Enriched assignments:', enrichedAssignments.map(a => ({
      clientName: a.clientName,
      shiftId: a.shiftId,
      alreadyCheckedIn: a.alreadyCheckedIn
    })));

    res.json({ assignments: enrichedAssignments });
  } catch (error) {
    console.error('Error fetching today assignments:', error);
    res.status(500).json({ msg: 'Server error' });
  }
});

// GET checklist for current active shift
router.get('/api/attendance/checklist', async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ msg: 'Unauthorized' });
  }

  try {
    const userId = req.user.id;
    const Attendance = require('./../models/Attendance');

    // Find active check-in
    const activeAttendance = await Attendance.findOne({
      userId,
      status: 'checked-in'
    });

    if (!activeAttendance || !activeAttendance.shiftId) {
      return res.json({ checklist: [], hasActiveShift: false });
    }

    // Get the schedule and find this shift
    const schedule = await Shift.find().sort({ _id: -1 }).limit(1);
    if (!schedule[0] || !schedule[0].shifts) {
      return res.json({ checklist: [], hasActiveShift: true });
    }

    // Find the matching shift
    const shift = schedule[0].shifts.find(s =>
      s.id === activeAttendance.shiftId ||
      (s.employeeId && s.employeeId.toString() === userId && s.clientId && s.clientId.toString() === activeAttendance.clientId?.toString())
    );

    if (!shift) {
      return res.json({ checklist: [], hasActiveShift: true });
    }

    res.json({
      checklist: shift.checklist || [],
      hasActiveShift: true,
      shiftId: activeAttendance.shiftId,
      clientName: shift.clientName
    });
  } catch (error) {
    console.error('Error fetching checklist:', error);
    res.status(500).json({ msg: 'Server error' });
  }
});

// TOGGLE checklist item
router.post('/api/attendance/checklist/toggle', async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ msg: 'Unauthorized' });
  }

  try {
    const userId = req.user.id;
    const { itemIndex, completed } = req.body;
    const Attendance = require('./../models/Attendance');

    // Find active check-in
    const activeAttendance = await Attendance.findOne({
      userId,
      status: 'checked-in'
    });

    if (!activeAttendance || !activeAttendance.shiftId) {
      return res.status(400).json({ msg: 'No active shift found' });
    }

    // Get the schedule
    const schedule = await Shift.findOne().sort({ _id: -1 });
    if (!schedule || !schedule.shifts) {
      return res.status(404).json({ msg: 'Schedule not found' });
    }

    // Find and update the shift's checklist
    const shiftIndex = schedule.shifts.findIndex(s =>
      s.id === activeAttendance.shiftId ||
      (s.employeeId && s.employeeId.toString() === userId && s.clientId && s.clientId.toString() === activeAttendance.clientId?.toString())
    );

    if (shiftIndex === -1) {
      return res.status(404).json({ msg: 'Shift not found' });
    }

    if (!schedule.shifts[shiftIndex].checklist || !schedule.shifts[shiftIndex].checklist[itemIndex]) {
      return res.status(404).json({ msg: 'Checklist item not found' });
    }

    // Update the item
    schedule.shifts[shiftIndex].checklist[itemIndex].completed = completed;
    schedule.shifts[shiftIndex].checklist[itemIndex].completedAt = completed ? new Date() : null;

    await schedule.save();

    res.json({
      msg: 'Checklist updated',
      checklist: schedule.shifts[shiftIndex].checklist
    });
  } catch (error) {
    console.error('Error updating checklist:', error);
    res.status(500).json({ msg: 'Server error' });
  }
});

// CHECK-IN - with before photo support, client linking, and GPS verification
router.post('/api/attendance/check-in', (req, res, next) => {
  console.log('Check-in request initiated');
  console.log('Content-Type:', req.headers['content-type']);

  // Use Multer's upload middleware with error handling
  upload.array('photos', 10)(req, res, async function (err) {
    if (err) {
      console.error('Multer error:', err);
      return res.status(400).json({ msg: 'File upload error: ' + err.message });
    }

    console.log('After Multer - Body:', req.body);
    console.log('After Multer - Files:', req.files?.length || 0, 'photos');

    if (!req.isAuthenticated()) {
      return res.status(401).json({ msg: 'Unauthorized' });
    }

    try {
      let location;

      if (req.body && req.body.location) {
        try {
          location = typeof req.body.location === 'string'
            ? JSON.parse(req.body.location)
            : req.body.location;
        } catch (parseError) {
          console.error('Location parse error:', parseError);
          location = { lat: 0, lng: 0 };
        }
      } else {
        location = { lat: 0, lng: 0 };
      }

      const userId = req.user.id;
      const clientId = req.body.clientId || null;
      const shiftId = req.body.shiftId || null; // Track by shift for independent assignments
      const locationConfirmed = req.body.locationConfirmed === 'true' || req.body.locationConfirmed === true;

      // Check if already checked in to THIS SHIFT today (not just client)
      if (shiftId) {
        const today = new Date();
        const startOfDay = new Date(today.setHours(0, 0, 0, 0));
        const endOfDay = new Date(today.setHours(23, 59, 59, 999));

        const existingCheckIn = await Attendance.findOne({
          userId,
          shiftId, // Check by shiftId, not clientId
          'checkIn.time': { $gte: startOfDay, $lte: endOfDay }
        });

        if (existingCheckIn) {
          return res.status(400).json({ msg: 'Already checked in for this shift today' });
        }
      }

      // Check for any active (not checked out) sessions
      const activeSession = await Attendance.findOne({ userId, status: 'checked-in' });
      if (activeSession) {
        return res.status(400).json({
          msg: 'Please check out from your current location first',
          activeClientId: activeSession.clientId
        });
      }

      // GPS VERIFICATION - Check distance from client location
      let gpsWarning = null;
      let distanceFromClient = null;

      if (clientId && location.lat && location.lng) {
        const Client = require('./../models/Client');
        const client = await Client.findById(clientId).select('location name');

        if (client?.location?.coordinates?.lat && client?.location?.coordinates?.lng) {
          distanceFromClient = calculateDistance(
            location.lat, location.lng,
            client.location.coordinates.lat, client.location.coordinates.lng
          );

          // Warn if more than 500 meters away
          if (distanceFromClient > 500 && !locationConfirmed) {
            return res.status(400).json({
              msg: 'You appear to be far from the client location',
              distanceMeters: Math.round(distanceFromClient),
              requiresConfirmation: true,
              clientName: client.name
            });
          }

          if (distanceFromClient > 500) {
            gpsWarning = `Employee was ${Math.round(distanceFromClient)}m from client location but confirmed correct location`;
          }
        }
      }

      const newAttendance = new Attendance({
        userId,
        clientId,
        shiftId, // Store shiftId for tracking
        checkIn: {
          time: new Date(),
          location,
          beforePhoto: req.files?.length ? `/uploads/${req.files[0].filename}` : null, // Legacy support
          photos: req.files ? req.files.map(f => `/uploads/${f.filename}`) : [],
        },
        status: 'checked-in',
        gpsWarning: gpsWarning
      });

      await newAttendance.save();
      console.log('Check-in saved successfully with clientId:', clientId);

      // Emit real-time notification
      try {
        const Client = require('./../models/Client');
        const client = clientId ? await Client.findById(clientId).select('name') : null;
        notifyCheckIn({
          employeeId: userId,
          employeeName: req.user.username,
          clientId,
          clientName: client?.name || 'Unknown',
          time: new Date(),
          location
        });
      } catch (socketError) {
        console.error('Socket notification error:', socketError);
      }

      res.json({
        msg: 'Check-in successful',
        status: 'checked-in',
        clientId,
        distanceFromClient: distanceFromClient ? Math.round(distanceFromClient) : null
      });
    } catch (error) {
      console.error('Check-in error:', error);
      res.status(500).json({ msg: 'Server error' });
    }
  });
});


// CHECK-OUT - with photo upload support
router.post('/api/attendance/check-out', (req, res, next) => {
  console.log('Check-out request initiated');
  console.log('Content-Type:', req.headers['content-type']);

  // Use Multer's upload middleware with error handling
  upload.array('photos', 10)(req, res, async function (err) {
    if (err) {
      console.error('Multer error:', err);
      return res.status(400).json({ msg: 'File upload error: ' + err.message });
    }

    console.log('After Multer - Body:', req.body);
    console.log('After Multer - Files:', req.files?.length || 0, 'photos');

    if (!req.isAuthenticated()) {
      return res.status(401).json({ msg: 'Unauthorized' });
    }

    try {
      let location;

      if (req.body && req.body.location) {
        try {
          location = typeof req.body.location === 'string'
            ? JSON.parse(req.body.location)
            : req.body.location;
        } catch (parseError) {
          console.error('Location parse error:', parseError);
          location = { lat: 0, lng: 0 };
        }
      } else {
        console.log('Location not found in body, using empty location');
        location = { lat: 0, lng: 0 };
      }

      const userId = req.user.id;

      const activeSession = await Attendance.findOne({ userId, status: 'checked-in' });
      if (!activeSession) {
        return res.status(400).json({ msg: 'Not checked in' });
      }

      activeSession.checkOut = {
        time: new Date(),
        location,
        completionPhoto: req.files?.length ? `/uploads/${req.files[0].filename}` : null, // Legacy support
        photos: req.files ? req.files.map(f => `/uploads/${f.filename}`) : [],
      };
      activeSession.status = 'checked-out';

      await activeSession.save();

      // Calculate and save mileage if settings enabled
      try {
        const Settings = require('./../models/Settings');
        const { calculateDistance } = require('./../utils/distanceCalculator');
        const mileageSettings = await Settings.getSettings();

        if (mileageSettings?.mileageReimbursement?.trackAutomatically !== false) {
          const checkInLoc = activeSession.checkIn?.location;
          const checkOutLoc = location;

          if (checkInLoc?.lat && checkInLoc?.lng && checkOutLoc?.lat && checkOutLoc?.lng) {
            const distance = calculateDistance(
              checkInLoc.lat, checkInLoc.lng,
              checkOutLoc.lat, checkOutLoc.lng
            );

            if (distance.valid && distance.miles > 0) {
              activeSession.mileage = {
                distanceKm: distance.km,
                distanceMiles: distance.miles,
                fromLocation: { lat: checkInLoc.lat, lng: checkInLoc.lng },
                toLocation: { lat: checkOutLoc.lat, lng: checkOutLoc.lng },
                calculatedAt: new Date()
              };
              await activeSession.save();
              console.log(`[Mileage] Calculated: ${distance.miles} miles for attendance ${activeSession._id}`);
            }
          }
        }
      } catch (mileageError) {
        console.error('Mileage calculation error:', mileageError);
        // Don't fail check-out if mileage calc fails
      }

      // Increment jobs completed counter
      await User.findByIdAndUpdate(userId, { $inc: { jobsCompleted: 1 } });
      console.log('Check-out saved successfully and job counter incremented');

      // Emit real-time notification
      try {
        const Client = require('./../models/Client');
        const client = activeSession.clientId ? await Client.findById(activeSession.clientId).select('name') : null;

        // Calculate duration
        const checkInTime = new Date(activeSession.checkIn.time);
        const checkOutTime = new Date();
        const diffMs = checkOutTime - checkInTime;
        const diffMins = Math.round(diffMs / 60000);
        const hours = Math.floor(diffMins / 60);
        const mins = diffMins % 60;
        const duration = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;

        notifyCheckOut({
          employeeId: userId,
          employeeName: req.user.username,
          clientId: activeSession.clientId,
          clientName: client?.name || 'Unknown',
          time: new Date(),
          duration
        });
      } catch (socketError) {
        console.error('Socket notification error:', socketError);
      }

      // Schedule review request if enabled
      try {
        const Settings = require('./../models/Settings');
        const ReviewRequest = require('./../models/ReviewRequest');

        const settings = await Settings.getSettings();
        if (settings?.reviewRequests?.enabled && activeSession.clientId) {
          const scheduledFor = new Date();
          scheduledFor.setHours(scheduledFor.getHours() + (settings.reviewRequests.delayHours || 2));

          await ReviewRequest.create({
            clientId: activeSession.clientId,
            attendanceId: activeSession._id,
            scheduledFor,
            status: 'pending'
          });
          console.log('Review request scheduled for:', scheduledFor);
        }
      } catch (reviewError) {
        console.error('Review request scheduling error:', reviewError);
      }

      res.json({
        msg: 'Check-out successful',
        status: 'checked-out',
        mileage: activeSession.mileage ? {
          miles: activeSession.mileage.distanceMiles,
          km: activeSession.mileage.distanceKm
        } : null
      });
    } catch (error) {
      console.error('Check-out error:', error);
      res.status(500).json({ msg: 'Server error: ' + error.message });
    }
  });
});

// GET STATUS
router.get('/api/attendance/status', async (req, res) => {
  if (req.isAuthenticated()) {
    try {
      const userId = req.user.id;
      const activeSession = await Attendance.findOne({ userId, status: 'checked-in' })
        .populate('clientId', 'name address location');

      if (activeSession) {
        res.json({
          status: 'checked-in',
          startTime: activeSession.checkIn.time,
          location: activeSession.checkIn.location,
          safetyConfirmed: activeSession.safetyConfirmed?.confirmed || false,
          safetyConfirmedTime: activeSession.safetyConfirmed?.time || null,
          clientId: activeSession.clientId?._id || null,
          client: activeSession.clientId ? {
            name: activeSession.clientId.name,
            clientName: activeSession.clientId.name,
            clientAddress: activeSession.clientId.address,
            location: activeSession.clientId.location
          } : null
        });
      } else {
        res.json({ status: 'checked-out' });
      }
    } catch (error) {
      console.error(error);
      res.status(500).json({ msg: 'Server error' });
    }
  } else {
    res.status(401).json({ msg: 'Unauthorized' });
  }
});

// GET ALL ATTENDANCE (Admin)
router.get('/api/attendance/all', isAdmin, async (req, res) => {
  try {
    const attendanceRecords = await Attendance.find({})
      .populate('userId', 'username email')
      .populate('clientId', 'name email phone address')
      .sort({ 'checkIn.time': -1 });
    res.json(attendanceRecords);
  } catch (error) {
    console.error('Error fetching attendance records:', error);
    res.status(500).json({ msg: 'Server error' });
  }
});

// CONFIRM SAFETY
router.post('/api/attendance/confirm-safety', async (req, res) => {
  if (req.isAuthenticated()) {
    try {
      const userId = req.user.id;
      const activeSession = await Attendance.findOne({ userId, status: 'checked-in' });

      if (!activeSession) {
        return res.status(400).json({ msg: 'Not checked in' });
      }

      if (activeSession.safetyConfirmed?.confirmed) {
        return res.status(400).json({ msg: 'Safety already confirmed' });
      }

      activeSession.safetyConfirmed = {
        confirmed: true,
        time: new Date(),
      };

      await activeSession.save();
      console.log('Safety confirmed successfully');
      res.json({ msg: 'Safety confirmed', safetyConfirmed: true, time: activeSession.safetyConfirmed.time });
    } catch (error) {
      console.error('Safety confirmation error:', error);
      res.status(500).json({ msg: 'Server error' });
    }
  } else {
    res.status(401).json({ msg: 'Unauthorized' });
  }
});

// MARK JOB COMPLETE
router.post('/api/attendance/mark-complete', async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ msg: 'Unauthorized' });
  }

  try {
    const userId = req.user.id;
    const { attendanceId } = req.body;

    // Find the attendance record - either by ID or most recent checked-out session
    let attendance;
    if (attendanceId) {
      attendance = await Attendance.findOne({ _id: attendanceId, userId });
    } else {
      // Get the most recent checked-out attendance for this user
      attendance = await Attendance.findOne({
        userId,
        status: 'checked-out',
        'jobCompleted.confirmed': { $ne: true }
      }).sort({ 'checkOut.time': -1 });
    }

    if (!attendance) {
      return res.status(400).json({ msg: 'No eligible attendance record found' });
    }

    if (attendance.status !== 'checked-out') {
      return res.status(400).json({ msg: 'Must check out before marking job complete' });
    }

    if (attendance.jobCompleted?.confirmed) {
      return res.status(400).json({ msg: 'Job already marked as complete' });
    }

    // Mark attendance as job completed
    attendance.jobCompleted = {
      confirmed: true,
      time: new Date()
    };
    await attendance.save();

    // Update the corresponding shift status if we have a clientId
    if (attendance.clientId) {
      // Find the shift for today with this employee and client
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const shift = await Shift.findOne({
        startDate: { $lte: today },
        'shifts.employeeId': userId,
        'shifts.clientId': attendance.clientId
      });

      if (shift) {
        // Find and update the specific shift entry
        const shiftEntry = shift.shifts.find(s =>
          s.employeeId?.toString() === userId.toString() &&
          s.clientId?.toString() === attendance.clientId.toString()
        );

        if (shiftEntry) {
          shiftEntry.status = 'completed';
          await shift.save();
          console.log('Shift status updated to completed');
        }
      }
    }

    console.log('Job marked as complete for attendance:', attendance._id);

    // Emit real-time notification
    try {
      const Client = require('./../models/Client');
      const client = attendance.clientId ? await Client.findById(attendance.clientId).select('name') : null;
      notifyJobComplete({
        employeeId: userId,
        employeeName: req.user.username,
        clientId: attendance.clientId,
        clientName: client?.name || 'Unknown'
      });
    } catch (socketError) {
      console.error('Socket notification error:', socketError);
    }

    // Send job completion email with photos to client/admin
    try {
      const { sendJobCompletionEmail } = require('./../utils/jobCompletionEmail');
      const Client = require('./../models/Client');
      const User = require('./../models/User');

      const client = attendance.clientId ? await Client.findById(attendance.clientId) : null;
      const employee = await User.findById(userId).select('username');

      // Get base URL for images
      const baseUrl = process.env.BASE_URL || 'http://localhost:4080';

      const emailResult = await sendJobCompletionEmail({
        attendance,
        client,
        employee,
        baseUrl
      });

      if (emailResult.sent) {
        console.log('[JobComplete] Email sent:', emailResult.recipients);
      }
    } catch (emailError) {
      console.error('Job completion email error:', emailError);
      // Don't fail the request if email fails
    }

    res.json({
      msg: 'Job marked as complete',
      jobCompleted: true,
      time: attendance.jobCompleted.time
    });
  } catch (error) {
    console.error('Mark complete error:', error);
    res.status(500).json({ msg: 'Server error' });
  }
});

// MILEAGE REPORT - Get mileage data for reimbursement
router.get('/api/attendance/mileage-report', isAdmin, async (req, res) => {
  try {
    const { startDate, endDate, employeeId } = req.query;

    // Build query
    const query = {
      'mileage.distanceMiles': { $gt: 0 }
    };

    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate + 'T23:59:59.999Z')
      };
    }

    if (employeeId) {
      query.userId = employeeId;
    }

    // Get attendance records with mileage
    const records = await Attendance.find(query)
      .populate('userId', 'username')
      .populate('clientId', 'name address')
      .sort({ createdAt: -1 })
      .lean();

    // Get settings for rate
    const Settings = require('./../models/Settings');
    const settings = await Settings.getSettings();
    const ratePerMile = settings?.mileageReimbursement?.ratePerMile || 0.65;

    // Calculate totals and format response
    const report = records.map(record => ({
      id: record._id,
      date: record.createdAt,
      employeeName: record.userId?.username || 'Unknown',
      employeeId: record.userId?._id,
      clientName: record.clientId?.name || 'Unknown',
      clientAddress: record.clientId?.address || '',
      distanceMiles: record.mileage?.distanceMiles || 0,
      distanceKm: record.mileage?.distanceKm || 0,
      reimbursement: Math.round((record.mileage?.distanceMiles || 0) * ratePerMile * 100) / 100
    }));

    const totalMiles = report.reduce((sum, r) => sum + r.distanceMiles, 0);
    const totalReimbursement = Math.round(totalMiles * ratePerMile * 100) / 100;

    // Group by employee for summary
    const byEmployee = {};
    report.forEach(r => {
      if (!byEmployee[r.employeeId]) {
        byEmployee[r.employeeId] = {
          employeeName: r.employeeName,
          totalMiles: 0,
          totalReimbursement: 0,
          trips: 0
        };
      }
      byEmployee[r.employeeId].totalMiles += r.distanceMiles;
      byEmployee[r.employeeId].totalReimbursement += r.reimbursement;
      byEmployee[r.employeeId].trips++;
    });

    res.json({
      records: report,
      summary: {
        totalMiles: Math.round(totalMiles * 100) / 100,
        totalReimbursement,
        ratePerMile,
        recordCount: records.length
      },
      byEmployee: Object.values(byEmployee)
    });

  } catch (error) {
    console.error('Mileage report error:', error);
    res.status(500).json({ msg: 'Server error' });
  }
});

// START EN-ROUTE - Employee heading to next client
router.post('/api/attendance/start-en-route', async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ msg: 'Unauthorized' });
  }

  try {
    const userId = req.user.id;
    const { clientId, currentLocation } = req.body;

    if (!clientId) {
      return res.status(400).json({ msg: 'Client ID required' });
    }

    // Get client location
    const Client = require('./../models/Client');
    const client = await Client.findById(clientId).select('name address location');

    if (!client) {
      return res.status(404).json({ msg: 'Client not found' });
    }

    const clientLat = client.location?.coordinates?.lat;
    const clientLng = client.location?.coordinates?.lng;

    if (!clientLat || !clientLng) {
      return res.status(400).json({ msg: 'Client location not set' });
    }

    // Calculate ETA
    const { calculateDistance, calculateETA } = require('./../utils/distanceCalculator');

    let etaData = { minutes: 15, arrivalTime: new Date() }; // Default if no current location
    let distance = { km: 0, miles: 0 };

    if (currentLocation?.lat && currentLocation?.lng) {
      distance = calculateDistance(
        currentLocation.lat, currentLocation.lng,
        clientLat, clientLng
      );
      etaData = calculateETA(distance.km);
    }

    // Create or find today's attendance for this employee/client combo
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check if there's already an en-route record or create new one
    let attendance = await Attendance.findOne({
      userId,
      status: 'en-route',
      createdAt: { $gte: today }
    });

    if (!attendance) {
      // Create new en-route attendance record
      attendance = new Attendance({
        userId,
        clientId,
        status: 'en-route',
        enRoute: {
          active: true,
          startedAt: new Date(),
          fromLocation: currentLocation || { lat: 0, lng: 0 },
          toClientId: clientId,
          estimatedArrivalTime: etaData.arrivalTime,
          estimatedMinutes: etaData.minutes
        }
      });
      await attendance.save();
    } else {
      // Update existing en-route record
      attendance.enRoute = {
        active: true,
        startedAt: new Date(),
        fromLocation: currentLocation || { lat: 0, lng: 0 },
        toClientId: clientId,
        estimatedArrivalTime: etaData.arrivalTime,
        estimatedMinutes: etaData.minutes
      };
      await attendance.save();
    }

    // Notify client via socket
    const { notifyEnRoute } = require('./../socket');
    notifyEnRoute({
      employeeId: userId,
      employeeName: req.user.username,
      clientId,
      clientName: client.name,
      estimatedMinutes: etaData.minutes,
      estimatedArrivalTime: etaData.arrivalTime
    });

    console.log(`[EnRoute] ${req.user.username} started en-route to ${client.name}, ETA: ${etaData.minutes} min`);

    res.json({
      msg: 'En-route started',
      eta: {
        minutes: etaData.minutes,
        arrivalTime: etaData.arrivalTime,
        distance: distance.miles ? `${distance.miles} mi` : null
      },
      clientName: client.name
    });

  } catch (error) {
    console.error('Start en-route error:', error);
    res.status(500).json({ msg: 'Server error' });
  }
});

// CATCH ALL ROUTE
router.get('*', (req, res) => {
  try {
    res.redirect('/');
  } catch (error) {
    console.error(error);
  }
});

module.exports = router;
