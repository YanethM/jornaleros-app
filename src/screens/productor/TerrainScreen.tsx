import React, { useState, useRef, useEffect } from "react";
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
import { getFarmByemployerId, getFarms } from "../../services/farmService";
import { useIsFocused } from "@react-navigation/native";
import { getUserData } from "../../services/userService";
import { useAuth } from "../../context/AuthContext";
import { 
  getCountries, 
  getDepartmentsByCountry, 
  getMunicipalitiesByDepartment 
} from "../../services/locationService";

const PRIMARY_COLOR = "#284F66";

export default function TerrainScreen({ navigation }) {
  const [searchText, setSearchText] = useState("");
  const [farms, setFarms] = useState([]);
  const [loading, setLoading] = useState(false); // ✅ CAMBIO: Iniciar en false
  const [initialLoading, setInitialLoading] = useState(true); // ✅ NUEVO: Estado separado para carga inicial
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [locationCache, setLocationCache] = useState({});
  const [isScreenReady, setIsScreenReady] = useState(false); // ✅ NUEVO: Control de renderizado
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const isFocused = useIsFocused();
  const { user } = useAuth();

  useEffect(() => {
    setIsScreenReady(true);
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

  // Cargar cache de ubicaciones
  const loadLocationCache = async () => {
    try {
      const countries = await getCountries();
      const cache = {};
      
      if (countries?.data) {
        for (const country of countries.data) {
          cache[country.id] = { name: country.name, type: 'country' };
          
          try {
            const departments = await getDepartmentsByCountry(country.id);
            if (departments?.data) {
              for (const dept of departments.data) {
                cache[dept.id] = { name: dept.name, type: 'department', country: country.name };
                
                try {
                  const municipalities = await getMunicipalitiesByDepartment(dept.id);
                  if (municipalities?.data) {
                    for (const muni of municipalities.data) {
                      cache[muni.id] = { 
                        name: muni.name, 
                        type: 'municipality', 
                        department: dept.name,
                        country: country.name 
                      };
                    }
                  }
                } catch (muniError) {
                  console.warn(`Error loading municipalities for ${dept.name}:`, muniError);
                }
              }
            }
          } catch (deptError) {
            console.warn(`Error loading departments for ${country.name}:`, deptError);
          }
        }
      }
      
      setLocationCache(cache);
    } catch (error) {
      console.warn("Error loading location cache:", error);
    }
  };

  const loadFarms = async (isRefreshing = false) => {
    try {
      // ✅ CAMBIO: Manejar estados de loading por separado
      if (isRefreshing) {
        setRefreshing(true);
      } else if (farms.length === 0) {
        setInitialLoading(true);
      } else {
        setLoading(true);
      }
      
      setError(null);
      
      if (!user || !user.id) {
        throw new Error("No hay usuario autenticado");
      }
      
      const fullUserData = await getUserData();
      if (!fullUserData.employerProfile) {
        throw new Error("El usuario no tiene perfil de empleador");
      }
      
      if (!fullUserData.employerProfile.id) {
        throw new Error("No se encontró el ID del empleador");
      }
      
      console.log("Loading farms for employer:", fullUserData.employerProfile.id);
      const farmsData = await getFarmByemployerId(fullUserData.employerProfile.id);
      
      console.log("Farm response:", farmsData);
      
      // CORRECCIÓN: Extraer datos del formato correcto de respuesta
      let farmsList = [];
      
      if (farmsData) {
        // Intentar diferentes formatos de respuesta
        if (farmsData.data && Array.isArray(farmsData.data)) {
          // Formato: { success: true, data: [...], count: X }
          farmsList = farmsData.data;
        } else if (farmsData.farms && Array.isArray(farmsData.farms)) {
          // Formato legacy: { farms: [...] }
          farmsList = farmsData.farms;
        } else if (Array.isArray(farmsData)) {
          // Formato directo: [...]
          farmsList = farmsData;
        } else {
          console.warn("Formato de respuesta desconocido:", farmsData);
          farmsList = [];
        }
      }
      
      console.log("Processed farms list:", farmsList);
      setFarms(farmsList);
      
    } catch (error) {
      console.error("Error loading farms:", error);
      setError(error.message || "Error al cargar las fincas");
      if (!isRefreshing && farms.length === 0) {
        Alert.alert(
          "Error",
          error.message || "No se pudieron cargar las fincas. Por favor, intenta de nuevo.",
          [{ text: "OK" }]
        );
      }
    } finally {
      setLoading(false);
      setInitialLoading(false);
      setRefreshing(false);
    }
  };

  // ✅ CAMBIO: Cargar datos después del renderizado inicial
  useEffect(() => {
    const initializeScreen = async () => {
      await loadLocationCache();
      await loadFarms();
    };
    
    // Pequeño delay para asegurar que el componente esté montado
    const timer = setTimeout(initializeScreen, 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (isFocused && farms.length > 0) {
      loadFarms(true);
    }
  }, [isFocused]);

  const onRefresh = () => {
    loadFarms(true);
  };

  const handleAddTerrain = () => {
    navigation.navigate("AddTerrain");
  };

  const handleEdit = (farmId) => {
    navigation.navigate("EditTerrain", { farmId });
  };

  const handleDelete = (farmId) => {
    Alert.alert(
      "Confirmar eliminación",
      "¿Estás seguro de que deseas eliminar esta finca?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            try {
              console.log("Delete farm:", farmId);
              // Implement delete logic here
            } catch (error) {
              Alert.alert("Error", "No se pudo eliminar la finca");
            }
          },
        },
      ]
    );
  };

  const handleViewMore = (farmId) => {
    navigation.navigate("TerrainDetail", { farmId });
  };

  // Resolver nombres de ubicación desde la nueva estructura de datos
  const getLocationInfo = (farm) => {
    // Priorizar locationInfo si existe
    if (farm.locationInfo) {
      return {
        city: farm.locationInfo.city || "No especificado",
        state: farm.locationInfo.department || farm.locationInfo.state || "No especificado",
        village: farm.locationInfo.village || null,
        country: farm.locationInfo.country || "Colombia"
      };
    }
    
    // Usar relaciones de objetos si existen
    if (farm.city?.name || farm.department?.name || farm.village?.name) {
      return {
        city: farm.city?.name || "No especificado",
        state: farm.department?.name || "No especificado", 
        village: farm.village?.name || null,
        country: farm.country?.name || "Colombia"
      };
    }
    
    // Fallback a cache de ubicaciones si solo hay IDs
    return {
      city: locationCache[farm.city]?.name || "No especificado",
      state: locationCache[farm.state]?.name || "No especificado",
      village: locationCache[farm.village]?.name || null,
      country: "Colombia"
    };
  };

  // Obtener todos los tipos de cultivo de una finca
  const getCropTypes = (farm) => {
    // Priorizar cropTypesInfo si existe (formato nuevo)
    if (farm.cropTypesInfo && Array.isArray(farm.cropTypesInfo) && farm.cropTypesInfo.length > 0) {
      return farm.cropTypesInfo.map(ct => ct.name).filter(Boolean);
    }
    
    // Formato legacy
    if (farm.cropTypes && Array.isArray(farm.cropTypes) && farm.cropTypes.length > 0) {
      return farm.cropTypes.map(ct => ct.cropType?.name || ct.name).filter(Boolean);
    }
    
    // Cultivo único
    if (farm.cropType) {
      return [farm.cropType];
    }
    
    return [];
  };

  // Generar colores únicos para tipos de cultivo
  const getCropTypeColors = () => {
    return [
      { primary: PRIMARY_COLOR, light: "#E8F0F7", icon: "eco" },
      { primary: "#B5883E", light: "#F7F1E8", icon: "local-cafe" },
      { primary: "#0B4C93", light: "#E6EDF8", icon: "grass" },
      { primary: "#4CAF50", light: "#E8F5E9", icon: "nature" },
      { primary: "#FF9800", light: "#FFF3E0", icon: "spa" },
      { primary: "#9C27B0", light: "#F3E5F5", icon: "local-florist" },
      { primary: "#795548", light: "#EFEBE9", icon: "coffee" },
      { primary: "#607D8B", light: "#ECEFF1", icon: "park" },
    ];
  };

  const getCropColor = (cropTypes, index = 0) => {
    const colors = getCropTypeColors();
    const hash = cropTypes.join('').split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    return colors[Math.abs(hash) % colors.length];
  };

  // Filtrar fincas por búsqueda
  const filteredFarms = farms.filter((farm) => {
    const searchLower = searchText.toLowerCase();
    const cropTypes = getCropTypes(farm);
    const locationInfo = getLocationInfo(farm);

    return (
      farm.name?.toLowerCase().includes(searchLower) ||
      locationInfo.city.toLowerCase().includes(searchLower) ||
      locationInfo.state.toLowerCase().includes(searchLower) ||
      locationInfo.village?.toLowerCase().includes(searchLower) ||
      cropTypes.some(type => type.toLowerCase().includes(searchLower))
    );
  });

  // ✅ NUEVO: Renderizado condicional mejorado
  if (!isScreenReady) {
    return (
      <ScreenLayout navigation={navigation}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={PRIMARY_COLOR} />
        </View>
      </ScreenLayout>
    );
  }

  return (
    <ScreenLayout navigation={navigation}>
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}>
              <Icon name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Terrenos</Text>
            <TouchableOpacity
              style={styles.addIconButton}
              onPress={handleAddTerrain}>
              <Icon name="add" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Search Bar */}
        <Animated.View
          style={[
            styles.searchContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}>
          <Icon name="search" size={20} color="#999" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar fincas..."
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

        {/* ✅ NUEVO: Loading state mejorado */}
        {initialLoading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={PRIMARY_COLOR} />
            <Text style={styles.loadingText}>Cargando fincas...</Text>
          </View>
        ) : error && farms.length === 0 ? (
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
                    <Text style={styles.statNumber}>{farms.length}</Text>
                    <Text style={styles.statLabel}>Fincas</Text>
                  </View>
                  <View style={styles.statCard}>
                    <Text style={styles.statNumber}>
                      {farms.reduce((acc, farm) => acc + (farm.size || 0), 0).toFixed(1)}
                    </Text>
                    <Text style={styles.statLabel}>Hectáreas</Text>
                  </View>
                  <View style={styles.statCard}>
                    <Text style={styles.statNumber}>
                      {farms.reduce((acc, farm) => {
                        const cropTypes = getCropTypes(farm);
                        return acc + cropTypes.length;
                      }, 0)}
                    </Text>
                    <Text style={styles.statLabel}>Cultivos</Text>
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
                      <Animated.View
                        key={farm.id}
                        style={[
                          styles.farmCard,
                          { borderLeftColor: cropColor.primary, borderLeftWidth: 4 },
                          {
                            opacity: fadeAnim,
                            transform: [
                              {
                                translateY: new Animated.Value(0),
                              },
                            ],
                          },
                        ]}>
                        <TouchableOpacity
                          onPress={() => handleViewMore(farm.id)}
                          activeOpacity={0.9}>
                          
                          {/* Header del card con múltiples cultivos */}
                          {cropTypes.length > 1 && (
                            <View style={[styles.multiCropHeader, { backgroundColor: cropColor.light }]}>
                              <Icon name="eco" size={16} color={cropColor.primary} />
                              <Text style={[styles.multiCropText, { color: cropColor.primary }]}>
                                {cropTypes.length} tipos de cultivo
                              </Text>
                            </View>
                          )}

                          <View style={styles.cardContent}>
                            <View style={styles.cardLeft}>
                              <View style={[styles.iconContainer, { backgroundColor: cropColor.light }]}>
                                <Icon
                                  name={cropColor.icon}
                                  size={28}
                                  color={cropColor.primary}
                                />
                              </View>
                            </View>
                            
                            <View style={styles.cardCenter}>
                              <Text style={styles.farmName}>{farm.name}</Text>
                              <View style={styles.farmInfo}>
                                <View style={styles.infoRow}>
                                  <Icon name="location-on" size={14} color="#999" />
                                  <Text style={styles.infoText}>
                                    {locationInfo.city}, {locationInfo.state}
                                  </Text>
                                </View>
                                <View style={styles.infoRow}>
                                  <Icon name="terrain" size={14} color="#999" />
                                  <Text style={styles.infoText}>
                                    {farm.size || 0} hectáreas
                                  </Text>
                                </View>
                                {farm.plantCount > 0 && (
                                  <View style={styles.infoRow}>
                                    <Icon name="filter-vintage" size={14} color="#999" />
                                    <Text style={styles.infoText}>
                                      {farm.plantCount} plantas
                                    </Text>
                                  </View>
                                )}
                              </View>
                              
                              {/* Chips de cultivos */}
                              <View style={styles.chipContainer}>
                                {cropTypes.slice(0, 3).map((cropType, idx) => {
                                  const chipColor = getCropColor([cropType], idx);
                                  return (
                                    <View 
                                      key={`${farm.id}-crop-${idx}`}
                                      style={[styles.chip, { backgroundColor: chipColor.light }]}
                                    >
                                      <Text style={[styles.chipText, { color: chipColor.primary }]}>
                                        {cropType}
                                      </Text>
                                    </View>
                                  );
                                })}
                                {cropTypes.length > 3 && (
                                  <View style={[styles.chip, { backgroundColor: '#E8F0F7' }]}>
                                    <Text style={[styles.chipText, { color: PRIMARY_COLOR }]}>
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
                                <Icon name="chevron-right" size={24} color="#999" />
                              </TouchableOpacity>
                            </View>
                          </View>
                          
                          <View style={styles.cardActions}>
                            <TouchableOpacity
                              style={[styles.actionButton, styles.editButton]}
                              onPress={() => handleEdit(farm.id)}>
                              <Icon name="edit" size={16} color={PRIMARY_COLOR} />
                              <Text style={styles.actionText}>Editar</Text>
                            </TouchableOpacity>
                            
                            <TouchableOpacity
                              style={[styles.actionButton, styles.deleteButton]}
                              onPress={() => handleDelete(farm.id)}>
                              <Icon name="delete" size={16} color={PRIMARY_COLOR} />
                              <Text style={[styles.actionText, { color: PRIMARY_COLOR }]}>
                                Eliminar
                              </Text>
                            </TouchableOpacity>
                          </View>
                        </TouchableOpacity>
                      </Animated.View>
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
  backButton: {
    padding: 5,
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
    paddingVertical: 12,
    backgroundColor: PRIMARY_COLOR,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  header: {
    backgroundColor: PRIMARY_COLOR,
    paddingTop: Platform.OS === "ios" ? 50 : 20,
    paddingBottom: 20,
    paddingHorizontal: 20,
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
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: "700",
    color: "#fff",
    marginHorizontal: 16,
    textAlign: "center",
  },
  addIconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 10,
    borderRadius: 10,
    paddingHorizontal: 16,
    height: 44,
    borderWidth: 1,
    borderColor: "#E8ECF0",
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
    gap: 8,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E8ECF0",
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
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E8ECF0",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
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
    alignItems: "center",
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
    marginBottom: 4,
  },
  farmInfo: {
    marginTop: 2,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 2,
  },
  infoText: {
    fontSize: 13,
    color: "#666",
    marginLeft: 4,
  },
  chipContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 8,
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
    borderRightWidth: 1,
  },
  deleteButton: {
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
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
  },
  emptyStateButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
});