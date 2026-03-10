import React, { useState, useEffect, useRef } from 'react';
import API from '../services/api';
import {
  initializeSocket,
  joinConversation,
  leaveConversation,
  sendMessage,
  onReceiveMessage,
  onMessageSent,
  onUserTyping,
  onUserStoppedTyping,
  disconnectSocket,
  sendTyping,
  stopTyping,
  markAsRead,
  onMessageRead,
} from '../services/socketService';

const ChatWindow = ({ conversation, currentUser }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [messageStatus, setMessageStatus] = useState({});
  const scrollRef = useRef();
  const typingTimeoutRef = useRef();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      initializeSocket(token);
    }

    return () => {
      disconnectSocket();
    };
  }, []);

  useEffect(() => {
    if (conversation) {
      fetchMessages();
      joinConversation(conversation._id);
      markAsRead(conversation._id);

      const handleReceiveMessage = (data) => {
        if (data.conversationId === conversation._id) {
          setMessages((prev) => [...prev, data]);
          setTimeout(() => {
            scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
          }, 100);
        }
      };

      const handleMessageSent = (data) => {
        setMessageStatus((prev) => ({
          ...prev,
          [data._id]: { delivered: true },
        }));
      };

      const handleUserTyping = (data) => {
        if (data.userId !== currentUser?.id && data.userId !== currentUser?._id) {
          setTypingUsers((prev) => {
            if (!prev.find((u) => u.userId === data.userId)) {
              return [...prev, data];
            }
            return prev;
          });
        }
      };

      const handleUserStoppedTyping = (data) => {
        setTypingUsers((prev) => prev.filter((u) => u.userId !== data.userId));
      };

      const handleMessageRead = (data) => {
        if (data.conversationId === conversation._id) {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.senderId !== currentUser?.id && msg.senderId !== currentUser?._id
                ? { ...msg, read: true }
                : msg
            )
          );
        }
      };

      onReceiveMessage(handleReceiveMessage);
      onMessageSent(handleMessageSent);
      onUserTyping(handleUserTyping);
      onUserStoppedTyping(handleUserStoppedTyping);
      onMessageRead(handleMessageRead);

      return () => {
        leaveConversation(conversation._id);
      };
    }
  }, [conversation, currentUser]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const res = await API.get(`/chat/messages/${conversation._id}`);
      setMessages(res.data.messages || []);
    } catch (err) {
      console.error('Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const tempId = Date.now().toString();
    const messageData = {
      _id: tempId,
      conversationId: conversation._id,
      senderId: currentUser.id || currentUser._id,
      message: newMessage,
      timestamp: new Date().toISOString(),
    };

    const otherParticipant = conversation.participants.find(
      (p) => (p._id || p)?.toString() !== (currentUser.id || currentUser._id)?.toString()
    );

    setMessages((prev) => [...prev, { ...messageData, senderName: currentUser.name }]);
    setNewMessage('');

    try {
      await API.post('/chat/messages/send', {
        conversationId: conversation._id,
        senderId: currentUser.id || currentUser._id,
        message: newMessage,
        timestamp: new Date(),
      });

      sendMessage(conversation._id, newMessage, otherParticipant?._id?.toString() || otherParticipant);
    } catch (err) {
      console.error('Failed to send message');
      setMessages((prev) => prev.filter((msg) => msg._id !== tempId));
    }
  };

  const handleTyping = (e) => {
    setNewMessage(e.target.value);

    if (!isTyping) {
      setIsTyping(true);
      sendTyping(conversation._id);
    }

    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      stopTyping(conversation._id);
    }, 2000);
  };

  if (!conversation)
    return (
      <div className="empty-chat">
        <div className="empty-chat-content">
          <span className="chat-icon">💬</span>
          <p>Select a conversation to start chatting</p>
        </div>
      </div>
    );

  const currentId = (currentUser?.id || currentUser?._id)?.toString();
  const otherParticipant = conversation.participants.find(
    (p) => (p._id || p)?.toString() !== currentId
  );

  return (
    <div className="chat-window">
      <div className="chat-header">
        <div className="chat-header-info">
          <h3>{otherParticipant?.name || 'Chat'}</h3>
          {conversation.vegetableName && (
            <span className="chat-context">Regarding: {conversation.vegetableName}</span>
          )}
        </div>
        <div className="chat-header-status">
          {conversation.postType && (
            <span className="order-badge">{conversation.postType}</span>
          )}
        </div>
      </div>

      <div className="messages-list">
        {loading ? (
          <div className="loading-messages">
            <div className="loading-spinner"></div>
            <p>Loading messages...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="no-messages">
            <span>No messages yet. Start the conversation!</span>
          </div>
        ) : (
          messages.map((msg, index) => {
            const isMe =
              msg.senderId === (currentUser.id || currentUser._id) ||
              msg.senderId === currentUser?._id;
            const isLatest =
              index === messages.length - 1 ||
              messages[index + 1]?.senderId !== msg.senderId;

            return (
              <div
                key={index}
                className={`message-bubble ${isMe ? 'sent' : 'received'}`}
              >
                {!isMe && isLatest && (
                  <div className="message-sender">{msg.senderName}</div>
                )}
                <div className="message-content">
                  <div className="message-text">{msg.message}</div>
                  {(msg.location || msg.contactNumber) && (
                    <div className="message-meta">
                      {msg.location && <span>📍 {msg.location} </span>}
                      {msg.contactNumber && <span>📞 {msg.contactNumber}</span>}
                    </div>
                  )}
                  <div className="message-time">
                    {new Date(msg.timestamp || msg.createdAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                    {isMe && messageStatus[msg._id]?.delivered && (
                      <span className="delivered-check"> ✓✓</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}

        {typingUsers.length > 0 && (
          <div className="typing-indicator">
            <span>{typingUsers.map((u) => u.name).join(', ')}</span> is typing...
            <span className="typing-dots">
              <span></span>
              <span></span>
              <span></span>
            </span>
          </div>
        )}

        <div ref={scrollRef} />
      </div>

      <form onSubmit={handleSendMessage} className="chat-input-form">
        <input
          type="text"
          value={newMessage}
          onChange={handleTyping}
          placeholder="Type a message..."
          className="chat-input"
        />
        <button type="submit" className="btn-send" disabled={!newMessage.trim()}>
          ➤
        </button>
      </form>
    </div>
  );
};

export default ChatWindow;
