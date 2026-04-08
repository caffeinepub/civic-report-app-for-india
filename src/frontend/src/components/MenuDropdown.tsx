import { useInternetIdentity } from "@caffeineai/core-infrastructure";
import { useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import {
  Award,
  BarChart3,
  BookOpen,
  Building,
  Building2,
  ChevronDown,
  Code,
  FileText,
  Lightbulb,
  LogIn,
  LogOut,
  Map as MapIcon,
  Menu,
  MessageSquare,
  Settings,
  Shield,
  TrendingUp,
  UserCheck,
  Users,
  X,
} from "lucide-react";
import React, { useState, useRef, useEffect } from "react";
import {
  useGetAllReports,
  useGetMyNgoNpoProfile,
  useGetMyVolunteerProfile,
  useGetTotalUniqueVisitors,
  useIsAdmin,
} from "../hooks/useQueries";

export function MenuDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [_showFeedbackModal, setShowFeedbackModal] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { data: reports } = useGetAllReports();
  const { data: totalUniqueVisitors, refetch: refetchVisitors } =
    useGetTotalUniqueVisitors();
  const { identity, login, clear, loginStatus } = useInternetIdentity();
  const { data: isAdmin } = useIsAdmin();
  const { data: volunteerProfile, isLoading: isLoadingVolunteerProfile } =
    useGetMyVolunteerProfile();
  const { data: ngoNpoProfile, isLoading: isLoadingNgoNpoProfile } =
    useGetMyNgoNpoProfile();
  const queryClient = useQueryClient();

  // Determine volunteer authentication state
  const isVolunteerAuthenticated = !!identity && !!volunteerProfile;
  const isApprovedVolunteer = volunteerProfile?.approved || false;

  // Determine NGO/NPO authentication state
  const isNgoNpoAuthenticated = !!identity && !!ngoNpoProfile;
  const isApprovedNgoNpo = ngoNpoProfile?.approved || false;

  // Refetch visitor count when menu opens
  useEffect(() => {
    if (isOpen) {
      refetchVisitors();
    }
  }, [isOpen, refetchVisitors]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setActiveSection(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSectionClick = (section: string) => {
    setActiveSection(activeSection === section ? null : section);
  };

  const handleVolunteerLogin = async () => {
    try {
      await login();
    } catch (error: any) {
      console.error("Volunteer login error:", error);
      if (error.message === "User is already authenticated") {
        await clear();
        setTimeout(() => login(), 300);
      }
    }
  };

  const handleVolunteerLogout = async () => {
    await clear();
    queryClient.clear();
    setIsOpen(false);
    setActiveSection(null);
  };

  const handleNgoNpoLogin = async () => {
    try {
      await login();
    } catch (error: any) {
      console.error("NGO/NPO login error:", error);
      if (error.message === "User is already authenticated") {
        await clear();
        setTimeout(() => login(), 300);
      }
    }
  };

  const handleNgoNpoLogout = async () => {
    await clear();
    queryClient.clear();
    setIsOpen(false);
    setActiveSection(null);
  };

  const handleAdminLogin = async () => {
    try {
      await login();
    } catch (error: any) {
      console.error("Admin login error:", error);
      if (error.message === "User is already authenticated") {
        await clear();
        setTimeout(() => login(), 300);
      }
    }
  };

  const handleAdminLogout = async () => {
    await clear();
    queryClient.clear();
    setIsOpen(false);
    setActiveSection(null);
  };

  const handleFeedbackClick = () => {
    setIsOpen(false);
    setActiveSection(null);
    // Trigger the footer feedback modal by dispatching a custom event
    window.dispatchEvent(new CustomEvent("openFeedbackModal"));
  };

  // Calculate real-time analytics from current backend data
  const totalReports = reports?.length || 0;
  const resolvedReports =
    reports?.filter((r) => r.status.toLowerCase() === "resolved").length || 0;
  const resolutionRate =
    totalReports > 0 ? Math.round((resolvedReports / totalReports) * 100) : 0;

  // Real-time issue type breakdown
  const issueTypes =
    reports?.reduce(
      (acc, report) => {
        const type = report.issueType;
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    ) || {};

  // Calculate real-time leaderboard data
  const contributorsByRegion =
    reports?.reduce(
      (acc, report) => {
        if (report.username) {
          const region = "India"; // Simplified for now, could be enhanced with location parsing
          if (!acc[region]) acc[region] = {};
          acc[region][report.username] =
            (acc[region][report.username] || 0) + 1;
        }
        return acc;
      },
      {} as Record<string, Record<string, number>>,
    ) || {};

  const contributorsByCategory =
    reports?.reduce(
      (acc, report) => {
        if (report.username) {
          const category = report.issueType;
          if (!acc[category]) acc[category] = {};
          acc[category][report.username] =
            (acc[category][report.username] || 0) + 1;
        }
        return acc;
      },
      {} as Record<string, Record<string, number>>,
    ) || {};

  // Get current date for version info
  const currentDate = new Date().toLocaleDateString("en-IN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Determine volunteer login button text based on state
  const getVolunteerLoginButtonText = () => {
    if (loginStatus === "logging-in" && !isVolunteerAuthenticated) {
      return "Volunteer Logging In";
    }
    return isVolunteerAuthenticated ? "Sign Out" : "Volunteer Login";
  };

  // Determine NGO/NPO login button text based on state
  const getNgoNpoLoginButtonText = () => {
    if (loginStatus === "logging-in" && !isNgoNpoAuthenticated) {
      return "NGO/NPO Logging In";
    }
    return isNgoNpoAuthenticated ? "Sign Out" : "NGO/NPO Login";
  };

  const menuSections = [
    {
      id: "dashboard",
      title: "Dashboard",
      icon: <BarChart3 className="h-4 w-4" />,
      content: (
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">
              Analytics (Live Data)
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Total Reports:</span>
                <span className="font-medium text-blue-600">
                  {totalReports}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Resolution Rate:</span>
                <span className="font-medium text-green-600">
                  {resolutionRate}%
                </span>
              </div>
              <div className="mt-3">
                <p className="font-medium mb-1">Issue Types (Current):</p>
                {Object.entries(issueTypes).length > 0 ? (
                  Object.entries(issueTypes).map(([type, count]) => (
                    <div key={type} className="flex justify-between text-xs">
                      <span>{type}:</span>
                      <span className="font-medium">{count}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-gray-500">No reports yet</p>
                )}
              </div>
            </div>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">
              Impact Metrics (Real-time)
            </h4>
            <div className="text-sm">
              <div className="flex justify-between">
                <span>Issues Resolved:</span>
                <span className="font-medium text-green-600">
                  {resolvedReports}
                </span>
              </div>
              <div className="flex justify-between mt-1">
                <span>Active Reports:</span>
                <span className="font-medium text-orange-600">
                  {totalReports - resolvedReports}
                </span>
              </div>
            </div>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">
              Leaderboard (Live)
            </h4>
            <div className="text-sm text-gray-600">
              {Object.keys(contributorsByRegion).length > 0 ||
              Object.keys(contributorsByCategory).length > 0 ? (
                <div className="space-y-2">
                  <div>
                    <p className="font-medium text-gray-700">
                      Top Contributors:
                    </p>
                    {Object.entries(contributorsByCategory)
                      .slice(0, 3)
                      .map(([category, contributors]) => {
                        const topContributor = Object.entries(
                          contributors,
                        ).sort(([, a], [, b]) => b - a)[0];
                        return topContributor ? (
                          <div key={category} className="text-xs">
                            <span className="font-medium">
                              {topContributor[0]}
                            </span>{" "}
                            - {category} ({topContributor[1]} reports)
                          </div>
                        ) : null;
                      })}
                  </div>
                </div>
              ) : (
                <p>No contributor data available yet...</p>
              )}
            </div>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">
              Dashboard Access
            </h4>
            <Link
              to="/dashboard"
              className="block w-full bg-blue-600 text-white py-2 px-3 rounded text-center hover:bg-blue-700 transition-colors text-sm font-medium"
              onClick={() => setIsOpen(false)}
            >
              <div className="flex items-center justify-center space-x-2">
                <TrendingUp className="h-4 w-4" />
                <span>View Dashboard</span>
              </div>
            </Link>
          </div>
        </div>
      ),
    },
    {
      id: "know-your-neta",
      title: "Know Your Neta",
      icon: <Building2 className="h-4 w-4" />,
      content: (
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">
              Find Your Representatives
            </h4>
            <p className="text-sm text-gray-600 mb-3">
              Discover your PM, CM, MP, MLA, and local civic body
              representatives. Use location detection or search manually by
              state, district, and constituency.
            </p>
            <Link
              to="/know-your-neta"
              className="block w-full bg-indigo-600 text-white py-2 px-3 rounded text-center hover:bg-indigo-700 transition-colors text-sm font-medium"
              onClick={() => setIsOpen(false)}
            >
              <div className="flex items-center justify-center space-x-2">
                <Building2 className="h-4 w-4" />
                <span>Open Directory</span>
              </div>
            </Link>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Features</h4>
            <div className="space-y-1 text-sm text-gray-600">
              <p>• Auto-detect your location to find representatives</p>
              <p>• Search by name, state, or constituency</p>
              <p>• Filter by state, district, and constituency</p>
              <p>• View contact information and social media</p>
              <p>• Read-only public directory for easy lookup</p>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "volunteer",
      title: "Volunteer",
      icon: <UserCheck className="h-4 w-4" />,
      content: (
        <div className="space-y-4">
          {/* Dynamic volunteer options based on authentication state */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">
              {isVolunteerAuthenticated
                ? "Volunteer Dashboard"
                : "Become a Verified Volunteer"}
            </h4>
            <p className="text-sm text-gray-600 mb-3">
              {isVolunteerAuthenticated
                ? `Welcome back, ${volunteerProfile?.name || "Volunteer"}! Access your dashboard to manage your profile and view contributions.`
                : "Join our verified volunteer program to gain credibility and recognition for your civic contributions."}
            </p>
            <div className="space-y-2">
              {isVolunteerAuthenticated ? (
                <>
                  <Link
                    to="/volunteer/dashboard"
                    className="block w-full bg-green-600 text-white py-2 px-3 rounded text-center hover:bg-green-700 transition-colors text-sm font-medium"
                    onClick={() => setIsOpen(false)}
                  >
                    <div className="flex items-center justify-center space-x-2">
                      <UserCheck className="h-4 w-4" />
                      <span>Volunteer Dashboard</span>
                    </div>
                  </Link>

                  {isApprovedVolunteer && (
                    <div className="bg-green-50 border border-green-200 rounded p-2">
                      <div className="flex items-center space-x-2">
                        <Award className="h-4 w-4 text-green-600" />
                        <span className="text-xs text-green-800 font-medium">
                          Verified Volunteer
                        </span>
                      </div>
                    </div>
                  )}

                  <button
                    onClick={handleVolunteerLogout}
                    className="block w-full bg-gray-600 text-white py-2 px-3 rounded text-center hover:bg-gray-700 transition-colors text-sm font-medium"
                  >
                    <div className="flex items-center justify-center space-x-2">
                      <LogOut className="h-4 w-4" />
                      <span>Sign Out</span>
                    </div>
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/volunteer/register"
                    className="block w-full bg-green-600 text-white py-2 px-3 rounded text-center hover:bg-green-700 transition-colors text-sm font-medium"
                    onClick={() => setIsOpen(false)}
                  >
                    <div className="flex items-center justify-center space-x-2">
                      <Award className="h-4 w-4" />
                      <span>Become a Volunteer</span>
                    </div>
                  </Link>

                  <button
                    onClick={handleVolunteerLogin}
                    disabled={
                      loginStatus === "logging-in" || isLoadingVolunteerProfile
                    }
                    className="block w-full bg-blue-600 text-white py-2 px-3 rounded text-center hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                  >
                    <div className="flex items-center justify-center space-x-2">
                      <LogIn className="h-4 w-4" />
                      <span>{getVolunteerLoginButtonText()}</span>
                    </div>
                  </button>
                </>
              )}
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-gray-900 mb-2">
              Volunteer Directory
            </h4>
            <p className="text-sm text-gray-600 mb-3">
              Browse our community of verified volunteers and their
              contributions.
            </p>
            <Link
              to="/volunteer/directory"
              className="block w-full bg-purple-600 text-white py-2 px-3 rounded text-center hover:bg-purple-700 transition-colors text-sm font-medium"
              onClick={() => setIsOpen(false)}
            >
              <div className="flex items-center justify-center space-x-2">
                <BookOpen className="h-4 w-4" />
                <span>View Directory</span>
              </div>
            </Link>
          </div>

          <div>
            <h4 className="font-semibold text-gray-900 mb-2">
              Volunteer Benefits
            </h4>
            <div className="space-y-1 text-sm text-gray-600">
              <p>• Verified volunteer badge on reports and certificates</p>
              <p>• Auto-filled name in report forms</p>
              <p>• Recognition for community contributions</p>
              <p>• Priority status updates</p>
              <p>• Public directory listing</p>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "ngo-npo",
      title: "NGO/NPO",
      icon: <Building className="h-4 w-4" />,
      content: (
        <div className="space-y-4">
          {/* Dynamic NGO/NPO options based on authentication state */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">
              {isNgoNpoAuthenticated
                ? "NGO/NPO Dashboard"
                : "Register Your Organization"}
            </h4>
            <p className="text-sm text-gray-600 mb-3">
              {isNgoNpoAuthenticated
                ? `Welcome back, ${ngoNpoProfile?.organizationName || "Organization"}! Access your dashboard to manage your profile and view impact.`
                : "Register your NGO or NPO to gain visibility and credibility for your civic work."}
            </p>
            <div className="space-y-2">
              {isNgoNpoAuthenticated ? (
                <>
                  <Link
                    to="/ngo-npo/dashboard"
                    className="block w-full bg-teal-600 text-white py-2 px-3 rounded text-center hover:bg-teal-700 transition-colors text-sm font-medium"
                    onClick={() => setIsOpen(false)}
                  >
                    <div className="flex items-center justify-center space-x-2">
                      <Building className="h-4 w-4" />
                      <span>NGO/NPO Dashboard</span>
                    </div>
                  </Link>

                  {isApprovedNgoNpo && (
                    <div className="bg-teal-50 border border-teal-200 rounded p-2">
                      <div className="flex items-center space-x-2">
                        <Award className="h-4 w-4 text-teal-600" />
                        <span className="text-xs text-teal-800 font-medium">
                          Verified Organization
                        </span>
                      </div>
                    </div>
                  )}

                  <button
                    onClick={handleNgoNpoLogout}
                    className="block w-full bg-gray-600 text-white py-2 px-3 rounded text-center hover:bg-gray-700 transition-colors text-sm font-medium"
                  >
                    <div className="flex items-center justify-center space-x-2">
                      <LogOut className="h-4 w-4" />
                      <span>Sign Out</span>
                    </div>
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/ngo-npo/register"
                    className="block w-full bg-teal-600 text-white py-2 px-3 rounded text-center hover:bg-teal-700 transition-colors text-sm font-medium"
                    onClick={() => setIsOpen(false)}
                  >
                    <div className="flex items-center justify-center space-x-2">
                      <Award className="h-4 w-4" />
                      <span>Register NGO/NPO</span>
                    </div>
                  </Link>

                  <button
                    onClick={handleNgoNpoLogin}
                    disabled={
                      loginStatus === "logging-in" || isLoadingNgoNpoProfile
                    }
                    className="block w-full bg-blue-600 text-white py-2 px-3 rounded text-center hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                  >
                    <div className="flex items-center justify-center space-x-2">
                      <LogIn className="h-4 w-4" />
                      <span>{getNgoNpoLoginButtonText()}</span>
                    </div>
                  </button>
                </>
              )}
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-gray-900 mb-2">
              NGO/NPO Directory
            </h4>
            <p className="text-sm text-gray-600 mb-3">
              Browse verified NGOs and NPOs working on civic issues.
            </p>
            <Link
              to="/ngo-npo/directory"
              className="block w-full bg-purple-600 text-white py-2 px-3 rounded text-center hover:bg-purple-700 transition-colors text-sm font-medium"
              onClick={() => setIsOpen(false)}
            >
              <div className="flex items-center justify-center space-x-2">
                <BookOpen className="h-4 w-4" />
                <span>View Directory</span>
              </div>
            </Link>
          </div>

          <div>
            <h4 className="font-semibold text-gray-900 mb-2">
              Organization Benefits
            </h4>
            <div className="space-y-1 text-sm text-gray-600">
              <p>• Verified organization badge and listing</p>
              <p>• Public directory visibility</p>
              <p>• Recognition for civic contributions</p>
              <p>• Contact information display (optional)</p>
              <p>• Mission statement showcase</p>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "roadmap",
      title: "Roadmap",
      icon: <MapIcon className="h-4 w-4" />,
      content: (
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">
              Development Progress
            </h4>
            <p className="text-sm text-gray-600 mb-3">
              View our feature roadmap and development progress. See what's
              implemented, under consideration, and planned for the future.
            </p>
            <Link
              to="/roadmap"
              className="block w-full bg-purple-600 text-white py-2 px-3 rounded text-center hover:bg-purple-700 transition-colors text-sm font-medium"
              onClick={() => setIsOpen(false)}
            >
              <div className="flex items-center justify-center space-x-2">
                <MapIcon className="h-4 w-4" />
                <span>View Roadmap</span>
              </div>
            </Link>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Current Status</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Platform Version:</span>
                <span className="font-medium text-purple-600">v3.2.0</span>
              </div>
              <div className="flex justify-between">
                <span>Last Update:</span>
                <span className="font-medium text-gray-600">{currentDate}</span>
              </div>
              <div className="flex justify-between">
                <span>Active Features:</span>
                <span className="font-medium text-green-600">18+</span>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "terms",
      title: "Terms of Service",
      icon: <FileText className="h-4 w-4" />,
      content: (
        <div className="space-y-3 text-sm">
          <div>
            <h4 className="font-semibold text-gray-900 mb-1">
              Data Privacy & Usage Policy
            </h4>
            <p className="text-gray-600">
              Your data is stored securely on the Internet Computer blockchain.
              We do not share personal information with third parties.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 mb-1">
              User Responsibilities
            </h4>
            <p className="text-gray-600">
              Users must provide accurate information and use the platform
              responsibly for legitimate civic reporting.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 mb-1">
              Liability Disclaimers
            </h4>
            <p className="text-gray-600">
              This platform is for civic awareness. We do not guarantee official
              action on reports.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 mb-1">
              Community Guidelines
            </h4>
            <p className="text-gray-600">
              Maintain respectful communication and report genuine civic issues
              only.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 mb-1">
              Volunteer & NGO/NPO Program
            </h4>
            <p className="text-gray-600">
              Verified volunteers and organizations must maintain high standards
              of conduct and provide accurate information in their applications.
            </p>
          </div>
        </div>
      ),
    },
    {
      id: "development",
      title: "Development Info",
      icon: <Code className="h-4 w-4" />,
      content: (
        <div className="space-y-3 text-sm">
          <div>
            <h4 className="font-semibold text-gray-900 mb-1">About</h4>
            <p className="text-gray-600">
              A decentralized civic reporting platform built for Indian citizens
              to report and track infrastructure issues.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 mb-1">Tech Stack</h4>
            <p className="text-gray-600">
              Built on ICP Blockchain with Caffeine AI for enhanced user
              experience and data integrity.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 mb-1">How It Works</h4>
            <p className="text-gray-600">
              Report issues with photos, get certificates, track status updates,
              and contribute to community improvement.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 mb-1">
              Version History (Live)
            </h4>
            <div className="space-y-1">
              <p className="text-gray-600">
                Last updated: <span className="font-medium">{currentDate}</span>
              </p>
              <p className="text-gray-600">
                Current version: <span className="font-medium">v3.2.0</span>
              </p>
              <p className="text-gray-600">
                Total reports processed:{" "}
                <span className="font-medium text-blue-600">
                  {totalReports}
                </span>
              </p>
              <p className="text-gray-600">
                Total unique visitors:{" "}
                <span className="font-medium text-purple-600">
                  {totalUniqueVisitors ?? 0}
                </span>
              </p>
              <p className="text-gray-600">
                Platform uptime:{" "}
                <span className="font-medium text-green-600">99.9%</span>
              </p>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "collaborate",
      title: "Collaborate/Contribute",
      icon: <Users className="h-4 w-4" />,
      content: (
        <div className="space-y-3 text-sm">
          <div>
            <h4 className="font-semibold text-gray-900 mb-1">For Developers</h4>
            <p className="text-gray-600">
              Contribute code and features to improve the platform. Contact us
              for collaboration opportunities.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 mb-1">For Citizens</h4>
            <p className="text-gray-600">
              Spread awareness about civic issues, share the platform, and
              provide suggestions for improvement.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 mb-1">Funding</h4>
            <p className="text-gray-600">
              Support platform maintenance through donations. Every contribution
              helps keep the service running and accessible to all.
            </p>
            <a
              href="https://buymeacoffee.com/prabhatchhirolya"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-700 underline"
            >
              Buy me a coffee
            </a>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 mb-1">Feedback</h4>
            <p className="text-gray-600 mb-2">
              Submit feature requests and bug reports to help us improve the
              platform for everyone.
            </p>
            <button
              onClick={handleFeedbackClick}
              className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 font-medium"
            >
              <MessageSquare className="h-4 w-4" />
              <span>Submit Feedback or Contact Us</span>
            </button>
          </div>
        </div>
      ),
    },
    {
      id: "features",
      title: "Features",
      icon: <Lightbulb className="h-4 w-4" />,
      content: (
        <div className="space-y-3 text-sm">
          <div>
            <h4 className="font-semibold text-gray-900 mb-1">What's New</h4>
            <p className="text-gray-600">
              Latest updates: NGO/NPO onboarding system with directory and
              dashboard, Know Your Neta directory for finding representatives,
              separate admin and volunteer roles with strict access control,
              optimized volunteer login flow, enhanced volunteer authentication,
              and volunteer badge system for community recognition.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 mb-1">
              Tips & Best Practices
            </h4>
            <div className="space-y-1 text-gray-600">
              <p>
                <strong>Reporting:</strong> Take clear photos, provide accurate
                location, add detailed descriptions.
              </p>
              <p>
                <strong>Sharing:</strong> Tag relevant ministers and officials
                when sharing on social media.
              </p>
              <p>
                <strong>Certificates:</strong> Use certificates as proof of
                civic engagement and community contribution.
              </p>
              <p>
                <strong>Status Updates:</strong> Anyone can update report status
                with proof photos.
              </p>
              <p>
                <strong>Volunteers:</strong> Apply for verified status to gain
                credibility and recognition.
              </p>
              <p>
                <strong>NGOs/NPOs:</strong> Register your organization for
                visibility and credibility.
              </p>
              <p>
                <strong>Know Your Neta:</strong> Use the directory to find and
                contact your representatives.
              </p>
            </div>
          </div>
        </div>
      ),
    },
    // Admin section - always visible at the bottom, shows different content based on authentication and admin status
    {
      id: "admin",
      title: identity && isAdmin ? "Admin" : "Admin Login",
      icon: <Shield className="h-4 w-4" />,
      content:
        identity && isAdmin ? (
          // Admin is logged in - show admin dashboard and logout
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Admin Access</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span>Status:</span>
                  <span className="font-medium text-green-600">Admin</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Principal:</span>
                  <span
                    className="font-mono text-xs text-gray-600 truncate max-w-32"
                    title={identity.getPrincipal().toString()}
                  >
                    {identity.getPrincipal().toString().slice(0, 8)}...
                  </span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 mb-2">
                Admin Dashboard
              </h4>
              <Link
                to="/admin"
                className="block w-full bg-red-600 text-white py-2 px-3 rounded text-center hover:bg-red-700 transition-colors text-sm font-medium"
                onClick={() => setIsOpen(false)}
              >
                Access Admin Dashboard
              </Link>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 mb-2">
                Admin Management Panel
              </h4>
              <p className="text-xs text-gray-600 mb-2">
                Manage admin access, permissions, volunteer applications, and
                NGO/NPO registrations.
              </p>
              <div className="flex items-center space-x-2 text-xs text-blue-600">
                <Settings className="h-3 w-3" />
                <span>Available in Admin Dashboard → User Management</span>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Session</h4>
              <button
                onClick={handleAdminLogout}
                className="flex items-center space-x-2 w-full bg-gray-600 text-white py-2 px-3 rounded hover:bg-gray-700 transition-colors text-sm font-medium"
              >
                <LogOut className="h-4 w-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        ) : (
          // Not admin or not logged in - show login button and logout option if authenticated
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Admin Access</h4>
              {identity ? (
                <div className="space-y-3">
                  <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                    <p className="text-xs text-yellow-800 mb-2">
                      <strong>Current Identity:</strong> Not an admin
                    </p>
                    <p
                      className="text-xs text-gray-600 font-mono truncate"
                      title={identity.getPrincipal().toString()}
                    >
                      {identity.getPrincipal().toString().slice(0, 20)}...
                    </p>
                  </div>
                  <p className="text-sm text-gray-600">
                    You are logged in but do not have admin privileges. You can
                    log out and try a different Internet Identity if needed.
                  </p>
                </div>
              ) : (
                <p className="text-sm text-gray-600 mb-3">
                  Sign in with Internet Identity to access admin features.
                </p>
              )}
            </div>

            <div className="space-y-2">
              {identity ? (
                <>
                  <button
                    onClick={handleAdminLogout}
                    className="flex items-center justify-center space-x-2 w-full bg-gray-600 text-white py-2 px-3 rounded hover:bg-gray-700 transition-colors text-sm font-medium"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Sign Out</span>
                  </button>
                  <button
                    onClick={async () => {
                      await handleAdminLogout();
                      setTimeout(() => handleAdminLogin(), 500);
                    }}
                    disabled={loginStatus === "logging-in"}
                    className="flex items-center justify-center space-x-2 w-full bg-red-600 text-white py-2 px-3 rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                  >
                    <LogIn className="h-4 w-4" />
                    <span>Try Different Identity</span>
                  </button>
                </>
              ) : (
                <button
                  onClick={handleAdminLogin}
                  disabled={loginStatus === "logging-in"}
                  className="flex items-center justify-center space-x-2 w-full bg-red-600 text-white py-2 px-3 rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                >
                  <LogIn className="h-4 w-4" />
                  <span>
                    {loginStatus === "logging-in"
                      ? "Signing in..."
                      : "Sign in with Internet Identity"}
                  </span>
                </button>
              )}
            </div>

            <div className="text-xs text-gray-500">
              <p>
                <strong>Note:</strong> Only authorized administrators can access
                admin features. Contact the platform administrator if you need
                admin access.
              </p>
            </div>
          </div>
        ),
    },
  ];

  // Listen for the custom event to open feedback modal
  useEffect(() => {
    const handleOpenFeedback = () => {
      setShowFeedbackModal(true);
    };

    window.addEventListener("openFeedbackModal", handleOpenFeedback);

    return () => {
      window.removeEventListener("openFeedbackModal", handleOpenFeedback);
    };
  }, []);

  return (
    <div className="menu-dropdown" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="menu-dropdown-trigger"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <Menu className="h-4 w-4" />
        <span className="menu-dropdown-text hidden sm:inline">Menu</span>
        <ChevronDown
          className={`menu-dropdown-icon ${isOpen ? "menu-dropdown-icon-open" : ""}`}
        />
      </button>

      {isOpen && (
        <div className="menu-dropdown-menu">
          <div className="menu-dropdown-content">
            {menuSections.map((section) => (
              <div key={section.id} className="menu-section">
                <button
                  onClick={() => handleSectionClick(section.id)}
                  className={`menu-section-header ${
                    activeSection === section.id
                      ? "menu-section-header-active"
                      : ""
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    {section.icon}
                    <span>{section.title}</span>
                  </div>
                  <ChevronDown
                    className={`h-4 w-4 transition-transform ${
                      activeSection === section.id ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {activeSection === section.id && (
                  <div className="menu-section-content">{section.content}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
