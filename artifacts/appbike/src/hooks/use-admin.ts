import { useQuery } from "@tanstack/react-query";
import { getAdminUsers, getAdminRides } from "@/lib/api";

export function useAdminUsers() {
  return useQuery({
    queryKey: ["admin", "users"],
    queryFn: getAdminUsers,
  });
}

export function useAdminRides(userId?: number) {
  return useQuery({
    queryKey: ["admin", "rides", userId],
    queryFn: () => getAdminRides(userId),
  });
}
