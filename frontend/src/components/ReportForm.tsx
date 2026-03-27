import React, { useState, useRef, useEffect } from 'react';
import { Camera, Upload, MapPin, Loader2, User, MessageSquare, UserCheck, AlertTriangle, RefreshCw, Edit3, ImageIcon, X, Check, CheckCircle, Award, Building2, Droplets, Waves, ChevronDown } from 'lucide-react';
import { useGeolocation } from 'react-use';
import { useFileUpload, useFileUrl } from '../blob-storage/FileStorage';
import { useSubmitReport, useGetReport, useGetMyVolunteerProfile, useGetDirectory, useGetConstituenciesByState, useGetVidhanSabhaConstituenciesByState } from '../hooks/useQueries';
import { CertificateGenerator } from './CertificateGenerator';
import { useLanguage } from '../contexts/LanguageContext';
import { useNavigate, useRouterState } from '@tanstack/react-router';
import { Representative, LocalCivicBody, Constituency } from '../backend';
import { useLocationRefresh } from '../contexts/LocationRefreshContext';

type IssueCategory = 'pothole' | 'garbage' | 'streetlight' | 'waterlogging' | 'flood' | 'illegal_dumping' | 'illegal_parking' | 'other';

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
  { value: 'Municipal Corporation', label: 'Municipal Corporation (Mahanagar Palika)', representativeLabel: 'Mayor Name' },
  { value: 'Municipality', label: 'Municipality (Nagar Palika/Municipal Council)', representativeLabel: 'Chairperson/President Name' },
  { value: 'Nagar Panchayat', label: 'Nagar Panchayat', representativeLabel: 'Chairperson/President Name' },
  { value: 'Zilla Parishad', label: 'Zilla Parishad', representativeLabel: 'President/Adhyaksh Name' },
  { value: 'Panchayat Samiti', label: 'Panchayat Samiti/Block Panchayat', representativeLabel: 'Chairperson Name' },
  { value: 'Gram Panchayat', label: 'Gram Panchayat', representativeLabel: 'Sarpanch Name' }
];

// Leaflet imports
declare global {
  interface Window {
    L: any;
  }
}

// Helper functions moved to the top to avoid temporal dead zone issues
function getIssueTypeEmoji(issueType: string) {
  const lowerType = issueType.toLowerCase();
  if (lowerType.includes('pothole')) return '🕳️';
  if (lowerType.includes('garbage') || lowerType.includes('waste')) return '🗑️';
  if (lowerType.includes('streetlight') || lowerType.includes('light')) return '💡';
  if (lowerType.includes('waterlogging') || lowerType.includes('water')) return '💧';
  if (lowerType.includes('flood')) return '🌊';
  if (lowerType.includes('dumping')) return '🚯';
  if (lowerType.includes('parking')) return '🚗';
  return '❓';
}

function getIssueBadgeClass(issueType: string) {
  const lowerType = issueType.toLowerCase();
  if (lowerType.includes('pothole')) return 'issue-orange';
  if (lowerType.includes('garbage') || lowerType.includes('waste')) return 'issue-green';
  if (lowerType.includes('streetlight') || lowerType.includes('light')) return 'issue-yellow';
  if (lowerType.includes('waterlogging') || lowerType.includes('water')) return 'issue-blue';
  if (lowerType.includes('flood')) return 'issue-blue';
  if (lowerType.includes('dumping')) return 'issue-red';
  if (lowerType.includes('parking')) return 'issue-purple';
  return 'issue-gray';
}

export function ReportForm() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const routerState = useRouterState();
  const { locationRefreshKey } = useLocationRefresh();
  
  // Volunteer profile data
  const { data: volunteerProfile, isLoading: isLoadingVolunteer } = useGetMyVolunteerProfile();
  const isApprovedVolunteer = volunteerProfile?.approved || false;
  
  // Directory data for PM/CM/MP/MLA - CRITICAL: This is now the ONLY source for PM/CM/MP/MLA data
  const { data: directory, isLoading: isLoadingDirectory } = useGetDirectory();
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [issueCategory, setIssueCategory] = useState<IssueCategory>('pothole');
  const [customIssueType, setCustomIssueType] = useState<string>('');
  const [username, setUsername] = useState<string>('Anonymous User');
  const [notes, setNotes] = useState<string>('');
  
  // MLA state - now with auto-fetch capability and manual selection
  const [mlaName, setMlaName] = useState<string>('');
  const [mlaPhoto, setMlaPhoto] = useState<File | null>(null);
  const [mlaPhotoPreview, setMlaPhotoPreview] = useState<string | null>(null);
  const [mlaAutoFetched, setMlaAutoFetched] = useState<boolean>(false);
  const [mlaEditingName, setMlaEditingName] = useState<boolean>(false);
  const [showMlaDropdown, setShowMlaDropdown] = useState<boolean>(false);
  const [selectedMlaConstituency, setSelectedMlaConstituency] = useState<string>('');
  const [showManualMlaSelector, setShowManualMlaSelector] = useState<boolean>(false);
  
  // Local Civic Body state
  const [civicBodyType, setCivicBodyType] = useState<string>('');
  const [civicBodyName, setCivicBodyName] = useState<string>('');
  const [civicBodyRepName, setCivicBodyRepName] = useState<string>('');
  const [civicBodyPhoto, setCivicBodyPhoto] = useState<File | null>(null);
  const [civicBodyPhotoPreview, setCivicBodyPhotoPreview] = useState<string | null>(null);
  
  const [locationData, setLocationData] = useState<LocationData>({});
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [shouldFetchLocation, setShouldFetchLocation] = useState(true);
  const [customAddress, setCustomAddress] = useState<string>('');
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [mapInstance, setMapInstance] = useState<any>(null);
  const [selectedLocation, setSelectedLocation] = useState<{lat: number, lng: number} | null>(null);
  const [isLoadingSelectedLocation, setIsLoadingSelectedLocation] = useState(false);
  const [hasCustomLocation, setHasCustomLocation] = useState(false);
  const mapModalRef = useRef<HTMLDivElement>(null);
  
  // PM data - now EXCLUSIVELY from directory
  const [pmName, setPmName] = useState('Not Available');
  const [pmPhoto, setPmPhoto] = useState<string | null>(null);
  const [pmCustomPhoto, setPmCustomPhoto] = useState<File | null>(null);
  const [pmCustomPhotoPreview, setPmCustomPhotoPreview] = useState<string | null>(null);
  const [pmEditingName, setPmEditingName] = useState(false);
  
  // CM data - now EXCLUSIVELY from directory
  const [cmName, setCmName] = useState('Not Available');
  const [cmPhoto, setCmPhoto] = useState<string | null>(null);
  const [cmCustomPhoto, setCmCustomPhoto] = useState<File | null>(null);
  const [cmCustomPhotoPreview, setCmCustomPhotoPreview] = useState<string | null>(null);
  const [cmEditingName, setCmEditingName] = useState(false);
  
  // MP data - EXCLUSIVELY from directory based on location or manual selection
  // FIX: Store the complete MP data object when manually selected
  const [mpData, setMpData] = useState<Representative | null>(null);
  const [mpName, setMpName] = useState('Not Available');
  const [mpPhoto, setMpPhoto] = useState<string | null>(null);
  const [mpCustomPhoto, setMpCustomPhoto] = useState<File | null>(null);
  const [mpCustomPhotoPreview, setMpCustomPhotoPreview] = useState<string | null>(null);
  const [mpEditingName, setMpEditingName] = useState(false);
  const [showMpSection, setShowMpSection] = useState(false);
  const [showManualConstituencySelector, setShowManualConstituencySelector] = useState(false);
  const [selectedConstituency, setSelectedConstituency] = useState<string>('');
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
  const { data: constituenciesByState, isLoading: isLoadingConstituencies } = useGetConstituenciesByState(locationData.state || '');

  // Fetch Vidhan Sabha constituencies by state for MLA selection
  const { data: vidhanSabhaConstituenciesByState, isLoading: isLoadingVidhanSabhaConstituencies } = useGetVidhanSabhaConstituenciesByState(locationData.state || '');

  // Get PM photo URL from directory ONLY - NO Wikipedia fallback
  const { data: pmPhotoUrl } = useFileUrl(directory?.primeMinister?.photoPath || '');
  
  // Get CM from directory based on state - NO Wikipedia fallback
  const cmFromDirectory = React.useMemo(() => {
    if (!directory || !locationData.state) return null;
    
    // Check states
    const state = directory.states.find(s => s.name === locationData.state);
    if (state?.cm) return state.cm;
    
    // Check union territories
    const ut = directory.unionTerritories.find(u => u.name === locationData.state);
    if (ut?.cm) return ut.cm;
    
    return null;
  }, [directory, locationData.state]);
  
  const { data: cmPhotoUrl } = useFileUrl(cmFromDirectory?.photoPath || '');

  // ENHANCED: Get MP from directory based on location with improved matching logic
  const mpFromDirectory = React.useMemo(() => {
    if (!directory || !locationData.state) return null;
    
    // Search through all states for constituencies
    const state = directory.states.find(s => s.name === locationData.state);
    if (!state) return null;
    
    // Build full address string for matching
    const addressParts = [
      locationData.neighbourhood,
      locationData.suburb,
      locationData.village,
      locationData.city,
      locationData.city_district,
      locationData.county,
      locationData.state_district
    ].filter(Boolean).map(part => part!.toLowerCase());
    
    const fullAddress = addressParts.join(' ');
    
    console.log('=== MP AUTO-FETCH LOGIC ===');
    console.log('State:', locationData.state);
    console.log('Full address for matching:', fullAddress);
    console.log('Available constituencies:', state.constituencies.map(c => c.name));
    
    // Step 1: Try to match Constituency name in the address
    for (const constituency of state.constituencies) {
      const constituencyNameLower = constituency.name.toLowerCase();
      
      // Check if constituency name appears in any address part
      if (addressParts.some(part => part.includes(constituencyNameLower) || constituencyNameLower.includes(part))) {
        console.log('✓ Constituency name match found:', constituency.name);
        if (constituency.mp) {
          console.log('✓ MP found via constituency name match:', constituency.mp.name);
          return constituency.mp;
        }
      }
    }
    
    // Step 2: Check Remarks field for area/block matches
    for (const constituency of state.constituencies) {
      if (constituency.mp && constituency.mp.remarks) {
        const remarksLower = constituency.mp.remarks.toLowerCase();
        
        // Split remarks by common delimiters (comma, semicolon, pipe, newline)
        const remarksParts = remarksLower.split(/[,;|\n]/).map(part => part.trim()).filter(Boolean);
        
        console.log('Checking remarks for constituency:', constituency.name);
        console.log('Remarks parts:', remarksParts);
        
        // Check if any address part matches any remarks part
        for (const addressPart of addressParts) {
          for (const remarkPart of remarksParts) {
            if (addressPart.includes(remarkPart) || remarkPart.includes(addressPart)) {
              console.log('✓ Remarks match found:', remarkPart, 'matches', addressPart);
              console.log('✓ MP found via remarks match:', constituency.mp.name);
              return constituency.mp;
            }
          }
        }
      }
    }
    
    console.log('✗ No MP match found via auto-fetch');
    console.log('===========================');
    
    // If no match found, return null (MP section will show manual selector)
    return null;
  }, [directory, locationData.state, locationData.neighbourhood, locationData.suburb, locationData.village, locationData.city, locationData.city_district, locationData.county, locationData.state_district]);
  
  const { data: mpPhotoUrl } = useFileUrl(mpFromDirectory?.photoPath || '');

  // MLA auto-fetch logic - similar to MP auto-fetch
  const mlaFromDirectory = React.useMemo(() => {
    if (!directory || !locationData.state) return null;
    
    // Search through all states for constituencies and MLAs
    const state = directory.states.find(s => s.name === locationData.state);
    if (!state) return null;
    
    // Build full address string for matching
    const addressParts = [
      locationData.neighbourhood,
      locationData.suburb,
      locationData.village,
      locationData.city,
      locationData.city_district,
      locationData.county,
      locationData.state_district
    ].filter(Boolean).map(part => part!.toLowerCase());
    
    const fullAddress = addressParts.join(' ');
    
    console.log('=== MLA AUTO-FETCH LOGIC ===');
    console.log('State:', locationData.state);
    console.log('Full address for matching:', fullAddress);
    
    // Step 1: Try to match Vidhan Sabha Constituency name in the address
    for (const constituency of state.constituencies) {
      const constituencyNameLower = constituency.name.toLowerCase();
      
      // Check if constituency name appears in any address part
      if (addressParts.some(part => part.includes(constituencyNameLower) || constituencyNameLower.includes(part))) {
        console.log('✓ Vidhan Sabha Constituency name match found:', constituency.name);
        
        // Check if there are MLAs for this constituency
        if (constituency.mlas && constituency.mlas.length > 0) {
          const mla = constituency.mlas[0]; // Take the first MLA
          console.log('✓ MLA found via constituency name match:', mla.name);
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
            const remarksParts = remarksLower.split(/[,;|\n]/).map(part => part.trim()).filter(Boolean);
            
            console.log('Checking MLA remarks for constituency:', constituency.name);
            console.log('MLA:', mla.name);
            console.log('Remarks parts:', remarksParts);
            
            // Check if any address part matches any remarks part
            for (const addressPart of addressParts) {
              for (const remarkPart of remarksParts) {
                if (addressPart.includes(remarkPart) || remarkPart.includes(addressPart)) {
                  console.log('✓ MLA Remarks match found:', remarkPart, 'matches', addressPart);
                  console.log('✓ MLA found via remarks match:', mla.name);
                  return mla;
                }
              }
            }
          }
        }
      }
    }
    
    console.log('✗ No MLA match found via auto-fetch');
    console.log('============================');
    
    // If no match found, return null (manual MLA entry remains available)
    return null;
  }, [directory, locationData.state, locationData.neighbourhood, locationData.suburb, locationData.village, locationData.city, locationData.city_district, locationData.county, locationData.state_district]);
  
  const { data: mlaPhotoUrl } = useFileUrl(mlaFromDirectory?.photoPath || '');

  // Get constituency name for MP (auto-fetched or manually selected)
  const mpConstituencyName = React.useMemo(() => {
    if (selectedConstituency) {
      return selectedConstituency;
    }
    if (mpFromDirectory && directory && locationData.state) {
      const state = directory.states.find(s => s.name === locationData.state);
      if (state) {
        const constituency = state.constituencies.find(c => c.mp?.name === mpFromDirectory.name);
        return constituency?.name || '';
      }
    }
    return '';
  }, [mpFromDirectory, selectedConstituency, directory, locationData.state]);

  // Get constituency name for MLA (auto-fetched or manually selected)
  const mlaConstituencyName = React.useMemo(() => {
    if (selectedMlaConstituency) {
      return selectedMlaConstituency;
    }
    if (mlaFromDirectory && directory && locationData.state) {
      const state = directory.states.find(s => s.name === locationData.state);
      if (state) {
        const constituency = state.constituencies.find(c => 
          c.mlas && c.mlas.some(mla => mla.name === mlaFromDirectory.name)
        );
        return constituency?.name || '';
      }
    }
    return '';
  }, [mlaFromDirectory, selectedMlaConstituency, directory, locationData.state]);

  // Auto-fill username for approved volunteers
  useEffect(() => {
    if (isApprovedVolunteer && volunteerProfile?.name) {
      setUsername(volunteerProfile.name);
    } else if (!isApprovedVolunteer) {
      setUsername('Anonymous User');
    }
  }, [isApprovedVolunteer, volunteerProfile?.name]);

  // Update PM/CM data from directory EXCLUSIVELY - NO Wikipedia fallback
  useEffect(() => {
    if (directory?.primeMinister) {
      setPmName(directory.primeMinister.name);
      setPmPhoto(directory.primeMinister.photoPath);
    }
  }, [directory?.primeMinister]);

  useEffect(() => {
    if (cmFromDirectory) {
      setCmName(cmFromDirectory.name);
      setCmPhoto(cmFromDirectory.photoPath);
    } else {
      setCmName('Not Available');
      setCmPhoto(null);
    }
  }, [cmFromDirectory]);

  // Update MP data from directory when auto-fetched
  useEffect(() => {
    if (mpFromDirectory && !mpAutoFetched) {
      setMpName(mpFromDirectory.name);
      setMpPhoto(mpFromDirectory.photoPath);
      setMpData(mpFromDirectory);
      setMpAutoFetched(true);
      setShowMpSection(true);
    } else if (!mpFromDirectory && !mpAutoFetched) {
      // No MP found via auto-fetch, show manual selector
      setShowMpSection(true);
      setShowManualConstituencySelector(true);
    }
  }, [mpFromDirectory, mpAutoFetched]);

  // Update MLA data from directory when auto-fetched
  useEffect(() => {
    if (mlaFromDirectory && !mlaAutoFetched) {
      setMlaName(mlaFromDirectory.name);
      setMlaPhotoPreview(null);
      setMlaPhoto(null);
      setMlaAutoFetched(true);
    }
  }, [mlaFromDirectory, mlaAutoFetched]);

  // Fetch location on mount and when locationRefreshKey changes
  useEffect(() => {
    if (shouldFetchLocation && geolocation.latitude && geolocation.longitude) {
      fetchLocationData(geolocation.latitude, geolocation.longitude);
      setShouldFetchLocation(false);
    }
  }, [geolocation.latitude, geolocation.longitude, shouldFetchLocation, locationRefreshKey]);

  const fetchLocationData = async (lat: number, lng: number) => {
    setIsLoadingLocation(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`
      );
      const data = await response.json();
      
      if (data.address) {
        setLocationData(data.address);
      }
    } catch (error) {
      console.error('Error fetching location:', error);
    } finally {
      setIsLoadingLocation(false);
    }
  };

  const handleRefreshLocation = () => {
    setShouldFetchLocation(true);
    setMpAutoFetched(false);
    setMlaAutoFetched(false);
    setShowManualConstituencySelector(false);
    setShowManualMlaSelector(false);
    setSelectedConstituency('');
    setSelectedMlaConstituency('');
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCameraCapture = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleMlaPhotoSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setMlaPhoto(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setMlaPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePmPhotoSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setPmCustomPhoto(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPmCustomPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCmPhotoSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setCmCustomPhoto(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setCmCustomPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleMpPhotoSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setMpCustomPhoto(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setMpCustomPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCivicBodyPhotoSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setCivicBodyPhoto(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setCivicBodyPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleManualConstituencySelect = (constituencyName: string) => {
    setSelectedConstituency(constituencyName);
    
    // Find the MP for this constituency
    if (directory && locationData.state) {
      const state = directory.states.find(s => s.name === locationData.state);
      if (state) {
        const constituency = state.constituencies.find(c => c.name === constituencyName);
        if (constituency?.mp) {
          // FIX: Store the complete MP data object
          setMpData(constituency.mp);
          setMpName(constituency.mp.name);
          setMpPhoto(constituency.mp.photoPath);
          setShowManualConstituencySelector(false);
        }
      }
    }
  };

  const handleManualMlaSelect = (constituencyName: string) => {
    setSelectedMlaConstituency(constituencyName);
    
    // Find the MLA for this constituency
    if (directory && locationData.state) {
      const state = directory.states.find(s => s.name === locationData.state);
      if (state) {
        const constituency = state.constituencies.find(c => c.name === constituencyName);
        if (constituency?.mlas && constituency.mlas.length > 0) {
          const mla = constituency.mlas[0];
          setMlaName(mla.name);
          setMlaPhotoPreview(null);
          setMlaPhoto(null);
          setShowManualMlaSelector(false);
        }
      }
    }
  };

  const loadLeaflet = () => {
    return new Promise<void>((resolve, reject) => {
      if (window.L) {
        resolve();
        return;
      }

      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);

      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.onload = () => {
        setIsMapLoaded(true);
        resolve();
      };
      script.onerror = reject;
      document.head.appendChild(script);
    });
  };

  const openLocationModal = async () => {
    setShowLocationModal(true);
    
    if (!isMapLoaded) {
      await loadLeaflet();
    }

    setTimeout(() => {
      if (mapModalRef.current && window.L && !mapInstance) {
        const lat = geolocation.latitude || 20.5937;
        const lng = geolocation.longitude || 78.9629;
        
        const map = window.L.map(mapModalRef.current).setView([lat, lng], 13);
        
        window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors'
        }).addTo(map);

        let marker = window.L.marker([lat, lng], { draggable: true }).addTo(map);
        
        marker.on('dragend', function(e: any) {
          const position = e.target.getLatLng();
          setSelectedLocation({ lat: position.lat, lng: position.lng });
        });

        map.on('click', function(e: any) {
          const { lat, lng } = e.latlng;
          marker.setLatLng([lat, lng]);
          setSelectedLocation({ lat, lng });
        });

        setMapInstance(map);
        setSelectedLocation({ lat, lng });
      }
    }, 100);
  };

  const handleLocationConfirm = async () => {
    if (selectedLocation) {
      setIsLoadingSelectedLocation(true);
      await fetchLocationData(selectedLocation.lat, selectedLocation.lng);
      setHasCustomLocation(true);
      setIsLoadingSelectedLocation(false);
      setShowLocationModal(false);
      setMpAutoFetched(false);
      setMlaAutoFetched(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedFile) {
      alert('Please select an issue photo');
      return;
    }

    if (!geolocation.latitude || !geolocation.longitude) {
      alert('Location not available. Please enable location services.');
      return;
    }

    setIsSubmittingReport(true);

    try {
      // Upload issue photo
      const timestamp = Date.now();
      const issuePhotoPath = `reports/${timestamp}_issue.jpg`;
      await uploadFile(issuePhotoPath, selectedFile);

      // Upload MLA photo if provided
      let mlaPhotoPath: string | null = null;
      if (mlaPhoto) {
        const mlaPhotoPathTemp = `reports/${timestamp}_mla.jpg`;
        await uploadFile(mlaPhotoPathTemp, mlaPhoto);
        mlaPhotoPath = mlaPhotoPathTemp;
      } else if (mlaFromDirectory?.photoPath) {
        mlaPhotoPath = mlaFromDirectory.photoPath;
      }

      // Upload PM custom photo if provided
      let pmPhotoPath: string | null = null;
      if (pmCustomPhoto) {
        const pmPhotoPathTemp = `reports/${timestamp}_pm.jpg`;
        await uploadFile(pmPhotoPathTemp, pmCustomPhoto);
        pmPhotoPath = pmPhotoPathTemp;
      } else if (directory?.primeMinister?.photoPath) {
        pmPhotoPath = directory.primeMinister.photoPath;
      }

      // Upload CM custom photo if provided
      let cmPhotoPath: string | null = null;
      if (cmCustomPhoto) {
        const cmPhotoPathTemp = `reports/${timestamp}_cm.jpg`;
        await uploadFile(cmPhotoPathTemp, cmCustomPhoto);
        cmPhotoPath = cmPhotoPathTemp;
      } else if (cmFromDirectory?.photoPath) {
        cmPhotoPath = cmFromDirectory.photoPath;
      }

      // Upload MP custom photo if provided
      let mpPhotoPath: string | null = null;
      if (mpCustomPhoto) {
        const mpPhotoPathTemp = `reports/${timestamp}_mp.jpg`;
        await uploadFile(mpPhotoPathTemp, mpCustomPhoto);
        mpPhotoPath = mpPhotoPathTemp;
      } else if (mpFromDirectory?.photoPath) {
        mpPhotoPath = mpFromDirectory.photoPath;
      }

      // Upload civic body photo if provided
      let civicBodyPhotoPath: string | undefined = undefined;
      if (civicBodyPhoto) {
        const civicBodyPhotoPathTemp = `reports/${timestamp}_civic.jpg`;
        await uploadFile(civicBodyPhotoPathTemp, civicBodyPhoto);
        civicBodyPhotoPath = civicBodyPhotoPathTemp;
      }

      // Build address string
      const addressParts = [
        locationData.house_number,
        locationData.road,
        locationData.neighbourhood,
        locationData.suburb,
        locationData.village,
        locationData.city,
        locationData.state_district,
        locationData.state,
        locationData.postcode
      ].filter(Boolean);
      
      const fullAddress = customAddress || addressParts.join(', ');

      // Prepare PM data
      const pmDataToSubmit: Representative | null = directory?.primeMinister ? {
        name: pmName,
        photoPath: pmPhotoPath || directory.primeMinister.photoPath,
        email: directory.primeMinister.email,
        twitterHandle: directory.primeMinister.twitterHandle,
        remarks: directory.primeMinister.remarks,
        lastUpdated: directory.primeMinister.lastUpdated,
        politicalParty: directory.primeMinister.politicalParty
      } : null;

      // Prepare CM data
      const cmDataToSubmit: Representative | null = cmFromDirectory ? {
        name: cmName,
        photoPath: cmPhotoPath || cmFromDirectory.photoPath,
        email: cmFromDirectory.email,
        twitterHandle: cmFromDirectory.twitterHandle,
        remarks: cmFromDirectory.remarks,
        lastUpdated: cmFromDirectory.lastUpdated,
        politicalParty: cmFromDirectory.politicalParty
      } : null;

      // Prepare MP data - FIX: Use the stored mpData object
      const mpDataToSubmit: Representative | null = mpData ? {
        name: mpName,
        photoPath: mpPhotoPath || mpData.photoPath,
        email: mpData.email,
        twitterHandle: mpData.twitterHandle,
        remarks: mpData.remarks,
        lastUpdated: mpData.lastUpdated,
        politicalParty: mpData.politicalParty
      } : null;

      // Prepare local civic body data
      const localCivicBodyData: LocalCivicBody | null = civicBodyType && civicBodyName && civicBodyRepName ? {
        bodyType: civicBodyType,
        bodyName: civicBodyName,
        representativeName: civicBodyRepName,
        photoPath: civicBodyPhotoPath
      } : null;

      const finalIssueType = issueCategory === 'other' ? customIssueType : issueCategory;

      submitReport({
        photoPath: issuePhotoPath,
        latitude: selectedLocation?.lat || geolocation.latitude,
        longitude: selectedLocation?.lng || geolocation.longitude,
        username: username === 'Anonymous User' ? null : username,
        notes: notes || null,
        issueType: finalIssueType,
        mlaMpName: mlaName || null,
        mlaMpPhotoPath: mlaPhotoPath,
        pmPhotoPath: pmPhotoPath,
        cmPhotoPath: cmPhotoPath,
        pmName: pmName,
        cmName: cmName,
        customAddress: customAddress || null,
        state: locationData.state || 'Unknown',
        mlaMpDesignation: mlaConstituencyName || 'MLA',
        pmData: pmDataToSubmit,
        cmData: cmDataToSubmit,
        mpData: mpDataToSubmit,
        address: fullAddress,
        localCivicBody: localCivicBodyData
      }, {
        onSuccess: (reportId) => {
          alert('Report submitted successfully!');
          navigate({ to: '/dashboard' });
        },
        onError: (error) => {
          console.error('Error submitting report:', error);
          alert('Failed to submit report. Please try again.');
        }
      });
    } catch (error) {
      console.error('Error uploading files:', error);
      alert('Failed to upload files. Please try again.');
    } finally {
      setIsSubmittingReport(false);
    }
  };

  const issueCategories: IssueCategoryOption[] = [
    {
      value: 'pothole',
      label: 'Pothole',
      icon: <AlertTriangle className="w-5 h-5" />,
      description: 'Road damage or pothole'
    },
    {
      value: 'garbage',
      label: 'Garbage',
      icon: <AlertTriangle className="w-5 h-5" />,
      description: 'Waste management issue'
    },
    {
      value: 'streetlight',
      label: 'Street Light',
      icon: <AlertTriangle className="w-5 h-5" />,
      description: 'Non-functional street light'
    },
    {
      value: 'waterlogging',
      label: 'Waterlogging',
      icon: <Droplets className="w-5 h-5" />,
      description: 'Water accumulation'
    },
    {
      value: 'flood',
      label: 'Flood',
      icon: <Waves className="w-5 h-5" />,
      description: 'Flooding situation'
    },
    {
      value: 'illegal_dumping',
      label: 'Illegal Dumping',
      icon: <AlertTriangle className="w-5 h-5" />,
      description: 'Unauthorized waste disposal'
    },
    {
      value: 'illegal_parking',
      label: 'Illegal Parking',
      icon: <AlertTriangle className="w-5 h-5" />,
      description: 'Unauthorized vehicle parking'
    },
    {
      value: 'other',
      label: 'Other',
      icon: <AlertTriangle className="w-5 h-5" />,
      description: 'Other civic issue'
    }
  ];

  const displayAddress = customAddress || [
    locationData.house_number,
    locationData.road,
    locationData.neighbourhood,
    locationData.suburb,
    locationData.village,
    locationData.city,
    locationData.state_district,
    locationData.state,
    locationData.postcode
  ].filter(Boolean).join(', ');

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 mb-6">
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
              Report Civic Issue
            </h1>
            <p className="text-gray-600 text-sm md:text-base">
              Report by clicking Photo & GPS leader image, Certificate, Complaint & Legal Notice
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Issue Photo Section */}
            <div className="space-y-4">
              <label className="block text-lg font-semibold text-gray-900">
                Issue Photo *
              </label>
              
              {previewUrl ? (
                <div className="relative">
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="w-full h-64 object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedFile(null);
                      setPreviewUrl(null);
                    }}
                    className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all"
                  >
                    <Upload className="w-12 h-12 text-gray-400 mb-2" />
                    <span className="text-sm font-medium text-gray-700">Upload Photo</span>
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => cameraInputRef.current?.click()}
                    className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all"
                  >
                    <Camera className="w-12 h-12 text-gray-400 mb-2" />
                    <span className="text-sm font-medium text-gray-700">Take Photo</span>
                  </button>
                </div>
              )}
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleCameraCapture}
                className="hidden"
              />
            </div>

            {/* Issue Category */}
            <div className="space-y-4">
              <label className="block text-lg font-semibold text-gray-900">
                Issue Category *
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {issueCategories.map((category) => (
                  <button
                    key={category.value}
                    type="button"
                    onClick={() => setIssueCategory(category.value)}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      issueCategory === category.value
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex flex-col items-center space-y-2">
                      {category.icon}
                      <span className="text-sm font-medium text-gray-900">
                        {category.label}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
              
              {issueCategory === 'other' && (
                <input
                  type="text"
                  value={customIssueType}
                  onChange={(e) => setCustomIssueType(e.target.value)}
                  placeholder="Specify issue type"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              )}
            </div>

            {/* Location Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="block text-lg font-semibold text-gray-900">
                  Location
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleRefreshLocation}
                    disabled={isLoadingLocation}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
                  >
                    <RefreshCw className={`w-4 h-4 ${isLoadingLocation ? 'animate-spin' : ''}`} />
                    Refresh
                  </button>
                  <button
                    type="button"
                    onClick={openLocationModal}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <MapPin className="w-4 h-4" />
                    Pick on Map
                  </button>
                </div>
              </div>
              
              {isLoadingLocation ? (
                <div className="flex items-center justify-center p-8 bg-gray-50 rounded-lg">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                  <span className="ml-2 text-gray-600">Loading location...</span>
                </div>
              ) : (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-start gap-2">
                    <MapPin className="w-5 h-5 text-gray-500 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      {isEditingAddress ? (
                        <div className="space-y-2">
                          <textarea
                            value={customAddress}
                            onChange={(e) => setCustomAddress(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            rows={3}
                            placeholder="Enter custom address"
                          />
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => setIsEditingAddress(false)}
                              className="flex items-center gap-1 px-3 py-1 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                            >
                              <Check className="w-4 h-4" />
                              Save
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setCustomAddress('');
                                setIsEditingAddress(false);
                              }}
                              className="flex items-center gap-1 px-3 py-1 text-sm font-medium text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors"
                            >
                              <X className="w-4 h-4" />
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm text-gray-700 flex-1">
                            {displayAddress || 'Location not available'}
                          </p>
                          <button
                            type="button"
                            onClick={() => setIsEditingAddress(true)}
                            className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors flex-shrink-0"
                          >
                            <Edit3 className="w-3 h-3" />
                            Edit
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  {hasCustomLocation && (
                    <div className="mt-2 flex items-center gap-1 text-xs text-blue-600">
                      <CheckCircle className="w-3 h-3" />
                      Custom location selected
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Username */}
            <div className="space-y-2">
              <label className="block text-lg font-semibold text-gray-900">
                Your Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your name"
                  disabled={isApprovedVolunteer}
                />
              </div>
              {isApprovedVolunteer && (
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <Award className="w-4 h-4" />
                  <span>Verified Volunteer</span>
                </div>
              )}
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <label className="block text-lg font-semibold text-gray-900">
                Additional Notes
              </label>
              <div className="relative">
                <MessageSquare className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={4}
                  placeholder="Describe the issue in detail..."
                />
              </div>
            </div>

            {/* Prime Minister Section */}
            <div className="space-y-4 p-6 bg-gradient-to-r from-orange-50 to-white rounded-lg border border-orange-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Prime Minister</h3>
                {pmEditingName && (
                  <button
                    type="button"
                    onClick={() => setPmEditingName(false)}
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    Done
                  </button>
                )}
              </div>
              
              <div className="flex items-center gap-4">
                <div className="relative">
                  {pmCustomPhotoPreview || pmPhotoUrl ? (
                    <img
                      src={pmCustomPhotoPreview || pmPhotoUrl || ''}
                      alt="PM"
                      className="w-20 h-20 rounded-full object-cover border-2 border-orange-300"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-orange-100 flex items-center justify-center border-2 border-orange-300">
                      <User className="w-10 h-10 text-orange-400" />
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => pmFileInputRef.current?.click()}
                    className="absolute bottom-0 right-0 bg-orange-500 text-white p-1.5 rounded-full hover:bg-orange-600 transition-colors"
                  >
                    <Camera className="w-3 h-3" />
                  </button>
                  <input
                    ref={pmFileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handlePmPhotoSelect}
                    className="hidden"
                  />
                </div>
                
                <div className="flex-1">
                  {pmEditingName ? (
                    <input
                      type="text"
                      value={pmName}
                      onChange={(e) => setPmName(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="PM Name"
                    />
                  ) : (
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-900">{pmName}</p>
                      <button
                        type="button"
                        onClick={() => setPmEditingName(true)}
                        className="text-orange-600 hover:text-orange-700"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                  <p className="text-sm text-gray-600">Prime Minister of India</p>
                </div>
              </div>
            </div>

            {/* Chief Minister Section */}
            {locationData.state && (
              <div className="space-y-4 p-6 bg-gradient-to-r from-green-50 to-white rounded-lg border border-green-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Chief Minister</h3>
                  {cmEditingName && (
                    <button
                      type="button"
                      onClick={() => setCmEditingName(false)}
                      className="text-sm text-blue-600 hover:text-blue-700"
                    >
                      Done
                    </button>
                  )}
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="relative">
                    {cmCustomPhotoPreview || cmPhotoUrl ? (
                      <img
                        src={cmCustomPhotoPreview || cmPhotoUrl || ''}
                        alt="CM"
                        className="w-20 h-20 rounded-full object-cover border-2 border-green-300"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center border-2 border-green-300">
                        <User className="w-10 h-10 text-green-400" />
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => cmFileInputRef.current?.click()}
                      className="absolute bottom-0 right-0 bg-green-500 text-white p-1.5 rounded-full hover:bg-green-600 transition-colors"
                    >
                      <Camera className="w-3 h-3" />
                    </button>
                    <input
                      ref={cmFileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleCmPhotoSelect}
                      className="hidden"
                    />
                  </div>
                  
                  <div className="flex-1">
                    {cmEditingName ? (
                      <input
                        type="text"
                        value={cmName}
                        onChange={(e) => setCmName(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="CM Name"
                      />
                    ) : (
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-gray-900">{cmName}</p>
                        <button
                          type="button"
                          onClick={() => setCmEditingName(true)}
                          className="text-green-600 hover:text-green-700"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                    <p className="text-sm text-gray-600">Chief Minister of {locationData.state}</p>
                  </div>
                </div>
              </div>
            )}

            {/* MP Section */}
            {showMpSection && locationData.state && (
              <div className="space-y-4 p-6 bg-gradient-to-r from-blue-50 to-white rounded-lg border border-blue-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Member of Parliament (MP)</h3>
                  {mpEditingName && (
                    <button
                      type="button"
                      onClick={() => setMpEditingName(false)}
                      className="text-sm text-blue-600 hover:text-blue-700"
                    >
                      Done
                    </button>
                  )}
                </div>

                {showManualConstituencySelector ? (
                  <div className="space-y-3">
                    <p className="text-sm text-gray-600">
                      Select your Lok Sabha constituency to auto-fill MP details:
                    </p>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setShowMpDropdown(!showMpDropdown)}
                        className="w-full px-4 py-3 text-left border border-gray-300 rounded-lg hover:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent flex items-center justify-between"
                      >
                        <span className={selectedConstituency ? 'text-gray-900' : 'text-gray-500'}>
                          {selectedConstituency || 'Select Lok Sabha Constituency'}
                        </span>
                        <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${showMpDropdown ? 'transform rotate-180' : ''}`} />
                      </button>
                      
                      {showMpDropdown && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                          {isLoadingConstituencies ? (
                            <div className="p-4 text-center text-gray-500">
                              <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
                              Loading constituencies...
                            </div>
                          ) : constituenciesByState && constituenciesByState.length > 0 ? (
                            constituenciesByState.map((constituency) => (
                              <button
                                key={constituency.name}
                                type="button"
                                onClick={() => {
                                  handleManualConstituencySelect(constituency.name);
                                  setShowMpDropdown(false);
                                }}
                                className="w-full px-4 py-3 text-left hover:bg-blue-50 transition-colors border-b border-gray-100 last:border-b-0"
                              >
                                <div className="font-medium text-gray-900">{constituency.name}</div>
                                {constituency.mp && (
                                  <div className="text-sm text-gray-600 mt-1">
                                    MP: {constituency.mp.name}
                                  </div>
                                )}
                              </button>
                            ))
                          ) : (
                            <div className="p-4 text-center text-gray-500">
                              No constituencies found for {locationData.state}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      {mpCustomPhotoPreview || mpPhotoUrl ? (
                        <img
                          src={mpCustomPhotoPreview || mpPhotoUrl || ''}
                          alt="MP"
                          className="w-20 h-20 rounded-full object-cover border-2 border-blue-300"
                        />
                      ) : (
                        <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center border-2 border-blue-300">
                          <User className="w-10 h-10 text-blue-400" />
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => mpFileInputRef.current?.click()}
                        className="absolute bottom-0 right-0 bg-blue-500 text-white p-1.5 rounded-full hover:bg-blue-600 transition-colors"
                      >
                        <Camera className="w-3 h-3" />
                      </button>
                      <input
                        ref={mpFileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleMpPhotoSelect}
                        className="hidden"
                      />
                    </div>
                    
                    <div className="flex-1">
                      {mpEditingName ? (
                        <input
                          type="text"
                          value={mpName}
                          onChange={(e) => setMpName(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="MP Name"
                        />
                      ) : (
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-gray-900">{mpName}</p>
                          <button
                            type="button"
                            onClick={() => setMpEditingName(true)}
                            className="text-blue-600 hover:text-blue-700"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                      <p className="text-sm text-gray-600">
                        {mpConstituencyName ? `MP - ${mpConstituencyName}` : 'Member of Parliament'}
                      </p>
                      {mpAutoFetched && (
                        <div className="flex items-center gap-1 text-xs text-blue-600 mt-1">
                          <CheckCircle className="w-3 h-3" />
                          Auto-detected from location
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* MLA Section */}
            {locationData.state && (
              <div className="space-y-4 p-6 bg-gradient-to-r from-purple-50 to-white rounded-lg border border-purple-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Member of Legislative Assembly (MLA)
                  </h3>
                  {mlaEditingName && (
                    <button
                      type="button"
                      onClick={() => setMlaEditingName(false)}
                      className="text-sm text-blue-600 hover:text-blue-700"
                    >
                      Done
                    </button>
                  )}
                </div>

                {showManualMlaSelector ? (
                  <div className="space-y-3">
                    <p className="text-sm text-gray-600">
                      Select your Vidhan Sabha constituency to auto-fill MLA details:
                    </p>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setShowMlaDropdown(!showMlaDropdown)}
                        className="w-full px-4 py-3 text-left border border-gray-300 rounded-lg hover:border-purple-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent flex items-center justify-between"
                      >
                        <span className={selectedMlaConstituency ? 'text-gray-900' : 'text-gray-500'}>
                          {selectedMlaConstituency || 'Select Vidhan Sabha Constituency'}
                        </span>
                        <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${showMlaDropdown ? 'transform rotate-180' : ''}`} />
                      </button>
                      
                      {showMlaDropdown && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                          {isLoadingVidhanSabhaConstituencies ? (
                            <div className="p-4 text-center text-gray-500">
                              <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
                              Loading constituencies...
                            </div>
                          ) : vidhanSabhaConstituenciesByState && vidhanSabhaConstituenciesByState.length > 0 ? (
                            vidhanSabhaConstituenciesByState.map((constituency) => (
                              <button
                                key={constituency.name}
                                type="button"
                                onClick={() => {
                                  handleManualMlaSelect(constituency.name);
                                  setShowMlaDropdown(false);
                                }}
                                className="w-full px-4 py-3 text-left hover:bg-purple-50 transition-colors border-b border-gray-100 last:border-b-0"
                              >
                                <div className="font-medium text-gray-900">{constituency.name}</div>
                                {constituency.mlas && constituency.mlas.length > 0 && (
                                  <div className="text-sm text-gray-600 mt-1">
                                    MLA: {constituency.mlas[0].name}
                                  </div>
                                )}
                              </button>
                            ))
                          ) : (
                            <div className="p-4 text-center text-gray-500">
                              No Vidhan Sabha constituencies found for {locationData.state}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowManualMlaSelector(false)}
                      className="text-sm text-purple-600 hover:text-purple-700"
                    >
                      Or enter manually
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        {mlaPhotoPreview || mlaPhotoUrl ? (
                          <img
                            src={mlaPhotoPreview || mlaPhotoUrl || ''}
                            alt="MLA"
                            className="w-20 h-20 rounded-full object-cover border-2 border-purple-300"
                          />
                        ) : (
                          <div className="w-20 h-20 rounded-full bg-purple-100 flex items-center justify-center border-2 border-purple-300">
                            <User className="w-10 h-10 text-purple-400" />
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => mlaFileInputRef.current?.click()}
                          className="absolute bottom-0 right-0 bg-purple-500 text-white p-1.5 rounded-full hover:bg-purple-600 transition-colors"
                        >
                          <Camera className="w-3 h-3" />
                        </button>
                        <input
                          ref={mlaFileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleMlaPhotoSelect}
                          className="hidden"
                        />
                      </div>
                      
                      <div className="flex-1">
                        {mlaEditingName ? (
                          <input
                            type="text"
                            value={mlaName}
                            onChange={(e) => setMlaName(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            placeholder="MLA Name"
                          />
                        ) : (
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-gray-900">{mlaName || 'Not Available'}</p>
                            <button
                              type="button"
                              onClick={() => setMlaEditingName(true)}
                              className="text-purple-600 hover:text-purple-700"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                        <p className="text-sm text-gray-600">
                          {mlaConstituencyName ? `MLA - ${mlaConstituencyName}` : 'Member of Legislative Assembly'}
                        </p>
                        {mlaAutoFetched && (
                          <div className="flex items-center gap-1 text-xs text-purple-600 mt-1">
                            <CheckCircle className="w-3 h-3" />
                            Auto-detected from location
                          </div>
                        )}
                      </div>
                    </div>
                    {!mlaAutoFetched && (
                      <button
                        type="button"
                        onClick={() => setShowManualMlaSelector(true)}
                        className="text-sm text-purple-600 hover:text-purple-700"
                      >
                        Select from Vidhan Sabha constituencies
                      </button>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Local Civic Body Section */}
            <div className="space-y-4 p-6 bg-gradient-to-r from-yellow-50 to-white rounded-lg border border-yellow-200">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-yellow-600" />
                Local Civic Body (Optional)
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Civic Body Type
                  </label>
                  <select
                    value={civicBodyType}
                    onChange={(e) => setCivicBodyType(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
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
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Civic Body Name
                      </label>
                      <input
                        type="text"
                        value={civicBodyName}
                        onChange={(e) => setCivicBodyName(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                        placeholder={`Enter ${civicBodyType} name`}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {civicBodyTypes.find(t => t.value === civicBodyType)?.representativeLabel || 'Representative Name'}
                      </label>
                      <input
                        type="text"
                        value={civicBodyRepName}
                        onChange={(e) => setCivicBodyRepName(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                        placeholder="Enter representative name"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Representative Photo (Optional)
                      </label>
                      <div className="flex items-center gap-4">
                        {civicBodyPhotoPreview ? (
                          <div className="relative">
                            <img
                              src={civicBodyPhotoPreview}
                              alt="Civic Body Representative"
                              className="w-20 h-20 rounded-full object-cover border-2 border-yellow-300"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                setCivicBodyPhoto(null);
                                setCivicBodyPhotoPreview(null);
                              }}
                              className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition-colors"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => civicBodyFileInputRef.current?.click()}
                            className="flex items-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-yellow-500 hover:bg-yellow-50 transition-all"
                          >
                            <ImageIcon className="w-5 h-5 text-gray-400" />
                            <span className="text-sm text-gray-600">Upload Photo</span>
                          </button>
                        )}
                        <input
                          ref={civicBodyFileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleCivicBodyPhotoSelect}
                          className="hidden"
                        />
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting || isUploading || isSubmittingReport || !selectedFile}
              className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {(isSubmitting || isUploading || isSubmittingReport) ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Submitting Report...
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5" />
                  Submit Report
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Location Modal */}
      {showLocationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Select Location on Map</h3>
              <button
                onClick={() => setShowLocationModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="flex-1 relative">
              <div ref={mapModalRef} className="w-full h-full min-h-[400px]" />
            </div>
            
            <div className="p-4 border-t border-gray-200 flex gap-3">
              <button
                onClick={() => setShowLocationModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleLocationConfirm}
                disabled={isLoadingSelectedLocation}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isLoadingSelectedLocation ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    Confirm Location
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
