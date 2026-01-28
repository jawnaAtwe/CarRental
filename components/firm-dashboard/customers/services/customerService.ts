import { API_BASE_URL } from '../constants';
import { CustomerDB, CustomerForm } from '../hooks/types';

export const customerService = {
  async fetchCustomers(params: URLSearchParams, language: string) {
    const response = await fetch(`${API_BASE_URL}/customers?${params}`, {
      headers: { 'accept-language': language, 'Content-Type': 'application/json' },
    });
    if (!response.ok) throw new Error(response.statusText);
    return response.json();
  },

  async fetchCustomerById(id: number, language: string) {
    const response = await fetch(`${API_BASE_URL}/customers/${id}`, {
      headers: { 'accept-language': language },
    });
    if (!response.ok) throw new Error(response.statusText);
    return response.json();
  },

  async createCustomer(data: CustomerForm, language: string) {
    const response = await fetch(`${API_BASE_URL}/customers`, {
      method: 'POST',
      headers: { 'accept-language': language, 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return response;
  },

  async updateCustomer(id: number, data: CustomerForm, language: string) {
    const response = await fetch(`${API_BASE_URL}/customers/${id}`, {
      method: 'PUT',
      headers: { 'accept-language': language, 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return response;
  },

  async deleteCustomer(id: number, language: string) {
    const response = await fetch(`${API_BASE_URL}/customers/${id}`, {
      method: 'DELETE',
      headers: { 'accept-language': language, 'Content-Type': 'application/json' },
    });
    return response;
  },

  async bulkDeleteCustomers(customerIds: number[], language: string) {
    const response = await fetch(`${API_BASE_URL}/customers`, {
      method: 'DELETE',
      headers: { 'accept-language': language, 'Content-Type': 'application/json' },
      body: JSON.stringify({ customer_ids: customerIds }),
    });
    return response;
  },
};