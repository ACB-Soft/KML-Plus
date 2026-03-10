export const isInAppBrowser = () => {
  const ua = navigator.userAgent || navigator.vendor || (window as any).opera;
  return (
    ua.indexOf('FBAN') > -1 ||
    ua.indexOf('FBAV') > -1 ||
    ua.indexOf('Instagram') > -1 ||
    ua.indexOf('WhatsApp') > -1 ||
    ua.indexOf('Line') > -1 ||
    ua.indexOf('Twitter') > -1 ||
    ua.indexOf('Telegram') > -1 ||
    ua.indexOf('Snapchat') > -1 ||
    ua.indexOf('LinkedIn') > -1 ||
    ua.indexOf('Pinterest') > -1 ||
    ua.indexOf('MicroMessenger') > -1 || // WeChat
    ua.indexOf('Messenger') > -1
  );
};

export const isIOS = () => {
  return [
    'iPad Simulator',
    'iPhone Simulator',
    'iPod Simulator',
    'iPad',
    'iPhone',
    'iPod'
  ].includes(navigator.platform)
  // iPad on iOS 13 detection
  || (navigator.userAgent.includes("Mac") && "ontouchend" in document);
};

export const getChromeURL = (url: string) => {
  if (url.startsWith('https')) {
    return url.replace(/^https:\/\//, 'googlechromes://');
  }
  return url.replace(/^http:\/\//, 'googlechrome://');
};

export const getSafariURL = (url: string) => {
  // Safari doesn't have a direct URL scheme like Chrome, 
  // but we can suggest the user to use the "Open in Safari" button in the in-app browser.
  return url;
};
