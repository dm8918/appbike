import { createContext, useContext, useEffect, ReactNode } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { User, getMe, login as apiLogin, register as apiRegister, logout as apiLogout } from "@/lib/api";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: typeof apiLogin;
  register: typeof apiRegister;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();

  const { data: user, isLoading } = useQuery({
    queryKey: ["me"],
    queryFn: getMe,
    retry: false,
    staleTime: Infinity,
  });

  const loginMutation = useMutation({
    mutationFn: apiLogin,
    onSuccess: (data) => {
      queryClient.setQueryData(["me"], data);
    },
  });

  const registerMutation = useMutation({
    mutationFn: apiRegister,
    onSuccess: (data) => {
      queryClient.setQueryData(["me"], data);
    },
  });

  const logoutMutation = useMutation({
    mutationFn: apiLogout,
    onSuccess: () => {
      queryClient.setQueryData(["me"], null);
      queryClient.clear();
    },
  });

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        isLoading,
        login: async (input) => await loginMutation.mutateAsync(input),
        register: async (input) => await registerMutation.mutateAsync(input),
        logout: async () => await logoutMutation.mutateAsync(),
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
