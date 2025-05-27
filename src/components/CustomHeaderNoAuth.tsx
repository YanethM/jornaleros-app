// components/CustomHeaderNoAuth.js
import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  Image, 
  StyleSheet, 
  TouchableOpacity, 
  Platform,
  Modal,
  TouchableWithoutFeedback,
  ScrollView,
  Animated
} from 'react-native';
import { getStatusBarHeight } from '../utils/dimensions';
import Icon from 'react-native-vector-icons/MaterialIcons';

const CustomHeaderNoAuth = ({ navigation }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [slideAnim] = useState(new Animated.Value(-300));
  const statusBarHeight = getStatusBarHeight();

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: isMenuOpen ? 0 : -300,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [isMenuOpen]);

  const menuItems = [
    { title: 'Acerca de', icon: 'info', route: 'About' },
    { title: 'Contacto', icon: 'email', route: 'Contact' },
    { title: 'Términos y Condiciones', icon: 'description', route: 'Terms' },
  ];
  
  const handleMenuItemPress = (route) => {
    setIsMenuOpen(false);
    navigation.navigate(route);
  };

  return (
    <>
      <View style={[styles.headerContainer, { paddingTop: statusBarHeight }]}>
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={() => setIsMenuOpen(true)}
            style={styles.menuButton}
          >
            <Icon name="menu" size={28} color="#333" />
          </TouchableOpacity>
          
          <Image
            source={require('../../assets/logo.png')}
            style={styles.logo}
          />
        </View>
      </View>

      <Modal
        animationType="none"
        transparent={true}
        visible={isMenuOpen}
        onRequestClose={() => setIsMenuOpen(false)}
      >
        <TouchableWithoutFeedback onPress={() => setIsMenuOpen(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <Animated.View 
                style={[
                  styles.menuContainer,
                  { 
                    transform: [{ translateX: slideAnim }],
                    paddingTop: statusBarHeight 
                  }
                ]}
              >
                <View style={styles.menuHeader}>
                  <Image
                    source={require('../../assets/logo.png')}
                    style={styles.menuLogo}
                  />
                  <Text style={styles.menuTitle}>Menú</Text>
                </View>
                
                <ScrollView style={styles.menuItemsContainer}>
                  {menuItems.map((item, index) => (
                    <TouchableOpacity
                      key={index}
                      style={styles.menuItem}
                      onPress={() => handleMenuItemPress(item.route)}
                    >
                      <Icon name={item.icon} size={24} color="#666" />
                      <Text style={styles.menuItemText}>{item.title}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </Animated.View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    backgroundColor: '#fff',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  header: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    backgroundColor: '#fff',
  },
  menuButton: {
    padding: 5,
  },
  logo: {
    width: 120,
    height: 40,
    resizeMode: 'contain',
    position: 'absolute',
    left: '50%',
    marginLeft: -60,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  menuContainer: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 280,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  menuHeader: {
    backgroundColor: '#f8f8f8',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    alignItems: 'center',
  },
  menuLogo: {
    width: 100,
    height: 35,
    resizeMode: 'contain',
    marginBottom: 10,
  },
  menuTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  menuItemsContainer: {
    flex: 1,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  menuItemText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 20,
  },
});

export default CustomHeaderNoAuth;