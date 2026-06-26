export type RailItemStatus = 'New' | 'In Work' | 'Waiting' | 'On Hold' | 'Closed';
export type CustomColumnDataType = 'text' | 'date' | 'dropdown' | 'person' | 'number' | 'yes_no' | 'link';
export type NotificationType = 'due_soon_7' | 'due_soon_2' | 'overdue' | 'assigned' | 'status_changed';

export interface Company {
  id: string;
  name: string;
  created_at: string;
}

export interface Rail {
  id: string;
  company_id: string;
  initiative_name: string;
  created_at: string;
}

export interface RailItem {
  id: string;
  rail_id: string;
  priority: 1 | 2 | 3;
  action: string;
  owner: string;
  notes: string;
  due_date: string | null;
  status: RailItemStatus;
  last_update: string;
  sort_order: number | null;
  created_at: string;
}

export interface CustomColumn {
  id: string;
  label: string;
  data_type: CustomColumnDataType;
  dropdown_options: string[] | null;
  display_order: number;
  created_at: string;
}

export interface CompanyColumnVisibility {
  id: string;
  company_id: string;
  custom_column_id: string;
  hidden: boolean;
}

export interface ItemCustomValue {
  id: string;
  rail_item_id: string;
  custom_column_id: string;
  value: unknown;
}

export interface Notification {
  id: string;
  rail_item_id: string;
  type: NotificationType;
  owner: string | null;
  read: boolean;
  created_at: string;
}

export interface InviteToken {
  id: string;
  token: string;
  label: string | null;
  created_at: string;
  revoked: boolean;
}

// Joined types used by the UI
export interface RailWithCompany extends Rail {
  company: Company;
}

export interface RailItemWithCustomValues extends RailItem {
  item_custom_values: ItemCustomValue[];
}

// Supabase Database generic type (simplified — expand if using supabase gen types)
export interface Database {
  public: {
    Tables: {
      companies: { Row: Company; Insert: Omit<Company, 'id' | 'created_at'>; Update: Partial<Omit<Company, 'id'>> };
      rails: { Row: Rail; Insert: Omit<Rail, 'id' | 'created_at'>; Update: Partial<Omit<Rail, 'id'>> };
      rail_items: { Row: RailItem; Insert: Omit<RailItem, 'id' | 'last_update' | 'created_at'>; Update: Partial<Omit<RailItem, 'id'>> };
      custom_columns: { Row: CustomColumn; Insert: Omit<CustomColumn, 'id' | 'created_at'>; Update: Partial<Omit<CustomColumn, 'id'>> };
      company_column_visibility: { Row: CompanyColumnVisibility; Insert: Omit<CompanyColumnVisibility, 'id'>; Update: Partial<Omit<CompanyColumnVisibility, 'id'>> };
      item_custom_values: { Row: ItemCustomValue; Insert: Omit<ItemCustomValue, 'id'>; Update: Partial<Omit<ItemCustomValue, 'id'>> };
      notifications: { Row: Notification; Insert: Omit<Notification, 'id' | 'created_at'>; Update: Partial<Omit<Notification, 'id'>> };
      invite_tokens: { Row: InviteToken; Insert: Omit<InviteToken, 'id' | 'created_at'>; Update: Partial<Omit<InviteToken, 'id'>> };
    };
  };
}
