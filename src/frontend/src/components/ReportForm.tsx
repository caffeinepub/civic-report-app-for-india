import { useNavigate, useRouterState } from "@tanstack/react-router";
import {
  AlertTriangle,
  Award,
  Building2,
  Camera,
  Check,
  CheckCircle,
  ChevronDown,
  Droplets,
  Edit3,
  ImageIcon,
  Loader2,
  MapPin,
  MessageSquare,
  RefreshCw,
  Upload,
  User,
  UserCheck,
  Waves,
  X,
} from "lucide-react";
import React, { useState, useRef, useEffect } from "react";
import { useGeolocation } from "react-use";
import {
  Constituency,
  type LocalCivicBody,
  type Representative,
} from "../backend";
import { useFileUpload, useFileUrl } from "../blob-storage/FileStorage";
import { useLanguage } from "../contexts/LanguageContext";
import { useLocationRefresh } from "../contexts/LocationRefreshContext";
import {
  useGetConstituenciesByState,
  useGetDirectory,
  useGetMyVolunteerProfile,
  useGetReport,
  useGetVidhanSabhaConstituenciesByState,
  useSubmitReport,
} from "../hooks/useQueries";
import { CertificateGenerator } from "./CertificateGenerator";

type IssueCategory =
  | "pothole"
  | "garbage"
  | "streetlight"
  | "waterlogging"
  | "flood"
  | "illegal_dumping"
  | "illegal_parking"
  | "other";

interface IssueCategoryOption {
  value: IssueCategory;
  label: string;
  icon: React.ReactNode;
  description: string;
}

interface LocationData {
  state?: string;
  house_number?: string;
  road?: string;
  neighbourhood?: string;
  suburb?: string;
  village?: string;
  town?: string;
  city?: string;
  city_district?: string;
  county?: string;
  state_district?: string;
  postcode?: string;
  country?: string;
}

// Civic body types with their corresponding representative labels
const civicBodyTypes = [
  {
    value: "Municipal Corporation",
    label: "Municipal Corporation (Mahanagar Palika)",
    representativeLabel: "Mayor Name",
  },
  {
    value: "Municipality",
    label: "Municipality (Nagar Palika/Municipal Council)",
    representativeLabel: "Chairperson/President Name",
  },
  {
    value: "Nagar Panchayat",
    label: "Nagar Panchayat",
    representativeLabel: "Chairperson/President Name",
  },
  {
    value: "Zilla Parishad",
    label: "Zilla Parishad",
    representativeLabel: "President/Adhyaksh Name",
  },
  {
    value: "Panchayat Samiti",
    label: "Panchayat Samiti/Block Panchayat",
    representativeLabel: "Chairperson Name",
  },
  {
    value: "Gram Panchayat",
    label: "Gram Panchayat",
    representativeLabel: "Sarpanch Name",
  },
];

// Leaflet imports
declare global {
  interface Window {
    L: any;
  }
}

// Helper functions moved to the top to avoid temporal dead zone issues
function _getIssueTypeEmoji(issueType: string) {
  const lowerType = issueType.toLowerCase();
  if (lowerType.includes("pothole")) return "🕳️";
  if (lowerType.includes("garbage") || lowerType.includes("waste")) return "🗑️";
  if (lowerType.includes("streetlight") || lowerType.includes("light"))
    return "💡";
  if (lowerType.includes("waterlogging") || lowerType.includes("water"))
    return "💧";
  if (lowerType.includes("flood")) return "🌊";
  if (lowerType.includes("dumping")) return "🚯";
  if (lowerType.includes("parking")) return "🚗";
  return "❓";
}

function _getIssueBadgeClass(issueType: string) {
  const lowerType = issueType.toLowerCase();
  if (lowerType.includes("pothole")) return "issue-orange";
  if (lowerType.includes("garbage") || lowerType.includes("waste"))
    return "issue-green";
  if (lowerType.includes("streetlight") || lowerType.includes("light"))
    return "issue-yellow";
  if (lowerType.includes("waterlogging") || lowerType.includes("water"))
    return "issue-blue";
  if (lowerType.includes("flood")) return "issue-blue";
  if (lowerType.includes("dumping")) return "issue-red";
  if (lowerType.includes("parking")) return "issue-purple";
  return "issue-gray";
}

export function ReportForm() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const routerState = useRouterState();
  const { locationRefreshKey } = useLocationRefresh();

  // Volunteer profile data
  const { data: volunteerProfile, isLoading: _isLoadingVolunteer } =
    useGetMyVolunteerProfile();
  const isApprovedVolunteer = volunteerProfile?.approved || false;

  // Directory data for PM/CM/MP/MLA - CRITICAL: This is now the ONLY source for PM/CM/MP/MLA data
  const { data: directory, isLoading: isLoadingDirectory } = useGetDirectory();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [issueCategory, setIssueCategory] = useState<IssueCategory>("pothole");
  const [customIssueType, setCustomIssueType] = useState<string>("");
  const [username, setUsername] = useState<string>("Anonymous User");
  const [notes, setNotes] = useState<string>("");

  // MLA state - now with auto-fetch capability and manual selection
  const [mlaName, setMlaName] = useState<string>("");
  const [mlaPhoto, setMlaPhoto] = useState<File | null>(null);
  const [mlaPhotoPreview, setMlaPhotoPreview] = useState<string | null>(null);
  const [mlaAutoFetched, setMlaAutoFetched] = useState<boolean>(false);
  const [mlaEditingName, setMlaEditingName] = useState<boolean>(false);
  const [showMlaDropdown, setShowMlaDropdown] = useState<boolean>(false);
  const [selectedMlaConstituency, setSelectedMlaConstituency] =
    useState<string>("");
  const [showManualMlaSelector, setShowManualMlaSelector] =
    useState<boolean>(false);

  // Local Civic Body state
  const [civicBodyType, setCivicBodyType] = useState<string>("");
  const [civicBodyName, setCivicBodyName] = useState<string>("");
  const [civicBodyRepName, setCivicBodyRepName] = useState<string>("");
  const [civicBodyPhoto, setCivicBodyPhoto] = useState<File | null>(null);
  const [civicBodyPhotoPreview, setCivicBodyPhotoPreview] = useState<
    string | null
  >(null);

  const [locationData, setLocationData] = useState<LocationData>({});
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [shouldFetchLocation, setShouldFetchLocation] = useState(true);
  const [customAddress, setCustomAddress] = useState<string>("");
  const [isEditingAddress, setIsEditingAddress] = useState(false);

  const [showLocationModal, setShowLocationModal] = useState(false);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [mapInstance, setMapInstance] = useState<any>(null);
  const [selectedLocation, setSelectedLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [isLoadingSelectedLocation, setIsLoadingSelectedLocation] =
    useState(false);
  const [hasCustomLocation, setHasCustomLocation] = useState(false);
  const mapModalRef = useRef<HTMLDivElement>(null);

  // PM data - now EXCLUSIVELY from directory
  const [pmName, setPmName] = useState("Not Available");
  const [pmPhoto, setPmPhoto] = useState<string | null>(null);
  const [pmCustomPhoto, setPmCustomPhoto] = useState<File | null>(null);
  const [pmCustomPhotoPreview, setPmCustomPhotoPreview] = useState<
    string | null
  >(null);
  const [pmEditingName, setPmEditingName] = useState(false);

  // CM data - now EXCLUSIVELY from directory
  const [cmName, setCmName] = useState("Not Available");
  const [cmPhoto, setCmPhoto] = useState<string | null>(null);
  const [cmCustomPhoto, setCmCustomPhoto] = useState<File | null>(null);
  const [cmCustomPhotoPreview, setCmCustomPhotoPreview] = useState<
    string | null
  >(null);
  const [cmEditingName, setCmEditingName] = useState(false);

  // MP data - EXCLUSIVELY from directory based on location or manual selection
  // FIX: Store the complete MP data object when manually selected
  const [mpData, setMpData] = useState<Representative | null>(null);
  const [mpName, setMpName] = useState("Not Available");
  const [mpPhoto, setMpPhoto] = useState<string | null>(null);
  const [mpCustomPhoto, setMpCustomPhoto] = useState<File | null>(null);
  const [mpCustomPhotoPreview, setMpCustomPhotoPreview] = useState<
    string | null
  >(null);
  const [mpEditingName, setMpEditingName] = useState(false);
  const [showMpSection, setShowMpSection] = useState(false);
  const [showManualConstituencySelector, setShowManualConstituencySelector] =
    useState(false);
  const [selectedConstituency, setSelectedConstituency] = useState<string>("");
  const [mpAutoFetched, setMpAutoFetched] = useState<boolean>(false);
  const [showMpDropdown, setShowMpDropdown] = useState<boolean>(false);

  const [isSubmittingReport, setIsSubmittingReport] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const mlaFileInputRef = useRef<HTMLInputElement>(null);
  const pmFileInputRef = useRef<HTMLInputElement>(null);
  const cmFileInputRef = useRef<HTMLInputElement>(null);
  const mpFileInputRef = useRef<HTMLInputElement>(null);
  const civicBodyFileInputRef = useRef<HTMLInputElement>(null);

  const geolocation = useGeolocation();
  const { uploadFile, isUploading } = useFileUpload();
  const { mutate: submitReport, isPending: isSubmitting } = useSubmitReport();

  // Fetch Lok Sabha constituencies by state using the backend query
  const { data: constituenciesByState, isLoading: isLoadingConstituencies } =
    useGetConstituenciesByState(locationData.state || "");

  // Fetch Vidhan Sabha constituencies by state for MLA selection
  const {
    data: vidhanSabhaConstituenciesByState,
    isLoading: isLoadingVidhanSabhaConstituencies,
  } = useGetVidhanSabhaConstituenciesByState(locationData.state || "");

  // Get PM photo URL from directory ONLY - NO Wikipedia fallback
  const { data: pmPhotoUrl } = useFileUrl(
    directory?.primeMinister?.photoPath || "",
  );

  // Get CM from directory based on state - NO Wikipedia fallback
  const cmFromDirectory = React.useMemo(() => {
    if (!directory || !locationData.state) return null;

    // Check states
    const state = directory.states.find((s) => s.name === locationData.state);
    if (state?.cm) return state.cm;

    // Check union territories
    const ut = directory.unionTerritories.find(
      (u) => u.name === locationData.state,
    );
    if (ut?.cm) return ut.cm;

    return null;
  }, [directory, locationData.state]);

  const { data: cmPhotoUrl } = useFileUrl(cmFromDirectory?.photoPath || "");

  // ENHANCED: Get MP from directory based on location with improved matching logic
  const mpFromDirectory = React.useMemo(() => {
    if (!directory || !locationData.state) return null;

    // Search through all states for constituencies
    const state = directory.states.find((s) => s.name === locationData.state);
    if (!state) return null;

    // Build full address string for matching
    const addressParts = [
      locationData.neighbourhood,
      locationData.suburb,
      locationData.village,
      locationData.city,
      locationData.city_district,
      locationData.county,
      locationData.state_district,
    ]
      .filter(Boolean)
      .map((part) => part!.toLowerCase());

    const fullAddress = addressParts.join(" ");

    console.log("=== MP AUTO-FETCH LOGIC ===");
    console.log("State:", locationData.state);
    console.log("Full address for matching:", fullAddress);
    console.log(
      "Available constituencies:",
      state.constituencies.map((c) => c.name),
    );

    // Step 1: Try to match Constituency name in the address
    for (const constituency of state.constituencies) {
      const constituencyNameLower = constituency.name.toLowerCase();

      // Check if constituency name appears in any address part
      if (
        addressParts.some(
          (part) =>
            part.includes(constituencyNameLower) ||
            constituencyNameLower.includes(part),
        )
      ) {
        console.log("✓ Constituency name match found:", constituency.name);
        if (constituency.mp) {
          console.log(
            "✓ MP found via constituency name match:",
            constituency.mp.name,
          );
          return constituency.mp;
        }
      }
    }

    // Step 2: Check Remarks field for area/block matches
    for (const constituency of state.constituencies) {
      if (constituency.mp && constituency.mp.remarks) {
        const remarksLower = constituency.mp.remarks.toLowerCase();

        // Split remarks by common delimiters (comma, semicolon, pipe, newline)
        const remarksParts = remarksLower
          .split(/[,;|\n]/)
          .map((part) => part.trim())
          .filter(Boolean);

        console.log("Checking remarks for constituency:", constituency.name);
        console.log("Remarks parts:", remarksParts);

        // Check if any address part matches any remarks part
        for (const addressPart of addressParts) {
          for (const remarkPart of remarksParts) {
            if (
              addressPart.includes(remarkPart) ||
              remarkPart.includes(addressPart)
            ) {
              console.log(
                "✓ Remarks match found:",
                remarkPart,
                "matches",
                addressPart,
              );
              console.log(
                "✓ MP found via remarks match:",
                constituency.mp.name,
              );
              return constituency.mp;
            }
          }
        }
      }
    }

    console.log("✗ No MP match found via auto-fetch");
    console.log("===========================");

    // If no match found, return null (MP section will show manual selector)
    return null;
  }, [
    directory,
    locationData.state,
    locationData.neighbourhood,
    locationData.suburb,
    locationData.village,
    locationData.city,
    locationData.city_district,
    locationData.county,
    locationData.state_district,
  ]);

  const { data: mpPhotoUrl } = useFileUrl(mpFromDirectory?.photoPath || "");

  // MLA auto-fetch logic - similar to MP auto-fetch
  const mlaFromDirectory = React.useMemo(() => {
    if (!directory || !locationData.state) return null;

    // Search through all states for constituencies and MLAs
    const state = directory.states.find((s) => s.name === locationData.state);
    if (!state) return null;

    // Build full address string for matching
    const addressParts = [
      locationData.neighbourhood,
      locationData.suburb,
      locationData.village,
      locationData.city,
      locationData.city_district,
      locationData.county,
      locationData.state_district,
    ]
      .filter(Boolean)
      .map((part) => part!.toLowerCase());

    const fullAddress = addressParts.join(" ");

    console.log("=== MLA AUTO-FETCH LOGIC ===");
    console.log("State:", locationData.state);
    console.log("Full address for matching:", fullAddress);

    // Step 1: Try to match Vidhan Sabha Constituency name in the address
    for (const constituency of state.constituencies) {
      const constituencyNameLower = constituency.name.toLowerCase();

      // Check if constituency name appears in any address part
      if (
        addressParts.some(
          (part) =>
            part.includes(constituencyNameLower) ||
            constituencyNameLower.includes(part),
        )
      ) {
        console.log(
          "✓ Vidhan Sabha Constituency name match found:",
          constituency.name,
        );

        // Check if there are MLAs for this constituency
        if (constituency.mlas && constituency.mlas.length > 0) {
          const mla = constituency.mlas[0]; // Take the first MLA
          console.log("✓ MLA found via constituency name match:", mla.name);
          return mla;
        }
      }
    }

    // Step 2: Check Remarks field for area/block matches
    for (const constituency of state.constituencies) {
      if (constituency.mlas && constituency.mlas.length > 0) {
        for (const mla of constituency.mlas) {
          if (mla.remarks) {
            const remarksLower = mla.remarks.toLowerCase();

            // Split remarks by common delimiters (comma, semicolon, pipe, newline)
            const remarksParts = remarksLower
              .split(/[,;|\n]/)
              .map((part) => part.trim())
              .filter(Boolean);

            console.log(
              "Checking MLA remarks for constituency:",
              constituency.name,
            );
            console.log("MLA:", mla.name);
            console.log("Remarks parts:", remarksParts);

            // Check if any address part matches any remarks part
            for (const addressPart of addressParts) {
              for (const remarkPart of remarksParts) {
                if (
                  addressPart.includes(remarkPart) ||
                  remarkPart.includes(addressPart)
                ) {
                  console.log(
                    "✓ MLA Remarks match found:",
                    remarkPart,
                    "matches",
                    addressPart,
                  );
                  console.log("✓ MLA found via remarks match:", mla.name);
                  return mla;
                }
              }
            }
          }
        }
      }
    }

    console.log("✗ No MLA match found via auto-fetch");
    console.log("============================");

    // If no match found, return null (manual MLA entry remains available)
    return null;
  }, [
    directory,
    locationData.state,
    locationData.neighbourhood,
    locationData.suburb,
    locationData.village,
    locationData.city,
    locationData.city_district,
    locationData.county,
    locationData.state_district,
  ]);

  const { data: mlaPhotoUrl } = useFileUrl(mlaFromDirectory?.photoPath || "");

  // Get constituency name for MP (auto-fetched or manually selected)
  const mpConstituencyName = React.useMemo(() => {
    if (selectedConstituency) {
      return selectedConstituency;
    }
    if (mpFromDirectory && directory && locationData.state) {
      const state = directory.states.find((s) => s.name === locationData.state);
      if (state) {
        const constituency = state.constituencies.find(
          (c) => c.mp?.name === mpFromDirectory.name,
        );
        return constituency?.name || "";
      }
    }
    return "";
  }, [mpFromDirectory, selectedConstituency, directory, locationData.state]);

  // Get constituency name for MLA (auto-fetched or manually selected)
  const mlaConstituencyName = React.useMemo(() => {
    if (selectedMlaConstituency) {
      return selectedMlaConstituency;
    }
    if (mlaFromDirectory && directory && locationData.state) {
      const state = directory.states.find((s) => s.name === locationData.state);
      if (state) {
        const constituency = state.constituencies.find(
          (c) =>
            c.mlas && c.mlas.some((mla) => mla.name === mlaFromDirectory.name),
        );
        return constituency?.name || "";
      }
    }
    return "";
  }, [
    mlaFromDirectory,
    selectedMlaConstituency,
    directory,
    locationData.state,
  ]);

  // Auto-fill username for approved volunteers
  useEffect(() => {
    if (isApprovedVolunteer && volunteerProfile?.name) {
      setUsername(volunteerProfile.name);
    } else if (!isApprovedVolunteer) {
      setUsername("Anonymous User");
    }
  }, [isApprovedVolunteer, volunteerProfile?.name]);

  // Update PM/CM data from directory EXCLUSIVELY - NO Wikipedia fallback
  useEffect(() => {
    if (directory?.primeMinister) {
      setPmName(directory.primeMinister.name);
      setPmPhoto(pmPhotoUrl || null);
    } else {
      // If no PM in directory, show "Not Available"
      setPmName("Not Available");
      setPmPhoto(null);
    }
  }, [directory?.primeMinister, pmPhotoUrl]);

  useEffect(() => {
    if (cmFromDirectory) {
      setCmName(cmFromDirectory.name);
      setCmPhoto(cmPhotoUrl || null);
    } else if (locationData.state) {
      // If state detected but no CM in directory, show "Not Available"
      setCmName("Not Available");
      setCmPhoto(null);
    }
  }, [cmFromDirectory, cmPhotoUrl, locationData.state]);

  // ENHANCED: Update MP data from directory based on improved auto-fetch or show manual selector
  useEffect(() => {
    if (mpFromDirectory) {
      console.log("Setting MP from auto-fetch:", mpFromDirectory.name);
      setMpData(mpFromDirectory); // Store complete MP data
      setMpName(mpFromDirectory.name);
      setMpPhoto(mpPhotoUrl || null);
      setShowMpSection(true);
      setShowManualConstituencySelector(false);
      setSelectedConstituency("");
      setMpAutoFetched(true);
      // Don't automatically hide dropdown - keep it visible if it was shown
    } else if (
      locationData.state &&
      constituenciesByState &&
      constituenciesByState.length > 0
    ) {
      // No MP found automatically - show manual constituency selector with backend data
      console.log(
        "No MP auto-match found, showing manual selector with",
        constituenciesByState.length,
        "constituencies",
      );
      setShowMpSection(true);
      setShowManualConstituencySelector(true);
      setMpData(null);
      setMpName("Not Available");
      setMpPhoto(null);
      setMpAutoFetched(false);
      setShowMpDropdown(false);
    } else if (
      locationData.state &&
      constituenciesByState &&
      constituenciesByState.length === 0
    ) {
      // State detected but no constituencies available
      console.log("State detected but no constituencies available");
      setShowMpSection(false);
      setShowManualConstituencySelector(false);
      setMpData(null);
      setMpName("Not Available");
      setMpPhoto(null);
      setMpAutoFetched(false);
      setShowMpDropdown(false);
    } else {
      // No state detected yet or still loading
      setShowMpSection(false);
      setShowManualConstituencySelector(false);
      setMpData(null);
      setMpName("Not Available");
      setMpPhoto(null);
      setMpAutoFetched(false);
      setShowMpDropdown(false);
    }
  }, [mpFromDirectory, mpPhotoUrl, locationData.state, constituenciesByState]);

  // ENHANCED: Update MLA data from directory based on auto-fetch or show manual selector
  useEffect(() => {
    if (mlaFromDirectory) {
      console.log("Setting MLA from auto-fetch:", mlaFromDirectory.name);
      setMlaName(mlaFromDirectory.name);
      setMlaPhoto(null); // Reset custom photo
      setMlaPhotoPreview(mlaPhotoUrl || null);
      setMlaAutoFetched(true);
      setShowMlaDropdown(false); // Hide dropdown when auto-fetched
      setSelectedMlaConstituency(""); // Reset manual selection
      setShowManualMlaSelector(false); // Hide manual selector when auto-fetched
    } else if (
      locationData.state &&
      vidhanSabhaConstituenciesByState &&
      vidhanSabhaConstituenciesByState.length > 0
    ) {
      // No MLA found automatically - show manual constituency selector with backend data
      console.log(
        "No MLA auto-match found, showing manual selector with",
        vidhanSabhaConstituenciesByState.length,
        "Vidhan Sabha constituencies",
      );
      setShowManualMlaSelector(true);
      setMlaName("");
      setMlaPhoto(null);
      setMlaPhotoPreview(null);
      setMlaAutoFetched(false);
      setShowMlaDropdown(false);
    } else {
      // No state detected yet or still loading or no constituencies available
      if (mlaAutoFetched) {
        // Only reset if previously auto-fetched
        setMlaName("");
        setMlaPhoto(null);
        setMlaPhotoPreview(null);
        setMlaAutoFetched(false);
        setShowMlaDropdown(false);
        setShowManualMlaSelector(false);
      }
    }
  }, [
    mlaFromDirectory,
    mlaPhotoUrl,
    locationData.state,
    vidhanSabhaConstituenciesByState,
  ]);

  // FIX: Handle manual constituency selection - Update mpData with complete Representative object
  useEffect(() => {
    if (
      selectedConstituency &&
      constituenciesByState &&
      constituenciesByState.length > 0
    ) {
      const constituency = constituenciesByState.find(
        (c) => c.name === selectedConstituency,
      );
      if (constituency?.mp) {
        console.log(
          "Manual constituency selected:",
          selectedConstituency,
          "MP:",
          constituency.mp.name,
        );
        // CRITICAL FIX: Store the complete MP data object including photoPath
        setMpData(constituency.mp);
        setMpName(constituency.mp.name);
        setMpPhoto(constituency.mp.photoPath || null);
        setMpAutoFetched(false);
        // Don't hide dropdown - keep it visible for re-selection
      } else {
        setMpData(null);
        setMpName("Not Available");
        setMpPhoto(null);
        setMpAutoFetched(false);
      }
    }
  }, [selectedConstituency, constituenciesByState]);

  // Handle manual MLA constituency selection
  useEffect(() => {
    if (
      selectedMlaConstituency &&
      vidhanSabhaConstituenciesByState &&
      vidhanSabhaConstituenciesByState.length > 0
    ) {
      const constituency = vidhanSabhaConstituenciesByState.find(
        (c) => c.name === selectedMlaConstituency,
      );
      if (constituency?.mlas && constituency.mlas.length > 0) {
        const mla = constituency.mlas[0]; // Take the first MLA
        console.log(
          "Manual MLA constituency selected:",
          selectedMlaConstituency,
          "MLA:",
          mla.name,
        );
        setMlaName(mla.name);
        // Get the photo URL from the selected MLA
        const mlaPhotoPath = mla.photoPath;
        if (mlaPhotoPath) {
          setMlaPhotoPreview(mlaPhotoPath);
        } else {
          setMlaPhotoPreview(null);
        }
        setMlaPhoto(null); // Reset custom photo
        setMlaAutoFetched(false);
        // Don't hide dropdown - keep it visible for re-selection
      } else {
        setMlaName("");
        setMlaPhotoPreview(null);
        setMlaPhoto(null);
        setMlaAutoFetched(false);
      }
    }
  }, [selectedMlaConstituency, vidhanSabhaConstituenciesByState]);

  // Listen for location refresh trigger from context
  useEffect(() => {
    // Only trigger refresh when on homepage
    if (routerState.location.pathname === "/" && locationRefreshKey > 0) {
      console.log(
        "Location refresh triggered from navigation - refreshing location",
      );
      handleRefreshLocation();
    }
  }, [locationRefreshKey, routerState.location.pathname]);

  // Create issue categories with translations and distinct icons
  const issueCategories: IssueCategoryOption[] = [
    {
      value: "pothole",
      label: t("issue.pothole"),
      icon: <span className="text-2xl">🕳️</span>,
      description: t("issue.pothole.desc"),
    },
    {
      value: "garbage",
      label: t("issue.garbage"),
      icon: <span className="text-2xl">🗑️</span>,
      description: t("issue.garbage.desc"),
    },
    {
      value: "streetlight",
      label: t("issue.streetlight"),
      icon: <span className="text-2xl">💡</span>,
      description: t("issue.streetlight.desc"),
    },
    {
      value: "waterlogging",
      label: t("issue.waterlogging"),
      icon: <Droplets className="h-8 w-8 text-blue-500" />,
      description: t("issue.waterlogging.desc"),
    },
    {
      value: "flood",
      label: t("issue.flood"),
      icon: <Waves className="h-8 w-8 text-blue-600" />,
      description: t("issue.flood.desc"),
    },
    {
      value: "illegal_dumping",
      label: t("issue.illegal_dumping"),
      icon: <span className="text-2xl">🚯</span>,
      description: t("issue.illegal_dumping.desc"),
    },
    {
      value: "illegal_parking",
      label: t("issue.illegal_parking"),
      icon: <span className="text-2xl">🚗</span>,
      description: t("issue.illegal_parking.desc"),
    },
    {
      value: "other",
      label: t("issue.other"),
      icon: <span className="text-2xl">❓</span>,
      description: t("issue.other.desc"),
    },
  ];

  const fetchLocationData = async (
    latitude: number,
    longitude: number,
  ): Promise<LocationData> => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`,
      );

      if (!response.ok) {
        throw new Error("Failed to fetch location data");
      }

      const data = await response.json();
      return data.address || {};
    } catch (error) {
      console.error("Error fetching location data:", error);
      return {};
    }
  };

  // Generate auto-filled notes based on issue category and location
  const generateAutoFilledNotes = (
    category: IssueCategory,
    customType: string,
    locationData: LocationData,
    customAddress: string,
  ): string => {
    const _issueType =
      category === "other"
        ? customType
        : issueCategories.find((cat) => cat.value === category)?.label ||
          category;

    let locationDesc = "";
    if (customAddress.trim()) {
      locationDesc = customAddress.trim();
    } else {
      const addressParts: string[] = [];

      if (locationData.road) addressParts.push(locationData.road);
      if (locationData.neighbourhood)
        addressParts.push(locationData.neighbourhood);
      else if (locationData.suburb) addressParts.push(locationData.suburb);
      else if (locationData.village) addressParts.push(locationData.village);

      if (locationData.city) addressParts.push(locationData.city);
      else if (locationData.town) addressParts.push(locationData.town);

      if (locationData.state) addressParts.push(locationData.state);

      locationDesc =
        addressParts.length > 0 ? addressParts.join(", ") : "current location";
    }

    let description = "";
    switch (category) {
      case "pothole":
        description = `Reporting a pothole issue at ${locationDesc}. This road damage needs immediate attention for public safety and smooth traffic flow.`;
        break;
      case "garbage":
        description = `Roadside garbage accumulation reported at ${locationDesc}. This waste disposal issue affects community hygiene and environmental cleanliness.`;
        break;
      case "streetlight":
        description = `Broken streetlight reported at ${locationDesc}. Non-functioning lighting poses safety risks and needs urgent repair for public security.`;
        break;
      case "waterlogging":
        description = `Water accumulation issue reported at ${locationDesc}. This waterlogging affects traffic movement and poses health risks to residents.`;
        break;
      case "flood":
        description = `Flooding reported at ${locationDesc}. This water accumulation in public areas requires immediate drainage and safety measures.`;
        break;
      case "illegal_dumping":
        description = `Illegal waste dumping reported at ${locationDesc}. Unauthorized disposal affects environmental health and community cleanliness.`;
        break;
      case "illegal_parking":
        description = `Illegal parking reported at ${locationDesc}. Vehicles in restricted areas obstruct traffic flow and emergency access.`;
        break;
      case "other":
        if (customType.trim()) {
          description = `${customType} reported at ${locationDesc}. This civic issue requires attention from local authorities for community improvement.`;
        } else {
          description = `Civic issue reported at ${locationDesc}. This matter needs attention from relevant authorities for resolution.`;
        }
        break;
      default:
        description = `Civic issue reported at ${locationDesc}. This matter requires attention from local authorities for community improvement.`;
    }

    if (description.length > 200) {
      description = description.substring(0, 197) + "...";
    }

    return description;
  };

  // Load Leaflet for map modal
  useEffect(() => {
    const loadLeaflet = async () => {
      if (window.L) {
        setIsMapLoaded(true);
        return;
      }

      try {
        const cssLink = document.createElement("link");
        cssLink.rel = "stylesheet";
        cssLink.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
        cssLink.integrity =
          "sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=";
        cssLink.crossOrigin = "";
        document.head.appendChild(cssLink);

        const script = document.createElement("script");
        script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
        script.integrity =
          "sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=";
        script.crossOrigin = "";

        await new Promise<void>((resolve) => {
          script.onload = () => resolve();
          document.head.appendChild(script);
        });

        setIsMapLoaded(true);
      } catch (error) {
        console.error("Error loading Leaflet:", error);
      }
    };

    loadLeaflet();
  }, []);

  // Initialize map modal when opened
  useEffect(() => {
    if (
      showLocationModal &&
      isMapLoaded &&
      mapModalRef.current &&
      !mapInstance
    ) {
      const currentLat =
        selectedLocation?.lat || geolocation.latitude || 20.5937;
      const currentLng =
        selectedLocation?.lng || geolocation.longitude || 78.9629;

      const map = window.L.map(mapModalRef.current, {
        center: [currentLat, currentLng],
        zoom: 13,
        zoomControl: true,
        preferCanvas: true,
      });

      window.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
        maxZoom: 19,
      }).addTo(map);

      map.on("click", async (e: any) => {
        const { lat, lng } = e.latlng;
        console.log("Map clicked - setting custom location:", lat, lng);
        setSelectedLocation({ lat, lng });
        setHasCustomLocation(true);

        map.eachLayer((layer: any) => {
          if (layer instanceof window.L.Marker) {
            map.removeLayer(layer);
          }
        });

        const _marker = window.L.marker([lat, lng], {
          icon: window.L.divIcon({
            html: `
              <div style="
                width: 30px;
                height: 30px;
                border-radius: 50%;
                background: #ef4444;
                border: 3px solid white;
                box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-weight: bold;
                font-size: 16px;
              ">
                📍
              </div>
            `,
            className: "custom-location-marker",
            iconSize: [30, 30],
            iconAnchor: [15, 15],
          }),
        }).addTo(map);

        setIsLoadingSelectedLocation(true);
        try {
          const newLocationData = await fetchLocationData(lat, lng);
          console.log(
            "Fetched location data for custom location:",
            newLocationData,
          );
          setLocationData(newLocationData);

          const addressParts: string[] = [];

          if (newLocationData.house_number && newLocationData.road) {
            addressParts.push(
              `${newLocationData.house_number} ${newLocationData.road}`,
            );
          } else if (newLocationData.road) {
            addressParts.push(newLocationData.road);
          }

          if (newLocationData.neighbourhood) {
            addressParts.push(newLocationData.neighbourhood);
          } else if (newLocationData.suburb) {
            addressParts.push(newLocationData.suburb);
          } else if (newLocationData.village) {
            addressParts.push(newLocationData.village);
          }

          if (newLocationData.city) {
            addressParts.push(newLocationData.city);
          } else if (newLocationData.town) {
            addressParts.push(newLocationData.town);
          } else if (newLocationData.city_district) {
            addressParts.push(newLocationData.city_district);
          }

          if (
            newLocationData.county &&
            !addressParts.includes(newLocationData.county)
          ) {
            addressParts.push(newLocationData.county);
          } else if (
            newLocationData.state_district &&
            !addressParts.includes(newLocationData.state_district)
          ) {
            addressParts.push(newLocationData.state_district);
          }

          if (newLocationData.state) {
            addressParts.push(newLocationData.state);
          }

          if (addressParts.length > 0) {
            const newAddress = addressParts.join(", ");
            console.log(
              "Setting custom address from map selection:",
              newAddress,
            );
            setCustomAddress(newAddress);
          }
        } catch (error) {
          console.error(
            "Error fetching location data for selected point:",
            error,
          );
        } finally {
          setIsLoadingSelectedLocation(false);
        }
      });

      if (geolocation.latitude && geolocation.longitude && !hasCustomLocation) {
        window.L.marker([geolocation.latitude, geolocation.longitude], {
          icon: window.L.divIcon({
            html: `
              <div style="
                width: 25px;
                height: 25px;
                border-radius: 50%;
                background: #3b82f6;
                border: 2px solid white;
                box-shadow: 0 2px 6px rgba(0,0,0,0.2);
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-size: 12px;
              ">
                📱
              </div>
            `,
            className: "current-location-marker",
            iconSize: [25, 25],
            iconAnchor: [12.5, 12.5],
          }),
        }).addTo(map);
      }

      setMapInstance(map);
    }
  }, [
    showLocationModal,
    isMapLoaded,
    mapModalRef.current,
    mapInstance,
    geolocation.latitude,
    geolocation.longitude,
    selectedLocation,
    hasCustomLocation,
  ]);

  // Cleanup map when modal closes
  useEffect(() => {
    if (!showLocationModal && mapInstance) {
      mapInstance.remove();
      setMapInstance(null);
    }
  }, [showLocationModal, mapInstance]);

  // Optimized location and leaders loading
  useEffect(() => {
    const loadLocationAndLeaders = async () => {
      if (
        shouldFetchLocation &&
        geolocation.latitude &&
        geolocation.longitude &&
        !hasCustomLocation
      ) {
        setIsLoadingLocation(true);

        try {
          const locationDataResult = await fetchLocationData(
            geolocation.latitude,
            geolocation.longitude,
          );

          console.log(
            "Loaded location data from geolocation:",
            locationDataResult,
          );
          setLocationData(locationDataResult);
        } catch (error) {
          console.error("Error loading location:", error);
        } finally {
          setIsLoadingLocation(false);
          setShouldFetchLocation(false);
        }
      }
    };

    loadLocationAndLeaders();
  }, [
    geolocation.latitude,
    geolocation.longitude,
    shouldFetchLocation,
    hasCustomLocation,
  ]);

  // Auto-fill notes when location data or issue category changes
  useEffect(() => {
    if (locationData && Object.keys(locationData).length > 0) {
      const autoFilledText = generateAutoFilledNotes(
        issueCategory,
        customIssueType,
        locationData,
        customAddress,
      );
      setNotes(autoFilledText);
    }
  }, [locationData, issueCategory, customIssueType, customAddress]);

  const handleRefreshLocation = () => {
    console.log("Refreshing location - resetting custom location state");
    setShouldFetchLocation(true);
    setCustomAddress("");
    setSelectedLocation(null);
    setHasCustomLocation(false);
    setSelectedConstituency("");
    setSelectedMlaConstituency("");
    setMpData(null); // Reset MP data on location refresh
  };

  const handleConfirmLocationSelection = async () => {
    if (!selectedLocation) return;

    console.log("Confirming custom location selection:", selectedLocation);
    console.log("Current location data:", locationData);
    console.log("Current custom address:", customAddress);

    setHasCustomLocation(true);
    setShowLocationModal(false);
    setShouldFetchLocation(false);
  };

  const formatLocationDisplay = () => {
    if (isLoadingLocation) {
      return t("form.location.loading");
    }

    if (customAddress.trim()) {
      return customAddress;
    }

    const addressParts: string[] = [];

    if (locationData.house_number && locationData.road) {
      addressParts.push(`${locationData.house_number} ${locationData.road}`);
    } else if (locationData.road) {
      addressParts.push(locationData.road);
    }

    if (locationData.neighbourhood) {
      addressParts.push(locationData.neighbourhood);
    } else if (locationData.suburb) {
      addressParts.push(locationData.suburb);
    } else if (locationData.village) {
      addressParts.push(locationData.village);
    }

    if (locationData.city) {
      addressParts.push(locationData.city);
    } else if (locationData.town) {
      addressParts.push(locationData.town);
    } else if (locationData.city_district) {
      addressParts.push(locationData.city_district);
    }

    if (locationData.county && !addressParts.includes(locationData.county)) {
      addressParts.push(locationData.county);
    } else if (
      locationData.state_district &&
      !addressParts.includes(locationData.state_district)
    ) {
      addressParts.push(locationData.state_district);
    }

    if (locationData.state) {
      addressParts.push(locationData.state);
    }

    if (addressParts.length > 0) {
      return addressParts.join(", ");
    }

    const lat = selectedLocation?.lat || geolocation.latitude;
    const lng = selectedLocation?.lng || geolocation.longitude;

    if (lat && lng) {
      return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    }

    return "Location not available";
  };

  const getCurrentCoordinates = () => {
    if (hasCustomLocation && selectedLocation) {
      console.log("Using custom-selected coordinates:", selectedLocation);
      return { lat: selectedLocation.lat, lng: selectedLocation.lng };
    }

    const lat = geolocation.latitude;
    const lng = geolocation.longitude;
    console.log("Using geolocation coordinates:", { lat, lng });
    return { lat, lng };
  };

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleMlaPhotoSelect = (file: File) => {
    setMlaPhoto(file);
    const url = URL.createObjectURL(file);
    setMlaPhotoPreview(url);
    setMlaAutoFetched(false); // Mark as manually uploaded
  };

  const handleMlaPhotoInputChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      handleMlaPhotoSelect(file);
    }
  };

  const handlePmPhotoUpload = (file: File) => {
    console.log("PM photo uploaded:", file.name);
    setPmCustomPhoto(file);
    const previewUrl = URL.createObjectURL(file);
    setPmCustomPhotoPreview(previewUrl);
  };

  const handleCmPhotoUpload = (file: File) => {
    console.log("CM photo uploaded:", file.name);
    setCmCustomPhoto(file);
    const previewUrl = URL.createObjectURL(file);
    setCmCustomPhotoPreview(previewUrl);
  };

  const handleMpPhotoUpload = (file: File) => {
    console.log("MP photo uploaded:", file.name);
    setMpCustomPhoto(file);
    const previewUrl = URL.createObjectURL(file);
    setMpCustomPhotoPreview(previewUrl);
  };

  const handlePmFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handlePmPhotoUpload(file);
    }
  };

  const handleCmFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleCmPhotoUpload(file);
    }
  };

  const handleMpFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleMpPhotoUpload(file);
    }
  };

  const handleCivicBodyPhotoSelect = (file: File) => {
    setCivicBodyPhoto(file);
    const url = URL.createObjectURL(file);
    setCivicBodyPhotoPreview(url);
  };

  const handleCivicBodyPhotoInputChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      handleCivicBodyPhotoSelect(file);
    }
  };

  const getIssueTypeForSubmission = (): string => {
    if (issueCategory === "other") {
      return customIssueType.trim() || "Other";
    }
    const categoryOption = issueCategories.find(
      (cat) => cat.value === issueCategory,
    );
    return categoryOption?.label || "Unknown";
  };

  const optimizedUploadFile = async (
    file: File,
    path: string,
  ): Promise<string> => {
    try {
      let fileToUpload = file;
      if (file.size > 1024 * 1024 && file.type.startsWith("image/")) {
        fileToUpload = await compressImage(file, 0.8, 1920, 1080);
      }

      const result = await uploadFile(path, fileToUpload);
      return result.path;
    } catch (error) {
      console.error(`Failed to upload file to ${path}:`, error);
      throw error;
    }
  };

  const compressImage = async (
    file: File,
    quality = 0.8,
    maxWidth = 1920,
    maxHeight = 1080,
  ): Promise<File> => {
    return new Promise((resolve) => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const img = document.createElement("img");

      img.onload = () => {
        let { width, height } = img;
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width *= ratio;
          height *= ratio;
        }

        canvas.width = width;
        canvas.height = height;

        ctx?.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: file.type,
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            } else {
              resolve(file);
            }
          },
          file.type,
          quality,
        );
      };

      img.src = URL.createObjectURL(file);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsSubmittingReport(true);

    if (!selectedFile) {
      alert("Please select a photo to upload");
      setIsSubmittingReport(false);
      return;
    }

    const coordinates = getCurrentCoordinates();
    if (!coordinates.lat || !coordinates.lng) {
      alert(
        "Location is required. Please enable location services or select a location on the map.",
      );
      setIsSubmittingReport(false);
      return;
    }

    if (issueCategory === "other" && !customIssueType.trim()) {
      alert('Please specify the custom issue type when "Other" is selected.');
      setIsSubmittingReport(false);
      return;
    }

    const hasMlaName = mlaName.trim().length > 0;
    const hasMlaPhoto = mlaPhoto !== null || mlaPhotoPreview !== null;

    if (hasMlaName && !hasMlaPhoto) {
      alert("Please upload a photo for the MLA or remove the name.");
      setIsSubmittingReport(false);
      return;
    }

    if (hasMlaPhoto && !hasMlaName) {
      alert("Please provide the MLA name or remove the photo.");
      setIsSubmittingReport(false);
      return;
    }

    try {
      const timestamp = Date.now();

      const uploadTasks: Array<Promise<string | null>> = [];

      const fileName = `${issueCategory}-${timestamp}-${selectedFile.name}`;
      const filePath = `reports/${fileName}`;
      uploadTasks.push(optimizedUploadFile(selectedFile, filePath));

      const optionalUploads: Array<Promise<string | null>> = [];

      // Handle MLA photo upload - only if custom photo was uploaded
      if (mlaPhoto && hasMlaName) {
        const mlaFileName = `mla-${timestamp}-${mlaPhoto.name}`;
        const mlaFilePath = `reports/mla/${mlaFileName}`;
        optionalUploads.push(optimizedUploadFile(mlaPhoto, mlaFilePath));
      } else if (mlaAutoFetched && mlaFromDirectory?.photoPath) {
        // Use auto-fetched photo path
        optionalUploads.push(Promise.resolve(mlaFromDirectory.photoPath));
      } else if (selectedMlaConstituency && vidhanSabhaConstituenciesByState) {
        // Use manually selected MLA photo path
        const constituency = vidhanSabhaConstituenciesByState.find(
          (c) => c.name === selectedMlaConstituency,
        );
        if (constituency?.mlas && constituency.mlas.length > 0) {
          optionalUploads.push(Promise.resolve(constituency.mlas[0].photoPath));
        } else {
          optionalUploads.push(Promise.resolve(null));
        }
      } else {
        optionalUploads.push(Promise.resolve(null));
      }

      if (pmCustomPhoto) {
        const pmFileName = `pm-custom-${timestamp}-${pmCustomPhoto.name}`;
        const pmFilePath = `leaders/pm/${pmFileName}`;
        console.log("Uploading PM custom photo to:", pmFilePath);
        optionalUploads.push(optimizedUploadFile(pmCustomPhoto, pmFilePath));
      } else {
        optionalUploads.push(Promise.resolve(null));
      }

      if (cmCustomPhoto) {
        const cmFileName = `cm-custom-${timestamp}-${cmCustomPhoto.name}`;
        const cmFilePath = `leaders/cm/${cmFileName}`;
        console.log("Uploading CM custom photo to:", cmFilePath);
        optionalUploads.push(optimizedUploadFile(cmCustomPhoto, cmFilePath));
      } else {
        optionalUploads.push(Promise.resolve(null));
      }

      if (mpCustomPhoto) {
        const mpFileName = `mp-custom-${timestamp}-${mpCustomPhoto.name}`;
        const mpFilePath = `leaders/mp/${mpFileName}`;
        console.log("Uploading MP custom photo to:", mpFilePath);
        optionalUploads.push(optimizedUploadFile(mpCustomPhoto, mpFilePath));
      } else {
        optionalUploads.push(Promise.resolve(null));
      }

      if (civicBodyPhoto) {
        const civicBodyFileName = `civic-body-${timestamp}-${civicBodyPhoto.name}`;
        const civicBodyFilePath = `reports/civic-body/${civicBodyFileName}`;
        console.log("Uploading civic body photo to:", civicBodyFilePath);
        optionalUploads.push(
          optimizedUploadFile(civicBodyPhoto, civicBodyFilePath),
        );
      } else {
        optionalUploads.push(Promise.resolve(null));
      }

      const [mainPhotoPath] = await Promise.all([uploadTasks[0]]);
      const [
        mlaPhotoPath,
        pmPhotoPath,
        cmPhotoPath,
        mpPhotoPath,
        civicBodyPhotoPath,
      ] = await Promise.all(optionalUploads);

      const issueType = getIssueTypeForSubmission();

      const addressToSubmit = customAddress.trim() || null;
      const stateToSubmit = locationData.state || "Unknown";
      const finalCoordinates = getCurrentCoordinates();

      let pmDataToSubmit: Representative | null = null;
      let cmDataToSubmit: Representative | null = null;
      let mpDataToSubmit: Representative | null = null;

      if (directory?.primeMinister) {
        pmDataToSubmit = {
          ...directory.primeMinister,
          photoPath: pmPhotoPath || directory.primeMinister.photoPath,
          name:
            pmName !== directory.primeMinister.name &&
            pmName !== "Not Available"
              ? pmName
              : directory.primeMinister.name,
        };
      } else if (pmName !== "Not Available" || pmPhotoPath) {
        pmDataToSubmit = {
          name: pmName !== "Not Available" ? pmName : "Prime Minister",
          photoPath: pmPhotoPath || "",
          email: "",
          twitterHandle: "",
          remarks: "",
          lastUpdated: BigInt(Date.now() * 1000000),
          politicalParty: undefined,
        };
      }

      if (cmFromDirectory) {
        cmDataToSubmit = {
          ...cmFromDirectory,
          photoPath: cmPhotoPath || cmFromDirectory.photoPath,
          name:
            cmName !== cmFromDirectory.name && cmName !== "Not Available"
              ? cmName
              : cmFromDirectory.name,
        };
      } else if (cmName !== "Not Available" || cmPhotoPath) {
        cmDataToSubmit = {
          name: cmName !== "Not Available" ? cmName : "Chief Minister",
          photoPath: cmPhotoPath || "",
          email: "",
          twitterHandle: "",
          remarks: "",
          lastUpdated: BigInt(Date.now() * 1000000),
          politicalParty: undefined,
        };
      }

      // FIX: Use the stored mpData object which contains the complete Representative data
      if (mpData) {
        // Use the stored MP data (from auto-fetch or manual selection)
        mpDataToSubmit = {
          ...mpData,
          photoPath: mpPhotoPath || mpData.photoPath, // Use custom photo if uploaded, otherwise use directory photo
          name:
            mpName !== mpData.name && mpName !== "Not Available"
              ? mpName
              : mpData.name,
        };
        console.log("Using stored mpData for submission:", mpDataToSubmit);
      } else if (showMpSection && (mpName !== "Not Available" || mpPhotoPath)) {
        // Fallback: create MP data from current state
        mpDataToSubmit = {
          name: mpName !== "Not Available" ? mpName : "Member of Parliament",
          photoPath: mpPhotoPath || "",
          email: "",
          twitterHandle: "",
          remarks: "",
          lastUpdated: BigInt(Date.now() * 1000000),
          politicalParty: undefined,
        };
        console.log("Using fallback MP data for submission:", mpDataToSubmit);
      }

      const pmNameToSubmit = pmDataToSubmit ? pmDataToSubmit.name : null;
      const cmNameToSubmit = cmDataToSubmit ? cmDataToSubmit.name : null;

      let localCivicBodyData: LocalCivicBody | null = null;
      if (civicBodyType && civicBodyName.trim() && civicBodyRepName.trim()) {
        localCivicBodyData = {
          bodyType: civicBodyType,
          bodyName: civicBodyName.trim(),
          representativeName: civicBodyRepName.trim(),
          photoPath: civicBodyPhotoPath || undefined,
        };
      }

      console.log("=== SUBMISSION DATA DEBUG ===");
      console.log("Final coordinates to submit:", finalCoordinates);
      console.log("Has custom location:", hasCustomLocation);
      console.log("Selected location:", selectedLocation);
      console.log("Custom address to submit:", addressToSubmit);
      console.log("PM data to submit:", pmDataToSubmit);
      console.log("CM data to submit:", cmDataToSubmit);
      console.log("MP data to submit (FIXED):", mpDataToSubmit);
      console.log("MP selected via manual constituency:", selectedConstituency);
      console.log("Stored mpData object:", mpData);
      console.log("PM photo path to submit:", pmPhotoPath);
      console.log("CM photo path to submit:", cmPhotoPath);
      console.log("MP photo path to submit:", mpPhotoPath);
      console.log("PM name to submit (legacy):", pmNameToSubmit);
      console.log("CM name to submit (legacy):", cmNameToSubmit);
      console.log("State to submit:", stateToSubmit);
      console.log("MLA name to submit:", hasMlaName ? mlaName.trim() : null);
      console.log("MLA photo path to submit:", mlaPhotoPath);
      console.log("MLA auto-fetched:", mlaAutoFetched);
      console.log(
        "MLA selected via manual constituency:",
        selectedMlaConstituency,
      );
      console.log("MLA designation to submit: MLA");
      console.log("Username to submit:", username.trim() || null);
      console.log("Is approved volunteer:", isApprovedVolunteer);
      console.log("Local Civic Body data:", localCivicBodyData);
      console.log("================================");

      submitReport(
        {
          photoPath: mainPhotoPath!,
          latitude: finalCoordinates.lat!,
          longitude: finalCoordinates.lng!,
          username: username.trim() || null,
          notes: notes.trim() || null,
          issueType,
          mlaMpName: hasMlaName ? mlaName.trim() : null,
          mlaMpPhotoPath: mlaPhotoPath,
          pmPhotoPath,
          cmPhotoPath,
          pmName: pmNameToSubmit,
          cmName: cmNameToSubmit,
          customAddress: addressToSubmit,
          state: stateToSubmit,
          mlaMpDesignation: "MLA",
          pmData: pmDataToSubmit,
          cmData: cmDataToSubmit,
          mpData: mpDataToSubmit,
          address: addressToSubmit,
          localCivicBody: localCivicBodyData,
        },
        {
          onSuccess: (reportId) => {
            console.log("=== SUBMISSION SUCCESS ===");
            console.log("Report submitted successfully with ID:", reportId);
            console.log("Final coordinates saved:", finalCoordinates);
            console.log("Custom address saved:", addressToSubmit);
            console.log("PM data saved:", pmDataToSubmit);
            console.log("CM data saved:", cmDataToSubmit);
            console.log("MP data saved (FIXED):", mpDataToSubmit);
            console.log("MLA name saved:", hasMlaName ? mlaName.trim() : null);
            console.log("MLA photo path saved:", mlaPhotoPath);
            console.log("MLA designation saved: MLA");
            console.log("Username saved:", username.trim() || null);
            console.log("Local Civic Body saved:", localCivicBodyData);
            console.log("==========================");

            setSelectedFile(null);
            setPreviewUrl(null);
            setIssueCategory("pothole");
            setCustomIssueType("");
            if (isApprovedVolunteer && volunteerProfile?.name) {
              setUsername(volunteerProfile.name);
            } else {
              setUsername("Anonymous User");
            }
            setNotes("");
            setMlaName("");
            setMlaPhoto(null);
            setMlaPhotoPreview(null);
            setMlaAutoFetched(false);
            setShowMlaDropdown(false);
            setSelectedMlaConstituency("");
            setShowManualMlaSelector(false);
            setCustomAddress("");
            setPmCustomPhoto(null);
            setPmCustomPhotoPreview(null);
            setCmCustomPhoto(null);
            setCmCustomPhotoPreview(null);
            setMpCustomPhoto(null);
            setMpCustomPhotoPreview(null);
            setSelectedLocation(null);
            setHasCustomLocation(false);
            setCivicBodyType("");
            setCivicBodyName("");
            setCivicBodyRepName("");
            setCivicBodyPhoto(null);
            setCivicBodyPhotoPreview(null);
            setSelectedConstituency("");
            setMpData(null); // Reset MP data

            setPmName(directory?.primeMinister?.name || "Not Available");
            setCmName("Not Available");
            setMpName("Not Available");
            setPmEditingName(false);
            setCmEditingName(false);
            setMpEditingName(false);
            setShowMpSection(false);
            setShowManualConstituencySelector(false);
            setMpAutoFetched(false);
            setShowMpDropdown(false);

            if (fileInputRef.current) fileInputRef.current.value = "";
            if (cameraInputRef.current) cameraInputRef.current.value = "";
            if (mlaFileInputRef.current) mlaFileInputRef.current.value = "";
            if (pmFileInputRef.current) pmFileInputRef.current.value = "";
            if (cmFileInputRef.current) cmFileInputRef.current.value = "";
            if (mpFileInputRef.current) mpFileInputRef.current.value = "";
            if (civicBodyFileInputRef.current)
              civicBodyFileInputRef.current.value = "";

            setShouldFetchLocation(true);

            setIsSubmittingReport(false);

            navigate({
              to: "/report/$reportId",
              params: { reportId },
              search: {
                submitted: "true",
              },
            });

            setTimeout(() => {
              window.scrollTo({ top: 0, behavior: "smooth" });
            }, 100);
          },
          onError: (error) => {
            console.error("Error submitting report:", error);
            setIsSubmittingReport(false);
            alert("Failed to submit report. Please try again.");
          },
        },
      );
    } catch (error) {
      console.error("Error submitting report:", error);
      setIsSubmittingReport(false);
      alert("Failed to submit report. Please try again.");
    }
  };

  const isLoading = isSubmittingReport || isUploading || isSubmitting;

  const getRepresentativeLabel = () => {
    if (!civicBodyType) return "Representative Name";
    const selectedType = civicBodyTypes.find(
      (type) => type.value === civicBodyType,
    );
    return selectedType?.representativeLabel || "Representative Name";
  };

  const getCivicBodyNameLabel = () => {
    if (!civicBodyType) return "Civic Body Name";
    const selectedType = civicBodyTypes.find(
      (type) => type.value === civicBodyType,
    );
    if (selectedType?.value === "Gram Panchayat") return "Gram Panchayat Name";
    if (selectedType?.value === "Municipal Corporation")
      return "Municipal Corporation Name";
    if (selectedType?.value === "Municipality") return "Municipality Name";
    if (selectedType?.value === "Nagar Panchayat")
      return "Nagar Panchayat Name";
    if (selectedType?.value === "Zilla Parishad") return "Zilla Parishad Name";
    if (selectedType?.value === "Panchayat Samiti")
      return "Panchayat Samiti Name";
    return "Civic Body Name";
  };

  // Fetch MP photo URL when manual constituency is selected
  const selectedMpPhotoPath = React.useMemo(() => {
    if (
      selectedConstituency &&
      constituenciesByState &&
      constituenciesByState.length > 0
    ) {
      const constituency = constituenciesByState.find(
        (c) => c.name === selectedConstituency,
      );
      return constituency?.mp?.photoPath || "";
    }
    return "";
  }, [selectedConstituency, constituenciesByState]);

  const { data: selectedMpPhotoUrl } = useFileUrl(selectedMpPhotoPath);

  // Update MP photo when selected constituency photo URL is loaded
  useEffect(() => {
    if (selectedConstituency && selectedMpPhotoUrl) {
      setMpPhoto(selectedMpPhotoUrl);
    }
  }, [selectedConstituency, selectedMpPhotoUrl]);

  // Fetch MLA photo URL when manual constituency is selected
  const selectedMlaPhotoPath = React.useMemo(() => {
    if (
      selectedMlaConstituency &&
      vidhanSabhaConstituenciesByState &&
      vidhanSabhaConstituenciesByState.length > 0
    ) {
      const constituency = vidhanSabhaConstituenciesByState.find(
        (c) => c.name === selectedMlaConstituency,
      );
      if (constituency?.mlas && constituency.mlas.length > 0) {
        return constituency.mlas[0].photoPath || "";
      }
    }
    return "";
  }, [selectedMlaConstituency, vidhanSabhaConstituenciesByState]);

  const { data: selectedMlaPhotoUrl } = useFileUrl(selectedMlaPhotoPath);

  // Update MLA photo when selected constituency photo URL is loaded
  useEffect(() => {
    if (selectedMlaConstituency && selectedMlaPhotoUrl) {
      setMlaPhotoPreview(selectedMlaPhotoUrl);
    }
  }, [selectedMlaConstituency, selectedMlaPhotoUrl]);

  return (
    <>
      <div className="mobile-form-container">
        <div className="form-header">
          <h2 className="form-title">
            Report by clicking Photo & Get Leader-Giotag, Certificate, Complaint
            & Legal Notice
          </h2>
          <p className="form-subtitle">
            Help improve our India by reporting civic issues
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mobile-form">
          {/* Section 1: Issue Category Selection */}
          <div className="form-section">
            <div className="section-header">
              <h3 className="section-title">{t("form.issueType.title")}</h3>
              <p className="section-description">
                {t("form.issueType.description")}
              </p>
            </div>

            <div className="category-grid">
              {issueCategories.map((category) => (
                <button
                  key={category.value}
                  type="button"
                  onClick={() => setIssueCategory(category.value)}
                  className={`category-card ${
                    issueCategory === category.value
                      ? "category-selected"
                      : "category-default"
                  }`}
                  disabled={isLoading}
                >
                  <div className="category-emoji">{category.icon}</div>
                  <div className="category-label">{category.label}</div>
                </button>
              ))}
            </div>

            {issueCategories.find((cat) => cat.value === issueCategory) && (
              <div className="category-description">
                {
                  issueCategories.find((cat) => cat.value === issueCategory)
                    ?.description
                }
              </div>
            )}

            {issueCategory === "other" && (
              <div className="custom-issue-input">
                <label className="input-label">
                  {t("form.customIssue.label")}
                </label>
                <input
                  type="text"
                  value={customIssueType}
                  onChange={(e) => setCustomIssueType(e.target.value)}
                  placeholder={t("form.customIssue.placeholder")}
                  className="text-input"
                  maxLength={100}
                  required
                  disabled={isLoading}
                />
                <div className="character-count">
                  {customIssueType.length}/100 {t("common.characters")}
                </div>
              </div>
            )}
          </div>

          {/* Section 2: Photo Upload */}
          <div className="form-section">
            <div className="section-header">
              <h3 className="section-title">{t("form.photo.title")}</h3>
              <p className="section-description">
                {t("form.photo.description")}
              </p>
            </div>

            <div className="input-group">
              {previewUrl ? (
                <div className="issue-photo-preview">
                  <img
                    src={previewUrl}
                    alt="Issue Preview"
                    className="w-24 h-24 object-cover rounded-lg border-2 border-gray-200"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedFile(null);
                      setPreviewUrl(null);
                      if (fileInputRef.current) fileInputRef.current.value = "";
                      if (cameraInputRef.current)
                        cameraInputRef.current.value = "";
                    }}
                    className="remove-issue-photo-btn"
                    disabled={isLoading}
                  >
                    {t("upload.removePhoto")}
                  </button>
                </div>
              ) : (
                <div className="issue-upload-options-horizontal">
                  <button
                    type="button"
                    onClick={() => cameraInputRef.current?.click()}
                    className="issue-upload-option-horizontal"
                    disabled={isLoading}
                  >
                    <Camera className="h-6 w-6 text-blue-500 mb-2" />
                    <span className="text-sm font-medium">
                      {t("upload.takePhoto")}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="issue-upload-option-horizontal"
                    disabled={isLoading}
                  >
                    <Upload className="h-6 w-6 text-green-500 mb-2" />
                    <span className="text-sm font-medium">
                      {t("upload.uploadPhoto")}
                    </span>
                  </button>
                </div>
              )}

              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileInputChange}
                className="hidden"
                disabled={isLoading}
              />

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileInputChange}
                className="hidden"
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Section 3: Unified Location and Leaders Section */}
          <div className="form-section">
            <div className="section-header">
              <h3 className="section-title">{t("form.location.title")}</h3>
              <p className="section-description">
                {t("form.location.description")}
              </p>
            </div>

            <div className="current-location-section">
              <div className="current-location-header">
                <h4 className="current-location-title">
                  <MapPin className="h-5 w-5 text-blue-600" />
                  <span>{t("form.location.current")}</span>
                </h4>
              </div>

              <div className="current-location-actions-compact">
                <button
                  type="button"
                  onClick={() => setShowLocationModal(true)}
                  disabled={isLoading || !isMapLoaded}
                  className="location-action-button-compact location-action-button-compact-primary"
                  title="Select location on map"
                >
                  <Edit3 className="h-3 w-3" />
                  <span>Select on Map</span>
                </button>
                <button
                  type="button"
                  onClick={handleRefreshLocation}
                  disabled={isLoadingLocation || isLoading}
                  className="location-action-button-compact location-action-button-compact-secondary"
                >
                  <RefreshCw
                    className={`h-3 w-3 ${isLoadingLocation ? "animate-spin" : ""}`}
                  />
                  <span>{t("form.location.refresh")}</span>
                </button>
              </div>

              <div className="current-location-status">
                {geolocation.loading && !selectedLocation && (
                  <div className="location-status-item location-status-loading">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>{t("form.location.loading")}</span>
                  </div>
                )}

                {geolocation.error && !selectedLocation && (
                  <div className="location-status-item location-status-error">
                    <AlertTriangle className="h-4 w-4" />
                    <span>{t("form.location.error")}</span>
                  </div>
                )}

                {getCurrentCoordinates().lat && getCurrentCoordinates().lng && (
                  <div className="location-status-item location-status-success">
                    <CheckCircle className="h-4 w-4" />
                    <div className="location-coordinates">
                      <span className="coordinates-label">
                        {hasCustomLocation && selectedLocation
                          ? "📍 Custom location:"
                          : t("form.location.success")}
                      </span>
                      <span className="coordinates-value">
                        {getCurrentCoordinates().lat?.toFixed(6)},{" "}
                        {getCurrentCoordinates().lng?.toFixed(6)}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {getCurrentCoordinates().lat && getCurrentCoordinates().lng && (
                <div className="current-location-address">
                  <div className="address-label">
                    <span>{t("form.location.address")}</span>
                  </div>
                  <div className="address-content">
                    {isEditingAddress ? (
                      <input
                        type="text"
                        value={customAddress}
                        onChange={(e) => {
                          console.log("Address being edited:", e.target.value);
                          setCustomAddress(e.target.value);
                        }}
                        className="address-edit-input"
                        onBlur={() => setIsEditingAddress(false)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            setIsEditingAddress(false);
                          }
                        }}
                        placeholder={formatLocationDisplay()}
                        disabled={isLoading}
                      />
                    ) : (
                      <div className="address-display">
                        <span className="address-text">
                          {formatLocationDisplay()}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            if (!customAddress.trim()) {
                              const currentDisplay = formatLocationDisplay();
                              console.log(
                                "Setting custom address from current display:",
                                currentDisplay,
                              );
                              setCustomAddress(currentDisplay);
                            }
                            setIsEditingAddress(true);
                          }}
                          className="address-edit-button"
                          disabled={isLoading}
                          title="Edit address"
                        >
                          <Edit3 className="h-3 w-3" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {getCurrentCoordinates().lat &&
              getCurrentCoordinates().lng &&
              !isLoadingLocation &&
              !isLoadingDirectory && (
                <div className="mt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Prime Minister Section */}
                    <div className="leader-card">
                      <div className="leader-header">
                        <User className="h-5 w-5 text-blue-600" />
                        <h5 className="text-base font-semibold text-gray-900">
                          {t("common.primeMinister")}
                        </h5>
                      </div>

                      <div className="leader-photo-container">
                        <div className="relative">
                          {pmCustomPhotoPreview ? (
                            <img
                              src={pmCustomPhotoPreview}
                              alt="Prime Minister"
                              className="leader-photo"
                            />
                          ) : pmPhoto ? (
                            <img
                              src={pmPhoto}
                              alt="Prime Minister"
                              className="leader-photo"
                            />
                          ) : (
                            <div className="leader-photo-placeholder">
                              <User className="h-8 w-8 text-gray-400" />
                              <span className="text-gray-500 text-xs">
                                Not Available
                              </span>
                            </div>
                          )}

                          <button
                            type="button"
                            onClick={() => pmFileInputRef.current?.click()}
                            className="absolute -top-1 -right-1 bg-blue-500 hover:bg-blue-600 text-white p-1 rounded-full shadow-md transition-colors"
                            disabled={isLoading}
                            title="Upload custom photo"
                          >
                            <ImageIcon className="h-3 w-3" />
                          </button>

                          {pmCustomPhotoPreview && (
                            <div className="custom-photo-badge">
                              <span className="text-xs font-medium">
                                Custom
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="leader-name-section">
                        {pmEditingName ? (
                          <div className="name-edit-container">
                            <input
                              type="text"
                              value={pmName}
                              onChange={(e) => {
                                console.log(
                                  "PM name being edited:",
                                  e.target.value,
                                );
                                setPmName(e.target.value);
                              }}
                              className="name-edit-input"
                              onBlur={() => setPmEditingName(false)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  setPmEditingName(false);
                                }
                              }}
                              disabled={isLoading}
                            />
                          </div>
                        ) : (
                          <div className="name-display-container">
                            <h6 className="leader-name text-sm">{pmName}</h6>
                            <button
                              type="button"
                              onClick={() => setPmEditingName(true)}
                              className="name-edit-button"
                              disabled={isLoading}
                            >
                              <Edit3 className="h-3 w-3" />
                            </button>
                          </div>
                        )}
                      </div>

                      <input
                        ref={pmFileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handlePmFileInputChange}
                        className="hidden"
                        disabled={isLoading}
                      />
                    </div>

                    {/* Chief Minister Section */}
                    <div className="leader-card">
                      <div className="leader-header">
                        <User className="h-5 w-5 text-green-600" />
                        <h5 className="text-base font-semibold text-gray-900">
                          {t("common.chiefMinister")}
                        </h5>
                      </div>

                      <div className="leader-photo-container">
                        <div className="relative">
                          {cmCustomPhotoPreview ? (
                            <img
                              src={cmCustomPhotoPreview}
                              alt="Chief Minister"
                              className="leader-photo"
                            />
                          ) : cmPhoto ? (
                            <img
                              src={cmPhoto}
                              alt="Chief Minister"
                              className="leader-photo"
                            />
                          ) : (
                            <div className="leader-photo-placeholder">
                              <User className="h-8 w-8 text-gray-400" />
                              <span className="text-gray-500 text-xs">
                                Not Available
                              </span>
                            </div>
                          )}

                          <button
                            type="button"
                            onClick={() => cmFileInputRef.current?.click()}
                            className="absolute -top-1 -right-1 bg-green-500 hover:bg-green-600 text-white p-1 rounded-full shadow-md transition-colors"
                            disabled={isLoading}
                            title="Upload custom photo"
                          >
                            <ImageIcon className="h-3 w-3" />
                          </button>

                          {cmCustomPhotoPreview && (
                            <div className="custom-photo-badge">
                              <span className="text-xs font-medium">
                                Custom
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="leader-name-section">
                        {cmEditingName ? (
                          <div className="name-edit-container">
                            <input
                              type="text"
                              value={cmName}
                              onChange={(e) => {
                                console.log(
                                  "CM name being edited:",
                                  e.target.value,
                                );
                                setCmName(e.target.value);
                              }}
                              className="name-edit-input"
                              onBlur={() => setCmEditingName(false)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  setCmEditingName(false);
                                }
                              }}
                              disabled={isLoading}
                            />
                          </div>
                        ) : (
                          <div className="name-display-container">
                            <h6 className="leader-name text-sm">{cmName}</h6>
                            <button
                              type="button"
                              onClick={() => setCmEditingName(true)}
                              className="name-edit-button"
                              disabled={isLoading}
                            >
                              <Edit3 className="h-3 w-3" />
                            </button>
                          </div>
                        )}
                      </div>

                      {/* State label for CM - KEPT */}
                      {locationData.state && cmName !== "Not Available" && (
                        <div className="mt-2 px-2 py-1 bg-green-50/50 backdrop-blur-sm border border-green-200/50 rounded-md">
                          <p className="text-xs text-green-700 font-medium">
                            State: {locationData.state}
                          </p>
                        </div>
                      )}

                      <input
                        ref={cmFileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleCmFileInputChange}
                        className="hidden"
                        disabled={isLoading}
                      />
                    </div>

                    {/* MP Section - Shows manual constituency selector when auto-fetch fails OR contextual button when auto-fetched */}
                    {showMpSection && (
                      <div className="leader-card">
                        <div className="leader-header">
                          <User className="h-5 w-5 text-purple-600" />
                          <h5 className="text-base font-semibold text-gray-900">
                            Member of Parliament (MP)
                          </h5>
                        </div>

                        {/* Contextual button remains visible even after manual selection */}
                        {(mpAutoFetched || selectedConstituency) && (
                          <div className="mb-3">
                            <button
                              type="button"
                              onClick={() => setShowMpDropdown(!showMpDropdown)}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-md transition-colors"
                              disabled={isLoading}
                            >
                              <span>MP incorrect? Select from list</span>
                              <ChevronDown
                                className={`h-3 w-3 transition-transform ${showMpDropdown ? "rotate-180" : ""}`}
                              />
                            </button>
                          </div>
                        )}

                        {/* Show dropdown when manual selector is needed OR when user clicks the contextual button */}
                        {(showManualConstituencySelector || showMpDropdown) && (
                          <div className="mb-4 space-y-2">
                            <label className="input-label text-sm font-medium text-gray-700">
                              Select Lok Sabha Constituency
                            </label>
                            {isLoadingConstituencies ? (
                              <div className="flex items-center justify-center py-3">
                                <Loader2 className="h-5 w-5 animate-spin text-purple-500" />
                                <span className="ml-2 text-sm text-gray-600">
                                  Loading constituencies...
                                </span>
                              </div>
                            ) : constituenciesByState &&
                              constituenciesByState.length > 0 ? (
                              <>
                                <select
                                  value={selectedConstituency}
                                  onChange={(e) => {
                                    setSelectedConstituency(e.target.value);
                                    // Don't hide dropdown - keep it visible for re-selection
                                  }}
                                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                                  disabled={isLoading}
                                >
                                  <option value="">
                                    Choose a constituency...
                                  </option>
                                  {constituenciesByState.map((constituency) => (
                                    <option
                                      key={constituency.name}
                                      value={constituency.name}
                                    >
                                      {constituency.name}{" "}
                                      {constituency.mp
                                        ? `- ${constituency.mp.name}`
                                        : ""}
                                    </option>
                                  ))}
                                </select>
                                {showManualConstituencySelector &&
                                  !mpAutoFetched && (
                                    <p className="text-xs text-gray-500 mt-1">
                                      No MP found automatically. Please select
                                      your constituency manually.
                                    </p>
                                  )}
                              </>
                            ) : (
                              <p className="text-xs text-red-500 mt-1">
                                No MPs available for this state.
                              </p>
                            )}
                          </div>
                        )}

                        <div className="leader-photo-container">
                          <div className="relative">
                            {mpCustomPhotoPreview ? (
                              <img
                                src={mpCustomPhotoPreview}
                                alt="Member of Parliament"
                                className="leader-photo"
                              />
                            ) : mpPhoto ? (
                              <img
                                src={mpPhoto}
                                alt="Member of Parliament"
                                className="leader-photo"
                              />
                            ) : (
                              <div className="leader-photo-placeholder">
                                <User className="h-8 w-8 text-gray-400" />
                                <span className="text-gray-500 text-xs">
                                  Not Available
                                </span>
                              </div>
                            )}

                            <button
                              type="button"
                              onClick={() => mpFileInputRef.current?.click()}
                              className="absolute -top-1 -right-1 bg-purple-500 hover:bg-purple-600 text-white p-1 rounded-full shadow-md transition-colors"
                              disabled={isLoading}
                              title="Upload custom photo"
                            >
                              <ImageIcon className="h-3 w-3" />
                            </button>

                            {mpCustomPhotoPreview && (
                              <div className="custom-photo-badge">
                                <span className="text-xs font-medium">
                                  Custom
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="leader-name-section">
                          {mpEditingName ? (
                            <div className="name-edit-container">
                              <input
                                type="text"
                                value={mpName}
                                onChange={(e) => {
                                  console.log(
                                    "MP name being edited:",
                                    e.target.value,
                                  );
                                  setMpName(e.target.value);
                                }}
                                className="name-edit-input"
                                onBlur={() => setMpEditingName(false)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    setMpEditingName(false);
                                  }
                                }}
                                disabled={isLoading}
                              />
                            </div>
                          ) : (
                            <div className="name-display-container">
                              <h6 className="leader-name text-sm">{mpName}</h6>
                              <button
                                type="button"
                                onClick={() => setMpEditingName(true)}
                                className="name-edit-button"
                                disabled={isLoading}
                              >
                                <Edit3 className="h-3 w-3" />
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Constituency label for MP - STATE REMOVED */}
                        {mpConstituencyName && mpName !== "Not Available" && (
                          <div className="mt-2">
                            <div className="px-2 py-1 bg-purple-50/50 backdrop-blur-sm border border-purple-200/50 rounded-md">
                              <p className="text-xs text-purple-700 font-medium">
                                Constituency: {mpConstituencyName}
                              </p>
                            </div>
                          </div>
                        )}

                        <input
                          ref={mpFileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleMpFileInputChange}
                          className="hidden"
                          disabled={isLoading}
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

            {/* MLA Information Section - Now with dynamic layout based on auto-fetch status */}
            <div className="mt-6">
              <div className="leader-card">
                <div className="leader-header">
                  <UserCheck className="h-5 w-5 text-blue-600" />
                  <h5 className="text-base font-semibold text-gray-900">
                    Member of Legislative Assembly (MLA)
                  </h5>
                </div>

                {/* Contextual button for MLA - mirrors MP flow */}
                {(mlaAutoFetched || selectedMlaConstituency) && (
                  <div className="mb-3">
                    <button
                      type="button"
                      onClick={() => setShowMlaDropdown(!showMlaDropdown)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-md transition-colors"
                      disabled={isLoading}
                    >
                      <span>MLA incorrect? Select from list</span>
                      <ChevronDown
                        className={`h-3 w-3 transition-transform ${showMlaDropdown ? "rotate-180" : ""}`}
                      />
                    </button>
                  </div>
                )}

                {/* Show dropdown when manual selector is needed OR when user clicks the contextual button */}
                {(showManualMlaSelector || showMlaDropdown) && (
                  <div className="mb-4 space-y-2">
                    <label className="input-label text-sm font-medium text-gray-700">
                      Select Vidhan Sabha Constituency
                    </label>
                    {isLoadingVidhanSabhaConstituencies ? (
                      <div className="flex items-center justify-center py-3">
                        <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                        <span className="ml-2 text-sm text-gray-600">
                          Loading constituencies...
                        </span>
                      </div>
                    ) : vidhanSabhaConstituenciesByState &&
                      vidhanSabhaConstituenciesByState.length > 0 ? (
                      <>
                        <select
                          value={selectedMlaConstituency}
                          onChange={(e) => {
                            setSelectedMlaConstituency(e.target.value);
                            // Don't hide dropdown - keep it visible for re-selection
                          }}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                          disabled={isLoading}
                        >
                          <option value="">Choose a constituency...</option>
                          {vidhanSabhaConstituenciesByState.map(
                            (constituency) => (
                              <option
                                key={constituency.name}
                                value={constituency.name}
                              >
                                {constituency.name}{" "}
                                {constituency.mlas &&
                                constituency.mlas.length > 0
                                  ? `- ${constituency.mlas[0].name}`
                                  : ""}
                              </option>
                            ),
                          )}
                        </select>
                        {showManualMlaSelector && !mlaAutoFetched && (
                          <p className="text-xs text-gray-500 mt-1">
                            No MLA found automatically. Please select your
                            constituency manually.
                          </p>
                        )}
                      </>
                    ) : (
                      <p className="text-xs text-red-500 mt-1">
                        No MLAs available for this state.
                      </p>
                    )}
                  </div>
                )}

                {/* MLA Photo and Name Display */}
                <div className="leader-photo-container">
                  <div className="relative">
                    {mlaPhotoPreview ? (
                      <img
                        src={mlaPhotoPreview}
                        alt="MLA"
                        className="leader-photo"
                      />
                    ) : (
                      <div className="leader-photo-placeholder">
                        <User className="h-8 w-8 text-gray-400" />
                        <span className="text-gray-500 text-xs">
                          Not Available
                        </span>
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => mlaFileInputRef.current?.click()}
                      className="absolute -top-1 -right-1 bg-blue-500 hover:bg-blue-600 text-white p-1 rounded-full shadow-md transition-colors"
                      disabled={isLoading}
                      title="Upload custom photo"
                    >
                      <ImageIcon className="h-3 w-3" />
                    </button>

                    {mlaPhoto && (
                      <div className="custom-photo-badge">
                        <span className="text-xs font-medium">Custom</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="leader-name-section">
                  {mlaEditingName ? (
                    <div className="name-edit-container">
                      <input
                        type="text"
                        value={mlaName}
                        onChange={(e) => {
                          setMlaName(e.target.value);
                          setMlaAutoFetched(false);
                        }}
                        className="name-edit-input"
                        onBlur={() => setMlaEditingName(false)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            setMlaEditingName(false);
                          }
                        }}
                        disabled={isLoading}
                      />
                    </div>
                  ) : (
                    <div className="name-display-container">
                      <h6 className="leader-name text-sm">
                        {mlaName || "Not Available"}
                      </h6>
                      <button
                        type="button"
                        onClick={() => setMlaEditingName(true)}
                        className="name-edit-button"
                        disabled={isLoading}
                      >
                        <Edit3 className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Constituency label for MLA - STATE REMOVED */}
                {mlaConstituencyName && mlaName && (
                  <div className="mt-2">
                    <div className="px-2 py-1 bg-blue-50/50 backdrop-blur-sm border border-blue-200/50 rounded-md">
                      <p className="text-xs text-blue-700 font-medium">
                        Constituency: {mlaConstituencyName}
                      </p>
                    </div>
                  </div>
                )}

                <input
                  ref={mlaFileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleMlaPhotoInputChange}
                  className="hidden"
                  disabled={isLoading}
                />

                {!mlaAutoFetched &&
                  !selectedMlaConstituency &&
                  !mlaName &&
                  !showManualMlaSelector && (
                    <p className="text-xs text-gray-600 mt-2">
                      MLA information is optional. You can manually enter the
                      name and upload a photo, or select from the list above.
                    </p>
                  )}
              </div>
            </div>

            {/* Local Civic Bodies Section */}
            <div className="leader-card mt-6">
              <div className="flex items-center space-x-2 mb-3">
                <Building2 className="h-5 w-5 text-purple-600" />
                <h4 className="text-base font-semibold text-gray-900">
                  Local Civic Bodies (Optional)
                </h4>
              </div>

              <p className="text-xs text-gray-600 mb-4">
                Include your local civic body representative information.
              </p>

              <div className="input-group mb-4">
                <label className="input-label text-sm">Civic Body Type</label>
                <select
                  value={civicBodyType}
                  onChange={(e) => {
                    setCivicBodyType(e.target.value);
                    setCivicBodyName("");
                    setCivicBodyRepName("");
                    setCivicBodyPhoto(null);
                    setCivicBodyPhotoPreview(null);
                  }}
                  className="text-input text-sm"
                  disabled={isLoading}
                >
                  <option value="">Select Civic Body Type</option>
                  {civicBodyTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              {civicBodyType && (
                <>
                  <div className="input-group mb-4">
                    <label className="input-label text-sm">
                      {getCivicBodyNameLabel()}
                    </label>
                    <input
                      type="text"
                      value={civicBodyName}
                      onChange={(e) => setCivicBodyName(e.target.value)}
                      placeholder={`Enter ${getCivicBodyNameLabel().toLowerCase()}`}
                      className="text-input text-sm"
                      maxLength={100}
                      disabled={isLoading}
                    />
                  </div>

                  <div className="input-group mb-4">
                    <label className="input-label text-sm">
                      {getRepresentativeLabel()}
                    </label>
                    <input
                      type="text"
                      value={civicBodyRepName}
                      onChange={(e) => setCivicBodyRepName(e.target.value)}
                      placeholder={`Enter ${getRepresentativeLabel().toLowerCase()}`}
                      className="text-input text-sm"
                      maxLength={100}
                      disabled={isLoading}
                    />
                  </div>

                  <div className="input-group">
                    <label className="input-label text-sm">
                      Official Photo (Optional)
                    </label>

                    {civicBodyPhotoPreview ? (
                      <div className="flex items-center space-x-3">
                        <img
                          src={civicBodyPhotoPreview}
                          alt="Civic Body Representative"
                          className="w-20 h-20 object-cover rounded-lg border-2 border-gray-200"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setCivicBodyPhoto(null);
                            setCivicBodyPhotoPreview(null);
                            if (civicBodyFileInputRef.current)
                              civicBodyFileInputRef.current.value = "";
                          }}
                          className="text-xs text-red-600 hover:text-red-700 font-medium"
                          disabled={isLoading}
                        >
                          Remove Photo
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center w-full">
                        <button
                          type="button"
                          onClick={() => civicBodyFileInputRef.current?.click()}
                          className="flex flex-col items-center justify-center w-full py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-400 hover:bg-purple-50 transition-colors"
                          disabled={isLoading}
                        >
                          <ImageIcon className="h-6 w-6 text-purple-500 mb-1" />
                          <span className="text-xs font-medium text-gray-600">
                            Upload Photo
                          </span>
                        </button>
                      </div>
                    )}

                    <input
                      ref={civicBodyFileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleCivicBodyPhotoInputChange}
                      className="hidden"
                      disabled={isLoading}
                    />
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Section 4: Additional Details */}
          <div className="form-section">
            <div className="section-header">
              <h3 className="section-title">
                {t("form.additionalInfo.title")}
              </h3>
              <p className="section-description">
                {t("form.additionalInfo.description")}
              </p>
            </div>

            <div className="input-group">
              <label className="input-label">
                <User className="h-5 w-5 inline mr-2" />
                Username{!isApprovedVolunteer && " (Optional)"}
                {isApprovedVolunteer && (
                  <div className="inline-flex items-center ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                    <Award className="h-3 w-3 mr-1" />
                    Verified Volunteer
                  </div>
                )}
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={
                  isApprovedVolunteer
                    ? volunteerProfile?.name || "Volunteer Name"
                    : t("form.username.placeholder")
                }
                className={`text-input ${isApprovedVolunteer ? "bg-blue-50 border-blue-200" : ""}`}
                maxLength={50}
                disabled={isLoading || isApprovedVolunteer}
                readOnly={isApprovedVolunteer}
              />
              {isApprovedVolunteer && (
                <p className="text-xs text-blue-600 mt-1 flex items-center">
                  <Award className="h-3 w-3 mr-1" />
                  Your volunteer name is automatically filled and cannot be
                  edited
                </p>
              )}
            </div>

            <div className="input-group">
              <label className="input-label">
                <MessageSquare className="h-5 w-5 inline mr-2" />
                {t("form.notes.label")}
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={t("form.notes.placeholder")}
                rows={4}
                className="textarea-input"
                maxLength={200}
                disabled={isLoading}
              />
              <div className="character-count">
                {notes.length}/200 {t("common.characters")}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                This field is auto-filled based on your issue type and location.
                You can edit or replace this text as needed.
              </p>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={
              isLoading ||
              !selectedFile ||
              !getCurrentCoordinates().lat ||
              !getCurrentCoordinates().lng ||
              (issueCategory === "other" && !customIssueType.trim())
            }
            className="submit-button"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-6 w-6 animate-spin mr-2" />
                <span>{t("form.submitting")}</span>
              </>
            ) : (
              <span>{t("form.submit")}</span>
            )}
          </button>

          {/* Form Disclaimer */}
          <div className="form-disclaimer">
            <div className="form-disclaimer-content">
              <AlertTriangle className="form-disclaimer-icon" />
              <div className="form-disclaimer-text">
                <strong>{t("form.disclaimer.title")}</strong>{" "}
                {t("form.disclaimer.text")}
              </div>
            </div>
          </div>
        </form>
      </div>

      {/* Clean Location Selection Modal */}
      {showLocationModal && (
        <div className="location-modal-overlay">
          <div className="location-modal-content">
            <div className="location-modal-header">
              <div className="flex items-center space-x-3">
                <MapPin className="h-6 w-6 text-blue-600" />
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900">
                  Select Location
                </h3>
              </div>
              <button
                onClick={() => setShowLocationModal(false)}
                className="text-gray-500 hover:text-gray-700 transition-colors p-1 rounded-full hover:bg-gray-100"
                disabled={isLoading}
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="location-modal-instructions">
              <p className="text-sm text-gray-600">
                Tap anywhere on the map to select a custom location for your
                report. The coordinates and address will be automatically
                updated.
              </p>
              {selectedLocation && (
                <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-700 font-medium">
                    📍 Location selected: {selectedLocation.lat.toFixed(6)},{" "}
                    {selectedLocation.lng.toFixed(6)}
                  </p>
                  {isLoadingSelectedLocation && (
                    <p className="text-xs text-green-600 mt-1">
                      Loading address...
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="location-modal-map">
              <div
                ref={mapModalRef}
                className="w-full h-full rounded-lg"
                style={{ minHeight: "300px" }}
              />
              {!isMapLoaded && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg">
                  <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-500 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">Loading map...</p>
                  </div>
                </div>
              )}
            </div>

            <div className="location-modal-actions">
              <button
                onClick={() => setShowLocationModal(false)}
                className="location-modal-button-secondary"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmLocationSelection}
                disabled={
                  !selectedLocation || isLoadingSelectedLocation || isLoading
                }
                className="location-modal-button-primary"
              >
                <Check className="h-4 w-4" />
                <span>
                  {isLoadingSelectedLocation
                    ? "Loading..."
                    : "Use This Location"}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
