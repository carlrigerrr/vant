const express = require('express');
require('dotenv').config();
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const MongoStore = require('connect-mongo');
const http = require('http');
const routes = require('./routes/index');
const validPassword = require('./passport/passwordFunctions').validPassword;
const cors = require('cors');
const { initializeSocket } = require('./socket');

const app = express();
const server = http.createServer(app);
const PORT = 4080;

// Initialize Socket.io
const io = initializeSocket(server);

// Body parser middleware - skip multipart requests (handled by Multer)
const skipMultipart = (req, res, next) => {
  const contentType = req.headers['content-type'] || '';
  if (contentType.includes('multipart/form-data')) {
    return next(); // Skip body parsing, let Multer handle it
  }
  return next('route'); // Continue to body parser
};

// Body parsers with multipart skip logic
app.use((req, res, next) => {
  const contentType = req.headers['content-type'] || '';
  if (contentType.includes('multipart/form-data')) {
    return next(); // Skip body parsing for multipart
  }
  express.json({ limit: '50mb' })(req, res, next);
});
app.use((req, res, next) => {
  const contentType = req.headers['content-type'] || '';
  if (contentType.includes('multipart/form-data')) {
    return next(); // Skip body parsing for multipart
  }
  express.urlencoded({ extended: true, limit: '50mb' })(req, res, next);
});
app.use(cors());

const User = require('./models/User');

// mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/shift-scheduler');
mongoose.connect('mongodb://localhost:27017/shift-scheduler').catch((err) => {
  console.log(err.msg);
});

// .connect(process.env.MONGODB_URI || 'mongodb://localhost/shift-scheduler')
/**
 * PASSPORT SET UP
 **/

passport.use(
  new LocalStrategy((username, password, cb) => {
    User.findOne({ username: username })
      .then((user) => {
        if (!user) {
          return cb(null, false);
        }

        const isValid = validPassword(password, user.hash, user.salt);

        if (isValid) {
          return cb(null, user);
        } else {
          return cb(null, false);
        }
      })
      .catch((err) => {
        cb(err);
      });
  })
);

passport.serializeUser((user, cb) => {
  cb(null, user.id);
});

passport.deserializeUser((id, cb) => {
  User.findById(id, (err, user) => {
    if (err) {
      return cb(err);
    }
    cb(null, user);
  });
});

app.use(
  session({
    secret: 'boterham',
    store: MongoStore.create({ mongoUrl: 'mongodb://localhost:27017/shift-scheduler' }),
    resave: false,
    saveUninitialized: true,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24, // 1 day
    },
  })
);

// PASSPORT AUTHENTICATION BEFORE ROUTES
app.use(passport.initialize());
app.use(passport.session());

// PRODUCTION BUILD
app.use(express.static('../frontend/build'));
app.use('/uploads', express.static('uploads'));

// ROUTES
const statsRoutes = require('./routes/stats');
const clientAuthRoutes = require('./routes/clientAuth');
const clientsRoutes = require('./routes/clients');
const rescheduleRoutes = require('./routes/reschedule');
const rotationRoutes = require('./routes/rotation');
const messagesRoutes = require('./routes/messages');
const announcementsRoutes = require('./routes/announcements');
const performanceRoutes = require('./routes/performance');
const ratingsRoutes = require('./routes/ratings');
const revenueRoutes = require('./routes/revenue');
const settingsRoutes = require('./routes/settings');
const profileRoutes = require('./routes/profile');

app.use('/api/stats', statsRoutes);
app.use('/api/client', clientAuthRoutes);
app.use('/api/clients', clientsRoutes);
app.use('/api/reschedule', rescheduleRoutes);
app.use('/api/rotation', rotationRoutes);
app.use('/api/messages', messagesRoutes);
app.use('/api/announcements', announcementsRoutes);
app.use('/api/performance', performanceRoutes);
app.use('/api/ratings', ratingsRoutes);
app.use('/api/revenue', revenueRoutes);
app.use('/api/settings', settingsRoutes);
app.use(profileRoutes);

// Lead Management
const leadsRoutes = require('./routes/leads');
app.use('/api/leads', leadsRoutes);

// Invoicing
const invoicesRoutes = require('./routes/invoices');
app.use('/api/invoices', invoicesRoutes);

// Service Templates (Smart Quoting)
const serviceTemplatesRoutes = require('./routes/serviceTemplates');
app.use('/api/service-templates', serviceTemplatesRoutes);

// Payroll Reports
const payrollRoutes = require('./routes/payroll');
app.use('/api/payroll', payrollRoutes);

app.use(routes);

// CRON JOB - Process review requests every 15 minutes
const cron = require('node-cron');
const { processReviewRequests } = require('./services/emailService');
const { sendDailyBriefings } = require('./services/scheduleNotificationService');

cron.schedule('*/15 * * * *', async () => {
  console.log('[Cron] Processing review requests...');
  try {
    const result = await processReviewRequests();
    console.log('[Cron] Review requests processed:', result);
  } catch (error) {
    console.error('[Cron] Error processing review requests:', error);
  }
});

// CRON JOB - Daily schedule briefing at 6 AM
cron.schedule('0 6 * * *', async () => {
  console.log('[Cron] Sending daily schedule briefings...');
  try {
    const result = await sendDailyBriefings();
    console.log('[Cron] Daily briefings sent:', result);
  } catch (error) {
    console.error('[Cron] Error sending daily briefings:', error);
  }
});

// Use server.listen instead of app.listen for Socket.io
server.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
  console.log(`🔌 WebSocket server ready`);
  console.log(`📧 Review request cron job active (every 15 min)`);
  console.log(`📅 Daily schedule briefing cron job active (6 AM)`);
});
