import React, { useState } from 'react';
import { Users, Plus, Trash2, Shield, AlertTriangle, CheckCircle, Copy, User } from 'lucide-react';
import { useGetAdmins, useAddAdmin, useRemoveAdmin } from '../hooks/useQueries';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { Principal } from '@dfinity/principal';

export function AdminUserManagement() {
  const { identity } = useInternetIdentity();
  const { data: admins, isLoading: isLoadingAdmins } = useGetAdmins();
  const { mutate: addAdmin, isPending: isAddingAdmin } = useAddAdmin();
  const { mutate: removeAdmin, isPending: isRemovingAdmin } = useRemoveAdmin();
  
  const [newAdminPrincipal, setNewAdminPrincipal] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validatePrincipal = (principalString: string): boolean => {
    try {
      Principal.fromText(principalString);
      return true;
    } catch {
      return false;
    }
  };

  const handleAddAdmin = () => {
    const trimmedPrincipal = newAdminPrincipal.trim();
    
    if (!trimmedPrincipal) {
      setErrors({ principal: 'Principal ID is required' });
      return;
    }

    if (!validatePrincipal(trimmedPrincipal)) {
      setErrors({ principal: 'Invalid principal ID format' });
      return;
    }

    const principal = Principal.fromText(trimmedPrincipal);
    
    // Check if principal is already an admin
    if (admins?.some(admin => admin.toString() === principal.toString())) {
      setErrors({ principal: 'This user is already an admin' });
      return;
    }

    if (confirm(`Are you sure you want to grant admin rights to:\n${trimmedPrincipal}`)) {
      addAdmin(principal, {
        onSuccess: () => {
          setNewAdminPrincipal('');
          setShowAddForm(false);
          setErrors({});
          alert('Admin added successfully!');
        },
        onError: (error) => {
          console.error('Error adding admin:', error);
          const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
          if (errorMessage.includes('Unauthorized')) {
            alert('You do not have permission to add admins.');
          } else {
            alert('Failed to add admin. Please try again.');
          }
        }
      });
    }
  };

  const handleRemoveAdmin = (adminPrincipal: Principal) => {
    const principalString = adminPrincipal.toString();
    
    // Prevent self-removal
    if (identity && adminPrincipal.toString() === identity.getPrincipal().toString()) {
      alert('You cannot remove yourself as an admin.');
      return;
    }

    setConfirmRemove(principalString);
  };

  const confirmRemoveAdmin = () => {
    if (!confirmRemove) return;

    const principal = Principal.fromText(confirmRemove);
    
    removeAdmin(principal, {
      onSuccess: () => {
        setConfirmRemove(null);
        alert('Admin removed successfully!');
      },
      onError: (error) => {
        console.error('Error removing admin:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        if (errorMessage.includes('Unauthorized')) {
          alert('You do not have permission to remove admins.');
        } else if (errorMessage.includes('Cannot remove yourself')) {
          alert('You cannot remove yourself as an admin.');
        } else {
          alert('Failed to remove admin. Please try again.');
        }
        setConfirmRemove(null);
      }
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      alert('Principal ID copied to clipboard!');
    }).catch(() => {
      alert('Failed to copy to clipboard');
    });
  };

  return (
    <div className="space-y-6">
      {/* Current User Info */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center space-x-3 mb-4">
          <User className="h-6 w-6 text-blue-600" />
          <h2 className="text-xl font-bold text-gray-900">Your Admin Account</h2>
        </div>
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-900">Your Principal ID</p>
              <p className="font-mono text-xs text-blue-700 break-all">
                {identity?.getPrincipal().toString()}
              </p>
            </div>
            <button
              onClick={() => copyToClipboard(identity?.getPrincipal().toString() || '')}
              className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 transition-colors"
              title="Copy Principal ID"
            >
              <Copy className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Admin Management */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <Shield className="h-6 w-6 text-red-600" />
            <h2 className="text-xl font-bold text-gray-900">Admin Management</h2>
          </div>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Add Admin</span>
          </button>
        </div>

        {/* Add Admin Form */}
        {showAddForm && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-gray-900 mb-3">Add New Admin</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Principal ID *
                </label>
                <input
                  type="text"
                  value={newAdminPrincipal}
                  onChange={(e) => {
                    setNewAdminPrincipal(e.target.value);
                    setErrors({});
                  }}
                  placeholder="Enter the Internet Identity principal ID"
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm ${
                    errors.principal ? 'border-red-500' : 'border-gray-300'
                  }`}
                  disabled={isAddingAdmin}
                />
                {errors.principal && (
                  <p className="text-red-500 text-sm mt-1">{errors.principal}</p>
                )}
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={handleAddAdmin}
                  disabled={isAddingAdmin || !newAdminPrincipal.trim()}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  {isAddingAdmin ? 'Adding...' : 'Add Admin'}
                </button>
                <button
                  onClick={() => {
                    setShowAddForm(false);
                    setNewAdminPrincipal('');
                    setErrors({});
                  }}
                  className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Current Admins List */}
        <div>
          <h3 className="font-semibold text-gray-900 mb-4">Current Admins ({admins?.length || 0})</h3>
          
          {isLoadingAdmins ? (
            <div className="text-center py-8">
              <Shield className="h-8 w-8 text-red-500 mx-auto mb-2 animate-pulse" />
              <p className="text-gray-600">Loading admin list...</p>
            </div>
          ) : !admins || admins.length === 0 ? (
            <div className="text-center py-8">
              <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-gray-900 mb-2">No Admins Found</h4>
              <p className="text-gray-600">No admin accounts are currently configured.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {admins.map((admin) => {
                const isCurrentUser = identity && admin.toString() === identity.getPrincipal().toString();
                
                return (
                  <div
                    key={admin.toString()}
                    className={`flex items-center justify-between p-4 border rounded-lg ${
                      isCurrentUser ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-full ${isCurrentUser ? 'bg-blue-100' : 'bg-gray-100'}`}>
                        <Shield className={`h-5 w-5 ${isCurrentUser ? 'text-blue-600' : 'text-gray-600'}`} />
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <p className="font-mono text-sm text-gray-900 break-all">
                            {admin.toString()}
                          </p>
                          <button
                            onClick={() => copyToClipboard(admin.toString())}
                            className="text-gray-500 hover:text-gray-700 transition-colors"
                            title="Copy Principal ID"
                          >
                            <Copy className="h-4 w-4" />
                          </button>
                        </div>
                        {isCurrentUser && (
                          <p className="text-sm text-blue-600 font-medium">You</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {isCurrentUser ? (
                        <span className="text-sm text-blue-600 font-medium">Current User</span>
                      ) : (
                        <button
                          onClick={() => handleRemoveAdmin(admin)}
                          disabled={isRemovingAdmin}
                          className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium flex items-center space-x-1"
                        >
                          <Trash2 className="h-3 w-3" />
                          <span>Remove</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Security Guidelines */}
        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start space-x-2">
            <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-yellow-800">
              <p className="font-semibold mb-1">Security Guidelines:</p>
              <ul className="space-y-1">
                <li>• Only grant admin access to trusted users</li>
                <li>• Regularly review admin permissions</li>
                <li>• You cannot remove yourself as an admin</li>
                <li>• Admin actions are logged for security auditing</li>
                <li>• Use Internet Identity principals for secure authentication</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Remove Admin Confirmation Modal */}
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
                Are you sure you want to remove admin rights from this user? This action cannot be undone.
              </p>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <div className="flex items-start space-x-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 shrink-0" />
                  <div className="text-sm text-yellow-800">
                    <p className="font-medium">Principal ID:</p>
                    <p className="font-mono break-all">{confirmRemove}</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={confirmRemoveAdmin}
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
