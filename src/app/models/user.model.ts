export interface User {
  id?: number;
  email: string;
  password?: string;
  hashed_password?: string;
  dicose: string;
  phone: string;
  name?: string;
  lastName?: string;
  is_active?: boolean;
  is_admin?: boolean;
} 