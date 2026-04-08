import {
  AlertCircle,
  Award,
  Calendar,
  Camera,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Download,
  Edit,
  Eye,
  FileDown,
  FileText,
  Hash,
  Image,
  Mail,
  MapPin,
  MessageSquare,
  Send,
  Upload,
  User,
  UserCheck,
  X,
  XCircle,
} from "lucide-react";
import React, { useState, useEffect, useRef } from "react";
import type { Report } from "../backend";
import { useFileUpload, useFileUrl } from "../blob-storage/FileStorage";
import { useLanguage } from "../contexts/LanguageContext";
import {
  useGetMyVolunteerProfile,
  useGetVolunteerDirectory,
  useUpdateReportStatus,
} from "../hooks/useQueries";
import { CertificateGenerator } from "./CertificateGenerator";
import { LazyImage } from "./LazyImage";
import { LegalNoticeModal } from "./LegalNoticeModal";
import { PrintableComplaintModal } from "./PrintableComplaintModal";

interface ReportCardProps {
  report: Report;
  priority?: "high" | "low";
}

interface LocationData {
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
  state?: string;
  postcode?: string;
  country?: string;
}

interface LeaderInfo {
  name: string;
  photoUrl: string | null;
  designation: string;
  type: "pm" | "cm" | "mp" | "mla" | "civic";
}

export function ReportCard({ report, priority = "low" }: ReportCardProps) {
  const { t: _t } = useLanguage();
  const { data: imageUrl } = useFileUrl(report.photoPath);
  const { data: proofImageUrl } = useFileUrl(report.proofPhotoPath || "");
  const { data: mlaImageUrl } = useFileUrl(report.mlaPhotoPath || "");

  // Get PM/CM/MP photos from report's Representative objects
  const { data: pmPhotoUrl } = useFileUrl(report.pmData?.photoPath || "");
  const { data: cmPhotoUrl } = useFileUrl(report.cmData?.photoPath || "");
  const { data: mpPhotoUrl } = useFileUrl(report.mpData?.photoPath || "");

  // Get local civic body photo if available
  const { data: civicBodyPhotoUrl } = useFileUrl(
    report.localCivicBody?.photoPath || "",
  );

  // Get volunteer directory to check if reporter/status updater is a verified volunteer
  const { data: volunteerDirectory } = useGetVolunteerDirectory();
  const { data: myVolunteerProfile } = useGetMyVolunteerProfile();

  const [locationData, setLocationData] = useState<LocationData>({});
  const [isLoadingLocation, setIsLoadingLocation] = useState(true);
  const [showStatusUpdate, setShowStatusUpdate] = useState(false);
  const [proofPhoto, setProofPhoto] = useState<File | null>(null);
  const [proofPhotoPreview, setProofPhotoPreview] = useState<string | null>(
    null,
  );
  const [reporterName, setReporterName] = useState("");
  const [statusNotes, setStatusNotes] = useState("");
  const [showProofModal, setShowProofModal] = useState(false);
  const [showFullPhotoModal, setShowFullPhotoModal] = useState(false);
  const [showLeaderSelectionModal, setShowLeaderSelectionModal] =
    useState(false);
  const [selectedLeaders, setSelectedLeaders] = useState<Set<string>>(
    new Set(),
  );
  const [isGeneratingDownload, setIsGeneratingDownload] = useState(false);
  const [staticMapUrl, setStaticMapUrl] = useState<string | null>(null);
  const [showPrintableComplaintModal, setShowPrintableComplaintModal] =
    useState(false);
  const [showLegalNoticeModal, setShowLegalNoticeModal] = useState(false);
  const [isResolutionExpanded, setIsResolutionExpanded] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  const { uploadFile, isUploading } = useFileUpload();
  const { mutate: updateStatus, isPending: isUpdatingStatus } =
    useUpdateReportStatus();

  // Check if the reporter is a verified volunteer
  const isReporterVerifiedVolunteer = React.useMemo(() => {
    if (!report.username || !volunteerDirectory) return false;
    return volunteerDirectory.some(
      (volunteer) => volunteer.approved && volunteer.name === report.username,
    );
  }, [report.username, volunteerDirectory]);

  // Check if the status updater is a verified volunteer
  const isStatusUpdaterVerifiedVolunteer = React.useMemo(() => {
    if (!report.reporterName || !volunteerDirectory) return false;
    return volunteerDirectory.some(
      (volunteer) =>
        volunteer.approved && volunteer.name === report.reporterName,
    );
  }, [report.reporterName, volunteerDirectory]);

  const formatDate = (timestamp: bigint) => {
    return new Date(Number(timestamp) / 1000000).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getIssueTypeEmoji = (issueType: string) => {
    const lowerType = issueType.toLowerCase();
    if (lowerType.includes("pothole")) return "🕳️";
    if (lowerType.includes("garbage") || lowerType.includes("waste"))
      return "🗑️";
    if (lowerType.includes("streetlight") || lowerType.includes("light"))
      return "💡";
    if (lowerType.includes("waterlogging") || lowerType.includes("water"))
      return "🌊";
    if (lowerType.includes("flood")) return "🌊";
    if (lowerType.includes("dumping")) return "🚯";
    if (lowerType.includes("parking")) return "🚗";
    return "❓";
  };

  const getIssueTypeColor = (issueType: string) => {
    const lowerType = issueType.toLowerCase();
    if (lowerType.includes("pothole")) return "bg-orange-100 text-orange-700";
    if (lowerType.includes("garbage") || lowerType.includes("waste"))
      return "bg-green-100 text-green-700";
    if (lowerType.includes("streetlight") || lowerType.includes("light"))
      return "bg-yellow-100 text-yellow-700";
    if (lowerType.includes("waterlogging") || lowerType.includes("water"))
      return "bg-blue-100 text-blue-700";
    if (lowerType.includes("flood")) return "bg-blue-100 text-blue-700";
    if (lowerType.includes("dumping")) return "bg-red-100 text-red-700";
    if (lowerType.includes("parking")) return "bg-purple-100 text-purple-700";
    return "bg-gray-100 text-gray-700";
  };

  const getStatusColor = (status: string) => {
    const normalizedStatus = status.toLowerCase();
    switch (normalizedStatus) {
      case "submitted":
      case "open":
        return "bg-blue-100 text-blue-700";
      case "resolved":
        return "bg-green-100 text-green-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getStatusIcon = (status: string) => {
    const normalizedStatus = status.toLowerCase();
    switch (normalizedStatus) {
      case "submitted":
      case "open":
        return <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4" />;
      case "resolved":
        return <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4" />;
      default:
        return <Edit className="h-3 w-3 sm:h-4 sm:w-4" />;
    }
  };

  const getStatusDisplayText = (status: string) => {
    const normalizedStatus = status.toLowerCase();
    switch (normalizedStatus) {
      case "submitted":
        return "Open";
      case "open":
        return "Open";
      case "resolved":
        return "Resolved";
      default:
        return status;
    }
  };

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

  useEffect(() => {
    const loadLocationData = async () => {
      setIsLoadingLocation(true);
      const data = await fetchLocationData(
        report.location.latitude,
        report.location.longitude,
      );
      setLocationData(data);
      setIsLoadingLocation(false);
    };

    loadLocationData();
  }, [report.location.latitude, report.location.longitude]);

  const formatLocationDisplay = () => {
    if (isLoadingLocation) {
      return "Loading...";
    }

    if (report.customAddress) {
      return report.customAddress;
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

    return `${report.location.latitude.toFixed(4)}, ${report.location.longitude.toFixed(4)}`;
  };

  const handleProofPhotoSelect = (file: File) => {
    setProofPhoto(file);
    const url = URL.createObjectURL(file);
    setProofPhotoPreview(url);
  };

  const _handleProofPhotoInputChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      handleProofPhotoSelect(file);
    }
  };

  const handleStatusUpdate = async () => {
    if (!proofPhoto || !reporterName.trim()) {
      alert(
        "Please provide both a proof photo and reporter name to update the status.",
      );
      return;
    }

    try {
      const timestamp = Date.now();
      const fileName = `proof-resolved-${timestamp}-${proofPhoto.name}`;
      const filePath = `reports/proof/${fileName}`;

      await uploadFile(filePath, proofPhoto);

      updateStatus(
        {
          reportId: report.id,
          status: "Resolved",
          proofPhotoPath: filePath,
          reporterName: reporterName.trim(),
          notes: statusNotes.trim() || null,
        },
        {
          onSuccess: (success) => {
            if (success) {
              setShowStatusUpdate(false);
              setProofPhoto(null);
              setProofPhotoPreview(null);
              setReporterName("");
              setStatusNotes("");
              alert("Report status updated to Resolved successfully!");
            } else {
              alert("Failed to update report status. Please try again.");
            }
          },
          onError: (error) => {
            console.error("Error updating status:", error);
            alert("Failed to update report status. Please try again.");
          },
        },
      );
    } catch (error) {
      console.error("Error uploading proof photo:", error);
      alert("Failed to upload proof photo. Please try again.");
    }
  };

  // Get minister names and photos from report's Representative objects
  const getPmDisplayName = () => {
    return report.pmData?.name || "Prime Minister";
  };

  const getCmDisplayName = () => {
    return report.cmData?.name || "Chief Minister";
  };

  const getMpDisplayName = () => {
    return report.mpData?.name || "MP";
  };

  const getPmPhotoUrl = () => {
    return pmPhotoUrl || null;
  };

  const getCmPhotoUrl = () => {
    return cmPhotoUrl || null;
  };

  const getMpPhotoUrl = () => {
    return mpPhotoUrl || null;
  };

  // Get MLA designation display text
  const getMlaDesignationDisplay = () => {
    if (report.mlaDesignation === "MLA") return "MLA";
    return "MLA";
  };

  // Check if MP data should be displayed
  const shouldShowMpData = () => {
    return report.mpData && report.mpData.name;
  };

  // Check if local civic body should be displayed
  const shouldShowLocalCivicBody = () => {
    return (
      report.localCivicBody &&
      report.localCivicBody.bodyType &&
      report.localCivicBody.bodyName &&
      report.localCivicBody.representativeName
    );
  };

  // Get all available leaders for selection
  const getAvailableLeaders = (): LeaderInfo[] => {
    const leaders: LeaderInfo[] = [];

    // PM - always available
    leaders.push({
      name: getPmDisplayName(),
      photoUrl: getPmPhotoUrl(),
      designation: "PM",
      type: "pm",
    });

    // CM - always available
    leaders.push({
      name: getCmDisplayName(),
      photoUrl: getCmPhotoUrl(),
      designation: "CM",
      type: "cm",
    });

    // MP - if available
    if (shouldShowMpData()) {
      leaders.push({
        name: getMpDisplayName(),
        photoUrl: getMpPhotoUrl(),
        designation: "MP",
        type: "mp",
      });
    }

    // MLA - if available
    if (report.mlaName) {
      leaders.push({
        name: report.mlaName,
        photoUrl: mlaImageUrl || null,
        designation: getMlaDesignationDisplay(),
        type: "mla",
      });
    }

    // Local Civic Body - if available
    if (shouldShowLocalCivicBody()) {
      leaders.push({
        name: report.localCivicBody!.representativeName,
        photoUrl: civicBodyPhotoUrl || null,
        designation: `${report.localCivicBody!.bodyType}`,
        type: "civic",
      });
    }

    return leaders;
  };

  const loadImage = (src: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = document.createElement("img") as HTMLImageElement;
      img.crossOrigin = "anonymous";
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  };

  // Helper function to wrap text into multiple lines
  const wrapText = (
    ctx: CanvasRenderingContext2D,
    text: string,
    maxWidth: number,
  ): string[] => {
    const words = text.split(" ");
    const lines: string[] = [];
    let currentLine = "";

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const metrics = ctx.measureText(testLine);

      if (metrics.width > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }

    if (currentLine) {
      lines.push(currentLine);
    }

    return lines;
  };

  // Generate static map image using OpenStreetMap static map tile - 240x160 size
  const generateStaticMap = async (): Promise<string> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement("canvas");
      canvas.width = 240;
      canvas.height = 160;
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        reject(new Error("Could not get canvas context"));
        return;
      }

      // Calculate tile coordinates for zoom level 15
      const zoom = 15;
      const lat = report.location.latitude;
      const lon = report.location.longitude;

      const latRad = (lat * Math.PI) / 180;
      const n = 2 ** zoom;
      const xtile = Math.floor(((lon + 180) / 360) * n);
      const ytile = Math.floor(
        ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) /
          2) *
          n,
      );

      // Load center tile and surrounding tiles
      const tilesToLoad: Array<{
        x: number;
        y: number;
        offsetX: number;
        offsetY: number;
      }> = [];

      // Center tile
      tilesToLoad.push({ x: xtile, y: ytile, offsetX: 0, offsetY: 0 });
      // Surrounding tiles for better coverage
      tilesToLoad.push({ x: xtile - 1, y: ytile, offsetX: -256, offsetY: 0 });
      tilesToLoad.push({ x: xtile + 1, y: ytile, offsetX: 256, offsetY: 0 });
      tilesToLoad.push({ x: xtile, y: ytile - 1, offsetX: 0, offsetY: -256 });
      tilesToLoad.push({ x: xtile, y: ytile + 1, offsetX: 0, offsetY: 256 });

      let loadedCount = 0;
      const totalTiles = tilesToLoad.length;

      // Draw white background
      ctx.fillStyle = "#f0f0f0";
      ctx.fillRect(0, 0, 240, 160);

      // Calculate pixel position within the tile
      const pixelX = (((lon + 180) / 360) * n - xtile) * 256;
      const pixelY =
        (((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) /
          2) *
          n -
          ytile) *
        256;

      const centerX = 120;
      const centerY = 80;

      tilesToLoad.forEach((tile) => {
        const tileUrl = `https://tile.openstreetmap.org/${zoom}/${tile.x}/${tile.y}.png`;
        const img = document.createElement("img") as HTMLImageElement;
        img.crossOrigin = "anonymous";

        img.onload = () => {
          loadedCount++;

          // Calculate where to draw this tile
          const drawX = centerX - pixelX + tile.offsetX;
          const drawY = centerY - pixelY + tile.offsetY;

          ctx.drawImage(img, drawX, drawY, 256, 256);

          // When all tiles are loaded, draw the marker and resolve
          if (loadedCount === totalTiles) {
            // Draw location marker
            ctx.fillStyle = "#ef4444";
            ctx.strokeStyle = "#ffffff";
            ctx.lineWidth = 3;

            // Draw pin shape
            ctx.beginPath();
            ctx.arc(centerX, centerY - 8, 10, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            // Draw pin point
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.lineTo(centerX - 6, centerY - 8);
            ctx.lineTo(centerX + 6, centerY - 8);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            // Add border to map
            ctx.strokeStyle = "#cccccc";
            ctx.lineWidth = 2;
            ctx.strokeRect(0, 0, 240, 160);

            resolve(canvas.toDataURL("image/png"));
          }
        };

        img.onerror = () => {
          loadedCount++;
          // Continue even if some tiles fail to load
          if (loadedCount === totalTiles) {
            // Draw marker even if tiles failed
            ctx.fillStyle = "#ef4444";
            ctx.strokeStyle = "#ffffff";
            ctx.lineWidth = 3;

            ctx.beginPath();
            ctx.arc(centerX, centerY - 8, 10, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.lineTo(centerX - 6, centerY - 8);
            ctx.lineTo(centerX + 6, centerY - 8);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            ctx.strokeStyle = "#cccccc";
            ctx.lineWidth = 2;
            ctx.strokeRect(0, 0, 240, 160);

            resolve(canvas.toDataURL("image/png"));
          }
        };

        img.src = tileUrl;
      });

      // Timeout fallback
      setTimeout(() => {
        if (loadedCount < totalTiles) {
          // Draw marker on gray background as fallback
          ctx.fillStyle = "#ef4444";
          ctx.strokeStyle = "#ffffff";
          ctx.lineWidth = 3;

          ctx.beginPath();
          ctx.arc(centerX, centerY - 8, 10, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          ctx.beginPath();
          ctx.moveTo(centerX, centerY);
          ctx.lineTo(centerX - 6, centerY - 8);
          ctx.lineTo(centerX + 6, centerY - 8);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          resolve(canvas.toDataURL("image/png"));
        }
      }, 5000);
    });
  };

  // Generate static map for overlay when modal opens
  useEffect(() => {
    if (showFullPhotoModal) {
      generateStaticMap().then(setStaticMapUrl).catch(console.error);
    }
  }, [showFullPhotoModal]);

  const generateDownloadImage = async () => {
    if (!imageUrl || !canvasRef.current) return;

    setIsGeneratingDownload(true);

    try {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas context not available");

      // Generate static map
      let mapImage: string | null = null;
      try {
        mapImage = await generateStaticMap();
      } catch (error) {
        console.error("Error generating map:", error);
        // Continue without map if generation fails
      }

      // Load the main image
      const mainImg = await loadImage(imageUrl);

      // Set canvas size to match image
      canvas.width = mainImg.width;
      canvas.height = mainImg.height;

      // Draw the main image
      ctx.drawImage(mainImg, 0, 0);

      // Get selected leaders
      const availableLeaders = getAvailableLeaders();
      const leadersToShow = availableLeaders.filter((leader) =>
        selectedLeaders.has(leader.type),
      );

      if (leadersToShow.length > 0) {
        // Calculate responsive sizing to fit up to 5 leaders in one row
        const numLeaders = leadersToShow.length;
        const maxLeaderSize = 100;
        const minLeaderSize = 70;

        // Calculate optimal size to fit all leaders in one row with proper spacing
        const availableWidth = canvas.width * 0.9;
        const maxTotalWidth = availableWidth;

        // Start with optimal spacing for better distribution
        let leaderSize = maxLeaderSize;
        let spacing = 30;
        let totalWidth = numLeaders * leaderSize + (numLeaders - 1) * spacing;

        // Reduce size if needed to fit in one row
        while (totalWidth > maxTotalWidth && leaderSize > minLeaderSize) {
          leaderSize -= 3;
          spacing = Math.max(15, spacing - 1);
          totalWidth = numLeaders * leaderSize + (numLeaders - 1) * spacing;
        }

        // Responsive text sizing based on leader size
        const titleFontSize = Math.max(16, Math.floor(leaderSize * 0.18));
        const nameFontSize = Math.max(13, Math.floor(leaderSize * 0.15));
        const designationFontSize = Math.max(11, Math.floor(leaderSize * 0.13));
        // INCREASED vertical spacing between photo and name from 0.05 to 0.12
        const textSpacing = Math.max(8, Math.floor(leaderSize * 0.12));
        // REDUCED vertical spacing between name and designation from textSpacing to 2px
        const nameDesignationGap = 2;
        const padding = Math.max(10, Math.floor(canvas.width * 0.015));

        // Calculate max width for each leader's name (slightly wider than photo)
        const maxNameWidth = leaderSize + 10;

        // Pre-calculate wrapped text for all leaders to find max height needed
        const leaderTextData: Array<{
          nameLines: string[];
          totalTextHeight: number;
        }> = [];

        let maxTextHeight = 0;

        for (const leader of leadersToShow) {
          ctx.font = `bold ${nameFontSize}px Arial`;
          const nameLines = wrapText(ctx, leader.name, maxNameWidth);
          const nameHeight = nameLines.length * (nameFontSize + 4);
          const totalTextHeight =
            nameHeight + nameDesignationGap + designationFontSize + 4;

          leaderTextData.push({
            nameLines,
            totalTextHeight,
          });

          maxTextHeight = Math.max(maxTextHeight, totalTextHeight);
        }

        // Calculate overlay height - ALL photos at same level, text below
        const titleHeight = titleFontSize + 6;
        const itemHeight = leaderSize + textSpacing + maxTextHeight;
        const overlayHeight =
          titleHeight + textSpacing + itemHeight + padding * 2;

        // Draw LIGHTER gradient background (0.65 opacity)
        const gradient = ctx.createLinearGradient(0, 0, 0, overlayHeight);
        gradient.addColorStop(0, "rgba(0, 0, 0, 0.65)");
        gradient.addColorStop(0.5, "rgba(0, 0, 0, 0.65)");
        gradient.addColorStop(1, "rgba(0, 0, 0, 0)");
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, overlayHeight);

        // Draw "Responsible leaders" title
        ctx.fillStyle = "#ffffff";
        ctx.font = `bold ${titleFontSize}px Arial`;
        ctx.textAlign = "center";
        ctx.fillText(
          "Responsible leaders",
          canvas.width / 2,
          padding + titleHeight - 4,
        );

        // Calculate starting position to center the leaders
        const startX = (canvas.width - totalWidth) / 2;
        const startY = padding + titleHeight + textSpacing;

        // Draw leaders in a single row - ALL PHOTOS AT SAME Y POSITION
        for (let i = 0; i < leadersToShow.length; i++) {
          const leader = leadersToShow[i];
          const textData = leaderTextData[i];
          const x = startX + i * (leaderSize + spacing);
          const y = startY; // Same Y for all photos

          // Draw leader photo or placeholder
          if (leader.photoUrl) {
            try {
              const leaderImg = await loadImage(leader.photoUrl);
              ctx.save();
              ctx.beginPath();
              ctx.arc(
                x + leaderSize / 2,
                y + leaderSize / 2,
                leaderSize / 2,
                0,
                Math.PI * 2,
              );
              ctx.closePath();
              ctx.clip();
              ctx.drawImage(leaderImg, x, y, leaderSize, leaderSize);
              ctx.restore();
            } catch (_e) {
              // Draw placeholder circle
              ctx.fillStyle = "#e5e7eb";
              ctx.beginPath();
              ctx.arc(
                x + leaderSize / 2,
                y + leaderSize / 2,
                leaderSize / 2,
                0,
                Math.PI * 2,
              );
              ctx.fill();
            }
          } else {
            // Draw placeholder circle
            ctx.fillStyle = "#e5e7eb";
            ctx.beginPath();
            ctx.arc(
              x + leaderSize / 2,
              y + leaderSize / 2,
              leaderSize / 2,
              0,
              Math.PI * 2,
            );
            ctx.fill();
          }

          // Draw border
          ctx.strokeStyle = "#ffffff";
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(
            x + leaderSize / 2,
            y + leaderSize / 2,
            leaderSize / 2,
            0,
            Math.PI * 2,
          );
          ctx.stroke();

          // Draw leader name - BELOW photo, wrapped to multiple lines if needed
          ctx.fillStyle = "#ffffff";
          ctx.font = `bold ${nameFontSize}px Arial`;
          ctx.textAlign = "center";

          let textY = y + leaderSize + textSpacing + nameFontSize - 4;
          for (const line of textData.nameLines) {
            ctx.fillText(line, x + leaderSize / 2, textY);
            textY += nameFontSize + 4;
          }

          // Draw designation - BELOW name with REDUCED gap (2px instead of textSpacing)
          ctx.font = `${designationFontSize}px Arial`;
          ctx.fillText(
            leader.designation,
            x + leaderSize / 2,
            textY + nameDesignationGap,
          );
        }
      }

      // Draw address, coordinates, map, and date overlay at the bottom
      const bottomOverlayHeight = mapImage ? 200 : 120;
      const bottomY = canvas.height - bottomOverlayHeight;

      // Draw LIGHTER gradient background (0.65 opacity)
      const bottomGradient = ctx.createLinearGradient(
        0,
        bottomY,
        0,
        canvas.height,
      );
      bottomGradient.addColorStop(0, "rgba(0, 0, 0, 0)");
      bottomGradient.addColorStop(0.5, "rgba(0, 0, 0, 0.65)");
      bottomGradient.addColorStop(1, "rgba(0, 0, 0, 0.65)");
      ctx.fillStyle = bottomGradient;
      ctx.fillRect(0, bottomY, canvas.width, bottomOverlayHeight);

      // Draw coordinates - LEFT-ALIGNED at top
      ctx.font = "18px Arial";
      ctx.fillStyle = "#e0e0e0";
      ctx.textAlign = "left";
      const coordsText = `${report.location.latitude.toFixed(6)}, ${report.location.longitude.toFixed(6)}`;
      ctx.fillText(coordsText, 25, bottomY + 30);

      // Draw date and time - LEFT-ALIGNED below coordinates
      ctx.font = "20px Arial";
      ctx.fillStyle = "#ffffff";
      ctx.textAlign = "left";
      ctx.fillText(formatDate(report.timestamp), 25, bottomY + 60);

      // Draw map pin icon - ALIGNED with address
      ctx.fillStyle = "#ffffff";
      ctx.font = "28px Arial";
      ctx.textAlign = "left";
      ctx.fillText("📍", 25, bottomY + 100);

      // Draw address - INCREASED FONT SIZE from 20px to 24px and LEFT-ALIGNED with RIGHT PADDING
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 24px Arial";
      ctx.textAlign = "left";
      const address = formatLocationDisplay();
      // Add right padding of 40px to prevent overlap with map (was 80, now 300 + 40 = 340)
      const maxWidth = canvas.width - (mapImage ? 340 : 120);

      // Wrap text if needed
      const words = address.split(" ");
      let line = "";
      let y = bottomY + 100;

      for (let n = 0; n < words.length; n++) {
        const testLine = line + words[n] + " ";
        const metrics = ctx.measureText(testLine);
        if (metrics.width > maxWidth && n > 0) {
          ctx.fillText(line, 65, y);
          line = words[n] + " ";
          y += 30;
        } else {
          line = testLine;
        }
      }
      ctx.fillText(line, 65, y);

      // Draw static map if available - 240x160 size, positioned to BOTTOM-ALIGN with the bottom edge of the image
      if (mapImage) {
        try {
          const mapImg = await loadImage(mapImage);
          const mapWidth = 240;
          const mapHeight = 160;
          const mapX = canvas.width - mapWidth - 20;
          // Position map to bottom-align with the bottom edge of the image (canvas.height)
          const mapY = canvas.height - mapHeight - 20;

          // Apply transparency to map (0.9 opacity)
          ctx.globalAlpha = 0.9;

          // Draw map with border
          ctx.strokeStyle = "#ffffff";
          ctx.lineWidth = 3;
          ctx.strokeRect(mapX, mapY, mapWidth, mapHeight);
          ctx.drawImage(mapImg, mapX, mapY, mapWidth, mapHeight);

          // Reset transparency
          ctx.globalAlpha = 1.0;
        } catch (e) {
          console.error("Error drawing map:", e);
        }
      }

      // Convert canvas to blob and download
      canvas.toBlob(
        (blob) => {
          if (blob) {
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `civic-report-${report.id}-geotag.jpg`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
          }
          setIsGeneratingDownload(false);
          setShowLeaderSelectionModal(false);
        },
        "image/jpeg",
        0.95,
      );
    } catch (error) {
      console.error("Error generating download image:", error);
      alert("Failed to generate download image. Please try again.");
      setIsGeneratingDownload(false);
    }
  };

  const canUpdateStatus =
    report.status.toLowerCase() === "open" ||
    report.status.toLowerCase() === "submitted";
  const isResolved = report.status.toLowerCase() === "resolved";

  const handleEmailAuthorities = () => {
    // Collect email addresses
    const toEmails: string[] = [];
    const ccEmails: string[] = [];

    // TO: MP, MLA, Local Civic Body
    if (report.mpData?.email) {
      toEmails.push(report.mpData.email);
    }
    if (report.mlaName && report.pmData?.email) {
      // Note: MLA email not in current data structure, using placeholder logic
      // In real implementation, this would come from admin directory
    }
    if (report.localCivicBody && report.cmData?.email) {
      // Note: Local civic body email not in current data structure
      // In real implementation, this would come from admin directory
    }

    // CC: PM and CM
    if (report.pmData?.email) {
      ccEmails.push(report.pmData.email);
    }
    if (report.cmData?.email) {
      ccEmails.push(report.cmData.email);
    }

    // Extract key location from address
    const locationParts = formatLocationDisplay().split(",");
    const keyLocation =
      locationParts.length > 1
        ? locationParts[locationParts.length - 2].trim()
        : locationParts[0].trim();

    // Generate subject line
    const subject = `URGENT: ${report.issueType} Reported at ${keyLocation} – Action Required (ID: ${report.id})`;

    // Generate email body WITHOUT "RESPONSIBLE LEADERS:" label
    const body = `Dear Authorities,

I am writing to bring to your immediate attention a civic issue that requires urgent action.

ISSUE DETAILS:
Issue Type: ${report.issueType}
Location: ${formatLocationDisplay()}
Coordinates: ${report.location.latitude.toFixed(6)}, ${report.location.longitude.toFixed(6)}
Date & Time: ${formatDate(report.timestamp)}
${report.notes ? `Additional Notes: ${report.notes}` : ""}

${report.pmData?.name ? `Prime Minister: ${report.pmData.name} (${report.pmData.twitterHandle || "N/A"})` : ""}
${report.cmData?.name ? `Chief Minister: ${report.cmData.name} (${report.cmData.twitterHandle || "N/A"})` : ""}
${report.mpData?.name ? `Member of Parliament: ${report.mpData.name} (${report.mpData.twitterHandle || "N/A"})` : ""}
${report.mlaName ? `MLA: ${report.mlaName}` : ""}
${report.localCivicBody ? `${report.localCivicBody.bodyType}: ${report.localCivicBody.representativeName}` : ""}

This issue is affecting the quality of life in our community and requires immediate attention. I kindly request you to take necessary action to resolve this matter at the earliest.

Thank you for your prompt attention to this matter.

Regards,
${report.username || "A Concerned Citizen"}

Report ID: ${report.id}
Generated via Civic Report App`;

    // Create mailto link
    const mailtoLink = `mailto:${toEmails.join(",")}?cc=${ccEmails.join(",")}&subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    // Open mail client
    window.location.href = mailtoLink;
  };

  useEffect(() => {
    if (showStatusUpdate && myVolunteerProfile?.approved) {
      setReporterName(myVolunteerProfile.name);
    }
  }, [showStatusUpdate, myVolunteerProfile]);

  // Count total responsible leaders - ALWAYS include PM and CM, plus MP if available
  const totalLeaders = [
    true, // PM always counted
    true, // CM always counted
    !!shouldShowMpData(),
    !!report.mlaName,
    !!shouldShowLocalCivicBody(),
  ].filter(Boolean).length;

  const needsScroll = totalLeaders > 3;

  // Generate report verification URL
  const getReportVerificationUrl = () => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/report/${report.id}`;
  };

  // Handler for Legal Notice button
  const handleLegalNotice = () => {
    setShowLegalNoticeModal(true);
  };

  // Handler for Leader-Giotag button
  const handleLeaderGiotag = () => {
    // Pre-select all available leaders by default
    const allLeaders = getAvailableLeaders();
    const allLeaderTypes = new Set(allLeaders.map((l) => l.type));
    setSelectedLeaders(allLeaderTypes);
    setShowLeaderSelectionModal(true);
  };

  return (
    <>
      <canvas ref={canvasRef} style={{ display: "none" }} />

      <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow duration-200">
        <div className="p-3 sm:p-4 space-y-3 sm:space-y-4">
          {/* Leaders Section at the Top - Now with horizontal scrolling - ALWAYS SHOWS PM AND CM */}
          <div className="border-b border-gray-100 pb-2 sm:pb-3">
            <h4 className="text-xs sm:text-sm font-medium text-gray-600 mb-2 sm:mb-3">
              Responsible Leaders
            </h4>
            <div
              className={`flex items-center ${needsScroll ? "overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100" : "justify-center"} space-x-3 sm:space-x-4 pb-2`}
            >
              {/* Prime Minister - ALWAYS VISIBLE */}
              <div
                className="flex flex-col items-center flex-shrink-0"
                style={{ gap: "2px" }}
              >
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full overflow-hidden border-2 border-blue-200 bg-gray-100 flex items-center justify-center">
                  {getPmPhotoUrl() ? (
                    <LazyImage
                      src={getPmPhotoUrl()!}
                      alt="Prime Minister"
                      className="w-full h-full object-cover"
                      priority={priority}
                    />
                  ) : (
                    <User className="h-5 w-5 sm:h-6 sm:w-6 text-gray-400" />
                  )}
                </div>
                <div className="text-center">
                  <p className="text-xs font-medium text-gray-900 leading-tight">
                    {getPmDisplayName()}
                  </p>
                  <p
                    className="text-xs text-gray-500"
                    style={{ marginTop: "1px" }}
                  >
                    PM
                  </p>
                </div>
              </div>

              {/* Chief Minister - ALWAYS VISIBLE */}
              <div
                className="flex flex-col items-center flex-shrink-0"
                style={{ gap: "2px" }}
              >
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full overflow-hidden border-2 border-green-200 bg-gray-100 flex items-center justify-center">
                  {getCmPhotoUrl() ? (
                    <LazyImage
                      src={getCmPhotoUrl()!}
                      alt="Chief Minister"
                      className="w-full h-full object-cover"
                      priority={priority}
                    />
                  ) : (
                    <User className="h-5 w-5 sm:h-6 sm:w-6 text-gray-400" />
                  )}
                </div>
                <div className="text-center">
                  <p className="text-xs font-medium text-gray-900 leading-tight">
                    {getCmDisplayName()}
                  </p>
                  <p
                    className="text-xs text-gray-500"
                    style={{ marginTop: "1px" }}
                  >
                    CM
                  </p>
                </div>
              </div>

              {/* MP - Show when MP data is available */}
              {shouldShowMpData() && (
                <div
                  className="flex flex-col items-center flex-shrink-0"
                  style={{ gap: "2px" }}
                >
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full overflow-hidden border-2 border-indigo-200 bg-gray-100 flex items-center justify-center">
                    {getMpPhotoUrl() ? (
                      <LazyImage
                        src={getMpPhotoUrl()!}
                        alt="Member of Parliament"
                        className="w-full h-full object-cover"
                        priority={priority}
                      />
                    ) : (
                      <User className="h-5 w-5 sm:h-6 sm:w-6 text-gray-400" />
                    )}
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-medium text-gray-900 leading-tight">
                      {getMpDisplayName()}
                    </p>
                    <p
                      className="text-xs text-gray-500"
                      style={{ marginTop: "1px" }}
                    >
                      MP
                    </p>
                  </div>
                </div>
              )}

              {/* MLA - Only show if provided */}
              {report.mlaName && (
                <div
                  className="flex flex-col items-center flex-shrink-0"
                  style={{ gap: "2px" }}
                >
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full overflow-hidden border-2 border-purple-200 bg-gray-100 flex items-center justify-center">
                    {mlaImageUrl ? (
                      <LazyImage
                        src={mlaImageUrl}
                        alt={getMlaDesignationDisplay()}
                        className="w-full h-full object-cover"
                        priority={priority}
                      />
                    ) : (
                      <User className="h-5 w-5 sm:h-6 sm:w-6 text-gray-400" />
                    )}
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-medium text-gray-900 leading-tight">
                      {report.mlaName}
                    </p>
                    <p
                      className="text-xs text-gray-500"
                      style={{ marginTop: "1px" }}
                    >
                      {getMlaDesignationDisplay()}
                    </p>
                  </div>
                </div>
              )}

              {/* Local Civic Body - Show when type, body name, and rep name are provided */}
              {shouldShowLocalCivicBody() && (
                <div
                  className="flex flex-col items-center flex-shrink-0"
                  style={{ gap: "2px" }}
                >
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full overflow-hidden border-2 border-orange-200 bg-gray-100 flex items-center justify-center">
                    {civicBodyPhotoUrl ? (
                      <LazyImage
                        src={civicBodyPhotoUrl}
                        alt={report.localCivicBody!.representativeName}
                        className="w-full h-full object-cover"
                        priority={priority}
                      />
                    ) : (
                      <User className="h-5 w-5 sm:h-6 sm:w-6 text-gray-400" />
                    )}
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-medium text-gray-900 leading-tight">
                      {report.localCivicBody!.representativeName}
                    </p>
                    <p
                      className="text-xs text-gray-500"
                      style={{ marginTop: "1px" }}
                    >
                      {report.localCivicBody!.bodyType}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Report Image - Clickable to view full size with Leader-Giotag label */}
          <div
            className="relative group cursor-pointer"
            onClick={() => setShowFullPhotoModal(true)}
          >
            {imageUrl ? (
              <>
                <LazyImage
                  src={imageUrl}
                  alt="Report"
                  className="w-full h-40 sm:h-48 object-cover rounded-lg"
                  priority={priority}
                />
                {/* Leader-Giotag Label - Always visible in bottom-right corner */}
                <div className="absolute bottom-2 right-2 bg-black/30 backdrop-blur-sm text-white px-2 py-1 rounded text-xs font-medium flex items-center space-x-1">
                  <span>📍</span>
                  <span>Leader-Giotag</span>
                </div>
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-200 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <div className="bg-white/90 backdrop-blur-sm text-gray-900 px-2 py-1.5 sm:px-3 sm:py-2 rounded-lg font-medium flex items-center space-x-1.5 sm:space-x-2 shadow-lg">
                    <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="text-xs sm:text-sm">View Full Photo</span>
                  </div>
                </div>
              </>
            ) : (
              <div className="w-full h-40 sm:h-48 bg-gray-200 rounded-lg flex items-center justify-center">
                <span className="text-gray-500 text-sm sm:text-base">
                  Loading image...
                </span>
              </div>
            )}
          </div>

          {/* Report Info */}
          <div className="space-y-2 sm:space-y-3">
            <div className="flex items-center space-x-2 text-xs sm:text-sm text-gray-700 bg-gradient-to-r from-blue-50 to-indigo-50 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg border border-blue-200">
              <Hash className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600 flex-shrink-0" />
              <span className="font-mono font-semibold text-blue-800 text-xs truncate">
                Report ID: {report.id}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span
                className={`px-2 py-1 sm:px-3 sm:py-1 rounded-full text-xs sm:text-sm font-medium ${getIssueTypeColor(report.issueType)}`}
              >
                {getIssueTypeEmoji(report.issueType)} {report.issueType}
              </span>
              <div className="flex items-center space-x-1.5 sm:space-x-2">
                <span
                  className={`px-2 py-1 sm:px-3 sm:py-1 rounded-full text-xs sm:text-sm font-medium flex items-center space-x-1 ${getStatusColor(report.status)}`}
                >
                  {getStatusIcon(report.status)}
                  <span>{getStatusDisplayText(report.status)}</span>
                </span>
                {canUpdateStatus && !isResolved && (
                  <button
                    onClick={() => setShowStatusUpdate(true)}
                    className="p-1 sm:p-1.5 rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200 transition-colors"
                    title="Update Status"
                  >
                    <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                  </button>
                )}
              </div>
            </div>

            {report.username && (
              <div className="flex items-center space-x-2 text-xs sm:text-sm text-gray-600">
                <User className="h-4 w-4 sm:h-5 sm:w-5" />
                <span>Reported by: {report.username}</span>
                {isReporterVerifiedVolunteer && (
                  <span title="Verified Volunteer">
                    <Award className="h-4 w-4 text-blue-600" />
                  </span>
                )}
              </div>
            )}

            <div className="flex items-start space-x-2 text-xs sm:text-sm text-gray-600">
              <MapPin className="h-4 w-4 sm:h-5 sm:w-5 mt-0.5 flex-shrink-0" />
              <span className="break-words">{formatLocationDisplay()}</span>
            </div>

            <div className="flex items-center space-x-2 text-xs sm:text-sm text-gray-600">
              <Calendar className="h-4 w-4 sm:h-5 sm:w-5" />
              <span>{formatDate(report.timestamp)}</span>
            </div>

            {report.notes && (
              <div className="flex items-start space-x-2 text-xs sm:text-sm text-gray-600">
                <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5 mt-0.5 flex-shrink-0" />
                <span className="break-words">{report.notes}</span>
              </div>
            )}

            {/* Collapsible Resolution Details Section */}
            {report.status.toLowerCase() === "resolved" &&
              report.reporterName && (
                <div className="bg-green-50 border border-green-200 rounded-lg overflow-hidden">
                  {/* Collapsed Summary - Always visible */}
                  <button
                    onClick={() =>
                      setIsResolutionExpanded(!isResolutionExpanded)
                    }
                    className="w-full p-2 sm:p-3 flex items-center justify-between hover:bg-green-100 transition-colors"
                  >
                    <div className="flex items-center space-x-2 text-xs sm:text-sm text-green-700">
                      <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                      <span className="font-medium">
                        Resolved on {formatDate(report.timestamp)} – click to
                        view details
                      </span>
                    </div>
                    {isResolutionExpanded ? (
                      <ChevronUp className="h-4 w-4 sm:h-5 sm:w-5 text-green-700 flex-shrink-0" />
                    ) : (
                      <ChevronDown className="h-4 w-4 sm:h-5 sm:w-5 text-green-700 flex-shrink-0" />
                    )}
                  </button>

                  {/* Expanded Content - Shown when expanded */}
                  {isResolutionExpanded && (
                    <div className="p-2 sm:p-3 pt-0 space-y-1.5 sm:space-y-2 animate-in slide-in-from-top-2 duration-200">
                      <div className="flex items-center space-x-2 text-xs sm:text-sm text-green-700">
                        <UserCheck className="h-3 w-3 sm:h-4 sm:w-4" />
                        <span>Resolved by: {report.reporterName}</span>
                        {isStatusUpdaterVerifiedVolunteer && (
                          <span title="Verified Volunteer">
                            <Award className="h-4 w-4 text-blue-600" />
                          </span>
                        )}
                      </div>
                      {report.completionNotes && (
                        <div className="flex items-start space-x-2 text-xs sm:text-sm text-green-700">
                          <MessageSquare className="h-3 w-3 sm:h-4 sm:w-4 mt-0.5 flex-shrink-0" />
                          <span>{report.completionNotes}</span>
                        </div>
                      )}
                      {proofImageUrl && (
                        <div className="mt-2 sm:mt-3">
                          <p className="text-xs sm:text-sm font-medium text-green-800 mb-1.5 sm:mb-2">
                            Resolution Photo:
                          </p>
                          <button
                            onClick={() => setShowProofModal(true)}
                            className="block hover:opacity-80 transition-opacity"
                          >
                            <LazyImage
                              src={proofImageUrl}
                              alt="Resolution proof"
                              className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-lg border-2 border-green-300 cursor-pointer hover:border-green-400 transition-colors"
                              priority="low"
                            />
                          </button>
                          <p className="text-xs text-green-600 mt-1">
                            Click to view full size
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
          </div>

          {/* Status Update Section */}
          {showStatusUpdate && (
            <div className="pt-2 border-t border-gray-100">
              <div className="bg-gray-50 p-3 sm:p-4 rounded-lg border space-y-3 sm:space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-base sm:text-lg font-semibold text-gray-900">
                    Update Report Status to Resolved
                  </h4>
                </div>

                <div className="space-y-1.5 sm:space-y-2">
                  <label className="block text-sm sm:text-base font-medium text-gray-700">
                    Reporter Name *
                    {myVolunteerProfile?.approved && (
                      <span title="Verified Volunteer" className="ml-2">
                        <Award className="inline h-4 w-4 text-blue-600" />
                      </span>
                    )}
                  </label>
                  <input
                    type="text"
                    value={reporterName}
                    onChange={(e) => setReporterName(e.target.value)}
                    placeholder={
                      myVolunteerProfile?.approved
                        ? myVolunteerProfile.name
                        : "Enter your name"
                    }
                    className={`w-full px-2.5 py-2 sm:px-3 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base ${
                      myVolunteerProfile?.approved
                        ? "bg-blue-50 border-blue-200"
                        : ""
                    }`}
                    required
                    disabled={myVolunteerProfile?.approved}
                    readOnly={myVolunteerProfile?.approved}
                  />
                  {myVolunteerProfile?.approved && (
                    <p className="text-xs text-blue-600 mt-1 flex items-center">
                      <Award className="h-3 w-3 mr-1" />
                      Your volunteer name is automatically filled and cannot be
                      edited
                    </p>
                  )}
                </div>

                <div className="space-y-1.5 sm:space-y-2">
                  <label className="block text-sm sm:text-base font-medium text-gray-700">
                    Resolution Notes (Optional)
                  </label>
                  <textarea
                    value={statusNotes}
                    onChange={(e) => setStatusNotes(e.target.value)}
                    placeholder="Add any comments about how the issue was resolved..."
                    rows={3}
                    className="w-full px-2.5 py-2 sm:px-3 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base resize-none"
                    maxLength={200}
                  />
                  <div className="text-xs sm:text-sm text-gray-500 text-right">
                    {statusNotes.length}/200 characters
                  </div>
                </div>

                <div className="space-y-1.5 sm:space-y-2">
                  <label className="block text-sm sm:text-base font-medium text-gray-700">
                    Proof Photo *
                  </label>

                  {proofPhotoPreview ? (
                    <div className="space-y-2">
                      <img
                        src={proofPhotoPreview}
                        alt="Proof Preview"
                        className="w-full h-28 sm:h-32 object-cover rounded-lg border"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setProofPhoto(null);
                          setProofPhotoPreview(null);
                        }}
                        className="text-red-600 hover:text-red-700 text-sm sm:text-base font-medium"
                      >
                        Remove photo
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const input = document.createElement("input");
                          input.type = "file";
                          input.accept = "image/*";
                          input.capture = "environment";
                          input.onchange = (e) => {
                            const file = (e.target as HTMLInputElement)
                              .files?.[0];
                            if (file) handleProofPhotoSelect(file);
                          };
                          input.click();
                        }}
                        className="flex flex-col items-center justify-center p-2.5 sm:p-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-all duration-200 min-h-[70px] sm:min-h-[80px]"
                      >
                        <Camera className="h-5 w-5 sm:h-6 sm:w-6 text-blue-500 mb-1.5 sm:mb-2" />
                        <span className="text-xs sm:text-sm font-medium">
                          Take Photo
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          const input = document.createElement("input");
                          input.type = "file";
                          input.accept = "image/*";
                          input.onchange = (e) => {
                            const file = (e.target as HTMLInputElement)
                              .files?.[0];
                            if (file) handleProofPhotoSelect(file);
                          };
                          input.click();
                        }}
                        className="flex flex-col items-center justify-center p-2.5 sm:p-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-400 hover:bg-green-50 transition-all duration-200 min-h-[70px] sm:min-h-[80px]"
                      >
                        <Upload className="h-5 w-5 sm:h-6 sm:w-6 text-green-500 mb-1.5 sm:mb-2" />
                        <span className="text-xs sm:text-sm font-medium">
                          Upload Photo
                        </span>
                      </button>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={handleStatusUpdate}
                    disabled={
                      !proofPhoto ||
                      !reporterName.trim() ||
                      isUploading ||
                      isUpdatingStatus
                    }
                    className="bg-blue-600 text-white py-2 px-2.5 sm:py-2.5 sm:px-3 rounded-lg text-xs sm:text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-1 sm:space-x-1.5 shadow-sm min-h-[36px] sm:min-h-[42px]"
                  >
                    <span>
                      {isUploading || isUpdatingStatus
                        ? "Updating..."
                        : "Mark as Resolved"}
                    </span>
                  </button>
                  <button
                    onClick={() => {
                      setShowStatusUpdate(false);
                      setProofPhoto(null);
                      setProofPhotoPreview(null);
                      setReporterName("");
                      setStatusNotes("");
                    }}
                    className="bg-gray-50 text-gray-700 border border-gray-200 py-2 px-2.5 sm:py-2.5 sm:px-3 rounded-lg text-xs sm:text-sm font-medium hover:bg-gray-100 hover:border-gray-300 transition-colors flex items-center justify-center space-x-1 sm:space-x-1.5 min-h-[36px] sm:min-h-[42px]"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Call-to-Action Buttons - 6 buttons total */}
          {!showStatusUpdate && !isResolved && (
            <div className="pt-2 sm:pt-3 border-t border-gray-100 space-y-1.5 sm:space-y-2">
              <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
                <CertificateGenerator report={report} imageUrl={imageUrl} />
                <button
                  onClick={() => {
                    // Build leader list with names and X handles
                    const leadersList: string[] = [];

                    if (report.pmData?.name && report.pmData?.twitterHandle) {
                      leadersList.push(
                        `${report.pmData.name} (${report.pmData.twitterHandle})`,
                      );
                    }

                    if (report.cmData?.name && report.cmData?.twitterHandle) {
                      leadersList.push(
                        `${report.cmData.name} (${report.cmData.twitterHandle})`,
                      );
                    }

                    if (
                      shouldShowMpData() &&
                      report.mpData?.name &&
                      report.mpData?.twitterHandle
                    ) {
                      leadersList.push(
                        `${report.mpData.name} (${report.mpData.twitterHandle})`,
                      );
                    }

                    if (report.mlaName) {
                      leadersList.push(report.mlaName);
                    }

                    if (
                      shouldShowLocalCivicBody() &&
                      report.localCivicBody?.representativeName
                    ) {
                      leadersList.push(
                        report.localCivicBody.representativeName,
                      );
                    }

                    const leadersText =
                      leadersList.length > 0
                        ? `\n\n${leadersList.join("\n")}`
                        : "";

                    const reportUrl = getReportVerificationUrl();

                    const shareText = `🚨 Civic Issue Report: ${report.issueType}\n\n📍 ${formatLocationDisplay()}${leadersText}\n\nWe request prompt action to resolve this issue.\n\n#CivicReport\n\n${reportUrl}`;

                    if (navigator.share) {
                      navigator.share({
                        title: "Civic Issue Report",
                        text: shareText,
                      });
                    } else {
                      navigator.clipboard.writeText(shareText).then(() => {
                        alert("Report details copied to clipboard!");
                      });
                    }
                  }}
                  className="bg-gray-50 text-gray-700 border border-gray-200 py-2 px-2.5 sm:py-2.5 sm:px-3 rounded-lg text-xs sm:text-sm font-medium hover:bg-gray-100 hover:border-gray-300 transition-colors flex items-center justify-center space-x-1 sm:space-x-1.5 min-h-[36px] sm:min-h-[42px]"
                >
                  <Send className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span>Share</span>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
                <button
                  onClick={() => setShowPrintableComplaintModal(true)}
                  className="bg-gray-50 text-gray-700 border border-gray-200 py-2 px-2.5 sm:py-2.5 sm:px-3 rounded-lg text-xs sm:text-sm font-medium hover:bg-gray-100 hover:border-gray-300 transition-colors flex items-center justify-center space-x-1 sm:space-x-1.5 min-h-[36px] sm:min-h-[42px]"
                >
                  <FileText className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span>Printable Complaint</span>
                </button>

                <button
                  onClick={handleEmailAuthorities}
                  className="bg-gray-50 text-gray-700 border border-gray-200 py-2 px-2.5 sm:py-2.5 sm:px-3 rounded-lg text-xs sm:text-sm font-medium hover:bg-gray-100 hover:border-gray-300 transition-colors flex items-center justify-center space-x-1 sm:space-x-1.5 min-h-[36px] sm:min-h-[42px]"
                >
                  <Mail className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span>Email Authorities</span>
                </button>
              </div>

              {/* NEW ROW: Legal Notice and Leader-Giotag */}
              <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
                <button
                  onClick={handleLegalNotice}
                  className="bg-gray-50 text-gray-700 border border-gray-200 py-2 px-2.5 sm:py-2.5 sm:px-3 rounded-lg text-xs sm:text-sm font-medium hover:bg-gray-100 hover:border-gray-300 transition-colors flex items-center justify-center space-x-1 sm:space-x-1.5 min-h-[36px] sm:min-h-[42px]"
                >
                  <FileDown className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span>Legal Notice</span>
                </button>

                <button
                  onClick={handleLeaderGiotag}
                  className="bg-gray-50 text-gray-700 border border-gray-200 py-2 px-2.5 sm:py-2.5 sm:px-3 rounded-lg text-xs sm:text-sm font-medium hover:bg-gray-100 hover:border-gray-300 transition-colors flex items-center justify-center space-x-1 sm:space-x-1.5 min-h-[36px] sm:min-h-[42px]"
                >
                  <Image className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span>Leader-Giotag</span>
                </button>
              </div>
            </div>
          )}

          {isResolved && (
            <div className="pt-2 sm:pt-3 border-t border-gray-100">
              <div className="bg-green-50 border border-green-200 rounded-lg p-2.5 sm:p-3 text-center">
                <div className="flex items-center justify-center space-x-2 text-green-700">
                  <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span className="font-medium text-xs sm:text-sm">
                    This report has been resolved and is now view-only
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-green-600 mt-1">
                  All actions are disabled for resolved reports
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Printable Complaint Modal */}
      <PrintableComplaintModal
        report={report}
        isOpen={showPrintableComplaintModal}
        onClose={() => setShowPrintableComplaintModal(false)}
        imageUrl={imageUrl || null}
        formatLocationDisplay={formatLocationDisplay}
        formatDate={formatDate}
      />

      {/* Legal Notice Modal */}
      <LegalNoticeModal
        report={report}
        isOpen={showLegalNoticeModal}
        onClose={() => setShowLegalNoticeModal(false)}
        imageUrl={imageUrl || null}
        formatLocationDisplay={formatLocationDisplay}
        formatDate={formatDate}
      />

      {/* Full Photo Modal with Leader, Map, and Geotag Overlays - PERFECTLY MATCHING DOWNLOAD */}
      {showFullPhotoModal && imageUrl && (
        <div className="fixed inset-0 bg-black/95 flex items-center justify-center z-[1000] p-2 sm:p-4">
          <div className="relative max-w-6xl max-h-full w-full">
            {/* Download Button at Top - RENAMED */}
            <div className="absolute -top-10 sm:-top-12 left-0 right-0 flex items-center justify-between z-10">
              <button
                onClick={() => {
                  // Pre-select all available leaders by default
                  const allLeaders = getAvailableLeaders();
                  const allLeaderTypes = new Set(allLeaders.map((l) => l.type));
                  setSelectedLeaders(allLeaderTypes);
                  setShowLeaderSelectionModal(true);
                }}
                className="bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white px-2 py-1 sm:px-4 sm:py-2 rounded-lg font-medium flex items-center space-x-1 sm:space-x-2 transition-colors shadow-lg text-xs sm:text-sm border border-white/30"
              >
                <Download className="h-3 w-3 sm:h-4 sm:w-4" />
                <span>Leader-Giotag Photo Download</span>
              </button>
              <button
                onClick={() => setShowFullPhotoModal(false)}
                className="text-white hover:text-gray-300 transition-colors"
              >
                <X className="h-6 w-6 sm:h-8 sm:w-8" />
              </button>
            </div>
            <div className="relative bg-black rounded-lg overflow-hidden shadow-2xl">
              <img
                src={imageUrl}
                alt="Full size report photo"
                className="w-full h-auto max-h-[80vh] object-contain"
              />

              {/* Leader-Giotag Label - Always visible in bottom-right corner */}
              <div className="absolute bottom-2 right-2 bg-black/30 backdrop-blur-sm text-white px-2 py-1 rounded text-xs font-medium flex items-center space-x-1">
                <span>📍</span>
                <span>Leader-Giotag</span>
              </div>

              {/* Leader Overlay at Top - ALL PHOTOS ALIGNED AT SAME LEVEL */}
              <div
                className="absolute top-0 left-0 right-0"
                style={{
                  background:
                    "linear-gradient(to bottom, rgba(0, 0, 0, 0.65) 0%, rgba(0, 0, 0, 0.65) 50%, rgba(0, 0, 0, 0) 100%)",
                  padding: "clamp(8px, 1.5vw, 12px)",
                }}
              >
                <h3
                  className="text-white text-center font-bold mb-1 sm:mb-2"
                  style={{
                    fontSize: "clamp(12px, 2vw, 16px)",
                  }}
                >
                  Responsible leaders
                </h3>
                <div className="flex items-start justify-center gap-1.5 sm:gap-2 md:gap-3 max-w-5xl mx-auto px-2 flex-nowrap">
                  {/* PM */}
                  <div
                    className="flex flex-col items-center"
                    style={{ gap: "clamp(2px, 0.4vw, 4px)" }}
                  >
                    <div
                      className="rounded-full overflow-hidden border-2 border-white bg-gray-700 flex items-center justify-center flex-shrink-0"
                      style={{
                        width: "clamp(50px, 8vw, 80px)",
                        height: "clamp(50px, 8vw, 80px)",
                      }}
                    >
                      {getPmPhotoUrl() ? (
                        <LazyImage
                          src={getPmPhotoUrl()!}
                          alt="PM"
                          className="w-full h-full object-cover"
                          priority="high"
                        />
                      ) : (
                        <User
                          className="text-gray-400"
                          style={{ width: "40%", height: "40%" }}
                        />
                      )}
                    </div>
                    <div
                      className="text-white text-center"
                      style={{ maxWidth: "clamp(60px, 10vw, 90px)" }}
                    >
                      <p
                        className="font-bold leading-tight break-words"
                        style={{
                          fontSize: "clamp(9px, 1.4vw, 12px)",
                        }}
                      >
                        {getPmDisplayName()}
                      </p>
                      <p
                        className="opacity-90"
                        style={{
                          fontSize: "clamp(8px, 1.2vw, 10px)",
                          marginTop: "1px",
                        }}
                      >
                        PM
                      </p>
                    </div>
                  </div>

                  {/* CM */}
                  <div
                    className="flex flex-col items-center"
                    style={{ gap: "clamp(2px, 0.4vw, 4px)" }}
                  >
                    <div
                      className="rounded-full overflow-hidden border-2 border-white bg-gray-700 flex items-center justify-center flex-shrink-0"
                      style={{
                        width: "clamp(50px, 8vw, 80px)",
                        height: "clamp(50px, 8vw, 80px)",
                      }}
                    >
                      {getCmPhotoUrl() ? (
                        <LazyImage
                          src={getCmPhotoUrl()!}
                          alt="CM"
                          className="w-full h-full object-cover"
                          priority="high"
                        />
                      ) : (
                        <User
                          className="text-gray-400"
                          style={{ width: "40%", height: "40%" }}
                        />
                      )}
                    </div>
                    <div
                      className="text-white text-center"
                      style={{ maxWidth: "clamp(60px, 10vw, 90px)" }}
                    >
                      <p
                        className="font-bold leading-tight break-words"
                        style={{
                          fontSize: "clamp(9px, 1.4vw, 12px)",
                        }}
                      >
                        {getCmDisplayName()}
                      </p>
                      <p
                        className="opacity-90"
                        style={{
                          fontSize: "clamp(8px, 1.2vw, 10px)",
                          marginTop: "1px",
                        }}
                      >
                        CM
                      </p>
                    </div>
                  </div>

                  {/* MP */}
                  {shouldShowMpData() && (
                    <div
                      className="flex flex-col items-center"
                      style={{ gap: "clamp(2px, 0.4vw, 4px)" }}
                    >
                      <div
                        className="rounded-full overflow-hidden border-2 border-white bg-gray-700 flex items-center justify-center flex-shrink-0"
                        style={{
                          width: "clamp(50px, 8vw, 80px)",
                          height: "clamp(50px, 8vw, 80px)",
                        }}
                      >
                        {getMpPhotoUrl() ? (
                          <LazyImage
                            src={getMpPhotoUrl()!}
                            alt="MP"
                            className="w-full h-full object-cover"
                            priority="high"
                          />
                        ) : (
                          <User
                            className="text-gray-400"
                            style={{ width: "40%", height: "40%" }}
                          />
                        )}
                      </div>
                      <div
                        className="text-white text-center"
                        style={{ maxWidth: "clamp(60px, 10vw, 90px)" }}
                      >
                        <p
                          className="font-bold leading-tight break-words"
                          style={{
                            fontSize: "clamp(9px, 1.4vw, 12px)",
                          }}
                        >
                          {getMpDisplayName()}
                        </p>
                        <p
                          className="opacity-90"
                          style={{
                            fontSize: "clamp(8px, 1.2vw, 10px)",
                            marginTop: "1px",
                          }}
                        >
                          MP
                        </p>
                      </div>
                    </div>
                  )}

                  {/* MLA */}
                  {report.mlaName && (
                    <div
                      className="flex flex-col items-center"
                      style={{ gap: "clamp(2px, 0.4vw, 4px)" }}
                    >
                      <div
                        className="rounded-full overflow-hidden border-2 border-white bg-gray-700 flex items-center justify-center flex-shrink-0"
                        style={{
                          width: "clamp(50px, 8vw, 80px)",
                          height: "clamp(50px, 8vw, 80px)",
                        }}
                      >
                        {mlaImageUrl ? (
                          <LazyImage
                            src={mlaImageUrl}
                            alt="MLA"
                            className="w-full h-full object-cover"
                            priority="high"
                          />
                        ) : (
                          <User
                            className="text-gray-400"
                            style={{ width: "40%", height: "40%" }}
                          />
                        )}
                      </div>
                      <div
                        className="text-white text-center"
                        style={{ maxWidth: "clamp(60px, 10vw, 90px)" }}
                      >
                        <p
                          className="font-bold leading-tight break-words"
                          style={{
                            fontSize: "clamp(9px, 1.4vw, 12px)",
                          }}
                        >
                          {report.mlaName}
                        </p>
                        <p
                          className="opacity-90"
                          style={{
                            fontSize: "clamp(8px, 1.2vw, 10px)",
                            marginTop: "1px",
                          }}
                        >
                          {getMlaDesignationDisplay()}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Local Civic Body */}
                  {shouldShowLocalCivicBody() && (
                    <div
                      className="flex flex-col items-center"
                      style={{ gap: "clamp(2px, 0.4vw, 4px)" }}
                    >
                      <div
                        className="rounded-full overflow-hidden border-2 border-white bg-gray-700 flex items-center justify-center flex-shrink-0"
                        style={{
                          width: "clamp(50px, 8vw, 80px)",
                          height: "clamp(50px, 8vw, 80px)",
                        }}
                      >
                        {civicBodyPhotoUrl ? (
                          <LazyImage
                            src={civicBodyPhotoUrl}
                            alt="Civic Body"
                            className="w-full h-full object-cover"
                            priority="high"
                          />
                        ) : (
                          <User
                            className="text-gray-400"
                            style={{ width: "40%", height: "40%" }}
                          />
                        )}
                      </div>
                      <div
                        className="text-white text-center"
                        style={{ maxWidth: "clamp(60px, 10vw, 90px)" }}
                      >
                        <p
                          className="font-bold leading-tight break-words"
                          style={{
                            fontSize: "clamp(9px, 1.4vw, 12px)",
                          }}
                        >
                          {report.localCivicBody!.representativeName}
                        </p>
                        <p
                          className="opacity-90"
                          style={{
                            fontSize: "clamp(8px, 1.2vw, 10px)",
                            marginTop: "1px",
                          }}
                        >
                          {report.localCivicBody!.bodyType}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Address, Coordinates, Map, and Date Overlay at Bottom - INCREASED ADDRESS SIZE, MAP MOVED DOWN, RIGHT PADDING ADDED */}
              <div
                className="absolute bottom-0 left-0 right-0 text-white"
                style={{
                  background:
                    "linear-gradient(to top, rgba(0, 0, 0, 0.65) 0%, rgba(0, 0, 0, 0.65) 50%, rgba(0, 0, 0, 0) 100%)",
                  padding: "clamp(12px, 2.5vw, 20px)",
                }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div
                    className="flex-1 min-w-0"
                    style={{
                      paddingRight: staticMapUrl
                        ? "clamp(20px, 4vw, 40px)"
                        : "0",
                    }}
                  >
                    {/* Coordinates - LEFT-ALIGNED */}
                    <p
                      className="opacity-90 font-mono mb-1 sm:mb-2"
                      style={{
                        fontSize: "clamp(10px, 1.8vw, 14px)",
                      }}
                    >
                      {report.location.latitude.toFixed(6)},{" "}
                      {report.location.longitude.toFixed(6)}
                    </p>
                    {/* Date and Time - LEFT-ALIGNED */}
                    <p
                      className="opacity-95 mb-2 sm:mb-3"
                      style={{
                        fontSize: "clamp(12px, 2.2vw, 16px)",
                      }}
                    >
                      {formatDate(report.timestamp)}
                    </p>
                    {/* Address with pin icon - LEFT-ALIGNED with INCREASED FONT SIZE (24px) */}
                    <div className="flex items-start gap-1 sm:gap-2 mb-2 sm:mb-3">
                      <span style={{ fontSize: "clamp(16px, 3vw, 24px)" }}>
                        📍
                      </span>
                      <p
                        className="font-bold leading-tight flex-1 break-words"
                        style={{
                          fontSize: "clamp(14px, 2.8vw, 24px)",
                        }}
                      >
                        {formatLocationDisplay()}
                      </p>
                    </div>
                  </div>

                  {/* Static Map - 240x160 size, MOVED DOWN to bottom-align with timestamp - responsive with 0.9 opacity */}
                  {staticMapUrl && (
                    <div
                      className="flex-shrink-0 ml-2 sm:ml-4 self-end"
                      style={{
                        opacity: 0.9,
                        marginBottom: "clamp(0px, 0.5vw, 4px)",
                      }}
                    >
                      <img
                        src={staticMapUrl}
                        alt="Location map"
                        className="rounded border-2 border-white"
                        style={{
                          width: "clamp(120px, 28vw, 240px)",
                          height: "clamp(80px, 18.7vw, 160px)",
                          objectFit: "cover",
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Leader Selection Modal */}
      {showLeaderSelectionModal && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[1100] p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">
                  Select Leaders for Download
                </h3>
                <button
                  onClick={() => {
                    setShowLeaderSelectionModal(false);
                    setSelectedLeaders(new Set());
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <p className="text-sm text-gray-600 mb-4">
                Select leaders to include in the photo overlay with static map.
                All leaders are pre-selected by default:
              </p>

              <div className="space-y-3 mb-6">
                {getAvailableLeaders().map((leader) => (
                  <label
                    key={leader.type}
                    className="flex items-center space-x-3 p-3 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                    style={{
                      borderColor: selectedLeaders.has(leader.type)
                        ? "#3b82f6"
                        : "#e5e7eb",
                      backgroundColor: selectedLeaders.has(leader.type)
                        ? "#eff6ff"
                        : "transparent",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedLeaders.has(leader.type)}
                      onChange={(e) => {
                        const newSelected = new Set(selectedLeaders);
                        if (e.target.checked) {
                          newSelected.add(leader.type);
                        } else {
                          newSelected.delete(leader.type);
                        }
                        setSelectedLeaders(newSelected);
                      }}
                      className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                    />
                    <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-gray-300 bg-gray-100 flex items-center justify-center flex-shrink-0">
                      {leader.photoUrl ? (
                        <LazyImage
                          src={leader.photoUrl}
                          alt={leader.name}
                          className="w-full h-full object-cover"
                          priority="high"
                        />
                      ) : (
                        <User className="h-6 w-6 text-gray-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 truncate">
                        {leader.name}
                      </p>
                      <p className="text-sm text-gray-600">
                        {leader.designation}
                      </p>
                    </div>
                  </label>
                ))}
              </div>

              <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
                <span>Selected: {selectedLeaders.size} leader(s)</span>
                <span className="text-xs text-gray-500">
                  Includes static map with location pin
                </span>
              </div>

              <div className="flex items-center justify-end space-x-3">
                <button
                  onClick={generateDownloadImage}
                  disabled={isGeneratingDownload || selectedLeaders.size === 0}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium flex items-center space-x-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isGeneratingDownload ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                      <span>Generating...</span>
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4" />
                      <span>Leader-Giotag Photo Download</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Proof Photo Modal */}
      {showProofModal && proofImageUrl && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="relative max-w-4xl max-h-full">
            <button
              onClick={() => setShowProofModal(false)}
              className="absolute -top-10 right-0 text-white hover:text-gray-300 transition-colors"
            >
              <X className="h-8 w-8" />
            </button>
            <LazyImage
              src={proofImageUrl}
              alt="Resolution proof - full size"
              className="max-w-full max-h-full object-contain rounded-lg"
              priority="high"
            />
            <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-4 rounded-b-lg">
              <p className="text-center font-medium">Resolution Photo</p>
              {report.reporterName && (
                <div className="text-center text-sm opacity-90 flex items-center justify-center space-x-2">
                  <span>Resolved by: {report.reporterName}</span>
                  {isStatusUpdaterVerifiedVolunteer && (
                    <span title="Verified Volunteer">
                      <Award className="h-4 w-4 text-blue-600" />
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
