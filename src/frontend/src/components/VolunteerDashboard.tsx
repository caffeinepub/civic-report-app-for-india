import React, { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { UserCheck, Award, TrendingUp, Clock, CheckCircle, XCircle, AlertCircle, User, Mail, Phone, MapPin, Edit3, Save, X, Camera, MessageSquare, Star, Shield } from 'lucide-react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGetMyVolunteerProfile, useGetVolunteerStats, useUpdateVolunteerPrivacy, useSubmitVolunteerProfileEdit, useGetMyPendingProfileEdit, useGetMyProfileEditHistory } from '../hooks/useQueries';
import { useFileUrl, useFileUpload } from '../blob-storage/FileStorage';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

type TimelineEntry = {
  type: 'application' | 'profileEdit';
  timestamp: bigint;
  status: string;
  rejectionNote?: string;
};

export function VolunteerDashboard() {
  const navigate = useNavigate();
  const { identity, login, loginStatus } = useInternetIdentity();
  const { data: volunteerProfile, isLoading: isLoadingProfile } = useGetMyVolunteerProfile();
  const { data: volunteerStats } = useGetVolunteerStats(volunteerProfile?.name);
  const { data: photoUrl } = useFileUrl(volunteerProfile?.photoPath || '');
  const { data: pendingEdit } = useGetMyPendingProfileEdit();
  const { data: profileEditHistory } = useGetMyProfileEditHistory();
  const { mutate: updatePrivacy, isPending: isUpdatingPrivacy } = useUpdateVolunteerPrivacy();
  const { mutate: submitProfileEdit, isPending: isSubmittingEdit } = useSubmitVolunteerProfileEdit();
  const { uploadFile, isUploading } = useFileUpload();
  
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    mobile: '',
    address: '',
    photoPath: '',
    showFullMobile: true,
  });
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

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

  const handlePrivacyToggle = (showFullMobile: boolean) => {
    if (volunteerProfile) {
      updatePrivacy({ 
        volunteerId: volunteerProfile.id, 
        showFullMobile 
      });
    }
  };

  const openEditModal = () => {
    if (!volunteerProfile) return;
    
    const contactInfo = getContactInfo(volunteerProfile.contactInfo);
    setEditForm({
      name: volunteerProfile.name,
      email: contactInfo.email,
      mobile: contactInfo.mobile,
      address: volunteerProfile.address,
      photoPath: volunteerProfile.photoPath,
      showFullMobile: volunteerProfile.showFullMobile,
    });
    setPhotoPreview(null);
    setIsEditModalOpen(true);
  };

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    try {
      const photoPath = `volunteer-photos/${Date.now()}-${file.name}`;
      const { path } = await uploadFile(photoPath, file);
      setEditForm(prev => ({ ...prev, photoPath: path }));
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      
      toast.success('Photo uploaded successfully');
    } catch (error) {
      console.error('Error uploading photo:', error);
      toast.error('Failed to upload photo');
    }
  };

  const handleSubmitEdit = () => {
    if (!volunteerProfile) return;

    // Validation
    if (!editForm.name.trim()) {
      toast.error('Name is required');
      return;
    }
    if (!editForm.email.trim() || !editForm.email.includes('@')) {
      toast.error('Valid email is required');
      return;
    }
    if (!editForm.mobile.trim() || editForm.mobile.length < 10) {
      toast.error('Valid mobile number is required');
      return;
    }
    if (!editForm.address.trim()) {
      toast.error('Address is required');
      return;
    }

    const contactInfo = JSON.stringify({
      email: editForm.email,
      mobile: editForm.mobile,
    });

    submitProfileEdit({
      volunteerId: volunteerProfile.id,
      updates: {
        name: editForm.name,
        photoPath: editForm.photoPath,
        contactInfo,
        address: editForm.address,
        showFullMobile: editForm.showFullMobile,
      },
    }, {
      onSuccess: () => {
        toast.success('Profile update submitted for admin approval');
        setIsEditModalOpen(false);
      },
      onError: (error) => {
        console.error('Error submitting profile edit:', error);
        toast.error('Failed to submit profile update');
      },
    });
  };

  const getStatusIcon = (volunteer: any) => {
    if (volunteer.approved) {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    } else if (volunteer.rejectionNote) {
      return <XCircle className="h-4 w-4 text-red-500" />;
    } else {
      return <Clock className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusVariant = (volunteer: any) => {
    if (volunteer.approved) {
      return 'default';
    } else if (volunteer.rejectionNote) {
      return 'destructive';
    } else {
      return 'secondary';
    }
  };

  const getStatusText = (volunteer: any) => {
    if (volunteer.approved) {
      return 'Approved';
    } else if (volunteer.rejectionNote) {
      return 'Rejected';
    } else {
      return 'Pending Review';
    }
  };

  const getContactInfo = (contactInfoStr: string) => {
    try {
      return JSON.parse(contactInfoStr);
    } catch {
      return { email: 'Not provided', mobile: 'Not provided' };
    }
  };

  const getDaysSinceApplication = (applicationDate: bigint) => {
    const applicationTimestamp = Number(applicationDate) / 1000000;
    const now = Date.now();
    const diffInMs = now - applicationTimestamp;
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    return diffInDays;
  };

  const getEditStatusIcon = (status: string) => {
    if (status === 'Approved') {
      return <CheckCircle className="h-3 w-3 text-white" />;
    } else if (status === 'Rejected') {
      return <XCircle className="h-3 w-3 text-white" />;
    } else {
      return <Clock className="h-3 w-3 text-white" />;
    }
  };

  const getEditStatusColor = (status: string) => {
    if (status === 'Approved') {
      return 'bg-green-500';
    } else if (status === 'Rejected') {
      return 'bg-red-500';
    } else {
      return 'bg-yellow-500';
    }
  };

  if (!identity) {
    return (
      <div className="max-w-md mx-auto px-4">
        <Card className="text-center">
          <CardContent className="pt-8 pb-6">
            <UserCheck className="h-12 w-12 text-blue-500 mx-auto mb-4" />
            <CardTitle className="text-xl mb-3">Volunteer Dashboard</CardTitle>
            <p className="text-gray-600 text-sm mb-6">
              Sign in with Internet Identity to access your volunteer dashboard.
            </p>
            
            <Button
              onClick={handleLogin}
              disabled={loginStatus === 'logging-in'}
              className="w-full mb-4"
            >
              {loginStatus === 'logging-in' ? 'Signing in...' : 'Sign in with Internet Identity'}
            </Button>
            
            <p className="text-xs text-gray-500">
              Don't have a volunteer account?{' '}
              <button 
                onClick={() => navigate({ to: '/volunteer/register' })} 
                className="text-blue-600 hover:text-blue-700 underline"
              >
                Apply here
              </button>
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoadingProfile) {
    return (
      <div className="max-w-md mx-auto px-4">
        <Card className="text-center">
          <CardContent className="pt-8 pb-6">
            <Clock className="h-12 w-12 text-blue-500 mx-auto mb-4 animate-spin" />
            <CardTitle className="text-xl mb-3">Loading...</CardTitle>
            <p className="text-gray-600 text-sm">Checking your volunteer status...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!volunteerProfile) {
    return (
      <div className="max-w-md mx-auto px-4">
        <Card className="text-center">
          <CardContent className="pt-8 pb-6">
            <UserCheck className="h-12 w-12 text-blue-500 mx-auto mb-4" />
            <CardTitle className="text-xl mb-3">No Application Found</CardTitle>
            <p className="text-gray-600 text-sm mb-6">
              You haven't submitted a volunteer application yet. Apply now to become a verified volunteer.
            </p>
            
            <Button
              onClick={() => navigate({ to: '/volunteer/register' })}
              className="w-full"
            >
              Apply to Become a Volunteer
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const contactInfo = getContactInfo(volunteerProfile.contactInfo);
  const daysSinceApplication = getDaysSinceApplication(volunteerProfile.applicationDate);
  const impactScore = Number(volunteerProfile.impactScore);

  // Combine and sort timeline entries
  const timelineEntries: TimelineEntry[] = [];
  
  // Add initial application
  timelineEntries.push({
    type: 'application',
    timestamp: volunteerProfile.applicationDate,
    status: volunteerProfile.approved ? 'Approved' : volunteerProfile.rejectionNote ? 'Rejected' : 'Pending',
    rejectionNote: volunteerProfile.rejectionNote,
  });

  // Add profile edit history
  if (profileEditHistory && profileEditHistory.length > 0) {
    profileEditHistory.forEach(edit => {
      timelineEntries.push({
        type: 'profileEdit',
        timestamp: edit.submittedAt,
        status: edit.status,
        rejectionNote: edit.rejectionNote,
      });
    });
  }

  // Sort by timestamp (latest first)
  timelineEntries.sort((a, b) => Number(b.timestamp) - Number(a.timestamp));

  return (
    <div className="max-w-4xl mx-auto px-4 space-y-4">
      {/* Profile Header */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-4">
            <div className="relative">
              <Avatar className="h-24 w-24 border-2 border-gray-200">
                <AvatarImage src={photoUrl || ''} alt="Volunteer Profile" />
                <AvatarFallback>
                  <User className="h-12 w-12 text-gray-400" />
                </AvatarFallback>
              </Avatar>
              {volunteerProfile.approved && (
                <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-1">
                  <Award className="h-4 w-4 text-white" />
                </div>
              )}
            </div>
            
            <div className="flex-1 text-center sm:text-left">
              <h1 className="text-xl font-bold text-gray-900 mb-2">
                Welcome, {volunteerProfile.name}
              </h1>
              <div className="flex items-center justify-center sm:justify-start space-x-2 mb-3">
                {getStatusIcon(volunteerProfile)}
                <Badge variant={getStatusVariant(volunteerProfile)} className="text-xs">
                  {getStatusText(volunteerProfile)} Volunteer
                </Badge>
              </div>
              <div className="text-xs text-gray-500">
                <p>Principal ID</p>
                <p className="font-mono truncate max-w-48" title={identity.getPrincipal().toString()}>
                  {identity.getPrincipal().toString().slice(0, 20)}...
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pending Edit Notification */}
      {pendingEdit && pendingEdit.status === 'Pending' && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-4">
            <div className="flex items-start space-x-3">
              <Clock className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-blue-800 text-sm">Profile Update Under Review</h3>
                <p className="text-blue-700 text-xs mt-1">
                  Your profile update request is being reviewed by admins. You'll be notified once it's approved or rejected.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Status Alerts */}
      {!volunteerProfile.approved && !volunteerProfile.rejectionNote && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="pt-4">
            <div className="flex items-start space-x-3">
              <Clock className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-yellow-800 text-sm">Application Under Review</h3>
                <p className="text-yellow-700 text-xs mt-1">
                  Your application is being reviewed by our admin team. You'll be notified once a decision is made.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {volunteerProfile.rejectionNote && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-4">
            <div className="flex items-start space-x-3">
              <XCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="font-semibold text-red-800 text-sm">Application Rejected</h3>
                <p className="text-red-700 text-xs mt-1 mb-2">
                  Your application has been rejected. Please see the reason below:
                </p>
                <div className="bg-white border border-red-200 rounded p-2">
                  <p className="text-red-800 text-xs font-medium">{volunteerProfile.rejectionNote}</p>
                </div>
                <p className="text-red-600 text-xs mt-2">
                  You may submit a new application to address these concerns.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Statistics */}
      {volunteerProfile.approved && volunteerStats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Card className="text-center">
            <CardContent className="pt-4 pb-3">
              <TrendingUp className="h-6 w-6 text-blue-500 mx-auto mb-2" />
              <div className="text-lg font-bold text-gray-900">{volunteerStats.reportsSubmitted}</div>
              <p className="text-xs text-gray-600">Reports</p>
            </CardContent>
          </Card>
          
          <Card className="text-center">
            <CardContent className="pt-4 pb-3">
              <CheckCircle className="h-6 w-6 text-green-500 mx-auto mb-2" />
              <div className="text-lg font-bold text-gray-900">{volunteerStats.statusUpdates}</div>
              <p className="text-xs text-gray-600">Updates</p>
            </CardContent>
          </Card>
          
          <Card className="text-center">
            <CardContent className="pt-4 pb-3">
              <Star className="h-6 w-6 text-purple-500 mx-auto mb-2" />
              <div className="text-lg font-bold text-gray-900">{impactScore}</div>
              <p className="text-xs text-gray-600">Impact Score</p>
            </CardContent>
          </Card>
          
          <Card className="text-center">
            <CardContent className="pt-4 pb-3">
              <UserCheck className="h-6 w-6 text-indigo-500 mx-auto mb-2" />
              <div className="text-lg font-bold text-gray-900">{daysSinceApplication}</div>
              <p className="text-xs text-gray-600">Days Active</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Impact Score Explanation */}
      {volunteerProfile.approved && (
        <Card className="border-purple-200 bg-purple-50">
          <CardContent className="pt-4">
            <div className="flex items-start space-x-3">
              <Star className="h-5 w-5 text-purple-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-purple-800 text-sm">Impact Score System</h3>
                <p className="text-purple-700 text-xs mt-1 mb-2">
                  Your Impact Score reflects your contributions:
                </p>
                <ul className="text-xs text-purple-700 space-y-1">
                  <li>• +10 points for each report submitted</li>
                  <li>• +10 points for each report resolved</li>
                  <li>• -10 points if admin removes content</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Privacy Settings */}
      {volunteerProfile.approved && (
        <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <CardContent className="pt-4">
            <div className="flex items-start space-x-3">
              <Shield className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="font-semibold text-blue-800 text-sm mb-3">Privacy Settings</h3>
                <div className="bg-white rounded-lg p-4 border border-blue-200 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 pr-4">
                      <p className="text-blue-800 text-sm font-medium mb-1">
                        Show full mobile number in public directory
                      </p>
                      <p className="text-blue-600 text-xs leading-relaxed">
                        {volunteerProfile.showFullMobile 
                          ? 'Your full mobile number is visible to all users in the volunteer directory' 
                          : 'Only the first 4 digits of your mobile number are shown (e.g., 9876XXXXXX)'
                        }
                      </p>
                    </div>
                    <div className="ml-4 flex flex-col items-center space-y-2">
                      <div className="relative">
                        <Switch
                          checked={volunteerProfile.showFullMobile}
                          onCheckedChange={handlePrivacyToggle}
                          disabled={isUpdatingPrivacy}
                          className="volunteer-privacy-toggle"
                        />
                        {isUpdatingPrivacy && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                          </div>
                        )}
                      </div>
                      <span className={`text-xs font-semibold px-2 py-1 rounded-full transition-all duration-200 ${
                        volunteerProfile.showFullMobile 
                          ? 'bg-green-100 text-green-700 border border-green-300' 
                          : 'bg-gray-100 text-gray-600 border border-gray-300'
                      }`}>
                        {volunteerProfile.showFullMobile ? 'Visible' : 'Hidden'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Profile Information Section */}
      <Card className="overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg font-semibold text-gray-900 flex items-center">
                <User className="h-5 w-5 mr-2 text-blue-600" />
                Profile Information
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1">Your verified volunteer details</p>
            </div>
            {volunteerProfile.approved && !pendingEdit && (
              <Button
                onClick={openEditModal}
                variant="outline"
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-white border-blue-600 hover:border-blue-700 shadow-sm transition-all duration-200"
              >
                <Edit3 className="h-4 w-4 mr-2" />
                Edit Profile
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="flex items-center text-sm font-medium text-gray-700">
                  <Mail className="h-4 w-4 mr-2 text-gray-500" />
                  Email Address
                </label>
                <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 transition-colors hover:bg-gray-100">
                  <p className="text-gray-900 font-medium break-all">{contactInfo.email}</p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="flex items-center text-sm font-medium text-gray-700">
                  <Phone className="h-4 w-4 mr-2 text-gray-500" />
                  Mobile Number
                </label>
                <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 transition-colors hover:bg-gray-100">
                  <p className="text-gray-900 font-medium">{contactInfo.mobile}</p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="flex items-center text-sm font-medium text-gray-700">
                <MapPin className="h-4 w-4 mr-2 text-gray-500" />
                Complete Address
              </label>
              <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 transition-colors hover:bg-gray-100">
                <p className="text-gray-900 font-medium leading-relaxed">{volunteerProfile.address}</p>
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="h-4 w-4 text-blue-600" />
                </div>
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-medium text-blue-900 mb-1">Secure Storage</h4>
                <p className="text-xs text-blue-700 leading-relaxed">
                  All your personal information is securely stored on the Internet Computer blockchain and is only accessible to verified admins for approval purposes.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Application Timeline */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Application Timeline</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {timelineEntries.map((entry, index) => {
            if (entry.type === 'application') {
              return (
                <div key={`app-${index}`} className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <User className="h-3 w-3 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 text-sm">Application Submitted</p>
                    <p className="text-xs text-gray-600">
                      {new Date(Number(entry.timestamp) / 1000000).toLocaleDateString('en-IN', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </p>
                    <p className="text-xs text-gray-500">Complete profile with photo and details</p>
                    {entry.status === 'Approved' && (
                      <div className="mt-2 flex items-center space-x-2">
                        <CheckCircle className="h-3 w-3 text-green-600" />
                        <span className="text-xs text-green-700 font-medium">Approved</span>
                      </div>
                    )}
                    {entry.status === 'Rejected' && entry.rejectionNote && (
                      <div className="mt-2">
                        <div className="flex items-center space-x-2 mb-1">
                          <XCircle className="h-3 w-3 text-red-600" />
                          <span className="text-xs text-red-700 font-medium">Rejected</span>
                        </div>
                        <div className="bg-red-50 border border-red-200 rounded p-2 mt-1">
                          <p className="text-xs text-red-800">{entry.rejectionNote}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            } else {
              return (
                <div key={`edit-${index}`} className="flex items-start space-x-3">
                  <div className={`w-6 h-6 ${getEditStatusColor(entry.status)} rounded-full flex items-center justify-center flex-shrink-0`}>
                    {getEditStatusIcon(entry.status)}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 text-sm">Profile Update Request</p>
                    <p className="text-xs text-gray-600">
                      {new Date(Number(entry.timestamp) / 1000000).toLocaleDateString('en-IN', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </p>
                    <div className="mt-1 flex items-center space-x-2">
                      {entry.status === 'Pending' && (
                        <>
                          <Clock className="h-3 w-3 text-yellow-600" />
                          <span className="text-xs text-yellow-700 font-medium">Pending Review</span>
                        </>
                      )}
                      {entry.status === 'Approved' && (
                        <>
                          <CheckCircle className="h-3 w-3 text-green-600" />
                          <span className="text-xs text-green-700 font-medium">Approved</span>
                        </>
                      )}
                      {entry.status === 'Rejected' && (
                        <>
                          <XCircle className="h-3 w-3 text-red-600" />
                          <span className="text-xs text-red-700 font-medium">Rejected</span>
                        </>
                      )}
                    </div>
                    {entry.status === 'Rejected' && entry.rejectionNote && (
                      <div className="bg-red-50 border border-red-200 rounded p-2 mt-2">
                        <p className="text-xs text-red-800">{entry.rejectionNote}</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            }
          })}
        </CardContent>
      </Card>

      {/* Directory Status */}
      {volunteerProfile.approved && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-4">
            <div className="flex items-start space-x-3">
              <Award className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="font-semibold text-green-800 text-sm">Public Directory Status</h3>
                <p className="text-green-700 text-xs mt-1 mb-3">
                  Your profile is live in the public volunteer directory! Citizens can find your contact information.
                </p>
                <Button
                  onClick={() => navigate({ to: '/volunteer/directory' })}
                  size="sm"
                  className="bg-green-600 hover:bg-green-700 text-xs"
                >
                  View Directory
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Edit Profile Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-[600px] bg-white bg-opacity-95 backdrop-blur-md border border-gray-200 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center text-xl font-semibold text-gray-900">
              <Edit3 className="h-5 w-5 mr-2 text-blue-600" />
              Edit Profile
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-600">
              Submit changes for admin approval. Your current profile will remain active until changes are approved.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
            {/* Photo Upload */}
            <div className="space-y-2">
              <Label htmlFor="photo" className="flex items-center text-sm font-medium text-gray-700">
                <Camera className="h-4 w-4 mr-2 text-gray-500" />
                Profile Photo
              </Label>
              <div className="flex items-center space-x-4">
                <Avatar className="h-20 w-20 border-2 border-gray-200">
                  <AvatarImage src={photoPreview || photoUrl || ''} alt="Profile" />
                  <AvatarFallback>
                    <User className="h-10 w-10 text-gray-400" />
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <Input
                    id="photo"
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    disabled={isUploading}
                    className="text-sm"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {isUploading ? 'Uploading...' : 'Max 5MB, JPG/PNG'}
                  </p>
                </div>
              </div>
            </div>

            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium text-gray-700">Full Name *</Label>
              <Input
                id="name"
                value={editForm.name}
                onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter your full name"
                className="text-sm"
              />
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-gray-700">Email Address *</Label>
              <Input
                id="email"
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                placeholder="your.email@example.com"
                className="text-sm"
              />
            </div>

            {/* Mobile */}
            <div className="space-y-2">
              <Label htmlFor="mobile" className="text-sm font-medium text-gray-700">Mobile Number *</Label>
              <Input
                id="mobile"
                type="tel"
                value={editForm.mobile}
                onChange={(e) => setEditForm(prev => ({ ...prev, mobile: e.target.value }))}
                placeholder="10-digit mobile number"
                className="text-sm"
              />
            </div>

            {/* Address */}
            <div className="space-y-2">
              <Label htmlFor="address" className="text-sm font-medium text-gray-700">Complete Address *</Label>
              <Textarea
                id="address"
                value={editForm.address}
                onChange={(e) => setEditForm(prev => ({ ...prev, address: e.target.value }))}
                placeholder="Enter your complete address"
                rows={3}
                className="text-sm"
              />
            </div>

            {/* Privacy Toggle */}
            <div className="space-y-2">
              <Label className="flex items-center text-sm font-medium text-gray-700">
                <Shield className="h-4 w-4 mr-2 text-gray-500" />
                Privacy Settings
              </Label>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">Show full mobile number</p>
                  <p className="text-xs text-gray-600">
                    {editForm.showFullMobile 
                      ? 'Full number visible in directory' 
                      : 'Only first 4 digits shown'
                    }
                  </p>
                </div>
                <Switch
                  checked={editForm.showFullMobile}
                  onCheckedChange={(checked) => setEditForm(prev => ({ ...prev, showFullMobile: checked }))}
                />
              </div>
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              onClick={() => setIsEditModalOpen(false)}
              disabled={isSubmittingEdit}
              variant="outline"
              className="w-full sm:w-auto"
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button
              onClick={handleSubmitEdit}
              disabled={isSubmittingEdit || isUploading}
              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700"
            >
              {isSubmittingEdit ? (
                <>
                  <Clock className="h-4 w-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Submit for Approval
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
