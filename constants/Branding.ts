// Branding.ts

import { ImageSourcePropType } from 'react-native';

const tintColorLight = '#2f95dc';
const tintColorDark = '#fff';

export interface ColorTheme {
  text: string;
  background: string;
  tint: string;
  tabIconDefault: string;
  tabIconSelected: string;
}

export interface Colors {
  light: ColorTheme;
  dark: ColorTheme;
}

interface Branding {
  logo: ImageSourcePropType;
  brandName: string;
  colors: Colors; // Add the colors interface
}

const branding: Branding = {
  logo: require('../assets/logo.png'),
  brandName: 'BMAC',
  colors: { // Define the colors here
    light: {
      text: '#000',
      background: '#fff',
      tint: tintColorLight,
      tabIconDefault: '#ccc',
      tabIconSelected: tintColorLight,
    },
    dark: {
      text: '#fff',
      background: '#000',
      tint: tintColorDark,
      tabIconDefault: '#ccc',
      tabIconSelected: tintColorDark,
    },
  },
};

export default branding;