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
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getStatusBarHeight } from "../utils/dimensions";
import Icon from "react-native-vector-icons/MaterialIcons";
import { Alert } from "react-native";
import { useAuth } from "../context/AuthContext";

// Color principal de la aplicación
const PRIMARY_COLOR = "#284F66";

const CustomHeader = ({ navigation }) => {
  const [userData, setUserData] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [slideAnim] = useState(new Animated.Value(-300));
  const [fadeAnim] = useState(new Animated.Value(0));
  const statusBarHeight = getStatusBarHeight();
  const { signOut } = useAuth();

  useEffect(() => {
    loadUserData();
  }, []);

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: isMenuOpen ? 0 : -300,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [isMenuOpen]);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: isProfileDropdownOpen ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [isProfileDropdownOpen]);

  const loadUserData = async () => {
    try {
      const storedUserData = await AsyncStorage.getItem("@user_data");
      if (storedUserData) {
        setUserData(JSON.parse(storedUserData));
      }
    } catch (error) {
      console.error("Error loading user data:", error);
    }
  };

  const menuItems = [
    { title: "Inicio", icon: "home", route: "Home", isTabScreen: true },
    {
      title: "Empleados",
      icon: "people",
      route: "WorkerList",
      isTabScreen: false,
    },
    {
      title: "Ofertas de trabajo",
      icon: "work",
      route: "JobOffers",
      isTabScreen: false,
    },
  ];

  const handleMenuItemPress = (item) => {
    setIsMenuOpen(false);

    if (item.isTabScreen) {
      navigation.navigate("MainApp", {
        screen: item.route,
      });
    } else {
      navigation.navigate(item.route);
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
            console.log("Cancelar cuenta");
          },
        },
      ]
    );
  };

  return (
    <>
      <View style={[styles.headerContainer, { paddingTop: statusBarHeight }]}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => setIsMenuOpen(true)}
            style={styles.menuButton}>
            <Icon name="menu" size={28} color={PRIMARY_COLOR} />
          </TouchableOpacity>

          <Image
            source={require("../../assets/logo.png")}
            style={styles.logo}
          />

          <TouchableOpacity
            style={styles.profileButton}
            onPress={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}>
            <Image
              source={
                userData?.profilePicture
                  ? { uri: userData.profilePicture }
                  : require("../../assets/onboarding/slide1.webp")
              }
              style={styles.profileImage}
            />
          </TouchableOpacity>
        </View>
        {isProfileDropdownOpen && (
          <Animated.View
            style={[styles.profileDropdown, { opacity: fadeAnim }]}>
            <TouchableOpacity
              style={styles.dropdownItem}
              onPress={handleAccountCancellation}>
              <Icon name="cancel" size={20} color={PRIMARY_COLOR} />
              <Text style={styles.dropdownItemText}>Cancelar cuenta</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.dropdownItem, styles.dropdownItemLast]}
              onPress={() => {
                setIsProfileDropdownOpen(false);
                handleLogout();
              }}>
              <Icon name="logout" size={20} color="#ff4444" />
              <Text style={[styles.dropdownItemText, { color: "#ff4444" }]}>
                Cerrar sesión
              </Text>
            </TouchableOpacity>
          </Animated.View>
        )}
      </View>

      {isProfileDropdownOpen && (
        <TouchableWithoutFeedback
          onPress={() => setIsProfileDropdownOpen(false)}>
          <View style={styles.dropdownOverlay} />
        </TouchableWithoutFeedback>
      )}

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
                  <View style={styles.menuUserInfo}>
                    <Image
                      source={
                        userData?.profilePicture
                          ? { uri: userData.profilePicture }
                          : require("../../assets/default-profile.png")
                      }
                      style={styles.menuProfilePic}
                    />
                    <View style={styles.menuUserTextContainer}>
                      <Text style={styles.menuUsername}>
                        {userData?.name || "Usuario"}
                      </Text>
                      <Text style={styles.menuUserEmail}>
                        {userData?.email || "email@ejemplo.com"}
                      </Text>
                    </View>
                  </View>
                </View>

                <ScrollView style={styles.menuItemsContainer}>
                  {menuItems.map((item, index) => (
                    <TouchableOpacity
                      key={index}
                      style={styles.menuItem}
                      onPress={() => handleMenuItemPress(item)}>
                      <Icon name={item.icon} size={24} color={PRIMARY_COLOR} />
                      <Text style={styles.menuItemText}>{item.title}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                <View style={styles.menuFooter}>
                  <TouchableOpacity
                    style={styles.logoutButton}
                    onPress={() => {
                      setIsMenuOpen(false);
                      handleLogout();
                    }}>
                    <Icon name="logout" size={24} color="#ff4444" />
                    <Text style={styles.logoutText}>Cerrar sesión</Text>
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
    zIndex: 1000,
  },
  header: {
    height: 60,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 15,
    backgroundColor: "#fff",
  },
  menuButton: {
    padding: 5,
  },
  profileButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: "hidden",
  },
  profileImage: {
    width: 48,
    height: 48,
  },
  logo: {
    width: 120,
    height: 40,
    resizeMode: "contain",
    position: "absolute",
    left: "50%",
    marginLeft: -60,
  },
  profileContainer: {
    padding: 5,
  },
  profilePic: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "#ddd",
  },
  profileDropdown: {
    position: "absolute",
    top: 85,
    right: 15,
    width: 200,
    backgroundColor: "#fff",
    borderRadius: 8,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 3,
      },
      android: {
        elevation: 5,
      },
    }),
    zIndex: 1001,
  },
  dropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  dropdownItemLast: {
    borderBottomWidth: 0,
  },
  dropdownItemText: {
    fontSize: 16,
    color: PRIMARY_COLOR,
    marginLeft: 12,
  },
  dropdownOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "transparent",
    zIndex: 999,
  },
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
  },
  menuUserInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  menuProfilePic: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
  },
  menuUserTextContainer: {
    flex: 1,
  },
  menuUsername: {
    fontSize: 16,
    fontWeight: "bold",
    color: PRIMARY_COLOR,
  },
  menuUserEmail: {
    fontSize: 14,
    color: "#666",
    marginTop: 2,
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
    color: PRIMARY_COLOR,
    marginLeft: 20,
  },
  menuFooter: {
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
    padding: 20,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  logoutText: {
    fontSize: 16,
    color: "#ff4444",
    marginLeft: 20,
  },
});

export default CustomHeader;
