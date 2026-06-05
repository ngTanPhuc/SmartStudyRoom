import { formatTimestamp } from '@/utils/helpers';

export interface UserForm {
  firstName: string;
  middleName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
}

export const emptyForm: UserForm = {
  firstName: '',
  middleName: '',
  lastName: '',
  email: '',
  phone: '',
  password: '',
};

export const safeDate = (value?: string) => {
  if (!value) return 'Chưa có dữ liệu';
  return formatTimestamp(value);
};
