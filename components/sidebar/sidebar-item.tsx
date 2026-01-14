import React from "react";
import NextLink from "next/link";
import clsx from "clsx";

interface SidebarItemProps {
  title: string;
  href: string;
  icon: React.ReactNode;
  isActive?: boolean;
  className?: string;
}

export const SidebarItem = ({
  title,
  href,
  icon,
  isActive,
  className,
}: SidebarItemProps) => {
  return (
    <NextLink
      href={href}
      className={clsx(
        "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors",
        "hover:bg-default-100 dark:hover:bg-default-50",
        isActive && "bg-default-200 dark:bg-default-100 font-semibold",
        className
      )}
    >
      {icon}
      <span className="text-sm">{title}</span>
    </NextLink>
  );
};
