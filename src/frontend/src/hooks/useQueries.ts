import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  LitReviewReference,
  LiteratureReview,
  Objective,
  ObjectiveId,
  Paper,
  PaperId,
  ResearchSession,
  SearchResponse,
  SessionId,
  UserProfile,
} from "../backend.d";
import { useActor } from "./useActor";
import { useInternetIdentity } from "./useInternetIdentity";

export function useAllSessions() {
  const { actor, isFetching } = useActor();
  return useQuery<ResearchSession[]>({
    queryKey: ["sessions"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllSessions();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSession(id: string | null) {
  const { actor, isFetching } = useActor();
  return useQuery<ResearchSession>({
    queryKey: ["session", id],
    queryFn: async () => {
      if (!actor || !id) throw new Error("No actor or id");
      return actor.getSession(id);
    },
    enabled: !!actor && !isFetching && !!id,
  });
}

export function useObjectivesBySession(sessionId: string | null) {
  const { actor, isFetching } = useActor();
  return useQuery<Objective[]>({
    queryKey: ["objectives", sessionId],
    queryFn: async () => {
      if (!actor || !sessionId) return [];
      return actor.getObjectivesBySession(sessionId);
    },
    enabled: !!actor && !isFetching && !!sessionId,
  });
}

export function usePapersBySession(sessionId: string | null) {
  const { actor, isFetching } = useActor();
  return useQuery<Paper[]>({
    queryKey: ["papers", sessionId],
    queryFn: async () => {
      if (!actor || !sessionId) return [];
      return actor.getPapersBySession(sessionId);
    },
    enabled: !!actor && !isFetching && !!sessionId,
  });
}

export function usePapersByObjective(objectiveId: string | null) {
  const { actor, isFetching } = useActor();
  return useQuery<Paper[]>({
    queryKey: ["papers-by-objective", objectiveId],
    queryFn: async () => {
      if (!actor || !objectiveId) return [];
      return actor.getPapersByObjective(objectiveId);
    },
    enabled: !!actor && !isFetching && !!objectiveId,
  });
}

export function useSearchExternalDatabases() {
  const { actor } = useActor();
  return useMutation<SearchResponse, Error, string>({
    mutationFn: async (objective: string) => {
      if (!actor) throw new Error("No actor available");
      return actor.searchExternalDatabases(objective);
    },
  });
}

export function useCreateSession() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation<
    ResearchSession,
    Error,
    {
      id: SessionId;
      title: string;
      proposalText: string;
      proposalFileName: string | null;
    }
  >({
    mutationFn: async ({ id, title, proposalText, proposalFileName }) => {
      if (!actor) throw new Error("No actor available");
      return actor.createSession(id, title, proposalText, proposalFileName);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
    },
  });
}

export function useCreateObjective() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation<
    Objective,
    Error,
    {
      id: ObjectiveId;
      sessionId: SessionId;
      text: string;
      targetPaperCount: bigint;
    }
  >({
    mutationFn: async ({ id, sessionId, text, targetPaperCount }) => {
      if (!actor) throw new Error("No actor available");
      return actor.createObjective(id, sessionId, text, targetPaperCount);
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({
        queryKey: ["objectives", vars.sessionId],
      });
      queryClient.invalidateQueries({ queryKey: ["session", vars.sessionId] });
    },
  });
}

export function useAddPaper() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation<
    Paper,
    Error,
    {
      id: PaperId;
      title: string;
      authors: string[];
      sourceType: string;
      sourceUrl: string;
      abstractText: string;
      sessionId?: string;
    }
  >({
    mutationFn: async ({
      id,
      title,
      authors,
      sourceType,
      sourceUrl,
      abstractText,
    }) => {
      if (!actor) throw new Error("No actor available");
      return actor.addPaper(
        id,
        title,
        authors,
        sourceType,
        sourceUrl,
        abstractText,
      );
    },
    onSuccess: (_data, vars) => {
      if (vars.sessionId) {
        queryClient.invalidateQueries({ queryKey: ["papers", vars.sessionId] });
      }
    },
  });
}

export function useUpdatePaper() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation<Paper, Error, Paper>({
    mutationFn: async (paper: Paper) => {
      if (!actor) throw new Error("No actor available");
      return actor.updatePaper(paper);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["papers"] });
      queryClient.invalidateQueries({ queryKey: ["paper", data.id] });
    },
  });
}

export function useDeleteSession() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: async (id: string) => {
      if (!actor) throw new Error("No actor available");
      return actor.deleteSession(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
    },
  });
}

// ─── User Profile Hooks ───────────────────────────────────────────────────────

export function useUserProfile() {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();
  return useQuery<UserProfile | null>({
    queryKey: ["userProfile"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !isFetching && !!identity,
  });
}

export function useCreateUserProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation<
    UserProfile,
    Error,
    {
      displayName: string;
      institution: string | null;
      researchField: string | null;
    }
  >({
    mutationFn: async ({ displayName, institution, researchField }) => {
      if (!actor) throw new Error("No actor available");
      return actor.createUserProfile(displayName, institution, researchField);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userProfile"] });
    },
  });
}

export function useUpdateUserProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation<
    UserProfile,
    Error,
    {
      displayName: string;
      institution: string | null;
      researchField: string | null;
    }
  >({
    mutationFn: async ({ displayName, institution, researchField }) => {
      if (!actor) throw new Error("No actor available");
      return actor.updateUserProfile(displayName, institution, researchField);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userProfile"] });
    },
  });
}

// ─── Literature Review Hooks ──────────────────────────────────────────────────

export function useGetLiteratureReview(sessionId: string | null) {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();
  return useQuery<LiteratureReview | null>({
    queryKey: ["literatureReview", sessionId],
    queryFn: async () => {
      if (!actor || !sessionId) return null;
      return actor.getLiteratureReview(sessionId);
    },
    enabled: !!actor && !isFetching && !!identity && !!sessionId,
  });
}

export function useSaveLiteratureReview() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation<
    LiteratureReview,
    Error,
    {
      sessionId: string;
      researchGap: string;
      methodologies: string[];
      refs: LitReviewReference[];
    }
  >({
    mutationFn: async ({ sessionId, researchGap, methodologies, refs }) => {
      if (!actor) throw new Error("No actor available");
      return actor.saveLiteratureReview(
        sessionId,
        researchGap,
        methodologies,
        refs,
      );
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({
        queryKey: ["literatureReview", vars.sessionId],
      });
    },
  });
}

export function useDeleteLiteratureReview() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: async (sessionId: string) => {
      if (!actor) throw new Error("No actor available");
      return actor.deleteLiteratureReview(sessionId);
    },
    onSuccess: (_data, sessionId) => {
      queryClient.invalidateQueries({
        queryKey: ["literatureReview", sessionId],
      });
    },
  });
}

export function useUpdateSessionTitle() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation<ResearchSession, Error, { id: string; newTitle: string }>({
    mutationFn: async ({ id, newTitle }) => {
      if (!actor) throw new Error("No actor available");
      return actor.updateSessionTitle(id, newTitle);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
    },
  });
}
