import React from 'react';
import { Link } from '@tanstack/react-router';
import { useGetRecentReports } from '../hooks/useQueries';
import { ReportCard } from './ReportCard';
import { Loader2, FileText } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

export function RecentReports() {
  const { t } = useLanguage();
  const { data: reports, isLoading, error } = useGetRecentReports();

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8 text-center">
        <Loader2 className="h-12 w-12 animate-spin text-blue-500 mx-auto mb-4" />
        <p className="text-gray-600">Loading recent reports...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <p className="text-red-600">Failed to load recent reports. Please try again later.</p>
      </div>
    );
  }

  if (!reports || reports.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8 text-center">
        <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">No reports submitted yet. Be the first to report a civic issue!</p>
      </div>
    );
  }

  // Handle navigation with scroll reset
  const handleViewAllClick = () => {
    // Reset scroll position to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Recent Reports</h2>
        <p className="text-sm sm:text-base text-gray-600">Latest civic issues reported by the community</p>
      </div>

      {/* Report Cards Grid - 2 columns on desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {reports.map((report, index) => (
          <ReportCard 
            key={report.id} 
            report={report} 
            priority={index < 2 ? 'high' : 'low'}
          />
        ))}
      </div>

      <div className="text-center">
        <Link
          to="/dashboard"
          onClick={handleViewAllClick}
          className="inline-flex items-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm"
        >
          <FileText className="h-5 w-5" />
          <span>View All Reports</span>
        </Link>
      </div>
    </div>
  );
}
