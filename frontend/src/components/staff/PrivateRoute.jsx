import { Navigate } from 'react-router-dom';

const StaffPrivateRoute = ({ children }) => {
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  
  if (!user || (user.user_type !== 'staff' && !user.is_staff)) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default StaffPrivateRoute;
