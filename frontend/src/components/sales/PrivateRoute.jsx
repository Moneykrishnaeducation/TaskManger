import { Navigate } from 'react-router-dom';

const SalesPrivateRoute = ({ children }) => {
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  
  if (!user || user.user_type !== 'sales') {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default SalesPrivateRoute;
