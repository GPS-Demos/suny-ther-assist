type Status = 'strong' | 'effective' | 'moderate' | 'struggling' | 'weak' | 'ineffective' | 'calm' | 'anxious' | 'distressed' | 'dissociated' | 'engaged' | 'unknown';

export const getStatusColor = (status: Status): string => {
  switch (status) {
    case 'strong':
    case 'effective':
    case 'calm':
    case 'engaged':
      return 'success.main';
    case 'moderate':
    case 'struggling':
    case 'anxious':
    case 'distressed':
    case 'dissociated':
      return 'warning.main';
    case 'weak':
    case 'ineffective':
      return 'error.main';
    default:
      return 'text.secondary';
  }
};
