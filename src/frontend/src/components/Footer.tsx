import React, { useState } from 'react';
import { Coffee, MessageSquare, Send, X } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useSubmitFeedback } from '../hooks/useQueries';

export function Footer() {
  const { t } = useLanguage();
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackType, setFeedbackType] = useState<'feedback' | 'bug' | 'contact'>('feedback');
  const [message, setMessage] = useState('');
  const [contactInfo, setContactInfo] = useState('');
  const { mutate: submitFeedback, isPending } = useSubmitFeedback();
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && contactInfo.trim()) {
      submitFeedback(
        { type: feedbackType, message: message.trim(), contactInfo: contactInfo.trim() },
        {
          onSuccess: () => {
            setMessage('');
            setContactInfo('');
            setShowFeedbackModal(false);
            alert('Thank you! Your submission has been received.');
          },
          onError: (error) => {
            console.error('Failed to submit feedback:', error);
            alert('Failed to submit. Please try again.');
          }
        }
      );
    }
  };
  
  return (
    <footer className="bg-white border-t border-gray-200 py-6 mt-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="flex flex-col items-center justify-center space-y-4">
          {/* Compact Support and Feedback Section - Side by Side on Desktop, Stacked on Mobile */}
          <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Compact Support Card */}
            <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-lg shadow-sm p-4 border border-orange-100">
              <div className="flex items-center justify-center mb-2">
                <div className="coffee-icon-animated text-2xl">
                  ☕
                </div>
              </div>
              <h3 className="text-base font-bold text-gray-900 text-center mb-2">Support This Project</h3>
              <p className="text-xs text-gray-600 text-center mb-3 leading-relaxed">
                Help maintain this tool with a small donation!
              </p>
              <a
                href="https://buymeacoffee.com/prabhatchhirolya"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center space-x-1.5 w-full bg-gray-100 text-gray-700 py-1.5 px-3 rounded-md hover:bg-gray-200 transition-colors text-xs font-normal border border-gray-200"
              >
                <Coffee className="h-3.5 w-3.5" />
                <span>Buy Me a Coffee</span>
              </a>
            </div>

            {/* Compact Feedback/Contact Card */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg shadow-sm p-4 border border-blue-100">
              <div className="flex items-center justify-center mb-2">
                <MessageSquare className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-base font-bold text-gray-900 text-center mb-2">Feedback & Contact</h3>
              <p className="text-xs text-gray-600 text-center mb-3 leading-relaxed">
                Share feedback, report bugs, or get in touch!
              </p>
              <button
                onClick={() => setShowFeedbackModal(true)}
                className="flex items-center justify-center space-x-1.5 w-full bg-gray-100 text-gray-700 py-1.5 px-3 rounded-md hover:bg-gray-200 transition-colors text-xs font-normal border border-gray-200"
              >
                <Send className="h-3.5 w-3.5" />
                <span>Contact Us</span>
              </button>
            </div>
          </div>

          {/* Legal Notice */}
          <div className="text-center pt-3 border-t border-gray-100 w-full">
            <p className="text-gray-500 text-xs leading-relaxed max-w-4xl">
              <strong>Legal Notice:</strong> This platform is dedicated to reporting civic infrastructure issues. Users are responsible for their content, and we do not verify reports or endorse claims. Terms of Service • Operated under Section 79 of the IT Act, 2000.
            </p>
          </div>

          {/* Copyright Line */}
          <div className="text-center pt-2 w-full">
            <p className="text-gray-500 text-xs">
              © 2025 CivicReport. Built with AI, powered by ICP Blockchain.
            </p>
          </div>
        </div>
      </div>

      {/* Feedback Modal */}
      {showFeedbackModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900">Get in Touch</h3>
                <button
                  onClick={() => setShowFeedbackModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Type
                  </label>
                  <select
                    value={feedbackType}
                    onChange={(e) => setFeedbackType(e.target.value as 'feedback' | 'bug' | 'contact')}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="feedback">General Feedback</option>
                    <option value="bug">Bug Report</option>
                    <option value="contact">Contact / Inquiry</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Your Email or Phone
                  </label>
                  <input
                    type="text"
                    value={contactInfo}
                    onChange={(e) => setContactInfo(e.target.value)}
                    placeholder="email@example.com or phone number"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Message
                  </label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Tell us what's on your mind..."
                    className="w-full p-3 border border-gray-300 rounded-lg resize-none h-32 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                
                <div className="flex items-center justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowFeedbackModal(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isPending || !message.trim() || !contactInfo.trim()}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center space-x-2"
                  >
                    <Send className="h-4 w-4" />
                    <span>{isPending ? 'Sending...' : 'Send'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </footer>
  );
}
