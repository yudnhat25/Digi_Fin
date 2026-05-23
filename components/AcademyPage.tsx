import React, { useState, useMemo } from 'react';
import { UserState } from '../types';
import { ACADEMY_COURSES, TIER_LIMITS } from '../constants';

interface AcademyPageProps {
  user: UserState;
  onEnroll: (courseId: string, finalPrice: number) => void;
  onUpgradeClick: () => void;
}

const AcademyPage: React.FC<AcademyPageProps> = ({ user, onEnroll, onUpgradeClick }) => {
  const [level, setLevel] = useState<'ALL' | 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert'>('ALL');
  const [search, setSearch] = useState('');
  const [checkout, setCheckout] = useState<string | null>(null);

  const tier = user.tier || 'STARTER';
  const enrollmentMap = useMemo(() => {
    const m: Record<string, number> = {};
    (user.enrollments || []).forEach(e => { m[e.courseId] = e.progress; });
    return m;
  }, [user.enrollments]);

  const computePrice = (price: number) => {
    if (price === 0) return 0;
    if (tier === 'ELITE') return 0; // all included
    if (tier === 'PRO') return Math.round(price * 0.5); // 50% off
    return price;
  };

  const filtered = ACADEMY_COURSES.filter(c =>
    (level === 'ALL' || c.level === level) &&
    (!search || c.title.toLowerCase().includes(search.toLowerCase()))
  );

  const totalLessons = ACADEMY_COURSES.reduce((s, c) => s + c.lessons, 0);
  const myEnrollments = (user.enrollments || []).length;
  const completed = (user.enrollments || []).filter(e => e.progress >= 100).length;
  const courseToEnroll = checkout ? ACADEMY_COURSES.find(c => c.id === checkout) : null;
  const finalCheckoutPrice = courseToEnroll ? computePrice(courseToEnroll.price) : 0;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      {/* Header / Hero */}
      <div className="relative bg-gradient-to-br from-blue-500/20 via-slate-900 to-violet-500/10 border border-blue-500/30 rounded-3xl p-8 md:p-10 overflow-hidden">
        <div className="absolute -top-20 -right-20 w-80 h-80 bg-blue-500/20 blur-3xl rounded-full pointer-events-none" />
        <div className="relative flex flex-col md:flex-row gap-6 md:items-center md:justify-between">
          <div>
            <span className="inline-block bg-blue-500/20 text-blue-400 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full mb-3">CoinWise Academy</span>
            <h1 className="text-3xl md:text-5xl font-black tracking-tighter mb-2">From rookie to pro trader.</h1>
            <p className="text-slate-300 text-lg max-w-2xl">{totalLessons}+ video lessons from former hedge fund analysts, on-chain quants, and crypto OGs. Earn certified completion badges.</p>
          </div>
          {tier !== 'ELITE' && (
            <button onClick={onUpgradeClick} className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-6 py-3.5 rounded-xl whitespace-nowrap transition">
              Get all courses with Elite →
            </button>
          )}
        </div>
      </div>

      {/* My Progress strip */}
      {myEnrollments > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5">
            <p className="text-[10px] uppercase tracking-widest font-black text-slate-500">Enrolled</p>
            <p className="text-2xl font-black">{myEnrollments}</p>
          </div>
          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5">
            <p className="text-[10px] uppercase tracking-widest font-black text-slate-500">Completed</p>
            <p className="text-2xl font-black text-emerald-400">{completed}</p>
          </div>
          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5">
            <p className="text-[10px] uppercase tracking-widest font-black text-slate-500">Hours Watched</p>
            <p className="text-2xl font-black">{(myEnrollments * 4.2).toFixed(1)}h</p>
          </div>
          <div className="bg-slate-900/50 border border-amber-500/30 rounded-2xl p-5">
            <p className="text-[10px] uppercase tracking-widest font-black text-amber-400">Certificates</p>
            <p className="text-2xl font-black text-amber-400">{completed}</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="flex gap-2 overflow-x-auto">
          {(['ALL', 'Beginner', 'Intermediate', 'Advanced', 'Expert'] as const).map(l => (
            <button
              key={l} onClick={() => setLevel(l)}
              className={`px-4 py-2 text-xs font-black uppercase tracking-widest rounded-xl whitespace-nowrap transition ${
                level === l ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {l}
            </button>
          ))}
        </div>
        <div className="relative md:w-72">
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          <input
            type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search courses..."
            className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-11 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* Course grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map(course => {
          const finalPrice = computePrice(course.price);
          const enrolled = enrollmentMap[course.id] !== undefined;
          const progress = enrollmentMap[course.id] || 0;
          const isFree = course.price === 0;
          return (
            <div key={course.id} className="group bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden hover:border-slate-700 transition flex flex-col">
              <div className={`h-44 bg-gradient-to-br from-${course.color}-500/30 via-${course.color}-500/10 to-transparent flex items-center justify-center text-7xl relative`}>
                {course.icon}
                <div className="absolute top-3 left-3 flex gap-1.5">
                  <span className={`text-[9px] font-black uppercase tracking-widest bg-slate-900/80 backdrop-blur text-${course.color}-400 px-2 py-1 rounded`}>{course.level}</span>
                  {tier === 'ELITE' && !isFree && (
                    <span className="text-[9px] font-black uppercase tracking-widest bg-amber-500/90 text-slate-950 px-2 py-1 rounded">Included</span>
                  )}
                  {tier === 'PRO' && !isFree && (
                    <span className="text-[9px] font-black uppercase tracking-widest bg-emerald-500/90 text-slate-950 px-2 py-1 rounded">50% OFF</span>
                  )}
                </div>
                {enrolled && (
                  <div className="absolute bottom-3 right-3 text-[9px] font-black uppercase tracking-widest bg-emerald-500/90 text-slate-950 px-2 py-1 rounded">
                    {progress >= 100 ? '✓ Completed' : 'Enrolled'}
                  </div>
                )}
              </div>
              <div className="p-6 flex flex-col flex-1">
                <h3 className="font-black text-lg mb-1.5 leading-tight">{course.title}</h3>
                <p className="text-xs text-slate-500 mb-3">By {course.instructor}</p>
                <div className="flex items-center gap-4 text-xs text-slate-400 mb-4">
                  <span className="flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                    {course.lessons} lessons
                  </span>
                  <span>{course.duration}</span>
                  <span className="flex items-center gap-1 text-amber-400">★ {course.rating}</span>
                </div>
                <p className="text-xs text-slate-500 mb-4">{course.enrolled.toLocaleString()} enrolled</p>

                {enrolled && progress < 100 && (
                  <div className="mb-4">
                    <div className="flex justify-between text-[10px] font-bold text-slate-500 mb-1.5">
                      <span>PROGRESS</span><span>{progress}%</span>
                    </div>
                    <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${progress}%` }} />
                    </div>
                  </div>
                )}

                <div className="mt-auto pt-4 border-t border-slate-800 flex items-center justify-between">
                  <div>
                    {isFree ? (
                      <p className="text-emerald-400 font-black">Free</p>
                    ) : finalPrice === 0 ? (
                      <div>
                        <p className="text-xs text-slate-500 line-through">${course.price}</p>
                        <p className="text-emerald-400 font-black">Included</p>
                      </div>
                    ) : finalPrice < course.price ? (
                      <div>
                        <p className="text-xs text-slate-500 line-through">${course.price}</p>
                        <p className="font-black text-emerald-400">${finalPrice}</p>
                      </div>
                    ) : (
                      <p className="font-black text-lg">${course.price}</p>
                    )}
                  </div>
                  {enrolled ? (
                    <button className="bg-slate-800 text-white font-black text-xs px-4 py-2.5 rounded-xl uppercase tracking-widest hover:bg-slate-700 transition">
                      {progress >= 100 ? 'Review' : 'Continue'}
                    </button>
                  ) : (
                    <button
                      onClick={() => isFree || finalPrice === 0 ? onEnroll(course.id, finalPrice) : setCheckout(course.id)}
                      className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs px-4 py-2.5 rounded-xl uppercase tracking-widest transition"
                    >
                      {isFree || finalPrice === 0 ? 'Enroll' : 'Buy Now'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bundle CTA */}
      {tier !== 'ELITE' && (
        <div className="bg-gradient-to-br from-amber-500/10 via-slate-900 to-slate-950 border border-amber-500/30 rounded-3xl p-8 md:p-10 flex flex-col md:flex-row items-center gap-6">
          <div className="flex-1">
            <span className="inline-block text-[10px] font-black uppercase tracking-widest text-amber-400 mb-2">Bundle Offer</span>
            <h2 className="text-2xl md:text-3xl font-black mb-2">Get every Academy course — free with Elite.</h2>
            <p className="text-slate-400">All 6 courses ($824 value) + 1-on-1 monthly strategy calls + private Discord. Less than $3.30/day.</p>
          </div>
          <button onClick={onUpgradeClick} className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-7 py-3.5 rounded-xl whitespace-nowrap transition">
            Upgrade to Elite — $99/mo
          </button>
        </div>
      )}

      {/* Checkout modal */}
      {checkout && courseToEnroll && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur animate-in fade-in duration-300">
          <div className="bg-white text-slate-900 rounded-3xl max-w-md w-full overflow-hidden shadow-2xl">
            <div className="bg-[#635BFF] text-white p-6">
              <p className="text-xs font-bold uppercase tracking-widest opacity-80">Course Enrollment</p>
              <p className="text-xl font-black mt-1">{courseToEnroll.title}</p>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-slate-50 rounded-2xl p-4 flex justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Lifetime Access</p>
                  <p className="font-black">{courseToEnroll.lessons} lessons · {courseToEnroll.duration}</p>
                </div>
                <p className="font-black text-[#635BFF] text-2xl">${finalCheckoutPrice}.00</p>
              </div>
              {finalCheckoutPrice < courseToEnroll.price && (
                <p className="text-xs text-emerald-700 bg-emerald-50 p-3 rounded-xl">🎉 Your {tier} membership saves ${courseToEnroll.price - finalCheckoutPrice}</p>
              )}
              <button
                onClick={() => { onEnroll(courseToEnroll.id, finalCheckoutPrice); setCheckout(null); }}
                className="w-full bg-[#635BFF] hover:bg-[#5851e0] text-white font-bold py-4 rounded-xl text-lg transition"
              >
                Pay ${finalCheckoutPrice}.00 & Start Learning
              </button>
              <button onClick={() => setCheckout(null)} className="w-full text-slate-500 text-sm font-bold py-2">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AcademyPage;
