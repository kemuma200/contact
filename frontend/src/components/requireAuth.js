import { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';

function RequireAuth() {
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    fetch('/auth', {
      credentials: 'include'
    })
      .then(res => {
        if (res.ok) setAuthenticated(true);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return null; // or spinner

  if (!authenticated) {
    return (
      <Navigate
        to="/login"
        state={{ from: location }}
        replace
      />
    );
  }

  return <Outlet />;
}

export default RequireAuth;
