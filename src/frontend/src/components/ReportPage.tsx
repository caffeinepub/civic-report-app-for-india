import { Link, useParams, useSearch } from "@tanstack/react-router";
import { ArrowLeft, CheckCircle, Home, Loader2, X } from "lucide-react";
import React, { useState, useEffect } from "react";
import { useLanguage } from "../contexts/LanguageContext";
import { useGetReport } from "../hooks/useQueries";
import { ReportCard } from "./ReportCard";

export function ReportPage() {
  const { t: _t } = useLanguage();
  const { reportId } = useParams({ from: "/report/$reportId" });
  const search = useSearch({ from: "/report/$reportId" }) as {
    submitted?: string;
  };
  const { data: report, isLoading, error } = useGetReport(reportId || "");
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  // Show success message if redirected from form submission
  useEffect(() => {
    if (search.submitted === "true") {
      setShowSuccessMessage(true);
      // Scroll to top to ensure message is visible
      window.scrollTo({ top: 0, behavior: "smooth" });

      // Store success state in sessionStorage to persist across refreshes
      sessionStorage.setItem(
        "reportSubmissionSuccess",
        JSON.stringify({
          reportId: reportId,
          timestamp: Date.now(),
        }),
      );
    }
  }, [search.submitted, reportId]);

  // Check for persisted success message on component mount
  useEffect(() => {
    const storedSuccess = sessionStorage.getItem("reportSubmissionSuccess");
    if (storedSuccess) {
      try {
        const successData = JSON.parse(storedSuccess);
        // Show success message if it's for this report and less than 5 minutes old
        if (
          successData.reportId === reportId &&
          Date.now() - successData.timestamp < 5 * 60 * 1000
        ) {
          setShowSuccessMessage(true);
        } else if (
          successData.reportId !== reportId ||
          Date.now() - successData.timestamp >= 5 * 60 * 1000
        ) {
          // Clean up old or different report success data
          sessionStorage.removeItem("reportSubmissionSuccess");
        }
      } catch (_error) {
        // Clean up invalid data
        sessionStorage.removeItem("reportSubmissionSuccess");
      }
    }
  }, [reportId]);

  // Handle success message dismissal
  const handleDismissSuccess = () => {
    setShowSuccessMessage(false);
    sessionStorage.removeItem("reportSubmissionSuccess");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-16 w-16 animate-spin text-orange-500 mx-auto mb-4" />
          <p className="text-gray-600 text-lg">Loading report...</p>
        </div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="text-7xl mb-4">❌</div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Report Not Found
          </h1>
          <p className="text-gray-600 mb-6 text-lg">
            The report you're looking for doesn't exist or may have been
            removed.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/"
              className="inline-flex items-center justify-center space-x-2 bg-orange-500 text-white py-3 px-6 rounded-lg hover:bg-orange-600 transition-colors text-lg font-medium"
            >
              <Home className="h-5 w-5" />
              <span>Back to Home</span>
            </Link>
            <Link
              to="/dashboard"
              className="inline-flex items-center justify-center space-x-2 bg-blue-500 text-white py-3 px-6 rounded-lg hover:bg-blue-600 transition-colors text-lg font-medium"
            >
              <ArrowLeft className="h-5 w-5" />
              <span>View All Reports</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Success Message */}
      {showSuccessMessage && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 sm:p-6 shadow-md sticky top-20 z-40">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <CheckCircle className="h-6 w-6 sm:h-8 sm:w-8 text-green-500 flex-shrink-0" />
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-green-800 mb-2">
                  Report Submitted Successfully!
                </h3>
                <p className="text-sm sm:text-base text-green-700 mb-2">
                  Your civic report has been saved and is now ready for sharing
                  and certificate generation.
                </p>
                <p className="text-sm sm:text-base text-green-700">
                  <strong>Report ID:</strong>{" "}
                  <span className="font-mono bg-green-100 px-2 py-1 rounded text-xs sm:text-sm">
                    {reportId}
                  </span>
                </p>
                <p className="text-xs sm:text-sm text-green-600 mt-2">
                  You can now generate your certificate by clicking the
                  "Certificate" button below, or share your report on social
                  media.
                </p>
                <p className="text-xs text-green-500 mt-2">
                  This message will remain visible until you navigate away or
                  dismiss it.
                </p>
              </div>
            </div>
            <button
              onClick={handleDismissSuccess}
              className="text-green-500 hover:text-green-700 transition-colors ml-2 sm:ml-4"
              title="Dismiss message"
            >
              <X className="h-5 w-5 sm:h-6 sm:w-6" />
            </button>
          </div>
        </div>
      )}

      {/* Page Header - Mobile Responsive */}
      <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
        <div className="space-y-4">
          {/* Title and Description */}
          <div className="text-center sm:text-left">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
              Report Details
            </h1>
            <p className="text-sm sm:text-base text-gray-600">
              View and manage your civic report
            </p>
          </div>

          {/* Navigation Buttons - Mobile Responsive Layout */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 sm:justify-end">
            <Link
              to="/"
              className="inline-flex items-center justify-center space-x-2 bg-gray-500 text-white py-3 px-4 sm:py-2 sm:px-4 rounded-lg hover:bg-gray-600 transition-colors font-medium text-base sm:text-sm order-2 sm:order-1"
            >
              <Home className="h-4 w-4" />
              <span>Home</span>
            </Link>
            <Link
              to="/dashboard"
              className="inline-flex items-center justify-center space-x-2 bg-blue-500 text-white py-3 px-4 sm:py-2 sm:px-4 rounded-lg hover:bg-blue-600 transition-colors font-medium text-base sm:text-sm order-1 sm:order-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>All Reports</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Report Card */}
      <div className="max-w-2xl mx-auto">
        <ReportCard report={report} />
      </div>

      {/* Additional Actions */}
      <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          What's Next?
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">
              Share Your Report
            </h4>
            <p className="text-blue-700 text-sm mb-3">
              Help raise awareness by sharing your report on social media and
              tagging relevant officials.
            </p>
            <p className="text-xs text-blue-600">
              Use the "Share" button on your report card above.
            </p>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h4 className="font-medium text-green-900 mb-2">
              Download Certificate
            </h4>
            <p className="text-green-700 text-sm mb-3">
              Generate and download your civic engagement certificate as proof
              of your contribution.
            </p>
            <p className="text-xs text-green-600">
              Use the "Certificate" button on your report card above.
            </p>
          </div>
        </div>
      </div>

      {/* Report Another Issue */}
      <div className="text-center">
        <Link
          to="/"
          className="inline-flex items-center justify-center space-x-2 bg-orange-500 text-white py-3 px-6 rounded-lg hover:bg-orange-600 transition-colors text-lg font-medium"
        >
          <span>Report Another Issue</span>
        </Link>
      </div>
    </div>
  );
}
