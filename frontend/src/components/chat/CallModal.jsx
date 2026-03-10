import React from 'react';

const CallModal = ({ callerData, onAccept, onReject, isCalling, isInCall, onEndCall }) => {
    if (!callerData && !isCalling && !isInCall) return null;

    const isIncoming = !!callerData;

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999
        }}>
            <div style={{
                background: 'white',
                borderRadius: '20px',
                padding: '40px',
                textAlign: 'center',
                maxWidth: '350px',
                width: '90%'
            }}>
                <div style={{
                    width: '80px',
                    height: '80px',
                    borderRadius: '50%',
                    background: '#27ae60',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 20px',
                    animation: isIncoming ? 'pulse 1.5s infinite' : 'none'
                }}>
                    <span style={{ fontSize: '40px' }}>📞</span>
                </div>

                <h2 style={{ margin: '0 0 10px', color: '#333' }}>
                    {isIncoming ? 'Incoming Call' : isInCall ? 'In Call' : 'Calling...'}
                </h2>

                <p style={{ color: '#666', margin: '0 0 30px' }}>
                    {isIncoming 
                        ? `${callerData.callerName || callerData.callerEmail} is calling you`
                        : isInCall
                        ? 'Call in progress'
                        : 'Connecting...'}
                </p>

                <div style={{ display: 'flex', justifyContent: 'center', gap: '20px' }}>
                    {isIncoming ? (
                        <>
                            <button
                                onClick={onReject}
                                style={{
                                    width: '60px',
                                    height: '60px',
                                    borderRadius: '50%',
                                    border: 'none',
                                    background: '#e74c3c',
                                    color: 'white',
                                    fontSize: '24px',
                                    cursor: 'pointer'
                                }}
                            >
                                📵
                            </button>
                            <button
                                onClick={onAccept}
                                style={{
                                    width: '60px',
                                    height: '60px',
                                    borderRadius: '50%',
                                    border: 'none',
                                    background: '#27ae60',
                                    color: 'white',
                                    fontSize: '24px',
                                    cursor: 'pointer'
                                }}
                            >
                                📞
                            </button>
                        </>
                    ) : (
                        <button
                            onClick={onEndCall}
                            style={{
                                padding: '12px 30px',
                                borderRadius: '25px',
                                border: 'none',
                                background: '#e74c3c',
                                color: 'white',
                                fontSize: '16px',
                                cursor: 'pointer'
                            }}
                        >
                            End Call
                        </button>
                    )}
                </div>

                <style>{`
                    @keyframes pulse {
                        0% { transform: scale(1); }
                        50% { transform: scale(1.1); }
                        100% { transform: scale(1); }
                    }
                `}</style>
            </div>
        </div>
    );
};

export default CallModal;
