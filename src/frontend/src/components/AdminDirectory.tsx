import React, { useState, useRef } from 'react';
import { Building2, MapPin, User, Mail, Twitter, FileText, Plus, Edit2, Trash2, ChevronDown, ChevronRight, Save, X, Upload, Download, Search, Filter, AlertCircle, Calendar, Crown, Image } from 'lucide-react';
import { useGetDirectory, useAddState, useAddUnionTerritory, useAddConstituency, useAddMpToConstituency, useAddMlaToConstituency, useUpdateRepresentative, useDeleteConstituency, useDeleteRepresentative, useUpdateState, useUpdateUnionTerritory, useUpdateConstituency, useUpdateRepresentativeDetails, useSetPrimeMinister, useImportDirectory, useExportDirectory } from '../hooks/useQueries';
import { useFileUpload } from '../blob-storage/FileStorage';
import { Representative, State, Constituency } from '../backend';
import { toast } from 'sonner';
import { RepresentativePhotoModal } from './RepresentativePhotoModal';

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
  const [selectedPhotoPath, setSelectedPhotoPath] = useState<string | null>(null);
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);

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

  const handlePhotoClick = (photoPath: string) => {
    setSelectedPhotoPath(photoPath);
    setIsPhotoModalOpen(true);
  };

  const handleClosePhotoModal = () => {
    setIsPhotoModalOpen(false);
    setSelectedPhotoPath(null);
  };

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
        remarks: remarks || '',
        politicalParty: politicalParty || undefined,
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
        const [stateName, constituencyName] = unitName.split(' - ');
        const isUT = utsMap.has(stateName);
        const stateMap = isUT ? utsMap : statesMap;
        
        if (!stateMap.has(stateName)) {
          stateMap.set(stateName, {
            name: stateName,
            cm: null,
            constituencies: [],
            isUnionTerritory: isUT
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
    const matchesSearch = searchQuery === '' || 
      state.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      state.cm?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      state.constituencies.some(c => 
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.mp?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.mlas.some(m => m.name.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    
    const matchesFilter = selectedStateFilter === 'all' || state.name === selectedStateFilter;
    
    return matchesSearch && matchesFilter;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Administrative Directory</h1>
        <p className="text-muted-foreground">Manage Prime Minister, States, Union Territories, and their representatives</p>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3 mb-6">
        <button
          onClick={() => setActiveForm('prime-minister')}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
        >
          <Crown className="w-4 h-4" />
          <span className="hidden sm:inline">Set Prime Minister</span>
          <span className="sm:hidden">PM</span>
        </button>
        <button
          onClick={() => setActiveForm('state')}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
        >
          <Building2 className="w-4 h-4" />
          <span className="hidden sm:inline">Add State/UT</span>
          <span className="sm:hidden">State</span>
        </button>
        <button
          onClick={() => setActiveForm('lok-sabha')}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
        >
          <User className="w-4 h-4" />
          <span className="hidden sm:inline">Add MP</span>
          <span className="sm:hidden">MP</span>
        </button>
        <button
          onClick={() => setActiveForm('vidhan-sabha')}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
        >
          <User className="w-4 h-4" />
          <span className="hidden sm:inline">Add MLA</span>
          <span className="sm:hidden">MLA</span>
        </button>
        <button
          onClick={handleExport}
          disabled={isExporting}
          className="flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/90 transition-colors disabled:opacity-50"
        >
          <Download className="w-4 h-4" />
          <span className="hidden sm:inline">Export CSV</span>
          <span className="sm:hidden">Export</span>
        </button>
        <button
          onClick={handleImport}
          disabled={isImporting}
          className="flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/90 transition-colors disabled:opacity-50"
        >
          <Upload className="w-4 h-4" />
          <span className="hidden sm:inline">Import CSV</span>
          <span className="sm:hidden">Import</span>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      {/* Form Modal */}
      {activeForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">
                  {activeForm === 'prime-minister' && 'Set Prime Minister'}
                  {activeForm === 'state' && 'Add State/Union Territory'}
                  {activeForm === 'lok-sabha' && 'Add Member of Parliament (MP)'}
                  {activeForm === 'vidhan-sabha' && 'Add Member of Legislative Assembly (MLA)'}
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
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
                        placeholder="e.g., Maharashtra, Delhi"
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
                      <label htmlFor="isUT" className="text-sm font-medium">
                        This is a Union Territory
                      </label>
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
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
                        required
                      >
                        <option value="">-- Select State/UT --</option>
                        {allStates.map(state => (
                          <option key={state.name} value={state.name}>
                            {state.name} {state.isUnionTerritory ? '(UT)' : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Constituency Name *</label>
                      <input
                        type="text"
                        value={formData.constituencyName}
                        onChange={(e) => setFormData({ ...formData, constituencyName: e.target.value })}
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
                        placeholder={activeForm === 'lok-sabha' ? 'e.g., Mumbai North' : 'e.g., Andheri West'}
                        required
                      />
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-sm font-medium mb-2">Representative Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
                    placeholder="Full name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Photo *</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
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
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
                    placeholder="email@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Twitter Handle</label>
                  <input
                    type="text"
                    value={formData.twitterHandle}
                    onChange={(e) => setFormData({ ...formData, twitterHandle: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
                    placeholder="@username"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Political Party</label>
                  <input
                    type="text"
                    value={formData.politicalParty}
                    onChange={(e) => setFormData({ ...formData, politicalParty: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
                    placeholder="e.g., BJP, INC, AAP"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Remarks</label>
                  <textarea
                    value={formData.remarks}
                    onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
                    rows={3}
                    placeholder="Additional information, areas covered, etc."
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={isSubmitting || isUploading}
                    className="flex-1 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 font-medium"
                  >
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
                    className="px-6 py-3 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/90 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, state, or constituency..."
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={selectedStateFilter}
            onChange={(e) => setSelectedStateFilter(e.target.value)}
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
          >
            <option value="all">All States/UTs</option>
            {allStates.map(state => (
              <option key={state.name} value={state.name}>
                {state.name}
              </option>
            ))}
          </select>
          <select
            value={viewMode}
            onChange={(e) => setViewMode(e.target.value as ViewMode)}
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
          >
            <option value="both">Both MP & MLA</option>
            <option value="lok-sabha">Lok Sabha (MP)</option>
            <option value="vidhan-sabha">Vidhan Sabha (MLA)</option>
          </select>
        </div>
      </div>

      {/* Prime Minister Section */}
      {directory?.primeMinister && (
        <div className="mb-8 p-6 bg-card rounded-lg border shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Crown className="w-6 h-6 text-primary" />
            <h2 className="text-2xl font-bold">Prime Minister of India</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Name</p>
              <p className="font-medium">{directory.primeMinister.name}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Photo</p>
              <button
                onClick={() => handlePhotoClick(directory.primeMinister!.photoPath)}
                className="font-mono text-sm text-primary hover:underline cursor-pointer text-left break-all"
                title="Click to view full image"
              >
                {directory.primeMinister.photoPath}
              </button>
            </div>
            {directory.primeMinister.email && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">Email</p>
                <p className="font-medium">{directory.primeMinister.email}</p>
              </div>
            )}
            {directory.primeMinister.twitterHandle && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">Twitter</p>
                <p className="font-medium">{directory.primeMinister.twitterHandle}</p>
              </div>
            )}
            {directory.primeMinister.politicalParty && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">Political Party</p>
                <p className="font-medium">{directory.primeMinister.politicalParty}</p>
              </div>
            )}
            {directory.primeMinister.remarks && (
              <div className="md:col-span-2">
                <p className="text-sm text-muted-foreground mb-1">Remarks</p>
                <p className="font-medium">{directory.primeMinister.remarks}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* States/UTs List */}
      <div className="space-y-4">
        {filteredStates.map(state => (
          <div key={state.name} className="bg-card rounded-lg border shadow-sm overflow-hidden">
            <div
              className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => toggleState(state.name)}
            >
              <div className="flex items-center gap-3">
                {expandedStates.has(state.name) ? (
                  <ChevronDown className="w-5 h-5 text-muted-foreground" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                )}
                <Building2 className="w-5 h-5 text-primary" />
                <div>
                  <h3 className="font-bold text-lg">{state.name}</h3>
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
              <div className="p-4 border-t bg-muted/20">
                {/* CM/Administrator Info */}
                {state.cm && (
                  <div className="mb-6 p-4 bg-background rounded-lg border">
                    <h4 className="font-semibold mb-3">
                      {state.isUnionTerritory ? 'Administrator' : 'Chief Minister'}
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-muted-foreground">Name:</span>
                        <span className="ml-2 font-medium">{state.cm.name}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Photo:</span>
                        <button
                          onClick={() => handlePhotoClick(state.cm!.photoPath)}
                          className="ml-2 font-mono text-xs text-primary hover:underline cursor-pointer break-all"
                          title="Click to view full image"
                        >
                          {state.cm.photoPath}
                        </button>
                      </div>
                      {state.cm.email && (
                        <div>
                          <span className="text-muted-foreground">Email:</span>
                          <span className="ml-2 font-medium">{state.cm.email}</span>
                        </div>
                      )}
                      {state.cm.twitterHandle && (
                        <div>
                          <span className="text-muted-foreground">Twitter:</span>
                          <span className="ml-2 font-medium">{state.cm.twitterHandle}</span>
                        </div>
                      )}
                      {state.cm.politicalParty && (
                        <div>
                          <span className="text-muted-foreground">Party:</span>
                          <span className="ml-2 font-medium">{state.cm.politicalParty}</span>
                        </div>
                      )}
                      {state.cm.remarks && (
                        <div className="md:col-span-2">
                          <span className="text-muted-foreground">Remarks:</span>
                          <span className="ml-2 font-medium">{state.cm.remarks}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Constituencies */}
                <div className="space-y-3">
                  {state.constituencies.map(constituency => {
                    const key = `${state.name}-${constituency.name}`;
                    const showMP = viewMode === 'both' || viewMode === 'lok-sabha';
                    const showMLA = viewMode === 'both' || viewMode === 'vidhan-sabha';
                    
                    return (
                      <div key={key} className="bg-background rounded-lg border">
                        <div
                          className="flex items-center justify-between p-3 cursor-pointer hover:bg-muted/50 transition-colors"
                          onClick={() => toggleConstituency(key)}
                        >
                          <div className="flex items-center gap-2">
                            {expandedConstituencies.has(key) ? (
                              <ChevronDown className="w-4 h-4 text-muted-foreground" />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-muted-foreground" />
                            )}
                            <MapPin className="w-4 h-4 text-primary" />
                            <span className="font-medium">{constituency.name}</span>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {constituency.mp && showMP && 'MP'}
                            {constituency.mp && constituency.mlas.length > 0 && showMP && showMLA && ' • '}
                            {constituency.mlas.length > 0 && showMLA && `${constituency.mlas.length} MLA${constituency.mlas.length > 1 ? 's' : ''}`}
                          </div>
                        </div>

                        {expandedConstituencies.has(key) && (
                          <div className="p-3 border-t space-y-4">
                            {/* MP Section */}
                            {constituency.mp && showMP && (
                              <div className="p-3 bg-muted/30 rounded-lg">
                                <h5 className="font-semibold mb-2 text-sm">Member of Parliament (MP)</h5>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                                  <div>
                                    <span className="text-muted-foreground">Name:</span>
                                    <span className="ml-2 font-medium">{constituency.mp.name}</span>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">Photo:</span>
                                    <button
                                      onClick={() => handlePhotoClick(constituency.mp!.photoPath)}
                                      className="ml-2 font-mono text-xs text-primary hover:underline cursor-pointer break-all"
                                      title="Click to view full image"
                                    >
                                      {constituency.mp.photoPath}
                                    </button>
                                  </div>
                                  {constituency.mp.email && (
                                    <div>
                                      <span className="text-muted-foreground">Email:</span>
                                      <span className="ml-2 font-medium">{constituency.mp.email}</span>
                                    </div>
                                  )}
                                  {constituency.mp.twitterHandle && (
                                    <div>
                                      <span className="text-muted-foreground">Twitter:</span>
                                      <span className="ml-2 font-medium">{constituency.mp.twitterHandle}</span>
                                    </div>
                                  )}
                                  {constituency.mp.politicalParty && (
                                    <div>
                                      <span className="text-muted-foreground">Party:</span>
                                      <span className="ml-2 font-medium">{constituency.mp.politicalParty}</span>
                                    </div>
                                  )}
                                  {constituency.mp.remarks && (
                                    <div className="md:col-span-2">
                                      <span className="text-muted-foreground">Remarks:</span>
                                      <span className="ml-2 font-medium">{constituency.mp.remarks}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* MLAs Section */}
                            {constituency.mlas.length > 0 && showMLA && (
                              <div className="space-y-2">
                                <h5 className="font-semibold text-sm">Members of Legislative Assembly (MLAs)</h5>
                                {constituency.mlas.map((mla, idx) => (
                                  <div key={idx} className="p-3 bg-muted/30 rounded-lg">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                                      <div>
                                        <span className="text-muted-foreground">Name:</span>
                                        <span className="ml-2 font-medium">{mla.name}</span>
                                      </div>
                                      <div>
                                        <span className="text-muted-foreground">Photo:</span>
                                        <button
                                          onClick={() => handlePhotoClick(mla.photoPath)}
                                          className="ml-2 font-mono text-xs text-primary hover:underline cursor-pointer break-all"
                                          title="Click to view full image"
                                        >
                                          {mla.photoPath}
                                        </button>
                                      </div>
                                      {mla.email && (
                                        <div>
                                          <span className="text-muted-foreground">Email:</span>
                                          <span className="ml-2 font-medium">{mla.email}</span>
                                        </div>
                                      )}
                                      {mla.twitterHandle && (
                                        <div>
                                          <span className="text-muted-foreground">Twitter:</span>
                                          <span className="ml-2 font-medium">{mla.twitterHandle}</span>
                                        </div>
                                      )}
                                      {mla.politicalParty && (
                                        <div>
                                          <span className="text-muted-foreground">Party:</span>
                                          <span className="ml-2 font-medium">{mla.politicalParty}</span>
                                        </div>
                                      )}
                                      {mla.remarks && (
                                        <div className="md:col-span-2">
                                          <span className="text-muted-foreground">Remarks:</span>
                                          <span className="ml-2 font-medium">{mla.remarks}</span>
                                        </div>
                                      )}
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
              </div>
            )}
          </div>
        ))}
      </div>

      {filteredStates.length === 0 && (
        <div className="text-center py-12">
          <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No states or representatives found matching your search.</p>
        </div>
      )}

      {/* Photo Modal */}
      <RepresentativePhotoModal
        photoPath={selectedPhotoPath}
        isOpen={isPhotoModalOpen}
        onClose={handleClosePhotoModal}
      />
    </div>
  );
}
