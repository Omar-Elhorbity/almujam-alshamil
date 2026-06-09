'use client';

import { useEffect } from 'react';

export default function GoogleSuccessPage() {
  useEffect(() => {
    // The backend set the httpOnly session cookie on the OAuth callback, so
    // there's no token in the URL to read. A full navigation to the home page
    // lets the app re-initialise and pick up the session from the cookie.
    window.location.href = '/';
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center">
      جاري تسجيل الدخول...
    </div>
  );
}
