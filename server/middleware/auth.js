const jwt = require('jsonwebtoken');

if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET is missing in environment variables');
}

const JWT_SECRET = process.env.JWT_SECRET;

function authenticateToken(req, res, next) {
  // Prefer the httpOnly cookie (not readable by JS, so safe from XSS theft).
  // Fall back to the Authorization: Bearer header for non-browser clients and
  // backward compatibility.
  const authHeader = req.headers['authorization'];
  const headerToken = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
  const token = (req.cookies && req.cookies.token) || headerToken;

  if (!token) {
    return res.status(401).json({ error: 'تسجيل الدخول مطلوب' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'التوكن غير صالح أو منتهي' });
    }
    req.user = user;
    next();
  });
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'لا تملك الصلاحية لهذه العملية' });
    }
    next();
  };
}

const isProd = process.env.NODE_ENV === 'production';

// Cookie options for the session token.
// - httpOnly: not readable by JS → an XSS payload can't exfiltrate the token.
// - secure: only sent over HTTPS in production.
// - sameSite: 'none' in production so the cookie works when the frontend and
//   API are on different origins (requires secure:true); 'lax' in dev.
const AUTH_COOKIE = 'token';
const authCookieOptions = {
  httpOnly: true,
  secure: isProd,
  sameSite: isProd ? 'none' : 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days, matches the JWT lifetime
  path: '/'
};

function setAuthCookie(res, token) {
  res.cookie(AUTH_COOKIE, token, authCookieOptions);
}

function clearAuthCookie(res) {
  // clearCookie must receive the same attributes (minus maxAge) to match.
  const { maxAge, ...clearOptions } = authCookieOptions;
  res.clearCookie(AUTH_COOKIE, clearOptions);
}

module.exports = {
  authenticateToken,
  requireRole,
  setAuthCookie,
  clearAuthCookie
};