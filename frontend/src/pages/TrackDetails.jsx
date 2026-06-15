// src/pages/TrackDetails.jsx
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Target, Clock, CheckCircle2, GraduationCap, ArrowRight, ChevronDown, ChevronUp, Calendar, Wrench, Briefcase, Zap, GitMerge, Bookmark } from 'lucide-react';
import { getTrackBySlug } from '../utils/trackLoader';
import axios from 'axios';


// --- SUB-COMPONENT 1: The Deep-Dive Accordion (Type A) ---
const ModuleAccordion = ({ modules }) => {
  const [openModuleIndex, setOpenModuleIndex] = useState(null);

  if (!modules || modules.length === 0) return null;

  // Recursive helper to render nested details cleanly (handles strings, bullets, and sub-headings)
  const renderSubDetail = (sub, sIdx, parentKey) => {
    const subKey = `${parentKey}-sub-${sIdx}`;
    if (typeof sub === 'string') {
      return (
        <div key={subKey} className="text-sm text-slate-600 pl-4 mt-1.5 leading-relaxed">
          {sub}
        </div>
      );
    }

    if (sub && typeof sub === 'object') {
      if (sub.type === 'bullet') {
        return (
          <div key={subKey} className="flex items-start gap-2.5 text-slate-600 text-sm pl-4 mt-1.5">
            <div className="mt-2 w-1.5 h-1.5 rounded-full bg-slate-300 shrink-0" />
            <span className="leading-relaxed">{sub.text}</span>
          </div>
        );
      }

      // Otherwise it's a sub-topic (e.g. roman numeral level or sub-letter level)
      return (
        <div key={subKey} className="ml-5 mt-3 pl-4 border-l-2 border-slate-100">
          {(sub.roman_numeral || sub.letter) && (
            <h5 className="text-sm font-semibold text-slate-700 flex items-start gap-2">
              <span className="text-slate-400">{(sub.roman_numeral || sub.letter)}.</span>
              {sub.title}
            </h5>
          )}
          {!sub.roman_numeral && !sub.letter && sub.title && (
            <h5 className="text-sm font-semibold text-slate-700">
              {sub.title}
            </h5>
          )}
          {/* Render nested details recursively */}
          {sub.details && sub.details.map((child, cIdx) => renderSubDetail(child, cIdx, subKey))}
        </div>
      );
    }

    return null;
  };

  return (
    <div className="space-y-4">
      {modules.map((mod, idx) => {
        const isOpen = openModuleIndex === idx;
        // Create a rock-solid unique key using the module number or index
        const modKey = `mod-${mod.module_number || idx}`;

        return (
          <div key={modKey} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm transition-all duration-300 ease-in-out">
            {/* Accordion Header */}
            <button
              onClick={() => setOpenModuleIndex(isOpen ? null : idx)}
              className="w-full px-6 py-4 flex items-center justify-between bg-slate-50 hover:bg-blue-50/50 transition-colors duration-300 ease-in-out"
            >
              <div className="flex items-center gap-4 text-left">
                <div className="bg-blue-100 text-blue-700 font-bold w-8 h-8 rounded-md flex items-center justify-center shrink-0">
                  {mod.module_number}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800">{mod.module_title}</h3>
                  {mod.hours && <span className="text-xs text-slate-500 font-medium">{mod.hours}</span>}
                </div>
              </div>
              <ChevronDown className={`shrink-0 transition-transform duration-300 ease-in-out ${isOpen ? 'rotate-180 text-blue-500' : 'text-slate-400'}`} />
            </button>

            {/* Accordion Body with transition */}
            <div 
              className={`grid transition-all duration-300 ease-in-out ${isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}
            >
              <div className="overflow-hidden">
                <div className="px-6 py-5 border-t border-slate-200 space-y-4">
                  {!mod.topics || mod.topics.length === 0 ? (
                    <p className="text-slate-400 italic text-sm text-center py-2">
                      Specific topics and objectives are defined within the detailed sub-modules or bootcamp schedules below.
                    </p>
                  ) : (
                    mod.topics.map((topic, tIdx) => {
                      const topicKey = `topic-${modKey}-${topic.letter || topic.title || tIdx}`;
                      if (typeof topic === 'string') {
                        return (
                          <h4 key={topicKey} className="text-base font-bold text-slate-800 mt-4 first:mt-0">
                            {topic}
                          </h4>
                        );
                      }

                      if (topic && typeof topic === 'object') {
                        if (topic.type === 'bullet') {
                          return (
                            <div key={topicKey} className="flex items-start gap-2.5 text-slate-600 text-sm pl-2">
                              <div className="mt-2 w-1.5 h-1.5 rounded-full bg-slate-300 shrink-0" />
                              <span className="leading-relaxed">{topic.text}</span>
                            </div>
                          );
                        }

                        // Structured topic with letter/title
                        return (
                          <div key={topicKey} className="pl-2">
                            {(topic.letter || topic.title) && (
                              <h4 className="text-base font-bold text-slate-800 flex items-start gap-2">
                                {topic.letter && <span className="text-blue-600">{topic.letter}.</span>}
                                {topic.title}
                              </h4>
                            )}
                            {topic.details && topic.details.map((sub, sIdx) => renderSubDetail(sub, sIdx, topicKey))}
                          </div>
                        );
                      }

                      return null;
                    })
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};


// --- SUB-COMPONENT 2: Day-Wise Intensive Grid (Type B) ---
// (No dynamic state, but needs clean keys)
const DayBootcamp = ({ semester }) => {
  return (
    <div className="space-y-8">
      {/* Grid of Days */}
      {semester.days && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {semester.days.map((day, idx) => (
            <div key={`day-${day.day_number || idx}`} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow duration-300 ease-in-out">
              <div className="flex items-center gap-3 mb-4 pb-3 border-b border-slate-100">
                <div className="bg-orange-50 text-orange-600 p-2 rounded-lg shrink-0">
                  <Calendar size={18} />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Day {day.day_number}</span>
                  <h4 className="text-sm font-bold text-slate-800 leading-tight">{day.day_title}</h4>
                </div>
              </div>
              <ul className="space-y-2">
                {day.topics?.map((topic, tIdx) => (
                  <li key={`daytopic-${idx}-${tIdx}`} className="text-sm text-slate-600 flex items-start gap-2">
                    <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-orange-300 shrink-0" />
                    <span>{topic}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      {/* Extra Implementation Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {semester.cad_tools && (
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <h4 className="text-xs font-bold text-slate-400 uppercase flex items-center gap-2 mb-2"><Wrench size={14}/> CAD Tools</h4>
            <p className="text-sm text-slate-700 font-medium">{semester.cad_tools}</p>
          </div>
        )}
        {semester.implementations?.length > 0 && (
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <h4 className="text-xs font-bold text-slate-400 uppercase flex items-center gap-2 mb-2"><Zap size={14}/> Implementations</h4>
            <ul className="text-sm text-slate-700 font-medium space-y-1">
              {semester.implementations.map((imp, i) => (
                <li key={`imp-${semester.semester_code || ''}-${i}`}>• {imp}</li>
              ))}
            </ul>
          </div>
        )}
        {semester.placement_support?.length > 0 && (
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <h4 className="text-xs font-bold text-slate-400 uppercase flex items-center gap-2 mb-2"><Briefcase size={14}/> Placement Support</h4>
            <ul className="text-sm text-slate-700 font-medium space-y-1">
              {semester.placement_support.map((ps, i) => (
                <li key={`ps-${semester.semester_code || ''}-${i}`}>• {ps}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};


// --- SUB-COMPONENT 3: Split-Track Tabbed Container (Type C) ---
const SubTrackTabs = ({ subTracks }) => {
  const [activeTabIndex, setActiveTabIndex] = useState(0);

  if (!subTracks || subTracks.length === 0) return null;
  const activeSubTrack = subTracks[activeTabIndex];

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm transition-all duration-300 ease-in-out">
      {/* Tab Navigation */}
      <div className="flex flex-col sm:flex-row border-b border-slate-200 bg-slate-50">
        {subTracks.map((track, idx) => (
          <button
            key={`tab-${idx}`}
            onClick={() => setActiveTabIndex(idx)}
            className={`flex-1 py-4 px-6 text-sm font-bold transition-all duration-300 ease-in-out flex items-center justify-center gap-2 
              ${activeTabIndex === idx 
                ? 'bg-white text-blue-600 border-b-2 border-blue-600' 
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'}`}
          >
            <GitMerge size={16} className={`transition-colors duration-300 ease-in-out ${activeTabIndex === idx ? 'text-blue-600' : 'text-slate-400'}`} />
            {track.sub_track_name}
          </button>
        ))}
      </div>

      {/* Wrapping the content in a key triggers a clean mount/unmount fade! */}
      <div key={`tab-content-${activeTabIndex}`} className="p-6 animate-fade-in">
        <div className="mb-6 p-4 bg-blue-50/50 rounded-xl border border-blue-100 flex flex-col md:flex-row gap-6">
          {activeSubTrack.pre_requisites?.length > 0 && (
            <div className="flex-1">
              <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Tier Prerequisites</h4>
              <ul className="text-sm text-slate-700 space-y-1">
                {activeSubTrack.pre_requisites.map((pr, i) => (
                  <li key={`prereq-${activeTabIndex}-${i}`}>• {pr}</li>
                ))}
              </ul>
            </div>
          )}
          {activeSubTrack.expected_outcomes?.length > 0 && (
            <div className="flex-1">
              <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Tier Outcomes</h4>
              <ul className="text-sm text-slate-700 space-y-1">
                {activeSubTrack.expected_outcomes.map((eo, i) => (
                  <li key={`outcome-${activeTabIndex}-${i}`}>• {eo}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
        
        {/* Re-using our ModuleAccordion here! */}
        <h4 className="text-lg font-bold text-slate-800 mb-4 mt-6">Tier Modules</h4>
        <ModuleAccordion modules={activeSubTrack.modules} />
      </div>
    </div>
  );
};

const TrackDetails = ({ user }) => {
  // 1. Grab the slug from the URL and fetch the correct JSON data
  const { slug } = useParams();
  const track = getTrackBySlug(slug);
  
  // 2. State to track which semester node is currently active
  const [activeSemesterIndex, setActiveSemesterIndex] = useState(0);

  // States for commit and bookmark persistence
  const [isCommitted, setIsCommitted] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [loadingAction, setLoadingAction] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

  // Fetch current commit/bookmark status from backend on load
  useEffect(() => {
    const fetchStudentStatus = async () => {
      if (!user) return;
      try {
        const response = await axios.get(`${API_URL}/api/student/dashboard-data`, {
          headers: { Authorization: `Bearer ${user.email}` }
        });
        const profile = response.data.student;
        setIsCommitted(profile.selected_track_id === slug);
        setIsBookmarked(profile.bookmarked_tracks?.includes(slug) || false);
      } catch (err) {
        console.error("Failed to load student status for track:", err);
      }
    };
    fetchStudentStatus();
  }, [user, slug, API_URL]);

  const handleCommit = async () => {
    if (!user) return;
    setLoadingAction(true);
    try {
      const targetTrackId = isCommitted ? null : slug;
      await axios.post(`${API_URL}/api/student/select-track`, 
        { track_id: targetTrackId },
        { headers: { Authorization: `Bearer ${user.email}` } }
      );
      setIsCommitted(!isCommitted);
    } catch (err) {
      console.error("Failed to commit to track:", err);
      alert("Error updating track selection: " + (err.response?.data?.detail || err.message));
    } finally {
      setLoadingAction(false);
    }
  };

  const handleBookmark = async () => {
    if (!user) return;
    setLoadingAction(true);
    try {
      await axios.post(`${API_URL}/api/student/bookmark-track`, 
        { track_id: slug },
        { headers: { Authorization: `Bearer ${user.email}` } }
      );
      setIsBookmarked(!isBookmarked);
    } catch (err) {
      console.error("Failed to bookmark track:", err);
      alert("Error updating bookmark: " + (err.response?.data?.detail || err.message));
    } finally {
      setLoadingAction(false);
    }
  };

  // 3. Graceful fallback if a student types a bad URL
  if (!track) {
    return (
      <div className="py-20 text-center">
        <h2 className="text-2xl font-bold text-slate-800 mb-4">Track Not Found</h2>
        <p className="text-slate-600 mb-6">The curriculum track you are looking for does not exist.</p>
        <Link to="/" className="text-blue-600 hover:underline inline-flex items-center gap-2">
          <ArrowLeft size={16} /> Back to Explore
        </Link>
      </div>
    );
  }

  // Helper variable for the currently selected semester data
  const activeSemester = track.semesters[activeSemesterIndex];

  return (
    <div className="py-6 max-w-5xl mx-auto">
      
      {/* Back Button */}
      <Link 
        to="/" 
        className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-blue-600 transition-colors mb-8"
      >
        <ArrowLeft size={16} />
        Back to Explore
      </Link>

      {/* Track Header & Actions */}
      <div className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-200 pb-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight mb-2">
            {track.track_name}
          </h1>
          <p className="text-lg text-slate-600">Select a semester below to view its curriculum and objectives.</p>
        </div>
        
        {/* Commit & Bookmark Actions */}
        <div className="flex items-center gap-3 shrink-0">
          {user ? (
            <>
              {/* Commit Button */}
              <button
                onClick={handleCommit}
                disabled={loadingAction}
                className={`px-5 py-3 rounded-xl font-bold text-sm flex items-center gap-2 transition-all duration-300 shadow-sm cursor-pointer border ${
                  isCommitted
                    ? 'border-blue-600 text-blue-600 bg-white hover:bg-blue-50/50'
                    : 'border-transparent bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/10'
                }`}
              >
                {isCommitted ? <CheckCircle2 size={18} /> : <Target size={18} />}
                {isCommitted ? 'Committed to Track' : 'Commit to Track'}
              </button>

              {/* Bookmark Button */}
              <button
                onClick={handleBookmark}
                disabled={loadingAction}
                className={`p-3 rounded-xl border font-bold transition-all duration-300 cursor-pointer ${
                  isBookmarked
                    ? 'bg-amber-500 border-amber-500 text-white shadow-sm shadow-amber-500/10'
                    : 'bg-white border-slate-200 text-slate-500 hover:border-amber-400 hover:text-amber-500'
                }`}
                title={isBookmarked ? 'Remove Bookmark' : 'Bookmark Track'}
              >
                <Bookmark size={18} className={isBookmarked ? 'fill-current' : ''} />
              </button>
            </>
          ) : (
            /* Call to action for anonymous users */
            <Link
              to="/login"
              className="px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm rounded-xl flex items-center gap-2 transition-colors border border-slate-200"
            >
              Sign in to Commit & Bookmark
            </Link>
          )}
        </div>
      </div>

      {/* Interactive Horizontal Timeline */}
      <div className="relative mb-12">
        {/* The grey background line connecting the nodes */}
        <div className="absolute top-6 left-0 right-0 h-1 bg-slate-200 -z-10 rounded-full"></div>
        
        {/* Scrollable container for nodes */}
        <div className="flex items-start justify-between gap-4 overflow-x-auto pb-4 snap-x hide-scrollbar">
          {track.semesters.map((semester, index) => {
            const isActive = index === activeSemesterIndex;
            
            return (
              <button
                key={`timeline-node-${index}`}
                onClick={() => setActiveSemesterIndex(index)}
                className="relative flex flex-col items-center min-w-[100px] snap-center group focus:outline-none"
              >
                {/* Node Circle with added transition-all duration-300 ease-in-out */}
                <div 
                  className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ease-in-out z-10 
                    ${isActive 
                      ? 'bg-blue-600 text-white ring-4 ring-blue-100 shadow-lg shadow-blue-500/40 scale-110' 
                      : 'bg-white text-slate-500 border-2 border-slate-200 group-hover:border-blue-400 group-hover:text-blue-500 group-hover:scale-105'
                    }`}
                >
                  {index + 1}
                </div>
                
                {/* Node Label */}
                <div className="mt-4 text-center">
                  <span className={`block text-sm font-bold transition-colors ${isActive ? 'text-blue-700' : 'text-slate-700'}`}>
                    {semester.semester_code}
                  </span>
                  <span className="block text-xs text-slate-500 max-w-[100px] truncate" title={semester.semester_title}>
                    {semester.semester_title}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* --- THE FADE-IN CONTAINER --- */}
      {/* By keying this container to activeSemesterIndex, React cleanly remounts it, firing our new animate-fade-in class every time the user switches a node. */}
      <div key={`semester-content-${activeSemesterIndex}`} className="animate-fade-in">
        
        {/* Selected Semester Metadata Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">

          {/* Card 1: Header, Focus & Objective */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col h-full">
            {/* Title and Hours Row */}
            <div className="flex items-start justify-between mb-5 pb-5 border-b border-slate-100 gap-4">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-3 leading-snug">
                <div className="bg-blue-50 p-2 rounded-lg text-blue-600 shrink-0">
                  <GraduationCap size={20} />
                </div>
                {activeSemester.semester_title || "Semester Details"}
              </h2>
              
              {/* Conditionally render hours if they exist */}
              {activeSemester.hours && (
                <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 text-slate-700 px-3 py-1 rounded-full text-sm font-semibold shrink-0">
                  <Clock size={14} className="text-slate-400"/>
                  {activeSemester.hours}h
                </div>
              )}
            </div>

            {/* Focus and Objective Text */}
            <div className="space-y-5 flex-1">
              {activeSemester.focus && (
                <div>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                    <Target size={14} /> Primary Focus
                  </h3>
                  <p className="text-slate-800 font-medium text-sm md:text-base leading-relaxed">
                    {activeSemester.focus}
                  </p>
                </div>
              )}

              {activeSemester.objective && (
                <div>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Objective
                  </h3>
                  <p className="text-slate-600 leading-relaxed text-sm">
                    {activeSemester.objective}
                  </p>
                </div>
              )}

              {/* Fallback for Split Tracks that lack high-level descriptions */}
              {!activeSemester.focus && !activeSemester.objective && (
                <div className="flex h-full items-center justify-center text-slate-400 italic text-sm">
                  Specific objectives are defined within the track splits below.
                </div>
              )}
            </div>
          </div>

          {/* Card 2: Prerequisites & Outcomes */}
          {/* Only render this entire card if either array actually has items */}
          {(activeSemester.pre_requisites?.length > 0 || activeSemester.expected_outcomes?.length > 0) ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col h-full space-y-6">

              {/* Prerequisites Section */}
              {activeSemester.pre_requisites?.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <ArrowRight size={14} /> Prerequisites
                  </h3>
                  <ul className="space-y-2.5">
                    {activeSemester.pre_requisites.map((prereq, idx) => (
                      <li key={`sem-prereq-${activeSemesterIndex}-${idx}`} className="flex items-start gap-2.5 text-slate-600 text-sm">
                        <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-slate-300 shrink-0" />
                        <span className="leading-relaxed">{prereq}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Outcomes Section */}
              {activeSemester.expected_outcomes?.length > 0 && (
                <div className={activeSemester.pre_requisites?.length > 0 ? "pt-6 border-t border-slate-100" : ""}>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <CheckCircle2 size={14} /> Expected Outcomes
                  </h3>
                  <ul className="space-y-3">
                    {activeSemester.expected_outcomes.map((outcome, idx) => (
                      <li key={`sem-outcome-${activeSemesterIndex}-${idx}`} className="flex items-start gap-2.5 text-slate-700 text-sm font-medium">
                        <CheckCircle2 size={16} className="text-green-500 shrink-0 mt-0.5" />
                        <span className="leading-relaxed">{outcome}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            /* Empty state matching the grid layout if a semester has no prereqs/outcomes */
            <div className="hidden lg:flex bg-slate-50/50 rounded-2xl border border-slate-200 border-dashed items-center justify-center text-slate-400 text-sm p-6">
              No specific prerequisites listed for this semester.
            </div>
          )}

        </div>

        {/* Dynamic Content Engine based on Semester Type */}
        <div className="mt-8">
          
          {/* TYPE A: Standard Modules */}
          {activeSemester.modules && activeSemester.modules.length > 0 && (
            <ModuleAccordion modules={activeSemester.modules} />
          )}

          {/* TYPE B: Day-Wise Bootcamp */}
          {activeSemester.days && activeSemester.days.length > 0 && (
            <DayBootcamp semester={activeSemester} />
          )}

          {/* TYPE C: Split Performance Tracks */}
          {activeSemester.sub_tracks && activeSemester.sub_tracks.length > 0 && (
            <SubTrackTabs subTracks={activeSemester.sub_tracks} />
          )}

          {/* Fallback if data is missing */}
          {!activeSemester.modules && !activeSemester.days && !activeSemester.sub_tracks && (
            <div className="p-8 border-2 border-dashed border-slate-200 rounded-2xl text-center text-slate-500 bg-slate-50">
              <p className="font-medium">No curriculum details available for this semester.</p>
            </div>
          )}
        </div>
      </div>

    </div>
  );
};

export default TrackDetails;
