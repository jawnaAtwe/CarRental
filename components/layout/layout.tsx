import React, { useState } from "react";
import { useLockedBody } from "../hooks/useBodyLock";
import { NavbarWrapper } from "../navbar/navbar";
import { SidebarWrapper } from "../sidebar/sidebar";
import { SidebarContext } from "./layout-context";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { hasPermission, hasRole } from "@/lib/auth";

interface Props {
  children: React.ReactNode;
}

export const Layout = ({ children }: Props) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [_, setLocked] = useLockedBody(false);
  const handleToggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
    setLocked(!sidebarOpen);
  };

  const pathname = usePathname();
  const { data: session } = useSession();

  return (
    <SidebarContext.Provider
      value={{
        collapsed: sidebarOpen,
        setCollapsed: handleToggleSidebar,
      }}
    >
      <div className="flex h-screen overflow-hidden">
        {/* Sidebar */}
        {(pathname.includes('/dashboard') && (!pathname.includes('/customers/'))) && <SidebarWrapper />}

        {/* Main content with Navbar */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <NavbarWrapper>
            <div >
              {children}
            </div>
          </NavbarWrapper>
        </div>
      </div>
    </SidebarContext.Provider>
  );
};
