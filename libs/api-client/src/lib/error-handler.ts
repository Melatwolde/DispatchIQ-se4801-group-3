export class ApiError extends Error {
  constructor(
    public message: string,
    public statusCode?: number,
    public data?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export function handleApiError(error: any): never {
  console.error('[API Client Error]', {
    url: error.config?.url,
    method: error.config?.method,
    status: error.response?.status,
    data: error.response?.data,
    message: error.message,
  });

  if (error.response) {
    // Server responded with a status code that falls out of the range of 2xx
    throw new ApiError(
      error.response.data?.message || 'An error occurred during the request.',
      error.response.status,
      error.response.data
    );
  } else if (error.request) {
    // Request was made but no response was received
    throw new ApiError('No response received from server.', 0);
  } else {
    // Something happened in setting up the request
    throw new ApiError(error.message || 'Request setup error.');
  }
}
