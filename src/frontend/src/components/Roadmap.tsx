import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { useInternetIdentity } from "@caffeineai/core-infrastructure";
import { Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  Calendar,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Clock,
  Edit,
  Eye,
  EyeOff,
  Filter,
  GripVertical,
  Home,
  Lightbulb,
  Loader2,
  Plus,
  Rocket,
  Save,
  Search,
  Settings,
  Target,
  Trash2,
  X,
} from "lucide-react";
import React, { useState, useRef, useEffect } from "react";
import type { RoadmapFeature } from "../backend";
import { useLanguage } from "../contexts/LanguageContext";
import {
  useCreateFeature,
  useDeleteFeature,
  useGetRoadmapFeatures,
  useIsAdmin,
  useMoveFeature,
  useUpdateFeature,
} from "../hooks/useQueries";

interface FeatureCardProps {
  feature: RoadmapFeature;
  isAdmin: boolean;
  onEdit: (feature: RoadmapFeature) => void;
  onDelete: (featureId: string) => void;
  isDragging?: boolean;
  dragHandleProps?: any;
}

interface EditingFeature {
  id: string;
  icon: string;
  title: string;
  description: string;
  progress: number;
  sectionId: string;
}

interface DraggedFeature {
  feature: RoadmapFeature;
  sourceSection: string;
}

const predefinedIcons = [
  "🚀",
  "💡",
  "🎯",
  "⚡",
  "🔧",
  "📱",
  "🌟",
  "🎨",
  "📊",
  "🔒",
  "🌐",
  "📈",
  "🎉",
  "🔥",
  "💎",
  "🎪",
  "🎭",
  "🎨",
  "🎯",
  "🎲",
  "📝",
  "📋",
  "📌",
  "📍",
  "📎",
  "📊",
  "📈",
  "📉",
  "📇",
  "📆",
  "⭐",
  "✨",
  "🌈",
  "🎊",
  "🎁",
  "🏆",
  "🥇",
  "🏅",
  "🎖️",
  "🏵️",
];

const sectionConfig = {
  implemented: {
    title: "Implemented Features",
    icon: <CheckCircle className="h-6 w-6" />,
    color: "green",
    bgColor: "bg-green-50",
    borderColor: "border-green-200",
    textColor: "text-green-800",
    cardTheme: "roadmap-card-implemented",
  },
  under_consideration: {
    title: "Under Consideration",
    icon: <Clock className="h-6 w-6" />,
    color: "blue",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
    textColor: "text-blue-800",
    cardTheme: "roadmap-card-under-consideration",
  },
  upcoming: {
    title: "Upcoming/Planned Features",
    icon: <Calendar className="h-6 w-6" />,
    color: "orange",
    bgColor: "bg-orange-50",
    borderColor: "border-orange-200",
    textColor: "text-orange-800",
    cardTheme: "roadmap-card-upcoming",
  },
};

function FeatureCard({
  feature,
  isAdmin,
  onEdit,
  onDelete,
  isDragging,
  dragHandleProps,
}: FeatureCardProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const sectionInfo =
    sectionConfig[feature.sectionId as keyof typeof sectionConfig];

  const getProgressColor = (progress: number) => {
    if (progress === 100) return "bg-green-500";
    if (progress >= 75) return "bg-blue-500";
    if (progress >= 50) return "bg-yellow-500";
    if (progress >= 25) return "bg-orange-500";
    return "bg-red-500";
  };

  const getProgressStatus = (progress: number) => {
    if (progress === 100) return "Completed";
    if (progress >= 75) return "Nearly Done";
    if (progress >= 50) return "In Progress";
    if (progress >= 25) return "Started";
    return "Planning";
  };

  return (
    <>
      <Card
        className={`roadmap-feature-card ${sectionInfo?.cardTheme} ${isDragging ? "roadmap-card-dragging" : ""} transition-all duration-300 hover:shadow-lg group`}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3 flex-1">
              {isAdmin && (
                <div
                  {...dragHandleProps}
                  className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 transition-colors p-1"
                  title="Drag to move between sections"
                >
                  <GripVertical className="h-4 w-4" />
                </div>
              )}
              <div className="text-3xl">{feature.icon}</div>
              <div className="flex-1 min-w-0">
                <CardTitle className="text-lg font-semibold text-gray-900 leading-tight">
                  {feature.title}
                </CardTitle>
              </div>
            </div>
            {isAdmin && (
              <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEdit(feature)}
                  className="h-8 w-8 p-0 hover:bg-blue-100"
                >
                  <Edit className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="h-8 w-8 p-0 hover:bg-red-100"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="text-sm text-gray-600 mb-4 leading-relaxed">
            {feature.description}
          </p>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-gray-700">Progress</span>
              <span className="font-semibold text-gray-900">
                {Number(feature.progress)}%
              </span>
            </div>
            <Progress value={Number(feature.progress)} className="h-2" />
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>{getProgressStatus(Number(feature.progress))}</span>
              <div
                className={`w-2 h-2 rounded-full ${getProgressColor(Number(feature.progress))}`}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="bg-red-100 p-2 rounded-full">
                <Trash2 className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">
                Delete Feature
              </h3>
            </div>

            <div className="mb-6">
              <p className="text-gray-600 mb-4">
                Are you sure you want to permanently delete this feature? This
                action cannot be undone.
              </p>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <div className="flex items-start space-x-2">
                  <div className="text-2xl">{feature.icon}</div>
                  <div className="text-sm text-yellow-800">
                    <p className="font-medium">{feature.title}</p>
                    <p className="text-xs mt-1">{feature.description}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex space-x-3">
              <Button
                onClick={() => {
                  onDelete(feature.id);
                  setShowDeleteConfirm(false);
                }}
                variant="destructive"
                className="flex-1"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Feature
              </Button>
              <Button
                onClick={() => setShowDeleteConfirm(false)}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export function Roadmap() {
  const { t: _t } = useLanguage();
  const { identity: _identity } = useInternetIdentity();
  const { data: isAdmin } = useIsAdmin();
  const { data: features, isLoading, error, refetch } = useGetRoadmapFeatures();
  const { mutate: createFeature, isPending: isCreating } = useCreateFeature();
  const { mutate: updateFeature, isPending: isUpdating } = useUpdateFeature();
  const { mutate: deleteFeature, isPending: isDeleting } = useDeleteFeature();
  const { mutate: moveFeature, isPending: isMoving } = useMoveFeature();

  // UI State
  const [searchTerm, setSearchTerm] = useState("");
  const [showCompleted, setShowCompleted] = useState(true);
  const [editingFeature, setEditingFeature] = useState<EditingFeature | null>(
    null,
  );
  const [showAddForm, setShowAddForm] = useState<string | null>(null);
  const [draggedFeature, setDraggedFeature] = useState<DraggedFeature | null>(
    null,
  );
  const [dragOverSection, setDragOverSection] = useState<string | null>(null);

  // Show More state - track which sections are expanded
  const [expandedSections, setExpandedSections] = useState<
    Record<string, boolean>
  >({
    implemented: false,
    under_consideration: false,
    upcoming: false,
  });

  // Form state for new/editing features
  const [formData, setFormData] = useState({
    icon: "🚀",
    title: "",
    description: "",
    progress: 0,
  });

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  // Filter features based on search and completion filter
  const filteredFeatures = React.useMemo(() => {
    if (!features) return [];

    return features.filter((feature) => {
      const matchesSearch =
        searchTerm === "" ||
        feature.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        feature.description.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCompletion = showCompleted || Number(feature.progress) < 100;

      return matchesSearch && matchesCompletion;
    });
  }, [features, searchTerm, showCompleted]);

  // Group features by section
  const featuresBySection = React.useMemo(() => {
    const grouped = {
      implemented: [] as RoadmapFeature[],
      under_consideration: [] as RoadmapFeature[],
      upcoming: [] as RoadmapFeature[],
    };

    filteredFeatures.forEach((feature) => {
      if (feature.sectionId in grouped) {
        grouped[feature.sectionId as keyof typeof grouped].push(feature);
      }
    });

    // Sort by timestamp (newest first) within each section
    Object.keys(grouped).forEach((section) => {
      grouped[section as keyof typeof grouped].sort(
        (a, b) => Number(b.timestamp) - Number(a.timestamp),
      );
    });

    return grouped;
  }, [filteredFeatures]);

  // Get visible features for each section (first 10 or all if expanded)
  const getVisibleFeatures = (sectionId: string) => {
    const sectionFeatures =
      featuresBySection[sectionId as keyof typeof featuresBySection];
    const isExpanded = expandedSections[sectionId];

    if (isExpanded || sectionFeatures.length <= 10) {
      return sectionFeatures;
    }

    return sectionFeatures.slice(0, 10);
  };

  // Toggle section expansion
  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
  };

  const handleCreateFeature = (sectionId: string) => {
    if (!formData.title.trim() || !formData.description.trim()) {
      alert("Please fill in all required fields");
      return;
    }

    const newFeature: RoadmapFeature = {
      id: "", // Will be set by backend
      icon: formData.icon,
      title: formData.title.trim(),
      description: formData.description.trim(),
      progress: BigInt(formData.progress),
      sectionId,
      timestamp: BigInt(Date.now() * 1000000), // Will be overridden by backend
    };

    createFeature(
      { sectionId, featureData: newFeature },
      {
        onSuccess: () => {
          setShowAddForm(null);
          setFormData({ icon: "🚀", title: "", description: "", progress: 0 });
          refetch();
        },
        onError: (error) => {
          console.error("Error creating feature:", error);
          alert("Failed to create feature. Please try again.");
        },
      },
    );
  };

  const handleUpdateFeature = () => {
    if (
      !editingFeature ||
      !editingFeature.title.trim() ||
      !editingFeature.description.trim()
    ) {
      alert("Please fill in all required fields");
      return;
    }

    const updatedFeature: RoadmapFeature = {
      id: editingFeature.id,
      icon: editingFeature.icon,
      title: editingFeature.title.trim(),
      description: editingFeature.description.trim(),
      progress: BigInt(editingFeature.progress),
      sectionId: editingFeature.sectionId,
      timestamp: BigInt(Date.now() * 1000000), // Will be overridden by backend
    };

    updateFeature(
      { featureId: editingFeature.id, featureData: updatedFeature },
      {
        onSuccess: () => {
          setEditingFeature(null);
          refetch();
        },
        onError: (error) => {
          console.error("Error updating feature:", error);
          alert("Failed to update feature. Please try again.");
        },
      },
    );
  };

  const handleDeleteFeature = (featureId: string) => {
    deleteFeature(featureId, {
      onSuccess: () => {
        refetch();
      },
      onError: (error) => {
        console.error("Error deleting feature:", error);
        alert("Failed to delete feature. Please try again.");
      },
    });
  };

  const handleDragStart = (e: React.DragEvent, feature: RoadmapFeature) => {
    if (!isAdmin) return;

    setDraggedFeature({ feature, sourceSection: feature.sectionId });
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", feature.id);
  };

  const handleDragOver = (e: React.DragEvent, sectionId: string) => {
    if (!isAdmin || !draggedFeature) return;

    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverSection(sectionId);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    if (!isAdmin) return;

    // Only clear drag over if we're actually leaving the section
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setDragOverSection(null);
    }
  };

  const handleDrop = (e: React.DragEvent, targetSectionId: string) => {
    if (!isAdmin || !draggedFeature) return;

    e.preventDefault();
    setDragOverSection(null);

    if (draggedFeature.sourceSection === targetSectionId) {
      setDraggedFeature(null);
      return;
    }

    moveFeature(
      { featureId: draggedFeature.feature.id, newSectionId: targetSectionId },
      {
        onSuccess: () => {
          setDraggedFeature(null);
          refetch();
        },
        onError: (error) => {
          console.error("Error moving feature:", error);
          alert("Failed to move feature. Please try again.");
          setDraggedFeature(null);
        },
      },
    );
  };

  const handleDragEnd = () => {
    setDraggedFeature(null);
    setDragOverSection(null);
  };

  const resetForm = () => {
    setFormData({ icon: "🚀", title: "", description: "", progress: 0 });
    setShowAddForm(null);
    setEditingFeature(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-16 w-16 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-600 text-lg">Loading roadmap...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="text-7xl mb-4">❌</div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Error Loading Roadmap
          </h1>
          <p className="text-gray-600 mb-6 text-lg">
            Failed to load roadmap data. Please try again.
          </p>
          <Link
            to="/"
            className="inline-flex items-center space-x-2 bg-orange-500 text-white py-3 px-6 rounded-lg hover:bg-orange-600 transition-colors text-lg font-medium"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Back to Home</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-8">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="text-center sm:text-left">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-1 sm:mb-2 leading-tight">
                Development Roadmap
              </h1>
              <p className="text-sm sm:text-base lg:text-lg text-gray-600 leading-relaxed">
                Track our progress and upcoming features
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <Link
                to="/"
                className="inline-flex items-center justify-center space-x-2 py-2.5 px-4 sm:py-2 sm:px-4 rounded-lg transition-colors font-medium text-sm sm:text-base min-h-[44px] sm:min-h-[40px] whitespace-nowrap bg-gray-500 text-white hover:bg-gray-600"
              >
                <Home className="h-4 w-4" />
                <span>Home</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-6 sm:mb-8">
          <div className="flex items-center space-x-2 mb-4">
            <Search className="h-5 w-5 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              Search & Filters
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="md:col-span-2">
              <Input
                type="text"
                placeholder="Search features by title or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>

            {/* Show Completed Filter */}
            <div className="flex items-center space-x-2">
              <Button
                variant={showCompleted ? "default" : "outline"}
                size="sm"
                onClick={() => setShowCompleted(!showCompleted)}
                className="flex items-center space-x-2"
              >
                {showCompleted ? (
                  <Eye className="h-4 w-4" />
                ) : (
                  <EyeOff className="h-4 w-4" />
                )}
                <span>{showCompleted ? "Hide" : "Show"} Completed</span>
              </Button>
            </div>
          </div>

          {/* Active Filters Summary */}
          {(searchTerm || !showCompleted) && (
            <div className="mt-4 flex items-center space-x-2">
              <span className="text-sm text-gray-600">Active filters:</span>
              {searchTerm && (
                <Badge variant="outline" className="text-xs">
                  Search: "{searchTerm}"
                </Badge>
              )}
              {!showCompleted && (
                <Badge variant="outline" className="text-xs">
                  Hiding completed features
                </Badge>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchTerm("");
                  setShowCompleted(true);
                }}
                className="text-xs text-red-600 hover:text-red-700"
              >
                Clear all
              </Button>
            </div>
          )}
        </div>

        {/* Statistics */}
        {features && features.length > 0 && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
            <Card className="p-3 sm:p-4">
              <div className="flex items-center space-x-2 sm:space-x-3">
                <Target className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium text-gray-500 truncate">
                    Total Features
                  </p>
                  <p className="text-lg sm:text-xl font-bold text-gray-900">
                    {features.length}
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-3 sm:p-4">
              <div className="flex items-center space-x-2 sm:space-x-3">
                <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-green-600 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium text-gray-500 truncate">
                    Implemented
                  </p>
                  <p className="text-lg sm:text-xl font-bold text-gray-900">
                    {
                      features.filter((f) => f.sectionId === "implemented")
                        .length
                    }
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-3 sm:p-4">
              <div className="flex items-center space-x-2 sm:space-x-3">
                <Clock className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-600 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium text-gray-500 truncate">
                    In Progress
                  </p>
                  <p className="text-lg sm:text-xl font-bold text-gray-900">
                    {
                      features.filter(
                        (f) =>
                          Number(f.progress) > 0 && Number(f.progress) < 100,
                      ).length
                    }
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-3 sm:p-4">
              <div className="flex items-center space-x-2 sm:space-x-3">
                <Rocket className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium text-gray-500 truncate">
                    Planned
                  </p>
                  <p className="text-lg sm:text-xl font-bold text-gray-900">
                    {features.filter((f) => f.sectionId === "upcoming").length}
                  </p>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Admin Notice */}
        {isAdmin && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-start space-x-3">
              <Settings className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">Admin Mode Active</p>
                <p>
                  You can add, edit, delete, and drag features between sections.
                  Changes are saved automatically.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Roadmap Sections */}
        <div className="space-y-8">
          {Object.entries(sectionConfig).map(([sectionId, config]) => {
            const sectionFeatures =
              featuresBySection[sectionId as keyof typeof featuresBySection];
            const visibleFeatures = getVisibleFeatures(sectionId);
            const hasMore = sectionFeatures.length > 10;
            const isExpanded = expandedSections[sectionId];

            return (
              <div key={sectionId} className="space-y-4">
                {/* Section Header */}
                <div
                  className={`${config.bgColor} ${config.borderColor} border rounded-lg p-4 sm:p-6`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={config.textColor}>{config.icon}</div>
                      <div>
                        <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                          {config.title}
                        </h2>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Badge
                        variant="outline"
                        className={`${config.textColor} border-current`}
                      >
                        {sectionFeatures.length} features
                      </Badge>
                      {isAdmin && (
                        <Button
                          onClick={() => setShowAddForm(sectionId)}
                          size="sm"
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Feature
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Drop Zone */}
                <div
                  className={`roadmap-drop-zone ${
                    dragOverSection === sectionId
                      ? `roadmap-drop-zone-active roadmap-drop-zone-${sectionId}`
                      : "roadmap-drop-zone-default"
                  } ${isAdmin ? "cursor-pointer" : ""}`}
                  onDragOver={(e) => handleDragOver(e, sectionId)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, sectionId)}
                >
                  {/* Add Feature Form */}
                  {showAddForm === sectionId && (
                    <div className="p-4 bg-white border border-gray-200 rounded-lg m-4">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">
                          Add New Feature
                        </h3>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={resetForm}
                          className="h-8 w-8 p-0"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="space-y-4">
                        {/* Icon Selection */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Icon
                          </label>
                          <div className="grid grid-cols-8 sm:grid-cols-10 gap-2 max-h-32 overflow-y-auto border border-gray-200 rounded-lg p-2">
                            {predefinedIcons.map((icon) => (
                              <button
                                key={icon}
                                type="button"
                                onClick={() =>
                                  setFormData({ ...formData, icon })
                                }
                                className={`p-2 rounded text-2xl hover:bg-gray-100 transition-colors ${
                                  formData.icon === icon
                                    ? "bg-blue-100 ring-2 ring-blue-500"
                                    : ""
                                }`}
                              >
                                {icon}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Title */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Title *
                          </label>
                          <Input
                            type="text"
                            value={formData.title}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                title: e.target.value,
                              })
                            }
                            placeholder="Enter feature title"
                            maxLength={100}
                          />
                        </div>

                        {/* Description */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Description *
                          </label>
                          <Textarea
                            value={formData.description}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                description: e.target.value,
                              })
                            }
                            placeholder="Enter feature description"
                            rows={3}
                            maxLength={300}
                          />
                        </div>

                        {/* Progress */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Progress: {formData.progress}%
                          </label>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            step="5"
                            value={formData.progress}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                progress: Number.parseInt(e.target.value),
                              })
                            }
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                          />
                        </div>

                        {/* Actions */}
                        <div className="flex space-x-3">
                          <Button
                            onClick={() => handleCreateFeature(sectionId)}
                            disabled={
                              isCreating ||
                              !formData.title.trim() ||
                              !formData.description.trim()
                            }
                            className="flex-1"
                          >
                            {isCreating ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Creating...
                              </>
                            ) : (
                              <>
                                <Save className="h-4 w-4 mr-2" />
                                Create Feature
                              </>
                            )}
                          </Button>
                          <Button
                            variant="outline"
                            onClick={resetForm}
                            className="flex-1"
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Features Grid */}
                  <div className="p-4">
                    {sectionFeatures.length === 0 ? (
                      <div className="text-center py-8">
                        <div className="text-4xl mb-4">{config.icon}</div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                          No features in this section
                        </h3>
                        <p className="text-gray-600">
                          {isAdmin
                            ? 'Click "Add Feature" to create the first feature in this section.'
                            : "Features will appear here as they are added."}
                        </p>
                      </div>
                    ) : (
                      <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                          {visibleFeatures.map((feature) => (
                            <div
                              key={feature.id}
                              draggable={isAdmin}
                              onDragStart={(e) => handleDragStart(e, feature)}
                              onDragEnd={handleDragEnd}
                              className={isAdmin ? "cursor-move" : ""}
                            >
                              <FeatureCard
                                feature={feature}
                                isAdmin={!!isAdmin}
                                onEdit={(f) =>
                                  setEditingFeature({
                                    id: f.id,
                                    icon: f.icon,
                                    title: f.title,
                                    description: f.description,
                                    progress: Number(f.progress),
                                    sectionId: f.sectionId,
                                  })
                                }
                                onDelete={handleDeleteFeature}
                                isDragging={
                                  draggedFeature?.feature.id === feature.id
                                }
                              />
                            </div>
                          ))}
                        </div>

                        {/* Show More / Show Less Button */}
                        {hasMore && (
                          <div className="flex justify-center mt-6">
                            <Button
                              variant="outline"
                              onClick={() => toggleSection(sectionId)}
                              className="flex items-center space-x-2 hover:bg-gray-50 transition-colors"
                            >
                              {isExpanded ? (
                                <>
                                  <ChevronUp className="h-4 w-4" />
                                  <span>Show Less</span>
                                </>
                              ) : (
                                <>
                                  <ChevronDown className="h-4 w-4" />
                                  <span>
                                    Show More ({sectionFeatures.length - 10}{" "}
                                    more)
                                  </span>
                                </>
                              )}
                            </Button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* No Features Message */}
        {(!features || features.length === 0) && (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <div className="text-6xl mb-4">🗺️</div>
            <h3 className="text-xl font-medium text-gray-900 mb-2">
              No roadmap features yet
            </h3>
            <p className="text-gray-600 mb-6">
              {isAdmin
                ? "Start building the roadmap by adding your first feature."
                : "The development roadmap will appear here once features are added."}
            </p>
            {isAdmin && (
              <Button
                onClick={() => setShowAddForm("upcoming")}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add First Feature
              </Button>
            )}
          </div>
        )}

        {/* Filtered Results Message */}
        {features && features.length > 0 && filteredFeatures.length === 0 && (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <div className="text-5xl mb-4">🔍</div>
            <h3 className="text-xl font-medium text-gray-900 mb-2">
              No features match your filters
            </h3>
            <p className="text-gray-600 mb-6">
              Try adjusting your search terms or filters to see more results.
            </p>
            <Button
              variant="outline"
              onClick={() => {
                setSearchTerm("");
                setShowCompleted(true);
              }}
            >
              Clear Filters
            </Button>
          </div>
        )}
      </div>

      {/* Edit Feature Modal */}
      {editingFeature && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900">
                Edit Feature
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEditingFeature(null)}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-4">
              {/* Icon Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Icon
                </label>
                <div className="grid grid-cols-8 sm:grid-cols-10 gap-2 max-h-32 overflow-y-auto border border-gray-200 rounded-lg p-2">
                  {predefinedIcons.map((icon) => (
                    <button
                      key={icon}
                      type="button"
                      onClick={() =>
                        setEditingFeature({ ...editingFeature, icon })
                      }
                      className={`p-2 rounded text-2xl hover:bg-gray-100 transition-colors ${
                        editingFeature.icon === icon
                          ? "bg-blue-100 ring-2 ring-blue-500"
                          : ""
                      }`}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title *
                </label>
                <Input
                  type="text"
                  value={editingFeature.title}
                  onChange={(e) =>
                    setEditingFeature({
                      ...editingFeature,
                      title: e.target.value,
                    })
                  }
                  placeholder="Enter feature title"
                  maxLength={100}
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <Textarea
                  value={editingFeature.description}
                  onChange={(e) =>
                    setEditingFeature({
                      ...editingFeature,
                      description: e.target.value,
                    })
                  }
                  placeholder="Enter feature description"
                  rows={3}
                  maxLength={300}
                />
              </div>

              {/* Progress */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Progress: {editingFeature.progress}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={editingFeature.progress}
                  onChange={(e) =>
                    setEditingFeature({
                      ...editingFeature,
                      progress: Number.parseInt(e.target.value),
                    })
                  }
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <Progress
                  value={editingFeature.progress}
                  className="h-2 mt-2"
                />
              </div>

              {/* Section */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Section
                </label>
                <select
                  value={editingFeature.sectionId}
                  onChange={(e) =>
                    setEditingFeature({
                      ...editingFeature,
                      sectionId: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {Object.entries(sectionConfig).map(([id, config]) => (
                    <option key={id} value={id}>
                      {config.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Actions */}
              <div className="flex space-x-3 pt-4">
                <Button
                  onClick={handleUpdateFeature}
                  disabled={
                    isUpdating ||
                    !editingFeature.title.trim() ||
                    !editingFeature.description.trim()
                  }
                  className="flex-1"
                >
                  {isUpdating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Update Feature
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setEditingFeature(null)}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Drag Instructions */}
      {isAdmin && features && features.length > 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mt-8">
          <div className="flex items-start space-x-3">
            <GripVertical className="h-5 w-5 text-gray-600 mt-0.5 shrink-0" />
            <div className="text-sm text-gray-700">
              <p className="font-medium mb-1">Drag & Drop Instructions</p>
              <p>
                Drag feature cards between sections to update their status.
                Cards will automatically adopt the color theme of their new
                section. Changes are saved automatically when you drop a card in
                a new section.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Loading Overlay */}
      {(isCreating || isUpdating || isDeleting || isMoving) && (
        <div className="fixed inset-0 bg-black/25 flex items-center justify-center z-40">
          <div className="bg-white rounded-lg p-6 shadow-xl">
            <div className="flex items-center space-x-3">
              <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
              <span className="text-gray-900 font-medium">
                {isCreating && "Creating feature..."}
                {isUpdating && "Updating feature..."}
                {isDeleting && "Deleting feature..."}
                {isMoving && "Moving feature..."}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
