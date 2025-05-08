import { create } from 'zustand';
import { axiosInstance } from '@/lib/axios';
import { toast } from 'sonner';
import { NavigateFunction } from 'react-router-dom';

interface FormField {
  name: string;
  type: string;
  required: boolean;
  value: null | string;
}

interface AmountBreakdown {
  baseAmount: number;
  kolektoFee: number;
  paymentGatewayFee: number;
  totalFees: number;
  totalPayable: number;
  feeBearer: 'organizer' | 'contributor';
}

interface CollectionFormData {
  collectionTittle: string;
  collectionDescription: string | null;
  amount: number;
  amountBreakdown: AmountBreakdown;
  deadline: string | null;
  numberOfParticipants: number | null;
  participantInformation: FormField[];
  generateUniqueCodes: boolean;
  codePrefix: string | null;
}

interface Collection {
  id: string;
  title: string;
  description?: string;
  amount: number;
  deadline: string;
  status: 'active' | 'expired' | 'completed';
  participants_count: number;
  max_participants?: number;
  created_at: string;
}

interface CollectionState {
  isCreating: boolean;
  isLoading: boolean;
  error: string | null;
  collections: Collection[];
  selectedCollection: Collection | null;
  createCollection: (formData: CollectionFormData, navigate: NavigateFunction) => Promise<void>;
  fetchCollections: () => Promise<void>;
  fetchCollection: (id: string) => Promise<void>;
}

export const useCollectionStore = create<CollectionState>((set) => ({
  isCreating: false,
  isLoading: false,
  error: null,
  collections: [],
  selectedCollection: null,
  createCollection: async (formData, navigate) => {
    set({ isCreating: true });
    try {
      const response = await axiosInstance.post('/collections/create', formData);
      set({ isCreating: false });
      toast.success(response.data.message);
      navigate('/dashboard/collections');
    } catch (error) {
      set({ isCreating: false });
      if (error instanceof Error) {
        console.error("Collection creation failed:", error);
        toast.error(error.message || "Failed to create collection");
      } else {
        toast.error("An unexpected error occurred");
      }
    }
  },
  fetchCollections: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await axiosInstance.get('/collections');
      set({
        isLoading: false,
        collections: response.data.collections,
        error: null
      });
    } catch (error) {
      set({ isLoading: false });
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch collections';
      set({ error: errorMessage });
      toast.error(errorMessage);
    }
  },
  fetchCollection: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axiosInstance.get(`/collections/collection/${id}`);
      set({
        isLoading: false,
        selectedCollection: response.data.collection,
        error: null
      });
    } catch (error) {
      set({ isLoading: false });
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch collection';
      set({ error: errorMessage, selectedCollection: null });
      toast.error(errorMessage);
      console.log(error)
    }
  }
}));