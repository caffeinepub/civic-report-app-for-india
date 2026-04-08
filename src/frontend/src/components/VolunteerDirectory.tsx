import { useInternetIdentity } from "@caffeineai/core-infrastructure";
import { useNavigate } from "@tanstack/react-router";
import {
  Award,
  Calendar,
  Filter,
  Mail,
  MapPin,
  Phone,
  Search,
  Star,
  User,
} from "lucide-react";
import React, { useState } from "react";
import { useFileUrl } from "../blob-storage/FileStorage";
import {
  useGetMyVolunteerProfile,
  useGetVolunteerDirectory,
  useIsAdmin,
} from "../hooks/useQueries";

export function VolunteerDirectory() {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<
    "name" | "joinDate" | "location" | "impactScore"
  >("impactScore");
  const { data: volunteers, isLoading } = useGetVolunteerDirectory();
  const { identity } = useInternetIdentity();
  const { data: myVolunteerProfile } = useGetMyVolunteerProfile();
  const { data: isAdmin } = useIsAdmin();
  const navigate = useNavigate();

  // Parse contact info from JSON string
  const parseContactInfo = (contactInfoStr: string) => {
    try {
      return JSON.parse(contactInfoStr);
    } catch {
      return { email: "Not available", mobile: "Not available" };
    }
  };

  // Format mobile number based on privacy setting and admin status
  const formatMobileNumber = (mobile: string, showFullMobile: boolean) => {
    if (isAdmin || showFullMobile) {
      return mobile;
    }

    // Show only first 4 digits followed by XXXXXX
    if (mobile && mobile.length >= 4) {
      return mobile.slice(0, 4) + "XXXXXX";
    }

    return mobile;
  };

  const filteredVolunteers =
    volunteers
      ?.filter(
        (volunteer) =>
          volunteer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          volunteer.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
          volunteer.principal
            .toString()
            .toLowerCase()
            .includes(searchTerm.toLowerCase()),
      )
      .sort((a, b) => {
        switch (sortBy) {
          case "name":
            return a.name.localeCompare(b.name);
          case "joinDate": {
            // Use approvalTimestamp for approved volunteers, fallback to applicationDate
            const aDate = a.approvalTimestamp
              ? Number(a.approvalTimestamp)
              : Number(a.applicationDate);
            const bDate = b.approvalTimestamp
              ? Number(b.approvalTimestamp)
              : Number(b.applicationDate);
            return bDate - aDate;
          }
          case "location":
            return a.address.localeCompare(b.address);
          case "impactScore":
            return Number(b.impactScore) - Number(a.impactScore);
          default:
            return 0;
        }
      }) || [];

  // Determine if user is a logged-in volunteer
  const isLoggedInVolunteer = !!identity && !!myVolunteerProfile;

  const handleApplyButtonClick = () => {
    if (isLoggedInVolunteer) {
      navigate({ to: "/volunteer/dashboard" });
    } else {
      navigate({ to: "/volunteer/register" });
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <Award className="h-12 w-12 text-blue-500 mx-auto mb-4 animate-pulse" />
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Loading Volunteer Directory...
          </h1>
          <p className="text-gray-600">
            Please wait while we fetch the verified volunteer information.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="text-center mb-6">
          <Award className="h-12 w-12 text-blue-500 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Verified Volunteer Directory
          </h1>
          <p className="text-gray-600">
            Meet our community of verified volunteers with complete profiles,
            photos, and contact information making a difference in civic
            engagement across India.
          </p>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search volunteers by name, location, or principal ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Filter className="h-5 w-5 text-gray-400" />
            <select
              value={sortBy}
              onChange={(e) =>
                setSortBy(
                  e.target.value as
                    | "name"
                    | "joinDate"
                    | "location"
                    | "impactScore",
                )
              }
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="impactScore">Sort by Impact Score</option>
              <option value="name">Sort by Name</option>
              <option value="joinDate">Sort by Join Date</option>
              <option value="location">Sort by Location</option>
            </select>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-gray-200">
          <div className="text-center">
            <h3 className="text-2xl font-bold text-blue-600">
              {volunteers?.length || 0}
            </h3>
            <p className="text-sm text-gray-600">Verified Volunteers</p>
          </div>
          <div className="text-center">
            <h3 className="text-2xl font-bold text-green-600">
              {volunteers?.length || 0}
            </h3>
            <p className="text-sm text-gray-600">Complete Profiles</p>
          </div>
          <div className="text-center">
            <h3 className="text-2xl font-bold text-purple-600">
              {volunteers?.reduce((sum, v) => sum + Number(v.impactScore), 0) ||
                0}
            </h3>
            <p className="text-sm text-gray-600">Total Impact Score</p>
          </div>
          <div className="text-center">
            <h3 className="text-2xl font-bold text-orange-600">100%</h3>
            <p className="text-sm text-gray-600">Verified Status</p>
          </div>
        </div>
      </div>

      {/* Volunteers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredVolunteers.map((volunteer) => {
          const contactInfo = parseContactInfo(volunteer.contactInfo);

          return (
            <VolunteerCard
              key={volunteer.id}
              volunteer={volunteer}
              contactInfo={contactInfo}
              isAdmin={isAdmin || false}
              formatMobileNumber={formatMobileNumber}
            />
          );
        })}
      </div>

      {/* No Results */}
      {filteredVolunteers.length === 0 && !isLoading && (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No volunteers found
          </h3>
          <p className="text-gray-600">
            {volunteers?.length === 0
              ? "No verified volunteers have been approved yet."
              : "Try adjusting your search terms or filters to find volunteers."}
          </p>
        </div>
      )}

      {/* Call to Action */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-8 text-center">
        <Award className="h-8 w-8 text-blue-500 mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-blue-900 mb-2">
          Want to become a verified volunteer?
        </h3>
        <p className="text-blue-700 mb-4">
          {isLoggedInVolunteer
            ? "Access your volunteer dashboard to manage your profile and view your contributions."
            : "Join our community of civic-minded individuals making a real difference in their communities. Submit your complete profile with photo and contact details."}
        </p>
        <button
          onClick={handleApplyButtonClick}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium inline-block"
        >
          {isLoggedInVolunteer
            ? "Go to Volunteer Dashboard"
            : "Apply to Become a Volunteer"}
        </button>
      </div>
    </div>
  );
}

// Separate component for volunteer card to handle photo loading
function VolunteerCard({
  volunteer,
  contactInfo,
  isAdmin,
  formatMobileNumber,
}: {
  volunteer: any;
  contactInfo: { email: string; mobile: string };
  isAdmin: boolean;
  formatMobileNumber: (mobile: string, showFullMobile: boolean) => string;
}) {
  const { data: photoUrl } = useFileUrl(volunteer.photoPath);

  // Use approvalTimestamp for "Volunteer since" date, fallback to applicationDate
  const volunteerSinceDate = volunteer.approvalTimestamp
    ? Number(volunteer.approvalTimestamp) / 1000000 // Convert nanoseconds to milliseconds
    : Number(volunteer.applicationDate) / 1000000;

  const impactScore = Number(volunteer.impactScore);
  const formattedMobile = formatMobileNumber(
    contactInfo.mobile,
    volunteer.showFullMobile,
  );

  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      {/* Profile Header */}
      <div className="flex items-center space-x-4 mb-4">
        <div className="relative">
          {photoUrl ? (
            <img
              src={photoUrl}
              alt={`${volunteer.name} profile`}
              className="w-16 h-16 rounded-full object-cover border-2 border-gray-200"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center">
              <User className="h-8 w-8 text-gray-400" />
            </div>
          )}
          <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-1">
            <Award className="h-3 w-3 text-white" />
          </div>
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900">
            {volunteer.name}
          </h3>
          <div className="flex items-center space-x-1 text-sm text-gray-600">
            <span className="font-mono text-xs">
              {volunteer.principal.toString().slice(0, 12)}...
            </span>
          </div>
        </div>
      </div>

      {/* Impact Score */}
      <div className="mb-4 p-3 bg-purple-50 border border-purple-200 rounded-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Star className="h-4 w-4 text-purple-600" />
            <span className="text-sm font-medium text-purple-800">
              Impact Score
            </span>
          </div>
          <span className="text-lg font-bold text-purple-900">
            {impactScore}
          </span>
        </div>
        <p className="text-xs text-purple-600 mt-1">
          Earned through report submissions and resolutions
        </p>
      </div>

      {/* Contact Information */}
      <div className="space-y-3 mb-4">
        <h4 className="text-sm font-medium text-gray-700">
          Contact Information
        </h4>
        <div className="space-y-2">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Mail className="h-4 w-4 flex-shrink-0" />
            <span className="truncate">{contactInfo.email}</span>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Phone className="h-4 w-4 flex-shrink-0" />
            <span>{formattedMobile}</span>
            {!volunteer.showFullMobile && !isAdmin && (
              <span className="text-xs text-gray-400">(Privacy Protected)</span>
            )}
          </div>
          <div className="flex items-start space-x-2 text-sm text-gray-600">
            <MapPin className="h-4 w-4 flex-shrink-0 mt-0.5" />
            <span className="line-clamp-2">{volunteer.address}</span>
          </div>
        </div>
      </div>

      {/* Join Date */}
      <div className="flex items-center space-x-2 text-xs text-gray-500 border-t border-gray-200 pt-3">
        <Calendar className="h-3 w-3" />
        <span>
          Volunteer since{" "}
          {new Date(volunteerSinceDate).toLocaleDateString("en-IN", {
            year: "numeric",
            month: "long",
          })}
        </span>
      </div>

      {/* Verified Badge */}
      <div className="mt-3">
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-50 text-green-600 border border-green-200">
          <Award className="h-3 w-3 mr-1" />
          Verified Volunteer
        </span>
      </div>
    </div>
  );
}
