'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Select, SelectItem, useDisclosure, addToast } from '@heroui/react';

import { useLanguage } from '../../context/LanguageContext';
import { useInspections } from './hooks/useInspections';
import { useDamages } from './hooks/useDamages';
import * as inspectionService from './services/inspectionService';

import InspectionHeader from './components/InspectionHeader';
import InspectionTable from './components/InspectionTable';
import InspectionViewModal from './components/InspectionViewModal';
import InspectionFormModal from './components/InspectionFormModal';
import DamageFormModal from './components/DamageFormModal';
import DeleteConfirmModal from './components/DeleteConfirmModal';

import { INITIAL_DAMAGE_FORM, INITIAL_INSPECTION_FORM, SUPER_ADMIN_ROLE_ID } from './constants';
import type { SessionUser, InspectionDB, InspectionForm, DamageForm, EditDamageForm, DeleteTarget, Tenant, Damage } from './types';

export default function InspectionsPage() {
  const { language } = useLanguage();
  const { data: session } = useSession();
  const user = session?.user as SessionUser | undefined;

  // ==================== Session & Tenant ====================
  const [sessionLoaded, setSessionLoaded] = useState(false);
  const isSuperAdmin = user?.roleId === SUPER_ADMIN_ROLE_ID;
  const [selectedTenantId, setSelectedTenantId] = useState<number | undefined>(
    !isSuperAdmin ? user?.tenantId : undefined
  );
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [tenantsLoading, setTenantsLoading] = useState(false);

  // ==================== Table State ====================
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());

  // ==================== Form State ====================
  const [activeInspection, setActiveInspection] = useState<InspectionDB | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<InspectionForm>({
    ...INITIAL_INSPECTION_FORM,
    tenant_id: selectedTenantId,
  });
  const [submitError, setSubmitError] = useState<string[] | string>([]);
  const [loadingForm, setLoadingForm] = useState(false);
  const [loadingFormData, setLoadingFormData] = useState(false);

  // ==================== Damage State ====================
  const [newDamage, setNewDamage] = useState<DamageForm>(INITIAL_DAMAGE_FORM);
  const [editDamage, setEditDamage] = useState<EditDamageForm | null>(null);

  // ==================== Delete State ====================
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);

  // ==================== Modals ====================
  const viewModal = useDisclosure();
  const editModal = useDisclosure();
  const deleteModal = useDisclosure();
  const addDamageModal = useDisclosure();
  const editDamageModal = useDisclosure();

  // ==================== Custom Hooks ====================
  const {
    inspections,
    loading,
    totalPages,
    bookings,
    vehicles,
    loadInspections,
    saveInspection: saveInspectionHook,
    deleteInspection,
    bulkDelete,
    loadFormData,
  } = useInspections(selectedTenantId, language);

  const { damages, loadingDamages, loadDamages, saveDamage, updateDamage, removeDamage } = useDamages(
    selectedTenantId,
    language
  );

  // ==================== Effects ====================
  useEffect(() => {
    if (user) setSessionLoaded(true);
  }, [user]);

  useEffect(() => {
    if (sessionLoaded && isSuperAdmin) fetchTenants();
  }, [sessionLoaded, isSuperAdmin]);

  useEffect(() => {
    if (!isSuperAdmin && user) {
      setSelectedTenantId(user.tenantId);
    }
  }, [user, isSuperAdmin]);

  useEffect(() => {
    if (!isSuperAdmin && user?.tenantId) {
      loadInspections(page, search, statusFilter);
    }
    if (isSuperAdmin && selectedTenantId !== undefined) {
      loadInspections(page, search, statusFilter);
    }
  }, [language, page, search, statusFilter, sessionLoaded, selectedTenantId, user, isSuperAdmin]);

  // ==================== Fetch Tenants ====================
  const fetchTenants = async () => {
    setTenantsLoading(true);
    try {
      const data = await inspectionService.fetchTenants(language);
      setTenants(data);
    } catch (error) {
      console.error(error);
      addToast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: (error as any)?.message || 'Failed to fetch tenants',
        color: 'danger',
      });
    } finally {
      setTenantsLoading(false);
    }
  };

  // ==================== Inspection Actions ====================
  const handleViewInspection = async (inspection: InspectionDB) => {
    setActiveInspection(inspection);
    await loadDamages(inspection.id);
    viewModal.onOpen();
  };

  const handleCreateInspection = async () => {
    if (!user) return addToast({ title: 'خطأ', description: 'User not loaded yet', color: 'danger' });

    setLoadingFormData(true);
    setFormData({ ...INITIAL_INSPECTION_FORM, tenant_id: selectedTenantId });
    setSubmitError([]);
    setIsEditing(false);

    try {
      await loadFormData();
      editModal.onOpen();
    } catch (err) {
      console.error(err);
      addToast({ title: 'Error', description: 'Failed to load data', color: 'danger' });
    } finally {
      setLoadingFormData(false);
    }
  };

  const handleEditInspection = async (inspection: InspectionDB) => {
    if (!user) return addToast({ title: 'خطأ', description: 'User not loaded yet', color: 'danger' });

    setFormData({
      id: inspection.id,
      booking_id: inspection.booking_id,
      vehicle_id: inspection.vehicle_id,
      vehicle_name: inspection.vehicle_name,
      inspection_type: inspection.inspection_type,
      inspection_date: inspection.inspection_date,
      inspected_by: inspection.inspected_by ?? undefined,
      odometer: inspection.odometer ?? undefined,
      fuel_level: inspection.fuel_level ?? undefined,
      checklist_results: inspection.checklist_results ?? undefined,
      notes: inspection.notes ?? undefined,
      status: inspection.status,
      tenant_id: selectedTenantId,
    });

    setIsEditing(true);
    setSubmitError([]);
    await loadFormData();
    editModal.onOpen();
  };

  const handleSaveInspection = async () => {
    setLoadingForm(true);
    setSubmitError([]);

    const result = await saveInspectionHook(formData, isEditing);

    if (result.success) {
      editModal.onClose();
      setFormData({ ...INITIAL_INSPECTION_FORM, tenant_id: selectedTenantId });
      loadInspections(page, search, statusFilter);
    } else {
      setSubmitError(result.error || 'Failed to save inspection');
    }

    setLoadingForm(false);
  };

  const handleDeleteInspection = (id: number) => {
    setDeleteTarget({ type: 'single', id });
    deleteModal.onOpen();
  };

  const handleBulkDelete = () => {
    setDeleteTarget({ type: 'bulk' });
    deleteModal.onOpen();
  };

  const executeDelete = async () => {
    if (!deleteTarget) return;

    deleteModal.onClose();

    if (deleteTarget.type === 'single' && deleteTarget.id) {
      await deleteInspection(deleteTarget.id);
      loadInspections(page, search, statusFilter);
    }

    if (deleteTarget.type === 'bulk') {
      const ids = Array.from(selectedKeys).map(Number);
      await bulkDelete(ids);
      setSelectedKeys(new Set());
      loadInspections(page, search, statusFilter);
    }

    setDeleteTarget(null);
  };

  // ==================== Damage Actions ====================
  const handleAddDamage = () => {
    setNewDamage(INITIAL_DAMAGE_FORM);
    addDamageModal.onOpen();
  };

  const handleSaveDamage = async () => {
    if (!activeInspection) return;

    const result = await saveDamage(newDamage, activeInspection.id);

    if (result?.success) {
      addDamageModal.onClose();
      setNewDamage(INITIAL_DAMAGE_FORM);
    }
  };

  const handleEditDamage = (damage: Damage) => {
    setEditDamage({
      id: damage.id,
      inspection_id: damage.inspection_id,
      damage_type: damage.damage_type,
      damage_severity: damage.damage_severity,
      damage_location: damage.damage_location ?? '',
      description: damage.description ?? '',
      is_new_damage: Boolean(damage.is_new_damage),
      estimated_cost: damage.estimated_cost ?? 0,
      final_cost: damage.final_cost ?? 0,
      insurance_required: Boolean(damage.insurance_required),
      insurance_provider: damage.insurance_provider ?? '',
      claim_number: damage.claim_number ?? '',
      claim_status: damage.claim_status ?? 'not_submitted',
      claim_amount: damage.claim_amount ?? '',
    });
    editDamageModal.onOpen();
  };

  const handleUpdateDamage = async () => {
    if (!editDamage || !activeInspection) return;

    const result = await updateDamage(editDamage.id, editDamage, activeInspection.id);

    if (result?.success) {
      editDamageModal.onClose();
      setEditDamage(null);
    }
  };

  const handleDeleteDamage = async (damageId: number) => {
    if (!activeInspection) return;
    await removeDamage(damageId, activeInspection.id);
  };

  // ==================== Render ====================
  return (
    <div className="min-h-screen px-4 py-8 md:px-8">
      <div className="mx-auto w-full space-y-8">
        {/* Tenant Selector (Super Admin Only) */}
        {isSuperAdmin && sessionLoaded && (
          <Select
            size="md"
            label={language === 'ar' ? 'اختر الشركة' : 'Select Tenant'}
            placeholder={language === 'ar' ? 'اختر الشركة' : 'Select Tenant'}
            selectedKeys={selectedTenantId ? [String(selectedTenantId)] : []}
            onChange={(e) => setSelectedTenantId(Number(e.target.value))}
            isLoading={tenantsLoading}
          >
            {tenants.map((t) => (
              <SelectItem key={t.id}>{t.name}</SelectItem>
            ))}
          </Select>
        )}

        {/* Header */}
        <InspectionHeader
          language={language}
          selectedCount={selectedKeys.size}
          onBulkDelete={handleBulkDelete}
          onCreateNew={handleCreateInspection}
        />

        {/* Table */}
        <InspectionTable
          language={language}
          inspections={inspections}
          loading={loading}
          page={page}
          totalPages={totalPages}
          search={search}
          statusFilter={statusFilter}
          selectedKeys={selectedKeys}
          onSearchChange={(val) => { setSearch(val); setPage(1); }}
          onStatusFilterChange={(val) => { setStatusFilter(val as any); setPage(1); }}
          onPageChange={setPage}
          onSelectionChange={setSelectedKeys}
          onView={handleViewInspection}
          onEdit={handleEditInspection}
          onDelete={handleDeleteInspection}
        />

        {/* View Modal */}
        <InspectionViewModal
          language={language}
          isOpen={viewModal.isOpen}
          inspection={activeInspection}
          damages={damages}
          loadingDamages={loadingDamages}
          onClose={viewModal.onClose}
          onAddDamage={handleAddDamage}
          onEditDamage={handleEditDamage}
          onDeleteDamage={handleDeleteDamage}
        />

        {/* Form Modal */}
        <InspectionFormModal
          language={language}
          isOpen={editModal.isOpen}
          isEditing={isEditing}
          loading={loadingForm}
          loadingData={loadingFormData}
          formData={formData}
          bookings={bookings}
          vehicles={vehicles}
          submitError={submitError}
          onClose={editModal.onClose}
          onChange={(data) => setFormData({ ...formData, ...data })}
          onSubmit={handleSaveInspection}
        />

        {/* Add Damage Modal */}
        <DamageFormModal
          language={language}
          isOpen={addDamageModal.isOpen}
          isEditing={false}
          damageData={newDamage}
          onClose={addDamageModal.onClose}
          onChange={(data) => setNewDamage({ ...newDamage, ...data })}
          onSubmit={handleSaveDamage}
        />

        {/* Edit Damage Modal */}
        {editDamage && (
          <DamageFormModal
            language={language}
            isOpen={editDamageModal.isOpen}
            isEditing={true}
            damageData={editDamage}
            onClose={() => {
              editDamageModal.onClose();
              setEditDamage(null);
            }}
            onChange={(data) => setEditDamage({ ...editDamage, ...data })}
            onSubmit={handleUpdateDamage}
          />
        )}

        {/* Delete Confirmation */}
        <DeleteConfirmModal
          language={language}
          isOpen={deleteModal.isOpen}
          deleteTarget={deleteTarget}
          selectedCount={selectedKeys.size}
          onClose={deleteModal.onClose}
          onConfirm={executeDelete}
        />
      </div>
    </div>
  );
}