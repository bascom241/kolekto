import { axiosInstance } from "@/lib/axios";
import { toast } from "sonner";

interface Collection {
  id: string;
  title: string;
  amount: number;
  total_raised: number;
}

interface Withdrawal {
  id: string;
  status: "pending" | "successful" | "failed";
  amount: number;
  created_at: string;
  collections?: { title: string };
  reason_if_failed?: string;
}

interface Payment {
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  amount: number;
  paymentReference: string;
  status: "pending" | "successful" | "failed";
  contributor: { name: string; email: string } | null;
  collection: string;
  created_at: string;
}

export const useTransactions = () => {
  const fetchCollections = async (userId?: string) => {
    if (!userId) {
      toast.error("User ID is required");
      return { data: [], loading: false, error: "User ID is required" };
    }
    try {
      const response = await axiosInstance.get(`/collections`);
      return { data: response.data.collections as Collection[], loading: false, error: null };
    } catch (error: any) {
      const message = error.response?.data?.message || "Failed to fetch collections";
      toast.error(message);
      return { data: [], loading: false, error: message };
    }
  };

  const fetchPayments = async (userId?: string) => {
    if (!userId) {
      toast.error("User ID is required");
      return { data: [], loading: false, error: "User ID is required" };
    }
    try {
      const response = await axiosInstance.get(`/payments`);
      return { data: response.data.payments as Payment[], loading: false, error: null };
    } catch (error: any) {
      const message = error.response?.data?.message || "Failed to fetch payments";
      toast.error(message);
      return { data: [], loading: false, error: message };
    }
  };

  const fetchWithdrawals = async (userId?: string) => {
    if (!userId) {
      toast.error("User ID is required");
      return { data: [], loading: false, error: "User ID is required" };
    }
    try {
      const response = await axiosInstance.get(`/withdrawals`);
      return { data: response.data.withdrawals as Withdrawal[] || [], loading: false, error: null };
    } catch (error: any) {
      const message = error.response?.data?.message || "Failed to fetch withdrawals";
      toast.error(message);
      return { data: [], loading: false, error: message };
    }
  };

  const submitWithdrawal = async (data: {
    organizer_id: string;
    collection_id: string;
    amount: number;
    account_name: string;
    account_number: string;
    bank_name: string;
  }) => {
    try {
      const response = await axiosInstance.post("/withdrawals", data);
      toast.success("Withdrawal submitted successfully");
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.message || "Failed to submit withdrawal";
      toast.error(message);
      throw new Error(message);
    }
  };

  return {
    fetchCollections,
    fetchPayments,
    fetchWithdrawals,
    submitWithdrawal,
  };
};