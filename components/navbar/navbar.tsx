import React from "react";
import NextLink from "next/link";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import { useTheme as useNextTheme } from "next-themes";
import { useLanguage } from "../context/LanguageContext";
// HeroUI Components
import {
  Input,
  Link,
  Navbar,
  NavbarContent,
  NavbarItem,
  NavbarBrand,
  NavbarMenuToggle,
  NavbarMenuItem,
  NavbarMenu,
  Button,
  Avatar,
  Spacer,
  Select,
  SelectItem,
  Divider,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
} from "@heroui/react";

// MUI Icons
import DescriptionRoundedIcon from '@mui/icons-material/DescriptionRounded';
import LightModeIcon from "@mui/icons-material/LightMode";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import HomeRoundedIcon from "@mui/icons-material/HomeRounded";
import DashboardRoundedIcon from "@mui/icons-material/DashboardRounded";
import ReceiptRoundedIcon from "@mui/icons-material/ReceiptRounded";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";

// Local components
import { BurguerButton } from "./burguer-button";
import { UserDropdown } from "./user-dropdown";
import NavLink from "./NavLink";
import LanguageSwitcher from "../Lang/LanguageSwitcher";
import { lang } from "../Lang/lang";
import { hasPermission, hasRole } from "@/lib/auth";

interface Props {
  children: React.ReactNode;
}

export const NavbarWrapper = ({ children }: Props) => {
  const { data: session }: any = useSession();
  const pathname = usePathname();
  const { language } = useLanguage();
  const { setTheme, resolvedTheme } = useNextTheme();
  const { isOpen, onOpen } = useDisclosure();

  // Toggle Dark/Light theme
  const handleThemeChange = () =>
    setTheme(resolvedTheme === "dark" ? "light" : "dark");

  return (
    <div className="relative flex flex-col flex-1 overflow-x-hidden">
      {/* Main Navbar */}
      <Navbar
        isBordered={false}
        className="w-full sticky top-0 z-50 bg-transparent backdrop-blur-xl"
        classNames={{
          wrapper:
            "w-full max-w-full h-[5rem] px-6 flex items-center text-default-900 dark:text-white",
        }}
      >
        {/* Burger Button (mobile) */}
        <NavbarContent className="xl:hidden pr-3" justify="center">
          {pathname.startsWith("/admin") || pathname.includes("/dashboard") ? (
            <BurguerButton />
          ) : (
            <NavbarMenuToggle aria-label={lang(language, "Open menu")} />
          )}
        </NavbarContent>

        {/* Logo & Nav Links */}
        <NavbarContent className="gap-4" justify="start">
          <NavbarBrand className="md:block hidden max-w-[fit-content] min-w-[fit-content]">
            <NextLink href="/">Logo</NextLink>
          </NavbarBrand>

          <Divider
            orientation="vertical"
            className="mx-4 h-8 bg-gradient-to-b from-cyan-400 to-blue-400 opacity-40"
          />

          {/* Desktop Links */}
          {!(pathname.startsWith("/admin") || pathname.includes("/dashboard")) && (
            <div className="hidden md:flex gap-2 items-center">
              <NavLink
                icon={<HomeRoundedIcon className="text-cyan-500" />}
                href="/"
                label={lang(language, "navbar.home")}
                pathname={pathname}
              />
              {(hasPermission(session?.user, "access_admin_user_dashboard") ||
                hasRole(session?.user, "user_admin")) && (
                <NavLink
                  icon={<DashboardRoundedIcon className="text-cyan-500" />}
                  href="/asdsa/dashboard"
                  label={lang(language, "navbar.adminDashboard")}
                  pathname={pathname}
                />
              )}
            </div>
          )}

          {/* Desktop Links for Customer */}
          {!(pathname.startsWith("/admin") || pathname.includes("/dashboard")) &&
            session?.user?.type === "customer" && (
              <div className="hidden md:flex gap-2 items-center">
                <NavLink
                  icon={<DashboardRoundedIcon className="text-cyan-500" />}
                  href="/asdsa/dashboard/customers/dashboard"
                  label={lang(language, "navbar.customerDashboard")}
                  pathname={pathname}
                />
                <NavLink
                  icon={<ReceiptRoundedIcon className="text-green-500" />}
                  href="/asdsa/dashboard/customers/bookings"
                  label={lang(language, "navbar.myBookings")}
                  pathname={pathname}
                />
                <NavLink
                  icon={<PersonRoundedIcon className="text-yellow-500" />}
                  href="/asdsa/dashboard/customers/profile"
                  label={lang(language, "navbar.profile")}
                  pathname={pathname}
                />
               <NavLink
                  icon={<DescriptionRoundedIcon className="text-yellow-500" />}
                  href="/asdsa/dashboard/customers/documents"
                  label={lang(language, "navbar.documents")}
                  pathname={pathname}
                />
              </div>
            )}
        </NavbarContent>

        {/* Right Actions */}
        <NavbarContent justify="end" className="gap-2 items-center">
          <Button
            onPress={handleThemeChange}
            isIconOnly
            variant="light"
            className="rounded-full"
            aria-label="Toggle theme"
          >
            {resolvedTheme === "dark" ? <LightModeIcon /> : <DarkModeIcon />}
          </Button>

          <LanguageSwitcher className=""/>

          {!session ? (
            <NavbarItem className="gap-2 flex items-center">
              <Button as={NextLink} color="primary" href="/login">
                {lang(language, "Log In")}
              </Button>
            </NavbarItem>
          ) : (
            <NavbarItem className="gap-2">
              <UserDropdown />
            </NavbarItem>
          )}
        </NavbarContent>

        {/* Mobile Menu */}
        <NavbarMenu>
          <div className="flex flex-col gap-2 items-start justify-center py-4">
            <NavLink
              icon={<HomeRoundedIcon className="text-cyan-500" />}
              href="/"
              label={lang(language, "navbar.home")}
              pathname={pathname}
            />
            <Button
              variant="light"
              className="rounded-full px-4 font-semibold"
              onPress={onOpen}
            >
              {lang(language, "Contact Us")}
            </Button>
          </div>
        </NavbarMenu>
      </Navbar>

      <Spacer y={0} />

      {/* Render children below Navbar */}
      {children}
    </div>
  );
};
