'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Button, useDisclosure } from '@heroui/react';
import { PlusIcon } from '@heroicons/react/24/solid';
import { useLanguage } from '../../context/LanguageContext';
import { useContractTemplates } from './hooks/useContractTemplates';
import { useContractTemplateForm } from './hooks/useContractTemplateForm';
import { ContractTemplatesTable } from './components/contract-templates/ContractTemplatesTable';
import { ContractTemplateForm } from './components/contract-templates/ContractTemplateForm';
import { ContractTemplateViewModal } from './components/contract-templates/ContractTemplateViewModal';
import { DeleteConfirmModal } from './components/contract-templates/DeleteConfirmModal';
import { LanguageFilter } from './components/contract-templates/LanguageFilter';
import { ContractTemplateDB } from './hooks/types/contract-template.types';

interface SessionUser {
  id: number;
  email: string;
  name: string;
  type: 'user' | 'customer';
  roles: string[];
  permissions: string[];
  tenantId: number;
  roleId: number;
}

export default function ContractTemplatesPage() {
  const { language } = useLanguage();
  const { data: session } = useSession();
  const user = session?.user as SessionUser | undefined;

  const [sessionLoaded, setSessionLoaded] = useState(false);
  const selectedTenantId = user?.tenantId;
  const [search, setSearch] = useState('');
  const [languageFilter, setLanguageFilter] = useState('all');
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);
  const [activeTemplate, setActiveTemplate] = useState<ContractTemplateDB | null>(null);

  const editModal = useDisclosure();
  const viewModal = useDisclosure();
  const deleteModal = useDisclosure();

  const { templates, loading, fetchTemplates, deleteTemplate } = useContractTemplates(
    language,
    selectedTenantId,
    languageFilter === 'all' ? undefined : languageFilter
  );

  const {
    formData,
    setFormData,
    loading: loadingForm,
    submitError,
    isEditing,
    setEditMode,
    setCreateMode,
    saveTemplate,
  } = useContractTemplateForm(language, selectedTenantId);

  useEffect(() => {
    if (user) setSessionLoaded(true);
  }, [user]);

  const openCreateTemplate = () => {
    setCreateMode();
    editModal.onOpen();
  };

  const openEditTemplate = (template: ContractTemplateDB) => {
    setEditMode(template);
    editModal.onOpen();
  };

  const openViewTemplate = (template: ContractTemplateDB) => {
    setActiveTemplate(template);
    viewModal.onOpen();
  };

  const confirmDelete = (id: number) => {
    setDeleteTarget(id);
    deleteModal.onOpen();
  };

  const executeDelete = async () => {
    if (!deleteTarget) return;
    deleteModal.onClose();
    await deleteTemplate(deleteTarget);
    setDeleteTarget(null);
  };

  const handleSave = () => {
    saveTemplate(() => {
      editModal.onClose();
      fetchTemplates();
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-100 via-gray-100 to-white dark:from-[#0B0F1A] dark:via-[#0B0F1A] dark:to-[#1C2030] px-4 py-8 md:px-8">
      <div className="mx-auto w-full space-y-8">
        {/* Header */}
        <section className="flex flex-col gap-4 pt-5 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-gray-600 dark:text-gray-300">
              {language === 'ar' ? 'إدارة قوالب العقود' : 'CONTRACT TEMPLATES MANAGEMENT'}
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-text dark:text-white">
              {language === 'ar' ? 'قوالب العقود' : 'CONTRACT TEMPLATES'}
            </h1>
          </div>
          <Button
            variant="solid"
            color="primary"
            startContent={<PlusIcon className="h-5 w-5 animate-pulse text-white drop-shadow-lg" />}
            onPress={openCreateTemplate}
            className="relative overflow-hidden text-white font-extrabold tracking-wide rounded-3xl px-6 py-3 bg-gradient-to-r from-indigo-500 via-purple-600 to-pink-500 shadow-xl transition-all duration-500 transform hover:scale-110 hover:shadow-2xl before:absolute before:top-0 before:left-[-75%] before:w-0 before:h-full before:bg-white/30 before:rotate-12 before:transition-all before:duration-500 hover:before:w-[200%]"
          >
            {language === 'ar' ? 'قالب جديد' : 'New Template'}
          </Button>
        </section>

        {/* Filters */}
        <div className="flex gap-3">
          <LanguageFilter language={language} languageFilter={languageFilter} setLanguageFilter={setLanguageFilter} />
        </div>

        {/* Table */}
        <ContractTemplatesTable
          language={language}
          templates={templates}
          loading={loading}
          search={search}
          setSearch={setSearch}
          onView={openViewTemplate}
          onEdit={openEditTemplate}
          onDelete={confirmDelete}
        />

        {/* Modals */}
        <ContractTemplateForm
          language={language}
          isOpen={editModal.isOpen}
          isEditing={isEditing}
          loading={loadingForm}
          formData={formData}
          submitError={submitError}
          onClose={editModal.onClose}
          onSave={handleSave}
          onChange={(field, value) => setFormData((prev) => ({ ...prev, [field]: value }))}
        />

        <ContractTemplateViewModal
          language={language}
          isOpen={viewModal.isOpen}
          template={activeTemplate}
          onClose={viewModal.onClose}
        />

        <DeleteConfirmModal
          language={language}
          isOpen={deleteModal.isOpen}
          onClose={deleteModal.onClose}
          onConfirm={executeDelete}
        />
      </div>
    </div>
  );
}