"use client";

import { useState } from "react";
import { Button } from "./ui/button";
import { motion, AnimatePresence } from "framer-motion";

/*
Created by: Mariah Falzon
Date: October 25, 2025
Description: Leaderboard button that toggles a bottom slide-up leaderboard panel.
*/

export const LeaderboardButton = () => {
  const [open, setOpen] = useState(false);

  // Sample leaderboard data for now
  const leaderboard = [
    { name: "Mariah", score: 120 },
    { name: "Toufiq", score: 100 },
    { name: "Adanna", score: 90 },
    { name: "Alex", score: 75 },
    { name: "Jordan", score: 60 },
  ];

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

            <ul className="space-y-2">
              {leaderboard.map((player, index) => (
                <li
                  key={index}
                  className="flex justify-between bg-gray-800/60 px-4 py-2 rounded-lg"
                >
                  <span>
                    {index + 1}. {player.name}
                  </span>
                  <span className="font-semibold">{player.score} pts</span>
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
