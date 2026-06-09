'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Search, BookOpen, Mic, Globe2, Users, ArrowLeft, Sparkles } from 'lucide-react';
import ChatWidget from '../components/ChatBot/ChatWidget';
import { useAuth } from './layout';


const STAT_CONFIG = [
  { key: 'approvedWords', icon: BookOpen, label: 'كلمة موثقة', color: 'from-primary-500 to-primary-600' },
  { key: 'audioClips', icon: Mic, label: 'تسجيل صوتي', color: 'from-accent-500 to-accent-600' },
  { key: 'locationsCovered', icon: Globe2, label: 'تغطية جغرافية', color: 'from-emerald-500 to-emerald-600' },
  { key: 'contributors', icon: Users, label: 'مساهم', color: 'from-violet-500 to-violet-600' },
];

export default function HomePage() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    approvedWords: null,
    audioClips: null,
    locationsCovered: null,
    contributors: null,
  });
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const loadStats = async () => {
      try {
        const apiBase = process.env.NEXT_PUBLIC_API_URL || 'https://almujam-alshamil-api.onrender.com';
        const res = await fetch(`${apiBase}/api/stats`, { cache: 'no-store' });
        const data = await res.json();

        if (cancelled) return;

        if (res.ok) {
          setStats({
            approvedWords: Number(data.approvedWords ?? 0),
            audioClips: Number(data.audioClips ?? 0),
            locationsCovered: Number(data.locationsCovered ?? 0),
            contributors: Number(data.contributors ?? 0),
          });
        }
      } catch (err) {
        // Keep the fallback placeholders if the API is unavailable.
      } finally {
        if (!cancelled) setStatsLoading(false);
      }
    };

    loadStats();

    return () => {
      cancelled = true;
    };
  }, []);

  const formatStatValue = (value) => {
    if (statsLoading) return '…';
    if (value === null || value === undefined) return '—';
    return Number(value).toLocaleString('ar-EG');
  };

  return (
    <div>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-primary-50/50 to-white dark:from-surface-900 dark:to-surface-800">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary-200/30 dark:bg-primary-800/10 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-accent-200/30 dark:bg-accent-800/10 rounded-full blur-3xl"></div>
        </div>

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-20 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 text-sm font-medium mb-6">
            <Sparkles size={14} />
            مشروع مفتوح المصدر — ساهم معنا
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-surface-900 dark:text-white mb-6 leading-tight">
            <span className="bg-gradient-to-l from-primary-600 to-accent-600 bg-clip-text text-transparent">
              المعجم الشامل
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-surface-500 dark:text-surface-400 max-w-2xl mx-auto mb-8 leading-relaxed">
            أول قاموس مفتوح المصدر يوثّق الكلمات العربية الفصحى واللهجات المتنوعة
            مع تسجيلات صوتية للنطق الأصلي من كل أنحاء الوطن العربي.
          </p>
  {/* استخدام مؤقت
<button
  onClick={() => {
    navigator.clipboard.writeText(
      localStorage.getItem('token') || ''
    );
    alert('تم');
  }}
>
  نسخ 
</button>
  */}
          {/* Search Bar */}
          <div className="max-w-2xl mx-auto mb-8">
            <form action="/search" method="GET" className="relative">
              <div className="absolute inset-y-0 right-0 flex items-center pr-4">
                <Search size={20} className="text-surface-400" />
              </div>
              <input
                type="text"
                name="q"
                placeholder="إبحث عن كلمة، لهجة، أو جذر…"
                className="w-full pr-12 pl-4 py-4 text-lg rounded-2xl border-2 border-surface-200 dark:border-surface-600 bg-white dark:bg-surface-800 focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all shadow-lg shadow-primary-500/5"
              />
            </form>
          </div>

          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link href="/search" className="btn-primary !px-8 !py-3 !text-base">
              <Search size={18} className="inline ml-2" />
              استكشف الكلمات
            </Link>

            {user ? (
              <Link href="/add" className="btn-outline !px-8 !py-3 !text-base">
                <Mic size={18} className="inline ml-2" />
                ساهم بكلمة
              </Link>
            ) : (
              <Link href="/auth/register" className="btn-outline !px-8 !py-3 !text-base">
                <Mic size={18} className="inline ml-2" />
                أنشئ حسابك مجاناً
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-white dark:bg-surface-800 border-y border-surface-200 dark:border-surface-700">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {STAT_CONFIG.map((stat) => (
              <div key={stat.key} className="text-center p-4">
                <div className={`w-12 h-12 mx-auto mb-3 rounded-2xl bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-md`}>
                  <stat.icon size={22} className="text-white" />
                </div>
                 <div className="text-3xl font-bold text-surface-800 dark:text-white mb-1 min-w-[6ch] inline-block text-center">
                  {formatStatValue(stats[stat.key])}
                 </div>
                <div className="text-sm text-surface-500">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-surface-50 dark:bg-surface-800/50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-surface-900 dark:text-white mb-12">
            لماذا المعجم الشامل؟
          </h2>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: Mic,
                title: 'تسجيلات صوتية أصلية',
                desc: 'كل كلمة مسجلة بصوت ناطق أصلي من بلدها، لضمان صحة النطق واللفظ.'
              },
              {
                icon: Globe2,
                title: 'تغطية جغرافية شاملة',
                desc: 'من المغرب للخليج، ومن سوريا لليمن — نوثّق كل اللهجات العربية.'
              },
              {
                icon: Users,
                title: 'محتوى مجتمعي مفتوح',
                desc: 'أي شخص يستطيع إضافة كلمة مع بياناتها الجغرافية، مع إشراف لضمان الجودة.'
              },
              {
                icon: BookOpen,
                title: 'جذور ومعاني ومرادفات',
                desc: 'ربط الكلمات بجذورها اللغوية وتقديم المرادفات لثراء المحتوى.'
              },
              {
                icon: Search,
                title: 'بحث ذكي ومتقدم',
                desc: 'ابحث بكلمة، جذر، لهجة، أو منطقة — النتائج دقيقة وسريعة.'
              },
              {
                icon: Sparkles,
                title: 'مشروع مفتوح المصدر',
                desc: 'الكود متاح للجميع على GitHub. ساهم في تطوير المنصة.'
              },
            ].map((feature, i) => (
              <div key={i} className="card hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-100 to-accent-100 dark:from-primary-900/30 dark:to-accent-900/30 flex items-center justify-center mb-4">
                  <feature.icon size={20} className="text-primary-600 dark:text-primary-400" />
                </div>
                <h3 className="font-bold text-surface-800 dark:text-white mb-2">{feature.title}</h3>
                <p className="text-sm text-surface-500 dark:text-surface-400 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-gradient-to-l from-primary-600 to-accent-600 text-white">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">انضم إلى رحلة توثيق اللغة العربية</h2>
          <p className="text-lg text-white/80 mb-8">
            كل كلمة توثّقها هي لبنة في صرح لغتنا. ساهم الآن!
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link href="/search" className="bg-white text-primary-700 font-bold px-8 py-3 rounded-xl hover:bg-white/90 transition-all shadow-lg">
              <Search size={18} className="inline ml-2" />
              استكشف الكلمات
            </Link>
            <a href="https://github.com/Abdomghrbi/almujam-alshamil" target="_blank" rel="noopener noreferrer" className="border-2 border-white/40 bg-black text-white hover:bg-white/10 font-medium px-8 py-3 rounded-xl transition-all">
              <ArrowLeft size={15} className="inline ml-2" />
              شاهد الكود المصدر
            </a>
          </div>
        </div>
      </section>
       {/* Chat Widget */}
      <ChatWidget user={user} />
    </div>
  );
}
