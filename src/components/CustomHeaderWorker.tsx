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
} from "react-native";
import { getStatusBarHeight } from "../utils/dimensions";
import Icon from "react-native-vector-icons/MaterialIcons";
import { useAuth } from "../context/AuthContext";
import { getUserData } from "../services/userService";

const CustomHeaderWorker = ({ navigation }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [userData, setUserData] = useState(null);
  const [slideAnim] = useState(new Animated.Value(-300));
  const [profileDropdownAnim] = useState(new Animated.Value(0));
  const statusBarHeight = getStatusBarHeight();
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const { signOut, user } = useAuth();

  // Cargar datos del usuario
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        if (user?.id) {
          const data = await getUserData();
          setUserData(data);
        }
      } catch (error) {
        console.error("Error cargando datos del usuario:", error);
      }
    };

    fetchUserData();
  }, [user]);

  // Animación del menú lateral
  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: isMenuOpen ? 0 : -300,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [isMenuOpen]);

  // Animación del dropdown del perfil
  useEffect(() => {
    Animated.timing(profileDropdownAnim, {
      toValue: isProfileDropdownOpen ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [isProfileDropdownOpen]);

  const menuItems = [
    { title: "Mis trabajos", icon: "work", route: "MyJobs" },
    { title: "Mensajes", icon: "message", route: "Messages" },
    { title: "Calificar productor", icon: "star", route: "RateProducer" },
    {
      title: "Cancelar postulación",
      icon: "cancel",
      route: "CancelApplication",
    },
  ];

  const profileMenuItems = [
    { title: "Ver Perfil", icon: "person", action: "profile" },
    { title: "Cerrar Sesión", icon: "exit-to-app", action: "logout" },
    { title: "Cancelar Cuenta", icon: "delete-forever", action: "deleteAccount" },
  ];

  const handleMenuItemPress = (route) => {
    setIsMenuOpen(false);
    navigation.navigate(route);
  };

  const handleProfileMenuPress = async (action) => {
    setIsProfileDropdownOpen(false);
    
    switch (action) {
      case "profile":
        navigation.navigate("WorkerProfile");
        break;
      case "logout":
        handleLogout();
        break;
      case "deleteAccount":
        handleAccountCancellation();
        break;
      default:
        console.log(`Acción no implementada: ${action}`);
    }
  };

  const handleLogout = async () => {
    Alert.alert("Cerrar sesión", "¿Estás seguro que deseas cerrar sesión?", [
      {
        text: "Cancelar",
        style: "cancel",
      },
      {
        text: "Cerrar sesión",
        onPress: async () => {
          try {
            await signOut();
          } catch (error) {
            Alert.alert("Error", "Error al cerrar sesión");
          }
        },
        style: "destructive",
      },
    ]);
  };

  const handleAccountCancellation = () => {
    Alert.alert(
      "Cancelar cuenta",
      "¿Estás seguro que deseas cancelar tu cuenta? Esta acción no se puede deshacer.",
      [
        { text: "No", style: "cancel" },
        {
          text: "Sí, cancelar cuenta",
          style: "destructive",
          onPress: () => {
            console.log("Cancelar cuenta - Funcionalidad por implementar");
            // Aquí implementarías la lógica para cancelar la cuenta
          },
        },
      ]
    );
  };

  const getUserDisplayName = () => {
    return userData?.name || user?.name || "Usuario";
  };

  const getUserProfileImage = () => {
    if (userData?.profilePicture) {
      return { uri: userData.profilePicture };
    }
    if (userData?.workerProfile?.profilePicture) {
      return { uri: userData.workerProfile.profilePicture };
    }
    return require("../../assets/onboarding/slide1.webp");
  };

  return (
    <>
      <View style={[styles.headerContainer, { paddingTop: statusBarHeight }]}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => setIsMenuOpen(true)}
            style={styles.menuButton}>
            <Icon name="menu" size={28} color="#333" />
          </TouchableOpacity>

          <Image
            source={require("../../assets/logo.png")}
            style={styles.logo}
          />

          <TouchableOpacity
            style={styles.profileButton}
            onPress={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}>
            <Image
              source={getUserProfileImage()}
              style={styles.profileImage}
            />
            <View style={styles.profileIndicator}>
              <Icon 
                name={isProfileDropdownOpen ? "keyboard-arrow-up" : "keyboard-arrow-down"} 
                size={16} 
                color="#666" 
              />
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* Dropdown del Perfil */}
      {isProfileDropdownOpen && (
        <Modal
          animationType="none"
          transparent={true}
          visible={isProfileDropdownOpen}
          onRequestClose={() => setIsProfileDropdownOpen(false)}>
          <TouchableWithoutFeedback onPress={() => setIsProfileDropdownOpen(false)}>
            <View style={styles.profileDropdownOverlay}>
              <Animated.View
                style={[
                  styles.profileDropdownContainer,
                  {
                    opacity: profileDropdownAnim,
                    transform: [
                      {
                        translateY: profileDropdownAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [-10, 0],
                        }),
                      },
                    ],
                  },
                ]}>
                
                {/* Header del dropdown con info del usuario */}
                <View style={styles.profileDropdownHeader}>
                  <Image
                    source={getUserProfileImage()}
                    style={styles.profileDropdownImage}
                  />
                  <View style={styles.profileDropdownInfo}>
                    <Text style={styles.profileDropdownName}>
                      {getUserDisplayName()}
                    </Text>
                    <Text style={styles.profileDropdownEmail}>
                      {user?.email || "email@ejemplo.com"}
                    </Text>
                  </View>
                </View>

                {/* Separador */}
                <View style={styles.profileDropdownSeparator} />

                {/* Items del menú */}
                <ScrollView style={styles.profileDropdownItems}>
                  {profileMenuItems.map((item, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.profileDropdownItem,
                        (item.action === "logout" || item.action === "deleteAccount") && 
                        styles.profileDropdownDangerItem
                      ]}
                      onPress={() => handleProfileMenuPress(item.action)}>
                      <Icon 
                        name={item.icon} 
                        size={20} 
                        color={
                          item.action === "logout" ? "#FF6B6B" : 
                          item.action === "deleteAccount" ? "#FF4757" : "#666"
                        } 
                      />
                      <Text style={[
                        styles.profileDropdownItemText,
                        (item.action === "logout" || item.action === "deleteAccount") && 
                        styles.profileDropdownDangerText
                      ]}>
                        {item.title}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </Animated.View>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      )}

      {/* Menú lateral */}
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
                  {
                    transform: [{ translateX: slideAnim }],
                    paddingTop: statusBarHeight,
                  },
                ]}>
                <View style={styles.menuHeader}>
                  <Image
                    source={require("../../assets/logo.png")}
                    style={styles.menuLogo}
                  />
                  <Text style={styles.menuTitle}>Menú</Text>
                </View>

                <ScrollView style={styles.menuItemsContainer}>
                  {menuItems.map((item, index) => (
                    <TouchableOpacity
                      key={index}
                      style={styles.menuItem}
                      onPress={() => handleMenuItemPress(item.route)}>
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
    backgroundColor: "#fff",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 15,
    backgroundColor: "#fff",
  },
  menuButton: {
    padding: 5,
  },
  logo: {
    width: 120,
    height: 40,
    resizeMode: "contain",
    position: "absolute",
    left: "50%",
    marginLeft: -60,
  },
  profileButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 5,
    borderRadius: 25,
    backgroundColor: "#f8f9fa",
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "#e9ecef",
  },
  profileIndicator: {
    marginLeft: 8,
    marginRight: 4,
  },

  // Estilos del dropdown del perfil
  profileDropdownOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.1)",
  },
  profileDropdownContainer: {
    position: "absolute",
    top: 60 + getStatusBarHeight(),
    right: 15,
    width: 280,
    backgroundColor: "#fff",
    borderRadius: 12,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  profileDropdownHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#f8f9fa",
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  profileDropdownImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: "#e9ecef",
  },
  profileDropdownInfo: {
    marginLeft: 15,
    flex: 1,
  },
  profileDropdownName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#212529",
    marginBottom: 4,
  },
  profileDropdownEmail: {
    fontSize: 14,
    color: "#6c757d",
  },
  profileDropdownSeparator: {
    height: 1,
    backgroundColor: "#e9ecef",
  },
  profileDropdownItems: {
    maxHeight: 300,
  },
  profileDropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f8f9fa",
  },
  profileDropdownDangerItem: {
    borderBottomColor: "#ffe6e6",
  },
  profileDropdownItemText: {
    fontSize: 15,
    color: "#495057",
    marginLeft: 15,
    fontWeight: "500",
  },
  profileDropdownDangerText: {
    color: "#FF4757",
  },

  // Estilos del menú lateral (sin cambios)
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  menuContainer: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 280,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  menuHeader: {
    backgroundColor: "#f8f8f8",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
    alignItems: "center",
  },
  menuLogo: {
    width: 100,
    height: 35,
    resizeMode: "contain",
    marginBottom: 10,
  },
  menuTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  menuItemsContainer: {
    flex: 1,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  menuItemText: {
    fontSize: 16,
    color: "#333",
    marginLeft: 20,
  },
});

export default CustomHeaderWorker;