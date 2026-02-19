import React, { useState, useRef } from 'react';
import { Building2, MapPin, User, Mail, Twitter, FileText, Plus, Edit2, Trash2, ChevronDown, ChevronRight, Save, X, Upload, Download, Search, Filter, AlertCircle, Calendar, Crown } from 'lucide-react';
import { useGetDirectory, useAddState, useAddUnionTerritory, useAddConstituency, useAddMpToConstituency, useAddMlaToConstituency, useUpdateRepresentative, useDeleteConstituency, useDeleteRepresentative, useUpdateState, useUpdateUnionTerritory, useUpdateConstituency, useUpdateRepresentativeDetails, useSetPrimeMinister, useImportDirectory, useExportDirectory } from '../hooks/useQueries';
import { useFileUpload, useFileUrl } from '../blob-storage/FileStorage';
import { Representative, State, Constituency } from '../backend';
import { toast } from 'sonner';
import { LazyImage } from './LazyImage';

type FormType = 'state' | 'lok-sabha' | 'vidhan-sabha' | 'prime-minister';
type ViewMode = 'lok-sabha' | 'vidhan-sabha' | 'both';

export function AdminDirectory() {
  const { data: directory, isLoading, refetch: refetchDirectory } = useGetDirectory();
  const { mutate: addState, isPending: isAddingState } = useAddState();
  const { mutate: addUT, isPending: isAddingUT } = useAddUnionTerritory();
  const { mutate: addConstituency, isPending: isAddingConstituency } = useAddConstituency();
  const { mutate: addMp, isPending: isAddingMp } = useAddMpToConstituency();
  const { mutate: addMla, isPending: isAddingMla } = useAddMlaToConstituency();
  const { mutate: updateRep, isPending: isUpdatingRep } = useUpdateRepresentative();
  const { mutate: deleteConstituency, isPending: isDeletingConstituency } = useDeleteConstituency();
  const { mutate: deleteRep, isPending: isDeletingRep } = useDeleteRepresentative();
  const { mutate: setPM, isPending: isSettingPM } = useSetPrimeMinister();
  const { mutate: exportDirectory, isPending: isExporting } = useExportDirectory();
  const { mutate: importDirectory, isPending: isImporting } = useImportDirectory();
  const { uploadFile, isUploading } = useFileUpload();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeForm, setActiveForm] = useState<FormType | null>(null);
  const [expandedStates, setExpandedStates] = useState<Set<string>>(new Set());
  const [expandedConstituencies, setExpandedConstituencies] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<ViewMode>('both');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStateFilter, setSelectedStateFilter] = useState<string>('all');
  const [photoModalUrl, setPhotoModalUrl] = useState<string | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    photoPath: '',
    email: '',
    twitterHandle: '',
    remarks: '',
    politicalParty: '',
    stateName: '',
    constituencyName: '',
    isUT: false,
  });
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const validateForm = (): string | null => {
    if (!formData.name.trim()) {
      return 'Name is required';
    }

    if (activeForm === 'state') {
      if (!formData.stateName.trim()) {
        return 'State/UT name is required';
      }
      const allStates = [...(directory?.states || []), ...(directory?.unionTerritories || [])];
      if (allStates.some(s => s.name.toLowerCase() === formData.stateName.trim().toLowerCase())) {
        return 'A state or union territory with this name already exists';
      }
    }

    if (activeForm === 'lok-sabha' || activeForm === 'vidhan-sabha') {
      if (!formData.stateName) {
        return 'Please select a state or union territory';
      }
      if (!formData.constituencyName.trim()) {
        return 'Constituency name is required';
      }

      const allStates = [...(directory?.states || []), ...(directory?.unionTerritories || [])];
      const selectedState = allStates.find(s => s.name === formData.stateName);
      if (!selectedState) {
        return 'Selected state/UT not found';
      }

      if (activeForm === 'lok-sabha') {
        const existingConstituency = selectedState.constituencies.find(
          c => c.name.toLowerCase() === formData.constituencyName.trim().toLowerCase()
        );
        if (existingConstituency?.mp) {
          return 'This constituency already has an MP. Please edit the existing entry instead.';
        }
      }
    }

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationError = validateForm();
    if (validationError) {
      toast.error(validationError);
      return;
    }

    setIsSubmitting(true);

    try {
      let photoPath = formData.photoPath;
      
      if (photoFile) {
        try {
          const path = `representatives/${Date.now()}_${photoFile.name}`;
          const result = await uploadFile(path, photoFile);
          photoPath = result.path;
        } catch (error) {
          console.error('Error uploading photo:', error);
          toast.error('Failed to upload photo. Please try again.');
          setIsSubmitting(false);
          return;
        }
      }

      if (!photoPath) {
        toast.error('Photo is required. Please upload a photo.');
        setIsSubmitting(false);
        return;
      }

      const representative: Representative = {
        name: formData.name.trim(),
        photoPath,
        email: formData.email.trim(),
        twitterHandle: formData.twitterHandle.trim(),
        remarks: formData.remarks.trim(),
        politicalParty: formData.politicalParty.trim() || undefined,
        lastUpdated: BigInt(Date.now() * 1000000),
      };

      if (activeForm === 'prime-minister') {
        await new Promise<void>((resolve, reject) => {
          setPM(
            representative,
            {
              onSuccess: () => {
                toast.success('Prime Minister information updated successfully!');
                resolve();
              },
              onError: (error) => {
                console.error('Error setting PM:', error);
                toast.error('Failed to set Prime Minister. Please try again.');
                reject(error);
              }
            }
          );
        });
      } else if (activeForm === 'state') {
        if (formData.isUT) {
          await new Promise<void>((resolve, reject) => {
            addUT(
              { utName: formData.stateName.trim(), administrator: representative },
              {
                onSuccess: () => {
                  toast.success(`Union Territory "${formData.stateName}" added successfully!`);
                  resolve();
                },
                onError: (error) => {
                  console.error('Error adding UT:', error);
                  toast.error('Failed to add union territory. Please try again.');
                  reject(error);
                }
              }
            );
          });
        } else {
          await new Promise<void>((resolve, reject) => {
            addState(
              { stateName: formData.stateName.trim(), cm: representative },
              {
                onSuccess: () => {
                  toast.success(`State "${formData.stateName}" added successfully!`);
                  resolve();
                },
                onError: (error) => {
                  console.error('Error adding state:', error);
                  toast.error('Failed to add state. Please try again.');
                  reject(error);
                }
              }
            );
          });
        }
      } else if (activeForm === 'lok-sabha') {
        await refetchDirectory();
        
        const allStates = [...(directory?.states || []), ...(directory?.unionTerritories || [])];
        const selectedState = allStates.find(s => s.name === formData.stateName);
        const constituencyExists = selectedState?.constituencies.some(
          c => c.name.toLowerCase() === formData.constituencyName.trim().toLowerCase()
        );

        if (!constituencyExists) {
          await new Promise<void>((resolve, reject) => {
            addConstituency(
              { stateName: formData.stateName, constituencyName: formData.constituencyName.trim() },
              {
                onSuccess: async () => {
                  console.log('Constituency created successfully');
                  await refetchDirectory();
                  resolve();
                },
                onError: (error) => {
                  console.error('Error creating constituency:', error);
                  toast.error('Failed to create constituency. Please try again.');
                  reject(error);
                }
              }
            );
          });
        }

        await new Promise<void>((resolve, reject) => {
          addMp(
            { 
              stateName: formData.stateName, 
              constituencyName: formData.constituencyName.trim(), 
              mp: representative 
            },
            {
              onSuccess: () => {
                toast.success(`MP "${formData.name}" added to ${formData.constituencyName} successfully! ✅`);
                resolve();
              },
              onError: (error) => {
                console.error('Error adding MP:', error);
                toast.error('Failed to add MP. Please try again.');
                reject(error);
              }
            }
          );
        });
      } else if (activeForm === 'vidhan-sabha') {
        await refetchDirectory();
        
        const allStates = [...(directory?.states || []), ...(directory?.unionTerritories || [])];
        const selectedState = allStates.find(s => s.name === formData.stateName);
        const constituencyExists = selectedState?.constituencies.some(
          c => c.name.toLowerCase() === formData.constituencyName.trim().toLowerCase()
        );

        if (!constituencyExists) {
          await new Promise<void>((resolve, reject) => {
            addConstituency(
              { stateName: formData.stateName, constituencyName: formData.constituencyName.trim() },
              {
                onSuccess: async () => {
                  console.log('Constituency created successfully');
                  await refetchDirectory();
                  resolve();
                },
                onError: (error) => {
                  console.error('Error creating constituency:', error);
                  toast.error('Failed to create constituency. Please try again.');
                  reject(error);
                }
              }
            );
          });
        }

        await new Promise<void>((resolve, reject) => {
          addMla(
            { 
              stateName: formData.stateName, 
              constituencyName: formData.constituencyName.trim(), 
              mla: representative 
            },
            {
              onSuccess: () => {
                toast.success(`MLA "${formData.name}" added to ${formData.constituencyName} successfully! ✅`);
                resolve();
              },
              onError: (error) => {
                console.error('Error adding MLA:', error);
                toast.error('Failed to add MLA. Please try again.');
                reject(error);
              }
            }
          );
        });
      }
      
      setFormData({
        name: '',
        photoPath: '',
        email: '',
        twitterHandle: '',
        remarks: '',
        politicalParty: '',
        stateName: '',
        constituencyName: '',
        isUT: false,
      });
      setPhotoFile(null);
      setPhotoPreview('');
      setActiveForm(null);
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExport = async () => {
    try {
      toast.info('Preparing CSV export with image paths...');
      
      exportDirectory(undefined, {
        onSuccess: async (exportedDirectory) => {
          // Convert directory to CSV format with photoPath column
          const csvData = await convertDirectoryToCSV(exportedDirectory);
          
          // Create and download CSV file
          const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
          const link = document.createElement('a');
          const url = URL.createObjectURL(blob);
          link.setAttribute('href', url);
          link.setAttribute('download', `administrative-directory-${Date.now()}.csv`);
          link.style.visibility = 'hidden';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
          
          toast.success('Directory exported successfully with image paths!');
        },
        onError: (error) => {
          console.error('Export error:', error);
          toast.error('Failed to export directory. Please try again.');
        }
      });
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export directory. Please try again.');
    }
  };

  const convertDirectoryToCSV = async (dir: any): Promise<string> => {
    const rows: string[] = [];
    
    // CSV Header with photoPath column
    rows.push('Level,Unit Name,Representative Name,Photo Path,Email,Twitter Handle,Political Party,Remarks,Last Updated');
    
    // Prime Minister
    if (dir.primeMinister) {
      const pm = dir.primeMinister;
      rows.push(escapeCSV([
        'PM',
        'Prime Minister of India',
        pm.name,
        pm.photoPath || '',
        pm.email || '',
        pm.twitterHandle || '',
        pm.politicalParty || '',
        pm.remarks || '',
        new Date(Number(pm.lastUpdated) / 1000000).toISOString()
      ]));
    }
    
    // States
    for (const state of dir.states || []) {
      if (state.cm) {
        rows.push(escapeCSV([
          'State',
          state.name,
          state.cm.name,
          state.cm.photoPath || '',
          state.cm.email || '',
          state.cm.twitterHandle || '',
          state.cm.politicalParty || '',
          state.cm.remarks || '',
          new Date(Number(state.cm.lastUpdated) / 1000000).toISOString()
        ]));
      }
      
      // MPs and MLAs
      for (const constituency of state.constituencies || []) {
        if (constituency.mp) {
          rows.push(escapeCSV([
            'MP',
            `${state.name} - ${constituency.name}`,
            constituency.mp.name,
            constituency.mp.photoPath || '',
            constituency.mp.email || '',
            constituency.mp.twitterHandle || '',
            constituency.mp.politicalParty || '',
            constituency.mp.remarks || '',
            new Date(Number(constituency.mp.lastUpdated) / 1000000).toISOString()
          ]));
        }
        
        for (const mla of constituency.mlas || []) {
          rows.push(escapeCSV([
            'MLA',
            `${state.name} - ${constituency.name}`,
            mla.name,
            mla.photoPath || '',
            mla.email || '',
            mla.twitterHandle || '',
            mla.politicalParty || '',
            mla.remarks || '',
            new Date(Number(mla.lastUpdated) / 1000000).toISOString()
          ]));
        }
      }
    }
    
    // Union Territories
    for (const ut of dir.unionTerritories || []) {
      if (ut.cm) {
        rows.push(escapeCSV([
          'UT',
          ut.name,
          ut.cm.name,
          ut.cm.photoPath || '',
          ut.cm.email || '',
          ut.cm.twitterHandle || '',
          ut.cm.politicalParty || '',
          ut.cm.remarks || '',
          new Date(Number(ut.cm.lastUpdated) / 1000000).toISOString()
        ]));
      }
      
      // MPs and MLAs for UTs
      for (const constituency of ut.constituencies || []) {
        if (constituency.mp) {
          rows.push(escapeCSV([
            'MP',
            `${ut.name} - ${constituency.name}`,
            constituency.mp.name,
            constituency.mp.photoPath || '',
            constituency.mp.email || '',
            constituency.mp.twitterHandle || '',
            constituency.mp.politicalParty || '',
            constituency.mp.remarks || '',
            new Date(Number(constituency.mp.lastUpdated) / 1000000).toISOString()
          ]));
        }
        
        for (const mla of constituency.mlas || []) {
          rows.push(escapeCSV([
            'MLA',
            `${ut.name} - ${constituency.name}`,
            mla.name,
            mla.photoPath || '',
            mla.email || '',
            mla.twitterHandle || '',
            mla.politicalParty || '',
            mla.remarks || '',
            new Date(Number(mla.lastUpdated) / 1000000).toISOString()
          ]));
        }
      }
    }
    
    return rows.join('\n');
  };

  const escapeCSV = (fields: string[]): string => {
    return fields.map(field => {
      const escaped = String(field).replace(/"/g, '""');
      return `"${escaped}"`;
    }).join(',');
  };

  const handleImport = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    try {
      toast.info('Processing CSV import with image path retention...');
      
      const text = await file.text();
      const newDirectory = await parseCSVToDirectory(text);
      
      importDirectory(newDirectory, {
        onSuccess: () => {
          toast.success('Directory imported successfully with image paths retained!');
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
        },
        onError: (error) => {
          console.error('Import error:', error);
          toast.error('Failed to import directory. Please try again.');
        }
      });
    } catch (error) {
      console.error('Import error:', error);
      toast.error('Failed to parse CSV file. Please check the format.');
    }
  };

  const parseCSVToDirectory = async (csvText: string): Promise<any> => {
    const lines = csvText.split('\n').filter(line => line.trim());
    const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
    
    const newDirectory: any = {
      states: [],
      unionTerritories: [],
      administrativeUnits: [],
      primeMinister: null,
    };

    const statesMap = new Map<string, any>();
    const utsMap = new Map<string, any>();

    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]);
      if (values.length < 9) continue;

      const [level, unitName, repName, photoPath, email, twitterHandle, politicalParty, remarks, lastUpdated] = values;

      const representative: Representative = {
        name: repName,
        photoPath: photoPath || '',
        email: email || '',
        twitterHandle: twitterHandle || '',
        politicalParty: politicalParty || undefined,
        remarks: remarks || '',
        lastUpdated: BigInt(new Date(lastUpdated).getTime() * 1000000),
      };

      if (level === 'PM') {
        newDirectory.primeMinister = representative;
      } else if (level === 'State') {
        if (!statesMap.has(unitName)) {
          statesMap.set(unitName, {
            name: unitName,
            cm: representative,
            constituencies: [],
            isUnionTerritory: false,
          });
        } else {
          statesMap.get(unitName).cm = representative;
        }
      } else if (level === 'UT') {
        if (!utsMap.has(unitName)) {
          utsMap.set(unitName, {
            name: unitName,
            cm: representative,
            constituencies: [],
            isUnionTerritory: true,
          });
        } else {
          utsMap.get(unitName).cm = representative;
        }
      } else if (level === 'MP' || level === 'MLA') {
        const [stateName, constituencyName] = unitName.split(' - ').map(s => s.trim());
        
        const stateMap = statesMap.has(stateName) ? statesMap : utsMap;
        if (!stateMap.has(stateName)) {
          stateMap.set(stateName, {
            name: stateName,
            cm: null,
            constituencies: [],
            isUnionTerritory: stateMap === utsMap,
          });
        }

        const state = stateMap.get(stateName);
        let constituency = state.constituencies.find((c: any) => c.name === constituencyName);
        
        if (!constituency) {
          constituency = {
            name: constituencyName,
            mp: null,
            mlas: [],
          };
          state.constituencies.push(constituency);
        }

        if (level === 'MP') {
          constituency.mp = representative;
        } else if (level === 'MLA') {
          constituency.mlas.push(representative);
        }
      }
    }

    newDirectory.states = Array.from(statesMap.values());
    newDirectory.unionTerritories = Array.from(utsMap.values());

    return newDirectory;
  };

  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current);

    return result;
  };

  const toggleState = (stateName: string) => {
    const newExpanded = new Set(expandedStates);
    if (newExpanded.has(stateName)) {
      newExpanded.delete(stateName);
    } else {
      newExpanded.add(stateName);
    }
    setExpandedStates(newExpanded);
  };

  const toggleConstituency = (constituencyKey: string) => {
    const newExpanded = new Set(expandedConstituencies);
    if (newExpanded.has(constituencyKey)) {
      newExpanded.delete(constituencyKey);
    } else {
      newExpanded.add(constituencyKey);
    }
    setExpandedConstituencies(newExpanded);
  };

  const allStates = [...(directory?.states || []), ...(directory?.unionTerritories || [])];
  
  const filteredStates = allStates.filter(state => {
    if (selectedStateFilter !== 'all' && state.name !== selectedStateFilter) {
      return false;
    }
    
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    const stateMatch = state.name.toLowerCase().includes(query);
    const cmMatch = state.cm?.name.toLowerCase().includes(query);
    
    const constituencyMatch = state.constituencies.some(c => {
      const cNameMatch = c.name.toLowerCase().includes(query);
      const mpMatch = c.mp?.name.toLowerCase().includes(query);
      const mlaMatch = c.mlas.some(mla => mla.name.toLowerCase().includes(query));
      return cNameMatch || mpMatch || mlaMatch;
    });
    
    return stateMatch || cmMatch || constituencyMatch;
  });

  const RepresentativePhoto = ({ photoPath, name }: { photoPath: string; name: string }) => {
    const { data: photoUrl } = useFileUrl(photoPath);
    
    if (!photoUrl) {
      return (
        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
          <User className="w-5 h-5 text-gray-400" />
        </div>
      );
    }

    return (
      <LazyImage
        src={photoUrl}
        alt={name}
        className="w-10 h-10 rounded-full object-cover cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all"
        onClick={() => setPhotoModalUrl(photoUrl)}
        priority="low"
      />
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-2">
                <Building2 className="w-8 h-8 text-blue-600" />
                Administrative Directory
              </h1>
              <p className="text-gray-600 mt-1">Manage political representatives and administrative units</p>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <button
                onClick={handleExport}
                disabled={isExporting}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                {isExporting ? 'Exporting...' : 'Export CSV'}
              </button>
              <button
                onClick={handleImport}
                disabled={isImporting}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
              >
                <Upload className="w-4 h-4" />
                {isImporting ? 'Importing...' : 'Import CSV'}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search by name, state, or constituency..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <select
                value={selectedStateFilter}
                onChange={(e) => setSelectedStateFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All States/UTs</option>
                {allStates.map(state => (
                  <option key={state.name} value={state.name}>{state.name}</option>
                ))}
              </select>
              
              <select
                value={viewMode}
                onChange={(e) => setViewMode(e.target.value as ViewMode)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="both">Both MP & MLA</option>
                <option value="lok-sabha">Lok Sabha (MP) Only</option>
                <option value="vidhan-sabha">Vidhan Sabha (MLA) Only</option>
              </select>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setActiveForm('prime-minister')}
              className="flex items-center gap-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
            >
              <Crown className="w-4 h-4" />
              Set Prime Minister
            </button>
            <button
              onClick={() => setActiveForm('state')}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add State/UT
            </button>
            <button
              onClick={() => setActiveForm('lok-sabha')}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add MP (Lok Sabha)
            </button>
            <button
              onClick={() => setActiveForm('vidhan-sabha')}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add MLA (Vidhan Sabha)
            </button>
          </div>
        </div>

        {/* Form Modal */}
        {activeForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">
                    {activeForm === 'prime-minister' && 'Set Prime Minister'}
                    {activeForm === 'state' && 'Add State/Union Territory'}
                    {activeForm === 'lok-sabha' && 'Add MP (Lok Sabha)'}
                    {activeForm === 'vidhan-sabha' && 'Add MLA (Vidhan Sabha)'}
                  </h2>
                  <button
                    onClick={() => {
                      setActiveForm(null);
                      setFormData({
                        name: '',
                        photoPath: '',
                        email: '',
                        twitterHandle: '',
                        remarks: '',
                        politicalParty: '',
                        stateName: '',
                        constituencyName: '',
                        isUT: false,
                      });
                      setPhotoFile(null);
                      setPhotoPreview('');
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {activeForm === 'state' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          State/UT Name *
                        </label>
                        <input
                          type="text"
                          value={formData.stateName}
                          onChange={(e) => setFormData({ ...formData, stateName: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required
                        />
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="isUT"
                          checked={formData.isUT}
                          onChange={(e) => setFormData({ ...formData, isUT: e.target.checked })}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <label htmlFor="isUT" className="text-sm font-medium text-gray-700">
                          This is a Union Territory
                        </label>
                      </div>
                    </>
                  )}

                  {(activeForm === 'lok-sabha' || activeForm === 'vidhan-sabha') && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Select State/UT *
                        </label>
                        <select
                          value={formData.stateName}
                          onChange={(e) => setFormData({ ...formData, stateName: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required
                        >
                          <option value="">Select a state or union territory</option>
                          {allStates.map(state => (
                            <option key={state.name} value={state.name}>{state.name}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Constituency Name *
                        </label>
                        <input
                          type="text"
                          value={formData.constituencyName}
                          onChange={(e) => setFormData({ ...formData, constituencyName: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required
                        />
                      </div>
                    </>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Representative Name *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Photo *
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    {photoPreview && (
                      <div className="mt-2">
                        <img src={photoPreview} alt="Preview" className="w-32 h-32 object-cover rounded-lg" />
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Twitter Handle
                    </label>
                    <input
                      type="text"
                      value={formData.twitterHandle}
                      onChange={(e) => setFormData({ ...formData, twitterHandle: e.target.value })}
                      placeholder="@username"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Political Party
                    </label>
                    <input
                      type="text"
                      value={formData.politicalParty}
                      onChange={(e) => setFormData({ ...formData, politicalParty: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Remarks
                    </label>
                    <textarea
                      value={formData.remarks}
                      onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div className="flex gap-2 pt-4">
                    <button
                      type="submit"
                      disabled={isSubmitting || isUploading}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                      <Save className="w-4 h-4" />
                      {isSubmitting || isUploading ? 'Saving...' : 'Save'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveForm(null);
                        setFormData({
                          name: '',
                          photoPath: '',
                          email: '',
                          twitterHandle: '',
                          remarks: '',
                          politicalParty: '',
                          stateName: '',
                          constituencyName: '',
                          isUT: false,
                        });
                        setPhotoFile(null);
                        setPhotoPreview('');
                      }}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Prime Minister Section */}
        {directory?.primeMinister && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Crown className="w-6 h-6 text-yellow-600" />
              <h2 className="text-xl font-bold text-gray-900">Prime Minister of India</h2>
            </div>
            
            <div className="flex items-center gap-4">
              <RepresentativePhoto 
                photoPath={directory.primeMinister.photoPath} 
                name={directory.primeMinister.name}
              />
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">{directory.primeMinister.name}</h3>
                {directory.primeMinister.politicalParty && (
                  <p className="text-sm text-gray-600">{directory.primeMinister.politicalParty}</p>
                )}
              </div>
              <div className="flex gap-2">
                {directory.primeMinister.email && (
                  <a
                    href={`mailto:${directory.primeMinister.email}`}
                    className="p-2 text-gray-600 hover:text-blue-600 transition-colors"
                    title="Email"
                  >
                    <Mail className="w-5 h-5" />
                  </a>
                )}
                {directory.primeMinister.twitterHandle && (
                  <a
                    href={`https://twitter.com/${directory.primeMinister.twitterHandle.replace('@', '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 text-gray-600 hover:text-blue-600 transition-colors"
                    title="Twitter"
                  >
                    <Twitter className="w-5 h-5" />
                  </a>
                )}
              </div>
            </div>
          </div>
        )}

        {/* States and Union Territories */}
        <div className="space-y-4">
          {filteredStates.map((state) => (
            <div key={state.name} className="bg-white rounded-lg shadow-sm overflow-hidden">
              {/* State Header */}
              <div
                className="flex items-center justify-between p-4 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => toggleState(state.name)}
              >
                <div className="flex items-center gap-3">
                  {expandedStates.has(state.name) ? (
                    <ChevronDown className="w-5 h-5 text-gray-600" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-gray-600" />
                  )}
                  <Building2 className="w-5 h-5 text-blue-600" />
                  <div>
                    <h3 className="font-semibold text-gray-900">{state.name}</h3>
                    <p className="text-sm text-gray-600">
                      {state.isUnionTerritory ? 'Union Territory' : 'State'} • {state.constituencies.length} constituencies
                    </p>
                  </div>
                </div>
                
                {state.cm && (
                  <div className="flex items-center gap-2">
                    <RepresentativePhoto 
                      photoPath={state.cm.photoPath} 
                      name={state.cm.name}
                    />
                    <div className="hidden md:block">
                      <p className="text-sm font-medium text-gray-900">{state.cm.name}</p>
                      <p className="text-xs text-gray-600">{state.isUnionTerritory ? 'Administrator' : 'Chief Minister'}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* State Content */}
              {expandedStates.has(state.name) && (
                <div className="p-4 space-y-4">
                  {/* Constituencies */}
                  {state.constituencies.map((constituency) => {
                    const constituencyKey = `${state.name}-${constituency.name}`;
                    const showMP = viewMode === 'both' || viewMode === 'lok-sabha';
                    const showMLA = viewMode === 'both' || viewMode === 'vidhan-sabha';
                    
                    return (
                      <div key={constituencyKey} className="border border-gray-200 rounded-lg overflow-hidden">
                        {/* Constituency Header */}
                        <div
                          className="flex items-center justify-between p-3 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
                          onClick={() => toggleConstituency(constituencyKey)}
                        >
                          <div className="flex items-center gap-2">
                            {expandedConstituencies.has(constituencyKey) ? (
                              <ChevronDown className="w-4 h-4 text-gray-600" />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-gray-600" />
                            )}
                            <MapPin className="w-4 h-4 text-indigo-600" />
                            <span className="font-medium text-gray-900">{constituency.name}</span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            {constituency.mp && showMP && (
                              <span className="px-2 py-1 bg-indigo-100 text-indigo-700 text-xs rounded">MP</span>
                            )}
                            {constituency.mlas.length > 0 && showMLA && (
                              <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded">
                                {constituency.mlas.length} MLA{constituency.mlas.length > 1 ? 's' : ''}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Constituency Content */}
                        {expandedConstituencies.has(constituencyKey) && (
                          <div className="p-3 space-y-3">
                            {/* MP Section */}
                            {showMP && constituency.mp && (
                              <div className="border-l-4 border-indigo-500 pl-3">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <RepresentativePhoto 
                                      photoPath={constituency.mp.photoPath} 
                                      name={constituency.mp.name}
                                    />
                                    <div>
                                      <p className="font-medium text-gray-900">{constituency.mp.name}</p>
                                      <p className="text-sm text-gray-600">Member of Parliament (Lok Sabha)</p>
                                      {constituency.mp.politicalParty && (
                                        <p className="text-xs text-gray-500">{constituency.mp.politicalParty}</p>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex gap-1">
                                    {constituency.mp.email && (
                                      <a
                                        href={`mailto:${constituency.mp.email}`}
                                        className="p-2 text-gray-600 hover:text-blue-600 transition-colors"
                                        title="Email"
                                      >
                                        <Mail className="w-4 h-4" />
                                      </a>
                                    )}
                                    {constituency.mp.twitterHandle && (
                                      <a
                                        href={`https://twitter.com/${constituency.mp.twitterHandle.replace('@', '')}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="p-2 text-gray-600 hover:text-blue-600 transition-colors"
                                        title="Twitter"
                                      >
                                        <Twitter className="w-4 h-4" />
                                      </a>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* MLAs Section */}
                            {showMLA && constituency.mlas.length > 0 && (
                              <div className="space-y-2">
                                {constituency.mlas.map((mla, index) => (
                                  <div key={index} className="border-l-4 border-purple-500 pl-3">
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-3">
                                        <RepresentativePhoto 
                                          photoPath={mla.photoPath} 
                                          name={mla.name}
                                        />
                                        <div>
                                          <p className="font-medium text-gray-900">{mla.name}</p>
                                          <p className="text-sm text-gray-600">Member of Legislative Assembly (Vidhan Sabha)</p>
                                          {mla.politicalParty && (
                                            <p className="text-xs text-gray-500">{mla.politicalParty}</p>
                                          )}
                                        </div>
                                      </div>
                                      <div className="flex gap-1">
                                        {mla.email && (
                                          <a
                                            href={`mailto:${mla.email}`}
                                            className="p-2 text-gray-600 hover:text-blue-600 transition-colors"
                                            title="Email"
                                          >
                                            <Mail className="w-4 h-4" />
                                          </a>
                                        )}
                                        {mla.twitterHandle && (
                                          <a
                                            href={`https://twitter.com/${mla.twitterHandle.replace('@', '')}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="p-2 text-gray-600 hover:text-blue-600 transition-colors"
                                            title="Twitter"
                                          >
                                            <Twitter className="w-4 h-4" />
                                          </a>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Photo Modal */}
        {photoModalUrl && (
          <div
            className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50"
            onClick={() => setPhotoModalUrl(null)}
          >
            <div className="max-w-4xl max-h-[90vh] overflow-auto">
              <img
                src={photoModalUrl}
                alt="Representative"
                className="w-full h-auto rounded-lg"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
