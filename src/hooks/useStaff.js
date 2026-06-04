import { useAuth } from '../contexts/AuthContext';

// Hook dùng cho các tính năng phía Nhân viên (Staff/Employee)
export const useStaff = () => {
  const { user, isEmployee, isAuthenticated } = useAuth();

  return {
    user,
    isStaff: isEmployee,
    isAuthenticated,
  };
};

export default useStaff;


