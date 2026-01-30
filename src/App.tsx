import { useState, useRef, useEffect } from 'react';
import { useChat } from './useChat';
import './App.css';

function App() {
  const { messages, currentStreamingMessage, isStreaming, sendMessage, clearChat } = useChat();
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll al último mensaje
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, currentStreamingMessage]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isStreaming) {
      sendMessage(input);
      setInput('');
    }
  };

  return (
    <div className="app">
      <div className="chat-container">
        <header className="chat-header">
          <img
            src="/img/selfprinting-logo-1571911220.png" 
            className='logo'
            alt="selfprinting logo"
          />
          <h1>Departamento de Incidencias</h1>
          <button
            onClick={clearChat}
            className="clear-button"
            disabled={isStreaming}
          >
            🗑️ Limpiar
          </button>
        </header>

        <div className="messages-container">
          {messages.length === 0 && (
            <div className="welcome-message">
              <h2>👋 ¡Hola!</h2>
              <p>Pregúntame lo que quieras. Estoy aquí para ayudarte.</p>
            </div>
          )}

          {messages.map((message) => (
            <div
              key={message.id}
              className={`message ${message.role}`}
            >
              <div className="message-avatar">
                {message.role === 'user' ? '👤' : '🤖'}
              </div>
              <div className="message-content">
                <div className="message-text">{message.content}</div>
                <div className="message-time">
                  {message.timestamp.toLocaleTimeString('es-ES', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
              </div>
            </div>
          ))}

          {currentStreamingMessage && (
            <div className="message assistant streaming">
              <div className="message-avatar">🤖</div>
              <div className="message-content">
                <div className="message-text">
                  {currentStreamingMessage}
                  <span className="cursor">▊</span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleSubmit} className="input-form">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Escribe tu mensaje..."
            disabled={isStreaming}
            className="message-input"
          />
          <button
            type="submit"
            disabled={isStreaming || !input.trim()}
            className="send-button"
          >
            {isStreaming ? '⏳' : '📤'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default App;
