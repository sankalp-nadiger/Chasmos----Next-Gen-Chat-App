import React, { useState, useCallback } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import CosmosBackground from './CosmosBg';

const PollCreationModal = ({ 
  isOpen, 
  onClose, 
  onCreatePoll, 
  effectiveTheme,
  isLoading = false 
}) => {
  const [question, setQuestion] = useState("");
  const [description, setDescription] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [allowMultipleVotes, setAllowMultipleVotes] = useState(false);
  const [error, setError] = useState("");

  const handleOptionChange = useCallback((index, value) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  }, [options]);

  const addOption = useCallback(() => {
    if (options.length < 6) {
      setOptions([...options, ""]);
    }
  }, [options]);

  const removeOption = useCallback((index) => {
    if (options.length > 2) {
      const newOptions = options.filter((_, i) => i !== index);
      setOptions(newOptions);
    }
  }, [options]);

  const handleCreatePoll = useCallback(() => {
    setError("");

    if (!question.trim()) {
      setError("Poll question is required");
      return;
    }

    const nonEmptyOptions = options.filter(opt => opt.trim());
    if (nonEmptyOptions.length < 2) {
      setError("At least 2 options are required");
      return;
    }

    onCreatePoll({
      question: question.trim(),
      description: description.trim(),
      options: nonEmptyOptions,
      allowMultipleVotes
    });

    // Reset form
    setQuestion("");
    setDescription("");
    setOptions(["", ""]);
    setAllowMultipleVotes(false);
    setError("");
  }, [question, description, options, allowMultipleVotes, onCreatePoll]);

  const handleClose = useCallback(() => {
    setQuestion("");
    setDescription("");
    setOptions(["", ""]);
    setAllowMultipleVotes(false);
    setError("");
    onClose();
  }, [onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={`relative ${effectiveTheme.secondary} rounded-lg shadow-2xl w-full max-w-md border ${effectiveTheme.border}`}
          >
            {/* White background overlay behind the cosmos background for day mode */}
            <div className="absolute inset-0 rounded-lg bg-white z-0 pointer-events-none" />
            {/* Cosmos background in day mode, subtle overlay */}
            <div className="absolute inset-0 rounded-lg z-10 pointer-events-none overflow-hidden">
              <CosmosBackground theme="light" opacity={0.22} />
            </div>
            <div className="relative z-20">
            {/* Header */}
            <div className={`flex items-center justify-between p-5 border-b ${effectiveTheme.border}`}>
              <h2 className={`text-xl font-semibold ${effectiveTheme.text}`}>Create Poll</h2>
              <button
                onClick={handleClose}
                className={`p-1 rounded-lg transition-colors ${effectiveTheme.hover}`}
              >
                <X className={`w-5 h-5 ${effectiveTheme.text}`} />
              </button>
            </div>

            {/* Body */}
            <div className={`p-5 max-h-96 overflow-y-auto`}>
              {/* Question */}
              <div className="mb-4">
                <label className={`block text-sm font-medium ${effectiveTheme.text} mb-2`}>
                  Question
                </label>
                <input
                  type="text"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="What's your poll question?"
                  className={`w-full px-3 py-2 rounded-lg border ${effectiveTheme.border} ${effectiveTheme.secondary} ${effectiveTheme.text} outline-none transition-colors focus:ring-2 focus:ring-blue-500`}
                />
              </div>

              {/* Description */}
              <div className="mb-4">
                <label className={`block text-sm font-medium ${effectiveTheme.text} mb-2`}>
                  Description (Optional)
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Add a caption or description..."
                  className={`w-full px-3 py-2 rounded-lg border ${effectiveTheme.border} ${effectiveTheme.secondary} ${effectiveTheme.text} outline-none transition-colors focus:ring-2 focus:ring-blue-500 resize-none h-16`}
                />
              </div>

              {/* Options */}
              <div className="mb-4">
                <label className={`block text-sm font-medium ${effectiveTheme.text} mb-2`}>
                  Options ({options.filter(o => o.trim()).length}/6)
                </label>
                <div className="space-y-2">
                  {options.map((option, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <span className={`text-sm font-medium ${effectiveTheme.textSecondary} w-6`}>
                        {String.fromCharCode(65 + index)}.
                      </span>
                      <input
                        type="text"
                        value={option}
                        onChange={(e) => handleOptionChange(index, e.target.value)}
                        placeholder={`Option ${index + 1}`}
                        className={`flex-1 px-3 py-2 rounded-lg border ${effectiveTheme.border} ${effectiveTheme.secondary} ${effectiveTheme.text} outline-none transition-colors focus:ring-2 focus:ring-blue-500`}
                      />
                      {options.length > 2 && (
                        <button
                          onClick={() => removeOption(index)}
                          className="p-2 rounded-lg hover:bg-red-500/20 transition-colors text-red-500"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {options.length < 6 && (
                  <button
                    onClick={addOption}
                    className={`mt-3 w-full py-2 rounded-lg border ${effectiveTheme.border} ${effectiveTheme.text} flex items-center justify-center gap-2 hover:${effectiveTheme.hover} transition-colors`}
                  >
                    <Plus className="w-4 h-4" />
                    Add Option
                  </button>
                )}
              </div>

              {/* Multiple Votes */}
              <div className="mb-4 flex items-center gap-3">
                <input
                  type="checkbox"
                  id="multipleVotes"
                  checked={allowMultipleVotes}
                  onChange={(e) => setAllowMultipleVotes(e.target.checked)}
                  className="w-4 h-4 rounded cursor-pointer"
                />
                <label htmlFor="multipleVotes" className={`text-sm ${effectiveTheme.text} cursor-pointer`}>
                  Allow users to vote for multiple options
                </label>
              </div>

              {/* Error */}
              {error && (
                <div className="mb-4 p-3 rounded-lg bg-red-500/20 border border-red-500/50">
                  <p className="text-sm text-red-500">{error}</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className={`flex items-center justify-end gap-3 p-5 border-t ${effectiveTheme.border}`}>
              <button
                onClick={handleClose}
                className={`px-4 py-2 rounded-lg transition-colors ${effectiveTheme.hover}`}
                disabled={isLoading}
              >
                <span className={effectiveTheme.text}>Cancel</span>
              </button>
              <button
                onClick={handleCreatePoll}
                disabled={isLoading || !question.trim()}
                className={`px-6 py-2 rounded-lg font-medium text-white transition-colors ${
                  isLoading || !question.trim()
                    ? 'bg-blue-500/50 cursor-not-allowed'
                    : 'bg-blue-500 hover:bg-blue-600'
                }`}
              >
                {isLoading ? 'Creating...' : 'Create Poll'}
              </button>
            </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default PollCreationModal;
