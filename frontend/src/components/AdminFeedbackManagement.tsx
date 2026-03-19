import React, { useState } from 'react';
import { MessageSquare, Mail, Phone, Calendar, Eye, CheckCircle, Clock, XCircle, Trash2, Send, Filter } from 'lucide-react';
import { useGetAllFeedback, useUpdateFeedbackStatus, useRespondToFeedback, useDeleteFeedback } from '../hooks/useQueries';
import { Feedback } from '../backend';

export function AdminFeedbackManagement() {
  const { data: allFeedback, isLoading } = useGetAllFeedback();
  const { mutate: updateStatus, isPending: isUpdatingStatus } = useUpdateFeedbackStatus();
  const { mutate: respondToFeedback, isPending: isResponding } = useRespondToFeedback();
  const { mutate: deleteFeedback, isPending: isDeleting } = useDeleteFeedback();
  
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null);
  const [responseText, setResponseText] = useState('');
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const handleStatusChange = (feedbackId: string, newStatus: string) => {
    if (confirm(`Are you sure you want to mark this submission as "${newStatus}"?`)) {
      updateStatus({ feedbackId, status: newStatus });
    }
  };

  const handleRespond = (feedback: Feedback) => {
    setSelectedFeedback(feedback);
    setResponseText(feedback.response || '');
    setShowResponseModal(true);
  };

  const submitResponse = () => {
    if (selectedFeedback && responseText.trim()) {
      respondToFeedback(
        { feedbackId: selectedFeedback.id, response: responseText.trim() },
        {
          onSuccess: () => {
            setShowResponseModal(false);
            setSelectedFeedback(null);
            setResponseText('');
          }
        }
      );
    }
  };

  const handleDelete = (feedbackId: string) => {
    if (confirm('Are you sure you want to permanently delete this submission? This action cannot be undone.')) {
      deleteFeedback(feedbackId);
    }
  };

  // Filter feedback
  const filteredFeedback = allFeedback?.filter(feedback => {
    const matchesType = filterType === 'all' || feedback.type === filterType;
    const matchesStatus = filterStatus === 'all' || feedback.status === filterStatus;
    const matchesSearch = searchQuery === '' || 
      feedback.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
      feedback.contactInfo.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesStatus && matchesSearch;
  }) || [];

  const newSubmissions = filteredFeedback.filter(f => f.status === 'New');
  const inProgressSubmissions = filteredFeedback.filter(f => f.status === 'In Progress');
  const resolvedSubmissions = filteredFeedback.filter(f => f.status === 'Resolved');

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 sm:p-8 text-center">
        <MessageSquare className="h-10 sm:h-12 w-10 sm:w-12 text-gray-400 mx-auto mb-4 animate-pulse" />
        <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">Loading Feedback...</h3>
        <p className="text-sm sm:text-base text-gray-600">Please wait while we fetch the submissions.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 space-y-2 sm:space-y-0">
        <div className="flex items-center space-x-2 sm:space-x-3">
          <MessageSquare className="h-5 sm:h-6 w-5 sm:w-6 text-blue-600" />
          <h2 className="text-lg sm:text-xl font-bold text-gray-900">Feedback & Contact Management</h2>
        </div>
        <div className="text-xs sm:text-sm text-gray-600">
          {filteredFeedback.length} total • {newSubmissions.length} new • {inProgressSubmissions.length} in progress • {resolvedSubmissions.length} resolved
        </div>
      </div>

      {/* Filters and Search */}
      <div className="mb-6 space-y-3">
        <div className="flex items-center space-x-2 text-sm font-medium text-gray-700">
          <Filter className="h-4 w-4" />
          <span>Filters</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Type</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Types</option>
              <option value="feedback">Feedback</option>
              <option value="bug">Bug Report</option>
              <option value="contact">Contact</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Status</option>
              <option value="New">New</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Search</label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search message or contact..."
              className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {!allFeedback || allFeedback.length === 0 ? (
        <div className="text-center py-8">
          <MessageSquare className="h-10 sm:h-12 w-10 sm:w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">No Submissions Yet</h3>
          <p className="text-sm sm:text-base text-gray-600">No feedback or contact submissions have been received.</p>
        </div>
      ) : filteredFeedback.length === 0 ? (
        <div className="text-center py-8">
          <MessageSquare className="h-10 sm:h-12 w-10 sm:w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">No Matching Submissions</h3>
          <p className="text-sm sm:text-base text-gray-600">Try adjusting your filters or search query.</p>
        </div>
      ) : (
        <div className="space-y-4 sm:space-y-6">
          {newSubmissions.length > 0 && (
            <div>
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center">
                <Clock className="h-4 sm:h-5 w-4 sm:w-5 text-yellow-500 mr-2" />
                New Submissions ({newSubmissions.length})
              </h3>
              <div className="grid grid-cols-1 gap-3 sm:gap-4">
                {newSubmissions.map((feedback) => (
                  <FeedbackCard
                    key={feedback.id}
                    feedback={feedback}
                    onStatusChange={handleStatusChange}
                    onRespond={handleRespond}
                    onDelete={handleDelete}
                    isUpdating={isUpdatingStatus}
                    isDeleting={isDeleting}
                  />
                ))}
              </div>
            </div>
          )}

          {inProgressSubmissions.length > 0 && (
            <div>
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center">
                <Clock className="h-4 sm:h-5 w-4 sm:w-5 text-blue-500 mr-2" />
                In Progress ({inProgressSubmissions.length})
              </h3>
              <div className="grid grid-cols-1 gap-3 sm:gap-4">
                {inProgressSubmissions.map((feedback) => (
                  <FeedbackCard
                    key={feedback.id}
                    feedback={feedback}
                    onStatusChange={handleStatusChange}
                    onRespond={handleRespond}
                    onDelete={handleDelete}
                    isUpdating={isUpdatingStatus}
                    isDeleting={isDeleting}
                  />
                ))}
              </div>
            </div>
          )}

          {resolvedSubmissions.length > 0 && (
            <div>
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center">
                <CheckCircle className="h-4 sm:h-5 w-4 sm:w-5 text-green-500 mr-2" />
                Resolved ({resolvedSubmissions.length})
              </h3>
              <div className="grid grid-cols-1 gap-3 sm:gap-4">
                {resolvedSubmissions.map((feedback) => (
                  <FeedbackCard
                    key={feedback.id}
                    feedback={feedback}
                    onStatusChange={handleStatusChange}
                    onRespond={handleRespond}
                    onDelete={handleDelete}
                    isUpdating={isUpdatingStatus}
                    isDeleting={isDeleting}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Response Modal */}
      {showResponseModal && selectedFeedback && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg sm:text-xl font-bold text-gray-900">Respond to Submission</h3>
                <button
                  onClick={() => setShowResponseModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="h-5 sm:h-6 w-5 sm:w-6" />
                </button>
              </div>

              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-gray-500">Original Message</span>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    selectedFeedback.type === 'feedback' ? 'bg-blue-100 text-blue-700' :
                    selectedFeedback.type === 'bug' ? 'bg-red-100 text-red-700' :
                    'bg-green-100 text-green-700'
                  }`}>
                    {selectedFeedback.type}
                  </span>
                </div>
                <p className="text-sm text-gray-900 mb-2">{selectedFeedback.message}</p>
                <p className="text-xs text-gray-600">From: {selectedFeedback.contactInfo}</p>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Response
                </label>
                <textarea
                  value={responseText}
                  onChange={(e) => setResponseText(e.target.value)}
                  placeholder="Type your response here..."
                  className="w-full p-3 border border-gray-300 rounded-lg resize-none h-32 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="flex items-center justify-end space-x-3">
                <button
                  onClick={() => setShowResponseModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={submitResponse}
                  disabled={isResponding || !responseText.trim()}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center space-x-2"
                >
                  <Send className="h-4 w-4" />
                  <span>{isResponding ? 'Sending...' : 'Send Response'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function FeedbackCard({
  feedback,
  onStatusChange,
  onRespond,
  onDelete,
  isUpdating,
  isDeleting
}: {
  feedback: Feedback;
  onStatusChange: (id: string, status: string) => void;
  onRespond: (feedback: Feedback) => void;
  onDelete: (id: string) => void;
  isUpdating: boolean;
  isDeleting: boolean;
}) {
  return (
    <div className="border border-gray-200 rounded-lg p-3 sm:p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-2">
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
            feedback.type === 'feedback' ? 'bg-blue-100 text-blue-700' :
            feedback.type === 'bug' ? 'bg-red-100 text-red-700' :
            'bg-green-100 text-green-700'
          }`}>
            {feedback.type}
          </span>
          <span className={`px-2 py-1 text-xs font-medium rounded-full border ${
            feedback.status === 'New' ? 'text-yellow-600 bg-yellow-50 border-yellow-200' :
            feedback.status === 'In Progress' ? 'text-blue-600 bg-blue-50 border-blue-200' :
            'text-green-600 bg-green-50 border-green-200'
          }`}>
            {feedback.status}
          </span>
        </div>
        <div className="text-xs text-gray-500 flex items-center">
          <Calendar className="h-3 w-3 mr-1" />
          {new Date(Number(feedback.timestamp) / 1000000).toLocaleDateString()}
        </div>
      </div>

      <div className="mb-3">
        <p className="text-sm text-gray-900 mb-2">{feedback.message}</p>
        <div className="flex items-center space-x-2 text-xs text-gray-600">
          <Mail className="h-3 w-3" />
          <span className="truncate">{feedback.contactInfo}</span>
        </div>
      </div>

      {feedback.response && (
        <div className="mb-3 p-2 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-xs font-medium text-blue-900 mb-1">Admin Response:</p>
          <p className="text-xs text-blue-800">{feedback.response}</p>
        </div>
      )}

      <div className="flex items-center flex-wrap gap-2">
        <select
          value={feedback.status}
          onChange={(e) => onStatusChange(feedback.id, e.target.value)}
          disabled={isUpdating}
          className="text-xs px-2 py-1 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
        >
          <option value="New">New</option>
          <option value="In Progress">In Progress</option>
          <option value="Resolved">Resolved</option>
        </select>

        <button
          onClick={() => onRespond(feedback)}
          className="flex items-center space-x-1 text-blue-600 hover:text-blue-700 text-xs font-medium px-2 py-1"
        >
          <Send className="h-3 w-3" />
          <span>{feedback.response ? 'Update Response' : 'Respond'}</span>
        </button>

        <button
          onClick={() => onDelete(feedback.id)}
          disabled={isDeleting}
          className="flex items-center space-x-1 text-red-600 hover:text-red-700 disabled:opacity-50 text-xs font-medium px-2 py-1"
        >
          <Trash2 className="h-3 w-3" />
          <span>Delete</span>
        </button>
      </div>
    </div>
  );
}
