import React from "react";

interface Props {
  title: string;
  children?: React.ReactNode;
}

export const SidebarMenu = ({ title, children }: Props) => {
  const areAllChildrenEmpty = (children: any) => {
    const childrenArray = React.Children.toArray(children);
    return childrenArray.every(child => child === '' || child === null || child === undefined);
  };

  return (
    <>
      {children && !areAllChildrenEmpty(children) && (
       <div className="
  flex flex-col gap-3
  p-4 rounded-2xl
  bg-gradient-to-br from-yellow-500/80 via-yellow-600/70 to-yellow-600/80
  backdrop-blur-md
  border border-yellow-600/70
  shadow-md
  transition-all duration-500
  hover:shadow-lg
  text-black
">
          <span className="text-gray-900 text-xs uppercase tracking-widest opacity-80">{title}</span>
          <div className="flex flex-wrap gap-6 mt-2">
            {React.Children.map(children, (child, idx) => (
              <div
                key={idx}
                className="
                  font-medium
                  px-3 py-1.5
                  shadow-sm
                  rounded-lg
                  transition-all duration-300
                  hover:bg-black-300/50
                  hover:text-black-950
                  hover:-translate-y-0.5  
                "
              >
                {child}
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
};
