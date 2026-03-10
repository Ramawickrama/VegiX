import React from 'react';
import { useTranslation } from 'react-i18next';
import ConversationItem from './ConversationItem';

const ConversationList = ({
    conversations,
    selectedConversation,
    onSelectConversation,
    onlineUsers = [],
    loading = false
}) => {
    const { t } = useTranslation();
    const isUserOnline = (email) => {
        return onlineUsers.some(u => u.email?.toLowerCase() === email?.toLowerCase());
    };

    if (loading) {
        return (
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                background: '#f9f9f9'
            }}>
                <div style={{
                    padding: '20px',
                    fontWeight: 'bold',
                    borderBottom: '1px solid #eee',
                    background: '#fff'
                }}>
                    {t('common.loading')}
                </div>
                <div style={{ padding: '20px', textAlign: 'center', color: '#888' }}>
                    <div style={{
                        width: '30px', height: '30px',
                        border: '3px solid #eee',
                        borderTopColor: '#27ae60',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite',
                        margin: '0 auto 10px'
                    }}></div>
                </div>
            </div>
        );
    }

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            background: '#f9f9f9'
        }}>
            <div style={{
                padding: '16px 20px',
                fontWeight: 'bold',
                borderBottom: '1px solid #eee',
                background: '#fff',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                minHeight: '50px'
            }}>
                <span>{t('chat.messages')}</span>
                <span style={{
                    fontSize: '0.8rem',
                    fontWeight: 'normal',
                    color: '#666',
                    background: '#f0f0f0',
                    padding: '2px 8px',
                    borderRadius: '10px'
                }}>
                    {conversations?.length || 0}
                </span>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
                {(!conversations || conversations.length === 0) ? (
                    <div style={{ padding: '30px 20px', textAlign: 'center', color: '#888' }}>
                        <div style={{ fontSize: '40px', marginBottom: '15px' }}>💬</div>
                        <div style={{ fontWeight: '600', marginBottom: '5px' }}>{t('chat.noConversations')}</div>
                        <div style={{ fontSize: '0.85rem' }}>
                            {t('chat.noConversationsMessage')}
                        </div>
                    </div>
                ) : (
                    conversations.filter(c => c && c._id).map(conv => (
                        <ConversationItem
                            key={conv._id}
                            conversation={conv}
                            isSelected={selectedConversation && selectedConversation._id === conv._id}
                            onClick={() => onSelectConversation(conv)}
                            isOnline={isUserOnline(conv.participantEmail)}
                        />
                    ))
                )}
            </div>
        </div>
    );
};

export default ConversationList;
