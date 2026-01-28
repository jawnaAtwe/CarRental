import moment from 'moment';
import {
  Button,
  Chip,
  Input,
  Pagination,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
  User,
  Selection,
} from '@heroui/react';
import {
  MagnifyingGlassIcon,
  PencilSquareIcon,
  TrashIcon,
  InformationCircleIcon,
  TagIcon,
  UserGroupIcon,
  KeyIcon,
} from '@heroicons/react/24/solid';
import { TableSkeleton } from '@/lib/Skeletons';
import { RoleDB } from '../hooks/types';

type RolesTableProps = {
  language: string;
  roles: RoleDB[];
  loading: boolean;
  search: string;
  setSearch: (value: string) => void;
  page: number;
  setPage: (page: number) => void;
  totalPages: number;
  totalCount: number;
  selectedKeys: Selection;
  setSelectedKeys: (keys: Selection) => void;
  onView: (role: RoleDB) => void;
  onEdit: (role: RoleDB) => void;
  onDelete: (id: number) => void;
};

export const RolesTable = ({
  language,
  roles,
  loading,
  search,
  setSearch,
  page,
  setPage,
  totalPages,
  totalCount,
  selectedKeys,
  setSelectedKeys,
  onView,
  onEdit,
  onDelete,
}: RolesTableProps) => {
  return (
    <Table
      aria-label={language === 'ar' ? 'جدول الأدوار' : 'Roles table'}
      classNames={{
        table: 'min-w-full text-base bg-background rounded-lg shadow-md overflow-hidden transition-all duration-300',
      }}
      selectionMode="multiple"
      selectedKeys={selectedKeys}
      onSelectionChange={setSelectedKeys}
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
            {language === 'ar' ? `صفحة ${page} من ${totalPages}` : `Page ${page} of ${totalPages}`}
          </span>
          <Pagination
            style={{ direction: 'ltr' }}
            page={page}
            total={totalPages}
            onChange={setPage}
            showControls
            color="primary"
            size="sm"
            isDisabled={roles.length === 0}
          />
        </div>
      }
    >
      <TableHeader>
        <TableColumn>{language === 'ar' ? 'الدور' : 'Role'}</TableColumn>
        <TableColumn>{language === 'ar' ? 'الوصف' : 'Description'}</TableColumn>
        <TableColumn>{language === 'ar' ? 'الصلاحيات' : 'Permissions'}</TableColumn>
        <TableColumn>{language === 'ar' ? 'تاريخ الإنشاء' : 'Created At'}</TableColumn>
        <TableColumn className="text-end">{language === 'ar' ? 'الإجراءات' : 'Actions'}</TableColumn>
      </TableHeader>
      {loading ? (
        <TableBody loadingContent={<TableSkeleton rows={8} columns={5} />} isLoading={loading} emptyContent="">
          {[]}
        </TableBody>
      ) : (
        <TableBody emptyContent={language === 'ar' ? 'لا توجد أدوار' : 'No roles found'}>
          {roles.map((role) => (
            <TableRow
              key={role.id}
              className="group bg-white/90 dark:bg-gray-800/80 rounded-xl shadow-md transition-all duration-300 hover:scale-[1.02] hover:bg-white dark:hover:bg-gray-700 hover:shadow-xl"
            >
              <TableCell>
                <User
                  avatarProps={{ icon: <UserGroupIcon className="h-5 w-5" />, size: 'md' }}
                  name={<span>{language === 'ar' ? role.name_ar || role.name : role.name}</span>}
                  description={
                    <div className="text-xs text-foreground/70 flex items-center gap-1">
                      <TagIcon className="h-3 w-3" />
                      <span>{role.slug}</span>
                    </div>
                  }
                />
              </TableCell>
              <TableCell>
                <span className="text-sm text-foreground/70">{role.description || '-'}</span>
              </TableCell>
              <TableCell>
                <Chip size="sm" color="primary" variant="flat" startContent={<KeyIcon className="h-4 w-4" />}>
                  {role.permissions?.length || 0} {language === 'ar' ? 'صلاحية' : 'permissions'}
                </Chip>
              </TableCell>
              <TableCell>
                {moment(role.created_at).locale(language).format('DD MMM YYYY, hh:mm A')}
              </TableCell>
              <TableCell className="flex items-center justify-end gap-2">
                <Button isIconOnly radius="full" variant="flat" color="default" onPress={() => onView(role)}>
                  <InformationCircleIcon className="h-5 w-5" />
                </Button>
                <Button
                  variant="flat"
                  color="primary"
                  size="sm"
                  startContent={<PencilSquareIcon className="h-4 w-4" />}
                  onPress={() => onEdit(role)}
                >
                  {language === 'ar' ? 'تعديل' : 'Edit'}
                </Button>
                <Button
                  variant="flat"
                  color="danger"
                  size="sm"
                  startContent={<TrashIcon className="h-4 w-4" />}
                  onPress={() => onDelete(role.id)}
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