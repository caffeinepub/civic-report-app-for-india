export const idlFactory = ({ IDL }) => {
  const Representative = IDL.Record({
    'politicalParty' : IDL.Opt(IDL.Text),
    'photoPath' : IDL.Text,
    'name' : IDL.Text,
    'lastUpdated' : IDL.Int,
    'email' : IDL.Text,
    'twitterHandle' : IDL.Text,
    'remarks' : IDL.Text,
  });
  const UserRole = IDL.Variant({
    'admin' : IDL.Null,
    'user' : IDL.Null,
    'guest' : IDL.Null,
  });
  const RoadmapFeature = IDL.Record({
    'id' : IDL.Text,
    'title' : IDL.Text,
    'icon' : IDL.Text,
    'description' : IDL.Text,
    'progress' : IDL.Nat,
    'sectionId' : IDL.Text,
    'timestamp' : IDL.Int,
  });
  const Constituency = IDL.Record({
    'mp' : IDL.Opt(Representative),
    'mlas' : IDL.Vec(Representative),
    'name' : IDL.Text,
  });
  const State = IDL.Record({
    'cm' : IDL.Opt(Representative),
    'constituencies' : IDL.Vec(Constituency),
    'name' : IDL.Text,
    'isUnionTerritory' : IDL.Bool,
  });
  const AdministrativeUnit = IDL.Record({
    'unitType' : IDL.Text,
    'parentState' : IDL.Opt(IDL.Text),
    'name' : IDL.Text,
    'parentConstituency' : IDL.Opt(IDL.Text),
  });
  const Directory = IDL.Record({
    'states' : IDL.Vec(State),
    'unionTerritories' : IDL.Vec(State),
    'administrativeUnits' : IDL.Vec(AdministrativeUnit),
    'primeMinister' : IDL.Opt(Representative),
  });
  const NgoNpo = IDL.Record({
    'id' : IDL.Text,
    'organizationName' : IDL.Text,
    'missionStatement' : IDL.Text,
    'principal' : IDL.Principal,
    'impactScore' : IDL.Int,
    'contactPerson' : IDL.Text,
    'description' : IDL.Text,
    'approvalTimestamp' : IDL.Opt(IDL.Int),
    'email' : IDL.Text,
    'website' : IDL.Text,
    'logoPath' : IDL.Text,
    'approved' : IDL.Bool,
    'address' : IDL.Text,
    'rejectionNote' : IDL.Opt(IDL.Text),
    'phone' : IDL.Text,
    'registrationDate' : IDL.Int,
    'showContactInfo' : IDL.Bool,
  });
  const LocalCivicBody = IDL.Record({
    'photoPath' : IDL.Opt(IDL.Text),
    'representativeName' : IDL.Text,
    'bodyName' : IDL.Text,
    'bodyType' : IDL.Text,
  });
  const Report = IDL.Record({
    'id' : IDL.Text,
    'status' : IDL.Text,
    'issueType' : IDL.Text,
    'photoPath' : IDL.Text,
    'username' : IDL.Opt(IDL.Text),
    'mlaMpName' : IDL.Opt(IDL.Text),
    'resolvedByVolunteer' : IDL.Bool,
    'reporterName' : IDL.Opt(IDL.Text),
    'customAddress' : IDL.Opt(IDL.Text),
    'mlaMpDesignation' : IDL.Text,
    'cmPhotoPath' : IDL.Opt(IDL.Text),
    'submittedByVolunteer' : IDL.Bool,
    'state' : IDL.Text,
    'cmData' : IDL.Opt(Representative),
    'cmName' : IDL.Opt(IDL.Text),
    'address' : IDL.Text,
    'notes' : IDL.Opt(IDL.Text),
    'timestamp' : IDL.Int,
    'pmData' : IDL.Opt(Representative),
    'localCivicBody' : IDL.Opt(LocalCivicBody),
    'pmName' : IDL.Opt(IDL.Text),
    'mlaMpPhotoPath' : IDL.Opt(IDL.Text),
    'location' : IDL.Record({
      'latitude' : IDL.Float64,
      'longitude' : IDL.Float64,
    }),
    'proofPhotoPath' : IDL.Opt(IDL.Text),
    'pmPhotoPath' : IDL.Opt(IDL.Text),
    'coordinates' : IDL.Text,
    'completionNotes' : IDL.Opt(IDL.Text),
  });
  const Volunteer = IDL.Record({
    'id' : IDL.Text,
    'photoPath' : IDL.Text,
    'principal' : IDL.Principal,
    'contactInfo' : IDL.Text,
    'impactScore' : IDL.Int,
    'name' : IDL.Text,
    'approvalTimestamp' : IDL.Opt(IDL.Int),
    'approved' : IDL.Bool,
    'address' : IDL.Text,
    'rejectionNote' : IDL.Opt(IDL.Text),
    'showFullMobile' : IDL.Bool,
    'applicationDate' : IDL.Int,
  });
  const UserProfile = IDL.Record({ 'name' : IDL.Text });
  const FileReference = IDL.Record({ 'hash' : IDL.Text, 'path' : IDL.Text });
  const LogoHistory = IDL.Record({
    'admin' : IDL.Principal,
    'logoData' : IDL.Text,
    'timestamp' : IDL.Int,
  });
  const ApprovalStatus = IDL.Variant({
    'pending' : IDL.Null,
    'approved' : IDL.Null,
    'rejected' : IDL.Null,
  });
  const UserApprovalInfo = IDL.Record({
    'status' : ApprovalStatus,
    'principal' : IDL.Principal,
  });
  return IDL.Service({
    'addAdmin' : IDL.Func([IDL.Principal], [], []),
    'addAdministrativeUnit' : IDL.Func(
        [IDL.Text, IDL.Text, IDL.Opt(IDL.Text), IDL.Opt(IDL.Text)],
        [],
        [],
      ),
    'addConstituency' : IDL.Func([IDL.Text, IDL.Text], [], []),
    'addMlaToConstituency' : IDL.Func(
        [IDL.Text, IDL.Text, Representative],
        [],
        [],
      ),
    'addMpToConstituency' : IDL.Func(
        [IDL.Text, IDL.Text, Representative],
        [],
        [],
      ),
    'addState' : IDL.Func(
        [IDL.Text, IDL.Opt(Representative), IDL.Bool],
        [],
        [],
      ),
    'addUnionTerritory' : IDL.Func([IDL.Text, IDL.Opt(Representative)], [], []),
    'applyVolunteer' : IDL.Func(
        [IDL.Text, IDL.Text, IDL.Text, IDL.Text, IDL.Bool],
        [IDL.Text],
        [],
      ),
    'approveNgoNpo' : IDL.Func([IDL.Text], [], []),
    'approveVolunteer' : IDL.Func([IDL.Text], [], []),
    'assignCallerUserRole' : IDL.Func([IDL.Principal, UserRole], [], []),
    'createFeature' : IDL.Func([IDL.Text, RoadmapFeature], [], []),
    'deleteConstituency' : IDL.Func([IDL.Text, IDL.Text], [], []),
    'deleteFeature' : IDL.Func([IDL.Text], [], []),
    'deleteReport' : IDL.Func([IDL.Text], [], []),
    'deleteRepresentative' : IDL.Func([IDL.Text, IDL.Text, IDL.Text], [], []),
    'dropFileReference' : IDL.Func([IDL.Text], [], []),
    'exportDirectory' : IDL.Func([], [Directory], []),
    'getAdminDirectory' : IDL.Func([], [Directory], ['query']),
    'getAdministrativeUnits' : IDL.Func(
        [],
        [IDL.Vec(AdministrativeUnit)],
        ['query'],
      ),
    'getAdmins' : IDL.Func([], [IDL.Vec(IDL.Principal)], ['query']),
    'getAllNgoNpos' : IDL.Func([], [IDL.Vec(NgoNpo)], ['query']),
    'getAllReports' : IDL.Func([], [IDL.Vec(Report)], ['query']),
    'getAllRepresentatives' : IDL.Func(
        [],
        [IDL.Vec(Representative)],
        ['query'],
      ),
    'getAllVolunteers' : IDL.Func([], [IDL.Vec(Volunteer)], ['query']),
    'getCallerUserProfile' : IDL.Func([], [IDL.Opt(UserProfile)], ['query']),
    'getCallerUserRole' : IDL.Func([], [UserRole], ['query']),
    'getConstituency' : IDL.Func(
        [IDL.Text, IDL.Text],
        [IDL.Opt(Constituency)],
        ['query'],
      ),
    'getCurrentLogo' : IDL.Func([], [IDL.Text], ['query']),
    'getDirectory' : IDL.Func([], [Directory], ['query']),
    'getDirectoryWithPhotos' : IDL.Func([], [Directory], ['query']),
    'getFileReference' : IDL.Func([IDL.Text], [FileReference], ['query']),
    'getLogoHistory' : IDL.Func([], [IDL.Vec(LogoHistory)], ['query']),
    'getMyNgoNpoProfile' : IDL.Func([], [IDL.Opt(NgoNpo)], ['query']),
    'getMyVolunteerProfile' : IDL.Func([], [IDL.Opt(Volunteer)], ['query']),
    'getNgoNpoById' : IDL.Func([IDL.Text], [IDL.Opt(NgoNpo)], ['query']),
    'getNgoNpoDirectory' : IDL.Func([], [IDL.Vec(NgoNpo)], ['query']),
    'getPaginatedReports' : IDL.Func(
        [IDL.Nat, IDL.Nat],
        [IDL.Vec(Report)],
        ['query'],
      ),
    'getRecentReports' : IDL.Func([IDL.Nat], [IDL.Vec(Report)], ['query']),
    'getReport' : IDL.Func([IDL.Text], [IDL.Opt(Report)], ['query']),
    'getReportsByState' : IDL.Func([IDL.Text], [IDL.Vec(Report)], ['query']),
    'getReportsForAdminTable' : IDL.Func(
        [],
        [IDL.Vec(IDL.Tuple(Report, IDL.Text, IDL.Text, IDL.Text))],
        ['query'],
      ),
    'getReportsWithAddressAndCoordinates' : IDL.Func(
        [],
        [IDL.Vec(IDL.Tuple(Report, IDL.Text, IDL.Text))],
        ['query'],
      ),
    'getReportsWithAddresses' : IDL.Func(
        [],
        [IDL.Vec(IDL.Tuple(Report, IDL.Text))],
        ['query'],
      ),
    'getReportsWithCompleteLocationData' : IDL.Func(
        [],
        [
          IDL.Vec(
            IDL.Tuple(
              Report,
              IDL.Record({
                'latitude' : IDL.Float64,
                'longitude' : IDL.Float64,
              }),
              IDL.Opt(IDL.Text),
              IDL.Text,
              IDL.Text,
            )
          ),
        ],
        ['query'],
      ),
    'getReportsWithCustomAddresses' : IDL.Func(
        [],
        [IDL.Vec(IDL.Tuple(Report, IDL.Opt(IDL.Text), IDL.Text))],
        ['query'],
      ),
    'getReportsWithFullLocationData' : IDL.Func(
        [],
        [
          IDL.Vec(
            IDL.Tuple(
              Report,
              IDL.Record({
                'latitude' : IDL.Float64,
                'longitude' : IDL.Float64,
              }),
              IDL.Opt(IDL.Text),
              IDL.Text,
              IDL.Text,
            )
          ),
        ],
        ['query'],
      ),
    'getReportsWithLocations' : IDL.Func(
        [],
        [
          IDL.Vec(
            IDL.Tuple(
              Report,
              IDL.Record({
                'latitude' : IDL.Float64,
                'longitude' : IDL.Float64,
              }),
            )
          ),
        ],
        ['query'],
      ),
    'getReportsWithLocationsAndAddresses' : IDL.Func(
        [],
        [
          IDL.Vec(
            IDL.Tuple(
              Report,
              IDL.Record({
                'latitude' : IDL.Float64,
                'longitude' : IDL.Float64,
              }),
              IDL.Text,
              IDL.Text,
            )
          ),
        ],
        ['query'],
      ),
    'getReportsWithLocationsAndAddressesOptimized' : IDL.Func(
        [],
        [
          IDL.Vec(
            IDL.Tuple(
              Report,
              IDL.Record({
                'latitude' : IDL.Float64,
                'longitude' : IDL.Float64,
              }),
              IDL.Text,
              IDL.Text,
            )
          ),
        ],
        ['query'],
      ),
    'getReportsWithMinisterPhotos' : IDL.Func(
        [],
        [
          IDL.Vec(
            IDL.Tuple(
              Report,
              IDL.Opt(IDL.Text),
              IDL.Opt(IDL.Text),
              IDL.Opt(IDL.Text),
            )
          ),
        ],
        ['query'],
      ),
    'getReportsWithMinisterPhotosOptimized' : IDL.Func(
        [],
        [
          IDL.Vec(
            IDL.Tuple(
              Report,
              IDL.Opt(IDL.Text),
              IDL.Opt(IDL.Text),
              IDL.Opt(IDL.Text),
            )
          ),
        ],
        ['query'],
      ),
    'getReportsWithPhotos' : IDL.Func(
        [],
        [IDL.Vec(IDL.Tuple(Report, IDL.Text))],
        ['query'],
      ),
    'getReportsWithPhotosOptimized' : IDL.Func(
        [],
        [IDL.Vec(IDL.Tuple(Report, IDL.Text))],
        ['query'],
      ),
    'getRoadmapFeatures' : IDL.Func([], [IDL.Vec(RoadmapFeature)], ['query']),
    'getState' : IDL.Func([IDL.Text], [IDL.Opt(State)], ['query']),
    'getTotalReportCount' : IDL.Func([], [IDL.Nat], ['query']),
    'getUnionTerritory' : IDL.Func([IDL.Text], [IDL.Opt(State)], ['query']),
    'getUserProfile' : IDL.Func(
        [IDL.Principal],
        [IDL.Opt(UserProfile)],
        ['query'],
      ),
    'getVolunteerById' : IDL.Func([IDL.Text], [IDL.Opt(Volunteer)], ['query']),
    'getVolunteerDirectory' : IDL.Func([], [IDL.Vec(Volunteer)], ['query']),
    'importDirectory' : IDL.Func([Directory], [], []),
    'initializeAccessControl' : IDL.Func([], [], []),
    'isCallerAdmin' : IDL.Func([], [IDL.Bool], ['query']),
    'isCallerApproved' : IDL.Func([], [IDL.Bool], ['query']),
    'listApprovals' : IDL.Func([], [IDL.Vec(UserApprovalInfo)], ['query']),
    'listFileReferences' : IDL.Func([], [IDL.Vec(FileReference)], ['query']),
    'moveFeature' : IDL.Func([IDL.Text, IDL.Text], [], []),
    'registerFileReference' : IDL.Func([IDL.Text, IDL.Text], [], []),
    'registerNgoNpo' : IDL.Func(
        [
          IDL.Text,
          IDL.Text,
          IDL.Text,
          IDL.Text,
          IDL.Text,
          IDL.Text,
          IDL.Text,
          IDL.Text,
          IDL.Text,
          IDL.Bool,
        ],
        [IDL.Text],
        [],
      ),
    'rejectNgoNpo' : IDL.Func([IDL.Text, IDL.Text], [], []),
    'rejectVolunteer' : IDL.Func([IDL.Text, IDL.Text], [], []),
    'removeAdmin' : IDL.Func([IDL.Principal], [], []),
    'requestApproval' : IDL.Func([], [], []),
    'saveCallerUserProfile' : IDL.Func([UserProfile], [], []),
    'setApproval' : IDL.Func([IDL.Principal, ApprovalStatus], [], []),
    'setPrimeMinister' : IDL.Func([Representative], [], []),
    'submitReport' : IDL.Func(
        [
          IDL.Text,
          IDL.Float64,
          IDL.Float64,
          IDL.Opt(IDL.Text),
          IDL.Opt(IDL.Text),
          IDL.Text,
          IDL.Opt(IDL.Text),
          IDL.Opt(IDL.Text),
          IDL.Opt(IDL.Text),
          IDL.Opt(IDL.Text),
          IDL.Opt(IDL.Text),
          IDL.Opt(IDL.Text),
          IDL.Opt(IDL.Text),
          IDL.Text,
          IDL.Text,
          IDL.Bool,
          IDL.Opt(Representative),
          IDL.Opt(Representative),
          IDL.Text,
          IDL.Text,
          IDL.Opt(LocalCivicBody),
        ],
        [IDL.Text],
        [],
      ),
    'updateAdministrativeUnit' : IDL.Func(
        [IDL.Text, AdministrativeUnit],
        [],
        [],
      ),
    'updateConstituency' : IDL.Func([IDL.Text, IDL.Text, Constituency], [], []),
    'updateDirectory' : IDL.Func([Directory], [], []),
    'updateFeature' : IDL.Func([IDL.Text, RoadmapFeature], [], []),
    'updateNgoNpoPrivacy' : IDL.Func([IDL.Text, IDL.Bool], [], []),
    'updateReport' : IDL.Func([IDL.Text, Report], [], []),
    'updateReportAddress' : IDL.Func([IDL.Text, IDL.Text], [], []),
    'updateReportAddressAndCoordinates' : IDL.Func(
        [IDL.Text, IDL.Text, IDL.Text],
        [],
        [],
      ),
    'updateReportAdminTable' : IDL.Func(
        [IDL.Text, IDL.Text, IDL.Text, IDL.Opt(IDL.Text)],
        [],
        [],
      ),
    'updateReportCoordinates' : IDL.Func([IDL.Text, IDL.Text], [], []),
    'updateReportFullLocation' : IDL.Func(
        [
          IDL.Text,
          IDL.Float64,
          IDL.Float64,
          IDL.Opt(IDL.Text),
          IDL.Text,
          IDL.Text,
        ],
        [],
        [],
      ),
    'updateReportLocation' : IDL.Func(
        [IDL.Text, IDL.Float64, IDL.Float64],
        [],
        [],
      ),
    'updateReportMinisterPhotos' : IDL.Func(
        [IDL.Text, IDL.Opt(IDL.Text), IDL.Opt(IDL.Text), IDL.Opt(IDL.Text)],
        [],
        [],
      ),
    'updateReportPhoto' : IDL.Func([IDL.Text, IDL.Text], [], []),
    'updateReportStatus' : IDL.Func(
        [IDL.Text, IDL.Text, IDL.Text, IDL.Text, IDL.Opt(IDL.Text), IDL.Bool],
        [IDL.Bool],
        [],
      ),
    'updateRepresentative' : IDL.Func(
        [IDL.Text, IDL.Text, IDL.Text, Representative],
        [],
        [],
      ),
    'updateRepresentativeDetails' : IDL.Func(
        [IDL.Text, IDL.Text, IDL.Text, IDL.Text, Representative],
        [],
        [],
      ),
    'updateState' : IDL.Func([IDL.Text, State], [], []),
    'updateUnionTerritory' : IDL.Func([IDL.Text, State], [], []),
    'updateVolunteerPrivacy' : IDL.Func([IDL.Text, IDL.Bool], [], []),
    'uploadLogo' : IDL.Func([IDL.Text], [], []),
  });
};
export const init = ({ IDL }) => { return []; };
