/**
 * Utility functions for formatting data
 */

/**
 * Get the user's preferred currency from localStorage
 * Defaults to USD if not set
 */
export function getUserCurrency(): string {
  if (typeof window === 'undefined') {
    return 'USD'; // Default for server-side rendering
  }
  
  try {
    const savedPreferences = localStorage.getItem('appPreferences');
    if (savedPreferences) {
      const { defaultCurrency } = JSON.parse(savedPreferences);
      return defaultCurrency || 'USD';
    }
  } catch (error) {
    console.error('Error retrieving currency preference:', error);
  }
  
  return 'USD'; // Default fallback
}

/**
 * Format a number as currency based on user preferences
 */
export function formatCurrency(amount: string | number): string {
  if (typeof amount === 'string') {
    // Remove non-numeric characters except decimal point
    amount = amount.replace(/[^0-9.]/g, '');
  }
  
  const numAmount = parseFloat(amount.toString());
  if (isNaN(numAmount)) return '$0.00';
  
  const currency = getUserCurrency();
  
  // Get locale based on currency
  const locale = currency === 'EUR' ? 'de-DE' : 'en-US';
  
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
  }).format(numAmount);
}

/**
 * Format a date string based on user preferences
 */
export function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  
  try {
    let dateFormat = 'MM/DD/YYYY'; // Default
    
    // Get user preference if available
    if (typeof window !== 'undefined') {
      const savedPreferences = localStorage.getItem('appPreferences');
      if (savedPreferences) {
        const { dateFormat: userDateFormat } = JSON.parse(savedPreferences);
        if (userDateFormat) {
          dateFormat = userDateFormat;
        }
      }
    }
    
    const date = new Date(dateStr);
    
    // Return formatted date based on user preference
    switch (dateFormat) {
      case 'DD/MM/YYYY':
        return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
      case 'YYYY-MM-DD':
        return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
      case 'MM/DD/YYYY':
      default:
        return `${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')}/${date.getFullYear()}`;
    }
  } catch (error) {
    console.error('Error formatting date:', error);
    return dateStr;
  }
} 