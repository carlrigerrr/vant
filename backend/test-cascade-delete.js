/**
 * CASCADE DELETE VERIFICATION SCRIPT
 *
 * This script verifies that cascade delete hooks are properly configured
 * and working in the User and Client models.
 *
 * Usage: node test-cascade-delete.js
 *
 * NOTE: This is a DRY RUN by default. Set DRY_RUN = false to actually test deletions.
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Client = require('./models/Client');
const Attendance = require('./models/Attendance');
const Message = require('./models/Message');
const Rating = require('./models/Rating');
const Announcement = require('./models/Announcement');
const ServiceHistory = require('./models/ServiceHistory');
const RescheduleRequest = require('./models/RescheduleRequest');

// Configuration
const DRY_RUN = true; // Set to false to actually perform test deletions
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/shift-scheduler';

// Colors for console output
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m'
};

const log = {
    info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
    success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
    error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
    warning: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
    title: (msg) => console.log(`\n${colors.cyan}${msg}${colors.reset}\n${'='.repeat(60)}`)
};

async function verifyHooks() {
    log.title('CASCADE DELETE HOOK VERIFICATION');

    // Check if User model has pre-delete hook
    const userHooks = User.schema._pres.get('findOneAndDelete');
    if (userHooks && userHooks.length > 0) {
        log.success('User model has cascade delete hook registered');
    } else {
        log.error('User model is MISSING cascade delete hook!');
        return false;
    }

    // Check if Client model has pre-delete hook
    const Client = mongoose.model('Client');
    const clientHooks = Client.schema._pres.get('findOneAndDelete');
    if (clientHooks && clientHooks.length > 0) {
        log.success('Client model has cascade delete hook registered');
    } else {
        log.error('Client model is MISSING cascade delete hook!');
        return false;
    }

    return true;
}

async function testUserCascadeDelete() {
    log.title('TEST 1: USER CASCADE DELETE');

    if (DRY_RUN) {
        log.warning('DRY RUN MODE - No actual deletions will occur');
    }

    // Create test user
    const testUser = new User({
        username: 'cascade_test_user_' + Date.now(),
        hash: 'test_hash',
        salt: 'test_salt',
        admin: false
    });

    await testUser.save();
    log.info(`Created test user: ${testUser.username} (ID: ${testUser._id})`);

    // Create related records
    const attendance = new Attendance({
        userId: testUser._id,
        checkIn: { time: new Date() },
        status: 'checked-in'
    });
    await attendance.save();
    log.info(`Created attendance record`);

    const message = new Message({
        senderId: testUser._id,
        receiverId: testUser._id, // Self message for testing
        content: 'Test message for cascade delete'
    });
    await message.save();
    log.info(`Created message record`);

    // Count before delete
    const beforeCounts = {
        attendance: await Attendance.countDocuments({ userId: testUser._id }),
        messages: await Message.countDocuments({
            $or: [{ senderId: testUser._id }, { receiverId: testUser._id }]
        })
    };

    log.info(`\nBefore deletion:`);
    log.info(`  - Attendance records: ${beforeCounts.attendance}`);
    log.info(`  - Message records: ${beforeCounts.messages}`);

    if (!DRY_RUN) {
        // Perform delete
        await User.findOneAndDelete({ _id: testUser._id });
        log.warning('User deleted!');

        // Count after delete
        const afterCounts = {
            attendance: await Attendance.countDocuments({ userId: testUser._id }),
            messages: await Message.countDocuments({
                $or: [{ senderId: testUser._id }, { receiverId: testUser._id }]
            })
        };

        log.info(`\nAfter deletion:`);
        log.info(`  - Attendance records: ${afterCounts.attendance}`);
        log.info(`  - Message records: ${afterCounts.messages}`);

        // Verify cascade worked
        if (afterCounts.attendance === 0 && afterCounts.messages === 0) {
            log.success('\nCascade delete SUCCESSFUL! All related records removed.');
            return true;
        } else {
            log.error('\nCascade delete FAILED! Some records remain:');
            if (afterCounts.attendance > 0) log.error(`  - ${afterCounts.attendance} attendance records orphaned`);
            if (afterCounts.messages > 0) log.error(`  - ${afterCounts.messages} message records orphaned`);
            return false;
        }
    } else {
        log.warning('\nSkipping deletion (DRY RUN mode)');

        // Cleanup test data
        await Attendance.deleteMany({ userId: testUser._id });
        await Message.deleteMany({ $or: [{ senderId: testUser._id }, { receiverId: testUser._id }] });
        await User.findByIdAndDelete(testUser._id);
        log.info('Test data cleaned up');

        return true;
    }
}

async function testClientCascadeDelete() {
    log.title('TEST 2: CLIENT CASCADE DELETE');

    if (DRY_RUN) {
        log.warning('DRY RUN MODE - No actual deletions will occur');
    }

    // Create test client
    const Client = mongoose.model('Client');
    const testClient = new Client({
        name: 'Cascade Test Client',
        email: 'cascade_test_' + Date.now() + '@test.com',
        hash: 'test_hash',
        salt: 'test_salt'
    });

    await testClient.save();
    log.info(`Created test client: ${testClient.name} (ID: ${testClient._id})`);

    // Create related records
    const reschedule = new RescheduleRequest({
        clientId: testClient._id,
        originalDate: new Date(),
        requestedDate: new Date(),
        reason: 'Test reschedule for cascade delete'
    });
    await reschedule.save();
    log.info(`Created reschedule request`);

    // Count before delete
    const beforeCounts = {
        reschedules: await RescheduleRequest.countDocuments({ clientId: testClient._id })
    };

    log.info(`\nBefore deletion:`);
    log.info(`  - Reschedule requests: ${beforeCounts.reschedules}`);

    if (!DRY_RUN) {
        // Perform delete
        await Client.findOneAndDelete({ _id: testClient._id });
        log.warning('Client deleted!');

        // Count after delete
        const afterCounts = {
            reschedules: await RescheduleRequest.countDocuments({ clientId: testClient._id })
        };

        log.info(`\nAfter deletion:`);
        log.info(`  - Reschedule requests: ${afterCounts.reschedules}`);

        // Verify cascade worked
        if (afterCounts.reschedules === 0) {
            log.success('\nCascade delete SUCCESSFUL! All related records removed.');
            return true;
        } else {
            log.error('\nCascade delete FAILED! Some records remain:');
            if (afterCounts.reschedules > 0) log.error(`  - ${afterCounts.reschedules} reschedule requests orphaned`);
            return false;
        }
    } else {
        log.warning('\nSkipping deletion (DRY RUN mode)');

        // Cleanup test data
        await RescheduleRequest.deleteMany({ clientId: testClient._id });
        await Client.findByIdAndDelete(testClient._id);
        log.info('Test data cleaned up');

        return true;
    }
}

async function main() {
    try {
        // Connect to MongoDB
        log.info(`Connecting to MongoDB at ${MONGODB_URI}...`);
        await mongoose.connect(MONGODB_URI);
        log.success('Connected to MongoDB');

        // Verify hooks are registered
        const hooksOk = await verifyHooks();
        if (!hooksOk) {
            log.error('\nCascade delete hooks are not properly configured!');
            log.info('Please check:');
            log.info('  1. User.js has pre(\'findOneAndDelete\') hook');
            log.info('  2. Client.js has pre(\'findOneAndDelete\') hook');
            process.exit(1);
        }

        // Run tests
        const userTestPassed = await testUserCascadeDelete();
        const clientTestPassed = await testClientCascadeDelete();

        // Summary
        log.title('TEST SUMMARY');
        if (userTestPassed && clientTestPassed) {
            log.success('All tests PASSED ✓');
            if (DRY_RUN) {
                log.info('\nTo perform actual deletion tests, set DRY_RUN = false in this script.');
            }
        } else {
            log.error('Some tests FAILED ✗');
            process.exit(1);
        }

    } catch (error) {
        log.error(`Error: ${error.message}`);
        console.error(error);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
        log.info('\nDisconnected from MongoDB');
    }
}

// Run the tests
if (require.main === module) {
    main().catch(console.error);
}

module.exports = { verifyHooks, testUserCascadeDelete, testClientCascadeDelete };
