import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

function OAuth2RedirectHandler() {
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const accessToken = params.get('accessToken');
        const refreshToken = params.get('refreshToken');
        const error = params.get('error');

        if (accessToken) {
            localStorage.setItem('accessToken', accessToken);
            if (refreshToken) {
                localStorage.setItem('refreshToken', refreshToken);
            }
            // Redirect to home or dashboard
            navigate('/home', { replace: true });
        } else {
            // Handle error or missing tokens
            console.error('OAuth2 Login Failed', error);
            navigate('/login', { replace: true, state: { error: 'Social login failed' } });
        }
    }, [location, navigate]);

    return (
        <div className="flex items-center justify-center min-h-screen">
            <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
    );
}

export default OAuth2RedirectHandler;
