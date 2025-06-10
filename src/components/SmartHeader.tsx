// components/SmartHeader.js - Header que maneja usuarios logueados y no logueados
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
import { CommonActions, useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';

const SmartHeader = ({ navigation: propNavigation }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [slideAnim] = useState(new Animated.Value(-300));
  const statusBarHeight = getStatusBarHeight();
  
  // Usar navigation hook como fallback
  const hookNavigation = useNavigation();
  const navigation = propNavigation || hookNavigation;
  
  const { user, logout, isAuthenticated } = useAuth();

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: isMenuOpen ? 0 : -300,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [isMenuOpen]);

  // Función para cerrar sesión y navegar al login
  const handleLogout = async () => {
    try {
      console.log('👋 Cerrando sesión del usuario...');
      
      Alert.alert(
        'Cerrar Sesión',
        '¿Estás seguro de que deseas cerrar sesión?',
        [
          { text: 'Cancelar', style: 'cancel' },
          { 
            text: 'Cerrar Sesión', 
            style: 'destructive',
            onPress: async () => {
              setIsMenuOpen(false);
              await logout();
              console.log('✅ Sesión cerrada exitosamente');
            }
          }
        ]
      );
    } catch (error) {
      console.error('❌ Error cerrando sesión:', error);
      Alert.alert('Error', 'No se pudo cerrar la sesión. Intenta nuevamente.');
    }
  };

  // Función para navegar al login (solo si no está autenticado)
  const handleGoToLogin = () => {
    try {
      setIsMenuOpen(false);
      
      if (isAuthenticated) {
        // Si está logueado, ofrecer cerrar sesión
        Alert.alert(
          'Ya tienes una sesión activa',
          '¿Deseas cerrar la sesión actual para iniciar con otra cuenta?',
          [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Cerrar Sesión', onPress: handleLogout }
          ]
        );
      } else {
        // Si no está logueado, navegar directamente
        console.log('🔐 Navegando al login (usuario no autenticado)');
        navigation.navigate('Login');
      }
    } catch (error) {
      console.error('❌ Error navegando al login:', error);
      Alert.alert('Error', 'No se pudo abrir la página de login.');
    }
  };

  // Función segura para navegar
  const safeNavigate = (routeName, params = undefined) => {
    try {
      setIsMenuOpen(false);
      
      console.log(`🧭 Intentando navegar a: ${routeName}`);
      
      // Verificar si la ruta existe en el navegador actual
      const currentState = navigation.getState();
      console.log('🔍 Estado actual del navegador:', {
        routeNames: currentState?.routeNames || [],
        currentRoute: currentState?.routes?.[currentState.index]?.name,
        isAuthenticated
      });
      
      // Si la ruta existe, navegar directamente
      if (currentState?.routeNames?.includes(routeName)) {
        console.log(`✅ Ruta ${routeName} encontrada, navegando directamente`);
        navigation.navigate(routeName, params);
        return;
      }
      
      // Manejo especial según el estado de autenticación
      switch (routeName) {
        case 'Login':
          handleGoToLogin();
          break;
          
        case 'Onboarding':
          // Para onboarding, siempre debería estar disponible o navegar a about
          if (currentState?.routeNames?.includes('About')) {
            navigation.navigate('About');
          } else {
            Alert.alert('Información', 'Puedes encontrar más información en la sección de contacto.');
          }
          break;
          
        case 'Contact':
        case 'Terms':
        case 'About':
          // Estas rutas deberían estar disponibles en ambos stacks
          if (currentState?.routeNames?.includes(routeName)) {
            navigation.navigate(routeName, params);
          } else {
            Alert.alert('Error', 'Esta página no está disponible en este momento.');
          }
          break;
          
        default:
          console.warn(`❌ Ruta no manejada: ${routeName}`);
          Alert.alert('Error', 'Página no encontrada.');
      }
      
    } catch (error) {
      console.error(`❌ Error navegando a ${routeName}:`, error);
      Alert.alert('Error', 'No se pudo abrir la página solicitada.');
    }
  };

  // Menú diferente según el estado de autenticación
  const getMenuItems = () => {
    const baseItems = [
      { 
        title: 'Acerca de Jornaleando', 
        icon: 'info', 
        route: 'About',
        description: 'Conoce más sobre nuestra aplicación'
      },
      { 
        title: 'Contacto', 
        icon: 'email', 
        route: 'Contact',
        description: 'Ponte en contacto con nosotros'
      },
      { 
        title: 'Términos y Condiciones', 
        icon: 'description', 
        route: 'Terms',
        description: 'Lee nuestros términos de servicio'
      },
    ];

    if (isAuthenticated) {
      // Usuario logueado
      return [
        ...baseItems,
        { 
          title: 'Cerrar Sesión', 
          icon: 'logout', 
          action: 'logout',
          description: 'Cerrar la sesión actual',
          highlight: true,
          destructive: true
        },
      ];
    } else {
      // Usuario no logueado
      return [
        ...baseItems,
        { 
          title: 'Iniciar sesión', 
          icon: 'login', 
          route: 'Login',
          description: 'Accede a tu cuenta',
          highlight: true
        },
      ];
    }
  };
  
  const handleMenuItemPress = (item) => {
    console.log(`📱 Menu item seleccionado: ${item.title}`);
    
    if (item.action === 'logout') {
      handleLogout();
    } else if (item.route) {
      safeNavigate(item.route);
    }
  };

  // Obtener información del usuario para mostrar
  const getUserInfo = () => {
    if (!user) return null;
    
    const userRole = user.role === 'productor' ? 'Empleador' : 
                    user.role === 'trabajador' ? 'Trabajador' : 
                    'Usuario';
    
    return {
      name: user.name || 'Usuario',
      role: userRole,
      email: user.email,
    };
  };

  const userInfo = getUserInfo();

  return (
    <>
      <View style={[styles.headerContainer, { paddingTop: statusBarHeight }]}>
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={() => setIsMenuOpen(true)}
            style={styles.menuButton}
            activeOpacity={0.7}
          >
            <Icon name="menu" size={28} color="#333" />
          </TouchableOpacity>
          
          <Image
            source={require('../../assets/logo.png')}
            style={styles.logo}
          />
          
          {/* Botón diferente según el estado */}
          {isAuthenticated ? (
            <TouchableOpacity 
              onPress={handleLogout}
              style={styles.logoutButton}
              activeOpacity={0.7}
            >
              <Icon name="logout" size={24} color="#EF4444" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity 
              onPress={handleGoToLogin}
              style={styles.loginButton}
              activeOpacity={0.7}
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
                  
                  {isAuthenticated && userInfo ? (
                    // Header para usuario logueado
                    <View style={styles.userInfoContainer}>
                      <Text style={styles.userName}>{userInfo.name}</Text>
                      <Text style={styles.userRole}>{userInfo.role}</Text>
                      <Text style={styles.userEmail}>{userInfo.email}</Text>
                    </View>
                  ) : (
                    // Header para usuario no logueado
                    <View style={styles.guestInfoContainer}>
                      <Text style={styles.menuTitle}>Menú Principal</Text>
                      <Text style={styles.menuSubtitle}>Explora nuestras opciones</Text>
                    </View>
                  )}
                </View>
                
                <ScrollView style={styles.menuItemsContainer}>
                  {getMenuItems().map((item, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.menuItem,
                        item.highlight && styles.menuItemHighlight,
                        item.destructive && styles.menuItemDestructive
                      ]}
                      onPress={() => handleMenuItemPress(item)}
                      activeOpacity={0.7}
                    >
                      <View style={[
                        styles.menuItemIconContainer,
                        item.highlight && styles.menuItemIconHighlight,
                        item.destructive && styles.menuItemIconDestructive
                      ]}>
                        <Icon 
                          name={item.icon} 
                          size={24} 
                          color={
                            item.destructive ? "#fff" :
                            item.highlight ? "#fff" : "#666"
                          } 
                        />
                      </View>
                      <View style={styles.menuItemTextContainer}>
                        <Text style={[
                          styles.menuItemText,
                          item.highlight && styles.menuItemTextHighlight,
                          item.destructive && styles.menuItemTextDestructive
                        ]}>
                          {item.title}
                        </Text>
                        <Text style={[
                          styles.menuItemDescription,
                          item.highlight && styles.menuItemDescriptionHighlight,
                          item.destructive && styles.menuItemDescriptionDestructive
                        ]}>
                          {item.description}
                        </Text>
                      </View>
                      <Icon 
                        name="chevron-right" 
                        size={20} 
                        color={
                          item.destructive ? "#EF4444" :
                          item.highlight ? "#284F66" : "#ccc"
                        } 
                      />
                    </TouchableOpacity>
                  ))}
                </ScrollView>
                
                <View style={styles.menuFooter}>
                  <Text style={styles.menuFooterText}>
                    Jornaleando - Conectando el campo
                  </Text>
                  <Text style={styles.menuFooterVersion}>
                    {isAuthenticated ? 'Sesión activa' : 'Versión 1.0.0'}
                  </Text>
                </View>
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
    justifyContent: 'space-between',
  },
  menuButton: {
    padding: 8,
    borderRadius: 8,
  },
  logo: {
    width: 120,
    height: 40,
    resizeMode: 'contain',
    position: 'absolute',
    left: '50%',
    marginLeft: -60,
  },
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
    width: 320,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  menuHeader: {
    backgroundColor: '#f8f9fa',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
    alignItems: 'center',
  },
  menuLogo: {
    width: 100,
    height: 35,
    resizeMode: 'contain',
    marginBottom: 16,
  },
  userInfoContainer: {
    alignItems: 'center',
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  userRole: {
    fontSize: 14,
    color: '#284F66',
    fontWeight: '600',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 12,
    color: '#666',
  },
  guestInfoContainer: {
    alignItems: 'center',
  },
  menuTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  menuSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  menuItemsContainer: {
    flex: 1,
    paddingTop: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  menuItemHighlight: {
    backgroundColor: '#e3f2fd',
    borderBottomColor: '#90caf9',
  },
  menuItemDestructive: {
    backgroundColor: '#ffebee',
    borderBottomColor: '#ef9a9a',
  },
  menuItemIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  menuItemIconHighlight: {
    backgroundColor: '#284F66',
  },
  menuItemIconDestructive: {
    backgroundColor: '#EF4444',
  },
  menuItemTextContainer: {
    flex: 1,
  },
  menuItemText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
    marginBottom: 2,
  },
  menuItemTextHighlight: {
    color: '#284F66',
  },
  menuItemTextDestructive: {
    color: '#EF4444',
  },
  menuItemDescription: {
    fontSize: 12,
    color: '#666',
  },
  menuItemDescriptionHighlight: {
    color: '#284F66',
  },
  menuItemDescriptionDestructive: {
    color: '#EF4444',
  },
  menuFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
    backgroundColor: '#f8f9fa',
    alignItems: 'center',
  },
  menuFooterText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
    marginBottom: 4,
  },
  menuFooterVersion: {
    fontSize: 12,
    color: '#999',
  },
});

export default SmartHeader;