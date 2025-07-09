import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  Platform,
  Modal,
  TouchableWithoutFeedback,
  ScrollView,
  Animated,
  Alert,
  StatusBar,
  Dimensions,
  Vibration,
  Pressable,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Icon from "react-native-vector-icons/MaterialIcons";
import { useAuth } from "../context/AuthContext";
import { LinearGradient } from 'expo-linear-gradient';

// ✅ Constantes optimizadas con validaciones
const CONSTANTS = {
  HEADER_HEIGHT: 64,
  MENU_WIDTH: 320,
  PROFILE_IMAGE_SIZE: 36,
  MENU_PROFILE_SIZE: 52,
  DROPDOWN_PROFILE_SIZE: 60,
  ANIMATION_DURATION: 250,
  SPRING_CONFIG: { 
    damping: 20, 
    stiffness: 90, 
    useNativeDriver: true 
  },
  VIBRATION_PATTERN: Platform.OS === 'ios' ? [50] : 50,
};

// ✅ Helper mejorado para status bar con validación
const getStatusBarHeight = () => {
  if (Platform.OS === 'ios') {
    try {
      const { height, width } = Dimensions.get('window');
      const iphoneXHeights = [812, 844, 896, 926, 932, 852, 844];
      return iphoneXHeights.includes(height) || iphoneXHeights.includes(width) ? 44 : 20;
    } catch (error) {
      console.warn('Error getting window dimensions:', error);
      return 44; // Default para iOS
    }
  }
  return StatusBar.currentHeight || 24;
};

// 🎨 Paleta de colores
const COLORS = {
  primary: "#284F66",
  primaryLight: "#3A6B87",
  primaryDark: "#1A3B4D",
  secondary: "#B6883E",
  secondaryLight: "#D4A45C",
  secondaryDark: "#8A652E",
  
  gray50: "#FAFBFC",
  gray100: "#F4F6F8",
  gray200: "#E5E8EB",
  gray300: "#D1D6DB",
  gray400: "#9DA4AE",
  gray500: "#6B7280",
  gray600: "#4B5563",
  gray700: "#374151",
  gray800: "#1F2937",
  gray900: "#111827",
  
  success: "#10B981",
  warning: "#F59E0B",
  error: "#EF4444",
  info: "#3B82F6",
  
  white: "#FFFFFF",
  surface: "#FEFEFE",
  overlay: "rgba(15, 23, 42, 0.6)",
  backdrop: "rgba(0, 0, 0, 0.4)",
  cardShadow: "rgba(0, 0, 0, 0.08)",
};

// ✅ Imagen por defecto como constante
const DEFAULT_AVATAR = require("../../assets/onboarding/slide1.png");
const DEFAULT_LOGO = require("../../assets/logo.png");

// ✅ Componente ProfileImage con validaciones
const ProfileImage = React.memo(({ source, size, showOnline = false, style }) => {
  const [imageError, setImageError] = useState(false);
  
  const getImageSource = () => {
    if (imageError || !source || !source.uri) {
      return DEFAULT_AVATAR;
    }
    return source;
  };

  const onlineIndicatorStyle = useMemo(() => {
    if (!size || typeof size !== 'number') {
      return { width: 8, height: 8, borderRadius: 4, bottom: 1, right: 1 };
    }
    return {
      width: size * 0.25,
      height: size * 0.25,
      borderRadius: (size * 0.25) / 2,
      bottom: size * 0.02,
      right: size * 0.02,
    };
  }, [size]);

  return (
    <View style={[styles.profileImageContainer, style]}>
      <Image 
        source={getImageSource()}
        style={[
          styles.profileImage, 
          { 
            width: size || 36, 
            height: size || 36, 
            borderRadius: (size || 36) / 2 
          }
        ]}
        onError={() => setImageError(true)}
        defaultSource={DEFAULT_AVATAR}
      />
      {showOnline && (
        <View style={[styles.onlineIndicator, onlineIndicatorStyle]} />
      )}
    </View>
  );
});

// ✅ Componente LoadingState
const LoadingState = React.memo(() => {
  const pulseAnim = useMemo(() => new Animated.Value(0), []);

  useEffect(() => {
    const startPulse = () => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 0,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start();
    };
    startPulse();
  }, [pulseAnim]);

  return (
    <View style={styles.loadingContainer}>
      <Animated.View 
        style={[
          styles.loadingDot,
          {
            opacity: pulseAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0.3, 1],
            }),
          }
        ]} 
      />
      <Text style={styles.loadingText}>Cargando...</Text>
    </View>
  );
});

// ✅ Componente principal con validaciones mejoradas
const CustomHeaderAdmin = ({ navigation }) => {
  // 🔍 DEBUG: Verificar props
  console.log("CustomHeaderAdmin - navigation prop:", typeof navigation);

  // Estados con valores por defecto seguros
  const [userData, setUserData] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Animaciones con validaciones
  const slideAnim = useMemo(() => new Animated.Value(-CONSTANTS.MENU_WIDTH), []);
  const fadeAnim = useMemo(() => new Animated.Value(0), []);
  const profileDropdownAnim = useMemo(() => new Animated.Value(0), []);
  const scaleAnim = useMemo(() => new Animated.Value(1), []);

  const statusBarHeight = useMemo(() => getStatusBarHeight(), []);
  
  // ✅ Hook de auth con validación
  const authContext = useAuth();
  const { signOut, user } = authContext || {}; // Validar que authContext existe

  // 🔍 DEBUG: Verificar user object
  console.log("CustomHeaderAdmin - user object:", user ? {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    hasEmployerProfile: !!user.employerProfile,
    hasWorkerProfile: !!user.workerProfile
  } : 'null');

  // ✅ Efectos con validaciones
  useEffect(() => {
    loadUserData();
  }, []);

  useEffect(() => {
    if (slideAnim) {
      Animated.spring(slideAnim, {
        toValue: isMenuOpen ? 0 : -CONSTANTS.MENU_WIDTH,
        ...CONSTANTS.SPRING_CONFIG,
      }).start();
    }
  }, [isMenuOpen, slideAnim]);

  useEffect(() => {
    if (fadeAnim && profileDropdownAnim) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: isProfileDropdownOpen ? 1 : 0,
          duration: CONSTANTS.ANIMATION_DURATION,
          useNativeDriver: true,
        }),
        Animated.spring(profileDropdownAnim, {
          toValue: isProfileDropdownOpen ? 1 : 0,
          damping: 15,
          stiffness: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isProfileDropdownOpen, fadeAnim, profileDropdownAnim]);

  // ✅ Funciones con validaciones
  const loadUserData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const storedUserData = await AsyncStorage.getItem("@user_data");
      if (storedUserData) {
        try {
          const parsedData = JSON.parse(storedUserData);
          setUserData(parsedData);
        } catch (parseError) {
          console.warn("Error parsing stored user data:", parseError);
        }
      }
    } catch (error) {
      console.error("Error loading user data:", error);
      setError("Error al cargar datos del usuario");
    } finally {
      setLoading(false);
    }
  }, []);

  const triggerVibration = useCallback(() => {
    try {
      if (Platform.OS === 'ios') {
        Vibration.vibrate(CONSTANTS.VIBRATION_PATTERN);
      } else {
        Vibration.vibrate(CONSTANTS.VIBRATION_PATTERN);
      }
    } catch (error) {
      console.log('Vibration not available:', error);
    }
  }, []);

  const animateScale = useCallback(() => {
    if (scaleAnim) {
      Animated.sequence([
        Animated.timing(scaleAnim, { 
          toValue: 0.95, 
          duration: 100, 
          useNativeDriver: true 
        }),
        Animated.timing(scaleAnim, { 
          toValue: 1, 
          duration: 100, 
          useNativeDriver: true 
        }),
      ]).start();
    }
  }, [scaleAnim]);

  const handleMenuPress = useCallback(() => {
    triggerVibration();
    animateScale();
    setIsMenuOpen(true);
  }, [triggerVibration, animateScale]);

  const handleProfilePress = useCallback(() => {
    triggerVibration();
    animateScale();
    setIsProfileDropdownOpen(!isProfileDropdownOpen);
  }, [isProfileDropdownOpen, triggerVibration, animateScale]);

  const handleMenuItemPress = useCallback((item) => {
    if (!item || !navigation) {
      console.warn("Missing item or navigation for menu press");
      return;
    }

    setIsMenuOpen(false);
    
    setTimeout(() => {
      try {
        if (item.isTabScreen) {
          navigation.navigate("Home", { screen: item.route });
        } else {
          navigation.navigate(item.route);
        }
      } catch (error) {
        console.warn(`Error navegando a ${item.route}:`, error);
        Alert.alert("Información", "Esta función estará disponible pronto");
      }
    }, 200);
  }, [navigation]);

  const handleProfileMenuPress = useCallback(async (action) => {
    setIsProfileDropdownOpen(false);
    
    setTimeout(async () => {
      try {
        switch (action) {
          case "profile":
            if (navigation && navigation.navigate) {
              navigation.navigate("Profile");
            } else {
              Alert.alert("Error", "No se pudo abrir el perfil");
            }
            break;
          case "settings":
            if (navigation && navigation.navigate) {
              navigation.navigate("Settings");
            } else {
              Alert.alert("Información", "Configuración estará disponible pronto");
            }
            break;
          case "help":
            Alert.alert("Ayuda", "Para soporte técnico, contacta al administrador del sistema");
            break;
          case "logout":
            handleLogout();
            break;
          default:
            break;
        }
      } catch (error) {
        console.error("Error in profile menu action:", error);
        Alert.alert("Error", "No se pudo completar la acción");
      }
    }, 150);
  }, [navigation]);

  const handleLogout = useCallback(async () => {
    Alert.alert(
      "Cerrar sesión", 
      "¿Estás seguro que deseas cerrar sesión?", 
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Cerrar sesión",
          style: "destructive",
          onPress: async () => {
            try {
              if (signOut && typeof signOut === 'function') {
                await signOut();
              } else {
                Alert.alert("Error", "No se pudo cerrar la sesión");
              }
            } catch (error) {
              console.error("Error cerrando sesión:", error);
              Alert.alert("Error", "No se pudo cerrar la sesión");
            }
          },
        },
      ]
    );
  }, [signOut]);

  // ✅ Datos del usuario con validaciones robustas
  const userInfo = useMemo(() => {
    console.log("Calculating userInfo with user:", user, "userData:", userData);
    
    const getProfileImage = () => {
      try {
        const sources = [
          user?.profilePicture,
          user?.employerProfile?.profilePicture,
          user?.workerProfile?.profilePicture,
          userData?.profilePicture,
          userData?.employerProfile?.profilePicture,
          userData?.workerProfile?.profilePicture
        ].filter(Boolean); // Filtrar valores falsy
        
        return sources.length > 0 ? sources[0] : null;
      } catch (error) {
        console.warn("Error getting profile image:", error);
        return null;
      }
    };

    const getName = () => {
      try {
        return user?.name || 
               userData?.name || 
               user?.employerProfile?.user?.name ||
               user?.workerProfile?.user?.name ||
               "Administrador";
      } catch (error) {
        console.warn("Error getting name:", error);
        return "Administrador";
      }
    };

    const getEmail = () => {
      try {
        return user?.email || 
               userData?.email || 
               "admin@ejemplo.com";
      } catch (error) {
        console.warn("Error getting email:", error);
        return "admin@ejemplo.com";
      }
    };

    const getRole = () => {
      try {
        return user?.role?.name || 
               user?.role || 
               userData?.role?.name ||
               userData?.role ||
               "Administrador";
      } catch (error) {
        console.warn("Error getting role:", error);
        return "Administrador";
      }
    };

    const result = {
      displayName: getName(),
      email: getEmail(),
      role: getRole(),
      profileImage: getProfileImage(),
    };

    console.log("userInfo result:", result);
    return result;
  }, [user, userData]);

  // ✅ Items del menú con validaciones
  const menuItems = useMemo(() => {
    try {
      return [
        { 
          title: "Solicitudes de Terrenos", 
          icon: "agriculture", 
          route: "AdminDeletionRequests",
          isTabScreen: false, 
          gradient: [COLORS.primary, COLORS.secondary],
          description: "Gestionar solicitudes de eliminación de fincas"
        },
        { 
          title: "Usuarios por Calificación", 
          icon: "people", 
          route: "AdminUserRating", 
          isTabScreen: false,
          gradient: [COLORS.primary, COLORS.secondary],
          description: "Ver usuarios clasificados por puntuación"
        }
      ];
    } catch (error) {
      console.warn("Error creating menu items:", error);
      return [];
    }
  }, []);

  const profileMenuItems = useMemo(() => {
    try {
      return [
        { 
          title: "Cerrar Sesión", 
          icon: "logout", 
          action: "logout", 
          color: COLORS.error, 
          isDanger: true,
          description: "Salir de la aplicación"
        },
      ];
    } catch (error) {
      console.warn("Error creating profile menu items:", error);
      return [];
    }
  }, []);

  // ✅ Renders condicionales mejorados
  if (loading) {
    return (
      <View style={[styles.headerContainer, { paddingTop: statusBarHeight }]}>
        <View style={styles.header}>
          <LoadingState />
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.headerContainer, { paddingTop: statusBarHeight }]}>
        <View style={styles.header}>
          <View style={styles.errorContainer}>
            <Icon name="error" size={24} color={COLORS.error} />
            <Text style={styles.errorText}>Error al cargar</Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <>
      {/* Header Principal */}
      <View style={[styles.headerContainer, { paddingTop: statusBarHeight }]}>
        <View style={styles.header}>
          {/* Botón de menú */}
          <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
            <Pressable
              onPress={handleMenuPress}
              style={({ pressed }) => [
                styles.menuButton,
                pressed && styles.buttonPressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel="Abrir menú de navegación">
              <Icon name="menu" size={24} color={COLORS.primary} />
            </Pressable>
          </Animated.View>

          {/* Logo */}
          <View style={styles.logoContainer}>
            <Image source={DEFAULT_LOGO} style={styles.logo} />
          </View>

          {/* Botón de perfil */}
          <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
            <Pressable
              style={({ pressed }) => [
                styles.profileButton,
                pressed && styles.buttonPressed,
              ]}
              onPress={handleProfilePress}
              accessibilityRole="button"
              accessibilityLabel={`Perfil de ${userInfo.displayName}`}>
              <ProfileImage 
                source={userInfo.profileImage ? { uri: userInfo.profileImage } : null}
                size={CONSTANTS.PROFILE_IMAGE_SIZE} 
                showOnline={true}
              />
              <View style={styles.profileInfo}>
                <Text style={styles.profileName} numberOfLines={1}>
                  {userInfo.displayName.split(' ')[0]}
                </Text>
                <Animated.View style={{
                  transform: [{ 
                    rotate: isProfileDropdownOpen ? '180deg' : '0deg' 
                  }]
                }}>
                  <Icon name="keyboard-arrow-down" size={16} color={COLORS.gray500} />
                </Animated.View>
              </View>
            </Pressable>
          </Animated.View>
        </View>
      </View>

      {/* Modal Dropdown del Perfil */}
      <Modal
        animationType="none"
        transparent={true}
        visible={isProfileDropdownOpen}
        onRequestClose={() => setIsProfileDropdownOpen(false)}
        statusBarTranslucent>
        <TouchableWithoutFeedback onPress={() => setIsProfileDropdownOpen(false)}>
          <Animated.View style={[styles.modalOverlay, { opacity: fadeAnim }]}>
            <TouchableWithoutFeedback>
              <Animated.View
                style={[
                  styles.profileDropdownContainer,
                  {
                    opacity: profileDropdownAnim,
                    transform: [
                      {
                        translateY: profileDropdownAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [-30, 0],
                        }),
                      },
                      {
                        scale: profileDropdownAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.9, 1],
                        }),
                      },
                    ],
                  },
                ]}>
                
                {/* Header del dropdown */}
                <LinearGradient
                  colors={[COLORS.gray50, COLORS.white]}
                  style={styles.profileDropdownHeader}>
                  <View style={styles.profileHeaderContent}>
                    <ProfileImage 
                      source={userInfo.profileImage ? { uri: userInfo.profileImage } : null}
                      size={CONSTANTS.DROPDOWN_PROFILE_SIZE}
                      showOnline={true}
                    />
                    <View style={styles.profileDropdownInfo}>
                      <Text style={styles.profileDropdownName} numberOfLines={1}>
                        {userInfo.displayName}
                      </Text>
                      <Text style={styles.profileDropdownEmail} numberOfLines={1}>
                        {userInfo.email}
                      </Text>
                      <View style={styles.roleChip}>
                        <Icon name="verified" size={12} color={COLORS.secondary} />
                        <Text style={styles.profileDropdownRole}>{userInfo.role}</Text>
                      </View>
                    </View>
                  </View>
                </LinearGradient>

                {/* Items del menú */}
                <ScrollView 
                  style={styles.profileDropdownItems} 
                  showsVerticalScrollIndicator={false}
                  bounces={false}>
                  {profileMenuItems.map((item, index) => (
                    <Pressable
                      key={`profile-${index}`}
                      style={({ pressed }) => [
                        styles.profileDropdownItem,
                        item.isDanger && styles.profileDropdownDangerItem,
                        pressed && styles.dropdownItemPressed,
                      ]}
                      onPress={() => handleProfileMenuPress(item.action)}
                      accessibilityRole="button"
                      accessibilityLabel={item.title}>
                      <View style={[
                        styles.profileItemIconContainer,
                        { backgroundColor: `${item.color}15` }
                      ]}>
                        <Icon name={item.icon} size={18} color={item.color} />
                      </View>
                      <View style={styles.profileDropdownItemContent}>
                        <Text style={[
                          styles.profileDropdownItemText,
                          item.isDanger && styles.profileDropdownDangerText,
                        ]}>
                          {item.title}
                        </Text>
                        <Text style={styles.profileDropdownItemDescription}>
                          {item.description}
                        </Text>
                      </View>
                      <Icon name="chevron-right" size={16} color={COLORS.gray300} />
                    </Pressable>
                  ))}
                </ScrollView>
              </Animated.View>
            </TouchableWithoutFeedback>
          </Animated.View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Modal Menú Lateral */}
      <Modal
        animationType="none"
        transparent={true}
        visible={isMenuOpen}
        onRequestClose={() => setIsMenuOpen(false)}
        statusBarTranslucent>
        <TouchableWithoutFeedback onPress={() => setIsMenuOpen(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <Animated.View
                style={[
                  styles.menuContainer,
                  { transform: [{ translateX: slideAnim }] },
                ]}>
                
                {/* Header del menú */}
                <LinearGradient
                  colors={[COLORS.primary, COLORS.primaryLight]}
                  style={styles.menuUserInfo}>
                  <ProfileImage 
                    source={userInfo.profileImage ? { uri: userInfo.profileImage } : null}
                    size={CONSTANTS.MENU_PROFILE_SIZE}
                    showOnline={true}
                    style={{ marginRight: 16 }}
                  />
                  <View style={styles.menuUserTextContainer}>
                    <Text style={styles.menuUsername} numberOfLines={1}>
                      {userInfo.displayName}
                    </Text>
                    <Text style={styles.menuUserEmail} numberOfLines={1}>
                      {userInfo.email}
                    </Text>
                    <View style={styles.menuUserRoleContainer}>
                      <Icon name="business-center" size={12} color={COLORS.secondary} />
                      <Text style={styles.menuUserRoleText}>{userInfo.role}</Text>
                    </View>
                  </View>
                </LinearGradient>

                {/* Items del menú */}
                <ScrollView 
                  style={styles.menuItemsContainer} 
                  showsVerticalScrollIndicator={false}
                  bounces={false}>
                  <Text style={styles.menuSectionTitle}>Navegación Principal</Text>
                  {menuItems.map((item, index) => (
                    <Pressable
                      key={`menu-${index}`}
                      style={({ pressed }) => [
                        styles.menuItem,
                        pressed && styles.menuItemPressed,
                      ]}
                      onPress={() => handleMenuItemPress(item)}
                      accessibilityRole="button"
                      accessibilityLabel={item.title}>
                      <LinearGradient
                        colors={[`${item.gradient[0]}20`, `${item.gradient[1]}10`]}
                        style={styles.menuItemIconContainer}>
                        <Icon name={item.icon} size={20} color={item.gradient[0]} />
                      </LinearGradient>
                      <View style={styles.menuItemContent}>
                        <Text style={styles.menuItemText}>{item.title}</Text>
                        <Text style={styles.menuItemDescription}>{item.description}</Text>
                      </View>
                      <Icon name="chevron-right" size={16} color={COLORS.gray300} />
                    </Pressable>
                  ))}
                </ScrollView>

                {/* Footer del menú */}
                <View style={styles.menuFooter}>
                  <Pressable
                    style={({ pressed }) => [
                      styles.logoutButton,
                      pressed && styles.logoutButtonPressed,
                    ]}
                    onPress={() => {
                      setIsMenuOpen(false);
                      setTimeout(handleLogout, 200);
                    }}
                    accessibilityRole="button"
                    accessibilityLabel="Cerrar sesión">
                    <Icon name="logout" size={18} color={COLORS.error} />
                    <Text style={styles.logoutText}>Cerrar Sesión</Text>
                  </Pressable>
                </View>
              </Animated.View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </>
  );
};

// ✅ Estilos con validaciones de Platform
const styles = StyleSheet.create({
  headerContainer: {
    backgroundColor: COLORS.white,
    ...Platform.select({
      ios: {
        shadowColor: COLORS.cardShadow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 1,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
        shadowColor: COLORS.cardShadow, // Añadido para consistencia
      },
    }),
  },
  header: {
    height: CONSTANTS.HEADER_HEIGHT,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    backgroundColor: COLORS.white,
  },


  // Estados
  loadingContainer: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
    marginRight: 12,
  },
  loadingText: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: "500",
  },
  errorContainer: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    color: COLORS.error,
    fontSize: 16,
    fontWeight: "500",
    marginLeft: 8,
  },

  // Botones
  menuButton: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: COLORS.gray50,
    minWidth: 48,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
    borderRadius: 20,
    backgroundColor: COLORS.gray50,
    minHeight: 48,
  },
  buttonPressed: {
    backgroundColor: COLORS.gray100,
    transform: [{ scale: 0.96 }],
  },

  logoContainer: {
    position: "absolute",
    left: "50%",
    transform: [{ translateX: -60 }], // Mejor que marginLeft para precisión
    width: 120, // Añadido para mejor manejo de layout
  },
  logo: {
    width: 120,
    height: 36,
    resizeMode: "contain",
  },


  // Perfil
  profileImageContainer: {
    position: "relative",
  },
  profileImage: {
    borderWidth: 2,
    borderColor: COLORS.white,
    backgroundColor: COLORS.gray100,
  },
  onlineIndicator: {
    position: "absolute",
    backgroundColor: COLORS.success,
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  profileInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 8,
    marginRight: 4,
  },
  profileName: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.gray700,
    marginRight: 4,
    maxWidth: 60,
  },

  // Modal overlay
  modalOverlay: {
    flex: 1,
    backgroundColor: COLORS.backdrop,
  },

  // Dropdown perfil
  profileDropdownContainer: {
    position: "absolute",
    top: CONSTANTS.HEADER_HEIGHT + getStatusBarHeight() + 12,
    right: 20,
    width: 320,
    backgroundColor: COLORS.white,
    borderRadius: 20,
    overflow: "hidden",
    ...(Platform.select({
      ios: {
        shadowColor: COLORS.gray900,
        shadowOffset: { width: 0, height: 20 },
        shadowOpacity: 0.25,
        shadowRadius: 25,
      },
      android: {
        elevation: 20,
      },
    }) || {}),
  },
  profileDropdownHeader: {
    padding: 24,
  },
  profileHeaderContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  profileDropdownInfo: {
    marginLeft: 16,
    flex: 1,
  },
  profileDropdownName: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.gray800,
    marginBottom: 4,
  },
  profileDropdownEmail: {
    fontSize: 14,
    color: COLORS.gray500,
    marginBottom: 8,
  },
  roleChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  profileDropdownRole: {
    fontSize: 12,
    color: COLORS.secondary,
    fontWeight: "600",
    marginLeft: 4,
  },
  profileDropdownItems: {
    maxHeight: 300,
  },
  profileDropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray100,
  },
  profileDropdownDangerItem: {
    backgroundColor: `${COLORS.error}05`,
  },
  dropdownItemPressed: {
    backgroundColor: COLORS.gray50,
  },
  profileItemIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  profileDropdownItemContent: {
    flex: 1,
  },
  profileDropdownItemText: {
    fontSize: 15,
    color: COLORS.gray700,
    fontWeight: "500",
    marginBottom: 2,
  },
  profileDropdownItemDescription: {
    fontSize: 12,
    color: COLORS.gray400,
  },
  profileDropdownDangerText: {
    color: COLORS.error,
  },

  // Menú lateral
  menuContainer: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: CONSTANTS.MENU_WIDTH,
    backgroundColor: COLORS.white,
    ...(Platform.select({
      ios: {
        shadowColor: COLORS.gray900,
        shadowOffset: { width: 8, height: 0 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
      },
      android: {
        elevation: 16,
      },
    }) || {}),
  },
  menuUserInfo: {
    flexDirection: "row",
    alignItems: "center",
    padding: 24,
    paddingTop: getStatusBarHeight() + 24,
  },
  menuUserTextContainer: {
    flex: 1,
  },
  menuUsername: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.white,
    marginBottom: 2,
  },
  menuUserEmail: {
    fontSize: 13,
    color: `${COLORS.white}80`,
    marginBottom: 6,
  },
  menuUserRoleContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: `${COLORS.white}20`,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    alignSelf: "flex-start",
  },
  menuUserRoleText: {
    fontSize: 11,
    color: COLORS.secondary,
    fontWeight: "600",
    marginLeft: 4,
  },

  // Items del menú
  menuItemsContainer: {
    flex: 1,
    paddingTop: 16,
  },
  menuSectionTitle: {
    fontSize: 12,
    color: COLORS.gray400,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginHorizontal: 24,
    marginBottom: 12,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 24,
    marginHorizontal: 12,
    marginVertical: 2,
    borderRadius: 12,
  },
  menuItemPressed: {
    backgroundColor: COLORS.gray50,
    transform: [{ scale: 0.98 }],
  },
  menuItemIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  menuItemContent: {
    flex: 1,
  },
  menuItemText: {
    fontSize: 15,
    color: COLORS.gray700,
    fontWeight: "500",
    marginBottom: 2,
  },
  menuItemDescription: {
    fontSize: 12,
    color: COLORS.gray400,
  },

  // Footer
  menuFooter: {
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray200,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    paddingHorizontal: 20,
    backgroundColor: `${COLORS.error}10`,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: `${COLORS.error}20`,
  },
  logoutButtonPressed: {
    backgroundColor: `${COLORS.error}15`,
    transform: [{ scale: 0.98 }],
  },
  logoutText: {
    fontSize: 15,
    color: COLORS.error,
    fontWeight: "600",
    marginLeft: 8,
  },
});

export default React.memo(CustomHeaderAdmin);