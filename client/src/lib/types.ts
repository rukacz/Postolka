export interface FilterState {
  client?: string;
  podPol?: string;
  eta?: string;
  medlogStatus?: string;
  carrierStatus?: string;
  carrier?: string;
  pic?: string;
  // Replaced fields
  unloadCity?: string;
  unloadDateFrom?: string;
  unloadDateTo?: string;
  // Additional filter checkboxes
  dgFilter?: boolean;
  onlyEdited?: boolean;
  newTrain?: boolean;
  deliveryNotPossible?: boolean;
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
