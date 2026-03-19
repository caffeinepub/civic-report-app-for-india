import React, { useState } from 'react';
import { Users, UserPlus, Shield, Copy, Check, Settings } from 'lucide-react';
import { useAssignRole } from '../hooks/useQueries';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { Principal } from '@dfinity/principal';
import { UserRole } from '../backend';
import { AdminManagement } from './AdminManagement';

export function UserManagement() {
  const [newAdminPrincipal, setNewAdminPrincipal] = useState('');
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'admin-management'>('admin-management');
  const { identity } = useInternetIdentity();
  const { mutate: assignRole, isPending: isAssigning } = useAssignRole();

  const handleAssignAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newAdminPrincipal.trim()) {
      alert('Please enter a valid principal ID');
      return;
    }

    try {
      const principal = Principal.fromText(newAdminPrincipal.trim());
      
      assignRole({
        user: principal,
        role: UserRole.admin
      }, {
        onSuccess: () => {
          setNewAdminPrincipal('');
          alert('Admin role assigned successfully!');
        },
        onError: (error) => {
          console.error('Error assigning admin role:', error);
          alert('Failed to assign admin role. Please check the principal ID and try again.');
        }
      });
    } catch (error) {
      console.error('Invalid principal ID:', error);
      alert('Invalid principal ID format. Please check and try again.');
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  const currentPrincipal = identity?.getPrincipal().toString() || 'Not logged in';

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center space-x-3 mb-4">
          <Users className="h-8 w-8 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-900">User Management</h2>
        </div>
        <p className="text-gray-600">
          Manage user profiles and admin access for the civic reporting platform.
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('admin-management')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'admin-management'
                  ? 'border-red-500 text-red-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Shield className="h-5 w-5" />
                <span>Admin Management</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('profile')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'profile'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Users className="h-5 w-5" />
                <span>Profile & Session</span>
              </div>
            </button>
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'admin-management' ? (
        <AdminManagement />
      ) : (
        <div className="space-y-6">
          {/* Legacy Admin Assignment (kept for backward compatibility) */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center space-x-3 mb-6">
              <UserPlus className="h-6 w-6 text-green-600" />
              <h3 className="text-xl font-semibold text-gray-900">Legacy Admin Assignment</h3>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <div className="flex items-start space-x-2">
                <Settings className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-yellow-800">
                  <p className="font-medium mb-1">Note:</p>
                  <p>This is the legacy admin assignment method. For better admin management, please use the "Admin Management" tab above.</p>
                </div>
              </div>
            </div>

            <form onSubmit={handleAssignAdmin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  User Principal ID
                </label>
                <input
                  type="text"
                  value={newAdminPrincipal}
                  onChange={(e) => setNewAdminPrincipal(e.target.value)}
                  placeholder="Enter the Internet Identity principal ID"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm font-mono"
                  required
                  maxLength={100}
                />
                <p className="text-xs text-gray-500 mt-1">
                  The principal ID is a unique identifier from Internet Identity (e.g., rdmx6-jaaaa-aaaah-qcaiq-cai)
                </p>
              </div>

              <button
                type="submit"
                disabled={isAssigning || !newAdminPrincipal.trim()}
                className="w-full bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center space-x-2"
              >
                <Shield className="h-5 w-5" />
                <span>{isAssigning ? 'Assigning Admin Role...' : 'Assign Admin Role'}</span>
              </button>
            </form>
          </div>

          {/* Current Session Info - Mobile-responsive */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Session</h3>
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                <span className="text-sm text-gray-600">Your Principal ID:</span>
                <div className="flex items-center space-x-2">
                  <code className="bg-gray-100 px-2 py-1 rounded text-xs font-mono text-gray-800 break-all sm:max-w-xs truncate">
                    {currentPrincipal}
                  </code>
                  <button
                    onClick={() => copyToClipboard(currentPrincipal)}
                    className="p-1 text-gray-500 hover:text-gray-700 transition-colors flex-shrink-0"
                    title="Copy to clipboard"
                  >
                    {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                <span className="text-sm text-gray-600">Role:</span>
                <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-medium w-fit">
                  Admin
                </span>
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-4">How to Find a User's Principal ID</h3>
            <div className="space-y-3 text-sm text-blue-800">
              <p>
                <strong>Method 1:</strong> Ask the user to visit any Internet Computer dApp while logged in with Internet Identity, 
                then check the browser's developer console for their principal ID.
              </p>
              <p>
                <strong>Method 2:</strong> The user can visit{' '}
                <a 
                  href="https://identity.ic0.app/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-700 underline"
                >
                  Internet Identity
                </a>
                {' '}and their principal ID will be displayed after logging in.
              </p>
              <p>
                <strong>Method 3:</strong> Use the Internet Computer SDK (dfx) command:{' '}
                <code className="bg-blue-100 px-2 py-1 rounded text-xs font-mono">dfx identity get-principal</code>
              </p>
            </div>
          </div>

          {/* Admin Guidelines */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-yellow-900 mb-4">Admin Guidelines</h3>
            <div className="space-y-2 text-sm text-yellow-800">
              <p>• Only assign admin roles to trusted users who need moderation capabilities</p>
              <p>• Admins can edit, delete, and moderate all reports in the system</p>
              <p>• Admin actions are logged for accountability and audit purposes</p>
              <p>• There is no automatic admin assignment - all admin rights must be explicitly granted</p>
              <p>• Use the Admin Management tab for better control over admin access</p>
              <p>• All admin management operations are now secured with dedicated backend methods</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
