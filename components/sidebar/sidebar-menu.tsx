import React, { ReactNode } from "react";

interface Props {
  title: string;
  children?: ReactNode;
}

export const SidebarMenu = ({ title, children }: Props) => {
  const areAllChildrenEmpty = (children: ReactNode) =>
    React.Children
      .toArray(children)
      .every(child => child === null || child === undefined || child === "");

  if (!children || areAllChildrenEmpty(children)) return null;

  return (
    <div
      className="
        flex flex-col gap-3
        p-4 rounded-2xl

        bg-white/70 dark:bg-gray-800/60
        backdrop-blur-md

        border border-gray-200/70 dark:border-gray-700/60

        shadow-md dark:shadow-black/30
        transition-all duration-500
        hover:shadow-lg dark:hover:shadow-black/50

        text-gray-800 dark:text-gray-100
      "
    >
      {/* Title */}
      <span className="
        text-xs uppercase tracking-widest font-semibold
        text-gray-700 dark:text-gray-300
        opacity-80
      ">
        {title}
      </span>

      {/* Items */}
      <div className="flex flex-wrap gap-3 mt-2">
        {React.Children.map(children, (child, idx) => (
          <div
            key={idx}
            className="
              font-medium
              px-3 py-1.5
              rounded-lg
              shadow-sm
              transition-all duration-300

              bg-white/60 dark:bg-gray-700/60
              hover:bg-white/90 dark:hover:bg-gray-700

              text-gray-700 dark:text-gray-100
              hover:text-gray-900 dark:hover:text-white

              hover:-translate-y-0.5
            "
          >
            {child}
          </div>
        ))}
      </div>
    </div>
  );
};
