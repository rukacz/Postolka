import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { User } from '@shared/schema';
import type { FilterState } from '@/lib/types';

// Extended user interface with role and company information from backend
interface AuthUser extends Omit<User, 'password'> {
  roleName?: string; // Populated by getUserWithRoleAndCompany
  companyType?: string; // Populated by getUserWithRoleAndCompany
}

interface AuthContextType {
  user: AuthUser | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
  hasPermission: (permission: string) => boolean;
  getDefaultFilters: () => Partial<FilterState>;
  getCarrierWhitelist: () => string[];
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
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
    // Check if user is already logged in
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (error) {
        console.error('Failed to parse saved user:', error);
        localStorage.removeItem('user');
      }
    }
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
        return true;
      } else {
        console.error('Login failed:', response.statusText);
        return false;
      }
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('userFilters');
  };

  const hasPermission = (permission: string): boolean => {
    if (!user) return false;

    // For now, use company type if available, otherwise fall back to role-based logic
    const roleName = user.roleName || 'User';
    const companyType = user.companyType || 'Client';

    switch (permission) {
      case 'edit_carrier_note':
        return companyType === 'MSC';
      case 'edit_medlog_note':
        return companyType === 'Medlog';
      case 'edit_carrier_status':
        return companyType === 'MSC';
      case 'edit_medlog_status':
        return companyType === 'Medlog';
      case 'view_msc_carriers_only':
        return companyType === 'MSC';
      case 'create_orders':
        return true; // All users can create orders
      case 'use_ova_string':
        // This would need to be determined by role or company type
        return roleName === 'Admin' || companyType === 'Medlog';
      case 'load_from_msc':
        // This would need to be determined by role or company type
        return roleName === 'Admin' || companyType === 'Medlog';
      case 'admin_access':
        return roleName === 'Admin';
      case 'medlog_access':
        return companyType === 'Medlog';
      case 'msc_access':
        return companyType === 'MSC';
      case 'client_access':
        return companyType === 'Client';
      default:
        return false;
    }
  };

  const getDefaultFilters = (): Partial<FilterState> => {
    if (!user) return {};

    // Note: We don't set any hardcoded filter values here
    // The frontend will dynamically filter based on company types from API
    // MSC users will see only MSC companies, Medlog users will see all
    // This prevents hardcoded values that might not match database data
    
    return {};
  };

  const getCarrierWhitelist = (): string[] => {
    if (!user) return [];
    
    const companyType = user.companyType || 'Client';
    
    if (companyType === 'MSC') {
      // MSC users can only see MSC carriers
      return ['MSC CZ', 'MSC SK'];
    } else if (companyType === 'Medlog') {
      // Medlog users can see all carriers
      return ['MSC CZ', 'MSC SK', 'ONE', 'Hapag-Lloyd'];
    } else if (companyType === 'Client') {
      // Client users can see all carriers
      return ['MSC CZ', 'MSC SK', 'ONE', 'Hapag-Lloyd'];
    }
    
    return [];
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