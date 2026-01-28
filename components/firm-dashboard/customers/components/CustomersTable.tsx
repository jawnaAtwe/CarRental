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
  User,
} from '@heroui/react';
import {
  MagnifyingGlassIcon,
  PencilSquareIcon,
  TrashIcon,
  InformationCircleIcon,
  CheckBadgeIcon,
} from '@heroicons/react/24/solid';
import { TableSkeleton } from '@/lib/Skeletons';
import { StatusChip } from './StatusChip';
import { CustomerDB, CustomerStatus } from '../hooks/types';

type CustomersTableProps = {
  language: string;
  customers: CustomerDB[];
  loading: boolean;
  search: string;
  setSearch: (value: string) => void;
  statusFilter: CustomerStatus | 'all';
  setStatusFilter: (status: CustomerStatus | 'all') => void;
  page: number;
  setPage: (page: number) => void;
  totalPages: number;
  totalCount: number;
  selectedKeys: Set<string>;
  setSelectedKeys: (keys: Set<string>) => void;
  onView: (customer: CustomerDB) => void;
  onEdit: (customer: CustomerDB) => void;
  onDelete: (id: number) => void;
};

export const CustomersTable = ({
  language,
  customers,
  loading,
  search,
  setSearch,
  statusFilter,
  setStatusFilter,
  page,
  setPage,
  totalPages,
  totalCount,
  selectedKeys,
  setSelectedKeys,
  onView,
  onEdit,
  onDelete,
}: CustomersTableProps) => {
  return (
    <Table
      aria-label={language === 'ar' ? 'جدول المستخدمين' : 'Customers table'}
      classNames={{
        table: 'min-w-full text-base bg-background rounded-lg shadow-md overflow-hidden transition-all duration-300',
      }}
      selectionMode="multiple"
      selectedKeys={selectedKeys}
      onSelectionChange={(keys) => {
        if (keys === 'all') {
          setSelectedKeys(new Set(customers.map((u) => String(u.id))));
        } else {
          setSelectedKeys(keys as Set<string>);
        }
      }}
      topContent={
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-3 border-b border-border">
          <div className="flex flex-wrap gap-3 items-center">
            <Input
              startContent={<MagnifyingGlassIcon className="h-5 w-5 text-foreground/50" />}
              placeholder={language === 'ar' ? 'بحث...' : 'Search...'}
              variant="faded"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="min-w-[240px] transition-all duration-200 focus:shadow-md focus:border-primary"
            />

            <Select
              startContent={<CheckBadgeIcon className="h-5 w-5 text-foreground/50" />}
              variant="faded"
              placeholder={language === 'ar' ? 'الحالة' : 'Status'}
              className="min-w-[160px] transition-all duration-200 focus:shadow-md focus:border-primary"
              selectedKeys={[statusFilter]}
              onChange={(e) => {
                setStatusFilter(e.target.value as any);
                setPage(1);
              }}
            >
              <SelectItem key="all">{language === 'ar' ? 'الكل' : 'All'}</SelectItem>
              <SelectItem key="active">{language === 'ar' ? 'نشط' : 'Active'}</SelectItem>
              <SelectItem key="blacklisted">
                {language === 'ar' ? 'القائمة السوداء' : 'Blacklisted'}
              </SelectItem>
            </Select>
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
            {language === 'ar' ? `الصفحة ${page} من ${totalPages}` : `Page ${page} of ${totalPages}`}
          </span>

          <Pagination
            style={{ direction: 'ltr' }}
            page={page}
            total={totalPages}
            onChange={setPage}
            showControls
            color="primary"
            size="sm"
            isDisabled={customers.length === 0}
          />
        </div>
      }
    >
      <TableHeader>
        <TableColumn>{language === 'ar' ? 'المستخدم' : 'User'}</TableColumn>
        <TableColumn>{language === 'ar' ? 'تاريخ الانضمام' : 'Joined'}</TableColumn>
        <TableColumn className="text-end">{language === 'ar' ? 'الإجراءات' : 'Actions'}</TableColumn>
      </TableHeader>

      {loading ? (
        <TableBody loadingContent={<TableSkeleton rows={8} columns={8} />} isLoading={loading} emptyContent="">
          {[]}
        </TableBody>
      ) : (
        <TableBody emptyContent={language === 'ar' ? 'لا يوجد مستخدمون' : 'No users found'}>
          {customers.map((customer) => (
            <TableRow
              key={String(customer.id)}
              className="group bg-white/90 dark:bg-gray-800/80 rounded-xl shadow-md transition-all duration-300 hover:scale-[1.02] hover:bg-white dark:hover:bg-gray-700 hover:shadow-xl"
            >
              <TableCell>
                <div className="flex items-center gap-2">
                  <User
                    aria-label={
                      language === 'ar' ? `عرض المستخدم ${customer.full_name}` : `View user ${customer.full_name}`
                    }
                    avatarProps={{ src: customer.profile_image || '', size: 'md' }}
                    name={
                      <div className="flex items-center gap-1">
                        <StatusChip status={customer.status} language={language} />
                        <span>
                          {language === 'ar'
                            ? customer.full_name || customer.full_name
                            : customer.full_name}
                        </span>
                      </div>
                    }
                    description={
                      <div className="text-xs text-foreground/50">
                        <p>{customer.phone || customer.email}</p>
                      </div>
                    }
                  />
                </div>
              </TableCell>

              <TableCell>
                <div className="flex items-center gap-3">
                  {moment(customer.created_at).locale(language).format('DD MMM YYYY, hh:mm A')}
                </div>
              </TableCell>

              <TableCell className="flex items-center justify-end gap-2">
                <Button
                  isIconOnly
                  radius="full"
                  variant="flat"
                  color="default"
                  className="transition-transform duration-200 hover:scale-110 hover:bg-background/30"
                  onPress={() => onView(customer)}
                >
                  <InformationCircleIcon className="h-5 w-5" />
                </Button>
                <Button
                  variant="flat"
                  color="primary"
                  size="sm"
                  startContent={<PencilSquareIcon className="h-4 w-4" />}
                  onPress={() => onEdit(customer)}
                >
                  {language === 'ar' ? 'تعديل' : 'Edit'}
                </Button>
                <Button
                  variant="flat"
                  color="danger"
                  size="sm"
                  startContent={<TrashIcon className="h-4 w-4" />}
                  onPress={() => onDelete(customer.id)}
                >
                  {language === 'ar' ? 'حذف' : 'Delete'}
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      )}
    </Table>
  );
};