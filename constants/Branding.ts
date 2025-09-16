import { ImageSourcePropType } from 'react-native';

interface Branding {
  logo: ImageSourcePropType;
  brandName: string;
}

const branding: Branding = {
  logo: require('../assets/logo.png'),
  brandName: 'BMAC',
};

export default branding;