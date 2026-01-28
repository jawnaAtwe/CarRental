// ================= Users Table Component =================

'use client';

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
  InformationCircleIcon,
  MagnifyingGlassIcon,
  CheckBadgeIcon,
  PencilSquareIcon,
  TrashIcon,
} from '@heroicons/react/24/solid';

import moment from 'moment';
import { TableSkeleton } from '@/lib/Skeletons';
import { UserDB, Role } from '../types/user.types';
import { StatusChip, RoleChip } from './UserChips';

interface UsersTableProps {
  users: UserDB[];
  roles: Role[];
  loading: boolean;
  language: string;
  
  // Search & Filter
  search: string;
  setSearch: (value: string) => void;
  statusFilter: string;
  setStatusFilter: (value: string) => void;
  
  // Pagination
  page: number;
  setPage: (value: number) => void;
  totalPages: number;
  totalCount: number;
  
  // Selection
  selectedKeys: Set<string>;
  setSelectedKeys: (keys: Set<string>) => void;
  
  // Actions
  onViewUser: (userId: number) => void;
  onEditUser: (user: UserDB) => void;
  onDeleteUser: (userId: number) => void;
}

export const UsersTable = ({
  users,
  roles,
  loading,
  language,
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
  onViewUser,
  onEditUser,
  onDeleteUser,
}: UsersTableProps) => {
  return (
    <Table
      aria-label={language === 'ar' ? 'جدول المستخدمين' : 'Users table'}
      classNames={{
        table: 'min-w-full text-base bg-background rounded-lg shadow-md overflow-hidden transition-all duration-300',
      }}
      selectionMode="multiple"
      selectedKeys={selectedKeys}
      onSelectionChange={(keys) => {
        if (keys === "all") {
          setSelectedKeys(new Set(users.map(u => String(u.id))));
        } else {
          setSelectedKeys(keys as Set<string>);
        }
      }}

      /* ======= Top Content: Search & Filter ======= */
      topContent={
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-3 border-b border-border">
          
          {/* Search Input & Status Filter */}
          <div className="flex flex-wrap gap-3 items-center">
            {/* Search */}
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

            {/* Status Filter */}
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
              <SelectItem key="pending_verification">{language === 'ar' ? 'في انتظار التحقق' : 'Pending Verification'}</SelectItem>
              <SelectItem key="disabled">{language === 'ar' ? 'معطل' : 'Disabled'}</SelectItem>
            </Select>
          </div>

          {/* Total Count */}
          <span className="text-sm text-foreground/60">
            {language === 'ar' ? `${totalCount} نتيجة` : `${totalCount} results`}
          </span>
        </div>
      }

      /* ======= Bottom Content: Pagination & Navigation ======= */
      bottomContent={
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 p-3 border-t border-border">
          
          {/* Previous / Next Buttons */}
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

          {/* Page Info */}
          <span className="text-xs text-foreground/50">
            {language === 'ar' ? `الصفحة ${page} من ${totalPages}` : `Page ${page} of ${totalPages}`}
          </span>

          {/* Pagination Component */}
          <Pagination
            style={{ direction: 'ltr' }}
            page={page}
            total={totalPages}
            onChange={setPage}
            showControls
            color="primary"
            size="sm"
            isDisabled={users.length === 0}
          />
        </div>
      }
    >
      <TableHeader>
        <TableColumn>{language === 'ar' ? 'المستخدم' : 'User'}</TableColumn>
        <TableColumn>{language === 'ar' ? 'الدور' : 'Role'}</TableColumn>
        <TableColumn>{language === 'ar' ? 'تاريخ الانضمام' : 'Joined'}</TableColumn>
        <TableColumn className="text-end">{language === 'ar' ? 'الإجراءات' : 'Actions'}</TableColumn>
      </TableHeader>

      {loading ? (
        <TableBody loadingContent={<TableSkeleton rows={8} columns={8} />} isLoading={loading} emptyContent={""}>{[]}</TableBody>
      ) : (
        <TableBody emptyContent={language === 'ar' ? 'لا يوجد مستخدمون' : 'No users found'}>
          {users.map((user) => (
            <TableRow 
              key={String(user.id)} 
              className="
                group
                bg-white/90 dark:bg-gray-800/90
                rounded-xl
                shadow-md dark:shadow-gray-700/50
                transition-all duration-300
                hover:scale-[1.02]
                hover:bg-white dark:hover:bg-gray-700
                hover:shadow-xl dark:hover:shadow-gray-600/40
              "
            >
              <TableCell>
                <div className="flex items-center gap-2">
                  <User
                    aria-label={language === 'ar' ? `عرض المستخدم ${user.full_name}` : `View user ${user.full_name}`}
                    avatarProps={{ src: '', size: 'md' }}
                    name={
                      <div className="flex items-center gap-1">
                        <StatusChip status={user.status} language={language} />
                        <span>{language === 'ar' ? (user.full_name_ar || user.full_name) : user.full_name}</span>
                      </div>
                    }
                    description={
                      <div className="text-xs text-foreground/50">
                        <p>{user.phone || user.email}</p>
                      </div>
                    }
                  />
                </div>
              </TableCell>

              <TableCell>
                <RoleChip roleId={user.role_id} roles={roles} language={language} />
              </TableCell>

              <TableCell>
                <div className="flex items-center gap-3">
                  {moment(user.created_at).locale(language).format('DD MMM YYYY, hh:mm A')}
                </div>
              </TableCell>
              
              <TableCell className="flex items-center justify-end gap-2">
                <Button 
                  isIconOnly 
                  radius="full" 
                  variant="flat" 
                  color="default" 
                  className="transition-transform duration-200 hover:scale-110 hover:bg-background/30"
                  onPress={() => onViewUser(user.id)}
                >
                  <InformationCircleIcon className="h-5 w-5" />
                </Button>
                <Button 
                  variant="flat" 
                  color="primary" 
                  size="sm" 
                  startContent={<PencilSquareIcon className="h-4 w-4" />}
                  onPress={() => onEditUser(user)}
                >
                  {language === 'ar' ? 'تعديل' : 'Edit'}
                </Button>
                <Button 
                  variant="flat" 
                  color="danger" 
                  size="sm" 
                  startContent={<TrashIcon className="h-4 w-4" />} 
                  onPress={() => onDeleteUser(user.id)}
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