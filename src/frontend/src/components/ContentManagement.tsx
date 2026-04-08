import { useInternetIdentity } from "@caffeineai/core-infrastructure";
import {
  AlertTriangle,
  CheckCircle,
  Eye,
  History,
  Image,
  Loader2,
  RotateCcw,
  Save,
  Upload,
  X,
} from "lucide-react";
import type React from "react";
import { useRef, useState } from "react";
import {
  useGetCurrentLogo,
  useGetLogoHistory,
  useUploadLogo,
} from "../hooks/useQueries";

export function ContentManagement() {
  const { identity: _identity } = useInternetIdentity();
  const {
    data: currentLogo,
    isLoading: isLoadingLogo,
    refetch: refetchLogo,
  } = useGetCurrentLogo();
  const {
    data: logoHistory,
    isLoading: isLoadingHistory,
    refetch: refetchHistory,
  } = useGetLogoHistory();
  const { mutate: uploadLogo, isPending: isUploading } = useUploadLogo();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewLogo, setPreviewLogo] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Single light gray circular placeholder
  const _placeholderLogo = (
    <div className="w-16 h-16 bg-gray-300 rounded-full flex items-center justify-center">
      <div className="w-10 h-10 bg-gray-400 rounded-full"></div>
    </div>
  );

  const validateSVGFile = (
    file: File,
  ): { isValid: boolean; error?: string } => {
    // Check file type
    if (
      !file.type.includes("svg") &&
      !file.name.toLowerCase().endsWith(".svg")
    ) {
      return { isValid: false, error: "Please select a valid SVG file." };
    }

    // Check file size (limit to 1MB)
    if (file.size > 1024 * 1024) {
      return { isValid: false, error: "File size must be less than 1MB." };
    }

    return { isValid: true };
  };

  const handleFileSelect = async (file: File) => {
    const validation = validateSVGFile(file);
    if (!validation.isValid) {
      alert(validation.error);
      return;
    }

    try {
      const fileContent = await file.text();

      // Basic SVG validation
      if (!fileContent.includes("<svg") || !fileContent.includes("</svg>")) {
        alert("Invalid SVG file format.");
        return;
      }

      // Create data URL for preview
      const dataUrl = `data:image/svg+xml;base64,${btoa(fileContent)}`;

      setSelectedFile(file);
      setPreviewLogo(dataUrl);
      setShowPreview(true);
    } catch (error) {
      console.error("Error reading file:", error);
      alert("Failed to read the selected file.");
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  };

  const handleUploadConfirm = async () => {
    if (!selectedFile || !previewLogo) return;

    try {
      const fileContent = await selectedFile.text();
      const dataUrl = `data:image/svg+xml;base64,${btoa(fileContent)}`;

      uploadLogo(dataUrl, {
        onSuccess: () => {
          setShowConfirmDialog(false);
          setSelectedFile(null);
          setPreviewLogo(null);
          setShowPreview(false);
          refetchLogo();
          refetchHistory();
          alert(
            "Logo updated successfully! The new logo will be reflected across the application and in future certificates.",
          );
        },
        onError: (error) => {
          console.error("Error uploading logo:", error);
          const errorMessage =
            error instanceof Error ? error.message : "Unknown error occurred";
          if (errorMessage.includes("Unauthorized")) {
            alert(
              "You do not have permission to upload logos. Please ensure you are logged in as an admin.",
            );
          } else {
            alert("Failed to upload logo. Please try again.");
          }
        },
      });
    } catch (error) {
      console.error("Error processing logo upload:", error);
      alert("Failed to process logo upload.");
    }
  };

  const handleCancel = () => {
    setSelectedFile(null);
    setPreviewLogo(null);
    setShowPreview(false);
    setShowConfirmDialog(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRevertLogo = (logoData: string) => {
    if (confirm("Are you sure you want to revert to this logo?")) {
      uploadLogo(logoData, {
        onSuccess: () => {
          refetchLogo();
          refetchHistory();
          alert("Logo reverted successfully!");
        },
        onError: (error) => {
          console.error("Error reverting logo:", error);
          const errorMessage =
            error instanceof Error ? error.message : "Unknown error occurred";
          if (errorMessage.includes("Unauthorized")) {
            alert(
              "You do not have permission to revert logos. Please ensure you are logged in as an admin.",
            );
          } else {
            alert("Failed to revert logo. Please try again.");
          }
        },
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center space-x-3 mb-4">
          <Image className="h-8 w-8 text-purple-600" />
          <h2 className="text-2xl font-bold text-gray-900">
            Admin Content Management
          </h2>
        </div>
        <p className="text-gray-600">
          Manage application logos and branding elements. Changes will be
          reflected immediately across the app and in certificates.
        </p>
      </div>

      {/* Current Logo Display */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center space-x-3 mb-6">
          <Eye className="h-6 w-6 text-blue-600" />
          <h3 className="text-xl font-semibold text-gray-900">Current Logo</h3>
        </div>

        {isLoadingLogo ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            <span className="ml-2 text-gray-600">Loading current logo...</span>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-8 text-center">
              <div className="space-y-4">
                <div className="flex justify-center">
                  {currentLogo && (currentLogo as string).trim() !== "" ? (
                    <img
                      src={currentLogo as string}
                      alt="Current Logo"
                      className="h-24 w-24 object-contain"
                    />
                  ) : (
                    <div className="w-24 h-24 bg-gray-300 rounded-full flex items-center justify-center">
                      <div className="w-16 h-16 bg-gray-400 rounded-full"></div>
                    </div>
                  )}
                </div>
                <p className="text-sm text-gray-600">
                  {currentLogo && (currentLogo as string).trim() !== ""
                    ? "This logo is currently used in the app header and certificates"
                    : "No logo uploaded. Using placeholder in app header and certificates."}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">
                  App Header Usage
                </h4>
                <p className="text-sm text-blue-800">
                  The logo appears in the fixed header at the top of every page,
                  providing consistent branding across the application.
                </p>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-medium text-green-900 mb-2">
                  Certificate Usage
                </h4>
                <p className="text-sm text-green-800">
                  The logo is prominently displayed at the top of all generated
                  certificates, ensuring official appearance.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Logo Upload Section */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center space-x-3 mb-6">
          <Upload className="h-6 w-6 text-green-600" />
          <h3 className="text-xl font-semibold text-gray-900">
            Upload New Logo
          </h3>
        </div>

        <div className="space-y-6">
          {/* Upload Area */}
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive
                ? "border-blue-500 bg-blue-50"
                : "border-gray-300 hover:border-gray-400"
            }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-900 mb-2">
              Upload SVG Logo
            </h4>
            <p className="text-gray-600 mb-4">
              Drag and drop your SVG file here, or click to browse
            </p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Choose SVG File
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".svg,image/svg+xml"
              onChange={handleFileInputChange}
              className="hidden"
            />
          </div>

          {/* File Requirements */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-3">
              Logo Requirements
            </h4>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>SVG format only (.svg files)</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>Maximum file size: 1MB</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>
                  Recommended dimensions: 200x200px or square aspect ratio
                </span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>
                  Clean, simple design works best for both header and
                  certificates
                </span>
              </li>
              <li className="flex items-center space-x-2">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <span>Avoid complex animations or external dependencies</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Logo History */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center space-x-3 mb-6">
          <History className="h-6 w-6 text-gray-600" />
          <h3 className="text-xl font-semibold text-gray-900">Logo History</h3>
        </div>

        {isLoadingHistory ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600"></div>
            <span className="ml-2 text-gray-600">Loading logo history...</span>
          </div>
        ) : logoHistory && logoHistory.length > 0 ? (
          <div className="space-y-4">
            {logoHistory
              .sort((a, b) => Number(b.timestamp) - Number(a.timestamp)) // Sort by newest first
              .map((entry, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <img
                      src={entry.logoData}
                      alt={`Logo from ${new Date(Number(entry.timestamp) / 1000000).toLocaleDateString()}`}
                      className="h-12 w-12 object-contain border border-gray-200 rounded"
                    />
                    <div>
                      <p className="font-medium text-gray-900">
                        {new Date(
                          Number(entry.timestamp) / 1000000,
                        ).toLocaleDateString("en-IN", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                      <p className="text-sm text-gray-600">
                        Updated by: {entry.admin.toString().slice(0, 8)}...
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRevertLogo(entry.logoData)}
                    disabled={isUploading}
                    className="bg-gray-600 text-white px-3 py-1 rounded text-sm hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isUploading ? "Reverting..." : "Revert"}
                  </button>
                </div>
              ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <History className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No Logo History
            </h3>
            <p className="text-gray-600">
              Logo changes will appear here once you start uploading new logos.
            </p>
          </div>
        )}
      </div>

      {/* Preview Modal */}
      {showPreview && previewLogo && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900">
                Logo Preview
              </h3>
              <button
                onClick={() => setShowPreview(false)}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Preview in different contexts */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Header Preview */}
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-900">Header Preview</h4>
                  <div className="bg-gray-100 p-4 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center justify-center w-12 h-12">
                        <img
                          src={previewLogo}
                          alt="Logo Preview"
                          className="h-10 w-10 object-contain"
                        />
                      </div>
                      <div>
                        <h5 className="text-lg font-bold text-gray-900">
                          Civic Reporter
                        </h5>
                        <p className="text-xs text-gray-600">
                          Building a cleaner, better India
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Certificate Preview */}
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-900">
                    Certificate Preview
                  </h4>
                  <div className="bg-white border border-gray-200 p-4 rounded-lg">
                    <div className="text-center">
                      <img
                        src={previewLogo}
                        alt="Certificate Logo Preview"
                        className="h-16 w-16 object-contain mx-auto mb-2"
                      />
                      <p className="text-sm text-gray-600">
                        WE, THE PEOPLE OF INDIA
                      </p>
                      <p className="text-lg font-bold text-gray-900">
                        Civic Issue Certificate
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* File Information */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">
                  File Information
                </h4>
                <div className="grid grid-cols-2 gap-4 text-sm text-blue-800">
                  <div>
                    <span className="font-medium">Filename:</span>{" "}
                    {selectedFile?.name}
                  </div>
                  <div>
                    <span className="font-medium">Size:</span>{" "}
                    {selectedFile ? (selectedFile.size / 1024).toFixed(1) : 0}{" "}
                    KB
                  </div>
                  <div>
                    <span className="font-medium">Type:</span> SVG Image
                  </div>
                  <div>
                    <span className="font-medium">Status:</span>
                    <span className="ml-1 text-green-600">Ready to upload</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowConfirmDialog(true)}
                  className="flex-1 bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center justify-center space-x-2"
                >
                  <Save className="h-5 w-5" />
                  <span>Use This Logo</span>
                </button>
                <button
                  onClick={handleCancel}
                  className="flex-1 bg-gray-500 text-white py-3 px-6 rounded-lg hover:bg-gray-600 transition-colors font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="bg-green-100 p-2 rounded-full">
                <Save className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">
                Confirm Logo Update
              </h3>
            </div>

            <div className="mb-6">
              <p className="text-gray-600 mb-4">
                Are you sure you want to update the application logo? This will
                immediately change the logo in:
              </p>

              <ul className="space-y-2 text-sm text-gray-700 ml-4">
                <li className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>App header across all pages</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>All future generated certificates</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>Any other branding elements</span>
                </li>
              </ul>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mt-4">
                <div className="flex items-start space-x-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 shrink-0" />
                  <div className="text-sm text-yellow-800">
                    <p className="font-medium">Note:</p>
                    <p>
                      The previous logo will be saved in the history and can be
                      restored if needed.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={handleUploadConfirm}
                disabled={isUploading}
                className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center space-x-2"
              >
                <Save className="h-4 w-4" />
                <span>{isUploading ? "Updating Logo..." : "Update Logo"}</span>
              </button>
              <button
                onClick={() => setShowConfirmDialog(false)}
                disabled={isUploading}
                className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 disabled:opacity-50 transition-colors font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Guidelines */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-4">
          Logo Design Guidelines
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-blue-900 mb-2">
              Technical Requirements
            </h4>
            <ul className="space-y-2 text-sm text-blue-800">
              <li className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>SVG format only (.svg files)</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>Maximum file size: 1MB</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>
                  Recommended dimensions: 200x200px or square aspect ratio
                </span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>
                  Clean, simple design works best for both header and
                  certificates
                </span>
              </li>
              <li className="flex items-center space-x-2">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <span>Avoid complex animations or external dependencies</span>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-blue-900 mb-2">
              Design Best Practices
            </h4>
            <ul className="space-y-2 text-sm text-blue-800">
              <li className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>High contrast for readability</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>Works well on white backgrounds</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>Recognizable at small sizes</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>Consistent with app theme</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>Professional appearance</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Security Notice */}
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-start space-x-3">
          <AlertTriangle className="h-6 w-6 text-red-600 mt-0.5 shrink-0" />
          <div>
            <h3 className="text-lg font-semibold text-red-900 mb-2">
              Security & Responsibility
            </h3>
            <div className="space-y-2 text-sm text-red-800">
              <p>• Only upload logos you have the right to use</p>
              <p>• Ensure logos are appropriate for a civic platform</p>
              <p>• SVG files are validated for basic format compliance</p>
              <p>• Logo changes are logged and can be audited</p>
              <p>• Test logos thoroughly before confirming changes</p>
              <p>• Consider the impact on user recognition and branding</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
