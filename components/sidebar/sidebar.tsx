import React from "react";
import { Sidebar } from "./sidebar.styles";
import { Divider } from "@heroui/react";
import { SidebarMenu } from "./sidebar-menu";
import { useSidebarContext } from "../layout/layout-context";
import { usePathname, useParams } from "next/navigation";
import NextLink from "next/link";
import { useSession } from "next-auth/react";
import { useLanguage } from "../context/LanguageContext";
import { lang } from "../Lang/lang";
import { SidebarItems } from "./sidebar-items";

export const SidebarWrapper = () => {
  const { language } = useLanguage();
  const { data: session } = useSession();
  const pathname = usePathname();
  const { collapsed, setCollapsed } = useSidebarContext();
  const { firmId } = useParams();

  const isRTL = language === "ar";

  return (
    <aside
      className="
        min-h-screen h-fit
        z-[42] sticky top-0
        bg-content1
      "
    >
      {collapsed && (
        <div
          className={Sidebar.Overlay()}
          onClick={() => setCollapsed()}
        />
      )}

      <div className={Sidebar({ collapsed, language: isRTL ? "ar" : "ltr" })}>

   

        {/* Navigation */}
        {firmId && (
          <nav className="flex flex-col gap-3 px-2">

            {/* MAIN */}
            <SidebarMenu title={lang(language, "Main")}>
              <SidebarItems
                firmId={firmId as string}
                pathname={pathname}
                language={language}
                session={session}
              />
            </SidebarMenu>

          </nav>
        )}

        {/* Footer */}
        <div className="mt-auto flex flex-col items-center gap-2 py-3 text-center">
          <Divider />
          <span className="text-[10px] text-[#4b5563] dark:text-[#b0b8c9]">
            {lang(language, "Powered by Alrateb")}
          </span>
        </div>

      </div>
    </aside>
  );
};
