const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const crypto = require('crypto');
const { sendPasswordResetEmail } = require('../services/emailService');
const passport = require('../config/passport');
const upload = require('../middleware/upload');
const supabase = require('../config/supabase');

if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET is missing in environment variables');
}

const JWT_SECRET = process.env.JWT_SECRET;

async function generateUniqueUsername(
  pool,
  baseUsername
) {
  let username = baseUsername;
  let counter = 1;

  while (true) {
    const result = await pool.query(
      `
      SELECT id
      FROM users
      WHERE username = $1
      LIMIT 1
      `,
      [username]
    );

    if (result.rows.length === 0) {
      return username;
    }

    username = `${baseUsername}${counter}`;
    counter++;
  }
}

// REGISTER
router.post('/register', async (req, res) => {
  try {
    const {
      username,
      email,
      password,
      display_name
    } = req.body;

    const pool = req.app.locals.pool;

    // Validation أساسي
    if (!username || !email || !password) {
      return res.status(400).json({
        error: 'جميع الحقول مطلوبة'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        error: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل'
      });
    }

    // Check existing user
    const existing = await pool.query(
      `
      SELECT id
      FROM users
      WHERE username = $1 OR email = $2
      `,
      [username, email]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({
        error: 'اسم المستخدم أو البريد موجود مسبقاً'
      });
    }

    const password_hash = await bcrypt.hash(password, 12);

    const result = await pool.query(
      `
      INSERT INTO users (
        username,
        email,
        password_hash,
        display_name
      )
      VALUES ($1, $2, $3, $4)
      RETURNING
        id,
        username,
        email,
        display_name,
        role,
        created_at
      `,
      [
        username,
        email,
        password_hash,
        display_name || username
      ]
    );

    const user = result.rows[0];

    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        role: user.role
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      user,
      token
    });

  } catch (err) {
    console.error('Register error:', err);

    res.status(500).json({
      error: 'خطأ في التسجيل'
    });
  }
});

// LOGIN
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const pool = req.app.locals.pool;

    if (!username || !password) {
      return res.status(400).json({
        error: 'جميع الحقول مطلوبة'
      });
    }

    const result = await pool.query(
      `
      SELECT
        id,
        username,
        email,
        password_hash,
        display_name,
        role
      FROM users
      WHERE username = $1 OR email = $1
      LIMIT 1
      `,
      [username]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        error: 'اسم المستخدم أو كلمة المرور خطأ'
      });
    }

    const user = result.rows[0];

    const valid = await bcrypt.compare(
      password,
      user.password_hash
    );

    if (!valid) {
      return res.status(401).json({
        error: 'اسم المستخدم أو كلمة المرور خطأ'
      });
    }

    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        role: user.role
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        display_name: user.display_name,
        role: user.role
      },
      token
    });

  } catch (err) {
    console.error('Login error:', err);

    res.status(500).json({
      error: 'خطأ في تسجيل الدخول'
    });
  }
});


// CURRENT USER
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const pool = req.app.locals.pool;

    const result = await pool.query(
      `
      SELECT
        id,
        username,
        email,
        display_name,
        bio,
        avatar_url,
        role,
        is_active,
        created_at,
        updated_at
      FROM users
      WHERE id = $1
      LIMIT 1
      `,
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'المستخدم غير موجود' });
    }

    res.json({ user: result.rows[0] });
  } catch (err) {
    console.error('Me error:', err);
    res.status(500).json({ error: 'خطأ في جلب بيانات المستخدم' });
  }
});

// FORGOT PASSWORD
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    const pool = req.app.locals.pool;

    if (!email) {
      return res.status(400).json({
        error: 'البريد الإلكتروني مطلوب'
      });
    }

    const userResult = await pool.query(
      `
      SELECT id, email
      FROM users
      WHERE email = $1
      LIMIT 1
      `,
      [email]
    );

    if (userResult.rows.length === 0) {
      return res.json({
        message: 'إذا كان البريد مسجلاً فستصلك رسالة إعادة التعيين'
      });
    }

    const user = userResult.rows[0];

    const token = crypto.randomBytes(32).toString('hex');

    // Persist only a SHA-256 hash of the reset token. The raw token is sent
    // to the user by email and never stored, so a database read (leak, MITM,
    // backup) cannot yield a usable reset token.
    const tokenHash = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    const expiresAt = new Date(
      Date.now() + 60 * 60 * 1000
    );

    await pool.query(
      `
      INSERT INTO password_reset_tokens (
        user_id,
        token,
        expires_at
      )
      VALUES ($1, $2, $3)
      `,
      [
        user.id,
        tokenHash,
        expiresAt
      ]
    );

    const resetLink =
      `${process.env.FRONTEND_URL}/reset-password?token=${token}`;

    await sendPasswordResetEmail(
      user.email,
      resetLink
    );

    res.json({
      message: 'إذا كان البريد مسجلاً فستصلك رسالة إعادة التعيين'
    });

  } catch (err) {
    console.error('Forgot password error:', err);

    res.status(500).json({
      error: 'خطأ أثناء معالجة الطلب'
    });
  }
});

// RESET PASSWORD
router.post('/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body;
    const pool = req.app.locals.pool;

    if (!token || !password) {
      return res.status(400).json({
        error: 'التوكن وكلمة المرور مطلوبان'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        error: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل'
      });
    }

    // Hash the supplied token the same way it was stored, then look it up by
    // hash. The plaintext token never touches the database.
    const tokenHash = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    const tokenResult = await pool.query(
      `
      SELECT
        id,
        user_id,
        expires_at,
        used
      FROM password_reset_tokens
      WHERE token = $1
      LIMIT 1
      `,
      [tokenHash]
    );

    if (tokenResult.rows.length === 0) {
      return res.status(400).json({
        error: 'رابط إعادة التعيين غير صالح'
      });
    }

    const resetToken = tokenResult.rows[0];

    if (resetToken.used) {
      return res.status(400).json({
        error: 'تم استخدام الرابط مسبقاً'
      });
    }

    if (new Date(resetToken.expires_at) < new Date()) {
      return res.status(400).json({
        error: 'انتهت صلاحية الرابط'
      });
    }

    const password_hash = await bcrypt.hash(password, 12);

    await pool.query(
      `
      UPDATE users
      SET
        password_hash = $1,
        updated_at = NOW()
      WHERE id = $2
      `,
      [
        password_hash,
        resetToken.user_id
      ]
    );

    await pool.query(
      `
      UPDATE password_reset_tokens
      SET used = TRUE
      WHERE id = $1
      `,
      [resetToken.id]
    );

    res.json({
      message: 'تم تغيير كلمة المرور بنجاح'
    });

  } catch (err) {
    console.error('Reset password error:', err);

    res.status(500).json({
      error: 'خطأ أثناء إعادة تعيين كلمة المرور'
    });
  }
});
// GOOGLE LOGIN
router.get(
  '/google',
  passport.authenticate('google', {
    scope: ['profile', 'email']
  })
);

// GOOGLE CALLBACK
router.get(
  '/google/callback',
  (req, res, next) => {
    if (req.query.error === 'access_denied') {
      return res.redirect(
        `${process.env.FRONTEND_URL}/auth/login?error=google_cancelled`
      );
    }
    next();
  },
  passport.authenticate('google', {
    session: false,
    failureRedirect: `${process.env.FRONTEND_URL}/auth/login?error=google_failed`
  }),
  async (req, res) => {
    try {
      const pool = req.app.locals.pool;

      const googleId = req.user.id;
      const email = req.user.emails?.[0]?.value;
      if (!email) {
        return res.redirect(
          `${process.env.FRONTEND_URL}/auth/login?error=no_email`
        );
      }
      const displayName = req.user.displayName;
      const avatarUrl = req.user.photos?.[0]?.value || null;

      let user;

      const existingGoogle = await pool.query(
        `
        SELECT *
        FROM users
        WHERE google_id = $1
        LIMIT 1
        `,
        [googleId]
      );

      if (existingGoogle.rows.length > 0) {
        user = existingGoogle.rows[0];
      } else {
        const existingEmail = await pool.query(
          `
          SELECT *
          FROM users
          WHERE email = $1
          LIMIT 1
          `,
          [email]
        );

        if (existingEmail.rows.length > 0) {
          user = existingEmail.rows[0];

          await pool.query(
            `
            UPDATE users
            SET google_id = $1
            WHERE id = $2
            `,
            [googleId, user.id]
          );
        } else {
          const randomPassword =
            await bcrypt.hash(
              crypto.randomBytes(32).toString('hex'),
              12
            );

          const baseUsername = email.split('@')[0];

          const username = await generateUniqueUsername(pool, baseUsername);

          const created = await pool.query(
            `
            INSERT INTO users (
              username,
              email,
              password_hash,
              display_name,
              avatar_url,
              google_id
            )
            VALUES ($1,$2,$3,$4,$5,$6)
            RETURNING *
            `,
            [
              username,
              email,
              randomPassword,
              displayName,
              avatarUrl,
              googleId
            ]
          );

          user = created.rows[0];
        }
      }

      const token = jwt.sign(
        {
          id: user.id,
          username: user.username,
          role: user.role
        },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      res.redirect(
        `${process.env.FRONTEND_URL}/auth/google-success?token=${token}`
      );

    } catch (err) {
      console.error(err);
      res.redirect(`${process.env.FRONTEND_URL}/auth/login?error=server_error`);
    }
  }
);


// update photo
router.post(
  '/upload-avatar',
  authenticateToken,
  upload.single('avatar'),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          error: 'لم يتم اختيار صورة'
        });
      }

      const fileExt =
        req.file.originalname.split('.').pop();

      const fileName =
        `${req.user.id}-${Date.now()}.${fileExt}`;

      const { error: uploadError } =
        await supabase.storage
          .from('avatars')
          .upload(fileName, req.file.buffer, {
            contentType: req.file.mimetype,
            upsert: true
          });

      if (uploadError) {
        throw uploadError;
      }

      const {
        data: { publicUrl }
      } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      await req.app.locals.pool.query(
        `
        UPDATE users
        SET avatar_url = $1,
            updated_at = NOW()
        WHERE id = $2
        `,
        [publicUrl, req.user.id]
      );

      res.json({
        success: true,
        avatar_url: publicUrl
      });

    } catch (err) {
      console.error(err);

      res.status(500).json({
        error: 'فشل رفع الصورة'
      });
    }
  }
);

module.exports = router;
