import React, {
  useState,
  useRef,
  useEffect,
  useMemo,
  useCallback,
} from "react";
import {
  Text,
  View,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Animated,
  Platform,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from "react-native";
import ScreenLayout from "../../components/ScreenLayout";
import Icon from "react-native-vector-icons/MaterialIcons";
import { getFarmByemployerId } from "../../services/farmService";
import { useIsFocused } from "@react-navigation/native";
import { getUserData } from "../../services/userService";
import { useAuth } from "../../context/AuthContext";

const PRIMARY_COLOR = "#284F66";

export default function TerrainScreen({ navigation }) {
  const [searchText, setSearchText] = useState("");
  const [farms, setFarms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [employerProfile, setEmployerProfile] = useState(null);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const isFocused = useIsFocused();
  const { user } = useAuth();

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

  const loadEmployerProfile = useCallback(async () => {
    try {
      if (!user?.id) {
        throw new Error("No hay usuario autenticado");
      }

      const fullUserData = await getUserData();
      if (!fullUserData.employerProfile?.id) {
        throw new Error("El usuario no tiene perfil de empleador");
      }

      return fullUserData.employerProfile;
    } catch (error) {
      console.error("Error loading employer profile:", error);
      setError(error.message);
      return null;
    }
  }, [user?.id]);

  const loadFarms = useCallback(
    async (isRefreshing = false, profile = null) => {
      try {
        if (isRefreshing) {
          setRefreshing(true);
        } else if (farms.length === 0) {
          setInitialLoading(true);
        } else {
          setLoading(true);
        }

        setError(null);

        // Usar perfil existente o cargar nuevo
        const currentProfile = profile || (await loadEmployerProfile());
        if (!currentProfile) return;

        console.log("Loading farms for employer:", currentProfile.id);

        // ✅ LLAMADA CON PARÁMETROS OPTIMIZADOS
        const farmsData = await getFarmByemployerId(currentProfile.id, {
          includePhasesDetail: "false", // Solo cargar detalles cuando sea necesario
          limit: 50, // Limitar resultados iniciales
          page: 1,
        });

        // ✅ PROCESAMIENTO DE RESPUESTA SIMPLIFICADO
        let farmsList = [];
        if (farmsData?.data && Array.isArray(farmsData.data)) {
          farmsList = farmsData.data;
        } else if (farmsData?.farms && Array.isArray(farmsData.farms)) {
          farmsList = farmsData.farms;
        } else if (Array.isArray(farmsData)) {
          farmsList = farmsData;
        }

        console.log("Loaded farms:", farmsList.length);
        setFarms(farmsList);
        setEmployerProfile(currentProfile); // Actualizar el perfil solo aquí
      } catch (error) {
        console.error("Error loading farms:", error);
        setError(error.message || "Error al cargar las fincas");

        if (!isRefreshing && farms.length === 0) {
          Alert.alert(
            "Error",
            error.message ||
              "No se pudieron cargar las fincas. Por favor, intenta de nuevo.",
            [{ text: "OK" }]
          );
        }
      } finally {
        setLoading(false);
        setInitialLoading(false);
        setRefreshing(false);
      }
    },
    [farms.length, loadEmployerProfile]
  );

  useEffect(() => {
    let mounted = true;

    const initializeScreen = async () => {
      if (!mounted) return;

      try {
        await loadFarms();
      } catch (error) {
        console.error("Initialization error:", error);
      }
    };

    // Delay mínimo para mejor UX
    const timer = setTimeout(initializeScreen, 100);

    return () => {
      mounted = false;
      clearTimeout(timer);
    };
  }, []); // Eliminadas dependencias innecesarias

  useEffect(() => {
    if (isFocused && farms.length > 0) {
      loadFarms(true);
    }
  }, [isFocused]);

  const onRefresh = useCallback(() => {
    loadFarms(true);
  }, [loadFarms]);

  const handleAddTerrain = useCallback(() => {
    navigation.navigate("AddTerrain");
  }, [navigation]);

  const handleEdit = useCallback(
    (farmId) => {
      navigation.navigate("EditTerrain", { farmId });
    },
    [navigation]
  );

  const handleViewMore = useCallback(
    (farmId) => {
      navigation.navigate("TerrainDetail", { farmId });
    },
    [navigation]
  );

  const getLocationInfo = useCallback((farm) => {
    if (farm.locationString) {
      const parts = farm.locationString.split(", ");
      return {
        display: farm.locationString,
        village: parts[0] || null,
        city: parts[1] || "No especificado",
        state: parts[2] || "No especificado",
        country: parts[3] || "Colombia",
      };
    }

    if (farm.locationDetails) {
      const {
        country = "Colombia",
        department,
        city,
        village,
      } = farm.locationDetails;
      const parts = [village, city, department, country].filter(Boolean);
      return {
        display: parts.join(" → "),
        village,
        city: city || "No especificado",
        state: department || "No especificado",
        country,
      };
    }

    // ✅ FALLBACK: Construir desde objetos relacionados
    const village = farm.village?.name;
    const city = farm.city?.name || "No especificado";
    const state = farm.department?.name || "No especificado";
    const country = farm.country?.name || "Colombia";

    const parts = [village, city, state, country].filter(Boolean);

    return {
      display: parts.join(" → "),
      village,
      city,
      state,
      country,
    };
  }, []);

  // ✅ OBTENER TIPOS DE CULTIVO OPTIMIZADO
  const getCropTypes = useCallback((farm) => {
    if (farm.cropTypesInfo && Array.isArray(farm.cropTypesInfo)) {
      return farm.cropTypesInfo.map((ct) => ct.name).filter(Boolean);
    }

    if (farm.cropTypes && Array.isArray(farm.cropTypes)) {
      return farm.cropTypes
        .map((ct) => ct.cropType?.name || ct.name)
        .filter(Boolean);
    }

    return farm.cropType ? [farm.cropType] : [];
  }, []);

  // ✅ COLORES MEMOIZADOS
  const cropColors = useMemo(
    () => [
      { primary: PRIMARY_COLOR, light: "#E8F0F7", icon: "eco" },
      { primary: "#B5883E", light: "#F7F1E8", icon: "local-cafe" },
      { primary: "#0B4C93", light: "#E6EDF8", icon: "grass" },
      { primary: "#4CAF50", light: "#E8F5E9", icon: "nature" },
      { primary: "#FF9800", light: "#FFF3E0", icon: "spa" },
      { primary: "#9C27B0", light: "#F3E5F5", icon: "local-florist" },
      { primary: "#795548", light: "#EFEBE9", icon: "coffee" },
      { primary: "#607D8B", light: "#ECEFF1", icon: "park" },
    ],
    []
  );

  const getCropColor = useCallback(
    (cropTypes, index = 0) => {
      if (cropTypes.length === 0) return cropColors[0];

      const hash = cropTypes
        .join("")
        .split("")
        .reduce((a, b) => {
          a = (a << 5) - a + b.charCodeAt(0);
          return a & a;
        }, 0);

      return cropColors[Math.abs(hash) % cropColors.length];
    },
    [cropColors]
  );

  // ✅ FILTRADO MEMOIZADO Y OPTIMIZADO
  const filteredFarms = useMemo(() => {
    if (!searchText.trim()) return farms;

    const searchLower = searchText.toLowerCase();

    return farms.filter((farm) => {
      // Búsqueda rápida en nombre
      if (farm.name?.toLowerCase().includes(searchLower)) return true;

      // Búsqueda en ubicación (usar display optimizado)
      const locationInfo = getLocationInfo(farm);
      if (locationInfo.display?.toLowerCase().includes(searchLower))
        return true;

      // Búsqueda en tipos de cultivo
      const cropTypes = getCropTypes(farm);
      return cropTypes.some((type) => type.toLowerCase().includes(searchLower));
    });
  }, [farms, searchText, getLocationInfo, getCropTypes]);

  const farmStats = useMemo(() => {
    if (farms.length === 0) return { count: 0, totalSize: 0, totalPlants: 0 };

    const totalSize = farms.reduce((acc, farm) => acc + (farm.size || 0), 0);
    const totalPlants = farms.reduce(
      (acc, farm) => acc + (farm.plantCount || 0),
      0
    );

    return {
      count: farms.length,
      totalSize: totalSize.toFixed(1),
      totalPlants: totalPlants.toLocaleString(), // Formatear con separadores de miles
    };
  }, [farms]);

  // ✅ RENDERIZADO CONDICIONAL OPTIMIZADO
  if (initialLoading) {
    return (
      <ScreenLayout navigation={navigation}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={PRIMARY_COLOR} />
          <Text style={styles.loadingText}>Cargando fincas...</Text>
        </View>
      </ScreenLayout>
    );
  }

  return (
    <ScreenLayout navigation={navigation}>
      <View style={styles.container}>
        {/* Header optimizado */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}>
            <Icon name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>Mis Terrenos</Text>
            <Text style={styles.headerSubtitle}>Gestiona tus fincas</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.headerIcon}
              onPress={handleAddTerrain}>
              <Icon name="landscape" size={20} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.addIconButton}
              onPress={handleAddTerrain}>
              <Icon name="add" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Search Bar optimizado */}
        <Animated.View
          style={[
            styles.searchContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}>
          <Icon
            name="search"
            size={20}
            color="#999"
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar por nombre, ubicación o cultivo..."
            placeholderTextColor="#999"
            value={searchText}
            onChangeText={setSearchText}
          />
          {searchText.length > 0 && (
            <TouchableOpacity onPress={() => setSearchText("")}>
              <Icon name="clear" size={18} color="#999" />
            </TouchableOpacity>
          )}
        </Animated.View>

        {error && farms.length === 0 ? (
          <View style={styles.centerContainer}>
            <Icon name="error-outline" size={60} color="#999" />
            <Text style={styles.errorText}>Error al cargar las fincas</Text>
            <Text style={styles.errorSubText}>{error}</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={() => loadFarms()}>
              <Text style={styles.retryButtonText}>Reintentar</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[PRIMARY_COLOR]}
                tintColor={PRIMARY_COLOR}
              />
            }>
            <Animated.View
              style={{
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              }}>
              {farms.length > 0 && !searchText && (
                <View style={styles.statsContainer}>
                  <View style={styles.statCard}>
                    <Text style={styles.statNumber}>{farmStats.count}</Text>
                    <Text style={styles.statLabel}>Fincas</Text>
                  </View>
                  <View style={styles.statCard}>
                    <Text style={styles.statNumber}>{farmStats.totalSize}</Text>
                    <Text style={styles.statLabel}>Hectáreas</Text>
                  </View>
                  <View style={styles.statCard}>
                    <Text style={styles.statNumber}>
                      {farmStats.totalPlants}
                    </Text>
                    <Text style={styles.statLabel}>Plantas</Text>
                  </View>
                </View>
              )}
              {filteredFarms.length === 0 ? (
                <View style={styles.emptyState}>
                  <View style={styles.emptyIconContainer}>
                    <Icon name="landscape" size={64} color={PRIMARY_COLOR} />
                  </View>
                  <Text style={styles.emptyStateTitle}>
                    {searchText
                      ? "No se encontraron fincas"
                      : "No tienes fincas registradas"}
                  </Text>
                  <Text style={styles.emptyStateText}>
                    {searchText
                      ? "Intenta con otros términos de búsqueda"
                      : "Añade tu primera finca para comenzar"}
                  </Text>
                  {!searchText && (
                    <TouchableOpacity
                      style={styles.emptyStateButton}
                      onPress={handleAddTerrain}>
                      <Icon name="add" size={18} color="#fff" />
                      <Text style={styles.emptyStateButtonText}>
                        Crear Primera Finca
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              ) : (
                <View style={styles.farmsContainer}>
                  {filteredFarms.map((farm, index) => {
                    const cropTypes = getCropTypes(farm);
                    const cropColor = getCropColor(cropTypes, index);
                    const locationInfo = getLocationInfo(farm);

                    return (
                      <View
                        key={farm.id}
                        style={[
                          styles.farmCard,
                          {
                            borderLeftColor: cropColor.primary,
                            borderLeftWidth: 4,
                          },
                        ]}>
                        <TouchableOpacity
                          onPress={() => handleViewMore(farm.id)}
                          activeOpacity={0.9}>
                          {/* Header del card con múltiples cultivos */}
                          {cropTypes.length > 1 && (
                            <View
                              style={[
                                styles.multiCropHeader,
                                { backgroundColor: cropColor.light },
                              ]}>
                              <Icon
                                name="eco"
                                size={16}
                                color={cropColor.primary}
                              />
                              <Text
                                style={[
                                  styles.multiCropText,
                                  { color: cropColor.primary },
                                ]}>
                                {cropTypes.length} tipos de cultivo
                              </Text>
                            </View>
                          )}

                          <View style={styles.cardContent}>
                            <View style={styles.cardLeft}>
                              <View
                                style={[
                                  styles.iconContainer,
                                  { backgroundColor: cropColor.light },
                                ]}>
                                <Icon
                                  name={cropColor.icon}
                                  size={28}
                                  color={cropColor.primary}
                                />
                              </View>
                            </View>

                            <View style={styles.cardCenter}>
                              <Text style={styles.farmName}>{farm.name}</Text>

                              {/* Ubicación simplificada */}
                              <View style={styles.locationContainer}>
                                <Icon name="place" size={14} color="#999" />
                                <Text style={styles.infoText} numberOfLines={2}>
                                  {locationInfo.display}
                                </Text>
                              </View>

                              {/* Información adicional */}
                              <View style={styles.additionalInfo}>
                                <View style={styles.infoRow}>
                                  <Icon name="terrain" size={14} color="#999" />
                                  <Text style={styles.infoText}>
                                    {farm.size || 0} hectáreas
                                  </Text>
                                </View>
                                {farm.plantCount > 0 && (
                                  <View style={styles.infoRow}>
                                    <Icon
                                      name="filter-vintage"
                                      size={14}
                                      color="#999"
                                    />
                                    <Text style={styles.infoText}>
                                      {farm.plantCount} plantas
                                    </Text>
                                  </View>
                                )}
                              </View>

                              {/* Chips de cultivos */}
                              <View style={styles.chipContainer}>
                                {cropTypes.slice(0, 3).map((cropType, idx) => {
                                  const chipColor = getCropColor(
                                    [cropType],
                                    idx
                                  );
                                  return (
                                    <View
                                      key={`${farm.id}-crop-${idx}`}
                                      style={[
                                        styles.chip,
                                        { backgroundColor: chipColor.light },
                                      ]}>
                                      <Text
                                        style={[
                                          styles.chipText,
                                          { color: chipColor.primary },
                                        ]}>
                                        {cropType}
                                      </Text>
                                    </View>
                                  );
                                })}
                                {cropTypes.length > 3 && (
                                  <View
                                    style={[
                                      styles.chip,
                                      { backgroundColor: "#E8F0F7" },
                                    ]}>
                                    <Text
                                      style={[
                                        styles.chipText,
                                        { color: PRIMARY_COLOR },
                                      ]}>
                                      +{cropTypes.length - 3}
                                    </Text>
                                  </View>
                                )}
                              </View>
                            </View>

                            <View style={styles.cardRight}>
                              <TouchableOpacity
                                style={styles.moreButton}
                                onPress={() => handleViewMore(farm.id)}>
                                <Icon
                                  name="chevron-right"
                                  size={24}
                                  color="#999"
                                />
                              </TouchableOpacity>
                            </View>
                          </View>

                          <View style={styles.cardActions}>
                            <TouchableOpacity
                              style={[styles.actionButton, styles.editButton]}
                              onPress={() => handleEdit(farm.id)}>
                              <Icon
                                name="edit"
                                size={16}
                                color={PRIMARY_COLOR}
                              />
                              <Text style={styles.actionText}>Editar</Text>
                            </TouchableOpacity>
                          </View>
                        </TouchableOpacity>
                      </View>
                    );
                  })}
                </View>
              )}

              <View style={{ height: 24 }} />
            </Animated.View>
          </ScrollView>
        )}
      </View>
    </ScreenLayout>
  );
}

// Mantener los mismos estilos, pero añadir algunos optimizados
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#666",
  },
  errorText: {
    marginTop: 12,
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
  errorSubText: {
    marginTop: 8,
    fontSize: 14,
    color: "#999",
    textAlign: "center",
  },
  retryButton: {
    marginTop: 20,
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: PRIMARY_COLOR,
    borderRadius: 16,
    shadowColor: "#284F66",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  retryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
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
    paddingTop: Platform.OS === "ios" ? 50 : 20,
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
  addIconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 10,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 50,
    borderWidth: 2,
    borderColor: "#E2E8F0",
    shadowColor: "#284F66",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: "#333",
  },
  statsContainer: {
    flexDirection: "row",
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 20,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 16,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#F1F5F9",
    shadowColor: "#284F66",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "700",
    color: PRIMARY_COLOR,
  },
  statLabel: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
  },
  farmsContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  farmCard: {
    backgroundColor: "#fff",
    marginBottom: 16,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "#F1F5F9",
    shadowColor: "#284F66",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  multiCropHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#F5F6F7",
  },
  multiCropText: {
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 6,
  },
  cardContent: {
    flexDirection: "row",
    padding: 16,
    alignItems: "flex-start",
  },
  cardLeft: {
    marginRight: 12,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  cardCenter: {
    flex: 1,
  },
  farmName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#2C3E50",
    marginBottom: 8,
  },
  locationContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  additionalInfo: {
    marginTop: 4,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 3,
  },
  infoText: {
    fontSize: 13,
    color: "#666",
    marginLeft: 4,
    flex: 1,
  },
  chipContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 12,
    gap: 6,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  chipText: {
    fontSize: 12,
    fontWeight: "500",
  },
  cardRight: {
    marginLeft: 12,
    alignSelf: "flex-start",
    marginTop: 8,
  },
  moreButton: {
    width: 32,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  cardActions: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "#F5F6F7",
    paddingTop: 1,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRightWidth: 1,
    borderRightColor: "#F5F6F7",
  },
  editButton: {
    borderRightWidth: 0,
  },
  actionText: {
    fontSize: 14,
    fontWeight: "500",
    marginLeft: 6,
    color: PRIMARY_COLOR,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#E8F0F7",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#2C3E50",
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 15,
    color: "#666",
    textAlign: "center",
    marginBottom: 28,
    lineHeight: 22,
  },
  emptyStateButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: PRIMARY_COLOR,
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 16,
    shadowColor: "#284F66",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  emptyStateButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
});
