export type ContractTemplateStatus = 'active' | 'inactive' | 'deleted';

export type ContractTemplateDB = {
  id: number;
  tenant_id: number;
  language: string;
  name?: string | null;
  content: string;
  status: ContractTemplateStatus;
  created_at?: string | null;
  updated_at?: string | null;
};

export type ContractTemplateForm = {
  id?: number;
  tenant_id?: number;
  language?: string;
  name?: string | null;
  content?: string;
  status?: ContractTemplateStatus;
};