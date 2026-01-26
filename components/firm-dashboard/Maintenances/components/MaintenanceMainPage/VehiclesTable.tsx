import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Button,
  Pagination,
} from '@heroui/react';
import { InformationCircleIcon, PlusIcon } from '@heroicons/react/24/solid';
import { TableSkeleton } from "@/lib/Skeletons";
import { VehicleDB } from '../types';
import { FiltersSection } from './FiltersSection';

interface Props {
  language: string;
  vehicles: VehicleDB[];
  loading: boolean;
  page: number;
  totalPages: number;
  totalCount: number;
  search: string;
  statusFilter: VehicleDB['status'] | 'all';
  selectedKeys: Set<string>;
  onSelectionChange: (keys: any) => void;
  onSearchChange: (value: string) => void;
  onStatusChange: (value: VehicleDB['status'] | 'all') => void;
  onPageChange: (page: number) => void;
  onViewDetails: (vehicleId: number) => void;
  onOpenMaintenance: (vehicle: VehicleDB) => void;
}

export const VehiclesTable = ({
  language,
  vehicles,
  loading,
  page,
  totalPages,
  totalCount,
  search,
  statusFilter,
  selectedKeys,
  onSelectionChange,
  onSearchChange,
  onStatusChange,
  onPageChange,
  onViewDetails,
  onOpenMaintenance,
}: Props) => {
  return (
    <Table
      aria-label={language === 'ar' ? 'جدول المركبات' : 'Vehicles Table'}
      classNames={{
        table: 'min-w-full text-base bg-background rounded-lg shadow-md overflow-hidden transition-all duration-300',
      }}
      selectionMode="multiple"
      selectedKeys={selectedKeys}
      onSelectionChange={onSelectionChange}
      topContent={
        <FiltersSection
          language={language}
          search={search}
          statusFilter={statusFilter}
          totalCount={totalCount}
          onSearchChange={onSearchChange}
          onStatusChange={onStatusChange}
        />
      }
      bottomContent={
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 p-3 border-t border-border">
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
            isDisabled={vehicles.length === 0}
          />
        </div>
      }
    >
      <TableHeader>
        <TableColumn>{language==='ar'?'المركبة':'Vehicle'}</TableColumn>
        <TableColumn>{language==='ar'?'الفئة':'Category'}</TableColumn>
        <TableColumn>{language==='ar'?'سنة الصنع':'Year'}</TableColumn>
        <TableColumn className="text-end">{language==='ar'?'الإجراءات':'Actions'}</TableColumn>
      </TableHeader>

      {loading ? (
        <TableBody loadingContent={<TableSkeleton rows={8} columns={8}/>} isLoading={loading} emptyContent={""}>{[]}</TableBody>
      ) : (
        <TableBody
          emptyContent={vehicles.length === 0 ? (language==='ar'?'لا توجد مركبات':'No vehicles found') : undefined}
        >
          {vehicles.map(vehicle => (
            <TableRow
              key={vehicle.id}
              className="
                group
                bg-white/90 dark:bg-gray-800/90
                rounded-xl
                shadow-md dark:shadow-gray-700/50
                transition-all duration-300
                hover:scale-[1.02] hover:bg-white dark:hover:bg-gray-700 hover:shadow-xl
                text-gray-900 dark:text-gray-200
                hover:text-gray-900 dark:hover:text-gray-100
              "
            >
              <TableCell>{vehicle.make} {vehicle.model}</TableCell>
              <TableCell>{vehicle.category}</TableCell>
              <TableCell>{vehicle.year}</TableCell>
              <TableCell className="flex items-center justify-end gap-2">
                <Button
                  isIconOnly
                  radius="full"
                  variant="flat"
                  color="default"
                  onPress={() => onViewDetails(vehicle.id)}
                >
                  <InformationCircleIcon className="h-5 w-5"/>
                </Button>
                <Button
                  isIconOnly
                  radius="full"
                  variant="flat"
                  color="success"
                  onPress={() => onOpenMaintenance(vehicle)}
                >
                  <PlusIcon className="h-5 w-5" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      )}
    </Table>
  );
};