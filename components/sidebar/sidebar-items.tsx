import React from "react";
import { SidebarItem } from "./sidebar-item";
import HomeIconMui from "@mui/icons-material/HomeRounded";
import { UsersIcon,BuildingStorefrontIcon,WrenchIcon , TruckIcon ,ClipboardDocumentIcon, CurrencyDollarIcon} from "@heroicons/react/24/solid";
import { lang } from "../Lang/lang";
import { hasPermission, isSuperAdmin,hasRole } from "@/lib/auth";
import { ReceiptIcon } from "lucide-react";
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
       <SidebarItem
        isActive={pathname.startsWith(`/${firmId}/dashboard/bookings`)}
        title={lang(language, "sidebar.bookings")}
        href={`/${firmId}/dashboard/bookings`}
        icon={<TruckIcon  className="!w-6 !h-6" />}
      />
         <SidebarItem
        isActive={pathname.startsWith(`/${firmId}/dashboard/payments`)}
        title={lang(language, "sidebar.payments")}
        href={`/${firmId}/dashboard/payments`}
        icon={<CurrencyDollarIcon  className="!w-6 !h-6" />}
      />
        <SidebarItem
      isActive={pathname === `/${firmId}/dashboard/plans`}
      title={lang(language, "sidebar.plans")}
      href={`/${firmId}/dashboard/plans`}
      icon={<ClipboardDocumentIcon className="!w-6 !h-6" />}
    />
      <SidebarItem
      isActive={pathname === `/${firmId}/dashboard/inspections`}
      title={lang(language, "sidebar.inspections")}
      href={`/${firmId}/dashboard/inspections`}
      icon={<ClipboardDocumentIcon className="!w-6 !h-6" />}
    />
     <SidebarItem
      isActive={pathname === `/${firmId}/dashboard/maintenance`}
      title={lang(language, "sidebar.maintenance")}
      href={`/${firmId}/dashboard/maintenance`}
      icon={<WrenchIcon  className="!w-6 !h-6" />}
    />
    <SidebarItem
  isActive={pathname === `/${firmId}/dashboard/invoices`}
  title={lang(language, "sidebar.invoices")}
  href={`/${firmId}/dashboard/invoices`}
  icon={<ReceiptIcon className="!w-6 !h-6" />}
/>
     <SidebarItem
  isActive={pathname === `/${firmId}/dashboard/contracts`}
  title={lang(language, "sidebar.contracts")}
  href={`/${firmId}/dashboard/contracts`}
  icon={<ClipboardDocumentIcon className="!w-6 !h-6" />}
/>
  <SidebarItem
  isActive={pathname === `/${firmId}/dashboard/rentalContracts`}
  title={lang(language, "sidebar.rentalContracts")}
  href={`/${firmId}/dashboard/rentalContracts`}
  icon={<ClipboardDocumentIcon className="!w-6 !h-6" />}
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
     <SidebarItem
      isActive={pathname === `/${firmId}/dashboard/tenants`}
      title={lang(language, "sidebar.tenants")}
      href={`/${firmId}/dashboard/tenants`}
      icon={<UsersIcon className="!w-6 !h-6" />}
    />
  </>
)}



    </>
  );
};
