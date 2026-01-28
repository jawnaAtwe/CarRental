import { API_BASE_URL } from '../constants';
import { RentalContractForm } from '../hooks/types';

export const rentalContractService = {
  async fetchContracts(params: URLSearchParams, language: string) {
    const response = await fetch(`${API_BASE_URL}/rental-contracts?${params}`, {
      headers: { 'accept-language': language, 'Content-Type': 'application/json' },
    });
    if (!response.ok) throw new Error(response.statusText);
    return response.json();
  },

  async fetchContractById(id: number, tenantId: number, language: string) {
    const response = await fetch(`${API_BASE_URL}/rental-contracts/${id}?tenant_id=${tenantId}`, {
      headers: { 'accept-language': language },
    });
    if (!response.ok) throw new Error(response.statusText);
    return response.json();
  },

  async fetchBookingById(bookingId: number, tenantId: number, language: string) {
    const response = await fetch(`${API_BASE_URL}/bookings/${bookingId}?tenant_id=${tenantId}`, {
      headers: { 'accept-language': language },
    });
    if (!response.ok) throw new Error(response.statusText);
    return response.json();
  },

  async fetchBookings(tenantId: number, language: string) {
    const response = await fetch(`${API_BASE_URL}/bookings?tenant_id=${tenantId}`, {
      headers: { 'accept-language': language },
    });
    if (!response.ok) throw new Error(response.statusText);
    return response.json();
  },

  async fetchTemplates(tenantId: number, language: string) {
    const response = await fetch(`${API_BASE_URL}/contract-templates?tenant_id=${tenantId}`, {
      headers: { 'accept-language': language },
    });
    if (!response.ok) throw new Error(response.statusText);
    return response.json();
  },

  async createContract(data: RentalContractForm, language: string) {
    const response = await fetch(`${API_BASE_URL}/rental-contracts`, {
      method: 'POST',
      headers: { 'accept-language': language, 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return response;
  },

  async updateContract(id: number, data: Partial<RentalContractForm>, language: string) {
    const response = await fetch(`${API_BASE_URL}/rental-contracts/${id}`, {
      method: 'PUT',
      headers: { 'accept-language': language, 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return response;
  },

  async cancelContract(id: number, tenantId: number, language: string) {
    const response = await fetch(`${API_BASE_URL}/rental-contracts/${id}?tenant_id=${tenantId}`, {
      method: 'DELETE',
      headers: { 'accept-language': language, 'Content-Type': 'application/json' },
    });
    return response;
  },
};