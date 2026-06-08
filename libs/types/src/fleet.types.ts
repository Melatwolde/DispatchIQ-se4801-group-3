export interface Vehicle {
  publicId: string;
  name: string;
  region: string;
}

export interface FleetDto {
  publicId: string;
  name: string;
  region: string;
}

export interface UpdateVehicleInput {
  name?: string;
  region?: string;
}
