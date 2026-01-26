'use client';

import { useEffect, useState } from 'react';
import { useSession } from "next-auth/react";
import { useDisclosure } from '@heroui/react';
import { useLanguage } from '../../../../context/LanguageContext';
import { SessionUser, VehicleDB, VehicleForm } from '../types';

// Hooks
import { useTenants } from '../../hooks/useTenants';
import { useBranches } from '../../hooks/useBranches';
import { useVehicles } from '../../hooks/useVehicles';
import { useMaintenance } from '../../hooks/useMaintenance';

// Components
import { TenantBranchSelector } from './TenantBranchSelector';
import { VehiclesTable } from './VehiclesTable';
import { VehicleViewModal } from './VehicleViewModal';
import { MaintenanceModal } from './MaintenanceModal';
import { EditMaintenanceModal } from './EditMaintenanceModal';
import { DeleteModal } from './DeleteModal';

export default function MaintenanceMainPage() {
  const { language } = useLanguage();
  const { data: session } = useSession();
  const user = session?.user as SessionUser | undefined;

  const [sessionLoaded, setSessionLoaded] = useState(false);
  const isSuperAdmin = user?.roleId === 9;

  const [selectedTenantId, setSelectedTenantId] = useState<number | undefined>(
    !isSuperAdmin ? user?.tenantId : undefined
  );
  const [selectedBranchId, setSelectedBranchId] = useState<number | null>(null);
  
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<VehicleDB['status'] | 'all'>('all');
  const [page, setPage] = useState(1);
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const [submitError, setSubmitError] = useState<string[] | string>([]);
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'single' | 'bulk'; id?: number } | null>(null);

  const [editingMaintenance, setEditingMaintenance] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Hooks
  const { tenants, tenantsLoading, fetchTenants } = useTenants(language);
  const { branches, branchesLoading, branchesError, fetchBranches } = useBranches(language);
  const {
    vehicles,
    loading,
    totalPages,
    totalCount,
    activeVehicle,
    setActiveVehicle,
    fetchVehicles,
    fetchVehicleDetails,
  } = useVehicles(language);
  const {
    vehicleMaintenances,
    maintenancesLoading,
    maintenanceData,
    setMaintenanceData,
    setVehicleMaintenances,
    fetchVehicleMaintenances,
    saveMaintenance,
    updateMaintenance,
  } = useMaintenance(language);

  // Modals
  const maintenanceModal = useDisclosure();
  const viewModal = useDisclosure();
  const editModal = useDisclosure();
  const deleteModal = useDisclosure();
  const {
    isOpen: isEditOpen,
    onOpen: openEditModal,
    onClose: closeEditModal,
  } = useDisclosure();

  // Effects
  useEffect(() => {
    if (user) setSessionLoaded(true);
  }, [user]);

  useEffect(() => {
    if (sessionLoaded && isSuperAdmin) fetchTenants();
  }, [sessionLoaded, isSuperAdmin]);

  useEffect(() => {
    if (!isSuperAdmin && user) setSelectedTenantId(user.tenantId);
  }, [user, isSuperAdmin]);

  useEffect(() => {
    const tenantIdToUse = isSuperAdmin ? selectedTenantId : user?.tenantId;

    if (!tenantIdToUse) return;

    const loadBranchesAndVehicles = async () => {
      try {
        await fetchBranches(tenantIdToUse);
        await fetchVehicles(tenantIdToUse, page, search, statusFilter, selectedBranchId);
      } catch (err) {
        console.error(err);
      }
    };

    loadBranchesAndVehicles();
  }, [
    language,
    page,
    search,
    statusFilter,
    sessionLoaded,
    selectedTenantId,
    selectedBranchId,
    user,
    isSuperAdmin,
  ]);

  useEffect(() => {
    if (!selectedTenantId || !activeVehicle?.id) return;

    const loadMaintenances = async () => {
      try {
        await fetchVehicleMaintenances(activeVehicle.id, selectedTenantId);
      } catch (err) {
        console.error("Failed to load maintenances:", err);
      }
    };

    loadMaintenances();
  }, [selectedTenantId, activeVehicle?.id]);

  // Handlers
  const handleTenantChange = (tenantId: number) => {
    setSelectedTenantId(tenantId);
    setSelectedBranchId(null);
    fetchBranches(tenantId).then(() => {
      fetchVehicles(tenantId, page, search, statusFilter, selectedBranchId);
    });
  };

  const handleBranchChange = (branchId: number) => {
    setSelectedBranchId(branchId);
    fetchVehicles(selectedTenantId, page, search, statusFilter, branchId);
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleStatusChange = (value: VehicleDB['status'] | 'all') => {
    setStatusFilter(value);
    setPage(1);
  };

  const handleViewDetails = async (vehicleId: number) => {
    const vehicleData = await fetchVehicleDetails(vehicleId, selectedTenantId);
    if (vehicleData) {
      await fetchVehicleMaintenances(vehicleId, selectedTenantId);
      viewModal.onOpen();
    }
  };

  const openMaintenanceModal = async (vehicle: VehicleDB) => {
    setMaintenanceData({
      vehicle_id: vehicle.id,
      branch_id: vehicle.branch_id || undefined,
      maintenance_type: 'scheduled',
      attachments: [],
    });

    maintenanceModal.onOpen();
    await fetchVehicleMaintenances(vehicle.id, selectedTenantId);
  };

  const handleSaveMaintenance = async () => {
    const success = await saveMaintenance(selectedTenantId);
    if (success) {
      maintenanceModal.onClose();
    }
  };

  const handleEditMaintenance = (maintenance: any) => {
    setEditingMaintenance({
      ...maintenance,
      start_date: maintenance.start_date ? maintenance.start_date.slice(0, 10) : null,
      end_date: maintenance.end_date ? maintenance.end_date.slice(0, 10) : null,
      next_due_date: maintenance.next_due_date ? maintenance.next_due_date.slice(0, 10) : null,
    });
    openEditModal();
  };

  const handleUpdateMaintenance = async () => {
    setSaving(true);
    const success = await updateMaintenance(editingMaintenance, selectedTenantId);
    setSaving(false);
    
    if (success) {
      closeEditModal();
    }
  };

  const handleSelectionChange = (keys: any) => {
    if (keys === "all") {
      setSelectedKeys(new Set(vehicles.map(v => String(v.id))));
    } else {
      setSelectedKeys(keys as Set<string>);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-content2 via-content2 to-background px-4 py-8 md:px-8">
      <div className="mx-auto w-full space-y-8">

        <TenantBranchSelector
          language={language}
          isSuperAdmin={isSuperAdmin}
          sessionLoaded={sessionLoaded}
          selectedTenantId={selectedTenantId}
          selectedBranchId={selectedBranchId}
          tenants={tenants}
          branches={branches}
          tenantsLoading={tenantsLoading}
          branchesLoading={branchesLoading}
          branchesError={branchesError}
          onTenantChange={handleTenantChange}
          onBranchChange={handleBranchChange}
        />

        <section className="flex flex-col gap-4 pt-5 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em]">
              {language === 'ar' ? 'إدارة الصيانات' : 'maintenance MANAGEMENT'}
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-text">
              {language === 'ar' ? 'الصيانات' : 'Maintenance'}
            </h1>
          </div>
        </section>

        <DeleteModal
          language={language}
          isOpen={deleteModal.isOpen}
          onOpenChange={deleteModal.onOpenChange}
          deleteTarget={deleteTarget}
          selectedKeysSize={selectedKeys.size}
          submitError={submitError}
          isEditing={isEditing}
        />

        <VehiclesTable
          language={language}
          vehicles={vehicles}
          loading={loading}
          page={page}
          totalPages={totalPages}
          totalCount={totalCount}
          search={search}
          statusFilter={statusFilter}
          selectedKeys={selectedKeys}
          onSelectionChange={handleSelectionChange}
          onSearchChange={handleSearchChange}
          onStatusChange={handleStatusChange}
          onPageChange={setPage}
          onViewDetails={handleViewDetails}
          onOpenMaintenance={openMaintenanceModal}
        />

        <VehicleViewModal
          language={language}
          isOpen={viewModal.isOpen}
          onOpenChange={viewModal.onOpenChange}
          onClose={viewModal.onClose}
          activeVehicle={activeVehicle}
          vehicleMaintenances={vehicleMaintenances}
          onEditMaintenance={handleEditMaintenance}
        />

        <MaintenanceModal
          language={language}
          isOpen={maintenanceModal.isOpen}
          onOpenChange={maintenanceModal.onOpenChange}
          onClose={maintenanceModal.onClose}
          maintenanceData={maintenanceData}
          setMaintenanceData={setMaintenanceData}
          onSave={handleSaveMaintenance}
        />

        <EditMaintenanceModal
          language={language}
          isOpen={isEditOpen}
          onClose={closeEditModal}
          editingMaintenance={editingMaintenance}
          setEditingMaintenance={setEditingMaintenance}
          onSave={handleUpdateMaintenance}
          saving={saving}
        />
      </div>
    </div>
  );
}