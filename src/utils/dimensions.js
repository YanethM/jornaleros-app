import { Platform, StatusBar, Dimensions } from 'react-native';

const X_WIDTH = 375;
const X_HEIGHT = 812;
const XSMAX_WIDTH = 414;
const XSMAX_HEIGHT = 896;
const { height, width } = Dimensions.get('window');

export const isIPhoneX = () => Platform.OS === 'ios' && !Platform.isPad && !Platform.isTV
  && ((width === X_WIDTH && height === X_HEIGHT) || (width === XSMAX_WIDTH && height === XSMAX_HEIGHT));

export const getStatusBarHeight = (skipAndroid = false) => {
  return Platform.select({
    ios: isIPhoneX() ? 44 : 20,
    android: skipAndroid ? 0 : StatusBar.currentHeight,
    default: 0
  });
};