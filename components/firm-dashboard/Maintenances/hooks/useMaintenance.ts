import { useState } from 'react';
import { addToast } from '@heroui/react';
import { API_BASE_URL } from '../constants/maintenance.constants';
import { MaintenanceData, VehicleMaintenance } from '../components/types';

export const useMaintenance = (language: string) => {
  const [vehicleMaintenances, setVehicleMaintenances] = useState<VehicleMaintenance[]>([]);
  const [maintenancesLoading, setMaintenancesLoading] = useState(false);
  const [maintenanceData, setMaintenanceData] = useState<MaintenanceData>({
    vehicle_id: undefined,
    branch_id: undefined,
    vendor_id: undefined,
    maintenance_type: 'scheduled',
    title: '',
    description: '',
    start_date: null,
    end_date: null,
    odometer: undefined,
    cost: undefined,
    next_due_date: null,
    next_due_mileage: null,
    status:'',
    payment_status:'',
    notes: '',
    attachments: [],
  });

  const fetchVehicleMaintenances = async (vehicleId: number, selectedTenantId: number | undefined) => {
    if (!selectedTenantId || !vehicleId) return;
    console.log("Fetching maintenances for vehicle:", vehicleId, "tenant:", selectedTenantId);

    setMaintenancesLoading(true);

    try {
      const params = new URLSearchParams({
        tenant_id: String(selectedTenantId),
        vehicle_id: String(vehicleId),
        page: "1",
        pageSize: "20",
      });

      const res = await fetch(`${API_BASE_URL}/vehicle-maintenance-records?${params.toString()}`, {
        headers: { "accept-language": language || "en" }
      });

      const data = await res.json();
      console.log("Received maintenance data:", data);

      if (res.ok && Array.isArray(data.data)) {
        setVehicleMaintenances(data.data);
      } else {
        console.warn("No maintenance data or unexpected response:", data);
        setVehicleMaintenances([]);
      }
    } catch (err) {
      console.error("Error fetching vehicle maintenances:", err);
      setVehicleMaintenances([]);
    } finally {
      setMaintenancesLoading(false);
    }
  };

  const saveMaintenance = async (selectedTenantId: number | undefined) => {
    if (!maintenanceData.vehicle_id || !selectedTenantId) return;

    try {
      const payload = { ...maintenanceData, tenant_id: selectedTenantId };
      const res = await fetch(`${API_BASE_URL}/vehicle-maintenance-records`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "accept-language": language },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add maintenance");

      addToast({ title: "Added", description: "Maintenance added successfully", color: "success" });

      await fetchVehicleMaintenances(maintenanceData.vehicle_id, selectedTenantId);
      return true;
    } catch (err: any) {
      addToast({ title: "Error", description: err?.message || "Failed to add maintenance", color: "danger" });
      return false;
    }
  };

  const updateMaintenance = async (
    editingMaintenance: any,
    selectedTenantId: number | undefined
  ) => {
    if (!editingMaintenance?.id || !selectedTenantId) return false;

    try {
      const payload = {
        tenant_id: selectedTenantId,
        vehicle_id: editingMaintenance.vehicle_id,
        branch_id: editingMaintenance.branch_id,
        vendor_id: editingMaintenance.vendor_id,
        maintenance_type: editingMaintenance.maintenance_type,
        title: editingMaintenance.title,
        description: editingMaintenance.description,
        status: editingMaintenance.status,
        start_date: editingMaintenance.start_date,
        end_date: editingMaintenance.end_date,
        odometer: editingMaintenance.odometer,
        cost: editingMaintenance.cost,
        payment_status: editingMaintenance.payment_status,
        next_due_date: editingMaintenance.next_due_date,
        next_due_mileage: editingMaintenance.next_due_mileage,
        notes: editingMaintenance.notes,
        attachments: editingMaintenance.attachments,
      };

      const res = await fetch(
        `${API_BASE_URL}/vehicle-maintenance-records/${editingMaintenance.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "accept-language": language,
          },
          body: JSON.stringify({
            ...payload,
            tenant_id: selectedTenantId,
          }),
        }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Update failed");

      addToast({
        title: language === "ar" ? "تم التعديل" : "Updated",
        description:
          language === "ar"
            ? "تم تحديث الصيانة بنجاح"
            : "Maintenance updated successfully",
        color: "success",
      });

      setVehicleMaintenances((prev) =>
        prev.map((m) => (m.id === data.data.id ? data.data : m))
      );

      return true;
    } catch (e: any) {
      addToast({
        title: language === "ar" ? "خطأ" : "Error",
        description: e.message || "Update error",
        color: "danger",
      });
      return false;
    }
  };

  return {
    vehicleMaintenances,
    maintenancesLoading,
    maintenanceData,
    setMaintenanceData,
    setVehicleMaintenances,
    fetchVehicleMaintenances,
    saveMaintenance,
    updateMaintenance,
  };
};