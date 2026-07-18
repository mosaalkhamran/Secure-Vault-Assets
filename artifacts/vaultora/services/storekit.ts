/**
 * StoreKit 2 Service — Vaultora (Premium Subscription)
 *
 * Architecture stub for in-app purchases.
 * Requires a Development Build with expo-iap or react-native-purchases.
 *
 * Production implementation:
 * 1. Install expo-iap or RevenueCat (react-native-purchases)
 * 2. Product IDs defined in App Store Connect
 * 3. Subscription = com.vaultora.premium.monthly ($9/month)
 *
 * The UI (subscription.tsx) is fully implemented.
 * Wire these functions to the purchase buttons when running in a Dev Build.
 */

export const PRODUCT_ID = 'com.vaultora.premium.monthly';

export interface PurchaseResult {
  success: boolean;
  isPremium: boolean;
  error?: string;
  receipt?: string;
}

export async function initStoreKit(): Promise<void> {
  // No-op stub
}

export async function purchasePremium(): Promise<PurchaseResult> {
  // Stub — requires native StoreKit module
  return {
    success: false,
    isPremium: false,
    error: 'In-app purchases require a Development Build',
  };
}

export async function restorePurchases(): Promise<PurchaseResult> {
  // Stub — requires native StoreKit module
  return {
    success: false,
    isPremium: false,
    error: 'Restore purchases requires a Development Build',
  };
}

export async function checkSubscriptionStatus(): Promise<boolean> {
  // Stub — requires native StoreKit module
  return false;
}
