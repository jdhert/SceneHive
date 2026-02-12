import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/api';
import { clearAccessToken } from '../lib/accessToken';

function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUser();
  }, []);

  const fetchUser = async () => {
    try {
      const response = await authService.getMe();
      setUser(response.data);
    } catch (err) {
      console.error('Failed to fetch user:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await authService.logout();
    } catch (err) {
      // ignore logout failures
    } finally {
      clearAccessToken();
      navigate('/login');
    }
  };

  if (loading) {
    return <div className="container">로딩 중...</div>;
  }

  return (
    <div className="container">
      <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>대시보드</h2>

      {user && (
        <div style={{ marginBottom: '20px' }}>
          <p><strong>이름:</strong> {user.name}</p>
          <p><strong>이메일:</strong> {user.email}</p>
          <p><strong>가입일:</strong> {new Date(user.createdAt).toLocaleDateString()}</p>
        </div>
      )}

      <button onClick={handleLogout} className="btn" style={{ backgroundColor: '#dc3545' }}>
        로그아웃
      </button>
    </div>
  );
}

export default Dashboard;
