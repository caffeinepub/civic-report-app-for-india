import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface FileReference {
    hash: string;
    path: string;
}
export interface Directory {
    states: Array<State>;
    unionTerritories: Array<State>;
    administrativeUnits: Array<AdministrativeUnit>;
    primeMinister?: Representative;
}
export interface Representative {
    politicalParty?: string;
    photoPath: string;
    name: string;
    lastUpdated: bigint;
    email: string;
    twitterHandle: string;
    remarks: string;
}
export interface RoadmapFeature {
    id: string;
    title: string;
    icon: string;
    description: string;
    progress: bigint;
    sectionId: string;
    timestamp: bigint;
}
export interface Feedback {
    id: string;
    status: string;
    contactInfo: string;
    admin?: Principal;
    type: string;
    message: string;
    response?: string;
    timestamp: bigint;
}
export interface Report {
    id: string;
    status: string;
    issueType: string;
    photoPath: string;
    username?: string;
    resolvedByVolunteer: boolean;
    mpData?: Representative;
    reporterName?: string;
    customAddress?: string;
    cmPhotoPath?: string;
    mlaDesignation: string;
    submittedByVolunteer: boolean;
    state: string;
    cmData?: Representative;
    cmName?: string;
    address: string;
    notes?: string;
    timestamp: bigint;
    pmData?: Representative;
    localCivicBody?: LocalCivicBody;
    pmName?: string;
    location: {
        latitude: number;
        longitude: number;
    };
    mlaPhotoPath?: string;
    proofPhotoPath?: string;
    pmPhotoPath?: string;
    mlaName?: string;
    coordinates: string;
    completionNotes?: string;
}
export interface NgoNpo {
    id: string;
    organizationName: string;
    missionStatement: string;
    principal: Principal;
    impactScore: bigint;
    contactPerson: string;
    description: string;
    approvalTimestamp?: bigint;
    email: string;
    website: string;
    logoPath: string;
    approved: boolean;
    address: string;
    rejectionNote?: string;
    phone: string;
    registrationDate: bigint;
    showContactInfo: boolean;
}
export interface AdministrativeUnit {
    unitType: string;
    parentState?: string;
    name: string;
    parentConstituency?: string;
}
export interface UserApprovalInfo {
    status: ApprovalStatus;
    principal: Principal;
}
export interface LogoHistory {
    admin: Principal;
    logoData: string;
    timestamp: bigint;
}
export interface Constituency {
    mp?: Representative;
    mlas: Array<Representative>;
    name: string;
}
export interface PendingProfileEdit {
    id: string;
    status: string;
    submittedAt: bigint;
    volunteerId: string;
    updates: VolunteerProfileUpdate;
    rejectionNote?: string;
    volunteerPrincipal: Principal;
}
export interface Volunteer {
    id: string;
    photoPath: string;
    principal: Principal;
    contactInfo: string;
    impactScore: bigint;
    name: string;
    approvalTimestamp?: bigint;
    approved: boolean;
    address: string;
    rejectionNote?: string;
    showFullMobile: boolean;
    applicationDate: bigint;
}
export interface VolunteerProfileUpdate {
    photoPath: string;
    contactInfo: string;
    name: string;
    address: string;
    showFullMobile: boolean;
}
export interface State {
    cm?: Representative;
    constituencies: Array<Constituency>;
    name: string;
    isUnionTerritory: boolean;
}
export interface UserProfile {
    name: string;
}
export interface LocalCivicBody {
    photoPath?: string;
    representativeName: string;
    bodyName: string;
    bodyType: string;
}
export enum ApprovalStatus {
    pending = "pending",
    approved = "approved",
    rejected = "rejected"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addAdmin(newAdmin: Principal): Promise<void>;
    addAdministrativeUnit(name: string, unitType: string, parentState: string | null, parentConstituency: string | null): Promise<void>;
    addConstituency(stateName: string, constituencyName: string): Promise<void>;
    addMlaToConstituency(stateName: string, constituencyName: string, mla: Representative): Promise<void>;
    addMpToConstituency(stateName: string, constituencyName: string, mp: Representative): Promise<void>;
    addState(stateName: string, cm: Representative | null, isUnionTerritory: boolean): Promise<void>;
    addUnionTerritory(utName: string, administrator: Representative | null): Promise<void>;
    applyVolunteer(name: string, photoPath: string, contactInfo: string, address: string, showFullMobile: boolean): Promise<string>;
    approveNgoNpo(ngoNpoId: string): Promise<void>;
    approveVolunteer(volunteerId: string): Promise<void>;
    approveVolunteerProfileEdit(editId: string): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createFeature(sectionId: string, featureData: RoadmapFeature): Promise<void>;
    deleteConstituency(stateName: string, constituencyName: string): Promise<void>;
    deleteFeature(featureId: string): Promise<void>;
    deleteFeedback(feedbackId: string): Promise<void>;
    deleteReport(id: string): Promise<void>;
    deleteRepresentative(stateName: string, constituencyName: string, repType: string): Promise<void>;
    dropFileReference(path: string): Promise<void>;
    exportDirectory(): Promise<Directory>;
    getAdminDirectory(): Promise<Directory>;
    getAdministrativeUnits(): Promise<Array<AdministrativeUnit>>;
    getAdmins(): Promise<Array<Principal>>;
    getAllFeedback(): Promise<Array<Feedback>>;
    getAllNgoNpos(): Promise<Array<NgoNpo>>;
    getAllPendingProfileEdits(): Promise<Array<PendingProfileEdit>>;
    getAllReports(): Promise<Array<Report>>;
    getAllRepresentatives(): Promise<Array<Representative>>;
    getAllVolunteers(): Promise<Array<Volunteer>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getConstituenciesByState(stateName: string): Promise<Array<Constituency>>;
    getConstituency(stateName: string, constituencyName: string): Promise<Constituency | null>;
    getCurrentLogo(): Promise<string>;
    getDirectory(): Promise<Directory>;
    getDirectoryWithPhotos(): Promise<Directory>;
    getFeedbackByContactInfo(contactInfo: string): Promise<Array<Feedback>>;
    getFeedbackById(feedbackId: string): Promise<Feedback | null>;
    getFeedbackByStatus(status: string): Promise<Array<Feedback>>;
    getFeedbackByType(type: string): Promise<Array<Feedback>>;
    getFileReference(path: string): Promise<FileReference>;
    getInitialReports(): Promise<Array<Report>>;
    getLogoHistory(): Promise<Array<LogoHistory>>;
    getMpByAreaOrBlock(areaOrBlock: string): Promise<Representative | null>;
    getMpByConstituency(constituencyName: string): Promise<Representative | null>;
    getMyNgoNpoProfile(): Promise<NgoNpo | null>;
    getMyPendingProfileEdit(): Promise<PendingProfileEdit | null>;
    getMyProfileEditHistory(): Promise<Array<PendingProfileEdit>>;
    getMyVolunteerProfile(): Promise<Volunteer | null>;
    getNextReports(offset: bigint, count: bigint): Promise<Array<Report>>;
    getNgoNpoById(ngoNpoId: string): Promise<NgoNpo | null>;
    getNgoNpoDirectory(): Promise<Array<NgoNpo>>;
    getPaginatedReports(page: bigint, pageSize: bigint): Promise<Array<Report>>;
    getPaginatedReportsOptimized(page: bigint, pageSize: bigint): Promise<Array<Report>>;
    getRecentReports(count: bigint): Promise<Array<Report>>;
    getReport(id: string): Promise<Report | null>;
    getReportsByState(state: string): Promise<Array<Report>>;
    getReportsForAdminTable(): Promise<Array<[Report, string, string, string]>>;
    getReportsWithAddressAndCoordinates(): Promise<Array<[Report, string, string]>>;
    getReportsWithAddresses(): Promise<Array<[Report, string]>>;
    getReportsWithCompleteLocationData(): Promise<Array<[Report, {
            latitude: number;
            longitude: number;
        }, string | null, string, string]>>;
    getReportsWithCustomAddresses(): Promise<Array<[Report, string | null, string]>>;
    getReportsWithFullLocationData(): Promise<Array<[Report, {
            latitude: number;
            longitude: number;
        }, string | null, string, string]>>;
    getReportsWithLocations(): Promise<Array<[Report, {
            latitude: number;
            longitude: number;
        }]>>;
    getReportsWithLocationsAndAddresses(): Promise<Array<[Report, {
            latitude: number;
            longitude: number;
        }, string, string]>>;
    getReportsWithLocationsAndAddressesOptimized(): Promise<Array<[Report, {
            latitude: number;
            longitude: number;
        }, string, string]>>;
    getReportsWithMinisterPhotos(): Promise<Array<[Report, string | null, string | null, string | null]>>;
    getReportsWithMinisterPhotosOptimized(): Promise<Array<[Report, string | null, string | null, string | null]>>;
    getReportsWithPhotos(): Promise<Array<[Report, string]>>;
    getReportsWithPhotosOptimized(): Promise<Array<[Report, string]>>;
    getRoadmapFeatures(): Promise<Array<RoadmapFeature>>;
    getState(stateName: string): Promise<State | null>;
    getTotalReportCount(): Promise<bigint>;
    getTotalUniqueVisitors(): Promise<bigint>;
    getUnionTerritory(utName: string): Promise<State | null>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    getUserRole(caller: Principal): Promise<string>;
    getVolunteerById(volunteerId: string): Promise<Volunteer | null>;
    getVolunteerDirectory(): Promise<Array<Volunteer>>;
    importDirectory(newDirectory: Directory): Promise<void>;
    isCallerAdmin(): Promise<boolean>;
    isCallerApproved(): Promise<boolean>;
    listApprovals(): Promise<Array<UserApprovalInfo>>;
    listFileReferences(): Promise<Array<FileReference>>;
    moveFeature(featureId: string, newSectionId: string): Promise<void>;
    registerFileReference(path: string, hash: string): Promise<void>;
    registerNgoNpo(organizationName: string, logoPath: string, contactPerson: string, email: string, phone: string, address: string, website: string, description: string, missionStatement: string, showContactInfo: boolean): Promise<string>;
    rejectNgoNpo(ngoNpoId: string, rejectionNote: string): Promise<void>;
    rejectVolunteer(volunteerId: string, rejectionNote: string): Promise<void>;
    rejectVolunteerProfileEdit(editId: string, rejectionNote: string): Promise<void>;
    removeAdmin(adminToRemove: Principal): Promise<void>;
    requestApproval(): Promise<void>;
    respondToFeedback(feedbackId: string, response: string): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    setApproval(user: Principal, status: ApprovalStatus): Promise<void>;
    setPrimeMinister(pm: Representative): Promise<void>;
    submitFeedback(type: string, message: string, contactInfo: string): Promise<string>;
    submitReport(photoPath: string, latitude: number, longitude: number, username: string | null, notes: string | null, issueType: string, mlaName: string | null, mlaPhotoPath: string | null, pmPhotoPath: string | null, cmPhotoPath: string | null, pmName: string | null, cmName: string | null, customAddress: string | null, state: string, mlaDesignation: string, isVolunteer: boolean, pmData: Representative | null, cmData: Representative | null, mpData: Representative | null, address: string, coordinates: string, localCivicBody: LocalCivicBody | null): Promise<string>;
    submitVolunteerProfileEdit(volunteerId: string, updates: VolunteerProfileUpdate): Promise<string>;
    trackUniqueVisitor(): Promise<void>;
    updateAdministrativeUnit(name: string, updatedUnit: AdministrativeUnit): Promise<void>;
    updateConstituency(stateName: string, constituencyName: string, updatedConstituency: Constituency): Promise<void>;
    updateDirectory(newDirectory: Directory): Promise<void>;
    updateFeature(featureId: string, featureData: RoadmapFeature): Promise<void>;
    updateFeedbackStatus(feedbackId: string, status: string): Promise<void>;
    updateLocalCivicBody(id: string, bodyType: string, bodyName: string, representativeName: string, photoPath: string | null): Promise<void>;
    updateNgoNpoPrivacy(ngoNpoId: string, showContactInfo: boolean): Promise<void>;
    updateReport(id: string, updatedReport: Report): Promise<void>;
    updateReportAddress(id: string, address: string): Promise<void>;
    updateReportAddressAndCoordinates(id: string, address: string, coordinates: string): Promise<void>;
    updateReportAdminTable(id: string, address: string, coordinates: string, customAddress: string | null): Promise<void>;
    updateReportCoordinates(id: string, coordinates: string): Promise<void>;
    updateReportFullLocation(id: string, latitude: number, longitude: number, customAddress: string | null, address: string, coordinates: string): Promise<void>;
    updateReportLocation(id: string, latitude: number, longitude: number): Promise<void>;
    updateReportMinisterPhotos(id: string, mlaPhotoPath: string | null, pmPhotoPath: string | null, cmPhotoPath: string | null): Promise<void>;
    updateReportPhoto(id: string, photoPath: string): Promise<void>;
    updateReportStatus(id: string, newStatus: string, proofPhotoPath: string, reporterName: string, completionNotes: string | null, isVolunteer: boolean): Promise<boolean>;
    updateRepresentative(stateName: string, constituencyName: string, repType: string, representative: Representative): Promise<void>;
    updateRepresentativeDetails(stateName: string, constituencyName: string, repType: string, repName: string, updatedRep: Representative): Promise<void>;
    updateState(stateName: string, updatedState: State): Promise<void>;
    updateUnionTerritory(utName: string, updatedUT: State): Promise<void>;
    updateVolunteerPrivacy(volunteerId: string, showFullMobile: boolean): Promise<void>;
    uploadLogo(logoData: string): Promise<void>;
}
