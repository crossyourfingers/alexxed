import React, { useState, useRef, useCallback, KeyboardEvent } from 'react';
import { MAX_MESSAGE_LENGTH } from '../../utils/constants';
import './Chat.css';

interface MessageInputProps {
  onSend: (text: string) => void;
  placeholder?: string;
  disabled?: boolean;
  showFormatHint?: boolean;
  maxLength?: number;
}

export function MessageInput({
  onSend,
  placeholder = 'Type a message...',
  disabled = false,
  showFormatHint = true,
  maxLength = MAX_MESSAGE_LENGTH,
}: MessageInputProps) {
  const [value, setValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  const isOverLimit = value.length > maxLength;
  const isNearLimit = value.length > maxLength * 0.9; // Show warning at 90%

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const trimmed = value.trim();
      if (!trimmed || disabled || isOverLimit) return;
      onSend(trimmed);
      setValue('');
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    },
    [value, disabled, isOverLimit, onSend]
  );

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Submit on Enter (without Shift)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value);
    // Auto-resize textarea
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
  };

  return (
    <div className="chat-input-container">
      {showFormatHint && (
        <div className="formatting-hint">
          <span><code>**bold**</code></span>
          <span><code>*italic*</code></span>
          <span><code>`code`</code></span>
          <span><code>[link](url)</code></span>
        </div>
      )}
      <form className="chat-input-form" onSubmit={handleSubmit}>
        <textarea
          ref={textareaRef}
          className={`chat-input ${isOverLimit ? 'over-limit' : ''}`}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          rows={1}
          aria-invalid={isOverLimit}
        />
        <div className="chat-input-footer">
          {(isNearLimit || isOverLimit) && (
            <span className={`char-count ${isOverLimit ? 'over-limit' : 'near-limit'}`}>
              {value.length}/{maxLength}
            </span>
          )}
          <button
            type="submit"
            className="chat-send-btn"
            disabled={disabled || !value.trim() || isOverLimit}
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
}
