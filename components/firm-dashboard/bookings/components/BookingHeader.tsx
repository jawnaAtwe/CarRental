'use client';

import { Button } from '@heroui/react';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/solid';

interface BookingHeaderProps {
  language: string;
  selectedKeysSize: number;
  onBulkDelete: () => void;
  onCreateNew: () => void;
}

export const BookingHeader = ({
  language,
  selectedKeysSize,
  onBulkDelete,
  onCreateNew,
}: BookingHeaderProps) => {
  return (
    <section className="flex flex-col gap-4 pt-5 md:flex-row md:items-center md:justify-between">
      <div>
        <p className="text-sm uppercase tracking-[0.3em] text-gray-600 dark:text-gray-400">
          {language === 'ar' ? 'إدارة الحجوزات' : 'BOOKINGS MANAGEMENT'}
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-gray-900 dark:text-white">
          {language === 'ar' ? 'الحجوزات' : 'Bookings'}
        </h1>
      </div>

      <div className="flex gap-2">
        {selectedKeysSize > 0 && (
          <Button
            variant="flat"
            color="danger"
            startContent={<TrashIcon className="h-4 w-4" />}
            onPress={onBulkDelete}
          >
            {language === 'ar'
              ? `حذف (${selectedKeysSize})`
              : `Delete (${selectedKeysSize})`}
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
          <span className="relative animate-gradient-text bg-gradient-to-r from-white via-green-100 to-white bg-clip-text text-transparent dark:from-gray-100 dark:via-gray-200 dark:to-gray-100">
            {language === 'ar' ? 'حجز جديد' : 'New Booking'}
          </span>
        </Button>
      </div>
    </section>
  );
};