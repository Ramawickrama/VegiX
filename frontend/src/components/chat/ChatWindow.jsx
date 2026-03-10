import React, { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import MessageBubble from './MessageBubble';

const ChatWindow = ({
    conversation,
    messages,
    currentUserEmail,
    otherUserTyping,
    typingUser,
    onBack,
    onStartCall,
    children
}) => {
    const { t } = useTranslation();
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const getRoleBadgeColor = (role) => {
        const colors = {
            farmer: '#27ae60',
            broker: '#3498db',
            buyer: '#f39c12',
            admin: '#9b59b6'
        };
        return colors[role?.toLowerCase()] || '#666';
    };

    if (!conversation) {
        return (
            <div style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#999',
                flexDirection: 'column',
                gap: '15px',
                background: '#f5f5f5',
                height: '100%'
            }}>
                <div style={{ fontSize: '64px' }}>💬</div>
                <div style={{ fontSize: '16px' }}>{t('chat.selectConversation')}</div>
            </div>
        );
    }

    const isOtherUserOnline = conversation.isOnline || false;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#f5f5f5', overflow: 'hidden' }}>
            {/* Chat Header - sticky at top */}
            <div style={{
                padding: '12px 16px',
                borderBottom: '1px solid #eee',
                background: 'white',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                position: 'sticky',
                top: 0,
                zIndex: 10,
                minHeight: '60px'
            }}>
                {onBack && (
                    <button
                        onClick={onBack}
                        style={{
                            background: 'none',
                            border: 'none',
                            fontSize: '22px',
                            cursor: 'pointer',
                            padding: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#333',
                            borderRadius: '50%',
                            minWidth: '36px',
                            minHeight: '36px'
                        }}
                        title="Back to contacts"
                    >
                        ←
                    </button>
                )}
                <div style={{ position: 'relative' }}>
                    <div style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: '50%',
                        background: getRoleBadgeColor(conversation.participantRole),
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontWeight: 'bold',
                        fontSize: '16px'
                    }}>
                        {(conversation.participantName || 'U')[0].toUpperCase()}
                    </div>
                    <div style={{
                        position: 'absolute',
                        bottom: '0',
                        right: '0',
                        width: '14px',
                        height: '14px',
                        borderRadius: '50%',
                        background: isOtherUserOnline ? '#27ae60' : '#ccc',
                        border: '3px solid white'
                    }}></div>
                </div>
                <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: '1rem' }}>
                        {conversation.participantName || 'Unknown User'}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#666' }}>
                        <span style={{
                            color: getRoleBadgeColor(conversation.participantRole),
                            fontWeight: 600
                        }}>
                            {(conversation.participantRole || '').toUpperCase()}
                        </span>
                        {' • '}
                        {isOtherUserOnline ? (
                            <span style={{ color: '#27ae60' }}>Online</span>
                        ) : (
                            <span style={{ color: '#999' }}>Offline</span>
                        )}
                    </div>
                </div>
                {onStartCall && (
                    <button
                        onClick={onStartCall}
                        style={{
                            background: '#27ae60',
                            border: 'none',
                            borderRadius: '50%',
                            width: '40px',
                            height: '40px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '18px'
                        }}
                        title="Start Call"
                    >
                        📞</button>
                )}
            </div>

            {/* Messages Area */}
            <div style={{
                flex: 1,
                overflowY: 'auto',
                padding: '16px',
                background: '#f5f5f5',
                minHeight: 0
            }}>
                {(messages || []).map((msg, idx) => (
                    <MessageBubble
                        key={msg._id || idx}
                        message={msg}
                        isMe={msg.senderEmail?.toLowerCase() === currentUserEmail?.toLowerCase()}
                        showTime={true}
                    />
                ))}

                {otherUserTyping && (
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                        padding: '10px',
                        color: '#666',
                        fontSize: '0.85rem'
                    }}>
                        <div style={{ display: 'flex', gap: '3px' }}>
                            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#999', animation: 'bounce 1s infinite' }}></div>
                            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#999', animation: 'bounce 1s infinite 0.2s' }}></div>
                            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#999', animation: 'bounce 1s infinite 0.4s' }}></div>
                        </div>
                        <span>{typingUser || 'User'} is typing...</span>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            {children}
        </div>
    );
};

export default ChatWindow;
