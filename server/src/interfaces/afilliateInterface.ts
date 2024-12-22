export interface AffiliateRequest {
  id?: string;
  name: string;
  email: string;
  phone?: string;
  createdAt: Date;
  status: 'pending' | 'approved' | 'rejected';
}

export interface CreateAffiliateRequest {
  name: string;
  email: string;
  phone?: string;
}