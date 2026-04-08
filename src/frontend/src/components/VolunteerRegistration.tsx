import { Switch } from "@/components/ui/switch";
import { useInternetIdentity } from "@caffeineai/core-infrastructure";
import { useNavigate } from "@tanstack/react-router";
import {
  AlertTriangle,
  CheckCircle,
  Eye,
  EyeOff,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Shield,
  Upload,
  User,
  UserCheck,
} from "lucide-react";
import type React from "react";
import { useState } from "react";
import { useFileUpload } from "../blob-storage/FileStorage";
import {
  useApplyVolunteer,
  useGetMyVolunteerProfile,
  useSaveUserProfile,
} from "../hooks/useQueries";

interface VolunteerApplication {
  name: string;
  address: string;
  photo: File | null;
  mobile: string;
  email: string;
  showFullMobile: boolean;
}

export function VolunteerRegistration() {
  const navigate = useNavigate();
  const { identity, login, loginStatus } = useInternetIdentity();
  const { uploadFile, isUploading } = useFileUpload();
  const { mutate: applyVolunteer, isPending: isSubmittingApplication } =
    useApplyVolunteer();
  const { mutate: saveUserProfile } = useSaveUserProfile();
  const { data: existingVolunteerProfile } = useGetMyVolunteerProfile();

  const [application, setApplication] = useState<VolunteerApplication>({
    name: "",
    address: "",
    photo: null,
    mobile: "",
    email: "",
    showFullMobile: true, // Default to showing full mobile number
  });

  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const handlePhotoSelect = (file: File) => {
    setApplication((prev) => ({ ...prev, photo: file }));
    const url = URL.createObjectURL(file);
    setPhotoPreview(url);
    setErrors((prev) => ({ ...prev, photo: "" }));
  };

  const handlePhotoInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        setErrors((prev) => ({
          ...prev,
          photo: "Please select a valid image file",
        }));
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setErrors((prev) => ({
          ...prev,
          photo: "Image size must be less than 5MB",
        }));
        return;
      }

      handlePhotoSelect(file);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!application.name.trim()) {
      newErrors.name = "Full name is required";
    } else if (application.name.trim().length < 2) {
      newErrors.name = "Name must be at least 2 characters long";
    }

    if (!application.address.trim()) {
      newErrors.address = "Complete address is required";
    } else if (application.address.trim().length < 10) {
      newErrors.address = "Please provide a complete address";
    }

    if (!application.photo) {
      newErrors.photo = "Profile photo is required";
    }

    if (!application.mobile.trim()) {
      newErrors.mobile = "Mobile number is required";
    } else if (!/^[6-9]\d{9}$/.test(application.mobile.trim())) {
      newErrors.mobile = "Please enter a valid 10-digit Indian mobile number";
    }

    if (!application.email.trim()) {
      newErrors.email = "Email address is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(application.email.trim())) {
      newErrors.email = "Please enter a valid email address";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!identity) {
      alert(
        "Please sign in with Internet Identity to submit your volunteer application.",
      );
      return;
    }

    if (!validateForm()) {
      return;
    }

    try {
      // Upload profile photo to blob storage for real data persistence
      const timestamp = Date.now();
      const photoFileName = `volunteer-${timestamp}-${application.photo!.name}`;
      const photoPath = `volunteers/photos/${photoFileName}`;

      await uploadFile(photoPath, application.photo!);

      // Save user profile with volunteer information
      await saveUserProfile({ name: application.name.trim() });

      // Create contact info string with all details
      const contactInfo = JSON.stringify({
        email: application.email.trim(),
        mobile: application.mobile.trim(),
      });

      // Submit volunteer application using the dedicated backend volunteer system
      applyVolunteer(
        {
          name: application.name.trim(),
          photoPath,
          contactInfo,
          address: application.address.trim(),
          showFullMobile: application.showFullMobile,
        },
        {
          onSuccess: () => {
            setSubmitSuccess(true);

            // Reset form
            setApplication({
              name: "",
              address: "",
              photo: null,
              mobile: "",
              email: "",
              showFullMobile: true,
            });
            setPhotoPreview(null);

            // Redirect to volunteer dashboard after success
            setTimeout(() => {
              navigate({ to: "/volunteer/dashboard" });
            }, 3000);
          },
          onError: (error) => {
            console.error("Error submitting volunteer application:", error);
            alert("Failed to submit application. Please try again.");
          },
        },
      );
    } catch (error) {
      console.error("Error uploading photo:", error);
      alert("Failed to upload photo. Please try again.");
    }
  };

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

  // Show success message
  if (submitSuccess) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Application Submitted Successfully!
          </h2>
          <p className="text-gray-600 mb-6">
            Thank you for applying to become a verified volunteer. Your
            application with full details (photo, contact info, address) has
            been submitted and is now under review by our admin team.
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-blue-900 mb-2">
              What happens next?
            </h3>
            <ul className="text-sm text-blue-800 text-left space-y-1">
              <li>
                • Admin team will review your complete application with all
                details
              </li>
              <li>
                • Your photo, contact info, and address are securely stored
              </li>
              <li>• You'll receive approval/rejection notification</li>
              <li>• If approved, you'll get verified volunteer status</li>
              <li>
                • Your profile will appear in the public volunteer directory
              </li>
              <li>• Your name will be auto-filled in report forms</li>
              <li>
                • You'll receive a volunteer badge on reports and certificates
              </li>
            </ul>
          </div>
          <p className="text-sm text-gray-500">
            Redirecting to volunteer dashboard in a few seconds...
          </p>
        </div>
      </div>
    );
  }

  // Show already applied message
  if (identity && existingVolunteerProfile) {
    const isApproved = existingVolunteerProfile.approved;
    const _isPending = !isApproved;

    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <UserCheck
            className={`h-16 w-16 mx-auto mb-4 ${isApproved ? "text-green-500" : "text-yellow-500"}`}
          />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            {isApproved
              ? "You're Already a Verified Volunteer!"
              : "Application Under Review"}
          </h2>
          <p className="text-gray-600 mb-6">
            {isApproved
              ? "You are already approved as a verified volunteer. You can access your volunteer dashboard to manage your profile and view your contributions."
              : "Your volunteer application is currently being reviewed by our admin team. You can check your status in the volunteer dashboard."}
          </p>
          <button
            onClick={() => navigate({ to: "/volunteer/dashboard" })}
            className={`px-6 py-3 rounded-lg transition-colors font-medium text-white ${
              isApproved
                ? "bg-green-600 hover:bg-green-700"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            Go to Volunteer Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Show login prompt
  if (!identity) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="text-center">
            <UserCheck className="h-16 w-16 text-blue-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Become a Verified Volunteer
            </h2>
            <p className="text-gray-600 mb-6">
              Join our verified volunteer program to gain credibility and
              recognition for your civic contributions. You need to sign in with
              Internet Identity to submit your application with full details.
            </p>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-green-900 mb-2">
                Volunteer Benefits
              </h3>
              <ul className="text-sm text-green-800 text-left space-y-1">
                <li>
                  • Verified volunteer badge on all your reports and
                  certificates
                </li>
                <li>• Auto-filled name in report submission forms</li>
                <li>• Recognition for your community contributions</li>
                <li>• Priority status when updating report statuses</li>
                <li>
                  • Public directory listing with your contact information
                </li>
                <li>• Enhanced credibility for your civic engagement</li>
                <li>
                  • Secure storage of your profile photo and contact details
                </li>
              </ul>
            </div>

            <button
              onClick={handleLogin}
              disabled={loginStatus === "logging-in"}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {loginStatus === "logging-in" ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin inline mr-2" />
                  Signing in...
                </>
              ) : (
                "Sign in with Internet Identity"
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-8">
        <div className="text-center mb-8">
          <UserCheck className="h-12 w-12 text-blue-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Volunteer Application
          </h2>
          <p className="text-gray-600">
            Fill out the form below to apply for verified volunteer status. All
            fields are required and will be stored securely.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Full Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <User className="h-4 w-4 inline mr-2" />
              Full Name *
            </label>
            <input
              type="text"
              value={application.name}
              onChange={(e) => {
                setApplication((prev) => ({ ...prev, name: e.target.value }));
                setErrors((prev) => ({ ...prev, name: "" }));
              }}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.name ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="Enter your full name"
              disabled={isSubmittingApplication || isUploading}
            />
            {errors.name && (
              <p className="text-red-500 text-sm mt-1">{errors.name}</p>
            )}
          </div>

          {/* Complete Address */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <MapPin className="h-4 w-4 inline mr-2" />
              Complete Address *
            </label>
            <textarea
              value={application.address}
              onChange={(e) => {
                setApplication((prev) => ({
                  ...prev,
                  address: e.target.value,
                }));
                setErrors((prev) => ({ ...prev, address: "" }));
              }}
              rows={3}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.address ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="Enter your complete address including city, state, and pincode"
              disabled={isSubmittingApplication || isUploading}
            />
            {errors.address && (
              <p className="text-red-500 text-sm mt-1">{errors.address}</p>
            )}
          </div>

          {/* Profile Photo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Profile Photo *
            </label>

            {photoPreview ? (
              <div className="flex items-center space-x-4">
                <img
                  src={photoPreview}
                  alt="Profile Preview"
                  className="w-24 h-24 object-cover rounded-lg border-2 border-gray-200"
                />
                <div className="flex-1">
                  <p className="text-sm text-gray-600 mb-2">
                    Photo selected successfully
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setApplication((prev) => ({ ...prev, photo: null }));
                      setPhotoPreview(null);
                    }}
                    className="text-red-600 hover:text-red-700 text-sm font-medium"
                    disabled={isSubmittingApplication || isUploading}
                  >
                    Remove Photo
                  </button>
                </div>
              </div>
            ) : (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600 mb-2">
                  Upload your profile photo
                </p>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoInputChange}
                  className="hidden"
                  id="photo-upload"
                  disabled={isSubmittingApplication || isUploading}
                />
                <label
                  htmlFor="photo-upload"
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 cursor-pointer inline-block transition-colors"
                >
                  Choose Photo
                </label>
                <p className="text-xs text-gray-500 mt-2">
                  Supported formats: JPG, PNG, GIF (Max 5MB)
                </p>
              </div>
            )}
            {errors.photo && (
              <p className="text-red-500 text-sm mt-1">{errors.photo}</p>
            )}
          </div>

          {/* Mobile Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Phone className="h-4 w-4 inline mr-2" />
              Mobile Number *
            </label>
            <input
              type="tel"
              value={application.mobile}
              onChange={(e) => {
                // Only allow digits and limit to 10 characters
                const value = e.target.value.replace(/\D/g, "").slice(0, 10);
                setApplication((prev) => ({ ...prev, mobile: value }));
                setErrors((prev) => ({ ...prev, mobile: "" }));
              }}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.mobile ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="Enter 10-digit mobile number"
              disabled={isSubmittingApplication || isUploading}
            />
            {errors.mobile && (
              <p className="text-red-500 text-sm mt-1">{errors.mobile}</p>
            )}
          </div>

          {/* Email Address */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Mail className="h-4 w-4 inline mr-2" />
              Email Address *
            </label>
            <input
              type="email"
              value={application.email}
              onChange={(e) => {
                setApplication((prev) => ({ ...prev, email: e.target.value }));
                setErrors((prev) => ({ ...prev, email: "" }));
              }}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.email ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="Enter your email address"
              disabled={isSubmittingApplication || isUploading}
            />
            {errors.email && (
              <p className="text-red-500 text-sm mt-1">{errors.email}</p>
            )}
          </div>

          {/* Privacy Settings */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <Shield className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="font-semibold text-blue-800 text-sm mb-3">
                  Privacy Settings
                </h3>
                <div className="bg-white rounded-lg p-4 border border-blue-200">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 pr-4">
                      <p className="text-blue-800 text-sm font-medium mb-1">
                        Show full mobile number in public directory
                      </p>
                      <p className="text-blue-600 text-xs leading-relaxed">
                        {application.showFullMobile
                          ? "Your full mobile number will be visible to all users in the volunteer directory"
                          : "Only the first 4 digits of your mobile number will be shown (e.g., 9876XXXXXX)"}
                      </p>
                    </div>
                    <div className="ml-4 flex flex-col items-center space-y-2">
                      <Switch
                        checked={application.showFullMobile}
                        onCheckedChange={(checked) =>
                          setApplication((prev) => ({
                            ...prev,
                            showFullMobile: checked,
                          }))
                        }
                        disabled={isSubmittingApplication || isUploading}
                        className="volunteer-privacy-toggle"
                      />
                      <span
                        className={`text-xs font-semibold px-2 py-1 rounded-full transition-all duration-200 ${
                          application.showFullMobile
                            ? "bg-green-100 text-green-700 border border-green-300"
                            : "bg-gray-100 text-gray-600 border border-gray-300"
                        }`}
                      >
                        {application.showFullMobile ? "Visible" : "Hidden"}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="mt-3 p-3 bg-blue-100 rounded-lg">
                  <p className="text-xs text-blue-700 leading-relaxed">
                    <strong>Note:</strong> You can change this setting anytime
                    after registration via your volunteer dashboard. This helps
                    you control your privacy while still being accessible to
                    citizens who need volunteer assistance.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmittingApplication || isUploading}
            className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {isSubmittingApplication || isUploading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin inline mr-2" />
                {isUploading
                  ? "Uploading Photo..."
                  : "Submitting Application..."}
              </>
            ) : (
              "Submit Volunteer Application"
            )}
          </button>

          {/* Disclaimer */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start space-x-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-yellow-800">
                <p className="font-semibold mb-1">Important Information:</p>
                <ul className="space-y-1">
                  <li>
                    • All information provided must be accurate and truthful
                  </li>
                  <li>
                    • Your photo, contact info, and address will be securely
                    stored
                  </li>
                  <li>• Your application will be reviewed by our admin team</li>
                  <li>
                    • Approval is not guaranteed and is at admin discretion
                  </li>
                  <li>
                    • Verified volunteers must maintain high standards of
                    conduct
                  </li>
                  <li>
                    • Your contact information may be displayed in the public
                    directory based on your privacy settings
                  </li>
                  <li>
                    • All data is stored on the secure Internet Computer
                    blockchain
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
