"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useCallback, useState, useRef } from "react";
import { getSupabaseClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import type { Notification } from "@/types/database";

async function fetchNotifications(): Promise<{ notifications: Notification[]; total: number }> {
  const res = await fetch("/api/notifications?limit=30");
  if (!res.ok) throw new Error("Erro ao buscar notificações");
  const json = await res.json();
  return json.data;
}

async function markReadApi(params: { notificationId?: string; markAllRead?: boolean }) {
  const res = await fetch("/api/notifications", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  if (!res.ok) throw new Error("Erro ao marcar notificação");
  return res.json();
}

export function useNotifications() {
  const queryClient = useQueryClient();
  const [userId, setUserId] = useState<string | null>(null);
  const knownIdsRef = useRef<Set<string>>(new Set());
  const initialLoadDoneRef = useRef(false);

  // Get user session
  useEffect(() => {
    const supabase = getSupabaseClient();

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserId(session?.user?.id ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const { data, isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: fetchNotifications,
    refetchInterval: 10_000,
    enabled: !!userId,
  });

  const notifications = data?.notifications || [];
  const unreadCount = notifications.filter((n) => !n.read).length;

  // Detect new notifications from polling and show toasts
  useEffect(() => {
    if (!data?.notifications) return;

    if (!initialLoadDoneRef.current) {
      // First load: populate known IDs without showing toasts
      data.notifications.forEach((n) => knownIdsRef.current.add(n.id));
      initialLoadDoneRef.current = true;
      return;
    }

    // Check for new notifications not yet seen
    for (const notification of data.notifications) {
      if (!knownIdsRef.current.has(notification.id)) {
        knownIdsRef.current.add(notification.id);
        toast(notification.title, {
          description: notification.message,
        });
      }
    }
  }, [data?.notifications]);

  // Realtime subscription as acceleration (works if Realtime is enabled)
  useEffect(() => {
    if (!userId) return;

    const supabase = getSupabaseClient();

    // Set auth token for realtime connection
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.access_token) {
        supabase.realtime.setAuth(session.access_token);
      }
    });

    const channel = supabase
      .channel(`notifications-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const newNotification = payload.new as Notification;

          // Skip if already known (polling already picked it up)
          if (knownIdsRef.current.has(newNotification.id)) return;
          knownIdsRef.current.add(newNotification.id);

          queryClient.setQueryData<{ notifications: Notification[]; total: number }>(
            ["notifications"],
            (old) => {
              if (!old) return { notifications: [newNotification], total: 1 };
              if (old.notifications.some((n) => n.id === newNotification.id)) {
                return old;
              }
              return {
                notifications: [newNotification, ...old.notifications],
                total: old.total + 1,
              };
            }
          );

          toast(newNotification.title, {
            description: newNotification.message,
          });
        }
      )
      .subscribe((status, err) => {
        if (status === "SUBSCRIBED") {
          console.log("[Notifications] Realtime connected");
        }
        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          console.warn("[Notifications] Realtime fallback to polling:", status, err);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, queryClient]);

  const markAsReadMutation = useMutation({
    mutationFn: (notificationId: string) => markReadApi({ notificationId }),
    onMutate: async (notificationId) => {
      await queryClient.cancelQueries({ queryKey: ["notifications"] });
      const previous = queryClient.getQueryData<{ notifications: Notification[]; total: number }>(["notifications"]);
      queryClient.setQueryData<{ notifications: Notification[]; total: number }>(
        ["notifications"],
        (old) => {
          if (!old) return old!;
          return {
            ...old,
            notifications: old.notifications.map((n) =>
              n.id === notificationId ? { ...n, read: true, read_at: new Date().toISOString() } : n
            ),
          };
        }
      );
      return { previous };
    },
    onError: (_err, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["notifications"], context.previous);
      }
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: () => markReadApi({ markAllRead: true }),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ["notifications"] });
      const previous = queryClient.getQueryData<{ notifications: Notification[]; total: number }>(["notifications"]);
      queryClient.setQueryData<{ notifications: Notification[]; total: number }>(
        ["notifications"],
        (old) => {
          if (!old) return old!;
          const now = new Date().toISOString();
          return {
            ...old,
            notifications: old.notifications.map((n) => ({ ...n, read: true, read_at: now })),
          };
        }
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["notifications"], context.previous);
      }
    },
  });

  const markAsRead = useCallback(
    (id: string) => markAsReadMutation.mutate(id),
    [markAsReadMutation]
  );

  const markAllAsRead = useCallback(
    () => markAllAsReadMutation.mutate(),
    [markAllAsReadMutation]
  );

  return {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
  };
}
