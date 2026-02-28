import React from 'react';
import './Chat.css';

export interface ReactionGroup {
  emoji: string;
  count: number;
  hasReacted: boolean; // whether current user has reacted with this emoji
}

interface ReactionDisplayProps {
  reactions: ReactionGroup[];
  onToggle: (emoji: string) => void;
  onAddReaction: () => void;
}

export function ReactionDisplay({ reactions, onToggle, onAddReaction }: ReactionDisplayProps) {
  if (reactions.length === 0) {
    return (
      <div className="reaction-display">
        <button
          className="reaction-add-button"
          onClick={onAddReaction}
          type="button"
          aria-label="Add reaction"
        >
          😀+
        </button>
      </div>
    );
  }

  return (
    <div className="reaction-display">
      {reactions.map(({ emoji, count, hasReacted }) => (
        <button
          key={emoji}
          className={`reaction-badge ${hasReacted ? 'reaction-badge-active' : ''}`}
          onClick={() => onToggle(emoji)}
          type="button"
          aria-label={`${emoji} ${count} reaction${count !== 1 ? 's' : ''}${hasReacted ? ', you reacted' : ''}`}
        >
          <span className="reaction-emoji">{emoji}</span>
          <span className="reaction-count">{count}</span>
        </button>
      ))}
      <button
        className="reaction-add-button"
        onClick={onAddReaction}
        type="button"
        aria-label="Add reaction"
      >
        +
      </button>
    </div>
  );
}
