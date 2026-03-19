import React, { useState, useMemo, useCallback } from 'react';
import { Edit, Trash2, Save, X, Upload, Eye, User, MapPin, Calendar, Hash, CheckCircle, AlertCircle, ImageIcon, Edit3, Check, Loader2, AlertTriangle, Camera, ChevronLeft, ChevronRight, Droplets, Waves, Building2, ChevronDown, ChevronUp } from 'lucide-react';
import { Report, Representative, LocalCivicBody } from '../backend';
import { useFileUrl, useFileUpload } from '../blob-storage/FileStorage';
import { useDeleteReport, useUpdateReport, useUpdateReportStatus, useGetDirectory } from '../hooks/useQueries';

interface AdminReportsTableProps {
  reports: Report[];
}

interface EditingReport {
  id: string;
  issueType: string;
  customIssueType: string;
  status: string;
  username: string;
  notes: string;
  mlaName: string;
  address: string;
  pmName: string;
  cmName: string;
  reporterName: string;
  completionNotes: string;
  latitude: number;
  longitude: number;
  civicBodyType: string;
  civicBodyName: string;
  civicBodyRepName: string;
  mpState: string;
  mpConstituency: string;
  newMainPhoto?: File;
  newMlaPhoto?: File;
  newProofPhoto?: File;
  newPmPhoto?: File;
  newCmPhoto?: File;
  newCivicBodyPhoto?: File;
  newMpPhoto?: File;
  newMainPhotoPreview?: string;
  newMlaPhotoPreview?: string;
  newProofPhotoPreview?: string;
  newPmPhotoPreview?: string;
  newCmPhotoPreview?: string;
  newCivicBodyPhotoPreview?: string;
  newMpPhotoPreview?: string;
  selectedPmFromDirectory?: Representative;
  selectedCmFromDirectory?: Representative;
  selectedMpFromDirectory?: Representative;
}

// Predefined issue types from the report form - UPDATED with distinct icons
const predefinedIssueTypes = [
  { value: 'Pothole', emoji: '🕳️', icon: null },
  { value: 'Roadside Garbage', emoji: '🗑️', icon: null },
  { value: 'Broken Streetlight', emoji: '💡', icon: null },
  { value: 'Waterlogging', emoji: null, icon: <Droplets className="h-5 w-5 text-blue-500" /> },
  { value: 'Flood', emoji: null, icon: <Waves className="h-5 w-5 text-blue-600" /> },
  { value: 'Illegal Dumping', emoji: '🚯', icon: null },
  { value: 'Illegal Parking', emoji: '🚗', icon: null },
  { value: 'Other', emoji: '❓', icon: null }
];

// Civic body types
const civicBodyTypes = [
  { value: 'Municipal Corporation', label: 'Municipal Corporation (Mahanagar Palika)' },
  { value: 'Municipality', label: 'Municipality (Nagar Palika/Municipal Council)' },
  { value: 'Nagar Panchayat', label: 'Nagar Panchayat' },
  { value: 'Zilla Parishad', label: 'Zilla Parishad' },
  { value: 'Panchayat Samiti', label: 'Panchayat Samiti/Block Panchayat' },
  { value: 'Gram Panchayat', label: 'Gram Panchayat' }
];

// Leaflet imports
declare global {
  interface Window {
    L: any;
  }
}

export function AdminReportsTable({ reports }: AdminReportsTableProps) {
  const [editingReportId, setEditingReportId] = useState<string | null>(null);
  const [editingData, setEditingData] = useState<EditingReport | null>(null);
  const [showFullPhotoModal, setShowFullPhotoModal] = useState<{ reportId: string; imageUrl: string; type: string } | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(0);
  const [reportsPerPage, setReportsPerPage] = useState(5);
  
  // Resolution form state for admin status changes
  const [showResolutionForm, setShowResolutionForm] = useState<string | null>(null);
  const [resolutionFormData, setResolutionFormData] = useState({
    reporterName: '',
    notes: '',
    proofPhoto: null as File | null,
    proofPhotoPreview: null as string | null
  });
  
  // Location modal state for admin editing
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [mapInstance, setMapInstance] = useState<any>(null);
  const [selectedLocation, setSelectedLocation] = useState<{lat: number, lng: number} | null>(null);
  const [isLoadingSelectedLocation, setIsLoadingSelectedLocation] = useState(false);
  const mapModalRef = React.useRef<HTMLDivElement>(null);
  
  // Resolution details expansion state - track per report ID
  const [expandedResolutions, setExpandedResolutions] = useState<Set<string>>(new Set());
  
  const { uploadFile, isUploading } = useFileUpload();
  const { mutate: deleteReport, isPending: isDeleting } = useDeleteReport();
  const { mutate: updateReport, isPending: isUpdating } = useUpdateReport();
  const { mutate: updateReportStatus, isPending: isUpdatingStatus } = useUpdateReportStatus();
  
  // Get directory for PM/CM/MP dropdowns
  const { data: directory } = useGetDirectory();

  // Calculate paginated reports
  const paginatedReports = useMemo(() => {
    const startIndex = currentPage * reportsPerPage;
    const endIndex = startIndex + reportsPerPage;
    return reports.slice(startIndex, endIndex);
  }, [reports, currentPage, reportsPerPage]);

  const totalPages = Math.ceil(reports.length / reportsPerPage);

  // Get all PMs from directory
  const allPMs = useMemo(() => {
    if (!directory) return [];
    const pms: Representative[] = [];
    if (directory.primeMinister) {
      pms.push(directory.primeMinister);
    }
    return pms;
  }, [directory]);

  // Get all CMs from directory
  const allCMs = useMemo(() => {
    if (!directory) return [];
    const cms: Representative[] = [];
    directory.states.forEach(state => {
      if (state.cm) {
        cms.push(state.cm);
      }
    });
    directory.unionTerritories.forEach(ut => {
      if (ut.cm) {
        cms.push(ut.cm);
      }
    });
    return cms;
  }, [directory]);

  // Get all states from directory
  const allStates = useMemo(() => {
    if (!directory) return [];
    return directory.states.map(state => state.name);
  }, [directory]);

  // Get constituencies for selected state
  const getConstituenciesForState = useCallback((stateName: string) => {
    if (!directory) return [];
    const state = directory.states.find(s => s.name === stateName);
    return state ? state.constituencies : [];
  }, [directory]);

  // Get MP for selected constituency
  const getMpForConstituency = useCallback((stateName: string, constituencyName: string) => {
    if (!directory) return null;
    const state = directory.states.find(s => s.name === stateName);
    if (!state) return null;
    const constituency = state.constituencies.find(c => c.name === constituencyName);
    return constituency?.mp || null;
  }, [directory]);

  // OPTIMIZED: Memoized event handlers to prevent re-renders
  const handleEditingDataChange = useCallback((field: keyof EditingReport, value: any) => {
    setEditingData(prev => prev ? { ...prev, [field]: value } : null);
  }, []);

  // Load Leaflet for location modal
  React.useEffect(() => {
    const loadLeaflet = async () => {
      if (window.L) {
        setIsMapLoaded(true);
        return;
      }

      try {
        const cssLink = document.createElement('link');
        cssLink.rel = 'stylesheet';
        cssLink.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        cssLink.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
        cssLink.crossOrigin = '';
        document.head.appendChild(cssLink);

        const script = document.createElement('script');
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        script.integrity = 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=';
        script.crossOrigin = '';
        
        await new Promise<void>((resolve) => {
          script.onload = () => resolve();
          document.head.appendChild(script);
        });

        setIsMapLoaded(true);
      } catch (error) {
        console.error('Error loading Leaflet:', error);
      }
    };

    loadLeaflet();
  }, []);

  // Initialize map modal when opened
  React.useEffect(() => {
    if (showLocationModal && isMapLoaded && mapModalRef.current && !mapInstance && editingData) {
      const currentLat = editingData.latitude;
      const currentLng = editingData.longitude;
      
      const map = window.L.map(mapModalRef.current, {
        center: [currentLat, currentLng],
        zoom: 13,
        zoomControl: true,
        preferCanvas: true
      });

      window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19
      }).addTo(map);

      window.L.marker([currentLat, currentLng], {
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
              📍
            </div>
          `,
          className: 'current-location-marker',
          iconSize: [25, 25],
          iconAnchor: [12.5, 12.5]
        })
      }).addTo(map);

      map.on('click', async (e: any) => {
        const { lat, lng } = e.latlng;
        setSelectedLocation({ lat, lng });
        
        map.eachLayer((layer: any) => {
          if (layer instanceof window.L.Marker && layer.options.icon.options.className === 'custom-location-marker') {
            map.removeLayer(layer);
          }
        });
        
        window.L.marker([lat, lng], {
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
            className: 'custom-location-marker',
            iconSize: [30, 30],
            iconAnchor: [15, 15]
          })
        }).addTo(map);

        setIsLoadingSelectedLocation(true);
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`
          );
          
          if (response.ok) {
            const data = await response.json();
            const locationData = data.address || {};
            
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
            } else if (locationData.state_district && !addressParts.includes(locationData.state_district)) {
              addressParts.push(locationData.state_district);
            }
            
            if (locationData.state) {
              addressParts.push(locationData.state);
            }

            if (addressParts.length > 0) {
              const newAddress = addressParts.join(', ');
              setEditingData(prev => prev ? { ...prev, address: newAddress, latitude: lat, longitude: lng } : null);
            } else {
              setEditingData(prev => prev ? { ...prev, latitude: lat, longitude: lng } : null);
            }
          } else {
            setEditingData(prev => prev ? { ...prev, latitude: lat, longitude: lng } : null);
          }
        } catch (error) {
          console.error('Error fetching location data:', error);
          setEditingData(prev => prev ? { ...prev, latitude: lat, longitude: lng } : null);
        } finally {
          setIsLoadingSelectedLocation(false);
        }
      });

      setMapInstance(map);
    }
  }, [showLocationModal, isMapLoaded, mapModalRef.current, mapInstance, editingData]);

  // Cleanup map when modal closes
  React.useEffect(() => {
    if (!showLocationModal && mapInstance) {
      mapInstance.remove();
      setMapInstance(null);
      setSelectedLocation(null);
    }
  }, [showLocationModal, mapInstance]);

  const formatDate = (timestamp: bigint) => {
    return new Date(Number(timestamp) / 1000000).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getIssueTypeDisplay = (issueType: string) => {
    const predefinedType = predefinedIssueTypes.find(type => 
      type.value.toLowerCase() === issueType.toLowerCase()
    );
    
    if (predefinedType) {
      if (predefinedType.icon) {
        return predefinedType.icon;
      }
      return <span className="text-sm">{predefinedType.emoji}</span>;
    }
    
    // Fallback for custom types
    const lowerType = issueType.toLowerCase();
    if (lowerType.includes('pothole')) return <span className="text-sm">🕳️</span>;
    if (lowerType.includes('garbage') || lowerType.includes('waste')) return <span className="text-sm">🗑️</span>;
    if (lowerType.includes('streetlight') || lowerType.includes('light')) return <span className="text-sm">💡</span>;
    if (lowerType.includes('waterlogging') || lowerType.includes('water')) return <Droplets className="h-5 w-5 text-blue-500" />;
    if (lowerType.includes('flood')) return <Waves className="h-5 w-5 text-blue-600" />;
    if (lowerType.includes('dumping')) return <span className="text-sm">🚯</span>;
    if (lowerType.includes('parking')) return <span className="text-sm">🚗</span>;
    return <span className="text-sm">❓</span>;
  };

  const getStatusColor = (status: string) => {
    const normalizedStatus = status.toLowerCase();
    switch (normalizedStatus) {
      case 'submitted':
      case 'open':
        return 'text-blue-700 bg-blue-100 border-blue-200';
      case 'resolved':
        return 'text-green-700 bg-green-100 border-green-200';
      default:
        return 'text-gray-700 bg-gray-100 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    const normalizedStatus = status.toLowerCase();
    switch (normalizedStatus) {
      case 'submitted':
      case 'open':
        return <AlertCircle className="h-3 w-3" />;
      case 'resolved':
        return <CheckCircle className="h-3 w-3" />;
      default:
        return <AlertCircle className="h-3 w-3" />;
    }
  };

  const getStatusDisplayText = (status: string) => {
    const normalizedStatus = status.toLowerCase();
    switch (normalizedStatus) {
      case 'submitted':
        return 'Open';
      case 'open':
        return 'Open';
      case 'resolved':
        return 'Resolved';
      default:
        return status;
    }
  };

  const getReportAddress = (report: Report): string => {
    if (report.customAddress && report.customAddress.trim() !== '') {
      return report.customAddress;
    }
    if (report.address && report.address.trim() !== '') {
      return report.address;
    }
    return `${report.location.latitude.toFixed(6)}, ${report.location.longitude.toFixed(6)}`;
  };

  const getReportCoordinates = (report: Report): string => {
    if (report.coordinates && report.coordinates.trim() !== '') {
      return report.coordinates;
    }
    return `${report.location.latitude.toFixed(6)}, ${report.location.longitude.toFixed(6)}`;
  };

  const getPmDisplayName = (report: Report) => {
    return report.pmData?.name || 'Prime Minister';
  };

  const getCmDisplayName = (report: Report) => {
    return report.cmData?.name || 'Chief Minister';
  };

  const getMpDisplayName = (report: Report) => {
    return report.mpData?.name || 'MP';
  };

  const handleEdit = (report: Report) => {
    setEditingReportId(report.id);
    
    const isPredefinedType = predefinedIssueTypes.some(type => 
      type.value.toLowerCase() === report.issueType.toLowerCase()
    );
    
    const actualAddress = getReportAddress(report);
    
    // Extract state and constituency from MP data if available
    let mpState = '';
    let mpConstituency = '';
    if (report.mpData) {
      // Try to find the state and constituency from directory
      if (directory) {
        for (const state of directory.states) {
          for (const constituency of state.constituencies) {
            if (constituency.mp?.name === report.mpData.name) {
              mpState = state.name;
              mpConstituency = constituency.name;
              break;
            }
          }
          if (mpState) break;
        }
      }
    }
    
    setEditingData({
      id: report.id,
      issueType: isPredefinedType ? report.issueType : 'Other',
      customIssueType: isPredefinedType ? '' : report.issueType,
      status: report.status,
      username: report.username || '',
      notes: report.notes || '',
      mlaName: report.mlaName || '',
      address: actualAddress,
      pmName: getPmDisplayName(report),
      cmName: getCmDisplayName(report),
      reporterName: report.reporterName || '',
      completionNotes: report.completionNotes || '',
      latitude: report.location.latitude,
      longitude: report.location.longitude,
      civicBodyType: report.localCivicBody?.bodyType || '',
      civicBodyName: report.localCivicBody?.bodyName || '',
      civicBodyRepName: report.localCivicBody?.representativeName || '',
      mpState: mpState,
      mpConstituency: mpConstituency,
      selectedPmFromDirectory: report.pmData,
      selectedCmFromDirectory: report.cmData,
      selectedMpFromDirectory: report.mpData
    });
  };

  const handleStatusChange = (newStatus: string) => {
    if (!editingData) return;
    
    if ((editingData.status.toLowerCase() === 'open' || editingData.status.toLowerCase() === 'submitted') && 
        newStatus.toLowerCase() === 'resolved') {
      setShowResolutionForm(editingData.id);
      setResolutionFormData({
        reporterName: '',
        notes: '',
        proofPhoto: null,
        proofPhotoPreview: null
      });
    } else {
      handleEditingDataChange('status', newStatus);
    }
  };

  const handleResolutionFormSubmit = async () => {
    if (!resolutionFormData.proofPhoto || !resolutionFormData.reporterName.trim()) {
      alert('Please provide both a proof photo and reporter name to resolve the report.');
      return;
    }

    try {
      const timestamp = Date.now();
      const fileName = `admin-proof-resolved-${timestamp}-${resolutionFormData.proofPhoto.name}`;
      const filePath = `reports/proof/${fileName}`;
      
      await uploadFile(filePath, resolutionFormData.proofPhoto);
      
      updateReportStatus({
        reportId: editingData!.id,
        status: 'Resolved',
        proofPhotoPath: filePath,
        reporterName: resolutionFormData.reporterName.trim(),
        notes: resolutionFormData.notes.trim() || null
      }, {
        onSuccess: (success) => {
          if (success) {
            setEditingData(prev => prev ? {
              ...prev,
              status: 'Resolved',
              reporterName: resolutionFormData.reporterName.trim(),
              completionNotes: resolutionFormData.notes.trim() || ''
            } : null);
            
            setShowResolutionForm(null);
            setResolutionFormData({
              reporterName: '',
              notes: '',
              proofPhoto: null,
              proofPhotoPreview: null
            });
            
            alert('Report status updated to Resolved successfully!');
          } else {
            alert('Failed to update report status. Please try again.');
          }
        },
        onError: (error) => {
          console.error('Error updating status:', error);
          alert('Failed to update report status. Please try again.');
        }
      });
      
    } catch (error) {
      console.error('Error uploading proof photo:', error);
      alert('Failed to upload proof photo. Please try again.');
    }
  };

  const handleSave = async () => {
    if (!editingData) return;

    try {
      const originalReport = reports.find(r => r.id === editingData.id);
      if (!originalReport) {
        throw new Error('Original report not found');
      }

      let updatedPhotoPath = originalReport.photoPath;
      let updatedMlaPhotoPath = originalReport.mlaPhotoPath;
      let updatedProofPhotoPath = originalReport.proofPhotoPath;
      let updatedPmPhotoPath = originalReport.pmPhotoPath;
      let updatedCmPhotoPath = originalReport.cmPhotoPath;
      let updatedCivicBodyPhotoPath = originalReport.localCivicBody?.photoPath;
      let updatedMpPhotoPath = originalReport.mpData?.photoPath;

      const uploadPromises: Promise<string | null>[] = [];

      if (editingData.newMainPhoto) {
        const timestamp = Date.now();
        const fileName = `admin-update-main-${timestamp}-${editingData.newMainPhoto.name}`;
        const filePath = `reports/${fileName}`;
        uploadPromises.push(uploadFile(filePath, editingData.newMainPhoto).then(() => filePath));
      } else {
        uploadPromises.push(Promise.resolve(null));
      }

      if (editingData.newMlaPhoto) {
        const timestamp = Date.now();
        const fileName = `admin-update-mla-${timestamp}-${editingData.newMlaPhoto.name}`;
        const filePath = `reports/mla/${fileName}`;
        uploadPromises.push(uploadFile(filePath, editingData.newMlaPhoto).then(() => filePath));
      } else {
        uploadPromises.push(Promise.resolve(null));
      }

      if (editingData.newProofPhoto) {
        const timestamp = Date.now();
        const fileName = `admin-update-proof-${timestamp}-${editingData.newProofPhoto.name}`;
        const filePath = `reports/proof/${fileName}`;
        uploadPromises.push(uploadFile(filePath, editingData.newProofPhoto).then(() => filePath));
      } else {
        uploadPromises.push(Promise.resolve(null));
      }

      if (editingData.newPmPhoto) {
        const timestamp = Date.now();
        const fileName = `admin-update-pm-${timestamp}-${editingData.newPmPhoto.name}`;
        const filePath = `leaders/pm/${fileName}`;
        uploadPromises.push(uploadFile(filePath, editingData.newPmPhoto).then(() => filePath));
      } else {
        uploadPromises.push(Promise.resolve(null));
      }

      if (editingData.newCmPhoto) {
        const timestamp = Date.now();
        const fileName = `admin-update-cm-${timestamp}-${editingData.newCmPhoto.name}`;
        const filePath = `leaders/cm/${fileName}`;
        uploadPromises.push(uploadFile(filePath, editingData.newCmPhoto).then(() => filePath));
      } else {
        uploadPromises.push(Promise.resolve(null));
      }

      if (editingData.newCivicBodyPhoto) {
        const timestamp = Date.now();
        const fileName = `admin-update-civic-${timestamp}-${editingData.newCivicBodyPhoto.name}`;
        const filePath = `reports/civic-body/${fileName}`;
        uploadPromises.push(uploadFile(filePath, editingData.newCivicBodyPhoto).then(() => filePath));
      } else {
        uploadPromises.push(Promise.resolve(null));
      }

      if (editingData.newMpPhoto) {
        const timestamp = Date.now();
        const fileName = `admin-update-mp-${timestamp}-${editingData.newMpPhoto.name}`;
        const filePath = `leaders/mp/${fileName}`;
        uploadPromises.push(uploadFile(filePath, editingData.newMpPhoto).then(() => filePath));
      } else {
        uploadPromises.push(Promise.resolve(null));
      }

      const [newMainPhotoPath, newMlaPhotoPath, newProofPhotoPath, newPmPhotoPath, newCmPhotoPath, newCivicBodyPhotoPath, newMpPhotoPath] = await Promise.all(uploadPromises);

      if (newMainPhotoPath) updatedPhotoPath = newMainPhotoPath;
      if (newMlaPhotoPath) updatedMlaPhotoPath = newMlaPhotoPath;
      if (newProofPhotoPath) updatedProofPhotoPath = newProofPhotoPath;
      if (newPmPhotoPath) updatedPmPhotoPath = newPmPhotoPath;
      if (newCmPhotoPath) updatedCmPhotoPath = newCmPhotoPath;
      if (newCivicBodyPhotoPath) updatedCivicBodyPhotoPath = newCivicBodyPhotoPath;
      if (newMpPhotoPath) updatedMpPhotoPath = newMpPhotoPath;

      const finalIssueType = editingData.issueType === 'Other' ? editingData.customIssueType : editingData.issueType;

      // Use selected PM/CM/MP from directory if available, otherwise keep original
      const updatedPmData: Representative | undefined = editingData.selectedPmFromDirectory || originalReport.pmData;
      const updatedCmData: Representative | undefined = editingData.selectedCmFromDirectory || originalReport.cmData;
      
      // Handle MP data - use selected MP from directory if state and constituency are selected
      let updatedMpData: Representative | undefined = originalReport.mpData;
      if (editingData.mpState && editingData.mpConstituency) {
        const selectedMp = getMpForConstituency(editingData.mpState, editingData.mpConstituency);
        if (selectedMp) {
          updatedMpData = selectedMp;
        }
      } else if (editingData.selectedMpFromDirectory) {
        updatedMpData = editingData.selectedMpFromDirectory;
      }

      const coordinatesString = `${editingData.latitude.toFixed(6)}, ${editingData.longitude.toFixed(6)}`;
      const finalCustomAddress = editingData.address.trim() || undefined;
      const finalAddress = editingData.address.trim() || coordinatesString;

      // Build Local Civic Body data if type is selected
      let updatedLocalCivicBody: LocalCivicBody | undefined = undefined;
      if (editingData.civicBodyType && editingData.civicBodyType.trim() !== '') {
        updatedLocalCivicBody = {
          bodyType: editingData.civicBodyType,
          bodyName: editingData.civicBodyName.trim(),
          representativeName: editingData.civicBodyRepName.trim(),
          photoPath: updatedCivicBodyPhotoPath || undefined
        };
      }

      const updatedReport: Report = {
        ...originalReport,
        issueType: finalIssueType,
        status: editingData.status,
        username: editingData.username.trim() || undefined,
        notes: editingData.notes.trim() || undefined,
        mlaName: editingData.mlaName.trim() || undefined,
        customAddress: finalCustomAddress,
        address: finalAddress,
        reporterName: editingData.reporterName.trim() || undefined,
        completionNotes: editingData.completionNotes.trim() || undefined,
        location: {
          latitude: editingData.latitude,
          longitude: editingData.longitude
        },
        coordinates: coordinatesString,
        photoPath: updatedPhotoPath,
        mlaPhotoPath: updatedMlaPhotoPath,
        proofPhotoPath: updatedProofPhotoPath,
        pmPhotoPath: updatedPmPhotoPath,
        cmPhotoPath: updatedCmPhotoPath,
        pmData: updatedPmData,
        cmData: updatedCmData,
        mpData: updatedMpData,
        pmName: updatedPmData?.name || editingData.pmName.trim() || undefined,
        cmName: updatedCmData?.name || editingData.cmName.trim() || undefined,
        localCivicBody: updatedLocalCivicBody,
        mlaDesignation: 'MLA'
      };

      updateReport({
        reportId: editingData.id,
        updatedReport
      }, {
        onSuccess: () => {
          setEditingReportId(null);
          setEditingData(null);
          alert('Report updated successfully! All changes including PM, CM, MP, MLA, and Local Civic Body details are now reflected across the application.');
        },
        onError: (error) => {
          console.error('Error updating report:', error);
          const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
          if (errorMessage.includes('Unauthorized')) {
            alert('You do not have permission to update this report. Please ensure you are logged in as an admin.');
          } else {
            alert('Failed to update report. Please try again.');
          }
        }
      });
      
    } catch (error) {
      console.error('Error updating report:', error);
      alert('Failed to update report. Please try again.');
    }
  };

  const handleCancel = () => {
    setEditingReportId(null);
    setEditingData(null);
    setShowLocationModal(false);
    setSelectedLocation(null);
    setShowResolutionForm(null);
    setResolutionFormData({
      reporterName: '',
      notes: '',
      proofPhoto: null,
      proofPhotoPreview: null
    });
  };

  const handleDelete = (reportId: string) => {
    setShowDeleteConfirm(reportId);
  };

  const confirmDelete = () => {
    if (!showDeleteConfirm) return;
    
    deleteReport(showDeleteConfirm, {
      onSuccess: () => {
        setShowDeleteConfirm(null);
        alert('Report deleted successfully!');
      },
      onError: (error) => {
        console.error('Error deleting report:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        if (errorMessage.includes('Unauthorized')) {
          alert('You do not have permission to delete this report. Please ensure you are logged in as an admin.');
        } else if (errorMessage.includes('Report not found')) {
          alert('This report no longer exists or has already been deleted.');
        } else {
          alert('Failed to delete report. Please try again or contact support if the problem persists.');
        }
        setShowDeleteConfirm(null);
      }
    });
  };

  const handlePhotoSelect = (file: File, type: 'main' | 'mla' | 'proof' | 'pm' | 'cm' | 'civic' | 'mp') => {
    if (!editingData) return;

    const previewUrl = URL.createObjectURL(file);

    const updatedData = { ...editingData };
    switch (type) {
      case 'main':
        updatedData.newMainPhoto = file;
        updatedData.newMainPhotoPreview = previewUrl;
        break;
      case 'mla':
        updatedData.newMlaPhoto = file;
        updatedData.newMlaPhotoPreview = previewUrl;
        break;
      case 'proof':
        updatedData.newProofPhoto = file;
        updatedData.newProofPhotoPreview = previewUrl;
        break;
      case 'pm':
        updatedData.newPmPhoto = file;
        updatedData.newPmPhotoPreview = previewUrl;
        break;
      case 'cm':
        updatedData.newCmPhoto = file;
        updatedData.newCmPhotoPreview = previewUrl;
        break;
      case 'civic':
        updatedData.newCivicBodyPhoto = file;
        updatedData.newCivicBodyPhotoPreview = previewUrl;
        break;
      case 'mp':
        updatedData.newMpPhoto = file;
        updatedData.newMpPhotoPreview = previewUrl;
        break;
    }
    setEditingData(updatedData);
  };

  const handleResolutionPhotoSelect = (file: File) => {
    const previewUrl = URL.createObjectURL(file);
    setResolutionFormData(prev => ({
      ...prev,
      proofPhoto: file,
      proofPhotoPreview: previewUrl
    }));
  };

  const handleIssueTypeChange = (newIssueType: string) => {
    if (!editingData) return;
    
    setEditingData({
      ...editingData,
      issueType: newIssueType,
      customIssueType: newIssueType === 'Other' ? editingData.customIssueType : ''
    });
  };

  const handleConfirmLocationSelection = () => {
    if (!selectedLocation || !editingData) return;
    
    setEditingData({
      ...editingData,
      latitude: selectedLocation.lat,
      longitude: selectedLocation.lng
    });
    
    setShowLocationModal(false);
    setSelectedLocation(null);
  };

  const handlePmSelect = useCallback((pmId: string) => {
    if (!editingData) return;
    const selectedPm = allPMs.find(pm => pm.name === pmId);
    if (selectedPm) {
      setEditingData(prev => prev ? {
        ...prev,
        selectedPmFromDirectory: selectedPm,
        pmName: selectedPm.name
      } : null);
    }
  }, [editingData, allPMs]);

  const handleCmSelect = useCallback((cmId: string) => {
    if (!editingData) return;
    const selectedCm = allCMs.find(cm => cm.name === cmId);
    if (selectedCm) {
      setEditingData(prev => prev ? {
        ...prev,
        selectedCmFromDirectory: selectedCm,
        cmName: selectedCm.name
      } : null);
    }
  }, [editingData, allCMs]);

  const handleMpStateSelect = useCallback((stateName: string) => {
    if (!editingData) return;
    setEditingData(prev => prev ? {
      ...prev,
      mpState: stateName,
      mpConstituency: '', // Reset constituency when state changes
      selectedMpFromDirectory: undefined
    } : null);
  }, [editingData]);

  const handleMpConstituencySelect = useCallback((constituencyName: string) => {
    if (!editingData || !editingData.mpState) return;
    
    const selectedMp = getMpForConstituency(editingData.mpState, constituencyName);
    setEditingData(prev => prev ? {
      ...prev,
      mpConstituency: constituencyName,
      selectedMpFromDirectory: selectedMp || undefined
    } : null);
  }, [editingData, getMpForConstituency]);

  // Toggle resolution expansion for a specific report
  const toggleResolutionExpansion = (reportId: string) => {
    setExpandedResolutions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(reportId)) {
        newSet.delete(reportId);
      } else {
        newSet.add(reportId);
      }
      return newSet;
    });
  };

  // OPTIMIZED: Component for rendering photo thumbnails with efficient caching
  const PhotoThumbnail = ({ report, type, isEditing = false }: { report: Report; type: 'main' | 'mla' | 'proof' | 'pm' | 'cm' | 'civic' | 'mp'; isEditing?: boolean }) => {
    let photoPath = '';
    let altText = '';
    let fallbackContent: React.ReactNode = null;
    let previewUrl: string | undefined = undefined;

    switch (type) {
      case 'main':
        photoPath = report.photoPath;
        altText = 'Issue Photo';
        previewUrl = isEditing && editingData?.id === report.id ? editingData?.newMainPhotoPreview : undefined;
        break;
      case 'mla':
        photoPath = report.mlaPhotoPath || '';
        altText = 'MLA Photo';
        fallbackContent = <span className="text-xs text-gray-500">No Photo</span>;
        previewUrl = isEditing && editingData?.id === report.id ? editingData?.newMlaPhotoPreview : undefined;
        break;
      case 'proof':
        photoPath = report.proofPhotoPath || '';
        altText = 'Proof Photo';
        fallbackContent = <span className="text-xs text-gray-500">No Proof</span>;
        previewUrl = isEditing && editingData?.id === report.id ? editingData?.newProofPhotoPreview : undefined;
        break;
      case 'pm':
        photoPath = report.pmData?.photoPath || '';
        altText = 'PM Photo';
        fallbackContent = <span className="text-xs text-gray-500">No Photo</span>;
        previewUrl = isEditing && editingData?.id === report.id ? editingData?.newPmPhotoPreview : undefined;
        break;
      case 'cm':
        photoPath = report.cmData?.photoPath || '';
        altText = 'CM Photo';
        fallbackContent = <span className="text-xs text-gray-500">No Photo</span>;
        previewUrl = isEditing && editingData?.id === report.id ? editingData?.newCmPhotoPreview : undefined;
        break;
      case 'civic':
        photoPath = report.localCivicBody?.photoPath || '';
        altText = 'Civic Body Photo';
        fallbackContent = <span className="text-xs text-gray-500">No Photo</span>;
        previewUrl = isEditing && editingData?.id === report.id ? editingData?.newCivicBodyPhotoPreview : undefined;
        break;
      case 'mp':
        photoPath = report.mpData?.photoPath || '';
        altText = 'MP Photo';
        fallbackContent = <span className="text-xs text-gray-500">No Photo</span>;
        previewUrl = isEditing && editingData?.id === report.id ? editingData?.newMpPhotoPreview : undefined;
        break;
    }

    const { data: imageUrl } = useFileUrl(photoPath);
    const displayUrl = previewUrl || imageUrl;

    if (!photoPath && !displayUrl) {
      return (
        <div className="w-12 h-12 bg-gray-100 rounded border-2 border-dashed border-gray-300 flex items-center justify-center relative">
          {fallbackContent || <ImageIcon className="h-4 w-4 text-gray-400" />}
          {isEditing && (
            <button
              onClick={() => {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = 'image/*';
                input.onchange = (e) => {
                  const file = (e.target as HTMLInputElement).files?.[0];
                  if (file) handlePhotoSelect(file, type);
                };
                input.click();
              }}
              className="absolute -top-1 -right-1 bg-blue-500 hover:bg-blue-600 text-white p-1 rounded-full shadow-md transition-colors"
              title={`Upload ${altText}`}
            >
              <Upload className="h-2 w-2" />
            </button>
          )}
        </div>
      );
    }

    return (
      <div className="relative">
        <button
          onClick={() => displayUrl && setShowFullPhotoModal({ reportId: report.id, imageUrl: displayUrl, type: altText })}
          className="w-12 h-12 rounded border-2 border-gray-200 overflow-hidden hover:border-blue-400 transition-colors group relative"
          disabled={!displayUrl}
        >
          {displayUrl ? (
            <>
              <img
                src={displayUrl}
                alt={altText}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
                <Eye className="h-3 w-3 text-white" />
              </div>
            </>
          ) : (
            <div className="w-full h-full bg-gray-200 flex items-center justify-center">
              <ImageIcon className="h-4 w-4 text-gray-400" />
            </div>
          )}
        </button>
        {isEditing && (
          <button
            onClick={() => {
              const input = document.createElement('input');
              input.type = 'file';
              input.accept = 'image/*';
              input.onchange = (e) => {
                const file = (e.target as HTMLInputElement).files?.[0];
                if (file) handlePhotoSelect(file, type);
              };
              input.click();
            }}
            className="absolute -top-1 -right-1 bg-blue-500 hover:bg-blue-600 text-white p-1 rounded-full shadow-md transition-colors"
            title={`Replace ${altText}`}
          >
            <Upload className="h-2 w-2" />
          </button>
        )}
        {editingData && editingData.id === report.id && (
          (type === 'main' && editingData.newMainPhoto) ||
          (type === 'mla' && editingData.newMlaPhoto) ||
          (type === 'proof' && editingData.newProofPhoto) ||
          (type === 'pm' && editingData.newPmPhoto) ||
          (type === 'cm' && editingData.newCmPhoto) ||
          (type === 'civic' && editingData.newCivicBodyPhoto) ||
          (type === 'mp' && editingData.newMpPhoto)
        ) && (
          <div className="absolute -bottom-1 -left-1 bg-green-500 text-white px-1 py-0.5 rounded text-xs font-medium">
            New
          </div>
        )}
      </div>
    );
  };

  // OPTIMIZED: Component for minister info display with efficient image loading
  const MinisterInfo = React.memo(({ report, isEditing = false }: { report: Report; isEditing?: boolean }) => {
    const { data: pmCustomImageUrl } = useFileUrl(report.pmData?.photoPath || '');
    const { data: cmCustomImageUrl } = useFileUrl(report.cmData?.photoPath || '');
    const { data: mpCustomImageUrl } = useFileUrl(report.mpData?.photoPath || '');
    const { data: mlaImageUrl } = useFileUrl(report.mlaPhotoPath || '');
    const { data: civicBodyImageUrl } = useFileUrl(report.localCivicBody?.photoPath || '');

    const getPmPhotoUrl = () => {
      if (isEditing && editingData?.id === report.id && editingData?.newPmPhotoPreview) {
        return editingData.newPmPhotoPreview;
      }
      return pmCustomImageUrl;
    };
    
    const getCmPhotoUrl = () => {
      if (isEditing && editingData?.id === report.id && editingData?.newCmPhotoPreview) {
        return editingData.newCmPhotoPreview;
      }
      return cmCustomImageUrl;
    };

    const getMpPhotoUrl = () => {
      if (isEditing && editingData?.id === report.id && editingData?.newMpPhotoPreview) {
        return editingData.newMpPhotoPreview;
      }
      return mpCustomImageUrl;
    };

    const getMlaPhotoUrl = () => {
      if (isEditing && editingData?.id === report.id && editingData?.newMlaPhotoPreview) {
        return editingData.newMlaPhotoPreview;
      }
      return mlaImageUrl;
    };

    const getCivicBodyPhotoUrl = () => {
      if (isEditing && editingData?.id === report.id && editingData?.newCivicBodyPhotoPreview) {
        return editingData.newCivicBodyPhotoPreview;
      }
      return civicBodyImageUrl;
    };

    if (isEditing && editingData && editingData.id === report.id) {
      return (
        <div className="space-y-2 min-w-[180px]">
          <div className="flex items-center space-x-2 p-2 bg-blue-50 rounded border">
            <div className="relative">
              <div className="w-12 h-12 rounded border-2 border-gray-200 overflow-hidden bg-gray-100 flex items-center justify-center">
                {getPmPhotoUrl() ? (
                  <img
                    src={getPmPhotoUrl()!}
                    alt="PM"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="h-6 w-6 text-gray-400" />
                )}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <select
                key={`pm-select-${report.id}`}
                value={editingData.selectedPmFromDirectory?.name || ''}
                onChange={(e) => handlePmSelect(e.target.value)}
                className="w-full px-1 py-0.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select PM from Directory</option>
                {allPMs.map(pm => (
                  <option key={pm.name} value={pm.name}>{pm.name}</option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">PM</p>
            </div>
          </div>

          <div className="flex items-center space-x-2 p-2 bg-green-50 rounded border">
            <div className="relative">
              <div className="w-12 h-12 rounded border-2 border-gray-200 overflow-hidden bg-gray-100 flex items-center justify-center">
                {getCmPhotoUrl() ? (
                  <img
                    src={getCmPhotoUrl()!}
                    alt="CM"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="h-6 w-6 text-gray-400" />
                )}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <select
                key={`cm-select-${report.id}`}
                value={editingData.selectedCmFromDirectory?.name || ''}
                onChange={(e) => handleCmSelect(e.target.value)}
                className="w-full px-1 py-0.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-green-500 focus:border-green-500"
              >
                <option value="">Select CM from Directory</option>
                {allCMs.map(cm => (
                  <option key={cm.name} value={cm.name}>{cm.name}</option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">CM</p>
            </div>
          </div>

          {/* MP Section - ALWAYS VISIBLE with State and Constituency dropdowns */}
          <div className="flex items-center space-x-2 p-2 bg-indigo-50 rounded border">
            <div className="relative">
              <div className="w-12 h-12 rounded border-2 border-gray-200 overflow-hidden bg-gray-100 flex items-center justify-center">
                {getMpPhotoUrl() ? (
                  <img
                    src={getMpPhotoUrl()!}
                    alt="MP"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="h-6 w-6 text-gray-400" />
                )}
              </div>
              {editingData.mpState && editingData.mpConstituency && (
                <button
                  onClick={() => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = 'image/*';
                    input.onchange = (e) => {
                      const file = (e.target as HTMLInputElement).files?.[0];
                      if (file) handlePhotoSelect(file, 'mp');
                    };
                    input.click();
                  }}
                  className="absolute -top-1 -right-1 bg-indigo-500 hover:bg-indigo-600 text-white p-1 rounded-full shadow-md transition-colors"
                  title="Upload MP Photo"
                >
                  <Upload className="h-2 w-2" />
                </button>
              )}
              {editingData.newMpPhoto && (
                <div className="absolute -bottom-1 -left-1 bg-green-500 text-white px-1 py-0.5 rounded text-xs font-medium">
                  New
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0 space-y-1">
              <select
                key={`mp-state-select-${report.id}`}
                value={editingData.mpState}
                onChange={(e) => handleMpStateSelect(e.target.value)}
                className="w-full px-1 py-0.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">Select State</option>
                {allStates.map(state => (
                  <option key={state} value={state}>{state}</option>
                ))}
              </select>
              {editingData.mpState && (
                <select
                  key={`mp-constituency-select-${report.id}-${editingData.mpState}`}
                  value={editingData.mpConstituency}
                  onChange={(e) => handleMpConstituencySelect(e.target.value)}
                  className="w-full px-1 py-0.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">Select Constituency</option>
                  {getConstituenciesForState(editingData.mpState).map(constituency => (
                    <option key={constituency.name} value={constituency.name}>{constituency.name}</option>
                  ))}
                </select>
              )}
              {editingData.selectedMpFromDirectory && (
                <p className="text-xs text-indigo-700 font-medium">{editingData.selectedMpFromDirectory.name}</p>
              )}
              <p className="text-xs text-gray-500">MP</p>
            </div>
          </div>

          {/* MLA Section - Dedicated section labeled "MLA" with manual name and photo upload */}
          <div className="flex items-center space-x-2 p-2 bg-purple-50 rounded border">
            <div className="relative">
              <div className="w-12 h-12 rounded border-2 border-gray-200 overflow-hidden bg-gray-100 flex items-center justify-center">
                {getMlaPhotoUrl() ? (
                  <img
                    src={getMlaPhotoUrl()!}
                    alt="MLA"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="h-6 w-6 text-gray-400" />
                )}
              </div>
              <button
                onClick={() => {
                  const input = document.createElement('input');
                  input.type = 'file';
                  input.accept = 'image/*';
                  input.onchange = (e) => {
                    const file = (e.target as HTMLInputElement).files?.[0];
                    if (file) handlePhotoSelect(file, 'mla');
                  };
                  input.click();
                }}
                className="absolute -top-1 -right-1 bg-purple-500 hover:bg-purple-600 text-white p-1 rounded-full shadow-md transition-colors"
                title="Upload MLA Photo"
              >
                <Upload className="h-2 w-2" />
              </button>
              {editingData.newMlaPhoto && (
                <div className="absolute -bottom-1 -left-1 bg-green-500 text-white px-1 py-0.5 rounded text-xs font-medium">
                  New
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <input
                key={`mla-name-input-${report.id}`}
                type="text"
                value={editingData.mlaName}
                onChange={(e) => handleEditingDataChange('mlaName', e.target.value)}
                placeholder="MLA Name"
                className="w-full px-1 py-0.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-purple-500 focus:border-purple-500"
              />
              <p className="text-xs text-gray-500">MLA</p>
            </div>
          </div>

          {/* Local Civic Body Section - Always show dropdown, conditionally show other fields */}
          <div className="flex items-center space-x-2 p-2 bg-orange-50 rounded border">
            <div className="relative">
              <div className="w-12 h-12 rounded border-2 border-gray-200 overflow-hidden bg-gray-100 flex items-center justify-center">
                {getCivicBodyPhotoUrl() ? (
                  <img
                    src={getCivicBodyPhotoUrl()!}
                    alt="Civic Body"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Building2 className="h-6 w-6 text-gray-400" />
                )}
              </div>
              {editingData.civicBodyType && (
                <button
                  onClick={() => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = 'image/*';
                    input.onchange = (e) => {
                      const file = (e.target as HTMLInputElement).files?.[0];
                      if (file) handlePhotoSelect(file, 'civic');
                    };
                    input.click();
                  }}
                  className="absolute -top-1 -right-1 bg-orange-500 hover:bg-orange-600 text-white p-1 rounded-full shadow-md transition-colors"
                  title="Upload Civic Body Photo"
                >
                  <Upload className="h-2 w-2" />
                </button>
              )}
              {editingData.newCivicBodyPhoto && (
                <div className="absolute -bottom-1 -left-1 bg-green-500 text-white px-1 py-0.5 rounded text-xs font-medium">
                  New
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0 space-y-1">
              <select
                key={`civic-body-type-select-${report.id}`}
                value={editingData.civicBodyType}
                onChange={(e) => handleEditingDataChange('civicBodyType', e.target.value)}
                className="w-full px-1 py-0.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
              >
                <option value="">Select Civic Body Type</option>
                {civicBodyTypes.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
              {editingData.civicBodyType && (
                <>
                  <input
                    key={`civic-body-name-input-${report.id}`}
                    type="text"
                    value={editingData.civicBodyName}
                    onChange={(e) => handleEditingDataChange('civicBodyName', e.target.value)}
                    placeholder="Civic Body Name"
                    className="w-full px-1 py-0.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
                  />
                  <input
                    key={`civic-body-rep-input-${report.id}`}
                    type="text"
                    value={editingData.civicBodyRepName}
                    onChange={(e) => handleEditingDataChange('civicBodyRepName', e.target.value)}
                    placeholder="Representative Name"
                    className="w-full px-1 py-0.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
                  />
                </>
              )}
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="flex items-center space-x-2">
        <div className="flex flex-col items-center space-y-1">
          <div className="w-8 h-8 rounded-full overflow-hidden border border-blue-200 bg-gray-100 flex items-center justify-center">
            {getPmPhotoUrl() ? (
              <img
                src={getPmPhotoUrl()!}
                alt="PM"
                className="w-full h-full object-cover cursor-pointer"
                onClick={() => getPmPhotoUrl() && setShowFullPhotoModal({ reportId: report.id, imageUrl: getPmPhotoUrl()!, type: 'PM Photo' })}
              />
            ) : (
              <User className="h-4 w-4 text-gray-400" />
            )}
          </div>
          <div className="text-center">
            <span className="text-xs text-gray-600 text-center leading-tight block">{getPmDisplayName(report)}</span>
            <span className="text-xs text-gray-500 block">PM</span>
          </div>
        </div>

        <div className="flex flex-col items-center space-y-1">
          <div className="w-8 h-8 rounded-full overflow-hidden border border-green-200 bg-gray-100 flex items-center justify-center">
            {getCmPhotoUrl() ? (
              <img
                src={getCmPhotoUrl()!}
                alt="CM"
                className="w-full h-full object-cover cursor-pointer"
                onClick={() => getCmPhotoUrl() && setShowFullPhotoModal({ reportId: report.id, imageUrl: getCmPhotoUrl()!, type: 'CM Photo' })}
              />
            ) : (
              <User className="h-4 w-4 text-gray-400" />
            )}
          </div>
          <div className="text-center">
            <span className="text-xs text-gray-600 text-center leading-tight block">{getCmDisplayName(report)}</span>
            <span className="text-xs text-gray-500 block">CM</span>
          </div>
        </div>

        {/* MP - Show when MP data is present */}
        {report.mpData && (
          <div className="flex flex-col items-center space-y-1">
            <div className="w-8 h-8 rounded-full overflow-hidden border border-indigo-200 bg-gray-100 flex items-center justify-center">
              {getMpPhotoUrl() ? (
                <img
                  src={getMpPhotoUrl()!}
                  alt="MP"
                  className="w-full h-full object-cover cursor-pointer"
                  onClick={() => getMpPhotoUrl() && setShowFullPhotoModal({ reportId: report.id, imageUrl: getMpPhotoUrl()!, type: 'MP Photo' })}
                />
              ) : (
                <User className="h-4 w-4 text-gray-400" />
              )}
            </div>
            <div className="text-center">
              <span className="text-xs text-gray-600 text-center leading-tight block">{getMpDisplayName(report)}</span>
              <span className="text-xs text-gray-500 block">MP</span>
            </div>
          </div>
        )}

        {/* MLA - Always show when MLA info is present */}
        {report.mlaName && (
          <div className="flex flex-col items-center space-y-1">
            <div className="w-8 h-8 rounded-full overflow-hidden border border-purple-200 bg-gray-100 flex items-center justify-center">
              {getMlaPhotoUrl() ? (
                <img
                  src={getMlaPhotoUrl()!}
                  alt="MLA"
                  className="w-full h-full object-cover cursor-pointer"
                  onClick={() => setShowFullPhotoModal({ reportId: report.id, imageUrl: getMlaPhotoUrl()!, type: 'MLA Photo' })}
                />
              ) : (
                <User className="h-4 w-4 text-gray-400" />
              )}
            </div>
            <div className="text-center">
              <span className="text-xs text-gray-600 text-center leading-tight block">{report.mlaName}</span>
              <span className="text-xs text-gray-500 block">MLA</span>
            </div>
          </div>
        )}

        {/* Local Civic Body Display - Show when type is selected */}
        {report.localCivicBody && report.localCivicBody.bodyType && (
          <div className="flex flex-col items-center space-y-1">
            <div className="w-8 h-8 rounded-full overflow-hidden border border-orange-200 bg-gray-100 flex items-center justify-center">
              {getCivicBodyPhotoUrl() ? (
                <img
                  src={getCivicBodyPhotoUrl()!}
                  alt="Civic Body"
                  className="w-full h-full object-cover cursor-pointer"
                  onClick={() => setShowFullPhotoModal({ reportId: report.id, imageUrl: getCivicBodyPhotoUrl()!, type: 'Civic Body Photo' })}
                />
              ) : (
                <Building2 className="h-4 w-4 text-gray-400" />
              )}
            </div>
            <div className="text-center">
              <span className="text-xs text-gray-600 text-center leading-tight block">
                {report.localCivicBody.bodyType}
              </span>
              {report.localCivicBody.bodyName && (
                <span className="text-xs text-gray-500 block">{report.localCivicBody.bodyName}</span>
              )}
              {report.localCivicBody.representativeName && (
                <span className="text-xs text-gray-500 block">{report.localCivicBody.representativeName}</span>
              )}
            </div>
          </div>
        )}
      </div>
    );
  });

  // Component for status display with collapsible resolution details
  const StatusDisplay = ({ report, isEditing = false }: { report: Report; isEditing?: boolean }) => {
    const { data: proofImageUrl } = useFileUrl(report.proofPhotoPath || '');
    const isExpanded = expandedResolutions.has(report.id);

    if (isEditing && editingData && editingData.id === report.id) {
      return (
        <div className="space-y-2 min-w-[140px]">
          <select
            key={`status-select-${report.id}`}
            value={editingData.status}
            onChange={(e) => handleStatusChange(e.target.value)}
            className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="Open">Open</option>
            <option value="Resolved">Resolved</option>
          </select>

          {editingData.status.toLowerCase() === 'resolved' && (
            <div className="mt-2 p-2 bg-green-50 rounded border border-green-200">
              <h5 className="text-xs font-semibold text-green-800 mb-2">Resolution Details</h5>
              <div className="space-y-2">
                <input
                  key={`reporter-name-input-${report.id}`}
                  type="text"
                  value={editingData.reporterName}
                  onChange={(e) => handleEditingDataChange('reporterName', e.target.value)}
                  placeholder="Reporter Name"
                  className="w-full px-1 py-0.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-green-500 focus:border-green-500"
                />
                <textarea
                  key={`completion-notes-textarea-${report.id}`}
                  value={editingData.completionNotes}
                  onChange={(e) => handleEditingDataChange('completionNotes', e.target.value)}
                  placeholder="Completion Notes"
                  className="w-full px-1 py-0.5 text-xs border border-gray-300 rounded resize-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
                  rows={2}
                />
                <div className="space-y-1">
                  {(proofImageUrl || (editingData.id === report.id && editingData.newProofPhotoPreview)) && (
                    <div className="relative">
                      <button
                        onClick={() => {
                          const imageUrl = (editingData.id === report.id && editingData.newProofPhotoPreview) || proofImageUrl;
                          if (imageUrl) {
                            setShowFullPhotoModal({ reportId: report.id, imageUrl, type: 'Resolution Photo' });
                          }
                        }}
                        className="w-16 h-16 rounded border-2 border-green-300 overflow-hidden hover:border-green-400 transition-colors group relative"
                      >
                        <img
                          src={(editingData.id === report.id && editingData.newProofPhotoPreview) || proofImageUrl!}
                          alt="Resolution Photo"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
                          <Eye className="h-3 w-3 text-white" />
                        </div>
                      </button>
                      {editingData.id === report.id && editingData.newProofPhoto && (
                        <div className="absolute -bottom-1 -left-1 bg-green-500 text-white px-1 py-0.5 rounded text-xs font-medium">
                          New
                        </div>
                      )}
                    </div>
                  )}
                  <button
                    onClick={() => {
                      const input = document.createElement('input');
                      input.type = 'file';
                      input.accept = 'image/*';
                      input.onchange = (e) => {
                        const file = (e.target as HTMLInputElement).files?.[0];
                        if (file) handlePhotoSelect(file, 'proof');
                      };
                      input.click();
                    }}
                    className="w-full bg-green-600 text-white px-2 py-1 rounded text-xs hover:bg-green-700 transition-colors"
                  >
                    {proofImageUrl || (editingData.id === report.id && editingData.newProofPhotoPreview) ? 'Replace Proof Photo' : 'Upload Proof Photo'}
                  </button>
                  {editingData.id === report.id && editingData.newProofPhoto && (
                    <span className="text-xs text-green-600">New proof photo selected</span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="space-y-2 min-w-[120px]">
        <div className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(report.status)}`}>
          {getStatusIcon(report.status)}
          <span>{getStatusDisplayText(report.status)}</span>
        </div>

        {report.status.toLowerCase() === 'resolved' && (
          <div className="mt-2 bg-green-50 border border-green-200 rounded overflow-hidden">
            {/* Collapsed Summary - Always visible */}
            <button
              onClick={() => toggleResolutionExpansion(report.id)}
              className="w-full p-2 flex items-center justify-between hover:bg-green-100 transition-colors text-left"
            >
              <span className="text-xs font-medium text-green-700">
                + Show Details
              </span>
              {isExpanded ? (
                <ChevronUp className="h-3 w-3 text-green-700 flex-shrink-0" />
              ) : (
                <ChevronDown className="h-3 w-3 text-green-700 flex-shrink-0" />
              )}
            </button>

            {/* Expanded Content - Shown when expanded */}
            {isExpanded && (
              <div className="p-2 pt-0 space-y-2 animate-in slide-in-from-top-2 duration-200">
                {report.reporterName && (
                  <div>
                    <p className="text-xs text-gray-600">Resolved by:</p>
                    <p className="text-xs font-medium text-green-700">{report.reporterName}</p>
                  </div>
                )}
                
                {report.completionNotes && (
                  <div>
                    <p className="text-xs text-gray-600">Notes:</p>
                    <p className="text-xs text-green-700 leading-tight">{report.completionNotes}</p>
                  </div>
                )}
                
                {proofImageUrl && (
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Proof Photo:</p>
                    <button
                      onClick={() => setShowFullPhotoModal({ reportId: report.id, imageUrl: proofImageUrl, type: 'Resolution Photo' })}
                      className="w-12 h-12 rounded border-2 border-green-300 overflow-hidden hover:border-green-400 transition-colors group relative"
                    >
                      <img
                        src={proofImageUrl}
                        alt="Resolution Photo"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <Eye className="h-3 w-3 text-white" />
                      </div>
                    </button>
                    <p className="text-xs text-green-600 mt-1">Click to view</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  // FIXED: Component for location display - shows address (editable) and coordinates (read-only) as separate distinct fields
  const LocationDisplay = ({ report, isEditing = false }: { report: Report; isEditing?: boolean }) => {
    if (isEditing && editingData && editingData.id === report.id) {
      return (
        <div className="space-y-2 min-w-[220px]">
          <div>
            <label className="text-xs font-medium text-gray-700 mb-1 block">Address (Editable):</label>
            <textarea
              key={`address-textarea-${report.id}`}
              value={editingData.address}
              onChange={(e) => handleEditingDataChange('address', e.target.value)}
              placeholder="Enter address"
              className="w-full px-2 py-1 text-xs border border-gray-300 rounded resize-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              rows={2}
            />
          </div>
          
          <div>
            <label className="text-xs font-medium text-gray-700 mb-1 block">Coordinates (Read-only):</label>
            <div className="px-2 py-1 text-xs bg-gray-50 border border-gray-200 rounded text-gray-600 font-mono">
              {editingData.latitude.toFixed(6)}, {editingData.longitude.toFixed(6)}
            </div>
            <p className="text-xs text-gray-500 mt-1 italic">Use the map button below to update coordinates</p>
          </div>
          
          <button
            type="button"
            onClick={() => setShowLocationModal(true)}
            disabled={!isMapLoaded}
            className="w-full flex items-center justify-center space-x-1 bg-blue-600 text-white py-1 px-2 rounded text-xs hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Edit3 className="h-3 w-3" />
            <span>Select on Map</span>
          </button>
          
          {selectedLocation && (
            <div className="text-xs text-green-600 bg-green-50 p-1 rounded">
              New location selected: {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
            </div>
          )}
        </div>
      );
    }

    // FIXED: Get address and coordinates using unified logic - instant loading, always correct
    const address = getReportAddress(report);
    const coords = getReportCoordinates(report);
    
    return (
      <div className="max-w-xs space-y-2">
        <div>
          <p className="text-xs font-medium text-gray-700 mb-0.5">Address:</p>
          <p className="text-xs text-gray-600 line-clamp-2" title={address}>
            {address}
          </p>
        </div>
        <div>
          <p className="text-xs font-medium text-gray-700 mb-0.5">Coordinates:</p>
          <p className="text-xs text-gray-500 font-mono">
            {coords}
          </p>
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Pagination Controls */}
      <div className="mb-4 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-lg border border-gray-200">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">Reports per page:</label>
          <select
            value={reportsPerPage}
            onChange={(e) => {
              setReportsPerPage(Number(e.target.value));
              setCurrentPage(0);
            }}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
            disabled={currentPage === 0}
            className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="Previous page"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          
          <span className="text-sm text-gray-700 px-3">
            Page {currentPage + 1} of {totalPages || 1}
          </span>
          
          <button
            onClick={() => setCurrentPage(prev => Math.min(totalPages - 1, prev + 1))}
            disabled={currentPage >= totalPages - 1}
            className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="Next page"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        <div className="text-sm text-gray-600">
          Showing {currentPage * reportsPerPage + 1}-{Math.min((currentPage + 1) * reportsPerPage, reports.length)} of {reports.length} reports
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse bg-white">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left p-3 text-xs font-semibold text-gray-700 border-r border-gray-200 min-w-[100px]">
                <div className="flex items-center space-x-1">
                  <Hash className="h-3 w-3" />
                  <span>Report ID</span>
                </div>
              </th>
              <th className="text-left p-3 text-xs font-semibold text-gray-700 border-r border-gray-200 min-w-[120px]">Issue Type</th>
              <th className="text-center p-3 text-xs font-semibold text-gray-700 border-r border-gray-200 min-w-[80px]">Issue Photo</th>
              <th className="text-center p-3 text-xs font-semibold text-gray-700 border-r border-gray-200 min-w-[140px]">Status & Resolution</th>
              <th className="text-left p-3 text-xs font-semibold text-gray-700 border-r border-gray-200 min-w-[100px]">Reported By</th>
              <th className="text-left p-3 text-xs font-semibold text-gray-700 border-r border-gray-200 min-w-[150px]">Notes</th>
              <th className="text-left p-3 text-xs font-semibold text-gray-700 border-r border-gray-200 min-w-[120px]">Date/Time</th>
              <th className="text-left p-3 text-xs font-semibold text-gray-700 border-r border-gray-200 min-w-[220px]">
                <div className="flex items-center space-x-1">
                  <MapPin className="h-3 w-3" />
                  <span>Location</span>
                </div>
              </th>
              <th className="text-center p-3 text-xs font-semibold text-gray-700 border-r border-gray-200 min-w-[180px]">Responsible Leaders/Photos</th>
              <th className="text-center p-3 text-xs font-semibold text-gray-700 min-w-[120px]">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedReports.map((report) => (
              <tr key={report.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                {editingReportId === report.id && editingData ? (
                  <>
                    <td className="p-3 border-r border-gray-200">
                      <div className="flex items-center space-x-1">
                        <Hash className="h-3 w-3 text-gray-400" />
                        <span className="text-xs font-mono text-gray-600 font-medium">{report.id.slice(-8)}</span>
                      </div>
                    </td>

                    <td className="p-3 border-r border-gray-200">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-1 mb-1">
                          <span className="flex items-center justify-center w-6 h-6">{getIssueTypeDisplay(editingData.issueType === 'Other' ? editingData.customIssueType : editingData.issueType)}</span>
                          <select
                            key={`issue-type-select-${report.id}`}
                            value={editingData.issueType}
                            onChange={(e) => handleIssueTypeChange(e.target.value)}
                            className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                          >
                            {predefinedIssueTypes.map(type => (
                              <option key={type.value} value={type.value}>
                                {type.emoji || ''} {type.value}
                              </option>
                            ))}
                          </select>
                        </div>
                        {editingData.issueType === 'Other' && (
                          <input
                            key={`custom-issue-type-input-${report.id}`}
                            type="text"
                            value={editingData.customIssueType}
                            onChange={(e) => handleEditingDataChange('customIssueType', e.target.value)}
                            placeholder="Enter custom issue type"
                            className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                          />
                        )}
                      </div>
                    </td>

                    <td className="p-3 border-r border-gray-200 text-center">
                      <PhotoThumbnail report={report} type="main" isEditing={true} />
                    </td>

                    <td className="p-3 border-r border-gray-200">
                      <StatusDisplay report={report} isEditing={true} />
                    </td>

                    <td className="p-3 border-r border-gray-200">
                      <input
                        key={`username-input-${report.id}`}
                        type="text"
                        value={editingData.username}
                        onChange={(e) => handleEditingDataChange('username', e.target.value)}
                        placeholder="Username (empty if not provided)"
                        className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </td>

                    <td className="p-3 border-r border-gray-200">
                      <textarea
                        key={`notes-textarea-${report.id}`}
                        value={editingData.notes}
                        onChange={(e) => handleEditingDataChange('notes', e.target.value)}
                        placeholder="Notes/Comments (empty if not provided)"
                        className="w-full px-2 py-1 text-xs border border-gray-300 rounded resize-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        rows={3}
                      />
                    </td>

                    <td className="p-3 border-r border-gray-200">
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-3 w-3 text-gray-400" />
                        <span className="text-xs text-gray-600">{formatDate(report.timestamp)}</span>
                      </div>
                    </td>

                    <td className="p-3 border-r border-gray-200">
                      <LocationDisplay report={report} isEditing={true} />
                    </td>

                    <td className="p-3 border-r border-gray-200">
                      <MinisterInfo report={report} isEditing={true} />
                    </td>

                    <td className="p-3 text-center">
                      <div className="flex flex-col space-y-1">
                        <button
                          onClick={handleSave}
                          disabled={isUploading || isUpdating}
                          className="bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-2 py-1 rounded text-xs font-medium transition-colors flex items-center justify-center space-x-1"
                        >
                          <Save className="h-3 w-3" />
                          <span>{isUploading || isUpdating ? 'Saving...' : 'Save'}</span>
                        </button>
                        <button
                          onClick={handleCancel}
                          className="bg-gray-500 hover:bg-gray-600 text-white px-2 py-1 rounded text-xs font-medium transition-colors flex items-center justify-center space-x-1"
                        >
                          <X className="h-3 w-3" />
                          <span>Cancel</span>
                        </button>
                      </div>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="p-3 border-r border-gray-200">
                      <div className="flex items-center space-x-1">
                        <Hash className="h-3 w-3 text-gray-400" />
                        <span className="text-xs font-mono text-gray-600 font-medium">{report.id.slice(-8)}</span>
                      </div>
                    </td>

                    <td className="p-3 border-r border-gray-200">
                      <div className="flex items-center space-x-1">
                        <span className="flex items-center justify-center w-6 h-6">{getIssueTypeDisplay(report.issueType)}</span>
                        <span className="text-xs text-gray-700 truncate" title={report.issueType}>
                          {report.issueType}
                        </span>
                      </div>
                    </td>

                    <td className="p-3 border-r border-gray-200 text-center">
                      <PhotoThumbnail report={report} type="main" />
                    </td>

                    <td className="p-3 border-r border-gray-200 text-center">
                      <StatusDisplay report={report} />
                    </td>

                    <td className="p-3 border-r border-gray-200">
                      <div className="flex items-center space-x-1">
                        <User className="h-3 w-3 text-gray-400" />
                        <span className="text-xs text-gray-700 truncate" title={report.username || 'Not provided'}>
                          {report.username || (
                            <span className="text-gray-400 italic">Empty</span>
                          )}
                        </span>
                      </div>
                    </td>

                    <td className="p-3 border-r border-gray-200">
                      <div className="max-w-xs">
                        {report.notes ? (
                          <p className="text-xs text-gray-700 line-clamp-3" title={report.notes}>
                            {report.notes}
                          </p>
                        ) : (
                          <span className="text-xs text-gray-400 italic">Empty</span>
                        )}
                      </div>
                    </td>

                    <td className="p-3 border-r border-gray-200">
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-3 w-3 text-gray-400" />
                        <span className="text-xs text-gray-600">{formatDate(report.timestamp)}</span>
                      </div>
                    </td>

                    <td className="p-3 border-r border-gray-200">
                      <LocationDisplay report={report} />
                    </td>

                    <td className="p-3 border-r border-gray-200 text-center">
                      <MinisterInfo report={report} />
                    </td>

                    <td className="p-3 text-center">
                      <div className="flex flex-col space-y-1">
                        <button
                          onClick={() => handleEdit(report)}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded text-xs font-medium transition-colors flex items-center justify-center space-x-1"
                        >
                          <Edit className="h-3 w-3" />
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() => handleDelete(report.id)}
                          disabled={isDeleting}
                          className="bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-2 py-1 rounded text-xs font-medium transition-colors flex items-center justify-center space-x-1"
                        >
                          <Trash2 className="h-3 w-3" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Resolution Form Modal */}
      {showResolutionForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000] p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <CheckCircle className="h-6 w-6 text-green-600" />
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900">Complete Resolution Form</h3>
              </div>
              <button
                onClick={() => {
                  setShowResolutionForm(null);
                  setResolutionFormData({
                    reporterName: '',
                    notes: '',
                    proofPhoto: null,
                    proofPhotoPreview: null
                  });
                }}
                className="text-gray-500 hover:text-gray-700 transition-colors p-1 rounded-full hover:bg-gray-100"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="px-4 sm:px-6 py-3 bg-blue-50 border-b border-blue-200">
              <p className="text-sm text-blue-800">
                <strong>Admin Resolution Required:</strong> To change this report's status to "Resolved", you must complete the same resolution form as regular users. This ensures consistent documentation for all resolved reports.
              </p>
            </div>

            <div className="p-4 sm:p-6 space-y-4">
              <div className="space-y-2">
                <label className="block text-base font-medium text-gray-700">Reporter Name *</label>
                <input
                  type="text"
                  value={resolutionFormData.reporterName}
                  onChange={(e) => setResolutionFormData(prev => ({ ...prev, reporterName: e.target.value }))}
                  placeholder="Enter your name as the resolver"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="block text-base font-medium text-gray-700">Resolution Notes (Optional)</label>
                <textarea
                  value={resolutionFormData.notes}
                  onChange={(e) => setResolutionFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Add any comments about how the issue was resolved..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base resize-none"
                  maxLength={200}
                />
                <div className="text-sm text-gray-500 text-right">
                  {resolutionFormData.notes.length}/200 characters
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-base font-medium text-gray-700">
                  Proof Photo *
                </label>
                
                {resolutionFormData.proofPhotoPreview ? (
                  <div className="space-y-2">
                    <img
                      src={resolutionFormData.proofPhotoPreview}
                      alt="Proof Preview"
                      className="w-full h-32 object-cover rounded-lg border"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setResolutionFormData(prev => ({
                          ...prev,
                          proofPhoto: null,
                          proofPhotoPreview: null
                        }));
                      }}
                      className="text-red-600 hover:text-red-700 text-base font-medium"
                    >
                      Remove photo
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const input = document.createElement('input');
                        input.type = 'file';
                        input.accept = 'image/*';
                        input.capture = 'environment';
                        input.onchange = (e) => {
                          const file = (e.target as HTMLInputElement).files?.[0];
                          if (file) handleResolutionPhotoSelect(file);
                        };
                        input.click();
                      }}
                      className="flex flex-col items-center justify-center p-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-all duration-200 min-h-[80px]"
                    >
                      <Camera className="h-6 w-6 text-blue-500 mb-2" />
                      <span className="text-sm font-medium">Take Photo</span>
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => {
                        const input = document.createElement('input');
                        input.type = 'file';
                        input.accept = 'image/*';
                        input.onchange = (e) => {
                          const file = (e.target as HTMLInputElement).files?.[0];
                          if (file) handleResolutionPhotoSelect(file);
                        };
                        input.click();
                      }}
                      className="flex flex-col items-center justify-center p-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-400 hover:bg-green-50 transition-all duration-200 min-h-[80px]"
                    >
                      <Upload className="h-6 w-6 text-green-500 mb-2" />
                      <span className="text-sm font-medium">Upload Photo</span>
                    </button>
                  </div>
                )}
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  onClick={handleResolutionFormSubmit}
                  disabled={!resolutionFormData.proofPhoto || !resolutionFormData.reporterName.trim() || isUploading || isUpdatingStatus}
                  className="flex-1 bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center space-x-2"
                >
                  <CheckCircle className="h-5 w-5" />
                  <span>{isUploading || isUpdatingStatus ? 'Resolving...' : 'Mark as Resolved'}</span>
                </button>
                <button
                  onClick={() => {
                    setShowResolutionForm(null);
                    setResolutionFormData({
                      reporterName: '',
                      notes: '',
                      proofPhoto: null,
                      proofPhotoPreview: null
                    });
                  }}
                  className="flex-1 bg-gray-500 text-white py-3 px-6 rounded-lg hover:bg-gray-600 transition-colors font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Location Selection Modal */}
      {showLocationModal && editingData && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000] p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <MapPin className="h-6 w-6 text-blue-600" />
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900">Update Report Location</h3>
              </div>
              <button
                onClick={() => setShowLocationModal(false)}
                className="text-gray-500 hover:text-gray-700 transition-colors p-1 rounded-full hover:bg-gray-100"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="px-4 sm:px-6 py-3 bg-blue-50 border-b border-blue-200">
              <p className="text-sm text-gray-600">
                Click anywhere on the map to update the report location. The coordinates and address will be automatically updated.
              </p>
              {selectedLocation && (
                <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-700 font-medium">
                    📍 New location selected: {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
                  </p>
                  {isLoadingSelectedLocation && (
                    <p className="text-xs text-green-600 mt-1">Loading address...</p>
                  )}
                </div>
              )}
            </div>

            <div className="relative flex-1 p-4 sm:p-6" style={{ minHeight: '300px' }}>
              <div 
                ref={mapModalRef}
                className="w-full h-full rounded-lg"
                style={{ minHeight: '300px' }}
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

            <div className="flex items-center justify-end space-x-3 p-4 sm:p-6 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => setShowLocationModal(false)}
                className="bg-gray-300 text-gray-700 py-2.5 px-4 rounded-lg hover:bg-gray-400 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmLocationSelection}
                disabled={!selectedLocation || isLoadingSelectedLocation}
                className="bg-blue-600 text-white py-2.5 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center space-x-2"
              >
                <Check className="h-4 w-4" />
                <span>
                  {isLoadingSelectedLocation ? 'Loading...' : 'Update Location'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="bg-red-100 p-2 rounded-full">
                <Trash2 className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Delete Report</h3>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-600 mb-4">
                Are you sure you want to permanently delete this report? This action cannot be undone.
              </p>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <div className="flex items-start space-x-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 shrink-0" />
                  <div className="text-sm text-yellow-800">
                    <p className="font-medium">Report ID:</p>
                    <p className="font-mono">{showDeleteConfirm}</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={confirmDelete}
                disabled={isDeleting}
                className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center space-x-2"
              >
                <Trash2 className="h-4 w-4" />
                <span>{isDeleting ? 'Deleting...' : 'Delete Report'}</span>
              </button>
              <button
                onClick={() => setShowDeleteConfirm(null)}
                disabled={isDeleting}
                className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 disabled:opacity-50 transition-colors font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Full Photo Modal */}
      {showFullPhotoModal && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[1000] p-4">
          <div className="relative max-w-6xl max-h-full w-full">
            <button
              onClick={() => setShowFullPhotoModal(null)}
              className="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors z-10"
            >
              <X className="h-8 w-8" />
            </button>
            <div className="relative bg-white rounded-lg overflow-hidden shadow-2xl">
              <img
                src={showFullPhotoModal.imageUrl}
                alt="Full size photo"
                className="w-full h-auto max-h-[80vh] object-contain"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent text-white p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-lg">{showFullPhotoModal.type}</p>
                    <p className="text-sm opacity-90">Report ID: {showFullPhotoModal.reportId}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
