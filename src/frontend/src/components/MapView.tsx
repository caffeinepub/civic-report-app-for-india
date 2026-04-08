import { Link } from "@tanstack/react-router";
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  CheckCircle,
  Filter,
  Home,
  Layers,
  Loader2,
  MapPin,
  Maximize,
  MessageSquare,
  Minimize,
  Navigation,
  User,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import type { Report } from "../backend";
import { useFileUrl } from "../blob-storage/FileStorage";
import { useLanguage } from "../contexts/LanguageContext";
import { useGetAllReports } from "../hooks/useQueries";

// Leaflet imports
declare global {
  interface Window {
    L: any;
  }
}

interface CompactInfoCardProps {
  report: Report;
  imageUrl?: string;
  onClose: () => void;
}

function CompactInfoCard({
  report,
  imageUrl: _imageUrl,
  onClose,
}: CompactInfoCardProps) {
  const [staticMapUrl, setStaticMapUrl] = useState<string | null>(null);

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

  // Generate static map image using OpenStreetMap tiles
  useEffect(() => {
    const generateStaticMap = async () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = 280;
        canvas.height = 180;
        const ctx = canvas.getContext("2d");

        if (!ctx) return;

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
        ctx.fillRect(0, 0, 280, 180);

        // Calculate pixel position within the tile
        const pixelX = (((lon + 180) / 360) * n - xtile) * 256;
        const pixelY =
          (((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) /
            2) *
            n -
            ytile) *
          256;

        const centerX = 140;
        const centerY = 90;

        tilesToLoad.forEach((tile) => {
          const tileUrl = `https://tile.openstreetmap.org/${zoom}/${tile.x}/${tile.y}.png`;
          const img = new Image();
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
              ctx.strokeRect(0, 0, 280, 180);

              setStaticMapUrl(canvas.toDataURL("image/png"));
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
              ctx.strokeRect(0, 0, 280, 180);

              setStaticMapUrl(canvas.toDataURL("image/png"));
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

            setStaticMapUrl(canvas.toDataURL("image/png"));
          }
        }, 5000);
      } catch (error) {
        console.error("Error generating static map:", error);
      }
    };

    generateStaticMap();
  }, [report.location.latitude, report.location.longitude]);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-[1000] p-0 md:items-center md:p-4">
      <div className="bg-white rounded-t-xl md:rounded-xl w-full max-w-sm md:w-full shadow-2xl animate-slide-up md:animate-none">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Report Info</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors p-1 rounded-full hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Issue Type and Status */}
          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-orange-100 text-orange-700">
              {getIssueTypeEmoji(report.issueType)} {report.issueType}
            </span>
            <span
              className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium ${getStatusColor(report.status)}`}
            >
              {report.status.toLowerCase() === "resolved" ? (
                <CheckCircle className="h-3 w-3 mr-1" />
              ) : (
                <AlertCircle className="h-3 w-3 mr-1" />
              )}
              {getStatusDisplayText(report.status)}
            </span>
          </div>

          {/* Date & Time */}
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Calendar className="h-4 w-4 text-gray-500" />
            <span>{formatDate(report.timestamp)}</span>
          </div>

          {/* Static Map Window - Moved up slightly with transparency */}
          {staticMapUrl && (
            <div className="bg-gray-50/80 backdrop-blur-sm p-2 rounded-lg border border-gray-200">
              <img
                src={staticMapUrl}
                alt="Location map"
                className="w-full h-auto rounded border border-gray-300"
              />
            </div>
          )}

          {/* Location Coordinates and Address - Aligned left with INCREASED ADDRESS FONT SIZE */}
          <div className="flex items-start space-x-2 text-sm text-gray-600 bg-gray-50 p-2 rounded-lg">
            <MapPin className="h-4 w-4 text-gray-500 mt-0.5 flex-shrink-0" />
            <div className="flex-1 text-left">
              <p className="font-medium text-gray-700 mb-1">Location:</p>
              <p className="text-xs font-mono text-gray-600 text-left">
                {report.location.latitude.toFixed(6)},{" "}
                {report.location.longitude.toFixed(6)}
              </p>
              <p className="text-sm font-medium text-gray-700 mt-1 text-left">
                {report.address || "Address loading..."}
              </p>
            </div>
          </div>

          {/* View Full Details Button */}
          <Link
            to="/report/$reportId"
            params={{ reportId: report.id }}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors text-center block font-medium shadow-sm"
            onClick={() => {
              onClose();
              // Reset scroll position when navigating to report details
              setTimeout(() => {
                window.scrollTo({ top: 0, behavior: "smooth" });
              }, 100);
            }}
          >
            View Full Details
          </Link>
        </div>
      </div>
    </div>
  );
}

// Simplified component to handle individual marker image loading
function ReportMarker({
  report,
  onMarkerReady,
}: {
  report: Report;
  onMarkerReady: (report: Report, imageUrl: string | null) => void;
}) {
  const { data: imageUrl } = useFileUrl(report.photoPath);

  useEffect(() => {
    // Always call onMarkerReady, even if imageUrl is null
    onMarkerReady(report, imageUrl || null);
  }, [imageUrl, report, onMarkerReady]);

  return null;
}

export function MapView() {
  const { t: _t } = useLanguage();
  const { data: reports, isLoading, error } = useGetAllReports();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<Map<string, any>>(new Map());
  const markerClusterGroupRef = useRef<any>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [isClusteringLoaded, setIsClusteringLoaded] = useState(false);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);

  // Initialize filters to 'all' explicitly and ensure immediate application
  const [selectedIssueType, setSelectedIssueType] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [markerImages, setMarkerImages] = useState<Map<string, string | null>>(
    new Map(),
  );
  const [isInitialized, setIsInitialized] = useState(false);

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  // Load Leaflet and clustering plugin with proper error handling
  useEffect(() => {
    const loadLeafletWithClustering = async () => {
      try {
        setMapError(null);

        // Check if Leaflet is already loaded
        if (window.L && window.L.markerClusterGroup) {
          setIsMapLoaded(true);
          setIsClusteringLoaded(true);
          return;
        }

        // Load Leaflet CSS first
        if (!document.querySelector('link[href*="leaflet.css"]')) {
          const cssLink = document.createElement("link");
          cssLink.rel = "stylesheet";
          cssLink.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
          cssLink.integrity =
            "sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=";
          cssLink.crossOrigin = "";
          document.head.appendChild(cssLink);
        }

        // Load Leaflet JS if not already loaded
        if (!window.L) {
          const leafletScript = document.createElement("script");
          leafletScript.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
          leafletScript.integrity =
            "sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=";
          leafletScript.crossOrigin = "";

          await new Promise<void>((resolve, reject) => {
            leafletScript.onload = () => {
              console.log("Leaflet loaded successfully");
              resolve();
            };
            leafletScript.onerror = () => {
              reject(new Error("Failed to load Leaflet"));
            };
            document.head.appendChild(leafletScript);
          });
        }

        setIsMapLoaded(true);

        // Now load MarkerCluster CSS
        if (!document.querySelector('link[href*="MarkerCluster.css"]')) {
          const clusterCss = document.createElement("link");
          clusterCss.rel = "stylesheet";
          clusterCss.href =
            "https://unpkg.com/leaflet.markercluster@1.4.1/dist/MarkerCluster.css";
          document.head.appendChild(clusterCss);

          const clusterDefaultCss = document.createElement("link");
          clusterDefaultCss.rel = "stylesheet";
          clusterDefaultCss.href =
            "https://unpkg.com/leaflet.markercluster@1.4.1/dist/MarkerCluster.Default.css";
          document.head.appendChild(clusterDefaultCss);
        }

        // Load MarkerCluster JS and wait for it to be available
        if (!window.L.markerClusterGroup) {
          const clusterScript = document.createElement("script");
          clusterScript.src =
            "https://unpkg.com/leaflet.markercluster@1.4.1/dist/leaflet.markercluster.js";

          await new Promise<void>((resolve, reject) => {
            clusterScript.onload = () => {
              // Verify that markerClusterGroup is now available
              if (
                window.L &&
                typeof window.L.markerClusterGroup === "function"
              ) {
                console.log("Leaflet MarkerCluster loaded successfully");
                setIsClusteringLoaded(true);
                resolve();
              } else {
                reject(new Error("MarkerCluster plugin not properly loaded"));
              }
            };
            clusterScript.onerror = () => {
              reject(new Error("Failed to load MarkerCluster plugin"));
            };
            document.head.appendChild(clusterScript);
          });
        } else {
          setIsClusteringLoaded(true);
        }
      } catch (error) {
        console.error("Error loading Leaflet with clustering:", error);
        setMapError(
          error instanceof Error
            ? error.message
            : "Failed to load map libraries",
        );
      }
    };

    loadLeafletWithClustering();
  }, []);

  // Get user location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.log("Geolocation error:", error);
          // Default to India center
          setUserLocation({ lat: 20.5937, lng: 78.9629 });
        },
        { timeout: 5000, enableHighAccuracy: false },
      );
    } else {
      setUserLocation({ lat: 20.5937, lng: 78.9629 });
    }
  }, []);

  // Initialize map only after both Leaflet and clustering are loaded
  useEffect(() => {
    if (
      !isMapLoaded ||
      !isClusteringLoaded ||
      !mapRef.current ||
      !userLocation ||
      mapInstanceRef.current ||
      mapError
    ) {
      return;
    }

    try {
      console.log("Initializing map with clustering support");

      // Verify that all required Leaflet functions are available
      if (
        !window.L ||
        typeof window.L.map !== "function" ||
        typeof window.L.markerClusterGroup !== "function"
      ) {
        throw new Error("Leaflet or MarkerCluster not properly loaded");
      }

      const map = window.L.map(mapRef.current, {
        center: [userLocation.lat, userLocation.lng],
        zoom: 6,
        zoomControl: false,
        preferCanvas: true,
        renderer: window.L.canvas(),
      });

      // Add custom zoom controls
      window.L.control
        .zoom({
          position: "topright",
        })
        .addTo(map);

      // Add tile layer
      window.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
        maxZoom: 19,
        tileSize: 256,
        zoomOffset: 0,
        detectRetina: true,
      }).addTo(map);

      // Initialize marker cluster group with error handling
      try {
        markerClusterGroupRef.current = window.L.markerClusterGroup({
          chunkedLoading: true,
          chunkProgress: null,
          maxClusterRadius: 50,
          spiderfyOnMaxZoom: true,
          showCoverageOnHover: false,
          zoomToBoundsOnClick: true,
          iconCreateFunction: (cluster: any) => {
            const count = cluster.getChildCount();
            let size = "small";
            if (count > 10) size = "medium";
            if (count > 50) size = "large";

            return window.L.divIcon({
              html: `<div class="cluster-marker cluster-${size}"><span>${count}</span></div>`,
              className: "custom-cluster-icon",
              iconSize: window.L.point(40, 40),
            });
          },
        });

        map.addLayer(markerClusterGroupRef.current);
        console.log("Marker cluster group initialized successfully");
      } catch (clusterError) {
        console.error("Error initializing marker cluster group:", clusterError);
        setMapError(
          "Failed to initialize map clustering. Map will work without clustering.",
        );
        // Continue without clustering
      }

      mapInstanceRef.current = map;
      console.log("Map initialized successfully");
    } catch (error) {
      console.error("Error initializing map:", error);
      setMapError(
        error instanceof Error ? error.message : "Failed to initialize map",
      );
    }

    return () => {
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove();
          mapInstanceRef.current = null;
          markerClusterGroupRef.current = null;
        } catch (error) {
          console.error("Error cleaning up map:", error);
        }
      }
    };
  }, [isMapLoaded, isClusteringLoaded, userLocation, mapError]);

  // Explicitly initialize default filters and trigger immediate data loading
  useEffect(() => {
    if (reports && reports.length > 0 && !isInitialized) {
      console.log(
        "MapView: Initializing with default filters and immediate data loading",
      );

      // Explicitly set default filters to 'all' to ensure all reports are shown
      setSelectedIssueType("all");
      setSelectedStatus("all");

      // Mark as initialized to prevent re-initialization
      setIsInitialized(true);

      console.log(
        "MapView: Default filters applied, showing all",
        reports.length,
        "reports",
      );
    }
  }, [reports, isInitialized]);

  // Get unique issue types
  const issueTypes = useMemo(() => {
    if (!reports) return [];
    const types = [...new Set(reports.map((r) => r.issueType))];
    return types.sort();
  }, [reports]);

  // Filter reports - ensure all reports are shown when filters are 'all'
  const filteredReports = useMemo(() => {
    if (!reports) return [];

    // When both filters are 'all', return all reports immediately
    if (selectedIssueType === "all" && selectedStatus === "all") {
      console.log(
        "MapView: Showing all reports (no filters applied):",
        reports.length,
      );
      return reports;
    }

    let filtered = [...reports];

    // Apply filters only when they are explicitly changed from 'all'
    if (selectedIssueType !== "all") {
      filtered = filtered.filter(
        (report) => report.issueType === selectedIssueType,
      );
      console.log(
        "MapView: Filtered by issue type:",
        selectedIssueType,
        "showing",
        filtered.length,
        "reports",
      );
    }

    if (selectedStatus !== "all") {
      filtered = filtered.filter(
        (report) => report.status.toLowerCase() === selectedStatus,
      );
      console.log(
        "MapView: Filtered by status:",
        selectedStatus,
        "showing",
        filtered.length,
        "reports",
      );
    }

    return filtered;
  }, [reports, selectedIssueType, selectedStatus]);

  // Helper functions
  const getIssueTypeEmoji = useCallback((issueType: string) => {
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
  }, []);

  const getStatusColor = useCallback((status: string) => {
    const normalizedStatus = status.toLowerCase();
    switch (normalizedStatus) {
      case "submitted":
      case "open":
        return "#3b82f6"; // blue
      case "resolved":
        return "#10b981"; // green
      default:
        return "#6b7280"; // gray
    }
  }, []);

  // Create marker HTML without status indicators - clean and seamless display
  const createMarkerHTML = useCallback(
    (report: Report, imageUrl?: string) => {
      const statusColor = getStatusColor(report.status);
      const emoji = getIssueTypeEmoji(report.issueType);

      if (imageUrl) {
        return `
        <div style="
          width: 60px;
          height: 60px;
          border-radius: 50%;
          border: 3px solid ${statusColor};
          overflow: hidden;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
          background: white;
          cursor: pointer;
          position: relative;
          transition: transform 0.2s ease;
        " onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'">
          <img src="${imageUrl}" alt="${report.issueType}" style="
            width: 100%;
            height: 100%;
            object-fit: cover;
            display: block;
          " onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" />
          <div style="
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            display: none;
            align-items: center;
            justify-content: center;
            font-size: 24px;
            background: white;
          ">
            ${emoji}
          </div>
        </div>
      `;
      }
      return `
        <div style="
          width: 50px;
          height: 50px;
          border-radius: 50%;
          border: 3px solid ${statusColor};
          background: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
          cursor: pointer;
          position: relative;
          transition: transform 0.2s ease;
        " onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'">
          ${emoji}
        </div>
      `;
    },
    [getStatusColor, getIssueTypeEmoji],
  );

  // Handle marker image updates
  const handleMarkerReady = useCallback(
    (report: Report, imageUrl: string | null) => {
      setMarkerImages((prev) => {
        const newMap = new Map(prev);
        newMap.set(report.id, imageUrl);
        return newMap;
      });
    },
    [],
  );

  // Update markers when reports or images change - with proper error handling
  useEffect(() => {
    if (!mapInstanceRef.current || !reports || !isInitialized) return;

    console.log(
      "MapView: Updating markers for",
      filteredReports.length,
      "filtered reports",
    );

    try {
      // Clear existing markers
      if (markerClusterGroupRef.current) {
        markerClusterGroupRef.current.clearLayers();
      }
      markersRef.current.clear();

      // Add markers for filtered reports (or all reports when filters are 'all')
      filteredReports.forEach((report) => {
        try {
          const imageUrl = markerImages.get(report.id);
          const markerHTML = createMarkerHTML(report, imageUrl || undefined);

          const marker = window.L.marker(
            [report.location.latitude, report.location.longitude],
            {
              icon: window.L.divIcon({
                html: markerHTML,
                className: "custom-marker-icon",
                iconSize: imageUrl ? [60, 60] : [50, 50],
                iconAnchor: imageUrl ? [30, 30] : [25, 25],
              }),
            },
          );

          marker.on("click", () => {
            setSelectedReport(report);
          });

          // Add to cluster group if available, otherwise add directly to map
          if (markerClusterGroupRef.current) {
            markerClusterGroupRef.current.addLayer(marker);
          } else {
            marker.addTo(mapInstanceRef.current);
          }

          markersRef.current.set(report.id, marker);
        } catch (markerError) {
          console.error(
            "Error creating marker for report:",
            report.id,
            markerError,
          );
        }
      });

      // Auto-fit bounds immediately when showing all reports (default state)
      if (
        selectedIssueType === "all" &&
        selectedStatus === "all" &&
        filteredReports.length > 0
      ) {
        console.log(
          "MapView: Auto-fitting bounds to show all",
          filteredReports.length,
          "reports",
        );
        // Use immediate timeout for faster initial display
        setTimeout(() => {
          try {
            if (mapInstanceRef.current && markersRef.current.size > 0) {
              const group = new window.L.featureGroup(
                Array.from(markersRef.current.values()),
              );
              mapInstanceRef.current.fitBounds(group.getBounds().pad(0.1));
              console.log("MapView: Bounds fitted to show all markers");
            }
          } catch (boundsError) {
            console.error("Error fitting bounds:", boundsError);
          }
        }, 50); // Reduced from 100ms to 50ms for even faster response
      }
    } catch (error) {
      console.error("Error updating markers:", error);
      setMapError("Error updating map markers");
    }
  }, [
    reports,
    filteredReports,
    markerImages,
    createMarkerHTML,
    selectedIssueType,
    selectedStatus,
    isInitialized,
  ]);

  // Trigger immediate marker loading when map and reports are ready
  useEffect(() => {
    if (
      reports &&
      reports.length > 0 &&
      isMapLoaded &&
      isClusteringLoaded &&
      mapInstanceRef.current &&
      isInitialized
    ) {
      console.log(
        "MapView: Triggering immediate marker rendering for",
        reports.length,
        "reports",
      );

      // Force immediate marker update by triggering the marker effect
      const timeoutId = setTimeout(() => {
        console.log("MapView: Forcing marker update with current data");
        // This will trigger the marker update effect above
        setMarkerImages((prev) => new Map(prev));
      }, 10); // Very short timeout to ensure immediate execution

      return () => clearTimeout(timeoutId);
    }
  }, [reports, isMapLoaded, isClusteringLoaded, isInitialized]);

  // Handle filter changes
  const handleIssueTypeChange = useCallback((value: string) => {
    console.log("MapView: Issue type filter changed to:", value);
    setSelectedIssueType(value);
  }, []);

  const handleStatusChange = useCallback((value: string) => {
    console.log("MapView: Status filter changed to:", value);
    setSelectedStatus(value);
  }, []);

  // Center map on user location
  const centerOnUser = useCallback(() => {
    if (mapInstanceRef.current && userLocation) {
      try {
        mapInstanceRef.current.setView(
          [userLocation.lat, userLocation.lng],
          12,
        );
      } catch (error) {
        console.error("Error centering on user location:", error);
      }
    }
  }, [userLocation]);

  // Fit to all markers - enhanced to work immediately
  const fitToMarkers = useCallback(() => {
    try {
      if (mapInstanceRef.current && markersRef.current.size > 0) {
        const group = new window.L.featureGroup(
          Array.from(markersRef.current.values()),
        );
        mapInstanceRef.current.fitBounds(group.getBounds().pad(0.1));
        console.log("MapView: Manual fit to markers executed");
      } else if (mapInstanceRef.current && reports && reports.length > 0) {
        // Fallback: fit to all report locations even if markers aren't ready yet
        const bounds = window.L.latLngBounds();
        reports.forEach((report) => {
          bounds.extend([report.location.latitude, report.location.longitude]);
        });
        mapInstanceRef.current.fitBounds(bounds.pad(0.1));
        console.log("MapView: Manual fit to report bounds executed");
      }
    } catch (error) {
      console.error("Error fitting to markers:", error);
    }
  }, [reports]);

  // Toggle full-screen mode
  const toggleFullScreen = useCallback(() => {
    setIsFullScreen(!isFullScreen);
  }, [isFullScreen]);

  // Reset filters to show all reports - enhanced to ensure immediate display
  const resetFilters = useCallback(() => {
    console.log("MapView: Resetting filters to show all reports");
    setSelectedIssueType("all");
    setSelectedStatus("all");

    // Immediately fit to all markers after resetting filters
    setTimeout(() => {
      fitToMarkers();
    }, 50);
  }, [fitToMarkers]);

  // Handle navigation with scroll reset
  const handleNavigationClick = () => {
    // Reset scroll position to top
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Get image URL for selected report popup
  const { data: selectedReportImageUrl } = useFileUrl(
    selectedReport?.photoPath || "",
  );

  // Show loading state while libraries are loading
  if (isLoading || !isMapLoaded || !isClusteringLoaded) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-16 w-16 animate-spin text-orange-500 mx-auto mb-4" />
          <p className="text-gray-600 text-lg">
            {isLoading ? "Loading reports..." : "Loading map libraries..."}
          </p>
          {!isMapLoaded && (
            <p className="text-gray-500 text-sm mt-2">Loading Leaflet...</p>
          )}
          {isMapLoaded && !isClusteringLoaded && (
            <p className="text-gray-500 text-sm mt-2">
              Loading clustering support...
            </p>
          )}
        </div>
      </div>
    );
  }

  if (error || mapError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="text-7xl mb-4">❌</div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Error Loading Map
          </h1>
          <p className="text-gray-600 mb-6 text-lg">
            {mapError || "Failed to load map data. Please try again."}
          </p>
          <div className="space-y-3">
            <button
              onClick={() => {
                setMapError(null);
                window.location.reload();
              }}
              className="inline-flex items-center space-x-2 bg-blue-500 text-white py-3 px-6 rounded-lg hover:bg-blue-600 transition-colors text-lg font-medium"
            >
              <span>Retry</span>
            </button>
            <Link
              to="/"
              onClick={handleNavigationClick}
              className="inline-flex items-center space-x-2 bg-orange-500 text-white py-3 px-6 rounded-lg hover:bg-orange-600 transition-colors text-lg font-medium"
            >
              <ArrowLeft className="h-5 w-5" />
              <span>Back to Home</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`${isFullScreen ? "fixed inset-0 z-50 bg-gray-50" : "min-h-screen bg-gray-50"}`}
    >
      <div
        className={`${isFullScreen ? "h-full flex flex-col" : "container mx-auto px-4 max-w-7xl py-4 sm:py-8"}`}
      >
        {/* Load marker images for all reports - this ensures images are fetched immediately */}
        {reports &&
          reports.map((report) => (
            <ReportMarker
              key={report.id}
              report={report}
              onMarkerReady={handleMarkerReady}
            />
          ))}

        {/* Header - Mobile-Friendly Redesign - Consistent with Dashboard */}
        <div className={`${isFullScreen ? "hidden" : "block"}`}>
          <div className="mb-6 sm:mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="text-center sm:text-left">
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-1 sm:mb-2 leading-tight">
                  Map View
                </h1>
                <p className="text-sm sm:text-base lg:text-lg text-gray-600 leading-relaxed">
                  Interactive map with clean photo thumbnails
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <Link
                  to="/dashboard"
                  onClick={handleNavigationClick}
                  className="inline-flex items-center justify-center space-x-2 py-2.5 px-4 sm:py-2 sm:px-4 rounded-lg transition-colors font-medium text-sm sm:text-base min-h-[44px] sm:min-h-[40px] whitespace-nowrap bg-blue-600 text-white hover:bg-blue-700"
                >
                  <Layers className="h-4 w-4" />
                  <span>List View</span>
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
        </div>

        {/* Filters with Controls */}
        <div
          className={`${isFullScreen ? "hidden" : "bg-white rounded-lg shadow-md p-4 mb-6"}`}
        >
          <div className="flex items-center space-x-2 mb-4">
            <Filter className="h-5 w-5 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              Filters & Controls
            </h3>
            {(selectedIssueType !== "all" || selectedStatus !== "all") && (
              <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                Filters Active
              </span>
            )}
            {/* Show default state indicator */}
            {selectedIssueType === "all" && selectedStatus === "all" && (
              <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
                All Reports Visible
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Issue Type Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Issue Type
              </label>
              <select
                value={selectedIssueType}
                onChange={(e) => handleIssueTypeChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Types ({reports?.length || 0})</option>
                {issueTypes.map((type) => (
                  <option key={type} value={type}>
                    {type} (
                    {reports?.filter((r) => r.issueType === type).length || 0})
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={selectedStatus}
                onChange={(e) => handleStatusChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">
                  All Statuses ({reports?.length || 0})
                </option>
                <option value="open">
                  Open (
                  {reports?.filter(
                    (r) =>
                      r.status.toLowerCase() === "open" ||
                      r.status.toLowerCase() === "submitted",
                  ).length || 0}
                  )
                </option>
                <option value="resolved">
                  Resolved (
                  {reports?.filter((r) => r.status.toLowerCase() === "resolved")
                    .length || 0}
                  )
                </option>
              </select>
            </div>

            {/* Map Controls */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Map Controls
              </label>
              <div className="flex space-x-2">
                <button
                  onClick={centerOnUser}
                  className="flex-1 flex items-center justify-center space-x-1 bg-green-600 text-white py-2 px-3 rounded-lg hover:bg-green-700 transition-colors text-sm"
                >
                  <Navigation className="h-4 w-4" />
                  <span>My Location</span>
                </button>
                <button
                  onClick={fitToMarkers}
                  className="flex-1 flex items-center justify-center space-x-1 bg-purple-600 text-white py-2 px-3 rounded-lg hover:bg-purple-700 transition-colors text-sm"
                >
                  <ZoomIn className="h-4 w-4" />
                  <span>Fit All</span>
                </button>
              </div>
            </div>
          </div>

          {/* Active Filters Summary */}
          {(selectedIssueType !== "all" || selectedStatus !== "all") && (
            <div className="mt-4 flex items-center space-x-2">
              <span className="text-sm text-gray-600">Active filters:</span>
              {selectedIssueType !== "all" && (
                <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                  Type: {selectedIssueType}
                </span>
              )}
              {selectedStatus !== "all" && (
                <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                  Status: {selectedStatus}
                </span>
              )}
              <button
                onClick={resetFilters}
                className="text-xs text-red-600 hover:text-red-700 font-medium"
              >
                Show All Reports
              </button>
            </div>
          )}

          {/* Error Message */}
          {mapError && (
            <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <div className="flex items-start space-x-2">
                <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 shrink-0" />
                <div className="text-sm text-yellow-800">
                  <p className="font-medium">Map Warning:</p>
                  <p>{mapError}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Map Container - Mobile-Friendly Redesign */}
        <div
          className={`${isFullScreen ? "flex-1 flex flex-col" : "bg-white rounded-lg shadow-md overflow-hidden"}`}
        >
          {/* Map Header - Mobile-Optimized */}
          <div className="map-info-header">
            <div className="map-info-content">
              <div className="map-info-text">
                <h3 className="map-info-title">Interactive Reports Map</h3>
                <div className="map-info-count">
                  ({filteredReports.length} reports visible)
                  {selectedIssueType === "all" && selectedStatus === "all" && (
                    <span className="text-xs text-green-600 ml-2">
                      • All reports shown by default
                    </span>
                  )}
                </div>
              </div>
              <div className="map-info-indicators">
                <div className="map-status-indicator">
                  <div className="map-status-dot map-status-dot-open"></div>
                  <span className="map-status-text">Open</span>
                </div>
                <div className="map-status-indicator">
                  <div className="map-status-dot map-status-dot-resolved"></div>
                  <span className="map-status-text">Resolved</span>
                </div>
                {/* Full-Screen Toggle Button */}
                <button
                  onClick={toggleFullScreen}
                  className="map-fullscreen-toggle"
                  title={
                    isFullScreen ? "Exit full screen" : "Enter full screen"
                  }
                >
                  {isFullScreen ? (
                    <Minimize className="h-4 w-4" />
                  ) : (
                    <Maximize className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
          </div>

          <div
            ref={mapRef}
            className="map-container"
            style={{
              height: isFullScreen ? "calc(100vh - 80px)" : "600px",
              width: "100%",
            }}
          />
        </div>

        {/* Map Legend and Instructions - Hidden in Full Screen */}
        {!isFullScreen && (
          <div className="bg-white rounded-lg shadow-md p-4 mt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Map Legend & Instructions
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Marker Types</h4>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center space-x-3">
                    <div className="relative w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center border-2 border-white shadow-md">
                      <AlertCircle className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <span className="font-medium">Open Reports</span>
                      <p className="text-gray-600">
                        Photo thumbnails with blue border for open issues
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="relative w-12 h-12 rounded-full bg-green-500 flex items-center justify-center border-2 border-white shadow-md">
                      <CheckCircle className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <span className="font-medium">Resolved Reports</span>
                      <p className="text-gray-600">
                        Photo thumbnails with green border for resolved issues
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 rounded-full bg-orange-500 flex items-center justify-center text-white font-bold text-sm shadow-md">
                      5+
                    </div>
                    <div>
                      <span className="font-medium">Clustered Reports</span>
                      <p className="text-gray-600">
                        Multiple reports in the same area grouped together
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-3">How to Use</h4>
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-start space-x-2">
                    <MapPin className="h-4 w-4 text-gray-500 mt-0.5 shrink-0" />
                    <span>
                      All reports are automatically displayed when you first
                      open the map view
                    </span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <ZoomIn className="h-4 w-4 text-gray-500 mt-0.5 shrink-0" />
                    <span>
                      Click on any photo thumbnail marker to see a compact info
                      card with static map, coordinates, and address
                    </span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <CheckCircle className="h-4 w-4 text-gray-500 mt-0.5 shrink-0" />
                    <span>
                      Markers display cleanly with colored borders indicating
                      status: blue for open reports, green for resolved reports
                    </span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <Navigation className="h-4 w-4 text-gray-500 mt-0.5 shrink-0" />
                    <span>
                      Use "My Location" to center map on your current position
                    </span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <Layers className="h-4 w-4 text-gray-500 mt-0.5 shrink-0" />
                    <span>
                      Click "View Full Details" in the info card for complete
                      report information
                    </span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <Filter className="h-4 w-4 text-gray-500 mt-0.5 shrink-0" />
                    <span>
                      Use filters above to refine the view - all reports are
                      shown by default
                    </span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <Maximize className="h-4 w-4 text-gray-500 mt-0.5 shrink-0" />
                    <span>
                      Use the full-screen button for an immersive map experience
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Compact Info Card - Mobile Overlay with proper z-index */}
      {selectedReport && (
        <CompactInfoCard
          report={selectedReport}
          imageUrl={selectedReportImageUrl}
          onClose={() => setSelectedReport(null)}
        />
      )}
    </div>
  );
}
