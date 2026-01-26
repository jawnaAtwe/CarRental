import moment from 'moment';
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
  MagnifyingGlassIcon,
  PencilSquareIcon,
  TrashIcon,
} from '@heroicons/react/24/solid';
import { GlobeAltIcon } from '@heroicons/react/24/solid';
import { TableSkeleton } from '@/lib/Skeletons';
import { StatusChip } from './StatusChip';

type BranchDB = {
  id: number;
  tenant_id: number;
  name: string;
  name_ar?: string | null;
  address?: string | null;
  address_ar?: string | null;
  latitude?: string | null;
  longitude?: string | null;
  status: 'active' | 'deleted';
  created_at?: string | null;
};

type BranchesTableProps = {
  language: string;
  branches: BranchDB[];
  loading: boolean;
  search: string;
  setSearch: (value: string) => void;
  page: number;
  setPage: (page: number) => void;
  totalPages: number;
  totalCount: number;
  selectedKeys: Set<string>;
  setSelectedKeys: (keys: Set<string>) => void;
  onEdit: (branch: BranchDB) => void;
  onDelete: (id: number) => void;
};

export const BranchesTable = ({
  language,
  branches,
  loading,
  search,
  setSearch,
  page,
  setPage,
  totalPages,
  totalCount,
  selectedKeys,
  setSelectedKeys,
  onEdit,
  onDelete,
}: BranchesTableProps) => {
  return (
    <Table
      aria-label={language === 'ar' ? 'جدول الفروع' : 'Branches table'}
      classNames={{
        table: 'min-w-full text-base bg-white dark:bg-gray-800 rounded-lg shadow-md transition-all duration-300',
      }}
      selectionMode="multiple"
      selectedKeys={selectedKeys}
      onSelectionChange={(keys) => setSelectedKeys(keys as Set<string>)}
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
              onPress={() => setPage(Math.max(page - 1, 1))}
              isDisabled={page === 1}
            >
              {language === 'ar' ? 'السابق' : 'Previous'}
            </Button>
            <Button
              size="sm"
              variant="flat"
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
            isDisabled={branches.length === 0}
          />
        </div>
      }
    >
      <TableHeader>
        <TableColumn>{language === 'ar' ? 'الفرع' : 'Branch'}</TableColumn>
        <TableColumn>{language === 'ar' ? 'تاريخ الإنشاء' : 'Created At'}</TableColumn>
        <TableColumn className="text-end">{language === 'ar' ? 'الإجراءات' : 'Actions'}</TableColumn>
      </TableHeader>

      {loading ? (
        <TableBody loadingContent={<TableSkeleton rows={8} columns={8} />} isLoading={loading} emptyContent="">
          {[]}
        </TableBody>
      ) : (
        <TableBody emptyContent={language === 'ar' ? 'لا يوجد فروع' : 'No branches found'}>
          {branches.map((branch) => (
            <TableRow
              key={String(branch.id)}
              className="group bg-white dark:bg-gray-700/60 rounded-xl shadow-md transition-all duration-300 hover:scale-[1.02] hover:bg-gray-100 dark:hover:bg-gray-600 hover:shadow-xl"
            >
              <TableCell>
                <div className="flex items-center gap-3">
                  <div className="bg-cyan-400 rounded-full p-3 shadow-md transition-transform group-hover:scale-110">
                    <GlobeAltIcon className="h-8 w-8 text-white" />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-semibold text-text">{branch.name}</span>
                    {branch.status && <StatusChip status={branch.status} language={language} />}
                  </div>
                </div>
              </TableCell>
              <TableCell>
                {branch.created_at ? moment(branch.created_at).locale(language).format('DD MMM YYYY, hh:mm A') : '-'}
              </TableCell>
              <TableCell className="text-end">
                <div className="flex justify-end gap-2">
                  <Button
                    variant="flat"
                    color="primary"
                    size="sm"
                    startContent={<PencilSquareIcon className="h-4 w-4" />}
                    onPress={() => onEdit(branch)}
                  >
                    {language === 'ar' ? 'تعديل' : 'Edit'}
                  </Button>
                  <Button
                    variant="flat"
                    color="danger"
                    size="sm"
                    startContent={<TrashIcon className="h-4 w-4" />}
                    onPress={() => onDelete(branch.id)}
                  >
                    {language === 'ar' ? 'حذف' : 'Delete'}
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      )}
    </Table>
  );
};