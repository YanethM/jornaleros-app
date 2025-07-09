export interface JobOfferData {
    id: string;
    title: string;
    description: string;
    salary: number;
    city: string;
    state: string;
    country: string;
    village: string;
    employer: {
      id: string;
      organization: string;
      city: string;
      state: string;
      user: any;
    };
    farm: {
      id: string;
      name: string;
    };
    cropType: {
      id: string;
      name: string;
    };
    phase: {
      id: string;
      name: string;
    };
    displayLocation: {
      city: string;
      country: string;
      department: string;
      state: string;
      village: string;
    };
    status: string;
    startDate: string;
    endDate: string;
    duration: string;
    paymentType: string;
    paymentMode: string;
    includesFood: boolean;
    includesLodging: boolean;
    applicationsCount: number;
    createdAt?: string;
    workersNeeded?: number;
  }
  
  export interface CropType {
    id: string;
    name: string;
    description?: string;
    imageUrl?: string;
    color?: string;
    emoji?: string;
  }
  
  export interface JobOffersResponse {
    jobOffers: JobOfferData[];
    totalCount: number;
    success: boolean;
  }
  
  export interface CropTypesResponse {
    cropTypes: CropType[];
    success: boolean;
  }
  