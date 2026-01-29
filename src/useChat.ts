import { useState, useRef } from 'react';
import { Message } from './types';

const API_URL = 'http://localhost:3001';

export function useChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentStreamingMessage, setCurrentStreamingMessage] = useState('');
  const sessionIdRef = useRef(crypto.randomUUID());
  const eventSourceRef = useRef<EventSource | null>(null);

  const sendMessage = async (content: string) => {
    if (!content.trim() || isStreaming) return;

    // Agregar mensaje del usuario
    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsStreaming(true);
    setCurrentStreamingMessage('');

    try {
      // Crear EventSource para SSE
      const url = new URL(`${API_URL}/api/chat/stream`);
      url.searchParams.set('message', content);
      url.searchParams.set('sessionId', sessionIdRef.current);

      const eventSource = new EventSource(url.toString());
      eventSourceRef.current = eventSource;

      // Manejar chunks de texto
      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          setCurrentStreamingMessage(prev => prev + data.text);
        } catch (error) {
          console.error('Error parsing SSE data:', error);
        }
      };

      // Manejar evento de finalización
      eventSource.addEventListener('done', () => {
        setCurrentStreamingMessage(current => {
          // Agregar mensaje completo al historial
          const assistantMessage: Message = {
            id: crypto.randomUUID(),
            role: 'assistant',
            content: current,
            timestamp: new Date()
          };
          setMessages(prev => [...prev, assistantMessage]);
          return '';
        });
        
        setIsStreaming(false);
        eventSource.close();
        eventSourceRef.current = null;
      });

      // Manejar errores
      eventSource.addEventListener('error', (event) => {
        console.error('SSE error:', event);
        
        const errorData = event.type === 'error' && (event as any).data 
          ? JSON.parse((event as any).data) 
          : { error: 'Error de conexión' };
        
        const errorMessage: Message = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: `Error: ${errorData.error || 'No se pudo conectar con el servidor'}`,
          timestamp: new Date()
        };
        
        setMessages(prev => [...prev, errorMessage]);
        setIsStreaming(false);
        setCurrentStreamingMessage('');
        eventSource.close();
        eventSourceRef.current = null;
      });

      eventSource.onerror = () => {
        if (eventSource.readyState === EventSource.CLOSED) {
          console.log('Connection closed');
        }
      };

    } catch (error) {
      console.error('Error sending message:', error);
      setIsStreaming(false);
      
      const errorMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: 'Error al enviar el mensaje. Por favor, intenta de nuevo.',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    }
  };

  const clearChat = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }
    setMessages([]);
    setCurrentStreamingMessage('');
    setIsStreaming(false);
    sessionIdRef.current = crypto.randomUUID();
  };

  return {
    messages,
    currentStreamingMessage,
    isStreaming,
    sendMessage,
    clearChat
  };
}
