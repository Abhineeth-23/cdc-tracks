// src/pages/Dashboard.jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Award, ChevronRight, Bookmark, AlertCircle, Compass, ArrowRight, Sparkles } from 'lucide-react';
import axios from 'axios';
import { getAllTracksSummary, getBranchDisplayName, isTrackPreferredForBranch } from '../utils/trackLoader';

const Dashboard = ({ user }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError('');
        // Make the API call with the email in Authorization header
        const response = await axios.get(`${API_URL}/api/student/dashboard-data`, {
          headers: {
            'Authorization': `Bearer ${user.email}`
          }
        });
        setData(response.data);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError(
          err.response?.data?.detail || 
          'Failed to load dashboard details from the server.'
        );
      } finally {
        setLoading(false);
      }
    };

    if (user && user.email) {
      fetchDashboardData();
    }
  }, [user, API_URL]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-600 font-semibold text-sm">Loading your dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto my-12 bg-red-50 border border-red-200 text-red-700 p-6 rounded-2xl flex items-start gap-4">
        <AlertCircle size={24} className="shrink-0 mt-0.5" />
        <div>
          <h3 className="font-bold text-lg mb-1">Error Loading Dashboard</h3>
          <p className="text-sm leading-relaxed mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const student = data?.student || user;
  const currentYear = data?.current_year || 1;
  const selectedTrack = data?.selected_track;
  const bookmarkedTracks = data?.bookmarked_tracks_data || [];

  const allTracks = getAllTracksSummary();
  const recommendedTracks = allTracks.filter(t => isTrackPreferredForBranch(t.slug, student.branch));
  const branchDisplayName = getBranchDisplayName(student.branch);

  // Convert current year integer to ordinal word (e.g. 1 -> 1st Year)
  const formatYear = (yr) => {
    const map = { 1: '1st Year', 2: '2nd Year', 3: '3rd Year', 4: '4th Year' };
    return map[yr] || `${yr}th Year`;
  };

  return (
    <div className="py-6 space-y-8 animate-fade-in">
      
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-6 md:p-8 text-white shadow-md relative overflow-hidden">
        {/* Decorative Circles */}
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-xl"></div>
        <div className="absolute -right-20 -bottom-20 w-60 h-60 bg-white/5 rounded-full blur-2xl"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <span className="text-blue-100 text-xs font-bold uppercase tracking-widest px-2.5 py-1 bg-white/10 rounded-full">
              Student Dashboard
            </span>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mt-3">
              Welcome back, {student.name ? student.name.split(' ')[0] : 'Student'}
            </h1>
            <p className="text-blue-100 text-sm md:text-base mt-2 max-w-xl">
              Track your career learning objectives, view your curriculum, and manage committed tracks below.
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/10 shrink-0 text-center sm:text-left">
            <span className="text-xs text-blue-200 block font-bold uppercase">Current Academic Year</span>
            <span className="text-2xl font-black block tracking-tight mt-0.5">
              {formatYear(currentYear)}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Academic Metadata Profile Card */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col">
            
            {/* Profile Avatar & Header */}
            <div className="flex flex-col items-center mb-6 pb-6 border-b border-slate-100">
              {student.picture ? (
                <img
                  src={student.picture}
                  alt="Student Avatar"
                  className="w-20 h-20 rounded-full border-4 border-blue-50 object-cover shadow-sm mb-3"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-2xl font-black mb-3 border-4 border-blue-50 shadow-sm">
                  {student.name 
                    ? student.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() 
                    : student.roll_number?.slice(-2) || 'ST'}
                </div>
              )}
              <h3 className="font-bold text-xl text-slate-800 leading-snug">{student.name || 'Student'}</h3>
              <p className="text-slate-500 text-xs mt-1 font-bold tracking-wider uppercase">
                {formatYear(currentYear)} • {student.branch}
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">Roll Number</span>
                <span className="text-slate-800 font-bold block">{student.roll_number}</span>
              </div>
              
              <div>
                <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">Email Address</span>
                <span className="text-slate-800 font-semibold block break-all">{student.email}</span>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">Department / Branch</span>
                  <span className="text-slate-800 font-bold block">{student.branch}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">Admission Type</span>
                  <span className="text-slate-800 font-bold block">{student.admission_type}</span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">Joining Year</span>
                  <span className="text-slate-800 font-semibold block">{student.joining_year}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">Graduation Year</span>
                  <span className="text-slate-800 font-semibold block">{student.graduation_year}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Columns: Active Track & Bookmarks */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Active Track Section */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2.5 pb-4 border-b border-slate-100 mb-6">
              <Award size={18} className="text-blue-600" />
              Committed Learning Track
            </h2>

            {selectedTrack ? (
              <div className="bg-blue-50/40 rounded-xl p-5 border border-blue-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 hover:shadow-md transition-shadow duration-300">
                <div className="space-y-2">
                  <div className="bg-blue-600 text-white p-2.5 rounded-lg w-10 h-10 flex items-center justify-center shrink-0">
                    <BookOpen size={20} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-800 mt-2">
                      {selectedTrack.track_name}
                    </h3>
                    <p className="text-slate-600 text-sm mt-1">
                      You are committed to this pathway. Review specific semester schedules or day-wise bootcamps.
                    </p>
                  </div>
                </div>

                <Link
                  to={`/track/${selectedTrack.slug}`}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold flex items-center gap-2 transition-colors shrink-0 shadow-sm shadow-blue-500/20"
                >
                  View Curriculum
                  <ChevronRight size={16} />
                </Link>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 px-4 border-2 border-dashed border-slate-200 rounded-xl text-center bg-slate-50/50">
                <div className="bg-slate-100 p-3.5 rounded-full text-slate-400 mb-4">
                  <Compass size={24} />
                </div>
                <h3 className="text-base font-bold text-slate-800 mb-1">No Active Track Selected</h3>
                <p className="text-slate-500 text-sm max-w-sm mb-6">
                  You haven't committed to a learning path yet. Browse through the available tracks to select one.
                </p>
                <Link
                  to="/"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-lg transition-colors shadow-sm"
                >
                  Explore Available Tracks
                  <ArrowRight size={16} />
                </Link>
              </div>
            )}
          </div>

          {/* Recommended Tracks Section */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2.5 pb-4 border-b border-slate-100 mb-6">
              <Sparkles size={18} className="text-emerald-600 animate-pulse" />
              Recommended Tracks for Your Branch ({branchDisplayName})
            </h2>

            {recommendedTracks.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {recommendedTracks.map((bk) => (
                  <Link
                    key={bk.slug}
                    to={`/track/${bk.slug}`}
                    className="flex flex-col justify-between p-4 border border-slate-200 rounded-xl hover:border-emerald-400 hover:shadow-md hover:bg-emerald-50/10 transition-all duration-300 group"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div className="bg-emerald-50 p-2 rounded-lg text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors duration-300">
                          <BookOpen size={18} />
                        </div>
                        <span className="font-bold text-slate-700 text-sm group-hover:text-emerald-800 transition-colors">
                          {bk.track_name}
                        </span>
                      </div>
                      <ChevronRight size={16} className="text-slate-400 mt-1 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all shrink-0" />
                    </div>
                    
                    <div className="text-[11px] text-slate-500 mt-3 font-medium">
                      Focus: {bk.primary_focus}
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-slate-500 text-sm italic py-2">
                No custom recommendations available for branch {branchDisplayName}.
              </p>
            )}
          </div>

          {/* Bookmarks Section */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2.5 pb-4 border-b border-slate-100 mb-6">
              <Bookmark size={18} className="text-blue-600" />
              Bookmarked Tracks ({bookmarkedTracks.length})
            </h2>

            {bookmarkedTracks.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {bookmarkedTracks.map((bk) => (
                  <Link
                    key={bk.id}
                    to={`/track/${bk.id}`}
                    className="flex items-center justify-between p-4 border border-slate-200 rounded-xl hover:border-blue-400 hover:shadow-md hover:bg-slate-50/30 transition-all duration-300"
                  >
                    <div className="flex items-center gap-3">
                      <div className="bg-amber-50 p-2 rounded-lg text-amber-600">
                        <Bookmark size={18} />
                      </div>
                      <span className="font-bold text-slate-700 text-sm truncate max-w-[180px] md:max-w-[220px]">
                        {bk.track_name}
                      </span>
                    </div>
                    <ChevronRight size={16} className="text-slate-400" />
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-slate-500 text-sm italic py-4">
                No tracks bookmarked yet. When viewing details, toggle the bookmark icon to list them here.
              </p>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default Dashboard;
