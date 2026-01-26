'use client';

import { Button } from '@heroui/react';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/solid';

interface InspectionHeaderProps {
  language: string;
  selectedCount: number;
  onBulkDelete: () => void;
  onCreateNew: () => void;
}

export default function InspectionHeader({
  language,
  selectedCount,
  onBulkDelete,
  onCreateNew,
}: InspectionHeaderProps) {
  return (
    <section className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div>
        <p className="text-sm uppercase tracking-[0.3em]">
          {language === 'ar' ? 'إدارة الفحوصات' : 'INSPECTIONS MANAGEMENT'}
        </p>
        <h1 className="mt-2 text-3xl font-semibold">
          {language === 'ar' ? 'الفحوصات' : 'Inspections'}
        </h1>
      </div>

      <div className="flex gap-2">
        {selectedCount > 0 && (
          <Button
            color="danger"
            startContent={<TrashIcon className="h-4 w-4" />}
            onPress={onBulkDelete}
          >
            {language === 'ar' ? `حذف (${selectedCount})` : `Delete (${selectedCount})`}
          </Button>
        )}
        <Button
          variant="solid"
          color="primary"
          startContent={
            <PlusIcon className="h-5 w-5 animate-pulse text-white drop-shadow-lg" />
          }
          onPress={onCreateNew}
          className="
            relative overflow-hidden
            text-white font-extrabold tracking-wide
            rounded-3xl
            px-6 py-3
            bg-gradient-to-r from-green-500 via-lime-600 to-emerald-500
            shadow-xl
            transition-all duration-500
            transform hover:scale-110 hover:shadow-2xl
            before:absolute before:top-0 before:left-[-75%] before:w-0 before:h-full
            before:bg-white/30 before:rotate-12 before:transition-all before:duration-500
            hover:before:w-[200%]
          "
        >
          <span className="relative animate-gradient-text bg-gradient-to-r from-white via-pink-100 to-white bg-clip-text text-transparent">
            {language === 'ar' ? 'فحص جديد' : 'New Inspection'}
          </span>
        </Button>
      </div>
    </section>
  );
}