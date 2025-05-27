import React, { useRef, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  Animated,
  Platform,
  Dimensions,
} from "react-native";
import { useAuth } from "../../context/AuthContext";
import ScreenLayout from "../../components/ScreenLayout";
import Icon from "react-native-vector-icons/MaterialIcons";

const PRIMARY_COLOR = "#284F66";

const ProfileScreen = ({ navigation }) => {
  const { signOut, user } = useAuth();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    console.log("=== INFORMACIÓN COMPLETA DEL USUARIO ===");
    console.log(JSON.stringify(user, null, 2));
    console.log("======================================");
  }, [user]);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleEditProfile = () => {
    navigation.navigate("EditProfile");
  };

  const infoItems = [];
  
  // Información básica del usuario
  if (user?.name) {
    infoItems.push({
      label: "Nombre",
      value: user.name,
      icon: "person",
    });
  }

  if (user?.lastname) {
    infoItems.push({
      label: "Apellido",
      value: user.lastname,
      icon: "person-outline",
    });
  }

  if (user?.email) {
    infoItems.push({
      label: "Email",
      value: user.email,
      icon: "email",
    });
  }

  if (user?.phone) {
    infoItems.push({
      label: "Teléfono",
      value: user.phone,
      icon: "phone",
    });
  }

  if (user?.documentType && user?.documentId) {
    infoItems.push({
      label: "Documento",
      value: `${user.documentType} ${user.documentId}`,
      icon: "badge",
    });
  }

  if (user?.nationality) {
    infoItems.push({
      label: "Nacionalidad",
      value: user.nationality,
      icon: "flag",
    });
  }

  // Información de ubicación personal
  if (user?.city || user?.state) {
    const locationParts = [user.city, user.state].filter(Boolean);
    infoItems.push({
      label: "Ubicación Personal",
      value: locationParts
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(", "),
      icon: "home",
    });
  }

  // Información del empleador
  if (user?.employerProfile) {
    const { city, state, organization, status } = user.employerProfile;

    if (city || state) {
      const locationParts = [city, state].filter(Boolean);
      infoItems.push({
        label: "Ubicación de Trabajo",
        value: locationParts
          .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
          .join(", "),
        icon: "location-on",
      });
    }

    if (organization) {
      infoItems.push({
        label: "Organización",
        value: organization,
        icon: "business",
      });
    }

    if (status !== undefined) {
      infoItems.push({
        label: "Estado del perfil",
        value: status ? "Activo" : "Inactivo",
        icon: status ? "check-circle" : "cancel",
      });
    }
  }

  if (user?.role) {
    const roleName =
      typeof user.role === "object" && user.role.name
        ? user.role.name
        : typeof user.role === "string"
        ? user.role
        : "Rol no especificado";

    infoItems.push({
      label: "Rol",
      value: roleName,
      icon: "security",
    });
  }

  const getInitials = () => {
    const first = user?.name?.[0] || "";
    const last = user?.lastname?.[0] || "";
    return `${first}${last}`.toUpperCase() || "U";
  };

  const getFullName = () => {
    const name = user?.name || "";
    const lastname = user?.lastname || "";
    return `${name} ${lastname}`.trim() || "Usuario";
  };

  return (
    <ScreenLayout navigation={navigation}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <Animated.View
          style={[
            styles.profileHeader,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}>
          <View style={styles.headerBackground} />

          <View style={styles.profileContent}>
            <View style={styles.avatarContainer}>
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>{getInitials()}</Text>
              </View>
              <TouchableOpacity style={styles.editAvatarButton}>
                <Icon name="camera-alt" size={20} color="#fff" />
              </TouchableOpacity>
            </View>

            <Text style={styles.userName}>{getFullName()}</Text>
            <Text style={styles.userRole}>
              {user?.role?.name || "Sin rol asignado"}
            </Text>

            <TouchableOpacity
              style={styles.editProfileButton}
              onPress={handleEditProfile}>
              <Icon
                name="edit"
                size={18}
                color="#fff"
                style={styles.editIcon}
              />
              <Text style={styles.editProfileText}>Editar perfil</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Info Section */}
        <Animated.View
          style={[
            styles.infoSection,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}>
          <Text style={styles.sectionTitle}>Información Personal</Text>

          {infoItems.length > 0 ? (
            infoItems.map((item, index) => (
              <View
                key={index}
                style={[
                  styles.infoItem,
                  index === infoItems.length - 1 && styles.lastInfoItem,
                ]}>
                <View style={styles.infoLeft}>
                  <Icon
                    name={item.icon}
                    size={22}
                    color={PRIMARY_COLOR}
                    style={styles.infoIcon}
                  />
                  <View>
                    <Text style={styles.infoLabel}>{item.label}</Text>
                    <Text style={styles.infoValue}>{item.value}</Text>
                  </View>
                </View>
                <Icon name="chevron-right" size={24} color="#ccc" />
              </View>
            ))
          ) : (
            <Text style={styles.noInfoText}>No hay información disponible</Text>
          )}
        </Animated.View>
        <View style={{ height: 30 }} />
      </ScrollView>
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  profileHeader: {
    backgroundColor: "#fff",
    paddingBottom: 30,
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
  headerBackground: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 150,
    backgroundColor: PRIMARY_COLOR,
  },
  profileContent: {
    alignItems: "center",
    paddingTop: 40,
  },
  avatarContainer: {
    position: "relative",
    marginBottom: 20,
  },
  avatarPlaceholder: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: "#C19A6B",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 4,
    borderColor: "#fff",
  },
  avatarText: {
    fontSize: 44,
    color: "#fff",
    fontWeight: "bold",
  },
  editAvatarButton: {
    position: "absolute",
    bottom: 5,
    right: 5,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: PRIMARY_COLOR,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#fff",
  },
  userName: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 5,
  },
  userRole: {
    fontSize: 17,
    color: "#666",
    textTransform: "capitalize",
    marginBottom: 20,
  },
  editProfileButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: PRIMARY_COLOR,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
  },
  editIcon: {
    marginRight: 8,
  },
  editProfileText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
  statsContainer: {
    flexDirection: "row",
    backgroundColor: "#fff",
    marginTop: 20,
    paddingVertical: 20,
    marginHorizontal: 20,
    borderRadius: 15,
    justifyContent: "space-around",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 3,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  statItem: {
    alignItems: "center",
  },
  statValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: PRIMARY_COLOR,
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 14,
    color: "#666",
  },
  statDivider: {
    width: 1,
    backgroundColor: "#e0e0e0",
  },
  infoSection: {
    backgroundColor: "#fff",
    marginTop: 20,
    marginHorizontal: 20,
    borderRadius: 15,
    paddingVertical: 15,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 3,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  sectionTitle: {
    fontSize: 19,
    fontWeight: "700",
    color: PRIMARY_COLOR,
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  infoItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f5f5f5",
  },
  lastInfoItem: {
    borderBottomWidth: 0,
  },
  infoLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  infoIcon: {
    marginRight: 15,
  },
  infoLabel: {
    fontSize: 13,
    color: "#999",
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 16,
    color: "#333",
    fontWeight: "500",
  },
  noInfoText: {
    textAlign: "center",
    color: "#999",
    paddingVertical: 20,
    fontSize: 16,
  },
  debugSection: {
    backgroundColor: "#E3F2FD",
    margin: 20,
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#1976D2",
  },
  debugTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#1976D2",
  },
  debugContent: {
    backgroundColor: "#fff",
    padding: 10,
    borderRadius: 5,
  },
  debugItem: {
    marginBottom: 8,
  },
  debugKey: {
    fontSize: 12,
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
    color: "#1976D2",
    fontWeight: "bold",
  },
  debugValue: {
    fontSize: 12,
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
    color: "#333",
    marginLeft: 10,
  },
  actionButtonsContainer: {
    backgroundColor: "#fff",
    marginTop: 20,
    marginHorizontal: 20,
    borderRadius: 15,
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 3,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f5f5f5",
  },
  lastActionButton: {
    borderBottomWidth: 0,
  },
  actionButtonText: {
    flex: 1,
    fontSize: 16,
    color: "#333",
    marginLeft: 15,
  },
  logoutContainer: {
    marginHorizontal: 20,
    marginTop: 30,
  },
  logoutButton: {
    backgroundColor: "#D9534F",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 16,
    borderRadius: 12,
    ...Platform.select({
      ios: {
        shadowColor: "#D9534F",
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  logoutIcon: {
    marginRight: 8,
  },
  logoutButtonText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "600",
  },
});

export default ProfileScreen;