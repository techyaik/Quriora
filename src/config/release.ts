const optionalUrl = (value: string | undefined) => {
  const normalized = value?.trim();
  return normalized && /^https:\/\//i.test(normalized) ? normalized : null;
};

export const releaseLinks = {
  iosStore: optionalUrl(process.env.EXPO_PUBLIC_IOS_STORE_URL),
  androidStore: optionalUrl(process.env.EXPO_PUBLIC_ANDROID_STORE_URL),
  privacy: optionalUrl(process.env.EXPO_PUBLIC_PRIVACY_URL),
  terms: optionalUrl(process.env.EXPO_PUBLIC_TERMS_URL),
  supportEmail: process.env.EXPO_PUBLIC_SUPPORT_EMAIL?.trim() || null,
};

export const getStoreUrl = (platform: 'ios' | 'android') =>
  platform === 'ios' ? releaseLinks.iosStore : releaseLinks.androidStore;
