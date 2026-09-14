/**
 * Server-authoritative check for Merchant role / identity.
 * Evaluates the user object returned by backend /api/user/me.
 * Never relies on localStorage.
 */
export const isMerchantUser = (user) => {
    if (!user) return false;
    return Boolean(
        user.role === 'merchant' ||
        user.role === 'reseller_admin' ||
        user.resellerActivationStatus === 'active' ||
        user.whiteLabelStatus === 'active' ||
        user.apiLevel === 'reseller' ||
        user.isResellerActivated === true
    );
};
