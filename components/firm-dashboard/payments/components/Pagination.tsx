// components/Pagination.tsx

import { Button } from '@heroui/react';

interface PaginationProps {
  language: string;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export const Pagination = ({
  language,
  currentPage,
  totalPages,
  onPageChange,
}: PaginationProps) => {
  return (
    <div className="mt-4 flex justify-between items-center">
      <Button
        size="sm"
        variant="flat"
        onPress={() => onPageChange(Math.max(currentPage - 1, 1))}
        isDisabled={currentPage === 1}
      >
        {language === 'ar' ? 'السابق' : 'Previous'}
      </Button>
      <span className="text-sm">
        {language === 'ar'
          ? `الصفحة ${currentPage} من ${totalPages}`
          : `Page ${currentPage} of ${totalPages}`}
      </span>
      <Button
        size="sm"
        variant="flat"
        onPress={() => onPageChange(Math.min(currentPage + 1, totalPages))}
        isDisabled={currentPage === totalPages}
      >
        {language === 'ar' ? 'التالي' : 'Next'}
      </Button>
    </div>
  );
};