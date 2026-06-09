'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../layout';
import { UserPlus, User, Lock, Mail } from 'lucide-react';

export default function RegisterPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({ username: '', email: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Check error messages from URL + Google OAuth
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const checkErrors = () => {
      const params = new URLSearchParams(window.location.search);
      const err = params.get('error');

      if (err === 'google_cancelled') {
        setError('تم إلغاء التسجيل باستخدام Google. يرجى المحاولة مرة أخرى.');
      } else if (err === 'no_email') {
        setError('لم نتمكن من الحصول على البريد الإلكتروني من حساب Google.');
      } else if (err === 'server_error') {
        setError('حدث خطأ في الخادم. يرجى المحاولة لاحقاً.');
      } else if (err === 'google_failed') {
        setError('فشل التسجيل باستخدام Google.');
      }

      //  sessionStorage
      const googleStarted = sessionStorage.getItem('google_auth_started');
      const googleSuccess = sessionStorage.getItem('google_auth_success');

      if (googleStarted === 'true' && !googleSuccess && !err) {
        setError('تم إلغاء التسجيل باستخدام Google. يرجى المحاولة مرة أخرى.');
      }

      sessionStorage.removeItem('google_auth_started');
      sessionStorage.removeItem('google_auth_success');

      if (err) {
        window.history.replaceState({}, '', '/auth/register');
      }
    };

    checkErrors();

    // pageshow: (back navigation)
    window.addEventListener('pageshow', checkErrors);

    //  popstate: back/forward
    window.addEventListener('popstate', checkErrors);

    // visibilitychange
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        checkErrors();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      window.removeEventListener('pageshow', checkErrors);
      window.removeEventListener('popstate', checkErrors);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (form.password !== form.confirmPassword) {
      setError('كلمات المرور غير متطابقة');
      setLoading(false);
      return;
    }

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://almujam-alshamil-api.onrender.com';
    const endpoint = `${apiUrl}/api/auth/register`;

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: form.username,
          email: form.email,
          password: form.password,
        }),
      });

      let responseBody = null;
      try {
        responseBody = await res.text();
      } catch (e) {
        responseBody = '⚠️ تعذر قراءة الرد';
      }

      let parsedData = null;
      try {
        parsedData = JSON.parse(responseBody);
      } catch (e) {
        parsedData = responseBody;
      }

      if (res.ok && parsedData?.token) {
        login(parsedData.token, parsedData.user);
        router.push('/');
      } else {
        setError(parsedData?.error || parsedData?.message || `خطأ ${res.status}`);
      }
    } catch (err) {
      setError('فشل الاتصال بالخادم');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="card">
          <div className="text-center mb-6">
            <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center shadow-lg">
              <UserPlus size={24} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold text-surface-900 dark:text-white">إنشاء حساب جديد</h1>
            <p className="text-surface-500 text-sm mt-1">انضم إلى مجتمع المعجم الشامل</p>
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3 mb-4 text-sm text-red-600 dark:text-red-400 text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-surface-600 dark:text-surface-400 mb-1.5">اسم المستخدم</label>
              <div className="relative">
                <User size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400" />
                <input type="text" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} required className="input-field pr-10" placeholder="اختر اسم مستخدم" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-600 dark:text-surface-400 mb-1.5">البريد الإلكتروني</label>
              <div className="relative">
                <Mail size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400" />
                <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required className="input-field pr-10" placeholder="example@email.com" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-600 dark:text-surface-400 mb-1.5">كلمة المرور</label>
              <div className="relative">
                <Lock size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400" />
                <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={6} className="input-field pr-10" placeholder="6 أحرف على الأقل" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-600 dark:text-surface-400 mb-1.5">تأكيد كلمة المرور</label>
              <div className="relative">
                <Lock size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400" />
                <input type="password" value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} required className="input-field pr-10" placeholder="أعد إدخال كلمة المرور" />
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full !py-3">
              {loading ? 'جاري التسجيل…' : 'إنشاء الحساب'}
            </button>
          </form>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-surface-300"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white dark:bg-surface-900 px-3 text-surface-500">
                أو
              </span>
            </div>
          </div>

          {/* Google OAuth */}
          <a
            href="https://almujam-alshamil-api.onrender.com/api/auth/google"
            onClick={() => {
              sessionStorage.setItem('google_auth_started', 'true');
              sessionStorage.removeItem('google_auth_success');
            }}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl border border-surface-300 dark:border-surface-700 bg-white dark:bg-surface-800 hover:bg-surface-50 dark:hover:bg-surface-700 transition-all duration-200 shadow-sm"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-5 h-5">
              <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303C33.651 32.657 29.195 36 24 36c-6.627 0-12-5.373-12-12S17.373 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.27 4 24 4C12.955 4 4 12.955 4 24s8.955 20 20 20s20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" />
              <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 16.108 19.008 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.27 4 24 4c-7.682 0-14.348 4.337-17.694 10.691z" />
              <path fill="#4CAF50" d="M24 44c5.167 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.144 35.091 26.65 36 24 36c-5.174 0-9.617-3.329-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z" />
              <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.793 2.24-2.231 4.166-4.084 5.57l.003-.002l6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z" />
            </svg>
            <span className="font-medium">التسجيل باستخدام Google</span>
          </a>

          <div className="text-center mt-4 text-sm text-surface-500">
            لديك حساب بالفعل؟{' '}
            <Link href="/auth/login" className="text-primary-600 hover:text-primary-700 font-medium">تسجيل الدخول</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
