/**
 * Centralized 9JASUB App Download Configuration
 *
 * CURRENT:  Direct APK download from Supabase Storage
 * FUTURE:   Replace APP_DOWNLOAD_URL with the official Google Play listing URL
 *
 * To switch to Google Play after publication:
 *   APP_DOWNLOAD_URL = "https://play.google.com/store/apps/details?id=com.jasub.app"
 *   APP_STORE_TYPE   = "play_store"
 */

export const APP_CONFIG = {
  /** Direct APK download URL — replace with Play Store URL after publication */
  APP_DOWNLOAD_URL:
    process.env.NEXT_PUBLIC_APP_DOWNLOAD_URL ||
    'https://bdpcitxadaygterabrqb.supabase.co/storage/v1/object/public/jasub-app-releases/9JASUB-Android.apk',

  /**
   * "apk"        — direct APK download (current)
   * "play_store" — Google Play Store listing (future)
   */
  APP_STORE_TYPE: (process.env.NEXT_PUBLIC_APP_STORE_TYPE as 'apk' | 'play_store') || 'apk',

  APP_NAME: '9JASUB',
  PACKAGE_NAME: 'com.jasub.app',
  VERSION_NAME: '1.0.0',
  VERSION_CODE: 1,
} as const;

export type AppStoreType = typeof APP_CONFIG.APP_STORE_TYPE;
