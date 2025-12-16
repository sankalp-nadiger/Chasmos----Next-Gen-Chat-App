import React, { useState, useCallback, useMemo } from 'react';
import { ChevronDown, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const PollMessage = React.memo(({
  poll,
  isOwnMessage,
  effectiveTheme,
  currentUserId,
  onVote,
  onRemoveVote,
  onClosePoll,
  isLoading = false
}) => {
  const [showVotes, setShowVotes] = useState(false);
  const [expandedOptionId, setExpandedOptionId] = useState(null);

  // Calculate total votes
  const totalVotes = useMemo(() => {
    return poll.options.reduce((sum, option) => sum + option.votes.length, 0);
  }, [poll.options]);

  // Check if current user has voted
  const userVote = useMemo(() => {
    return poll.options.find(option =>
      option.votes.some(vote => vote.user._id === currentUserId || vote.user === currentUserId)
    );
  }, [poll.options, currentUserId]);

  const handleVote = useCallback((optionId) => {
    if (!poll.isClosed) {
      onVote(poll._id, optionId);
    }
  }, [poll._id, poll.isClosed, onVote]);

  const handleRemoveVote = useCallback((optionId) => {
    onRemoveVote(poll._id, optionId);
  }, [poll._id, onRemoveVote]);

  const handleClosePoll = useCallback(() => {
    onClosePoll(poll._id);
  }, [poll._id, onClosePoll]);

  const toggleVotesExpanded = useCallback((optionId) => {
    setExpandedOptionId(expandedOptionId === optionId ? null : optionId);
  }, [expandedOptionId]);

  const hasVoted = userVote !== undefined;
  const pollCreator = poll.createdBy?._id || poll.createdBy;
  const isCreator = pollCreator === currentUserId;
  
  // computed classes to ensure day-mode readability for own messages
  // explicit color choices for day mode to ensure readable contrast on light bubbles
  const ownTextClass = isOwnMessage
    ? (effectiveTheme.mode === 'dark' ? 'text-white' : 'text-gray-900')
    : effectiveTheme.text;
  const ownTextSecondaryClass = isOwnMessage
    ? (effectiveTheme.mode === 'dark' ? 'text-white/80' : 'text-gray-600')
    : effectiveTheme.textSecondary;
  const ownRingClass = isOwnMessage
    ? (effectiveTheme.mode === 'dark' ? 'ring-2 ring-white/50' : 'ring-2 ring-gray-200')
    : 'ring-2 ring-blue-500';
  // use a stronger progress background in day mode for contrast
  const progressBgClass = isOwnMessage
    ? (effectiveTheme.mode === 'dark' ? 'bg-white' : 'bg-blue-500')
    : 'bg-blue-500';
  const votedBadgeBgClass = isOwnMessage
    ? (effectiveTheme.mode === 'dark' ? 'bg-white/30' : 'bg-blue-500')
    : 'bg-blue-500';
  const removeVoteBtnClass = isOwnMessage
    ? (effectiveTheme.mode === 'dark' ? 'text-white/50 hover:text-white' : 'text-gray-600 hover:text-gray-800')
    : 'text-gray-500 hover:text-gray-700';
  const creatorButtonClass = isOwnMessage
    ? (effectiveTheme.mode === 'dark' ? 'text-white/70 hover:text-white hover:bg-white/10' : 'text-gray-600 hover:text-gray-800 hover:bg-white/10')
    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-500/10';
  const viewVotesClass = isOwnMessage
    ? (effectiveTheme.mode === 'dark' ? 'text-white/70 hover:text-white' : 'text-gray-700 hover:text-gray-900')
    : 'text-blue-500 hover:text-blue-600';

  return (
    <div className={`rounded-lg p-4 max-w-sm`}>
      {/* Question */}
      <h3 className={`font-semibold text-base mb-2 ${ownTextClass}`}>
        {poll.question}
      </h3>

      {/* Description */}
      {poll.description && (
        <p className={`text-sm mb-3 ${ownTextSecondaryClass}`}>
          {poll.description}
        </p>
      )}

      {/* Options */}
      <div className="space-y-2 mb-3">
        {poll.options.map((option, index) => {
          const voteCount = option.votes.length;
          const percentage = totalVotes > 0 ? (voteCount / totalVotes) * 100 : 0;
          const hasCurrentUserVoted = option.votes.some(
            vote => (vote.user?._id || vote.user) === currentUserId
          );

          return (
            <div key={option._id} className="space-y-1">
              {/* Option Button */}
              <button
                onClick={() => handleVote(option._id)}
                disabled={poll.isClosed || isLoading}
                className={`w-full text-left p-3 rounded-lg transition-all relative overflow-hidden ${
                  hasCurrentUserVoted
                    ? ownRingClass
                    : (isOwnMessage ? 'hover:bg-white/10' : 'border border-gray-300/20 hover:bg-transparent')
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {/* Background progress bar */}
                <div
                  className={`absolute inset-y-0 left-0 transition-all opacity-30 ${progressBgClass}`}
                  style={{ width: `${percentage}%` }}
                />

                {/* Content */}
                <div className="relative flex items-center justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className={`font-medium truncate ${ownTextClass}`}>
                      {String.fromCharCode(65 + index)}. {option.text}
                    </p>
                    <p className={`text-xs mt-1 ${isOwnMessage ? ownTextSecondaryClass : effectiveTheme.textSecondary}`}>
                      {voteCount} {voteCount === 1 ? 'vote' : 'votes'} ({Math.round(percentage)}%)
                    </p>
                  </div>

                  {/* Checkmark for voted option */}
                  {hasCurrentUserVoted && (
                    <div className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center ${votedBadgeBgClass}`}>
                      <span className="text-xs font-bold text-white">✓</span>
                    </div>
                  )}
                </div>
              </button>

              {/* View Votes Button */}
              {voteCount > 0 && (
                <button
                  onClick={() => toggleVotesExpanded(option._id)}
                  className={`flex items-center gap-1 text-xs px-2 py-1 rounded transition-colors ${viewVotesClass}`}
                >
                  <ChevronDown
                    className={`w-3 h-3 transition-transform flex-shrink-0 ${
                      expandedOptionId === option._id ? 'rotate-180' : ''
                    }`}
                  />
                  View votes
                </button>
              )}

              {/* Expanded votes list */}
              <AnimatePresence>
                {expandedOptionId === option._id && voteCount > 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className={`mt-2 rounded-lg p-2 space-y-1`}
                  >
                    {option.votes.map((vote) => (
                      <div
                        key={vote._id}
                        className={`flex items-center justify-between px-2 py-1 rounded text-xs gap-2`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          {vote.user?.avatar && (
                            <img
                              src={vote.user.avatar}
                              alt={vote.user.name}
                              className="w-5 h-5 rounded-full object-cover flex-shrink-0"
                            />
                          )}
                                <span className={`truncate ${isOwnMessage ? ownTextClass : effectiveTheme.text}`}>
                            {String((vote.user?._id || vote.user) || '') === String(currentUserId) ? 'You' : (vote.user?.name || 'Anonymous')}
                          </span>
                        </div>
                        {/* Remove vote button for own message */}
                              {hasCurrentUserVoted && currentUserId === (vote.user?._id || vote.user) && !poll.isClosed && (
                                <button
                                  onClick={() => handleRemoveVote(option._id)}
                                  className={`flex-shrink-0 ${removeVoteBtnClass} text-xs`}
                                  title="Remove vote"
                                >
                                  ✕
                                </button>
                              )}
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      {/* Footer */}
            <div className={`flex items-center justify-between pt-2 border-t ${isOwnMessage ? (effectiveTheme.mode === 'dark' ? 'border-white/20' : effectiveTheme.border) : effectiveTheme.border}`}>
              <span className={`text-xs ${isOwnMessage ? ownTextSecondaryClass : effectiveTheme.textSecondary}`}>
          {totalVotes} {totalVotes === 1 ? 'vote' : 'votes'}
          {poll.isClosed && ' • Closed'}
        </span>

        {isCreator && !poll.isClosed && (
          <button
            onClick={handleClosePoll}
            disabled={isLoading}
                  className={`text-xs font-medium px-2 py-1 rounded transition-colors flex items-center gap-1 ${creatorButtonClass} disabled:opacity-50`}
          >
            <Lock className="w-3 h-3" />
            Close
          </button>
        )}
      </div>

      {poll.isClosed && (
        <div className={`mt-2 p-2 rounded text-xs text-center ${
          isOwnMessage ? 'text-white/70' : 'text-gray-500'
        }`}>
          This poll has ended
        </div>
      )}
    </div>
  );
});

PollMessage.displayName = 'PollMessage';

export default PollMessage;
