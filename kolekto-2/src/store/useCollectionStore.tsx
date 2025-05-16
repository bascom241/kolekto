import { create } from "zustand";
import { axiosInstance } from "@/lib/axios";
import { toast } from "sonner";
import { NavigateFunction } from "react-router-dom";

interface Collection {
  id: string;
  title: string;
  description?: string;
  amount: number;
  deadline: string | null;
  status: "active" | "expired" | "completed";
  participants_count: number;
  participant_information: [];
  max_participants?: number;
  created_at: string;
}

interface Contributor {
  id: string;
  contributor_name: string;
  contributor_email: string;
  contributor_phone?: string;
  participantInformation: [];
  created_at: string;
  amount: number;
  status: "paid" | "pending" | "failed";
}

interface CollectionState {
  collections: Collection[];
  contributors: Contributor[];
  selectedCollection: Collection | null;
  isLoading: boolean;
  isCreating: boolean; // Added this line
  isContributorsLoading: boolean;
  error: string | null;
  contributorsError: string | null;
  fetchCollections: () => Promise<void>;
  fetchCollection: (id: string) => Promise<void>;
  fetchContributors: (collectionId: string) => Promise<void>;
  createCollection: (data: any, navigate: NavigateFunction) => Promise<void>;
}

export const useCollectionStore = create<CollectionState>((set) => ({
  collections: [],
  contributors: [],
  selectedCollection: null,
  isLoading: false,
  isCreating: false, // Added this line
  isContributorsLoading: false,
  error: null,
  contributorsError: null,

  fetchCollections: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await axiosInstance.get("/collections");

      set({
        collections: data.collections,
        isLoading: false,
      });
    } catch (error: any) {
      const message =
        error.response?.data?.message || "Failed to fetch collections";
      set({ error: message, isLoading: false });
      toast.error(message);
    }
  },

  fetchCollection: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await axiosInstance.get(`/collections/collection/${id}`);
      console.log("Fetched collection data:", data);
      set({
        selectedCollection: data.collection,
        isLoading: false,
      });
    } catch (error: any) {
      const message =
        error.response?.data?.message || "Failed to fetch collection";
      set({ error: message, isLoading: false, selectedCollection: null });
      toast.error(message);
    }
  },

  fetchContributors: async (collectionId: string) => {
    set({ isContributorsLoading: true, contributorsError: null });
    try {
      const { data } = await axiosInstance.get(
        `/collections/${collectionId}/contributors`
      );
      set({
        contributors: data.contributors,
        isContributorsLoading: false,
      });
    } catch (error: any) {
      const message =
        error.response?.data?.message || "Failed to fetch contributors";
      set({
        contributorsError: message,
        isContributorsLoading: false,
        contributors: [],
      });
      toast.error(message);
    }
  },

  createCollection: async (formData, navigate) => {
    set({ isCreating: true }); // Changed from isLoading to isCreating
    try {
      const { data } = await axiosInstance.post(
        "/collections/create",
        formData
      );
      toast.success(data.message);
      navigate("/dashboard/collections");
      set({ isCreating: false });
    } catch (error: any) {
      const message =
        error.response?.data?.message || "Failed to create collection";
      set({ error: message, isCreating: false });
      toast.error(message);
    }
  },
}));
