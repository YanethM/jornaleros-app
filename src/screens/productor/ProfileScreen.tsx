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
  StatusBar,
} from "react-native";
import { useAuth } from "../../context/AuthContext";
import { useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import ScreenLayout from "../../components/ScreenLayout";
import Icon from "react-native-vector-icons/MaterialIcons";
import { LinearGradient } from "expo-linear-gradient";

const COLORS = {
  primary: "#274F66",
  primaryLight: "#3D6B85",
  primaryDark: "#1A3A4A",
  secondary: "#F59E0B",
  accent: "#B5883F",
  background: "#F8FAFC",
  backgroundDark: "#1E293B",
  surface: "#FFFFFF",
  surfaceElevated: "#FFFFFF",
  text: "#0F172A",
  textSecondary: "#475569",
  textLight: "#64748B",
  textInverse: "#FFFFFF",
  success: "#10B981",
  warning: "#F59E0B",
  error: "#FF6B70",
  border: "#E2E8F0",
  borderLight: "#F1F5F9",
  gradient1: "#667eea",
  gradient2: "#764ba2",
  shadow: "rgba(0, 0, 0, 0.1)",
  shadowDark: "rgba(0, 0, 0, 0.2)",
  info: "#3B82F6",
};

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

const ProfileScreen = ({ navigation }) => {
  const { signOut, user, refreshUserData } = useAuth();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  // FUNCIÓN PARA RECARGAR DATOS DEL USUARIO
  const reloadUserData = async () => {
    try {
      console.log("🔄 Recargando datos del usuario...");
      
      if (refreshUserData && typeof refreshUserData === 'function') {
        console.log("🔄 Usando refreshUserData del contexto...");
        await refreshUserData();
      } else {
        console.log("🔄 Cargando desde AsyncStorage...");
        const userDataString = await AsyncStorage.getItem("userData");
        if (userDataString) {
          const userData = JSON.parse(userDataString);
          console.log("📄 Datos recargados:", userData);
        }
      }
    } catch (error) {
      console.warn("⚠️ Error recargando datos del usuario:", error);
    }
  };

  // LISTENER PARA CUANDO LA PANTALLA TOMA FOCUS
  useFocusEffect(
    React.useCallback(() => {
      console.log("👁️ ProfileScreen obtuvo focus, recargando datos...");
      reloadUserData();
    }, [])
  );

  useEffect(() => {
    console.log("=== INFORMACIÓN COMPLETA DEL USUARIO ===");
    console.log(JSON.stringify(user, null, 2));
    console.log("======================================");
  }, [user]);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleEditProfile = () => {
    console.log("🚀 Navegando a EditProfileEmployer...");
    navigation.navigate("EditProfileEmployer");
  };

  const handleSignOut = () => {
    Alert.alert(
      "Cerrar Sesión",
      "¿Estás seguro que deseas cerrar sesión?",
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Cerrar Sesión", onPress: signOut, style: "destructive" },
      ]
    );
  };

  // 🔥 FUNCIÓN PARA OBTENER LA UBICACIÓN COMPLETA
  const getCompleteLocation = () => {
    const locationParts = [];
    
    // Debug de la información de ubicación
    console.log("=== DATOS DE UBICACIÓN DEL USUARIO ===");
    console.log("Country:", user?.country);
    console.log("DepartmentState:", user?.departmentState);
    console.log("City/Municipality:", user?.city);
    console.log("CountryId:", user?.countryId);
    console.log("DepartmentId:", user?.departmentId);
    console.log("CityId:", user?.cityId);
    console.log("=====================================");

    // 1. Obtener país
    if (user?.country?.name) {
      locationParts.push(user.country.name);
    }

    // 2. Obtener departamento/estado
    if (user?.departmentState?.name) {
      locationParts.push(user.departmentState.name);
    }

    // 3. Obtener municipio/ciudad
    if (user?.city?.name) {
      locationParts.push(user.city.name);
    }

    console.log("📍 Partes de ubicación encontradas:", locationParts);

    return locationParts.length > 0 ? locationParts.join(", ") : null;
  };

  // 🔥 FUNCIÓN PARA OBTENER UBICACIÓN DE TRABAJO (del employerProfile)
  const getWorkLocation = () => {
    if (!user?.employerProfile) return null;

    const { city, state } = user.employerProfile;
    const workLocationParts = [city, state].filter(Boolean);
    
    if (workLocationParts.length > 0) {
      return workLocationParts
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(", ");
    }
    
    return null;
  };

  const getAvatarColor = (initials) => {
    const colors = [
      ['#667eea', '#764ba2'],
      ['#f093fb', '#f5576c'],
      ['#4facfe', '#00f2fe'],
      ['#43e97b', '#38f9d7'],
      ['#fa709a', '#fee140'],
      ['#a8edea', '#fed6e3'],
      ['#ff9a9e', '#fecfef'],
      ['#ffecd2', '#fcb69f'],
    ];
    
    const charCode = initials.charCodeAt(0) || 0;
    return colors[charCode % colors.length];
  };

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

  // Organizar información del usuario
  const personalInfo = [];
  const contactInfo = [];
  const workInfo = [];
  const systemInfo = [];

  // Información personal
  if (user?.name) {
    personalInfo.push({ label: "Nombre", value: user.name, icon: "person" });
  }
  if (user?.lastname) {
    personalInfo.push({ label: "Apellidos", value: user.lastname, icon: "person-outline" });
  }
  if (user?.documentType && user?.documentId) {
    personalInfo.push({
      label: "Documento",
      value: `${user.documentType} ${user.documentId}`,
      icon: "badge",
    });
  }
  if (user?.nationality) {
    personalInfo.push({ label: "Nacionalidad", value: user.nationality, icon: "flag" });
  }

  // 🔥 INFORMACIÓN DE CONTACTO MEJORADA
  if (user?.email) {
    contactInfo.push({ label: "Correo electrónico", value: user.email, icon: "email" });
  }
  if (user?.phone) {
    contactInfo.push({ label: "Teléfono", value: user.phone, icon: "phone" });
  }

  // 🔥 UBICACIÓN COMPLETA (País, Departamento, Municipio)
  const completeLocation = getCompleteLocation();
  if (completeLocation) {
    contactInfo.push({
      label: "Ubicación",
      value: completeLocation,
      icon: "location-on",
    });
  }

  // Desglose individual de ubicación para mayor claridad
  if (user?.country?.name) {
    contactInfo.push({
      label: "País",
      value: user.country.name,
      icon: "public",
    });
  }

  if (user?.departmentState?.name) {
    contactInfo.push({
      label: "Departamento/Estado",
      value: user.departmentState.name,
      icon: "map",
    });
  }

  if (user?.city?.name) {
    contactInfo.push({
      label: "Municipio/Ciudad",
      value: user.city.name,
      icon: "location-city",
    });
  }

  // 🔥 INFORMACIÓN LABORAL MEJORADA
  if (user?.employerProfile) {
    const { organization, status } = user.employerProfile;
    
    if (organization) {
      workInfo.push({ label: "Organización", value: organization, icon: "business" });
    }

    // Ubicación de trabajo (campos legacy del employerProfile)
    const workLocation = getWorkLocation();
    if (workLocation) {
      workInfo.push({
        label: "Ubicación de Trabajo",
        value: workLocation,
        icon: "work",
      });
    }

    if (status !== undefined) {
      workInfo.push({
        label: "Estado del perfil",
        value: status ? "Activo" : "Inactivo",
        icon: status ? "check-circle" : "cancel",
        color: status ? COLORS.success : COLORS.error,
      });
    }
  }

  // Información del sistema
  if (user?.role) {
    const roleName =
      typeof user.role === "object" && user.role.name
        ? user.role.name
        : typeof user.role === "string"
        ? user.role
        : "Rol no especificado";

    systemInfo.push({ label: "Rol", value: roleName, icon: "security" });
  }

  const avatarColors = getAvatarColor(getInitials());

  const renderInfoSection = (title, items, icon) => {
    if (items.length === 0) return null;

    return (
      <Animated.View
        style={[
          styles.infoSection,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleContainer}>
            <View style={[styles.sectionIconContainer, { backgroundColor: `${COLORS.primary}15` }]}>
              <Icon name={icon} size={20} color={COLORS.primary} />
            </View>
            <Text style={styles.sectionTitle}>{title}</Text>
          </View>
        </View>

        {items.map((item, index) => (
          <View
            key={index}
            style={[
              styles.infoItem,
              index === items.length - 1 && styles.lastInfoItem,
            ]}
          >
            <View style={styles.infoLeft}>
              <View style={[styles.infoIconContainer, { backgroundColor: `${item.color || COLORS.primary}10` }]}>
                <Icon
                  name={item.icon}
                  size={20}
                  color={item.color || COLORS.primary}
                />
              </View>
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoLabel}>{item.label}</Text>
                <Text style={[styles.infoValue, item.color && { color: item.color }]}>
                  {item.value}
                </Text>
              </View>
            </View>
          </View>
        ))}
      </Animated.View>
    );
  };

  const actionButtons = [
    {
      icon: "edit",
      title: "Editar Perfil",
      subtitle: "Actualiza tu información personal",
      onPress: handleEditProfile,
      color: COLORS.primary,
    },
    {
      icon: "notifications",
      title: "Notificaciones",
      subtitle: "Configura tus preferencias",
      onPress: () => navigation.navigate("Mensajes"),
      color: COLORS.secondary,
    },
    {
      icon: "help",
      title: "Tutorial de la App",
      subtitle: "Obtén un breve recorrido en la aplicación",
      onPress: () => navigation.navigate("TutorialApp"),
      color: COLORS.info,
    },
  ];

  return (
    <ScreenLayout navigation={navigation}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header con Gradiente */}
        <Animated.View
          style={[
            styles.profileHeader,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <LinearGradient
            colors={[COLORS.primary, COLORS.primaryLight]}
            style={styles.headerGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />

          <View style={styles.profileContent}>
            {/* Avatar con Iniciales */}
            <Animated.View
              style={[
                styles.avatarContainer,
                {
                  transform: [{ scale: scaleAnim }],
                },
              ]}
            >
              <LinearGradient
                colors={avatarColors}
                style={styles.avatarGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Text style={styles.avatarText}>{getInitials()}</Text>
              </LinearGradient>
              
              <View style={styles.avatarBorder} />
              
              <TouchableOpacity style={styles.editAvatarButton}>
                <Icon name="edit" size={16} color={COLORS.textInverse} />
              </TouchableOpacity>
            </Animated.View>

            {/* Información del Usuario */}
            <Text style={styles.userName}>{getFullName()}</Text>
            <Text style={styles.userRole}>
              {user?.role?.name || "Sin rol asignado"}
            </Text>

            {/* 🔥 MOSTRAR UBICACIÓN COMPLETA EN EL HEADER */}
            {completeLocation && (
              <View style={styles.locationContainer}>
                <Icon name="location-on" size={16} color={COLORS.textInverse} />
                <Text style={styles.locationText}>{completeLocation}</Text>
              </View>
            )}

            {/* Estadísticas */}
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>156</Text>
                <Text style={styles.statLabel}>Mensajes</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>24</Text>
                <Text style={styles.statLabel}>Contactos</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>8</Text>
                <Text style={styles.statLabel}>Proyectos</Text>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* Información Personal */}
        {renderInfoSection("Información Personal", personalInfo, "person")}

        {/* Información de Contacto */}
        {renderInfoSection("Contacto", contactInfo, "contact-phone")}

        {/* Información Laboral */}
        {renderInfoSection("Información Laboral", workInfo, "work")}

        {/* Información del Sistema */}
        {renderInfoSection("Sistema", systemInfo, "settings")}

        {/* Botones de Acción */}
        <Animated.View
          style={[
            styles.actionsSection,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <View style={[styles.sectionIconContainer, { backgroundColor: `${COLORS.primary}15` }]}>
                <Icon name="settings" size={20} color={COLORS.primary} />
              </View>
              <Text style={styles.sectionTitle}>Configuración</Text>
            </View>
          </View>

          {actionButtons.map((button, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.actionButton,
                index === actionButtons.length - 1 && styles.lastActionButton,
              ]}
              onPress={button.onPress}
              activeOpacity={0.7}
            >
              <View style={[styles.actionIconContainer, { backgroundColor: `${button.color}15` }]}>
                <Icon name={button.icon} size={22} color={button.color} />
              </View>
              <View style={styles.actionTextContainer}>
                <Text style={styles.actionTitle}>{button.title}</Text>
                <Text style={styles.actionSubtitle}>{button.subtitle}</Text>
              </View>
              <Icon name="chevron-right" size={20} color={COLORS.textLight} />
            </TouchableOpacity>
          ))}
        </Animated.View>

        {/* Botón de Cerrar Sesión */}
        <Animated.View
          style={[
            styles.logoutSection,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <TouchableOpacity style={styles.logoutButton} onPress={handleSignOut}>
            <Icon name="logout" size={22} color={COLORS.textInverse} style={styles.logoutIcon} />
            <Text style={styles.logoutButtonText}>Cerrar Sesión</Text>
          </TouchableOpacity>
        </Animated.View>

        <View style={styles.bottomSpacing} />
      </ScrollView>
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  profileHeader: {
    position: "relative",
    paddingBottom: 30,
  },
  headerGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 320, // Aumentado para dar espacio a la ubicación
  },
  profileContent: {
    alignItems: "center",
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  avatarContainer: {
    position: "relative",
    marginBottom: 20,
  },
  avatarGradient: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: "center",
    alignItems: "center",
    elevation: 8,
    shadowColor: COLORS.shadowDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  avatarBorder: {
    position: "absolute",
    top: -4,
    left: -4,
    right: -4,
    bottom: -4,
    borderRadius: 64,
    borderWidth: 4,
    borderColor: COLORS.textInverse,
  },
  avatarText: {
    fontSize: 48,
    color: COLORS.textInverse,
    fontWeight: "bold",
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  editAvatarButton: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: COLORS.textInverse,
    elevation: 4,
    shadowColor: COLORS.primaryDark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  userName: {
    fontSize: 28,
    fontWeight: "bold",
    color: COLORS.textInverse,
    marginBottom: 8,
    textAlign: "center",
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  userRole: {
    fontSize: 16,
    color: COLORS.textInverse,
    opacity: 0.9,
    textTransform: "capitalize",
    marginBottom: 15,
    textAlign: "center",
  },
  // 🔥 NUEVO: Estilos para mostrar ubicación en el header
  locationContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 20,
  },
  locationText: {
    fontSize: 14,
    color: COLORS.textInverse,
    marginLeft: 6,
    fontWeight: "500",
  },
  statsContainer: {
    flexDirection: "row",
    backgroundColor: COLORS.surface,
    paddingVertical: 20,
    paddingHorizontal: 30,
    borderRadius: 20,
    alignItems: "center",
    elevation: 4,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    marginHorizontal: 20,
  },
  statItem: {
    alignItems: "center",
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: COLORS.border,
    marginHorizontal: 10,
  },
  infoSection: {
    backgroundColor: COLORS.surface,
    marginTop: 20,
    marginHorizontal: 20,
    borderRadius: 16,
    elevation: 2,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    overflow: "hidden",
  },
  sectionHeader: {
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  sectionTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  sectionIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.text,
  },
  infoItem: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  lastInfoItem: {
    borderBottomWidth: 0,
  },
  infoLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  infoIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: COLORS.textLight,
    marginBottom: 4,
    fontWeight: "500",
  },
  infoValue: {
    fontSize: 16,
    color: COLORS.text,
    fontWeight: "500",
  },
  actionsSection: {
    backgroundColor: COLORS.surface,
    marginTop: 20,
    marginHorizontal: 20,
    borderRadius: 16,
    elevation: 2,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    overflow: "hidden",
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  lastActionButton: {
    borderBottomWidth: 0,
  },
  actionIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  actionTextContainer: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 4,
  },
  actionSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  logoutSection: {
    marginHorizontal: 20,
    marginTop: 30,
  },
  logoutButton: {
    backgroundColor: COLORS.primary,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 18,
    borderRadius: 16,
    elevation: 4,
    shadowColor: COLORS.primaryDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  logoutIcon: {
    marginRight: 12,
  },
  logoutButtonText: {
    color: COLORS.textInverse,
    fontSize: 16,
    fontWeight: "bold",
  },
  bottomSpacing: {
    height: 40,
  },
});

export default ProfileScreen;