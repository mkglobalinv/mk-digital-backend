/**
 * Centralized Role-Based Banner Visibility and Filtering Logic
 * Shared across Homepage, Dashboard, Data/Airtime purchase, and Services modules.
 */

/**
 * Checks if the current user is an active reseller.
 * @param {Object} user 
 * @returns {boolean}
 */
export const isActiveReseller = (user) => {
  if (!user) return false;
  return (
    user.role === 'reseller_admin' ||
    user.isResellerActivated === true ||
    user.resellerActivationStatus === 'active' ||
    user.apiLevel === 'reseller' ||
    user.apiLevel === 'premium'
  );
};

/**
 * Checks if the current user is a premium tier reseller.
 * @param {Object} user 
 * @returns {boolean}
 */
export const isPremiumReseller = (user) => {
  return isActiveReseller(user) && user.resellerTier === 'premium';
};

/**
 * Evaluates whether a banner or promotional advertisement card should be displayed to the user.
 * Combines explicit targetAudience routing with text-based safety heuristics.
 * 
 * @param {Object} banner 
 * @param {Object} user 
 * @returns {boolean}
 */
export const checkBannerVisibility = (banner, user) => {
  if (!banner) return false;

  const isReseller = isActiveReseller(user);
  const isPremium = isPremiumReseller(user);

  // 1. TEXT-BASED SAFETY HEURISTIC (Scrub reseller recruitment ads from active reseller views)
  const textContent = `${banner.title || ''} ${banner.description || ''} ${banner.message || ''} ${banner.text || ''}`.toLowerCase();
  
  const isRecruitmentText = 
    textContent.includes('start your own vtu') ||
    textContent.includes('start your vtu') ||
    textContent.includes('start your brand') ||
    textContent.includes('become a reseller') ||
    textContent.includes('reseller onboarding') ||
    textContent.includes('free trial') ||
    textContent.includes('white-label') ||
    textContent.includes('reseller trial');

  if (isReseller && isRecruitmentText) {
    return false; // Active resellers must never see recruitment ads
  }

  // 2. EXPLICIT AUDIENCE TARGETING LOGIC
  const audience = banner.targetAudience || 'public';

  switch (audience) {
    case 'public':
      return true; // Visible to everyone

    case 'customer':
      return !isReseller; // Only visible to non-resellers / normal users

    case 'reseller':
      return isReseller; // Visible to all active resellers (basic + premium)

    case 'premium_reseller':
      return isPremium; // Only visible to premium resellers

    default:
      return true;
  }
};
