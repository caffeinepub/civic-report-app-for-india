import BaseToCore "BaseToCore";
import OrderedMap "mo:base/OrderedMap";
import ListBase "mo:base/List";
import Map "mo:core/Map";
import Text "mo:core/Text";
import Principal "mo:core/Principal";
import UserApproval "mo:caffeineai-user-approval/approval";

module {
  // Duplicate types from main.mo that appear in actor stable state

  type LocalCivicBody = {
    bodyType : Text;
    bodyName : Text;
    representativeName : Text;
    photoPath : ?Text;
  };

  type Representative = {
    name : Text;
    photoPath : Text;
    email : Text;
    twitterHandle : Text;
    remarks : Text;
    lastUpdated : Int;
    politicalParty : ?Text;
  };

  type Report = {
    id : Text;
    photoPath : Text;
    location : {
      latitude : Float;
      longitude : Float;
    };
    timestamp : Int;
    status : Text;
    username : ?Text;
    notes : ?Text;
    issueType : Text;
    mlaName : ?Text;
    mlaPhotoPath : ?Text;
    pmPhotoPath : ?Text;
    cmPhotoPath : ?Text;
    pmName : ?Text;
    cmName : ?Text;
    proofPhotoPath : ?Text;
    reporterName : ?Text;
    completionNotes : ?Text;
    customAddress : ?Text;
    state : Text;
    mlaDesignation : Text;
    submittedByVolunteer : Bool;
    resolvedByVolunteer : Bool;
    pmData : ?Representative;
    cmData : ?Representative;
    mpData : ?Representative;
    address : Text;
    coordinates : Text;
    localCivicBody : ?LocalCivicBody;
  };

  type Volunteer = {
    id : Text;
    name : Text;
    photoPath : Text;
    contactInfo : Text;
    address : Text;
    applicationDate : Int;
    approved : Bool;
    principal : Principal;
    rejectionNote : ?Text;
    approvalTimestamp : ?Int;
    impactScore : Int;
    showFullMobile : Bool;
  };

  type VolunteerProfileUpdate = {
    name : Text;
    photoPath : Text;
    contactInfo : Text;
    address : Text;
    showFullMobile : Bool;
  };

  type PendingProfileEdit = {
    id : Text;
    volunteerId : Text;
    volunteerPrincipal : Principal;
    updates : VolunteerProfileUpdate;
    submittedAt : Int;
    status : Text;
    rejectionNote : ?Text;
  };

  type NgoNpo = {
    id : Text;
    organizationName : Text;
    logoPath : Text;
    contactPerson : Text;
    email : Text;
    phone : Text;
    address : Text;
    website : Text;
    description : Text;
    missionStatement : Text;
    registrationDate : Int;
    approved : Bool;
    principal : Principal;
    rejectionNote : ?Text;
    approvalTimestamp : ?Int;
    impactScore : Int;
    showContactInfo : Bool;
  };

  type Feedback = {
    id : Text;
    type_ : Text;
    message : Text;
    contactInfo : Text;
    timestamp : Int;
    status : Text;
    response : ?Text;
    admin : ?Principal;
  };

  type UserProfile = {
    name : Text;
  };

  type FileReference = { hash : Text; path : Text };

  type OldRegistry = {
    var authorizedPrincipals : [Principal];
    var blobsToRemove : OrderedMap.Map<Text, Bool>;
    var references : OrderedMap.Map<Text, FileReference>;
  };

  type OldApprovalState = {
    var approvalStatus : OrderedMap.Map<Principal, UserApproval.ApprovalStatus>;
  };

  type OldActor = {
    var reports : OrderedMap.Map<Text, Report>;
    var volunteers : OrderedMap.Map<Text, Volunteer>;
    var ngoNpos : OrderedMap.Map<Text, NgoNpo>;
    var feedbacks : OrderedMap.Map<Text, Feedback>;
    var uniqueVisitors : OrderedMap.Map<Principal, Bool>;
    var pendingProfileEdits : OrderedMap.Map<Text, PendingProfileEdit>;
    var userProfiles : OrderedMap.Map<Principal, UserProfile>;
    accessControlState : BaseToCore.OldAccessControlState;
    approvalState : OldApprovalState;
    registry : OldRegistry;
  };

  type NewActor = {
    var reports : Map.Map<Text, Report>;
    var volunteers : Map.Map<Text, Volunteer>;
    var ngoNpos : Map.Map<Text, NgoNpo>;
    var feedbacks : Map.Map<Text, Feedback>;
    var uniqueVisitors : Map.Map<Principal, Bool>;
    var pendingProfileEdits : Map.Map<Text, PendingProfileEdit>;
    var userProfiles : Map.Map<Principal, UserProfile>;
    accessControlState : BaseToCore.NewAccessControlState;
    approvalState : UserApproval.UserApprovalState;
  };

  public func run(old : OldActor) : NewActor {
    {
      var reports = BaseToCore.migrateOrderedMap<Text, Report>(old.reports, );
      var volunteers = BaseToCore.migrateOrderedMap<Text, Volunteer>(old.volunteers, );
      var ngoNpos = BaseToCore.migrateOrderedMap<Text, NgoNpo>(old.ngoNpos, );
      var feedbacks = BaseToCore.migrateOrderedMap<Text, Feedback>(old.feedbacks, );
      var uniqueVisitors = BaseToCore.migrateOrderedMap<Principal, Bool>(old.uniqueVisitors, );
      var pendingProfileEdits = BaseToCore.migrateOrderedMap<Text, PendingProfileEdit>(old.pendingProfileEdits, );
      var userProfiles = BaseToCore.migrateOrderedMap<Principal, UserProfile>(old.userProfiles, );
      accessControlState = BaseToCore.migrateAccessControlState(old.accessControlState);
      approvalState = {
        var approvalStatus = BaseToCore.migrateOrderedMap<Principal, UserApproval.ApprovalStatus>(old.approvalState.approvalStatus, );
      };
    };
  };
};
