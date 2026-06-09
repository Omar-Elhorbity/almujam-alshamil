'use client';

import { useEffect, useState } from 'react';

export default function ProfilePage() {
  const [form, setForm] = useState({
    display_name: '',
    bio: '',
    avatar_url: ''
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const apiUrl =
    process.env.NEXT_PUBLIC_API_URL ||
    'https://almujam-alshamil-api.onrender.com';

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const token =
          localStorage.getItem('token');

        const res = await fetch(
          `${apiUrl}/api/auth/me`,
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );

        const data = await res.json();

        if (res.ok) {
          setForm({
            display_name:
              data.user.display_name || '',
            bio:
              data.user.bio || '',
            avatar_url:
              data.user.avatar_url || ''
          });
        } else {
          setError(
            data.error ||
            'فشل تحميل الملف الشخصي'
          );
        }
      } catch (err) {
        setError(
          'فشل الاتصال بالخادم'
        );
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    setSaving(true);
    setMessage('');
    setError('');

    try {
      const token =
        localStorage.getItem('token');

      const res = await fetch(
        `${apiUrl}/api/auth/profile`,
        {
          method: 'PUT',
          headers: {
            'Content-Type':
              'application/json',
            Authorization:
              `Bearer ${token}`
          },
          body: JSON.stringify(form)
        }
      );

      const data = await res.json();

      if (res.ok) {
        setMessage(
          'تم حفظ التغييرات بنجاح'
        );
      } else {
        setError(
          data.error ||
          'فشل حفظ التغييرات'
        );
      }
    } catch (err) {
      setError(
        'فشل الاتصال بالخادم'
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        جاري تحميل الملف الشخصي...
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="card">

        <h1 className="text-2xl font-bold mb-6">
          الملف الشخصي
        </h1>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 text-red-600">
            {error}
          </div>
        )}

        {message && (
          <div className="mb-4 p-3 rounded-xl bg-green-50 text-green-600">
            {message}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="space-y-4"
        >

        <div>
            <label className="block mb-2 text-sm font-medium">
              الصورة الشخصية
            </label>

            
          </div>

          {form.avatar_url && (
            <div className="flex justify-center">
              <img
                src={form.avatar_url}
                alt="avatar"
                className="w-24 h-24 rounded-full object-cover border"
              />
            </div>
          )}

          <div>
            <label className="block mb-2 text-sm font-medium">
              الاسم المعروض
            </label>

            <input
              type="text"
              value={form.display_name}
              onChange={(e) =>
                setForm({
                  ...form,
                  display_name:
                    e.target.value
                })
              }
              className="input-field"
            />
          </div>

          <div>
            <label className="block mb-2 text-sm font-medium">
              النبذة الشخصية
            </label>

            <textarea
              rows={4}
              value={form.bio}
              onChange={(e) =>
                setForm({
                  ...form,
                  bio:
                    e.target.value
                })
              }
              className="input-field"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="btn-primary w-full"
          >
            {saving
              ? 'جاري الحفظ...'
              : 'حفظ التغييرات'}
          </button>

        </form>
      </div>
    </div>
  );
}
