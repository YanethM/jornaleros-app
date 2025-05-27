import React, { useState, useEffect, useRef } from "react";
import {
  Text,
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Platform,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Dimensions,
  Modal,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import { useAuth } from "../../context/AuthContext";
import { deleteFarm, getFarmById } from "../../services/farmService";
import { getCultivationPhaseById } from "../../services/cultivationPhaseService";
import {
  getCountries,
  getDepartmentsByCountry,
  getMunicipalitiesByDepartment,
  getVillagesByMunicipality,
} from "../../services/locationService";
import ScreenLayout from "../../components/ScreenLayout";
import CustomTabBar from "../../components/CustomTabBar";

interface TerrainDetailProps {
  navigation: any;
  route: any;
}

const { width: screenWidth } = Dimensions.get("window");

// Paleta de colores mejorada
const COLORS = {
  primary: "#2C5F7B",
  primaryLight: "#E8F1F5",
  primaryDark: "#1A3B4A",
  secondary: "#C49B61",
  secondaryLight: "#F7F2E8",
  tertiary: "#0F52A0",
  tertiaryLight: "#E6EDF8",
  success: "#22C55E",
  successLight: "#DCFCE7",
  warning: "#F59E0B",
  warningLight: "#FEF3C7",
  error: "#E35353",
  errorLight: "#FEF2F2",
  text: {
    primary: "#1F2937",
    secondary: "#6B7280",
    tertiary: "#9CA3AF",
    white: "#FFFFFF",
  },
  background: {
    primary: "#F9FAFB",
    secondary: "#FFFFFF",
    tertiary: "#F3F4F6",
  },
  border: {
    light: "#E5E7EB",
    medium: "#D1D5DB",
    dark: "#9CA3AF",
  },
};

const TerrainDetail: React.FC<TerrainDetailProps> = ({ navigation, route }) => {
  const { farmId } = route.params;
  const { user } = useAuth();
  const [farm, setFarm] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [phases, setPhases] = useState<any[]>([]);
  const [locationCache, setLocationCache] = useState<any>({});
  const [cropColors, setCropColors] = useState<Record<string, any>>({});
  const [showPermissionModal, setShowPermissionModal] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  const assignCropColors = (cropTypes: string[]) => {
    const colors = getCropTypeColors();
    const assignedColors: Record<string, any> = {};

    cropTypes.forEach((cropType, index) => {
      assignedColors[cropType] = colors[index % colors.length];
    });

    setCropColors(assignedColors);
  };

  const loadLocationCache = async () => {
    try {
      const countries = await getCountries();
      const cache: any = {};

      if (countries?.data) {
        for (const country of countries.data) {
          cache[country.id] = { name: country.name, type: "country" };

          try {
            const departments = await getDepartmentsByCountry(country.id);
            if (departments?.data) {
              for (const dept of departments.data) {
                cache[dept.id] = {
                  name: dept.name,
                  type: "department",
                  country: country.name,
                };

                try {
                  const municipalities = await getMunicipalitiesByDepartment(
                    dept.id
                  );
                  if (municipalities?.data) {
                    for (const muni of municipalities.data) {
                      cache[muni.id] = {
                        name: muni.name,
                        type: "municipality",
                        department: dept.name,
                        country: country.name,
                      };

                      try {
                        const villages = await getVillagesByMunicipality(
                          muni.id
                        );
                        if (villages?.data) {
                          for (const village of villages.data) {
                            cache[village.id] = {
                              name: village.name,
                              type: "village",
                              municipality: muni.name,
                              department: dept.name,
                              country: country.name,
                            };
                          }
                        }
                      } catch (villageError) {
                        console.warn(
                          `Error loading villages for ${muni.name}:`,
                          villageError
                        );
                      }
                    }
                  }
                } catch (muniError) {
                  console.warn(
                    `Error loading municipalities for ${dept.name}:`,
                    muniError
                  );
                }
              }
            }
          } catch (deptError) {
            console.warn(
              `Error loading departments for ${country.name}:`,
              deptError
            );
          }
        }
      }

      setLocationCache(cache);
    } catch (error) {
      console.warn("Error loading location cache:", error);
    }
  };

  useEffect(() => {
    if (!farmId) {
      setError("No se proporcionó ID de finca");
      setLoading(false);
      return;
    }

    if (!/^[0-9a-fA-F]{24}$/.test(farmId)) {
      console.error("Invalid farmId format:", farmId);
      setError("ID de finca con formato inválido");
      setLoading(false);
      return;
    }

    loadLocationCache();
    loadFarmDetails();

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, [farmId]);

  useEffect(() => {
    if (farm) {
      const cropTypes = getCropTypes();
      assignCropColors(cropTypes);
    }
  }, [farm]);

  const loadFarmDetails = async (isRefreshing = false) => {
    try {
      if (!isRefreshing) {
        setLoading(true);
      }
      setError(null);

      const response = await getFarmById(farmId);
      let farmData;
      if (response?.data) {
        farmData = response.data;
      } else if (response?.success && response?.data) {
        farmData = response.data;
      } else if (response && typeof response === "object" && response.id) {
        farmData = response;
      } else {
        throw new Error("Formato de respuesta inválido");
      }

      const allPhases: any[] = [];
      const cropTypesInfo = farmData.cropTypesInfo || [];
      const cropTypeMap = new Map();
      cropTypesInfo.forEach((cropType: any) => {
        cropTypeMap.set(cropType.id, cropType.name);
      });

      if (farmData.phasesByCropType) {
        Object.entries(farmData.phasesByCropType).forEach(
          ([cropTypeId, cropData]: [string, any]) => {
            const cropTypeName =
              cropTypeMap.get(cropTypeId) ||
              cropData.cropTypeName ||
              "Sin especificar";
            if (cropData.activePhases) {
              allPhases.push(
                ...cropData.activePhases.map((farmPhase: any) => ({
                  ...farmPhase.cultivationPhase,
                  isActive: farmPhase.isActive,
                  startDate: farmPhase.startDate,
                  endDate: farmPhase.endDate,
                  cropTypeName: cropTypeName,
                  farmPhaseId: farmPhase.id,
                }))
              );
            }
          }
        );
      }

      if (allPhases.length === 0 && farmData.activePhasesInfo) {
        allPhases.push(
          ...farmData.activePhasesInfo.map((phase: any) => {
            const cropTypeName = phase.cropTypeId
              ? cropTypeMap.get(phase.cropTypeId)
              : phase.cropTypeName || "Sin especificar";
            return {
              ...phase,
              isActive: phase.isActive !== false,
              cropTypeName: cropTypeName,
            };
          })
        );
      }

      if (allPhases.length === 0 && farmData.phases) {
        farmData.phases.forEach((farmPhase: any) => {
          if (farmPhase.cultivationPhase) {
            const cropTypeName =
              farmPhase.cultivationPhase.cropType?.name ||
              (farmPhase.cropTypeId
                ? cropTypeMap.get(farmPhase.cropTypeId)
                : "Sin especificar");
            allPhases.push({
              ...farmPhase.cultivationPhase,
              isActive: farmPhase.isActive,
              startDate: farmPhase.startDate,
              endDate: farmPhase.endDate,
              cropTypeName: cropTypeName,
              farmPhaseId: farmPhase.id,
            });
          }
        });
      }

      setPhases(allPhases);
      setFarm(farmData);
    } catch (error) {
      console.error("Error loading farm details:", error);
      let errorMessage = "Error al cargar los detalles de la finca";

      if (error?.response?.status === 404) {
        errorMessage = "Finca no encontrada";
      } else if (error?.response?.status === 400) {
        errorMessage = "ID de finca inválido";
      } else if (error?.message) {
        errorMessage = error.message;
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  const handleDelete = async () => {
    try {
      await deleteFarm(farmId);
      Alert.alert("Éxito", "Finca eliminada correctamente", [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      console.error("Error deleting farm:", error);
  
      if (
        error?.status === 403 ||
        error?.message?.includes("No tienes permiso") ||
        error?.data?.msg?.includes("No tienes permiso")
      ) {
        setShowPermissionModal(true);
      } else {
        Alert.alert("Error", "No se pudo eliminar la finca");
      }
    }
  };

  const handleEdit = () => {
    navigation.navigate("EditTerrain", { farmId: farm.id });
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadFarmDetails(true);
  };

  const getLocationInfo = () => {
    if (!farm)
      return {
        city: "No especificado",
        state: "No especificado",
        village: null,
        country: "No especificado",
      };

    if (farm.locationInfo) {
      return {
        city: farm.locationInfo.city || "No especificado",
        state:
          farm.locationInfo.department ||
          farm.locationInfo.state ||
          "No especificado",
        village: farm.locationInfo.village || null,
        country: farm.locationInfo.country || "Colombia",
      };
    }

    if (
      farm.city?.name ||
      farm.department?.name ||
      farm.village?.name ||
      farm.country?.name
    ) {
      return {
        city: farm.city?.name || "No especificado",
        state: farm.department?.name || "No especificado",
        village: farm.village?.name || null,
        country: farm.country?.name || "Colombia",
      };
    }

    if (farm.locationString) {
      const parts = farm.locationString.split(", ");
      return {
        village: parts[0] !== "N/A" ? parts[0] : null,
        city: parts[1] !== "N/A" ? parts[1] : "No especificado",
        state: parts[2] !== "N/A" ? parts[2] : "No especificado",
        country: parts[3] !== "N/A" ? parts[3] : "Colombia",
      };
    }

    const cacheCountry =
      locationCache[farm.countryId]?.name || locationCache[farm.country]?.name;
    const cacheDepartment =
      locationCache[farm.departmentId]?.name || locationCache[farm.state]?.name;
    const cacheCity =
      locationCache[farm.cityId]?.name || locationCache[farm.city]?.name;
    const cacheVillage =
      locationCache[farm.villageId]?.name || locationCache[farm.village]?.name;

    return {
      city: cacheCity || "No especificado",
      state: cacheDepartment || "No especificado",
      village: cacheVillage || null,
      country: cacheCountry || "Colombia",
    };
  };

  const getCropTypes = () => {
    if (!farm) return [];

    if (
      farm.cropTypesInfo &&
      Array.isArray(farm.cropTypesInfo) &&
      farm.cropTypesInfo.length > 0
    ) {
      const cropNames = farm.cropTypesInfo
        .map((ct: any) => (typeof ct === "string" ? ct : ct.name))
        .filter(Boolean);
      return cropNames;
    }

    if (
      farm.cropTypes &&
      Array.isArray(farm.cropTypes) &&
      farm.cropTypes.length > 0
    ) {
      const cropNames = farm.cropTypes
        .map((ct: any) => ct.cropType?.name || ct.name)
        .filter(Boolean);
      return cropNames;
    }

    if (farm.cropType) {
      const cropName =
        typeof farm.cropType === "string" ? farm.cropType : farm.cropType.name;
      return cropName ? [cropName] : [];
    }

    return [];
  };

  const getCropTypeColors = () => {
    return [
      {
        primary: COLORS.primary,
        light: COLORS.primaryLight,
        icon: "eco",
        gradient: ["#2C5F7B", "#1A3B4A"],
      },
      {
        primary: COLORS.secondary,
        light: COLORS.secondaryLight,
        icon: "local-cafe",
        gradient: ["#C49B61", "#A67C3A"],
      },
      {
        primary: COLORS.tertiary,
        light: COLORS.tertiaryLight,
        icon: "grass",
        gradient: ["#0F52A0", "#0A3B73"],
      },
      {
        primary: COLORS.warning,
        light: COLORS.warningLight,
        icon: "local-florist",
        gradient: ["#F59E0B", "#D97706"],
      },
      {
        primary: COLORS.success,
        light: COLORS.successLight,
        icon: "nature",
        gradient: ["#22C55E", "#16A34A"],
      },
    ];
  };

  const getPhaseIcon = (phaseName: string) => {
    const icons: { [key: string]: string } = {
      preparación: "construction",
      siembra: "spa",
      crecimiento: "trending-up",
      mantenimiento: "build",
      floración: "local-florist",
      fructificación: "eco",
      cosecha: "agriculture",
      poscosecha: "inventory",
      default: "timeline",
    };

    const lowerName = phaseName?.toLowerCase() || "";
    for (const [key, icon] of Object.entries(icons)) {
      if (lowerName.includes(key)) {
        return icon;
      }
    }
    return icons.default;
  };

  const getPhaseShortName = (fullName: string) => {
    if (!fullName) return "No especificada";
    if (fullName.length <= 50) return fullName;

    const emojiPattern =
      /^[\u{1F000}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]\s*\d+\.\s*(.+)$/u;
    const match = fullName.match(emojiPattern);

    if (match && match[1]) {
      return match[1].trim();
    }

    const numberPattern = /^\d+\.\s*(.+)$/;
    const numberMatch = fullName.match(numberPattern);

    if (numberMatch && numberMatch[1]) {
      return numberMatch[1].trim();
    }

    return fullName;
  };

  const getPlantDensity = () => {
    if (!farm.size || farm.size === 0) return 0;
    return Math.round((farm.plantCount || 0) / farm.size);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.loadingContent}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Cargando detalles...</Text>
          <Text style={styles.debugText}>Farm ID: {farmId}</Text>
        </View>
      </View>
    );
  }

  if (error || !farm) {
    return (
      <View style={styles.errorContainer}>
        <View style={styles.errorContent}>
          <View style={styles.errorIconContainer}>
            <Icon name="error-outline" size={48} color={COLORS.error} />
          </View>
          <Text style={styles.errorTitle}>¡Ups! Algo salió mal</Text>
          <Text style={styles.errorText}>{error || "Finca no encontrada"}</Text>
          <Text style={styles.debugText}>Farm ID: {farmId}</Text>
          <Text style={styles.debugText}>
            Valid ObjectId: {/^[0-9a-fA-F]{24}$/.test(farmId) ? "Sí" : "No"}
          </Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => loadFarmDetails()}>
            <Icon name="refresh" size={18} color={COLORS.text.white} />
            <Text style={styles.retryButtonText}>Reintentar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.retryButton,
              { backgroundColor: COLORS.secondary, marginTop: 8 },
            ]}
            onPress={() => navigation.goBack()}>
            <Icon name="arrow-back" size={18} color={COLORS.text.white} />
            <Text style={styles.retryButtonText}>Volver</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const cropTypes = getCropTypes();
  const cropColor = getCropTypeColors()[0]; // Color principal para la finca
  const locationInfo = getLocationInfo();
  const employerProfile = farm.employerProfile || farm.employer;
  const activePhases = phases.filter((p) => p.isActive);
  const plantDensity = getPlantDensity();

  const PermissionModal = () => (
    <Modal
      animationType="fade"
      transparent={true}
      visible={showPermissionModal}
      onRequestClose={() => setShowPermissionModal(false)}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <View style={styles.modalIconContainer}>
              <Icon
                name="admin-panel-settings"
                size={32}
                color={COLORS.warning}
              />
            </View>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowPermissionModal(false)}>
              <Icon name="close" size={20} color={COLORS.text.secondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.modalBody}>
            <Text style={styles.modalTitle}>Permisos Insuficientes</Text>
            <Text style={styles.modalDescription}>
              Solo los <Text style={styles.highlightText}>administradores</Text>{" "}
              pueden eliminar fincas del sistema.
            </Text>

            <View style={styles.modalInfoContainer}>
              <View style={styles.modalInfoItem}>
                <Icon name="info" size={16} color={COLORS.primary} />
                <Text style={styles.modalInfoText}>
                  Esta es una medida de seguridad para proteger los datos
                  importantes
                </Text>
              </View>
              <View style={styles.modalInfoItem}>
                <Icon
                  name="contact-support"
                  size={16}
                  color={COLORS.secondary}
                />
                <Text style={styles.modalInfoText}>
                  Contacta a tu administrador si necesitas eliminar esta finca
                </Text>
              </View>
            </View>

            <View style={styles.modalAlternatives}>
              <Text style={styles.modalAlternativesTitle}>
                Alternativas disponibles:
              </Text>
              <View style={styles.modalAlternativeItem}>
                <Icon name="edit" size={14} color={COLORS.success} />
                <Text style={styles.modalAlternativeText}>
                  Editar información de la finca
                </Text>
              </View>
              <View style={styles.modalAlternativeItem}>
                <Icon name="visibility-off" size={14} color={COLORS.tertiary} />
                <Text style={styles.modalAlternativeText}>
                  Marcar como inactiva (si disponible)
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => setShowPermissionModal(false)}>
              <Text style={styles.modalButtonText}>Entendido</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
  return (
    <ScreenLayout navigation={navigation}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>{farm.name}</Text>
          <Text style={styles.headerSubtitle}>
            {locationInfo.city}, {locationInfo.state}
          </Text>
        </View>
        <View style={styles.headerIcon}>
          <Icon name="agriculture" size={24} color="#fff" />
        </View>
      </View>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
            colors={[COLORS.primary]}
          />
        }>
        <Animated.View
          style={[
            styles.content,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }, { translateY: slideAnim }],
            },
          ]}>
          {/* Hero Card con ubicación completa */}
          <View
            style={[styles.heroCard, { borderLeftColor: cropColor.primary }]}>
            <View style={styles.farmHeader}>
              <View
                style={[
                  styles.iconContainer,
                  { backgroundColor: cropColor.light },
                ]}>
                <Icon
                  name={cropColor.icon}
                  size={32}
                  color={cropColor.primary}
                />
              </View>
              <View style={styles.farmInfo}>
                <Text style={styles.farmName}>{farm.name}</Text>
                <View style={styles.locationRow}>
                  <Icon
                    name="location-on"
                    size={16}
                    color={COLORS.text.secondary}
                  />
                  <Text style={styles.locationText}>
                    {locationInfo.village ? `${locationInfo.village}, ` : ""}
                    {locationInfo.city}, {locationInfo.state}
                  </Text>
                </View>
                <View style={styles.locationRow}>
                  <Icon name="public" size={16} color={COLORS.text.secondary} />
                  <Text style={styles.locationText}>
                    {locationInfo.country}
                  </Text>
                </View>
                {employerProfile?.organization && (
                  <View style={styles.locationRow}>
                    <Icon
                      name="business"
                      size={16}
                      color={COLORS.text.secondary}
                    />
                    <Text style={styles.locationText}>
                      Organización: {employerProfile.organization}
                    </Text>
                  </View>
                )}
              </View>
            </View>

            <View style={styles.chipContainer}>
              {cropTypes.length > 0 ? (
                cropTypes.slice(0, 3).map((cropType, idx) => {
                  const chipColor =
                    cropColors[cropType] || getCropTypeColors()[0];
                  return (
                    <View
                      key={`crop-${idx}`}
                      style={[
                        styles.chip,
                        { backgroundColor: chipColor.light },
                      ]}>
                      <View
                        style={[
                          styles.chipDot,
                          { backgroundColor: chipColor.primary },
                        ]}
                      />
                      <Text
                        style={[styles.chipText, { color: chipColor.primary }]}>
                        {cropType}
                      </Text>
                    </View>
                  );
                })
              ) : (
                <View
                  style={[
                    styles.chip,
                    { backgroundColor: COLORS.border.light },
                  ]}>
                  <View
                    style={[
                      styles.chipDot,
                      { backgroundColor: COLORS.text.tertiary },
                    ]}
                  />
                  <Text
                    style={[styles.chipText, { color: COLORS.text.tertiary }]}>
                    Sin cultivos especificados
                  </Text>
                </View>
              )}

              {cropTypes.length > 3 && (
                <View
                  style={[
                    styles.chip,
                    { backgroundColor: COLORS.primaryLight },
                  ]}>
                  <View
                    style={[
                      styles.chipDot,
                      { backgroundColor: COLORS.primary },
                    ]}
                  />
                  <Text style={[styles.chipText, { color: COLORS.primary }]}>
                    +{cropTypes.length - 3} más
                  </Text>
                </View>
              )}

              <View
                style={[
                  styles.statusChip,
                  {
                    backgroundColor: farm.status
                      ? COLORS.successLight
                      : COLORS.errorLight,
                  },
                ]}>
                <View
                  style={[
                    styles.statusDot,
                    {
                      backgroundColor: farm.status
                        ? COLORS.success
                        : COLORS.error,
                    },
                  ]}
                />
                <Text
                  style={[
                    styles.chipText,
                    { color: farm.status ? COLORS.success : COLORS.error },
                  ]}>
                  {farm.status ? "Activa" : "Inactiva"}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <View
                style={[
                  styles.statIconContainer,
                  { backgroundColor: COLORS.primaryLight },
                ]}>
                <Icon name="terrain" size={20} color={COLORS.primary} />
              </View>
              <Text style={styles.statValue}>{farm.size || 0}</Text>
              <Text style={styles.statLabel}>Hectáreas</Text>
            </View>

            <View style={styles.statCard}>
              <View
                style={[
                  styles.statIconContainer,
                  { backgroundColor: COLORS.secondaryLight },
                ]}>
                <Icon
                  name="filter-vintage"
                  size={20}
                  color={COLORS.secondary}
                />
              </View>
              <Text style={styles.statValue}>
                {farm.plantCount > 999
                  ? `${(farm.plantCount / 1000).toFixed(1)}K`
                  : farm.plantCount || 0}
              </Text>
              <Text style={styles.statLabel}>Plantas</Text>
            </View>

            <View style={styles.statCard}>
              <View
                style={[
                  styles.statIconContainer,
                  { backgroundColor: COLORS.tertiaryLight },
                ]}>
                <Icon name="timeline" size={20} color={COLORS.tertiary} />
              </View>
              <Text style={styles.statValue}>
                {activePhases.length}/{phases.length}
              </Text>
              <Text style={styles.statLabel}>Fases Activas</Text>
            </View>
          </View>

          {/* Mostrar fases si existen */}
          {phases.length > 0 && (
            <View style={styles.card}>
              <View style={styles.sectionHeader}>
                <Icon name="timeline" size={24} color={COLORS.primary} />
                <Text style={styles.sectionTitle}>Fases de Cultivo</Text>
              </View>

              {Object.entries(
                phases.reduce((acc, phase) => {
                  const cropType = phase.cropTypeName || "Sin especificar";
                  if (!acc[cropType]) {
                    acc[cropType] = [];
                  }
                  acc[cropType].push(phase);
                  return acc;
                }, {} as Record<string, any[]>)
              ).map(([cropType, cropPhases]) => {
                const color = cropColors[cropType] || getCropTypeColors()[0];

                return (
                  <View key={cropType} style={styles.cropTypeSection}>
                    <View
                      style={[
                        styles.cropTypeHeader,
                        { backgroundColor: color.light },
                      ]}>
                      <Icon name={color.icon} size={18} color={color.primary} />
                      <Text
                        style={[styles.cropTypeName, { color: color.primary }]}>
                        {cropType}
                      </Text>
                    </View>

                    <View style={styles.phasesContainer}>
                      {(cropPhases as any[]).map((phase: any) => (
                        <View
                          key={phase.farmPhaseId || phase.id}
                          style={[
                            styles.phaseItem,
                            phase.isActive
                              ? styles.activePhaseItem
                              : styles.inactivePhaseItem,
                            { borderLeftColor: color.primary },
                          ]}>
                          <View style={styles.phaseHeader}>
                            <View
                              style={[
                                styles.phaseIconContainer,
                                {
                                  backgroundColor: phase.isActive
                                    ? color.light
                                    : COLORS.background.tertiary,
                                },
                              ]}>
                              <Icon
                                name={getPhaseIcon(phase?.name)}
                                size={16}
                                color={
                                  phase.isActive
                                    ? color.primary
                                    : COLORS.text.tertiary
                                }
                              />
                            </View>

                            <View style={styles.phaseContent}>
                              <View style={styles.phaseTitleRow}>
                                <Text
                                  style={[
                                    styles.phaseTitle,
                                    {
                                      color: phase.isActive
                                        ? color.primary
                                        : COLORS.text.tertiary,
                                    },
                                  ]}>
                                  {getPhaseShortName(phase?.name)}
                                </Text>
                                {phase.isActive && (
                                  <View
                                    style={[
                                      styles.activeBadge,
                                      { backgroundColor: COLORS.success },
                                    ]}>
                                    <Icon
                                      name="check-circle"
                                      size={10}
                                      color={COLORS.text.white}
                                    />
                                  </View>
                                )}
                                {!phase.isActive && (
                                  <View
                                    style={[
                                      styles.activeBadge,
                                      { backgroundColor: COLORS.text.tertiary },
                                    ]}>
                                    <Icon
                                      name="pause"
                                      size={10}
                                      color={COLORS.text.white}
                                    />
                                  </View>
                                )}
                              </View>

                              {phase?.description && (
                                <Text
                                  style={[
                                    styles.phaseDescription,
                                    {
                                      color: phase.isActive
                                        ? COLORS.text.secondary
                                        : COLORS.text.tertiary,
                                    },
                                  ]}>
                                  {phase.description}
                                </Text>
                              )}

                              <View style={styles.phaseDatesContainer}>
                                {phase.startDate && (
                                  <View style={styles.dateItem}>
                                    <Icon
                                      name="event"
                                      size={12}
                                      color={
                                        phase.isActive
                                          ? COLORS.success
                                          : COLORS.text.tertiary
                                      }
                                    />
                                    <Text
                                      style={[
                                        styles.dateText,
                                        {
                                          color: phase.isActive
                                            ? COLORS.text.secondary
                                            : COLORS.text.tertiary,
                                        },
                                      ]}>
                                      Inicio:{" "}
                                      {new Date(
                                        phase.startDate
                                      ).toLocaleDateString()}
                                    </Text>
                                  </View>
                                )}
                                {phase.endDate && (
                                  <View style={styles.dateItem}>
                                    <Icon
                                      name="event-available"
                                      size={12}
                                      color={
                                        phase.isActive
                                          ? COLORS.warning
                                          : COLORS.text.tertiary
                                      }
                                    />
                                    <Text
                                      style={[
                                        styles.dateText,
                                        {
                                          color: phase.isActive
                                            ? COLORS.text.secondary
                                            : COLORS.text.tertiary,
                                        },
                                      ]}>
                                      Fin:{" "}
                                      {new Date(
                                        phase.endDate
                                      ).toLocaleDateString()}
                                    </Text>
                                  </View>
                                )}
                              </View>
                            </View>
                          </View>
                        </View>
                      ))}
                    </View>
                  </View>
                );
              })}
            </View>
          )}

          {/* Información detallada de la finca */}
          <View style={styles.card}>
            <View style={styles.sectionHeader}>
              <Icon name="info" size={24} color={COLORS.primary} />
              <Text style={styles.sectionTitle}>Información Detallada</Text>
            </View>

            <View style={styles.infoGrid}>
              <View style={styles.infoItem}>
                <View
                  style={[
                    styles.infoIconContainer,
                    { backgroundColor: COLORS.primaryLight },
                  ]}>
                  <Icon name="straighten" size={20} color={COLORS.primary} />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Área Total</Text>
                  <Text style={styles.infoValue}>
                    {farm.size || 0} hectáreas
                  </Text>
                </View>
              </View>

              <View style={styles.infoItem}>
                <View
                  style={[
                    styles.infoIconContainer,
                    { backgroundColor: COLORS.secondaryLight },
                  ]}>
                  <Icon name="nature" size={20} color={COLORS.secondary} />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Total de Plantas</Text>
                  <Text style={styles.infoValue}>
                    {(farm.plantCount || 0).toLocaleString()} plantas
                  </Text>
                </View>
              </View>

              <View style={styles.infoItem}>
                <View
                  style={[
                    styles.infoIconContainer,
                    { backgroundColor: COLORS.tertiaryLight },
                  ]}>
                  <Icon name="show-chart" size={20} color={COLORS.tertiary} />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Densidad</Text>
                  <Text style={styles.infoValue}>
                    {plantDensity} plantas por hectárea
                  </Text>
                </View>
              </View>

              <View style={styles.infoItem}>
                <View
                  style={[
                    styles.infoIconContainer,
                    { backgroundColor: COLORS.warningLight },
                  ]}>
                  <Icon
                    name="calendar-today"
                    size={20}
                    color={COLORS.warning}
                  />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Fecha de Creación</Text>
                  <Text style={styles.infoValue}>
                    {farm.createdAt
                      ? new Date(farm.createdAt).toLocaleDateString()
                      : "No disponible"}
                  </Text>
                </View>
              </View>

              {farm.specificLocation && (
                <View style={styles.infoItem}>
                  <View
                    style={[
                      styles.infoIconContainer,
                      { backgroundColor: COLORS.successLight },
                    ]}>
                    <Icon name="room" size={20} color={COLORS.success} />
                  </View>
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Ubicación Específica</Text>
                    <Text style={styles.infoValue}>
                      {farm.specificLocation}
                    </Text>
                  </View>
                </View>
              )}
            </View>
          </View>

          {/* Action Buttons Mejorados */}
          <View style={styles.actionContainer}>
            <TouchableOpacity
              style={[styles.actionButton, styles.editButton]}
              onPress={handleEdit}
              activeOpacity={0.8}>
              <Icon name="edit" size={18} color={COLORS.text.white} />
              <Text style={styles.actionButtonText}>Editar Finca</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.deleteButton]}
              onPress={handleDelete}
              activeOpacity={0.8}>
              <Icon name="delete" size={18} color={COLORS.text.white} />
              <Text style={styles.actionButtonText}>Eliminar</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
        <CustomTabBar navigation={navigation} currentRoute="TerrainDetail" />
      </ScrollView>
      <PermissionModal />
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background.primary,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: "#284F66",
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: "#284F66",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#fff",
  },
  headerSubtitle: {
    fontSize: 12,
    color: "rgba(255,255,255,0.8)",
    marginTop: 2,
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  scrollView: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingTop: 20,
    paddingBottom: 40,
  },
  cropTypeSection: {
    marginBottom: 20,
  },
  cropTypeHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  cropTypeName: {
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 8,
  },
  // Hero Card
  heroCard: {
    backgroundColor: COLORS.background.secondary,
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 24,
    borderRadius: 16,
    borderLeftWidth: 4,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  farmHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  farmInfo: {
    flex: 1,
  },
  farmName: {
    fontSize: 24,
    fontWeight: "700",
    color: COLORS.text.primary,
    marginBottom: 6,
    lineHeight: 28,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  locationText: {
    fontSize: 14,
    color: COLORS.text.secondary,
    marginLeft: 6,
    flex: 1,
    fontWeight: "500",
  },

  // Chips mejorados
  chipContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.05)",
  },
  chipDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  chipText: {
    fontSize: 12,
    fontWeight: "600",
  },
  statusChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.05)",
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },

  statsContainer: {
    flexDirection: "row",
    marginHorizontal: 20,
    marginBottom: 20,
    gap: 8, // Reducido de 12 a 8
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.background.secondary,
    padding: 12, // Reducido de 20 a 12
    borderRadius: 12, // Reducido de 16 a 12
    alignItems: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  statIconContainer: {
    width: 36, // Reducido de 48 a 36
    height: 36, // Reducido de 48 a 36
    borderRadius: 10, // Reducido de 12 a 10
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8, // Reducido de 12 a 8
  },
  statValue: {
    fontSize: 18, // Reducido de 22 a 18
    fontWeight: "700",
    color: COLORS.text.primary,
    marginBottom: 2, // Reducido de 4 a 2
  },
  statLabel: {
    fontSize: 10, // Reducido de 12 a 10
    color: COLORS.text.secondary,
    textAlign: "center",
    fontWeight: "500",
  },
  card: {
    backgroundColor: COLORS.background.secondary,
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 24,
    borderRadius: 16,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.text.primary,
    marginLeft: 8,
  },

  // Phases mejorado
  phasesContainer: {
    paddingLeft: 16,
  },
  phaseItem: {
    marginBottom: 16,
    paddingLeft: 16,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.border.light,
  },
  activePhaseItem: {
    backgroundColor: "rgba(44, 95, 123, 0.02)",
    paddingVertical: 12,
    paddingRight: 12,
    borderRadius: 8,
    marginLeft: -4,
    paddingLeft: 20,
  },
  inactivePhaseItem: {
    backgroundColor: "rgba(156, 163, 175, 0.02)",
    paddingVertical: 12,
    paddingRight: 12,
    borderRadius: 8,
    marginLeft: -4,
    paddingLeft: 20,
    opacity: 0.7,
  },
  phaseHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  phaseIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  phaseContent: {
    flex: 1,
  },
  phaseTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  phaseTitle: {
    fontSize: 15,
    fontWeight: "600",
    flex: 1,
  },
  activeBadge: {
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  phaseDescription: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 8,
  },
  phaseCropTypeContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 4,
  },
  phaseCropTypeText: {
    fontSize: 12,
    fontWeight: "600",
  },
  phaseDatesContainer: {
    flexDirection: "row",
    gap: 16,
    marginTop: 4,
  },
  dateItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  dateText: {
    fontSize: 11,
    fontWeight: "500",
  },

  // Info grid
  infoGrid: {
    gap: 16,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 4,
  },
  infoIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 13,
    color: COLORS.text.secondary,
    marginBottom: 2,
    fontWeight: "500",
  },
  infoValue: {
    fontSize: 15,
    color: COLORS.text.primary,
    fontWeight: "600",
  },

  // Action buttons
  actionContainer: {
    flexDirection: "row",
    marginHorizontal: 20,
    gap: 12,
    marginTop: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  editButton: {
    backgroundColor: COLORS.primary,
  },
  deleteButton: {
    backgroundColor: "#B5883E",
  },
  actionButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.text.white,
  },

  // Loading state
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.background.primary,
  },
  loadingContent: {
    alignItems: "center",
    padding: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.text.secondary,
    fontWeight: "500",
  },

  // Error state
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.background.primary,
    padding: 40,
  },
  errorContent: {
    alignItems: "center",
    maxWidth: 300,
  },
  errorIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.errorLight,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.text.primary,
    textAlign: "center",
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    color: COLORS.text.secondary,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 24,
  },
  debugText: {
    fontSize: 12,
    color: COLORS.text.tertiary,
    textAlign: "center",
    marginBottom: 8,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
  retryButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    gap: 8,
  },
  retryButtonText: {
    color: COLORS.text.white,
    fontSize: 16,
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: COLORS.background.secondary,
    borderRadius: 20,
    width: "100%",
    maxWidth: 360,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.25,
        shadowRadius: 20,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    paddingBottom: 10,
  },
  modalIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.warningLight,
    justifyContent: "center",
    alignItems: "center",
  },
  modalCloseButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: COLORS.background.tertiary,
    justifyContent: "center",
    alignItems: "center",
  },
  modalBody: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.text.primary,
    marginBottom: 8,
    textAlign: "center",
  },
  modalDescription: {
    fontSize: 14,
    color: COLORS.text.secondary,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 20,
  },
  highlightText: {
    fontWeight: "600",
    color: COLORS.warning,
  },
  modalInfoContainer: {
    backgroundColor: COLORS.background.primary,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  modalInfoItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  modalInfoText: {
    fontSize: 13,
    color: COLORS.text.secondary,
    marginLeft: 8,
    flex: 1,
    lineHeight: 18,
  },
  modalAlternatives: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border.light,
    paddingTop: 16,
  },
  modalAlternativesTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.text.primary,
    marginBottom: 12,
  },
  modalAlternativeItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  modalAlternativeText: {
    fontSize: 13,
    color: COLORS.text.secondary,
    marginLeft: 8,
  },
  modalFooter: {
    padding: 20,
    paddingTop: 0,
  },
  modalButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.text.white,
  },
});

export default TerrainDetail;
