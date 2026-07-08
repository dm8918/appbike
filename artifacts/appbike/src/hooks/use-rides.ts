import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getMyRides, createRide, deleteRide } from "@/lib/api";

export function useMyRides() {
  return useQuery({
    queryKey: ["rides"],
    queryFn: getMyRides,
  });
}

export function useCreateRide() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createRide,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rides"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
      queryClient.invalidateQueries({ queryKey: ["leaderboard"] });
    },
  });
}

export function useDeleteRide() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteRide,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rides"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
      queryClient.invalidateQueries({ queryKey: ["leaderboard"] });
    },
  });
}
