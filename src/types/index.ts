export interface SteadFastOrder {
  Invoice: string;
  Name: string;
  "Contact Name": string;
  "Contact Phone": string;
  Address: string;
  Phone: string;
  Amount: string;
  Note: string;
}

export interface PathaoOrder {
  "Order No": string;
  Name: string;
  Product: string;
  Price: string;
  Address: string;
  City: string;
  "Phone No": string;
}

export type OrderType = PathaoOrder | SteadFastOrder;

export interface CourierProcessor<T> {
  processOrders(data: string[][], user: UserInfo): T[];
}

export interface UserInfo {
  name: string;
  phone: string;
  merchant_id: string;
}

export interface CurrentUser {
  name: string;
  phone?: string;
  courier: Courier | null;
  merchant_id?: string;
  url?: string;
}

export enum Courier {
  SteadFast = "SteadFast",
  Pathao = "Pathao"
}

export interface Brand {
  name: string;
  phone?: string;
  emails: string[];
  url: string;
  courier: Courier | null;
  merchant_id?: string;
}

export interface CourierOption {
  value: string;
  label: string;
  logo: any;
  coming_soon?: boolean;
}

export interface AppContextType {
  courierService: string;
  setCourierService: (courier: string) => void;
  CSVReader: any;
  zoneHover: boolean;
  setZoneHover: (hover: boolean) => void;
}

export interface CSVReaderProps {
  getRootProps: () => Record<string, any>;
  acceptedFile: File | null;
}