'use client';

import { useState, useEffect, createContext, useContext } from 'react';
import './globals.css';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { BookOpen } from 'lucide-react';


export const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export default function RootLayout({ children }) {
  const [user, setUser] = useState(null);
  const [darkMode, setDarkMode] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initialize = async () => {
      // Load theme preference
      const storedTheme = localStorage.getItem('theme');
      if (storedTheme === 'dark' || (!storedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        setDarkMode(true);
        document.documentElement.classList.add('dark');
      }

      // Restore the session via the httpOnly cookie, which is sent
      // automatically with credentials: 'include'. The token is never read
      // from JS-accessible storage, so an XSS payload can't exfiltrate it.
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://almujam-alshamil-api.onrender.com'}/api/auth/me`, {
          credentials: 'include'
        });

        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
        } else {
          setUser(null);
        }
      } catch (err) {
        setUser(null);
      }

      setLoading(false);
    };

    initialize();
  }, []);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle('dark');
    localStorage.setItem('theme', darkMode ? 'light' : 'dark');
  };

  // The token now lives in an httpOnly cookie set by the backend response, so
  // there's nothing for the client to store. The first arg is kept for
  // call-site compatibility but intentionally ignored.
  const login = (_token, userData) => {
    setUser(userData);
  };

  const logout = async () => {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://almujam-alshamil-api.onrender.com'}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include'
      });
    } catch (err) {
      // Even if the request fails, clear local state.
    }
    setUser(null);
  };

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://almujam-alshamil.vercel.app';
  const ogImage = `${siteUrl}/og-image.svg`;
  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        name: 'المعجم الشامل',
        url: siteUrl,
        logo: ogImage,
        sameAs: ['https://github.com/Abdomghrbi/almujam-alshamil']
      },
      {
        '@type': 'WebSite',
        name: 'المعجم الشامل',
        url: siteUrl,
        inLanguage: 'ar',
        potentialAction: {
          '@type': 'SearchAction',
          target: `${siteUrl}/search?q={search_term_string}`,
          'query-input': 'required name=search_term_string'
        }
      }
    ]
  };
  
  if (loading) {
  return (
    <html lang="ar" dir="rtl">
      <body className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <div className="w-24 h-24 bg-gradient-to-br from-blue-600 to-orange-500 rounded-lg animate-pulse flex items-center justify-center">
           <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-accent-500 rounded-2xl flex items-center justify-center shadow-md group-hover:shadow-lg transition-all ring-1 ring-white/30">
              <BookOpen size={20} className="text-white" />
            </div>  
          </div>
          <h2 className="text-lg font-bold">المعجم الشامل</h2>
          <p className="text-sm text-surface-500">جاري تحميل المحتوى...</p>
        </div>
      </body>
    </html>
  );
}

  return (
    <html lang="ar" dir="rtl" className={darkMode ? 'dark' : ''}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>المعجم الشامل — موسوعة عربية مفتوحة المصدر للكلمات واللهجات</title>
        <meta name="description" content="المعجم الشامل موسوعة عربية مفتوحة المصدر للكلمات والمعاني والمرادفات والجذور واللهجات مع تسجيلات صوتية أصلية." />
        <meta name="keywords" content="معجم عربي, لهجات عربية, كلمات عربية, مرادفات, جذور الكلمات, تسجيلات صوتية, موسوعة عربية" />
        <meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1" />
        <meta name="theme-color" content="#4c6ef5" />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="المعجم الشامل" />
        <meta property="og:locale" content="ar_AR" />
        <meta property="og:title" content="المعجم الشامل — موسوعة عربية مفتوحة المصدر للكلمات واللهجات" />
        <meta property="og:description" content="المعجم الشامل موسوعة عربية مفتوحة المصدر للكلمات والمعاني والمرادفات والجذور واللهجات مع تسجيلات صوتية أصلية." />
        <meta property="og:image" content={ogImage} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt" content="المعجم الشامل — موسوعة عربية مفتوحة المصدر" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="المعجم الشامل — موسوعة عربية مفتوحة المصدر للكلمات واللهجات" />
        <meta name="twitter:description" content="المعجم الشامل موسوعة عربية مفتوحة المصدر للكلمات والمعاني والمرادفات والجذور واللهجات مع تسجيلات صوتية أصلية." />
        <meta name="twitter:image" content={ogImage} />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/favicon.svg" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      </head>
      <body className="min-h-screen flex flex-col">
        <AuthContext.Provider value={{ user, login, logout, darkMode, toggleDarkMode }}>
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
        </AuthContext.Provider>
      </body>
    </html>
  );
}
