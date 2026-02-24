import { useEffect } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useSettings } from "@/store/settings";

export const RequireGuest = () => {
  const { configured, checking, checkConfigured } = useSettings();

  useEffect(() => {
    checkConfigured();
  }, []);

  if (checking) return null;

  if (configured) return <Navigate to="/" replace />;

  return <Outlet />;
};