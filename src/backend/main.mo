import Map "mo:core/Map";
import Text "mo:core/Text";
import Time "mo:core/Time";
import List "mo:core/List";
import Int "mo:core/Int";
import Principal "mo:core/Principal";
import Array "mo:core/Array";
import Debug "mo:core/Debug";
import Runtime "mo:core/Runtime";
import AccessControl "mo:caffeineai-authorization/access-control";
import MixinAuthorization "mo:caffeineai-authorization/MixinAuthorization";
import UserApproval "mo:caffeineai-user-approval/approval";
import MixinObjectStorage "mo:caffeineai-object-storage/Mixin";
import Nat "mo:core/Nat";



persistent actor {
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

    type LocalCivicBody = {
        bodyType : Text;
        bodyName : Text;
        representativeName : Text;
        photoPath : ?Text;
    };

    type LogoHistory = {
        logoData : Text;
        timestamp : Int;
        admin : Principal;
    };

    type LogoState = {
        currentLogo : Text;
        history : [LogoHistory];
    };

    type RoadmapFeature = {
        id : Text;
        icon : Text;
        title : Text;
        description : Text;
        progress : Nat;
        sectionId : Text;
        timestamp : Int;
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

    type Representative = {
        name : Text;
        photoPath : Text;
        email : Text;
        twitterHandle : Text;
        remarks : Text;
        lastUpdated : Int;
        politicalParty : ?Text;
    };

    type AdministrativeUnit = {
        name : Text;
        unitType : Text;
        parentState : ?Text;
        parentConstituency : ?Text;
    };

    type Directory = {
        states : [State];
        unionTerritories : [State];
        administrativeUnits : [AdministrativeUnit];
        primeMinister : ?Representative;
    };

    type State = {
        name : Text;
        cm : ?Representative;
        constituencies : [Constituency];
        isUnionTerritory : Bool;
    };

    type Constituency = {
        name : Text;
        mp : ?Representative;
        mlas : [Representative];
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

    type FileReference = {
        path : Text;
        hash : Text;
    };

    var fileRegistry = Map.empty<Text, FileReference>();

    var reports = Map.empty<Text, Report>();
    let accessControlState = AccessControl.initState();
    include MixinAuthorization(accessControlState);
    include MixinObjectStorage();
    var logoState : LogoState = {
        currentLogo = "";
        history = [];
    };
    var roadmapFeatures : [RoadmapFeature] = [];
    var volunteers = Map.empty<Text, Volunteer>();
    var directory : Directory = {
        states = [];
        unionTerritories = [];
        administrativeUnits = [];
        primeMinister = null;
    };
    var ngoNpos = Map.empty<Text, NgoNpo>();
    var feedbacks = Map.empty<Text, Feedback>();
    var uniqueVisitors = Map.empty<Principal, Bool>();
    var pendingProfileEdits = Map.empty<Text, PendingProfileEdit>();

    let approvalState = UserApproval.initState(accessControlState);

    public shared func registerFileReference(path : Text, hash : Text) : async () {
        fileRegistry.add(path, { path; hash });
    };

    public query func getFileReference(path : Text) : async FileReference {
        switch (fileRegistry.get(path)) {
            case (?ref) { ref };
            case (null) { Runtime.trap("File reference not found: " # path) };
        };
    };

    public query func listFileReferences() : async [FileReference] {
        let refs = List.empty<FileReference>();
        for ((_, ref) in fileRegistry.entries()) {
            refs.add(ref);
        };
        refs.toArray();
    };

    public shared func dropFileReference(path : Text) : async () {
        fileRegistry.remove(path);
    };

    public shared ({ caller }) func submitReport(photoPath : Text, latitude : Float, longitude : Float, username : ?Text, notes : ?Text, issueType : Text, mlaName : ?Text, mlaPhotoPath : ?Text, pmPhotoPath : ?Text, cmPhotoPath : ?Text, pmName : ?Text, cmName : ?Text, customAddress : ?Text, state : Text, mlaDesignation : Text, isVolunteer : Bool, pmData : ?Representative, cmData : ?Representative, mpData : ?Representative, address : Text, coordinates : Text, localCivicBody : ?LocalCivicBody) : async Text {
        // Auto-initialize caller so getCallerUserRole never traps for this user
        AccessControl.initialize(accessControlState, caller);
        let id = Time.now().toText();
        let report : Report = {
            id;
            photoPath;
            location = { latitude; longitude };
            timestamp = Time.now();
            status = "Open";
            username;
            notes;
            issueType;
            mlaName;
            mlaPhotoPath;
            pmPhotoPath;
            cmPhotoPath;
            pmName;
            cmName;
            proofPhotoPath = null;
            reporterName = null;
            completionNotes = null;
            customAddress;
            state;
            mlaDesignation;
            submittedByVolunteer = isVolunteer;
            resolvedByVolunteer = false;
            pmData;
            cmData;
            mpData;
            address;
            coordinates;
            localCivicBody;
        };
        reports.add(id, report);

        if (isVolunteer) {
            var found : ?Volunteer = null;
            for ((vid, volunteer) in volunteers.entries()) {
                if (volunteer.principal == caller) {
                    found := ?volunteer;
                };
            };
            switch (found) {
                case (null) {};
                case (?volunteer) {
                    let updatedVolunteer : Volunteer = {
                        volunteer with
                        impactScore = volunteer.impactScore + 10
                    };
                    volunteers.add(volunteer.id, updatedVolunteer);
                };
            };
        };

        id;
    };

    public query func getReport(id : Text) : async ?Report {
        reports.get(id);
    };

    public query func getAllReports() : async [Report] {
        let reportList = List.empty<Report>();
        for ((id, report) in reports.entries()) {
            reportList.add(report);
        };
        reportList.toArray();
    };

    public shared ({ caller }) func updateReportStatus(id : Text, newStatus : Text, proofPhotoPath : Text, reporterName : Text, completionNotes : ?Text, isVolunteer : Bool) : async Bool {
        AccessControl.initialize(accessControlState, caller);
        switch (reports.get(id)) {
            case (null) { false };
            case (?report) {
                let updatedReport : Report = {
                    report with
                    status = newStatus;
                    proofPhotoPath = ?proofPhotoPath;
                    reporterName = ?reporterName;
                    completionNotes;
                    resolvedByVolunteer = isVolunteer;
                };
                reports.add(id, updatedReport);

                if (isVolunteer and newStatus == "Resolved") {
                    var found : ?Volunteer = null;
                    for ((vid, volunteer) in volunteers.entries()) {
                        if (volunteer.principal == caller) {
                            found := ?volunteer;
                        };
                    };
                    switch (found) {
                        case (null) {};
                        case (?volunteer) {
                            let updatedVolunteer : Volunteer = {
                                volunteer with
                                impactScore = volunteer.impactScore + 10
                            };
                            volunteers.add(volunteer.id, updatedVolunteer);
                        };
                    };
                };

                true;
            };
        };
    };

    public query func getRecentReports(count : Nat) : async [Report] {
        let reportList = List.empty<Report>();
        for ((id, report) in reports.entries()) {
            reportList.add(report);
        };
        let sorted = reportList.toArray();
        let len = sorted.size();
        if (len == 0) {
            return [];
        };
        let actualCount = if (len < count) { len } else { count };
        Array.tabulate(actualCount, func(i : Nat) : Report { sorted[len - 1 - i] });
    };

    public query func getReportsByState(state : Text) : async [Report] {
        let reportList = List.empty<Report>();
        for ((id, report) in reports.entries()) {
            if (report.state == state) {
                reportList.add(report);
            };
        };
        reportList.toArray();
    };

    public shared ({ caller }) func deleteReport(id : Text) : async () {
        AccessControl.initialize(accessControlState, caller);
        if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
            Runtime.trap("Unauthorized: Only admins can delete reports");
        };
        switch (reports.get(id)) {
            case (null) {
                Runtime.trap("Report not found");
            };
            case (?report) {
                if (report.submittedByVolunteer) {
                    var found : ?Volunteer = null;
                    for ((vid, volunteer) in volunteers.entries()) {
                        if (volunteer.principal == caller) {
                            found := ?volunteer;
                        };
                    };
                    switch (found) {
                        case (null) {};
                        case (?volunteer) {
                            let updatedVolunteer : Volunteer = {
                                volunteer with
                                impactScore = Int.max(0, volunteer.impactScore - 10)
                            };
                            volunteers.add(volunteer.id, updatedVolunteer);
                        };
                    };
                };
                reports.remove(id);
            };
        };
    };

    public type UserProfile = {
        name : Text;
    };

    var userProfiles = Map.empty<Principal, UserProfile>();

    public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
        if (caller.isAnonymous()) {
            return null;
        };
        userProfiles.get(caller);
    };

    public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
        // Safe check: only allow own profile or admin; unregistered non-anonymous users get denied
        let isAdmin = if (caller.isAnonymous()) { false } else {
            switch (accessControlState.userRoles.get(caller)) {
                case (?#admin) { true };
                case (_) { false };
            };
        };
        if (caller != user and not isAdmin) {
            Runtime.trap("Unauthorized: Can only view your own profile");
        };
        userProfiles.get(user);
    };

    public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
        AccessControl.initialize(accessControlState, caller);
        if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
            Runtime.trap("Unauthorized: Only authenticated users can save profiles");
        };
        userProfiles.add(caller, profile);
    };

    public query func getCurrentLogo() : async Text {
        logoState.currentLogo;
    };

    public shared ({ caller }) func uploadLogo(logoData : Text) : async () {
        AccessControl.initialize(accessControlState, caller);
        if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
            Runtime.trap("Unauthorized: Only admins can upload logos");
        };
        let newHistory : [LogoHistory] = logoState.history.concat(
            [{ logoData; timestamp = Time.now(); admin = caller }],
        );
        logoState := {
            currentLogo = logoData;
            history = newHistory;
        };
    };

    public query ({ caller }) func getLogoHistory() : async [LogoHistory] {
        let isAdmin = switch (accessControlState.userRoles.get(caller)) { case (?#admin) { true }; case (_) { false } };
        if (not isAdmin) {
            Runtime.trap("Unauthorized: Only admins can view logo history");
        };
        logoState.history;
    };

    public query ({ caller }) func getAdmins() : async [Principal] {
        let isAdmin = switch (accessControlState.userRoles.get(caller)) { case (?#admin) { true }; case (_) { false } };
        if (not isAdmin) {
            Runtime.trap("Unauthorized: Only admins can view admin list");
        };
        let adminList = List.empty<Principal>();
        for ((principal, role) in accessControlState.userRoles.entries()) {
            switch (role) {
                case (#admin) {
                    adminList.add(principal);
                };
                case (_) {};
            };
        };
        adminList.toArray();
    };

    public shared ({ caller }) func addAdmin(newAdmin : Principal) : async () {
        AccessControl.initialize(accessControlState, caller);
        if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
            Runtime.trap("Unauthorized: Only admins can add new admins");
        };
        AccessControl.assignRole(accessControlState, caller, newAdmin, #admin);
    };

    public shared ({ caller }) func removeAdmin(adminToRemove : Principal) : async () {
        AccessControl.initialize(accessControlState, caller);
        if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
            Runtime.trap("Unauthorized: Only admins can remove admins");
        };
        if (caller == adminToRemove) {
            Runtime.trap("Cannot remove yourself as admin");
        };
        AccessControl.assignRole(accessControlState, caller, adminToRemove, #user);
    };

    public shared ({ caller }) func updateReport(id : Text, updatedReport : Report) : async () {
        AccessControl.initialize(accessControlState, caller);
        if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
            Runtime.trap("Unauthorized: Only admins can update reports");
        };
        switch (reports.get(id)) {
            case (null) {
                Runtime.trap("Report not found");
            };
            case (?existingReport) {
                reports.add(id, updatedReport);
            };
        };
    };

    public shared ({ caller }) func updateLocalCivicBody(id : Text, bodyType : Text, bodyName : Text, representativeName : Text, photoPath : ?Text) : async () {
        AccessControl.initialize(accessControlState, caller);
        if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
            Runtime.trap("Unauthorized: Only admins can update local civic body details");
        };
        switch (reports.get(id)) {
            case (null) {
                Runtime.trap("Report not found");
            };
            case (?report) {
                let updatedLocalCivicBody : LocalCivicBody = {
                    bodyType;
                    bodyName;
                    representativeName;
                    photoPath;
                };
                let updatedReport : Report = {
                    report with
                    localCivicBody = ?updatedLocalCivicBody;
                };
                reports.add(id, updatedReport);
            };
        };
    };

    public query func getRoadmapFeatures() : async [RoadmapFeature] {
        roadmapFeatures;
    };

    public shared ({ caller }) func createFeature(sectionId : Text, featureData : RoadmapFeature) : async () {
        AccessControl.initialize(accessControlState, caller);
        if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
            Runtime.trap("Unauthorized: Only admins can create features");
        };
        let id = Time.now().toText();
        let feature : RoadmapFeature = {
            featureData with
            id;
            sectionId;
            timestamp = Time.now();
        };
        roadmapFeatures := roadmapFeatures.concat([feature]);
    };

    public shared ({ caller }) func updateFeature(featureId : Text, featureData : RoadmapFeature) : async () {
        AccessControl.initialize(accessControlState, caller);
        if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
            Runtime.trap("Unauthorized: Only admins can update features");
        };
        var found = false;
        let updatedFeatures = roadmapFeatures.map(
            func(feature) {
                if (feature.id == featureId) {
                    found := true;
                    {
                        featureData with
                        id = featureId;
                        timestamp = Time.now();
                    };
                } else {
                    feature;
                };
            },
        );
        if (not found) {
            Runtime.trap("Feature not found");
        };
        roadmapFeatures := updatedFeatures;
    };

    public shared ({ caller }) func deleteFeature(featureId : Text) : async () {
        AccessControl.initialize(accessControlState, caller);
        if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
            Runtime.trap("Unauthorized: Only admins can delete features");
        };
        let filteredFeatures = roadmapFeatures.filter(
            func(feature) { feature.id != featureId },
        );
        if (filteredFeatures.size() == roadmapFeatures.size()) {
            Runtime.trap("Feature not found");
        };
        roadmapFeatures := filteredFeatures;
    };

    public shared ({ caller }) func moveFeature(featureId : Text, newSectionId : Text) : async () {
        AccessControl.initialize(accessControlState, caller);
        if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
            Runtime.trap("Unauthorized: Only admins can move features");
        };
        var found = false;
        let updatedFeatures = roadmapFeatures.map(
            func(feature) {
                if (feature.id == featureId) {
                    found := true;
                    {
                        feature with
                        sectionId = newSectionId;
                        timestamp = Time.now();
                    };
                } else {
                    feature;
                };
            },
        );
        if (not found) {
            Runtime.trap("Feature not found");
        };
        roadmapFeatures := updatedFeatures;
    };

    public query ({ caller }) func isCallerApproved() : async Bool {
        let isAdmin = switch (accessControlState.userRoles.get(caller)) { case (?#admin) { true }; case (_) { false } };
        isAdmin or UserApproval.isApproved(approvalState, caller);
    };

    public shared ({ caller }) func requestApproval() : async () {
        AccessControl.initialize(accessControlState, caller);
        UserApproval.requestApproval(approvalState, caller);
    };

    public shared ({ caller }) func setApproval(user : Principal, status : UserApproval.ApprovalStatus) : async () {
        AccessControl.initialize(accessControlState, caller);
        if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
            Runtime.trap("Unauthorized: Only admins can perform this action");
        };
        UserApproval.setApproval(approvalState, user, status);
    };

    public query ({ caller }) func listApprovals() : async [UserApproval.UserApprovalInfo] {
        let isAdmin = switch (accessControlState.userRoles.get(caller)) { case (?#admin) { true }; case (_) { false } };
        if (not isAdmin) {
            Runtime.trap("Unauthorized: Only admins can perform this action");
        };
        UserApproval.listApprovals(approvalState);
    };

    public shared ({ caller }) func applyVolunteer(name : Text, photoPath : Text, contactInfo : Text, address : Text, showFullMobile : Bool) : async Text {
        AccessControl.initialize(accessControlState, caller);
        let id = Time.now().toText();
        let volunteer : Volunteer = {
            id;
            name;
            photoPath;
            contactInfo;
            address;
            applicationDate = Time.now();
            approved = false;
            principal = caller;
            rejectionNote = null;
            approvalTimestamp = null;
            impactScore = 0;
            showFullMobile;
        };
        volunteers.add(id, volunteer);
        id;
    };

    public shared ({ caller }) func approveVolunteer(volunteerId : Text) : async () {
        AccessControl.initialize(accessControlState, caller);
        if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
            Runtime.trap("Unauthorized: Only admins can approve volunteers");
        };
        switch (volunteers.get(volunteerId)) {
            case (null) {
                Runtime.trap("Volunteer not found");
            };
            case (?volunteer) {
                let updatedVolunteer : Volunteer = {
                    volunteer with
                    approved = true;
                    rejectionNote = null;
                    approvalTimestamp = ?Time.now();
                };
                volunteers.add(volunteerId, updatedVolunteer);
            };
        };
    };

    public shared ({ caller }) func rejectVolunteer(volunteerId : Text, rejectionNote : Text) : async () {
        AccessControl.initialize(accessControlState, caller);
        if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
            Runtime.trap("Unauthorized: Only admins can reject volunteers");
        };
        switch (volunteers.get(volunteerId)) {
            case (null) {
                Runtime.trap("Volunteer not found");
            };
            case (?volunteer) {
                let updatedVolunteer : Volunteer = {
                    volunteer with
                    approved = false;
                    rejectionNote = ?rejectionNote;
                    approvalTimestamp = null;
                };
                volunteers.add(volunteerId, updatedVolunteer);
            };
        };
    };

    public shared ({ caller }) func updateVolunteerPrivacy(volunteerId : Text, showFullMobile : Bool) : async () {
        AccessControl.initialize(accessControlState, caller);
        switch (volunteers.get(volunteerId)) {
            case (null) {
                Runtime.trap("Volunteer not found");
            };
            case (?volunteer) {
                if (volunteer.principal != caller and not AccessControl.isAdmin(accessControlState, caller)) {
                    Runtime.trap("Unauthorized: Only the volunteer or an admin can update privacy settings");
                };
                let updatedVolunteer : Volunteer = {
                    volunteer with
                    showFullMobile;
                };
                volunteers.add(volunteerId, updatedVolunteer);
            };
        };
    };

    public shared ({ caller }) func submitVolunteerProfileEdit(volunteerId : Text, updates : VolunteerProfileUpdate) : async Text {
        AccessControl.initialize(accessControlState, caller);
        switch (volunteers.get(volunteerId)) {
            case (null) {
                Runtime.trap("Volunteer not found");
            };
            case (?volunteer) {
                if (volunteer.principal != caller) {
                    Runtime.trap("Unauthorized: Only the volunteer can edit their own profile");
                };
                if (not volunteer.approved) {
                    Runtime.trap("Unauthorized: Only approved volunteers can edit their profile");
                };

                let editId = Time.now().toText();
                let pendingEdit : PendingProfileEdit = {
                    id = editId;
                    volunteerId;
                    volunteerPrincipal = caller;
                    updates;
                    submittedAt = Time.now();
                    status = "Pending";
                    rejectionNote = null;
                };
                pendingProfileEdits.add(editId, pendingEdit);
                editId;
            };
        };
    };

    public query ({ caller }) func getMyPendingProfileEdit() : async ?PendingProfileEdit {
        var found : ?PendingProfileEdit = null;
        for ((editId, edit) in pendingProfileEdits.entries()) {
            if (edit.volunteerPrincipal == caller and edit.status == "Pending") {
                found := ?edit;
            };
        };
        found;
    };

    public query ({ caller }) func getMyProfileEditHistory() : async [PendingProfileEdit] {
        let editList = List.empty<PendingProfileEdit>();
        for ((editId, edit) in pendingProfileEdits.entries()) {
            if (edit.volunteerPrincipal == caller) {
                editList.add(edit);
            };
        };
        editList.toArray();
    };

    public query ({ caller }) func getAllPendingProfileEdits() : async [PendingProfileEdit] {
        let isAdmin = switch (accessControlState.userRoles.get(caller)) { case (?#admin) { true }; case (_) { false } };
        if (not isAdmin) {
            Runtime.trap("Unauthorized: Only admins can view all pending profile edits");
        };
        let editList = List.empty<PendingProfileEdit>();
        for ((editId, edit) in pendingProfileEdits.entries()) {
            if (edit.status == "Pending") {
                editList.add(edit);
            };
        };
        editList.toArray();
    };

    public shared ({ caller }) func approveVolunteerProfileEdit(editId : Text) : async () {
        AccessControl.initialize(accessControlState, caller);
        if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
            Runtime.trap("Unauthorized: Only admins can approve profile edits");
        };
        switch (pendingProfileEdits.get(editId)) {
            case (null) {
                Runtime.trap("Pending edit not found");
            };
            case (?edit) {
                if (edit.status != "Pending") {
                    Runtime.trap("Edit has already been processed");
                };

                switch (volunteers.get(edit.volunteerId)) {
                    case (null) {
                        Runtime.trap("Volunteer not found");
                    };
                    case (?volunteer) {
                        let updatedVolunteer : Volunteer = {
                            volunteer with
                            name = edit.updates.name;
                            photoPath = edit.updates.photoPath;
                            contactInfo = edit.updates.contactInfo;
                            address = edit.updates.address;
                            showFullMobile = edit.updates.showFullMobile;
                        };
                        volunteers.add(edit.volunteerId, updatedVolunteer);

                        let updatedEdit : PendingProfileEdit = {
                            edit with
                            status = "Approved";
                        };
                        pendingProfileEdits.add(editId, updatedEdit);
                    };
                };
            };
        };
    };

    public shared ({ caller }) func rejectVolunteerProfileEdit(editId : Text, rejectionNote : Text) : async () {
        AccessControl.initialize(accessControlState, caller);
        if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
            Runtime.trap("Unauthorized: Only admins can reject profile edits");
        };
        switch (pendingProfileEdits.get(editId)) {
            case (null) {
                Runtime.trap("Pending edit not found");
            };
            case (?edit) {
                if (edit.status != "Pending") {
                    Runtime.trap("Edit has already been processed");
                };

                let updatedEdit : PendingProfileEdit = {
                    edit with
                    status = "Rejected";
                    rejectionNote = ?rejectionNote;
                };
                pendingProfileEdits.add(editId, updatedEdit);
            };
        };
    };

    public query func getVolunteerDirectory() : async [Volunteer] {
        let volunteerList = List.empty<Volunteer>();
        for ((id, volunteer) in volunteers.entries()) {
            if (volunteer.approved) {
                volunteerList.add(volunteer);
            };
        };
        volunteerList.toArray();
    };

    public query ({ caller }) func getMyVolunteerProfile() : async ?Volunteer {
        var found : ?Volunteer = null;
        for ((id, volunteer) in volunteers.entries()) {
            if (volunteer.principal == caller) {
                found := ?volunteer;
            };
        };
        found;
    };

    public query ({ caller }) func getAllVolunteers() : async [Volunteer] {
        let isAdmin = switch (accessControlState.userRoles.get(caller)) { case (?#admin) { true }; case (_) { false } };
        if (not isAdmin) {
            Runtime.trap("Unauthorized: Only admins can view all volunteers");
        };
        let volunteerList = List.empty<Volunteer>();
        for ((id, volunteer) in volunteers.entries()) {
            volunteerList.add(volunteer);
        };
        volunteerList.toArray();
    };

    public query func getVolunteerById(volunteerId : Text) : async ?Volunteer {
        volunteers.get(volunteerId);
    };

    public shared ({ caller }) func addState(stateName : Text, cm : ?Representative, isUnionTerritory : Bool) : async () {
        AccessControl.initialize(accessControlState, caller);
        if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
            Runtime.trap("Unauthorized: Only admins can add states");
        };
        let newState : State = {
            name = stateName;
            cm;
            constituencies = [];
            isUnionTerritory;
        };
        if (isUnionTerritory) {
            directory := {
                directory with
                unionTerritories = directory.unionTerritories.concat([newState]);
            };
        } else {
            directory := {
                directory with
                states = directory.states.concat([newState]);
            };
        };
    };

    public shared ({ caller }) func addUnionTerritory(utName : Text, administrator : ?Representative) : async () {
        AccessControl.initialize(accessControlState, caller);
        if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
            Runtime.trap("Unauthorized: Only admins can add union territories");
        };
        let newUT : State = {
            name = utName;
            cm = administrator;
            constituencies = [];
            isUnionTerritory = true;
        };
        directory := {
            directory with
            unionTerritories = directory.unionTerritories.concat([newUT]);
        };
    };

    public shared ({ caller }) func addConstituency(stateName : Text, constituencyName : Text) : async () {
        AccessControl.initialize(accessControlState, caller);
        if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
            Runtime.trap("Unauthorized: Only admins can add constituencies");
        };

        var found = false;

        let updatedStates = directory.states.map(
            func(state) {
                if (state.name == stateName) {
                    found := true;
                    {
                        state with
                        constituencies = state.constituencies.concat([{
                            name = constituencyName;
                            mp = null;
                            mlas = [];
                        }]);
                    };
                } else {
                    state;
                };
            },
        );

        if (not found) {
            let updatedUTs = directory.unionTerritories.map(
                func(ut) {
                    if (ut.name == stateName) {
                        found := true;
                        {
                            ut with
                            constituencies = ut.constituencies.concat([{
                                name = constituencyName;
                                mp = null;
                                mlas = [];
                            }]);
                        };
                    } else {
                        ut;
                    };
                },
            );
            if (not found) {
                Runtime.trap("State or Union Territory not found");
            };
            directory := { directory with unionTerritories = updatedUTs };
        } else {
            directory := { directory with states = updatedStates };
        };
    };

    public shared ({ caller }) func addMpToConstituency(stateName : Text, constituencyName : Text, mp : Representative) : async () {
        AccessControl.initialize(accessControlState, caller);
        if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
            Runtime.trap("Unauthorized: Only admins can add MPs");
        };

        var stateFound = false;
        var constituencyFound = false;
        var isUT = false;

        let updatedStates = directory.states.map(
            func(state) {
                if (state.name == stateName) {
                    stateFound := true;
                    {
                        state with
                        constituencies = state.constituencies.map(
                            func(constituency) {
                                if (constituency.name == constituencyName) {
                                    constituencyFound := true;
                                    {
                                        constituency with
                                        mp = ?mp;
                                    };
                                } else {
                                    constituency;
                                };
                            },
                        );
                    };
                } else {
                    state;
                };
            },
        );

        if (stateFound) {
            if (not constituencyFound) {
                Runtime.trap("Constituency not found");
            };
            directory := { directory with states = updatedStates };
        } else {
            let updatedUTs = directory.unionTerritories.map(
                func(ut) {
                    if (ut.name == stateName) {
                        stateFound := true;
                        isUT := true;
                        {
                            ut with
                            constituencies = ut.constituencies.map(
                                func(constituency) {
                                    if (constituency.name == constituencyName) {
                                        constituencyFound := true;
                                        {
                                            constituency with
                                            mp = ?mp;
                                        };
                                    } else {
                                        constituency;
                                    };
                                },
                            );
                        };
                    } else {
                        ut;
                    };
                },
            );
            if (not stateFound) {
                Runtime.trap("State or Union Territory not found");
            };
            if (not constituencyFound) {
                Runtime.trap("Constituency not found");
            };
            directory := { directory with unionTerritories = updatedUTs };
        };
    };

    public shared ({ caller }) func addMlaToConstituency(stateName : Text, constituencyName : Text, mla : Representative) : async () {
        AccessControl.initialize(accessControlState, caller);
        if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
            Runtime.trap("Unauthorized: Only admins can add MLAs");
        };

        var stateFound = false;
        var constituencyFound = false;
        var isUT = false;

        let updatedStates = directory.states.map(
            func(state) {
                if (state.name == stateName) {
                    stateFound := true;
                    {
                        state with
                        constituencies = state.constituencies.map(
                            func(constituency) {
                                if (constituency.name == constituencyName) {
                                    constituencyFound := true;
                                    {
                                        constituency with
                                        mlas = constituency.mlas.concat([mla]);
                                    };
                                } else {
                                    constituency;
                                };
                            },
                        );
                    };
                } else {
                    state;
                };
            },
        );

        if (stateFound) {
            if (not constituencyFound) {
                Runtime.trap("Constituency not found");
            };
            directory := { directory with states = updatedStates };
        } else {
            let updatedUTs = directory.unionTerritories.map(
                func(ut) {
                    if (ut.name == stateName) {
                        stateFound := true;
                        isUT := true;
                        {
                            ut with
                            constituencies = ut.constituencies.map(
                                func(constituency) {
                                    if (constituency.name == constituencyName) {
                                        constituencyFound := true;
                                        {
                                            constituency with
                                            mlas = constituency.mlas.concat([mla]);
                                        };
                                    } else {
                                        constituency;
                                    };
                                },
                            );
                        };
                    } else {
                        ut;
                    };
                },
            );
            if (not stateFound) {
                Runtime.trap("State or Union Territory not found");
            };
            if (not constituencyFound) {
                Runtime.trap("Constituency not found");
            };
            directory := { directory with unionTerritories = updatedUTs };
        };
    };

    public shared ({ caller }) func addAdministrativeUnit(name : Text, unitType : Text, parentState : ?Text, parentConstituency : ?Text) : async () {
        AccessControl.initialize(accessControlState, caller);
        if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
            Runtime.trap("Unauthorized: Only admins can add administrative units");
        };
        let newUnit : AdministrativeUnit = {
            name;
            unitType;
            parentState;
            parentConstituency;
        };
        directory := {
            directory with
            administrativeUnits = directory.administrativeUnits.concat([newUnit]);
        };
    };

    public shared ({ caller }) func setPrimeMinister(pm : Representative) : async () {
        AccessControl.initialize(accessControlState, caller);
        if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
            Runtime.trap("Unauthorized: Only admins can set the Prime Minister");
        };
        directory := { directory with primeMinister = ?pm };
    };

    public query func getDirectory() : async Directory {
        directory;
    };

    public query func getState(stateName : Text) : async ?State {
        var found : ?State = null;
        for (state in directory.states.vals()) {
            if (state.name == stateName) {
                found := ?state;
            };
        };
        found;
    };

    public query func getUnionTerritory(utName : Text) : async ?State {
        var found : ?State = null;
        for (ut in directory.unionTerritories.vals()) {
            if (ut.name == utName) {
                found := ?ut;
            };
        };
        found;
    };

    public query func getConstituency(stateName : Text, constituencyName : Text) : async ?Constituency {
        var stateFound : ?State = null;
        for (state in directory.states.vals()) {
            if (state.name == stateName) {
                stateFound := ?state;
            };
        };
        switch (stateFound) {
            case (null) { null };
            case (?state) {
                var found : ?Constituency = null;
                for (constituency in state.constituencies.vals()) {
                    if (constituency.name == constituencyName) {
                        found := ?constituency;
                    };
                };
                found;
            };
        };
    };

    public query func getAdministrativeUnits() : async [AdministrativeUnit] {
        directory.administrativeUnits;
    };

    public shared ({ caller }) func updateRepresentative(stateName : Text, constituencyName : Text, repType : Text, representative : Representative) : async () {
        AccessControl.initialize(accessControlState, caller);
        if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
            Runtime.trap("Unauthorized: Only admins can update representatives");
        };

        var stateFound = false;
        var constituencyFound = false;

        let updatedStates = directory.states.map(
            func(state) {
                if (state.name == stateName) {
                    stateFound := true;
                    {
                        state with
                        constituencies = state.constituencies.map(
                            func(constituency) {
                                if (constituency.name == constituencyName) {
                                    constituencyFound := true;
                                    switch (repType) {
                                        case ("mp") {
                                            {
                                                constituency with
                                                mp = ?representative;
                                            };
                                        };
                                        case ("mla") {
                                            {
                                                constituency with
                                                mlas = constituency.mlas.concat([representative]);
                                            };
                                        };
                                        case (_) {
                                            constituency;
                                        };
                                    };
                                } else {
                                    constituency;
                                };
                            },
                        );
                    };
                } else {
                    state;
                };
            },
        );

        if (not stateFound) {
            let updatedUTs = directory.unionTerritories.map(
                func(ut) {
                    if (ut.name == stateName) {
                        stateFound := true;
                        {
                            ut with
                            constituencies = ut.constituencies.map(
                                func(constituency) {
                                    if (constituency.name == constituencyName) {
                                        constituencyFound := true;
                                        switch (repType) {
                                            case ("mp") {
                                                {
                                                    constituency with
                                                    mp = ?representative;
                                                };
                                            };
                                            case ("mla") {
                                                {
                                                    constituency with
                                                    mlas = constituency.mlas.concat([representative]);
                                                };
                                            };
                                            case (_) {
                                                constituency;
                                            };
                                        };
                                    } else {
                                        constituency;
                                    };
                                },
                            );
                        };
                    } else {
                        ut;
                    };
                },
            );
            if (not stateFound) {
                Runtime.trap("State or Union Territory not found");
            };
            if (not constituencyFound) {
                Runtime.trap("Constituency not found");
            };
            directory := { directory with unionTerritories = updatedUTs };
        } else {
            if (not constituencyFound) {
                Runtime.trap("Constituency not found");
            };
            directory := { directory with states = updatedStates };
        };
    };

    public shared ({ caller }) func updateDirectory(newDirectory : Directory) : async () {
        AccessControl.initialize(accessControlState, caller);
        if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
            Runtime.trap("Unauthorized: Only admins can update the directory");
        };
        directory := newDirectory;
    };

    public shared ({ caller }) func deleteConstituency(stateName : Text, constituencyName : Text) : async () {
        AccessControl.initialize(accessControlState, caller);
        if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
            Runtime.trap("Unauthorized: Only admins can delete constituencies");
        };

        var stateFound = false;
        var constituencyFound = false;

        let updatedStates = directory.states.map(
            func(state) {
                if (state.name == stateName) {
                    stateFound := true;
                    {
                        state with
                        constituencies = state.constituencies.filter(
                            func(constituency) {
                                if (constituency.name == constituencyName) {
                                    constituencyFound := true;
                                    false;
                                } else {
                                    true;
                                };
                            },
                        );
                    };
                } else {
                    state;
                };
            },
        );

        if (not stateFound) {
            let updatedUTs = directory.unionTerritories.map(
                func(ut) {
                    if (ut.name == stateName) {
                        stateFound := true;
                        {
                            ut with
                            constituencies = ut.constituencies.filter(
                                func(constituency) {
                                    if (constituency.name == constituencyName) {
                                        constituencyFound := true;
                                        false;
                                    } else {
                                        true;
                                    };
                                },
                            );
                        };
                    } else {
                        ut;
                    };
                },
            );
            if (not stateFound) {
                Runtime.trap("State or Union Territory not found");
            };
            if (not constituencyFound) {
                Runtime.trap("Constituency not found");
            };
            directory := { directory with unionTerritories = updatedUTs };
        } else {
            if (not constituencyFound) {
                Runtime.trap("Constituency not found");
            };
            directory := { directory with states = updatedStates };
        };
    };

    public shared ({ caller }) func deleteRepresentative(stateName : Text, constituencyName : Text, repType : Text) : async () {
        AccessControl.initialize(accessControlState, caller);
        if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
            Runtime.trap("Unauthorized: Only admins can delete representatives");
        };

        var stateFound = false;
        var constituencyFound = false;

        let updatedStates = directory.states.map(
            func(state) {
                if (state.name == stateName) {
                    stateFound := true;
                    {
                        state with
                        constituencies = state.constituencies.map(
                            func(constituency) {
                                if (constituency.name == constituencyName) {
                                    constituencyFound := true;
                                    switch (repType) {
                                        case ("mp") {
                                            {
                                                constituency with
                                                mp = null;
                                            };
                                        };
                                        case ("mla") {
                                            {
                                                constituency with
                                                mlas = [];
                                            };
                                        };
                                        case (_) {
                                            constituency;
                                        };
                                    };
                                } else {
                                    constituency;
                                };
                            },
                        );
                    };
                } else {
                    state;
                };
            },
        );

        if (not stateFound) {
            let updatedUTs = directory.unionTerritories.map(
                func(ut) {
                    if (ut.name == stateName) {
                        stateFound := true;
                        {
                            ut with
                            constituencies = ut.constituencies.map(
                                func(constituency) {
                                    if (constituency.name == constituencyName) {
                                        constituencyFound := true;
                                        switch (repType) {
                                            case ("mp") {
                                                {
                                                    constituency with
                                                    mp = null;
                                                };
                                            };
                                            case ("mla") {
                                                {
                                                    constituency with
                                                    mlas = [];
                                                };
                                            };
                                            case (_) {
                                                constituency;
                                            };
                                        };
                                    } else {
                                        constituency;
                                    };
                                },
                            );
                        };
                    } else {
                        ut;
                    };
                },
            );
            if (not stateFound) {
                Runtime.trap("State or Union Territory not found");
            };
            if (not constituencyFound) {
                Runtime.trap("Constituency not found");
            };
            directory := { directory with unionTerritories = updatedUTs };
        } else {
            if (not constituencyFound) {
                Runtime.trap("Constituency not found");
            };
            directory := { directory with states = updatedStates };
        };
    };

    public shared ({ caller }) func updateState(stateName : Text, updatedState : State) : async () {
        AccessControl.initialize(accessControlState, caller);
        if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
            Runtime.trap("Unauthorized: Only admins can update states");
        };

        var foundInStates = false;
        var foundInUTs = false;

        for (state in directory.states.vals()) {
            if (state.name == stateName) {
                foundInStates := true;
            };
        };

        for (ut in directory.unionTerritories.vals()) {
            if (ut.name == stateName) {
                foundInUTs := true;
            };
        };

        if (not foundInStates and not foundInUTs) {
            Runtime.trap("State not found");
        };

        if (foundInStates and updatedState.isUnionTerritory) {
            let filteredStates = directory.states.filter(
                func(state) { state.name != stateName },
            );
            directory := {
                directory with
                states = filteredStates;
                unionTerritories = directory.unionTerritories.concat([updatedState]);
            };
        } else if (foundInUTs and not updatedState.isUnionTerritory) {
            let filteredUTs = directory.unionTerritories.filter(
                func(ut) { ut.name != stateName },
            );
            directory := {
                directory with
                states = directory.states.concat([updatedState]);
                unionTerritories = filteredUTs;
            };
        } else if (foundInStates) {
            let updatedStates = directory.states.map(
                func(state) {
                    if (state.name == stateName) {
                        updatedState;
                    } else {
                        state;
                    };
                },
            );
            directory := { directory with states = updatedStates };
        } else {
            let updatedUTs = directory.unionTerritories.map(
                func(ut) {
                    if (ut.name == stateName) {
                        updatedState;
                    } else {
                        ut;
                    };
                },
            );
            directory := { directory with unionTerritories = updatedUTs };
        };
    };

    public shared ({ caller }) func updateUnionTerritory(utName : Text, updatedUT : State) : async () {
        AccessControl.initialize(accessControlState, caller);
        if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
            Runtime.trap("Unauthorized: Only admins can update union territories");
        };

        var foundInStates = false;
        var foundInUTs = false;

        for (state in directory.states.vals()) {
            if (state.name == utName) {
                foundInStates := true;
            };
        };

        for (ut in directory.unionTerritories.vals()) {
            if (ut.name == utName) {
                foundInUTs := true;
            };
        };

        if (not foundInStates and not foundInUTs) {
            Runtime.trap("Union territory not found");
        };

        if (foundInUTs and not updatedUT.isUnionTerritory) {
            let filteredUTs = directory.unionTerritories.filter(
                func(ut) { ut.name != utName },
            );
            directory := {
                directory with
                states = directory.states.concat([updatedUT]);
                unionTerritories = filteredUTs;
            };
        } else if (foundInStates and updatedUT.isUnionTerritory) {
            let filteredStates = directory.states.filter(
                func(state) { state.name != utName },
            );
            directory := {
                directory with
                states = filteredStates;
                unionTerritories = directory.unionTerritories.concat([updatedUT]);
            };
        } else if (foundInUTs) {
            let updatedUTs = directory.unionTerritories.map(
                func(ut) {
                    if (ut.name == utName) {
                        updatedUT;
                    } else {
                        ut;
                    };
                },
            );
            directory := { directory with unionTerritories = updatedUTs };
        } else {
            let updatedStates = directory.states.map(
                func(state) {
                    if (state.name == utName) {
                        updatedUT;
                    } else {
                        state;
                    };
                },
            );
            directory := { directory with states = updatedStates };
        };
    };

    public shared ({ caller }) func updateConstituency(stateName : Text, constituencyName : Text, updatedConstituency : Constituency) : async () {
        AccessControl.initialize(accessControlState, caller);
        if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
            Runtime.trap("Unauthorized: Only admins can update constituencies");
        };

        var stateFound = false;
        var constituencyFound = false;

        let updatedStates = directory.states.map(
            func(state) {
                if (state.name == stateName) {
                    stateFound := true;
                    {
                        state with
                        constituencies = state.constituencies.map(
                            func(constituency) {
                                if (constituency.name == constituencyName) {
                                    constituencyFound := true;
                                    updatedConstituency;
                                } else {
                                    constituency;
                                };
                            },
                        );
                    };
                } else {
                    state;
                };
            },
        );

        if (not stateFound) {
            let updatedUTs = directory.unionTerritories.map(
                func(ut) {
                    if (ut.name == stateName) {
                        stateFound := true;
                        {
                            ut with
                            constituencies = ut.constituencies.map(
                                func(constituency) {
                                    if (constituency.name == constituencyName) {
                                        constituencyFound := true;
                                        updatedConstituency;
                                    } else {
                                        constituency;
                                    };
                                },
                            );
                        };
                    } else {
                        ut;
                    };
                },
            );
            if (not stateFound) {
                Runtime.trap("State or Union Territory not found");
            };
            if (not constituencyFound) {
                Runtime.trap("Constituency not found");
            };
            directory := { directory with unionTerritories = updatedUTs };
        } else {
            if (not constituencyFound) {
                Runtime.trap("Constituency not found");
            };
            directory := { directory with states = updatedStates };
        };
    };

    public shared ({ caller }) func updateRepresentativeDetails(stateName : Text, constituencyName : Text, repType : Text, repName : Text, updatedRep : Representative) : async () {
        AccessControl.initialize(accessControlState, caller);
        if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
            Runtime.trap("Unauthorized: Only admins can update representatives");
        };

        var stateFound = false;
        var constituencyFound = false;
        var repFound = false;

        let updatedStates = directory.states.map(
            func(state) {
                if (state.name == stateName) {
                    stateFound := true;
                    {
                        state with
                        constituencies = state.constituencies.map(
                            func(constituency) {
                                if (constituency.name == constituencyName) {
                                    constituencyFound := true;
                                    switch (repType) {
                                        case ("mp") {
                                            {
                                                constituency with
                                                mp = ?updatedRep;
                                            };
                                        };
                                        case ("mla") {
                                            {
                                                constituency with
                                                mlas = constituency.mlas.map(
                                                    func(mla) {
                                                        if (mla.name == repName) {
                                                            repFound := true;
                                                            updatedRep;
                                                        } else {
                                                            mla;
                                                        };
                                                    },
                                                );
                                            };
                                        };
                                        case (_) {
                                            constituency;
                                        };
                                    };
                                } else {
                                    constituency;
                                };
                            },
                        );
                    };
                } else {
                    state;
                };
            },
        );

        if (not stateFound) {
            let updatedUTs = directory.unionTerritories.map(
                func(ut) {
                    if (ut.name == stateName) {
                        stateFound := true;
                        {
                            ut with
                            constituencies = ut.constituencies.map(
                                func(constituency) {
                                    if (constituency.name == constituencyName) {
                                        constituencyFound := true;
                                        switch (repType) {
                                            case ("mp") {
                                                {
                                                    constituency with
                                                    mp = ?updatedRep;
                                                };
                                            };
                                            case ("mla") {
                                                {
                                                    constituency with
                                                    mlas = constituency.mlas.map(
                                                        func(mla) {
                                                            if (mla.name == repName) {
                                                                repFound := true;
                                                                updatedRep;
                                                            } else {
                                                                mla;
                                                            };
                                                        },
                                                    );
                                                };
                                            };
                                            case (_) {
                                                constituency;
                                            };
                                        };
                                    } else {
                                        constituency;
                                    };
                                },
                            );
                        };
                    } else {
                        ut;
                    };
                },
            );
            if (not stateFound) {
                Runtime.trap("State or Union Territory not found");
            };
            if (not constituencyFound) {
                Runtime.trap("Constituency not found");
            };
            if (repType == "mla" and not repFound) {
                Runtime.trap("MLA not found");
            };
            directory := { directory with unionTerritories = updatedUTs };
        } else {
            if (not constituencyFound) {
                Runtime.trap("Constituency not found");
            };
            if (repType == "mla" and not repFound) {
                Runtime.trap("MLA not found");
            };
            directory := { directory with states = updatedStates };
        };
    };

    public shared ({ caller }) func updateAdministrativeUnit(name : Text, updatedUnit : AdministrativeUnit) : async () {
        AccessControl.initialize(accessControlState, caller);
        if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
            Runtime.trap("Unauthorized: Only admins can update administrative units");
        };
        var found = false;
        let updatedUnits = directory.administrativeUnits.map(
            func(unit) {
                if (unit.name == name) {
                    found := true;
                    updatedUnit;
                } else {
                    unit;
                };
            },
        );
        if (not found) {
            Runtime.trap("Administrative unit not found");
        };
        directory := { directory with administrativeUnits = updatedUnits };
    };

    public shared ({ caller }) func exportDirectory() : async Directory {
        AccessControl.initialize(accessControlState, caller);
        if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
            Runtime.trap("Unauthorized: Only admins can export the directory");
        };
        directory;
    };

    public shared ({ caller }) func importDirectory(newDirectory : Directory) : async () {
        AccessControl.initialize(accessControlState, caller);
        if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
            Runtime.trap("Unauthorized: Only admins can import the directory");
        };
        directory := newDirectory;
    };

    public query func getReportsWithLocations() : async [(Report, { latitude : Float; longitude : Float })] {
        let reportList = List.empty<(Report, { latitude : Float; longitude : Float })>();
        for ((id, report) in reports.entries()) {
            reportList.add((report, report.location));
        };
        reportList.toArray();
    };

    public query func getReportsWithPhotos() : async [(Report, Text)] {
        let reportList = List.empty<(Report, Text)>();
        for ((id, report) in reports.entries()) {
            reportList.add((report, report.photoPath));
        };
        reportList.toArray();
    };

    public query func getReportsWithMinisterPhotos() : async [(Report, ?Text, ?Text, ?Text)] {
        let reportList = List.empty<(Report, ?Text, ?Text, ?Text)>();
        for ((id, report) in reports.entries()) {
            reportList.add((report, report.mlaPhotoPath, report.pmPhotoPath, report.cmPhotoPath));
        };
        reportList.toArray();
    };

    public shared ({ caller }) func updateReportLocation(id : Text, latitude : Float, longitude : Float) : async () {
        AccessControl.initialize(accessControlState, caller);
        if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
            Runtime.trap("Unauthorized: Only admins can update report locations");
        };
        switch (reports.get(id)) {
            case (null) {
                Runtime.trap("Report not found");
            };
            case (?report) {
                let updatedReport : Report = {
                    report with
                    location = { latitude; longitude };
                };
                reports.add(id, updatedReport);
            };
        };
    };

    public shared ({ caller }) func updateReportPhoto(id : Text, photoPath : Text) : async () {
        AccessControl.initialize(accessControlState, caller);
        if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
            Runtime.trap("Unauthorized: Only admins can update report photos");
        };
        switch (reports.get(id)) {
            case (null) {
                Runtime.trap("Report not found");
            };
            case (?report) {
                let updatedReport : Report = {
                    report with
                    photoPath;
                };
                reports.add(id, updatedReport);
            };
        };
    };

    public shared ({ caller }) func updateReportMinisterPhotos(id : Text, mlaPhotoPath : ?Text, pmPhotoPath : ?Text, cmPhotoPath : ?Text) : async () {
        AccessControl.initialize(accessControlState, caller);
        if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
            Runtime.trap("Unauthorized: Only admins can update minister photos");
        };
        switch (reports.get(id)) {
            case (null) {
                Runtime.trap("Report not found");
            };
            case (?report) {
                let updatedReport : Report = {
                    report with
                    mlaPhotoPath;
                    pmPhotoPath;
                    cmPhotoPath;
                };
                reports.add(id, updatedReport);
            };
        };
    };

    public shared ({ caller }) func updateReportAddress(id : Text, address : Text) : async () {
        AccessControl.initialize(accessControlState, caller);
        if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
            Runtime.trap("Unauthorized: Only admins can update report addresses");
        };
        switch (reports.get(id)) {
            case (null) {
                Runtime.trap("Report not found");
            };
            case (?report) {
                let updatedReport : Report = {
                    report with
                    address;
                };
                reports.add(id, updatedReport);
            };
        };
    };

    public shared ({ caller }) func updateReportCoordinates(id : Text, coordinates : Text) : async () {
        AccessControl.initialize(accessControlState, caller);
        if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
            Runtime.trap("Unauthorized: Only admins can update report coordinates");
        };
        switch (reports.get(id)) {
            case (null) {
                Runtime.trap("Report not found");
            };
            case (?report) {
                let updatedReport : Report = {
                    report with
                    coordinates;
                };
                reports.add(id, updatedReport);
            };
        };
    };

    public query func getReportsWithLocationsAndAddresses() : async [(Report, { latitude : Float; longitude : Float }, Text, Text)] {
        let reportList = List.empty<(Report, { latitude : Float; longitude : Float }, Text, Text)>();
        for ((id, report) in reports.entries()) {
            reportList.add((report, report.location, report.address, report.coordinates));
        };
        reportList.toArray();
    };

    public query func getReportsWithAddresses() : async [(Report, Text)] {
        let reportList = List.empty<(Report, Text)>();
        for ((id, report) in reports.entries()) {
            reportList.add((report, report.address));
        };
        reportList.toArray();
    };

    public query func getReportsWithLocationsAndAddressesOptimized() : async [(Report, { latitude : Float; longitude : Float }, Text, Text)] {
        let reportList = List.empty<(Report, { latitude : Float; longitude : Float }, Text, Text)>();
        for ((id, report) in reports.entries()) {
            reportList.add((report, report.location, report.address, report.coordinates));
        };
        reportList.toArray();
    };

    public query func getReportsWithPhotosOptimized() : async [(Report, Text)] {
        let reportList = List.empty<(Report, Text)>();
        for ((id, report) in reports.entries()) {
            reportList.add((report, report.photoPath));
        };
        reportList.toArray();
    };

    public query func getReportsWithMinisterPhotosOptimized() : async [(Report, ?Text, ?Text, ?Text)] {
        let reportList = List.empty<(Report, ?Text, ?Text, ?Text)>();
        for ((id, report) in reports.entries()) {
            reportList.add((report, report.mlaPhotoPath, report.pmPhotoPath, report.cmPhotoPath));
        };
        reportList.toArray();
    };

    public query func getReportsWithCustomAddresses() : async [(Report, ?Text, Text)] {
        let reportList = List.empty<(Report, ?Text, Text)>();
        for ((id, report) in reports.entries()) {
            reportList.add((report, report.customAddress, report.address));
        };
        reportList.toArray();
    };

    public query func getReportsWithFullLocationData() : async [(Report, { latitude : Float; longitude : Float }, ?Text, Text, Text)] {
        let reportList = List.empty<(Report, { latitude : Float; longitude : Float }, ?Text, Text, Text)>();
        for ((id, report) in reports.entries()) {
            reportList.add((report, report.location, report.customAddress, report.address, report.coordinates));
        };
        reportList.toArray();
    };

    public shared ({ caller }) func updateReportFullLocation(id : Text, latitude : Float, longitude : Float, customAddress : ?Text, address : Text, coordinates : Text) : async () {
        AccessControl.initialize(accessControlState, caller);
        if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
            Runtime.trap("Unauthorized: Only admins can update full location data");
        };
        switch (reports.get(id)) {
            case (null) {
                Runtime.trap("Report not found");
            };
            case (?report) {
                let updatedReport : Report = {
                    report with
                    location = { latitude; longitude };
                    customAddress;
                    address;
                    coordinates;
                };
                reports.add(id, updatedReport);
            };
        };
    };

    public query func getReportsWithCompleteLocationData() : async [(Report, { latitude : Float; longitude : Float }, ?Text, Text, Text)] {
        let reportList = List.empty<(Report, { latitude : Float; longitude : Float }, ?Text, Text, Text)>();
        for ((id, report) in reports.entries()) {
            reportList.add((report, report.location, report.customAddress, report.address, report.coordinates));
        };
        reportList.toArray();
    };

    public query func getReportsWithAddressAndCoordinates() : async [(Report, Text, Text)] {
        let reportList = List.empty<(Report, Text, Text)>();
        for ((id, report) in reports.entries()) {
            reportList.add((report, report.address, report.coordinates));
        };
        reportList.toArray();
    };

    public shared ({ caller }) func updateReportAddressAndCoordinates(id : Text, address : Text, coordinates : Text) : async () {
        AccessControl.initialize(accessControlState, caller);
        if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
            Runtime.trap("Unauthorized: Only admins can update address and coordinates");
        };
        switch (reports.get(id)) {
            case (null) {
                Runtime.trap("Report not found");
            };
            case (?report) {
                let updatedReport : Report = {
                    report with
                    address;
                    coordinates;
                };
                reports.add(id, updatedReport);
            };
        };
    };

    public query func getReportsForAdminTable() : async [(Report, Text, Text, Text)] {
        let reportList = List.empty<(Report, Text, Text, Text)>();
        for ((id, report) in reports.entries()) {
            let finalAddress = switch (report.customAddress) {
                case (?custom) { custom };
                case (null) { report.address };
            };
            reportList.add((report, finalAddress, report.address, report.coordinates));
        };
        reportList.toArray();
    };

    public shared ({ caller }) func updateReportAdminTable(id : Text, address : Text, coordinates : Text, customAddress : ?Text) : async () {
        AccessControl.initialize(accessControlState, caller);
        if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
            Runtime.trap("Unauthorized: Only admins can update admin table data");
        };
        switch (reports.get(id)) {
            case (null) {
                Runtime.trap("Report not found");
            };
            case (?report) {
                let updatedReport : Report = {
                    report with
                    address;
                    coordinates;
                    customAddress;
                };
                reports.add(id, updatedReport);
            };
        };
    };

    public query func getPaginatedReports(page : Nat, pageSize : Nat) : async [Report] {
        let reportList = List.empty<Report>();
        for ((id, report) in reports.entries()) {
            reportList.add(report);
        };
        let sorted = reportList.toArray();
        let len = sorted.size();
        if (len == 0) {
            return [];
        };
        let start = page * pageSize;
        if (start >= len) {
            return [];
        };
        let end = if (start + pageSize > len) { len } else { start + pageSize };
        Array.tabulate(end - start, func(i : Nat) : Report { sorted[len - 1 - (start + i)] });
    };

    public query func getTotalReportCount() : async Nat {
        reports.size();
    };

    public query func getDirectoryWithPhotos() : async Directory {
        directory;
    };

    public query func getAllRepresentatives() : async [Representative] {
        let repList = List.empty<Representative>();
        for (state in directory.states.vals()) {
            switch (state.cm) {
                case (?cm) { repList.add(cm) };
                case (null) {};
            };
            for (constituency in state.constituencies.vals()) {
                switch (constituency.mp) {
                    case (?mp) { repList.add(mp) };
                    case (null) {};
                };
                for (mla in constituency.mlas.vals()) {
                    repList.add(mla);
                };
            };
        };
        for (ut in directory.unionTerritories.vals()) {
            switch (ut.cm) {
                case (?admin) { repList.add(admin) };
                case (null) {};
            };
        };
        switch (directory.primeMinister) {
            case (?pm) { repList.add(pm) };
            case (null) {};
        };
        repList.toArray();
    };

    public query func getAdminDirectory() : async Directory {
        directory;
    };

    public shared ({ caller }) func registerNgoNpo(organizationName : Text, logoPath : Text, contactPerson : Text, email : Text, phone : Text, address : Text, website : Text, description : Text, missionStatement : Text, showContactInfo : Bool) : async Text {
        AccessControl.initialize(accessControlState, caller);
        let id = Time.now().toText();
        let ngoNpo : NgoNpo = {
            id;
            organizationName;
            logoPath;
            contactPerson;
            email;
            phone;
            address;
            website;
            description;
            missionStatement;
            registrationDate = Time.now();
            approved = false;
            principal = caller;
            rejectionNote = null;
            approvalTimestamp = null;
            impactScore = 0;
            showContactInfo;
        };
        ngoNpos.add(id, ngoNpo);
        id;
    };

    public shared ({ caller }) func approveNgoNpo(ngoNpoId : Text) : async () {
        AccessControl.initialize(accessControlState, caller);
        if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
            Runtime.trap("Unauthorized: Only admins can approve NGOs/NPOs");
        };
        switch (ngoNpos.get(ngoNpoId)) {
            case (null) {
                Runtime.trap("NGO/NPO not found");
            };
            case (?ngoNpo) {
                let updatedNgoNpo : NgoNpo = {
                    ngoNpo with
                    approved = true;
                    rejectionNote = null;
                    approvalTimestamp = ?Time.now();
                };
                ngoNpos.add(ngoNpoId, updatedNgoNpo);
            };
        };
    };

    public shared ({ caller }) func rejectNgoNpo(ngoNpoId : Text, rejectionNote : Text) : async () {
        AccessControl.initialize(accessControlState, caller);
        if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
            Runtime.trap("Unauthorized: Only admins can reject NGOs/NPOs");
        };
        switch (ngoNpos.get(ngoNpoId)) {
            case (null) {
                Runtime.trap("NGO/NPO not found");
            };
            case (?ngoNpo) {
                let updatedNgoNpo : NgoNpo = {
                    ngoNpo with
                    approved = false;
                    rejectionNote = ?rejectionNote;
                    approvalTimestamp = null;
                };
                ngoNpos.add(ngoNpoId, updatedNgoNpo);
            };
        };
    };

    public shared ({ caller }) func updateNgoNpoPrivacy(ngoNpoId : Text, showContactInfo : Bool) : async () {
        AccessControl.initialize(accessControlState, caller);
        switch (ngoNpos.get(ngoNpoId)) {
            case (null) {
                Runtime.trap("NGO/NPO not found");
            };
            case (?ngoNpo) {
                if (ngoNpo.principal != caller and not AccessControl.isAdmin(accessControlState, caller)) {
                    Runtime.trap("Unauthorized: Only the NGO/NPO or an admin can update privacy settings");
                };
                let updatedNgoNpo : NgoNpo = {
                    ngoNpo with
                    showContactInfo;
                };
                ngoNpos.add(ngoNpoId, updatedNgoNpo);
            };
        };
    };

    public query func getNgoNpoDirectory() : async [NgoNpo] {
        let ngoNpoList = List.empty<NgoNpo>();
        for ((id, ngoNpo) in ngoNpos.entries()) {
            if (ngoNpo.approved) {
                ngoNpoList.add(ngoNpo);
            };
        };
        ngoNpoList.toArray();
    };

    public query ({ caller }) func getMyNgoNpoProfile() : async ?NgoNpo {
        var found : ?NgoNpo = null;
        for ((id, ngoNpo) in ngoNpos.entries()) {
            if (ngoNpo.principal == caller) {
                found := ?ngoNpo;
            };
        };
        found;
    };

    public query ({ caller }) func getAllNgoNpos() : async [NgoNpo] {
        let isAdmin = switch (accessControlState.userRoles.get(caller)) { case (?#admin) { true }; case (_) { false } };
        if (not isAdmin) {
            Runtime.trap("Unauthorized: Only admins can view all NGOs/NPOs");
        };
        let ngoNpoList = List.empty<NgoNpo>();
        for ((id, ngoNpo) in ngoNpos.entries()) {
            ngoNpoList.add(ngoNpo);
        };
        ngoNpoList.toArray();
    };

    public query func getNgoNpoById(ngoNpoId : Text) : async ?NgoNpo {
        ngoNpos.get(ngoNpoId);
    };

    public shared func submitFeedback(type_ : Text, message : Text, contactInfo : Text) : async Text {
        let id = Time.now().toText();
        let feedback : Feedback = {
            id;
            type_;
            message;
            contactInfo;
            timestamp = Time.now();
            status = "New";
            response = null;
            admin = null;
        };
        feedbacks.add(id, feedback);
        id;
    };

    public query ({ caller }) func getAllFeedback() : async [Feedback] {
        let isAdmin = switch (accessControlState.userRoles.get(caller)) { case (?#admin) { true }; case (_) { false } };
        if (not isAdmin) {
            Runtime.trap("Unauthorized: Only admins can view feedback");
        };
        let feedbackList = List.empty<Feedback>();
        for ((id, feedback) in feedbacks.entries()) {
            feedbackList.add(feedback);
        };
        feedbackList.toArray();
    };

    public shared ({ caller }) func updateFeedbackStatus(feedbackId : Text, status : Text) : async () {
        AccessControl.initialize(accessControlState, caller);
        if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
            Runtime.trap("Unauthorized: Only admins can update feedback status");
        };
        switch (feedbacks.get(feedbackId)) {
            case (null) {
                Runtime.trap("Feedback not found");
            };
            case (?feedback) {
                let updatedFeedback : Feedback = {
                    feedback with
                    status;
                };
                feedbacks.add(feedbackId, updatedFeedback);
            };
        };
    };

    public shared ({ caller }) func respondToFeedback(feedbackId : Text, response : Text) : async () {
        AccessControl.initialize(accessControlState, caller);
        if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
            Runtime.trap("Unauthorized: Only admins can respond to feedback");
        };
        switch (feedbacks.get(feedbackId)) {
            case (null) {
                Runtime.trap("Feedback not found");
            };
            case (?feedback) {
                let updatedFeedback : Feedback = {
                    feedback with
                    response = ?response;
                    admin = ?caller;
                };
                feedbacks.add(feedbackId, updatedFeedback);
            };
        };
    };

    public query func getFeedbackById(feedbackId : Text) : async ?Feedback {
        feedbacks.get(feedbackId);
    };

    public query func getFeedbackByType(type_ : Text) : async [Feedback] {
        let feedbackList = List.empty<Feedback>();
        for ((id, feedback) in feedbacks.entries()) {
            if (feedback.type_ == type_) {
                feedbackList.add(feedback);
            };
        };
        feedbackList.toArray();
    };

    public query func getFeedbackByStatus(status : Text) : async [Feedback] {
        let feedbackList = List.empty<Feedback>();
        for ((id, feedback) in feedbacks.entries()) {
            if (feedback.status == status) {
                feedbackList.add(feedback);
            };
        };
        feedbackList.toArray();
    };

    public query func getFeedbackByContactInfo(contactInfo : Text) : async [Feedback] {
        let feedbackList = List.empty<Feedback>();
        for ((id, feedback) in feedbacks.entries()) {
            if (feedback.contactInfo == contactInfo) {
                feedbackList.add(feedback);
            };
        };
        feedbackList.toArray();
    };

    public shared ({ caller }) func deleteFeedback(feedbackId : Text) : async () {
        AccessControl.initialize(accessControlState, caller);
        if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
            Runtime.trap("Unauthorized: Only admins can delete feedback");
        };
        switch (feedbacks.get(feedbackId)) {
            case (null) {
                Runtime.trap("Feedback not found");
            };
            case (?feedback) {
                feedbacks.remove(feedbackId);
            };
        };
    };

    public query func getUserRole(caller : Principal) : async Text {
        if (caller.isAnonymous()) { return "guest" };
        let role = switch (accessControlState.userRoles.get(caller)) {
            case (?r) { r };
            case (null) { #guest };
        };
        switch (role) {
            case (#admin) { "admin" };
            case (#user) { "user" };
            case (#guest) { "guest" };
        };
    };

    public query func getConstituenciesByState(stateName : Text) : async [Constituency] {
        var stateFound : ?State = null;
        for (state in directory.states.vals()) {
            if (state.name == stateName) {
                stateFound := ?state;
            };
        };
        switch (stateFound) {
            case (null) { [] };
            case (?state) { state.constituencies };
        };
    };

    public query func getMpByConstituency(constituencyName : Text) : async ?Representative {
        for (state in directory.states.vals()) {
            for (constituency in state.constituencies.vals()) {
                if (constituency.name == constituencyName) {
                    return constituency.mp;
                };
            };
        };
        null;
    };

    public query func getMpByAreaOrBlock(areaOrBlock : Text) : async ?Representative {
        for (state in directory.states.vals()) {
            for (constituency in state.constituencies.vals()) {
                switch (constituency.mp) {
                    case (?mp) {
                        if (mp.remarks.contains(#text areaOrBlock)) {
                            return ?mp;
                        };
                    };
                    case (null) {};
                };
            };
        };
        null;
    };

    public query func getPaginatedReportsOptimized(page : Nat, pageSize : Nat) : async [Report] {
        let reportList = List.empty<Report>();
        for ((id, report) in reports.entries()) {
            reportList.add(report);
        };
        let sorted = reportList.toArray();
        let len = sorted.size();
        if (len == 0) {
            return [];
        };
        let start = page * pageSize;
        if (start >= len) {
            return [];
        };
        let end = if (start + pageSize > len) { len } else { start + pageSize };
        Array.tabulate(end - start, func(i : Nat) : Report { sorted[len - 1 - (start + i)] });
    };

    public query func getInitialReports() : async [Report] {
        let reportList = List.empty<Report>();
        for ((id, report) in reports.entries()) {
            reportList.add(report);
        };
        let sorted = reportList.toArray();
        let len = sorted.size();
        if (len == 0) {
            return [];
        };
        let count = if (len < 10) { len } else { 10 };
        Array.tabulate(count, func(i : Nat) : Report { sorted[len - 1 - i] });
    };

    public query func getNextReports(offset : Nat, count : Nat) : async [Report] {
        let reportList = List.empty<Report>();
        for ((id, report) in reports.entries()) {
            reportList.add(report);
        };
        let sorted = reportList.toArray();
        let len = sorted.size();
        if (len == 0 or offset >= len) {
            return [];
        };
        let actualCount = if (len < offset + count) { len - offset } else { count };
        Array.tabulate(actualCount, func(i : Nat) : Report { sorted[len - 1 - (offset + i)] });
    };

    public shared ({ caller }) func trackUniqueVisitor() : async () {
        // Auto-initialize caller so getCallerUserRole never traps for this user
        AccessControl.initialize(accessControlState, caller);
        if (not uniqueVisitors.containsKey(caller)) {
            uniqueVisitors.add(caller, true);
        };
    };

    public query func getTotalUniqueVisitors() : async Nat {
        uniqueVisitors.size();
    };

};
