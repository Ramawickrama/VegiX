import React from 'react';

const MessageBubble = ({ message, isMe, showTime = true }) => {
    const formatTime = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const openGoogleMaps = (lat, lng) => {
        const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
        window.open(url, '_blank');
    };

    const isLocationMessage = message.messageType === 'location' && message.location;
    const isImageMessage = message.messageType === 'image' && (message.imageUrl || message.message);
    
    const getImageUrl = () => {
        if (message.imageUrl) return message.imageUrl;
        if (message.message && message.message.startsWith('chat-')) {
            return `/uploads/chat/${message.message}`;
        }
        return null;
    };

    return (
        <div 
            style={{
                display: 'flex',
                justifyContent: isMe ? 'flex-end' : 'flex-start',
                marginBottom: '8px'
            }}
        >
            <div style={{
                maxWidth: '70%',
                padding: isLocationMessage ? '8px' : '10px 14px',
                borderRadius: isMe ? '15px 15px 3px 15px' : '15px 15px 15px 3px',
                background: isMe ? '#27ae60' : 'white',
                color: isMe ? 'white' : '#333',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                wordBreak: 'break-word'
            }}>
                {isLocationMessage ? (
                    <div style={{
                        background: isMe ? 'rgba(255,255,255,0.15)' : '#f5f5f5',
                        borderRadius: '8px',
                        padding: '10px',
                        minWidth: '200px'
                    }}>
                        <div style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '8px',
                            marginBottom: '8px',
                            color: isMe ? 'white' : '#333'
                        }}>
                            <span style={{ fontSize: '20px' }}>📍</span>
                            <span style={{ fontWeight: '600' }}>Shared Location</span>
                        </div>
                        {message.location.label && (
                            <div style={{ 
                                fontSize: '13px', 
                                marginBottom: '8px',
                                color: isMe ? 'rgba(255,255,255,0.8)' : '#666'
                            }}>
                                {message.location.label}
                            </div>
                        )}
                        <div style={{ 
                            fontSize: '12px', 
                            marginBottom: '10px',
                            color: isMe ? 'rgba(255,255,255,0.7)' : '#888',
                            fontFamily: 'monospace'
                        }}>
                            {message.location.lat.toFixed(6)}, {message.location.lng.toFixed(6)}
                        </div>
                        <button
                            onClick={() => openGoogleMaps(message.location.lat, message.location.lng)}
                            style={{
                                background: isMe ? 'white' : '#27ae60',
                                color: isMe ? '#27ae60' : 'white',
                                border: 'none',
                                padding: '8px 16px',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '13px',
                                fontWeight: '600',
                                width: '100%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '6px'
                            }}
                        >
                            🗺️ Open in Google Maps
                        </button>
                    </div>
                ) : isImageMessage ? (
                    <div>
                        <img 
                            src={getImageUrl()} 
                            alt="Shared image"
                            style={{
                                maxWidth: '250px',
                                maxHeight: '200px',
                                borderRadius: '8px',
                                cursor: 'pointer'
                            }}
                            onClick={() => window.open(getImageUrl(), '_blank')}
                        />
                    </div>
                ) : (
                    <div style={{ fontSize: '0.95rem', lineHeight: '1.4' }}>
                        {message.message}
                    </div>
                )}
                {showTime && (
                    <div style={{ 
                        fontSize: '0.7rem', 
                        opacity: 0.7,
                        marginTop: '4px',
                        textAlign: isMe ? 'right' : 'left'
                    }}>
                        {formatTime(message.createdAt)}
                        {isMe && message.readStatus && ' ✓'}
                    </div>
                )}
            </div>
        </div>
    );
};

export default MessageBubble;
