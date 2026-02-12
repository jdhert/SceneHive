import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { setAccessToken } from '../lib/accessToken';
import { authService } from '../services/api';

function OAuth2RedirectHandler() {
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const accessToken = params.get('accessToken');
        const error = params.get('error');

        if (accessToken) {
            setAccessToken(accessToken);
            // Redirect to home or dashboard
            navigate('/home', { replace: true });
        } else if (!error) {
            authService.refresh()
                .then((response) => {
                    const token = response.data?.accessToken;
                    if (token) {
                        setAccessToken(token);
                        navigate('/home', { replace: true });
                    } else {
                        navigate('/login', { replace: true, state: { error: 'Social login failed' } });
                    }
                })
                .catch(() => {
                    navigate('/login', { replace: true, state: { error: 'Social login failed' } });
                });
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
