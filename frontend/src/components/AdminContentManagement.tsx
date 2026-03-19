import React, { useState } from 'react';
import { Settings, Upload, Image, CheckCircle, AlertTriangle, Eye, Trash2, X } from 'lucide-react';
import { useGetCurrentLogo, useUploadLogo, useGetLogoHistory } from '../hooks/useQueries';

export function AdminContentManagement() {
  const { data: currentLogo, isLoading: isLoadingLogo } = useGetCurrentLogo();
  const { data: logoHistory, isLoading: isLoadingHistory } = useGetLogoHistory();
  const { mutate: uploadLogo, isPending: isUploading } = useUploadLogo();
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (file.type !== 'image/svg+xml') {
      setErrors({ file: 'Please select a valid SVG file' });
      return;
    }

    // Validate file size (max 1MB)
    if (file.size > 1024 * 1024) {
      setErrors({ file: 'SVG file size must be less than 1MB' });
      return;
    }

    setSelectedFile(file);
    setErrors({});
    
    // Create preview URL
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    try {
      // Read file as text for SVG content
      const fileContent = await selectedFile.text();
      
      // Basic SVG validation
      if (!fileContent.includes('<svg') || !fileContent.includes('</svg>')) {
        setErrors({ file: 'Invalid SVG file format' });
        return;
      }

      if (confirm('Are you sure you want to replace the current logo? This will update the logo across the entire application.')) {
        uploadLogo(fileContent, {
          onSuccess: () => {
            setSelectedFile(null);
            setPreviewUrl(null);
            setShowPreview(false);
            alert('Logo uploaded successfully! The new logo is now active across the application.');
          },
          onError: (error) => {
            console.error('Error uploading logo:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            if (errorMessage.includes('Unauthorized')) {
              alert('You do not have permission to upload logos.');
            } else {
              alert('Failed to upload logo. Please try again.');
            }
          }
        });
      }
    } catch (error) {
      console.error('Error reading file:', error);
      setErrors({ file: 'Failed to read SVG file' });
    }
  };

  const formatDate = (timestamp: bigint) => {
    return new Date(Number(timestamp) / 1000000).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      {/* Current Logo Display */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center space-x-3 mb-6">
          <Image className="h-6 w-6 text-blue-600" />
          <h2 className="text-xl font-bold text-gray-900">Logo Management</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Current Logo */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Current Logo</h3>
            <div className="border-2 border-gray-200 rounded-lg p-4 text-center">
              {isLoadingLogo ? (
                <div className="w-24 h-24 mx-auto bg-gray-200 rounded-full animate-pulse" />
              ) : currentLogo ? (
                <div 
                  className="w-24 h-24 mx-auto"
                  dangerouslySetInnerHTML={{ __html: currentLogo }}
                />
              ) : (
                <div className="w-24 h-24 mx-auto bg-gray-200 rounded-full flex items-center justify-center">
                  <Image className="h-8 w-8 text-gray-400" />
                </div>
              )}
              <p className="text-sm text-gray-600 mt-2">
                {currentLogo ? 'Active Logo' : 'No Logo Uploaded'}
              </p>
            </div>
          </div>

          {/* Upload New Logo */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Upload New Logo</h3>
            
            {previewUrl ? (
              <div className="space-y-3">
                <div className="border-2 border-green-200 rounded-lg p-4 text-center bg-green-50">
                  <img
                    src={previewUrl}
                    alt="Logo Preview"
                    className="w-24 h-24 mx-auto object-contain"
                  />
                  <p className="text-sm text-green-700 mt-2 font-medium">New Logo Preview</p>
                </div>
                
                <div className="flex space-x-2">
                  <button
                    onClick={handleUpload}
                    disabled={isUploading}
                    className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center space-x-2"
                  >
                    <CheckCircle className="h-4 w-4" />
                    <span>{isUploading ? 'Uploading...' : 'Confirm Upload'}</span>
                  </button>
                  <button
                    onClick={() => {
                      setSelectedFile(null);
                      setPreviewUrl(null);
                      setErrors({});
                    }}
                    disabled={isUploading}
                    className="bg-gray-500 text-white py-2 px-4 rounded-lg hover:bg-gray-600 disabled:opacity-50 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600 mb-2">Upload SVG logo file</p>
                <input
                  type="file"
                  accept=".svg,image/svg+xml"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="logo-upload"
                  disabled={isUploading}
                />
                <label
                  htmlFor="logo-upload"
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 cursor-pointer inline-block transition-colors"
                >
                  Choose SVG File
                </label>
                <p className="text-xs text-gray-500 mt-2">
                  SVG format only, max 1MB
                </p>
              </div>
            )}
            
            {errors.file && (
              <p className="text-red-500 text-sm mt-2">{errors.file}</p>
            )}
          </div>
        </div>

        {/* Guidelines */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start space-x-2">
            <AlertTriangle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-800">
              <p className="font-semibold mb-1">Logo Guidelines:</p>
              <ul className="space-y-1">
                <li>• Use SVG format for best quality and scalability</li>
                <li>• Recommended dimensions: 100x100 pixels or square aspect ratio</li>
                <li>• Keep file size under 1MB for optimal loading</li>
                <li>• Logo will appear in the header and on certificates</li>
                <li>• Ensure logo works well on both light and dark backgrounds</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Logo History */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center space-x-3 mb-6">
          <Settings className="h-6 w-6 text-gray-600" />
          <h2 className="text-xl font-bold text-gray-900">Logo History</h2>
        </div>

        {isLoadingHistory ? (
          <div className="text-center py-8">
            <Settings className="h-8 w-8 text-gray-400 mx-auto mb-2 animate-spin" />
            <p className="text-gray-600">Loading logo history...</p>
          </div>
        ) : !logoHistory || logoHistory.length === 0 ? (
          <div className="text-center py-8">
            <Image className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Logo History</h3>
            <p className="text-gray-600">No logos have been uploaded yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {logoHistory.map((entry, index) => (
              <div key={index} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center space-x-4">
                  <div 
                    className="w-12 h-12 border border-gray-200 rounded flex items-center justify-center"
                    dangerouslySetInnerHTML={{ __html: entry.logoData }}
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Logo #{logoHistory.length - index}
                    </p>
                    <p className="text-xs text-gray-600">
                      Uploaded on {formatDate(entry.timestamp)}
                    </p>
                    <p className="text-xs text-gray-500 font-mono">
                      By: {entry.admin.toString().slice(0, 12)}...
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  {index === 0 && (
                    <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded-full">
                      Current
                    </span>
                  )}
                  <button
                    onClick={() => {
                      setShowPreview(true);
                      setPreviewUrl(`data:image/svg+xml;base64,${btoa(entry.logoData)}`);
                    }}
                    className="text-blue-600 hover:text-blue-700 transition-colors"
                    title="Preview Logo"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Logo Preview Modal */}
      {showPreview && previewUrl && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Logo Preview</h3>
              <button
                onClick={() => {
                  setShowPreview(false);
                  if (!selectedFile) setPreviewUrl(null);
                }}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="text-center">
              <div className="w-32 h-32 mx-auto border border-gray-200 rounded-lg flex items-center justify-center bg-gray-50">
                <img
                  src={previewUrl}
                  alt="Logo Preview"
                  className="max-w-full max-h-full object-contain"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
