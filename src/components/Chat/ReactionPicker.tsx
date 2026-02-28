import React, { useState, useRef, useEffect } from 'react';
import './Chat.css';

interface ReactionPickerProps {
  onSelect: (emoji: string) => void;
  onClose: () => void;
}

// Available emoji reactions
export const REACTION_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🎉'];

export function ReactionPicker({ onSelect, onClose }: ReactionPickerProps) {
  const pickerRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        onClose();
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  // Close on escape key
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose();
      }
    }

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  return (
    <div className="reaction-picker" ref={pickerRef}>
      {REACTION_EMOJIS.map((emoji) => (
        <button
          key={emoji}
          className="reaction-picker-emoji"
          onClick={() => {
            onSelect(emoji);
            onClose();
          }}
          type="button"
          aria-label={`React with ${emoji}`}
        >
          {emoji}
        </button>
      ))}
    </div>
  );
}
