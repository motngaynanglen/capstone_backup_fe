import { useAuth } from '../contexts/AuthContext';

// Hook dùng cho các tính năng phía Customer
export const useCustomer = () => {
  const { user, isCustomer, isAuthenticated } = useAuth();

  return {
    user,
    isCustomer,
    isAuthenticated,
  };
};

export default useCustomer;


