import React from 'react';

const getRoleBadgeColor = (role) => {
    const colors = {
        farmer: '#27ae60',
        broker: '#3498db',
        buyer: '#f39c12',
        admin: '#9b59b6'
    };
    return colors[role?.toLowerCase()] || '#666';
};

const ConversationItem = ({ conversation, isSelected, onClick, isOnline }) => {
    const hasUnread = conversation.unreadCount > 0;
    const isUnreadMessage = conversation.lastSenderEmail !== conversation.participantEmail;
    
    const formatTime = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        const now = new Date();
        const diff = now - date;
        
        if (diff < 60000) return 'Just now';
        if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
        if (diff < 86400000) return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        return date.toLocaleDateString();
    };

    return (
        <div
            onClick={onClick}
            style={{
                padding: '15px 20px',
                cursor: 'pointer',
                borderBottom: '1px solid #eee',
                background: isSelected ? '#e8f5e9' : 'transparent',
                borderLeft: isSelected ? '4px solid #2ecc71' : 'none',
                transition: 'all 0.2s'
            }}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ position: 'relative' }}>
                        <div style={{ 
                            width: '40px', 
                            height: '40px', 
                            borderRadius: '50%', 
                            background: getRoleBadgeColor(conversation.participantRole),
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontWeight: 'bold',
                            fontSize: '14px'
                        }}>
                            {(conversation.participantName || 'U')[0].toUpperCase()}
                        </div>
                        <div style={{
                            position: 'absolute',
                            bottom: '0',
                            right: '0',
                            width: '12px',
                            height: '12px',
                            borderRadius: '50%',
                            background: isOnline ? '#27ae60' : '#ccc',
                            border: '2px solid white'
                        }}></div>
                    </div>
                    <div>
                        <div style={{ 
                            fontWeight: hasUnread ? 700 : 600, 
                            fontSize: '14px' 
                        }}>
                            {conversation.participantName || 'Unknown User'}
                        </div>
                        <div style={{ fontSize: '11px', color: getRoleBadgeColor(conversation.participantRole) }}>
                            {(conversation.participantRole || '').toUpperCase()}
                        </div>
                    </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ 
                        fontSize: '0.7rem', 
                        color: hasUnread ? '#27ae60' : '#999' 
                    }}>
                        {formatTime(conversation.lastMessageAt)}
                    </span>
                    {hasUnread && (
                        <span style={{
                            background: '#27ae60',
                            color: 'white',
                            borderRadius: '50%',
                            minWidth: '20px',
                            height: '20px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.7rem',
                            fontWeight: 'bold',
                            padding: '0 6px'
                        }}>
                            {conversation.unreadCount > 9 ? '9+' : conversation.unreadCount}
                        </span>
                    )}
                </div>
            </div>
            <div style={{ 
                fontSize: '0.85rem', 
                color: hasUnread ? '#333' : '#666', 
                marginTop: '8px', 
                marginLeft: '50px',
                fontWeight: hasUnread && isUnreadMessage ? 600 : 400,
                whiteSpace: 'nowrap', 
                overflow: 'hidden', 
                textOverflow: 'ellipsis' 
            }}>
                {conversation.lastMessage || 'No messages yet'}
            </div>
        </div>
    );
};

export default ConversationItem;
