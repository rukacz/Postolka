export interface FilterState {
  blNumber?: string;
  client?: string;
  podPol?: string;
  eta?: string;
  medlogStatus?: string;
  carrierStatus?: string;
  carrier?: string;
  container?: string;
  train?: string;
}

export interface NavigationState {
  currentScreen: 'list' | 'detail';
  selectedBL?: string;
  returnFilters?: FilterState;
}

export type Priority = 'high' | 'medium' | 'low';
export type CarrierStatus = 'Pre-Order' | 'MIPS Send' | 'Do Not Release' | 'Cancelled';
export type MedlogStatus = 'New' | 'Approved' | 'Rejected' | 'Changed';
export type BLStatus = 'Draft' | 'In Progress' | 'Delivered' | 'Issues' | 'Confirmed' | 'Attention Required';
export type JobType = 'Import' | 'Export';
export type RouteStep = 'W' | 'D' | 'C' | 'R';
