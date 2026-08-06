import React from 'react';
import { Navigate, useLocation } from 'react-router';

/** Redirect guests to login, preserving the intended destination. */
export default function RequireAuth({ children }) {
  const token =
    typeof window !== 'undefined'
      ? localStorage.getItem('access_token') || localStorage.getItem('AccessToken')
      : null;
  const location = useLocation();
  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return children;
}
