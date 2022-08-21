import { toast } from 'react-toastify';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const handleError = (err: any) => {
  console.error(err);
  toast.error(err?.response?.data?.message ?? err?.message ?? 'exception occurred.');
};
