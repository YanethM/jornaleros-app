import React, { useState, useEffect } from "react";
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
  Alert,
  StatusBar,
  Dimensions,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Icon from "react-native-vector-icons/MaterialIcons";
import { useAuth } from "../context/AuthContext";
import { LinearGradient } from 'expo-linear-gradient'; // Si usas Expo, o react-native-linear-gradient
import { logout } from "../services/authService";

// ✅ Función helper para obtener altura del status bar
const getStatusBarHeight = () => {
  if (Platform.OS === 'ios') {
    const { height, width } = Dimensions.get('window');
    return height === 812 || width === 812 || height === 844 || width === 844 || height === 896 || width === 896 || height === 926 || width === 926 ? 44 : 20;
  }
  return StatusBar.currentHeight || 24;
};

// 🎨 Paleta de colores modernizada
const COLORS = {
  primary: "#284F66",
  primaryLight: "#3A6B87",
  primaryDark: "#1A3B4D",
  secondary: "#B6883E",
  secondaryLight: "#D4A45C",
  secondaryDark: "#8A652E",
  
  // Grises modernos
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
  
  // Estados
  success: "#10B981",
  warning: "#F59E0B",
  error: "#EF4444",
  info: "#3B82F6",
  
  // Superficie
  white: "#FFFFFF",
  surface: "#FEFEFE",
  overlay: "rgba(15, 23, 42, 0.4)",
  backdrop: "rgba(0, 0, 0, 0.25)",
};

const CustomHeader = ({ navigation }) => {
  const [userData, setUserData] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [slideAnim] = useState(new Animated.Value(-320));
  const [fadeAnim] = useState(new Animated.Value(0));
  const [profileDropdownAnim] = useState(new Animated.Value(0));
  const [profileScaleAnim] = useState(new Animated.Value(1));
  const [menuScaleAnim] = useState(new Animated.Value(1));
  const [loading, setLoading] = useState(true);
  
  const statusBarHeight = getStatusBarHeight();
  const { signOut, user } = useAuth();

  useEffect(() => {
    loadUserData();
  }, [user]);

  // ✅ Animaciones mejoradas
  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: isMenuOpen ? 0 : -320,
      damping: 20,
      stiffness: 90,
      useNativeDriver: true,
    }).start();
  }, [isMenuOpen, slideAnim]);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: isProfileDropdownOpen ? 1 : 0,
      duration: 250,
      useNativeDriver: true,
    }).start();
  }, [isProfileDropdownOpen, fadeAnim]);

  useEffect(() => {
    Animated.spring(profileDropdownAnim, {
      toValue: isProfileDropdownOpen ? 1 : 0,
      damping: 15,
      stiffness: 150,
      useNativeDriver: true,
    }).start();
  }, [isProfileDropdownOpen, profileDropdownAnim]);

  // 🎭 Micro-animaciones para interacciones
  const handleProfilePress = () => {
    Animated.sequence([
      Animated.timing(profileScaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(profileScaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
    setIsProfileDropdownOpen(!isProfileDropdownOpen);
  };

  const handleMenuPress = () => {
    Animated.sequence([
      Animated.timing(menuScaleAnim, {
        toValue: 0.9,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(menuScaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
    setIsMenuOpen(true);
  };

  const loadUserData = async () => {
    try {
      setLoading(true);
      const storedUserData = await AsyncStorage.getItem("@user_data");
      if (storedUserData) {
        setUserData(JSON.parse(storedUserData));
      }
    } catch (error) {
      console.error("Error loading user data:", error);
    } finally {
      setLoading(false);
    }
  };

  const menuItems = [
    { 
      title: "Ofertas de Trabajo", 
      icon: "work", 
      route: "JobOffers", 
      isTabScreen: false, 
      gradient: [COLORS.primary, "#FBBF24"] 
    },
    {
      title: "Postulaciones",
      icon: "how-to-reg", // Icono de registro/aplicación
      route: "JobOfferWithApplication",
      isTabScreen: false,
      gradient: [COLORS.primary, COLORS.secondaryLight]
    },
    {
      title: "Trabajadores",
      icon: "person-search", // Icono de búsqueda de personas (si está disponible)
      route: "WorkerList",
      isTabScreen: false,
      gradient: [COLORS.primary, COLORS.secondaryLight]
    },
  ];

  // ✅ Opciones del dropdown modernizadas
  const profileMenuItems = [
    { title: "Ver Perfil", icon: "person", action: "profile", color: COLORS.primary },
    { title: "Tutorial", icon: "help-outline", action: "help", color: COLORS.info },
    { title: "Cerrar Sesión", icon: "logout", action: "logout", color: COLORS.error, isDanger: true },
    { title: "Cancelar Cuenta", icon: "delete-forever", action: "deleteAccount", color: COLORS.error, isDanger: true },
  ];

  const handleMenuItemPress = (item) => {
    setIsMenuOpen(false);
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
  };

  const handleProfileMenuPress = async (action) => {
    setIsProfileDropdownOpen(false);
    switch (action) {
      case "profile":
        try {
          navigation.navigate("Profile");
        } catch (error) {
          Alert.alert("Error", "No se pudo abrir el perfil");
        }
        break;
      case "help":
        navigation.navigate("TutorialApp");
        break;
      case "logout":
        handleLogout();
        break;
      case "deleteAccount":
        handleAccountCancellation();
        break;
    }
  };
  const handleLogout = async () => {
    Alert.alert("Cerrar sesión", "¿Estás seguro que deseas cerrar sesión?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Cerrar sesión",
        onPress: async () => {
          try {
            await signOut();
          } catch (error) {
            console.error("Error cerrando sesión:", error);
          }
        },
        style: "destructive",
      },
    ]);
  };

  const handleAccountCancellation = () => {
    Alert.alert(
      "Cancelar cuenta",
      "⚠️ Esta acción eliminará permanentemente tu cuenta y todos tus datos.\n\n¿Estás completamente seguro?",
      [
        { text: "No, mantener cuenta", style: "cancel" },
        {
          text: "Sí, eliminar definitivamente",
          style: "destructive",
          onPress: () => {
            // Navegar al componente CancelAccount
            try {
              navigation.navigate("CancelAccount");
            } catch (error) {
              Alert.alert("Error", "No se pudo abrir la pantalla de cancelación");
            }
          },
        },
      ]
    );
  };
  
  const getUserDisplayName = () => {
    if (user?.name) return user.name;
    if (userData?.name) return userData.name;
    if (user?.employerProfile?.user?.name) return user.employerProfile.user.name;
    return "Empleador";
  };

  const getUserEmail = () => {
    if (user?.email) return user.email;
    if (userData?.email) return userData.email;
    return "email@ejemplo.com";
  };

  const getUserProfileImage = () => {
    if (user?.profilePicture) return { uri: user.profilePicture };
    if (user?.employerProfile?.profilePicture) return { uri: user.employerProfile.profilePicture };
    if (userData?.profilePicture) return { uri: userData.profilePicture };
    if (userData?.employerProfile?.profilePicture) return { uri: userData.employerProfile.profilePicture };
    return require("../../assets/onboarding/slide1.png");
  };

  const getLogoImage = () => {
    try {
      return require("../../assets/logo.png");
    } catch (error) {
      return require("../../assets/logo.png");
    }
  };

  const getUserRole = () => {
    if (user?.role?.name) return user.role.name;
    if (user?.role) return user.role;
    return "Empleador";
  };

  if (loading) {
    return (
      <View style={[styles.headerContainer, { paddingTop: statusBarHeight }]}>
        <View style={styles.header}>
          <View style={styles.loadingContainer}>
            <View style={styles.loadingDot} />
            <Text style={styles.loadingText}>Cargando...</Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <>
      <View style={[styles.headerContainer, { paddingTop: statusBarHeight }]}>
        <View style={styles.header}>
          <Animated.View style={{ transform: [{ scale: menuScaleAnim }] }}>
            <TouchableOpacity
              onPress={handleMenuPress}
              style={styles.menuButton}
              activeOpacity={0.8}>
              <View style={styles.menuIconContainer}>
                <Icon name="menu" size={24} color={COLORS.primary} />
              </View>
            </TouchableOpacity>
          </Animated.View>

          <View style={styles.logoContainer}>
            <Image source={getLogoImage()} style={styles.logo} />
          </View>

          <Animated.View style={{ transform: [{ scale: profileScaleAnim }] }}>
            <TouchableOpacity
              style={styles.profileButton}
              onPress={handleProfilePress}
              activeOpacity={0.9}>
              <View style={styles.profileImageContainer}>
                <Image source={getUserProfileImage()} style={styles.profileImage} />
                <View style={styles.onlineIndicator} />
              </View>
              <View style={styles.profileInfo}>
                <Text style={styles.profileName} numberOfLines={1}>
                  {getUserDisplayName().split(' ')[0]}
                </Text>
                <Icon
                  name={isProfileDropdownOpen ? "keyboard-arrow-up" : "keyboard-arrow-down"}
                  size={16}
                  color={COLORS.gray500}
                />
              </View>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </View>

      {/* 🎨 Dropdown del Perfil - Diseño completamente moderno */}
      {isProfileDropdownOpen && (
        <Modal
          animationType="none"
          transparent={true}
          visible={isProfileDropdownOpen}
          onRequestClose={() => setIsProfileDropdownOpen(false)}>
          <TouchableWithoutFeedback onPress={() => setIsProfileDropdownOpen(false)}>
            <Animated.View style={[styles.profileDropdownOverlay, { opacity: fadeAnim }]}>
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
                  
                  {/* Header del dropdown con gradiente */}
                  <View style={styles.profileDropdownHeader}>
                    <View style={styles.profileHeaderContent}>
                      <View style={styles.profileDropdownImageContainer}>
                        <Image source={getUserProfileImage()} style={styles.profileDropdownImage} />
                        <View style={styles.profileDropdownOnlineIndicator} />
                      </View>
                      <View style={styles.profileDropdownInfo}>
                        <Text style={styles.profileDropdownName}>{getUserDisplayName()}</Text>
                        <Text style={styles.profileDropdownEmail}>{getUserEmail()}</Text>
                        <View style={styles.roleChip}>
                          <Icon name="verified" size={12} color={COLORS.secondary} />
                          <Text style={styles.profileDropdownRole}>{getUserRole()}</Text>
                        </View>
                      </View>
                    </View>
                  </View>

                  {/* Items del menú con diseño moderno */}
                  <ScrollView style={styles.profileDropdownItems} showsVerticalScrollIndicator={false}>
                    {profileMenuItems.map((item, index) => (
                      <TouchableOpacity
                        key={index}
                        style={[
                          styles.profileDropdownItem,
                          item.isDanger && styles.profileDropdownDangerItem,
                        ]}
                        onPress={() => handleProfileMenuPress(item.action)}
                        activeOpacity={0.7}>
                        <View style={[
                          styles.profileItemIconContainer,
                          { backgroundColor: item.isDanger ? `${COLORS.error}15` : `${item.color}15` }
                        ]}>
                          <Icon name={item.icon} size={18} color={item.color} />
                        </View>
                        <Text style={[
                          styles.profileDropdownItemText,
                          item.isDanger && styles.profileDropdownDangerText,
                        ]}>
                          {item.title}
                        </Text>
                        <Icon name="chevron-right" size={16} color={COLORS.gray300} />
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </Animated.View>
              </TouchableWithoutFeedback>
            </Animated.View>
          </TouchableWithoutFeedback>
        </Modal>
      )}

      {/* 🎨 Menú lateral - Diseño completamente modernizado */}
      <Modal
        animationType="none"
        transparent={true}
        visible={isMenuOpen}
        onRequestClose={() => setIsMenuOpen(false)}>
        <TouchableWithoutFeedback onPress={() => setIsMenuOpen(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <Animated.View
                style={[
                  styles.menuContainer,
                  { transform: [{ translateX: slideAnim }] },
                ]}>
                


                {/* Info del usuario */}
                <View style={styles.menuUserInfo}>
                  <View style={styles.menuProfileContainer}>
                    <Image source={getUserProfileImage()} style={styles.menuProfilePic} />
                    <View style={styles.menuOnlineIndicator} />
                  </View>
                  <View style={styles.menuUserTextContainer}>
                    <Text style={styles.menuUsername}>{getUserDisplayName()}</Text>
                    <Text style={styles.menuUserEmail}>{getUserEmail()}</Text>
                    <View style={styles.menuUserRoleContainer}>
                      <Icon name="business-center" size={12} color={COLORS.secondary} />
                      <Text style={styles.menuUserRoleText}>{getUserRole()}</Text>
                    </View>
                  </View>
                </View>

                {/* Items del menú con gradientes */}
                <ScrollView style={styles.menuItemsContainer} showsVerticalScrollIndicator={false}>
                  <Text style={styles.menuSectionTitle}>Navegación Principal</Text>
                  {menuItems.map((item, index) => (
                    <TouchableOpacity
                      key={index}
                      style={styles.menuItem}
                      onPress={() => handleMenuItemPress(item)}
                      activeOpacity={0.8}>
                      <View style={[
                        styles.menuItemIconContainer,
                        { backgroundColor: `${item.gradient[0]}20` }
                      ]}>
                        <Icon name={item.icon} size={20} color={item.gradient[0]} />
                      </View>
                      <Text style={styles.menuItemText}>{item.title}</Text>
                      <Icon name="chevron-right" size={16} color={COLORS.gray300} />
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                {/* Footer moderno */}
                <View style={styles.menuFooter}>
                  <TouchableOpacity
                    style={styles.logoutButton}
                    onPress={() => {
                      setIsMenuOpen(false);
                      handleLogout();
                    }}
                    activeOpacity={0.8}>
                    <Icon name="logout" size={18} color={COLORS.error} />
                    <Text style={styles.logoutText}>Cerrar Sesión</Text>
                  </TouchableOpacity>
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
    backgroundColor: COLORS.white,
    ...Platform.select({
      ios: {
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  header: {
    height: 64,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    backgroundColor: COLORS.white,
  },
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
    opacity: 0.7,
  },
  loadingText: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: "500",
  },

  // 🎨 Botón de menú moderno
  menuButton: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: COLORS.gray50,
  },
  menuIconContainer: {
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },

  // 🎨 Logo centrado
  logoContainer: {
    position: "absolute",
    left: "50%",
    marginLeft: -60,
  },
  logo: {
    width: 120,
    height: 36,
    resizeMode: "contain",
  },

  // 🎨 Botón de perfil moderno
  profileButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
    borderRadius: 20,
    backgroundColor: COLORS.gray50,
  },
  profileImageContainer: {
    position: "relative",
  },
  profileImage: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: COLORS.white,
    backgroundColor: COLORS.gray100,
  },
  onlineIndicator: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
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

  // 🎨 Dropdown del perfil modernizado
  profileDropdownOverlay: {
    flex: 1,
    backgroundColor: COLORS.backdrop,
  },
  profileDropdownContainer: {
    position: "absolute",
    top: 64 + getStatusBarHeight() + 12,
    right: 20,
    width: 320,
    backgroundColor: COLORS.white,
    borderRadius: 20,
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: COLORS.gray900,
        shadowOffset: { width: 0, height: 20 },
        shadowOpacity: 0.25,
        shadowRadius: 25,
      },
      android: {
        elevation: 20,
      },
    }),
  },
  profileDropdownHeader: {
    backgroundColor: COLORS.gray50,
    padding: 24,
  },
  profileHeaderContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  profileDropdownImageContainer: {
    position: "relative",
  },
  profileDropdownImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 3,
    borderColor: COLORS.white,
    backgroundColor: COLORS.gray100,
  },
  profileDropdownOnlineIndicator: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: COLORS.success,
    borderWidth: 3,
    borderColor: COLORS.white,
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
  profileItemIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  profileDropdownItemText: {
    fontSize: 15,
    color: COLORS.gray700,
    fontWeight: "500",
    flex: 1,
  },
  profileDropdownDangerText: {
    color: COLORS.error,
  },

  // 🎨 Menú lateral modernizado
  modalOverlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
  },
  menuContainer: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 320,
    backgroundColor: COLORS.white,
    ...Platform.select({
      ios: {
        shadowColor: COLORS.gray900,
        shadowOffset: { width: 8, height: 0 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
      },
      android: {
        elevation: 16,
      },
    }),
  },
  menuHeader: {
    backgroundColor: COLORS.primary,
    paddingTop: 60,
    paddingBottom: 32,
    paddingHorizontal: 24,
  },
  menuHeaderContent: {
    alignItems: "center",
  },
  menuLogoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.white,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: COLORS.primaryDark,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  menuLogo: {
    width: 60,
    height: 24,
    resizeMode: "contain",
  },
  menuTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.white,
    marginBottom: 4,
    textAlign: "center",
  },
  menuSubtitle: {
    fontSize: 13,
    color: `${COLORS.white}80`,
    textTransform: "uppercase",
    letterSpacing: 1.2,
    fontWeight: "500",
  },

  // 🎨 Info de usuario en menú
  menuUserInfo: {
    flexDirection: "row",
    alignItems: "center",
    padding: 24,
    backgroundColor: COLORS.gray50,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray200,
  },
  menuProfileContainer: {
    position: "relative",
  },
  menuProfilePic: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 3,
    borderColor: COLORS.white,
    backgroundColor: COLORS.gray100,
  },
  menuOnlineIndicator: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: COLORS.success,
    borderWidth: 3,
    borderColor: COLORS.white,
  },
  menuUserTextContainer: {
    marginLeft: 16,
    flex: 1,
  },
  menuUsername: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.gray800,
    marginBottom: 2,
  },
  menuUserEmail: {
    fontSize: 13,
    color: COLORS.gray500,
    marginBottom: 6,
  },
  menuUserRoleContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
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

  // 🎨 Items del menú
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
  menuItemIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  menuItemText: {
    fontSize: 15,
    color: COLORS.gray700,
    fontWeight: "500",
    flex: 1,
  },

  // 🎨 Footer del menú
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
  logoutText: {
    fontSize: 15,
    color: COLORS.error,
    fontWeight: "600",
    marginLeft: 8,
  },
  appVersion: {
    fontSize: 12,
    color: COLORS.gray400,
    textAlign: "center",
    marginTop: 16,
    fontWeight: "500",
  },
});

export default CustomHeader;