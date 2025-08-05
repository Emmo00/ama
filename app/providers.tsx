"use client";

import { MiniAppProvider } from "@neynar/react";
import { ANALYTICS_ENABLED } from "@/lib/constants";
import WagmiProvider from "@/components/providers/WagmiProvider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <MiniAppProvider
      analyticsEnabled={ANALYTICS_ENABLED}
      backButtonEnabled={true}
    >
      <WagmiProvider>{children}</WagmiProvider>
    </MiniAppProvider>
  );
}
