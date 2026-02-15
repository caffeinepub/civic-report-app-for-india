import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import { useInternetIdentity } from './useInternetIdentity';
import { Report, UserRole, UserProfile, LogoHistory, RoadmapFeature, UserApprovalInfo, ApprovalStatus, Volunteer, Directory, State, Constituency, Representative, LocalCivicBody, NgoNpo, Feedback, VolunteerProfileUpdate, PendingProfileEdit } from '../backend';
import { Principal } from '@dfinity/principal';

export function useGetAllReports() {
  const { actor, isFetching } = useActor();

  return useQuery<Report[]>({
    queryKey: ['reports'],
    queryFn: async () => {
      if (!actor) return [];
      const reports = await actor.getAllReports();
      return reports.sort((a, b) => Number(b.timestamp) - Number(a.timestamp));
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetInitialReports() {
  const { actor, isFetching } = useActor();

  return useQuery<Report[]>({
    queryKey: ['initialReports'],
    queryFn: async () => {
      if (!actor) return [];
      const reports = await actor.getInitialReports();
      return reports;
    },
    enabled: !!actor && !isFetching,
    staleTime: 0,
    refetchOnWindowFocus: true,
  });
}

export function useGetNextReports(offset: number, count: number) {
  const { actor, isFetching } = useActor();

  return useQuery<Report[]>({
    queryKey: ['nextReports', offset, count],
    queryFn: async () => {
      if (!actor) return [];
      const reports = await actor.getNextReports(BigInt(offset), BigInt(count));
      return reports;
    },
    enabled: false,
    staleTime: 0,
  });
}

export function useGetTotalReportCount() {
  const { actor, isFetching } = useActor();

  return useQuery<bigint>({
    queryKey: ['totalReportCount'],
    queryFn: async () => {
      if (!actor) return BigInt(0);
      return actor.getTotalReportCount();
    },
    enabled: !!actor && !isFetching,
    staleTime: 30000,
  });
}

export function useGetRecentReports(count: number = 5) {
  const { actor, isFetching } = useActor();

  return useQuery<Report[]>({
    queryKey: ['recentReports', count],
    queryFn: async () => {
      if (!actor) return [];
      const reports = await actor.getRecentReports(BigInt(count));
      return reports.sort((a, b) => Number(b.timestamp) - Number(a.timestamp));
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 30000,
    staleTime: 0,
  });
}

export function useGetReport(id: string) {
  const { actor, isFetching } = useActor();

  return useQuery<Report | null>({
    queryKey: ['report', id],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getReport(id);
    },
    enabled: !!actor && !isFetching && !!id,
  });
}

export function useGetReportsByState(state: string) {
  const { actor, isFetching } = useActor();

  return useQuery<Report[]>({
    queryKey: ['reportsByState', state],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getReportsByState(state);
    },
    enabled: !!actor && !isFetching && !!state,
  });
}

export function useSubmitReport() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ photoPath, latitude, longitude, username, notes, issueType, mlaMpName, mlaMpPhotoPath, pmPhotoPath, cmPhotoPath, pmName, cmName, customAddress, state, mlaMpDesignation, pmData, cmData, mpData, address, localCivicBody }: {
      photoPath: string;
      latitude: number;
      longitude: number;
      username: string | null;
      notes: string | null;
      issueType: string;
      mlaMpName: string | null;
      mlaMpPhotoPath: string | null;
      pmPhotoPath: string | null;
      cmPhotoPath: string | null;
      pmName: string | null;
      cmName: string | null;
      customAddress: string | null;
      state: string;
      mlaMpDesignation: string;
      pmData: Representative | null;
      cmData: Representative | null;
      mpData: Representative | null;
      address: string | null;
      localCivicBody: LocalCivicBody | null;
    }) => {
      if (!actor) throw new Error('Actor not available');
      
      const volunteerProfile = await actor.getMyVolunteerProfile();
      const isVolunteer = volunteerProfile?.approved || false;
      
      const coordinates = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
      const finalAddress = address && address.trim() !== '' ? address : coordinates;
      
      return actor.submitReport(photoPath, latitude, longitude, username, notes, issueType, mlaMpName, mlaMpPhotoPath, pmPhotoPath, cmPhotoPath, pmName, cmName, customAddress, state, mlaMpDesignation, isVolunteer, pmData, cmData, mpData, finalAddress, coordinates, localCivicBody);
    },
    onSuccess: (reportId) => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      queryClient.invalidateQueries({ queryKey: ['recentReports'] });
      queryClient.invalidateQueries({ queryKey: ['initialReports'] });
      queryClient.invalidateQueries({ queryKey: ['totalReportCount'] });
      queryClient.refetchQueries({ queryKey: ['recentReports'] });
      queryClient.refetchQueries({ queryKey: ['initialReports'] });
      queryClient.refetchQueries({ queryKey: ['totalReportCount'] });
      queryClient.invalidateQueries({ queryKey: ['report', reportId] });
      queryClient.invalidateQueries({ queryKey: ['myVolunteerProfile'] });
      queryClient.invalidateQueries({ queryKey: ['volunteerDirectory'] });
      queryClient.invalidateQueries({ queryKey: ['allVolunteers'] });
    },
  });
}

export function useUpdateReportStatus() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ reportId, status, proofPhotoPath, reporterName, notes }: {
      reportId: string;
      status: string;
      proofPhotoPath: string;
      reporterName: string;
      notes?: string | null;
    }) => {
      if (!actor) throw new Error('Actor not available');
      
      const volunteerProfile = await actor.getMyVolunteerProfile();
      const isVolunteer = volunteerProfile?.approved || false;
      
      return actor.updateReportStatus(reportId, status, proofPhotoPath, reporterName, notes || null, isVolunteer);
    },
    onSuccess: (success, variables) => {
      if (success) {
        queryClient.invalidateQueries({ queryKey: ['reports'] });
        queryClient.invalidateQueries({ queryKey: ['recentReports'] });
        queryClient.invalidateQueries({ queryKey: ['initialReports'] });
        queryClient.invalidateQueries({ queryKey: ['totalReportCount'] });
        queryClient.invalidateQueries({ queryKey: ['report', variables.reportId] });
        queryClient.refetchQueries({ queryKey: ['recentReports'] });
        queryClient.refetchQueries({ queryKey: ['initialReports'] });
        queryClient.refetchQueries({ queryKey: ['totalReportCount'] });
        queryClient.invalidateQueries({ queryKey: ['myVolunteerProfile'] });
        queryClient.invalidateQueries({ queryKey: ['volunteerDirectory'] });
        queryClient.invalidateQueries({ queryKey: ['allVolunteers'] });
      }
    },
  });
}

export function useIsAdmin() {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery<boolean>({
    queryKey: ['isAdmin', identity?.getPrincipal().toString()],
    queryFn: async () => {
      if (!actor || !identity) return false;
      return actor.isCallerAdmin();
    },
    enabled: !!actor && !isFetching && !!identity,
    refetchInterval: 10000,
    staleTime: 5000,
  });
}

export function useGetUserRole() {
  const { actor, isFetching } = useActor();

  return useQuery<UserRole>({
    queryKey: ['userRole'],
    queryFn: async () => {
      if (!actor) return UserRole.guest;
      return actor.getCallerUserRole();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAssignRole() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ user, role }: { user: Principal; role: UserRole }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.assignCallerUserRole(user, role);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userRole'] });
      queryClient.invalidateQueries({ queryKey: ['isAdmin'] });
      queryClient.invalidateQueries({ queryKey: ['admins'] });
    },
  });
}

export function useGetAdmins() {
  const { actor, isFetching } = useActor();

  return useQuery<Principal[]>({
    queryKey: ['admins'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAdmins();
    },
    enabled: !!actor && !isFetching,
    retry: false,
  });
}

export function useAddAdmin() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (principal: Principal) => {
      if (!actor) throw new Error('Actor not available');
      return actor.addAdmin(principal);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admins'] });
      queryClient.invalidateQueries({ queryKey: ['userRole'] });
      queryClient.invalidateQueries({ queryKey: ['isAdmin'] });
    },
  });
}

export function useRemoveAdmin() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (principal: Principal) => {
      if (!actor) throw new Error('Actor not available');
      return actor.removeAdmin(principal);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admins'] });
      queryClient.invalidateQueries({ queryKey: ['userRole'] });
      queryClient.invalidateQueries({ queryKey: ['isAdmin'] });
    },
  });
}

export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();

  const query = useQuery<UserProfile | null>({
    queryKey: ['currentUserProfile'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });

  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && query.isFetched,
  };
}

export function useSaveUserProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error('Actor not available');
      return actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
  });
}

export function useDeleteReport() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (reportId: string) => {
      if (!actor) throw new Error('Actor not available');
      
      try {
        await actor.deleteReport(reportId);
        return true;
      } catch (error) {
        console.error('Error deleting report:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      queryClient.invalidateQueries({ queryKey: ['recentReports'] });
      queryClient.invalidateQueries({ queryKey: ['initialReports'] });
      queryClient.invalidateQueries({ queryKey: ['totalReportCount'] });
      queryClient.refetchQueries({ queryKey: ['reports'] });
      queryClient.refetchQueries({ queryKey: ['recentReports'] });
      queryClient.refetchQueries({ queryKey: ['initialReports'] });
      queryClient.refetchQueries({ queryKey: ['totalReportCount'] });
      queryClient.invalidateQueries({ queryKey: ['myVolunteerProfile'] });
      queryClient.invalidateQueries({ queryKey: ['volunteerDirectory'] });
      queryClient.invalidateQueries({ queryKey: ['allVolunteers'] });
    },
    onError: (error) => {
      console.error('Failed to delete report:', error);
    },
  });
}

export function useUpdateReport() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ reportId, updatedReport }: {
      reportId: string;
      updatedReport: Report;
    }) => {
      if (!actor) throw new Error('Actor not available');
      
      try {
        await actor.updateReport(reportId, updatedReport);
        return true;
      } catch (error) {
        console.error('Error updating report:', error);
        throw error;
      }
    },
    onSuccess: (success, variables) => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      queryClient.invalidateQueries({ queryKey: ['recentReports'] });
      queryClient.invalidateQueries({ queryKey: ['initialReports'] });
      queryClient.invalidateQueries({ queryKey: ['totalReportCount'] });
      queryClient.invalidateQueries({ queryKey: ['report', variables.reportId] });
      queryClient.refetchQueries({ queryKey: ['reports'] });
      queryClient.refetchQueries({ queryKey: ['recentReports'] });
      queryClient.refetchQueries({ queryKey: ['initialReports'] });
      queryClient.refetchQueries({ queryKey: ['totalReportCount'] });
      queryClient.refetchQueries({ queryKey: ['report', variables.reportId] });
      queryClient.invalidateQueries({ queryKey: ['myVolunteerProfile'] });
      queryClient.invalidateQueries({ queryKey: ['volunteerDirectory'] });
      queryClient.invalidateQueries({ queryKey: ['allVolunteers'] });
    },
    onError: (error) => {
      console.error('Failed to update report:', error);
    },
  });
}

export function useGetCurrentLogo() {
  const { actor, isFetching } = useActor();

  return useQuery<string>({
    queryKey: ['currentLogo'],
    queryFn: async () => {
      if (!actor) return '';
      return actor.getCurrentLogo();
    },
    enabled: !!actor && !isFetching,
    retry: false,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

export function useUploadLogo() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (logoData: string) => {
      if (!actor) throw new Error('Actor not available');
      return actor.uploadLogo(logoData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentLogo'] });
      queryClient.invalidateQueries({ queryKey: ['logoHistory'] });
      queryClient.refetchQueries({ queryKey: ['currentLogo'] });
    },
    onError: (error) => {
      console.error('Failed to upload logo:', error);
      throw error;
    },
  });
}

export function useGetLogoHistory() {
  const { actor, isFetching } = useActor();

  return useQuery<LogoHistory[]>({
    queryKey: ['logoHistory'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getLogoHistory();
    },
    enabled: !!actor && !isFetching,
    retry: false,
  });
}

export function useGetRoadmapFeatures() {
  const { actor, isFetching } = useActor();

  return useQuery<RoadmapFeature[]>({
    queryKey: ['roadmapFeatures'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getRoadmapFeatures();
    },
    enabled: !!actor && !isFetching,
    retry: false,
  });
}

export function useCreateFeature() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ sectionId, featureData }: { sectionId: string; featureData: RoadmapFeature }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.createFeature(sectionId, featureData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roadmapFeatures'] });
      queryClient.refetchQueries({ queryKey: ['roadmapFeatures'] });
    },
    onError: (error) => {
      console.error('Failed to create feature:', error);
      throw error;
    },
  });
}

export function useUpdateFeature() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ featureId, featureData }: { featureId: string; featureData: RoadmapFeature }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateFeature(featureId, featureData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roadmapFeatures'] });
      queryClient.refetchQueries({ queryKey: ['roadmapFeatures'] });
    },
    onError: (error) => {
      console.error('Failed to update feature:', error);
      throw error;
    },
  });
}

export function useDeleteFeature() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (featureId: string) => {
      if (!actor) throw new Error('Actor not available');
      return actor.deleteFeature(featureId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roadmapFeatures'] });
      queryClient.refetchQueries({ queryKey: ['roadmapFeatures'] });
    },
    onError: (error) => {
      console.error('Failed to delete feature:', error);
      throw error;
    },
  });
}

export function useMoveFeature() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ featureId, newSectionId }: { featureId: string; newSectionId: string }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.moveFeature(featureId, newSectionId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roadmapFeatures'] });
      queryClient.refetchQueries({ queryKey: ['roadmapFeatures'] });
    },
    onError: (error) => {
      console.error('Failed to move feature:', error);
      throw error;
    },
  });
}

export function useIsApproved() {
  const { actor, isFetching } = useActor();

  return useQuery<boolean>({
    queryKey: ['isApproved'],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isCallerApproved();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useRequestApproval() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.requestApproval();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['isApproved'] });
      queryClient.invalidateQueries({ queryKey: ['approvals'] });
    },
  });
}

export function useSetApproval() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ user, status }: { user: Principal; status: ApprovalStatus }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.setApproval(user, status);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['approvals'] });
      queryClient.invalidateQueries({ queryKey: ['isApproved'] });
    },
  });
}

export function useListApprovals() {
  const { actor, isFetching } = useActor();

  return useQuery<UserApprovalInfo[]>({
    queryKey: ['approvals'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listApprovals();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useApplyVolunteer() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ name, photoPath, contactInfo, address, showFullMobile }: {
      name: string;
      photoPath: string;
      contactInfo: string;
      address: string;
      showFullMobile: boolean;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.applyVolunteer(name, photoPath, contactInfo, address, showFullMobile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myVolunteerProfile'] });
      queryClient.invalidateQueries({ queryKey: ['allVolunteers'] });
    },
  });
}

export function useApproveVolunteer() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (volunteerId: string) => {
      if (!actor) throw new Error('Actor not available');
      return actor.approveVolunteer(volunteerId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allVolunteers'] });
      queryClient.invalidateQueries({ queryKey: ['volunteerDirectory'] });
    },
  });
}

export function useRejectVolunteer() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ volunteerId, rejectionNote }: { volunteerId: string; rejectionNote: string }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.rejectVolunteer(volunteerId, rejectionNote);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allVolunteers'] });
      queryClient.invalidateQueries({ queryKey: ['volunteerDirectory'] });
    },
  });
}

export function useUpdateVolunteerPrivacy() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ volunteerId, showFullMobile }: { volunteerId: string; showFullMobile: boolean }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateVolunteerPrivacy(volunteerId, showFullMobile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myVolunteerProfile'] });
      queryClient.invalidateQueries({ queryKey: ['volunteerDirectory'] });
      queryClient.invalidateQueries({ queryKey: ['allVolunteers'] });
    },
  });
}

export function useSubmitVolunteerProfileEdit() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ volunteerId, updates }: { volunteerId: string; updates: VolunteerProfileUpdate }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.submitVolunteerProfileEdit(volunteerId, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myPendingProfileEdit'] });
      queryClient.invalidateQueries({ queryKey: ['myProfileEditHistory'] });
      queryClient.invalidateQueries({ queryKey: ['allPendingProfileEdits'] });
    },
  });
}

export function useGetMyPendingProfileEdit() {
  const { actor, isFetching } = useActor();

  return useQuery<PendingProfileEdit | null>({
    queryKey: ['myPendingProfileEdit'],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getMyPendingProfileEdit();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetMyProfileEditHistory() {
  const { actor, isFetching } = useActor();

  return useQuery<PendingProfileEdit[]>({
    queryKey: ['myProfileEditHistory'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getMyProfileEditHistory();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetAllPendingProfileEdits() {
  const { actor, isFetching } = useActor();

  return useQuery<PendingProfileEdit[]>({
    queryKey: ['allPendingProfileEdits'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllPendingProfileEdits();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useApproveVolunteerProfileEdit() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (editId: string) => {
      if (!actor) throw new Error('Actor not available');
      return actor.approveVolunteerProfileEdit(editId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allPendingProfileEdits'] });
      queryClient.invalidateQueries({ queryKey: ['myPendingProfileEdit'] });
      queryClient.invalidateQueries({ queryKey: ['myProfileEditHistory'] });
      queryClient.invalidateQueries({ queryKey: ['volunteerDirectory'] });
      queryClient.invalidateQueries({ queryKey: ['allVolunteers'] });
    },
  });
}

export function useRejectVolunteerProfileEdit() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ editId, rejectionNote }: { editId: string; rejectionNote: string }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.rejectVolunteerProfileEdit(editId, rejectionNote);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allPendingProfileEdits'] });
      queryClient.invalidateQueries({ queryKey: ['myPendingProfileEdit'] });
      queryClient.invalidateQueries({ queryKey: ['myProfileEditHistory'] });
    },
  });
}

export function useGetVolunteerDirectory() {
  const { actor, isFetching } = useActor();

  return useQuery<Volunteer[]>({
    queryKey: ['volunteerDirectory'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getVolunteerDirectory();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetMyVolunteerProfile() {
  const { actor, isFetching } = useActor();

  return useQuery<Volunteer | null>({
    queryKey: ['myVolunteerProfile'],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getMyVolunteerProfile();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetAllVolunteers() {
  const { actor, isFetching } = useActor();

  return useQuery<Volunteer[]>({
    queryKey: ['allVolunteers'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllVolunteers();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetVolunteerById(volunteerId: string) {
  const { actor, isFetching } = useActor();

  return useQuery<Volunteer | null>({
    queryKey: ['volunteer', volunteerId],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getVolunteerById(volunteerId);
    },
    enabled: !!actor && !isFetching && !!volunteerId,
  });
}

export function useGetDirectory() {
  const { actor, isFetching } = useActor();

  return useQuery<Directory>({
    queryKey: ['directory'],
    queryFn: async () => {
      if (!actor) return { states: [], unionTerritories: [], administrativeUnits: [], primeMinister: undefined };
      return actor.getDirectory();
    },
    enabled: !!actor && !isFetching,
    staleTime: 5 * 60 * 1000,
  });
}

export function useGetState(stateName: string) {
  const { actor, isFetching } = useActor();

  return useQuery<State | null>({
    queryKey: ['state', stateName],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getState(stateName);
    },
    enabled: !!actor && !isFetching && !!stateName,
  });
}

export function useGetConstituency(stateName: string, constituencyName: string) {
  const { actor, isFetching } = useActor();

  return useQuery<Constituency | null>({
    queryKey: ['constituency', stateName, constituencyName],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getConstituency(stateName, constituencyName);
    },
    enabled: !!actor && !isFetching && !!stateName && !!constituencyName,
  });
}

export function useGetConstituenciesByState(stateName: string) {
  const { actor, isFetching } = useActor();

  return useQuery<Constituency[]>({
    queryKey: ['constituenciesByState', stateName],
    queryFn: async () => {
      if (!actor || !stateName) return [];
      return actor.getConstituenciesByState(stateName);
    },
    enabled: !!actor && !isFetching && !!stateName,
  });
}

export function useGetVidhanSabhaConstituenciesByState(stateName: string) {
  const { actor, isFetching } = useActor();

  return useQuery<Constituency[]>({
    queryKey: ['vidhanSabhaConstituenciesByState', stateName],
    queryFn: async () => {
      if (!actor || !stateName) return [];
      const constituencies = await actor.getConstituenciesByState(stateName);
      return constituencies.filter(c => c.mlas && c.mlas.length > 0);
    },
    enabled: !!actor && !isFetching && !!stateName,
  });
}

export function useUpdateDirectory() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newDirectory: Directory) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateDirectory(newDirectory);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['directory'] });
      queryClient.refetchQueries({ queryKey: ['directory'] });
    },
  });
}

// Admin Directory hooks
export function useAddState() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ stateName, cm }: { stateName: string; cm: Representative | null }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.addState(stateName, cm, false);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['directory'] });
      queryClient.refetchQueries({ queryKey: ['directory'] });
    },
  });
}

export function useAddUnionTerritory() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ utName, administrator }: { utName: string; administrator: Representative | null }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.addUnionTerritory(utName, administrator);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['directory'] });
      queryClient.refetchQueries({ queryKey: ['directory'] });
    },
  });
}

export function useAddConstituency() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ stateName, constituencyName }: { stateName: string; constituencyName: string }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.addConstituency(stateName, constituencyName);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['directory'] });
      queryClient.refetchQueries({ queryKey: ['directory'] });
    },
  });
}

export function useAddMpToConstituency() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ stateName, constituencyName, mp }: { stateName: string; constituencyName: string; mp: Representative }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.addMpToConstituency(stateName, constituencyName, mp);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['directory'] });
      queryClient.refetchQueries({ queryKey: ['directory'] });
    },
  });
}

export function useAddMlaToConstituency() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ stateName, constituencyName, mla }: { stateName: string; constituencyName: string; mla: Representative }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.addMlaToConstituency(stateName, constituencyName, mla);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['directory'] });
      queryClient.refetchQueries({ queryKey: ['directory'] });
    },
  });
}

export function useUpdateRepresentative() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ stateName, constituencyName, repType, representative }: { stateName: string; constituencyName: string; repType: string; representative: Representative }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateRepresentative(stateName, constituencyName, repType, representative);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['directory'] });
      queryClient.refetchQueries({ queryKey: ['directory'] });
    },
  });
}

export function useDeleteConstituency() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ stateName, constituencyName }: { stateName: string; constituencyName: string }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.deleteConstituency(stateName, constituencyName);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['directory'] });
      queryClient.refetchQueries({ queryKey: ['directory'] });
    },
  });
}

export function useDeleteRepresentative() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ stateName, constituencyName, repType }: { stateName: string; constituencyName: string; repType: string }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.deleteRepresentative(stateName, constituencyName, repType);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['directory'] });
      queryClient.refetchQueries({ queryKey: ['directory'] });
    },
  });
}

export function useUpdateState() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ stateName, updatedState }: { stateName: string; updatedState: State }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateState(stateName, updatedState);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['directory'] });
      queryClient.refetchQueries({ queryKey: ['directory'] });
    },
  });
}

export function useUpdateUnionTerritory() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ utName, updatedUT }: { utName: string; updatedUT: State }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateUnionTerritory(utName, updatedUT);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['directory'] });
      queryClient.refetchQueries({ queryKey: ['directory'] });
    },
  });
}

export function useUpdateConstituency() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ stateName, constituencyName, updatedConstituency }: { stateName: string; constituencyName: string; updatedConstituency: Constituency }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateConstituency(stateName, constituencyName, updatedConstituency);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['directory'] });
      queryClient.refetchQueries({ queryKey: ['directory'] });
    },
  });
}

export function useUpdateRepresentativeDetails() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ stateName, constituencyName, repType, repName, updatedRep }: { stateName: string; constituencyName: string; repType: string; repName: string; updatedRep: Representative }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateRepresentativeDetails(stateName, constituencyName, repType, repName, updatedRep);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['directory'] });
      queryClient.refetchQueries({ queryKey: ['directory'] });
    },
  });
}

export function useSetPrimeMinister() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (pm: Representative) => {
      if (!actor) throw new Error('Actor not available');
      return actor.setPrimeMinister(pm);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['directory'] });
      queryClient.refetchQueries({ queryKey: ['directory'] });
    },
  });
}

export function useImportDirectory() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newDirectory: Directory) => {
      if (!actor) throw new Error('Actor not available');
      return actor.importDirectory(newDirectory);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['directory'] });
      queryClient.refetchQueries({ queryKey: ['directory'] });
    },
  });
}

export function useExportDirectory() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.exportDirectory();
    },
  });
}

// Volunteer stats hook - accepts optional volunteer name parameter
export function useGetVolunteerStats(volunteerName?: string) {
  const { actor, isFetching } = useActor();
  const { data: allReports } = useGetAllReports();
  
  return useQuery({
    queryKey: ['volunteerStats', volunteerName],
    queryFn: async () => {
      if (!volunteerName || !allReports) {
        return {
          reportsSubmitted: 0,
          reportsResolved: 0,
          statusUpdates: 0,
          impactScore: BigInt(0),
        };
      }

      // Count reports submitted by this volunteer
      const reportsSubmitted = allReports.filter(
        report => report.submittedByVolunteer && report.username === volunteerName
      ).length;

      // Count reports resolved by this volunteer
      const reportsResolved = allReports.filter(
        report => report.resolvedByVolunteer && report.reporterName === volunteerName
      ).length;

      // Status updates = reports resolved
      const statusUpdates = reportsResolved;

      // Calculate impact score (same as backend logic)
      const impactScore = BigInt((reportsSubmitted + reportsResolved) * 10);

      return {
        reportsSubmitted,
        reportsResolved,
        statusUpdates,
        impactScore,
      };
    },
    enabled: !!actor && !isFetching && !!volunteerName,
  });
}

export function useRegisterNgoNpo() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ organizationName, logoPath, contactPerson, email, phone, address, website, description, missionStatement, showContactInfo }: {
      organizationName: string;
      logoPath: string;
      contactPerson: string;
      email: string;
      phone: string;
      address: string;
      website: string;
      description: string;
      missionStatement: string;
      showContactInfo: boolean;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.registerNgoNpo(organizationName, logoPath, contactPerson, email, phone, address, website, description, missionStatement, showContactInfo);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myNgoNpoProfile'] });
      queryClient.invalidateQueries({ queryKey: ['allNgoNpos'] });
    },
  });
}

export function useApproveNgoNpo() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (ngoNpoId: string) => {
      if (!actor) throw new Error('Actor not available');
      return actor.approveNgoNpo(ngoNpoId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allNgoNpos'] });
      queryClient.invalidateQueries({ queryKey: ['ngoNpoDirectory'] });
    },
  });
}

export function useRejectNgoNpo() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ ngoNpoId, rejectionNote }: { ngoNpoId: string; rejectionNote: string }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.rejectNgoNpo(ngoNpoId, rejectionNote);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allNgoNpos'] });
      queryClient.invalidateQueries({ queryKey: ['ngoNpoDirectory'] });
    },
  });
}

export function useUpdateNgoNpoPrivacy() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ ngoNpoId, showContactInfo }: { ngoNpoId: string; showContactInfo: boolean }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateNgoNpoPrivacy(ngoNpoId, showContactInfo);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myNgoNpoProfile'] });
      queryClient.invalidateQueries({ queryKey: ['ngoNpoDirectory'] });
      queryClient.invalidateQueries({ queryKey: ['allNgoNpos'] });
    },
  });
}

export function useGetNgoNpoDirectory() {
  const { actor, isFetching } = useActor();

  return useQuery<NgoNpo[]>({
    queryKey: ['ngoNpoDirectory'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getNgoNpoDirectory();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetMyNgoNpoProfile() {
  const { actor, isFetching } = useActor();

  return useQuery<NgoNpo | null>({
    queryKey: ['myNgoNpoProfile'],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getMyNgoNpoProfile();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetAllNgoNpos() {
  const { actor, isFetching } = useActor();

  return useQuery<NgoNpo[]>({
    queryKey: ['allNgoNpos'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllNgoNpos();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetNgoNpoById(ngoNpoId: string) {
  const { actor, isFetching } = useActor();

  return useQuery<NgoNpo | null>({
    queryKey: ['ngoNpo', ngoNpoId],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getNgoNpoById(ngoNpoId);
    },
    enabled: !!actor && !isFetching && !!ngoNpoId,
  });
}

export function useSubmitFeedback() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ type, message, contactInfo }: { type: string; message: string; contactInfo: string }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.submitFeedback(type, message, contactInfo);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allFeedback'] });
    },
  });
}

export function useGetAllFeedback() {
  const { actor, isFetching } = useActor();

  return useQuery<Feedback[]>({
    queryKey: ['allFeedback'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllFeedback();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useUpdateFeedbackStatus() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ feedbackId, status }: { feedbackId: string; status: string }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateFeedbackStatus(feedbackId, status);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allFeedback'] });
    },
  });
}

export function useRespondToFeedback() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ feedbackId, response }: { feedbackId: string; response: string }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.respondToFeedback(feedbackId, response);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allFeedback'] });
    },
  });
}

export function useDeleteFeedback() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (feedbackId: string) => {
      if (!actor) throw new Error('Actor not available');
      return actor.deleteFeedback(feedbackId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allFeedback'] });
    },
  });
}

export function useTrackUniqueVisitor() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.trackUniqueVisitor();
    },
  });
}

export function useGetTotalUniqueVisitors() {
  const { actor, isFetching } = useActor();

  return useQuery<bigint>({
    queryKey: ['totalUniqueVisitors'],
    queryFn: async () => {
      if (!actor) return BigInt(0);
      return actor.getTotalUniqueVisitors();
    },
    enabled: !!actor && !isFetching,
    staleTime: 30000,
  });
}
