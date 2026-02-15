import React, { useState } from 'react';
import { MapPin, Calendar, User, MessageSquare, UserCheck, Edit, Camera, Upload, CheckCircle, AlertCircle, X, Trash2, Save, ImageIcon, Hash, Download, Mail, Eye } from 'lucide-react';
import { Report } from '../backend';
import { useFileUrl, useFileUpload } from '../blob-storage/FileStorage';
import { CertificateGenerator } from './CertificateGenerator';
import { useDeleteReport } from '../hooks/useQueries';
import { useLanguage } from '../contexts/LanguageContext';
import { LazyImage } from './LazyImage';

interface AdminReportCardProps {
  report: Report;
}

interface LocationData {
  house_number?: string;
  road?: string;
  neighbourhood?: string;
  suburb?: string;
  village?: string;
  town?: string;
  city?: string;
  city_district?: string;
  county?: string;
  state_district?: string;
  state?: string;
  postcode?: string;
  country?: string;
}

export function AdminReportCard({ report }: AdminReportCardProps) {
  const { t } = useLanguage();
  const { data: imageUrl } = useFileUrl(report.photoPath);
  const { data: proofImageUrl } = useFileUrl(report.proofPhotoPath || '');
  const { data: mlaImageUrl } = useFileUrl(report.mlaPhotoPath || '');
  
  // Get PM/CM/MP photos EXCLUSIVELY from report's pmData, cmData, and mpData Representative objects
  const { data: pmPhotoUrl } = useFileUrl(report.pmData?.photoPath || '');
  const { data: cmPhotoUrl } = useFileUrl(report.cmData?.photoPath || '');
  const { data: mpPhotoUrl } = useFileUrl(report.mpData?.photoPath || '');
  
  const { uploadFile, isUploading } = useFileUpload();
  const { mutate: deleteReport, isPending: isDeleting } = useDeleteReport();

  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showProofModal, setShowProofModal] = useState(false);
  const [showFullPhotoModal, setShowFullPhotoModal] = useState(false);
  const [locationData, setLocationData] = useState<LocationData>({});
  const [isLoadingLocation, setIsLoadingLocation] = useState(true);

  // Edit form state
  const [editForm, setEditForm] = useState({
    username: report.username || '',
    notes: report.notes || '',
    issueType: report.issueType,
    status: report.status,
    mlaName: report.mlaName || '',
    customAddress: report.customAddress || '',
    pmName: report.pmName || '',
    cmName: report.cmName || '',
    reporterName: report.reporterName || '',
    completionNotes: report.completionNotes || ''
  });

  // Photo replacement state
  const [newMainPhoto, setNewMainPhoto] = useState<File | null>(null);
  const [newMlaPhoto, setNewMlaPhoto] = useState<File | null>(null);
  const [newProofPhoto, setNewProofPhoto] = useState<File | null>(null);
  const [newPmPhoto, setNewPmPhoto] = useState<File | null>(null);
  const [newCmPhoto, setNewCmPhoto] = useState<File | null>(null);

  const formatDate = (timestamp: bigint) => {
    return new Date(Number(timestamp) / 1000000).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getIssueTypeEmoji = (issueType: string) => {
    const lowerType = issueType.toLowerCase();
    if (lowerType.includes('pothole')) return '🕳️';
    if (lowerType.includes('garbage') || lowerType.includes('waste')) return '🗑️';
    if (lowerType.includes('streetlight') || lowerType.includes('light')) return '💡';
    if (lowerType.includes('waterlogging') || lowerType.includes('water')) return '🌊';
    if (lowerType.includes('flood')) return '🌊';
    if (lowerType.includes('dumping')) return '🚯';
    if (lowerType.includes('parking')) return '🚗';
    return '❓';
  };

  const getIssueTypeColor = (issueType: string) => {
    const lowerType = issueType.toLowerCase();
    if (lowerType.includes('pothole')) return 'bg-orange-100 text-orange-700';
    if (lowerType.includes('garbage') || lowerType.includes('waste')) return 'bg-green-100 text-green-700';
    if (lowerType.includes('streetlight') || lowerType.includes('light')) return 'bg-yellow-100 text-yellow-700';
    if (lowerType.includes('waterlogging') || lowerType.includes('water')) return 'bg-blue-100 text-blue-700';
    if (lowerType.includes('flood')) return 'bg-blue-100 text-blue-700';
    if (lowerType.includes('dumping')) return 'bg-red-100 text-red-700';
    if (lowerType.includes('parking')) return 'bg-purple-100 text-purple-700';
    return 'bg-gray-100 text-gray-700';
  };

  const getStatusColor = (status: string) => {
    const normalizedStatus = status.toLowerCase();
    switch (normalizedStatus) {
      case 'submitted':
      case 'open':
        return 'bg-blue-100 text-blue-700';
      case 'resolved':
        return 'bg-green-100 text-green-700';
      case 'closed':
        return 'bg-gray-100 text-gray-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusIcon = (status: string) => {
    const normalizedStatus = status.toLowerCase();
    switch (normalizedStatus) {
      case 'submitted':
      case 'open':
        return <AlertCircle className="h-4 w-4" />;
      case 'resolved':
        return <CheckCircle className="h-4 w-4" />;
      case 'closed':
        return <X className="h-4 w-4" />;
      default:
        return <Edit className="h-4 w-4" />;
    }
  };

  const getStatusDisplayText = (status: string) => {
    const normalizedStatus = status.toLowerCase();
    switch (normalizedStatus) {
      case 'submitted':
        return 'Open';
      case 'open':
        return 'Open';
      case 'resolved':
        return 'Resolved';
      default:
        return status;
    }
  };

  const fetchLocationData = async (latitude: number, longitude: number): Promise<LocationData> => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch location data');
      }
      
      const data = await response.json();
      return data.address || {};
    } catch (error) {
      console.error('Error fetching location data:', error);
      return {};
    }
  };

  React.useEffect(() => {
    const loadLocationData = async () => {
      setIsLoadingLocation(true);
      const data = await fetchLocationData(report.location.latitude, report.location.longitude);
      setLocationData(data);
      setIsLoadingLocation(false);
    };

    loadLocationData();
  }, [report.location.latitude, report.location.longitude]);

  const formatLocationDisplay = () => {
    if (isLoadingLocation) {
      return 'Loading...';
    }

    if (report.customAddress) {
      return report.customAddress;
    }

    const addressParts: string[] = [];
    
    if (locationData.house_number && locationData.road) {
      addressParts.push(`${locationData.house_number} ${locationData.road}`);
    } else if (locationData.road) {
      addressParts.push(locationData.road);
    }
    
    if (locationData.neighbourhood) {
      addressParts.push(locationData.neighbourhood);
    } else if (locationData.suburb) {
      addressParts.push(locationData.suburb);
    } else if (locationData.village) {
      addressParts.push(locationData.village);
    }
    
    if (locationData.city) {
      addressParts.push(locationData.city);
    } else if (locationData.town) {
      addressParts.push(locationData.town);
    } else if (locationData.city_district) {
      addressParts.push(locationData.city_district);
    }
    
    if (locationData.county && !addressParts.includes(locationData.county)) {
      addressParts.push(locationData.county);
    } else if (locationData.state_district && !addressParts.includes(locationData.state_district)) {
      addressParts.push(locationData.state_district);
    }
    
    if (locationData.state) {
      addressParts.push(locationData.state);
    }

    if (addressParts.length > 0) {
      return addressParts.join(', ');
    }

    return `${report.location.latitude.toFixed(4)}, ${report.location.longitude.toFixed(4)}`;
  };

  const handlePhotoSelect = (file: File, type: 'main' | 'mla' | 'proof' | 'pm' | 'cm') => {
    switch (type) {
      case 'main':
        setNewMainPhoto(file);
        break;
      case 'mla':
        setNewMlaPhoto(file);
        break;
      case 'proof':
        setNewProofPhoto(file);
        break;
      case 'pm':
        setNewPmPhoto(file);
        break;
      case 'cm':
        setNewCmPhoto(file);
        break;
    }
  };

  const handleSave = async () => {
    try {
      let updatedPhotoPath = report.photoPath;
      let updatedMlaPhotoPath = report.mlaPhotoPath;
      let updatedProofPhotoPath = report.proofPhotoPath;
      let updatedPmPhotoPath = report.pmPhotoPath;
      let updatedCmPhotoPath = report.cmPhotoPath;

      // Upload new photos if selected
      if (newMainPhoto) {
        const timestamp = Date.now();
        const fileName = `admin-update-main-${timestamp}-${newMainPhoto.name}`;
        const filePath = `reports/${fileName}`;
        await uploadFile(filePath, newMainPhoto);
        updatedPhotoPath = filePath;
      }

      if (newMlaPhoto) {
        const timestamp = Date.now();
        const fileName = `admin-update-mla-${timestamp}-${newMlaPhoto.name}`;
        const filePath = `reports/mla/${fileName}`;
        await uploadFile(filePath, newMlaPhoto);
        updatedMlaPhotoPath = filePath;
      }

      if (newProofPhoto) {
        const timestamp = Date.now();
        const fileName = `admin-update-proof-${timestamp}-${newProofPhoto.name}`;
        const filePath = `reports/proof/${fileName}`;
        await uploadFile(filePath, newProofPhoto);
        updatedProofPhotoPath = filePath;
      }

      if (newPmPhoto) {
        const timestamp = Date.now();
        const fileName = `admin-update-pm-${timestamp}-${newPmPhoto.name}`;
        const filePath = `leaders/pm/${fileName}`;
        await uploadFile(filePath, newPmPhoto);
        updatedPmPhotoPath = filePath;
      }

      if (newCmPhoto) {
        const timestamp = Date.now();
        const fileName = `admin-update-cm-${timestamp}-${newCmPhoto.name}`;
        const filePath = `leaders/cm/${fileName}`;
        await uploadFile(filePath, newCmPhoto);
        updatedCmPhotoPath = filePath;
      }

      // Note: Since backend doesn't have a comprehensive update method yet,
      // we'll show a message that editing is not fully implemented
      alert('Photo uploads completed, but comprehensive report editing is not yet fully implemented in the backend.');
      
      setIsEditing(false);
      setNewMainPhoto(null);
      setNewMlaPhoto(null);
      setNewProofPhoto(null);
      setNewPmPhoto(null);
      setNewCmPhoto(null);
      
    } catch (error) {
      console.error('Error updating report:', error);
      alert('Failed to update report. Please try again.');
    }
  };

  const handleDelete = () => {
    deleteReport(report.id, {
      onSuccess: () => {
        setShowDeleteConfirm(false);
        // Show success message
        alert('Report deleted successfully!');
      },
      onError: (error) => {
        console.error('Error deleting report:', error);
        // Show user-friendly error message
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        if (errorMessage.includes('Unauthorized')) {
          alert('You do not have permission to delete this report. Please ensure you are logged in as an admin.');
        } else if (errorMessage.includes('Report not found')) {
          alert('This report no longer exists or has already been deleted.');
        } else {
          alert('Failed to delete report. Please try again or contact support if the problem persists.');
        }
        setShowDeleteConfirm(false);
      }
    });
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditForm({
      username: report.username || '',
      notes: report.notes || '',
      issueType: report.issueType,
      status: report.status,
      mlaName: report.mlaName || '',
      customAddress: report.customAddress || '',
      pmName: report.pmName || '',
      cmName: report.cmName || '',
      reporterName: report.reporterName || '',
      completionNotes: report.completionNotes || ''
    });
    setNewMainPhoto(null);
    setNewMlaPhoto(null);
    setNewProofPhoto(null);
    setNewPmPhoto(null);
    setNewCmPhoto(null);
  };

  const handleDownloadComplaint = () => {
    alert('This feature is coming soon');
  };

  const handleEmailAuthorities = () => {
    alert('This feature is coming soon');
  };

  // Get minister names and photos EXCLUSIVELY from admin directory (report's Representative objects)
  const getPmDisplayName = () => {
    return report.pmData?.name || 'Prime Minister';
  };

  const getCmDisplayName = () => {
    return report.cmData?.name || 'Chief Minister';
  };

  const getPmPhotoUrl = () => {
    return pmPhotoUrl || null;
  };

  const getCmPhotoUrl = () => {
    return cmPhotoUrl || null;
  };

  return (
    <>
      <div className="bg-white rounded-lg shadow-md border-2 border-red-200 overflow-hidden">
        {/* Admin Badge */}
        <div className="bg-red-600 text-white px-4 py-2 text-sm font-medium">
          Admin View - Full Edit Access
        </div>

        <div className="p-4 space-y-4">
          {/* Responsible Leaders Section at the Top */}
          <div className="border-b border-gray-100 pb-3">
            <h4 className="text-sm font-medium text-gray-600 mb-3">Responsible Leaders</h4>
            <div className="flex items-center justify-center space-x-4">
              {/* Prime Minister */}
              <div className="flex flex-col items-center space-y-1">
                <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-blue-200 bg-gray-100 flex items-center justify-center">
                  {getPmPhotoUrl() ? (
                    <LazyImage
                      src={getPmPhotoUrl()!}
                      alt="Prime Minister"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="h-6 w-6 text-gray-400" />
                  )}
                </div>
                <div className="text-center">
                  <p className="text-xs font-medium text-gray-900 leading-tight">{getPmDisplayName()}</p>
                  <p className="text-xs text-gray-500">PM</p>
                </div>
              </div>

              {/* Chief Minister */}
              <div className="flex flex-col items-center space-y-1">
                <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-green-200 bg-gray-100 flex items-center justify-center">
                  {getCmPhotoUrl() ? (
                    <LazyImage
                      src={getCmPhotoUrl()!}
                      alt="Chief Minister"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="h-6 w-6 text-gray-400" />
                  )}
                </div>
                <div className="text-center">
                  <p className="text-xs font-medium text-gray-900 leading-tight">{getCmDisplayName()}</p>
                  <p className="text-xs text-gray-500">CM</p>
                </div>
              </div>

              {/* MLA - Only show if provided */}
              {report.mlaName && (
                <div className="flex flex-col items-center space-y-1">
                  <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-purple-200 bg-gray-100 flex items-center justify-center">
                    {mlaImageUrl ? (
                      <LazyImage
                        src={mlaImageUrl}
                        alt="MLA"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="h-6 w-6 text-gray-400" />
                    )}
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-medium text-gray-900 leading-tight">{report.mlaName}</p>
                    <p className="text-xs text-gray-500">MLA</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Report Image - Clickable to view full size */}
          <div className="relative group cursor-pointer" onClick={() => setShowFullPhotoModal(true)}>
            {imageUrl ? (
              <>
                <LazyImage
                  src={imageUrl}
                  alt="Report"
                  className="w-full h-48 object-cover rounded-lg"
                />
                {/* Hover overlay to indicate clickability */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-200 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <div className="bg-white/90 backdrop-blur-sm text-gray-900 px-3 py-2 rounded-lg font-medium flex items-center space-x-2 shadow-lg">
                    <Eye className="h-4 w-4" />
                    <span>View Full Photo</span>
                  </div>
                </div>
                
                {isEditing && (
                  <div className="absolute top-2 right-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation(); // Prevent triggering the full photo modal
                        const input = document.createElement('input');
                        input.type = 'file';
                        input.accept = 'image/*';
                        input.onchange = (e) => {
                          const file = (e.target as HTMLInputElement).files?.[0];
                          if (file) handlePhotoSelect(file, 'main');
                        };
                        input.click();
                      }}
                      className="bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 shadow-lg"
                    >
                      <Upload className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="w-full h-48 bg-gray-100 rounded-lg flex items-center justify-center">
                <ImageIcon className="h-12 w-12 text-gray-400" />
              </div>
            )}
          </div>

          {/* Report Details */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getIssueTypeColor(report.issueType)}`}>
                  {getIssueTypeEmoji(report.issueType)} {report.issueType}
                </span>
                <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center space-x-1 ${getStatusColor(report.status)}`}>
                  {getStatusIcon(report.status)}
                  <span>{getStatusDisplayText(report.status)}</span>
                </span>
              </div>
              <div className="flex items-center space-x-2">
                {!isEditing && (
                  <>
                    <button
                      onClick={() => setIsEditing(true)}
                      className="text-blue-600 hover:text-blue-700 p-2"
                      title="Edit Report"
                    >
                      <Edit className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => setShowDeleteConfirm(true)}
                      className="text-red-600 hover:text-red-700 p-2"
                      title="Delete Report"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </>
                )}
                {isEditing && (
                  <>
                    <button
                      onClick={handleSave}
                      disabled={isUploading}
                      className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 disabled:opacity-50 flex items-center space-x-1"
                    >
                      <Save className="h-4 w-4" />
                      <span>Save</span>
                    </button>
                    <button
                      onClick={handleCancel}
                      className="bg-gray-600 text-white px-3 py-1 rounded hover:bg-gray-700 flex items-center space-x-1"
                    >
                      <X className="h-4 w-4" />
                      <span>Cancel</span>
                    </button>
                  </>
                )}
              </div>
            </div>

            <div className="flex items-start space-x-2 text-sm text-gray-600">
              <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span className="flex-1">{formatLocationDisplay()}</span>
            </div>

            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Calendar className="h-4 w-4 flex-shrink-0" />
              <span>{formatDate(report.timestamp)}</span>
            </div>

            {report.username && (
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <User className="h-4 w-4 flex-shrink-0" />
                <span>Reported by: {report.username}</span>
              </div>
            )}

            {report.submittedByVolunteer && (
              <div className="flex items-center space-x-2 text-sm text-blue-600">
                <UserCheck className="h-4 w-4 flex-shrink-0" />
                <span className="font-medium">Submitted by Volunteer</span>
              </div>
            )}

            {report.notes && (
              <div className="flex items-start space-x-2 text-sm text-gray-600">
                <MessageSquare className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span className="flex-1">{report.notes}</span>
              </div>
            )}

            {report.status.toLowerCase() === 'resolved' && report.proofPhotoPath && (
              <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                <h4 className="text-sm font-semibold text-green-900 mb-2 flex items-center">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Resolution Details
                </h4>
                <div className="space-y-2">
                  {report.reporterName && (
                    <p className="text-sm text-gray-700">
                      <strong>Resolved by:</strong> {report.reporterName}
                    </p>
                  )}
                  {report.completionNotes && (
                    <p className="text-sm text-gray-700">
                      <strong>Notes:</strong> {report.completionNotes}
                    </p>
                  )}
                  {proofImageUrl && (
                    <div className="mt-2">
                      <button
                        onClick={() => setShowProofModal(true)}
                        className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center"
                      >
                        <Camera className="h-4 w-4 mr-1" />
                        View Proof Photo
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="flex items-center space-x-2 text-xs text-gray-500">
              <Hash className="h-3 w-3" />
              <span className="font-mono">{report.id}</span>
            </div>
          </div>

          {/* Admin Actions */}
          <div className="pt-3 border-t border-gray-200">
            <div className="flex flex-wrap gap-2">
              <CertificateGenerator report={report} />
              <button
                onClick={handleDownloadComplaint}
                className="flex-1 sm:flex-none bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors font-medium text-sm flex items-center justify-center space-x-2"
              >
                <Download className="h-4 w-4" />
                <span>Download Complaint</span>
              </button>
              <button
                onClick={handleEmailAuthorities}
                className="flex-1 sm:flex-none bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors font-medium text-sm flex items-center justify-center space-x-2"
              >
                <Mail className="h-4 w-4" />
                <span>Email Authorities</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Full Photo Modal */}
      {showFullPhotoModal && imageUrl && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4"
          onClick={() => setShowFullPhotoModal(false)}
        >
          <div className="relative max-w-4xl max-h-[90vh] w-full">
            <button
              onClick={() => setShowFullPhotoModal(false)}
              className="absolute top-4 right-4 bg-white text-gray-900 p-2 rounded-full hover:bg-gray-100 shadow-lg z-10"
            >
              <X className="h-6 w-6" />
            </button>
            <LazyImage
              src={imageUrl}
              alt="Report Full Size"
              className="w-full h-full object-contain rounded-lg"
              priority="high"
            />
          </div>
        </div>
      )}

      {/* Proof Photo Modal */}
      {showProofModal && proofImageUrl && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4"
          onClick={() => setShowProofModal(false)}
        >
          <div className="relative max-w-4xl max-h-[90vh] w-full">
            <button
              onClick={() => setShowProofModal(false)}
              className="absolute top-4 right-4 bg-white text-gray-900 p-2 rounded-full hover:bg-gray-100 shadow-lg z-10"
            >
              <X className="h-6 w-6" />
            </button>
            <LazyImage
              src={proofImageUrl}
              alt="Proof Photo"
              className="w-full h-full object-contain rounded-lg"
              priority="high"
            />
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Confirm Deletion</h3>
            <p className="text-sm text-gray-600 mb-6">
              Are you sure you want to delete this report? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDeleting ? 'Deleting...' : 'Delete Report'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
