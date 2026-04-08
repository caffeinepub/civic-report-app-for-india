import { useInternetIdentity } from "@caffeineai/core-infrastructure";
import { useNavigate } from "@tanstack/react-router";
import {
  AlertTriangle,
  Building2,
  CheckCircle,
  FileText,
  Globe,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Shield,
  Upload,
  User,
} from "lucide-react";
import type React from "react";
import { useState } from "react";
import { useFileUpload } from "../blob-storage/FileStorage";
import {
  useGetMyNgoNpoProfile,
  useRegisterNgoNpo,
  useSaveUserProfile,
} from "../hooks/useQueries";

interface NgoNpoApplication {
  organizationName: string;
  logo: File | null;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  website: string;
  description: string;
  missionStatement: string;
  showContactInfo: boolean;
}

export function NgoNpoRegistration() {
  const navigate = useNavigate();
  const { identity, login, loginStatus } = useInternetIdentity();
  const { uploadFile, isUploading } = useFileUpload();
  const { mutate: registerNgoNpo, isPending: isSubmittingApplication } =
    useRegisterNgoNpo();
  const { mutate: saveUserProfile } = useSaveUserProfile();
  const { data: existingNgoNpoProfile } = useGetMyNgoNpoProfile();

  const [application, setApplication] = useState<NgoNpoApplication>({
    organizationName: "",
    logo: null,
    contactPerson: "",
    email: "",
    phone: "",
    address: "",
    website: "",
    description: "",
    missionStatement: "",
    showContactInfo: true,
  });

  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const handleLogoSelect = (file: File) => {
    setApplication((prev) => ({ ...prev, logo: file }));
    const url = URL.createObjectURL(file);
    setLogoPreview(url);
    setErrors((prev) => ({ ...prev, logo: "" }));
  };

  const handleLogoInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        setErrors((prev) => ({
          ...prev,
          logo: "Please select a valid image file",
        }));
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        setErrors((prev) => ({
          ...prev,
          logo: "Image size must be less than 5MB",
        }));
        return;
      }

      handleLogoSelect(file);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!application.organizationName.trim()) {
      newErrors.organizationName = "Organization name is required";
    } else if (application.organizationName.trim().length < 3) {
      newErrors.organizationName =
        "Organization name must be at least 3 characters long";
    }

    if (!application.contactPerson.trim()) {
      newErrors.contactPerson = "Contact person name is required";
    }

    if (!application.logo) {
      newErrors.logo = "Organization logo is required";
    }

    if (!application.email.trim()) {
      newErrors.email = "Email address is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(application.email.trim())) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!application.phone.trim()) {
      newErrors.phone = "Phone number is required";
    } else if (!/^[6-9]\d{9}$/.test(application.phone.trim())) {
      newErrors.phone = "Please enter a valid 10-digit Indian mobile number";
    }

    if (!application.address.trim()) {
      newErrors.address = "Complete address is required";
    } else if (application.address.trim().length < 10) {
      newErrors.address = "Please provide a complete address";
    }

    if (!application.description.trim()) {
      newErrors.description = "Organization description is required";
    } else if (application.description.trim().length < 20) {
      newErrors.description = "Description must be at least 20 characters long";
    }

    if (!application.missionStatement.trim()) {
      newErrors.missionStatement = "Mission statement is required";
    } else if (application.missionStatement.trim().length < 20) {
      newErrors.missionStatement =
        "Mission statement must be at least 20 characters long";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!identity) {
      alert(
        "Please sign in with Internet Identity to submit your NGO/NPO application.",
      );
      return;
    }

    if (!validateForm()) {
      return;
    }

    try {
      const timestamp = Date.now();
      const logoFileName = `ngo-npo-${timestamp}-${application.logo!.name}`;
      const logoPath = `ngo-npo/logos/${logoFileName}`;

      await uploadFile(logoPath, application.logo!);

      await saveUserProfile({ name: application.contactPerson.trim() });

      registerNgoNpo(
        {
          organizationName: application.organizationName.trim(),
          logoPath,
          contactPerson: application.contactPerson.trim(),
          email: application.email.trim(),
          phone: application.phone.trim(),
          address: application.address.trim(),
          website: application.website.trim(),
          description: application.description.trim(),
          missionStatement: application.missionStatement.trim(),
          showContactInfo: application.showContactInfo,
        },
        {
          onSuccess: () => {
            setSubmitSuccess(true);

            setApplication({
              organizationName: "",
              logo: null,
              contactPerson: "",
              email: "",
              phone: "",
              address: "",
              website: "",
              description: "",
              missionStatement: "",
              showContactInfo: true,
            });
            setLogoPreview(null);

            setTimeout(() => {
              navigate({ to: "/ngo-npo/dashboard" });
            }, 3000);
          },
          onError: (error) => {
            console.error("Error submitting NGO/NPO application:", error);
            alert("Failed to submit application. Please try again.");
          },
        },
      );
    } catch (error) {
      console.error("Error uploading logo:", error);
      alert("Failed to upload logo. Please try again.");
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

  if (submitSuccess) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Application Submitted Successfully!
          </h2>
          <p className="text-gray-600 mb-6">
            Thank you for registering your NGO/NPO. Your application has been
            submitted and is now under review by our admin team.
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-blue-900 mb-2">
              What happens next?
            </h3>
            <ul className="text-sm text-blue-800 text-left space-y-1">
              <li>• Admin team will review your complete application</li>
              <li>• Your logo and organization details are securely stored</li>
              <li>• You'll receive approval/rejection notification</li>
              <li>
                • If approved, your organization will appear in the public
                directory
              </li>
              <li>• You'll be able to manage your profile and track impact</li>
            </ul>
          </div>
          <p className="text-sm text-gray-500">
            Redirecting to NGO/NPO dashboard in a few seconds...
          </p>
        </div>
      </div>
    );
  }

  if (identity && existingNgoNpoProfile) {
    const isApproved = existingNgoNpoProfile.approved;

    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <Building2
            className={`h-16 w-16 mx-auto mb-4 ${isApproved ? "text-green-500" : "text-yellow-500"}`}
          />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            {isApproved
              ? "Your Organization is Already Registered!"
              : "Application Under Review"}
          </h2>
          <p className="text-gray-600 mb-6">
            {isApproved
              ? "Your NGO/NPO is already approved and listed in the directory. You can access your dashboard to manage your profile."
              : "Your NGO/NPO application is currently being reviewed by our admin team. You can check your status in the dashboard."}
          </p>
          <button
            onClick={() => navigate({ to: "/ngo-npo/dashboard" })}
            className={`px-6 py-3 rounded-lg transition-colors font-medium text-white ${
              isApproved
                ? "bg-green-600 hover:bg-green-700"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            Go to NGO/NPO Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!identity) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="text-center">
            <Building2 className="h-16 w-16 text-blue-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Register Your NGO/NPO
            </h2>
            <p className="text-gray-600 mb-6">
              Join our platform to connect with citizens and track your
              organization's impact on civic issues. You need to sign in with
              Internet Identity to submit your application.
            </p>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-green-900 mb-2">
                Platform Benefits
              </h3>
              <ul className="text-sm text-green-800 text-left space-y-1">
                <li>• Public directory listing for visibility</li>
                <li>
                  • Track reports submitted or supported by your organization
                </li>
                <li>• Manage your organization profile and privacy settings</li>
                <li>• View impact metrics and community contributions</li>
                <li>• Connect with citizens and other organizations</li>
                <li>• Secure data storage on Internet Computer blockchain</li>
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
          <Building2 className="h-12 w-12 text-blue-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            NGO/NPO Registration
          </h2>
          <p className="text-gray-600">
            Fill out the form below to register your organization. All fields
            are required unless marked optional.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Organization Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Building2 className="h-4 w-4 inline mr-2" />
              Organization Name *
            </label>
            <input
              type="text"
              value={application.organizationName}
              onChange={(e) => {
                setApplication((prev) => ({
                  ...prev,
                  organizationName: e.target.value,
                }));
                setErrors((prev) => ({ ...prev, organizationName: "" }));
              }}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.organizationName ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="Enter organization name"
              disabled={isSubmittingApplication || isUploading}
            />
            {errors.organizationName && (
              <p className="text-red-500 text-sm mt-1">
                {errors.organizationName}
              </p>
            )}
          </div>

          {/* Logo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Organization Logo *
            </label>

            {logoPreview ? (
              <div className="flex items-center space-x-4">
                <img
                  src={logoPreview}
                  alt="Logo Preview"
                  className="w-24 h-24 object-cover rounded-lg border-2 border-gray-200"
                />
                <div className="flex-1">
                  <p className="text-sm text-gray-600 mb-2">
                    Logo selected successfully
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setApplication((prev) => ({ ...prev, logo: null }));
                      setLogoPreview(null);
                    }}
                    className="text-red-600 hover:text-red-700 text-sm font-medium"
                    disabled={isSubmittingApplication || isUploading}
                  >
                    Remove Logo
                  </button>
                </div>
              </div>
            ) : (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600 mb-2">
                  Upload your organization logo
                </p>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoInputChange}
                  className="hidden"
                  id="logo-upload"
                  disabled={isSubmittingApplication || isUploading}
                />
                <label
                  htmlFor="logo-upload"
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 cursor-pointer inline-block transition-colors"
                >
                  Choose Logo
                </label>
                <p className="text-xs text-gray-500 mt-2">
                  Supported formats: JPG, PNG, GIF (Max 5MB)
                </p>
              </div>
            )}
            {errors.logo && (
              <p className="text-red-500 text-sm mt-1">{errors.logo}</p>
            )}
          </div>

          {/* Contact Person */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <User className="h-4 w-4 inline mr-2" />
              Contact Person *
            </label>
            <input
              type="text"
              value={application.contactPerson}
              onChange={(e) => {
                setApplication((prev) => ({
                  ...prev,
                  contactPerson: e.target.value,
                }));
                setErrors((prev) => ({ ...prev, contactPerson: "" }));
              }}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.contactPerson ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="Enter contact person name"
              disabled={isSubmittingApplication || isUploading}
            />
            {errors.contactPerson && (
              <p className="text-red-500 text-sm mt-1">
                {errors.contactPerson}
              </p>
            )}
          </div>

          {/* Email */}
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
              placeholder="Enter email address"
              disabled={isSubmittingApplication || isUploading}
            />
            {errors.email && (
              <p className="text-red-500 text-sm mt-1">{errors.email}</p>
            )}
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Phone className="h-4 w-4 inline mr-2" />
              Phone Number *
            </label>
            <input
              type="tel"
              value={application.phone}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, "").slice(0, 10);
                setApplication((prev) => ({ ...prev, phone: value }));
                setErrors((prev) => ({ ...prev, phone: "" }));
              }}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.phone ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="Enter 10-digit phone number"
              disabled={isSubmittingApplication || isUploading}
            />
            {errors.phone && (
              <p className="text-red-500 text-sm mt-1">{errors.phone}</p>
            )}
          </div>

          {/* Address */}
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
              placeholder="Enter complete address including city, state, and pincode"
              disabled={isSubmittingApplication || isUploading}
            />
            {errors.address && (
              <p className="text-red-500 text-sm mt-1">{errors.address}</p>
            )}
          </div>

          {/* Website */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Globe className="h-4 w-4 inline mr-2" />
              Website (Optional)
            </label>
            <input
              type="url"
              value={application.website}
              onChange={(e) =>
                setApplication((prev) => ({ ...prev, website: e.target.value }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="https://www.example.org"
              disabled={isSubmittingApplication || isUploading}
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <FileText className="h-4 w-4 inline mr-2" />
              Organization Description *
            </label>
            <textarea
              value={application.description}
              onChange={(e) => {
                setApplication((prev) => ({
                  ...prev,
                  description: e.target.value,
                }));
                setErrors((prev) => ({ ...prev, description: "" }));
              }}
              rows={4}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.description ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="Describe your organization's work and activities"
              disabled={isSubmittingApplication || isUploading}
            />
            {errors.description && (
              <p className="text-red-500 text-sm mt-1">{errors.description}</p>
            )}
          </div>

          {/* Mission Statement */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <FileText className="h-4 w-4 inline mr-2" />
              Mission Statement *
            </label>
            <textarea
              value={application.missionStatement}
              onChange={(e) => {
                setApplication((prev) => ({
                  ...prev,
                  missionStatement: e.target.value,
                }));
                setErrors((prev) => ({ ...prev, missionStatement: "" }));
              }}
              rows={3}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.missionStatement ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="Enter your organization's mission statement"
              disabled={isSubmittingApplication || isUploading}
            />
            {errors.missionStatement && (
              <p className="text-red-500 text-sm mt-1">
                {errors.missionStatement}
              </p>
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
                        Show contact information in public directory
                      </p>
                      <p className="text-blue-600 text-xs leading-relaxed">
                        {application.showContactInfo
                          ? "Your email and phone will be visible to all users in the directory"
                          : "Your contact information will be hidden from public view"}
                      </p>
                    </div>
                    <div className="ml-4 flex flex-col items-center space-y-2">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={application.showContactInfo}
                          onChange={(e) =>
                            setApplication((prev) => ({
                              ...prev,
                              showContactInfo: e.target.checked,
                            }))
                          }
                          className="sr-only peer"
                          disabled={isSubmittingApplication || isUploading}
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                      <span
                        className={`text-xs font-semibold px-2 py-1 rounded-full transition-all duration-200 ${
                          application.showContactInfo
                            ? "bg-green-100 text-green-700 border border-green-300"
                            : "bg-gray-100 text-gray-600 border border-gray-300"
                        }`}
                      >
                        {application.showContactInfo ? "Public" : "Private"}
                      </span>
                    </div>
                  </div>
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
                  ? "Uploading Logo..."
                  : "Submitting Application..."}
              </>
            ) : (
              "Submit NGO/NPO Application"
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
                  <li>• Your application will be reviewed by our admin team</li>
                  <li>
                    • Approval is not guaranteed and is at admin discretion
                  </li>
                  <li>
                    • Registered organizations must maintain high standards
                  </li>
                  <li>• Contact information visibility can be changed later</li>
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
