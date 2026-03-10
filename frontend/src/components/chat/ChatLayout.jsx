import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import API from '../../services/api';
import { useSocket } from '../../contexts/SocketContext';
import ConversationList from './ConversationList';
import ChatWindow from './ChatWindow';
import MessageInput from './MessageInput';
import CallModal from './CallModal';
import {
    initializeSocket,
    getSocket,
    joinUser,
    joinConversation,
    leaveConversation,
    onReceiveMessage,
    onUserTyping,
    onUserStoppedTyping,
    onOnlineUsers,
    sendTyping,
    stopTyping,
    disconnectSocket,
    onIncomingCall,
    onCallAccepted,
    onCallRejected,
    onCallEnded
} from '../../services/socketService';

const ChatLayout = ({ title = 'Messages', subtitle = 'Chat with farmers, brokers, and buyers' }) => {
    const { refreshUnreadMessageCount } = useSocket() || {};
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [conversations, setConversations] = useState([]);
    const [selectedConversation, setSelectedConversation] = useState(null);
    const [messages, setMessages] = useState([]);
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [newMessage, setNewMessage] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [otherUserTyping, setOtherUserTyping] = useState(false);
    const [typingUser, setTypingUser] = useState(null);
    const [onlineUsers, setOnlineUsers] = useState([]);
    const [isConnected, setIsConnected] = useState(false);
    const [chatStarting, setChatStarting] = useState(false);
    const [isMobileView, setIsMobileView] = useState(false);
    const [showConversationList, setShowConversationList] = useState(true);
    const [callState, setCallState] = useState({
        isRinging: false,
        callerData: null,
        isCalling: false,
        callId: null,
        isInCall: false
    });

    const typingTimeoutRef = useRef(null);
    const processedEmailRef = useRef(null);
    const processedConversationRef = useRef(null);
    const callTimeoutRef = useRef(null);

    const targetEmail = searchParams.get('email');
    const targetConversationId = searchParams.get('conversationId');

    useEffect(() => {
        const handleResize = () => {
            setIsMobileView(window.innerWidth <= 768);
        };
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    console.log('[ChatLayout] Rendering, targetEmail:', targetEmail, 'targetConversationId:', targetConversationId, 'selectedConversation:', selectedConversation?._id);

    const fetchConversations = useCallback(async () => {
        try {
            const res = await API.get('/chat/conversations');
            const convs = res.data?.conversations || [];
            setConversations(convs);
            console.log('[ChatLayout] Fetched conversations:', convs.length);
            return convs;
        } catch (err) {
            console.error('[ChatLayout] Failed to fetch conversations:', err);
            return [];
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchMessages = useCallback(async (conversationId) => {
        try {
            console.log('[ChatLayout] Fetching messages for:', conversationId);
            const res = await API.get(`/chat/messages/${conversationId}`);
            const msgs = res.data?.messages || [];
            setMessages(msgs);

            // Update conversation with participant info if available
            if (res.data?.conversation) {
                const convInfo = res.data.conversation;
                setConversations(prev => {
                    const exists = prev.find(c => c._id === conversationId);
                    if (exists) {
                        return prev.map(c => c._id === conversationId ? { ...c, ...convInfo } : c);
                    }
                    return [{ _id: conversationId, ...convInfo }, ...prev];
                });
            }

            console.log('[ChatLayout] Fetched messages:', msgs.length);
        } catch (err) {
            console.error('[ChatLayout] Failed to fetch messages:', err);
            setMessages([]);
        }
    }, []);

    const startNewChat = useCallback(async (email, convList) => {
        if (!email || chatStarting) return;

        console.log('[ChatLayout] startNewChat called with email:', email);
        setChatStarting(true);

        try {
            const existingConv = convList.find(
                c => c.participantEmail?.toLowerCase() === email.toLowerCase()
            );

            if (existingConv) {
                console.log('[ChatLayout] Found existing conversation:', existingConv._id);
                setSelectedConversation(existingConv);
                processedEmailRef.current = email;
                return;
            }

            console.log('[ChatLayout] Creating new conversation with:', email);
            const res = await API.post('/chat/conversations/start', {
                receiverEmail: email
            });

            if (res.data?.success && res.data.conversation) {
                const conv = res.data.conversation;
                if (!conv || !conv._id) {
                    console.error('[ChatLayout] Invalid conversation returned:', conv);
                    return;
                }
                console.log('[ChatLayout] New conversation created:', conv._id);

                setConversations(prev => {
                    const exists = prev.find(c => c && c._id === conv._id);
                    if (exists) return prev;
                    return [conv, ...prev];
                });

                setSelectedConversation(conv);
                processedEmailRef.current = email;
            } else {
                console.error('[ChatLayout] Failed to create conversation:', res.data);
            }
        } catch (err) {
            console.error('[ChatLayout] Error starting chat:', err);
        } finally {
            setChatStarting(false);
        }
    }, [chatStarting]);

    useEffect(() => {
        const user = JSON.parse(localStorage.getItem('user'));
        setCurrentUser(user);

        const token = localStorage.getItem('token');
        if (token) {
            const socket = initializeSocket(token);
            if (socket) {
                socket.on('connect', () => {
                    console.log('[ChatLayout] Socket connected');
                    setIsConnected(true);
                    joinUser(user?.email);
                });
                socket.on('disconnect', () => {
                    console.log('[ChatLayout] Socket disconnected');
                    setIsConnected(false);
                });
            }
        }

        fetchConversations();

        return () => {
            disconnectSocket();
        };
    }, [fetchConversations]);

    useEffect(() => {
        if (!currentUser?.email) return;

        const socket = getSocket();
        if (!socket) return;

        const unsubReceive = onReceiveMessage((messageData) => {
            console.log('[ChatLayout] Received message:', messageData);
            if (selectedConversation && messageData.conversationId === selectedConversation._id) {
                setMessages(prev => [...prev, messageData]);
            }
            fetchConversations();
        });

        const unsubTyping = onUserTyping((data) => {
            if (selectedConversation && data.conversationId === selectedConversation._id) {
                setOtherUserTyping(true);
                setTypingUser(data.senderName);
            }
        });

        const unsubStopTyping = onUserStoppedTyping((data) => {
            if (selectedConversation && data.conversationId === selectedConversation._id) {
                setOtherUserTyping(false);
                setTypingUser(null);
            }
        });

        const unsubOnline = onOnlineUsers((users) => {
            setOnlineUsers(users);
        });

        return () => {
            unsubReceive?.();
            unsubTyping?.();
            unsubStopTyping?.();
            unsubOnline?.();
        };
    }, [currentUser, selectedConversation, fetchConversations]);

    useEffect(() => {
        if (targetEmail && !loading && !chatStarting) {
            if (processedEmailRef.current === targetEmail) {
                console.log('[ChatLayout] Email already processed, skipping:', targetEmail);
                return;
            }
            console.log('[ChatLayout] Processing target email:', targetEmail);
            startNewChat(targetEmail, conversations);
        }
    }, [targetEmail, loading, conversations, chatStarting, startNewChat]);

    // Handle conversationId parameter
    useEffect(() => {
        if (!targetConversationId) return;

        if (processedConversationRef.current === targetConversationId) {
            return;
        }

        // First check if already in conversations list
        const conv = conversations.find(c => c._id === targetConversationId);
        if (conv) {
            console.log('[ChatLayout] Found conversation in list:', targetConversationId);
            setSelectedConversation(conv);
            processedConversationRef.current = targetConversationId;
            return;
        }

        // If not found in list and conversations loaded, fetch the specific conversation
        if (!loading) {
            console.log('[ChatLayout] Fetching conversation directly:', targetConversationId);
            API.get(`/chat/messages/${targetConversationId}`).then(res => {
                // If we can get messages, conversation exists
                const convData = {
                    _id: targetConversationId,
                    participantEmail: '', // Will be filled from messages
                };
                setConversations(prev => {
                    const exists = prev.find(c => c._id === targetConversationId);
                    if (exists) return prev;
                    return [convData, ...prev];
                });
                setSelectedConversation(convData);
                processedConversationRef.current = targetConversationId;
            }).catch(err => {
                console.error('[ChatLayout] Failed to fetch conversation:', err);
            });
        }
    }, [targetConversationId, loading, conversations]);

    useEffect(() => {
        if (selectedConversation?._id) {
            console.log('[ChatLayout] Selected conversation changed, fetching messages:', selectedConversation._id);
            fetchMessages(selectedConversation._id);
            joinConversation(selectedConversation._id);

            return () => {
                leaveConversation(selectedConversation._id);
            };
        } else {
            setMessages([]);
        }
    }, [selectedConversation?._id, fetchMessages]);

    const handleTyping = () => {
        if (selectedConversation && !isTyping) {
            setIsTyping(true);
            sendTyping(selectedConversation._id, selectedConversation.participantEmail);
        }

        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }

        typingTimeoutRef.current = setTimeout(() => {
            setIsTyping(false);
            stopTyping(selectedConversation._id, selectedConversation.participantEmail);
        }, 2000);
    };

    const sendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !selectedConversation?._id || sending) return;

        console.log('[ChatLayout] Sending message to:', selectedConversation.participantEmail);
        setSending(true);
        try {
            const res = await API.post('/chat/messages/send', {
                conversationId: selectedConversation._id,
                message: newMessage.trim(),
                receiverEmail: selectedConversation.participantEmail
            });

            if (res.data?.success) {
                console.log('[ChatLayout] Message sent successfully');
                setMessages(prev => [...prev, res.data.message]);
                setNewMessage('');

                stopTyping(selectedConversation._id, selectedConversation.participantEmail);
                setIsTyping(false);
                fetchConversations();
            }
        } catch (err) {
            console.error('[ChatLayout] Failed to send message:', err);
        } finally {
            setSending(false);
        }
    };

    const sendLocationMessage = async (lat, lng) => {
        if (!selectedConversation?._id || sending) return;

        console.log('[ChatLayout] Sending location:', lat, lng);
        setSending(true);
        try {
            const res = await API.post('/chat/messages/send', {
                conversationId: selectedConversation._id,
                message: '',
                messageType: 'location',
                location: {
                    lat,
                    lng,
                    label: ''
                },
                receiverEmail: selectedConversation.participantEmail
            });

            if (res.data?.success) {
                console.log('[ChatLayout] Location message sent successfully');
                setMessages(prev => [...prev, res.data.message]);
                fetchConversations();
            }
        } catch (err) {
            console.error('[ChatLayout] Failed to send location:', err);
            alert('Failed to send location. Please try again.');
        } finally {
            setSending(false);
        }
    };

    const handleSelectConversation = async (conv) => {
        console.log('[ChatLayout] Selecting conversation:', conv._id);
        setSelectedConversation(conv);

        if (isMobileView) {
            setShowConversationList(false);
        }

        try {
            await API.post(`/chat/conversations/${conv._id}/read`);
            setConversations(prev => prev.map(c =>
                c._id === conv._id ? { ...c, unreadCount: 0 } : c
            ));
            // Refresh global nav badge
            if (refreshUnreadMessageCount) refreshUnreadMessageCount();
        } catch (err) {
            console.error('[ChatLayout] Failed to mark as read:', err);
        }
    };

    const handleBack = () => {
        setSelectedConversation(null);
        setShowConversationList(true);
        setMessages([]);
        setNewMessage('');

        // Reload conversations to refresh the list
        fetchConversations();
    };

    const sendImageMessage = async (file) => {
        if (!selectedConversation?._id || sending) return;
        setSending(true);
        try {
            const formData = new FormData();
            formData.append('image', file);
            formData.append('conversationId', selectedConversation._id);

            const res = await API.post('/chat/messages/image', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            if (res.data?.success) {
                setMessages(prev => [...prev, res.data.message]);
                fetchConversations();
            }
        } catch (err) {
            console.error('[ChatLayout] Failed to send image:', err);
            alert('Failed to send image. Please try again.');
        } finally {
            setSending(false);
        }
    };

    const cleanupCall = useCallback((callId = null) => {
        console.log('[ChatLayout] Cleaning up call:', callId);

        if (callTimeoutRef.current) {
            clearTimeout(callTimeoutRef.current);
            callTimeoutRef.current = null;
        }

        setCallState({
            isRinging: false,
            callerData: null,
            isCalling: false,
            callId: null,
            isInCall: false
        });
    }, []);

    const handleStartCall = async () => {
        if (!selectedConversation) return;
        const newCallId = `call-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        setCallState({
            isRinging: false,
            callerData: null,
            isCalling: true,
            callId: newCallId,
            isInCall: true
        });
        try {
            const res = await API.post('/chat/call/start', {
                conversationId: selectedConversation._id,
                receiverEmail: selectedConversation.participantEmail
            });
            if (res.data?.callData?.callId) {
                setCallState(prev => ({ ...prev, callId: res.data.callData.callId }));
            }
        } catch (err) {
            console.error('[ChatLayout] Failed to start call:', err);
            cleanupCall();
        }
    };

    const handleAcceptCall = async () => {
        if (!callState.callerData) return;
        try {
            await API.post('/chat/call/accept', {
                conversationId: callState.callerData.conversationId,
                callerEmail: callState.callerData.callerEmail
            });
            alert('Call accepted! (WebRTC not implemented - this is the signaling demo)');
            setCallState(prev => ({
                ...prev,
                isRinging: false,
                callerData: null,
                isCalling: false,
                isInCall: true
            }));
        } catch (err) {
            console.error('[ChatLayout] Failed to accept call:', err);
        }
    };

    const handleRejectCall = async () => {
        if (!callState.callerData) return;
        const callId = callState.callerData?.callId;
        const conversationId = callState.callerData?.conversationId;
        const callerEmail = callState.callerData?.callerEmail;

        try {
            await API.post('/chat/call/reject', {
                conversationId,
                callerEmail
            });
        } catch (err) {
            console.error('[ChatLayout] Failed to reject call:', err);
        }

        cleanupCall(callId);
    };

    const handleEndCall = async () => {
        if (!selectedConversation && !callState.callId) return;

        const callId = callState.callId || callState.callerData?.callId;
        const receiverEmail = selectedConversation?.participantEmail || callState.callerData?.callerEmail;
        const callerEmail = callState.callerData?.callerEmail;
        const conversationId = selectedConversation?._id || callState.callerData?.conversationId;

        cleanupCall(callId);

        try {
            await API.post('/chat/call/end', {
                conversationId,
                receiverEmail,
                callerEmail,
                callId
            });
        } catch (err) {
            console.error('[ChatLayout] Failed to end call:', err);
        }
    };

    useEffect(() => {
        const socket = getSocket();
        if (!socket) return;

        const unsubCall = onIncomingCall((data) => {
            console.log('[ChatLayout] Incoming call:', data);
            setCallState({
                isRinging: true,
                callerData: data,
                isCalling: false,
                callId: data.callId,
                isInCall: false
            });
        });

        const unsubAccepted = onCallAccepted((data) => {
            console.log('[ChatLayout] Call accepted:', data);
            alert('Call accepted! (WebRTC not implemented - this is the signaling demo)');
            setCallState(prev => ({
                ...prev,
                isRinging: false,
                isCalling: false,
                isInCall: true
            }));
        });

        const unsubRejected = onCallRejected((data) => {
            console.log('[ChatLayout] Call rejected:', data);
            alert('Call was rejected');
            cleanupCall(data.callId);
        });

        const unsubEnded = onCallEnded((data) => {
            console.log('[ChatLayout] Call ended:', data);
            cleanupCall(data.callId);
        });

        return () => {
            unsubCall?.();
            unsubAccepted?.();
            unsubRejected?.();
            unsubEnded?.();
            cleanupCall();
        };
    }, [cleanupCall]);

    useEffect(() => {
        return () => {
            cleanupCall();
        };
    }, [cleanupCall]);

    // Lock body scroll to chat panels only while this page is mounted
    useEffect(() => {
        document.body.classList.add('chat-page-active');
        return () => {
            document.body.classList.remove('chat-page-active');
        };
    }, []);

    const currentUserEmail = currentUser?.email?.toLowerCase();

    return (
        <div style={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            background: '#f5f5f5'
        }}>
            <CallModal
                callerData={callState.callerData}
                isCalling={callState.isCalling}
                isInCall={callState.isInCall}
                onAccept={handleAcceptCall}
                onReject={handleRejectCall}
                onEndCall={handleEndCall}
            />

            {/* Page header bar — fixed height, never scrolls */}
            <div style={{
                padding: '10px 20px',
                flexShrink: 0,
                background: '#fff',
                borderBottom: '1px solid #e0e0e0',
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                minHeight: '54px'
            }}>
                <div>
                    <h1 style={{ margin: 0, color: '#27ae60', fontSize: '1.4rem', lineHeight: 1 }}>{title}</h1>
                    <p style={{ margin: 0, color: '#666', fontSize: '0.8rem' }}>{subtitle}</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: 'auto' }}>
                    <div style={{
                        width: '10px',
                        height: '10px',
                        borderRadius: '50%',
                        background: isConnected ? '#27ae60' : '#e74c3c',
                        flexShrink: 0
                    }}></div>
                    <small style={{ color: isConnected ? '#27ae60' : '#e74c3c' }}>
                        {isConnected ? 'Connected' : 'Disconnected'}
                    </small>
                    {targetEmail && (
                        <small style={{ color: '#666' }}>
                            | Starting chat with: {targetEmail}
                        </small>
                    )}
                </div>
            </div>

            {/* Chat panels — fill all remaining height */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: isMobileView ? '1fr' : '350px 1fr',
                flex: 1,
                minHeight: 0,
                background: 'white',
                overflow: 'hidden',
                boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
            }}>
                {(!isMobileView || showConversationList) && (
                    <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden' }}>
                        <ConversationList
                            conversations={conversations}
                            selectedConversation={selectedConversation}
                            onSelectConversation={handleSelectConversation}
                            onlineUsers={onlineUsers}
                            loading={loading}
                        />
                    </div>
                )}

                {(!isMobileView || !showConversationList) && (
                    <ChatWindow
                        conversation={selectedConversation}
                        messages={selectedConversation ? messages : []}
                        currentUserEmail={currentUserEmail}
                        otherUserTyping={otherUserTyping}
                        typingUser={typingUser}
                        onBack={handleBack}
                        onStartCall={selectedConversation ? handleStartCall : null}
                    >
                        <MessageInput
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            onSend={sendMessage}
                            onTyping={handleTyping}
                            onShareLocation={sendLocationMessage}
                            onShareImage={sendImageMessage}
                            disabled={sending}
                            placeholder="Type a message..."
                        />
                    </ChatWindow>
                )}
            </div>

            <style>{`
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
                @keyframes bounce {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-4px); }
                }
            `}</style>
        </div>
    );
};

export default ChatLayout;
