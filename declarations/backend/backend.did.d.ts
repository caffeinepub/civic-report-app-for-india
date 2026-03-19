import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';
import type { IDL } from '@dfinity/candid';

export interface AdministrativeUnit {
  'unitType' : string,
  'parentState' : [] | [string],
  'name' : string,
  'parentConstituency' : [] | [string],
}
export type ApprovalStatus = { 'pending' : null } |
  { 'approved' : null } |
  { 'rejected' : null };
export interface Constituency {
  'mp' : [] | [Representative],
  'mlas' : Array<Representative>,
  'name' : string,
}
export interface Directory {
  'states' : Array<State>,
  'unionTerritories' : Array<State>,
  'administrativeUnits' : Array<AdministrativeUnit>,
  'primeMinister' : [] | [Representative],
}
export interface FileReference { 'hash' : string, 'path' : string }
export interface LocalCivicBody {
  'photoPath' : [] | [string],
  'representativeName' : string,
  'bodyName' : string,
  'bodyType' : string,
}
export interface LogoHistory {
  'admin' : Principal,
  'logoData' : string,
  'timestamp' : bigint,
}
export interface NgoNpo {
  'id' : string,
  'organizationName' : string,
  'missionStatement' : string,
  'principal' : Principal,
  'impactScore' : bigint,
  'contactPerson' : string,
  'description' : string,
  'approvalTimestamp' : [] | [bigint],
  'email' : string,
  'website' : string,
  'logoPath' : string,
  'approved' : boolean,
  'address' : string,
  'rejectionNote' : [] | [string],
  'phone' : string,
  'registrationDate' : bigint,
  'showContactInfo' : boolean,
}
export interface Report {
  'id' : string,
  'status' : string,
  'issueType' : string,
  'photoPath' : string,
  'username' : [] | [string],
  'mlaMpName' : [] | [string],
  'resolvedByVolunteer' : boolean,
  'reporterName' : [] | [string],
  'customAddress' : [] | [string],
  'mlaMpDesignation' : string,
  'cmPhotoPath' : [] | [string],
  'submittedByVolunteer' : boolean,
  'state' : string,
  'cmData' : [] | [Representative],
  'cmName' : [] | [string],
  'address' : string,
  'notes' : [] | [string],
  'timestamp' : bigint,
  'pmData' : [] | [Representative],
  'localCivicBody' : [] | [LocalCivicBody],
  'pmName' : [] | [string],
  'mlaMpPhotoPath' : [] | [string],
  'location' : { 'latitude' : number, 'longitude' : number },
  'proofPhotoPath' : [] | [string],
  'pmPhotoPath' : [] | [string],
  'coordinates' : string,
  'completionNotes' : [] | [string],
}
export interface Representative {
  'politicalParty' : [] | [string],
  'photoPath' : string,
  'name' : string,
  'lastUpdated' : bigint,
  'email' : string,
  'twitterHandle' : string,
  'remarks' : string,
}
export interface RoadmapFeature {
  'id' : string,
  'title' : string,
  'icon' : string,
  'description' : string,
  'progress' : bigint,
  'sectionId' : string,
  'timestamp' : bigint,
}
export interface State {
  'cm' : [] | [Representative],
  'constituencies' : Array<Constituency>,
  'name' : string,
  'isUnionTerritory' : boolean,
}
export interface UserApprovalInfo {
  'status' : ApprovalStatus,
  'principal' : Principal,
}
export interface UserProfile { 'name' : string }
export type UserRole = { 'admin' : null } |
  { 'user' : null } |
  { 'guest' : null };
export interface Volunteer {
  'id' : string,
  'photoPath' : string,
  'principal' : Principal,
  'contactInfo' : string,
  'impactScore' : bigint,
  'name' : string,
  'approvalTimestamp' : [] | [bigint],
  'approved' : boolean,
  'address' : string,
  'rejectionNote' : [] | [string],
  'showFullMobile' : boolean,
  'applicationDate' : bigint,
}
export interface _SERVICE {
  'addAdmin' : ActorMethod<[Principal], undefined>,
  'addAdministrativeUnit' : ActorMethod<
    [string, string, [] | [string], [] | [string]],
    undefined
  >,
  'addConstituency' : ActorMethod<[string, string], undefined>,
  'addMlaToConstituency' : ActorMethod<
    [string, string, Representative],
    undefined
  >,
  'addMpToConstituency' : ActorMethod<
    [string, string, Representative],
    undefined
  >,
  'addState' : ActorMethod<[string, [] | [Representative], boolean], undefined>,
  'addUnionTerritory' : ActorMethod<[string, [] | [Representative]], undefined>,
  'applyVolunteer' : ActorMethod<
    [string, string, string, string, boolean],
    string
  >,
  'approveNgoNpo' : ActorMethod<[string], undefined>,
  'approveVolunteer' : ActorMethod<[string], undefined>,
  'assignCallerUserRole' : ActorMethod<[Principal, UserRole], undefined>,
  'createFeature' : ActorMethod<[string, RoadmapFeature], undefined>,
  'deleteConstituency' : ActorMethod<[string, string], undefined>,
  'deleteFeature' : ActorMethod<[string], undefined>,
  'deleteReport' : ActorMethod<[string], undefined>,
  'deleteRepresentative' : ActorMethod<[string, string, string], undefined>,
  'dropFileReference' : ActorMethod<[string], undefined>,
  'exportDirectory' : ActorMethod<[], Directory>,
  'getAdminDirectory' : ActorMethod<[], Directory>,
  'getAdministrativeUnits' : ActorMethod<[], Array<AdministrativeUnit>>,
  'getAdmins' : ActorMethod<[], Array<Principal>>,
  'getAllNgoNpos' : ActorMethod<[], Array<NgoNpo>>,
  'getAllReports' : ActorMethod<[], Array<Report>>,
  'getAllRepresentatives' : ActorMethod<[], Array<Representative>>,
  'getAllVolunteers' : ActorMethod<[], Array<Volunteer>>,
  'getCallerUserProfile' : ActorMethod<[], [] | [UserProfile]>,
  'getCallerUserRole' : ActorMethod<[], UserRole>,
  'getConstituency' : ActorMethod<[string, string], [] | [Constituency]>,
  'getCurrentLogo' : ActorMethod<[], string>,
  'getDirectory' : ActorMethod<[], Directory>,
  'getDirectoryWithPhotos' : ActorMethod<[], Directory>,
  'getFileReference' : ActorMethod<[string], FileReference>,
  'getLogoHistory' : ActorMethod<[], Array<LogoHistory>>,
  'getMyNgoNpoProfile' : ActorMethod<[], [] | [NgoNpo]>,
  'getMyVolunteerProfile' : ActorMethod<[], [] | [Volunteer]>,
  'getNgoNpoById' : ActorMethod<[string], [] | [NgoNpo]>,
  'getNgoNpoDirectory' : ActorMethod<[], Array<NgoNpo>>,
  'getPaginatedReports' : ActorMethod<[bigint, bigint], Array<Report>>,
  'getRecentReports' : ActorMethod<[bigint], Array<Report>>,
  'getReport' : ActorMethod<[string], [] | [Report]>,
  'getReportsByState' : ActorMethod<[string], Array<Report>>,
  'getReportsForAdminTable' : ActorMethod<
    [],
    Array<[Report, string, string, string]>
  >,
  'getReportsWithAddressAndCoordinates' : ActorMethod<
    [],
    Array<[Report, string, string]>
  >,
  'getReportsWithAddresses' : ActorMethod<[], Array<[Report, string]>>,
  'getReportsWithCompleteLocationData' : ActorMethod<
    [],
    Array<
      [
        Report,
        { 'latitude' : number, 'longitude' : number },
        [] | [string],
        string,
        string,
      ]
    >
  >,
  'getReportsWithCustomAddresses' : ActorMethod<
    [],
    Array<[Report, [] | [string], string]>
  >,
  'getReportsWithFullLocationData' : ActorMethod<
    [],
    Array<
      [
        Report,
        { 'latitude' : number, 'longitude' : number },
        [] | [string],
        string,
        string,
      ]
    >
  >,
  'getReportsWithLocations' : ActorMethod<
    [],
    Array<[Report, { 'latitude' : number, 'longitude' : number }]>
  >,
  'getReportsWithLocationsAndAddresses' : ActorMethod<
    [],
    Array<
      [Report, { 'latitude' : number, 'longitude' : number }, string, string]
    >
  >,
  'getReportsWithLocationsAndAddressesOptimized' : ActorMethod<
    [],
    Array<
      [Report, { 'latitude' : number, 'longitude' : number }, string, string]
    >
  >,
  'getReportsWithMinisterPhotos' : ActorMethod<
    [],
    Array<[Report, [] | [string], [] | [string], [] | [string]]>
  >,
  'getReportsWithMinisterPhotosOptimized' : ActorMethod<
    [],
    Array<[Report, [] | [string], [] | [string], [] | [string]]>
  >,
  'getReportsWithPhotos' : ActorMethod<[], Array<[Report, string]>>,
  'getReportsWithPhotosOptimized' : ActorMethod<[], Array<[Report, string]>>,
  'getRoadmapFeatures' : ActorMethod<[], Array<RoadmapFeature>>,
  'getState' : ActorMethod<[string], [] | [State]>,
  'getTotalReportCount' : ActorMethod<[], bigint>,
  'getUnionTerritory' : ActorMethod<[string], [] | [State]>,
  'getUserProfile' : ActorMethod<[Principal], [] | [UserProfile]>,
  'getVolunteerById' : ActorMethod<[string], [] | [Volunteer]>,
  'getVolunteerDirectory' : ActorMethod<[], Array<Volunteer>>,
  'importDirectory' : ActorMethod<[Directory], undefined>,
  'initializeAccessControl' : ActorMethod<[], undefined>,
  'isCallerAdmin' : ActorMethod<[], boolean>,
  'isCallerApproved' : ActorMethod<[], boolean>,
  'listApprovals' : ActorMethod<[], Array<UserApprovalInfo>>,
  'listFileReferences' : ActorMethod<[], Array<FileReference>>,
  'moveFeature' : ActorMethod<[string, string], undefined>,
  'registerFileReference' : ActorMethod<[string, string], undefined>,
  'registerNgoNpo' : ActorMethod<
    [
      string,
      string,
      string,
      string,
      string,
      string,
      string,
      string,
      string,
      boolean,
    ],
    string
  >,
  'rejectNgoNpo' : ActorMethod<[string, string], undefined>,
  'rejectVolunteer' : ActorMethod<[string, string], undefined>,
  'removeAdmin' : ActorMethod<[Principal], undefined>,
  'requestApproval' : ActorMethod<[], undefined>,
  'saveCallerUserProfile' : ActorMethod<[UserProfile], undefined>,
  'setApproval' : ActorMethod<[Principal, ApprovalStatus], undefined>,
  'setPrimeMinister' : ActorMethod<[Representative], undefined>,
  'submitReport' : ActorMethod<
    [
      string,
      number,
      number,
      [] | [string],
      [] | [string],
      string,
      [] | [string],
      [] | [string],
      [] | [string],
      [] | [string],
      [] | [string],
      [] | [string],
      [] | [string],
      string,
      string,
      boolean,
      [] | [Representative],
      [] | [Representative],
      string,
      string,
      [] | [LocalCivicBody],
    ],
    string
  >,
  'updateAdministrativeUnit' : ActorMethod<
    [string, AdministrativeUnit],
    undefined
  >,
  'updateConstituency' : ActorMethod<[string, string, Constituency], undefined>,
  'updateDirectory' : ActorMethod<[Directory], undefined>,
  'updateFeature' : ActorMethod<[string, RoadmapFeature], undefined>,
  'updateNgoNpoPrivacy' : ActorMethod<[string, boolean], undefined>,
  'updateReport' : ActorMethod<[string, Report], undefined>,
  'updateReportAddress' : ActorMethod<[string, string], undefined>,
  'updateReportAddressAndCoordinates' : ActorMethod<
    [string, string, string],
    undefined
  >,
  'updateReportAdminTable' : ActorMethod<
    [string, string, string, [] | [string]],
    undefined
  >,
  'updateReportCoordinates' : ActorMethod<[string, string], undefined>,
  'updateReportFullLocation' : ActorMethod<
    [string, number, number, [] | [string], string, string],
    undefined
  >,
  'updateReportLocation' : ActorMethod<[string, number, number], undefined>,
  'updateReportMinisterPhotos' : ActorMethod<
    [string, [] | [string], [] | [string], [] | [string]],
    undefined
  >,
  'updateReportPhoto' : ActorMethod<[string, string], undefined>,
  'updateReportStatus' : ActorMethod<
    [string, string, string, string, [] | [string], boolean],
    boolean
  >,
  'updateRepresentative' : ActorMethod<
    [string, string, string, Representative],
    undefined
  >,
  'updateRepresentativeDetails' : ActorMethod<
    [string, string, string, string, Representative],
    undefined
  >,
  'updateState' : ActorMethod<[string, State], undefined>,
  'updateUnionTerritory' : ActorMethod<[string, State], undefined>,
  'updateVolunteerPrivacy' : ActorMethod<[string, boolean], undefined>,
  'uploadLogo' : ActorMethod<[string], undefined>,
}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
