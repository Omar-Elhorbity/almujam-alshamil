'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../layout';
import LocationPicker from '../../components/LocationPicker';
import AudioRecorder from '../../components/AudioRecorder';
import { PlusCircle, Upload, Mic } from 'lucide-react';

export default function AddWordPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({
    word: '',
    language: 'العربية',
    word_type: 'كلمة',
    meaning: '',
    example_usage: '',
    root: '',
    part_of_speech: '',
    pronunciation: '',
    country: '',
    state: '',
    district: '',
    audioBase64: null,
  });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!user) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <div className="card">
          <Mic size={48} className="mx-auto mb-4 text-primary-400" />
          <h2 className="text-xl font-bold text-surface-800 dark:text-white mb-2">يجب تسجيل الدخول أولاً</h2>
          <p className="text-surface-500 mb-6">لإضافة كلمة جديدة، أنشئ حساباً أو سجل دخول.</p>
          <a href="/auth/login" className="btn-primary">تسجيل الدخول</a>
        </div>
      </div>
    );
  }

  const handleChange = (field, value) => {
    setForm({ ...form, [field]: value });
  };

  const handleLocationChange = (location) => {
    setForm({ ...form, ...location });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const body = {
        word: form.word,
        language: form.language || 'العربية',
        word_type: form.word_type,
        meaning: form.meaning,
        example_usage: form.example_usage || null,
        root: form.root || null,
        part_of_speech: form.part_of_speech || null,
        pronunciation: form.pronunciation || null,

        // location (ضروري)
        country: form.country,
        state: form.state || null,
        district: form.district || null,

        // audio
        audioBase64: form.audioBase64 || null
      };

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'https://almujam-alshamil-api.onrender.com'}/api/words`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify(body),
        }
      );

      const data = await res.json();

      if (res.ok) {
        setSuccess(true);

        setForm({
          word: '',
          language: 'العربية',
          word_type: 'كلمة',
          meaning: '',
          example_usage: '',
          root: '',
          part_of_speech: '',
          pronunciation: '',
          country: '',
          state: '',
          district: '',
          audioBase64: null
        });
      } else {
        alert(data.error || 'حدث خطأ أثناء الإرسال');
      }

    } catch (err) {
      alert('فشل الاتصال بالخادم');
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <div className="card">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
            <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
          </div>
          <h2 className="text-xl font-bold text-surface-800 dark:text-white mb-2">تم الإرسال بنجاح!</h2>
          <p className="text-surface-500 mb-6">سيتم مراجعة الكلمة من قبل فريق الإشراف قبل النشر.</p>
          <button onClick={() => setSuccess(false)} className="btn-primary">إضافة كلمة أخرى</button>
        </div>
      </div>
    );
  }

  const types = ['كلمة', 'مثل', 'تعبير', 'مصطلح', 'كنية'];

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
          <PlusCircle size={20} className="text-white" />
        </div>
        <h1 className="text-2xl font-bold text-surface-900 dark:text-white">إضافة كلمة جديدة</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Word + Type */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-surface-600 dark:text-surface-400 mb-1.5">الكلمة *</label>
            <input
              type="text"
              value={form.word}
              onChange={(e) => handleChange('word', e.target.value)}
              required
              placeholder="اكتب الكلمة…"
              className="input-field text-lg font-bold"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-600 dark:text-surface-400 mb-1.5">النوع *</label>
            <select value={form.word_type} onChange={(e) => handleChange('word_type', e.target.value)} className="input-field">
              {types.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>

        {/* Language */}
        <div>
          <label className="block text-sm font-medium text-surface-600 dark:text-surface-400 mb-1.5">اللغة *</label>
          <input
            type="text"
            value={form.language}
            onChange={(e) => handleChange('language', e.target.value)}
            placeholder="مثال: العربية"
            className="input-field"
          />
        </div>

        {/* Meaning */}
        <div>
          <label className="block text-sm font-medium text-surface-600 dark:text-surface-400 mb-1.5">المعنى / الشرح *</label>
          <textarea
            value={form.meaning}
            onChange={(e) => handleChange('meaning', e.target.value)}
            required
            rows={4}
            placeholder="اكتب معنى الكلمة بالتفصيل."
            className="input-field resize-none"
          />
        </div>

        {/* Example usage */}
        <div>
          <label className="block text-sm font-medium text-surface-600 dark:text-surface-400 mb-1.5">مثال استخدام (اختياري)</label>
          <textarea
            value={form.example_usage}
            onChange={(e) => handleChange('example_usage', e.target.value)}
            rows={3}
            placeholder="مثال لكيفية استخدام الكلمة في جملة أو سياق."
            className="input-field resize-none"
          />
        </div>

        {/* Root + Pronunciation */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-surface-600 dark:text-surface-400 mb-1.5">الجذر (إن وجد)</label>
            <input
              type="text"
              value={form.root}
              onChange={(e) => handleChange('root', e.target.value)}
              placeholder="مثال: ك ت ب"
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-600 dark:text-surface-400 mb-1.5">النطق (اختياري)</label>
            <input
              type="text"
              value={form.pronunciation}
              onChange={(e) => handleChange('pronunciation', e.target.value)}
              placeholder="مثال: /ka'taba/"
              className="input-field"
            />
          </div>
        </div>

        {/* Part of speech */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-surface-600 dark:text-surface-400 mb-1.5">القسم (اختياري)</label>
            <input
              type="text"
              value={form.part_of_speech}
              onChange={(e) => handleChange('part_of_speech', e.target.value)}
              placeholder="اسم / فعل / حرف …"
              className="input-field"
            />
          </div>
        </div>

        {/* Location */}
        <div className="card !p-4">
          <h3 className="font-bold text-surface-700 dark:text-surface-300 mb-3 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            الموقع الجغرافي للكلمة *
          </h3>
          <LocationPicker onChange={handleLocationChange} />
        </div>

        {/* Audio Recording */}
        <div className="card !p-4">
          <h3 className="font-bold text-surface-700 dark:text-surface-300 mb-3 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 10v2a6 6 0 0012 0v-2" /></svg>
            تسجيل صوتي (اختياري)
          </h3>
          <AudioRecorder onRecorded={(blob, url, base64) => setForm(prev => ({ ...prev, audioBase64: base64 }))} />
        </div>

        {/* Submit */}
        <button type="submit" disabled={submitting} className="btn-primary w-full !py-3 !text-base flex items-center justify-center gap-2">
          {submitting ? (
            <><div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div> جاري الإرسال…</>
          ) : (
            <><Upload size={18} /> إرسال الكلمة للمراجعة</>
          )}
        </button>
      </form>
    </div>
  );
}
