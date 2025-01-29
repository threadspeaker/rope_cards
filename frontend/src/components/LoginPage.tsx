import React, { useState } from 'react';

const LoginPage = () => {
    const [username, setUsername] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            console.log('Attempting to send request...');
            const response = await fetch('api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username }),
            });
            console.log('Resposne status:', response.status)

            if (!response.ok) {
                throw new Error('Failed to log in');
            }

            const data = await response.json();
            console.log('Response data:', data);
            // Handle successful login
            console.log('Logged in as:', data.username);
            
            // Add navigation logic here later
        } catch (err) {
            console.error('Fetch error:', err);
            setError('Failed to log in. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '100vh',
            backgroundColor: '#f0f2f5'
        }}>
            <div style={{
                backgroundColor: 'white',
                padding: '2rem',
                borderRadius: '8px',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                width: '100%',
                maxWidth: '400px'
            }}>
                <h1 style={{
                    textAlign: 'center',
                    marginBottom: '1.5rem',
                    color: '#333'
                }}>
                    Welcome to Rope Cards!
                </h1>
                <form onSubmit={handleSubmit}>
                    <input
                        type="text"
                        placeholder="Enter username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                        minLength={3}
                        maxLength={20}
                        style={{
                            width: '100%',
                            padding: '0.75rem',
                            marginBottom: '1rem',
                            border: '1px solid #ccc',
                            borderRadius: '4px',
                            fontSize: '1rem'
                        }}
                    />
                    {error && (
                        <div style={{
                            color: '#dc2626',
                            fontSize: '0.875rem',
                            marginBottom: '1rem'
                        }}>
                            {error}
                        </div>
                    )}
                    <button
                        type="submit"
                        disabled={isLoading}
                        style={{
                            width: '100%',
                            padding: '0.75rem',
                            backgroundColor: '#3b82f6',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            fontSize: '1rem',
                            cursor: isLoading ? 'not-allowed' : 'pointer',
                            opacity: isLoading ? 0.7 : 1
                        }}
                    >
                        {isLoading ? 'Logging in...' : 'Join Game'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default LoginPage;