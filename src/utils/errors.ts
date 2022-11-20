import { toast } from 'react-toastify';

export const EXCEPTION_OCCURRED_MESSAGE = 'exception occurred.';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const handleError = (err: any) => {
  console.error(err);
  toast.error(err?.message ?? EXCEPTION_OCCURRED_MESSAGE);
};
