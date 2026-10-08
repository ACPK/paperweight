import { createContext, useContext, useEffect, useState } from "react";
import type { LicenseStatus } from "@shared/types";

export const PRO_UPGRADE_HEADLINE = "Clean up what you've found";
export const PRO_UPGRADE_BODY =
  "Paperweight Free gives you the full picture. Pro lets you act on it: unsubscribe, remove unwanted mail, send privacy requests, use multiple accounts, and connect MCP agents.";

interface LicenseContextValue {
  license: LicenseStatus;
  allowAction: (intent: "curate" | "execute") => boolean;
  refreshLicense: () => Promise<void>;
}

const LicenseContext = createContext<LicenseContextValue | null>(null);

export function useLicense(): LicenseStatus {
  const ctx = useContext(LicenseContext);
  return ctx?.license ?? { active: false };
}

export function useActionAccess() {
  const ctx = useContext(LicenseContext);
  return ctx?.allowAction ?? (() => false);
}

export function useRefreshLicense(): () => Promise<void> {
  const ctx = useContext(LicenseContext);
  return ctx?.refreshLicense ?? (async () => {});
}

interface LicenseProviderProps {
  initialLicense: LicenseStatus;
  children: React.ReactNode;
}

export function LicenseProvider({
  initialLicense,
  children,
}: LicenseProviderProps): JSX.Element {
  const [license, setLicense] = useState<LicenseStatus>(initialLicense);
  // Fork change (ACPK/paperweight): Pro paywall removed. Every action is
  // allowed without a license key, so the upgrade modal is gone.
  const allowAction = (_intent: "curate" | "execute") => true;

  const refreshLicense = useCallback(async () => {
    const status = await window.api.getLicenseStatus();
    setLicense(status);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => { void refreshLicense(); }, 30_000);
    return () => clearInterval(timer);
  }, [refreshLicense]);

  return (
    <LicenseContext.Provider value={{ license, refreshLicense, allowAction }}>
      {children}
    </LicenseContext.Provider>
  );
}
