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
                      <Edit className="h-4 sm:h-5 w-4 sm:w-5 text-purple-500 mr-2" />
                      Pending Profile Edit Requests ({pendingProfileEdits.length})
                    </h3>
                    <div className="grid grid-cols-1 gap-3 sm:gap-4">
                      {pendingProfileEdits.map((edit) => (
                        <ProfileEditRequestCard
                          key={edit.id}
                          edit={edit}
                          volunteers={allVolunteers}
                          onApprove={() => handleApproveProfileEdit(edit.id)}
                          onReject={() => handleRejectProfileEdit(edit)}
                          onViewDetails={() => setSelectedProfileEdit(edit)}
                          isApproving={isApprovingProfileEdit}
                          isRejecting={isRejectingProfileEdit}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {pendingVolunteers.length > 0 && (
                  <div>
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center">
                      <Clock className="h-4 sm:h-5 w-4 sm:w-5 text-yellow-500 mr-2" />
                      Pending Applications ({pendingVolunteers.length})
                    </h3>
                    <div className="grid grid-cols-1 gap-3 sm:gap-4">
                      {pendingVolunteers.map((volunteer) => (
                        <VolunteerApplicationCard
                          key={volunteer.id}
                          volunteer={volunteer}
                          onApprove={() => handleApproveVolunteer(volunteer.id)}
                          onReject={() => handleRejectVolunteer(volunteer)}
                          onViewDetails={() => setSelectedVolunteer(volunteer)}
                          isApproving={isApprovingVolunteer}
                          isRejecting={isRejectingVolunteer}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {approvedVolunteers.length > 0 && (
                  <div>
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center">
                      <CheckCircle className="h-4 sm:h-5 w-4 sm:w-5 text-green-500 mr-2" />
                      Approved Volunteers ({approvedVolunteers.length})
                    </h3>
                    <div className="grid grid-cols-1 gap-3 sm:gap-4">
                      {approvedVolunteers.map((volunteer) => (
                        <VolunteerApplicationCard
                          key={volunteer.id}
                          volunteer={volunteer}
                          onViewDetails={() => setSelectedVolunteer(volunteer)}
                          isApproved={true}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {rejectedVolunteers.length > 0 && (
                  <div>
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center">
                      <XCircle className="h-4 sm:h-5 w-4 sm:w-5 text-red-500 mr-2" />
                      Rejected Applications ({rejectedVolunteers.length})
                    </h3>
                    <div className="grid grid-cols-1 gap-3 sm:gap-4">
                      {rejectedVolunteers.map((volunteer) => (
                        <VolunteerApplicationCard
                          key={volunteer.id}
                          volunteer={volunteer}
                          onViewDetails={() => setSelectedVolunteer(volunteer)}
                          isRejected={true}
                        />
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
                <Building2 className="h-5 sm:h-6 w-5 sm:w-6 text-blue-600" />
                <h2 className="text-lg sm:text-xl font-bold text-gray-900">NGO/NPO Management</h2>
              </div>
              <div className="text-xs sm:text-sm text-gray-600">
                {allNgoNpos?.length || 0} total • {pendingNgoNpos.length} pending • {approvedNgoNpos.length} approved • {rejectedNgoNpos.length} rejected
              </div>
            </div>

            {isLoadingNgoNpos ? (
              <div className="text-center py-8">
                <Clock className="h-6 sm:h-8 w-6 sm:w-8 text-blue-500 mx-auto mb-2 animate-spin" />
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
                      <Clock className="h-4 sm:h-5 w-4 sm:w-5 text-yellow-500 mr-2" />
                      Pending Applications ({pendingNgoNpos.length})
                    </h3>
                    <div className="grid grid-cols-1 gap-3 sm:gap-4">
                      {pendingNgoNpos.map((ngoNpo) => (
                        <NgoNpoApplicationCard
                          key={ngoNpo.id}
                          ngoNpo={ngoNpo}
                          onApprove={() => handleApproveNgoNpo(ngoNpo.id)}
                          onReject={() => handleRejectNgoNpo(ngoNpo)}
                          onViewDetails={() => setSelectedNgoNpo(ngoNpo)}
                          isApproving={isApprovingNgoNpo}
                          isRejecting={isRejectingNgoNpo}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {approvedNgoNpos.length > 0 && (
                  <div>
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center">
                      <CheckCircle className="h-4 sm:h-5 w-4 sm:w-5 text-green-500 mr-2" />
                      Approved Organizations ({approvedNgoNpos.length})
                    </h3>
                    <div className="grid grid-cols-1 gap-3 sm:gap-4">
                      {approvedNgoNpos.map((ngoNpo) => (
                        <NgoNpoApplicationCard
                          key={ngoNpo.id}
                          ngoNpo={ngoNpo}
                          onViewDetails={() => setSelectedNgoNpo(ngoNpo)}
                          isApproved={true}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {rejectedNgoNpos.length > 0 && (
                  <div>
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center">
                      <XCircle className="h-4 sm:h-5 w-4 sm:w-5 text-red-500 mr-2" />
                      Rejected Applications ({rejectedNgoNpos.length})
                    </h3>
                    <div className="grid grid-cols-1 gap-3 sm:gap-4">
                      {rejectedNgoNpos.map((ngoNpo) => (
                        <NgoNpoApplicationCard
                          key={ngoNpo.id}
                          ngoNpo={ngoNpo}
                          onViewDetails={() => setSelectedNgoNpo(ngoNpo)}
                          isRejected={true}
                        />
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

      {selectedVolunteer && (
        <VolunteerDetailsModal
          volunteer={selectedVolunteer}
          onClose={() => setSelectedVolunteer(null)}
          onApprove={selectedVolunteer.approved || selectedVolunteer.rejectionNote ? undefined : () => {
            handleApproveVolunteer(selectedVolunteer.id);
            setSelectedVolunteer(null);
          }}
          onReject={selectedVolunteer.approved || selectedVolunteer.rejectionNote ? undefined : () => {
            handleRejectVolunteer(selectedVolunteer);
            setSelectedVolunteer(null);
          }}
          isApproving={isApprovingVolunteer}
          isRejecting={isRejectingVolunteer}
        />
      )}

      {selectedNgoNpo && (
        <NgoNpoDetailsModal
          ngoNpo={selectedNgoNpo}
          onClose={() => setSelectedNgoNpo(null)}
          onApprove={selectedNgoNpo.approved || selectedNgoNpo.rejectionNote ? undefined : () => {
            handleApproveNgoNpo(selectedNgoNpo.id);
            setSelectedNgoNpo(null);
          }}
          onReject={selectedNgoNpo.approved || selectedNgoNpo.rejectionNote ? undefined : () => {
            handleRejectNgoNpo(selectedNgoNpo);
            setSelectedNgoNpo(null);
          }}
          isApproving={isApprovingNgoNpo}
          isRejecting={isRejectingNgoNpo}
        />
      )}

      {selectedProfileEdit && (
        <ProfileEditDetailsModal
          edit={selectedProfileEdit}
          volunteers={allVolunteers || []}
          onClose={() => setSelectedProfileEdit(null)}
          onApprove={() => {
            handleApproveProfileEdit(selectedProfileEdit.id);
            setSelectedProfileEdit(null);
          }}
          onReject={() => {
            handleRejectProfileEdit(selectedProfileEdit);
            setSelectedProfileEdit(null);
          }}
          isApproving={isApprovingProfileEdit}
          isRejecting={isRejectingProfileEdit}
        />
      )}

      {showRejectionModal && (volunteerToReject || ngoNpoToReject || profileEditToReject) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                  Reject {volunteerToReject ? 'Application' : ngoNpoToReject ? 'Application' : 'Profile Edit'}
                </h3>
                <button
                  onClick={() => setShowRejectionModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="h-5 w-5" />
                </button>
              </div>
              
              <p className="text-sm sm:text-base text-gray-600 mb-4">
                You are about to reject the {volunteerToReject ? 'volunteer' : ngoNpoToReject ? 'NGO/NPO' : 'profile edit'} {volunteerToReject || ngoNpoToReject ? 'application' : 'request'} for <strong>{volunteerToReject?.name || ngoNpoToReject?.organizationName || 'this volunteer'}</strong>. 
                Please provide a reason for rejection:
              </p>
              
              <textarea
                value={rejectionNote}
                onChange={(e) => setRejectionNote(e.target.value)}
                placeholder="Enter rejection reason (required)..."
                className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg resize-none h-20 sm:h-24 focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm sm:text-base"
                required
              />
              
              <div className="flex items-center justify-end space-x-2 sm:space-x-3 mt-4 sm:mt-6">
                <button
                  onClick={() => setShowRejectionModal(false)}
                  className="px-3 sm:px-4 py-2 text-sm sm:text-base text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmReject}
                  disabled={!rejectionNote.trim() || isRejectingVolunteer || isRejectingNgoNpo || isRejectingProfileEdit}
                  className="px-3 sm:px-4 py-2 text-sm sm:text-base bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {(isRejectingVolunteer || isRejectingNgoNpo || isRejectingProfileEdit) ? 'Rejecting...' : `Reject ${volunteerToReject || ngoNpoToReject ? 'Application' : 'Request'}`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ProfileEditRequestCard({ 
  edit, 
  volunteers,
  onApprove, 
  onReject,
  onViewDetails, 
  isApproving, 
  isRejecting
}: {
  edit: PendingProfileEdit;
  volunteers: Volunteer[];
  onApprove: () => void;
  onReject: () => void;
  onViewDetails: () => void;
  isApproving?: boolean;
  isRejecting?: boolean;
}) {
  const volunteer = volunteers.find(v => v.id === edit.volunteerId);
  const { data: currentPhotoUrl } = useFileUrl(volunteer?.photoPath || '');
  const { data: newPhotoUrl } = useFileUrl(edit.updates.photoPath);

  const currentContactInfo = volunteer ? JSON.parse(volunteer.contactInfo || '{}') : {};
  const newContactInfo = JSON.parse(edit.updates.contactInfo || '{}');

  return (
    <div className="border border-purple-200 rounded-lg p-3 sm:p-4 hover:shadow-md transition-shadow bg-purple-50">
      <div className="flex items-start space-x-3 sm:space-x-4">
        <div className="relative flex-shrink-0">
          <div className="flex space-x-2">
            {currentPhotoUrl ? (
              <img
                src={currentPhotoUrl}
                alt="Current"
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover border-2 border-gray-300"
              />
            ) : (
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gray-200 flex items-center justify-center">
                <User className="h-5 sm:h-6 w-5 sm:w-6 text-gray-400" />
              </div>
            )}
            <div className="flex items-center">
              <span className="text-purple-600 font-bold">→</span>
            </div>
            {newPhotoUrl ? (
              <img
                src={newPhotoUrl}
                alt="New"
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover border-2 border-purple-500"
              />
            ) : (
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-purple-200 flex items-center justify-center">
                <User className="h-5 sm:h-6 w-5 sm:w-6 text-purple-600" />
              </div>
            )}
          </div>
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h4 className="text-sm sm:text-base font-semibold text-gray-900">
                {volunteer?.name || 'Unknown Volunteer'}
              </h4>
              <p className="text-xs text-purple-600">Profile Edit Request</p>
            </div>
            <span className="px-2 py-1 text-xs font-medium rounded-full border text-purple-600 bg-purple-100 border-purple-200">
              Pending Review
            </span>
          </div>
          
          <div className="space-y-1 text-xs sm:text-sm text-gray-600 mb-2 sm:mb-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <p className="font-medium text-gray-700">Current:</p>
                <p className="truncate">{volunteer?.name}</p>
                <p className="truncate">{currentContactInfo.email}</p>
              </div>
              <div>
                <p className="font-medium text-purple-700">New:</p>
                <p className="truncate">{edit.updates.name}</p>
                <p className="truncate">{newContactInfo.email}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2 pt-1">
              <Calendar className="h-3 w-3 flex-shrink-0" />
              <span>Submitted {new Date(Number(edit.submittedAt) / 1000000).toLocaleDateString()}</span>
            </div>
          </div>
          
          <div className="flex items-center flex-wrap gap-2">
            <button
              onClick={onViewDetails}
              className="flex items-center space-x-1 text-blue-600 hover:text-blue-700 text-xs sm:text-sm font-medium"
            >
              <Eye className="h-3 w-3" />
              <span>View Details</span>
            </button>
            
            <button
              onClick={onApprove}
              disabled={isApproving}
              className="flex items-center space-x-1 text-green-600 hover:text-green-700 disabled:opacity-50 text-xs sm:text-sm font-medium"
            >
              <CheckCircle className="h-3 w-3" />
              <span>{isApproving ? 'Approving...' : 'Approve'}</span>
            </button>

            <button
              onClick={onReject}
              disabled={isRejecting}
              className="flex items-center space-x-1 text-red-600 hover:text-red-700 disabled:opacity-50 text-xs sm:text-sm font-medium"
            >
              <XCircle className="h-3 w-3" />
              <span>{isRejecting ? 'Rejecting...' : 'Reject'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProfileEditDetailsModal({ 
  edit, 
  volunteers,
  onClose, 
  onApprove, 
  onReject,
  isApproving,
  isRejecting
}: {
  edit: PendingProfileEdit;
  volunteers: Volunteer[];
  onClose: () => void;
  onApprove: () => void;
  onReject: () => void;
  isApproving?: boolean;
  isRejecting?: boolean;
}) {
  const volunteer = volunteers.find(v => v.id === edit.volunteerId);
  const { data: currentPhotoUrl } = useFileUrl(volunteer?.photoPath || '');
  const { data: newPhotoUrl } = useFileUrl(edit.updates.photoPath);

  const currentContactInfo = volunteer ? JSON.parse(volunteer.contactInfo || '{}') : {};
  const newContactInfo = JSON.parse(edit.updates.contactInfo || '{}');

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto my-8">
        <div className="p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h2 className="text-lg sm:text-2xl font-bold text-gray-900">Profile Edit Request Details</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <XCircle className="h-5 sm:h-6 w-5 sm:w-6" />
            </button>
          </div>
          
          <div className="space-y-4 sm:space-y-6">
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-purple-900 mb-2">Volunteer Information</h3>
              <p className="text-sm text-gray-700">Name: {volunteer?.name || 'Unknown'}</p>
              <p className="text-xs text-gray-600 break-all">Principal: {edit.volunteerPrincipal.toString()}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              <div className="space-y-4">
                <h3 className="text-base font-semibold text-gray-900 border-b pb-2">Current Information</h3>
                
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">Profile Photo</label>
                  {currentPhotoUrl ? (
                    <img src={currentPhotoUrl} alt="Current" className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover border-4 border-gray-200" />
                  ) : (
                    <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gray-200 flex items-center justify-center">
                      <User className="h-10 sm:h-12 w-10 sm:w-12 text-gray-400" />
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">Name</label>
                  <p className="text-sm sm:text-base text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">{volunteer?.name || 'N/A'}</p>
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">Email</label>
                  <p className="text-sm sm:text-base text-gray-900 bg-gray-50 px-3 py-2 rounded-lg break-all">{currentContactInfo.email || 'N/A'}</p>
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">Mobile</label>
                  <p className="text-sm sm:text-base text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">{currentContactInfo.mobile || 'N/A'}</p>
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">Address</label>
                  <p className="text-sm sm:text-base text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">{volunteer?.address || 'N/A'}</p>
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">Mobile Visibility</label>
                  <p className="text-sm sm:text-base text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">
                    {volunteer?.showFullMobile ? 'Full Number Visible' : 'Partially Hidden'}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-base font-semibold text-purple-900 border-b border-purple-200 pb-2">Requested Changes</h3>
                
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-purple-700 mb-2">New Profile Photo</label>
                  {newPhotoUrl ? (
                    <img src={newPhotoUrl} alt="New" className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover border-4 border-purple-500" />
                  ) : (
                    <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-purple-200 flex items-center justify-center">
                      <User className="h-10 sm:h-12 w-10 sm:w-12 text-purple-600" />
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-purple-700 mb-2">New Name</label>
                  <p className="text-sm sm:text-base text-gray-900 bg-purple-50 px-3 py-2 rounded-lg border border-purple-200">{edit.updates.name}</p>
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-purple-700 mb-2">New Email</label>
                  <p className="text-sm sm:text-base text-gray-900 bg-purple-50 px-3 py-2 rounded-lg border border-purple-200 break-all">{newContactInfo.email}</p>
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-purple-700 mb-2">New Mobile</label>
                  <p className="text-sm sm:text-base text-gray-900 bg-purple-50 px-3 py-2 rounded-lg border border-purple-200">{newContactInfo.mobile}</p>
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-purple-700 mb-2">New Address</label>
                  <p className="text-sm sm:text-base text-gray-900 bg-purple-50 px-3 py-2 rounded-lg border border-purple-200">{edit.updates.address}</p>
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-purple-700 mb-2">New Mobile Visibility</label>
                  <p className="text-sm sm:text-base text-gray-900 bg-purple-50 px-3 py-2 rounded-lg border border-purple-200">
                    {edit.updates.showFullMobile ? 'Full Number Visible' : 'Partially Hidden'}
                  </p>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                <Calendar className="h-3 sm:h-4 w-3 sm:w-4 inline mr-2" />
                Submission Date
              </label>
              <p className="text-sm sm:text-base text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">
                {new Date(Number(edit.submittedAt) / 1000000).toLocaleDateString('en-IN', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center justify-end space-y-2 sm:space-y-0 sm:space-x-4 mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-gray-200">
            <button onClick={onClose} className="w-full sm:w-auto px-4 py-2 text-sm sm:text-base text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
              Close
            </button>
            
            <button
              onClick={onApprove}
              disabled={isApproving}
              className="w-full sm:w-auto px-4 sm:px-6 py-2 text-sm sm:text-base bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {isApproving ? 'Approving...' : 'Approve Changes'}
            </button>

            <button
              onClick={onReject}
              disabled={isRejecting}
              className="w-full sm:w-auto px-4 sm:px-6 py-2 text-sm sm:text-base bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {isRejecting ? 'Rejecting...' : 'Reject Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function VolunteerApplicationCard({ 
  volunteer, 
  onApprove, 
  onReject,
  onViewDetails, 
  isApproving, 
  isRejecting,
  isApproved = false,
  isRejected = false
}: {
  volunteer: any;
  onApprove?: () => void;
  onReject?: () => void;
  onViewDetails: () => void;
  isApproving?: boolean;
  isRejecting?: boolean;
  isApproved?: boolean;
  isRejected?: boolean;
}) {
  const { data: photoUrl } = useFileUrl(volunteer.photoPath);
  const contactInfo = JSON.parse(volunteer.contactInfo || '{}');

  return (
    <div className="border border-gray-200 rounded-lg p-3 sm:p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start space-x-3 sm:space-x-4">
        <div className="relative flex-shrink-0">
          {photoUrl ? (
            <img
              src={photoUrl}
              alt={`${volunteer.name} profile`}
              className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover border-2 border-gray-200"
            />
          ) : (
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gray-200 flex items-center justify-center">
              <User className="h-5 sm:h-6 w-5 sm:w-6 text-gray-400" />
            </div>
          )}
          {isApproved && (
            <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-1">
              <Award className="h-2 sm:h-3 w-2 sm:w-3 text-white" />
            </div>
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm sm:text-base font-semibold text-gray-900 truncate">{volunteer.name}</h4>
            <span className={`px-2 py-1 text-xs font-medium rounded-full border ${
              isApproved ? 'text-green-600 bg-green-50 border-green-200' :
              isRejected ? 'text-red-600 bg-red-50 border-red-200' :
              'text-yellow-600 bg-yellow-50 border-yellow-200'
            }`}>
              {isApproved ? 'Approved' : isRejected ? 'Rejected' : 'Pending'}
            </span>
          </div>
          
          <div className="space-y-1 text-xs sm:text-sm text-gray-600 mb-2 sm:mb-3">
            <div className="flex items-center space-x-2">
              <Mail className="h-3 w-3 flex-shrink-0" />
              <span className="truncate">{contactInfo.email || 'Not provided'}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Phone className="h-3 w-3 flex-shrink-0" />
              <span>{contactInfo.mobile || 'Not provided'}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Calendar className="h-3 w-3 flex-shrink-0" />
              <span>Applied {new Date(Number(volunteer.applicationDate) / 1000000).toLocaleDateString()}</span>
            </div>
          </div>
          
          <div className="flex items-center flex-wrap gap-2">
            <button
              onClick={onViewDetails}
              className="flex items-center space-x-1 text-blue-600 hover:text-blue-700 text-xs sm:text-sm font-medium"
            >
              <Eye className="h-3 w-3" />
              <span>View Details</span>
            </button>
            
            {onApprove && (
              <button
                onClick={onApprove}
                disabled={isApproving}
                className="flex items-center space-x-1 text-green-600 hover:text-green-700 disabled:opacity-50 text-xs sm:text-sm font-medium"
              >
                <CheckCircle className="h-3 w-3" />
                <span>{isApproving ? 'Approving...' : 'Approve'}</span>
              </button>
            )}

            {onReject && (
              <button
                onClick={onReject}
                disabled={isRejecting}
                className="flex items-center space-x-1 text-red-600 hover:text-red-700 disabled:opacity-50 text-xs sm:text-sm font-medium"
              >
                <XCircle className="h-3 w-3" />
                <span>{isRejecting ? 'Rejecting...' : 'Reject'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function NgoNpoApplicationCard({ 
  ngoNpo, 
  onApprove, 
  onReject,
  onViewDetails, 
  isApproving, 
  isRejecting,
  isApproved = false,
  isRejected = false
}: {
  ngoNpo: NgoNpo;
  onApprove?: () => void;
  onReject?: () => void;
  onViewDetails: () => void;
  isApproving?: boolean;
  isRejecting?: boolean;
  isApproved?: boolean;
  isRejected?: boolean;
}) {
  const { data: logoUrl } = useFileUrl(ngoNpo.logoPath);

  return (
    <div className="border border-gray-200 rounded-lg p-3 sm:p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start space-x-3 sm:space-x-4">
        <div className="relative flex-shrink-0">
          {logoUrl ? (
            <img
              src={logoUrl}
              alt={`${ngoNpo.organizationName} logo`}
              className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg object-cover border-2 border-gray-200"
            />
          ) : (
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-gray-200 flex items-center justify-center">
              <Building2 className="h-5 sm:h-6 w-5 sm:w-6 text-gray-400" />
            </div>
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm sm:text-base font-semibold text-gray-900 truncate">{ngoNpo.organizationName}</h4>
            <span className={`px-2 py-1 text-xs font-medium rounded-full border ${
              isApproved ? 'text-green-600 bg-green-50 border-green-200' :
              isRejected ? 'text-red-600 bg-red-50 border-red-200' :
              'text-yellow-600 bg-yellow-50 border-yellow-200'
            }`}>
              {isApproved ? 'Approved' : isRejected ? 'Rejected' : 'Pending'}
            </span>
          </div>
          
          <div className="space-y-1 text-xs sm:text-sm text-gray-600 mb-2 sm:mb-3">
            <div className="flex items-center space-x-2">
              <Mail className="h-3 w-3 flex-shrink-0" />
              <span className="truncate">{ngoNpo.email}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Phone className="h-3 w-3 flex-shrink-0" />
              <span>{ngoNpo.phone}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Calendar className="h-3 w-3 flex-shrink-0" />
              <span>Registered {new Date(Number(ngoNpo.registrationDate) / 1000000).toLocaleDateString()}</span>
            </div>
          </div>
          
          <div className="flex items-center flex-wrap gap-2">
            <button
              onClick={onViewDetails}
              className="flex items-center space-x-1 text-blue-600 hover:text-blue-700 text-xs sm:text-sm font-medium"
            >
              <Eye className="h-3 w-3" />
              <span>View Details</span>
            </button>
            
            {onApprove && (
              <button
                onClick={onApprove}
                disabled={isApproving}
                className="flex items-center space-x-1 text-green-600 hover:text-green-700 disabled:opacity-50 text-xs sm:text-sm font-medium"
              >
                <CheckCircle className="h-3 w-3" />
                <span>{isApproving ? 'Approving...' : 'Approve'}</span>
              </button>
            )}

            {onReject && (
              <button
                onClick={onReject}
                disabled={isRejecting}
                className="flex items-center space-x-1 text-red-600 hover:text-red-700 disabled:opacity-50 text-xs sm:text-sm font-medium"
              >
                <XCircle className="h-3 w-3" />
                <span>{isRejecting ? 'Rejecting...' : 'Reject'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function VolunteerDetailsModal({ 
  volunteer, 
  onClose, 
  onApprove, 
  onReject,
  isApproving,
  isRejecting
}: {
  volunteer: any;
  onClose: () => void;
  onApprove?: () => void;
  onReject?: () => void;
  isApproving?: boolean;
  isRejecting?: boolean;
}) {
  const { data: photoUrl } = useFileUrl(volunteer.photoPath);
  const contactInfo = JSON.parse(volunteer.contactInfo || '{}');

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto my-8">
        <div className="p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h2 className="text-lg sm:text-2xl font-bold text-gray-900">Volunteer Application Details</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <XCircle className="h-5 sm:h-6 w-5 sm:w-6" />
            </button>
          </div>
          
          <div className="space-y-4 sm:space-y-6">
            <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-6">
              <div className="relative">
                {photoUrl ? (
                  <img src={photoUrl} alt={`${volunteer.name} profile`} className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover border-4 border-gray-200" />
                ) : (
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gray-200 flex items-center justify-center">
                    <User className="h-10 sm:h-12 w-10 sm:w-12 text-gray-400" />
                  </div>
                )}
              </div>
              
              <div className="text-center sm:text-left">
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900">{volunteer.name}</h3>
                <p className="text-xs sm:text-sm text-gray-600 break-all">Principal: {volunteer.principal.toString()}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                  <Mail className="h-3 sm:h-4 w-3 sm:w-4 inline mr-2" />
                  Email Address
                </label>
                <p className="text-sm sm:text-base text-gray-900 bg-gray-50 px-3 py-2 rounded-lg break-all">{contactInfo.email || 'Not provided'}</p>
              </div>
              
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                  <Phone className="h-3 sm:h-4 w-3 sm:w-4 inline mr-2" />
                  Mobile Number
                </label>
                <p className="text-sm sm:text-base text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">{contactInfo.mobile || 'Not provided'}</p>
              </div>
            </div>
            
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                <MapPin className="h-3 sm:h-4 w-3 sm:w-4 inline mr-2" />
                Complete Address
              </label>
              <p className="text-sm sm:text-base text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">{volunteer.address}</p>
            </div>
            
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                <Calendar className="h-3 sm:h-4 w-3 sm:w-4 inline mr-2" />
                Application Date
              </label>
              <p className="text-sm sm:text-base text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">
                {new Date(Number(volunteer.applicationDate) / 1000000).toLocaleDateString('en-IN', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>

            {volunteer.rejectionNote && (
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                  <MessageSquare className="h-3 sm:h-4 w-3 sm:w-4 inline mr-2" />
                  Rejection Reason
                </label>
                <div className="text-sm sm:text-base text-gray-900 bg-red-50 border border-red-200 px-3 py-2 rounded-lg">
                  {volunteer.rejectionNote}
                </div>
              </div>
            )}
          </div>
          
          <div className="flex flex-col sm:flex-row items-center justify-end space-y-2 sm:space-y-0 sm:space-x-4 mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-gray-200">
            <button onClick={onClose} className="w-full sm:w-auto px-4 py-2 text-sm sm:text-base text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
              Close
            </button>
            
            {onApprove && (
              <button
                onClick={onApprove}
                disabled={isApproving}
                className="w-full sm:w-auto px-4 sm:px-6 py-2 text-sm sm:text-base bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {isApproving ? 'Approving...' : 'Approve Application'}
              </button>
            )}

            {onReject && (
              <button
                onClick={onReject}
                disabled={isRejecting}
                className="w-full sm:w-auto px-4 sm:px-6 py-2 text-sm sm:text-base bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {isRejecting ? 'Rejecting...' : 'Reject Application'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function NgoNpoDetailsModal({ 
  ngoNpo, 
  onClose, 
  onApprove, 
  onReject,
  isApproving,
  isRejecting
}: {
  ngoNpo: NgoNpo;
  onClose: () => void;
  onApprove?: () => void;
  onReject?: () => void;
  isApproving?: boolean;
  isRejecting?: boolean;
}) {
  const { data: logoUrl } = useFileUrl(ngoNpo.logoPath);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto my-8">
        <div className="p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h2 className="text-lg sm:text-2xl font-bold text-gray-900">NGO/NPO Application Details</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <XCircle className="h-5 sm:h-6 w-5 sm:w-6" />
            </button>
          </div>
          
          <div className="space-y-4 sm:space-y-6">
            <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-6">
              <div className="relative">
                {logoUrl ? (
                  <img src={logoUrl} alt={`${ngoNpo.organizationName} logo`} className="w-20 h-20 sm:w-24 sm:h-24 rounded-lg object-cover border-4 border-gray-200" />
                ) : (
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-lg bg-gray-200 flex items-center justify-center">
                    <Building2 className="h-10 sm:h-12 w-10 sm:w-12 text-gray-400" />
                  </div>
                )}
              </div>
              
              <div className="text-center sm:text-left">
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900">{ngoNpo.organizationName}</h3>
                <p className="text-xs sm:text-sm text-gray-600 break-all">Principal: {ngoNpo.principal.toString()}</p>
                <span className={`inline-block mt-2 px-3 py-1 text-xs sm:text-sm font-medium rounded-full border ${
                  ngoNpo.approved ? 'text-green-600 bg-green-50 border-green-200' :
                  ngoNpo.rejectionNote ? 'text-red-600 bg-red-50 border-red-200' :
                  'text-yellow-600 bg-yellow-50 border-yellow-200'
                }`}>
                  {ngoNpo.approved ? 'Approved' : ngoNpo.rejectionNote ? 'Rejected' : 'Pending'}
                </span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                  <User className="h-3 sm:h-4 w-3 sm:w-4 inline mr-2" />
                  Contact Person
                </label>
                <p className="text-sm sm:text-base text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">{ngoNpo.contactPerson}</p>
              </div>
              
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                  <Mail className="h-3 sm:h-4 w-3 sm:w-4 inline mr-2" />
                  Email
                </label>
                <p className="text-sm sm:text-base text-gray-900 bg-gray-50 px-3 py-2 rounded-lg break-all">{ngoNpo.email}</p>
              </div>
              
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                  <Phone className="h-3 sm:h-4 w-3 sm:w-4 inline mr-2" />
                  Phone
                </label>
                <p className="text-sm sm:text-base text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">{ngoNpo.phone}</p>
              </div>
              
              {ngoNpo.website && (
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                    <Globe className="h-3 sm:h-4 w-3 sm:w-4 inline mr-2" />
                    Website
                  </label>
                  <a href={ngoNpo.website} target="_blank" rel="noopener noreferrer" className="text-sm sm:text-base text-blue-600 hover:text-blue-700 bg-gray-50 px-3 py-2 rounded-lg block break-all">
                    {ngoNpo.website}
                  </a>
                </div>
              )}
            </div>
            
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                <MapPin className="h-3 sm:h-4 w-3 sm:w-4 inline mr-2" />
                Address
              </label>
              <p className="text-sm sm:text-base text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">{ngoNpo.address}</p>
            </div>
            
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                <FileTextIcon className="h-3 sm:h-4 w-3 sm:w-4 inline mr-2" />
                Description
              </label>
              <p className="text-sm sm:text-base text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">{ngoNpo.description}</p>
            </div>
            
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                <FileTextIcon className="h-3 sm:h-4 w-3 sm:w-4 inline mr-2" />
                Mission Statement
              </label>
              <p className="text-sm sm:text-base text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">{ngoNpo.missionStatement}</p>
            </div>
            
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                <Calendar className="h-3 sm:h-4 w-3 sm:w-4 inline mr-2" />
                Registration Date
              </label>
              <p className="text-sm sm:text-base text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">
                {new Date(Number(ngoNpo.registrationDate) / 1000000).toLocaleDateString('en-IN', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>

            {ngoNpo.rejectionNote && (
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                  <MessageSquare className="h-3 sm:h-4 w-3 sm:w-4 inline mr-2" />
                  Rejection Reason
                </label>
                <div className="text-sm sm:text-base text-gray-900 bg-red-50 border border-red-200 px-3 py-2 rounded-lg">
                  {ngoNpo.rejectionNote}
                </div>
              </div>
            )}
          </div>
          
          <div className="flex flex-col sm:flex-row items-center justify-end space-y-2 sm:space-y-0 sm:space-x-4 mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-gray-200">
            <button onClick={onClose} className="w-full sm:w-auto px-4 py-2 text-sm sm:text-base text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
              Close
            </button>
            
            {onApprove && (
              <button
                onClick={onApprove}
                disabled={isApproving}
                className="w-full sm:w-auto px-4 sm:px-6 py-2 text-sm sm:text-base bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {isApproving ? 'Approving...' : 'Approve Application'}
              </button>
            )}

            {onReject && (
              <button
                onClick={onReject}
                disabled={isRejecting}
                className="w-full sm:w-auto px-4 sm:px-6 py-2 text-sm sm:text-base bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {isRejecting ? 'Rejecting...' : 'Reject Application'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
