'use client';

import moment from 'moment';
import {
  Button,
  Input,
  Pagination,
  Select,
  SelectItem,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from '@heroui/react';
import {
  PencilSquareIcon,
  TrashIcon,
  InformationCircleIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/solid';
import { TableSkeleton } from '@/lib/Skeletons';
import type { InspectionDB } from '../types';

interface InspectionTableProps {
  language: string;
  inspections: InspectionDB[];
  loading: boolean;
  page: number;
  totalPages: number;
  search: string;
  statusFilter: string;
  selectedKeys: Set<string>;
  onSearchChange: (value: string) => void;
  onStatusFilterChange: (value: string) => void;
  onPageChange: (page: number) => void;
  onSelectionChange: (keys: Set<string>) => void;
  onView: (inspection: InspectionDB) => void;
  onEdit: (inspection: InspectionDB) => void;
  onDelete: (id: number) => void;
}

export default function InspectionTable({
  language,
  inspections,
  loading,
  page,
  totalPages,
  search,
  statusFilter,
  selectedKeys,
  onSearchChange,
  onStatusFilterChange,
  onPageChange,
  onSelectionChange,
  onView,
  onEdit,
  onDelete,
}: InspectionTableProps) {
  return (
    <Table
      aria-label={language === 'ar' ? 'جدول الفحوصات' : 'Inspections table'}
      selectionMode="multiple"
      selectedKeys={selectedKeys}
      onSelectionChange={(keys) => onSelectionChange(keys as Set<string>)}
      topContent={
        <div className="flex gap-3 p-3 border-b border-border">
          <Input
            placeholder={language === 'ar' ? 'بحث...' : 'Search...'}
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            startContent={<MagnifyingGlassIcon className="h-5 w-5" />}
          />
          <Select
            selectedKeys={[statusFilter]}
            onSelectionChange={(keys) => onStatusFilterChange(Array.from(keys)[0] as string)}
          >
            <SelectItem key="all">{language === 'ar' ? 'الكل' : 'All'}</SelectItem>
            <SelectItem key="pending">{language === 'ar' ? 'قيد الانتظار' : 'Pending'}</SelectItem>
            <SelectItem key="completed">{language === 'ar' ? 'مكتمل' : 'Completed'}</SelectItem>
          </Select>
        </div>
      }
      bottomContent={
        <div className="flex justify-between p-3 border-t border-border">
          <div className="flex gap-2 flex-wrap">
            <Button
              size="sm"
              variant="flat"
              className="transition-transform duration-200 hover:scale-105"
              onPress={() => onPageChange(Math.max(page - 1, 1))}
              isDisabled={page === 1}
            >
              {language === 'ar' ? 'السابق' : 'Previous'}
            </Button>
            <Button
              size="sm"
              variant="flat"
              className="transition-transform duration-200 hover:scale-105"
              onPress={() => onPageChange(Math.min(page + 1, totalPages))}
              isDisabled={page === totalPages}
            >
              {language === 'ar' ? 'التالي' : 'Next'}
            </Button>
          </div>

          <span className="text-xs text-foreground/50">
            {language === 'ar' ? `الصفحة ${page} من ${totalPages}` : `Page ${page} of ${totalPages}`}
          </span>

          <Pagination
            style={{ direction: 'ltr' }}
            page={page}
            total={totalPages}
            onChange={onPageChange}
            showControls
            color="primary"
            size="sm"
            isDisabled={inspections.length === 0}
          />
        </div>
      }
    >
      <TableHeader>
        <TableColumn>ID</TableColumn>
        <TableColumn>{language === 'ar' ? 'الحجز' : 'Booking'}</TableColumn>
        <TableColumn>{language === 'ar' ? 'المركبة' : 'Vehicle'}</TableColumn>
        <TableColumn>{language === 'ar' ? 'النوع' : 'Type'}</TableColumn>
        <TableColumn>{language === 'ar' ? 'التاريخ' : 'Date'}</TableColumn>
        <TableColumn>{language === 'ar' ? 'قام بالفحص' : 'Inspected By'}</TableColumn>
        <TableColumn className="text-end">{language === 'ar' ? 'الإجراءات' : 'Actions'}</TableColumn>
      </TableHeader>

      <TableBody
        isLoading={loading}
        loadingContent={<TableSkeleton rows={8} columns={7} />}
        emptyContent={language === 'ar' ? 'لا توجد فحوصات' : 'No inspections found'}
      >
        {inspections.map((ins) => (
          <TableRow key={ins.id}>
            <TableCell>{ins.id}</TableCell>
            <TableCell>{ins.booking_id}</TableCell>
            <TableCell>{ins.vehicle_name}</TableCell>
            <TableCell>{ins.inspection_type}</TableCell>
            <TableCell>
              {ins.inspection_date ? moment(ins.inspection_date).format('DD MMM YYYY, hh:mm A') : '-'}
            </TableCell>
            <TableCell>
              {language === 'ar' ? ins.inspected_by_name_ar || '-' : ins.inspected_by_name || '-'}
            </TableCell>
            <TableCell className="flex items-center justify-end gap-2">
              <Button
                isIconOnly
                radius="full"
                variant="flat"
                color="default"
                className="transition-transform duration-200 hover:scale-110 hover:bg-background/30"
                onPress={() => onView(ins)}
              >
                <InformationCircleIcon className="h-5 w-5" />
              </Button>
              <Button
                variant="flat"
                color="primary"
                size="sm"
                startContent={<PencilSquareIcon className="h-4 w-4" />}
                onPress={() => onEdit(ins)}
              >
                {language === 'ar' ? 'تعديل' : 'Edit'}
              </Button>
              <Button
                variant="flat"
                color="danger"
                size="sm"
                startContent={<TrashIcon className="h-4 w-4" />}
                onPress={() => onDelete(ins.id)}
              >
                {language === 'ar' ? 'حذف' : 'Delete'}
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}