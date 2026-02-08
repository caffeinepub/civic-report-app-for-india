import React, { useState, useRef } from 'react';
import { Building2, MapPin, User, Mail, Twitter, FileText, Plus, Edit2, Trash2, ChevronDown, ChevronRight, Save, X, Upload, Download, Search, Filter, AlertCircle, Calendar, Crown } from 'lucide-react';
import { useGetDirectory, useAddState, useAddUnionTerritory, useAddConstituency, useAddMpToConstituency, useAddMlaToConstituency, useUpdateRepresentative, useDeleteConstituency, useDeleteRepresentative, useUpdateState, useUpdateUnionTerritory, useUpdateConstituency, useUpdateRepresentativeDetails, useSetPrimeMinister, useImportDirectory, useExportDirectory } from '../hooks/useQueries';
import { useFileUpload, useFileUrl } from '../blob-storage/FileStorage';
import { Representative, State, Constituency } from '../backend';
import { toast } from 'sonner';

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
          toast.error('Failed to import directory. Please check the file format and try again.');
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
        }
      });
    } catch (error) {
      console.error('Import error:', error);
      toast.error('Failed to parse import file. Please check the file format.');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const parseCSVToDirectory = async (csvText: string): Promise<any> => {
    const lines = csvText.split('\n').filter(line => line.trim());
    const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
    
    const newDirectory: any = {
      states: [],
      unionTerritories: [],
      administrativeUnits: [],
      primeMinister: undefined
    };
    
    const statesMap = new Map<string, any>();
    const utsMap = new Map<string, any>();
    
    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]);
      
      if (values.length < 9) continue;
      
      const [level, unitName, repName, photoPath, email, twitterHandle, politicalParty, remarks, lastUpdated] = values;
      
      // Check if photoPath exists and is valid (not empty)
      let finalPhotoPath = '';
      if (photoPath && photoPath.trim()) {
        // If photoPath exists, reuse it directly (no re-upload needed)
        finalPhotoPath = photoPath.trim();
        console.log(`Reusing existing image path for ${repName}: ${finalPhotoPath}`);
      } else {
        // If no photoPath, this is a new entry requiring manual upload
        console.warn(`No image path found for ${repName}. Manual upload will be required.`);
      }
      
      const representative: Representative = {
        name: repName,
        photoPath: finalPhotoPath,
        email: email || '',
        twitterHandle: twitterHandle || '',
        remarks: remarks || '',
        politicalParty: politicalParty || undefined,
        lastUpdated: BigInt(Date.now() * 1000000),
      };
      
      if (level === 'PM') {
        newDirectory.primeMinister = representative;
      } else if (level === 'State') {
        if (!statesMap.has(unitName)) {
          statesMap.set(unitName, {
            name: unitName,
            cm: representative,
            constituencies: [],
            isUnionTerritory: false
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
            isUnionTerritory: true
          });
        } else {
          utsMap.get(unitName).cm = representative;
        }
      } else if (level === 'MP' || level === 'MLA') {
        const [stateName, constituencyName] = unitName.split(' - ');
        
        const stateMap = statesMap.has(stateName) ? statesMap : utsMap;
        if (!stateMap.has(stateName)) {
          stateMap.set(stateName, {
            name: stateName,
            cm: undefined,
            constituencies: [],
            isUnionTerritory: stateMap === utsMap
          });
        }
        
        const state = stateMap.get(stateName);
        let constituency = state.constituencies.find((c: any) => c.name === constituencyName);
        
        if (!constituency) {
          constituency = {
            name: constituencyName,
            mp: undefined,
            mlas: []
          };
          state.constituencies.push(constituency);
        }
        
        if (level === 'MP') {
          constituency.mp = representative;
        } else {
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
      
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
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

  const toggleConstituency = (key: string) => {
    const newExpanded = new Set(expandedConstituencies);
    if (newExpanded.has(key)) {
      newExpanded.delete(key);
    } else {
      newExpanded.add(key);
    }
    setExpandedConstituencies(newExpanded);
  };

  const filteredStates = () => {
    const allStates = [...(directory?.states || []), ...(directory?.unionTerritories || [])];
    
    let filtered = allStates;
    
    if (selectedStateFilter !== 'all') {
      filtered = filtered.filter(s => s.name === selectedStateFilter);
    }
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
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
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8 text-center">
        <Building2 className="h-12 w-12 text-blue-500 mx-auto mb-4 animate-pulse" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Loading Directory...</h3>
        <p className="text-gray-600">Please wait while we fetch the administrative data.</p>
      </div>
    );
  }

  const isPending = isAddingState || isAddingUT || isAddingMp || isAddingMla || isUploading || isSubmitting || isSettingPM || isExporting || isImporting;

  return (
    <div className="space-y-6">
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        onChange={handleFileChange}
        className="hidden"
      />

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

      <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <div className="flex items-center space-x-3">
            <Building2 className="h-6 w-6 text-blue-600 flex-shrink-0" />
            <h2 className="text-xl font-bold text-gray-900">Administrative Directory</h2>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <button 
              onClick={handleExport}
              disabled={isPending}
              className="flex items-center justify-center space-x-2 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="h-4 w-4" />
              <span>{isExporting ? 'Exporting...' : 'Export Directory'}</span>
            </button>
            <button 
              onClick={handleImport}
              disabled={isPending}
              className="flex items-center justify-center space-x-2 px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Upload className="h-4 w-4" />
              <span>{isImporting ? 'Importing...' : 'Import Directory'}</span>
            </button>
          </div>
        </div>
        <p className="text-sm sm:text-base text-gray-600 mb-2">
          Manage information for Prime Minister, 28 States, 8 Union Territories, 543 Lok Sabha MPs, and 4,131 Vidhan Sabha MLAs
        </p>
        <p className="text-xs text-blue-600 bg-blue-50 p-2 rounded">
          <AlertCircle className="inline h-3 w-3 mr-1" />
          Export/Import retains image paths (photoPath) for efficient backup and restoration. Existing images are reused automatically during import.
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Data Entry Forms</h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 mb-6">
          <button
            onClick={() => setActiveForm('prime-minister')}
            className={`flex items-center justify-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
              activeForm === 'prime-minister' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Crown className="h-4 w-4" />
            <span className="text-sm sm:text-base">Prime Minister</span>
          </button>
          <button
            onClick={() => setActiveForm('state')}
            className={`flex items-center justify-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
              activeForm === 'state' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Building2 className="h-4 w-4" />
            <span className="text-sm sm:text-base">State/UT Level</span>
          </button>
          <button
            onClick={() => setActiveForm('lok-sabha')}
            className={`flex items-center justify-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
              activeForm === 'lok-sabha' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <MapPin className="h-4 w-4" />
            <span className="text-sm sm:text-base">Lok Sabha (MP)</span>
          </button>
          <button
            onClick={() => setActiveForm('vidhan-sabha')}
            className={`flex items-center justify-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
              activeForm === 'vidhan-sabha' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <User className="h-4 w-4" />
            <span className="text-sm sm:text-base">Vidhan Sabha (MLA)</span>
          </button>
        </div>

        {activeForm && (
          <form onSubmit={handleSubmit} className="space-y-4 border-t pt-4">
            {activeForm === 'state' && (
              <div className="flex items-center space-x-4 mb-4">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.isUT}
                    onChange={(e) => setFormData({ ...formData, isUT: e.target.checked })}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm text-gray-700">Union Territory</span>
                </label>
              </div>
            )}

            {activeForm === 'state' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {formData.isUT ? 'Union Territory Name' : 'State Name'} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.stateName}
                  onChange={(e) => setFormData({ ...formData, stateName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                  placeholder="Enter state or union territory name"
                />
              </div>
            )}

            {(activeForm === 'lok-sabha' || activeForm === 'vidhan-sabha') && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    State/UT Name <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.stateName}
                    onChange={(e) => setFormData({ ...formData, stateName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">Select State or UT</option>
                    <optgroup label="States">
                      {directory?.states.map(state => (
                        <option key={state.name} value={state.name}>{state.name} (State)</option>
                      ))}
                    </optgroup>
                    <optgroup label="Union Territories">
                      {directory?.unionTerritories.map(ut => (
                        <option key={ut.name} value={ut.name}>{ut.name} (UT)</option>
                      ))}
                    </optgroup>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Constituency Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.constituencyName}
                    onChange={(e) => setFormData({ ...formData, constituencyName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                    placeholder="Enter constituency name"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    <AlertCircle className="inline h-3 w-3 mr-1" />
                    Constituency will be created automatically if it doesn't exist
                  </p>
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {activeForm === 'prime-minister' ? 'Prime Minister Name' :
                 activeForm === 'state' ? (formData.isUT ? 'Administrator Name' : 'Chief Minister Name') : 
                 activeForm === 'lok-sabha' ? 'MP Name' : 'MLA Name'} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
                placeholder="Enter full name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Photo Upload <span className="text-red-500">*</span>
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required={!formData.photoPath}
              />
              {photoPreview && (
                <img src={photoPreview} alt="Preview" className="mt-2 h-20 w-20 object-cover rounded-lg" />
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email <span className="text-gray-500 text-xs">(Optional)</span>
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="email@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                X (Twitter) Handle <span className="text-gray-500 text-xs">(Optional)</span>
              </label>
              <input
                type="text"
                value={formData.twitterHandle}
                onChange={(e) => setFormData({ ...formData, twitterHandle: e.target.value })}
                placeholder="@username"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Political Party <span className="text-gray-500 text-xs">(Optional)</span>
              </label>
              <input
                type="text"
                value={formData.politicalParty}
                onChange={(e) => setFormData({ ...formData, politicalParty: e.target.value })}
                placeholder="e.g., BJP, INC, AAP"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Remarks</label>
              <textarea
                value={formData.remarks}
                onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none h-20"
                placeholder="Additional notes or remarks (optional)"
              />
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-4">
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
                className="w-full sm:w-auto px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                disabled={isPending}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="w-full sm:w-auto flex items-center justify-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Save className="h-4 w-4" />
                <span>
                  {isPending ? 'Saving...' : 'Save Entry'}
                </span>
              </button>
            </div>
          </form>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
        <div className="flex flex-col gap-4 mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Administrative Directory Table</h3>
          
          <div className="flex flex-col gap-3">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, state, or constituency..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <select
                value={selectedStateFilter}
                onChange={(e) => setSelectedStateFilter(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              >
                <option value="all">All States/UTs</option>
                {directory?.states.map(state => (
                  <option key={state.name} value={state.name}>{state.name}</option>
                ))}
                {directory?.unionTerritories.map(ut => (
                  <option key={ut.name} value={ut.name}>{ut.name}</option>
                ))}
              </select>

              <div className="flex items-center bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('lok-sabha')}
                  className={`flex-1 px-3 py-1.5 text-xs sm:text-sm rounded transition-colors ${
                    viewMode === 'lok-sabha' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600'
                  }`}
                >
                  Lok Sabha
                </button>
                <button
                  onClick={() => setViewMode('vidhan-sabha')}
                  className={`flex-1 px-3 py-1.5 text-xs sm:text-sm rounded transition-colors ${
                    viewMode === 'vidhan-sabha' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600'
                  }`}
                >
                  Vidhan Sabha
                </button>
                <button
                  onClick={() => setViewMode('both')}
                  className={`flex-1 px-3 py-1.5 text-xs sm:text-sm rounded transition-colors ${
                    viewMode === 'both' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600'
                  }`}
                >
                  Both
                </button>
              </div>
            </div>
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
                    <th className="text-left p-2 sm:p-3 text-xs sm:text-sm font-semibold text-gray-700 whitespace-nowrap">Remarks</th>
                    <th className="text-left p-2 sm:p-3 text-xs sm:text-sm font-semibold text-gray-700 whitespace-nowrap">Last Updated</th>
                    <th className="text-center p-2 sm:p-3 text-xs sm:text-sm font-semibold text-gray-700 whitespace-nowrap">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <PrimeMinisterTableRow
                    primeMinister={directory?.primeMinister}
                    onPhotoClick={setPhotoModalUrl}
                  />
                  
                  {filteredStates()
                    .filter(state => !state.isUnionTerritory)
                    .map((state, stateIndex) => (
                      <StateTableRows
                        key={state.name}
                        state={state}
                        stateNumber={stateIndex + 1}
                        levelLabel="State"
                        isExpanded={expandedStates.has(state.name)}
                        onToggle={() => toggleState(state.name)}
                        expandedConstituencies={expandedConstituencies}
                        onToggleConstituency={toggleConstituency}
                        viewMode={viewMode}
                        onDeleteConstituency={deleteConstituency}
                        onDeleteRepresentative={deleteRep}
                        onPhotoClick={setPhotoModalUrl}
                        refetchDirectory={refetchDirectory}
                      />
                    ))}
                  
                  {filteredStates()
                    .filter(state => state.isUnionTerritory)
                    .map((state, utIndex) => (
                      <StateTableRows
                        key={state.name}
                        state={state}
                        stateNumber={utIndex + 1}
                        levelLabel="UT"
                        isExpanded={expandedStates.has(state.name)}
                        onToggle={() => toggleState(state.name)}
                        expandedConstituencies={expandedConstituencies}
                        onToggleConstituency={toggleConstituency}
                        viewMode={viewMode}
                        onDeleteConstituency={deleteConstituency}
                        onDeleteRepresentative={deleteRep}
                        onPhotoClick={setPhotoModalUrl}
                        refetchDirectory={refetchDirectory}
                      />
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {filteredStates().length === 0 && (
          <div className="text-center py-8">
            <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Results Found</h3>
            <p className="text-gray-600">Try adjusting your search or filters.</p>
          </div>
        )}
      </div>
    </div>
  );
}

// Prime Minister Table Row Component (keeping existing implementation - no changes needed)
function PrimeMinisterTableRow({
  primeMinister,
  onPhotoClick
}: {
  primeMinister?: Representative;
  onPhotoClick: (url: string) => void;
}) {
  const { data: pmPhotoUrl } = useFileUrl(primeMinister?.photoPath || '');
  const [isEditing, setIsEditing] = useState(false);
  const { mutate: setPM } = useSetPrimeMinister();
  const { uploadFile } = useFileUpload();
  
  const [editData, setEditData] = useState({
    name: primeMinister?.name || '',
    email: primeMinister?.email || '',
    twitterHandle: primeMinister?.twitterHandle || '',
    remarks: primeMinister?.remarks || '',
    politicalParty: primeMinister?.politicalParty || '',
    photoPath: primeMinister?.photoPath || '',
  });
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>('');

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

  const handleSave = async () => {
    try {
      let photoPath = editData.photoPath;
      
      if (photoFile) {
        const path = `representatives/${Date.now()}_${photoFile.name}`;
        const result = await uploadFile(path, photoFile);
        photoPath = result.path;
      }

      const updatedPM: Representative = {
        name: editData.name,
        photoPath,
        email: editData.email,
        twitterHandle: editData.twitterHandle,
        remarks: editData.remarks,
        politicalParty: editData.politicalParty || undefined,
        lastUpdated: BigInt(Date.now() * 1000000),
      };

      setPM(updatedPM, {
        onSuccess: () => {
          toast.success('Prime Minister updated successfully!');
          setIsEditing(false);
          setPhotoFile(null);
          setPhotoPreview('');
        },
        onError: (error) => {
          console.error('Error updating PM:', error);
          toast.error('Failed to update Prime Minister.');
        }
      });
    } catch (error) {
      console.error('Error saving PM:', error);
      toast.error('Failed to save changes.');
    }
  };

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
        {isEditing ? (
          <input
            type="text"
            value={editData.name}
            onChange={(e) => setEditData({ ...editData, name: e.target.value })}
            className="w-full px-2 py-1 border border-gray-300 rounded text-xs sm:text-sm"
          />
        ) : (
          <div className="text-xs sm:text-sm text-gray-900">{primeMinister?.name || 'No PM Set'}</div>
        )}
      </td>
      <td className="p-2 sm:p-3">
        {isEditing ? (
          <input
            type="file"
            accept="image/*"
            onChange={handlePhotoChange}
            className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
          />
        ) : (
          pmPhotoUrl && (
            <img 
              src={pmPhotoUrl} 
              alt={primeMinister?.name} 
              className="h-8 w-8 sm:h-10 sm:w-10 rounded-full object-cover cursor-pointer hover:opacity-80 transition-opacity" 
              onClick={() => onPhotoClick(pmPhotoUrl)}
            />
          )
        )}
      </td>
      <td className="p-2 sm:p-3">
        {isEditing ? (
          <input
            type="email"
            value={editData.email}
            onChange={(e) => setEditData({ ...editData, email: e.target.value })}
            className="w-full px-2 py-1 border border-gray-300 rounded text-xs sm:text-sm"
          />
        ) : (
          <span className="text-xs sm:text-sm text-gray-700">{primeMinister?.email || '-'}</span>
        )}
      </td>
      <td className="p-2 sm:p-3">
        {isEditing ? (
          <input
            type="text"
            value={editData.twitterHandle}
            onChange={(e) => setEditData({ ...editData, twitterHandle: e.target.value })}
            className="w-full px-2 py-1 border border-gray-300 rounded text-xs sm:text-sm"
          />
        ) : (
          <span className="text-xs sm:text-sm text-gray-700">{primeMinister?.twitterHandle || '-'}</span>
        )}
      </td>
      <td className="p-2 sm:p-3">
        {isEditing ? (
          <input
            type="text"
            value={editData.politicalParty}
            onChange={(e) => setEditData({ ...editData, politicalParty: e.target.value })}
            className="w-full px-2 py-1 border border-gray-300 rounded text-xs sm:text-sm"
          />
        ) : (
          <span className="text-xs sm:text-sm text-gray-700">{primeMinister?.politicalParty || '-'}</span>
        )}
      </td>
      <td className="p-2 sm:p-3">
        {isEditing ? (
          <textarea
            value={editData.remarks}
            onChange={(e) => setEditData({ ...editData, remarks: e.target.value })}
            className="w-full px-2 py-1 border border-gray-300 rounded text-xs sm:text-sm resize-none h-16"
          />
        ) : (
          <span className="text-xs sm:text-sm text-gray-700 max-w-xs truncate block">{primeMinister?.remarks || '-'}</span>
        )}
      </td>
      <td className="p-2 sm:p-3 text-xs text-gray-600">
        {primeMinister?.lastUpdated ? new Date(Number(primeMinister.lastUpdated) / 1000000).toLocaleDateString() : '-'}
      </td>
      <td className="p-2 sm:p-3 text-center">
        {!isEditing ? (
          <button
            onClick={() => {
              setIsEditing(true);
              setEditData({
                name: primeMinister?.name || '',
                email: primeMinister?.email || '',
                twitterHandle: primeMinister?.twitterHandle || '',
                remarks: primeMinister?.remarks || '',
                politicalParty: primeMinister?.politicalParty || '',
                photoPath: primeMinister?.photoPath || '',
              });
            }}
            className="p-1 text-blue-600 hover:bg-blue-100 rounded"
          >
            <Edit2 className="h-3 w-3 sm:h-4 sm:w-4" />
          </button>
        ) : (
          <div className="flex items-center justify-center space-x-1">
            <button onClick={handleSave} className="p-1 text-green-600 hover:bg-green-100 rounded">
              <Save className="h-3 w-3 sm:h-4 sm:w-4" />
            </button>
            <button
              onClick={() => {
                setIsEditing(false);
                setPhotoFile(null);
                setPhotoPreview('');
              }}
              className="p-1 text-red-600 hover:bg-red-100 rounded"
            >
              <X className="h-3 w-3 sm:h-4 sm:w-4" />
            </button>
          </div>
        )}
      </td>
    </tr>
  );
}

// State Table Rows Component (keeping existing implementation - no changes needed)
function StateTableRows({ 
  state, 
  stateNumber,
  levelLabel,
  isExpanded, 
  onToggle, 
  expandedConstituencies, 
  onToggleConstituency,
  viewMode,
  onDeleteConstituency,
  onDeleteRepresentative,
  onPhotoClick,
  refetchDirectory
}: {
  state: State;
  stateNumber: number;
  levelLabel: 'State' | 'UT';
  isExpanded: boolean;
  onToggle: () => void;
  expandedConstituencies: Set<string>;
  onToggleConstituency: (key: string) => void;
  viewMode: ViewMode;
  onDeleteConstituency: any;
  onDeleteRepresentative: any;
  onPhotoClick: (url: string) => void;
  refetchDirectory: () => void;
}) {
  const { data: cmPhotoUrl } = useFileUrl(state.cm?.photoPath || '');
  const [isEditing, setIsEditing] = useState(false);
  const { mutate: updateState } = useUpdateState();
  const { mutate: updateUT } = useUpdateUnionTerritory();
  const { uploadFile } = useFileUpload();
  
  const [editData, setEditData] = useState({
    stateName: state.name,
    name: state.cm?.name || '',
    email: state.cm?.email || '',
    twitterHandle: state.cm?.twitterHandle || '',
    remarks: state.cm?.remarks || '',
    politicalParty: state.cm?.politicalParty || '',
    photoPath: state.cm?.photoPath || '',
    isUT: state.isUnionTerritory,
  });
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>('');

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

  const handleSave = async () => {
    try {
      let photoPath = editData.photoPath;
      
      if (photoFile) {
        const path = `representatives/${Date.now()}_${photoFile.name}`;
        const result = await uploadFile(path, photoFile);
        photoPath = result.path;
      }

      const updatedRep: Representative = {
        name: editData.name,
        photoPath,
        email: editData.email,
        twitterHandle: editData.twitterHandle,
        remarks: editData.remarks,
        politicalParty: editData.politicalParty || undefined,
        lastUpdated: BigInt(Date.now() * 1000000),
      };

      const updatedState: State = {
        name: editData.stateName,
        cm: updatedRep,
        constituencies: state.constituencies,
        isUnionTerritory: editData.isUT,
      };

      if (editData.isUT !== state.isUnionTerritory) {
        toast.info('Moving entry to correct section...');
        
        if (editData.isUT) {
          updateUT({ utName: state.name, updatedUT: updatedState }, {
            onSuccess: async () => {
              await refetchDirectory();
              toast.success(`Successfully moved "${editData.stateName}" from State to Union Territory!`);
              setIsEditing(false);
              setPhotoFile(null);
              setPhotoPreview('');
            },
            onError: (error) => {
              console.error('Error moving to UT:', error);
              toast.error('Failed to move to Union Territory.');
            }
          });
        } else {
          updateState({ stateName: state.name, updatedState }, {
            onSuccess: async () => {
              await refetchDirectory();
              toast.success(`Successfully moved "${editData.stateName}" from Union Territory to State!`);
              setIsEditing(false);
              setPhotoFile(null);
              setPhotoPreview('');
            },
            onError: (error) => {
              console.error('Error moving to State:', error);
              toast.error('Failed to move to State.');
            }
          });
        }
      } else {
        if (state.isUnionTerritory) {
          updateUT({ utName: state.name, updatedUT: updatedState }, {
            onSuccess: () => {
              toast.success('Union Territory updated successfully!');
              setIsEditing(false);
              setPhotoFile(null);
              setPhotoPreview('');
            },
            onError: (error) => {
              console.error('Error updating UT:', error);
              toast.error('Failed to update union territory.');
            }
          });
        } else {
          updateState({ stateName: state.name, updatedState }, {
            onSuccess: () => {
              toast.success('State updated successfully!');
              setIsEditing(false);
              setPhotoFile(null);
              setPhotoPreview('');
            },
            onError: (error) => {
              console.error('Error updating state:', error);
              toast.error('Failed to update state.');
            }
          });
        }
      }
    } catch (error) {
      console.error('Error saving state:', error);
      toast.error('Failed to save changes.');
    }
  };

  const showLokSabha = viewMode === 'lok-sabha' || viewMode === 'both';
  const showVidhanSabha = viewMode === 'vidhan-sabha' || viewMode === 'both';

  const lokSabhaConstituencies = state.constituencies.filter(c => c.mp);
  const vidhanSabhaConstituencies = state.constituencies.filter(c => c.mlas.length > 0);

  return (
    <>
      <tr className="border-b border-gray-200 bg-blue-50 hover:bg-blue-100">
        <td className="p-2 sm:p-3">
          {isEditing ? (
            <select
              value={editData.isUT ? 'UT' : 'State'}
              onChange={(e) => setEditData({ ...editData, isUT: e.target.value === 'UT' })}
              className="w-full px-2 py-1 border border-gray-300 rounded text-xs sm:text-sm font-semibold"
            >
              <option value="State">State</option>
              <option value="UT">UT</option>
            </select>
          ) : (
            <div className="flex items-center space-x-2">
              <button onClick={onToggle} className="p-1 hover:bg-blue-200 rounded">
                {isExpanded ? <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4" /> : <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />}
              </button>
              <span className="font-semibold text-xs sm:text-sm">{String(stateNumber).padStart(2, '0')}. {levelLabel}</span>
            </div>
          )}
        </td>
        <td className="p-2 sm:p-3">
          {isEditing ? (
            <input
              type="text"
              value={editData.stateName}
              onChange={(e) => setEditData({ ...editData, stateName: e.target.value })}
              className="w-full px-2 py-1 border border-gray-300 rounded text-xs sm:text-sm font-medium"
            />
          ) : (
            <div className="font-medium text-gray-900 text-xs sm:text-sm">{state.name}</div>
          )}
        </td>
        <td className="p-2 sm:p-3">
          {isEditing ? (
            <input
              type="text"
              value={editData.name}
              onChange={(e) => setEditData({ ...editData, name: e.target.value })}
              className="w-full px-2 py-1 border border-gray-300 rounded text-xs sm:text-sm"
            />
          ) : (
            <div className="text-xs sm:text-sm text-gray-900">{state.cm?.name || 'No CM/Administrator'}</div>
          )}
        </td>
        <td className="p-2 sm:p-3">
          {isEditing ? (
            <input
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
              className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
            />
          ) : (
            cmPhotoUrl && (
              <img 
                src={cmPhotoUrl} 
                alt={state.cm?.name} 
                className="h-8 w-8 sm:h-10 sm:w-10 rounded-full object-cover cursor-pointer hover:opacity-80 transition-opacity" 
                onClick={() => onPhotoClick(cmPhotoUrl)}
              />
            )
          )}
        </td>
        <td className="p-2 sm:p-3">
          {isEditing ? (
            <input
              type="email"
              value={editData.email}
              onChange={(e) => setEditData({ ...editData, email: e.target.value })}
              className="w-full px-2 py-1 border border-gray-300 rounded text-xs sm:text-sm"
            />
          ) : (
            <span className="text-xs sm:text-sm text-gray-700">{state.cm?.email || '-'}</span>
          )}
        </td>
        <td className="p-2 sm:p-3">
          {isEditing ? (
            <input
              type="text"
              value={editData.twitterHandle}
              onChange={(e) => setEditData({ ...editData, twitterHandle: e.target.value })}
              className="w-full px-2 py-1 border border-gray-300 rounded text-xs sm:text-sm"
            />
          ) : (
            <span className="text-xs sm:text-sm text-gray-700">{state.cm?.twitterHandle || '-'}</span>
          )}
        </td>
        <td className="p-2 sm:p-3">
          {isEditing ? (
            <input
              type="text"
              value={editData.politicalParty}
              onChange={(e) => setEditData({ ...editData, politicalParty: e.target.value })}
              className="w-full px-2 py-1 border border-gray-300 rounded text-xs sm:text-sm"
            />
          ) : (
            <span className="text-xs sm:text-sm text-gray-700">{state.cm?.politicalParty || '-'}</span>
          )}
        </td>
        <td className="p-2 sm:p-3">
          {isEditing ? (
            <textarea
              value={editData.remarks}
              onChange={(e) => setEditData({ ...editData, remarks: e.target.value })}
              className="w-full px-2 py-1 border border-gray-300 rounded text-xs sm:text-sm resize-none h-16"
            />
          ) : (
            <span className="text-xs sm:text-sm text-gray-700 max-w-xs truncate block">{state.cm?.remarks || '-'}</span>
          )}
        </td>
        <td className="p-2 sm:p-3 text-xs text-gray-600">
          {state.cm?.lastUpdated ? new Date(Number(state.cm.lastUpdated) / 1000000).toLocaleDateString() : '-'}
        </td>
        <td className="p-2 sm:p-3 text-center">
          {!isEditing ? (
            <button
              onClick={() => {
                setIsEditing(true);
                setEditData({
                  stateName: state.name,
                  name: state.cm?.name || '',
                  email: state.cm?.email || '',
                  twitterHandle: state.cm?.twitterHandle || '',
                  remarks: state.cm?.remarks || '',
                  politicalParty: state.cm?.politicalParty || '',
                  photoPath: state.cm?.photoPath || '',
                  isUT: state.isUnionTerritory,
                });
              }}
              className="p-1 text-blue-600 hover:bg-blue-100 rounded"
            >
              <Edit2 className="h-3 w-3 sm:h-4 sm:w-4" />
            </button>
          ) : (
            <div className="flex items-center justify-center space-x-1">
              <button onClick={handleSave} className="p-1 text-green-600 hover:bg-green-100 rounded">
                <Save className="h-3 w-3 sm:h-4 sm:w-4" />
              </button>
              <button
                onClick={() => {
                  setIsEditing(false);
                  setPhotoFile(null);
                  setPhotoPreview('');
                }}
                className="p-1 text-red-600 hover:bg-red-100 rounded"
              >
                <X className="h-3 w-3 sm:h-4 sm:w-4" />
              </button>
            </div>
          )}
        </td>
      </tr>

      {isExpanded && (
        <>
          {showLokSabha && lokSabhaConstituencies.map((constituency, constIndex) => (
            <ConstituencyTableRow
              key={`lok-${constituency.name}`}
              stateName={state.name}
              stateNumber={stateNumber}
              constituency={constituency}
              constituencyNumber={constIndex + 1}
              type="Lok Sabha"
              viewMode={viewMode}
              onDeleteConstituency={onDeleteConstituency}
              onDeleteRepresentative={onDeleteRepresentative}
              onPhotoClick={onPhotoClick}
            />
          ))}
          {showVidhanSabha && vidhanSabhaConstituencies.map((constituency, constIndex) => (
            <ConstituencyTableRow
              key={`vidhan-${constituency.name}`}
              stateName={state.name}
              stateNumber={stateNumber}
              constituency={constituency}
              constituencyNumber={constIndex + 1}
              type="Vidhan Sabha"
              viewMode={viewMode}
              onDeleteConstituency={onDeleteConstituency}
              onDeleteRepresentative={onDeleteRepresentative}
              onPhotoClick={onPhotoClick}
            />
          ))}
        </>
      )}
    </>
  );
}

// Constituency Table Row Component (keeping existing implementation - no changes needed)
function ConstituencyTableRow({
  stateName,
  stateNumber,
  constituency,
  constituencyNumber,
  type,
  viewMode,
  onDeleteConstituency,
  onDeleteRepresentative,
  onPhotoClick
}: {
  stateName: string;
  stateNumber: number;
  constituency: Constituency;
  constituencyNumber: number;
  type: 'Lok Sabha' | 'Vidhan Sabha';
  viewMode: ViewMode;
  onDeleteConstituency: any;
  onDeleteRepresentative: any;
  onPhotoClick: (url: string) => void;
}) {
  const representatives = type === 'Lok Sabha' ? (constituency.mp ? [constituency.mp] : []) : constituency.mlas;

  return (
    <>
      {representatives.map((rep, repIndex) => (
        <RepresentativeTableRow
          key={`${type}-${rep.name}-${repIndex}`}
          stateName={stateName}
          constituencyName={constituency.name}
          representative={rep}
          stateNumber={stateNumber}
          constituencyNumber={constituencyNumber}
          repNumber={repIndex + 1}
          type={type}
          onDeleteRepresentative={onDeleteRepresentative}
          onPhotoClick={onPhotoClick}
        />
      ))}
    </>
  );
}

// Representative Table Row Component (keeping existing implementation - no changes needed)
function RepresentativeTableRow({
  stateName,
  constituencyName,
  representative,
  stateNumber,
  constituencyNumber,
  repNumber,
  type,
  onDeleteRepresentative,
  onPhotoClick
}: {
  stateName: string;
  constituencyName: string;
  representative: Representative;
  stateNumber: number;
  constituencyNumber: number;
  repNumber: number;
  type: 'Lok Sabha' | 'Vidhan Sabha';
  onDeleteRepresentative: any;
  onPhotoClick: (url: string) => void;
}) {
  const { data: photoUrl } = useFileUrl(representative.photoPath);
  const [isEditing, setIsEditing] = useState(false);
  const { mutate: updateRepDetails } = useUpdateRepresentativeDetails();
  const { mutate: updateConstituency } = useUpdateConstituency();
  const { uploadFile } = useFileUpload();
  const { data: directory } = useGetDirectory();
  
  const [editData, setEditData] = useState({
    constituencyName: constituencyName,
    name: representative.name,
    email: representative.email,
    twitterHandle: representative.twitterHandle,
    remarks: representative.remarks,
    politicalParty: representative.politicalParty || '',
    photoPath: representative.photoPath,
  });
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>('');

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

  const handleSave = async () => {
    try {
      let photoPath = editData.photoPath;
      
      if (photoFile) {
        const path = `representatives/${Date.now()}_${photoFile.name}`;
        const result = await uploadFile(path, photoFile);
        photoPath = result.path;
      }

      const updatedRep: Representative = {
        name: editData.name,
        photoPath,
        email: editData.email,
        twitterHandle: editData.twitterHandle,
        remarks: editData.remarks,
        politicalParty: editData.politicalParty || undefined,
        lastUpdated: BigInt(Date.now() * 1000000),
      };

      if (editData.constituencyName !== constituencyName) {
        const allStates = [...(directory?.states || []), ...(directory?.unionTerritories || [])];
        const state = allStates.find(s => s.name === stateName);
        const oldConstituency = state?.constituencies.find(c => c.name === constituencyName);
        
        if (oldConstituency) {
          const updatedConstituency: Constituency = {
            name: editData.constituencyName,
            mp: type === 'Lok Sabha' ? updatedRep : oldConstituency.mp,
            mlas: type === 'Vidhan Sabha' ? [updatedRep] : oldConstituency.mlas,
          };

          updateConstituency({
            stateName,
            constituencyName,
            updatedConstituency
          }, {
            onSuccess: () => {
              toast.success(`${type === 'Lok Sabha' ? 'MP' : 'MLA'} and constituency updated successfully!`);
              setIsEditing(false);
              setPhotoFile(null);
              setPhotoPreview('');
            },
            onError: (error) => {
              console.error(`Error updating constituency:`, error);
              toast.error(`Failed to update ${type === 'Lok Sabha' ? 'MP' : 'MLA'} and constituency.`);
            }
          });
        }
      } else {
        updateRepDetails({
          stateName,
          constituencyName,
          repType: type === 'Lok Sabha' ? 'mp' : 'mla',
          repName: representative.name,
          updatedRep
        }, {
          onSuccess: () => {
            toast.success(`${type === 'Lok Sabha' ? 'MP' : 'MLA'} updated successfully!`);
            setIsEditing(false);
            setPhotoFile(null);
            setPhotoPreview('');
          },
          onError: (error) => {
            console.error(`Error updating representative:`, error);
            toast.error(`Failed to update ${type === 'Lok Sabha' ? 'MP' : 'MLA'}.`);
          }
        });
      }
    } catch (error) {
      console.error('Error saving representative:', error);
      toast.error('Failed to save changes.');
    }
  };

  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to delete ${type === 'Lok Sabha' ? 'MP' : 'MLA'} "${representative.name}"?`)) {
      onDeleteRepresentative(
        { 
          stateName, 
          constituencyName, 
          repType: type === 'Lok Sabha' ? 'mp' : 'mla'
        },
        {
          onSuccess: () => {
            toast.success(`${type === 'Lok Sabha' ? 'MP' : 'MLA'} "${representative.name}" deleted successfully!`);
          },
          onError: (error: any) => {
            console.error(`Error deleting representative:`, error);
            toast.error(`Failed to delete ${type === 'Lok Sabha' ? 'MP' : 'MLA'}. Please try again.`);
          }
        }
      );
    }
  };

  const bgColor = type === 'Lok Sabha' ? 'bg-green-50 hover:bg-green-100' : 'bg-yellow-50 hover:bg-yellow-100';

  return (
    <>
      <tr className={`border-b border-gray-200 ${bgColor}`}>
        <td className="p-2 sm:p-3">
          <div className="text-xs font-medium text-gray-700 pl-4 sm:pl-8">
            {String(constituencyNumber).padStart(2, '0')} {type}
          </div>
        </td>
        <td className="p-2 sm:p-3">
          {isEditing ? (
            <input
              type="text"
              value={editData.constituencyName}
              onChange={(e) => setEditData({ ...editData, constituencyName: e.target.value })}
              className="w-full px-2 py-1 border border-gray-300 rounded text-xs sm:text-sm"
            />
          ) : (
            <div className="text-xs sm:text-sm text-gray-900">{constituencyName}</div>
          )}
        </td>
        <td className="p-2 sm:p-3">
          {isEditing ? (
            <input
              type="text"
              value={editData.name}
              onChange={(e) => setEditData({ ...editData, name: e.target.value })}
              className="w-full px-2 py-1 border border-gray-300 rounded text-xs sm:text-sm"
            />
          ) : (
            <div className="font-medium text-gray-900 text-xs sm:text-sm">{representative.name}</div>
          )}
        </td>
        <td className="p-2 sm:p-3">
          {isEditing ? (
            <input
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
              className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
            />
          ) : (
            photoUrl && (
              <img 
                src={photoUrl} 
                alt={representative.name} 
                className="h-8 w-8 sm:h-10 sm:w-10 rounded-full object-cover cursor-pointer hover:opacity-80 transition-opacity" 
                onClick={() => onPhotoClick(photoUrl)}
              />
            )
          )}
        </td>
        <td className="p-2 sm:p-3">
          {isEditing ? (
            <input
              type="email"
              value={editData.email}
              onChange={(e) => setEditData({ ...editData, email: e.target.value })}
              className="w-full px-2 py-1 border border-gray-300 rounded text-xs sm:text-sm"
            />
          ) : (
            <span className="text-xs sm:text-sm text-gray-700">{representative.email || '-'}</span>
          )}
        </td>
        <td className="p-2 sm:p-3">
          {isEditing ? (
            <input
              type="text"
              value={editData.twitterHandle}
              onChange={(e) => setEditData({ ...editData, twitterHandle: e.target.value })}
              className="w-full px-2 py-1 border border-gray-300 rounded text-xs sm:text-sm"
            />
          ) : (
            <span className="text-xs sm:text-sm text-gray-700">{representative.twitterHandle || '-'}</span>
          )}
        </td>
        <td className="p-2 sm:p-3">
          {isEditing ? (
            <input
              type="text"
              value={editData.politicalParty}
              onChange={(e) => setEditData({ ...editData, politicalParty: e.target.value })}
              className="w-full px-2 py-1 border border-gray-300 rounded text-xs sm:text-sm"
            />
          ) : (
            <span className="text-xs sm:text-sm text-gray-700">{representative.politicalParty || '-'}</span>
          )}
        </td>
        <td className="p-2 sm:p-3">
          {isEditing ? (
            <textarea
              value={editData.remarks}
              onChange={(e) => setEditData({ ...editData, remarks: e.target.value })}
              className="w-full px-2 py-1 border border-gray-300 rounded text-xs sm:text-sm resize-none h-16"
            />
          ) : (
            <span className="text-xs sm:text-sm text-gray-700 max-w-xs truncate block">{representative.remarks || '-'}</span>
          )}
        </td>
        <td className="p-2 sm:p-3 text-xs text-gray-600">
          {representative.lastUpdated ? new Date(Number(representative.lastUpdated) / 1000000).toLocaleDateString() : '-'}
        </td>
        <td className="p-2 sm:p-3 text-center">
          {!isEditing ? (
            <div className="flex items-center justify-center space-x-1">
              <button
                onClick={() => {
                  setIsEditing(true);
                  setEditData({
                    constituencyName: constituencyName,
                    name: representative.name,
                    email: representative.email,
                    twitterHandle: representative.twitterHandle,
                    remarks: representative.remarks,
                    politicalParty: representative.politicalParty || '',
                    photoPath: representative.photoPath,
                  });
                }}
                className="p-1 text-blue-600 hover:bg-blue-100 rounded"
              >
                <Edit2 className="h-3 w-3 sm:h-4 sm:w-4" />
              </button>
              <button onClick={handleDelete} className="p-1 text-red-600 hover:bg-red-100 rounded">
                <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-center space-x-1">
              <button onClick={handleSave} className="p-1 text-green-600 hover:bg-green-100 rounded">
                <Save className="h-3 w-3 sm:h-4 sm:w-4" />
              </button>
              <button
                onClick={() => {
                  setIsEditing(false);
                  setPhotoFile(null);
                  setPhotoPreview('');
                }}
                className="p-1 text-red-600 hover:bg-red-100 rounded"
              >
                <X className="h-3 w-3 sm:h-4 sm:w-4" />
              </button>
            </div>
          )}
        </td>
      </tr>
    </>
  );
}
