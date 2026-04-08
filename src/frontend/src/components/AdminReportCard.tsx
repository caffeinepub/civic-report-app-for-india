import {
  AlertCircle,
  Calendar,
  Camera,
  CheckCircle,
  Download,
  Edit,
  Eye,
  Hash,
  ImageIcon,
  Mail,
  MapPin,
  MessageSquare,
  Save,
  Trash2,
  Upload,
  User,
  UserCheck,
  X,
} from "lucide-react";
import React, { useState } from "react";
import type { Report } from "../backend";
import { useFileUpload, useFileUrl } from "../blob-storage/FileStorage";
import { useLanguage } from "../contexts/LanguageContext";
import { useDeleteReport } from "../hooks/useQueries";
import { CertificateGenerator } from "./CertificateGenerator";

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
  const { t: _t } = useLanguage();
  const { data: imageUrl } = useFileUrl(report.photoPath);
  const { data: proofImageUrl } = useFileUrl(report.proofPhotoPath || "");
  const { data: mlaImageUrl } = useFileUrl(report.mlaPhotoPath || "");

  // Get PM/CM/MP photos EXCLUSIVELY from report's pmData, cmData, and mpData Representative objects
  const { data: pmPhotoUrl } = useFileUrl(report.pmData?.photoPath || "");
  const { data: cmPhotoUrl } = useFileUrl(report.cmData?.photoPath || "");
  const { data: _mpPhotoUrl } = useFileUrl(report.mpData?.photoPath || "");

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
    username: report.username || "",
    notes: report.notes || "",
    issueType: report.issueType,
    status: report.status,
    mlaName: report.mlaName || "",
    customAddress: report.customAddress || "",
    pmName: report.pmName || "",
    cmName: report.cmName || "",
    reporterName: report.reporterName || "",
    completionNotes: report.completionNotes || "",
  });

  // Photo replacement state
  const [newMainPhoto, setNewMainPhoto] = useState<File | null>(null);
  const [newMlaPhoto, setNewMlaPhoto] = useState<File | null>(null);
  const [newProofPhoto, setNewProofPhoto] = useState<File | null>(null);
  const [newPmPhoto, setNewPmPhoto] = useState<File | null>(null);
  const [newCmPhoto, setNewCmPhoto] = useState<File | null>(null);

  const formatDate = (timestamp: bigint) => {
    return new Date(Number(timestamp) / 1000000).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getIssueTypeEmoji = (issueType: string) => {
    const lowerType = issueType.toLowerCase();
    if (lowerType.includes("pothole")) return "🕳️";
    if (lowerType.includes("garbage") || lowerType.includes("waste"))
      return "🗑️";
    if (lowerType.includes("streetlight") || lowerType.includes("light"))
      return "💡";
    if (lowerType.includes("waterlogging") || lowerType.includes("water"))
      return "🌊";
    if (lowerType.includes("flood")) return "🌊";
    if (lowerType.includes("dumping")) return "🚯";
    if (lowerType.includes("parking")) return "🚗";
    return "❓";
  };

  const getIssueTypeColor = (issueType: string) => {
    const lowerType = issueType.toLowerCase();
    if (lowerType.includes("pothole")) return "bg-orange-100 text-orange-700";
    if (lowerType.includes("garbage") || lowerType.includes("waste"))
      return "bg-green-100 text-green-700";
    if (lowerType.includes("streetlight") || lowerType.includes("light"))
      return "bg-yellow-100 text-yellow-700";
    if (lowerType.includes("waterlogging") || lowerType.includes("water"))
      return "bg-blue-100 text-blue-700";
    if (lowerType.includes("flood")) return "bg-blue-100 text-blue-700";
    if (lowerType.includes("dumping")) return "bg-red-100 text-red-700";
    if (lowerType.includes("parking")) return "bg-purple-100 text-purple-700";
    return "bg-gray-100 text-gray-700";
  };

  const getStatusColor = (status: string) => {
    const normalizedStatus = status.toLowerCase();
    switch (normalizedStatus) {
      case "submitted":
      case "open":
        return "bg-blue-100 text-blue-700";
      case "resolved":
        return "bg-green-100 text-green-700";
      case "closed":
        return "bg-gray-100 text-gray-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getStatusIcon = (status: string) => {
    const normalizedStatus = status.toLowerCase();
    switch (normalizedStatus) {
      case "submitted":
      case "open":
        return <AlertCircle className="h-4 w-4" />;
      case "resolved":
        return <CheckCircle className="h-4 w-4" />;
      case "closed":
        return <X className="h-4 w-4" />;
      default:
        return <Edit className="h-4 w-4" />;
    }
  };

  const getStatusDisplayText = (status: string) => {
    const normalizedStatus = status.toLowerCase();
    switch (normalizedStatus) {
      case "submitted":
        return "Open";
      case "open":
        return "Open";
      case "resolved":
        return "Resolved";
      default:
        return status;
    }
  };

  const fetchLocationData = async (
    latitude: number,
    longitude: number,
  ): Promise<LocationData> => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`,
      );

      if (!response.ok) {
        throw new Error("Failed to fetch location data");
      }

      const data = await response.json();
      return data.address || {};
    } catch (error) {
      console.error("Error fetching location data:", error);
      return {};
    }
  };

  React.useEffect(() => {
    const loadLocationData = async () => {
      setIsLoadingLocation(true);
      const data = await fetchLocationData(
        report.location.latitude,
        report.location.longitude,
      );
      setLocationData(data);
      setIsLoadingLocation(false);
    };

    loadLocationData();
  }, [report.location.latitude, report.location.longitude]);

  const formatLocationDisplay = () => {
    if (isLoadingLocation) {
      return "Loading...";
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
    } else if (
      locationData.state_district &&
      !addressParts.includes(locationData.state_district)
    ) {
      addressParts.push(locationData.state_district);
    }

    if (locationData.state) {
      addressParts.push(locationData.state);
    }

    if (addressParts.length > 0) {
      return addressParts.join(", ");
    }

    return `${report.location.latitude.toFixed(4)}, ${report.location.longitude.toFixed(4)}`;
  };

  const handlePhotoSelect = (
    file: File,
    type: "main" | "mla" | "proof" | "pm" | "cm",
  ) => {
    switch (type) {
      case "main":
        setNewMainPhoto(file);
        break;
      case "mla":
        setNewMlaPhoto(file);
        break;
      case "proof":
        setNewProofPhoto(file);
        break;
      case "pm":
        setNewPmPhoto(file);
        break;
      case "cm":
        setNewCmPhoto(file);
        break;
    }
  };

  const handleSave = async () => {
    try {
      let _updatedPhotoPath = report.photoPath;
      let _updatedMlaPhotoPath = report.mlaPhotoPath;
      let _updatedProofPhotoPath = report.proofPhotoPath;
      let _updatedPmPhotoPath = report.pmPhotoPath;
      let _updatedCmPhotoPath = report.cmPhotoPath;

      // Upload new photos if selected
      if (newMainPhoto) {
        const timestamp = Date.now();
        const fileName = `admin-update-main-${timestamp}-${newMainPhoto.name}`;
        const filePath = `reports/${fileName}`;
        await uploadFile(filePath, newMainPhoto);
        _updatedPhotoPath = filePath;
      }

      if (newMlaPhoto) {
        const timestamp = Date.now();
        const fileName = `admin-update-mla-${timestamp}-${newMlaPhoto.name}`;
        const filePath = `reports/mla/${fileName}`;
        await uploadFile(filePath, newMlaPhoto);
        _updatedMlaPhotoPath = filePath;
      }

      if (newProofPhoto) {
        const timestamp = Date.now();
        const fileName = `admin-update-proof-${timestamp}-${newProofPhoto.name}`;
        const filePath = `reports/proof/${fileName}`;
        await uploadFile(filePath, newProofPhoto);
        _updatedProofPhotoPath = filePath;
      }

      if (newPmPhoto) {
        const timestamp = Date.now();
        const fileName = `admin-update-pm-${timestamp}-${newPmPhoto.name}`;
        const filePath = `leaders/pm/${fileName}`;
        await uploadFile(filePath, newPmPhoto);
        _updatedPmPhotoPath = filePath;
      }

      if (newCmPhoto) {
        const timestamp = Date.now();
        const fileName = `admin-update-cm-${timestamp}-${newCmPhoto.name}`;
        const filePath = `leaders/cm/${fileName}`;
        await uploadFile(filePath, newCmPhoto);
        _updatedCmPhotoPath = filePath;
      }

      // Note: Since backend doesn't have a comprehensive update method yet,
      // we'll show a message that editing is not fully implemented
      alert(
        "Photo uploads completed, but comprehensive report editing is not yet fully implemented in the backend.",
      );

      setIsEditing(false);
      setNewMainPhoto(null);
      setNewMlaPhoto(null);
      setNewProofPhoto(null);
      setNewPmPhoto(null);
      setNewCmPhoto(null);
    } catch (error) {
      console.error("Error updating report:", error);
      alert("Failed to update report. Please try again.");
    }
  };

  const handleDelete = () => {
    deleteReport(report.id, {
      onSuccess: () => {
        setShowDeleteConfirm(false);
        // Show success message
        alert("Report deleted successfully!");
      },
      onError: (error) => {
        console.error("Error deleting report:", error);
        // Show user-friendly error message
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error occurred";
        if (errorMessage.includes("Unauthorized")) {
          alert(
            "You do not have permission to delete this report. Please ensure you are logged in as an admin.",
          );
        } else if (errorMessage.includes("Report not found")) {
          alert("This report no longer exists or has already been deleted.");
        } else {
          alert(
            "Failed to delete report. Please try again or contact support if the problem persists.",
          );
        }
        setShowDeleteConfirm(false);
      },
    });
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditForm({
      username: report.username || "",
      notes: report.notes || "",
      issueType: report.issueType,
      status: report.status,
      mlaName: report.mlaName || "",
      customAddress: report.customAddress || "",
      pmName: report.pmName || "",
      cmName: report.cmName || "",
      reporterName: report.reporterName || "",
      completionNotes: report.completionNotes || "",
    });
    setNewMainPhoto(null);
    setNewMlaPhoto(null);
    setNewProofPhoto(null);
    setNewPmPhoto(null);
    setNewCmPhoto(null);
  };

  const handleDownloadComplaint = () => {
    alert("This feature is coming soon");
  };

  const handleEmailAuthorities = () => {
    alert("This feature is coming soon");
  };

  // Get minister names and photos EXCLUSIVELY from admin directory (report's Representative objects)
  const getPmDisplayName = () => {
    return report.pmData?.name || "Prime Minister";
  };

  const getCmDisplayName = () => {
    return report.cmData?.name || "Chief Minister";
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
            <h4 className="text-sm font-medium text-gray-600 mb-3">
              Responsible Leaders
            </h4>
            <div className="flex items-center justify-center space-x-4">
              {/* Prime Minister */}
              <div className="flex flex-col items-center space-y-1">
                <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-blue-200 bg-gray-100 flex items-center justify-center">
                  {getPmPhotoUrl() ? (
                    <img
                      src={getPmPhotoUrl()!}
                      alt="Prime Minister"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="h-6 w-6 text-gray-400" />
                  )}
                </div>
                <div className="text-center">
                  <p className="text-xs font-medium text-gray-900 leading-tight">
                    {getPmDisplayName()}
                  </p>
                  <p className="text-xs text-gray-500">PM</p>
                </div>
              </div>

              {/* Chief Minister */}
              <div className="flex flex-col items-center space-y-1">
                <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-green-200 bg-gray-100 flex items-center justify-center">
                  {getCmPhotoUrl() ? (
                    <img
                      src={getCmPhotoUrl()!}
                      alt="Chief Minister"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="h-6 w-6 text-gray-400" />
                  )}
                </div>
                <div className="text-center">
                  <p className="text-xs font-medium text-gray-900 leading-tight">
                    {getCmDisplayName()}
                  </p>
                  <p className="text-xs text-gray-500">CM</p>
                </div>
              </div>

              {/* MLA - Only show if provided */}
              {report.mlaName && (
                <div className="flex flex-col items-center space-y-1">
                  <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-purple-200 bg-gray-100 flex items-center justify-center">
                    {mlaImageUrl ? (
                      <img
                        src={mlaImageUrl}
                        alt="MLA"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="h-6 w-6 text-gray-400" />
                    )}
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-medium text-gray-900 leading-tight">
                      {report.mlaName}
                    </p>
                    <p className="text-xs text-gray-500">MLA</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Report Image - Clickable to view full size */}
          <div
            className="relative group cursor-pointer"
            onClick={() => setShowFullPhotoModal(true)}
          >
            {imageUrl ? (
              <>
                <img
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
                        const input = document.createElement("input");
                        input.type = "file";
                        input.accept = "image/*";
                        input.onchange = (e) => {
                          const file = (e.target as HTMLInputElement)
                            .files?.[0];
                          if (file) handlePhotoSelect(file, "main");
                        };
                        input.click();
                      }}
                      className="bg-red-600 text-white p-2 rounded-full hover:bg-red-700 transition-colors"
                      title="Replace main photo"
                    >
                      <ImageIcon className="h-4 w-4" />
                    </button>
                  </div>
                )}

                {newMainPhoto && (
                  <div className="absolute bottom-2 left-2 bg-green-600 text-white px-2 py-1 rounded text-xs">
                    New photo selected
                  </div>
                )}
              </>
            ) : (
              <div className="w-full h-48 bg-gray-200 rounded-lg flex items-center justify-center">
                <span className="text-gray-500 text-base">
                  Loading image...
                </span>
              </div>
            )}
          </div>

          {/* Report Info */}
          <div className="space-y-3">
            {/* Report ID - Clearly displayed */}
            <div className="flex items-center space-x-2 text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-lg">
              <Hash className="h-4 w-4" />
              <span className="font-mono font-medium">ID: {report.id}</span>
            </div>

            <div className="flex items-center justify-between">
              {isEditing ? (
                <input
                  type="text"
                  value={editForm.issueType}
                  onChange={(e) =>
                    setEditForm({ ...editForm, issueType: e.target.value })
                  }
                  className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm mr-2"
                />
              ) : (
                <span
                  className={`px-3 py-1 rounded-full text-base font-medium ${getIssueTypeColor(report.issueType)}`}
                >
                  {getIssueTypeEmoji(report.issueType)} {report.issueType}
                </span>
              )}

              {isEditing ? (
                <select
                  value={editForm.status}
                  onChange={(e) =>
                    setEditForm({ ...editForm, status: e.target.value })
                  }
                  className="px-2 py-1 border border-gray-300 rounded text-sm"
                >
                  <option value="Open">Open</option>
                  <option value="Resolved">Resolved</option>
                </select>
              ) : (
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium flex items-center space-x-1 ${getStatusColor(report.status)}`}
                >
                  {getStatusIcon(report.status)}
                  <span>{getStatusDisplayText(report.status)}</span>
                </span>
              )}
            </div>

            {/* Username */}
            <div className="flex items-center space-x-2 text-base text-gray-600">
              <User className="h-5 w-5" />
              {isEditing ? (
                <input
                  type="text"
                  value={editForm.username}
                  onChange={(e) =>
                    setEditForm({ ...editForm, username: e.target.value })
                  }
                  placeholder="Username"
                  className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                />
              ) : (
                <span>Reported by: {report.username || "Anonymous"}</span>
              )}
            </div>

            {/* Location */}
            <div className="flex items-start space-x-2 text-base text-gray-600">
              <MapPin className="h-5 w-5 mt-0.5 shrink-0" />
              {isEditing ? (
                <textarea
                  value={editForm.customAddress}
                  onChange={(e) =>
                    setEditForm({ ...editForm, customAddress: e.target.value })
                  }
                  placeholder="Custom address (leave empty to use auto-detected)"
                  className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm resize-none"
                  rows={2}
                />
              ) : (
                <span className="break-words">{formatLocationDisplay()}</span>
              )}
            </div>

            <div className="flex items-center space-x-2 text-base text-gray-600">
              <Calendar className="h-5 w-5" />
              <span>{formatDate(report.timestamp)}</span>
            </div>

            {/* PM and CM Photos Section - Only shown in edit mode */}
            {isEditing && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 space-y-3">
                <h4 className="text-sm font-semibold text-blue-800">
                  Leader Photos (Admin Control)
                </h4>
                <p className="text-xs text-blue-600">
                  Note: Leader information should be managed through the Admin
                  Directory for consistency across all reports.
                </p>

                {/* PM Photo */}
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-700">
                      Prime Minister Photo:
                    </span>
                    {getPmPhotoUrl() && (
                      <img
                        src={getPmPhotoUrl()!}
                        alt="PM"
                        className="w-12 h-12 object-cover rounded border"
                      />
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={editForm.pmName}
                      onChange={(e) =>
                        setEditForm({ ...editForm, pmName: e.target.value })
                      }
                      placeholder="PM Name"
                      className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                    />
                    <button
                      onClick={() => {
                        const input = document.createElement("input");
                        input.type = "file";
                        input.accept = "image/*";
                        input.onchange = (e) => {
                          const file = (e.target as HTMLInputElement)
                            .files?.[0];
                          if (file) handlePhotoSelect(file, "pm");
                        };
                        input.click();
                      }}
                      className="bg-blue-600 text-white px-2 py-1 rounded text-xs hover:bg-blue-700 transition-colors"
                    >
                      Replace PM Photo
                    </button>
                    {newPmPhoto && (
                      <span className="text-xs text-green-600">
                        New photo selected
                      </span>
                    )}
                  </div>
                </div>

                {/* CM Photo */}
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-700">
                      Chief Minister Photo:
                    </span>
                    {getCmPhotoUrl() && (
                      <img
                        src={getCmPhotoUrl()!}
                        alt="CM"
                        className="w-12 h-12 object-cover rounded border"
                      />
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={editForm.cmName}
                      onChange={(e) =>
                        setEditForm({ ...editForm, cmName: e.target.value })
                      }
                      placeholder="CM Name"
                      className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                    />
                    <button
                      onClick={() => {
                        const input = document.createElement("input");
                        input.type = "file";
                        input.accept = "image/*";
                        input.onchange = (e) => {
                          const file = (e.target as HTMLInputElement)
                            .files?.[0];
                          if (file) handlePhotoSelect(file, "cm");
                        };
                        input.click();
                      }}
                      className="bg-green-600 text-white px-2 py-1 rounded text-xs hover:bg-green-700 transition-colors"
                    >
                      Replace CM Photo
                    </button>
                    {newCmPhoto && (
                      <span className="text-xs text-green-600">
                        New photo selected
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* MLA Name */}
            <div className="flex items-center space-x-2 text-base text-gray-600">
              <UserCheck className="h-5 w-5" />
              {isEditing ? (
                <div className="flex-1 space-y-2">
                  <input
                    type="text"
                    value={editForm.mlaName}
                    onChange={(e) =>
                      setEditForm({ ...editForm, mlaName: e.target.value })
                    }
                    placeholder="MLA Name"
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                  />
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => {
                        const input = document.createElement("input");
                        input.type = "file";
                        input.accept = "image/*";
                        input.onchange = (e) => {
                          const file = (e.target as HTMLInputElement)
                            .files?.[0];
                          if (file) handlePhotoSelect(file, "mla");
                        };
                        input.click();
                      }}
                      className="bg-blue-600 text-white px-2 py-1 rounded text-xs hover:bg-blue-700 transition-colors"
                    >
                      Replace MLA Photo
                    </button>
                    {newMlaPhoto && (
                      <span className="text-xs text-green-600">
                        New photo selected
                      </span>
                    )}
                  </div>
                </div>
              ) : (
                <span>MLA: {report.mlaName || "Not specified"}</span>
              )}
            </div>

            {/* Notes */}
            <div className="flex items-start space-x-2 text-base text-gray-600">
              <MessageSquare className="h-5 w-5 mt-0.5 shrink-0" />
              {isEditing ? (
                <textarea
                  value={editForm.notes}
                  onChange={(e) =>
                    setEditForm({ ...editForm, notes: e.target.value })
                  }
                  placeholder="Notes/Comments"
                  className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm resize-none"
                  rows={3}
                />
              ) : (
                <span className="break-words">
                  {report.notes || "No notes"}
                </span>
              )}
            </div>

            {/* Resolution Details for Resolved Reports */}
            {report.status.toLowerCase() === "resolved" && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 space-y-2">
                <h4 className="text-sm font-semibold text-green-800">
                  Resolution Details
                </h4>

                {isEditing ? (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={editForm.reporterName}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          reporterName: e.target.value,
                        })
                      }
                      placeholder="Reporter Name"
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                    />
                    <textarea
                      value={editForm.completionNotes}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          completionNotes: e.target.value,
                        })
                      }
                      placeholder="Completion Notes"
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm resize-none"
                      rows={2}
                    />
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {
                          const input = document.createElement("input");
                          input.type = "file";
                          input.accept = "image/*";
                          input.onchange = (e) => {
                            const file = (e.target as HTMLInputElement)
                              .files?.[0];
                            if (file) handlePhotoSelect(file, "proof");
                          };
                          input.click();
                        }}
                        className="bg-green-600 text-white px-2 py-1 rounded text-xs hover:bg-green-700 transition-colors"
                      >
                        Replace Proof Photo
                      </button>
                      {newProofPhoto && (
                        <span className="text-xs text-green-600">
                          New proof photo selected
                        </span>
                      )}
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center space-x-2 text-sm text-green-700">
                      <UserCheck className="h-4 w-4" />
                      <span>Resolved by: {report.reporterName}</span>
                    </div>
                    {report.completionNotes && (
                      <div className="flex items-start space-x-2 text-sm text-green-700">
                        <MessageSquare className="h-4 w-4 mt-0.5 shrink-0" />
                        <span>{report.completionNotes}</span>
                      </div>
                    )}
                    {/* Resolution Photo Thumbnail */}
                    {proofImageUrl && (
                      <div className="mt-3">
                        <p className="text-sm font-medium text-green-800 mb-2">
                          Resolution Photo:
                        </p>
                        <button
                          onClick={() => setShowProofModal(true)}
                          className="block hover:opacity-80 transition-opacity"
                        >
                          <img
                            src={proofImageUrl}
                            alt="Resolution proof"
                            className="w-20 h-20 object-cover rounded-lg border-2 border-green-300 cursor-pointer hover:border-green-400 transition-colors"
                          />
                        </button>
                        <p className="text-xs text-green-600 mt-1">
                          Click to view full size
                        </p>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>

          {/* Admin Actions - Uniform styling with single color and uniform icon sizes */}
          <div className="pt-2 border-t border-gray-100">
            {isEditing ? (
              <div className="flex space-x-2">
                <button
                  onClick={handleSave}
                  disabled={isUploading}
                  className="flex-1 bg-blue-600 text-white py-2.5 px-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium flex items-center justify-center space-x-1.5 shadow-sm min-h-[42px]"
                >
                  <Save className="h-4 w-4" />
                  <span>{isUploading ? "Saving..." : "Save Changes"}</span>
                </button>
                <button
                  onClick={handleCancel}
                  className="flex-1 bg-blue-600 text-white py-2.5 px-3 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium shadow-sm min-h-[42px]"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex space-x-2">
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex-1 bg-blue-600 text-white py-2.5 px-3 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex items-center justify-center space-x-1.5 shadow-sm min-h-[42px]"
                  >
                    <Edit className="h-4 w-4" />
                    <span>Edit Report</span>
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    disabled={isDeleting}
                    className="flex-1 bg-blue-600 text-white py-2.5 px-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium flex items-center justify-center space-x-1.5 shadow-sm min-h-[42px]"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span>{isDeleting ? "Deleting..." : "Delete Report"}</span>
                  </button>
                </div>

                {/* Certificate Actions - Uniform styling with uniform icon sizes */}
                <div className="space-y-2">
                  <div className="flex space-x-2">
                    <CertificateGenerator report={report} imageUrl={imageUrl} />
                  </div>

                  {/* Additional Actions with uniform icon sizes */}
                  <div className="flex space-x-2">
                    <button
                      onClick={handleDownloadComplaint}
                      className="flex-1 bg-blue-600 text-white py-2.5 px-3 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex items-center justify-center space-x-1.5 shadow-sm min-h-[42px]"
                    >
                      <Download className="h-4 w-4" />
                      <span>Printable Complaint</span>
                    </button>
                    <button
                      onClick={handleEmailAuthorities}
                      className="flex-1 bg-blue-600 text-white py-2.5 px-3 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex items-center justify-center space-x-1.5 shadow-sm min-h-[42px]"
                    >
                      <Mail className="h-4 w-4" />
                      <span>Email to Authorities</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Full Photo Modal */}
      {showFullPhotoModal && imageUrl && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[1000] p-4">
          <div className="relative max-w-6xl max-h-full w-full">
            <button
              onClick={() => setShowFullPhotoModal(false)}
              className="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors z-10"
            >
              <X className="h-8 w-8" />
            </button>
            <div className="relative bg-white rounded-lg overflow-hidden shadow-2xl">
              <img
                src={imageUrl}
                alt="Full size report photo"
                className="w-full h-auto max-h-[80vh] object-contain"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent text-white p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-lg">{report.issueType}</p>
                    <p className="text-sm opacity-90">Report ID: {report.id}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm opacity-90">
                      {formatDate(report.timestamp)}
                    </p>
                    <span
                      className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                        report.status.toLowerCase() === "resolved"
                          ? "bg-green-500"
                          : "bg-blue-500"
                      }`}
                    >
                      {getStatusDisplayText(report.status)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="bg-red-100 p-2 rounded-full">
                <Trash2 className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">
                Delete Report
              </h3>
            </div>

            <div className="mb-6">
              <p className="text-gray-600 mb-4">
                Are you sure you want to permanently delete this report? This
                action cannot be undone.
              </p>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <div className="flex items-start space-x-2">
                  <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 shrink-0" />
                  <div className="text-sm text-yellow-800">
                    <p className="font-medium">Report Details:</p>
                    <p>ID: {report.id}</p>
                    <p>Type: {report.issueType}</p>
                    <p>Status: {report.status}</p>
                    {report.username && <p>Reporter: {report.username}</p>}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center space-x-2"
              >
                <Trash2 className="h-4 w-4" />
                <span>{isDeleting ? "Deleting..." : "Delete Report"}</span>
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
                className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 disabled:opacity-50 transition-colors font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Proof Photo Modal */}
      {showProofModal && proofImageUrl && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="relative max-w-4xl max-h-full">
            <button
              onClick={() => setShowProofModal(false)}
              className="absolute -top-10 right-0 text-white hover:text-gray-300 transition-colors"
            >
              <X className="h-8 w-8" />
            </button>
            <img
              src={proofImageUrl}
              alt="Resolution proof - full size"
              className="max-w-full max-h-full object-contain rounded-lg"
            />
            <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-4 rounded-b-lg">
              <p className="text-center font-medium">Resolution Photo</p>
              {report.reporterName && (
                <p className="text-center text-sm opacity-90">
                  Resolved by: {report.reporterName}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
