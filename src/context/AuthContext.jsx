import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const setAuthData = (userData, token) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  useEffect(() => {
    const stored = localStorage.getItem('user');
    const token = localStorage.getItem('token');

    if (!stored || !token) {
      setLoading(false);
      return;
    }

    try {
      setUser(JSON.parse(stored));
    } catch {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setUser(null);
    }

    setLoading(false);
  }, []);

  const login = (userData, token) => {
    setAuthData(userData, token);
  };

  const updateUser = (nextUserData) => {
    setUser(nextUserData);
    localStorage.setItem('user', JSON.stringify(nextUserData));
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const refreshUser = async () => {
    try {
      const { userAPI } = await import('../services/api');
      const response = await userAPI.getMe();
      const userData = response.data?.data?.user;
      if (userData) {
        updateUser(userData);
      }
    } catch (error) {
      console.error('Failed to refresh user data:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, updateUser, refreshUser, loading, isAdmin: user?.role === 'admin' || user?.role === 'superadmin', isSuperAdmin: user?.role === 'superadmin' }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
