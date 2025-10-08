// constants/GlobalStyles.ts

import { StyleSheet, Dimensions } from 'react-native';
import AppColors from './Colors'; 
import AppBranding from './Branding';
import { ColorTheme } from './Branding';

const { width } = Dimensions.get('window');
const productMargin = 10;
const numColumns = 3;
const itemWidth = (width - productMargin * (numColumns + 1)) / numColumns;


// --- Common Non-Themed Styles ---
const CommonStyles = StyleSheet.create({
  // Reusable Container/Card/Button Styles
  container: {
    flex: 1,
    padding: 20,
  },
  scrollViewContent: {
    flexGrow: 1, 
    justifyContent: 'center', 
    paddingVertical: 20, 
},
  card: {
    width: '100%',
    padding: 10,
    marginBottom: 20,
    elevation: 2,
  },
  backButton: {
    marginBottom: 10,
  },
  input: {
    marginBottom: 10,
  },
  button: {
    marginBottom: 10, 
  },
  // ADDED MISSING STYLES:
  logoContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  textButton: {
    marginTop: 10,
  },
  // Reusable Modal Styles
  modalContent: {
    backgroundColor: 'white', 
    padding: 20,
    margin: 20,
    borderRadius: 10,
    maxHeight: '80%',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 20,
  },
  // DataTable Actions
  actionCell: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    width: 'auto',
  },
  // Dashboard/Index Specifics
  headerContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    marginBottom: 20,
  },
  logo: {
    width: 100, 
    height: 100,
    resizeMode: 'contain',
  },
  welcomeText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 10,
  },
  dashboardContainer: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  tile: {
    width: '45%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
    marginBottom: 20,
  },
  tileContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  tileText: {
    marginTop: 10,
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  // Classes/Store Specifics
  segmentedButtonsContainer: {
    padding: 10,
    borderBottomWidth: 1,
  },
  listContainer: {
    padding: 0,
  },
  // Store Specifics
  storeGridContainer: {
    paddingVertical: 10,
    width: width - productMargin * 2, 
  },
  productItem: {
    width: itemWidth,
    height: itemWidth * 1.5,
    margin: productMargin / 2,
  },
  productCard: {
    borderRadius: 8,
    overflow: 'hidden',
    flex: 1,
  },
  productImage: {
    width: '100%',
    height: '60%',
  },
  productInfo: {
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  productName: {
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  productPrice: {
    fontSize: 12,
  },
  // Text specific to content area
  centeredText: {
    textAlign: 'center',
    padding: 20,
  },
});

// --- Themed Styles Generator ---
export const getThemedStyles = (colors: ColorTheme) => {
  return StyleSheet.create({
    ...CommonStyles,

    // THEMED OVERRIDES
    themedContainer: {
      ...CommonStyles.container,
      backgroundColor: colors.background,
    },
    themedCard: {
      ...CommonStyles.card,
      backgroundColor: colors.background,
    },
    themedModalContent: {
      ...CommonStyles.modalContent,
      backgroundColor: colors.background,
    },
    themedTitle: {
      fontSize: 24,
      fontWeight: 'bold',
      textAlign: 'center',
      marginBottom: 20,
      color: colors.text, 
    },
    themedText: {
      color: colors.text,
    },
    // ADDED THEME AWARE MESSAGE TEXT:
    themedMessage: {
        textAlign: 'center',
        marginBottom: 20,
        color: colors.text,
    },
    welcomeText: {
        ...CommonStyles.welcomeText,
        color: colors.text,
    },
    themedTileText: {
        ...CommonStyles.tileText,
        color: colors.text,
    },
    errorText: {
        color: 'red', 
        fontSize: 12,
        marginBottom: 5,
    },
    // Themed specific components
    themedSegmentedButtonsContainer: {
      ...CommonStyles.segmentedButtonsContainer,
      borderBottomColor: colors.tabIconDefault,
    },
    // Store Themed Overrides
    themedProductName: {
        ...CommonStyles.productName,
        color: colors.text,
    },
    themedProductPrice: {
        ...CommonStyles.productPrice,
        color: colors.text,
    },
  });
};

// Export the branding object for logo/name access
export { AppBranding };

// Export the colors object for light/dark theme selection
export const AppColorsExport = AppColors;