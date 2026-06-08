export interface AssignmentRequest {
  orderId: string;
  driverId: string;
  priority: number;
  notes?: string;
}

export interface AssignmentResponse {
  publicId: string;
  status: string;
  message: string;
}
