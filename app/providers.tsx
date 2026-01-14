"use client";
import * as React from "react";
import { HeroUIProvider } from "@heroui/system";
import { ToastProvider } from "@heroui/toast";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { ThemeProviderProps } from "next-themes";
import { Layout } from "../components/layout/layout";
import { SessionProvider } from "next-auth/react";

export interface ProvidersProps {
  children: React.ReactNode;
  themeProps?: ThemeProviderProps;
  session?: any;
}

export function Providers({ children, themeProps, session }: ProvidersProps) {
  return (
    <HeroUIProvider>
      <ToastProvider placement="top-right" />
      <NextThemesProvider defaultTheme="system" attribute="class" {...themeProps}>
        <SessionProvider session={session}>
          <Layout>{children}</Layout>
        </SessionProvider>
      </NextThemesProvider>
    </HeroUIProvider>
  );
}
