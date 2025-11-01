export type Role = "breeder" | "seeker" | "shelter" | "vet";

export type Pet = {
  id: string;
  name: string;
  species: "dog" | "cat";
  breed?: string;
  ageMonths?: number;
  sex?: "male" | "female";
  isUrgent?: boolean;
  forAdoption?: boolean;
  forSale?: boolean;
  priceEUR?: number;
  images: string[];
  health?: string[];
  location?: string;
  coords?: { lat: number; lon: number };
};

export type DiscoveryFilters = {
  species: "dog" | "cat" | "both";
  adoptSale: "any" | "adopt" | "sale";
  urgentOnly: boolean;
};