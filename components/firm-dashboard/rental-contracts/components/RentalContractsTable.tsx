import moment from 'moment';
import {
  Button,
  Input,
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
  MagnifyingGlassIcon,
  PencilSquareIcon,
  TrashIcon,
  EyeIcon,
  DocumentTextIcon,
  CheckBadgeIcon,
} from '@heroicons/react/24/solid';
import { TableSkeleton } from '@/lib/Skeletons';
import { StatusChip } from './StatusChip';
import { RentalContractDB, ContractStatus } from '../hooks/types';
import { STATUS_OPTIONS } from '../constants';

type RentalContractsTableProps = {
  language: string;
  contracts: RentalContractDB[];
  loading: boolean;
  search: string;
  setSearch: (value: string) => void;
  statusFilter: ContractStatus | 'all';
  setStatusFilter: (status: ContractStatus | 'all') => void;
  onView: (contract: RentalContractDB) => void;
  onEdit: (contract: RentalContractDB) => void;
  onCancel: (id: number) => void;
};

export const RentalContractsTable = ({
  language,
  contracts,
  loading,
  search,
  setSearch,
  statusFilter,
  setStatusFilter,
  onView,
  onEdit,
  onCancel,
}: RentalContractsTableProps) => {
  // تصفية العقود حسب البحث
  const filteredContracts = contracts.filter((contract) => {
    const searchLower = search.toLowerCase();
    return (
      contract.contract_number?.toLowerCase().includes(searchLower) ||
      String(contract.booking_id).includes(searchLower) ||
      String(contract.customer_id).includes(searchLower)
    );
  });

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-3 border-b border-border bg-white dark:bg-gray-800 rounded-lg">
        <div className="flex flex-wrap gap-3 items-center">
          <Input
            startContent={<MagnifyingGlassIcon className="h-5 w-5 text-foreground/50" />}
            placeholder={language === 'ar' ? 'بحث...' : 'Search...'}
            variant="faded"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="min-w-[240px] transition-all duration-200 focus:shadow-md focus:border-primary"
          />

          <Select
            startContent={<CheckBadgeIcon className="h-5 w-5 text-foreground/50" />}
            variant="faded"
            placeholder={language === 'ar' ? 'الحالة' : 'Status'}
            className="min-w-[160px] transition-all duration-200 focus:shadow-md focus:border-primary"
            selectedKeys={[statusFilter]}
            onChange={(e) => setStatusFilter(e.target.value as any)}
          >
            {STATUS_OPTIONS.map((option) => (
              <SelectItem key={option.value}>{language === 'ar' ? option.labelAr : option.labelEn}</SelectItem>
            ))}
          </Select>
        </div>

        <span className="text-sm text-foreground/60">
          {language === 'ar' ? `${filteredContracts.length} نتيجة` : `${filteredContracts.length} results`}
        </span>
      </div>

      {/* Table */}
      <Table
        aria-label={language === 'ar' ? 'جدول عقود الإيجار' : 'Rental Contracts table'}
        classNames={{
          table: 'min-w-full text-base bg-white dark:bg-gray-800 rounded-lg shadow-md transition-all duration-300',
        }}
      >
        <TableHeader>
          <TableColumn>{language === 'ar' ? 'رقم العقد' : 'Contract Number'}</TableColumn>
          <TableColumn>{language === 'ar' ? 'رقم الحجز' : 'Booking ID'}</TableColumn>
          <TableColumn>{language === 'ar' ? 'الحالة' : 'Status'}</TableColumn>
          <TableColumn>{language === 'ar' ? 'تاريخ الإنشاء' : 'Created At'}</TableColumn>
          <TableColumn className="text-end">{language === 'ar' ? 'الإجراءات' : 'Actions'}</TableColumn>
        </TableHeader>

        {loading ? (
          <TableBody loadingContent={<TableSkeleton rows={8} columns={5} />} isLoading={loading} emptyContent="">
            {[]}
          </TableBody>
        ) : (
          <TableBody emptyContent={language === 'ar' ? 'لا توجد عقود' : 'No contracts found'}>
            {filteredContracts.map((contract) => (
              <TableRow
                key={String(contract.id)}
                className="group bg-white dark:bg-gray-700/60 rounded-xl shadow-md transition-all duration-300 hover:scale-[1.02] hover:bg-gray-100 dark:hover:bg-gray-600 hover:shadow-xl"
              >
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="bg-indigo-400 rounded-full p-3 shadow-md transition-transform group-hover:scale-110">
                      <DocumentTextIcon className="h-8 w-8 text-white" />
                    </div>
                    <div className="flex flex-col">
                      <span className="font-semibold text-text dark:text-white">
                        {contract.contract_number || `#${contract.id}`}
                      </span>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="font-medium">#{contract.booking_id}</span>
                </TableCell>
                <TableCell>
                  <StatusChip status={contract.status} language={language} />
                </TableCell>
                <TableCell>
                  {contract.created_at
                    ? moment(contract.created_at).locale(language).format('DD MMM YYYY, hh:mm A')
                    : '-'}
                </TableCell>
                <TableCell className="text-end">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="flat"
                      color="default"
                      size="sm"
                      startContent={<EyeIcon className="h-4 w-4" />}
                      onPress={() => onView(contract)}
                    >
                      {language === 'ar' ? 'عرض' : 'View'}
                    </Button>
                    {contract.status === 'draft' && (
                      <>
                        <Button
                          variant="flat"
                          color="primary"
                          size="sm"
                          startContent={<PencilSquareIcon className="h-4 w-4" />}
                          onPress={() => onEdit(contract)}
                        >
                          {language === 'ar' ? 'تعديل' : 'Edit'}
                        </Button>
                        <Button
                          variant="flat"
                          color="danger"
                          size="sm"
                          startContent={<TrashIcon className="h-4 w-4" />}
                          onPress={() => onCancel(contract.id)}
                        >
                          {language === 'ar' ? 'إلغاء' : 'Cancel'}
                        </Button>
                      </>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        )}
      </Table>
    </div>
  );
};