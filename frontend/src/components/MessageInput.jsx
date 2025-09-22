import React, { useState, useCallback } from 'react';
import { Send, Paperclip } from 'lucide-react';

const MessageInput = React.memo(({ 
  onSendMessage, 
  selectedContact,
  currentTheme 
}) => {
  // Move messageInput state to this component to isolate re-renders
  const [messageInput, setMessageInput] = useState("");

  const handleInputChange = useCallback((e) => {
    setMessageInput(e.target.value);
  }, []);

  const handleKeyPress = useCallback((e) => {
    if (e.key === "Enter" && messageInput.trim() && selectedContact) {
      onSendMessage(messageInput);
      setMessageInput(""); // Clear input after sending
    }
  }, [messageInput, selectedContact, onSendMessage]);

  const handleSendClick = useCallback(() => {
    if (messageInput.trim() && selectedContact) {
      onSendMessage(messageInput);
      setMessageInput(""); // Clear input after sending
    }
  }, [messageInput, selectedContact, onSendMessage]);

  return (
    <div
      className={`${currentTheme.secondary} p-4`}
    >
      <div className="flex items-center space-x-3">
        <Paperclip
          className={`w-6 h-6 ${currentTheme.textSecondary} cursor-pointer hover:${currentTheme.text} transition-colors duration-200`}
        />

        <div
          className={`flex-1 ${currentTheme.inputBg} rounded-lg px-4 py-2 flex items-center`}
        >
          <input
            type="text"
            placeholder="Type a message..."
            value={messageInput}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            className={`flex-1 bg-transparent ${currentTheme.text} placeholder-gray-400 focus:outline-none`}
          />
        </div>

        <button
          onClick={handleSendClick}
          className={`${currentTheme.accent} p-2 rounded-full text-white hover:opacity-90 transition-opacity`}
        >
          <Send className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  // Only re-render if selectedContact changes
  return prevProps.selectedContact?.id === nextProps.selectedContact?.id;
});

export default MessageInput;