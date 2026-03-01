import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface LiteratureReview {
    references: Array<LitReviewReference>;
    researchGap: string;
    createdAt: Time;
    methodologies: Array<string>;
    updatedAt: Time;
    sessionId: string;
}
export type PaperId = string;
export interface TransformationOutput {
    status: bigint;
    body: Uint8Array;
    headers: Array<http_header>;
}
export type Time = bigint;
export type SessionId = string;
export interface http_header {
    value: string;
    name: string;
}
export interface http_request_result {
    status: bigint;
    body: Uint8Array;
    headers: Array<http_header>;
}
export interface SearchResponse {
    arxivResults: Array<Paper>;
    semanticScholarResults: Array<Paper>;
}
export type ObjectiveId = string;
export interface TransformationInput {
    context: Uint8Array;
    response: http_request_result;
}
export interface ResearchSession {
    id: SessionId;
    status: string;
    title: string;
    createdAt: Time;
    proposalText: string;
    objectives: Array<ObjectiveId>;
    proposalFileName?: string;
}
export interface Paper {
    id: PaperId;
    abstractText: string;
    title: string;
    references: Array<string>;
    fetchedContent?: string;
    sourceUrl: string;
    relevanceScore?: number;
    sourceType: string;
    keywords: Array<string>;
    summary?: string;
    addedAt: Time;
    authors: Array<string>;
    fullTextAvailable: boolean;
    citationAPA?: string;
    citationMLA?: string;
}
export interface LitReviewReference {
    id: string;
    title: string;
    doiOrUrl: string;
    journal: string;
    year: string;
    authors: Array<string>;
    notes: string;
}
export interface Objective {
    id: ObjectiveId;
    text: string;
    targetPaperCount: bigint;
    sessionId: SessionId;
    discoveredPapers: Array<PaperId>;
}
export interface UserProfile {
    principal: Principal;
    displayName: string;
    institution?: string;
    createdAt: Time;
    researchField?: string;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addPaper(id: PaperId, title: string, authors: Array<string>, sourceType: string, sourceUrl: string, abstractText: string): Promise<Paper>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createObjective(id: ObjectiveId, sessionId: SessionId, text: string, targetPaperCount: bigint): Promise<Objective>;
    createSession(id: SessionId, title: string, proposalText: string, proposalFileName: string | null): Promise<ResearchSession>;
    createUserProfile(displayName: string, institution: string | null, researchField: string | null): Promise<UserProfile>;
    deleteLiteratureReview(sessionId: string): Promise<void>;
    deleteObjective(_id: ObjectiveId): Promise<void>;
    deletePaper(_id: PaperId): Promise<void>;
    deleteSession(_id: string): Promise<void>;
    getAllSessions(): Promise<Array<ResearchSession>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getLiteratureReview(sessionId: string): Promise<LiteratureReview | null>;
    getObjective(_id: ObjectiveId): Promise<Objective>;
    getObjectivesBySession(sessionId: SessionId): Promise<Array<Objective>>;
    getPaper(_id: PaperId): Promise<Paper>;
    getPapersByObjective(_objectiveId: ObjectiveId): Promise<Array<Paper>>;
    getPapersBySession(_sessionId: SessionId): Promise<Array<Paper>>;
    getSession(_id: string): Promise<ResearchSession>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    saveLiteratureReview(sessionId: string, researchGap: string, methodologies: Array<string>, refs: Array<LitReviewReference>): Promise<LiteratureReview>;
    searchExternalDatabases(_objective: string): Promise<SearchResponse>;
    searchSessionsByTitle(_searchText: string): Promise<Array<ResearchSession>>;
    transformOutcall(input: TransformationInput): Promise<TransformationOutput>;
    updatePaper(paper: Paper): Promise<Paper>;
    updateSessionTitle(id: string, newTitle: string): Promise<ResearchSession>;
    updateUserProfile(displayName: string, institution: string | null, researchField: string | null): Promise<UserProfile>;
}
