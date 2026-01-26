// hooks/useVehicleDelete.ts

import { useState } from 'react';
import { addToast } from '@heroui/react';
import { API_BASE_URL } from '../constants/vehicle.constants';

export const useVehicleDelete = () => {
  const [loading, setLoading] = useState(false);

  const handleDeleteVehicle = async (
    id: number,
    selectedTenantId: number | undefined,
    language: string,
    onSuccess?: () => void
  ) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/vehicles/${id}`, {
        method: 'DELETE',
        headers: { 'accept-language': language, 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenant_id: selectedTenantId }),
      });
      if (!response.ok) throw new Error(await response.text());
      
      addToast({
        title: language==='ar'?'تم الحذف':'Deleted', 
        description:'', 
        color:'success'
      });
      
      onSuccess?.();
    } catch(err:any){
      console.error(err); 
      addToast({
        title:'Error', 
        description: err?.message, 
        color:'danger'
      });
    } finally { 
      setLoading(false); 
    }
  };

  const handleBulkDeleteVehicles = async (
    selectedKeys: Set<string>,
    selectedTenantId: number | undefined,
    language: string,
    onSuccess?: () => void
  ) => {
    const selectedIds = Array.from(selectedKeys).map(k=>Number(k));
    if (!selectedIds.length) return;
    
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/vehicles`, {
        method: 'DELETE',
        headers: { 'accept-language': language, 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenant_id: selectedTenantId, vehicle_ids: selectedIds }),
      });
      if (!response.ok) throw new Error(await response.text());
      
      addToast({
        title: language==='ar'?'تم الحذف':'Deleted', 
        description:'', 
        color:'success'
      });
      
      onSuccess?.();
    } catch(err:any){
      console.error(err); 
      addToast({
        title:'Error', 
        description: err?.message, 
        color:'danger'
      });
    } finally { 
      setLoading(false); 
    }
  };

  return {
    loading,
    handleDeleteVehicle,
    handleBulkDeleteVehicles,
  };
};