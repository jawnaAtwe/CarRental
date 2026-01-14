import React from "react";
import { SidebarItem } from "./sidebar-item";
import HomeIconMui from "@mui/icons-material/HomeRounded";
import { UsersIcon,BuildingStorefrontIcon, TruckIcon } from "@heroicons/react/24/solid";
import { lang } from "../Lang/lang";
import { hasPermission, isSuperAdmin,hasRole } from "@/lib/auth";

interface SidebarItemsProps {
  firmId: string;
  pathname: string;
  language: string;
  session: any;
}

export const SidebarItems = ({
  firmId,
  pathname,
  language,
  session,
}: SidebarItemsProps) => {
  return (
    <>
     
     {(hasPermission(session?.user, "access_admin_user_dashboard") || hasRole(session?.user, "user_admin"))&& (
  <>
    <SidebarItem
      isActive={pathname === `/${firmId}/dashboard`}
      title={lang(language, "sidebar.dashboard")}
      href={`/${firmId}/dashboard`}
      icon={<HomeIconMui className="!w-6 !h-6" />}
    />

    <SidebarItem
      isActive={pathname.startsWith(`/${firmId}/dashboard/users`)}
      title={lang(language, "sidebar.users")}
      href={`/${firmId}/dashboard/users`}
      icon={<UsersIcon className="!w-6 !h-6" />}
    />
    <SidebarItem
        isActive={pathname.startsWith(`/${firmId}/dashboard/roles`)}
        title={lang(language, "sidebar.roles")}
        href={`/${firmId}/dashboard/roles`}
        icon={<UsersIcon className="!w-6 !h-6" />}
      />
        <SidebarItem
        isActive={pathname.startsWith(`/${firmId}/dashboard/branches`)}
        title={lang(language, "sidebar.branches")}
        href={`/${firmId}/dashboard/branches`}
        icon={<BuildingStorefrontIcon  className="!w-6 !h-6" />}
      />
      <SidebarItem
        isActive={pathname.startsWith(`/${firmId}/dashboard/vehicles`)}
        title={lang(language, "sidebar.vehicles")}
        href={`/${firmId}/dashboard/vehicles`}
        icon={<TruckIcon  className="!w-6 !h-6" />}
      />
  </>
)}

    {(isSuperAdmin(session?.user)) && (
  <>
    <SidebarItem
      isActive={pathname === `/${firmId}/dashboard/customers`}
      title={lang(language, "sidebar.Customers")}
      href={`/${firmId}/dashboard/customers`}
      icon={<UsersIcon className="!w-6 !h-6" />}
    />
  </>
)}
    </>
  );
};
