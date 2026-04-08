import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useInternetIdentity } from "@caffeineai/core-infrastructure";
import { useNavigate } from "@tanstack/react-router";
import {
  Building2,
  CheckCircle,
  Clock,
  FileText,
  Globe,
  Mail,
  MapPin,
  Phone,
  Shield,
  Star,
  TrendingUp,
  XCircle,
} from "lucide-react";
import React from "react";
import { useFileUrl } from "../blob-storage/FileStorage";
import {
  useGetMyNgoNpoProfile,
  useUpdateNgoNpoPrivacy,
} from "../hooks/useQueries";

export function NgoNpoDashboard() {
  const navigate = useNavigate();
  const { identity, login, loginStatus } = useInternetIdentity();
  const { data: ngoNpoProfile, isLoading: isLoadingProfile } =
    useGetMyNgoNpoProfile();
  const { data: logoUrl } = useFileUrl(ngoNpoProfile?.logoPath || "");
  const { mutate: updatePrivacy, isPending: isUpdatingPrivacy } =
    useUpdateNgoNpoPrivacy();

  const handleLogin = async () => {
    try {
      await login();
    } catch (error: any) {
      console.error("Login error:", error);
      if (error.message === "User is already authenticated") {
        window.location.reload();
      }
    }
  };

  const handlePrivacyToggle = (showContactInfo: boolean) => {
    if (ngoNpoProfile) {
      updatePrivacy({
        ngoNpoId: ngoNpoProfile.id,
        showContactInfo,
      });
    }
  };

  const getDaysSinceRegistration = (registrationDate: bigint) => {
    const registrationTimestamp = Number(registrationDate) / 1000000;
    const now = Date.now();
    const diffInMs = now - registrationTimestamp;
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    return diffInDays;
  };

  if (!identity) {
    return (
      <div className="max-w-md mx-auto px-4">
        <Card className="text-center">
          <CardContent className="pt-8 pb-6">
            <Building2 className="h-12 w-12 text-blue-500 mx-auto mb-4" />
            <CardTitle className="text-xl mb-3">NGO/NPO Dashboard</CardTitle>
            <p className="text-gray-600 text-sm mb-6">
              Sign in with Internet Identity to access your organization
              dashboard.
            </p>

            <Button
              onClick={handleLogin}
              disabled={loginStatus === "logging-in"}
              className="w-full mb-4"
            >
              {loginStatus === "logging-in"
                ? "Signing in..."
                : "Sign in with Internet Identity"}
            </Button>

            <p className="text-xs text-gray-500">
              Don't have an account?{" "}
              <button
                onClick={() => navigate({ to: "/ngo-npo/register" })}
                className="text-blue-600 hover:text-blue-700 underline"
              >
                Register here
              </button>
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoadingProfile) {
    return (
      <div className="max-w-md mx-auto px-4">
        <Card className="text-center">
          <CardContent className="pt-8 pb-6">
            <Clock className="h-12 w-12 text-blue-500 mx-auto mb-4 animate-spin" />
            <CardTitle className="text-xl mb-3">Loading...</CardTitle>
            <p className="text-gray-600 text-sm">
              Checking your organization status...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!ngoNpoProfile) {
    return (
      <div className="max-w-md mx-auto px-4">
        <Card className="text-center">
          <CardContent className="pt-8 pb-6">
            <Building2 className="h-12 w-12 text-blue-500 mx-auto mb-4" />
            <CardTitle className="text-xl mb-3">
              No Registration Found
            </CardTitle>
            <p className="text-gray-600 text-sm mb-6">
              You haven't registered your NGO/NPO yet. Register now to join our
              platform.
            </p>

            <Button
              onClick={() => navigate({ to: "/ngo-npo/register" })}
              className="w-full"
            >
              Register Your NGO/NPO
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const daysSinceRegistration = getDaysSinceRegistration(
    ngoNpoProfile.registrationDate,
  );
  const impactScore = Number(ngoNpoProfile.impactScore);

  return (
    <div className="max-w-4xl mx-auto px-4 space-y-4">
      {/* Profile Header */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-4">
            <div className="relative">
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt="Organization Logo"
                  className="h-24 w-24 object-cover rounded-lg border-2 border-gray-200"
                />
              ) : (
                <div className="h-24 w-24 bg-gray-200 rounded-lg flex items-center justify-center">
                  <Building2 className="h-12 w-12 text-gray-400" />
                </div>
              )}
            </div>

            <div className="flex-1 text-center sm:text-left">
              <h1 className="text-xl font-bold text-gray-900 mb-2">
                {ngoNpoProfile.organizationName}
              </h1>
              <div className="flex items-center justify-center sm:justify-start space-x-2 mb-3">
                {ngoNpoProfile.approved ? (
                  <Badge variant="default" className="text-xs">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Approved
                  </Badge>
                ) : ngoNpoProfile.rejectionNote ? (
                  <Badge variant="destructive" className="text-xs">
                    <XCircle className="h-3 w-3 mr-1" />
                    Rejected
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="text-xs">
                    <Clock className="h-3 w-3 mr-1" />
                    Pending Review
                  </Badge>
                )}
              </div>
              <div className="text-xs text-gray-500">
                <p>Principal ID</p>
                <p
                  className="font-mono truncate max-w-48"
                  title={identity.getPrincipal().toString()}
                >
                  {identity.getPrincipal().toString().slice(0, 20)}...
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Status Alerts */}
      {!ngoNpoProfile.approved && !ngoNpoProfile.rejectionNote && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="pt-4">
            <div className="flex items-start space-x-3">
              <Clock className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-yellow-800 text-sm">
                  Application Under Review
                </h3>
                <p className="text-yellow-700 text-xs mt-1">
                  Your application is being reviewed by our admin team. You'll
                  be notified once a decision is made.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {ngoNpoProfile.rejectionNote && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-4">
            <div className="flex items-start space-x-3">
              <XCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="font-semibold text-red-800 text-sm">
                  Application Rejected
                </h3>
                <p className="text-red-700 text-xs mt-1 mb-2">
                  Your application has been rejected. Please see the reason
                  below:
                </p>
                <div className="bg-white border border-red-200 rounded p-2">
                  <p className="text-red-800 text-xs font-medium">
                    {ngoNpoProfile.rejectionNote}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Statistics */}
      {ngoNpoProfile.approved && (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          <Card className="text-center">
            <CardContent className="pt-4 pb-3">
              <Star className="h-6 w-6 text-purple-500 mx-auto mb-2" />
              <div className="text-lg font-bold text-gray-900">
                {impactScore}
              </div>
              <p className="text-xs text-gray-600">Impact Score</p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardContent className="pt-4 pb-3">
              <TrendingUp className="h-6 w-6 text-blue-500 mx-auto mb-2" />
              <div className="text-lg font-bold text-gray-900">
                {daysSinceRegistration}
              </div>
              <p className="text-xs text-gray-600">Days Active</p>
            </CardContent>
          </Card>

          <Card className="text-center col-span-2 lg:col-span-1">
            <CardContent className="pt-4 pb-3">
              <CheckCircle className="h-6 w-6 text-green-500 mx-auto mb-2" />
              <div className="text-lg font-bold text-gray-900">Verified</div>
              <p className="text-xs text-gray-600">Organization</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Privacy Settings */}
      {ngoNpoProfile.approved && (
        <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <CardContent className="pt-4">
            <div className="flex items-start space-x-3">
              <Shield className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="font-semibold text-blue-800 text-sm mb-3">
                  Privacy Settings
                </h3>
                <div className="bg-white rounded-lg p-4 border border-blue-200 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 pr-4">
                      <p className="text-blue-800 text-sm font-medium mb-1">
                        Show contact information in public directory
                      </p>
                      <p className="text-blue-600 text-xs leading-relaxed">
                        {ngoNpoProfile.showContactInfo
                          ? "Your email and phone are visible to all users"
                          : "Your contact information is hidden from public view"}
                      </p>
                    </div>
                    <div className="ml-4 flex flex-col items-center space-y-2">
                      <Switch
                        checked={ngoNpoProfile.showContactInfo}
                        onCheckedChange={handlePrivacyToggle}
                        disabled={isUpdatingPrivacy}
                      />
                      <span
                        className={`text-xs font-semibold px-2 py-1 rounded-full transition-all duration-200 ${
                          ngoNpoProfile.showContactInfo
                            ? "bg-green-100 text-green-700 border border-green-300"
                            : "bg-gray-100 text-gray-600 border border-gray-300"
                        }`}
                      >
                        {ngoNpoProfile.showContactInfo ? "Public" : "Private"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Organization Information */}
      <Card>
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-100">
          <CardTitle className="text-lg font-semibold text-gray-900 flex items-center">
            <Building2 className="h-5 w-5 mr-2 text-blue-600" />
            Organization Information
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="flex items-center text-sm font-medium text-gray-700">
                  <Mail className="h-4 w-4 mr-2 text-gray-500" />
                  Email
                </label>
                <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3">
                  <p className="text-gray-900 font-medium break-all">
                    {ngoNpoProfile.email}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="flex items-center text-sm font-medium text-gray-700">
                  <Phone className="h-4 w-4 mr-2 text-gray-500" />
                  Phone
                </label>
                <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3">
                  <p className="text-gray-900 font-medium">
                    {ngoNpoProfile.phone}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="flex items-center text-sm font-medium text-gray-700">
                <MapPin className="h-4 w-4 mr-2 text-gray-500" />
                Address
              </label>
              <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3">
                <p className="text-gray-900 font-medium leading-relaxed">
                  {ngoNpoProfile.address}
                </p>
              </div>
            </div>

            {ngoNpoProfile.website && (
              <div className="space-y-2">
                <label className="flex items-center text-sm font-medium text-gray-700">
                  <Globe className="h-4 w-4 mr-2 text-gray-500" />
                  Website
                </label>
                <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3">
                  <a
                    href={ngoNpoProfile.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-700 font-medium break-all"
                  >
                    {ngoNpoProfile.website}
                  </a>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="flex items-center text-sm font-medium text-gray-700">
                <FileText className="h-4 w-4 mr-2 text-gray-500" />
                Description
              </label>
              <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3">
                <p className="text-gray-900 leading-relaxed">
                  {ngoNpoProfile.description}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="flex items-center text-sm font-medium text-gray-700">
                <FileText className="h-4 w-4 mr-2 text-gray-500" />
                Mission Statement
              </label>
              <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3">
                <p className="text-gray-900 leading-relaxed">
                  {ngoNpoProfile.missionStatement}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="flex items-center text-sm font-medium text-gray-700">
                <Building2 className="h-4 w-4 mr-2 text-gray-500" />
                Contact Person
              </label>
              <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3">
                <p className="text-gray-900 font-medium">
                  {ngoNpoProfile.contactPerson}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Registration Timeline */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Registration Timeline</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
              <Building2 className="h-3 w-3 text-white" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-gray-900 text-sm">
                Registration Submitted
              </p>
              <p className="text-xs text-gray-600">
                {new Date(
                  Number(ngoNpoProfile.registrationDate) / 1000000,
                ).toLocaleDateString("en-IN", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </p>
            </div>
          </div>

          {ngoNpoProfile.approved && (
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                <CheckCircle className="h-3 w-3 text-white" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900 text-sm">
                  Application Approved
                </p>
                <p className="text-xs text-gray-600">
                  Listed in public directory
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Directory Status */}
      {ngoNpoProfile.approved && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-4">
            <div className="flex items-start space-x-3">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="font-semibold text-green-800 text-sm">
                  Public Directory Status
                </h3>
                <p className="text-green-700 text-xs mt-1 mb-3">
                  Your organization is live in the public directory! Citizens
                  can find your information.
                </p>
                <Button
                  onClick={() => navigate({ to: "/ngo-npo/directory" })}
                  size="sm"
                  className="bg-green-600 hover:bg-green-700 text-xs"
                >
                  View Directory
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
