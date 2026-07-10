import { useAuth } from '../contexts/AuthContext';

// Hook dùng cho các tính năng phía Admin
export const useAdmin = () => {
  const { user, isAdmin, isAuthenticated } = useAuth();

  return {
    user,
    isAdmin,
    isAuthenticated,
  };
};

export default useAdmin;


