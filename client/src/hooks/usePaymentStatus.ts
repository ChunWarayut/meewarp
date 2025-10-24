import { useState, useCallback } from 'react';
import { API_ENDPOINTS } from '../config';

interface PaymentStatusResult {
  success: boolean;
  message: string;
  status: string | null;
  isAlreadyPaid: boolean;
  transaction?: {
    id: string;
    status: string;
    amount: number;
    currency: string;
    paidAt?: string;
    customerName: string;
    socialLink: string;
    quote?: string;
  };
  error?: string;
}

interface UsePaymentStatusReturn {
  checkPaymentStatus: (transactionId: string, storeSlug: string) => Promise<PaymentStatusResult>;
  isChecking: boolean;
  error: string | null;
}

/**
 * Hook สำหรับตรวจสอบสถานะการชำระเงิน
 * ป้องกันการ update ซ้ำและจัดการ UI replay
 */
export const usePaymentStatus = (): UsePaymentStatusReturn => {
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkPaymentStatus = useCallback(async (
    transactionId: string, 
    storeSlug: string
  ): Promise<PaymentStatusResult> => {
    if (!transactionId || !storeSlug) {
      const errorResult = {
        success: false,
        message: 'Transaction ID and store slug are required',
        status: null,
        isAlreadyPaid: false,
        error: 'Missing required parameters'
      };
      setError(errorResult.message);
      return errorResult;
    }

    setIsChecking(true);
    setError(null);

    try {
      const response = await fetch(API_ENDPOINTS.publicPaymentStatusCheck(storeSlug), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ transactionId }),
      });

      const result: PaymentStatusResult = await response.json();

      if (!response.ok) {
        setError(result.message || 'Failed to check payment status');
        return result;
      }

      return result;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      
      return {
        success: false,
        message: errorMessage,
        status: null,
        isAlreadyPaid: false,
        error: errorMessage
      };
    } finally {
      setIsChecking(false);
    }
  }, []);

  return {
    checkPaymentStatus,
    isChecking,
    error
  };
};
