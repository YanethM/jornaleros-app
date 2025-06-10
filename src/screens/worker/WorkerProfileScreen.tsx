import React, { useState, useEffect, useRef } from "react";
import {
  Text,
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Modal,
  TextInput,
  FlatList,
  Dimensions,
  Animated,
  StatusBar,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import {
  Ionicons,
  MaterialIcons,
  FontAwesome,
  Feather,
  MaterialCommunityIcons,
  AntDesign,
} from "@expo/vector-icons";
import ScreenLayoutWorker from "../../components/ScreenLayoutWorker";
import { useAuth } from "../../context/AuthContext";
import {
  addWorkerSkill,
  getWorkerProfile,
  getWorkerReviews,
  getWorkerSkills,
  removeWorkerSkill,
  updateWorkerProfile,
} from "../../services/workerService";
import { getCropType } from "../../services/cropTypeService";
import { Rating } from "react-native-ratings";

const { width, height } = Dimensions.get("window");

const COLORS = {
  // Primarios
  primary: "#274F66", // Azul navy personalizado
  primaryLight: "#3A6B85", // Versión más clara
  primaryDark: "#1A3B52", // Versión más oscura
  
  // Secundarios
  secondary: "#f59e0b", // Amber
  secondaryLight: "#fbbf24",
  accent: "#10b981", // Emerald
  accentLight: "#34d399",
  
  // Gradientes
  gradientStart: "#274F66",
  gradientEnd: "#3A6B85",
  cardGradient1: "#ff9a9e",
  cardGradient2: "#fad0c4",
  
  // Neutrales
  background: "#fafbff",
  cardBackground: "#ffffff",
  surface: "#f8fafc",
  
  // Textos
  textPrimary: "#1e293b",
  textSecondary: "#64748b",
  textTertiary: "#94a3b8",
  
  // Estados
  success: "#22c55e",
  warning: "#f59e0b",
  error: "#ef4444",
  info: "#3b82f6",
  
  // Especiales
  star: "#fbbf24",
  shadow: "rgba(0, 0, 0, 0.1)",
  overlay: "rgba(0, 0, 0, 0.6)",
  
  // Bordes
  border: "#e2e8f0",
  borderLight: "#f1f5f9",
};

// Componente de tarjeta estadística animada
const AnimatedStatCard = ({ icon, number, description, color, delay = 0 }) => {
  const animatedValue = useRef(new Animated.Value(0)).current;
  const scaleValue = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(delay),
      Animated.parallel([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.spring(scaleValue, {
          toValue: 1,
          friction: 6,
          tension: 100,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.statCard,
        {
          opacity: animatedValue,
          transform: [{ scale: scaleValue }],
        },
      ]}
    >
      <LinearGradient
        colors={[`${color}15`, `${color}05`]}
        style={styles.statCardGradient}
      >
        <View style={[styles.statIcon, { backgroundColor: `${color}20` }]}>
          {icon}
        </View>
        <Text style={styles.statNumber}>{number}</Text>
        <Text style={styles.statDescription}>{description}</Text>
      </LinearGradient>
    </Animated.View>
  );
};

const SkillCard = ({ skill, onRemove, index }) => {
  const slideAnim = useRef(new Animated.Value(300)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(index * 100),
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, []);

  const getExperienceColor = (level) => {
    switch (level) {
      case "Básico": return COLORS.primary;
      case "Intermedio": return COLORS.primary;
      case "Avanzado": return COLORS.primary;
      default: return COLORS.textSecondary;
    }
  };

  return (
    <Animated.View
      style={[
        styles.skillCard,
        {
          opacity: opacityAnim,
          transform: [{ translateX: slideAnim }],
        },
      ]}
    >
      <LinearGradient
        colors={["#ffffff", "#f8fafc"]}
        style={styles.skillCardGradient}
      >
        <View style={styles.skillHeader}>
          <View style={styles.skillIconContainer}>
            <MaterialCommunityIcons
              name="sprout"
              size={24}
              color={COLORS.accent}
            />
          </View>
          <View style={styles.skillInfo}>
            <Text style={styles.skillName}>
              {skill.cropType?.name || "Habilidad"}
            </Text>
            <View style={styles.skillMeta}>
              <View style={[
                styles.experienceBadge,
                { backgroundColor: getExperienceColor(skill.experienceLevel) }
              ]}>
                <Text style={styles.experienceBadgeText}>
                  {skill.experienceLevel || "No especificado"}
                </Text>
              </View>
              <Text style={styles.experienceYears}>
                {skill.yearsOfExperience || "0"} años
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.deleteSkillButton}
            onPress={() => onRemove(skill.id)}
            activeOpacity={0.7}
          >
            <Feather name="trash-2" size={18} color={COLORS.error} />
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </Animated.View>
  );
};

const ReviewCard = ({ review, index }) => {
  const slideAnim = useRef(new Animated.Value(50)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(index * 150),
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.reviewCard,
        {
          opacity: opacityAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <LinearGradient
        colors={["#ffffff", "#f9fafb"]}
        style={styles.reviewCardGradient}
      >
        <View style={styles.reviewHeader}>
          <View style={styles.reviewerAvatar}>
            <LinearGradient
              colors={[COLORS.primary, COLORS.primaryLight]}
              style={styles.avatarGradient}
            >
              <MaterialIcons name="person" size={24} color="white" />
            </LinearGradient>
          </View>
          <View style={styles.reviewerInfo}>
            <Text style={styles.reviewerName}>
              {review.employer?.user?.name || "Usuario anónimo"}
            </Text>
            <View style={styles.reviewStarsContainer}>
              {[1, 2, 3, 4, 5].map((star) => (
                <FontAwesome
                  key={star}
                  name={star <= review.rating ? "star" : "star-o"}
                  size={14}
                  color={COLORS.star}
                />
              ))}
            </View>
          </View>
          <Text style={styles.reviewDate}>
            {new Date(review.createdAt).toLocaleDateString("es-CO")}
          </Text>
        </View>
        {review.comment && (
          <Text style={styles.reviewText}>{review.comment}</Text>
        )}
      </LinearGradient>
    </Animated.View>
  );
};

const WorkerProfileScreen = ({ navigation }) => {
  // Estados existentes...
  const [workerProfile, setWorkerProfile] = useState(null);
  const [workerSkills, setWorkerSkills] = useState([]);
  const [workerReviews, setWorkerReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [skillsModalVisible, setSkillsModalVisible] = useState(false);
  const [addingSkill, setAddingSkill] = useState(false);
  const [reviewsModalVisible, setReviewsModalVisible] = useState(false);

  const { user, isLoading: authLoading, hasWorkerProfile } = useAuth();

  const [cropTypes, setCropTypes] = useState([]);
  const [skillForm, setSkillForm] = useState({
    cropTypeId: "",
    experienceLevel: "Básico",
    yearsOfExperience: "0",
  });

  const [editForm, setEditForm] = useState({
    bio: "",
    availability: true,
  });

  const [profileStats, setProfileStats] = useState({
    totalJobs: 0,
    completedJobs: 0,
    averageRating: 0,
    totalEarnings: 0,
    skillsCount: 0,
  });

  // Animaciones
  const headerAnimation = useRef(new Animated.Value(0)).current;
  const scrollY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(headerAnimation, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);

  // Funciones existentes (simplificadas para el ejemplo)
  const handleOpenSkillsModal = async () => {
    await loadCropTypes();
    setSkillsModalVisible(true);
  };

  const loadCropTypes = async () => {
    try {
      const data = await getCropType();
      let types = [];
      if (data && data.primary && Array.isArray(data.data)) {
        types = data.data;
      } else if (data && data.cropTypes && Array.isArray(data.cropTypes)) {
        types = data.cropTypes;
      } else if (Array.isArray(data)) {
        types = data;
      }
      setCropTypes(types);
      return types;
    } catch (error) {
      Alert.alert("Error", "No se pudieron cargar los tipos de cultivo");
      return [];
    }
  };

  const getWorkerId = async () => {
    if (!user) throw new Error("Usuario no encontrado");
    if (!hasWorkerProfile || !user.workerProfile?.id) {
      throw new Error("Perfil de trabajador no encontrado");
    }
    return user.workerProfile.id;
  };

  const loadWorkerProfile = async () => {
    try {
      setLoading(true);

      if (!hasWorkerProfile) {
        Alert.alert(
          "Perfil no encontrado",
          "No tienes un perfil de trabajador. Por favor, completa tu registro.",
          [{ text: "OK", onPress: () => navigation.goBack() }]
        );
        return;
      }

      const workerId = await getWorkerId();

      const [profileResult, skillsResult, reviewsResult] =
        await Promise.allSettled([
          getWorkerProfile(workerId),
          getWorkerSkills(workerId),
          getWorkerReviews(workerId),
        ]);

      // Procesar resultados...
      let profileData = null;
      if (profileResult.status === "fulfilled" && profileResult.value) {
        profileData = profileResult.value;
      }

      if (!profileData || profileData.isDefault || !profileData.user) {
        profileData = {
          ...getDefaultProfile(),
          user: {
            name: user?.name || "",
            lastname: user?.lastname || "",
            email: user?.email || "",
            phone: user?.phone || "",
            city: user?.city || "",
            departmentState: user?.departmentState || "",
            profilePicture: user?.profilePicture || null,
            isVerified: user?.isVerified || false,
          },
          ...(profileData && !profileData.isDefault ? profileData : {}),
        };
      }

      const skillsFromProfile = profileData?.workerSkills || [];
      const skillsFromEndpoint =
        skillsResult.status === "fulfilled"
          ? skillsResult.value?.skills || []
          : [];

      const skillsArray =
        skillsFromProfile.length > 0 ? skillsFromProfile : skillsFromEndpoint;

      const reviewsFromProfile = profileData?.reviews || [];
      const reviewsFromEndpoint =
        reviewsResult.status === "fulfilled"
          ? reviewsResult.value?.reviews || []
          : [];

      const reviewsArray =
        reviewsFromProfile.length > 0
          ? reviewsFromProfile
          : reviewsFromEndpoint;

      setWorkerProfile(profileData);
      setWorkerSkills(skillsArray);
      setWorkerReviews(reviewsArray);

      setEditForm({
        bio: profileData?.bio || "",
        availability: profileData?.availability !== false,
      });

      const avgRating = profileData?.averageRating || 0;
      setProfileStats({
        totalJobs: profileData?.totalJobs || 0,
        completedJobs: profileData?.completedJobs || 0,
        averageRating: avgRating,
        totalEarnings: profileData?.totalEarnings || 0,
        skillsCount: skillsArray.length,
      });
    } catch (error) {
      const fallbackProfile = {
        ...getDefaultProfile(),
        user: {
          name: user?.name || "",
          lastname: user?.lastname || "",
          email: user?.email || "",
          phone: user?.phone || "",
          city: user?.city || "",
          departmentState: user?.departmentState || "",
          profilePicture: user?.profilePicture || null,
          isVerified: user?.isVerified || false,
        },
      };

      setWorkerProfile(fallbackProfile);
      setWorkerSkills([]);
      setWorkerReviews([]);
      setEditForm({ bio: "", availability: true });
      setProfileStats(getDefaultStats());

      Alert.alert(
        "Error de Conexión",
        "No se pudo cargar el perfil completamente. Se muestran los datos disponibles.",
        [
          { text: "Reintentar", onPress: () => loadWorkerProfile() },
          { text: "Continuar", style: "cancel" },
        ]
      );
    } finally {
      setLoading(false);
    }
  };

  const getDefaultProfile = () => ({
    id: user?.workerProfile?.id || "",
    bio: "",
    availability: true,
    totalJobs: 0,
    completedJobs: 0,
    totalEarnings: 0,
    averageRating: 0,
    totalReviews: 0,
    user: {
      id: user?.id,
      name: user?.name || "",
      lastname: user?.lastname || "",
      email: user?.email || "",
      phone: user?.phone || "",
      city: user?.city || "",
      departmentState: user?.departmentState || "",
      profilePicture: user?.profilePicture || null,
      isVerified: user?.isVerified || false,
    },
    skills: [],
    workerSkills: [],
    reviews: [],
    qualifications: [],
    interests: [],
    createdAt: user?.workerProfile?.createdAt || new Date().toISOString(),
    updatedAt: user?.workerProfile?.updatedAt || new Date().toISOString(),
  });

  const getDefaultStats = () => ({
    totalJobs: 0,
    completedJobs: 0,
    averageRating: 0,
    totalEarnings: 0,
    skillsCount: 0,
  });

  const handleUpdateProfile = async () => {
    try {
      const workerId = await getWorkerId();
      const updateData = {
        bio: editForm.bio,
        availability: editForm.availability,
      };

      await updateWorkerProfile(workerId, updateData);
      setEditModalVisible(false);
      Alert.alert("Éxito", "Perfil actualizado correctamente");
      loadWorkerProfile();
    } catch (error) {
      Alert.alert("Error", "No se pudo actualizar el perfil");
    }
  };

  const handleAddSkill = async () => {
    if (addingSkill) return;

    try {
      setAddingSkill(true);
      const workerId = await getWorkerId();

      if (!skillForm.cropTypeId) {
        throw new Error("Debes seleccionar un tipo de cultivo");
      }

      await addWorkerSkill(workerId, {
        cropTypeId: skillForm.cropTypeId,
        experienceLevel: skillForm.experienceLevel,
        yearsOfExperience: parseInt(skillForm.yearsOfExperience) || 0,
      });

      setSkillsModalVisible(false);
      setSkillForm({
        cropTypeId: "",
        experienceLevel: "Básico",
        yearsOfExperience: "0",
      });

      Alert.alert("Éxito", "Habilidad agregada correctamente");
      await loadWorkerProfile();
    } catch (error) {
      Alert.alert("Error", error.message || "No se pudo agregar la habilidad");
    } finally {
      setAddingSkill(false);
    }
  };

  const handleRemoveSkill = async (skillId) => {
    try {
      await removeWorkerSkill(skillId);
      Alert.alert("Éxito", "Habilidad removida");
      await loadWorkerProfile();
    } catch (error) {
      Alert.alert("Error", "No se pudo remover la habilidad");
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadWorkerProfile();
    setRefreshing(false);
  };

  const getUserLocation = (userProfile) => {
    console.log("📍 Getting user location from profile:", userProfile);
    
    const city = user?.city?.trim();
    const department = user?.departmentState?.trim();
  
    if (!city && !department) return "Ubicación no disponible";
    if (city && !department) return city;
    if (!city && department) return department;
    return `${city}, ${department}`;
  };

  useEffect(() => {
    if (!authLoading && user) {
      const loadInitialData = async () => {
        await loadCropTypes();
        if (hasWorkerProfile) {
          await loadWorkerProfile();
        } else {
          setLoading(false);
        }
      };
      loadInitialData();
    }
  }, [authLoading, user, hasWorkerProfile]);

  if (authLoading) {
    return (
      <View style={styles.loadingContainer}>
        <LinearGradient
          colors={[COLORS.primary, COLORS.primaryLight]}
          style={styles.loadingGradient}>
          <ActivityIndicator size="large" color="white" />
          <Text style={styles.loadingText}>Verificando autenticación...</Text>
        </LinearGradient>
      </View>
    );
  }

  if (!hasWorkerProfile) {
    return (
      <ScreenLayoutWorker navigation={navigation}>
        <View style={styles.noProfileContainer}>
          <LinearGradient
            colors={[COLORS.warning, COLORS.secondaryLight]}
            style={styles.noProfileGradient}>
            <Ionicons name="alert-circle-outline" size={64} color="white" />
            <Text style={styles.noProfileTitle}>Perfil no encontrado</Text>
            <Text style={styles.noProfileText}>
              No tienes un perfil de trabajador. Por favor, completa tu registro
              para acceder a esta sección.
            </Text>
            <TouchableOpacity
              style={styles.goBackButton}
              onPress={() => navigation.goBack()}
              activeOpacity={0.8}>
              <Text style={styles.goBackButtonText}>Volver</Text>
            </TouchableOpacity>
          </LinearGradient>
        </View>
      </ScreenLayoutWorker>
    );
  }

  if (loading) {
    return (
      <ScreenLayoutWorker navigation={navigation}>
        <View style={styles.loadingContainer}>
          <LinearGradient
            colors={[COLORS.primary, COLORS.primaryLight]}
            style={styles.loadingGradient}>
            <ActivityIndicator size="large" color="white" />
            <Text style={styles.loadingText}>Cargando tu perfil...</Text>
          </LinearGradient>
        </View>
      </ScreenLayoutWorker>
    );
  }

  return (
    <ScreenLayoutWorker navigation={navigation}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

      <Animated.ScrollView
        style={styles.container}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }>
        {/* Header con gradiente dinámico */}
        <Animated.View
          style={[
            styles.headerContainer,
            {
              opacity: headerAnimation,
              transform: [
                {
                  translateY: headerAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-50, 0],
                  }),
                },
              ],
            },
          ]}>
          <LinearGradient
            colors={[COLORS.gradientStart, COLORS.gradientEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.header}>
            <View style={styles.headerContent}>
              <View style={styles.profileSection}>
                <View style={styles.avatarSection}>
                  {workerProfile?.user?.profilePicture ? (
                    <Image
                      source={{ uri: workerProfile.user.profilePicture }}
                      style={styles.avatar}
                    />
                  ) : (
                    <LinearGradient
                      colors={[COLORS.primaryLight, COLORS.accent]}
                      style={styles.avatarPlaceholder}>
                      <Ionicons name="person" size={40} color="white" />
                    </LinearGradient>
                  )}

                  <View style={styles.availabilityIndicator}>
                    <View
                      style={[
                        styles.availabilityDot,
                        workerProfile?.availability
                          ? styles.availableDot
                          : styles.unavailableDot,
                      ]}
                    />
                    <Text style={styles.availabilityLabel}>
                      {workerProfile?.availability
                        ? "Disponible"
                        : "No disponible"}
                    </Text>
                  </View>
                </View>

                <View style={styles.profileInfo}>
                  <View style={styles.nameSection}>
                    <Text style={styles.userName}>
                      {workerProfile?.user?.name || user?.name}{" "}
                      {workerProfile?.user?.lastname || user?.lastname}
                    </Text>
                    {user?.isVerified && (
                      <MaterialIcons
                        name="verified"
                        size={22}
                        color={COLORS.accentLight}
                        style={styles.verifiedIcon}
                      />
                    )}
                  </View>

                  <View style={styles.professionSection}>
                    <MaterialCommunityIcons
                      name="sprout"
                      size={18}
                      color="rgba(255,255,255,0.9)"
                    />
                    <Text style={styles.profession}>Trabajador Agrícola</Text>
                  </View>

                  <View style={styles.ratingSection}>
                    <Rating
                      type="star"
                      ratingCount={5}
                      imageSize={16}
                      readonly
                      startingValue={profileStats.averageRating}
                      tintColor="transparent"
                      style={styles.rating}
                    />
                    <Text style={styles.ratingText}>
                      {profileStats.averageRating.toFixed(1)} (
                      {workerReviews.length})
                    </Text>
                  </View>

                  <View style={styles.locationSection}>
                    <MaterialIcons
                      name="location-on"
                      size={16}
                      color="rgba(255,255,255,0.8)"
                    />
                    <Text style={styles.locationText}>
                      {getUserLocation(workerProfile?.user)}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Decorative shapes */}
            <View style={styles.decorativeShapes}>
              <View style={[styles.shape, styles.shape1]} />
              <View style={[styles.shape, styles.shape2]} />
              <View style={[styles.shape, styles.shape3]} />
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Stats cards con animación */}
        <View style={styles.statsContainer}>
          <AnimatedStatCard
            icon={
              <MaterialIcons
                name="work-outline"
                size={24}
                color={COLORS.primary}
              />
            }
            number={profileStats.totalJobs}
            description="Trabajos"
            color={COLORS.primary}
            delay={200}
          />
          <AnimatedStatCard
            icon={
              <MaterialIcons name="done-all" size={24} color={COLORS.success} />
            }
            number={profileStats.completedJobs}
            description="Completados"
            color={COLORS.success}
            delay={400}
          />
          <AnimatedStatCard
            icon={
              <MaterialIcons
                name="attach-money"
                size={24}
                color={COLORS.secondary}
              />
            }
            number={`$${new Intl.NumberFormat("es-CO").format(
              profileStats.totalEarnings
            )}`}
            description="Ganancias"
            color={COLORS.secondary}
            delay={600}
          />
        </View>

        {/* Información personal */}
        <View style={styles.section}>
          <LinearGradient
            colors={["#ffffff", "#f8fafc"]}
            style={styles.sectionGradient}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleContainer}>
                <View style={styles.sectionIconContainer}>
                  <MaterialIcons
                    name="person-outline"
                    size={24}
                    color={COLORS.primary}
                  />
                </View>
                <Text style={styles.sectionTitle}>Información Personal</Text>
              </View>
              <TouchableOpacity
                style={styles.editButton}
                onPress={() => setEditModalVisible(true)}
                activeOpacity={0.7}>
                <LinearGradient
                  colors={[COLORS.primaryLight, COLORS.primary]}
                  style={styles.editButtonGradient}>
                  <Feather name="edit-2" size={16} color="white" />
                </LinearGradient>
              </TouchableOpacity>
            </View>

            <View style={styles.infoGrid}>
              <View style={styles.infoCard}>
                <MaterialIcons name="email" size={20} color={COLORS.primary} />
                <Text style={styles.infoLabel}>Email</Text>
                <Text style={styles.infoValue} numberOfLines={1}>
                  {workerProfile?.user?.email ||
                    user?.email ||
                    "No especificado"}
                </Text>
              </View>

              <View style={styles.infoCard}>
                <MaterialIcons name="phone" size={20} color={COLORS.accent} />
                <Text style={styles.infoLabel}>Teléfono</Text>
                <Text style={styles.infoValue}>
                  {workerProfile?.user?.phone ||
                    user?.phone ||
                    "No especificado"}
                </Text>
              </View>
            </View>

            {workerProfile?.bio && (
              <View style={styles.bioSection}>
                <Text style={styles.bioLabel}>Sobre mí</Text>
                <Text style={styles.bioText}>{workerProfile.bio}</Text>
              </View>
            )}
          </LinearGradient>
        </View>
        {/* Habilidades */}
        <View style={styles.section}>
          <LinearGradient
            colors={["#ffffff", "#f8fafc"]}
            style={styles.sectionGradient}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleContainer}>
                <View style={styles.sectionIconContainer}>
                  <MaterialIcons name="build" size={24} color={COLORS.accent} />
                </View>
                <Text style={styles.sectionTitle}>Mis Habilidades</Text>
              </View>
              <TouchableOpacity
                style={styles.addButton}
                onPress={handleOpenSkillsModal}
                activeOpacity={0.7}>
                <LinearGradient
                  colors={[COLORS.accent, COLORS.accentLight]}
                  style={styles.addButtonGradient}>
                  <AntDesign name="plus" size={16} color="white" />
                </LinearGradient>
              </TouchableOpacity>
            </View>

            {workerSkills.length > 0 ? (
              <View style={styles.skillsContainer}>
                {workerSkills.map((skill, index) => (
                  <SkillCard
                    key={skill.id || index.toString()}
                    skill={skill}
                    onRemove={handleRemoveSkill}
                    index={index}
                  />
                ))}
              </View>
            ) : (
              <View style={styles.emptyState}>
                <LinearGradient
                  colors={[COLORS.surface, COLORS.background]}
                  style={styles.emptyStateGradient}>
                  <MaterialCommunityIcons
                    name="emoticon-sad-outline"
                    size={48}
                    color={COLORS.textTertiary}
                  />
                  <Text style={styles.emptyTitle}>No hay habilidades</Text>
                  <Text style={styles.emptySubtitle}>
                    Agrega tus primeras habilidades para destacar
                  </Text>
                  <TouchableOpacity
                    style={styles.emptyActionButton}
                    onPress={handleOpenSkillsModal}
                    activeOpacity={0.8}>
                    <LinearGradient
                      colors={[COLORS.accent, COLORS.accentLight]}
                      style={styles.emptyActionGradient}>
                      <AntDesign name="plus" size={16} color="white" />
                      <Text style={styles.emptyActionText}>
                        Agregar Habilidad
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </LinearGradient>
              </View>
            )}
          </LinearGradient>
        </View>

        {/* Reseñas */}
        <View style={styles.section}>
          <LinearGradient
            colors={["#ffffff", "#f8fafc"]}
            style={styles.sectionGradient}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleContainer}>
                <View style={styles.sectionIconContainer}>
                  <MaterialIcons
                    name="star-outline"
                    size={24}
                    color={COLORS.warning}
                  />
                </View>
                <Text style={styles.sectionTitle}>Reseñas</Text>
              </View>
              {workerReviews.length > 2 && (
                <TouchableOpacity
                  style={styles.viewAllButton}
                  onPress={() => setReviewsModalVisible(true)}
                  activeOpacity={0.7}>
                  <Text style={styles.viewAllText}>Ver todas</Text>
                  <Feather
                    name="arrow-right"
                    size={16}
                    color={COLORS.primary}
                  />
                </TouchableOpacity>
              )}
            </View>

            {workerReviews.length > 0 ? (
              <>
                <View style={styles.ratingSummaryContainer}>
                  <View style={styles.ratingNumberContainer}>
                    <Text style={styles.ratingNumber}>
                      {profileStats.averageRating.toFixed(1)}
                    </Text>
                    <Text style={styles.ratingMaxNumber}>/5</Text>
                  </View>
                  <View style={styles.ratingDetailsContainer}>
                    <Rating
                      type="star"
                      ratingCount={5}
                      imageSize={18}
                      readonly
                      startingValue={profileStats.averageRating}
                      style={styles.summaryRating}
                    />
                    <Text style={styles.reviewsCount}>
                      Basado en {workerReviews.length}{" "}
                      {workerReviews.length === 1 ? "reseña" : "reseñas"}
                    </Text>
                  </View>
                </View>

                <View style={styles.reviewsList}>
                  {workerReviews.slice(0, 2).map((review, index) => (
                    <ReviewCard
                      key={review.id || index.toString()}
                      review={review}
                      index={index}
                    />
                  ))}
                </View>
              </>
            ) : (
              <View style={styles.emptyState}>
                <LinearGradient
                  colors={[COLORS.surface, COLORS.background]}
                  style={styles.emptyStateGradient}>
                  <MaterialIcons
                    name="star-outline"
                    size={48}
                    color={COLORS.textTertiary}
                  />
                  <Text style={styles.emptyTitle}>Sin reseñas aún</Text>
                  <Text style={styles.emptySubtitle}>
                    Completa trabajos para recibir tus primeras reseñas
                  </Text>
                </LinearGradient>
              </View>
            )}
          </LinearGradient>
        </View>

        {/* Espacio adicional al final */}
        <View style={styles.bottomSpacing} />
      </Animated.ScrollView>

      {/* Modal de editar perfil */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={editModalVisible}
        onRequestClose={() => setEditModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <LinearGradient
              colors={[COLORS.cardBackground, COLORS.surface]}
              style={styles.modalGradient}>
              <View style={styles.modalHeader}>
                <View style={styles.modalTitleContainer}>
                  <MaterialIcons name="edit" size={24} color={COLORS.primary} />
                  <Text style={styles.modalTitle}>Editar Perfil</Text>
                </View>
                <TouchableOpacity
                  style={styles.modalCloseButton}
                  onPress={() => setEditModalVisible(false)}
                  activeOpacity={0.7}>
                  <Ionicons
                    name="close"
                    size={24}
                    color={COLORS.textSecondary}
                  />
                </TouchableOpacity>
              </View>

              <ScrollView
                style={styles.modalContent}
                showsVerticalScrollIndicator={false}>
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Descripción personal</Text>
                  <View style={styles.textAreaContainer}>
                    <TextInput
                      style={styles.textArea}
                      multiline
                      numberOfLines={4}
                      placeholder="Cuéntanos sobre tu experiencia, fortalezas y lo que te apasiona del trabajo agrícola..."
                      placeholderTextColor={COLORS.textTertiary}
                      value={editForm.bio}
                      onChangeText={(text) =>
                        setEditForm({ ...editForm, bio: text })
                      }
                    />
                  </View>
                </View>

                <View style={styles.availabilityContainer}>
                  <Text style={styles.inputLabel}>
                    Estado de disponibilidad
                  </Text>
                  <View style={styles.availabilityOptions}>
                    <TouchableOpacity
                      style={[
                        styles.availabilityOption,
                        editForm.availability &&
                          styles.availabilityOptionActive,
                      ]}
                      onPress={() =>
                        setEditForm({ ...editForm, availability: true })
                      }
                      activeOpacity={0.8}>
                      <LinearGradient
                        colors={
                          editForm.availability
                            ? [COLORS.success, COLORS.accentLight]
                            : [COLORS.surface, COLORS.background]
                        }
                        style={styles.availabilityOptionGradient}>
                        <Ionicons
                          name="checkmark-circle"
                          size={20}
                          color={
                            editForm.availability
                              ? "white"
                              : COLORS.textTertiary
                          }
                        />
                        <Text
                          style={[
                            styles.availabilityOptionText,
                            editForm.availability &&
                              styles.availabilityOptionTextActive,
                          ]}>
                          Disponible
                        </Text>
                      </LinearGradient>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.availabilityOption,
                        !editForm.availability &&
                          styles.availabilityOptionActive,
                      ]}
                      onPress={() =>
                        setEditForm({ ...editForm, availability: false })
                      }
                      activeOpacity={0.8}>
                      <LinearGradient
                        colors={
                          !editForm.availability
                            ? [COLORS.error, COLORS.warning]
                            : [COLORS.surface, COLORS.background]
                        }
                        style={styles.availabilityOptionGradient}>
                        <Ionicons
                          name="pause-circle"
                          size={20}
                          color={
                            !editForm.availability
                              ? "white"
                              : COLORS.textTertiary
                          }
                        />
                        <Text
                          style={[
                            styles.availabilityOptionText,
                            !editForm.availability &&
                              styles.availabilityOptionTextActive,
                          ]}>
                          No disponible
                        </Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>
                </View>
              </ScrollView>

              <View style={styles.modalFooter}>
                <TouchableOpacity
                  style={styles.modalCancelButton}
                  onPress={() => setEditModalVisible(false)}
                  activeOpacity={0.8}>
                  <Text style={styles.modalCancelText}>Cancelar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.modalSaveButton}
                  onPress={handleUpdateProfile}
                  activeOpacity={0.8}>
                  <LinearGradient
                    colors={[COLORS.primary, COLORS.primaryLight]}
                    style={styles.modalSaveGradient}>
                    <Text style={styles.modalSaveText}>Guardar Cambios</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </View>
        </View>
      </Modal>

      {/* Modal de agregar habilidades */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={skillsModalVisible}
        onRequestClose={() => setSkillsModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <LinearGradient
              colors={[COLORS.cardBackground, COLORS.surface]}
              style={styles.modalGradient}>
              <View style={styles.modalHeader}>
                <View style={styles.modalTitleContainer}>
                  <MaterialCommunityIcons
                    name="sprout"
                    size={24}
                    color={COLORS.accent}
                  />
                  <Text style={styles.modalTitle}>Agregar Habilidad</Text>
                </View>
                <TouchableOpacity
                  style={styles.modalCloseButton}
                  onPress={() => setSkillsModalVisible(false)}
                  activeOpacity={0.7}>
                  <Ionicons
                    name="close"
                    size={24}
                    color={COLORS.textSecondary}
                  />
                </TouchableOpacity>
              </View>

              <ScrollView
                style={styles.modalContent}
                showsVerticalScrollIndicator={false}>
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Tipo de Cultivo</Text>
                  <View style={styles.cropTypesGrid}>
                    {cropTypes.map((crop) => {
                      const isSelected =
                        skillForm.cropTypeId === crop.id.toString();
                      return (
                        <TouchableOpacity
                          key={crop.id}
                          style={[
                            styles.cropTypeChip,
                            isSelected && styles.cropTypeChipSelected,
                          ]}
                          onPress={() =>
                            setSkillForm({
                              ...skillForm,
                              cropTypeId: crop.id.toString(),
                            })
                          }
                          activeOpacity={0.8}>
                          <LinearGradient
                            colors={
                              isSelected
                                ? [COLORS.accent, COLORS.accentLight]
                                : [COLORS.surface, COLORS.background]
                            }
                            style={styles.cropTypeChipGradient}>
                            <Text
                              style={[
                                styles.cropTypeChipText,
                                isSelected && styles.cropTypeChipTextSelected,
                              ]}>
                              {crop.name}
                            </Text>
                          </LinearGradient>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Nivel de Experiencia</Text>
                  <View style={styles.experienceLevelsContainer}>
                    {["Básico", "Intermedio", "Avanzado"].map((level) => {
                      const isSelected = skillForm.experienceLevel === level;
                      const getColor = () => {
                        switch (level) {
                          case "Básico":
                            return COLORS.primary;
                          case "Intermedio":
                            return COLORS.primary;
                          case "Avanzado":
                            return COLORS.primary;
                          default:
                            return COLORS.primary;
                        }
                      };

                      return (
                        <TouchableOpacity
                          key={level}
                          style={[
                            styles.experienceLevelChip,
                            isSelected && styles.experienceLevelChipSelected,
                          ]}
                          onPress={() =>
                            setSkillForm({
                              ...skillForm,
                              experienceLevel: level,
                            })
                          }
                          activeOpacity={0.8}>
                          <LinearGradient
                            colors={
                              isSelected
                                ? [getColor(), `${getColor()}CC`]
                                : [COLORS.surface, COLORS.background]
                            }
                            style={styles.experienceLevelChipGradient}>
                            <Text
                              style={[
                                styles.experienceLevelChipText,
                                isSelected &&
                                  styles.experienceLevelChipTextSelected,
                              ]}>
                              {level}
                            </Text>
                          </LinearGradient>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Años de Experiencia</Text>
                  <View style={styles.inputWrapper}>
                    <TextInput
                      style={styles.input}
                      keyboardType="numeric"
                      placeholder="Ej: 3"
                      placeholderTextColor={COLORS.textTertiary}
                      value={skillForm.yearsOfExperience}
                      onChangeText={(text) =>
                        setSkillForm({
                          ...skillForm,
                          yearsOfExperience: text,
                        })
                      }
                    />
                  </View>
                </View>
              </ScrollView>

              <View style={styles.modalFooter}>
                <TouchableOpacity
                  style={styles.modalCancelButton}
                  onPress={() => setSkillsModalVisible(false)}
                  activeOpacity={0.8}>
                  <Text style={styles.modalCancelText}>Cancelar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.modalSaveButton,
                    (!skillForm.cropTypeId || addingSkill) &&
                      styles.modalSaveButtonDisabled,
                  ]}
                  onPress={handleAddSkill}
                  disabled={!skillForm.cropTypeId || addingSkill}
                  activeOpacity={0.8}>
                  <LinearGradient
                    colors={
                      !skillForm.cropTypeId || addingSkill
                        ? [COLORS.border, COLORS.borderLight]
                        : [COLORS.accent, COLORS.accentLight]
                    }
                    style={styles.modalSaveGradient}>
                    {addingSkill && (
                      <ActivityIndicator
                        size="small"
                        color="white"
                        style={{ marginRight: 8 }}
                      />
                    )}
                    <Text style={styles.modalSaveText}>
                      {addingSkill ? "Agregando..." : "Confirmar Habilidad"}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </View>
        </View>
      </Modal>

      {/* Modal de reseñas */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={reviewsModalVisible}
        onRequestClose={() => setReviewsModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, styles.reviewsModalContainer]}>
            <LinearGradient
              colors={[COLORS.cardBackground, COLORS.surface]}
              style={styles.modalGradient}>
              <View style={styles.modalHeader}>
                <View style={styles.modalTitleContainer}>
                  <MaterialIcons name="star" size={24} color={COLORS.warning} />
                  <Text style={styles.modalTitle}>Todas mis reseñas</Text>
                </View>
                <TouchableOpacity
                  style={styles.modalCloseButton}
                  onPress={() => setReviewsModalVisible(false)}
                  activeOpacity={0.7}>
                  <Ionicons
                    name="close"
                    size={24}
                    color={COLORS.textSecondary}
                  />
                </TouchableOpacity>
              </View>

              <FlatList
                data={workerReviews}
                keyExtractor={(item, index) => item.id || index.toString()}
                contentContainerStyle={styles.reviewsModalContent}
                showsVerticalScrollIndicator={false}
                renderItem={({ item, index }) => (
                  <View style={styles.fullReviewCard}>
                    <LinearGradient
                      colors={["#ffffff", "#f9fafb"]}
                      style={styles.fullReviewGradient}>
                      <View style={styles.fullReviewHeader}>
                        <View style={styles.reviewerAvatar}>
                          <LinearGradient
                            colors={[COLORS.primary, COLORS.primaryLight]}
                            style={styles.avatarGradient}>
                            <MaterialIcons
                              name="person"
                              size={24}
                              color="white"
                            />
                          </LinearGradient>
                        </View>
                        <View style={styles.fullReviewerInfo}>
                          <Text style={styles.fullReviewerName}>
                            {item.employer?.user?.name || "Usuario anónimo"}
                          </Text>
                          <View style={styles.fullReviewStars}>
                            {[1, 2, 3, 4, 5].map((star) => (
                              <FontAwesome
                                key={star}
                                name={star <= item.rating ? "star" : "star-o"}
                                size={16}
                                color={COLORS.star}
                              />
                            ))}
                          </View>
                          <Text style={styles.fullReviewDate}>
                            {new Date(item.createdAt).toLocaleDateString(
                              "es-CO"
                            )}
                          </Text>
                        </View>
                      </View>
                      {item.comment && (
                        <Text style={styles.fullReviewText}>
                          {item.comment}
                        </Text>
                      )}
                    </LinearGradient>
                  </View>
                )}
                ListEmptyComponent={
                  <View style={styles.emptyReviewsContainer}>
                    <LinearGradient
                      colors={[COLORS.surface, COLORS.background]}
                      style={styles.emptyReviewsGradient}>
                      <MaterialIcons
                        name="star-outline"
                        size={48}
                        color={COLORS.textTertiary}
                      />
                      <Text style={styles.emptyReviewsTitle}>
                        Sin reseñas aún
                      </Text>
                      <Text style={styles.emptyReviewsSubtitle}>
                        Completa trabajos para recibir tus primeras reseñas
                      </Text>
                    </LinearGradient>
                  </View>
                }
              />
            </LinearGradient>
          </View>
        </View>
      </Modal>

      {/* Modal de agregar habilidades */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={skillsModalVisible}
        onRequestClose={() => setSkillsModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <LinearGradient
              colors={[COLORS.cardBackground, COLORS.surface]}
              style={styles.modalGradient}>
              <View style={styles.modalHeader}>
                <View style={styles.modalTitleContainer}>
                  <MaterialCommunityIcons
                    name="sprout"
                    size={24}
                    color={COLORS.accent}
                  />
                  <Text style={styles.modalTitle}>Agregar Habilidad</Text>
                </View>
                <TouchableOpacity
                  style={styles.modalCloseButton}
                  onPress={() => setSkillsModalVisible(false)}
                  activeOpacity={0.7}>
                  <Ionicons
                    name="close"
                    size={24}
                    color={COLORS.textSecondary}
                  />
                </TouchableOpacity>
              </View>

              <ScrollView
                style={styles.modalContent}
                showsVerticalScrollIndicator={false}>
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Tipo de Cultivo</Text>
                  <View style={styles.cropTypesGrid}>
                    {cropTypes.map((crop) => {
                      const isSelected =
                        skillForm.cropTypeId === crop.id.toString();
                      return (
                        <TouchableOpacity
                          key={crop.id}
                          style={[
                            styles.cropTypeChip,
                            isSelected && styles.cropTypeChipSelected,
                          ]}
                          onPress={() =>
                            setSkillForm({
                              ...skillForm,
                              cropTypeId: crop.id.toString(),
                            })
                          }
                          activeOpacity={0.8}>
                          <LinearGradient
                            colors={
                              isSelected
                                ? [COLORS.accent, COLORS.accentLight]
                                : [COLORS.surface, COLORS.background]
                            }
                            style={styles.cropTypeChipGradient}>
                            <Text
                              style={[
                                styles.cropTypeChipText,
                                isSelected && styles.cropTypeChipTextSelected,
                              ]}>
                              {crop.name}
                            </Text>
                          </LinearGradient>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Nivel de Experiencia</Text>
                  <View style={styles.experienceLevelsContainer}>
                    {["Básico", "Intermedio", "Avanzado"].map((level) => {
                      const isSelected = skillForm.experienceLevel === level;
                      const getColor = () => {
                        switch (level) {
                          case "Básico":
                            return COLORS.info;
                          case "Intermedio":
                            return COLORS.warning;
                          case "Avanzado":
                            return COLORS.success;
                          default:
                            return COLORS.primary;
                        }
                      };

                      return (
                        <TouchableOpacity
                          key={level}
                          style={[
                            styles.experienceLevelChip,
                            isSelected && styles.experienceLevelChipSelected,
                          ]}
                          onPress={() =>
                            setSkillForm({
                              ...skillForm,
                              experienceLevel: level,
                            })
                          }
                          activeOpacity={0.8}>
                          <LinearGradient
                            colors={
                              isSelected
                                ? [getColor(), `${getColor()}CC`]
                                : [COLORS.surface, COLORS.background]
                            }
                            style={styles.experienceLevelChipGradient}>
                            <Text
                              style={[
                                styles.experienceLevelChipText,
                                isSelected &&
                                  styles.experienceLevelChipTextSelected,
                              ]}>
                              {level}
                            </Text>
                          </LinearGradient>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Años de Experiencia</Text>
                  <View style={styles.inputWrapper}>
                    <TextInput
                      style={styles.input}
                      keyboardType="numeric"
                      placeholder="Ej: 3"
                      placeholderTextColor={COLORS.textTertiary}
                      value={skillForm.yearsOfExperience}
                      onChangeText={(text) =>
                        setSkillForm({
                          ...skillForm,
                          yearsOfExperience: text,
                        })
                      }
                    />
                  </View>
                </View>
              </ScrollView>

              <View style={styles.modalFooter}>
                <TouchableOpacity
                  style={styles.modalCancelButton}
                  onPress={() => setSkillsModalVisible(false)}
                  activeOpacity={0.8}>
                  <Text style={styles.modalCancelText}>Cancelar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.modalSaveButton,
                    (!skillForm.cropTypeId || addingSkill) &&
                      styles.modalSaveButtonDisabled,
                  ]}
                  onPress={handleAddSkill}
                  disabled={!skillForm.cropTypeId || addingSkill}
                  activeOpacity={0.8}>
                  <LinearGradient
                    colors={
                      !skillForm.cropTypeId || addingSkill
                        ? [COLORS.border, COLORS.borderLight]
                        : [COLORS.accent, COLORS.accentLight]
                    }
                    style={styles.modalSaveGradient}>
                    {addingSkill && (
                      <ActivityIndicator
                        size="small"
                        color="white"
                        style={{ marginRight: 8 }}
                      />
                    )}
                    <Text style={styles.modalSaveText}>
                      {addingSkill ? "Agregando..." : "Confirmar Habilidad"}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </View>
        </View>
      </Modal>

      {/* Modal de reseñas */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={reviewsModalVisible}
        onRequestClose={() => setReviewsModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, styles.reviewsModalContainer]}>
            <LinearGradient
              colors={[COLORS.cardBackground, COLORS.surface]}
              style={styles.modalGradient}>
              <View style={styles.modalHeader}>
                <View style={styles.modalTitleContainer}>
                  <MaterialIcons name="star" size={24} color={COLORS.warning} />
                  <Text style={styles.modalTitle}>Todas mis reseñas</Text>
                </View>
                <TouchableOpacity
                  style={styles.modalCloseButton}
                  onPress={() => setReviewsModalVisible(false)}
                  activeOpacity={0.7}>
                  <Ionicons
                    name="close"
                    size={24}
                    color={COLORS.textSecondary}
                  />
                </TouchableOpacity>
              </View>

              <FlatList
                data={workerReviews}
                keyExtractor={(item, index) => item.id || index.toString()}
                contentContainerStyle={styles.reviewsModalContent}
                showsVerticalScrollIndicator={false}
                renderItem={({ item, index }) => (
                  <View style={styles.fullReviewCard}>
                    <LinearGradient
                      colors={["#ffffff", "#f9fafb"]}
                      style={styles.fullReviewGradient}>
                      <View style={styles.fullReviewHeader}>
                        <View style={styles.reviewerAvatar}>
                          <LinearGradient
                            colors={[COLORS.primary, COLORS.primaryLight]}
                            style={styles.avatarGradient}>
                            <MaterialIcons
                              name="person"
                              size={24}
                              color="white"
                            />
                          </LinearGradient>
                        </View>
                        <View style={styles.fullReviewerInfo}>
                          <Text style={styles.fullReviewerName}>
                            {item.employer?.user?.name || "Usuario anónimo"}
                          </Text>
                          <View style={styles.fullReviewStars}>
                            {[1, 2, 3, 4, 5].map((star) => (
                              <FontAwesome
                                key={star}
                                name={star <= item.rating ? "star" : "star-o"}
                                size={16}
                                color={COLORS.star}
                              />
                            ))}
                          </View>
                          <Text style={styles.fullReviewDate}>
                            {new Date(item.createdAt).toLocaleDateString(
                              "es-CO"
                            )}
                          </Text>
                        </View>
                      </View>
                      {item.comment && (
                        <Text style={styles.fullReviewText}>
                          {item.comment}
                        </Text>
                      )}
                    </LinearGradient>
                  </View>
                )}
                ListEmptyComponent={
                  <View style={styles.emptyReviewsContainer}>
                    <LinearGradient
                      colors={[COLORS.surface, COLORS.background]}
                      style={styles.emptyReviewsGradient}>
                      <MaterialIcons
                        name="star-outline"
                        size={48}
                        color={COLORS.textTertiary}
                      />
                      <Text style={styles.emptyReviewsTitle}>
                        Sin reseñas aún
                      </Text>
                      <Text style={styles.emptyReviewsSubtitle}>
                        Completa trabajos para recibir tus primeras reseñas
                      </Text>
                    </LinearGradient>
                  </View>
                }
              />
            </LinearGradient>
          </View>
        </View>
      </Modal>
    </ScreenLayoutWorker>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  // Loading styles
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingGradient: {
    flex: 1,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "white",
    fontWeight: "500",
  },

  // No profile styles
  noProfileContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  noProfileGradient: {
    flex: 1,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  noProfileTitle: {
    fontSize: 26,
    fontWeight: "bold",
    color: "white",
    marginTop: 20,
    marginBottom: 12,
    textAlign: "center",
  },
  noProfileText: {
    fontSize: 16,
    color: "rgba(255,255,255,0.9)",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 32,
  },
  goBackButton: {
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
  },
  goBackButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },

  // Header styles
  headerContainer: {
    marginBottom: 20,
  },
  header: {
    paddingTop: Platform.OS === "ios" ? 50 : 30,
    paddingBottom: 40,
    paddingHorizontal: 24,
    position: "relative",
    overflow: "hidden",
  },
  headerContent: {
    zIndex: 2,
  },
  profileSection: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  avatarSection: {
    alignItems: "center",
    marginRight: 20,
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 4,
    borderColor: "rgba(255,255,255,0.3)",
  },
  avatarPlaceholder: {
    width: 90,
    height: 90,
    borderRadius: 45,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 4,
    borderColor: "rgba(255,255,255,0.3)",
  },
  availabilityIndicator: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backdropFilter: "blur(10px)",
  },
  availabilityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  availableDot: {
    backgroundColor: COLORS.accentLight,
  },
  unavailableDot: {
    backgroundColor: COLORS.error,
  },
  availabilityLabel: {
    fontSize: 12,
    color: "white",
    fontWeight: "500",
  },
  profileInfo: {
    flex: 1,
  },
  nameSection: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  userName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
  },
  verifiedIcon: {
    marginLeft: 8,
  },
  professionSection: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  profession: {
    fontSize: 16,
    color: "rgba(255,255,255,0.9)",
    marginLeft: 6,
    fontWeight: "500",
  },
  ratingSection: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  rating: {
    marginRight: 8,
  },
  ratingText: {
    fontSize: 14,
    color: "rgba(255,255,255,0.9)",
    fontWeight: "500",
  },
  locationSection: {
    flexDirection: "row",
    alignItems: "center",
  },
  locationText: {
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
    marginLeft: 4,
  },

  // Decorative shapes
  decorativeShapes: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
  shape: {
    position: "absolute",
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  shape1: {
    width: 100,
    height: 100,
    borderRadius: 50,
    top: -30,
    right: -20,
  },
  shape2: {
    width: 60,
    height: 60,
    borderRadius: 30,
    bottom: 20,
    left: -10,
  },
  shape3: {
    width: 80,
    height: 80,
    borderRadius: 40,
    top: "50%",
    right: 10,
  },

  // Stats styles
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginTop: -30,
    marginBottom: 24,
    zIndex: 3,
  },
  statCard: {
    width: (width - 60) / 3,
    borderRadius: 16,
    overflow: "hidden",
    elevation: 8,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  statCardGradient: {
    padding: 20,
    alignItems: "center",
  },
  statIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  statDescription: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: "center",
    fontWeight: "500",
  },

  // Section styles
  section: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 20,
    overflow: "hidden",
    elevation: 4,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  sectionGradient: {
    padding: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  sectionTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  sectionIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: `${COLORS.primary}10`,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.textPrimary,
  },
  editButton: {
    borderRadius: 12,
    overflow: "hidden",
  },
  editButtonGradient: {
    width: 36,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
  },
  addButton: {
    borderRadius: 12,
    overflow: "hidden",
  },
  addButtonGradient: {
    width: 36,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
  },

  // Info grid styles
  infoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  infoCard: {
    width: "48%",
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 12,
    color: COLORS.textTertiary,
    marginTop: 8,
    marginBottom: 4,
    fontWeight: "500",
  },
  infoValue: {
    fontSize: 14,
    color: COLORS.textPrimary,
    fontWeight: "600",
  },

  // Bio styles
  bioSection: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
  },
  bioLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 8,
    fontWeight: "600",
  },
  bioText: {
    fontSize: 14,
    color: COLORS.textPrimary,
    lineHeight: 22,
  },

  // Skills styles
  skillsContainer: {
    gap: 12,
  },
  skillCard: {
    borderRadius: 16,
    overflow: "hidden",
    elevation: 2,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  skillCardGradient: {
    padding: 16,
  },
  skillHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  skillIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${COLORS.accent}15`,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  skillInfo: {
    flex: 1,
  },
  skillName: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.textPrimary,
    marginBottom: 6,
  },
  skillMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  experienceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  experienceBadgeText: {
    fontSize: 12,
    color: "white",
    fontWeight: "600",
  },
  experienceYears: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: "500",
  },
  deleteSkillButton: {
    padding: 8,
  },

  // Reviews styles
  ratingSummaryContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  ratingNumberContainer: {
    flexDirection: "row",
    alignItems: "baseline",
    marginRight: 20,
  },
  ratingNumber: {
    fontSize: 36,
    fontWeight: "bold",
    color: COLORS.textPrimary,
  },
  ratingMaxNumber: {
    fontSize: 18,
    color: COLORS.textTertiary,
    marginLeft: 2,
  },
  ratingDetailsContainer: {
    flex: 1,
  },
  summaryRating: {
    alignSelf: "flex-start",
    marginBottom: 8,
  },
  reviewsCount: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: "500",
  },
  reviewsList: {
    gap: 12,
  },
  reviewCard: {
    borderRadius: 16,
    overflow: "hidden",
    elevation: 2,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  reviewCardGradient: {
    padding: 16,
  },
  reviewHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  reviewerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    overflow: "hidden",
  },
  avatarGradient: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  reviewerInfo: {
    flex: 1,
  },
  reviewerName: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  reviewStarsContainer: {
    flexDirection: "row",
    gap: 2,
  },
  reviewDate: {
    fontSize: 12,
    color: COLORS.textTertiary,
  },
  reviewText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },

  // Empty state styles
  emptyState: {
    borderRadius: 16,
    overflow: "hidden",
  },
  emptyStateGradient: {
    paddingVertical: 40,
    paddingHorizontal: 20,
    alignItems: "center",
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.textPrimary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 24,
  },
  emptyActionButton: {
    borderRadius: 12,
    overflow: "hidden",
  },
  emptyActionGradient: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 20,
    gap: 8,
  },
  emptyActionText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },

  // View all button
  viewAllButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  viewAllText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: "600",
  },

  // Bottom spacing
  bottomSpacing: {
    height: 40,
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: "flex-end",
  },
  modalContainer: {
    backgroundColor: "transparent",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "85%",
    overflow: "hidden",
  },
  reviewsModalContainer: {
    maxHeight: "90%",
  },
  modalGradient: {
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 20,
    minHeight: 200,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  modalTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.textPrimary,
    marginLeft: 12,
  },
  modalCloseButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.surface,
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    maxHeight: "70%",
  },
  modalFooter: {
    flexDirection: "row",
    gap: 12,
    marginTop: 24,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  modalCancelButton: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  modalCancelText: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.textSecondary,
  },
  modalSaveButton: {
    flex: 1,
    borderRadius: 12,
    overflow: "hidden",
  },
  modalSaveButtonDisabled: {
    opacity: 0.6,
  },
  modalSaveGradient: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 14,
  },
  modalSaveText: {
    fontSize: 16,
    fontWeight: "600",
    color: "white",
  },

  // Input styles
  inputContainer: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.textPrimary,
    marginBottom: 12,
  },
  inputWrapper: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  input: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 16,
    color: COLORS.textPrimary,
  },
  textAreaContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  textArea: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 16,
    color: COLORS.textPrimary,
    minHeight: 100,
    textAlignVertical: "top",
  },

  // Availability styles
  availabilityContainer: {
    marginBottom: 24,
  },
  availabilityOptions: {
    flexDirection: "row",
    gap: 12,
  },
  availabilityOption: {
    flex: 1,
    borderRadius: 12,
    overflow: "hidden",
  },
  availabilityOptionActive: {
    elevation: 4,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  availabilityOptionGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 8,
  },
  availabilityOptionText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.textSecondary,
  },
  availabilityOptionTextActive: {
    color: "white",
  },

  // Crop types styles
  cropTypesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  cropTypeChip: {
    borderRadius: 20,
    overflow: "hidden",
    marginBottom: 8,
  },
  cropTypeChipSelected: {
    elevation: 4,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  cropTypeChipGradient: {
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  cropTypeChipText: {
    fontSize: 14,
    fontWeight: "500",
    color: COLORS.textSecondary,
    textAlign: "center",
  },
  cropTypeChipTextSelected: {
    color: "white",
    fontWeight: "600",
  },

  // Experience levels styles
  experienceLevelsContainer: {
    flexDirection: "row",
    gap: 8,
  },
  experienceLevelChip: {
    flex: 1,
    borderRadius: 12,
    overflow: "hidden",
  },
  experienceLevelChipSelected: {
    elevation: 4,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  experienceLevelChipGradient: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    alignItems: "center",
  },
  experienceLevelChipText: {
    fontSize: 14,
    fontWeight: "500",
    color: COLORS.textSecondary,
    textAlign: "center",
  },
  experienceLevelChipTextSelected: {
    color: "white",
    fontWeight: "600",
  },

  // Reviews modal styles
  reviewsModalContent: {
    paddingBottom: 20,
  },
  fullReviewCard: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: "hidden",
    elevation: 2,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  fullReviewGradient: {
    padding: 16,
  },
  fullReviewHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  fullReviewerInfo: {
    flex: 1,
    marginLeft: 12,
  },
  fullReviewerName: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.textPrimary,
    marginBottom: 6,
  },
  fullReviewStars: {
    flexDirection: "row",
    gap: 2,
    marginBottom: 4,
  },
  fullReviewDate: {
    fontSize: 12,
    color: COLORS.textTertiary,
  },
  fullReviewText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },

  // Empty reviews styles
  emptyReviewsContainer: {
    marginTop: 40,
    borderRadius: 16,
    overflow: "hidden",
  },
  emptyReviewsGradient: {
    paddingVertical: 40,
    paddingHorizontal: 20,
    alignItems: "center",
  },
  emptyReviewsTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.textPrimary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyReviewsSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 20,
  },
});

export default WorkerProfileScreen;
