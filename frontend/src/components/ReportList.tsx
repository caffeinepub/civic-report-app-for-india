import React from 'react';
import { useGetAllReports } from '../hooks/useQueries';
import { ReportCard } from './ReportCard';
import { Loader2 } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

export function ReportList() {
  const { t } = useLanguage();
  const { data: reports, isLoading, error } = useGetAllReports();

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8">
        <div className="flex items-center justify-center space-x-2">
          <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
          <span className="text-gray-600 text-lg">Loading reports...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8">
        <div className="text-center text-red-600 text-lg">
          Failed to load reports. Please try again.
        </div>
      </div>
    );
  }

  if (!reports || reports.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8">
        <div className="text-center text-gray-500">
          <div className="text-5xl mb-4">📋</div>
          <h3 className="text-xl font-medium mb-2">No reports yet</h3>
          <p className="text-lg">Be the first to submit a civic report!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-3xl font-bold text-gray-900 mb-6">All Reports</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reports.map((report) => (
          <ReportCard key={report.id} report={report} />
        ))}
      </div>
    </div>
  );
}
