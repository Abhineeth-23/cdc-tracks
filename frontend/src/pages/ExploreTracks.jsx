// src/pages/ExploreTracks.jsx
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, ArrowRight, Layers, Search, XCircle, Award } from 'lucide-react';
import { getAllTracksSummary, isTrackPreferredForBranch } from '../utils/trackLoader';

const ExploreTracks = ({ user }) => {
  // Fetch our high-level summary array
  const tracks = getAllTracksSummary();
  
  // State to hold the user's current search input
  const [searchQuery, setSearchQuery] = useState('');

  // Filter the tracks array based on the search query
  const filteredTracks = tracks.filter((track) => {
    const lowerCaseQuery = searchQuery.toLowerCase();
    const matchName = track.track_name?.toLowerCase().includes(lowerCaseQuery);
    const matchFocus = track.primary_focus?.toLowerCase().includes(lowerCaseQuery);
    
    // Return true if either the title or the focus tag contains the search string
    return matchName || matchFocus;
  });

  return (
    <div className="py-6">
      {/* Page Header */}
      <div className="mb-8 text-center sm:text-left flex flex-col sm:flex-row sm:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Explore Learning Tracks
          </h1>
          <p className="mt-3 text-lg text-slate-600 max-w-2xl">
            Discover your path, review semester objectives, and find the perfect curriculum to prepare for your career.
          </p>
        </div>

        {/* Search Bar Container */}
        <div className="relative w-full sm:w-72 md:w-96 shrink-0">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={18} className="text-slate-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow shadow-sm"
            placeholder="Search tracks or topics..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Conditional Rendering: Grid vs. Empty State */}
      {filteredTracks.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTracks.map((track) => (
            <Link
              key={track.slug}
              to={`/track/${track.slug}`}
              className="group flex flex-col h-full bg-white rounded-xl border border-slate-200 shadow-sm hover:-translate-y-1 hover:shadow-lg hover:border-blue-300 transition-all duration-300"
            >
              {/* Card Content */}
              <div className="p-6 flex-1">
                <div className="flex items-start gap-4 mb-4">
                  <div className="bg-blue-50 p-3 rounded-lg text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300 shrink-0">
                    <BookOpen size={24} />
                  </div>
                  <h2 className="text-xl font-bold text-slate-800 leading-snug line-clamp-2">
                    {track.track_name || 'Untitled Track'}
                  </h2>
                </div>
                
                <div className="space-y-4 mt-6">
                  <div className="flex items-start gap-2 text-sm text-slate-600">
                    <Layers size={16} className="mt-0.5 shrink-0 text-slate-400" />
                    <span className="line-clamp-2">
                      <strong className="text-slate-800 font-medium">Focus: </strong> 
                      {track.primary_focus}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between flex-wrap gap-2 pt-1 border-t border-slate-100/50">
                    <div className="inline-flex items-center px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 text-xs font-semibold">
                      {track.total_semesters} {track.total_semesters === 1 ? 'Semester' : 'Semesters'}
                    </div>
                    
                    <span className="text-xs font-medium text-slate-500">
                      Preferably for: <strong className="text-blue-600 font-bold">{track.preferred_branch}</strong>
                    </span>
                  </div>

                  {user && isTrackPreferredForBranch(track.slug, user.branch) && (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-100 w-full justify-center mt-2 animate-pulse">
                      <Award size={13} className="shrink-0" />
                      Recommended for your branch
                    </div>
                  )}
                </div>
              </div>

              {/* Call to Action Footer */}
              <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between text-blue-600 font-semibold bg-slate-50/50 rounded-b-xl">
                <span>Explore Journey</span>
                <ArrowRight size={18} className="transform group-hover:translate-x-1.5 transition-transform duration-300" />
              </div>
            </Link>
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="flex flex-col items-center justify-center py-16 px-4 bg-white border border-slate-200 border-dashed rounded-xl shadow-sm">
          <div className="bg-slate-50 p-4 rounded-full mb-4">
            <XCircle size={32} className="text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-1">No tracks found</h3>
          <p className="text-slate-500 text-center max-w-sm">
            We couldn't find any tracks matching "{searchQuery}". Try adjusting your search terms or clearing the filter.
          </p>
          <button 
            onClick={() => setSearchQuery('')}
            className="mt-6 text-blue-600 font-medium hover:text-blue-700 hover:underline transition-colors"
          >
            Clear search
          </button>
        </div>
      )}
    </div>
  );
};

export default ExploreTracks;