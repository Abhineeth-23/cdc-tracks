// src/utils/trackLoader.js

// 1. Import all 7 JSON files
// Adjust the filenames if they differ from track-1.json, track-2.json, etc.
import track1 from '../data/track-json/track_cloud_devops_security.json';
import track2 from '../data/track-json/track_data_analyst_scientist_ai_ml.json';
import track3 from '../data/track-json/track_design_cae_manufacturing.json';
import track4 from '../data/track-json/track_ev_power_automation.json';
import track5 from '../data/track-json/track_full_stack_developer.json';
import track6 from '../data/track-json/track_se_sd.json';
import track7 from '../data/track-json/track_vlsi_semiconductor.json';

// Group them into an array for processing
const rawTracks = [track1, track2, track3, track4, track5, track6, track7];

// 2. Helper function to create clean, URL-friendly slugs
export const generateSlug = (name) => {
  if (!name) return 'unknown-track';
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric chars with hyphens
    .replace(/(^-|-$)+/g, '');   // Trim leading and trailing hyphens
};

// 3. Pre-process the array to inject the slug into the full data payload
const tracksWithSlugs = rawTracks.map(track => ({
  ...track,
  slug: generateSlug(track.track_name)
}));

// 4. Function for the 'Explore Tracks' page (High-level summary array)
export const getAllTracksSummary = () => {
  return tracksWithSlugs.map(track => {
    // Because your schema is polymorphic (Type A, B, C), we extract a primary 
    // focus from the first semester, or provide a logical fallback.
    const firstSemester = track.semesters?.[0];
    const primaryFocus = firstSemester?.focus 
      || firstSemester?.semester_title 
      || 'Comprehensive Training';

    return {
      track_name: track.track_name,
      slug: track.slug,
      total_semesters: track.semesters?.length || 0,
      primary_focus: primaryFocus
    };
  });
};

// 5. Function for the 'Track Details' page (Returns the deeply nested JSON object)
export const getTrackBySlug = (slug) => {
  const foundTrack = tracksWithSlugs.find(track => track.slug === slug);
  return foundTrack || null; // Returns null if someone types a bad URL
};