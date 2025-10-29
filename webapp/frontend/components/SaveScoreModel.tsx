// webapp/frontend/components/SaveScoreModal.tsx

"use client";

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Button } from './ui/button'; 
import { motion, AnimatePresence } from 'framer-motion';

interface SaveScoreModalProps {
    score: number;
    isOpen: boolean;
    onClose: () => void;
    // onSave should return a Promise so the modal can await completion
    onSave: (username: string, score: number) => Promise<void>; 
}

export const SaveScoreModal = ({ score, isOpen, onClose, onSave }: SaveScoreModalProps) => {
    const [step, setStep] = useState<'confirm' | 'username'>('confirm');
    const [username, setUsername] = useState('');
    const [error, setError] = useState('');
    const [mounted, setMounted] = useState(false);

    // Ensure we're on the client before rendering portal
    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    // Reset state when the modal opens
    useEffect(() => {
        if (isOpen) {
            setStep('confirm');
            setUsername('');
            setError('');
        }
    }, [isOpen]);

    const handleConfirm = (shouldSave: boolean) => {
        if (shouldSave) {
            setStep('username');
        } else {
            onClose(); // User selected No, close the modal
        }
    };

    const handleUsernameSubmit = async () => {
        if (username.trim().length < 3) {
            setError('Username must be at least 3 characters.');
            return;
        }
        setError('');
        try {
            // WAIT for the parent save to complete
            await onSave(username.trim(), score);

            // only close + redirect after save finished successfully
            onClose();

            // redirect to leaderboard (use your existing route or query param)
            // use '?showLeaderboard=true' if your leaderboard panel opens from home
            window.location.href = '/?showLeaderboard=true';
        } catch (e) {
            console.error('Failed to save score:', e);
            setError('Failed to save score. Please try again.');
        }
    };

    const modalContent = (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/70 z-[60] flex items-center justify-center p-4"
                >
                    <motion.div
                        initial={{ y: -50, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 50, opacity: 0 }}
                        className="bg-gray-800 p-6 rounded-xl shadow-2xl w-full max-w-sm border border-brawlr-red text-white"
                    >
                        <h2 className="text-2xl font-bold text-brawlr-red mb-4">
                            {step === 'confirm' ? 'Confirm Save' : 'Enter Username'}
                        </h2>

                        {/* STEP 1: Confirmation */}
                        {step === 'confirm' && (
                            <>
                                <p className="text-lg my-4">
                                    Your final score is: <span className="font-extrabold text-yellow-300">{score} 🥊</span>.
                                </p>
                                <p className="mb-6">
                                    Would you like to save this score to the leaderboard?
                                </p>
                                <div className="flex justify-end space-x-3">
                                    <Button variant="outline" onClick={() => handleConfirm(false)} className="bg-gray-700 hover:bg-gray-600">
                                        No
                                    </Button>
                                    <Button onClick={() => handleConfirm(true)} className="!bg-green-500 hover:!bg-green-600">
                                        Yes, Save!
                                    </Button>
                                </div>
                            </>
                        )}

                        {/* STEP 2: Username Input */}
                        {step === 'username' && (
                            <>
                                <p className="my-4">
                                    Enter your unique username. If you've played before, only your best score will be saved.
                                </p>
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    placeholder="Username (e.g., PunchMaster)"
                                    className="w-full p-3 rounded-lg text-black bg-gray-100 placeholder-gray-500 mb-2 focus:ring-2 focus:ring-brawlr-red"
                                    autoFocus
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleUsernameSubmit();
                                    }}
                                />
                                {error && <p className="text-red-500 text-sm">{error}</p>}
                                <div className="flex justify-end space-x-3 mt-4">
                                    <Button onClick={handleUsernameSubmit} className="!bg-brawlr-red hover:!bg-red-700" disabled={!username}>
                                        Submit Score
                                    </Button>
                                </div>
                            </>
                        )}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );

    // Render modal via portal to document.body to avoid parent transforms
    if (!mounted) return null;
    return createPortal(modalContent, document.body);
};