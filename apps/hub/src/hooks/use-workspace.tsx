'use client';

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useAuth } from './use-auth';
import {
  acceptWorkspaceInvitation,
  createWorkspaceWithOwner,
  fetchUserWorkspaces,
  type WorkspaceSummary,
} from '@/lib/supabase/workspace-service';

const ACTIVE_WS_STORAGE_KEY = 'khaispace-hub-active-workspace';

interface WorkspaceContextValue {
  workspaces: WorkspaceSummary[];
  activeWorkspace: WorkspaceSummary | null;
  isLoading: boolean;
  error: string | null;
  refreshWorkspaces: () => Promise<void>;
  selectWorkspace: (workspaceId: string) => void;
  createWorkspace: (input: { name: string; description?: string; timezone?: string }) => Promise<void>;
  acceptInvite: (token: string) => Promise<void>;
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const [workspaces, setWorkspaces] = useState<WorkspaceSummary[]>([]);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return window.localStorage.getItem(ACTIVE_WS_STORAGE_KEY);
    }
    return null;
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const refreshWorkspaces = useCallback(async () => {
    if (!isAuthenticated || !user) {
      setWorkspaces([]);
      setIsLoading(false);
      return;
    }

    setError(null);
    try {
      const list = await fetchUserWorkspaces(user.id);
      setWorkspaces(list);
      if (list.length > 0) {
        setActiveWorkspaceId((prev) => {
          const valid = prev && list.some((w) => w.id === prev) ? prev : list[0].id;
          if (typeof window !== 'undefined') {
            window.localStorage.setItem(ACTIVE_WS_STORAGE_KEY, valid);
          }
          return valid;
        });
      } else {
        setActiveWorkspaceId(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load workspace memberships.');
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    if (!isAuthLoading) {
      let active = true;
      void (async () => {
        if (!isAuthenticated || !user) {
          if (active) {
            setWorkspaces([]);
            setIsLoading(false);
          }
          return;
        }
        try {
          const list = await fetchUserWorkspaces(user.id);
          if (!active) return;
          setWorkspaces(list);
          setError(null);
          if (list.length > 0) {
            setActiveWorkspaceId((prev) => {
              const valid = prev && list.some((w) => w.id === prev) ? prev : list[0].id;
              if (typeof window !== 'undefined') {
                window.localStorage.setItem(ACTIVE_WS_STORAGE_KEY, valid);
              }
              return valid;
            });
          } else {
            setActiveWorkspaceId(null);
          }
        } catch (err) {
          if (active) {
            setError(err instanceof Error ? err.message : 'Failed to load workspace memberships.');
          }
        } finally {
          if (active) setIsLoading(false);
        }
      })();
      return () => {
        active = false;
      };
    }
  }, [isAuthLoading, isAuthenticated, user]);

  const selectWorkspace = useCallback((workspaceId: string) => {
    setActiveWorkspaceId(workspaceId);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(ACTIVE_WS_STORAGE_KEY, workspaceId);
    }
  }, []);

  const createWorkspace = useCallback(
    async (input: { name: string; description?: string; timezone?: string }) => {
      const newId = await createWorkspaceWithOwner(input);
      setActiveWorkspaceId(newId);
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(ACTIVE_WS_STORAGE_KEY, newId);
      }
      await refreshWorkspaces();
    },
    [refreshWorkspaces]
  );

  const acceptInvite = useCallback(
    async (token: string) => {
      await acceptWorkspaceInvitation(token);
      await refreshWorkspaces();
    },
    [refreshWorkspaces]
  );

  const activeWorkspace =
    workspaces.find((w) => w.id === activeWorkspaceId) ?? workspaces[0] ?? null;

  return (
    <WorkspaceContext.Provider
      value={{
        workspaces,
        activeWorkspace,
        isLoading,
        error,
        refreshWorkspaces,
        selectWorkspace,
        createWorkspace,
        acceptInvite,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace(): WorkspaceContextValue {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) {
    throw new Error('useWorkspace must be used inside WorkspaceProvider.');
  }
  return ctx;
}

