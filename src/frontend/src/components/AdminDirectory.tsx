import React, { useState, useRef } from 'react';
import { Building2, MapPin, User, Mail, Twitter, FileText, Plus, Edit2, Trash2, ChevronDown, ChevronRight, Save, X, Upload, Download, Search, Filter, AlertCircle, Calendar, Crown } from 'lucide-react';
import { useGetDirectory, useAddState, useAddUnionTerritory, useAddConstituency, useAddMpToConstituency, useAddMlaToConstituency, useUpdateRepresentative, useDeleteConstituency, useDeleteRepresentative, useUpdateState, useUpdateUnionTerritory, useUpdateConstituency, useUpdateRepresentativeDetails, useSetPrimeMinister, useImportDirectory, useExportDirectory } from '../hooks/useQueries';
import { useFileUpload } from '../blob-storage/FileStorage';
import { Representative, State, Constituency } from '../backend';
import { toast } from 'sonner';
import { PhotoPreviewModal } from './PhotoPreviewModal';

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
  const [photoModalPath, setPhotoModalPath] = useState<string | null>(null);

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
      primeMinister: null
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
        lastUpdated: BigInt(new Date(lastUpdated).getTime() * 1000000)
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
        const [stateName, constituencyName] = unitName.split(' - ').map(s => s.trim());
        
        const stateMap = statesMap.has(stateName) ? statesMap : utsMap;
        if (!stateMap.has(stateName)) {
          stateMap.set(stateName, {
            name: stateName,
            cm: null,
            constituencies: [],
            isUnionTerritory: stateMap === utsMap
          });
        }
        
        const state = stateMap.get(stateName);
        let constituency = state.constituencies.find((c: any) => c.name === constituencyName);
        
        if (!constituency) {
          constituency = {
            name: constituencyName,
            mp: null,
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

  const toggleConstituency = (key: string) => {
    const newExpanded = new Set(expandedConstituencies);
    if (newExpanded.has(key)) {
      newExpanded.delete(key);
    } else {
      newExpanded.add(key);
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
      const mlaMatch = c.mlas.some(m => m.name.toLowerCase().includes(query));
      return cNameMatch || mpMatch || mlaMatch;
    });
    
    return stateMatch || cmMatch || constituencyMatch;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Administrative Directory</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Manage Prime Minister, State/UT, Lok Sabha (MP), and Vidhan Sabha (MLA) information
          </p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveForm('prime-minister')}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2 text-sm"
          >
            <Crown className="w-4 h-4" />
            Set PM
          </button>
          <button
            onClick={() => setActiveForm('state')}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2 text-sm"
          >
            <Plus className="w-4 h-4" />
            Add State/UT
          </button>
          <button
            onClick={() => setActiveForm('lok-sabha')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 text-sm"
          >
            <Plus className="w-4 h-4" />
            Add MP
          </button>
          <button
            onClick={() => setActiveForm('vidhan-sabha')}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 text-sm"
          >
            <Plus className="w-4 h-4" />
            Add MLA
          </button>
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2 text-sm disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            {isExporting ? 'Exporting...' : 'Export CSV'}
          </button>
          <button
            onClick={handleImport}
            disabled={isImporting}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2 text-sm disabled:opacity-50"
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

      {activeForm && (
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">
              {activeForm === 'prime-minister' && 'Set Prime Minister'}
              {activeForm === 'state' && 'Add State/Union Territory'}
              {activeForm === 'lok-sabha' && 'Add Lok Sabha Member (MP)'}
              {activeForm === 'vidhan-sabha' && 'Add Vidhan Sabha Member (MLA)'}
            </h3>
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
              className="p-2 hover:bg-muted rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {activeForm === 'state' && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-2">State/UT Name *</label>
                  <input
                    type="text"
                    value={formData.stateName}
                    onChange={(e) => setFormData({ ...formData, stateName: e.target.value })}
                    className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Enter state or union territory name"
                    required
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isUT"
                    checked={formData.isUT}
                    onChange={(e) => setFormData({ ...formData, isUT: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <label htmlFor="isUT" className="text-sm">This is a Union Territory</label>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    {formData.isUT ? 'Administrator Name *' : 'Chief Minister Name *'}
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder={formData.isUT ? "Enter administrator's name" : "Enter chief minister's name"}
                    required
                  />
                </div>
              </>
            )}

            {(activeForm === 'lok-sabha' || activeForm === 'vidhan-sabha') && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-2">Select State/UT *</label>
                  <select
                    value={formData.stateName}
                    onChange={(e) => setFormData({ ...formData, stateName: e.target.value })}
                    className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  >
                    <option value="">-- Select State/UT --</option>
                    {allStates.map(state => (
                      <option key={state.name} value={state.name}>{state.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Constituency Name *</label>
                  <input
                    type="text"
                    value={formData.constituencyName}
                    onChange={(e) => setFormData({ ...formData, constituencyName: e.target.value })}
                    className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Enter constituency name"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    {activeForm === 'lok-sabha' ? 'MP Name *' : 'MLA Name *'}
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder={activeForm === 'lok-sabha' ? "Enter MP's name" : "Enter MLA's name"}
                    required
                  />
                </div>
              </>
            )}

            {activeForm === 'prime-minister' && (
              <div>
                <label className="block text-sm font-medium mb-2">Prime Minister Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Enter Prime Minister's name"
                  required
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-2">Photo *</label>
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
              {photoPreview && (
                <img src={photoPreview} alt="Preview" className="mt-2 w-32 h-32 object-cover rounded-lg" />
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Enter email address"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Twitter Handle</label>
              <input
                type="text"
                value={formData.twitterHandle}
                onChange={(e) => setFormData({ ...formData, twitterHandle: e.target.value })}
                className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="@username"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Political Party</label>
              <input
                type="text"
                value={formData.politicalParty}
                onChange={(e) => setFormData({ ...formData, politicalParty: e.target.value })}
                className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Enter political party"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Remarks</label>
              <textarea
                value={formData.remarks}
                onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Additional information"
                rows={3}
              />
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={isSubmitting || isUploading}
                className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                {isSubmitting ? 'Saving...' : 'Save'}
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
                className="px-6 py-2 bg-muted text-foreground rounded-lg hover:bg-muted/80 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, state, or constituency..."
                className="w-full pl-10 pr-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
          
          <div className="flex gap-2">
            <select
              value={selectedStateFilter}
              onChange={(e) => setSelectedStateFilter(e.target.value)}
              className="px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="all">All States/UTs</option>
              {allStates.map(state => (
                <option key={state.name} value={state.name}>{state.name}</option>
              ))}
            </select>
            
            <select
              value={viewMode}
              onChange={(e) => setViewMode(e.target.value as ViewMode)}
              className="px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="both">Both MP & MLA</option>
              <option value="lok-sabha">Lok Sabha (MP) Only</option>
              <option value="vidhan-sabha">Vidhan Sabha (MLA) Only</option>
            </select>
          </div>
        </div>

        {directory?.primeMinister && (
          <div className="mb-6 p-4 bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 rounded-lg">
            <div className="flex items-center gap-2 mb-3">
              <Crown className="w-5 h-5 text-purple-600" />
              <h3 className="font-semibold text-purple-900 dark:text-purple-100">Prime Minister of India</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-purple-200 dark:border-purple-800">
                    <th className="text-left py-2 px-2">Name</th>
                    <th className="text-left py-2 px-2">Photo</th>
                    <th className="text-left py-2 px-2">Email</th>
                    <th className="text-left py-2 px-2">Twitter</th>
                    <th className="text-left py-2 px-2">Party</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="py-2 px-2">{directory.primeMinister.name}</td>
                    <td className="py-2 px-2">
                      <button
                        onClick={() => setPhotoModalPath(directory.primeMinister?.photoPath || null)}
                        className="text-blue-600 hover:text-blue-800 hover:underline text-left"
                      >
                        {directory.primeMinister.photoPath || 'No photo'}
                      </button>
                    </td>
                    <td className="py-2 px-2">{directory.primeMinister.email || '-'}</td>
                    <td className="py-2 px-2">{directory.primeMinister.twitterHandle || '-'}</td>
                    <td className="py-2 px-2">{directory.primeMinister.politicalParty || '-'}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {filteredStates.map(state => (
            <div key={state.name} className="border border-border rounded-lg overflow-hidden">
              <div
                className="flex items-center justify-between p-4 bg-muted cursor-pointer hover:bg-muted/80 transition-colors"
                onClick={() => toggleState(state.name)}
              >
                <div className="flex items-center gap-3">
                  {expandedStates.has(state.name) ? (
                    <ChevronDown className="w-5 h-5" />
                  ) : (
                    <ChevronRight className="w-5 h-5" />
                  )}
                  <Building2 className="w-5 h-5 text-primary" />
                  <div>
                    <h3 className="font-semibold">{state.name}</h3>
                    {state.cm && (
                      <p className="text-sm text-muted-foreground">
                        {state.isUnionTerritory ? 'Administrator' : 'Chief Minister'}: {state.cm.name}
                      </p>
                    )}
                  </div>
                </div>
                <div className="text-sm text-muted-foreground">
                  {state.constituencies.length} constituencies
                </div>
              </div>

              {expandedStates.has(state.name) && (
                <div className="p-4 space-y-4">
                  {state.cm && (
                    <div className="mb-4">
                      <h4 className="font-medium mb-2 text-sm">
                        {state.isUnionTerritory ? 'Administrator' : 'Chief Minister'}
                      </h4>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-border">
                              <th className="text-left py-2 px-2">Name</th>
                              <th className="text-left py-2 px-2">Photo</th>
                              <th className="text-left py-2 px-2">Email</th>
                              <th className="text-left py-2 px-2">Twitter</th>
                              <th className="text-left py-2 px-2">Party</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td className="py-2 px-2">{state.cm.name}</td>
                              <td className="py-2 px-2">
                                <button
                                  onClick={() => setPhotoModalPath(state.cm?.photoPath || null)}
                                  className="text-blue-600 hover:text-blue-800 hover:underline text-left"
                                >
                                  {state.cm.photoPath || 'No photo'}
                                </button>
                              </td>
                              <td className="py-2 px-2">{state.cm.email || '-'}</td>
                              <td className="py-2 px-2">{state.cm.twitterHandle || '-'}</td>
                              <td className="py-2 px-2">{state.cm.politicalParty || '-'}</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {state.constituencies.map(constituency => {
                    const constituencyKey = `${state.name}-${constituency.name}`;
                    const showMP = viewMode === 'both' || viewMode === 'lok-sabha';
                    const showMLA = viewMode === 'both' || viewMode === 'vidhan-sabha';
                    
                    return (
                      <div key={constituencyKey} className="border border-border rounded-lg overflow-hidden">
                        <div
                          className="flex items-center justify-between p-3 bg-muted/50 cursor-pointer hover:bg-muted/70 transition-colors"
                          onClick={() => toggleConstituency(constituencyKey)}
                        >
                          <div className="flex items-center gap-2">
                            {expandedConstituencies.has(constituencyKey) ? (
                              <ChevronDown className="w-4 h-4" />
                            ) : (
                              <ChevronRight className="w-4 h-4" />
                            )}
                            <MapPin className="w-4 h-4 text-blue-600" />
                            <span className="font-medium text-sm">{constituency.name}</span>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {constituency.mp ? '1 MP' : 'No MP'} • {constituency.mlas.length} MLA(s)
                          </div>
                        </div>

                        {expandedConstituencies.has(constituencyKey) && (
                          <div className="p-3 space-y-3">
                            {showMP && constituency.mp && (
                              <div>
                                <h5 className="font-medium mb-2 text-xs text-blue-600">Lok Sabha (MP)</h5>
                                <div className="overflow-x-auto">
                                  <table className="w-full text-xs">
                                    <thead>
                                      <tr className="border-b border-border">
                                        <th className="text-left py-2 px-2">Name</th>
                                        <th className="text-left py-2 px-2">Photo</th>
                                        <th className="text-left py-2 px-2">Email</th>
                                        <th className="text-left py-2 px-2">Twitter</th>
                                        <th className="text-left py-2 px-2">Party</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      <tr>
                                        <td className="py-2 px-2">{constituency.mp.name}</td>
                                        <td className="py-2 px-2">
                                          <button
                                            onClick={() => setPhotoModalPath(constituency.mp?.photoPath || null)}
                                            className="text-blue-600 hover:text-blue-800 hover:underline text-left"
                                          >
                                            {constituency.mp.photoPath || 'No photo'}
                                          </button>
                                        </td>
                                        <td className="py-2 px-2">{constituency.mp.email || '-'}</td>
                                        <td className="py-2 px-2">{constituency.mp.twitterHandle || '-'}</td>
                                        <td className="py-2 px-2">{constituency.mp.politicalParty || '-'}</td>
                                      </tr>
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            )}

                            {showMLA && constituency.mlas.length > 0 && (
                              <div>
                                <h5 className="font-medium mb-2 text-xs text-green-600">Vidhan Sabha (MLA)</h5>
                                <div className="overflow-x-auto">
                                  <table className="w-full text-xs">
                                    <thead>
                                      <tr className="border-b border-border">
                                        <th className="text-left py-2 px-2">Name</th>
                                        <th className="text-left py-2 px-2">Photo</th>
                                        <th className="text-left py-2 px-2">Email</th>
                                        <th className="text-left py-2 px-2">Twitter</th>
                                        <th className="text-left py-2 px-2">Party</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {constituency.mlas.map((mla, idx) => (
                                        <tr key={idx}>
                                          <td className="py-2 px-2">{mla.name}</td>
                                          <td className="py-2 px-2">
                                            <button
                                              onClick={() => setPhotoModalPath(mla.photoPath || null)}
                                              className="text-blue-600 hover:text-blue-800 hover:underline text-left"
                                            >
                                              {mla.photoPath || 'No photo'}
                                            </button>
                                          </td>
                                          <td className="py-2 px-2">{mla.email || '-'}</td>
                                          <td className="py-2 px-2">{mla.twitterHandle || '-'}</td>
                                          <td className="py-2 px-2">{mla.politicalParty || '-'}</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
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

        {filteredStates.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No results found. Try adjusting your search or filters.</p>
          </div>
        )}
      </div>

      <PhotoPreviewModal
        photoPath={photoModalPath}
        onClose={() => setPhotoModalPath(null)}
      />
    </div>
  );
}
