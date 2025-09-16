import { StyleSheet, View, Alert, TouchableOpacity, FlatList, Image, Dimensions } from 'react-native';
import { getFirestore, collection, query, onSnapshot } from 'firebase/firestore';
import { Card, Text, Button, Modal, Portal } from 'react-native-paper';
import { useEffect, useState } from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Colors from '@/constants/Colors';
import { db } from '../../FirebaseConfig';

// Get screen width for carousel styling
const { width } = Dimensions.get('window');

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
      const allProducts: ProductData[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ProductData[];
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
          source={{ uri: item.imageUrl }}
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

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Our Products</Text>
      
      <FlatList
        horizontal
        data={products}
        renderItem={renderProductItem}
        keyExtractor={item => item.id}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.carouselContainer}
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
                source={{ uri: selectedProduct.imageUrl }}
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
    padding: 10,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  carouselContainer: {
    paddingVertical: 10,
  },
  productItem: {
    width: width * 0.7, // Take up 70% of the screen width
    marginHorizontal: 10,
  },
  productCard: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  productImage: {
    width: '100%',
    height: 150,
  },
  productInfo: {
    padding: 10,
    alignItems: 'center',
  },
  productName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  productPrice: {
    fontSize: 16,
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