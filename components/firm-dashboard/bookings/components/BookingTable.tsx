'use client';

import {
  Button,
  Input,
  Pagination,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from '@heroui/react';
import {
  InformationCircleIcon,
  MagnifyingGlassIcon,
  PencilSquareIcon,
  TrashIcon,
} from '@heroicons/react/24/solid';
import { TableSkeleton } from '@/lib/Skeletons';
import { BookingDB } from '../types/bookingTypes';

interface BookingTableProps {
  language: string;
  bookings: BookingDB[];
  loading: boolean;
  search: string;
  setSearch: (value: string) => void;
  setPage: (page: number) => void;
  page: number;
  totalPages: number;
  totalCount: number;
  selectedKeys: Set<string>;
  setSelectedKeys: (keys: Set<string>) => void;
  onViewDetails: (bookingId: number) => void;
  onEdit: (booking: BookingDB) => void;
  onDelete: (id: number) => void;
  onPayment: (booking: BookingDB) => void;
}

export const BookingTable = ({
  language,
  bookings,
  loading,
  search,
  setSearch,
  setPage,
  page,
  totalPages,
  totalCount,
  selectedKeys,
  setSelectedKeys,
  onViewDetails,
  onEdit,
  onDelete,
  onPayment,
}: BookingTableProps) => {
  return (
    <Table
      aria-label={language === 'ar' ? 'جدول الحجوزات' : 'Bookings Table'}
      classNames={{
        table:
          'min-w-full text-base bg-white dark:bg-gray-800 rounded-lg shadow-md transition-all duration-300',
      }}
      selectionMode="multiple"
      selectedKeys={selectedKeys}
      onSelectionChange={(keys) => {
        if (keys === 'all') {
          setSelectedKeys(new Set(bookings.map((v) => String(v.id))));
        } else {
          setSelectedKeys(keys as Set<string>);
        }
      }}
      topContent={
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-3 border-b border-border">
          <div className="flex flex-wrap gap-3 items-center">
            <Input
              startContent={
                <MagnifyingGlassIcon className="h-5 w-5 text-foreground/50" />
              }
              placeholder={language === 'ar' ? 'بحث...' : 'Search...'}
              variant="faded"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="bg-gray-50 dark:bg-gray-700 text-black dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-400"
            />
          </div>

          <span className="text-sm text-foreground/60">
            {language === 'ar' ? `${totalCount} نتيجة` : `${totalCount} results`}
          </span>
        </div>
      }
      bottomContent={
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 p-3 border-t border-border">
          <div className="flex gap-2 flex-wrap">
            <Button
              size="sm"
              variant="flat"
              className="transition-transform duration-200 hover:scale-105"
              onPress={() => setPage(Math.max(page - 1, 1))}
              isDisabled={page === 1}
            >
              {language === 'ar' ? 'السابق' : 'Previous'}
            </Button>
            <Button
              size="sm"
              variant="flat"
              className="transition-transform duration-200 hover:scale-105"
              onPress={() => setPage(Math.min(page + 1, totalPages))}
              isDisabled={page === totalPages}
            >
              {language === 'ar' ? 'التالي' : 'Next'}
            </Button>
          </div>
          <span className="text-xs text-foreground/50">
            {language === 'ar'
              ? `الصفحة ${page} من ${totalPages}`
              : `Page ${page} of ${totalPages}`}
          </span>
          <Pagination
            style={{ direction: 'ltr' }}
            page={page}
            total={totalPages}
            onChange={setPage}
            showControls
            color="primary"
            size="sm"
            isDisabled={bookings.length === 0}
          />
        </div>
      }
    >
      <TableHeader>
        <TableColumn>{language === 'ar' ? 'الزبون' : 'Customer'}</TableColumn>
        <TableColumn>{language === 'ar' ? 'المركبة' : 'Vehicle'}</TableColumn>
        <TableColumn>{language === 'ar' ? 'الفرع' : 'Branch'}</TableColumn>
        <TableColumn>{language === 'ar' ? 'الحالة' : 'Status'}</TableColumn>
        <TableColumn className="text-end">
          {language === 'ar' ? 'المجموع' : 'Total'}
        </TableColumn>
        <TableColumn className="text-end">
          {language === 'ar' ? 'الإجراءات' : 'Actions'}
        </TableColumn>
      </TableHeader>

      {loading ? (
        <TableBody
          loadingContent={<TableSkeleton rows={8} columns={8} />}
          isLoading={loading}
          emptyContent={''}
        >
          {[]}
        </TableBody>
      ) : (
        <TableBody
          emptyContent={
            bookings.length === 0
              ? language === 'ar'
                ? 'لا توجد حجوزات'
                : 'No bookings found'
              : undefined
          }
        >
          {bookings.map((booking) => (
            <TableRow
              key={booking.id}
              className="group bg-white dark:bg-gray-700/60 rounded-xl shadow-md transition-all duration-300 hover:scale-[1.02] hover:bg-gray-100 dark:hover:bg-gray-600 hover:shadow-xl"
            >
              <TableCell>{booking.customer_name}</TableCell>
              <TableCell>{booking.vehicle_name || '-'}</TableCell>
              <TableCell>
                {language === 'ar'
                  ? booking.branch_name_ar || '-'
                  : booking.branch_name || '-'}
              </TableCell>
              <TableCell>{booking.status}</TableCell>
              <TableCell className="text-right">
                {booking.total_amount ?? 0} {booking.currency_code || '₪'}
              </TableCell>

              <TableCell className="flex items-center justify-end gap-2">
                <Button
                  isIconOnly
                  radius="full"
                  variant="flat"
                  color="default"
                  onPress={() => onViewDetails(booking.id)}
                  className="dark:text-gray-200 dark:border-gray-400 hover:bg-red-600/20"
                >
                  <InformationCircleIcon className="h-5 w-5" />
                </Button>
                <Button
                  variant="flat"
                  color="primary"
                  size="sm"
                  startContent={<PencilSquareIcon className="h-4 w-4" />}
                  onPress={() => onEdit(booking)}
                >
                  {language === 'ar' ? 'تعديل' : 'Edit'}
                </Button>
                <Button
                  variant="flat"
                  color="danger"
                  size="sm"
                  startContent={<TrashIcon className="h-4 w-4" />}
                  onPress={() => onDelete(booking.id)}
                >
                  {language === 'ar' ? 'حذف' : 'Delete'}
                </Button>
                <Button
                  variant="flat"
                  color="success"
                  size="sm"
                  onPress={() => onPayment(booking)}
                >
                  {language === 'ar' ? 'دفع' : 'Pay'}
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      )}
    </Table>
  );
};