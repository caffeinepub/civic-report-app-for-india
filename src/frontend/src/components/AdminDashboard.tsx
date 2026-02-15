import React, { useState } from 'react';
import { Shield, Users, FileText, Settings, UserCheck, Award, Clock, CheckCircle, XCircle, User, Mail, Phone, MapPin, Calendar, Eye, MessageSquare, Building2, Menu, X as CloseIcon, Globe, FileText as FileTextIcon, Star, Edit } from 'lucide-react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useIsAdmin, useGetAllVolunteers, useApproveVolunteer, useRejectVolunteer, useGetAllReports, useGetAllNgoNpos, useApproveNgoNpo, useRejectNgoNpo, useGetAllPendingProfileEdits, useApproveVolunteerProfileEdit, useRejectVolunteerProfileEdit } from '../hooks/useQueries';
import { useFileUrl } from '../blob-storage/FileStorage';
import { AdminReportsTable } from './AdminReportsTable';
import { AdminUserManagement } from './AdminUserManagement';
import { AdminContentManagement } from './AdminContentManagement';
import { AdminDirectory } from './AdminDirectory';
import { AdminFeedbackManagement } from './AdminFeedbackManagement';
import { LazyImage } from './LazyImage';
import { Principal } from '@dfinity/principal';
import { NgoNpo, PendingProfileEdit, Volunteer } from '../backend';

type AdminTab = 'reports' | 'users' | 'volunteers' | 'ngo-npo' | 'content' | 'directory' | 'feedback';

export function AdminDashboard() {
  const { identity, login, loginStatus } = useInternetIdentity();
  const { data: isAdmin, isLoading: isLoadingAdmin } = useIsAdmin();
  const { data: allVolunteers, isLoading: isLoadingVolunteers } = useGetAllVolunteers();
  const { data: allReports, isLoading: isLoadingReports } = useGetAllReports();
  const { data: allNgoNpos, isLoading: isLoadingNgoNpos } = useGetAllNgoNpos();
  const { data: pendingProfileEdits, isLoading: isLoadingPendingEdits } = useGetAllPendingProfileEdits();
  const { mutate: approveVolunteer, isPending: isApprovingVolunteer } = useApproveVolunteer();
  const { mutate: rejectVolunteer, isPending: isRejectingVolunteer } = useRejectVolunteer();
  const { mutate: approveNgoNpo, isPending: isApprovingNgoNpo } = useApproveNgoNpo();
  const { mutate: rejectNgoNpo, isPending: isRejectingNgoNpo } = useRejectNgoNpo();
  const { mutate: approveProfileEdit, isPending: isApprovingProfileEdit } = useApproveVolunteerProfileEdit();
  const { mutate: rejectProfileEdit, isPending: isRejectingProfileEdit } = useRejectVolunteerProfileEdit();
  
  const [activeTab, setActiveTab] = useState<AdminTab>('reports');
  const [selectedVolunteer, setSelectedVolunteer] = useState<any>(null);
  const [selectedNgoNpo, setSelectedNgoNpo] = useState<NgoNpo | null>(null);
  const [selectedProfileEdit, setSelectedProfileEdit] = useState<PendingProfileEdit | null>(null);
  const [rejectionNote, setRejectionNote] = useState('');
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [volunteerToReject, setVolunteerToReject] = useState<any>(null);
  const [ngoNpoToReject, setNgoNpoToReject] = useState<NgoNpo | null>(null);
  const [profileEditToReject, setProfileEditToReject] = useState<PendingProfileEdit | null>(null);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const handleLogin = async () => {
    try {
      await login();
    } catch (error: any) {
      console.error('Login error:', error);
      if (error.message === 'User is already authenticated') {
        window.location.reload();
      }
    }
  };

  const handleApproveVolunteer = (volunteerId: string) => {
    if (confirm('Are you sure you want to approve this volunteer application?')) {
      approveVolunteer(volunteerId);
    }
  };

  const handleRejectVolunteer = (volunteer: any) => {
    setVolunteerToReject(volunteer);
    setNgoNpoToReject(null);
    setProfileEditToReject(null);
    setRejectionNote('');
    setShowRejectionModal(true);
  };

  const handleApproveNgoNpo = (ngoNpoId: string) => {
    if (confirm('Are you sure you want to approve this NGO/NPO application?')) {
      approveNgoNpo(ngoNpoId);
    }
  };

  const handleRejectNgoNpo = (ngoNpo: NgoNpo) => {
    setNgoNpoToReject(ngoNpo);
    setVolunteerToReject(null);
    setProfileEditToReject(null);
    setRejectionNote('');
    setShowRejectionModal(true);
  };

  const handleApproveProfileEdit = (editId: string) => {
    if (confirm('Are you sure you want to approve this profile edit request?')) {
      approveProfileEdit(editId);
    }
  };

  const handleRejectProfileEdit = (edit: PendingProfileEdit) => {
    setProfileEditToReject(edit);
    setVolunteerToReject(null);
    setNgoNpoToReject(null);
    setRejectionNote('');
    setShowRejectionModal(true);
  };

  const confirmReject = () => {
    if (rejectionNote.trim()) {
      if (volunteerToReject) {
        rejectVolunteer({ volunteerId: volunteerToReject.id, rejectionNote: rejectionNote.trim() });
      } else if (ngoNpoToReject) {
        rejectNgoNpo({ ngoNpoId: ngoNpoToReject.id, rejectionNote: rejectionNote.trim() });
      } else if (profileEditToReject) {
        rejectProfileEdit({ editId: profileEditToReject.id, rejectionNote: rejectionNote.trim() });
      }
      setShowRejectionModal(false);
      setVolunteerToReject(null);
      setNgoNpoToReject(null);
      setProfileEditToReject(null);
      setRejectionNote('');
    }
  };

  if (!identity) {
    return (
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-md p-6 sm:p-8 text-center">
          <Shield className="h-12 sm:h-16 w-12 sm:w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">Admin Dashboard</h2>
          <p className="text-sm sm:text-base text-gray-600 mb-6">
            Sign in with Internet Identity to access the admin dashboard.
          </p>
          <button
            onClick={handleLogin}
            disabled={loginStatus === 'logging-in'}
            className="bg-red-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-sm sm:text-base"
          >
            {loginStatus === 'logging-in' ? 'Signing in...' : 'Sign in with Internet Identity'}
          </button>
        </div>
      </div>
    );
  }

  if (isLoadingAdmin) {
    return (
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-md p-6 sm:p-8 text-center">
          <Shield className="h-12 sm:h-16 w-12 sm:w-16 text-red-500 mx-auto mb-4 animate-pulse" />
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">Checking Admin Access...</h2>
          <p className="text-sm sm:text-base text-gray-600">Please wait while we verify your permissions.</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-md p-6 sm:p-8 text-center">
          <Shield className="h-12 sm:h-16 w-12 sm:w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
          <p className="text-sm sm:text-base text-gray-600 mb-6">
            You don't have admin permissions to access this dashboard.
          </p>
          <p className="text-xs sm:text-sm text-gray-500 break-all">
            Principal: {identity.getPrincipal().toString()}
          </p>
        </div>
      </div>
    );
  }

  const pendingVolunteers = allVolunteers?.filter(v => !v.approved && !v.rejectionNote) || [];
  const approvedVolunteers = allVolunteers?.filter(v => v.approved) || [];
  const rejectedVolunteers = allVolunteers?.filter(v => v.rejectionNote && !v.approved) || [];

  const pendingNgoNpos = allNgoNpos?.filter(n => !n.approved && !n.rejectionNote) || [];
  const approvedNgoNpos = allNgoNpos?.filter(n => n.approved) || [];
  const rejectedNgoNpos = allNgoNpos?.filter(n => n.rejectionNote && !n.approved) || [];

  const tabs = [
    { id: 'reports' as AdminTab, label: 'Reports', icon: FileText },
    { 
      id: 'volunteers' as AdminTab, 
      label: 'Volunteers', 
      icon: UserCheck,
      badge: (pendingVolunteers.length + (pendingProfileEdits?.length || 0)) > 0 ? (pendingVolunteers.length + (pendingProfileEdits?.length || 0)) : undefined
    },
    { 
      id: 'ngo-npo' as AdminTab, 
      label: 'NGO/NPO', 
      icon: Building2,
      badge: pendingNgoNpos.length > 0 ? pendingNgoNpos.length : undefined
    },
    { id: 'directory' as AdminTab, label: 'Directory', icon: Building2 },
    { id: 'feedback' as AdminTab, label: 'Feedback', icon: MessageSquare },
    { id: 'users' as AdminTab, label: 'Users', icon: Users },
    { id: 'content' as AdminTab, label: 'Content', icon: Settings },
  ];

  const VolunteerCard = ({ volunteer }: { volunteer: Volunteer }) => {
    const { data: photoUrl } = useFileUrl(volunteer.photoPath);
    
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
        <div className="flex items-start space-x-4">
          <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-100 flex-shrink-0">
            {photoUrl ? (
              <LazyImage
                src={photoUrl}
                alt={volunteer.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <User className="h-8 w-8 text-gray-400" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-base font-semibold text-gray-900 truncate">{volunteer.name}</h4>
            <div className="mt-2 space-y-1">
              <div className="flex items-center text-sm text-gray-600">
                <Phone className="h-4 w-4 mr-2 flex-shrink-0" />
                <span className="truncate">{volunteer.contactInfo}</span>
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <MapPin className="h-4 w-4 mr-2 flex-shrink-0" />
                <span className="truncate">{volunteer.address}</span>
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <Calendar className="h-4 w-4 mr-2 flex-shrink-0" />
                <span>Applied: {new Date(Number(volunteer.applicationDate) / 1000000).toLocaleDateString()}</span>
              </div>
              {volunteer.impactScore > 0 && (
                <div className="flex items-center text-sm text-blue-600">
                  <Award className="h-4 w-4 mr-2 flex-shrink-0" />
                  <span>Impact Score: {Number(volunteer.impactScore)}</span>
                </div>
              )}
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedVolunteer(volunteer)}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center"
              >
                <Eye className="h-4 w-4 mr-1" />
                View Details
              </button>
              {!volunteer.approved && !volunteer.rejectionNote && (
                <>
                  <button
                    onClick={() => handleApproveVolunteer(volunteer.id)}
                    disabled={isApprovingVolunteer}
                    className="text-sm bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 disabled:opacity-50 flex items-center"
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Approve
                  </button>
                  <button
                    onClick={() => handleRejectVolunteer(volunteer)}
                    disabled={isRejectingVolunteer}
                    className="text-sm bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 disabled:opacity-50 flex items-center"
                  >
                    <XCircle className="h-4 w-4 mr-1" />
                    Reject
                  </button>
                </>
              )}
            </div>
            {volunteer.rejectionNote && (
              <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                <strong>Rejection Note:</strong> {volunteer.rejectionNote}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const NgoNpoCard = ({ ngoNpo }: { ngoNpo: NgoNpo }) => {
    const { data: logoUrl } = useFileUrl(ngoNpo.logoPath);
    
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
        <div className="flex items-start space-x-4">
          <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
            {logoUrl ? (
              <LazyImage
                src={logoUrl}
                alt={ngoNpo.organizationName}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Building2 className="h-8 w-8 text-gray-400" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-base font-semibold text-gray-900 truncate">{ngoNpo.organizationName}</h4>
            <div className="mt-2 space-y-1">
              <div className="flex items-center text-sm text-gray-600">
                <User className="h-4 w-4 mr-2 flex-shrink-0" />
                <span className="truncate">{ngoNpo.contactPerson}</span>
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <Mail className="h-4 w-4 mr-2 flex-shrink-0" />
                <span className="truncate">{ngoNpo.email}</span>
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <Phone className="h-4 w-4 mr-2 flex-shrink-0" />
                <span className="truncate">{ngoNpo.phone}</span>
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <Calendar className="h-4 w-4 mr-2 flex-shrink-0" />
                <span>Registered: {new Date(Number(ngoNpo.registrationDate) / 1000000).toLocaleDateString()}</span>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedNgoNpo(ngoNpo)}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center"
              >
                <Eye className="h-4 w-4 mr-1" />
                View Details
              </button>
              {!ngoNpo.approved && !ngoNpo.rejectionNote && (
                <>
                  <button
                    onClick={() => handleApproveNgoNpo(ngoNpo.id)}
                    disabled={isApprovingNgoNpo}
                    className="text-sm bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 disabled:opacity-50 flex items-center"
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Approve
                  </button>
                  <button
                    onClick={() => handleRejectNgoNpo(ngoNpo)}
                    disabled={isRejectingNgoNpo}
                    className="text-sm bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 disabled:opacity-50 flex items-center"
                  >
                    <XCircle className="h-4 w-4 mr-1" />
                    Reject
                  </button>
                </>
              )}
            </div>
            {ngoNpo.rejectionNote && (
              <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                <strong>Rejection Note:</strong> {ngoNpo.rejectionNote}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const ProfileEditCard = ({ edit }: { edit: PendingProfileEdit }) => {
    const { data: photoUrl } = useFileUrl(edit.updates.photoPath);
    const volunteer = allVolunteers?.find(v => v.id === edit.volunteerId);
    
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
        <div className="flex items-start space-x-4">
          <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-100 flex-shrink-0">
            {photoUrl ? (
              <LazyImage
                src={photoUrl}
                alt={edit.updates.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <User className="h-8 w-8 text-gray-400" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-base font-semibold text-gray-900 truncate">{edit.updates.name}</h4>
            <p className="text-sm text-gray-500">Volunteer: {volunteer?.name}</p>
            <div className="mt-2 space-y-1">
              <div className="flex items-center text-sm text-gray-600">
                <Phone className="h-4 w-4 mr-2 flex-shrink-0" />
                <span className="truncate">{edit.updates.contactInfo}</span>
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <MapPin className="h-4 w-4 mr-2 flex-shrink-0" />
                <span className="truncate">{edit.updates.address}</span>
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <Calendar className="h-4 w-4 mr-2 flex-shrink-0" />
                <span>Submitted: {new Date(Number(edit.submittedAt) / 1000000).toLocaleDateString()}</span>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedProfileEdit(edit)}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center"
              >
                <Eye className="h-4 w-4 mr-1" />
                View Details
              </button>
              <button
                onClick={() => handleApproveProfileEdit(edit.id)}
                disabled={isApprovingProfileEdit}
                className="text-sm bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 disabled:opacity-50 flex items-center"
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                Approve
              </button>
              <button
                onClick={() => handleRejectProfileEdit(edit)}
                disabled={isRejectingProfileEdit}
                className="text-sm bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 disabled:opacity-50 flex items-center"
              >
                <XCircle className="h-4 w-4 mr-1" />
                Reject
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-4 sm:mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 sm:space-x-4 min-w-0">
            <Shield className="h-6 sm:h-8 w-6 sm:w-8 text-red-500 flex-shrink-0" />
            <div className="min-w-0">
              <h1 className="text-lg sm:text-2xl font-bold text-gray-900 truncate">Admin Dashboard</h1>
              <p className="text-xs sm:text-base text-gray-600 hidden sm:block">Manage reports, volunteers, NGOs/NPOs, directory, feedback, users, and content</p>
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-xs sm:text-sm text-gray-600">Admin</p>
            <p className="font-mono text-xs text-gray-500 max-w-[80px] sm:max-w-[120px] truncate" title={identity.getPrincipal().toString()}>
              {identity.getPrincipal().toString().slice(0, 8)}...
            </p>
          </div>
        </div>
      </div>

      <div className="lg:hidden mb-4">
        <button
          onClick={() => setShowMobileMenu(!showMobileMenu)}
          className="w-full bg-white rounded-lg shadow-md p-4 flex items-center justify-between"
        >
          <div className="flex items-center space-x-2">
            {tabs.find(t => t.id === activeTab)?.icon && React.createElement(tabs.find(t => t.id === activeTab)!.icon, { className: "h-5 w-5 text-red-600" })}
            <span className="font-medium text-gray-900">{tabs.find(t => t.id === activeTab)?.label}</span>
          </div>
          {showMobileMenu ? <CloseIcon className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {showMobileMenu && (
        <div className="lg:hidden bg-white rounded-lg shadow-md mb-4 overflow-hidden">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setShowMobileMenu(false);
                }}
                className={`w-full flex items-center justify-between p-4 border-b border-gray-100 last:border-b-0 transition-colors ${
                  activeTab === tab.id
                    ? 'bg-red-50 text-red-600'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon className="h-5 w-5" />
                  <span className="font-medium">{tab.label}</span>
                </div>
                {tab.badge && (
                  <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      <div className="hidden lg:block bg-white rounded-lg shadow-md mb-6">
        <div className="border-b border-gray-200">
          <nav className="flex flex-wrap px-4 sm:px-6">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-3 sm:py-4 px-2 sm:px-4 border-b-2 font-medium text-xs sm:text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-red-500 text-red-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-4 sm:h-5 w-4 sm:w-5" />
                  <span className="hidden sm:inline">{tab.label}</span>
                  <span className="sm:hidden">{tab.label.slice(0, 3)}</span>
                  {tab.badge && (
                    <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full">
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      <div className="space-y-4 sm:space-y-6">
        {activeTab === 'reports' && (
          <div>
            {isLoadingReports ? (
              <div className="bg-white rounded-lg shadow-md p-6 sm:p-8 text-center">
                <FileText className="h-10 sm:h-12 w-10 sm:w-12 text-gray-400 mx-auto mb-4 animate-pulse" />
                <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">Loading Reports...</h3>
                <p className="text-sm sm:text-base text-gray-600">Please wait while we fetch the report data.</p>
              </div>
            ) : !allReports || allReports.length === 0 ? (
              <div className="bg-white rounded-lg shadow-md p-6 sm:p-8 text-center">
                <FileText className="h-10 sm:h-12 w-10 sm:w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">No Reports Found</h3>
                <p className="text-sm sm:text-base text-gray-600">No reports have been submitted yet.</p>
              </div>
            ) : (
              <AdminReportsTable reports={allReports} />
            )}
          </div>
        )}
        
        {activeTab === 'volunteers' && (
          <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 space-y-2 sm:space-y-0">
              <div className="flex items-center space-x-2 sm:space-x-3">
                <UserCheck className="h-5 sm:h-6 w-5 sm:w-6 text-blue-600" />
                <h2 className="text-lg sm:text-xl font-bold text-gray-900">Volunteer Management</h2>
              </div>
              <div className="text-xs sm:text-sm text-gray-600">
                {allVolunteers?.length || 0} total • {pendingVolunteers.length} pending • {approvedVolunteers.length} approved • {rejectedVolunteers.length} rejected
              </div>
            </div>

            {isLoadingVolunteers ? (
              <div className="text-center py-8">
                <Clock className="h-6 sm:h-8 w-6 sm:w-8 text-blue-500 mx-auto mb-2 animate-spin" />
                <p className="text-sm sm:text-base text-gray-600">Loading volunteer applications...</p>
              </div>
            ) : !allVolunteers || allVolunteers.length === 0 ? (
              <div className="text-center py-8">
                <UserCheck className="h-10 sm:h-12 w-10 sm:w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">No Volunteer Applications</h3>
                <p className="text-sm sm:text-base text-gray-600">No volunteer applications have been submitted yet.</p>
              </div>
            ) : (
              <div className="space-y-4 sm:space-y-6">
                {pendingProfileEdits && pendingProfileEdits.length > 0 && (
                  <div>
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center">
                      <Edit className="h-5 w-5 mr-2 text-orange-600" />
                      Pending Profile Edit Requests ({pendingProfileEdits.length})
                    </h3>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {pendingProfileEdits.map((edit) => (
                        <ProfileEditCard key={edit.id} edit={edit} />
                      ))}
                    </div>
                  </div>
                )}

                {pendingVolunteers.length > 0 && (
                  <div>
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center">
                      <Clock className="h-5 w-5 mr-2 text-yellow-600" />
                      Pending Applications ({pendingVolunteers.length})
                    </h3>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {pendingVolunteers.map((volunteer) => (
                        <VolunteerCard key={volunteer.id} volunteer={volunteer} />
                      ))}
                    </div>
                  </div>
                )}

                {approvedVolunteers.length > 0 && (
                  <div>
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center">
                      <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
                      Approved Volunteers ({approvedVolunteers.length})
                    </h3>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {approvedVolunteers.map((volunteer) => (
                        <VolunteerCard key={volunteer.id} volunteer={volunteer} />
                      ))}
                    </div>
                  </div>
                )}

                {rejectedVolunteers.length > 0 && (
                  <div>
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center">
                      <XCircle className="h-5 w-5 mr-2 text-red-600" />
                      Rejected Applications ({rejectedVolunteers.length})
                    </h3>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {rejectedVolunteers.map((volunteer) => (
                        <VolunteerCard key={volunteer.id} volunteer={volunteer} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'ngo-npo' && (
          <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 space-y-2 sm:space-y-0">
              <div className="flex items-center space-x-2 sm:space-x-3">
                <Building2 className="h-5 sm:h-6 w-5 sm:w-6 text-purple-600" />
                <h2 className="text-lg sm:text-xl font-bold text-gray-900">NGO/NPO Management</h2>
              </div>
              <div className="text-xs sm:text-sm text-gray-600">
                {allNgoNpos?.length || 0} total • {pendingNgoNpos.length} pending • {approvedNgoNpos.length} approved • {rejectedNgoNpos.length} rejected
              </div>
            </div>

            {isLoadingNgoNpos ? (
              <div className="text-center py-8">
                <Clock className="h-6 sm:h-8 w-6 sm:w-8 text-purple-500 mx-auto mb-2 animate-spin" />
                <p className="text-sm sm:text-base text-gray-600">Loading NGO/NPO applications...</p>
              </div>
            ) : !allNgoNpos || allNgoNpos.length === 0 ? (
              <div className="text-center py-8">
                <Building2 className="h-10 sm:h-12 w-10 sm:w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">No NGO/NPO Applications</h3>
                <p className="text-sm sm:text-base text-gray-600">No NGO/NPO applications have been submitted yet.</p>
              </div>
            ) : (
              <div className="space-y-4 sm:space-y-6">
                {pendingNgoNpos.length > 0 && (
                  <div>
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center">
                      <Clock className="h-5 w-5 mr-2 text-yellow-600" />
                      Pending Applications ({pendingNgoNpos.length})
                    </h3>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {pendingNgoNpos.map((ngoNpo) => (
                        <NgoNpoCard key={ngoNpo.id} ngoNpo={ngoNpo} />
                      ))}
                    </div>
                  </div>
                )}

                {approvedNgoNpos.length > 0 && (
                  <div>
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center">
                      <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
                      Approved Organizations ({approvedNgoNpos.length})
                    </h3>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {approvedNgoNpos.map((ngoNpo) => (
                        <NgoNpoCard key={ngoNpo.id} ngoNpo={ngoNpo} />
                      ))}
                    </div>
                  </div>
                )}

                {rejectedNgoNpos.length > 0 && (
                  <div>
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center">
                      <XCircle className="h-5 w-5 mr-2 text-red-600" />
                      Rejected Applications ({rejectedNgoNpos.length})
                    </h3>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {rejectedNgoNpos.map((ngoNpo) => (
                        <NgoNpoCard key={ngoNpo.id} ngoNpo={ngoNpo} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'directory' && <AdminDirectory />}
        {activeTab === 'feedback' && <AdminFeedbackManagement />}
        {activeTab === 'users' && <AdminUserManagement />}
        {activeTab === 'content' && <AdminContentManagement />}
      </div>

      {/* Volunteer Detail Modal */}
      {selectedVolunteer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900">Volunteer Details</h3>
                <button
                  onClick={() => setSelectedVolunteer(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <CloseIcon className="h-6 w-6" />
                </button>
              </div>
              <VolunteerDetailModal volunteer={selectedVolunteer} />
            </div>
          </div>
        </div>
      )}

      {/* NGO/NPO Detail Modal */}
      {selectedNgoNpo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900">NGO/NPO Details</h3>
                <button
                  onClick={() => setSelectedNgoNpo(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <CloseIcon className="h-6 w-6" />
                </button>
              </div>
              <NgoNpoDetailModal ngoNpo={selectedNgoNpo} />
            </div>
          </div>
        </div>
      )}

      {/* Profile Edit Detail Modal */}
      {selectedProfileEdit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900">Profile Edit Request Details</h3>
                <button
                  onClick={() => setSelectedProfileEdit(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <CloseIcon className="h-6 w-6" />
                </button>
              </div>
              <ProfileEditDetailModal edit={selectedProfileEdit} volunteer={allVolunteers?.find(v => v.id === selectedProfileEdit.volunteerId)} />
            </div>
          </div>
        </div>
      )}

      {/* Rejection Modal */}
      {showRejectionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Rejection Note</h3>
            <p className="text-sm text-gray-600 mb-4">
              Please provide a reason for rejecting this {volunteerToReject ? 'volunteer application' : ngoNpoToReject ? 'NGO/NPO application' : 'profile edit request'}:
            </p>
            <textarea
              value={rejectionNote}
              onChange={(e) => setRejectionNote(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent"
              rows={4}
              placeholder="Enter rejection reason..."
            />
            <div className="flex justify-end space-x-3 mt-4">
              <button
                onClick={() => {
                  setShowRejectionModal(false);
                  setVolunteerToReject(null);
                  setNgoNpoToReject(null);
                  setProfileEditToReject(null);
                  setRejectionNote('');
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={confirmReject}
                disabled={!rejectionNote.trim()}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function VolunteerDetailModal({ volunteer }: { volunteer: Volunteer }) {
  const { data: photoUrl } = useFileUrl(volunteer.photoPath);
  
  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-4">
        <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-100 flex-shrink-0">
          {photoUrl ? (
            <LazyImage
              src={photoUrl}
              alt={volunteer.name}
              className="w-full h-full object-cover"
              priority="high"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <User className="h-12 w-12 text-gray-400" />
            </div>
          )}
        </div>
        <div>
          <h4 className="text-lg font-semibold text-gray-900">{volunteer.name}</h4>
          <p className="text-sm text-gray-500">
            Status: {volunteer.approved ? 'Approved' : volunteer.rejectionNote ? 'Rejected' : 'Pending'}
          </p>
        </div>
      </div>
      <div className="space-y-3">
        <div>
          <label className="text-sm font-medium text-gray-700">Contact Information</label>
          <p className="text-sm text-gray-900">{volunteer.contactInfo}</p>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700">Address</label>
          <p className="text-sm text-gray-900">{volunteer.address}</p>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700">Application Date</label>
          <p className="text-sm text-gray-900">
            {new Date(Number(volunteer.applicationDate) / 1000000).toLocaleString()}
          </p>
        </div>
        {volunteer.approvalTimestamp && (
          <div>
            <label className="text-sm font-medium text-gray-700">Approval Date</label>
            <p className="text-sm text-gray-900">
              {new Date(Number(volunteer.approvalTimestamp) / 1000000).toLocaleString()}
            </p>
          </div>
        )}
        {volunteer.impactScore > 0 && (
          <div>
            <label className="text-sm font-medium text-gray-700">Impact Score</label>
            <p className="text-sm text-gray-900">{Number(volunteer.impactScore)}</p>
          </div>
        )}
        {volunteer.rejectionNote && (
          <div>
            <label className="text-sm font-medium text-gray-700">Rejection Note</label>
            <p className="text-sm text-red-700">{volunteer.rejectionNote}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function NgoNpoDetailModal({ ngoNpo }: { ngoNpo: NgoNpo }) {
  const { data: logoUrl } = useFileUrl(ngoNpo.logoPath);
  
  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-4">
        <div className="w-24 h-24 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
          {logoUrl ? (
            <LazyImage
              src={logoUrl}
              alt={ngoNpo.organizationName}
              className="w-full h-full object-cover"
              priority="high"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Building2 className="h-12 w-12 text-gray-400" />
            </div>
          )}
        </div>
        <div>
          <h4 className="text-lg font-semibold text-gray-900">{ngoNpo.organizationName}</h4>
          <p className="text-sm text-gray-500">
            Status: {ngoNpo.approved ? 'Approved' : ngoNpo.rejectionNote ? 'Rejected' : 'Pending'}
          </p>
        </div>
      </div>
      <div className="space-y-3">
        <div>
          <label className="text-sm font-medium text-gray-700">Mission Statement</label>
          <p className="text-sm text-gray-900">{ngoNpo.missionStatement}</p>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700">Description</label>
          <p className="text-sm text-gray-900">{ngoNpo.description}</p>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700">Contact Person</label>
          <p className="text-sm text-gray-900">{ngoNpo.contactPerson}</p>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700">Email</label>
          <p className="text-sm text-gray-900">{ngoNpo.email}</p>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700">Phone</label>
          <p className="text-sm text-gray-900">{ngoNpo.phone}</p>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700">Address</label>
          <p className="text-sm text-gray-900">{ngoNpo.address}</p>
        </div>
        {ngoNpo.website && (
          <div>
            <label className="text-sm font-medium text-gray-700">Website</label>
            <p className="text-sm text-gray-900">{ngoNpo.website}</p>
          </div>
        )}
        <div>
          <label className="text-sm font-medium text-gray-700">Registration Date</label>
          <p className="text-sm text-gray-900">
            {new Date(Number(ngoNpo.registrationDate) / 1000000).toLocaleString()}
          </p>
        </div>
        {ngoNpo.approvalTimestamp && (
          <div>
            <label className="text-sm font-medium text-gray-700">Approval Date</label>
            <p className="text-sm text-gray-900">
              {new Date(Number(ngoNpo.approvalTimestamp) / 1000000).toLocaleString()}
            </p>
          </div>
        )}
        {ngoNpo.rejectionNote && (
          <div>
            <label className="text-sm font-medium text-gray-700">Rejection Note</label>
            <p className="text-sm text-red-700">{ngoNpo.rejectionNote}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function ProfileEditDetailModal({ edit, volunteer }: { edit: PendingProfileEdit; volunteer?: Volunteer }) {
  const { data: newPhotoUrl } = useFileUrl(edit.updates.photoPath);
  const { data: oldPhotoUrl } = useFileUrl(volunteer?.photoPath || '');
  
  return (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h5 className="text-sm font-semibold text-blue-900 mb-2">Current Volunteer Information</h5>
        {volunteer && (
          <div className="space-y-2">
            <div className="flex items-center space-x-3">
              <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-100 flex-shrink-0">
                {oldPhotoUrl ? (
                  <LazyImage
                    src={oldPhotoUrl}
                    alt={volunteer.name}
                    className="w-full h-full object-cover"
                    priority="high"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <User className="h-8 w-8 text-gray-400" />
                  </div>
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">{volunteer.name}</p>
                <p className="text-xs text-gray-600">{volunteer.contactInfo}</p>
                <p className="text-xs text-gray-600">{volunteer.address}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <h5 className="text-sm font-semibold text-green-900 mb-2">Proposed Changes</h5>
        <div className="space-y-2">
          <div className="flex items-center space-x-3">
            <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-100 flex-shrink-0">
              {newPhotoUrl ? (
                <LazyImage
                  src={newPhotoUrl}
                  alt={edit.updates.name}
                  className="w-full h-full object-cover"
                  priority="high"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <User className="h-8 w-8 text-gray-400" />
                </div>
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">{edit.updates.name}</p>
              <p className="text-xs text-gray-600">{edit.updates.contactInfo}</p>
              <p className="text-xs text-gray-600">{edit.updates.address}</p>
            </div>
          </div>
        </div>
      </div>

      <div>
        <label className="text-sm font-medium text-gray-700">Submitted At</label>
        <p className="text-sm text-gray-900">
          {new Date(Number(edit.submittedAt) / 1000000).toLocaleString()}
        </p>
      </div>
    </div>
  );
}
