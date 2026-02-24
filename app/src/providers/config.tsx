import { useEffect } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useSettings } from "@/store/settings";

export const RequireConfig = () => {
  const { configured, checking, checkConfigured, load } = useSettings();

  useEffect(() => {
    load();
    checkConfigured();
  }, []);

  if (checking) return null;

  if (!configured) return <Navigate to="/config" replace />;

  return <Outlet />;
};