'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../layout';
import { Shield, Check, X, Mic, MapPin } from 'lucide-react';

export default function ModerationPage() {
  const { user } = useAuth();
  const [pendingWords, setPendingWords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user?.role === 'admin' || user?.role === 'moderator') fetchPending();
    else setLoading(false);
  }, [user]);

  const fetchPending = async () => {
    try {
      setError('');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://almujam-alshamil-api.onrender.com'}/api/moderation/pending`, {
        credentials: 'include',
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'تعذر جلب الكلمات المعلقة');
      }

      setPendingWords(data.words || []);
    } catch (err) {
      console.error(err);
      setPendingWords([]);
      setError(err.message || 'تعذر جلب الكلمات المعلقة');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (wordId, action) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://almujam-alshamil-api.onrender.com'}/api/moderation/${wordId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ action }),
      });
      if (res.ok) {
        setPendingWords(pendingWords.filter(w => w.id !== wordId));
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (!user || (user.role !== 'admin' && user.role !== 'moderator')) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <div className="card">
          <Shield size={48} className="mx-auto mb-4 text-surface-300" />
          <h2 className="text-xl font-bold text-surface-800 dark:text-white mb-2">غير مصرح</h2>
          <p className="text-surface-500">هذه الصفحة مخصصة لفريق الإشراف فقط.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center gap-3 mb-8">
        <Shield size={24} className="text-primary-500" />
        <h1 className="text-2xl font-bold text-surface-900 dark:text-white">لوحة الإشراف</h1>
        <span className="badge-primary">{pendingWords.length} كلمة بانتظار المراجعة</span>
      </div>

      {error ? (
        <div className="card mb-6 border border-amber-200 dark:border-amber-900/40 bg-amber-50/60 dark:bg-amber-900/10">
          <p className="text-amber-800 dark:text-amber-200 text-sm">{error}</p>
        </div>
      ) : null}

      {pendingWords.length === 0 ? (
        <div className="text-center py-16 card">
          <Check size={48} className="mx-auto mb-4 text-emerald-400" />
          <p className="text-surface-500 text-lg">لا توجد كلمات بانتظار المراجعة.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {pendingWords.map((word) => (
            <div key={word.id} className="card">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-xl font-bold text-surface-800 dark:text-white">{word.word}</h3>
                  <span className="text-sm text-surface-500">
                    بواسطة @{word.contributor_name || '—'} — {word.created_at ? new Date(word.created_at).toLocaleDateString('ar-SA') : ''}
                  </span>
                </div>
                <span className={`badge ${word.word_type === 'كنية' ? 'badge-accent' : 'badge-primary'}`}>{word.word_type}</span>
              </div>

              <div className="flex items-center gap-3 text-sm text-surface-500 mb-3 flex-wrap">
                {word.language && <span>اللغة: {word.language}</span>}
                {word.has_audio && <span className="flex items-center gap-1"><Mic size={14} /> يوجد تسجيل صوتي</span>}
              </div>

              <p className="text-surface-600 dark:text-surface-400 mb-3">{word.meaning}</p>

              {word.example_usage && <div className="text-sm text-surface-500 mb-2">مثال: {word.example_usage}</div>}
              {word.root && <div className="text-sm text-surface-500 mb-2">الجذر: {word.root}</div>}
              {word.part_of_speech && <div className="text-sm text-surface-500 mb-2">القسم: {word.part_of_speech}</div>}
              {word.pronunciation && <div className="text-sm text-surface-500 mb-3">النطق: {word.pronunciation}</div>}

              <div className="flex items-center gap-4 text-sm text-surface-400 mb-4">
                {word.country && <span className="flex items-center gap-1"><MapPin size={14} /> {word.country}{word.state ? ` / ${word.state}` : ''}{word.district ? ` / ${word.district}` : ''}</span>}
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleAction(word.id, 'approve')}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-all text-sm font-medium"
                >
                  <Check size={16} /> قبول
                </button>
                <button
                  onClick={() => handleAction(word.id, 'reject')}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/40 transition-all text-sm font-medium"
                >
                  <X size={16} /> رفض
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
