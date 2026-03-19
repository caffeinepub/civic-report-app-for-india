import React, { useState, useMemo, useEffect } from 'react';
import { Link } from '@tanstack/react-router';
import { Home, Search, MapPin, User, Mail, Twitter, ChevronDown, ChevronRight, Filter, X, Building2, Crown, Calendar, Loader2 } from 'lucide-react';
import { useGetDirectory } from '../hooks/useQueries';
import { Representative, State, Constituency } from '../backend';
import { useFileUrl } from '../blob-storage/FileStorage';

interface LocationData {
  state: string;
  district?: string;
  constituency?: string;
  latitude: number;
  longitude: number;
}

export function KnowYourNeta() {
  const { data: directory, isLoading } = useGetDirectory();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedState, setSelectedState] = useState<string>('');
  const [selectedConstituency, setSelectedConstituency] = useState<string>('');
  const [expandedStates, setExpandedStates] = useState<Set<string>>(new Set());
  const [showFilters, setShowFilters] = useState(false);
  const [userLocation, setUserLocation] = useState<LocationData | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [photoModalUrl, setPhotoModalUrl] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'lok-sabha' | 'vidhan-sabha' | 'both'>('both');

  // Reverse geocode coordinates to get location details
  const reverseGeocode = async (latitude: number, longitude: number): Promise<LocationData | null> => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch location data');
      }
      
      const data = await response.json();
      const address = data.address || {};
      
      // Extract state name from various possible fields
      let stateName = address.state || address.region || address.province || '';
      
      // Clean up state name (remove "State of" prefix if present)
      stateName = stateName.replace(/^State of\s+/i, '').trim();
      
      // Extract district/constituency information
      const district = address.state_district || address.county || address.district || '';
      const constituency = address.suburb || address.neighbourhood || address.city_district || '';
      
      return {
        state: stateName,
        district: district,
        constituency: constituency,
        latitude,
        longitude
      };
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      return null;
    }
  };

  // Find matching state in directory
  const findMatchingState = (locationState: string): State | null => {
    if (!directory || !locationState) return null;
    
    const allStates = [...directory.states, ...directory.unionTerritories];
    
    // Try exact match first
    let match = allStates.find(s => 
      s.name.toLowerCase() === locationState.toLowerCase()
    );
    
    // Try partial match if exact match fails
    if (!match) {
      match = allStates.find(s => 
        s.name.toLowerCase().includes(locationState.toLowerCase()) ||
        locationState.toLowerCase().includes(s.name.toLowerCase())
      );
    }
    
    return match || null;
  };

  // Get user's location and auto-select representatives
  const handleLocateMe = async () => {
    setIsLocating(true);
    setLocationError(null);
    
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser. Please select your state and constituency manually.');
      setIsLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        // Reverse geocode to get location details
        const locationData = await reverseGeocode(latitude, longitude);
        
        if (!locationData || !locationData.state) {
          setLocationError('Unable to determine your location. Please select your state and constituency manually.');
          setIsLocating(false);
          return;
        }
        
        setUserLocation(locationData);
        
        // Find matching state in directory
        const matchingState = findMatchingState(locationData.state);
        
        if (matchingState) {
          setSelectedState(matchingState.name);
          
          // Auto-expand the state to show constituencies
          const newExpanded = new Set(expandedStates);
          newExpanded.add(matchingState.name);
          setExpandedStates(newExpanded);
          
          // Try to match constituency if available
          if (locationData.district || locationData.constituency) {
            const searchTerm = locationData.district || locationData.constituency || '';
            const matchingConstituency = matchingState.constituencies.find(c =>
              c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
              searchTerm.toLowerCase().includes(c.name.toLowerCase())
            );
            
            if (matchingConstituency) {
              setSelectedConstituency(matchingConstituency.name);
            }
          }
          
          setLocationError(null);
        } else {
          setLocationError(`Location detected: ${locationData.state}. However, this state is not found in our directory. Please select manually.`);
        }
        
        setIsLocating(false);
      },
      (error) => {
        console.error('Geolocation error:', error);
        let errorMessage = 'Unable to get your location. ';
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage += 'Location permission denied. Please enable location access and try again.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage += 'Location information unavailable. Please try again.';
            break;
          case error.TIMEOUT:
            errorMessage += 'Location request timed out. Please try again.';
            break;
          default:
            errorMessage += 'An unknown error occurred. Please select your state and constituency manually.';
        }
        
        setLocationError(errorMessage);
        setIsLocating(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  // Toggle section expansion
  const toggleState = (stateName: string) => {
    const newExpanded = new Set(expandedStates);
    if (newExpanded.has(stateName)) {
      newExpanded.delete(stateName);
    } else {
      newExpanded.add(stateName);
    }
    setExpandedStates(newExpanded);
  };

  // Get all states (including union territories)
  const allStates = useMemo(() => {
    if (!directory) return [];
    return [...directory.states, ...directory.unionTerritories].sort((a, b) => a.name.localeCompare(b.name));
  }, [directory]);

  // Get constituencies for selected state
  const constituencies = useMemo(() => {
    if (!selectedState || !directory) return [];
    const state = allStates.find(s => s.name === selectedState);
    return state?.constituencies || [];
  }, [selectedState, allStates, directory]);

  // Filter states based on search and filters
  const filteredStates = useMemo(() => {
    let filtered = allStates;
    
    if (selectedState) {
      filtered = filtered.filter(s => s.name === selectedState);
    }
    
    if (searchTerm) {
      const query = searchTerm.toLowerCase();
      filtered = filtered.filter(state => 
        state.name.toLowerCase().includes(query) ||
        state.cm?.name.toLowerCase().includes(query) ||
        state.constituencies.some(c => 
          c.name.toLowerCase().includes(query) ||
          c.mp?.name.toLowerCase().includes(query) ||
          c.mlas.some(m => m.name.toLowerCase().includes(query))
        )
      );
    }
    
    return filtered;
  }, [allStates, searchTerm, selectedState]);

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm('');
    setSelectedState('');
    setSelectedConstituency('');
    setUserLocation(null);
    setLocationError(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading directory...</p>
        </div>
      </div>
    );
  }

  const showLokSabha = viewMode === 'lok-sabha' || viewMode === 'both';
  const showVidhanSabha = viewMode === 'vidhan-sabha' || viewMode === 'both';

  return (
    <div className="space-y-6">
      {/* Photo Modal */}
      {photoModalUrl && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4"
          onClick={() => setPhotoModalUrl(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <button
              onClick={() => setPhotoModalUrl(null)}
              className="absolute -top-10 right-0 text-white hover:text-gray-300 transition-colors"
            >
              <X className="h-8 w-8" />
            </button>
            <img 
              src={photoModalUrl} 
              alt="Full size" 
              className="max-w-full max-h-[90vh] object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Know Your Neta</h1>
            <p className="text-gray-600">Find your representatives - PM, CM, MP, MLA, and local civic bodies</p>
          </div>
          <Link
            to="/"
            className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <Home className="h-4 w-4" />
            <span className="hidden sm:inline">Home</span>
          </Link>
        </div>

        {/* Locate Me Button */}
        <button
          onClick={handleLocateMe}
          disabled={isLocating}
          className="w-full sm:w-auto flex items-center justify-center space-x-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors font-medium"
        >
          {isLocating ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Locating...</span>
            </>
          ) : (
            <>
              <MapPin className="h-5 w-5" />
              <span>Locate Me</span>
            </>
          )}
        </button>
        
        {/* Location Status Messages */}
        {userLocation && !locationError && (
          <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-800">
              <strong>Location detected:</strong> {userLocation.state}
              {userLocation.district && ` - ${userLocation.district}`}
              {userLocation.constituency && ` (${userLocation.constituency})`}
            </p>
            <p className="text-xs text-green-700 mt-1">
              Representatives for your location are displayed below.
            </p>
          </div>
        )}
        
        {locationError && (
          <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">{locationError}</p>
          </div>
        )}
        
        {!userLocation && !locationError && !isLocating && (
          <p className="text-sm text-gray-500 mt-2">
            Auto-detect your location to find your representatives, or use filters below to search manually.
          </p>
        )}
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, state, constituency, or party..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Filter Toggle Button (Mobile) */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="sm:hidden w-full flex items-center justify-between px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4" />
              <span>Filters</span>
            </div>
            {showFilters ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>

          {/* Filters */}
          <div className={`grid grid-cols-1 sm:grid-cols-3 gap-4 ${showFilters ? 'block' : 'hidden sm:grid'}`}>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">State/UT</label>
              <select
                value={selectedState}
                onChange={(e) => {
                  setSelectedState(e.target.value);
                  setSelectedConstituency('');
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All States/UTs</option>
                {allStates.map(state => (
                  <option key={state.name} value={state.name}>
                    {state.name} {state.isUnionTerritory ? '(UT)' : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Constituency</label>
              <select
                value={selectedConstituency}
                onChange={(e) => setSelectedConstituency(e.target.value)}
                disabled={!selectedState}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value="">All Constituencies</option>
                {constituencies.map(constituency => (
                  <option key={constituency.name} value={constituency.name}>
                    {constituency.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={clearFilters}
                className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <X className="h-4 w-4" />
                <span>Clear Filters</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Table-Based Directory */}
      <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
        <div className="flex flex-col gap-4 mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Representatives Directory</h2>
          
          {/* View Mode Toggle */}
          <div className="flex items-center bg-gray-100 rounded-lg p-1 w-full sm:w-auto">
            <button
              onClick={() => setViewMode('lok-sabha')}
              className={`flex-1 sm:flex-none px-3 py-1.5 text-xs sm:text-sm rounded transition-colors ${
                viewMode === 'lok-sabha' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600'
              }`}
            >
              Lok Sabha
            </button>
            <button
              onClick={() => setViewMode('vidhan-sabha')}
              className={`flex-1 sm:flex-none px-3 py-1.5 text-xs sm:text-sm rounded transition-colors ${
                viewMode === 'vidhan-sabha' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600'
              }`}
            >
              Vidhan Sabha
            </button>
            <button
              onClick={() => setViewMode('both')}
              className={`flex-1 sm:flex-none px-3 py-1.5 text-xs sm:text-sm rounded transition-colors ${
                viewMode === 'both' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600'
              }`}
            >
              Both
            </button>
          </div>
        </div>

        <div className="overflow-x-auto -mx-4 sm:mx-0">
          <div className="inline-block min-w-full align-middle">
            <div className="overflow-hidden">
              <table className="min-w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100 border-b-2 border-gray-300">
                    <th className="text-left p-2 sm:p-3 text-xs sm:text-sm font-semibold text-gray-700 whitespace-nowrap">Level</th>
                    <th className="text-left p-2 sm:p-3 text-xs sm:text-sm font-semibold text-gray-700 whitespace-nowrap">Administrative Unit</th>
                    <th className="text-left p-2 sm:p-3 text-xs sm:text-sm font-semibold text-gray-700 whitespace-nowrap">Representative Name</th>
                    <th className="text-left p-2 sm:p-3 text-xs sm:text-sm font-semibold text-gray-700 whitespace-nowrap">Photo</th>
                    <th className="text-left p-2 sm:p-3 text-xs sm:text-sm font-semibold text-gray-700 whitespace-nowrap">Email</th>
                    <th className="text-left p-2 sm:p-3 text-xs sm:text-sm font-semibold text-gray-700 whitespace-nowrap">X Handle</th>
                    <th className="text-left p-2 sm:p-3 text-xs sm:text-sm font-semibold text-gray-700 whitespace-nowrap">Political Party</th>
                    <th className="text-left p-2 sm:p-3 text-xs sm:text-sm font-semibold text-gray-700 whitespace-nowrap">Last Updated</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Prime Minister Row */}
                  <PrimeMinisterTableRow
                    primeMinister={directory?.primeMinister}
                    onPhotoClick={setPhotoModalUrl}
                  />
                  
                  {/* State Rows */}
                  {filteredStates
                    .filter(state => !state.isUnionTerritory)
                    .map((state, stateIndex) => (
                      <StateTableRows
                        key={state.name}
                        state={state}
                        stateNumber={stateIndex + 1}
                        levelLabel="State"
                        isExpanded={expandedStates.has(state.name)}
                        onToggle={() => toggleState(state.name)}
                        viewMode={viewMode}
                        showLokSabha={showLokSabha}
                        showVidhanSabha={showVidhanSabha}
                        onPhotoClick={setPhotoModalUrl}
                        selectedConstituency={selectedConstituency}
                      />
                    ))}
                  
                  {/* UT Rows */}
                  {filteredStates
                    .filter(state => state.isUnionTerritory)
                    .map((state, utIndex) => (
                      <StateTableRows
                        key={state.name}
                        state={state}
                        stateNumber={utIndex + 1}
                        levelLabel="UT"
                        isExpanded={expandedStates.has(state.name)}
                        onToggle={() => toggleState(state.name)}
                        viewMode={viewMode}
                        showLokSabha={showLokSabha}
                        showVidhanSabha={showVidhanSabha}
                        onPhotoClick={setPhotoModalUrl}
                        selectedConstituency={selectedConstituency}
                      />
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {filteredStates.length === 0 && (
          <div className="text-center py-8">
            <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Results Found</h3>
            <p className="text-gray-600">Try adjusting your search or filters.</p>
          </div>
        )}
      </div>

      {/* Info Note */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>Note:</strong> This is a read-only directory for public lookup and discovery. 
          Representative information is managed by administrators. If you notice any outdated information, 
          please contact the admin team.
        </p>
      </div>
    </div>
  );
}

// Prime Minister Table Row Component
function PrimeMinisterTableRow({
  primeMinister,
  onPhotoClick
}: {
  primeMinister?: Representative;
  onPhotoClick: (url: string) => void;
}) {
  const { data: pmPhotoUrl } = useFileUrl(primeMinister?.photoPath || '');

  return (
    <tr className="border-b border-gray-200 bg-purple-50 hover:bg-purple-100">
      <td className="p-2 sm:p-3">
        <div className="flex items-center space-x-2">
          <Crown className="h-4 w-4 text-purple-600" />
          <span className="font-semibold text-xs sm:text-sm">PM</span>
        </div>
      </td>
      <td className="p-2 sm:p-3">
        <div className="font-medium text-gray-900 text-xs sm:text-sm">Prime Minister of India</div>
      </td>
      <td className="p-2 sm:p-3">
        <div className="text-xs sm:text-sm text-gray-900">{primeMinister?.name || 'No PM Set'}</div>
      </td>
      <td className="p-2 sm:p-3">
        {pmPhotoUrl && (
          <img 
            src={pmPhotoUrl} 
            alt={primeMinister?.name} 
            className="h-8 w-8 sm:h-10 sm:w-10 rounded-full object-cover cursor-pointer hover:opacity-80 transition-opacity" 
            onClick={() => onPhotoClick(pmPhotoUrl)}
          />
        )}
      </td>
      <td className="p-2 sm:p-3">
        <span className="text-xs sm:text-sm text-gray-700">{primeMinister?.email || '-'}</span>
      </td>
      <td className="p-2 sm:p-3">
        <span className="text-xs sm:text-sm text-gray-700">{primeMinister?.twitterHandle || '-'}</span>
      </td>
      <td className="p-2 sm:p-3">
        <span className="text-xs sm:text-sm text-gray-700">{primeMinister?.politicalParty || '-'}</span>
      </td>
      <td className="p-2 sm:p-3 text-xs text-gray-600">
        {primeMinister?.lastUpdated ? new Date(Number(primeMinister.lastUpdated) / 1000000).toLocaleDateString() : '-'}
      </td>
    </tr>
  );
}

// State Table Rows Component
function StateTableRows({ 
  state, 
  stateNumber,
  levelLabel,
  isExpanded, 
  onToggle, 
  viewMode,
  showLokSabha,
  showVidhanSabha,
  onPhotoClick,
  selectedConstituency
}: {
  state: State;
  stateNumber: number;
  levelLabel: 'State' | 'UT';
  isExpanded: boolean;
  onToggle: () => void;
  viewMode: 'lok-sabha' | 'vidhan-sabha' | 'both';
  showLokSabha: boolean;
  showVidhanSabha: boolean;
  onPhotoClick: (url: string) => void;
  selectedConstituency?: string;
}) {
  const { data: cmPhotoUrl } = useFileUrl(state.cm?.photoPath || '');

  const lokSabhaConstituencies = state.constituencies.filter(c => c.mp);
  const vidhanSabhaConstituencies = state.constituencies.filter(c => c.mlas.length > 0);

  // Filter constituencies if a specific one is selected
  const filteredLokSabha = selectedConstituency 
    ? lokSabhaConstituencies.filter(c => c.name === selectedConstituency)
    : lokSabhaConstituencies;
    
  const filteredVidhanSabha = selectedConstituency
    ? vidhanSabhaConstituencies.filter(c => c.name === selectedConstituency)
    : vidhanSabhaConstituencies;

  return (
    <>
      {/* State/UT Row */}
      <tr className="border-b border-gray-200 bg-blue-50 hover:bg-blue-100">
        <td className="p-2 sm:p-3">
          <div className="flex items-center space-x-2">
            <button onClick={onToggle} className="p-1 hover:bg-blue-200 rounded">
              {isExpanded ? <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4" /> : <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />}
            </button>
            <span className="font-semibold text-xs sm:text-sm">{String(stateNumber).padStart(2, '0')}. {levelLabel}</span>
          </div>
        </td>
        <td className="p-2 sm:p-3">
          <div className="font-medium text-gray-900 text-xs sm:text-sm">{state.name}</div>
        </td>
        <td className="p-2 sm:p-3">
          <div className="text-xs sm:text-sm text-gray-900">{state.cm?.name || 'No CM/Administrator'}</div>
        </td>
        <td className="p-2 sm:p-3">
          {cmPhotoUrl && (
            <img 
              src={cmPhotoUrl} 
              alt={state.cm?.name} 
              className="h-8 w-8 sm:h-10 sm:w-10 rounded-full object-cover cursor-pointer hover:opacity-80 transition-opacity" 
              onClick={() => onPhotoClick(cmPhotoUrl)}
            />
          )}
        </td>
        <td className="p-2 sm:p-3">
          <span className="text-xs sm:text-sm text-gray-700">{state.cm?.email || '-'}</span>
        </td>
        <td className="p-2 sm:p-3">
          <span className="text-xs sm:text-sm text-gray-700">{state.cm?.twitterHandle || '-'}</span>
        </td>
        <td className="p-2 sm:p-3">
          <span className="text-xs sm:text-sm text-gray-700">{state.cm?.politicalParty || '-'}</span>
        </td>
        <td className="p-2 sm:p-3 text-xs text-gray-600">
          {state.cm?.lastUpdated ? new Date(Number(state.cm.lastUpdated) / 1000000).toLocaleDateString() : '-'}
        </td>
      </tr>

      {/* Constituency Rows */}
      {isExpanded && (
        <>
          {showLokSabha && filteredLokSabha.map((constituency, constIndex) => (
            <ConstituencyTableRow
              key={`lok-${constituency.name}`}
              stateName={state.name}
              constituency={constituency}
              constituencyNumber={constIndex + 1}
              type="Lok Sabha"
              onPhotoClick={onPhotoClick}
            />
          ))}
          {showVidhanSabha && filteredVidhanSabha.map((constituency, constIndex) => (
            <ConstituencyTableRow
              key={`vidhan-${constituency.name}`}
              stateName={state.name}
              constituency={constituency}
              constituencyNumber={constIndex + 1}
              type="Vidhan Sabha"
              onPhotoClick={onPhotoClick}
            />
          ))}
        </>
      )}
    </>
  );
}

// Constituency Table Row Component
function ConstituencyTableRow({
  stateName,
  constituency,
  constituencyNumber,
  type,
  onPhotoClick
}: {
  stateName: string;
  constituency: Constituency;
  constituencyNumber: number;
  type: 'Lok Sabha' | 'Vidhan Sabha';
  onPhotoClick: (url: string) => void;
}) {
  const representatives = type === 'Lok Sabha' ? (constituency.mp ? [constituency.mp] : []) : constituency.mlas;

  return (
    <>
      {representatives.map((rep, repIndex) => (
        <RepresentativeTableRow
          key={`${type}-${rep.name}-${repIndex}`}
          constituencyName={constituency.name}
          representative={rep}
          constituencyNumber={constituencyNumber}
          type={type}
          onPhotoClick={onPhotoClick}
        />
      ))}
    </>
  );
}

// Representative Table Row Component
function RepresentativeTableRow({
  constituencyName,
  representative,
  constituencyNumber,
  type,
  onPhotoClick
}: {
  constituencyName: string;
  representative: Representative;
  constituencyNumber: number;
  type: 'Lok Sabha' | 'Vidhan Sabha';
  onPhotoClick: (url: string) => void;
}) {
  const { data: photoUrl } = useFileUrl(representative.photoPath);

  const bgColor = type === 'Lok Sabha' ? 'bg-green-50 hover:bg-green-100' : 'bg-yellow-50 hover:bg-yellow-100';

  return (
    <tr className={`border-b border-gray-200 ${bgColor}`}>
      <td className="p-2 sm:p-3">
        <div className="text-xs font-medium text-gray-700 pl-4 sm:pl-8">
          {String(constituencyNumber).padStart(2, '0')} {type}
        </div>
      </td>
      <td className="p-2 sm:p-3">
        <div className="text-xs sm:text-sm text-gray-900">{constituencyName}</div>
      </td>
      <td className="p-2 sm:p-3">
        <div className="font-medium text-gray-900 text-xs sm:text-sm">{representative.name}</div>
      </td>
      <td className="p-2 sm:p-3">
        {photoUrl && (
          <img 
            src={photoUrl} 
            alt={representative.name} 
            className="h-8 w-8 sm:h-10 sm:w-10 rounded-full object-cover cursor-pointer hover:opacity-80 transition-opacity" 
            onClick={() => onPhotoClick(photoUrl)}
          />
        )}
      </td>
      <td className="p-2 sm:p-3">
        <span className="text-xs sm:text-sm text-gray-700">{representative.email || '-'}</span>
      </td>
      <td className="p-2 sm:p-3">
        <span className="text-xs sm:text-sm text-gray-700">{representative.twitterHandle || '-'}</span>
      </td>
      <td className="p-2 sm:p-3">
        <span className="text-xs sm:text-sm text-gray-700">{representative.politicalParty || '-'}</span>
      </td>
      <td className="p-2 sm:p-3 text-xs text-gray-600">
        {representative.lastUpdated ? new Date(Number(representative.lastUpdated) / 1000000).toLocaleDateString() : '-'}
      </td>
    </tr>
  );
}
