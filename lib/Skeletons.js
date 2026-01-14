import { Skeleton, Card } from "@heroui/react";

export function TableSkeleton({ rows = 4, columns = 4 }) {
  return (
    <div className="w-full flex flex-col gap-3">
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className={`w-full grid grid-cols-${columns} gap-4 px-5`}>
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton key={colIndex} className="h-6 rounded-lg" />
          ))}
        </div>
      ))}
    </div>
  );
}
