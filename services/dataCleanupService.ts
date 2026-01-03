// Service to clear all user-specific data when creating a new account
// This ensures a clean slate for new users

/**
 * Clears all user-specific data from localStorage and in-memory storage
 * This should be called when a new account is created to ensure no past data persists
 */
export const clearAllUserData = (): void => {
  try {
    // Clear all localStorage items related to user data
    const localStorageKeys = [
      'farmerAdvisoryPlan',
      'farmerAdvisoryContext',
      'farmerPricePrediction',
      'farmerPricePredictionCrop',
      // Add any other user-specific localStorage keys here
    ];

    localStorageKeys.forEach(key => {
      try {
        localStorage.removeItem(key);
      } catch (error) {
        console.warn(`Failed to remove localStorage key: ${key}`, error);
      }
    });

    // Clear all localStorage keys that might contain user data
    // This is a more aggressive cleanup - removes all keys that start with common prefixes
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        // Remove keys that are user-specific (but keep user accounts)
        if (
          key.startsWith('farmer') ||
          key.startsWith('fpo_') ||
          key.startsWith('processor_') ||
          key.startsWith('retailer_') ||
          key.startsWith('bidding_') ||
          key.startsWith('listing_') ||
          key.startsWith('soilCard_') ||
          key.includes('Advisory') ||
          key.includes('PricePrediction') ||
          key.includes('Bidding') ||
          key.includes('Listing') ||
          key.includes('Soil') ||
          key.includes('soil')
        ) {
          // Don't remove kisansetu_users as that contains all user accounts
          if (key !== 'kisansetu_users') {
            keysToRemove.push(key);
          }
        }
      }
    }

    keysToRemove.forEach(key => {
      try {
        localStorage.removeItem(key);
      } catch (error) {
        console.warn(`Failed to remove localStorage key: ${key}`, error);
      }
    });

    console.log('All user-specific data cleared from localStorage');
  } catch (error) {
    console.error('Error clearing user data:', error);
  }
};

/**
 * Clears in-memory bidding data
 */
export const clearBiddingData = (): void => {
  try {
    // Import dynamically to avoid circular dependencies
    import('./biddingService').then(module => {
      if (module.clearAllBiddingData) {
        module.clearAllBiddingData();
        console.log('Bidding data cleared from memory');
      }
    }).catch(error => {
      console.warn('Could not clear bidding data:', error);
    });
  } catch (error) {
    console.error('Error clearing bidding data:', error);
  }
};

/**
 * Clears all soil health card data from localStorage
 */
export const clearSoilHealthCardData = (): void => {
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith('soilCard_') || key.includes('soilCard'))) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => {
      try {
        localStorage.removeItem(key);
      } catch (error) {
        console.warn(`Failed to remove localStorage key: ${key}`, error);
      }
    });
    console.log('Soil health card data cleared');
  } catch (error) {
    console.error('Error clearing soil health card data:', error);
  }
};

/**
 * Clears all FPO-specific data (warehouses, finances, connected farmers, vehicles, sales offers)
 */
export const clearFPOData = (fpoId?: string): void => {
  try {
    // Clear FPO sales offers
    import('./fpoProcessorSalesService').then(module => {
      if (fpoId && module.clearFPOSalesOffers) {
        module.clearFPOSalesOffers(fpoId);
      } else if (module.clearAllFPOSalesOffers) {
        module.clearAllFPOSalesOffers();
      }
      console.log('FPO sales offers cleared');
    }).catch(error => {
      console.warn('Could not clear FPO sales offers:', error);
    });

    // Clear FPO-specific localStorage keys
    const fpoKeys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (
        key.startsWith('fpo_') ||
        key.includes('FPO') ||
        key.includes('warehouse') ||
        key.includes('Warehouse') ||
        key.includes('fleet') ||
        key.includes('Fleet') ||
        key.includes('vehicle') ||
        key.includes('Vehicle') ||
        key.includes('connectedFarmer') ||
        key.includes('ConnectedFarmer')
      )) {
        fpoKeys.push(key);
      }
    }
    fpoKeys.forEach(key => {
      try {
        localStorage.removeItem(key);
      } catch (error) {
        console.warn(`Failed to remove localStorage key: ${key}`, error);
      }
    });
    console.log('FPO-specific data cleared from localStorage');
  } catch (error) {
    console.error('Error clearing FPO data:', error);
  }
};

/**
 * Main function to clear all past data when creating a new account
 * @param role - Optional role to clear role-specific data
 * @param userId - Optional userId to clear user-specific data
 */
export const clearAllPastData = (role?: string, userId?: string): void => {
  clearAllUserData();
  clearBiddingData();
  clearSoilHealthCardData();
  
  // Clear role-specific data
  if (role === 'fpo' || role === 'FPO') {
    clearFPOData(userId);
  }
  
  console.log('All past data cleared for new account');
};

