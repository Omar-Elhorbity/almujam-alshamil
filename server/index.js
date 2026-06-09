require('dotenv').config();
const express = require('express');
const cors = require('cors');
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

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  family: 4, // Force IPv4 to avoid Render <-> Supabase IPv6 connectivity issues
});

// Make pool accessible to routes
app.locals.pool = pool;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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
