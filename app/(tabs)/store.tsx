import { StyleSheet, View, Alert, TouchableOpacity, FlatList, Image, Dimensions } from 'react-native';
import { getFirestore, collection, query, onSnapshot } from 'firebase/firestore';
import { Card, Text, Button, Modal, Portal } from 'react-native-paper';
import { useEffect, useState } from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Colors from '@/constants/Colors';
import { db } from '../../FirebaseConfig';
import branding from '../../constants/Branding';

// Get screen width and height for layout calculations
const { width, height } = Dimensions.get('window');
const numColumns = 3;
const productMargin = 10;
const itemWidth = (width - productMargin * (numColumns + 1)) / numColumns;

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
          source={item.imageUrl ? { uri: item.imageUrl } : branding.logo}
          style={styles.productImage}
          resizeMode="cover"
        />
        <View style={styles.productInfo}>
          <Text style={styles.productName}>{item.name}</Text>
          <Text style={styles.productPrice}>${item.price.toFixed(2)}</Text>
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
      contentContainerStyle={styles.gridContainer}
      scrollEnabled={false}
    />
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Our Products</Text>
      
      <FlatList
        horizontal
        pagingEnabled
        data={pagedProducts}
        renderItem={renderPage}
        keyExtractor={(_, index) => index.toString()}
        showsHorizontalScrollIndicator={false}
        snapToInterval={width} // Snap to the width of the screen
        decelerationRate="fast"
      />

      <Portal>
        <Modal
          visible={isModalVisible}
          onDismiss={hideModal}
          contentContainerStyle={styles.modalContent}
        >
          {selectedProduct && (
            <Card>
              <Image
                source={selectedProduct.imageUrl ? { uri: selectedProduct.imageUrl } : branding.logo}
                style={styles.modalImage}
                resizeMode="contain"
              />
              <Card.Title title={selectedProduct.name} />
              <Card.Content>
                <Text style={styles.modalDescription}>{selectedProduct.description}</Text>
                <Text style={styles.modalPrice}>${selectedProduct.price.toFixed(2)}</Text>
                <Button onPress={hideModal} mode="contained" style={styles.modalButton}>Close</Button>
              </Card.Content>
            </Card>
          )}
        </Modal>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: productMargin,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  gridContainer: {
    paddingVertical: 10,
    width: width - productMargin * 2, // Ensure the grid fits the screen width
  },
  productItem: {
    width: itemWidth,
    height: itemWidth * 1.5, // Adjust height based on width for better aspect ratio
    margin: productMargin / 2,
  },
  productCard: {
    borderRadius: 8,
    overflow: 'hidden',
    flex: 1,
  },
  productImage: {
    width: '100%',
    height: '60%', // Image takes up 60% of the card height
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
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    margin: 20,
    borderRadius: 10,
  },
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
  modalButton: {
    marginTop: 10,
  },
});