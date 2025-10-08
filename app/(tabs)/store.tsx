import { StyleSheet, View, Alert, TouchableOpacity, FlatList, Image, Dimensions, useColorScheme } from 'react-native';
import { getFirestore, collection, query, onSnapshot } from 'firebase/firestore';
import { Card, Text, Button, Modal, Portal } from 'react-native-paper';
import { useEffect, useState } from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';

// REMOVE: import Colors from '@/constants/Colors';
// REMOVE: import branding from '../../constants/Branding';
import { db } from '../../FirebaseConfig';
import { getThemedStyles, AppBranding, AppColorsExport } from '../../constants/GlobalStyles';

// Get screen width and height for layout calculations
const { width, height } = Dimensions.get('window');
const numColumns = 3;
const productMargin = 10;
const itemWidth = (width - productMargin * (numColumns + 1)) / numColumns;

const currentThemeColors = useColorScheme() === 'dark' ? AppColorsExport.dark : AppColorsExport.light; 
const styles = getThemedStyles(currentThemeColors);

// Define data types
interface ProductData {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
}

export default function StoreScreen() {
  const [products, setProducts] = useState<ProductData[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductData | null>(null);

 useEffect(() => {
    const productsQuery = query(collection(db, 'products'));
    const unsubscribeProducts = onSnapshot(productsQuery, (snapshot) => {
      const allProducts: ProductData[] = snapshot.docs.map(doc => {
        const data = doc.data();
        const imageUrl = data.imageUrl || '';
        return {
          id: doc.id,
          ...data,
          imageUrl,
        };
      }) as ProductData[];
      setProducts(allProducts);
    });

    return () => unsubscribeProducts();
  }, []);

  const showModal = (product: ProductData) => {
    setSelectedProduct(product);
    setIsModalVisible(true);
  };

  const hideModal = () => {
    setIsModalVisible(false);
    setSelectedProduct(null);
  };

  const renderProductItem = ({ item }: { item: ProductData }) => (
    <TouchableOpacity onPress={() => showModal(item)} style={styles.productItem}>
      <Card style={styles.productCard}>
        <Image
          source={item.imageUrl ? { uri: item.imageUrl } : AppBranding.logo}
          style={styles.productImage}
          resizeMode="cover"
        />
        <View style={styles.productInfo}>
          <Text style={styles.themedProductName}>{item.name}</Text>
          <Text style={styles.themedProductPrice}>${item.price.toFixed(2)}</Text>
        </View>
      </Card>
    </TouchableOpacity>
  );
  
  // This function takes the products and groups them into pages of 9
  const getPagedProducts = (products: ProductData[], itemsPerPage: number) => {
    const pages = [];
    for (let i = 0; i < products.length; i += itemsPerPage) {
      pages.push(products.slice(i, i + itemsPerPage));
    }
    return pages;
  };

  const pagedProducts = getPagedProducts(products, 9);

  const renderPage = ({ item: page }: { item: ProductData[] }) => (
    <FlatList
      data={page}
      renderItem={renderProductItem}
      keyExtractor={(item) => item.id}
      numColumns={numColumns}
      contentContainerStyle={styles.storeGridContainer}
      scrollEnabled={false}
    />
  );

  return (
    <View style={styles.themedContainer}>
      <Text style={styles.themedTitle}>Our Products</Text>
      
      <FlatList
        horizontal
        pagingEnabled
        data={pagedProducts}
        renderItem={renderPage}
        keyExtractor={(_, index) => index.toString()}
        showsHorizontalScrollIndicator={false}
        snapToInterval={width} 
        decelerationRate="fast"
      />

      <Portal>
        <Modal
          visible={isModalVisible}
          onDismiss={hideModal}
          contentContainerStyle={styles.themedModalContent}
        >
          {selectedProduct && (
            <Card style={styles.themedCard}>
              <Image
                source={selectedProduct.imageUrl ? { uri: selectedProduct.imageUrl } : AppBranding.logo}
                style={localStyles.modalImage}
                resizeMode="contain"
              />
              <Card.Title titleStyle={styles.themedText} title={selectedProduct.name} />
              <Card.Content>
                <Text style={[styles.themedText, localStyles.modalDescription]}>{selectedProduct.description}</Text>
                <Text style={[styles.themedText, localStyles.modalPrice]}>${selectedProduct.price.toFixed(2)}</Text>
                <Button onPress={hideModal} mode="contained" style={styles.button}>Close</Button>
              </Card.Content>
            </Card>
          )}
        </Modal>
      </Portal>
    </View>
  );
}

const localStyles = StyleSheet.create({
  modalImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 10,
  },
  modalDescription: {
    fontSize: 16,
    marginBottom: 10,
  },
  modalPrice: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
});