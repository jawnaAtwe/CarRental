'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import moment from 'moment';
import { useLanguage } from '../context/LanguageContext';
interface CustomerDocument {
  id: number;
  document_type: 'id_card' | 'passport' | 'license';
  file_url: string;
  expiry_date: string | null;
  verified: boolean;
  uploaded_at: string;
}

interface Tenant {
  id: number;
  name: string;
  tenant_id: number;
}

interface SessionUser {
  id: number;
  email: string;
  name: string;
  type: 'user' | 'customer';
}
const API_BASE_URL = '/api/v1/admin';

export default function CustomerDocumentsPage() {
  const { data: session } = useSession();
  const user = session?.user as SessionUser | undefined;
  const { language } = useLanguage();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [documents, setDocuments] = useState<CustomerDocument[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [newDoc, setNewDoc] = useState<{
    document_type: string;
    file?: File;
    expiry_date?: string;
  }>({
    document_type: 'id_card',
    file: undefined,
    expiry_date: '',
  });

  // ---------------- Fetch Tenants ----------------
  const fetchTenants = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/tenants`);
      if (!res.ok) throw new Error('Failed to fetch tenants');
      const json = await res.json();
      setTenants(json.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  // ---------------- Fetch Docs ----------------
  const fetchDocuments = async (tenantId?: number) => {
    if (!user?.id || !tenantId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/customer-documents?customer_id=${user.id}&tenant_id=${tenantId}`);
      if (!res.ok) throw new Error('Failed to fetch documents');
      const json = await res.json();
      setDocuments(json.data || []);
    } catch (err: any) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ---------------- Init ----------------
  useEffect(() => { if (user?.id) fetchTenants(); }, [user?.id]);
  useEffect(() => {
  if (selectedTenant) fetchDocuments(selectedTenant.id); 
}, [selectedTenant]);

  // ---------------- Add Document ----------------
 const handleAddDocument = async () => {
  if (!selectedTenant) return alert('Please select a tenant first.');
  if (!newDoc.file) return alert('File is required.');

  try {
    const formData = new FormData();
    formData.append('customer_id', String(user?.id));
    formData.append('tenant_id', String(selectedTenant.id));
    formData.append('document_type', newDoc.document_type);
    if (newDoc.file) formData.append('file', newDoc.file);
    if (newDoc.expiry_date) formData.append('expiry_date', newDoc.expiry_date);

    const res = await fetch(`${API_BASE_URL}/customer-documents`, {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) throw new Error('Failed to add document.');
    setNewDoc({ document_type: 'id_card', file: undefined, expiry_date: '' });
    await fetchDocuments(selectedTenant.id);
    alert('Document uploaded successfully!');
  } catch (err: any) {
    console.error(err);
    alert(err.message || 'Error uploading document.');
  }
};
const downloadDocument = async (customerDocumentId: number, fileName: string) => {
  const isArabic = language === 'ar';
  
  const messages = {
    unexpectedError: isArabic ? 'حدث خطأ غير متوقع' : 'An unexpected error occurred',
    accessError: isArabic ? 'خطأ في الوصول للملف' : 'Error accessing file',
    emptyFile: isArabic ? 'الملف فاضي' : 'File is empty',
    downloadError: isArabic ? 'حدث خطأ أثناء تحميل الملف' : 'An error occurred while downloading the file',
  };
  
  try {
    const response = await fetch(`${API_BASE_URL}/customer-documents/${customerDocumentId}`, {
      method: 'GET',
      headers: { 
        'accept-language': language,
      },
    });

    if (!response.ok) {
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const errorData = await response.json();
        throw new Error(errorData.error || messages.unexpectedError);
      } else {
        throw new Error(`${messages.accessError}. Status: ${response.status}`);
      }
    }

    const contentDisposition = response.headers.get('content-disposition');
    const blob = await response.blob();
    
    if (blob.size === 0) {
      throw new Error(messages.emptyFile);
    }
    let downloadFileName = fileName;
    if (contentDisposition) {
      const fileNameMatch = contentDisposition.match(/filename\*?=['"]?(?:UTF-\d['"]*)?([^;\r\n"']*)['"]?;?/i);
      if (fileNameMatch && fileNameMatch[1]) {
        downloadFileName = decodeURIComponent(fileNameMatch[1]);
      }
    }
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = downloadFileName; 
    link.style.display = 'none';
    
    document.body.appendChild(link);
    link.click();
    
    setTimeout(() => {
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    }, 100);

  } catch (error: any) {
    console.error('Download Error:', error);
    alert(error.message || messages.downloadError);
  }
};
  // ---------------- Delete Document ----------------
const handleDelete = async (docId: number) => {
  if (!confirm('Are you sure you want to delete this document?')) return;

  try {
    const res = await fetch(`${API_BASE_URL}/customer-documents/${docId}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Error deleting document');

    if (selectedTenant) {
      await fetchDocuments(selectedTenant.id); 
    }
  } catch (err: any) {
    console.error(err);
    alert(err.message || 'Error deleting document');
  }
};


  // ---------------- UI ----------------
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Customer Documents</h1>

      {/* Select Tenant */}
      <div className="bg-white p-4 rounded-lg shadow">
        <label className="block mb-2 font-semibold">Select Tenant</label>
        <select
          value={selectedTenant?.id || ''}
          onChange={(e) => {
            const t = tenants.find(tn => tn.id === Number(e.target.value)) || null;
            setSelectedTenant(t);
          }}
          className="border p-2 rounded w-full sm:w-64"
        >
          <option value="">--- Select Tenant ---</option>
          {tenants.map((t) => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
      </div>

      {selectedTenant && (
        <div className="bg-white p-6 rounded-lg shadow space-y-4">
          <h2 className="text-lg font-semibold">
            Add Document for {selectedTenant.name}
          </h2>
          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <select
              value={newDoc.document_type}
              onChange={(e) => setNewDoc((prev) => ({ ...prev, document_type: e.target.value }))}
              className="border p-2 rounded sm:w-48"
            >
              <option value="id_card">ID Card</option>
              <option value="passport">Passport</option>
              <option value="license">License</option>
            </select>

            <input
              type="file"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) setNewDoc((prev) => ({ ...prev, file }));
              }}
            />

            <input
              type="date"
              value={newDoc.expiry_date || ''}
              onChange={(e) => setNewDoc((prev) => ({ ...prev, expiry_date: e.target.value }))}
              className="border p-2 rounded sm:w-48"
            />

            <button
              onClick={handleAddDocument}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition font-semibold"
            >
              + Add Document
            </button>
          </div>
        </div>
      )}

      {/* Documents Table */}
      {loading ? (
        <p>Loading documents...</p>
      ) : error ? (
        <p className="text-red-500">{error}</p>
      ) : documents.length === 0 ? (
        <p>No documents found.</p>
      ) : (
        <div className="overflow-x-auto bg-white rounded-lg shadow">
          <table className="min-w-full border text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2 border">ID</th>
                <th className="p-2 border">Type</th>
                <th className="p-2 border">File</th>
                <th className="p-2 border">Expiry</th>
                <th className="p-2 border">Verified</th>
                <th className="p-2 border">Uploaded</th>
                <th className="p-2 border">Actions</th>
              </tr>
            </thead>
            <tbody>
              {documents.map((doc) => (
                <tr key={doc.id} className="text-center hover:bg-gray-50">
                  <td className="p-2 border">{doc.id}</td>
                  <td className="p-2 border capitalize">{doc.document_type}</td>
                  <td className="p-2 border">
               <td className="p-2 border">
  <button 
    onClick={() => downloadDocument(doc.id, doc.file_url)}
    className="text-blue-600 underline hover:text-blue-800 font-medium"
  >
    Download
  </button>
</td>
</td>
                  <td className="p-2 border">
                    {doc.expiry_date ? moment(doc.expiry_date).format('YYYY-MM-DD') : '-'}
                  </td>
                  <td className="p-2 border">{doc.verified ? 'Yes' : 'No'}</td>
                  <td className="p-2 border">{moment(doc.uploaded_at).format('YYYY-MM-DD HH:mm')}</td>
                  <td className="p-2 border">
                    <button
                      onClick={() => handleDelete(doc.id)}
                      className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}