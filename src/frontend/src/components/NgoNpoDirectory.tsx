import React, { useState } from 'react';
import { Search, Mail, Phone, MapPin, Building2, Globe, FileText, Filter, Calendar, Star } from 'lucide-react';
import { useGetNgoNpoDirectory, useGetMyNgoNpoProfile, useIsAdmin } from '../hooks/useQueries';
import { useFileUrl } from '../blob-storage/FileStorage';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useNavigate } from '@tanstack/react-router';
import { NgoNpo } from '../backend';

export function NgoNpoDirectory() {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'joinDate' | 'impactScore'>('impactScore');
  const { data: ngoNpos, isLoading } = useGetNgoNpoDirectory();
  const { identity } = useInternetIdentity();
  const { data: myNgoNpoProfile } = useGetMyNgoNpoProfile();
  const { data: isAdmin } = useIsAdmin();
  const navigate = useNavigate();

  const filteredNgoNpos = ngoNpos
    ?.filter(ngoNpo => 
      ngoNpo.organizationName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ngoNpo.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ngoNpo.address.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.organizationName.localeCompare(b.organizationName);
        case 'joinDate':
          const aDate = a.approvalTimestamp ? Number(a.approvalTimestamp) : Number(a.registrationDate);
          const bDate = b.approvalTimestamp ? Number(b.approvalTimestamp) : Number(b.registrationDate);
          return bDate - aDate;
        case 'impactScore':
          return Number(b.impactScore) - Number(a.impactScore);
        default:
          return 0;
      }
    }) || [];

  const isLoggedInNgoNpo = !!identity && !!myNgoNpoProfile;

  const handleApplyButtonClick = () => {
    if (isLoggedInNgoNpo) {
      navigate({ to: '/ngo-npo/dashboard' });
    } else {
      navigate({ to: '/ngo-npo/register' });
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <Building2 className="h-12 w-12 text-blue-500 mx-auto mb-4 animate-pulse" />
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Loading NGO/NPO Directory...</h1>
          <p className="text-gray-600">Please wait while we fetch the organization information.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="text-center mb-6">
          <Building2 className="h-12 w-12 text-blue-500 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 mb-2">NGO/NPO Directory</h1>
          <p className="text-gray-600">
            Discover registered NGOs and NPOs working on civic issues across India.
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search organizations by name, description, or location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Filter className="h-5 w-5 text-gray-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'name' | 'joinDate' | 'impactScore')}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="impactScore">Sort by Impact Score</option>
              <option value="name">Sort by Name</option>
              <option value="joinDate">Sort by Join Date</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-200">
          <div className="text-center">
            <h3 className="text-2xl font-bold text-blue-600">{ngoNpos?.length || 0}</h3>
            <p className="text-sm text-gray-600">Registered Organizations</p>
          </div>
          <div className="text-center">
            <h3 className="text-2xl font-bold text-purple-600">
              {ngoNpos?.reduce((sum, n) => sum + Number(n.impactScore), 0) || 0}
            </h3>
            <p className="text-sm text-gray-600">Total Impact Score</p>
          </div>
          <div className="text-center">
            <h3 className="text-2xl font-bold text-green-600">100%</h3>
            <p className="text-sm text-gray-600">Verified Status</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredNgoNpos.map((ngoNpo) => (
          <NgoNpoCard 
            key={ngoNpo.id} 
            ngoNpo={ngoNpo}
            isAdmin={isAdmin || false}
          />
        ))}
      </div>

      {filteredNgoNpos.length === 0 && !isLoading && (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No organizations found</h3>
          <p className="text-gray-600">
            {ngoNpos?.length === 0 
              ? 'No NGOs/NPOs have been approved yet.'
              : 'Try adjusting your search terms or filters.'
            }
          </p>
        </div>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-8 text-center">
        <Building2 className="h-8 w-8 text-blue-500 mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-blue-900 mb-2">Want to register your NGO/NPO?</h3>
        <p className="text-blue-700 mb-4">
          {isLoggedInNgoNpo 
            ? 'Access your organization dashboard to manage your profile and track impact.'
            : 'Join our platform to connect with citizens and track your organization\'s civic impact.'
          }
        </p>
        <button
          onClick={handleApplyButtonClick}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium inline-block"
        >
          {isLoggedInNgoNpo ? 'Go to NGO/NPO Dashboard' : 'Register Your Organization'}
        </button>
      </div>
    </div>
  );
}

function NgoNpoCard({ ngoNpo, isAdmin }: { ngoNpo: NgoNpo; isAdmin: boolean }) {
  const { data: logoUrl } = useFileUrl(ngoNpo.logoPath);

  const joinDate = ngoNpo.approvalTimestamp 
    ? Number(ngoNpo.approvalTimestamp) / 1000000
    : Number(ngoNpo.registrationDate) / 1000000;

  const impactScore = Number(ngoNpo.impactScore);

  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-center space-x-4 mb-4">
        <div className="relative">
          {logoUrl ? (
            <img
              src={logoUrl}
              alt={`${ngoNpo.organizationName} logo`}
              className="w-16 h-16 rounded-lg object-cover border-2 border-gray-200"
            />
          ) : (
            <div className="w-16 h-16 rounded-lg bg-gray-200 flex items-center justify-center">
              <Building2 className="h-8 w-8 text-gray-400" />
            </div>
          )}
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900">{ngoNpo.organizationName}</h3>
          <p className="text-xs text-gray-500 font-mono truncate">
            {ngoNpo.principal.toString().slice(0, 12)}...
          </p>
        </div>
      </div>

      <div className="mb-4 p-3 bg-purple-50 border border-purple-200 rounded-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Star className="h-4 w-4 text-purple-600" />
            <span className="text-sm font-medium text-purple-800">Impact Score</span>
          </div>
          <span className="text-lg font-bold text-purple-900">{impactScore}</span>
        </div>
      </div>

      <div className="space-y-3 mb-4">
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-1">Mission</h4>
          <p className="text-sm text-gray-600 line-clamp-3">{ngoNpo.missionStatement}</p>
        </div>

        {ngoNpo.showContactInfo && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-700">Contact Information</h4>
            <div className="space-y-1">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Mail className="h-4 w-4 flex-shrink-0" />
                <span className="truncate">{ngoNpo.email}</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Phone className="h-4 w-4 flex-shrink-0" />
                <span>{ngoNpo.phone}</span>
              </div>
            </div>
          </div>
        )}

        {!ngoNpo.showContactInfo && !isAdmin && (
          <div className="text-xs text-gray-500 italic">
            Contact information is private
          </div>
        )}

        {!ngoNpo.showContactInfo && isAdmin && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-700">Contact (Admin View)</h4>
            <div className="space-y-1">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Mail className="h-4 w-4 flex-shrink-0" />
                <span className="truncate">{ngoNpo.email}</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Phone className="h-4 w-4 flex-shrink-0" />
                <span>{ngoNpo.phone}</span>
              </div>
            </div>
          </div>
        )}

        <div className="flex items-start space-x-2 text-sm text-gray-600">
          <MapPin className="h-4 w-4 flex-shrink-0 mt-0.5" />
          <span className="line-clamp-2">{ngoNpo.address}</span>
        </div>

        {ngoNpo.website && (
          <div className="flex items-center space-x-2 text-sm">
            <Globe className="h-4 w-4 flex-shrink-0 text-gray-600" />
            <a 
              href={ngoNpo.website} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-700 truncate"
            >
              {ngoNpo.website}
            </a>
          </div>
        )}
      </div>

      <div className="flex items-center space-x-2 text-xs text-gray-500 border-t border-gray-200 pt-3">
        <Calendar className="h-3 w-3" />
        <span>
          Registered since {new Date(joinDate).toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'long'
          })}
        </span>
      </div>

      <div className="mt-3">
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-50 text-green-600 border border-green-200">
          <Building2 className="h-3 w-3 mr-1" />
          Verified Organization
        </span>
      </div>
    </div>
  );
}
