
import React, { useState, useRef, useEffect } from 'react';
import type { Message } from '../types/types';
import { SendIcon, UserIcon, BotIcon, LoadingSpinner } from '../utils/icons';

interface ChatBoxProps {
  history: Message[];
  onSendMessage: (message: string) => void;
  isLoading: boolean;
}

interface FlyingMessage {
  text: string;
  id: string;
}

const ChatBox: React.FC<ChatBoxProps> = ({ history, onSendMessage, isLoading }) => {
  const [newMessage, setNewMessage] = useState('');
  const [flyingMessages, setFlyingMessages] = useState<FlyingMessage[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const chatMessagesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history]);

  const getInputPosition = () => {
    if (inputRef.current) {
      const rect = inputRef.current.getBoundingClientRect();
      return {
        left: rect.left,
        top: rect.top,
        width: rect.width
      };
    }
    return { left: 0, top: 0, width: 0 };
  };

  const handleSend = () => {
    if (newMessage.trim() && !isLoading) {
      const messageText = newMessage.trim();
      const messageId = Date.now().toString();
      
      // Add flying message
      setFlyingMessages(prev => [...prev, { text: messageText, id: messageId }]);
      setNewMessage('');
      
      // Remove flying message and add to chat after animation
      setTimeout(() => {
        setFlyingMessages(prev => prev.filter(msg => msg.id !== messageId));
        onSendMessage(messageText);
      }, 600);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !isLoading) {
      handleSend();
    }
  };

  return (
    <div className="chat-container">
      <h2 className="h5">Follow-up Questions</h2>
      <div ref={chatMessagesRef} className="chat-messages-wrapper">
        {history.map((msg, index) => (
          <div key={index} className={`chat-message ${msg.role === 'user' ? 'user' : 'model'}`}>
            {msg.role === 'model' && (
              <div className="chat-icon gradient-bot-icon">
                <BotIcon />
              </div>
            )}
            <div className={`chat-bubble ${msg.role}`}>
              <p>{msg.parts}</p>
            </div>
            {msg.role === 'user' && (
              <div className="chat-icon gradient-user-icon">
                <UserIcon />
              </div>
            )}
          </div>
        ))}
        {isLoading && (
          <div className="chat-message model">
            <div className="chat-icon gradient-bot-icon">
              <BotIcon />
            </div>
            <div className="chat-bubble model">
              <div className="typing-indicator">
                <div className="typing-dot"></div>
                <div className="typing-dot"></div>
                <div className="typing-dot"></div>
              </div>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>
      <div className="chat-input-wrapper gradient-input-container">
        <input
          ref={inputRef}
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Ask a question..."
          className="chat-input"
          disabled={isLoading}
        />
        <button
          onClick={handleSend}
          disabled={isLoading || !newMessage}
          className="chat-send-button gradient-send-button"
          aria-label="Send message"
        >
          <SendIcon />
        </button>
      </div>
      
      {/* Flying Messages */}
      {flyingMessages.map((msg) => {
        const inputPos = getInputPosition();
        return (
          <div 
            key={msg.id} 
            className="flying-message"
            style={{
              left: `${inputPos.left}px`,
              top: `${inputPos.top}px`,
            }}
          >
            <span className="flying-message-text">{msg.text}</span>
          </div>
        );
      })}
    </div>
  );
};

export default ChatBox;
