require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const { Pool } = require('pg');
const authRoutes = require('./routes/auth');
const wordsRoutes = require('./routes/words');
const moderationRoutes = require('./routes/moderation');
const searchRoutes = require('./routes/search');
const statsRoutes = require('./routes/stats');
const chatRoutes = require('./routes/chat');
const passport = require('./config/passport');
const { chatLimiter } = require('./middleware/rateLimiter');

const app = express();
const PORT = process.env.PORT || 3000;

// Trust the first proxy hop (Render/hosting) so express-rate-limit and req.ip
// see the real client address from X-Forwarded-For, not the proxy's.
app.set('trust proxy', 1);

app.use(passport.initialize());

// Database SSL configuration.
// Verify the server's TLS certificate by default (prevents MITM on DB
// traffic). Supply the database CA certificate (PEM) via DATABASE_CA_CERT for
// full verification against providers whose CA isn't in the system trust store
// (e.g. Supabase). As a deliberate, explicit escape hatch for environments
// that can't yet provide the CA, set DB_SSL_INSECURE=true to skip verification
// — this is NOT recommended and should be temporary.
function databaseSsl() {
  if (process.env.DATABASE_CA_CERT) {
    // Allow the PEM to be provided as a single line with escaped newlines
    // (common when a cert is pasted into a hosting provider's env UI).
    const ca = process.env.DATABASE_CA_CERT.replace(/\\n/g, '\n');
    return { rejectUnauthorized: true, ca };
  }
  if (process.env.DB_SSL_INSECURE === 'true') {
    return { rejectUnauthorized: false };
  }
  return { rejectUnauthorized: true };
}

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: databaseSsl(),
  family: 4, // Force IPv4 to avoid Render <-> Supabase IPv6 connectivity issues
});

// Make pool accessible to routes
app.locals.pool = pool;

// Middleware
// CORS must allow credentials and name an explicit origin (not "*") so the
// browser will send/accept the httpOnly auth cookie. Set FRONTEND_URL to the
// exact frontend origin (e.g. https://app.example.com). If unset, fall back to
// reflecting the request origin so local dev keeps working.
app.use(cors({
  origin: process.env.FRONTEND_URL || true,
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/words', wordsRoutes);
app.use('/api/moderation', moderationRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/chat', chatLimiter, chatRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', project: 'المعجم الشامل' });
});

app.listen(PORT, () => {
  console.log(`🚀 المعجم الشامل يعمل على المنفذ: ${PORT}`);
});

module.exports = { app, pool };
