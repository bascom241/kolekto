import { create } from "zustand";
import { toast } from "sonner";
import { axiosInstance } from "@/lib/axios";

interface PaymentProps {
  paymentLoading: boolean;
  initializePayment: (data: object) => Promise<{ authorization_url: string; reference: string } | undefined>;
  verifyPayment: (reference: string) => Promise<{ status: string } | undefined>;
}

export const usePaymentStore = create<PaymentProps>((set) => ({
  paymentLoading: false,
  initializePayment: async (data) => {
    set({ paymentLoading: true });
    try {
      const response = await axiosInstance.post("/initialize-payment", data);
      set({ paymentLoading: false });
      toast.success(response.data.message);
      return {
        authorization_url: response.data.authorizationUrl,
        reference: response.data.reference,
      };
    } catch (error: any) {
      console.error("Payment initialization failed:", error);
      set({ paymentLoading: false });
      toast.error(error.message || "Failed to initialize payment");
      return undefined;
    }
  },
  verifyPayment: async (reference) => {
    set({ paymentLoading: true });
    try {
      const response = await axiosInstance.get(`/verify-payment/${reference}`);
      set({ paymentLoading: false });
      toast.success(response.data.message);
      return response.data;
    } catch (error: any) {
      set({ paymentLoading: false });
      toast.error(error.message || "Failed to verify payment");
      return undefined;
    }
  },
}));