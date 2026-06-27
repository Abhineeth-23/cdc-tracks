// src/pages/CDCDashboard.jsx
import { useState, useEffect } from 'react';
import { Award, TrendingUp, CheckCircle2, Target, BookOpen, Layers, BarChart3, ShieldCheck, Star } from 'lucide-react';
import axios from 'axios';

const CDCDashboard = ({ user }) => {
  const [cdcData, setCdcData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

  useEffect(() => {
    const fetchCDCData = async () => {
      try {
        setLoading(true);
        setError('');
        const response = await axios.get(`${API_URL}/api/student/cdc-dashboard-data`, {
          headers: {
            'Authorization': `Bearer ${user.email}`
          }
        });
        setCdcData(response.data);
      } catch (err) {
        console.error('Error fetching CDC dashboard data:', err);
        setError(err.response?.data?.detail || 'Failed to load CDC Performance data.');
      } finally {
        setLoading(false);
      }
    };

    if (user?.email) {
      fetchCDCData();
    }
  }, [user, API_URL]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-500 font-medium text-sm">Loading CDC Performance Dashboard...</p>
      </div>
    );
  }

  if (error || !cdcData) {
    return (
      <div className="max-w-2xl mx-auto my-12 p-8 bg-red-50 border border-red-200 rounded-2xl text-center">
        <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <Target size={24} />
        </div>
        <h3 className="text-xl font-bold text-red-900 mb-2">CDC Performance Record Not Found</h3>
        <p className="text-red-700 text-sm mb-6">{error || 'No CDC metrics recorded for your account yet.'}</p>
      </div>
    );
  }

  const { student, overall, post_assessments, domain_tracks, test_scores } = cdcData;

  // Band styling helper
  const getBandBadgeStyle = (band) => {
    switch (band?.toUpperCase()) {
      case 'A':
        return 'bg-emerald-500 text-white shadow-emerald-500/30 border-emerald-400';
      case 'B':
        return 'bg-blue-600 text-white shadow-blue-500/30 border-blue-400';
      case 'C':
        return 'bg-amber-500 text-white shadow-amber-500/30 border-amber-400';
      case 'D':
        return 'bg-rose-500 text-white shadow-rose-500/30 border-rose-400';
      default:
        return 'bg-slate-600 text-white';
    }
  };

  const getBandBgGlow = (band) => {
    switch (band?.toUpperCase()) {
      case 'A': return 'from-emerald-900/40 via-slate-900 to-slate-900 border-emerald-500/30';
      case 'B': return 'from-blue-900/40 via-slate-900 to-slate-900 border-blue-500/30';
      case 'C': return 'from-amber-900/40 via-slate-900 to-slate-900 border-amber-500/30';
      case 'D': return 'from-rose-900/40 via-slate-900 to-slate-900 border-rose-500/30';
      default:  return 'from-slate-800 to-slate-900 border-slate-700';
    }
  };

  // Generate comprehensive list of all 30 tests
  const rawScores = test_scores || {};
  const rawEntries = Object.entries(rawScores);

  const getScoreForTest = (num, defaultKey) => {
    // 1. Exact match
    if (rawScores[defaultKey] !== undefined && rawScores[defaultKey] !== null && rawScores[defaultKey] !== '') {
      return rawScores[defaultKey];
    }
    // 2. Fallback check for Test N
    const altTestKey = `Test ${num}`;
    if (rawScores[altTestKey] !== undefined && rawScores[altTestKey] !== null && rawScores[altTestKey] !== '') {
      return rawScores[altTestKey];
    }
    // 3. Fuzzy match for Post Assessments (e.g., handling spelling/spacing typos like "Post Asssessment  II-I")
    if (num === 9) {
      const match = rawEntries.find(([k, v]) => {
        const kLow = k.toLowerCase().replace(/\s+/g, '');
        return kLow.includes('post') && (kLow.includes('ii-i') || kLow.includes('iii') || kLow.includes('2-1'));
      });
      if (match && match[1] !== null && match[1] !== '') return match[1];
    }
    if (num === 23) {
      const match = rawEntries.find(([k, v]) => {
        const kLow = k.toLowerCase().replace(/\s+/g, '');
        return kLow.includes('post') && (kLow.includes('ii-ii') || kLow.includes('iiii') || kLow.includes('2-2'));
      });
      if (match && match[1] !== null && match[1] !== '') return match[1];
    }
    return null;
  };

  const testList = Array.from({ length: 30 }, (_, i) => {
    const num = i + 1;
    let key = `Test ${num}`;
    if (num === 9) key = "Post Assessment II-I";
    if (num === 23) key = "Post Assessment II-II";

    const scoreVal = getScoreForTest(num, key);
    const isUnattempted = scoreVal === null || scoreVal === undefined || scoreVal === '';

    return {
      name: key,
      num,
      score: isUnattempted ? null : parseFloat(scoreVal),
      isUnattempted
    };
  });

  const attemptedCount = testList.filter(t => !t.isUnattempted).length;
  const unattemptedCount = testList.length - attemptedCount;

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      
      {/* 1. Hero Header Banner */}
      <div className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${getBandBgGlow(overall.cdc_band)} p-8 border text-white shadow-xl`}>
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-white/5 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-semibold text-blue-200 border border-white/10">
              <ShieldCheck size={14} className="text-blue-400" />
              <span>CDC Batch {student.batch_year} Explorer</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              {student.name}
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-slate-300 text-sm font-medium">
              <span>Roll: <strong className="text-white font-mono">{student.roll_number}</strong></span>
              <span>•</span>
              <span>Branch: <strong className="text-white">{student.branch}</strong></span>
            </div>
          </div>

          {/* CDC Band & Rank Hero Pill */}
          <div className="flex items-center gap-4 bg-white/10 backdrop-blur-lg p-4 rounded-2xl border border-white/15 shadow-inner">
            <div className="text-center px-4 border-r border-white/15">
              <span className="block text-xs uppercase tracking-wider text-slate-300 font-bold mb-1">CDC Band</span>
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl font-black shadow-lg border-2 ${getBandBadgeStyle(overall.cdc_band)} mx-auto`}>
                {overall.cdc_band}
              </div>
            </div>
            <div className="text-center px-4">
              <span className="block text-xs uppercase tracking-wider text-slate-300 font-bold mb-1">Batch Rank</span>
              <div className="text-2xl sm:text-3xl font-extrabold text-white flex items-center justify-center gap-1">
                <span className="text-amber-400 text-lg">#</span>
                {overall.cdc_rank || 'N/A'}
              </div>
              <span className="text-[11px] text-slate-400">overall rank</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Key Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
        {/* CDC Grade Score */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">CDC Grade Score</span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <Award size={18} />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">{overall.cdc_grade_score}%</div>
          <p className="text-xs text-slate-500 mt-1">Weighted performance metric</p>
        </div>

        {/* Avg Performance */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Avg Performance</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <TrendingUp size={18} />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">{overall.avg_performance}%</div>
          <p className="text-xs text-slate-500 mt-1">Across all attempted tests</p>
        </div>

        {/* Consistency & Participation */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Consistency Score</span>
            <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
              <BarChart3 size={18} />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">{overall.consistency_score}%</div>
          <p className="text-xs text-slate-500 mt-1">{overall.participation} Tests Attempted</p>
        </div>

        {/* CIE Score */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">CIE Internal</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <Star size={18} />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            {overall.cie_score !== null && overall.cie_score !== undefined 
              ? Math.ceil(Number(overall.cie_score) * 2) / 2 
              : 0} <span className="text-sm font-normal text-slate-400">/ 5</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">Continuous internal score</p>
        </div>
      </div>

      {/* 3. Featured Section: Semester Domain Tracks (Google Sheets File 2 Data) */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Layers className="text-blue-600" size={22} />
              <span>Semester CDC Domain Tracks</span>
            </h2>
            <p className="text-slate-500 text-sm mt-0.5">Track specializations trained during CDC weeks and semester evaluation</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Object.entries(domain_tracks || {}).map(([semKey, data]) => (
            <div key={semKey} className="bg-slate-50 rounded-2xl p-5 border border-slate-200/70 hover:border-blue-300 transition-all">
              <div className="flex justify-between items-center mb-3">
                <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-800 font-bold text-xs">
                  Semester {semKey}
                </span>
                <span className="text-xs font-semibold text-slate-500">Score</span>
              </div>
              <h4 className="font-extrabold text-slate-800 text-base mb-1">{data.domain}</h4>
              <div className="flex items-baseline justify-between mt-4 mb-1.5">
                <span className="text-xs text-slate-500 font-medium">Domain Mastery</span>
                <span className="text-lg font-extrabold text-blue-600">{data.performance}%</span>
              </div>
              <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-blue-600 h-full rounded-full transition-all duration-500" 
                  style={{ width: `${Math.min(data.performance, 100)}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Post-Assessments Highlight Card */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-950 rounded-3xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-500/20 text-blue-400 rounded-xl border border-blue-400/20">
              <Target size={24} />
            </div>
            <div>
              <h3 className="text-xl font-bold">Semester Post Assessment Milestones</h3>
              <p className="text-slate-400 text-xs">Crucial evaluation based on intensive semester track training weeks</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
            {Object.entries(post_assessments || {}).map(([title, score]) => (
              <div key={title} className="bg-white/10 backdrop-blur-md p-5 rounded-2xl border border-white/10 flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-blue-300 block mb-1">{title}</span>
                  <p className="text-sm text-slate-200">Semester Track Evaluation</p>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-black text-white">{score}%</span>
                  <span className="block text-[11px] text-emerald-400 font-medium flex items-center gap-1 justify-end">
                    <CheckCircle2 size={12} /> Evaluated
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 5. Complete Test Scores Grid (Test 1 - Test 30) */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <BookOpen className="text-blue-600" size={22} />
              <span>Complete Test Performance Breakdown (Test 1 – Test 30)</span>
            </h2>
            <p className="text-slate-500 text-sm mt-0.5">Note: Empty cells in Google Sheets denote tests unattempted by the student</p>
          </div>

          {/* Attempted vs Unattempted Badge Summary */}
          <div className="flex items-center gap-3 bg-slate-50 p-2.5 rounded-2xl border border-slate-200/80 self-start md:self-auto text-xs font-semibold">
            <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-800 rounded-xl">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              Attempted: <strong>{attemptedCount}</strong>
            </span>
            <span className="flex items-center gap-1.5 px-3 py-1 bg-slate-200 text-slate-700 rounded-xl">
              <span className="w-2 h-2 rounded-full bg-slate-400"></span>
              Unattempted: <strong>{unattemptedCount}</strong>
            </span>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 bg-slate-50/70 p-3 rounded-xl border border-slate-200/50">
          <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">Legend:</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-emerald-500 inline-block"></span> ≥80% High</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-blue-500 inline-block"></span> 50-79% Good</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-amber-500 inline-block"></span> &lt;50% Needs Imp.</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-slate-300 border border-slate-400 inline-block"></span> Unattempted (Empty Field)</span>
        </div>

        {testList.length === 0 ? (
          <p className="text-slate-500 text-sm text-center py-8">No test evaluations recorded yet.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {testList.map((t) => {
              const isPostAss = t.name.toLowerCase().includes('post') || t.num === 9 || t.num === 23;
              
              let scoreColor = 'bg-slate-100 text-slate-400 border-slate-200 border-dashed italic';
              let scoreText = 'Unattempted';

              if (!t.isUnattempted && t.score !== null) {
                scoreText = `${t.score}%`;
                if (t.score >= 80) scoreColor = 'bg-emerald-50 text-emerald-700 border-emerald-200 font-bold';
                else if (t.score >= 50) scoreColor = 'bg-blue-50 text-blue-700 border-blue-200 font-medium';
                else scoreColor = 'bg-amber-50 text-amber-700 border-amber-200';
              }

              return (
                <div 
                  key={t.name} 
                  className={`p-3 rounded-xl border flex flex-col justify-between transition-all hover:scale-[1.02] ${
                    isPostAss ? 'ring-2 ring-blue-500/40 bg-blue-50/40' : t.isUnattempted ? 'bg-slate-50/40 opacity-75' : 'bg-slate-50/80'
                  }`}
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold text-slate-600 truncate">{t.name}</span>
                    {isPostAss && (
                      <span className="text-[10px] bg-blue-600 text-white px-1.5 py-0.5 rounded font-bold shrink-0">
                        POST
                      </span>
                    )}
                  </div>
                  <div className={`text-center py-1.5 rounded-lg border text-xs sm:text-sm ${scoreColor}`}>
                    {scoreText}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
};

export default CDCDashboard;
