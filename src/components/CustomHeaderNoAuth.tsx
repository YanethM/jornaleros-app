// components/CustomHeaderNoAuth.js - Arreglo rápido
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
  Animated,
  Alert
} from 'react-native';
import { getStatusBarHeight } from '../utils/dimensions';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext'; // ← Agregar esto

const CustomHeaderNoAuth = ({ navigation: propNavigation }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [slideAnim] = useState(new Animated.Value(-300));
  const statusBarHeight = getStatusBarHeight();
  
  const hookNavigation = useNavigation();
  const navigation = propNavigation || hookNavigation;
  
  // ✅ AGREGAR: Usar AuthContext
  const { logout, isAuthenticated } = useAuth();

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: isMenuOpen ? 0 : -300,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [isMenuOpen]);

  const menuItems = [
    { title: 'Acerca de Jornaleando', icon: 'info', route: 'About' }, // ← Cambiar a 'About'
    { title: 'Contacto', icon: 'email', route: 'Contact' },
    { title: 'Términos y Condiciones', icon: 'description', route: 'Terms' },
    { title: 'Iniciar sesión', icon: 'login', route: 'Login' },
  ];
  
  // ✅ FUNCIÓN CORREGIDA
  const handleMenuItemPress = (route) => {
    setIsMenuOpen(false);
    
    try {
      console.log(`🧭 Intentando navegar a: ${route}`);
      
      if (route === 'Login') {
        // ✅ CASO ESPECIAL: Login
        if (isAuthenticated) {
          // Si está logueado, ofrecer cerrar sesión
          Alert.alert(
            'Ya tienes una sesión activa',
            '¿Deseas cerrar la sesión actual para iniciar con otra cuenta?',
            [
              { text: 'Cancelar', style: 'cancel' },
              { 
                text: 'Cerrar Sesión', 
                onPress: async () => {
                  try {
                    await logout();
                    console.log('✅ Sesión cerrada, ahora en pantalla de login');
                  } catch (error) {
                    console.error('Error cerrando sesión:', error);
                  }
                }
              }
            ]
          );
        } else {
          // Si no está logueado, navegar normalmente
          navigation.navigate(route);
        }
      } else {
        // ✅ OTROS CASOS: Navegar normalmente
        navigation.navigate(route);
      }
      
    } catch (error) {
      console.error(`❌ Error navegando a ${route}:`, error);
      Alert.alert('Error', 'No se pudo abrir la página solicitada.');
    }
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
          
          {/* ✅ BOTÓN CONDICIONAL */}
          {isAuthenticated ? (
            <TouchableOpacity 
              onPress={async () => {
                try {
                  await logout();
                } catch (error) {
                  console.error('Error cerrando sesión:', error);
                }
              }}
              style={styles.logoutButton}
            >
              <Icon name="logout" size={24} color="#EF4444" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity 
              onPress={() => handleMenuItemPress('Login')}
              style={styles.loginButton}
            >
              <Icon name="login" size={24} color="#284F66" />
            </TouchableOpacity>
          )}
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
                  
                  {/* ✅ AGREGAR: Opción de cerrar sesión si está logueado */}
                  {isAuthenticated && (
                    <TouchableOpacity
                      style={[styles.menuItem, styles.logoutMenuItem]}
                      onPress={async () => {
                        setIsMenuOpen(false);
                        try {
                          await logout();
                        } catch (error) {
                          console.error('Error cerrando sesión:', error);
                        }
                      }}
                    >
                      <Icon name="logout" size={24} color="#EF4444" />
                      <Text style={[styles.menuItemText, styles.logoutText]}>Cerrar Sesión</Text>
                    </TouchableOpacity>
                  )}
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
    justifyContent: 'space-between', // ← Cambiar para distribuir elementos
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
  // ✅ AGREGAR: Estilos para botones
  loginButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#e3f2fd',
  },
  logoutButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#ffebee',
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
  // ✅ AGREGAR: Estilos para logout
  logoutMenuItem: {
    backgroundColor: '#ffebee',
    borderBottomColor: '#ffcdd2',
  },
  logoutText: {
    color: '#EF4444',
    fontWeight: '600',
  },
});

export default CustomHeaderNoAuth;