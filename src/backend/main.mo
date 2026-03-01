import Map "mo:core/Map";
import Array "mo:core/Array";
import Time "mo:core/Time";
import Runtime "mo:core/Runtime";
import Text "mo:core/Text";
import Nat "mo:core/Nat";
import List "mo:core/List";
import Principal "mo:core/Principal";
import Int "mo:core/Int";
import VarArray "mo:core/VarArray";
import Order "mo:core/Order";
import Iter "mo:core/Iter";

import MixinStorage "blob-storage/Mixin";
import Storage "blob-storage/Storage";
import OutCall "http-outcalls/outcall";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";


actor {
  // Initialize the access control system
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);
  include MixinStorage();

  type SessionId = Text;
  type ObjectiveId = Text;
  type PaperId = Text;
  type UserProfileKey = Text;

  public type UserProfile = {
    principal : Principal;
    displayName : Text;
    institution : ?Text;
    researchField : ?Text;
    createdAt : Time.Time;
  };

  public type LitReviewReference = {
    id : Text;
    authors : [Text];
    title : Text;
    year : Text;
    journal : Text;
    doiOrUrl : Text;
    notes : Text;
  };

  public type LiteratureReview = {
    sessionId : Text;
    researchGap : Text;
    methodologies : [Text];
    references : [LitReviewReference];
    createdAt : Time.Time;
    updatedAt : Time.Time;
  };

  public type ResearchSession = {
    id : SessionId;
    title : Text;
    createdAt : Time.Time;
    proposalText : Text;
    proposalFileName : ?Text;
    objectives : [ObjectiveId];
    status : Text;
  };

  public type Objective = {
    id : ObjectiveId;
    sessionId : SessionId;
    text : Text;
    targetPaperCount : Nat;
    discoveredPapers : [PaperId];
  };

  public type Paper = {
    id : PaperId;
    title : Text;
    authors : [Text];
    sourceType : Text;
    sourceUrl : Text;
    abstractText : Text;
    fullTextAvailable : Bool;
    fetchedContent : ?Text;
    summary : ?Text;
    references : [Text];
    citationAPA : ?Text;
    citationMLA : ?Text;
    keywords : [Text];
    relevanceScore : ?Float;
    addedAt : Time.Time;
  };

  public type HistoryEntry = {
    sessionId : SessionId;
    accessedAt : Time.Time;
  };

  public type SessionWithMetadata = {
    session : ResearchSession;
    objectiveCount : Nat;
    paperCount : Nat;
  };

  public type ResearchSessionMetadata = {
    id : SessionId;
    lastAccessed : ?Time.Time;
    title : Text;
    status : Text;
  };

  public type SearchResult = {
    sourceType : Text;
    papers : [Paper];
  };

  public type SearchResponse = {
    arxivResults : [Paper];
    semanticScholarResults : [Paper];
  };

  public type FetchPaperResponse = {
    url : Text;
    content : ?Text;
    hadErrors : Bool;
    httpStatus : Nat;
    urlStatus : Text;
    errors : [Text];
  };

  public type FetchFullTextResponse = {
    paperId : ?PaperId;
    url : Text;
    content : ?Text;
    httpStatus : Nat;
    urlStatus : Text;
    errors : [Text];
  };

  module ResearchSession {
    public func compare(session1 : ResearchSession, session2 : ResearchSession) : Order.Order {
      Int.compare(session1.createdAt, session2.createdAt);
    };
  };

  let sessions = Map.empty<SessionId, ResearchSession>();
  let objectives = Map.empty<ObjectiveId, Objective>();
  let papers = Map.empty<PaperId, Paper>();
  let userProfiles = Map.empty<UserProfileKey, UserProfile>();
  let literatureReviews = Map.empty<Text, LiteratureReview>();

  func getPrincipalText(_principal : Principal) : Text {
    _principal.toText();
  };

  // Required profile functions per instructions
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access profiles");
    };
    let principalText = getPrincipalText(caller);
    userProfiles.get(principalText);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    let principalText = getPrincipalText(caller);
    userProfiles.add(principalText, profile);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    let principalText = getPrincipalText(user);
    userProfiles.get(principalText);
  };

  // User Profile Management
  public shared ({ caller }) func createUserProfile(displayName : Text, institution : ?Text, researchField : ?Text) : async UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create profiles");
    };
    let principalText = getPrincipalText(caller);
    if (displayName.size() > 120) { Runtime.trap("Sorry, display name is too long") };

    let profile : UserProfile = {
      principal = caller;
      displayName;
      institution;
      researchField;
      createdAt = Time.now();
    };

    userProfiles.add(principalText, profile);
    profile;
  };

  public shared ({ caller }) func updateUserProfile(displayName : Text, institution : ?Text, researchField : ?Text) : async UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update profiles");
    };
    let principalText = getPrincipalText(caller);

    switch (userProfiles.get(principalText)) {
      case (null) { Runtime.trap("User profile not found") };
      case (?existingProfile) {
        let updatedProfile = {
          existingProfile with
          displayName;
          institution;
          researchField;
        };
        userProfiles.add(principalText, updatedProfile);
        updatedProfile;
      };
    };
  };

  // Literature Review Management
  public shared ({ caller }) func saveLiteratureReview(sessionId : Text, researchGap : Text, methodologies : [Text], refs : [LitReviewReference]) : async LiteratureReview {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save literature reviews");
    };
    let principalText = getPrincipalText(caller);

    let now = Time.now();
    let review : LiteratureReview = {
      sessionId;
      researchGap;
      methodologies;
      references = refs;
      createdAt = now;
      updatedAt = now;
    };

    let revKey = principalText.concat(":").concat(sessionId);
    literatureReviews.add(revKey, review);
    review;
  };

  public query ({ caller }) func getLiteratureReview(sessionId : Text) : async ?LiteratureReview {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access literature reviews");
    };
    let principalText = getPrincipalText(caller);
    let revKey = principalText.concat(":").concat(sessionId);
    literatureReviews.get(revKey);
  };

  public shared ({ caller }) func deleteLiteratureReview(sessionId : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete literature reviews");
    };
    let principalText = getPrincipalText(caller);
    let revKey = principalText.concat(":").concat(sessionId);
    literatureReviews.remove(revKey);
  };

  // Session Management

  func validateSessionTitle(_title : Text) {
    if (_title.size() < 3 or _title.size() > 120) {
      Runtime.trap("Title must be between 3 and 120 characters");
    };
    if (_title.trim(#char ' ').size() == 0) {
      Runtime.trap("Title cannot be empty or only spaces. ");
    };
    if (_title.size() > 120) { Runtime.trap("Title is too long") };
  };

  func validateResearchProposal(_proposalText : Text, _proposalFileName : ?Text) {
    if (_proposalText.size() == 0) {
      Runtime.trap("Proposal text cannot be an empty string. ");
    };

    let maxFileNameLength = 255;
    switch (_proposalFileName) {
      case (null) {};
      case (?fileName) {
        if (fileName.size() > maxFileNameLength) {
          Runtime.trap("File name of proposal is too long. ");
        };
      };
    };
  };

  func validateObjective(_objText : Text, _targetPaperCount : Nat) {
    if (_targetPaperCount < 10 or _targetPaperCount > 25) {
      Runtime.trap("Target paper count must be between 10 and 25. ");
    };

    let trimmedText = _objText.trim(#char ' ');
    if (trimmedText.size() == 0) {
      Runtime.trap("Objective text cannot be empty. ");
    };
  };

  public shared ({ caller }) func createSession(id : SessionId, title : Text, proposalText : Text, proposalFileName : ?Text) : async ResearchSession {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create sessions");
    };
    validateSessionTitle(title);
    validateResearchProposal(proposalText, proposalFileName);

    if (sessions.containsKey(id)) { Runtime.trap("Session already exists. ") };

    let session : ResearchSession = {
      id;
      title;
      createdAt = Time.now();
      proposalText;
      proposalFileName;
      objectives = [];
      status = "Draft";
    };

    sessions.add(id, session);
    session;
  };

  public query ({ caller }) func getSession(_id : Text) : async ResearchSession {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access sessions");
    };
    switch (sessions.get(_id)) {
      case (null) { Runtime.trap("Session does not exist. ") };
      case (?session) { session };
    };
  };

  public query ({ caller }) func getAllSessions() : async [ResearchSession] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access sessions");
    };
    sessions.values().toArray();
  };

  public shared ({ caller }) func updateSessionTitle(id : Text, newTitle : Text) : async ResearchSession {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update sessions");
    };
    validateSessionTitle(newTitle);

    switch (sessions.get(id)) {
      case (null) { Runtime.trap("Session does not exist. ") };
      case (?existingSession) {
        let updatedSession = { existingSession with title = newTitle };
        sessions.add(id, updatedSession);
        updatedSession;
      };
    };
  };

  public shared ({ caller }) func deleteSession(_id : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete sessions");
    };
    if (not sessions.containsKey(_id)) { Runtime.trap("Session does not exist. ") };
    sessions.remove(_id);
  };

  // Objective Management
  public shared ({ caller }) func createObjective(id : ObjectiveId, sessionId : SessionId, text : Text, targetPaperCount : Nat) : async Objective {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create objectives");
    };
    validateObjective(text, targetPaperCount);

    if (objectives.containsKey(id)) { Runtime.trap("Objective task already exists. ") };
    if (not sessions.containsKey(sessionId)) { Runtime.trap("Session does not exist. ") };

    let objective : Objective = {
      id;
      sessionId;
      text;
      targetPaperCount;
      discoveredPapers = [];
    };

    objectives.add(id, objective);
    objective;
  };

  public query ({ caller }) func getObjective(_id : ObjectiveId) : async Objective {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access objectives");
    };
    switch (objectives.get(_id)) {
      case (null) { Runtime.trap("Objective does not exist. ") };
      case (?objective) { objective };
    };
  };

  public query ({ caller }) func getObjectivesBySession(sessionId : SessionId) : async [Objective] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access objectives");
    };
    objectives.values().toArray().filter(
      func(obj) {
        obj.sessionId == sessionId;
      }
    );
  };

  public shared ({ caller }) func deleteObjective(_id : ObjectiveId) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete objectives");
    };
    if (not objectives.containsKey(_id)) {
      Runtime.trap("Objective does not exist. ");
    };
    objectives.remove(_id);
  };

  // Paper Management
  public shared ({ caller }) func addPaper(id : PaperId, title : Text, authors : [Text], sourceType : Text, sourceUrl : Text, abstractText : Text) : async Paper {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can add papers");
    };

    let paper : Paper = {
      id;
      title;
      authors;
      sourceType;
      sourceUrl;
      abstractText;
      fullTextAvailable = false;
      fetchedContent = null;
      summary = null;
      references = [];
      citationAPA = null;
      citationMLA = null;
      keywords = [];
      relevanceScore = null;
      addedAt = Time.now();
    };

    papers.add(id, paper);
    paper;
  };

  public shared ({ caller }) func updatePaper(paper : Paper) : async Paper {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update papers");
    };

    if (not papers.containsKey(paper.id)) { Runtime.trap("Paper does not exist. ") };
    papers.add(paper.id, paper);
    paper;
  };

  public query ({ caller }) func getPaper(_id : PaperId) : async Paper {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access papers");
    };
    switch (papers.get(_id)) {
      case (null) { Runtime.trap("Paper not found") };
      case (?paper) { paper };
    };
  };

  public shared ({ caller }) func deletePaper(_id : PaperId) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete papers");
    };
    if (not papers.containsKey(_id)) { Runtime.trap("Paper does not exist. ") };
    papers.remove(_id);
  };

  public query ({ caller }) func getPapersBySession(_sessionId : SessionId) : async [Paper] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access papers");
    };
    papers.values().toArray();
  };

  public query ({ caller }) func getPapersByObjective(_objectiveId : ObjectiveId) : async [Paper] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access papers");
    };
    papers.values().toArray();
  };

  // Search and Filtering
  public query ({ caller }) func searchSessionsByTitle(_searchText : Text) : async [ResearchSession] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can search sessions");
    };
    let sessionList = sessions.values().toList<ResearchSession>();
    let filteredList = sessionList.filter(
      func(session) {
        session.title.contains(#text _searchText);
      }
    );
    filteredList.toArray();
  };

  // HTTP Outcalls for Paper Search
  public query func transformOutcall(input : OutCall.TransformationInput) : async OutCall.TransformationOutput {
    OutCall.transform(input);
  };

  // Call external APIs (tunnel results to frontend for parsing)
  func makeGetOutcall(_url : Text) : async Text {
    await OutCall.httpGetRequest(_url, [], transformOutcall);
  };

  public shared ({ caller }) func searchExternalDatabases(_objective : Text) : async SearchResponse {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can search external databases");
    };
    let arxivResultsRaw = await makeGetOutcall("https://export.arxiv.org/api/query?search_query=" # _objective # "&start=0&max_results=10");
    let semanticScholarResultsRaw = await makeGetOutcall("https://api.semanticscholar.org/graph/v1/paper/search?query=" # _objective # "&limit=10");

    Runtime.trap(arxivResultsRaw # "/" # semanticScholarResultsRaw);

    {
      arxivResults = [];
      semanticScholarResults = [];
    };
  };
};
