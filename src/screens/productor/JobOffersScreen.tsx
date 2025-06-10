import React, { useState, useEffect } from "react";
import ScreenLayout from "../../components/ScreenLayout";
import {
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Modal,
  ScrollView,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import CustomTabBar from "../../components/CustomTabBar";
import { useAuth } from "../../context/AuthContext";
import ApiClient from "../../utils/api";
import { getJobOffersByEmployerId } from "../../services/jobOffers";
import { ModernJobOfferList } from "./ModernJobOfferList";
import { SafeAreaView } from "react-native-safe-area-context";

const PRIMARY_COLOR = "#284F66";
const SECONDARY_COLOR = "#4A7C94";

const TABS = [
  { key: "all", title: "Todas", icon: "list", color: PRIMARY_COLOR },
  { key: "Activo", title: "Activas", icon: "check-circle", color: "#4CAF50" },
  { key: "En_curso", title: "En Curso", icon: "work", color: "#FF9800" },
  {
    key: "Finalizado",
    title: "Finalizadas",
    icon: "done-all",
    color: "#E57373",
  },
];

export const JobOffersScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [jobOffers, setJobOffers] = useState([]);
  const [filteredJobOffers, setFilteredJobOffers] = useState([]);
  const [error, setError] = useState(null);

  // Estados para tabs y filtros
  const [activeTab, setActiveTab] = useState("all");
  const [showCropFilter, setShowCropFilter] = useState(false);
  const [selectedCrops, setSelectedCrops] = useState([]);
  const [availableCrops, setAvailableCrops] = useState([]);

  // Contadores para tabs
  const [tabCounts, setTabCounts] = useState({
    all: 0,
    Activo: 0,
    En_curso: 0,
    Finalizado: 0,
  });

  useEffect(() => {
    loadJobOffers();
  }, []);

  // Aplicar filtros cuando cambien los datos, tab activo o filtros seleccionados
  useEffect(() => {
    applyFilters();
    updateTabCounts();
  }, [jobOffers, activeTab, selectedCrops]);

  const getUserData = async () => {
    try {
      const result = await ApiClient.get(`/user/list/${user.id}`);

      if (!result.success || !result.data) {
        throw new Error("Error al obtener datos del usuario");
      }

      return result.data;
    } catch (error) {
      console.error("Error obteniendo datos del usuario:", error);
      throw error;
    }
  };

  const getEmployerId = async () => {
    try {
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

      return fullUserData.employerProfile.id;
    } catch (error) {
      console.error("Error obteniendo ID del empleador:", error);
      throw error;
    }
  };

  const loadJobOffers = async (isRefreshing = false) => {
    try {
      if (isRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      if (!user || !user.id) {
        throw new Error("No hay usuario autenticado");
      }

      const employerId = await getEmployerId();
      const jobOffersData = await getJobOffersByEmployerId(employerId);
      console.log("Job offers data:", jobOffersData);

      // Procesar las ofertas con la información correcta del backend
      const processedOffers = (jobOffersData || []).map((offer) => {
        // Usar displayLocation que ya viene procesada del backend
        const location = offer.displayLocation || {
          country: offer.country || "No especificado",
          department: offer.state || "No especificado",
          city: offer.city || "No especificado",
          village: offer.village || "No especificado",
        };

        // Información de la finca
        const farmInfo = {
          name: offer.farm?.name || "Finca sin nombre",
          location: {
            country:
              offer.farm?.village?.municipality?.departmentState?.country
                ?.name || location.country,
            department:
              offer.farm?.village?.municipality?.departmentState?.name ||
              location.department,
            city: offer.farm?.village?.municipality?.name || location.city,
            village: offer.farm?.village?.name || location.village,
          },
        };

        return {
          ...offer,
          // Información de ubicación mejorada
          displayLocation: location,
          farmInfo: farmInfo,

          // Información del cultivo (ya viene correcta del backend)
          cropTypeName: offer.cropType?.name || "Cultivo no especificado",
          phaseName: offer.phase?.name || "Fase no especificada",

          // Información del empleador
          employerName: offer.employer?.user?.name || "Empleador",

          // Contador de aplicaciones
          applicationsCount: offer.applicationsCount || 0,

          // Información adicional para mostrar
          farmName: offer.farm?.name || "Sin nombre",

          // Costos de beneficios (convertir null a 0 para mostrar)
          foodCost: offer.foodCost || 0,
          lodgingCost: offer.lodgingCost || 0,
        };
      });

      setJobOffers(processedOffers);

      // Extraer tipos de cultivo únicos para filtros
      const cropNames = processedOffers
        .map((offer) => offer.cropType?.name)
        .filter(Boolean);
      const uniqueCropNames = [...new Set(cropNames)];
      setAvailableCrops(
        uniqueCropNames.map((crop) => ({ id: crop, name: crop }))
      );
    } catch (error) {
      console.error("Error cargando ofertas de trabajo:", error);
      setError(error.message || "Error al cargar las ofertas de trabajo");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const updateTabCounts = () => {
    const counts = {
      all: jobOffers.length,
      Activo: jobOffers.filter((offer) => offer.status === "Activo").length,
      En_curso: jobOffers.filter((offer) => offer.status === "En_curso").length,
      Finalizado: jobOffers.filter((offer) => offer.status === "Finalizado")
        .length,
    };
    setTabCounts(counts);
  };

  const applyFilters = () => {
    let filtered = [...jobOffers];

    // Filtrar por tab activo
    if (activeTab !== "all") {
      filtered = filtered.filter((offer) => offer.status === activeTab);
    }

    // Filtrar por cultivo
    if (selectedCrops.length > 0) {
      filtered = filtered.filter((offer) =>
        selectedCrops.includes(offer.cropType?.name)
      );
    }

    setFilteredJobOffers(filtered);
  };

  const toggleCropFilter = (crop) => {
    setSelectedCrops((prev) =>
      prev.includes(crop) ? prev.filter((c) => c !== crop) : [...prev, crop]
    );
  };

  const clearFilters = () => {
    setSelectedCrops([]);
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadJobOffers(true);
  };

  const handleCreateJobOffer = () => {
    navigation.navigate("CreateJobOffer");
  };

  const handleViewJobOffer = (jobOffer) => {
    navigation.navigate("JobOfferDetail", { jobOfferId: jobOffer.id });
  };

  const handleViewPublicHome = () => {
    navigation.navigate("PublicHomePreview");
  };

  const renderTabBar = () => (
    <View style={styles.tabContainer}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabsContent}>
        {TABS.map((tab) => {
          const isActive = activeTab === tab.key;
          const tabColor = isActive ? tab.color : "#E0E0E0";

          return (
            <TouchableOpacity
              key={tab.key}
              style={[
                styles.tab,
                isActive && [styles.activeTab, { backgroundColor: tabColor }],
              ]}
              onPress={() => setActiveTab(tab.key)}>
              <Icon
                name={tab.icon}
                size={20}
                color={isActive ? "#fff" : "#666"}
              />
              <Text style={[styles.tabText, isActive && styles.activeTabText]}>
                {tab.title}
              </Text>
              {tabCounts[tab.key] > 0 && (
                <View
                  style={[styles.tabBadge, isActive && styles.activeTabBadge]}>
                  <Text
                    style={[
                      styles.tabBadgeText,
                      isActive && styles.activeTabBadgeText,
                    ]}>
                    {tabCounts[tab.key]}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );

  const renderCropFilterModal = () => (
    <Modal
      visible={showCropFilter}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowCropFilter(false)}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <View style={styles.modalTitleContainer}>
              <Icon name="eco" size={24} color={PRIMARY_COLOR} />
              <Text style={styles.modalTitle}>Filtrar por Cultivo</Text>
            </View>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowCropFilter(false)}>
              <Icon name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.modalContent}
            showsVerticalScrollIndicator={false}>
            {availableCrops.map((crop) => (
              <TouchableOpacity
                key={crop.id}
                style={[
                  styles.filterOption,
                  selectedCrops.includes(crop.name) &&
                    styles.filterOptionSelected,
                ]}
                onPress={() => toggleCropFilter(crop.name)}>
                <View style={styles.filterOptionContent}>
                  <View
                    style={[
                      styles.filterOptionIcon,
                      selectedCrops.includes(crop.name) &&
                        styles.filterOptionIconActive,
                    ]}>
                    <Icon
                      name="eco"
                      size={20}
                      color={
                        selectedCrops.includes(crop.name) ? "#fff" : "#4CAF50"
                      }
                    />
                  </View>
                  <Text
                    style={[
                      styles.filterOptionText,
                      selectedCrops.includes(crop.name) &&
                        styles.filterOptionTextActive,
                    ]}>
                    {crop.name}
                  </Text>
                </View>
                {selectedCrops.includes(crop.name) && (
                  <Icon name="check-circle" size={24} color={PRIMARY_COLOR} />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={[styles.modalButton, styles.clearButton]}
              onPress={() => setSelectedCrops([])}>
              <Text style={styles.clearButtonText}>Limpiar filtros</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, styles.applyButton]}
              onPress={() => setShowCropFilter(false)}>
              <Text style={styles.applyButtonText}>Aplicar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const getEmptyStateContent = () => {
    switch (activeTab) {
      case "Activo":
        return {
          icon: "check-circle",
          title: "No tienes ofertas activas",
          subtitle:
            "Las ofertas publicadas aparecerán aquí cuando estén activas",
          color: "#4CAF50",
        };
      case "En_curso":
        return {
          icon: "work",
          title: "No tienes ofertas en curso",
          subtitle:
            "Las ofertas activas aparecerán aquí cuando cambien a estado 'En curso'",
          color: "#FF9800",
        };
      case "Finalizado":
        return {
          icon: "done-all",
          title: "No tienes ofertas finalizadas",
          subtitle:
            "Las ofertas completadas aparecerán aquí una vez finalizadas",
          color: "#E57373",
        };
      default:
        return {
          icon: "work-outline",
          title:
            selectedCrops.length > 0
              ? "No se encontraron ofertas"
              : "No tienes ofertas de trabajo",
          subtitle:
            selectedCrops.length > 0
              ? "Intenta ajustar los filtros o crear una nueva oferta"
              : "Crea tu primera oferta de trabajo para encontrar trabajadores",
          color: PRIMARY_COLOR,
        };
    }
  };

  const renderEmptyComponent = () => {
    const emptyState = getEmptyStateContent();

    return (
      <View style={styles.emptyContainer}>
        <View
          style={[
            styles.emptyIconContainer,
            { backgroundColor: `${emptyState.color}20` },
          ]}>
          <Icon name={emptyState.icon} size={64} color={emptyState.color} />
        </View>
        <Text style={styles.emptyTitle}>{emptyState.title}</Text>
        <Text style={styles.emptySubtitle}>{emptyState.subtitle}</Text>
        <TouchableOpacity
          style={[
            styles.createEmptyButton,
            { backgroundColor: emptyState.color },
          ]}
          onPress={handleCreateJobOffer}>
          <Icon name="add" size={20} color="#fff" />
          <Text style={styles.createEmptyButtonText}>Crear nueva oferta</Text>
        </TouchableOpacity>
      </View>
    );
  };

  // ✅ SECCIÓN DE FILTROS ACTUALIZADA con botón PublicHome
  const renderFiltersSection = () => (
    <View style={styles.filtersContainer}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filtersContent}>
        {/* Botón para ver vista pública */}
        <TouchableOpacity
          style={styles.publicViewChip}
          onPress={handleViewPublicHome}>
          <Icon name="visibility" size={18} color="#fff" />
          <Text style={styles.publicViewChipText}>Vista Pública</Text>
        </TouchableOpacity>

        {/* Filtro de cultivo existente */}
        <TouchableOpacity
          style={[
            styles.filterChip,
            selectedCrops.length > 0 && styles.filterChipActive,
          ]}
          onPress={() => setShowCropFilter(true)}>
          <Icon
            name="eco"
            size={18}
            color={selectedCrops.length > 0 ? "#fff" : PRIMARY_COLOR}
          />
          <Text
            style={[
              styles.filterChipText,
              selectedCrops.length > 0 && styles.filterChipTextActive,
            ]}>
            Cultivo {selectedCrops.length > 0 && `(${selectedCrops.length})`}
          </Text>
          <Icon
            name="keyboard-arrow-down"
            size={18}
            color={selectedCrops.length > 0 ? "#fff" : PRIMARY_COLOR}
          />
        </TouchableOpacity>

        {/* Botón limpiar filtros */}
        {selectedCrops.length > 0 && (
          <TouchableOpacity
            style={styles.clearFiltersChip}
            onPress={clearFilters}>
            <Icon name="clear" size={16} color="#F44336" />
            <Text style={styles.clearFiltersText}>Limpiar filtros</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );

  return (
    <ScreenLayout navigation={navigation}>
      <View style={styles.container}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <View style={styles.loadingCard}>
              <ActivityIndicator size="large" color={PRIMARY_COLOR} />
              <Text style={styles.loadingText}>Cargando ofertas...</Text>
              <Text style={styles.loadingSubtext}>Un momento por favor</Text>
            </View>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <View style={styles.errorCard}>
              <Icon name="error-outline" size={64} color="#E57373" />
              <Text style={styles.errorTitle}>Algo salió mal</Text>
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity
                style={styles.retryButton}
                onPress={() => loadJobOffers()}>
                <Icon name="refresh" size={20} color="#fff" />
                <Text style={styles.retryButtonText}>Reintentar</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <>
            {renderTabBar()}
            {renderFiltersSection()}

            {filteredJobOffers.length > 0 ? (
              <ModernJobOfferList
                jobOffers={filteredJobOffers}
                onPressItem={handleViewJobOffer}
                refreshControl={
                  <RefreshControl
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                    colors={[PRIMARY_COLOR]}
                    tintColor={PRIMARY_COLOR}
                  />
                }
              />
            ) : (
              <ScrollView
                contentContainerStyle={styles.emptyScrollContainer}
                refreshControl={
                  <RefreshControl
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                    colors={[PRIMARY_COLOR]}
                    tintColor={PRIMARY_COLOR}
                  />
                }>
                {renderEmptyComponent()}
              </ScrollView>
            )}

            {/* Botón flotante */}
            {filteredJobOffers.length > 0 && (
              <TouchableOpacity
                style={styles.floatingButton}
                onPress={handleCreateJobOffer}
                activeOpacity={0.8}>
                <View style={styles.floatingButtonInner}>
                  <Icon name="add" size={28} color="#fff" />
                </View>
              </TouchableOpacity>
            )}
          </>
        )}

        {renderCropFilterModal()}
      </View>
      <CustomTabBar navigation={navigation} currentRoute="JobOffers" />
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: PRIMARY_COLOR,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    ...Platform.select({
      ios: {
        shadowColor: PRIMARY_COLOR,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  // Tabs modernos
  tabContainer: {
    backgroundColor: "#fff",
    paddingTop: 16,
    paddingBottom: 12,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  tabsContent: {
    paddingHorizontal: 16,
  },
  tab: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
    borderRadius: 25,
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginRight: 12,
    minWidth: 100,
    justifyContent: "center",
  },
  activeTab: {
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  tabText: {
    fontSize: 14,
    color: "#666",
    marginLeft: 8,
    fontWeight: "600",
  },
  activeTabText: {
    color: "#fff",
  },
  tabBadge: {
    backgroundColor: "#666",
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  activeTabBadge: {
    backgroundColor: "rgba(255,255,255,0.3)",
  },
  tabBadgeText: {
    fontSize: 12,
    color: "#fff",
    fontWeight: "700",
  },
  activeTabBadgeText: {
    color: "#fff",
  },
  // Filtros mejorados
  filtersContainer: {
    backgroundColor: "#fff",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  filtersContent: {
    paddingHorizontal: 16,
  },
  // ✅ NUEVO: Estilo para el botón de vista pública
  publicViewChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#6366f1", // Color índigo/violeta para destacar
    borderRadius: 25,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 12,
    gap: 6,
    ...Platform.select({
      ios: {
        shadowColor: "#6366f1",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  publicViewChipText: {
    fontSize: 14,
    color: "#fff",
    fontWeight: "600",
  },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8F9FA",
    borderWidth: 2,
    borderColor: PRIMARY_COLOR,
    borderRadius: 25,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 12,
    gap: 6,
  },
  filterChipActive: {
    backgroundColor: PRIMARY_COLOR,
    borderColor: PRIMARY_COLOR,
  },
  filterChipText: {
    fontSize: 14,
    color: PRIMARY_COLOR,
    fontWeight: "600",
  },
  filterChipTextActive: {
    color: "#fff",
  },
  clearFiltersChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFEBEE",
    borderWidth: 2,
    borderColor: "#F44336",
    borderRadius: 25,
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 6,
  },
  clearFiltersText: {
    fontSize: 14,
    color: "#F44336",
    fontWeight: "600",
  },
  // Estados vacíos mejorados
  emptyScrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#333",
    marginBottom: 8,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginBottom: 32,
    lineHeight: 20,
    paddingHorizontal: 20,
  },
  createEmptyButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 25,
    gap: 8,
  },
  createEmptyButtonText: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "600",
  },
  // Botón flotante mejorado
  floatingButton: {
    position: "absolute",
    right: 24,
    bottom: 90,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: PRIMARY_COLOR,
    justifyContent: "center",
    alignItems: "center",
    ...Platform.select({
      ios: {
        shadowColor: PRIMARY_COLOR,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
      },
      android: {
        elevation: 12,
      },
    }),
  },
  floatingButtonInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: PRIMARY_COLOR,
  },
  // Estados de carga y error
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loadingCard: {
    backgroundColor: "#fff",
    padding: 40,
    borderRadius: 20,
    alignItems: "center",
    ...Platform.select({
      ios: {
        shadowColor: PRIMARY_COLOR,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  loadingText: {
    marginTop: 20,
    fontSize: 18,
    fontWeight: "600",
    color: PRIMARY_COLOR,
  },
  loadingSubtext: {
    marginTop: 8,
    fontSize: 14,
    color: "#666",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorCard: {
    backgroundColor: "#fff",
    padding: 40,
    borderRadius: 20,
    alignItems: "center",
    maxWidth: 320,
    ...Platform.select({
      ios: {
        shadowColor: "#E57373",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#E57373",
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 20,
  },
  retryButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E57373",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    gap: 8,
  },
  retryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  // Modal mejorado
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    maxHeight: "85%",
    minHeight: 400,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.2,
        shadowRadius: 15,
      },
      android: {
        elevation: 15,
      },
    }),
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 25,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  modalTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: PRIMARY_COLOR,
  },
  modalCloseButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F5F5F5",
    alignItems: "center",
    justifyContent: "center",
  },
  modalContent: {
    maxHeight: 400,
    paddingVertical: 8,
  },
  filterOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 25,
    borderBottomWidth: 1,
    borderBottomColor: "#f8f8f8",
  },
  filterOptionSelected: {
    backgroundColor: "#F8FAFB",
  },
  filterOptionContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  filterOptionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#E8F5E9",
    justifyContent: "center",
    alignItems: "center",
  },
  filterOptionIconActive: {
    backgroundColor: "#4CAF50",
  },
  filterOptionText: {
    fontSize: 16,
    color: "#333",
    fontWeight: "500",
  },
  filterOptionTextActive: {
    fontWeight: "600",
    color: PRIMARY_COLOR,
  },
  modalFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 25,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
  },
  clearButton: {
    backgroundColor: "#F5F5F5",
  },
  clearButtonText: {
    fontSize: 16,
    color: "#666",
    fontWeight: "600",
  },
  applyButton: {
    backgroundColor: PRIMARY_COLOR,
  },
  applyButtonText: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "600",
  },
});

export default JobOffersScreen;