import { Award, Check, Download, User } from "lucide-react";
import React, { useRef, useState } from "react";
import type { Report } from "../backend";
import { useFileUrl } from "../blob-storage/FileStorage";
import { useLanguage } from "../contexts/LanguageContext";
import {
  useGetCurrentLogo,
  useGetVolunteerDirectory,
} from "../hooks/useQueries";

interface CertificateGeneratorProps {
  report: Report;
  imageUrl?: string;
  onCertificateGenerated?: (dataUrl: string) => void;
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

interface LeaderOption {
  id: string;
  name: string;
  designation: string;
  photoUrl: string | null;
  constituency?: string;
}

export function CertificateGenerator({
  report,
  imageUrl,
  onCertificateGenerated,
}: CertificateGeneratorProps) {
  const { t } = useLanguage();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { data: mlaImageUrl } = useFileUrl(report.mlaPhotoPath || "");

  // Get PM/CM/MP photos EXCLUSIVELY from report's pmData, cmData, and mpData Representative objects
  const { data: pmPhotoUrl } = useFileUrl(report.pmData?.photoPath || "");
  const { data: cmPhotoUrl } = useFileUrl(report.cmData?.photoPath || "");
  const { data: mpPhotoUrl } = useFileUrl(report.mpData?.photoPath || "");

  // Get local civic body photo if available
  const { data: civicBodyPhotoUrl } = useFileUrl(
    report.localCivicBody?.photoPath || "",
  );

  const { data: currentLogo } = useGetCurrentLogo();
  const { data: volunteerDirectory } = useGetVolunteerDirectory();
  const [isGenerating, setIsGenerating] = useState(false);
  const [showLeaderSelection, setShowLeaderSelection] = useState(false);
  const [selectedLeaders, setSelectedLeaders] = useState<string[]>([]);

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

  // Check if local civic body should be displayed (all fields must be present)
  const shouldShowLocalCivicBody = () => {
    return (
      report.localCivicBody &&
      report.localCivicBody.bodyType &&
      report.localCivicBody.bodyName &&
      report.localCivicBody.representativeName &&
      report.localCivicBody.photoPath
    );
  };

  // Build available leaders list - ALWAYS include PM and CM with placeholders, and MP when data is present
  const availableLeaders: LeaderOption[] = React.useMemo(() => {
    const leaders: LeaderOption[] = [];

    // ALWAYS add PM (with placeholder if no data)
    leaders.push({
      id: "pm",
      name: report.pmData?.name || "Prime Minister",
      designation: "Prime Minister",
      photoUrl: pmPhotoUrl || null,
    });

    // ALWAYS add CM (with placeholder if no data)
    leaders.push({
      id: "cm",
      name: report.cmData?.name || "Chief Minister",
      designation: "Chief Minister",
      photoUrl: cmPhotoUrl || null,
    });

    // ALWAYS add MP when mpData is present (from report.mpData)
    if (report.mpData && report.mpData.name) {
      leaders.push({
        id: "mp",
        name: report.mpData.name,
        designation: "Member of Parliament",
        photoUrl: mpPhotoUrl || null,
        constituency: report.mpData.remarks || undefined,
      });
    }

    // Add MLA field if provided
    if (report.mlaName) {
      leaders.push({
        id: "mla",
        name: report.mlaName,
        designation: report.mlaDesignation === "MLA" ? "MLA" : "MLA",
        photoUrl: mlaImageUrl || null,
      });
    }

    // Only add local civic body if ALL fields are present
    if (shouldShowLocalCivicBody()) {
      leaders.push({
        id: "civic",
        name: report.localCivicBody!.representativeName,
        designation: `${report.localCivicBody!.bodyType} ${report.localCivicBody!.bodyName}`,
        photoUrl: civicBodyPhotoUrl || null,
      });
    }

    return leaders;
  }, [
    report,
    pmPhotoUrl,
    cmPhotoUrl,
    mpPhotoUrl,
    mlaImageUrl,
    civicBodyPhotoUrl,
  ]);

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

  const formatComprehensiveAddress = (locationData: LocationData): string[] => {
    const addressLines: string[] = [];

    const roadParts: string[] = [];
    if (locationData.house_number) roadParts.push(locationData.house_number);
    if (locationData.road) roadParts.push(locationData.road);
    if (roadParts.length > 0) {
      addressLines.push(roadParts.join(" "));
    }

    const areaParts: string[] = [];
    if (locationData.neighbourhood) areaParts.push(locationData.neighbourhood);
    else if (locationData.suburb) areaParts.push(locationData.suburb);
    else if (locationData.village) areaParts.push(locationData.village);

    if (areaParts.length > 0) {
      addressLines.push(areaParts.join(", "));
    }

    const cityParts: string[] = [];
    if (locationData.city) cityParts.push(locationData.city);
    else if (locationData.town) cityParts.push(locationData.town);
    else if (locationData.city_district)
      cityParts.push(locationData.city_district);

    if (locationData.county && !cityParts.includes(locationData.county)) {
      cityParts.push(locationData.county);
    } else if (
      locationData.state_district &&
      !cityParts.includes(locationData.state_district)
    ) {
      cityParts.push(locationData.state_district);
    }

    if (cityParts.length > 0) {
      addressLines.push(cityParts.join(", "));
    }

    const stateParts: string[] = [];
    if (locationData.state) stateParts.push(locationData.state);
    if (locationData.postcode) stateParts.push(locationData.postcode);

    if (stateParts.length > 0) {
      addressLines.push(stateParts.join(" - "));
    }

    return addressLines;
  };

  const loadImageFromUrl = async (
    src: string,
    timeout = 15000,
  ): Promise<HTMLImageElement | null> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = "anonymous";

      const timeoutId = setTimeout(() => {
        console.warn(`Image load timeout for: ${src}`);
        resolve(null);
      }, timeout);

      img.onload = () => {
        clearTimeout(timeoutId);
        resolve(img);
      };

      img.onerror = (error) => {
        clearTimeout(timeoutId);
        console.error(`Failed to load image: ${src}`, error);
        resolve(null);
      };

      img.src = src;
    });
  };

  const generateQRCode = async (text: string): Promise<string> => {
    try {
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=168x168&data=${encodeURIComponent(text)}`;
      return qrUrl;
    } catch (error) {
      console.error("Error generating QR code:", error);
      return "";
    }
  };

  const drawLogoFromDataUrl = async (
    ctx: CanvasRenderingContext2D,
    dataUrl: string,
    x: number,
    y: number,
    size: number,
  ): Promise<void> => {
    try {
      const logoImg = await loadImageFromUrl(dataUrl, 10000);
      if (logoImg) {
        const aspectRatio = logoImg.width / logoImg.height;
        let drawWidth = size;
        let drawHeight = size;
        let drawX = x;
        let drawY = y;

        if (aspectRatio > 1) {
          drawHeight = size / aspectRatio;
          drawY = y + (size - drawHeight) / 2;
        } else {
          drawWidth = size * aspectRatio;
          drawX = x + (size - drawWidth) / 2;
        }

        ctx.drawImage(logoImg, drawX, drawY, drawWidth, drawHeight);
      } else {
        drawPlaceholderLogo(ctx, x, y, size);
      }
    } catch (error) {
      console.error("Error drawing logo:", error);
      drawPlaceholderLogo(ctx, x, y, size);
    }
  };

  const drawPlaceholderLogo = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    size: number,
  ) => {
    ctx.save();

    ctx.fillStyle = "#d1d5db";
    ctx.beginPath();
    ctx.arc(x + size / 2, y + size / 2, size / 2, 0, 2 * Math.PI);
    ctx.fill();

    ctx.fillStyle = "#9ca3af";
    ctx.beginPath();
    ctx.arc(x + size / 2, y + size / 2, size / 3, 0, 2 * Math.PI);
    ctx.fill();

    ctx.restore();
  };

  /**
   * Draws an image with object-fit: cover behavior - fills the entire area without distortion
   * by cropping the image intelligently to match the target aspect ratio
   */
  const drawImageCover = (
    ctx: CanvasRenderingContext2D,
    img: HTMLImageElement | null,
    x: number,
    y: number,
    width: number,
    height: number,
    placeholderText: string,
  ) => {
    if (img) {
      // Calculate aspect ratios
      const imgAspectRatio = img.width / img.height;
      const targetAspectRatio = width / height;

      let sourceX = 0;
      let sourceY = 0;
      let sourceWidth = img.width;
      let sourceHeight = img.height;

      // Use object-fit: cover logic - crop the image to fill the entire area
      if (imgAspectRatio > targetAspectRatio) {
        // Image is wider than target - crop sides
        sourceWidth = img.height * targetAspectRatio;
        sourceX = (img.width - sourceWidth) / 2;
      } else {
        // Image is taller than target - crop top/bottom
        sourceHeight = img.width / targetAspectRatio;
        sourceY = (img.height - sourceHeight) / 2;
      }

      // Draw the cropped portion of the image to fill the entire target area
      ctx.drawImage(
        img,
        sourceX,
        sourceY,
        sourceWidth,
        sourceHeight,
        x,
        y,
        width,
        height,
      );

      // Add a subtle border
      ctx.strokeStyle = "#d1d5db";
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, width, height);
    } else {
      // Draw placeholder
      ctx.fillStyle = "#f9fafb";
      ctx.fillRect(x, y, width, height);
      ctx.strokeStyle = "#d1d5db";
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, width, height);

      ctx.fillStyle = "#6b7280";
      ctx.font = "16px Arial";
      ctx.textAlign = "center";
      const lines = placeholderText.split("\n");
      const lineHeight = 20;
      const startY = y + height / 2 - (lines.length * lineHeight) / 2;

      lines.forEach((line, index) => {
        ctx.fillText(line, x + width / 2, startY + index * lineHeight);
      });
    }
  };

  const drawVolunteerBadge = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    size = 16,
  ) => {
    ctx.save();

    ctx.fillStyle = "#3b82f6";
    ctx.strokeStyle = "#3b82f6";
    ctx.lineWidth = 1.5;

    const centerX = x + size / 2;
    const centerY = y + size / 2;
    const radius = size * 0.3;

    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(centerX - radius * 0.7, centerY + radius * 0.8);
    ctx.lineTo(centerX + radius * 0.7, centerY + radius * 0.8);
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius * 0.4, 0, 2 * Math.PI);
    ctx.fill();

    ctx.restore();
  };

  const generateCertificate = async (leadersToShow: LeaderOption[]) => {
    const canvas = canvasRef.current;
    if (!canvas || !imageUrl) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    setIsGenerating(true);

    try {
      canvas.width = 1200;
      canvas.height = 1800;

      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const margin = 60;
      const contentWidth = canvas.width - 2 * margin;

      const logoY = margin + 20;
      if (currentLogo && (currentLogo as string).trim() !== "") {
        await drawLogoFromDataUrl(
          ctx,
          currentLogo as string,
          margin,
          logoY,
          80,
        );
      } else {
        drawPlaceholderLogo(ctx, margin, logoY, 80);
      }

      const constitutionalTextY = logoY + 120;

      ctx.fillStyle = "#6b7280";
      ctx.font = "18px Arial";
      ctx.textAlign = "left";
      ctx.fillText("WE, THE PEOPLE OF INDIA", margin, constitutionalTextY);

      ctx.fillStyle = "#6b7280";
      ctx.font = "16px Arial";
      ctx.fillText("हम, भारत के लोग", margin, constitutionalTextY + 30);

      const certificateHeaderY = constitutionalTextY + 80;

      ctx.fillStyle = "#1f2937";
      ctx.font = "bold 36px Arial";
      ctx.fillText(t("certificate.title"), margin, certificateHeaderY);

      ctx.fillStyle = "#4b5563";
      ctx.font = "24px Arial";
      ctx.fillText(
        t("certificate.titleHindi"),
        margin,
        certificateHeaderY + 40,
      );

      const mainSectionY = certificateHeaderY + 100;

      let locationDisplay: string[] = [];
      if (report.customAddress) {
        locationDisplay = [report.customAddress];
      } else {
        const locationData = await fetchLocationData(
          report.location.latitude,
          report.location.longitude,
        );
        locationDisplay = formatComprehensiveAddress(locationData);
      }

      const imageLoadPromises = [loadImageFromUrl(imageUrl, 10000)];

      // Load selected leader images
      const leaderImagePromises = leadersToShow.map((leader) =>
        leader.photoUrl
          ? loadImageFromUrl(leader.photoUrl, 15000)
          : Promise.resolve(null),
      );

      const [reportImg, ...leaderImages] = await Promise.all([
        ...imageLoadPromises,
        ...leaderImagePromises,
      ]);

      const leftColumnWidth = contentWidth * 0.45;
      const rightColumnX = margin + leftColumnWidth + 40;
      const rightColumnWidth = contentWidth * 0.5;

      const issuePhotoWidth = rightColumnWidth;
      const issuePhotoHeight = 750;
      const issuePhotoY = certificateHeaderY;

      ctx.fillStyle = "#1f2937";
      ctx.font = "bold 20px Arial";
      ctx.textAlign = "left";
      ctx.fillText("REPORTED ISSUE", rightColumnX, issuePhotoY - 10);

      // Use object-fit: cover logic for the main report image
      drawImageCover(
        ctx,
        reportImg,
        rightColumnX,
        issuePhotoY + 10,
        issuePhotoWidth,
        issuePhotoHeight,
        "Report\nImage",
      );

      let detailsY = mainSectionY + 20;

      ctx.fillStyle = "#1f2937";
      ctx.font = "bold 24px Arial";
      ctx.textAlign = "left";
      ctx.fillText(t("certificate.reportDetails"), margin, detailsY);
      detailsY += 50;

      ctx.font = "18px Arial";
      ctx.fillStyle = "#374151";

      ctx.fillText(
        `${t("certificate.reportId")} ${report.id}`,
        margin,
        detailsY,
      );
      detailsY += 40;

      const date = new Date(Number(report.timestamp) / 1000000);
      ctx.fillText(
        `${t("certificate.date")} ${date.toLocaleDateString("en-IN")}`,
        margin,
        detailsY,
      );
      detailsY += 35;
      ctx.fillText(
        `${t("certificate.time")} ${date.toLocaleTimeString("en-IN")}`,
        margin,
        detailsY,
      );
      detailsY += 40;

      ctx.fillText(
        `${t("certificate.issueType")} ${report.issueType}`,
        margin,
        detailsY,
      );
      detailsY += 40;

      if (report.username) {
        const reportedByText = `${t("certificate.reportedBy")} ${report.username}`;
        ctx.fillText(reportedByText, margin, detailsY);

        if (isReporterVerifiedVolunteer) {
          const textWidth = ctx.measureText(reportedByText).width;
          const badgeX = margin + textWidth + 10;
          const badgeY = detailsY - 16;

          drawVolunteerBadge(ctx, badgeX, badgeY, 16);
        }

        detailsY += 40;
      }

      ctx.fillStyle = "#1f2937";
      ctx.font = "bold 22px Arial";
      ctx.fillText(t("certificate.location"), margin, detailsY);
      detailsY += 40;

      ctx.font = "18px Arial";
      ctx.fillStyle = "#374151";

      if (locationDisplay.length > 0) {
        locationDisplay.forEach((line) => {
          if (line.trim()) {
            ctx.fillText(line, margin, detailsY);
            detailsY += 35;
          }
        });
      }

      const coordinatesText = `${report.location.latitude.toFixed(6)}, ${report.location.longitude.toFixed(6)}`;
      ctx.fillText(
        `${t("certificate.coordinates")} ${coordinatesText}`,
        margin,
        detailsY,
      );
      detailsY += 50;

      if (report.notes) {
        ctx.fillStyle = "#1f2937";
        ctx.font = "bold 22px Arial";
        ctx.fillText(t("certificate.notes"), margin, detailsY);
        detailsY += 40;

        ctx.font = "18px Arial";
        ctx.fillStyle = "#374151";

        const words = report.notes.split(" ");
        let line = "";
        const maxWidth = leftColumnWidth - 20;

        for (const word of words) {
          const testLine = line + word + " ";
          const metrics = ctx.measureText(testLine);

          if (metrics.width > maxWidth && line !== "") {
            ctx.fillText(line, margin, detailsY);
            line = word + " ";
            detailsY += 35;
          } else {
            line = testLine;
          }
        }

        if (line) {
          ctx.fillText(line, margin, detailsY);
          detailsY += 35;
        }
      }

      const ministersY = issuePhotoY + issuePhotoHeight + 80;

      ctx.fillStyle = "#1f2937";
      ctx.font = "bold 20px Arial";
      ctx.textAlign = "left";
      ctx.fillText("RESPONSIBLE LEADERS", rightColumnX, ministersY);

      const ministerPhotoWidth = 140;
      const ministerPhotoHeight = 180;
      const ministerSpacing = 60;
      const totalMinisterWidth =
        leadersToShow.length * ministerPhotoWidth +
        (leadersToShow.length - 1) * ministerSpacing;
      const ministerStartX =
        rightColumnX + (issuePhotoWidth - totalMinisterWidth) / 2;
      const ministerPhotoY = ministersY + 40;

      // Draw selected leaders with object-fit: cover logic
      leadersToShow.forEach((leader, index) => {
        const leaderX =
          ministerStartX + index * (ministerPhotoWidth + ministerSpacing);
        const leaderImg = leaderImages[index];

        // Use object-fit: cover logic for leader photos
        drawImageCover(
          ctx,
          leaderImg,
          leaderX,
          ministerPhotoY,
          ministerPhotoWidth,
          ministerPhotoHeight,
          `${leader.designation}\nPhoto`,
        );

        ctx.fillStyle = "#1f2937";
        ctx.font = "bold 16px Arial";
        ctx.textAlign = "center";
        ctx.fillText(
          leader.designation.toUpperCase(),
          leaderX + ministerPhotoWidth / 2,
          ministerPhotoY + ministerPhotoHeight + 20,
        );
        ctx.font = "14px Arial";
        ctx.fillText(
          leader.name,
          leaderX + ministerPhotoWidth / 2,
          ministerPhotoY + ministerPhotoHeight + 40,
        );

        // Display constituency if available (for MP)
        if (leader.constituency) {
          ctx.font = "12px Arial";
          ctx.fillStyle = "#6b7280";
          ctx.fillText(
            leader.constituency,
            leaderX + ministerPhotoWidth / 2,
            ministerPhotoY + ministerPhotoHeight + 58,
          );
        }
      });

      const verificationUrl = `${window.location.origin}/verify/${report.id}`;
      const qrCodeUrl = await generateQRCode(verificationUrl);
      const qrSize = 140;
      const qrX = margin;
      const qrY = ministerPhotoY;

      if (qrCodeUrl) {
        const qrImg = await loadImageFromUrl(qrCodeUrl, 10000);
        if (qrImg) {
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(qrX - 5, qrY - 5, qrSize + 10, qrSize + 10);
          ctx.strokeStyle = "#d1d5db";
          ctx.lineWidth = 1;
          ctx.strokeRect(qrX - 5, qrY - 5, qrSize + 10, qrSize + 10);

          ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);

          ctx.fillStyle = "#374151";
          ctx.font = "bold 16px Arial";
          ctx.textAlign = "left";
          ctx.fillText(t("certificate.verify"), qrX, qrY + qrSize + 25);
          ctx.font = "14px Arial";
          ctx.fillText(t("certificate.scanQr"), qrX, qrY + qrSize + 45);

          const urlText = verificationUrl;
          const maxUrlWidth = leftColumnWidth - 20;
          ctx.font = "12px Arial";
          if (ctx.measureText(urlText).width > maxUrlWidth) {
            const urlParts = urlText.split("/");
            let currentLine = "";
            let currentY = qrY + qrSize + 65;

            for (const part of urlParts) {
              const testLine = currentLine + (currentLine ? "/" : "") + part;
              if (
                ctx.measureText(testLine).width > maxUrlWidth &&
                currentLine
              ) {
                ctx.fillText(currentLine, qrX, currentY);
                currentLine = part;
                currentY += 15;
              } else {
                currentLine = testLine;
              }
            }
            if (currentLine) {
              ctx.fillText(currentLine, qrX, currentY);
            }
          } else {
            ctx.fillText(urlText, qrX, qrY + qrSize + 65);
          }
        }
      }

      const statementY = ministerPhotoY + ministerPhotoHeight + 140;
      ctx.fillStyle = "#4b5563";
      ctx.font = "16px Arial";
      ctx.textAlign = "center";
      ctx.fillText(t("certificate.statement"), canvas.width / 2, statementY);
      ctx.fillText(
        t("certificate.initiative"),
        canvas.width / 2,
        statementY + 30,
      );

      const disclaimerY = statementY + 100;
      ctx.fillStyle = "#6b7280";
      ctx.font = "11px Arial";
      ctx.textAlign = "center";

      const disclaimerLines = [
        t("certificate.disclaimer.title"),
        t("certificate.disclaimer.text1"),
        t("certificate.disclaimer.text2"),
        t("certificate.disclaimer.text3"),
      ];

      disclaimerLines.forEach((line, index) => {
        if (index === 0) {
          ctx.font = "bold 11px Arial";
          ctx.fillStyle = "#4b5563";
        } else {
          ctx.font = "11px Arial";
          ctx.fillStyle = "#6b7280";
        }
        ctx.fillText(line, canvas.width / 2, disclaimerY + index * 18);
      });

      if (report.status.toLowerCase() === "resolved" && report.reporterName) {
        const resolutionY = detailsY + 50;

        ctx.fillStyle = "#1f2937";
        ctx.font = "bold 22px Arial";
        ctx.textAlign = "left";
        ctx.fillText("RESOLUTION DETAILS", margin, resolutionY);

        ctx.font = "18px Arial";
        ctx.fillStyle = "#374151";

        const resolvedByText = `Resolved by: ${report.reporterName}`;
        ctx.fillText(resolvedByText, margin, resolutionY + 40);

        if (isStatusUpdaterVerifiedVolunteer) {
          const textWidth = ctx.measureText(resolvedByText).width;
          const badgeX = margin + textWidth + 10;
          const badgeY = resolutionY + 40 - 16;

          drawVolunteerBadge(ctx, badgeX, badgeY, 16);
        }

        if (report.completionNotes) {
          ctx.fillText(
            `Notes: ${report.completionNotes}`,
            margin,
            resolutionY + 80,
          );
        }
      }

      const dataUrl = canvas.toDataURL("image/png");
      if (onCertificateGenerated) {
        onCertificateGenerated(dataUrl);
      }
      return dataUrl;
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = async () => {
    // Always show selection modal for all reports
    setShowLeaderSelection(true);
    // Default to first 3 leaders (or all if less than 3)
    const defaultSelection = availableLeaders
      .slice(0, Math.min(3, availableLeaders.length))
      .map((l) => l.id);
    setSelectedLeaders(defaultSelection);
  };

  const handleConfirmSelection = async () => {
    const leadersToShow = availableLeaders.filter((l) =>
      selectedLeaders.includes(l.id),
    );
    setShowLeaderSelection(false);

    const dataUrl = await generateCertificate(leadersToShow);
    if (!dataUrl) return;

    const link = document.createElement("a");
    link.download = `civics-issue-report-certificate-${report.id}.png`;
    link.href = dataUrl;
    link.click();
  };

  const toggleLeaderSelection = (leaderId: string) => {
    setSelectedLeaders((prev) => {
      if (prev.includes(leaderId)) {
        return prev.filter((id) => id !== leaderId);
      }
      if (prev.length < 3) {
        return [...prev, leaderId];
      }
      return prev;
    });
  };

  return (
    <>
      <canvas ref={canvasRef} className="hidden" />
      <button
        onClick={handleDownload}
        disabled={isGenerating}
        className="bg-gray-50 text-gray-700 border border-gray-200 py-2 px-2.5 sm:py-2.5 sm:px-3 rounded-lg text-xs sm:text-sm font-medium hover:bg-gray-100 hover:border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-1 sm:space-x-1.5 min-h-[36px] sm:min-h-[42px]"
      >
        <Download className="h-3 w-3 sm:h-4 sm:w-4" />
        <span>{isGenerating ? "Generating..." : "Certificate"}</span>
      </button>

      {/* Leader Selection Modal */}
      {showLeaderSelection && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000] p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Select Leaders for Certificate
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Choose up to 3 responsible leaders to display on the certificate:
            </p>

            <div className="space-y-2 mb-6">
              {availableLeaders.map((leader) => (
                <button
                  key={leader.id}
                  onClick={() => toggleLeaderSelection(leader.id)}
                  className={`w-full flex items-center justify-between p-3 rounded-lg border-2 transition-all ${
                    selectedLeaders.includes(leader.id)
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center flex-shrink-0">
                      {leader.photoUrl ? (
                        <img
                          src={leader.photoUrl}
                          alt={leader.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="h-5 w-5 text-gray-400" />
                      )}
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-gray-900 text-sm">
                        {leader.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {leader.designation}
                      </p>
                      {leader.constituency && (
                        <p className="text-xs text-gray-400">
                          {leader.constituency}
                        </p>
                      )}
                    </div>
                  </div>
                  {selectedLeaders.includes(leader.id) && (
                    <Check className="h-5 w-5 text-blue-600" />
                  )}
                </button>
              ))}
            </div>

            <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
              <span>Selected: {selectedLeaders.length}/3</span>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => setShowLeaderSelection(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmSelection}
                disabled={
                  selectedLeaders.length === 0 || selectedLeaders.length > 3
                }
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Generate Certificate
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
