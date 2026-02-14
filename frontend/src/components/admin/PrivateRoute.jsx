import { Navigate } from 'react-router-dom';

const AdminPrivateRoute = ({ children }) => {
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  
  if (!user || (user.user_type !== 'admin' && !user.is_superuser)) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default AdminPrivateRoute;
