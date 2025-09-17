// app/adminDashboardItems/ShopItemsManagement.tsx
import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Alert,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { Card, Text, Button, TextInput, DataTable, Portal, Modal } from 'react-native-paper';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { db } from '../../FirebaseConfig';
import {
  collection,
  onSnapshot,
  query,
  doc,
  deleteDoc,
} from 'firebase/firestore';
import { ShopItemProvider, useShopItems } from '../../context/ShopItemContext';
import branding from '../../constants/Branding';

interface ShopItemManagementProps {
  onBack: () => void;
}

interface ProductData {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
}

const ShopItemsManagement = ({ onBack }: ShopItemManagementProps) => {
  const { createShopItem } = useShopItems();
  const [productName, setProductName] = useState('');
  const [productDescription, setProductDescription] = useState('');
  const [productPrice, setProductPrice] = useState('');
  const [productImageUrl, setProductImageUrl] = useState('');
  const [products, setProducts] = useState<ProductData[]>([]);

  // State for showing/hiding the product modal
  const [isProductModalVisible, setIsProductModalVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductData | null>(null);

  useEffect(() => {
    const productsQuery = query(collection(db, 'products'));
    const unsubscribe = onSnapshot(productsQuery, (snapshot) => {
      const allProducts: ProductData[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as ProductData[];
      setProducts(allProducts);
    });
    return () => unsubscribe();
  }, []);

  const handleCreateProduct = async () => {
    if (!productName || !productPrice) {
      Alert.alert('Error', 'Product name and price are required.');
      return;
    }
    const price = parseFloat(productPrice);
    if (isNaN(price) || price <= 0) {
      Alert.alert('Error', 'Please enter a valid price.');
      return;
    }
    const imageUrl = productImageUrl || '';

    try {
      await createShopItem({
        name: productName,
        description: productDescription,
        price,
        imageUrl,
      });
      Alert.alert('Success', 'Product added successfully.');
      setProductName('');
      setProductDescription('');
      setProductPrice('');
      setProductImageUrl('');
    } catch (e) {
      Alert.alert('Error', 'Failed to add product.');
    }
  };

  const handleDeleteProduct = async (id: string) => {
    Alert.alert(
      "Confirm Deletion",
      "Are you sure you want to delete this product? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          onPress: async () => {
            try {
              await deleteDoc(doc(db, 'products', id));
              Alert.alert('Success', 'Product deleted successfully.');
              hideProductModal();
            } catch (e) {
              Alert.alert('Error', 'Failed to delete product.');
            }
          },
          style: "destructive"
        }
      ]
    );
  };
  
  const showProductModal = (product: ProductData) => {
    setSelectedProduct(product);
    setIsProductModalVisible(true);
  };

  const hideProductModal = () => {
    setIsProductModalVisible(false);
    setSelectedProduct(null);
  };

  return (
    <ScrollView style={styles.container}>
      <Button onPress={onBack} mode="outlined" style={styles.backButton}>
        <FontAwesome name="arrow-left" size={16} /> Back
      </Button>

      <Card style={styles.card}>
        <Card.Title title="Add New Shop Item" />
        <Card.Content>
          <TextInput
            label="Product Name"
            value={productName}
            onChangeText={setProductName}
            style={styles.input}
          />
          <TextInput
            label="Description"
            value={productDescription}
            onChangeText={setProductDescription}
            style={styles.input}
            multiline
          />
          <TextInput
            label="Price"
            value={productPrice}
            onChangeText={setProductPrice}
            keyboardType="numeric"
            style={styles.input}
          />
          <TextInput
            label="Image URL (optional)"
            value={productImageUrl}
            onChangeText={setProductImageUrl}
            style={styles.input}
          />
          <Button onPress={handleCreateProduct} mode="contained">
            Add Product
          </Button>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Title title="Existing Products" />
        <Card.Content>
          <DataTable>
            <DataTable.Header>
              <DataTable.Title>Name</DataTable.Title>
              <DataTable.Title numeric>Price</DataTable.Title>
              <DataTable.Title style={{ justifyContent: 'flex-end' }}>
                Action
              </DataTable.Title>
            </DataTable.Header>
            {products.map((item) => (
              <TouchableOpacity key={item.id} onPress={() => showProductModal(item)}>
                <DataTable.Row>
                  <DataTable.Cell>{item.name}</DataTable.Cell>
                  <DataTable.Cell numeric>${item.price.toFixed(2)}</DataTable.Cell>
                  <DataTable.Cell style={styles.actionCell}>
                    <TouchableOpacity onPress={() => handleDeleteProduct(item.id)}>
                      <FontAwesome name="trash" size={20} color="red" />
                    </TouchableOpacity>
                  </DataTable.Cell>
                </DataTable.Row>
              </TouchableOpacity>
            ))}
          </DataTable>
        </Card.Content>
      </Card>

      {/* Product Modal */}
      <Portal>
        <Modal
          visible={isProductModalVisible}
          onDismiss={hideProductModal}
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
                <View style={styles.modalButtons}>
                  <Button onPress={hideProductModal} mode="outlined" style={styles.modalButton}>Close</Button>
                  <Button
                    onPress={() => handleDeleteProduct(selectedProduct.id)}
                    mode="contained"
                    style={[styles.modalButton, { backgroundColor: 'red' }]}
                  >
                    Delete
                  </Button>
                </View>
              </Card.Content>
            </Card>
          )}
        </Modal>
      </Portal>
    </ScrollView>
  );
};

export default function ShopItemManagementWrapper(props: ShopItemManagementProps) {
  return (
    <ShopItemProvider>
      <ShopItemsManagement {...props} />
    </ShopItemProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
    backgroundColor: '#f5f5f5',
  },
  card: {
    width: '100%',
    padding: 10,
    marginBottom: 20,
  },
  input: {
    marginBottom: 10,
  },
  backButton: {
    marginBottom: 10,
  },
  actionCell: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
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
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  modalButton: {
    flex: 1,
    marginHorizontal: 5,
  },
});