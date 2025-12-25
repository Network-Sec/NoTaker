export interface Experience {
  id: string;
  title: string;
  company: string;
  logoUrl?: string;
  startDate: string;
  endDate: string; // or 'Present'
  location: string;
  description: string;
}

export interface Education {
  id: string;
  school: string;
  logoUrl?: string;
  degree: string;
  fieldOfStudy: string;
  startDate: string;
  endDate: string;
}

export interface CredentialPair {
  id: string;
  key: string;
  value: string;
  isSecret?: boolean;
}

export interface Identity {
  id: string;
  firstName: string;
  lastName: string;
  username: string;
  headline: string;
  email: string;
  phone: string;
  location: string;
  about: string;
  avatarUrl: string;
  bannerUrl: string;
  experience: Experience[];
  education: Education[];
  skills: string[];
  personalCredentials: CredentialPair[]; // Personal keys/ids
  linkedVaultIds?: string[]; // IDs of SharedCredentialGroups linked to this profile
  connections: number;
}

export interface SharedCredentialGroup {
  id: string;
  name: string;
  description: string;
  pairs: CredentialPair[];
  updatedAt: string;
}

export type ViewState = 
  | { type: 'overview' }
  | { type: 'identity-detail'; id: string }
  | { type: 'creds-detail'; id: string };