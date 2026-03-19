import React from 'react';
import { useNavigate, useRouterState } from '@tanstack/react-router';
import { LanguageDropdown } from './LanguageDropdown';
import { MenuDropdown } from './MenuDropdown';
import { useLanguage } from '../contexts/LanguageContext';
import { useGetCurrentLogo, useIsAdmin, useGetMyVolunteerProfile, useGetMyNgoNpoProfile } from '../hooks/useQueries';
import { useLocationRefresh } from '../contexts/LocationRefreshContext';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { Shield, Users, Building2, User } from 'lucide-react';

export function Header() {
  const { t } = useLanguage();
  const { data: currentLogo, isLoading: isLoadingLogo } = useGetCurrentLogo();
  const navigate = useNavigate();
  const routerState = useRouterState();
  const { triggerLocationRefresh } = useLocationRefresh();
  const { identity } = useInternetIdentity();
  
  // Get user roles
  const { data: isAdmin } = useIsAdmin();
  const { data: volunteerProfile } = useGetMyVolunteerProfile();
  const { data: ngoNpoProfile } = useGetMyNgoNpoProfile();
  
  // Determine active mode
  const isApprovedVolunteer = volunteerProfile?.approved || false;
  const isApprovedNgoNpo = ngoNpoProfile?.approved || false;
  
  // Use the new Logo_Civicreport-3.png as the default placeholder
  const placeholderLogo = (
    <img 
      src="/assets/Logo_Civicreport-3.png"
      alt="CivicReport Logo" 
      className="h-10 w-10 object-contain"
    />
  );

  const handleLogoClick = () => {
    const isAlreadyHome = routerState.location.pathname === '/';
    navigate({ to: '/' });
    // Trigger location refresh when navigating to homepage
    if (isAlreadyHome) {
      // If already on homepage, trigger refresh immediately
      triggerLocationRefresh();
    } else {
      // If navigating from another page, trigger after a short delay to ensure component is mounted
      setTimeout(() => {
        triggerLocationRefresh();
      }, 100);
    }
  };

  const handleTitleClick = () => {
    const isAlreadyHome = routerState.location.pathname === '/';
    navigate({ to: '/' });
    // Trigger location refresh when navigating to homepage
    if (isAlreadyHome) {
      // If already on homepage, trigger refresh immediately
      triggerLocationRefresh();
    } else {
      // If navigating from another page, trigger after a short delay to ensure component is mounted
      setTimeout(() => {
        triggerLocationRefresh();
      }, 100);
    }
  };

  // Render mode indicator with liquid glass effect - positioned below logo with slight overlap
  const renderModeIndicator = () => {
    if (isAdmin) {
      return (
        <div className="mode-indicator-glass mode-indicator-admin">
          <Shield className="w-2.5 h-2.5 flex-shrink-0" />
          <span>Admin</span>
        </div>
      );
    }

    if (isApprovedVolunteer) {
      return (
        <div className="mode-indicator-glass mode-indicator-volunteer">
          <Users className="w-2.5 h-2.5 flex-shrink-0" />
          <span>Volunteer</span>
        </div>
      );
    }

    if (isApprovedNgoNpo) {
      return (
        <div className="mode-indicator-glass mode-indicator-ngo">
          <Building2 className="w-2.5 h-2.5 flex-shrink-0" />
          <span>NGO/NPO</span>
        </div>
      );
    }

    // Show Citizen Mode for non-authenticated users or users without special roles
    return (
      <div className="mode-indicator-glass mode-indicator-citizen">
        <User className="w-2.5 h-2.5 flex-shrink-0" />
        <span>Citizen</span>
      </div>
    );
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white shadow-md border-b border-gray-200">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          {/* Logo with Mode Indicator Below and Title */}
          <div className="flex items-center space-x-3 min-w-0 flex-1">
            {/* Logo with Mode Indicator positioned below with slight overlap */}
            <div className="relative flex-shrink-0">
              <div 
                className="flex items-center justify-center w-12 h-12 cursor-pointer hover:opacity-80 transition-opacity"
                onClick={handleLogoClick}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleLogoClick();
                  }
                }}
                aria-label="Navigate to homepage"
              >
                {isLoadingLogo ? (
                  placeholderLogo
                ) : currentLogo && (currentLogo as string).trim() !== '' ? (
                  <img 
                    src={currentLogo as string}
                    alt="App Logo" 
                    className="h-10 w-10 object-contain"
                    onError={(e) => {
                      // If logo fails to load, show placeholder
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      const placeholder = document.createElement('img');
                      placeholder.src = '/assets/Logo_Civicreport-3.png';
                      placeholder.alt = 'CivicReport Logo';
                      placeholder.className = 'h-10 w-10 object-contain';
                      target.parentElement!.appendChild(placeholder);
                    }}
                  />
                ) : (
                  placeholderLogo
                )}
              </div>
              
              {/* Mode indicator with liquid glass effect positioned below logo with slight overlap */}
              <div className="absolute -bottom-1.5 left-1/2 transform -translate-x-1/2 z-10">
                {renderModeIndicator()}
              </div>
            </div>
            
            {/* Title with vibrant blue color and Public Beta label positioned above */}
            <div 
              className="text-left cursor-pointer hover:opacity-80 transition-opacity min-w-0 relative flex-1"
              onClick={handleTitleClick}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleTitleClick();
                }
              }}
              aria-label="Navigate to homepage"
            >
              {/* Public Beta label positioned above the title */}
              <div className="flex items-center justify-start mb-0.5">
                <span className="inline-flex items-center px-1 sm:px-1.5 py-0.5 text-[7px] sm:text-[9px] font-semibold text-blue-600 bg-blue-50 border border-blue-200 rounded whitespace-nowrap leading-tight">
                  Public Beta
                </span>
              </div>
              
              {/* Main title */}
              <h1 className="text-lg sm:text-xl font-bold text-blue-600 truncate leading-tight">{t('header.title')}</h1>
              
              {/* Subtitle */}
              <p className="text-[10px] sm:text-[11px] text-gray-600 leading-tight truncate">{t('header.subtitle')}</p>
            </div>
          </div>

          {/* Dropdown Menus - properly aligned */}
          <div className="flex items-center space-x-2 flex-shrink-0">
            <MenuDropdown />
            <LanguageDropdown />
          </div>
        </div>
      </div>
    </header>
  );
}
