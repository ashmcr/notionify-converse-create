export const ErrorTypes = {
  INVALID_REQUEST: 'INVALID_REQUEST',
  API_ERROR: 'API_ERROR',
  RATE_LIMIT: 'RATE_LIMIT',
  VALIDATION_ERROR: 'VALIDATION_ERROR'
};

export function handleError(error: any) {
  console.error('Error details:', {
    name: error.name,
    message: error.message,
    status: error.status
  });

  if (error.status === 400) {
    return {
      type: ErrorTypes.INVALID_REQUEST,
      message: 'Invalid request format',
      details: error.message
    };
  }

  if (error.status === 429) {
    return {
      type: ErrorTypes.RATE_LIMIT,
      message: 'Rate limit exceeded',
      details: error.message
    };
  }

  if (error.message?.includes('validation')) {
    return {
      type: ErrorTypes.VALIDATION_ERROR,
      message: 'Message validation failed',
      details: error.message
    };
  }

  return {
    type: ErrorTypes.API_ERROR,
    message: 'Internal server error',
    details: error.message
  };
}