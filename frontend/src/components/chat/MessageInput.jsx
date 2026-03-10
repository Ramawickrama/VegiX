import React, { useState, useRef } from 'react';

const MessageInput = ({ 
    value, 
    onChange, 
    onSend, 
    onTyping,
    onShareLocation,
    onShareImage,
    disabled = false,
    placeholder = 'Type a message...'
}) => {
    const [sendingLocation, setSendingLocation] = useState(false);
    const fileInputRef = useRef(null);

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            onSend(e);
        }
    };

    const handleShareLocation = async () => {
        if (!navigator.geolocation) {
            alert('Geolocation is not supported by your browser');
            return;
        }

        setSendingLocation(true);
        
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                try {
                    await onShareLocation(latitude, longitude);
                } catch (error) {
                    console.error('Error sending location:', error);
                    alert('Failed to send location');
                } finally {
                    setSendingLocation(false);
                }
            },
            (error) => {
                console.error('Geolocation error:', error);
                let errorMessage = 'Unable to get your location';
                if (error.code === error.PERMISSION_DENIED) {
                    errorMessage = 'Location permission denied. Please enable location access in your browser settings.';
                }
                alert(errorMessage);
                setSendingLocation(false);
            },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    };

    const handleImageSelect = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        if (!file.type.startsWith('image/')) {
            alert('Please select an image file');
            return;
        }

        if (file.size > 10 * 1024 * 1024) {
            alert('Image size must be less than 10MB');
            return;
        }

        if (onShareImage) {
            onShareImage(file);
        }
        
        fileInputRef.current.value = '';
    };

    return (
        <form 
            onSubmit={onSend} 
            style={{ 
                padding: '12px 16px', 
                borderTop: '1px solid #eee',
                background: 'white',
                display: 'flex',
                gap: '10px',
                alignItems: 'center',
                flexWrap: 'wrap',
                position: 'sticky',
                bottom: 0,
                zIndex: 10
            }}
        >
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageSelect}
                accept="image/*"
                style={{ display: 'none' }}
            />
            <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={disabled}
                title="Share Photo"
                style={{
                    padding: '10px',
                    borderRadius: '50%',
                    border: 'none',
                    background: '#9b59b6',
                    color: 'white',
                    cursor: disabled ? 'not-allowed' : 'pointer',
                    opacity: disabled ? 0.6 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '18px'
                }}
            >
                📷
            </button>
            <button
                type="button"
                onClick={handleShareLocation}
                disabled={disabled || sendingLocation}
                title="Share Location"
                style={{
                    padding: '10px',
                    borderRadius: '50%',
                    border: 'none',
                    background: '#3498db',
                    color: 'white',
                    cursor: disabled || sendingLocation ? 'not-allowed' : 'pointer',
                    opacity: disabled || sendingLocation ? 0.6 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '18px'
                }}
            >
                {sendingLocation ? '⏳' : '📍'}
            </button>
            <textarea
                value={value}
                onChange={(e) => {
                    onChange(e);
                    if (onTyping) onTyping();
                }}
                onKeyPress={handleKeyPress}
                placeholder={placeholder}
                disabled={disabled}
                rows={1}
                style={{
                    flex: 1,
                    minWidth: '150px',
                    padding: '12px 16px',
                    borderRadius: '25px',
                    border: '1px solid #ddd',
                    outline: 'none',
                    fontSize: '14px',
                    fontFamily: 'inherit',
                    resize: 'none',
                    maxHeight: '100px',
                    overflowY: 'auto'
                }}
            />
            <button 
                type="submit"
                disabled={!value.trim() || disabled}
                style={{
                    padding: '12px 24px',
                    borderRadius: '25px',
                    border: 'none',
                    background: '#27ae60',
                    color: 'white',
                    fontWeight: '600',
                    cursor: disabled ? 'not-allowed' : 'pointer',
                    opacity: disabled ? 0.6 : 1,
                    transition: 'all 0.2s'
                }}
            >
                {disabled ? 'Sending...' : 'Send'}
            </button>
        </form>
    );
};

export default MessageInput;
