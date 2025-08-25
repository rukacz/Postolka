export interface FilterState {
  client?: string[];
  direction?: string[];  // POD/POL filter
  eta?: string;
  medlogStatus?: string[];
  carrierStatus?: string[];
  carrier?: string[];
  pic?: string[];
  location?: string;  // Changed from 'unloadCity'
  containerDateFrom?: string;  // Changed from 'unloadDateFrom'
  containerDateTo?: string;    // Changed from 'unloadDateTo'
  hasDangerous?: boolean;
  dgFilter?: boolean;
  onlyEdited?: boolean;
  changedOnly?: boolean;
  newTrain?: boolean;
  deliveryNotPossible?: boolean;
  importOnly?: boolean;
  exportOnly?: boolean;
}

export type UserGroup = 'carrier' | 'medlog';

export interface NavigationState {
  currentScreen: 'list' | 'detail';
  selectedBL?: string;
  returnFilters?: FilterState;
}

export type Priority = 'high' | 'medium' | 'low';
export type CarrierStatus = 'Pre-Order' | 'MIPS Send' | 'Cancelled' | 'Do Not Release';
export type MedlogStatus = 'New' | 'Approved' | 'Rejected' | 'Changed';
export type BLStatus = 'Draft' | 'In Progress' | 'Delivered' | 'Issues' | 'Confirmed' | 'Attention Required';
export type JobType = 'Import' | 'Export';
export type RouteStep = 'W' | 'D' | 'C' | 'R';
