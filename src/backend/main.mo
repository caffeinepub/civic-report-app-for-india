import Registry "blob-storage/registry";
import BlobStorage "blob-storage/Mixin";
import OrderedMap "mo:base/OrderedMap";
import Text "mo:base/Text";
import Time "mo:base/Time";
import List "mo:base/List";
import Int "mo:base/Int";
import Principal "mo:base/Principal";
import Array "mo:base/Array";
import Debug "mo:base/Debug";
import AccessControl "authorization/access-control";
import UserApproval "user-approval/approval";
import Nat "mo:base/Nat";

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

    let registry = Registry.new();
    transient let reportMap = OrderedMap.Make<Text>(Text.compare);
    transient let principalMap = OrderedMap.Make<Principal>(Principal.compare);
    transient let volunteerMap = OrderedMap.Make<Text>(Text.compare);
    transient let ngoNpoMap = OrderedMap.Make<Text>(Text.compare);
    transient let feedbackMap = OrderedMap.Make<Text>(Text.compare);
    transient let pendingEditMap = OrderedMap.Make<Text>(Text.compare);

    var reports = reportMap.empty<Report>();
    let accessControlState = AccessControl.initState();
    var logoState : LogoState = {
        currentLogo = "";
        history = [];
    };
    var roadmapFeatures : [RoadmapFeature] = [];
    var volunteers = volunteerMap.empty<Volunteer>();
    var directory : Directory = {
        states = [];
        unionTerritories = [];
        administrativeUnits = [];
        primeMinister = null;
    };
    var ngoNpos = ngoNpoMap.empty<NgoNpo>();
    var feedbacks = feedbackMap.empty<Feedback>();
    var uniqueVisitors = principalMap.empty<Bool>();
    var pendingProfileEdits = pendingEditMap.empty<PendingProfileEdit>();

    let approvalState = UserApproval.initState(accessControlState);

    public shared ({ caller }) func registerFileReference(path : Text, hash : Text) : async () {
        if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
            Debug.trap("Unauthorized: Only authenticated users can register file references");
        };
        Registry.add(registry, path, hash);
    };

    public query func getFileReference(path : Text) : async Registry.FileReference {
        Registry.get(registry, path);
    };

    public query func listFileReferences() : async [Registry.FileReference] {
        Registry.list(registry);
    };

    public shared ({ caller }) func dropFileReference(path : Text) : async () {
        if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
            Debug.trap("Unauthorized: Only admins can drop file references");
        };
        Registry.remove(registry, path);
    };

    public shared ({ caller }) func submitReport(photoPath : Text, latitude : Float, longitude : Float, username : ?Text, notes : ?Text, issueType : Text, mlaName : ?Text, mlaPhotoPath : ?Text, pmPhotoPath : ?Text, cmPhotoPath : ?Text, pmName : ?Text, cmName : ?Text, customAddress : ?Text, state : Text, mlaDesignation : Text, isVolunteer : Bool, pmData : ?Representative, cmData : ?Representative, mpData : ?Representative, address : Text, coordinates : Text, localCivicBody : ?LocalCivicBody) : async Text {
        let id = Int.toText(Time.now());
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
        reports := reportMap.put(reports, id, report);

        if (isVolunteer) {
            var volunteerList = List.nil<Volunteer>();
            for ((vid, volunteer) in volunteerMap.entries(volunteers)) {
                if (volunteer.principal == caller) {
                    volunteerList := List.push(volunteer, volunteerList);
                };
            };
            switch (List.last(volunteerList)) {
                case (null) {};
                case (?volunteer) {
                    let updatedVolunteer : Volunteer = {
                        volunteer with
                        impactScore = volunteer.impactScore + 10
                    };
                    volunteers := volunteerMap.put(volunteers, volunteer.id, updatedVolunteer);
                };
            };
        };

        id;
    };

    public query func getReport(id : Text) : async ?Report {
        reportMap.get(reports, id);
    };

    public query func getAllReports() : async [Report] {
        var reportList = List.nil<Report>();
        for ((id, report) in reportMap.entries(reports)) {
            reportList := List.push(report, reportList);
        };
        List.toArray(reportList);
    };

    public shared ({ caller }) func updateReportStatus(id : Text, newStatus : Text, proofPhotoPath : Text, reporterName : Text, completionNotes : ?Text, isVolunteer : Bool) : async Bool {
        if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
            Debug.trap("Unauthorized: Only authenticated users can update report status");
        };
        switch (reportMap.get(reports, id)) {
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
                reports := reportMap.put(reports, id, updatedReport);

                if (isVolunteer and newStatus == "Resolved") {
                    var volunteerList = List.nil<Volunteer>();
                    for ((vid, volunteer) in volunteerMap.entries(volunteers)) {
                        if (volunteer.principal == caller) {
                            volunteerList := List.push(volunteer, volunteerList);
                        };
                    };
                    switch (List.last(volunteerList)) {
                        case (null) {};
                        case (?volunteer) {
                            let updatedVolunteer : Volunteer = {
                                volunteer with
                                impactScore = volunteer.impactScore + 10
                            };
                            volunteers := volunteerMap.put(volunteers, volunteer.id, updatedVolunteer);
                        };
                    };
                };

                true;
            };
        };
    };

    public query func getRecentReports(count : Nat) : async [Report] {
        var reportList = List.nil<Report>();
        for ((id, report) in reportMap.entries(reports)) {
            reportList := List.push(report, reportList);
        };
        let sortedList = List.toArray(reportList);
        let sorted = List.toArray(reportList);
        let len = sorted.size();
        if (len == 0) {
            return [];
        };
        let actualCount = if (len < count) { len } else { count };
        Array.tabulate(actualCount, func(i : Nat) : Report { sorted[len - 1 - i] });
    };

    public query func getReportsByState(state : Text) : async [Report] {
        var reportList = List.nil<Report>();
        for ((id, report) in reportMap.entries(reports)) {
            if (report.state == state) {
                reportList := List.push(report, reportList);
            };
        };
        List.toArray(reportList);
    };

    public shared ({ caller }) func deleteReport(id : Text) : async () {
        if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
            Debug.trap("Unauthorized: Only admins can delete reports");
        };
        switch (reportMap.get(reports, id)) {
            case (null) {
                Debug.trap("Report not found");
            };
            case (?report) {
                if (report.submittedByVolunteer) {
                    var volunteerList = List.nil<Volunteer>();
                    for ((vid, volunteer) in volunteerMap.entries(volunteers)) {
                        if (volunteer.principal == caller) {
                            volunteerList := List.push(volunteer, volunteerList);
                        };
                    };
                    switch (List.last(volunteerList)) {
                        case (null) {};
                        case (?volunteer) {
                            let updatedVolunteer : Volunteer = {
                                volunteer with
                                impactScore = Int.max(0, volunteer.impactScore - 10)
                            };
                            volunteers := volunteerMap.put(volunteers, volunteer.id, updatedVolunteer);
                        };
                    };
                };
                reports := reportMap.remove(reports, id).0;
            };
        };
    };

    public shared ({ caller }) func initializeAccessControl() : async () {
        AccessControl.initialize(accessControlState, caller);
    };

    public query ({ caller }) func getCallerUserRole() : async AccessControl.UserRole {
        AccessControl.getUserRole(accessControlState, caller);
    };

    public shared ({ caller }) func assignCallerUserRole(user : Principal, role : AccessControl.UserRole) : async () {
        AccessControl.assignRole(accessControlState, caller, user, role);
    };

    public query ({ caller }) func isCallerAdmin() : async Bool {
        AccessControl.isAdmin(accessControlState, caller);
    };

    public type UserProfile = {
        name : Text;
    };

    var userProfiles = principalMap.empty<UserProfile>();

    public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
        if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
            Debug.trap("Unauthorized: Only authenticated users can view profiles");
        };
        principalMap.get(userProfiles, caller);
    };

    public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
        if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
            Debug.trap("Unauthorized: Can only view your own profile");
        };
        principalMap.get(userProfiles, user);
    };

    public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
        if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
            Debug.trap("Unauthorized: Only authenticated users can save profiles");
        };
        userProfiles := principalMap.put(userProfiles, caller, profile);
    };

    public query func getCurrentLogo() : async Text {
        logoState.currentLogo;
    };

    public shared ({ caller }) func uploadLogo(logoData : Text) : async () {
        if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
            Debug.trap("Unauthorized: Only admins can upload logos");
        };
        let newHistory : [LogoHistory] = Array.append(
            logoState.history,
            [{ logoData; timestamp = Time.now(); admin = caller }],
        );
        logoState := {
            currentLogo = logoData;
            history = newHistory;
        };
    };

    public query ({ caller }) func getLogoHistory() : async [LogoHistory] {
        if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
            Debug.trap("Unauthorized: Only admins can view logo history");
        };
        logoState.history;
    };

    public query ({ caller }) func getAdmins() : async [Principal] {
        if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
            Debug.trap("Unauthorized: Only admins can view admin list");
        };
        var adminList = List.nil<Principal>();
        for ((principal, role) in principalMap.entries(accessControlState.userRoles)) {
            switch (role) {
                case (#admin) {
                    adminList := List.push(principal, adminList);
                };
                case (_) {};
            };
        };
        List.toArray(adminList);
    };

    public shared ({ caller }) func addAdmin(newAdmin : Principal) : async () {
        if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
            Debug.trap("Unauthorized: Only admins can add new admins");
        };
        AccessControl.assignRole(accessControlState, caller, newAdmin, #admin);
    };

    public shared ({ caller }) func removeAdmin(adminToRemove : Principal) : async () {
        if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
            Debug.trap("Unauthorized: Only admins can remove admins");
        };
        if (caller == adminToRemove) {
            Debug.trap("Cannot remove yourself as admin");
        };
        AccessControl.assignRole(accessControlState, caller, adminToRemove, #user);
    };

    public shared ({ caller }) func updateReport(id : Text, updatedReport : Report) : async () {
        if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
            Debug.trap("Unauthorized: Only admins can update reports");
        };
        switch (reportMap.get(reports, id)) {
            case (null) {
                Debug.trap("Report not found");
            };
            case (?existingReport) {
                reports := reportMap.put(reports, id, updatedReport);
            };
        };
    };

    public shared ({ caller }) func updateLocalCivicBody(id : Text, bodyType : Text, bodyName : Text, representativeName : Text, photoPath : ?Text) : async () {
        if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
            Debug.trap("Unauthorized: Only admins can update local civic body details");
        };
        switch (reportMap.get(reports, id)) {
            case (null) {
                Debug.trap("Report not found");
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
                reports := reportMap.put(reports, id, updatedReport);
            };
        };
    };

    public query func getRoadmapFeatures() : async [RoadmapFeature] {
        roadmapFeatures;
    };

    public shared ({ caller }) func createFeature(sectionId : Text, featureData : RoadmapFeature) : async () {
        if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
            Debug.trap("Unauthorized: Only admins can create features");
        };
        let id = Int.toText(Time.now());
        let feature : RoadmapFeature = {
            featureData with
            id;
            sectionId;
            timestamp = Time.now();
        };
        roadmapFeatures := Array.append(roadmapFeatures, [feature]);
    };

    public shared ({ caller }) func updateFeature(featureId : Text, featureData : RoadmapFeature) : async () {
        if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
            Debug.trap("Unauthorized: Only admins can update features");
        };
        var found = false;
        let updatedFeatures = Array.map<RoadmapFeature, RoadmapFeature>(
            roadmapFeatures,
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
            Debug.trap("Feature not found");
        };
        roadmapFeatures := updatedFeatures;
    };

    public shared ({ caller }) func deleteFeature(featureId : Text) : async () {
        if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
            Debug.trap("Unauthorized: Only admins can delete features");
        };
        let filteredFeatures = Array.filter<RoadmapFeature>(
            roadmapFeatures,
            func(feature) { feature.id != featureId },
        );
        if (filteredFeatures.size() == roadmapFeatures.size()) {
            Debug.trap("Feature not found");
        };
        roadmapFeatures := filteredFeatures;
    };

    public shared ({ caller }) func moveFeature(featureId : Text, newSectionId : Text) : async () {
        if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
            Debug.trap("Unauthorized: Only admins can move features");
        };
        var found = false;
        let updatedFeatures = Array.map<RoadmapFeature, RoadmapFeature>(
            roadmapFeatures,
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
            Debug.trap("Feature not found");
        };
        roadmapFeatures := updatedFeatures;
    };

    public query ({ caller }) func isCallerApproved() : async Bool {
        AccessControl.hasPermission(accessControlState, caller, #admin) or UserApproval.isApproved(approvalState, caller);
    };

    public shared ({ caller }) func requestApproval() : async () {
        UserApproval.requestApproval(approvalState, caller);
    };

    public shared ({ caller }) func setApproval(user : Principal, status : UserApproval.ApprovalStatus) : async () {
        if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
            Debug.trap("Unauthorized: Only admins can perform this action");
        };
        UserApproval.setApproval(approvalState, user, status);
    };

    public query ({ caller }) func listApprovals() : async [UserApproval.UserApprovalInfo] {
        if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
            Debug.trap("Unauthorized: Only admins can perform this action");
        };
        UserApproval.listApprovals(approvalState);
    };

    public shared ({ caller }) func applyVolunteer(name : Text, photoPath : Text, contactInfo : Text, address : Text, showFullMobile : Bool) : async Text {
        let id = Int.toText(Time.now());
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
        volunteers := volunteerMap.put(volunteers, id, volunteer);
        id;
    };

    public shared ({ caller }) func approveVolunteer(volunteerId : Text) : async () {
        if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
            Debug.trap("Unauthorized: Only admins can approve volunteers");
        };
        switch (volunteerMap.get(volunteers, volunteerId)) {
            case (null) {
                Debug.trap("Volunteer not found");
            };
            case (?volunteer) {
                let updatedVolunteer : Volunteer = {
                    volunteer with
                    approved = true;
                    rejectionNote = null;
                    approvalTimestamp = ?Time.now();
                };
                volunteers := volunteerMap.put(volunteers, volunteerId, updatedVolunteer);
            };
        };
    };

    public shared ({ caller }) func rejectVolunteer(volunteerId : Text, rejectionNote : Text) : async () {
        if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
            Debug.trap("Unauthorized: Only admins can reject volunteers");
        };
        switch (volunteerMap.get(volunteers, volunteerId)) {
            case (null) {
                Debug.trap("Volunteer not found");
            };
            case (?volunteer) {
                let updatedVolunteer : Volunteer = {
                    volunteer with
                    approved = false;
                    rejectionNote = ?rejectionNote;
                    approvalTimestamp = null;
                };
                volunteers := volunteerMap.put(volunteers, volunteerId, updatedVolunteer);
            };
        };
    };

    public shared ({ caller }) func updateVolunteerPrivacy(volunteerId : Text, showFullMobile : Bool) : async () {
        switch (volunteerMap.get(volunteers, volunteerId)) {
            case (null) {
                Debug.trap("Volunteer not found");
            };
            case (?volunteer) {
                if (volunteer.principal != caller and not AccessControl.isAdmin(accessControlState, caller)) {
                    Debug.trap("Unauthorized: Only the volunteer or an admin can update privacy settings");
                };
                let updatedVolunteer : Volunteer = {
                    volunteer with
                    showFullMobile;
                };
                volunteers := volunteerMap.put(volunteers, volunteerId, updatedVolunteer);
            };
        };
    };

    public shared ({ caller }) func submitVolunteerProfileEdit(volunteerId : Text, updates : VolunteerProfileUpdate) : async Text {
        switch (volunteerMap.get(volunteers, volunteerId)) {
            case (null) {
                Debug.trap("Volunteer not found");
            };
            case (?volunteer) {
                if (volunteer.principal != caller) {
                    Debug.trap("Unauthorized: Only the volunteer can edit their own profile");
                };
                if (not volunteer.approved) {
                    Debug.trap("Unauthorized: Only approved volunteers can edit their profile");
                };
                
                let editId = Int.toText(Time.now());
                let pendingEdit : PendingProfileEdit = {
                    id = editId;
                    volunteerId;
                    volunteerPrincipal = caller;
                    updates;
                    submittedAt = Time.now();
                    status = "Pending";
                    rejectionNote = null;
                };
                pendingProfileEdits := pendingEditMap.put(pendingProfileEdits, editId, pendingEdit);
                editId;
            };
        };
    };

    public query ({ caller }) func getMyPendingProfileEdit() : async ?PendingProfileEdit {
        var pendingList = List.nil<PendingProfileEdit>();
        for ((editId, edit) in pendingEditMap.entries(pendingProfileEdits)) {
            if (edit.volunteerPrincipal == caller and edit.status == "Pending") {
                pendingList := List.push(edit, pendingList);
            };
        };
        List.last(pendingList);
    };

    public query ({ caller }) func getMyProfileEditHistory() : async [PendingProfileEdit] {
        var editList = List.nil<PendingProfileEdit>();
        for ((editId, edit) in pendingEditMap.entries(pendingProfileEdits)) {
            if (edit.volunteerPrincipal == caller) {
                editList := List.push(edit, editList);
            };
        };
        List.toArray(editList);
    };

    public query ({ caller }) func getAllPendingProfileEdits() : async [PendingProfileEdit] {
        if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
            Debug.trap("Unauthorized: Only admins can view all pending profile edits");
        };
        var editList = List.nil<PendingProfileEdit>();
        for ((editId, edit) in pendingEditMap.entries(pendingProfileEdits)) {
            if (edit.status == "Pending") {
                editList := List.push(edit, editList);
            };
        };
        List.toArray(editList);
    };

    public shared ({ caller }) func approveVolunteerProfileEdit(editId : Text) : async () {
        if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
            Debug.trap("Unauthorized: Only admins can approve profile edits");
        };
        switch (pendingEditMap.get(pendingProfileEdits, editId)) {
            case (null) {
                Debug.trap("Pending edit not found");
            };
            case (?edit) {
                if (edit.status != "Pending") {
                    Debug.trap("Edit has already been processed");
                };
                
                switch (volunteerMap.get(volunteers, edit.volunteerId)) {
                    case (null) {
                        Debug.trap("Volunteer not found");
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
                        volunteers := volunteerMap.put(volunteers, edit.volunteerId, updatedVolunteer);
                        
                        let updatedEdit : PendingProfileEdit = {
                            edit with
                            status = "Approved";
                        };
                        pendingProfileEdits := pendingEditMap.put(pendingProfileEdits, editId, updatedEdit);
                    };
                };
            };
        };
    };

    public shared ({ caller }) func rejectVolunteerProfileEdit(editId : Text, rejectionNote : Text) : async () {
        if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
            Debug.trap("Unauthorized: Only admins can reject profile edits");
        };
        switch (pendingEditMap.get(pendingProfileEdits, editId)) {
            case (null) {
                Debug.trap("Pending edit not found");
            };
            case (?edit) {
                if (edit.status != "Pending") {
                    Debug.trap("Edit has already been processed");
                };
                
                let updatedEdit : PendingProfileEdit = {
                    edit with
                    status = "Rejected";
                    rejectionNote = ?rejectionNote;
                };
                pendingProfileEdits := pendingEditMap.put(pendingProfileEdits, editId, updatedEdit);
            };
        };
    };

    public query func getVolunteerDirectory() : async [Volunteer] {
        var volunteerList = List.nil<Volunteer>();
        for ((id, volunteer) in volunteerMap.entries(volunteers)) {
            if (volunteer.approved) {
                volunteerList := List.push(volunteer, volunteerList);
            };
        };
        List.toArray(volunteerList);
    };

    public query ({ caller }) func getMyVolunteerProfile() : async ?Volunteer {
        var volunteerList = List.nil<Volunteer>();
        for ((id, volunteer) in volunteerMap.entries(volunteers)) {
            if (volunteer.principal == caller) {
                volunteerList := List.push(volunteer, volunteerList);
            };
        };
        List.last(volunteerList);
    };

    public query ({ caller }) func getAllVolunteers() : async [Volunteer] {
        if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
            Debug.trap("Unauthorized: Only admins can view all volunteers");
        };
        var volunteerList = List.nil<Volunteer>();
        for ((id, volunteer) in volunteerMap.entries(volunteers)) {
            volunteerList := List.push(volunteer, volunteerList);
        };
        List.toArray(volunteerList);
    };

    public query func getVolunteerById(volunteerId : Text) : async ?Volunteer {
        volunteerMap.get(volunteers, volunteerId);
    };

    public shared ({ caller }) func addState(stateName : Text, cm : ?Representative, isUnionTerritory : Bool) : async () {
        if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
            Debug.trap("Unauthorized: Only admins can add states");
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
                unionTerritories = Array.append(directory.unionTerritories, [newState]);
            };
        } else {
            directory := {
                directory with
                states = Array.append(directory.states, [newState]);
            };
        };
    };

    public shared ({ caller }) func addUnionTerritory(utName : Text, administrator : ?Representative) : async () {
        if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
            Debug.trap("Unauthorized: Only admins can add union territories");
        };
        let newUT : State = {
            name = utName;
            cm = administrator;
            constituencies = [];
            isUnionTerritory = true;
        };
        directory := {
            directory with
            unionTerritories = Array.append(directory.unionTerritories, [newUT]);
        };
    };

    public shared ({ caller }) func addConstituency(stateName : Text, constituencyName : Text) : async () {
        if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
            Debug.trap("Unauthorized: Only admins can add constituencies");
        };

        var found = false;

        let updatedStates = Array.map<State, State>(
            directory.states,
            func(state) {
                if (state.name == stateName) {
                    found := true;
                    {
                        state with
                        constituencies = Array.append(state.constituencies, [{
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
            let updatedUTs = Array.map<State, State>(
                directory.unionTerritories,
                func(ut) {
                    if (ut.name == stateName) {
                        found := true;
                        {
                            ut with
                            constituencies = Array.append(ut.constituencies, [{
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
                Debug.trap("State or Union Territory not found");
            };
            directory := { directory with unionTerritories = updatedUTs };
        } else {
            directory := { directory with states = updatedStates };
        };
    };

    public shared ({ caller }) func addMpToConstituency(stateName : Text, constituencyName : Text, mp : Representative) : async () {
        if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
            Debug.trap("Unauthorized: Only admins can add MPs");
        };

        var stateFound = false;
        var constituencyFound = false;
        var isUT = false;

        let updatedStates = Array.map<State, State>(
            directory.states,
            func(state) {
                if (state.name == stateName) {
                    stateFound := true;
                    {
                        state with
                        constituencies = Array.map<Constituency, Constituency>(
                            state.constituencies,
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
                Debug.trap("Constituency not found");
            };
            directory := { directory with states = updatedStates };
        } else {
            let updatedUTs = Array.map<State, State>(
                directory.unionTerritories,
                func(ut) {
                    if (ut.name == stateName) {
                        stateFound := true;
                        isUT := true;
                        {
                            ut with
                            constituencies = Array.map<Constituency, Constituency>(
                                ut.constituencies,
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
                Debug.trap("State or Union Territory not found");
            };
            if (not constituencyFound) {
                Debug.trap("Constituency not found");
            };
            directory := { directory with unionTerritories = updatedUTs };
        };
    };

    public shared ({ caller }) func addMlaToConstituency(stateName : Text, constituencyName : Text, mla : Representative) : async () {
        if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
            Debug.trap("Unauthorized: Only admins can add MLAs");
        };

        var stateFound = false;
        var constituencyFound = false;
        var isUT = false;

        let updatedStates = Array.map<State, State>(
            directory.states,
            func(state) {
                if (state.name == stateName) {
                    stateFound := true;
                    {
                        state with
                        constituencies = Array.map<Constituency, Constituency>(
                            state.constituencies,
                            func(constituency) {
                                if (constituency.name == constituencyName) {
                                    constituencyFound := true;
                                    {
                                        constituency with
                                        mlas = Array.append(constituency.mlas, [mla]);
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
                Debug.trap("Constituency not found");
            };
            directory := { directory with states = updatedStates };
        } else {
            let updatedUTs = Array.map<State, State>(
                directory.unionTerritories,
                func(ut) {
                    if (ut.name == stateName) {
                        stateFound := true;
                        isUT := true;
                        {
                            ut with
                            constituencies = Array.map<Constituency, Constituency>(
                                ut.constituencies,
                                func(constituency) {
                                    if (constituency.name == constituencyName) {
                                        constituencyFound := true;
                                        {
                                            constituency with
                                            mlas = Array.append(constituency.mlas, [mla]);
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
                Debug.trap("State or Union Territory not found");
            };
            if (not constituencyFound) {
                Debug.trap("Constituency not found");
            };
            directory := { directory with unionTerritories = updatedUTs };
        };
    };

    public shared ({ caller }) func addAdministrativeUnit(name : Text, unitType : Text, parentState : ?Text, parentConstituency : ?Text) : async () {
        if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
            Debug.trap("Unauthorized: Only admins can add administrative units");
        };
        let newUnit : AdministrativeUnit = {
            name;
            unitType;
            parentState;
            parentConstituency;
        };
        directory := {
            directory with
            administrativeUnits = Array.append(directory.administrativeUnits, [newUnit]);
        };
    };

    public shared ({ caller }) func setPrimeMinister(pm : Representative) : async () {
        if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
            Debug.trap("Unauthorized: Only admins can set the Prime Minister");
        };
        directory := { directory with primeMinister = ?pm };
    };

    public query func getDirectory() : async Directory {
        directory;
    };

    public query func getState(stateName : Text) : async ?State {
        var stateList = List.nil<State>();
        for (state in directory.states.vals()) {
            if (state.name == stateName) {
                stateList := List.push(state, stateList);
            };
        };
        List.last(stateList);
    };

    public query func getUnionTerritory(utName : Text) : async ?State {
        var utList = List.nil<State>();
        for (ut in directory.unionTerritories.vals()) {
            if (ut.name == utName) {
                utList := List.push(ut, utList);
            };
        };
        List.last(utList);
    };

    public query func getConstituency(stateName : Text, constituencyName : Text) : async ?Constituency {
        var stateList = List.nil<State>();
        for (state in directory.states.vals()) {
            if (state.name == stateName) {
                stateList := List.push(state, stateList);
            };
        };
        switch (List.last(stateList)) {
            case (null) { null };
            case (?state) {
                var constituencyList = List.nil<Constituency>();
                for (constituency in state.constituencies.vals()) {
                    if (constituency.name == constituencyName) {
                        constituencyList := List.push(constituency, constituencyList);
                    };
                };
                List.last(constituencyList);
            };
        };
    };

    public query func getAdministrativeUnits() : async [AdministrativeUnit] {
        directory.administrativeUnits;
    };

    public shared ({ caller }) func updateRepresentative(stateName : Text, constituencyName : Text, repType : Text, representative : Representative) : async () {
        if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
            Debug.trap("Unauthorized: Only admins can update representatives");
        };

        var stateFound = false;
        var constituencyFound = false;

        let updatedStates = Array.map<State, State>(
            directory.states,
            func(state) {
                if (state.name == stateName) {
                    stateFound := true;
                    {
                        state with
                        constituencies = Array.map<Constituency, Constituency>(
                            state.constituencies,
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
                                                mlas = Array.append(constituency.mlas, [representative]);
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
            let updatedUTs = Array.map<State, State>(
                directory.unionTerritories,
                func(ut) {
                    if (ut.name == stateName) {
                        stateFound := true;
                        {
                            ut with
                            constituencies = Array.map<Constituency, Constituency>(
                                ut.constituencies,
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
                                                    mlas = Array.append(constituency.mlas, [representative]);
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
                Debug.trap("State or Union Territory not found");
            };
            if (not constituencyFound) {
                Debug.trap("Constituency not found");
            };
            directory := { directory with unionTerritories = updatedUTs };
        } else {
            if (not constituencyFound) {
                Debug.trap("Constituency not found");
            };
            directory := { directory with states = updatedStates };
        };
    };

    public shared ({ caller }) func updateDirectory(newDirectory : Directory) : async () {
        if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
            Debug.trap("Unauthorized: Only admins can update the directory");
        };
        directory := newDirectory;
    };

    public shared ({ caller }) func deleteConstituency(stateName : Text, constituencyName : Text) : async () {
        if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
            Debug.trap("Unauthorized: Only admins can delete constituencies");
        };

        var stateFound = false;
        var constituencyFound = false;

        let updatedStates = Array.map<State, State>(
            directory.states,
            func(state) {
                if (state.name == stateName) {
                    stateFound := true;
                    {
                        state with
                        constituencies = Array.filter<Constituency>(
                            state.constituencies,
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
            let updatedUTs = Array.map<State, State>(
                directory.unionTerritories,
                func(ut) {
                    if (ut.name == stateName) {
                        stateFound := true;
                        {
                            ut with
                            constituencies = Array.filter<Constituency>(
                                ut.constituencies,
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
                Debug.trap("State or Union Territory not found");
            };
            if (not constituencyFound) {
                Debug.trap("Constituency not found");
            };
            directory := { directory with unionTerritories = updatedUTs };
        } else {
            if (not constituencyFound) {
                Debug.trap("Constituency not found");
            };
            directory := { directory with states = updatedStates };
        };
    };

    public shared ({ caller }) func deleteRepresentative(stateName : Text, constituencyName : Text, repType : Text) : async () {
        if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
            Debug.trap("Unauthorized: Only admins can delete representatives");
        };

        var stateFound = false;
        var constituencyFound = false;

        let updatedStates = Array.map<State, State>(
            directory.states,
            func(state) {
                if (state.name == stateName) {
                    stateFound := true;
                    {
                        state with
                        constituencies = Array.map<Constituency, Constituency>(
                            state.constituencies,
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
            let updatedUTs = Array.map<State, State>(
                directory.unionTerritories,
                func(ut) {
                    if (ut.name == stateName) {
                        stateFound := true;
                        {
                            ut with
                            constituencies = Array.map<Constituency, Constituency>(
                                ut.constituencies,
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
                Debug.trap("State or Union Territory not found");
            };
            if (not constituencyFound) {
                Debug.trap("Constituency not found");
            };
            directory := { directory with unionTerritories = updatedUTs };
        } else {
            if (not constituencyFound) {
                Debug.trap("Constituency not found");
            };
            directory := { directory with states = updatedStates };
        };
    };

    public shared ({ caller }) func updateState(stateName : Text, updatedState : State) : async () {
        if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
            Debug.trap("Unauthorized: Only admins can update states");
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
            Debug.trap("State not found");
        };
        
        if (foundInStates and updatedState.isUnionTerritory) {
            let filteredStates = Array.filter<State>(
                directory.states,
                func(state) { state.name != stateName },
            );
            directory := {
                directory with
                states = filteredStates;
                unionTerritories = Array.append(directory.unionTerritories, [updatedState]);
            };
        } else if (foundInUTs and not updatedState.isUnionTerritory) {
            let filteredUTs = Array.filter<State>(
                directory.unionTerritories,
                func(ut) { ut.name != stateName },
            );
            directory := {
                directory with
                states = Array.append(directory.states, [updatedState]);
                unionTerritories = filteredUTs;
            };
        } else if (foundInStates) {
            let updatedStates = Array.map<State, State>(
                directory.states,
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
            let updatedUTs = Array.map<State, State>(
                directory.unionTerritories,
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
        if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
            Debug.trap("Unauthorized: Only admins can update union territories");
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
            Debug.trap("Union territory not found");
        };
        
        if (foundInUTs and not updatedUT.isUnionTerritory) {
            let filteredUTs = Array.filter<State>(
                directory.unionTerritories,
                func(ut) { ut.name != utName },
            );
            directory := {
                directory with
                states = Array.append(directory.states, [updatedUT]);
                unionTerritories = filteredUTs;
            };
        } else if (foundInStates and updatedUT.isUnionTerritory) {
            let filteredStates = Array.filter<State>(
                directory.states,
                func(state) { state.name != utName },
            );
            directory := {
                directory with
                states = filteredStates;
                unionTerritories = Array.append(directory.unionTerritories, [updatedUT]);
            };
        } else if (foundInUTs) {
            let updatedUTs = Array.map<State, State>(
                directory.unionTerritories,
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
            let updatedStates = Array.map<State, State>(
                directory.states,
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
        if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
            Debug.trap("Unauthorized: Only admins can update constituencies");
        };

        var stateFound = false;
        var constituencyFound = false;

        let updatedStates = Array.map<State, State>(
            directory.states,
            func(state) {
                if (state.name == stateName) {
                    stateFound := true;
                    {
                        state with
                        constituencies = Array.map<Constituency, Constituency>(
                            state.constituencies,
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
            let updatedUTs = Array.map<State, State>(
                directory.unionTerritories,
                func(ut) {
                    if (ut.name == stateName) {
                        stateFound := true;
                        {
                            ut with
                            constituencies = Array.map<Constituency, Constituency>(
                                ut.constituencies,
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
                Debug.trap("State or Union Territory not found");
            };
            if (not constituencyFound) {
                Debug.trap("Constituency not found");
            };
            directory := { directory with unionTerritories = updatedUTs };
        } else {
            if (not constituencyFound) {
                Debug.trap("Constituency not found");
            };
            directory := { directory with states = updatedStates };
        };
    };

    public shared ({ caller }) func updateRepresentativeDetails(stateName : Text, constituencyName : Text, repType : Text, repName : Text, updatedRep : Representative) : async () {
        if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
            Debug.trap("Unauthorized: Only admins can update representatives");
        };

        var stateFound = false;
        var constituencyFound = false;
        var repFound = false;

        let updatedStates = Array.map<State, State>(
            directory.states,
            func(state) {
                if (state.name == stateName) {
                    stateFound := true;
                    {
                        state with
                        constituencies = Array.map<Constituency, Constituency>(
                            state.constituencies,
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
                                                mlas = Array.map<Representative, Representative>(
                                                    constituency.mlas,
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
            let updatedUTs = Array.map<State, State>(
                directory.unionTerritories,
                func(ut) {
                    if (ut.name == stateName) {
                        stateFound := true;
                        {
                            ut with
                            constituencies = Array.map<Constituency, Constituency>(
                                ut.constituencies,
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
                                                    mlas = Array.map<Representative, Representative>(
                                                        constituency.mlas,
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
                Debug.trap("State or Union Territory not found");
            };
            if (not constituencyFound) {
                Debug.trap("Constituency not found");
            };
            if (repType == "mla" and not repFound) {
                Debug.trap("MLA not found");
            };
            directory := { directory with unionTerritories = updatedUTs };
        } else {
            if (not constituencyFound) {
                Debug.trap("Constituency not found");
            };
            if (repType == "mla" and not repFound) {
                Debug.trap("MLA not found");
            };
            directory := { directory with states = updatedStates };
        };
    };

    public shared ({ caller }) func updateAdministrativeUnit(name : Text, updatedUnit : AdministrativeUnit) : async () {
        if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
            Debug.trap("Unauthorized: Only admins can update administrative units");
        };
        var found = false;
        let updatedUnits = Array.map<AdministrativeUnit, AdministrativeUnit>(
            directory.administrativeUnits,
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
            Debug.trap("Administrative unit not found");
        };
        directory := { directory with administrativeUnits = updatedUnits };
    };

    public shared ({ caller }) func exportDirectory() : async Directory {
        if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
            Debug.trap("Unauthorized: Only admins can export the directory");
        };
        directory;
    };

    public shared ({ caller }) func importDirectory(newDirectory : Directory) : async () {
        if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
            Debug.trap("Unauthorized: Only admins can import the directory");
        };
        directory := newDirectory;
    };

    public query func getReportsWithLocations() : async [(Report, { latitude : Float; longitude : Float })] {
        var reportList = List.nil<(Report, { latitude : Float; longitude : Float })>();
        for ((id, report) in reportMap.entries(reports)) {
            reportList := List.push((report, report.location), reportList);
        };
        List.toArray(reportList);
    };

    public query func getReportsWithPhotos() : async [(Report, Text)] {
        var reportList = List.nil<(Report, Text)>();
        for ((id, report) in reportMap.entries(reports)) {
            reportList := List.push((report, report.photoPath), reportList);
        };
        List.toArray(reportList);
    };

    public query func getReportsWithMinisterPhotos() : async [(Report, ?Text, ?Text, ?Text)] {
        var reportList = List.nil<(Report, ?Text, ?Text, ?Text)>();
        for ((id, report) in reportMap.entries(reports)) {
            reportList := List.push((report, report.mlaPhotoPath, report.pmPhotoPath, report.cmPhotoPath), reportList);
        };
        List.toArray(reportList);
    };

    public shared ({ caller }) func updateReportLocation(id : Text, latitude : Float, longitude : Float) : async () {
        if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
            Debug.trap("Unauthorized: Only admins can update report locations");
        };
        switch (reportMap.get(reports, id)) {
            case (null) {
                Debug.trap("Report not found");
            };
            case (?report) {
                let updatedReport : Report = {
                    report with
                    location = { latitude; longitude };
                };
                reports := reportMap.put(reports, id, updatedReport);
            };
        };
    };

    public shared ({ caller }) func updateReportPhoto(id : Text, photoPath : Text) : async () {
        if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
            Debug.trap("Unauthorized: Only admins can update report photos");
        };
        switch (reportMap.get(reports, id)) {
            case (null) {
                Debug.trap("Report not found");
            };
            case (?report) {
                let updatedReport : Report = {
                    report with
                    photoPath;
                };
                reports := reportMap.put(reports, id, updatedReport);
            };
        };
    };

    public shared ({ caller }) func updateReportMinisterPhotos(id : Text, mlaPhotoPath : ?Text, pmPhotoPath : ?Text, cmPhotoPath : ?Text) : async () {
        if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
            Debug.trap("Unauthorized: Only admins can update minister photos");
        };
        switch (reportMap.get(reports, id)) {
            case (null) {
                Debug.trap("Report not found");
            };
            case (?report) {
                let updatedReport : Report = {
                    report with
                    mlaPhotoPath;
                    pmPhotoPath;
                    cmPhotoPath;
                };
                reports := reportMap.put(reports, id, updatedReport);
            };
        };
    };

    public shared ({ caller }) func updateReportAddress(id : Text, address : Text) : async () {
        if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
            Debug.trap("Unauthorized: Only admins can update report addresses");
        };
        switch (reportMap.get(reports, id)) {
            case (null) {
                Debug.trap("Report not found");
            };
            case (?report) {
                let updatedReport : Report = {
                    report with
                    address;
                };
                reports := reportMap.put(reports, id, updatedReport);
            };
        };
    };

    public shared ({ caller }) func updateReportCoordinates(id : Text, coordinates : Text) : async () {
        if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
            Debug.trap("Unauthorized: Only admins can update report coordinates");
        };
        switch (reportMap.get(reports, id)) {
            case (null) {
                Debug.trap("Report not found");
            };
            case (?report) {
                let updatedReport : Report = {
                    report with
                    coordinates;
                };
                reports := reportMap.put(reports, id, updatedReport);
            };
        };
    };

    public query func getReportsWithLocationsAndAddresses() : async [(Report, { latitude : Float; longitude : Float }, Text, Text)] {
        var reportList = List.nil<(Report, { latitude : Float; longitude : Float }, Text, Text)>();
        for ((id, report) in reportMap.entries(reports)) {
            reportList := List.push((report, report.location, report.address, report.coordinates), reportList);
        };
        List.toArray(reportList);
    };

    public query func getReportsWithAddresses() : async [(Report, Text)] {
        var reportList = List.nil<(Report, Text)>();
        for ((id, report) in reportMap.entries(reports)) {
            reportList := List.push((report, report.address), reportList);
        };
        List.toArray(reportList);
    };

    public query func getReportsWithLocationsAndAddressesOptimized() : async [(Report, { latitude : Float; longitude : Float }, Text, Text)] {
        var reportList = List.nil<(Report, { latitude : Float; longitude : Float }, Text, Text)>();
        for ((id, report) in reportMap.entries(reports)) {
            reportList := List.push((report, report.location, report.address, report.coordinates), reportList);
        };
        List.toArray(reportList);
    };

    public query func getReportsWithPhotosOptimized() : async [(Report, Text)] {
        var reportList = List.nil<(Report, Text)>();
        for ((id, report) in reportMap.entries(reports)) {
            reportList := List.push((report, report.photoPath), reportList);
        };
        List.toArray(reportList);
    };

    public query func getReportsWithMinisterPhotosOptimized() : async [(Report, ?Text, ?Text, ?Text)] {
        var reportList = List.nil<(Report, ?Text, ?Text, ?Text)>();
        for ((id, report) in reportMap.entries(reports)) {
            reportList := List.push((report, report.mlaPhotoPath, report.pmPhotoPath, report.cmPhotoPath), reportList);
        };
        List.toArray(reportList);
    };

    public query func getReportsWithCustomAddresses() : async [(Report, ?Text, Text)] {
        var reportList = List.nil<(Report, ?Text, Text)>();
        for ((id, report) in reportMap.entries(reports)) {
            reportList := List.push((report, report.customAddress, report.address), reportList);
        };
        List.toArray(reportList);
    };

    public query func getReportsWithFullLocationData() : async [(Report, { latitude : Float; longitude : Float }, ?Text, Text, Text)] {
        var reportList = List.nil<(Report, { latitude : Float; longitude : Float }, ?Text, Text, Text)>();
        for ((id, report) in reportMap.entries(reports)) {
            reportList := List.push((report, report.location, report.customAddress, report.address, report.coordinates), reportList);
        };
        List.toArray(reportList);
    };

    public shared ({ caller }) func updateReportFullLocation(id : Text, latitude : Float, longitude : Float, customAddress : ?Text, address : Text, coordinates : Text) : async () {
        if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
            Debug.trap("Unauthorized: Only admins can update full location data");
        };
        switch (reportMap.get(reports, id)) {
            case (null) {
                Debug.trap("Report not found");
            };
            case (?report) {
                let updatedReport : Report = {
                    report with
                    location = { latitude; longitude };
                    customAddress;
                    address;
                    coordinates;
                };
                reports := reportMap.put(reports, id, updatedReport);
            };
        };
    };

    public query func getReportsWithCompleteLocationData() : async [(Report, { latitude : Float; longitude : Float }, ?Text, Text, Text)] {
        var reportList = List.nil<(Report, { latitude : Float; longitude : Float }, ?Text, Text, Text)>();
        for ((id, report) in reportMap.entries(reports)) {
            reportList := List.push((report, report.location, report.customAddress, report.address, report.coordinates), reportList);
        };
        List.toArray(reportList);
    };

    public query func getReportsWithAddressAndCoordinates() : async [(Report, Text, Text)] {
        var reportList = List.nil<(Report, Text, Text)>();
        for ((id, report) in reportMap.entries(reports)) {
            reportList := List.push((report, report.address, report.coordinates), reportList);
        };
        List.toArray(reportList);
    };

    public shared ({ caller }) func updateReportAddressAndCoordinates(id : Text, address : Text, coordinates : Text) : async () {
        if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
            Debug.trap("Unauthorized: Only admins can update address and coordinates");
        };
        switch (reportMap.get(reports, id)) {
            case (null) {
                Debug.trap("Report not found");
            };
            case (?report) {
                let updatedReport : Report = {
                    report with
                    address;
                    coordinates;
                };
                reports := reportMap.put(reports, id, updatedReport);
            };
        };
    };

    public query func getReportsForAdminTable() : async [(Report, Text, Text, Text)] {
        var reportList = List.nil<(Report, Text, Text, Text)>();
        for ((id, report) in reportMap.entries(reports)) {
            let finalAddress = switch (report.customAddress) {
                case (?custom) { custom };
                case (null) { report.address };
            };
            reportList := List.push((report, finalAddress, report.address, report.coordinates), reportList);
        };
        List.toArray(reportList);
    };

    public shared ({ caller }) func updateReportAdminTable(id : Text, address : Text, coordinates : Text, customAddress : ?Text) : async () {
        if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
            Debug.trap("Unauthorized: Only admins can update admin table data");
        };
        switch (reportMap.get(reports, id)) {
            case (null) {
                Debug.trap("Report not found");
            };
            case (?report) {
                let updatedReport : Report = {
                    report with
                    address;
                    coordinates;
                    customAddress;
                };
                reports := reportMap.put(reports, id, updatedReport);
            };
        };
    };

    public query func getPaginatedReports(page : Nat, pageSize : Nat) : async [Report] {
        var reportList = List.nil<Report>();
        for ((id, report) in reportMap.entries(reports)) {
            reportList := List.push(report, reportList);
        };
        let sorted = List.toArray(reportList);
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
        reportMap.size(reports);
    };

    public query func getDirectoryWithPhotos() : async Directory {
        directory;
    };

    public query func getAllRepresentatives() : async [Representative] {
        var repList = List.nil<Representative>();
        for (state in directory.states.vals()) {
            switch (state.cm) {
                case (?cm) { repList := List.push(cm, repList) };
                case (null) {};
            };
            for (constituency in state.constituencies.vals()) {
                switch (constituency.mp) {
                    case (?mp) { repList := List.push(mp, repList) };
                    case (null) {};
                };
                for (mla in constituency.mlas.vals()) {
                    repList := List.push(mla, repList);
                };
            };
        };
        for (ut in directory.unionTerritories.vals()) {
            switch (ut.cm) {
                case (?admin) { repList := List.push(admin, repList) };
                case (null) {};
            };
        };
        switch (directory.primeMinister) {
            case (?pm) { repList := List.push(pm, repList) };
            case (null) {};
        };
        List.toArray(repList);
    };

    public query func getAdminDirectory() : async Directory {
        directory;
    };

    public shared ({ caller }) func registerNgoNpo(organizationName : Text, logoPath : Text, contactPerson : Text, email : Text, phone : Text, address : Text, website : Text, description : Text, missionStatement : Text, showContactInfo : Bool) : async Text {
        let id = Int.toText(Time.now());
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
        ngoNpos := ngoNpoMap.put(ngoNpos, id, ngoNpo);
        id;
    };

    public shared ({ caller }) func approveNgoNpo(ngoNpoId : Text) : async () {
        if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
            Debug.trap("Unauthorized: Only admins can approve NGOs/NPOs");
        };
        switch (ngoNpoMap.get(ngoNpos, ngoNpoId)) {
            case (null) {
                Debug.trap("NGO/NPO not found");
            };
            case (?ngoNpo) {
                let updatedNgoNpo : NgoNpo = {
                    ngoNpo with
                    approved = true;
                    rejectionNote = null;
                    approvalTimestamp = ?Time.now();
                };
                ngoNpos := ngoNpoMap.put(ngoNpos, ngoNpoId, updatedNgoNpo);
            };
        };
    };

    public shared ({ caller }) func rejectNgoNpo(ngoNpoId : Text, rejectionNote : Text) : async () {
        if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
            Debug.trap("Unauthorized: Only admins can reject NGOs/NPOs");
        };
        switch (ngoNpoMap.get(ngoNpos, ngoNpoId)) {
            case (null) {
                Debug.trap("NGO/NPO not found");
            };
            case (?ngoNpo) {
                let updatedNgoNpo : NgoNpo = {
                    ngoNpo with
                    approved = false;
                    rejectionNote = ?rejectionNote;
                    approvalTimestamp = null;
                };
                ngoNpos := ngoNpoMap.put(ngoNpos, ngoNpoId, updatedNgoNpo);
            };
        };
    };

    public shared ({ caller }) func updateNgoNpoPrivacy(ngoNpoId : Text, showContactInfo : Bool) : async () {
        switch (ngoNpoMap.get(ngoNpos, ngoNpoId)) {
            case (null) {
                Debug.trap("NGO/NPO not found");
            };
            case (?ngoNpo) {
                if (ngoNpo.principal != caller and not AccessControl.isAdmin(accessControlState, caller)) {
                    Debug.trap("Unauthorized: Only the NGO/NPO or an admin can update privacy settings");
                };
                let updatedNgoNpo : NgoNpo = {
                    ngoNpo with
                    showContactInfo;
                };
                ngoNpos := ngoNpoMap.put(ngoNpos, ngoNpoId, updatedNgoNpo);
            };
        };
    };

    public query func getNgoNpoDirectory() : async [NgoNpo] {
        var ngoNpoList = List.nil<NgoNpo>();
        for ((id, ngoNpo) in ngoNpoMap.entries(ngoNpos)) {
            if (ngoNpo.approved) {
                ngoNpoList := List.push(ngoNpo, ngoNpoList);
            };
        };
        List.toArray(ngoNpoList);
    };

    public query ({ caller }) func getMyNgoNpoProfile() : async ?NgoNpo {
        var ngoNpoList = List.nil<NgoNpo>();
        for ((id, ngoNpo) in ngoNpoMap.entries(ngoNpos)) {
            if (ngoNpo.principal == caller) {
                ngoNpoList := List.push(ngoNpo, ngoNpoList);
            };
        };
        List.last(ngoNpoList);
    };

    public query ({ caller }) func getAllNgoNpos() : async [NgoNpo] {
        if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
            Debug.trap("Unauthorized: Only admins can view all NGOs/NPOs");
        };
        var ngoNpoList = List.nil<NgoNpo>();
        for ((id, ngoNpo) in ngoNpoMap.entries(ngoNpos)) {
            ngoNpoList := List.push(ngoNpo, ngoNpoList);
        };
        List.toArray(ngoNpoList);
    };

    public query func getNgoNpoById(ngoNpoId : Text) : async ?NgoNpo {
        ngoNpoMap.get(ngoNpos, ngoNpoId);
    };

    public shared func submitFeedback(type_ : Text, message : Text, contactInfo : Text) : async Text {
        let id = Int.toText(Time.now());
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
        feedbacks := feedbackMap.put(feedbacks, id, feedback);
        id;
    };

    public query ({ caller }) func getAllFeedback() : async [Feedback] {
        if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
            Debug.trap("Unauthorized: Only admins can view feedback");
        };
        var feedbackList = List.nil<Feedback>();
        for ((id, feedback) in feedbackMap.entries(feedbacks)) {
            feedbackList := List.push(feedback, feedbackList);
        };
        List.toArray(feedbackList);
    };

    public shared ({ caller }) func updateFeedbackStatus(feedbackId : Text, status : Text) : async () {
        if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
            Debug.trap("Unauthorized: Only admins can update feedback status");
        };
        switch (feedbackMap.get(feedbacks, feedbackId)) {
            case (null) {
                Debug.trap("Feedback not found");
            };
            case (?feedback) {
                let updatedFeedback : Feedback = {
                    feedback with
                    status;
                };
                feedbacks := feedbackMap.put(feedbacks, feedbackId, updatedFeedback);
            };
        };
    };

    public shared ({ caller }) func respondToFeedback(feedbackId : Text, response : Text) : async () {
        if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
            Debug.trap("Unauthorized: Only admins can respond to feedback");
        };
        switch (feedbackMap.get(feedbacks, feedbackId)) {
            case (null) {
                Debug.trap("Feedback not found");
            };
            case (?feedback) {
                let updatedFeedback : Feedback = {
                    feedback with
                    response = ?response;
                    admin = ?caller;
                };
                feedbacks := feedbackMap.put(feedbacks, feedbackId, updatedFeedback);
            };
        };
    };

    public query func getFeedbackById(feedbackId : Text) : async ?Feedback {
        feedbackMap.get(feedbacks, feedbackId);
    };

    public query func getFeedbackByType(type_ : Text) : async [Feedback] {
        var feedbackList = List.nil<Feedback>();
        for ((id, feedback) in feedbackMap.entries(feedbacks)) {
            if (feedback.type_ == type_) {
                feedbackList := List.push(feedback, feedbackList);
            };
        };
        List.toArray(feedbackList);
    };

    public query func getFeedbackByStatus(status : Text) : async [Feedback] {
        var feedbackList = List.nil<Feedback>();
        for ((id, feedback) in feedbackMap.entries(feedbacks)) {
            if (feedback.status == status) {
                feedbackList := List.push(feedback, feedbackList);
            };
        };
        List.toArray(feedbackList);
    };

    public query func getFeedbackByContactInfo(contactInfo : Text) : async [Feedback] {
        var feedbackList = List.nil<Feedback>();
        for ((id, feedback) in feedbackMap.entries(feedbacks)) {
            if (feedback.contactInfo == contactInfo) {
                feedbackList := List.push(feedback, feedbackList);
            };
        };
        List.toArray(feedbackList);
    };

    public shared ({ caller }) func deleteFeedback(feedbackId : Text) : async () {
        if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
            Debug.trap("Unauthorized: Only admins can delete feedback");
        };
        switch (feedbackMap.get(feedbacks, feedbackId)) {
            case (null) {
                Debug.trap("Feedback not found");
            };
            case (?feedback) {
                feedbacks := feedbackMap.remove(feedbacks, feedbackId).0;
            };
        };
    };

    public query func getUserRole(caller : Principal) : async Text {
        let role = AccessControl.getUserRole(accessControlState, caller);
        switch (role) {
            case (#admin) { "admin" };
            case (#user) { "user" };
            case (#guest) { "guest" };
        };
    };

    public query func getConstituenciesByState(stateName : Text) : async [Constituency] {
        var stateList = List.nil<State>();
        for (state in directory.states.vals()) {
            if (state.name == stateName) {
                stateList := List.push(state, stateList);
            };
        };
        switch (List.last(stateList)) {
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
                        if (Text.contains(mp.remarks, #text areaOrBlock)) {
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
        var reportList = List.nil<Report>();
        for ((id, report) in reportMap.entries(reports)) {
            reportList := List.push(report, reportList);
        };
        let sorted = List.toArray(reportList);
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
        var reportList = List.nil<Report>();
        for ((id, report) in reportMap.entries(reports)) {
            reportList := List.push(report, reportList);
        };
        let sorted = List.toArray(reportList);
        let len = sorted.size();
        if (len == 0) {
            return [];
        };
        let count = if (len < 10) { len } else { 10 };
        Array.tabulate(count, func(i : Nat) : Report { sorted[len - 1 - i] });
    };

    public query func getNextReports(offset : Nat, count : Nat) : async [Report] {
        var reportList = List.nil<Report>();
        for ((id, report) in reportMap.entries(reports)) {
            reportList := List.push(report, reportList);
        };
        let sorted = List.toArray(reportList);
        let len = sorted.size();
        if (len == 0 or offset >= len) {
            return [];
        };
        let actualCount = if (len < offset + count) { len - offset } else { count };
        Array.tabulate(actualCount, func(i : Nat) : Report { sorted[len - 1 - (offset + i)] });
    };

    public shared ({ caller }) func trackUniqueVisitor() : async () {
        if (not principalMap.contains(uniqueVisitors, caller)) {
            uniqueVisitors := principalMap.put(uniqueVisitors, caller, true);
        };
    };

    public query func getTotalUniqueVisitors() : async Nat {
        principalMap.size(uniqueVisitors);
    };

    include BlobStorage(registry);
};
