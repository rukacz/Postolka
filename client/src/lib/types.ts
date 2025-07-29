export interface FilterState {
  blNumber?: string;
  client?: string;
  podPol?: string;
  eta?: string;
  medlogStatus?: string;
  carrierStatus?: string;
  carrier?: string;
  pic?: string;
  unseenChanges?: 'all' | 'unseen' | 'acknowledged';
}

export type UserGroup = 'carrier' | 'medlog';

export interface NavigationState {
  currentScreen: 'list' | 'detail';
  selectedBL?: string;
  returnFilters?: FilterState;
}

export type Priority = 'high' | 'medium' | 'low';
export type CarrierStatus = 'MIPS Send' | 'Pre-Order' | 'Confirmed' | 'In Transit' | 'At Terminal' | 'Ready for Pickup' | 'Delivered' | 'Cancelled';
export type MedlogStatus = 'New' | 'In Progress' | 'Documentation Ready' | 'Customs Cleared' | 'Released' | 'Completed' | 'On Hold';
export type BLStatus = 'Draft' | 'In Progress' | 'Delivered' | 'Issues' | 'Confirmed' | 'Attention Required';
export type JobType = 'Import' | 'Export';
export type RouteStep = 'W' | 'D' | 'C' | 'R';
