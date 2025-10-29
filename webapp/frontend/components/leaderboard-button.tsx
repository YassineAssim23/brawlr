"use client";

import { useState, useEffect } from "react"; // <-- IMPORT useEffect
import { Button } from "./ui/button";
import { motion, AnimatePresence } from "framer-motion";
// Assuming you placed the new file here:
import { getLeaderboardData } from "../lib/firebaseClient"; 

/*
Created by: Mariah Falzon
Date: October 25, 2025
Description: Leaderboard button that toggles a bottom slide-up leaderboard panel.
*/

// Corrected Type Definition
interface LeaderboardEntry {
    id: string; 
    username: string; // Correct property name 
    score: number;    // Correct property name
    timestamp: string;
}

export const LeaderboardButton = () => {
  const [open, setOpen] = useState(false);
  // Replaced sample data with state initialized to an empty array
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Effect to fetch data when the panel opens
  useEffect(() => {
    // Only fetch if the panel is opening AND we haven't fetched data yet
    if (open) {
        // If you want to refresh the leaderboard every time it opens, remove the 'leaderboard.length === 0' check
        setIsLoading(true);
        getLeaderboardData().then((data) => {
            // The data structure now matches the LeaderboardEntry interface
            setLeaderboard(data as LeaderboardEntry[]);
            setIsLoading(false);
        }).catch((e) => {
            console.error("Failed to load leaderboard:", e);
            setIsLoading(false);
        });
    }
  }, [open]); // Dependency on 'open' state

  // Effect to check URL parameters on component mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('showLeaderboard') === 'true') {
        setOpen(true);
    }
  }, []);

  return (
    <div className="relative">
      {/* Leaderboard Button */}
      <Button
        variant="default"
        onClick={() => setOpen(!open)}
        className="
          !bg-brawlr-red 
          !text-white 
          hover:shadow-[0_0_35px_rgba(0,255,255,1)] 
          hover:scale-110 
          transition-all 
          duration-300 
          rounded-xl
        "
      >
        🏆 Leaderboard
      </Button>

      {/* Slide-Up Leaderboard */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 80, damping: 20 }}
            className="fixed bottom-0 left-0 right-0 bg-gray-900/95 text-white rounded-t-2xl shadow-2xl p-6 z-50 border-t border-brawlr-red"
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-brawlr-red">🏆 Leaderboard</h2>
              <button
                onClick={() => setOpen(false)}
                className="text-sm text-gray-300 hover:text-brawlr-red transition-colors"
              >
                ✖ Close
              </button>
            </div>

            {/* Conditional Rendering for Loading/Empty State */}
            {isLoading ? (
                <p className="text-center py-4 text-gray-400">Loading scores...</p>
            ) : leaderboard.length === 0 ? (
                <p className="text-center py-4 text-gray-400">No scores have been recorded yet.</p>
            ) : (
                <ul className="space-y-2">
                    {leaderboard.map((player, index) => (
                        <li
                            key={player.id} // <-- Use the unique Firestore ID as key
                            className="flex justify-between bg-gray-800/60 px-4 py-2 rounded-lg"
                        >
                            <span>
                                {index + 1}. **{player.username}**
                            </span>
                            <span className="font-semibold text-lg text-yellow-300">
                                {player.score} 🥊
                            </span>
                        </li>
                    ))}
                </ul>
            )}

          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};