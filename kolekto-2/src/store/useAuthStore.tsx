import {create} from 'zustand';
import { axiosInstance } from '@/lib/axios';
import {toast} from "sonner"
interface AuthState{
    login:(formData:object, navigate:any) => Promise<void>;
    register :() => Promise<void>;
    isLoggedIn:boolean;
}

export const useAuthStore = create<AuthState>((set)=> ({
    isLoggedIn:false,
    login:async(formData,navigate)=>{
        set({isLoggedIn:true});
        try {
           const response =  await axiosInstance.post("/users/login", formData);
            set({isLoggedIn:false});
            toast.success(response.data.message);
            navigate("/dashboard");
            
        } catch (error) {
            if (error instanceof Error) {
                console.log(error)
                toast.error(error.message);
            }
        }
     
        
    },
    register:async()=>{

    }
}))