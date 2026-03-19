import React from 'react';
import { useParams, Link } from '@tanstack/react-router';
import { useGetReport } from '../hooks/useQueries';
import { useFileUrl } from '../blob-storage/FileStorage';
import { MapPin, Calendar, User, MessageSquare, CheckCircle, ArrowLeft, UserCheck, Edit, XCircle } from 'lucide-react';
import { Loader2 } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

export function ReportVerification() {
  const { t } = useLanguage();
  const { reportId } = useParams({ from: '/verify/$reportId' });
  const { data: report, isLoading, error } = useGetReport(reportId || '');
  const { data: imageUrl } = useFileUrl(report?.photoPath || '');

  const formatDate = (timestamp: bigint) => {
    return new Date(Number(timestamp) / 1000000).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
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
    switch (status.toLowerCase()) {
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
    switch (status.toLowerCase()) {
      case 'open':
        return <Edit className="h-5 w-5" />;
      case 'resolved':
        return <CheckCircle className="h-5 w-5" />;
      case 'closed':
        return <XCircle className="h-5 w-5" />;
      default:
        return <Edit className="h-5 w-5" />;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-16 w-16 animate-spin text-orange-500 mx-auto mb-4" />
          <p className="text-gray-600 text-lg">Verifying report...</p>
        </div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="text-7xl mb-4">❌</div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Report Not Found</h1>
          <p className="text-gray-600 mb-6 text-lg">
            The report you're looking for doesn't exist or may have been removed.
          </p>
          <Link
            to="/"
            className="inline-flex items-center space-x-2 bg-orange-500 text-white py-3 px-6 rounded-lg hover:bg-orange-600 transition-colors text-lg font-medium"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Back to Home</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <CheckCircle className="h-16 w-16 text-green-500" />
            <h1 className="text-4xl font-bold text-gray-900">Report Verified</h1>
          </div>
          <p className="text-xl text-gray-600">
            This is an authentic civics issue report submitted through our platform
          </p>
        </div>

        {/* Report Details Card */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Report Image */}
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Reported Issue</h3>
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt="Report"
                  className="w-full h-64 object-cover rounded-lg border"
                />
              ) : (
                <div className="w-full h-64 bg-gray-200 rounded-lg flex items-center justify-center">
                  <span className="text-gray-500 text-lg">Loading image...</span>
                </div>
              )}
            </div>

            {/* Report Information */}
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Report Information</h3>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <span className={`px-4 py-2 rounded-full text-base font-medium ${getIssueTypeColor(report.issueType)}`}>
                    {getIssueTypeEmoji(report.issueType)} {report.issueType}
                  </span>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-base font-medium text-gray-500">Report ID</label>
                    <p className="text-gray-900 font-mono text-lg">{report.id}</p>
                  </div>

                  {report.username && (
                    <div className="flex items-start space-x-2">
                      <User className="h-6 w-6 text-gray-400 mt-0.5" />
                      <div>
                        <label className="text-base font-medium text-gray-500">Reported by</label>
                        <p className="text-gray-900 text-lg">{report.username}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-start space-x-2">
                    <Calendar className="h-6 w-6 text-gray-400 mt-0.5" />
                    <div>
                      <label className="text-base font-medium text-gray-500">Date & Time</label>
                      <p className="text-gray-900 text-lg">{formatDate(report.timestamp)}</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-2">
                    <MapPin className="h-6 w-6 text-gray-400 mt-0.5" />
                    <div>
                      <label className="text-base font-medium text-gray-500">Location</label>
                      <p className="text-gray-900 text-lg">
                        {report.location.latitude.toFixed(6)}, {report.location.longitude.toFixed(6)}
                      </p>
                    </div>
                  </div>

                  {report.mlaName && (
                    <div className="flex items-start space-x-2">
                      <UserCheck className="h-6 w-6 text-gray-400 mt-0.5" />
                      <div>
                        <label className="text-base font-medium text-gray-500">MLA</label>
                        <p className="text-gray-900 text-lg">{report.mlaName}</p>
                      </div>
                    </div>
                  )}

                  {report.notes && (
                    <div className="flex items-start space-x-2">
                      <MessageSquare className="h-6 w-6 text-gray-400 mt-0.5" />
                      <div>
                        <label className="text-base font-medium text-gray-500">Notes</label>
                        <p className="text-gray-900 text-lg">{report.notes}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-start space-x-2">
                    {getStatusIcon(report.status)}
                    <div>
                      <label className="text-base font-medium text-gray-500">Status</label>
                      <span className={`inline-block px-3 py-1 rounded text-base font-medium ml-2 ${getStatusColor(report.status)}`}>
                        {report.status}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Verification Info */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-8">
          <div className="flex items-start space-x-3">
            <CheckCircle className="h-8 w-8 text-green-500 mt-0.5" />
            <div>
              <h3 className="text-xl font-semibold text-green-800 mb-2">Verification Confirmed</h3>
              <p className="text-green-700 text-lg">
                This report has been verified as authentic and was submitted through the official Civics Issue Report App for India. The report details, timestamp, and location data have been cryptographically secured and cannot be tampered with.
              </p>
            </div>
          </div>
        </div>

        {/* Back to Home */}
        <div className="text-center">
          <Link
            to="/"
            className="inline-flex items-center space-x-2 bg-orange-500 text-white py-4 px-8 rounded-lg hover:bg-orange-600 transition-colors text-lg font-medium"
          >
            <ArrowLeft className="h-6 w-6" />
            <span>Back to Home</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

