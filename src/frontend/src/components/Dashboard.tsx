import { Link } from "@tanstack/react-router";
import {
  AlertCircle,
  CheckCircle,
  ChevronDown,
  FileText,
  Filter,
  Home,
  Loader2,
  Map as MapIcon,
  TrendingUp,
  X,
} from "lucide-react";
import React, { useState, useEffect } from "react";
import { useLanguage } from "../contexts/LanguageContext";
import {
  useGetInitialReports,
  useGetNextReports,
  useGetTotalReportCount,
  useGetVolunteerDirectory,
} from "../hooks/useQueries";
import { ReportCard } from "./ReportCard";

export function Dashboard() {
  const { t: _t } = useLanguage();
  const { data: initialReports, isLoading: isLoadingInitial } =
    useGetInitialReports();
  const { data: totalCount } = useGetTotalReportCount();
  const { data: volunteerDirectory } = useGetVolunteerDirectory();

  const [allReports, setAllReports] = useState<any[]>([]);
  const [currentOffset, setCurrentOffset] = useState(10);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [_hasLoadedMore, setHasLoadedMore] = useState(false);

  const [selectedIssueType, setSelectedIssueType] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedVolunteer, setSelectedVolunteer] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);

  // Initialize with initial reports - ensure they're sorted by timestamp descending (newest first)
  useEffect(() => {
    if (initialReports) {
      // Sort by timestamp descending to ensure newest reports appear first
      const sortedReports = [...initialReports].sort(
        (a, b) => Number(b.timestamp) - Number(a.timestamp),
      );
      setAllReports(sortedReports);
    }
  }, [initialReports]);

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const loadNextBatch = async () => {
    if (isLoadingMore || !totalCount || currentOffset >= Number(totalCount))
      return;

    setIsLoadingMore(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_CANISTER_URL}/getNextReports?offset=${currentOffset}&count=50`,
      );
      const nextReports = await response.json();

      if (nextReports && nextReports.length > 0) {
        // Append new reports while maintaining descending timestamp order
        setAllReports((prev) => [...prev, ...nextReports]);
        setCurrentOffset((prev) => prev + nextReports.length);
        setHasLoadedMore(true);
      }
    } catch (error) {
      console.error("Error loading more reports:", error);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const issueTypes = React.useMemo(() => {
    if (!allReports) return [];
    const types = [...new Set(allReports.map((r: any) => r.issueType))];
    return types.sort();
  }, [allReports]);

  const filteredReports = React.useMemo(() => {
    if (!allReports) return [];

    let filtered = [...allReports];

    if (selectedIssueType !== "all") {
      filtered = filtered.filter(
        (report: any) => report.issueType === selectedIssueType,
      );
    }

    if (selectedStatus !== "all") {
      filtered = filtered.filter(
        (report: any) => report.status.toLowerCase() === selectedStatus,
      );
    }

    if (selectedVolunteer !== "all") {
      filtered = filtered.filter((report: any) => {
        const volunteer = volunteerDirectory?.find(
          (v) => v.id === selectedVolunteer,
        );
        return volunteer && report.username === volunteer.name;
      });
    }

    return filtered;
  }, [
    allReports,
    selectedIssueType,
    selectedStatus,
    selectedVolunteer,
    volunteerDirectory,
  ]);

  const stats = React.useMemo(() => {
    if (!allReports)
      return { total: 0, open: 0, resolved: 0, resolutionRate: 0 };

    const total = allReports.length;
    const resolved = allReports.filter(
      (r: any) => r.status.toLowerCase() === "resolved",
    ).length;
    const open = total - resolved;
    const resolutionRate = total > 0 ? Math.round((resolved / total) * 100) : 0;

    return { total, open, resolved, resolutionRate };
  }, [allReports]);

  const clearFilters = () => {
    setSelectedIssueType("all");
    setSelectedStatus("all");
    setSelectedVolunteer("all");
  };

  const hasActiveFilters =
    selectedIssueType !== "all" ||
    selectedStatus !== "all" ||
    selectedVolunteer !== "all";

  // Handle navigation with scroll reset
  const handleNavigationClick = () => {
    // Reset scroll position to top
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (isLoadingInitial) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-16 w-16 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-600 text-lg">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 max-w-7xl py-4 sm:py-8">
        {/* Header - Consistent with Map View */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="text-center sm:text-left">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-1 sm:mb-2 leading-tight">
                Dashboard
              </h1>
              <p className="text-sm sm:text-base lg:text-lg text-gray-600 leading-relaxed">
                Comprehensive view of all civic reports (Live Data)
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <Link
                to="/map"
                onClick={handleNavigationClick}
                className="inline-flex items-center justify-center space-x-2 py-2.5 px-4 sm:py-2 sm:px-4 rounded-lg transition-colors font-medium text-sm sm:text-base min-h-[44px] sm:min-h-[40px] whitespace-nowrap bg-blue-600 text-white hover:bg-blue-700"
              >
                <MapIcon className="h-4 w-4" />
                <span>Map View</span>
              </Link>
              <Link
                to="/"
                onClick={handleNavigationClick}
                className="inline-flex items-center justify-center space-x-2 py-2.5 px-4 sm:py-2 sm:px-4 rounded-lg transition-colors font-medium text-sm sm:text-base min-h-[44px] sm:min-h-[40px] whitespace-nowrap bg-gray-500 text-white hover:bg-gray-600"
              >
                <Home className="h-4 w-4" />
                <span>Home</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Statistics Section - Compressed for Mobile */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-md p-3 sm:p-4">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <FileText className="h-6 w-6 sm:h-8 sm:w-8 text-blue-500" />
              <div>
                <p className="text-xs sm:text-sm text-gray-600">
                  Total Reports
                </p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">
                  {stats.total}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-3 sm:p-4">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <AlertCircle className="h-6 w-6 sm:h-8 sm:w-8 text-orange-500" />
              <div>
                <p className="text-xs sm:text-sm text-gray-600">Open</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">
                  {stats.open}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-3 sm:p-4">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <CheckCircle className="h-6 w-6 sm:h-8 sm:w-8 text-green-500" />
              <div>
                <p className="text-xs sm:text-sm text-gray-600">Resolved</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">
                  {stats.resolved}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-3 sm:p-4">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <TrendingUp className="h-6 w-6 sm:h-8 sm:w-8 text-purple-500" />
              <div>
                <p className="text-xs sm:text-sm text-gray-600">
                  Resolution Rate
                </p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">
                  {stats.resolutionRate}%
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="w-full flex items-center justify-between text-left"
          >
            <div className="flex items-center space-x-2">
              <Filter className="h-5 w-5 text-gray-600" />
              <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
              {hasActiveFilters && (
                <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                  Active
                </span>
              )}
            </div>
            <ChevronDown
              className={`h-5 w-5 text-gray-600 transition-transform ${showFilters ? "rotate-180" : ""}`}
            />
          </button>

          {showFilters && (
            <div className="mt-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Issue Type
                  </label>
                  <select
                    value={selectedIssueType}
                    onChange={(e) => setSelectedIssueType(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">All Types</option>
                    {issueTypes.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">All Statuses</option>
                    <option value="open">Open</option>
                    <option value="resolved">Resolved</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Volunteer
                  </label>
                  <select
                    value={selectedVolunteer}
                    onChange={(e) => setSelectedVolunteer(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">All Reports</option>
                    {volunteerDirectory?.map((volunteer) => (
                      <option key={volunteer.id} value={volunteer.id}>
                        {volunteer.name} (Verified)
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {hasActiveFilters && (
                <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                  <span className="text-sm text-gray-600">
                    Showing {filteredReports.length} of {stats.total} reports
                  </span>
                  <button
                    onClick={clearFilters}
                    className="text-sm text-red-600 hover:text-red-700 font-medium flex items-center space-x-1"
                  >
                    <X className="h-4 w-4" />
                    <span>Clear Filters</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Report Cards Grid - 2 columns on desktop */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {filteredReports.map((report, index) => (
            <ReportCard
              key={report.id}
              report={report}
              priority={index < 4 ? "high" : "low"}
            />
          ))}
        </div>

        {/* Load More Button */}
        {!hasActiveFilters &&
          totalCount &&
          currentOffset < Number(totalCount) && (
            <div className="mt-8 text-center">
              <button
                onClick={loadNextBatch}
                disabled={isLoadingMore}
                className="inline-flex items-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium shadow-sm"
              >
                {isLoadingMore ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Loading...</span>
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-5 w-5" />
                    <span>
                      Load Next 50 Reports ({currentOffset}/{Number(totalCount)}
                      )
                    </span>
                  </>
                )}
              </button>
            </div>
          )}

        {filteredReports.length === 0 && !isLoadingInitial && (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No reports found
            </h3>
            <p className="text-gray-600">
              {hasActiveFilters
                ? "Try adjusting your filters to see more reports."
                : "No reports have been submitted yet. Be the first to report a civic issue!"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
