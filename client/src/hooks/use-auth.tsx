import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { Contractor, ContractorInsert } from "../../../shared/schema";
import { getQueryFn, apiRequest, queryClient } from "../lib/queryClient";
import { useToast } from './use-toast';

type AuthContextType = {
  user: Contractor | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: UseMutationResult<Contractor, Error, LoginData>;
  logoutMutation: UseMutationResult<void, Error, void>;
  registerMutation: UseMutationResult<Contractor, Error, RegisterData>;
  isSessionRecoveryActive: boolean;
  refreshSession: () => Promise<void>;
};

type LoginData = {
  email: string;
  password: string;
};

type RegisterData = {
  firstName: string;
  lastName: string;
  companyName: string;
  username: string;
  email: string;
  password: string;
};

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [isSessionRecoveryActive, setIsSessionRecoveryActive] = useState(false);
  
  const {
    data: user,
    error,
    isLoading,
    refetch
  } = useQuery<Contractor | null>({
    queryKey: ["/api/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });
  
  // Almacenar información del usuario para posible recuperación
  useEffect(() => {
    if (user) {
      // Guardar email para posible reconexión
      localStorage.setItem('lastUserEmail', user.email);
    }
  }, [user]);

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData) => {
      console.log('Attempting login with:', credentials.email);
      const res = await apiRequest("POST", "/api/login", credentials);
      return await res.json();
    },
    onSuccess: async (user: Contractor) => {
      console.log('Login successful:', user.email);
      queryClient.setQueryData(["/api/user"], user);
      // Force refetch to ensure the user data is immediately available
      await refetch();
      toast({
        title: "Login successful",
        description: `Welcome back, ${user.firstName}!`,
      });
    },
    onError: (error: Error) => {
      console.error('Login failed:', error);
      toast({
        title: "Login failed",
        description: error.message || "Please check your credentials and try again.",
        variant: "destructive",
      });
    },
  });

  // Force refetch user data when login is successful
  useEffect(() => {
    if (loginMutation.isSuccess) {
      refetch();
    }
  }, [loginMutation.isSuccess, refetch]);

  const registerMutation = useMutation({
    mutationFn: async (credentials: RegisterData) => {
      console.log('Attempting registration with:', credentials.email);
      const res = await apiRequest("POST", "/api/register", credentials);
      return await res.json();
    },
    onSuccess: (user: Contractor) => {
      console.log('Registration successful:', user.email);
      queryClient.setQueryData(["/api/user"], user);
      toast({
        title: "Registration successful",
        description: `Welcome to Remodra, ${user.firstName}!`,
      });
    },
    onError: (error: Error) => {
      console.error('Registration failed:', error);
      toast({
        title: "Registration failed",
        description: error.message || "Please check your information and try again.",
        variant: "destructive",
      });
    },
  });

  // Force refetch user data when registration is successful
  useEffect(() => {
    if (registerMutation.isSuccess) {
      refetch();
    }
  }, [registerMutation.isSuccess, refetch]);

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/logout");
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/user"], null);
      toast({
        title: "Logged out successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Logout failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Función para intentar refrescar la sesión del usuario
  const refreshSession = async (): Promise<void> => {
    try {
      setIsSessionRecoveryActive(true);
      
      // Refrescar datos del usuario
      await refetch();
      
      // Verificar si la sesión se recuperó
      const currentUser = queryClient.getQueryData<Contractor | null>(["/api/user"]);
      
      if (currentUser) {
        // Removed session restored toast notification
      } else {
        // Removed session expired toast notification
      }
    } catch (error) {
      console.error("Error al refrescar la sesión:", error);
    } finally {
      setIsSessionRecoveryActive(false);
    }
  };
  
  // Monitorear si la sesión se pierde inesperadamente
  useEffect(() => {
    if (!isLoading && !user && localStorage.getItem('lastUserEmail')) {
      // Removed session expiration toast notification
    }
  }, [isLoading, user, toast]);

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        isLoading,
        error,
        loginMutation,
        logoutMutation,
        registerMutation,
        isSessionRecoveryActive,
        refreshSession
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
