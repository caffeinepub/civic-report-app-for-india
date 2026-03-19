import React, { useState } from 'react';
import { Shield, UserPlus, UserMinus, Users, Copy, Check, AlertTriangle, Trash2, RefreshCw } from 'lucide-react';
import { useGetAdmins, useAddAdmin, useRemoveAdmin } from '../hooks/useQueries';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { Principal } from '@dfinity/principal';

export function AdminManagement() {
  const { identity } = useInternetIdentity();
  const { data: admins, isLoading, error, refetch } = useGetAdmins();
  const { mutate: addAdmin, isPending: isAddingAdmin } = useAddAdmin();
  const { mutate: removeAdmin, isPending: isRemovingAdmin } = useRemoveAdmin();
  
  const [newAdminPrincipal, setNewAdminPrincipal] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const currentUserPrincipal = identity?.getPrincipal().toString();

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newAdminPrincipal.trim()) {
      alert('Please enter a valid principal ID');
      return;
    }

    try {
      const principal = Principal.fromText(newAdminPrincipal.trim());
      
      addAdmin(principal, {
        onSuccess: () => {
          setNewAdminPrincipal('');
          setShowAddForm(false);
          alert('Admin added successfully! The admin list has been updated.');
          // Refresh the admin list to show the latest state
          refetch();
        },
        onError: (error) => {
          console.error('Error adding admin:', error);
          const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
          if (errorMessage.includes('Unauthorized')) {
            alert('You do not have permission to add admins. Please ensure you are logged in as an admin.');
          } else {
            alert('Failed to add admin. Please check the principal ID and try again.');
          }
        }
      });
    } catch (error) {
      console.error('Invalid principal ID:', error);
      alert('Invalid principal ID format. Please check and try again.');
    }
  };

  const handleRemoveAdmin = (adminPrincipal: string) => {
    if (adminPrincipal === currentUserPrincipal) {
      alert('You cannot remove yourself as an admin.');
      return;
    }

    try {
      const principal = Principal.fromText(adminPrincipal);
      
      removeAdmin(principal, {
        onSuccess: () => {
          setConfirmRemove(null);
          alert('Admin removed successfully! The admin list has been updated.');
          // Refresh the admin list to show the latest state
          refetch();
        },
        onError: (error) => {
          console.error('Error removing admin:', error);
          const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
          if (errorMessage.includes('Unauthorized')) {
            alert('You do not have permission to remove admins. Please ensure you are logged in as an admin.');
          } else if (errorMessage.includes('cannot remove yourself')) {
            alert('You cannot remove yourself as an admin.');
          } else {
            alert('Failed to remove admin. Please try again.');
          }
          setConfirmRemove(null);
        }
      });
    } catch (error) {
      console.error('Invalid principal ID:', error);
      alert('Invalid principal ID format.');
      setConfirmRemove(null);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(text);
      setTimeout(() => setCopied(null), 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  const handleRefreshAdminList = () => {
    refetch();
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
          <span className="ml-2 text-gray-600">Loading admin list...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="text-center py-8">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Admins</h3>
          <p className="text-gray-600 mb-4">Failed to load the admin list. Please try again.</p>
          <button
            onClick={handleRefreshAdminList}
            className="inline-flex items-center space-x-2 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Retry</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center space-x-3 mb-4">
          <Shield className="h-8 w-8 text-red-600" />
          <h2 className="text-2xl font-bold text-gray-900">Admin Management</h2>
        </div>
        <p className="text-gray-600">
          Manage admin access for the civic reporting platform. Only existing admins can add or remove other admins.
        </p>
      </div>

      {/* Admin System Status */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-center space-x-3 mb-4">
          <Shield className="h-6 w-6 text-blue-600" />
          <h3 className="text-lg font-semibold text-blue-900">Admin System Status</h3>
        </div>
        <div className="space-y-2 text-sm text-blue-800">
          <div className="flex items-center justify-between">
            <span>Total Admins:</span>
            <span className="font-medium">{admins?.length || 0}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Your Status:</span>
            <span className="font-medium text-green-700">
              {admins?.some(admin => admin.toString() === currentUserPrincipal) ? 'Admin' : 'Not Admin'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span>System Status:</span>
            <span className="font-medium">
              {admins && admins.length > 0 ? 'Active' : 'No Admins (First login gets admin rights)'}
            </span>
          </div>
        </div>
        <div className="mt-4">
          <button
            onClick={handleRefreshAdminList}
            className="inline-flex items-center space-x-2 bg-blue-600 text-white py-2 px-3 rounded hover:bg-blue-700 transition-colors text-sm"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Refresh Status</span>
          </button>
        </div>
      </div>

      {/* Current Admins List */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <Users className="h-6 w-6 text-blue-600" />
            <h3 className="text-xl font-semibold text-gray-900">Current Admins ({admins?.length || 0})</h3>
          </div>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center space-x-2 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors font-medium"
          >
            <UserPlus className="h-4 w-4" />
            <span>Add Admin</span>
          </button>
        </div>

        {/* Admin List */}
        {admins && admins.length > 0 ? (
          <div className="space-y-3">
            {admins.map((admin) => {
              const adminPrincipal = admin.toString();
              const isCurrentUser = adminPrincipal === currentUserPrincipal;
              
              return (
                <div key={adminPrincipal} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    <Shield className={`h-5 w-5 ${isCurrentUser ? 'text-green-600' : 'text-blue-600'}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <code className="text-sm font-mono text-gray-800 bg-gray-100 px-2 py-1 rounded truncate max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg">
                          {adminPrincipal}
                        </code>
                        <button
                          onClick={() => copyToClipboard(adminPrincipal)}
                          className="p-1 text-gray-500 hover:text-gray-700 transition-colors shrink-0"
                          title="Copy principal ID"
                        >
                          {copied === adminPrincipal ? (
                            <Check className="h-4 w-4 text-green-600" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                      {isCurrentUser && (
                        <span className="text-xs text-green-600 font-medium">You</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 shrink-0">
                    {isCurrentUser ? (
                      <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                        Current User
                      </span>
                    ) : (
                      <button
                        onClick={() => setConfirmRemove(adminPrincipal)}
                        disabled={isRemovingAdmin}
                        className="flex items-center space-x-1 bg-red-600 text-white py-1 px-3 rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                      >
                        <UserMinus className="h-3 w-3" />
                        <span>Remove</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Admins Found</h3>
            <p className="text-gray-600 mb-4">
              The admin list appears to be empty. The first user to log in will automatically receive admin rights.
            </p>
          </div>
        )}
      </div>

      {/* Add Admin Form */}
      {showAddForm && (
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
          <div className="flex items-center space-x-3 mb-6">
            <UserPlus className="h-6 w-6 text-green-600" />
            <h3 className="text-xl font-semibold text-gray-900">Add New Admin</h3>
          </div>

          <form onSubmit={handleAddAdmin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Internet Identity Principal ID
              </label>
              <input
                type="text"
                value={newAdminPrincipal}
                onChange={(e) => setNewAdminPrincipal(e.target.value)}
                placeholder="Enter the Internet Identity principal ID"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm font-mono"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                The principal ID is a unique identifier from Internet Identity (e.g., rdmx6-jaaaa-aaaah-qcaiq-cai)
              </p>
            </div>

            <div className="flex space-x-3">
              <button
                type="submit"
                disabled={isAddingAdmin || !newAdminPrincipal.trim()}
                className="flex-1 bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center space-x-2"
              >
                <UserPlus className="h-5 w-5" />
                <span>{isAddingAdmin ? 'Adding Admin...' : 'Add Admin'}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false);
                  setNewAdminPrincipal('');
                }}
                className="flex-1 bg-gray-500 text-white py-3 px-6 rounded-lg hover:bg-gray-600 transition-colors font-medium"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Security Guidelines */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <div className="flex items-start space-x-3">
          <AlertTriangle className="h-6 w-6 text-yellow-600 mt-0.5 shrink-0" />
          <div>
            <h3 className="text-lg font-semibold text-yellow-900 mb-4">Security Guidelines & Admin Management</h3>
            <div className="space-y-2 text-sm text-yellow-800">
              <p>• Only assign admin roles to trusted users who need moderation capabilities</p>
              <p>• Admins can edit, delete, and moderate all reports in the system</p>
              <p>• Admin actions are logged for accountability and audit purposes</p>
              <p>• You cannot remove yourself as an admin - ask another admin to do this if needed</p>
              <p>• Verify the principal ID carefully before adding new admins</p>
              <p>• Regularly review the admin list and remove access for users who no longer need it</p>
              <p><strong>• Admin Reset:</strong> If the admin list is empty, the first user to log in will automatically receive admin rights</p>
              <p><strong>• Domain-specific:</strong> Admin rights may be tracked per domain (custom domain vs canister domain)</p>
              <p><strong>• Secure Backend:</strong> All admin management operations are now handled by dedicated backend methods with proper authentication</p>
            </div>
          </div>
        </div>
      </div>

      {/* How to Find Principal ID */}
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

      {/* Remove Confirmation Modal */}
      {confirmRemove && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="bg-red-100 p-2 rounded-full">
                <Trash2 className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Remove Admin</h3>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-600 mb-4">
                Are you sure you want to remove admin access for this user? This action cannot be undone.
              </p>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <div className="flex items-start space-x-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 shrink-0" />
                  <div className="text-sm text-yellow-800">
                    <p className="font-medium">Principal ID:</p>
                    <code className="text-xs font-mono bg-yellow-100 px-2 py-1 rounded break-all">
                      {confirmRemove}
                    </code>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={() => handleRemoveAdmin(confirmRemove)}
                disabled={isRemovingAdmin}
                className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center space-x-2"
              >
                <Trash2 className="h-4 w-4" />
                <span>{isRemovingAdmin ? 'Removing...' : 'Remove Admin'}</span>
              </button>
              <button
                onClick={() => setConfirmRemove(null)}
                disabled={isRemovingAdmin}
                className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 disabled:opacity-50 transition-colors font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
