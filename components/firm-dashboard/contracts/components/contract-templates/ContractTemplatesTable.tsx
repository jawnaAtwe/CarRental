import moment from 'moment';
import {
  Button,
  Input,
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
} from '@heroicons/react/24/solid';
import { TableSkeleton } from '@/lib/Skeletons';
import { StatusChip } from './StatusChip';
import { ContractTemplateDB } from '../../hooks/types/contract-template.types';

type ContractTemplatesTableProps = {
  language: string;
  templates: ContractTemplateDB[];
  loading: boolean;
  search: string;
  setSearch: (value: string) => void;
  onView: (template: ContractTemplateDB) => void;
  onEdit: (template: ContractTemplateDB) => void;
  onDelete: (id: number) => void;
};

export const ContractTemplatesTable = ({
  language,
  templates,
  loading,
  search,
  setSearch,
  onView,
  onEdit,
  onDelete,
}: ContractTemplatesTableProps) => {
  // تصفية النتائج حسب البحث
  const filteredTemplates = templates.filter((template) => {
    const searchLower = search.toLowerCase();
    return (
      template.name?.toLowerCase().includes(searchLower) ||
      template.language?.toLowerCase().includes(searchLower) ||
      template.content?.toLowerCase().includes(searchLower)
    );
  });

  return (
    <Table
      aria-label={language === 'ar' ? 'جدول قوالب العقود' : 'Contract Templates table'}
      classNames={{
        table: 'min-w-full text-base bg-white dark:bg-gray-800 rounded-lg shadow-md transition-all duration-300',
      }}
      topContent={
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-3 border-b border-border">
          <div className="flex flex-wrap gap-3 items-center">
            <Input
              startContent={<MagnifyingGlassIcon className="h-5 w-5 text-foreground/50" />}
              placeholder={language === 'ar' ? 'بحث...' : 'Search...'}
              variant="faded"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="min-w-[240px] transition-all duration-200 focus:shadow-md focus:border-primary"
            />
          </div>
          <span className="text-sm text-foreground/60">
            {language === 'ar' ? `${filteredTemplates.length} نتيجة` : `${filteredTemplates.length} results`}
          </span>
        </div>
      }
    >
      <TableHeader>
        <TableColumn>{language === 'ar' ? 'القالب' : 'Template'}</TableColumn>
        <TableColumn>{language === 'ar' ? 'اللغة' : 'Language'}</TableColumn>
        <TableColumn>{language === 'ar' ? 'الحالة' : 'Status'}</TableColumn>
        <TableColumn>{language === 'ar' ? 'تاريخ الإنشاء' : 'Created At'}</TableColumn>
        <TableColumn className="text-end">{language === 'ar' ? 'الإجراءات' : 'Actions'}</TableColumn>
      </TableHeader>

      {loading ? (
        <TableBody loadingContent={<TableSkeleton rows={8} columns={5} />} isLoading={loading} emptyContent="">
          {[]}
        </TableBody>
      ) : (
        <TableBody emptyContent={language === 'ar' ? 'لا يوجد قوالب' : 'No templates found'}>
          {filteredTemplates.map((template) => (
            <TableRow
              key={String(template.id)}
              className="group bg-white dark:bg-gray-700/60 rounded-xl shadow-md transition-all duration-300 hover:scale-[1.02] hover:bg-gray-100 dark:hover:bg-gray-600 hover:shadow-xl"
            >
              <TableCell>
                <div className="flex items-center gap-3">
                  <div className="bg-purple-400 rounded-full p-3 shadow-md transition-transform group-hover:scale-110">
                    <DocumentTextIcon className="h-8 w-8 text-white" />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-semibold text-text dark:text-white">
                      {template.name || (language === 'ar' ? 'قالب بدون عنوان' : 'Untitled Template')}
                    </span>
                    <span className="text-xs text-gray-500">
                      {template.content?.substring(0, 50)}...
                    </span>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <span className="font-medium uppercase">{template.language}</span>
              </TableCell>
              <TableCell>
                <StatusChip status={template.status} language={language} />
              </TableCell>
              <TableCell>
                {template.created_at
                  ? moment(template.created_at).locale(language).format('DD MMM YYYY, hh:mm A')
                  : '-'}
              </TableCell>
              <TableCell className="text-end">
                <div className="flex justify-end gap-2">
                  <Button
                    variant="flat"
                    color="default"
                    size="sm"
                    startContent={<EyeIcon className="h-4 w-4" />}
                    onPress={() => onView(template)}
                  >
                    {language === 'ar' ? 'عرض' : 'View'}
                  </Button>
                  <Button
                    variant="flat"
                    color="primary"
                    size="sm"
                    startContent={<PencilSquareIcon className="h-4 w-4" />}
                    onPress={() => onEdit(template)}
                  >
                    {language === 'ar' ? 'تعديل' : 'Edit'}
                  </Button>
                  <Button
                    variant="flat"
                    color="danger"
                    size="sm"
                    startContent={<TrashIcon className="h-4 w-4" />}
                    onPress={() => onDelete(template.id)}
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