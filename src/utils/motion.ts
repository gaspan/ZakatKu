import { AccessibilityInfo } from 'react-native';

let reduceMotion = false;

AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
  reduceMotion = enabled;
});

export const shouldReduceMotion = () => reduceMotion;
