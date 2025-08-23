import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { User, OrgRole, OrderTypeRole, CarrierType } from '@shared/schema';

interface AuthUser extends Omit<User, 'password'> {}

interface AuthContextType {
  user: AuthUser | null;
  login: (user: AuthUser) => void;
  logout: () => void;
  isAuthenticated: boolean;
  hasPermission: (permission: string) => boolean;
  getDefaultFilters: () => FilterDefaults;
  getCarrierWhitelist: () => string[];
}

interface FilterDefaults {
  carrier?: string;
  orderType?: 'Import' | 'Export';
  showImportOnly?: boolean;
  showExportOnly?: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    // Check for stored user session
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('Failed to parse stored user:', error);
        localStorage.removeItem('currentUser');
      }
    }
  }, []);

  const login = (userData: AuthUser) => {
    setUser(userData);
    localStorage.setItem('currentUser', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('currentUser');
  };

  const hasPermission = (permission: string): boolean => {
    if (!user) return false;

    switch (permission) {
      case 'edit_carrier_note':
        return user.orgRole === 'msc';
      case 'edit_medlog_note':
        return user.orgRole === 'medlog';
      case 'edit_carrier_status':
        return user.orgRole === 'msc';
      case 'edit_medlog_status':
        return user.orgRole === 'medlog';
      case 'view_msc_carriers_only':
        return user.orgRole === 'msc';
      case 'create_orders':
        return true; // All users can create orders
      case 'use_ova_string':
        return user.orderTypeRole === 'export_only' || user.orderTypeRole === null;
      case 'load_from_msc':
        return user.orderTypeRole === 'import_only' || user.orderTypeRole === null;
      default:
        return false;
    }
  };

  const getDefaultFilters = (): FilterDefaults => {
    if (!user) return {};

    const filters: FilterDefaults = {};

    // Set default carrier based on user profile
    if (user.defaultCarrier) {
      filters.carrier = user.defaultCarrier;
    }

    // Set order type defaults based on role
    if (user.orderTypeRole === 'import_only') {
      filters.showImportOnly = true;
      filters.orderType = 'Import';
    } else if (user.orderTypeRole === 'export_only') {
      filters.showExportOnly = true;
      filters.orderType = 'Export';
    }

    return filters;
  };

  const getCarrierWhitelist = (): string[] => {
    if (!user) return [];
    
    const whitelist = [...(user.carrierWhitelist || [])];
    
    // Add user's default carrier to whitelist if not already present
    if (user.defaultCarrier && !whitelist.includes(user.defaultCarrier)) {
      whitelist.unshift(user.defaultCarrier);
    }
    
    return whitelist;
  };

  const value: AuthContextType = {
    user,
    login,
    logout,
    isAuthenticated: !!user,
    hasPermission,
    getDefaultFilters,
    getCarrierWhitelist,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};