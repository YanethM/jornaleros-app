import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  Modal,
  Platform,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import ScreenLayout from "../../components/ScreenLayout";
import CustomTabBar from "../../components/CustomTabBar";
import { getAvailableWorkersByEmployerCountry } from "../../services/workerService";
import { useAuth } from "../../context/AuthContext";

const PRIMARY_COLOR = "#274F66";

const COLORS = {
  primary: "#274F66",
  secondary: "#B6883E",
  background: "#F8FAFC",
  surface: "#FFFFFF",
  text: "#1A202C",
  textSecondary: "#4A5568",
  textLight: "#718096",
  success: "#10B981",
  warning: "#F59E0B",
  error: "#EF4444",
  border: "#E2E8F0",
  accent: "#667EEA",
  info: "#3B82F6",
};

const WorkerSearch = ({ navigation, route }) => {
  const { user } = useAuth();

  // Estados principales
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredWorkers, setFilteredWorkers] = useState([]);
  const [error, setError] = useState(null);

  // Estados de paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMoreData, setHasMoreData] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // Estados de filtros
  const [showFilters, setShowFilters] = useState(false);
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [availabilityFilter, setAvailabilityFilter] = useState("all");
  const [experienceFilter, setExperienceFilter] = useState("all");

  // Estados de estadísticas
  const [stats, setStats] = useState({
    total: 0,
    available: 0,
    withSkills: 0,
    employerCountry: "",
  });

  // Obtener parámetros de la ruta (si viene de JobApplications)
  const { jobOfferId } = route?.params || {};

  useEffect(() => {
    console.log("🚀 Component mounted, loading workers...");
    loadWorkers();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [
    workers,
    searchQuery,
    selectedSkills,
    availabilityFilter,
    experienceFilter,
  ]);

  const loadWorkers = async (page = 1, isRefreshing = false) => {
    try {
      const response = await getAvailableWorkersByEmployerCountry(page, 20);

      console.log("✅ API Response received:", {
        hasWorkers: !!response.workers,
        workersCount: response.workers?.length || 0,
        total: response.total,
        employerCountry: response.employerCountry,
      });

      const workersData = response.workers || [];
      const newStats = {
        total: response.total || workersData.length,
        available: workersData.filter((w) => w.availability).length,
        withSkills: workersData.filter(
          (w) =>
            (w.skills && w.skills.length > 0) ||
            (w.WorkerSkill && w.WorkerSkill.length > 0)
        ).length,
        employerCountry: response.employerCountry || "No especificado",
      };

      console.log("📊 Calculated stats:", newStats);

      if (page === 1) {
        console.log("📝 Setting workers (first page)");
        setWorkers(workersData);
        setCurrentPage(1);
      } else {
        console.log("📝 Adding workers (next page)");
        setWorkers((prev) => [...prev, ...workersData]);
      }

      setStats(newStats);
      setHasMoreData(workersData.length === 20);

      console.log("✅ loadWorkers completed successfully");
    } catch (error) {
      console.error("❌ Error in loadWorkers:", error);

      setError(error.message || "Error al cargar trabajadores");

      // Establecer datos vacíos para evitar más intentos
      if (page === 1) {
        setWorkers([]);
        setStats({
          total: 0,
          available: 0,
          withSkills: 0,
          employerCountry: "Error",
        });
      }

      console.log("📱 Showing error alert...");
      Alert.alert(
        "Error de Conexión",
        `No se pudo cargar los trabajadores: ${
          error.message || "Error desconocido"
        }`,
        [
          { text: "Cerrar", style: "cancel" },
          {
            text: "Reintentar",
            onPress: () => {
              console.log("🔄 User pressed retry...");
              setError(null);
              setLoading(true);
              loadWorkers(1, false);
            },
          },
        ]
      );
    } finally {
      console.log("🏁 loadWorkers finally block");
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  const loadMoreWorkers = async () => {
    if (loadingMore || !hasMoreData) return;

    setLoadingMore(true);
    const nextPage = currentPage + 1;
    setCurrentPage(nextPage);
    await loadWorkers(nextPage, false);
  };

  const onRefresh = () => {
    console.log("🔄 onRefresh called");
    if (refreshing) {
      console.log("🚫 Already refreshing, skipping...");
      return;
    }

    setRefreshing(true);
    setCurrentPage(1);
    setError(null);
    loadWorkers(1, true);
  };

  const applyFilters = () => {
    let filtered = [...workers];

    // Filtro por búsqueda de texto
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (worker) =>
          worker.user?.name?.toLowerCase().includes(query) ||
          worker.user?.lastname?.toLowerCase().includes(query) ||
          worker.user?.email?.toLowerCase().includes(query) ||
          worker.skills?.some((skill) => skill.toLowerCase().includes(query)) ||
          worker.interests?.some((interest) =>
            interest.toLowerCase().includes(query)
          )
      );
    }

    // Filtro por disponibilidad
    if (availabilityFilter !== "all") {
      const isAvailable = availabilityFilter === "available";
      filtered = filtered.filter(
        (worker) => worker.availability === isAvailable
      );
    }

    // Filtro por habilidades seleccionadas
    if (selectedSkills.length > 0) {
      filtered = filtered.filter((worker) =>
        selectedSkills.some(
          (skill) =>
            worker.skills?.includes(skill) ||
            worker.WorkerSkill?.some((ws) => ws.cropType?.name === skill)
        )
      );
    }

    setFilteredWorkers(filtered);
  };

  const getAllSkills = () => {
    const skillsSet = new Set();

    workers.forEach((worker) => {
      // Habilidades del array skills
      worker.skills?.forEach((skill) => skillsSet.add(skill));
      // Habilidades de WorkerSkill
      worker.WorkerSkill?.forEach((ws) => {
        if (ws.cropType?.name) skillsSet.add(ws.cropType.name);
      });
    });

    return Array.from(skillsSet).sort();
  };

  const getLocationText = (worker) => {
    const cityName =
      typeof worker.user.city === "string"
        ? worker.user.city
        : worker.user.city?.name || "No especificado";

    const stateName =
      typeof worker.user.departmentState === "string"
        ? worker.user.departmentState
        : worker.user.departmentState?.name || worker.user.state?.name || "";

    return stateName ? `${cityName}, ${stateName}` : cityName;
  };

  const getWorkerFullName = (worker) => {
    return `${worker.user.name || ""} ${worker.user.lastname || ""}`.trim();
  };

  const handleContactWorkerDirect = (worker) => {
    const workerFullName = getWorkerFullName(worker);
    navigation.navigate("AddMessage", {
      receiverId: worker.user.id, // ← User ID para enviar mensaje
      workerName: workerFullName,
      workerEmail: worker.user?.email,
      workerPhone: worker.user?.phone,

      // Datos completos del worker para mostrar en la UI
      workerProfile: {
        id: worker.id, // WorkerProfile ID
        user: worker.user, // Datos del usuario
        skills: worker.skills || [],
        availability: worker.availability,
        experience: worker.experience,
        applicationStatus: worker.applicationStatus,
        location: getLocationText(worker),
      },
    });
  };

  const handleWorkerPress = (worker) => {
    navigation.navigate("WorkerProfileApplication", {
      workerId: worker.id,
    });
  };

  const renderWorkerCard = ({ item: worker }) => {
    if (!worker || !worker.user) return null;

    const { user } = worker;
    const location =
      [user.city?.name, user.departmentState?.name, user.country?.name]
        .filter(Boolean)
        .join(", ") || "Ubicación no especificada";

    const skills = worker.skills || [];
    const workerSkills = worker.WorkerSkill || [];
    const allSkills = [
      ...skills,
      ...workerSkills.map((ws) => ws.cropType?.name).filter(Boolean),
    ];

    return (
      <TouchableOpacity
        style={styles.workerCard}
        onPress={() => handleWorkerPress(worker)}
        activeOpacity={0.7}>
        {/* Header del trabajador */}
        <View style={styles.workerHeader}>
          <View style={styles.workerAvatar}>
            <Icon name="person" size={32} color={PRIMARY_COLOR} />
          </View>

          <View style={styles.workerInfo}>
            <Text style={styles.workerName}>
              {user.name} {user.lastname}
            </Text>
            <Text style={styles.workerEmail}>{user.email}</Text>
            {user.phone && (
              <View style={styles.phoneContainer}>
                <Icon name="phone" size={14} color={COLORS.textSecondary} />
                <Text style={styles.workerPhone}>{user.phone}</Text>
              </View>
            )}
          </View>

          <View
            style={[
              styles.availabilityBadge,
              {
                backgroundColor: worker.availability
                  ? `${COLORS.success}15`
                  : `${COLORS.error}15`,
              },
            ]}>
            <Icon
              name={worker.availability ? "check-circle" : "cancel"}
              size={16}
              color={worker.availability ? COLORS.success : COLORS.error}
            />
            <Text
              style={[
                styles.availabilityText,
                { color: worker.availability ? COLORS.success : COLORS.error },
              ]}>
              {worker.availability ? "Disponible" : "No disponible"}
            </Text>
          </View>
        </View>

        {/* Ubicación */}
        <View style={styles.locationContainer}>
          <Icon name="location-on" size={16} color={COLORS.textSecondary} />
          <Text style={styles.locationText}>{location}</Text>
        </View>

        {/* Habilidades */}
        {allSkills.length > 0 && (
          <View style={styles.skillsContainer}>
            <Text style={styles.skillsTitle}>Habilidades:</Text>
            <View style={styles.skillsWrapper}>
              {allSkills.slice(0, 3).map((skill, index) => (
                <View key={index} style={styles.skillChip}>
                  <Text style={styles.skillText}>{skill}</Text>
                </View>
              ))}
              {allSkills.length > 3 && (
                <View style={styles.skillChip}>
                  <Text style={styles.skillText}>+{allSkills.length - 3}</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Experiencia */}
        {worker.experience && (
          <View style={styles.experienceContainer}>
            <Icon name="work" size={16} color={COLORS.textSecondary} />
            <Text style={styles.experienceText} numberOfLines={2}>
              {worker.experience}
            </Text>
          </View>
        )}

        {/* Botones de acción */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.profileButton}
            onPress={() => handleWorkerPress(worker)}>
            <Icon name="visibility" size={16} color={PRIMARY_COLOR} />
            <Text style={styles.profileButtonText}>Ver Perfil</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.contactButton}
            onPress={() => handleContactWorkerDirect(worker)} // Cambiar aquí si quieres ir directo
          >
            <Icon name="message" size={16} color="#fff" />
            <Text style={styles.contactButtonText}>Contactar</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  const renderFiltersModal = () => (
    <Modal
      visible={showFilters}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setShowFilters(false)}>
      <TouchableOpacity 
        style={styles.modalBackdrop}
        activeOpacity={1}
        onPress={() => setShowFilters(false)}>
        <TouchableOpacity 
          style={styles.filtersModalContainer}
          activeOpacity={1}
          onPress={(e) => e.stopPropagation()}>
          
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Filtros de Búsqueda</Text>
            <TouchableOpacity 
              onPress={() => setShowFilters(false)}
              style={styles.modalCloseButton}>
              <Icon name="close" size={20} color={COLORS.text} />
            </TouchableOpacity>
          </View>

          <ScrollView 
            style={styles.filtersScrollView}
            showsVerticalScrollIndicator={false}
            bounces={false}>
            
            {/* Filtro por disponibilidad */}
            <View style={styles.filterSection}>
              <Text style={styles.filterTitle}>Disponibilidad</Text>
              <View style={styles.filterOptions}>
                {[
                  { key: "all", label: "Todos" },
                  { key: "available", label: "Disponibles" },
                  { key: "unavailable", label: "No disponibles" },
                ].map((option) => (
                  <TouchableOpacity
                    key={option.key}
                    style={[
                      styles.filterOption,
                      availabilityFilter === option.key &&
                        styles.filterOptionSelected,
                    ]}
                    onPress={() => setAvailabilityFilter(option.key)}>
                    <View style={[
                      styles.filterRadio,
                      availabilityFilter === option.key && styles.filterRadioSelected
                    ]}>
                      {availabilityFilter === option.key && (
                        <View style={styles.filterRadioDot} />
                      )}
                    </View>
                    <Text
                      style={[
                        styles.filterOptionText,
                        availabilityFilter === option.key &&
                          styles.filterOptionTextSelected,
                      ]}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Filtro por habilidades */}
            <View style={styles.filterSection}>
              <Text style={styles.filterTitle}>Habilidades</Text>
              <View style={styles.skillsFilterContainer}>
                {getAllSkills().map((skill) => (
                  <TouchableOpacity
                    key={skill}
                    style={[
                      styles.skillFilterChip,
                      selectedSkills.includes(skill) &&
                        styles.skillFilterChipSelected,
                    ]}
                    onPress={() => {
                      if (selectedSkills.includes(skill)) {
                        setSelectedSkills((prev) =>
                          prev.filter((s) => s !== skill)
                        );
                      } else {
                        setSelectedSkills((prev) => [...prev, skill]);
                      }
                    }}>
                    <Text
                      style={[
                        styles.skillFilterText,
                        selectedSkills.includes(skill) &&
                          styles.skillFilterTextSelected,
                      ]}>
                      {skill}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>

          <View style={styles.modalActions}>
            <TouchableOpacity
              style={styles.clearFiltersButton}
              onPress={() => {
                setSelectedSkills([]);
                setAvailabilityFilter("all");
                setExperienceFilter("all");
              }}>
              <Text style={styles.clearFiltersText}>Limpiar Filtros</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.applyFiltersButton}
              onPress={() => setShowFilters(false)}>
              <Text style={styles.applyFiltersText}>Aplicar</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );

  const renderStatsCard = () => (
    <View style={styles.statsCard}>
      <View style={styles.statsHeader}>
        <View style={styles.statsIconContainer}>
          <Icon name="people" size={24} color={PRIMARY_COLOR} />
        </View>
        <View style={styles.statsTextContainer}>
          <Text style={styles.statsTitle}>
            Trabajadores en {stats.employerCountry}
          </Text>
          <Text style={styles.statsSubtitle}>Disponibles en tu región</Text>
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats.total}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: COLORS.success }]}>
            {stats.available}
          </Text>
          <Text style={styles.statLabel}>Disponibles</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: COLORS.info }]}>
            {stats.withSkills}
          </Text>
          <Text style={styles.statLabel}>Con Habilidades</Text>
        </View>
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconContainer}>
        <Icon name="search-off" size={80} color={COLORS.border} />
      </View>
      <Text style={styles.emptyTitle}>
        {searchQuery || selectedSkills.length > 0
          ? "No se encontraron trabajadores"
          : "No hay trabajadores disponibles"}
      </Text>
      <Text style={styles.emptySubtitle}>
        {searchQuery || selectedSkills.length > 0
          ? "Intenta ajustar los filtros de búsqueda"
          : `No hay trabajadores registrados en ${stats.employerCountry}`}
      </Text>
      {(searchQuery || selectedSkills.length > 0) && (
        <TouchableOpacity
          style={styles.clearSearchButton}
          onPress={() => {
            setSearchQuery("");
            setSelectedSkills([]);
            setAvailabilityFilter("all");
          }}>
          <Icon name="clear-all" size={20} color="#fff" />
          <Text style={styles.clearSearchText}>Limpiar Búsqueda</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderErrorState = () => (
    <View style={styles.errorContainer}>
      <View style={styles.errorIconContainer}>
        <Icon name="error-outline" size={80} color={COLORS.error} />
      </View>
      <Text style={styles.errorTitle}>Error de Conexión</Text>
      <Text style={styles.errorSubtitle}>
        No se pudo conectar con el servidor.{"\n"}
        Verifica que el endpoint esté configurado.
      </Text>
      <TouchableOpacity
        style={styles.retryButton}
        onPress={() => {
          console.log("🔄 Retry button pressed");
          setError(null);
          setLoading(true);
          loadWorkers(1, false);
        }}>
        <Icon name="refresh" size={20} color="#fff" />
        <Text style={styles.retryButtonText}>Reintentar</Text>
      </TouchableOpacity>

      {/* Debug info */}
      <View style={styles.debugContainer}>
        <Text style={styles.debugText}>
          Endpoint: /worker/available-by-country
        </Text>
        <Text style={styles.debugText}>Error: {error}</Text>
      </View>
    </View>
  );

  const renderFooter = () => {
    if (!loadingMore) return null;

    return (
      <View style={styles.loadingMore}>
        <ActivityIndicator size="small" color={PRIMARY_COLOR} />
        <Text style={styles.loadingMoreText}>Cargando más trabajadores...</Text>
      </View>
    );
  };

  if (loading) {
    console.log("🔄 Component is in loading state");
    return (
      <ScreenLayout navigation={navigation}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}>
            <Icon name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>Buscar Trabajadores</Text>
            <Text style={styles.headerSubtitle}>Cargando...</Text>
          </View>
          <View style={styles.headerIcon} />
        </View>

        <View style={styles.loadingContainer}>
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color={PRIMARY_COLOR} />
            <Text style={styles.loadingText}>Buscando trabajadores...</Text>
            <Text style={styles.loadingSubtext}>
              Conectando con el servidor
            </Text>
          </View>
        </View>
      </ScreenLayout>
    );
  }

  console.log("✅ Rendering main component with:", {
    workersCount: workers.length,
    filteredCount: filteredWorkers.length,
    error: error,
    loading: loading,
  });

  return (
    <ScreenLayout navigation={navigation}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Buscar Trabajadores</Text>
          <Text style={styles.headerSubtitle}>
            {filteredWorkers.length} trabajador
            {filteredWorkers.length !== 1 ? "es" : ""} encontrado
            {filteredWorkers.length !== 1 ? "s" : ""}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowFilters(true)}>
          <Icon name="filter-list" size={24} color="#fff" />
          {(selectedSkills.length > 0 || availabilityFilter !== "all") && (
            <View style={styles.filterIndicatorDot} />
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {error ? (
          renderErrorState()
        ) : (
          <>
            {renderStatsCard()}

            <View style={styles.searchContainer}>
              <View style={styles.searchInputContainer}>
                <Icon name="search" size={20} color={COLORS.textSecondary} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Buscar por nombre, email o habilidades..."
                  placeholderTextColor={COLORS.textSecondary}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setSearchQuery("")}>
                    <Icon name="clear" size={20} color={COLORS.textSecondary} />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            <FlatList
              data={filteredWorkers}
              renderItem={renderWorkerCard}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContainer}
              ListEmptyComponent={renderEmptyState}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  colors={[PRIMARY_COLOR]}
                  tintColor={PRIMARY_COLOR}
                />
              }
              onEndReached={loadMoreWorkers}
              onEndReachedThreshold={0.3}
              ListFooterComponent={renderFooter}
              showsVerticalScrollIndicator={false}
            />
          </>
        )}
      </View>

      {/* Modal de filtros */}
      {renderFiltersModal()}

    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
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
    shadowColor: PRIMARY_COLOR,
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
    marginHorizontal: 16,
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
  filterButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  filterIndicatorDot: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.warning,
  },
  headerIcon: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 20,
  },
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
    shadowColor: PRIMARY_COLOR,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
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
  statsCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: PRIMARY_COLOR,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 8,
  },
  statsHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  statsIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: `${PRIMARY_COLOR}15`,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 15,
  },
  statsTextContainer: {
    flex: 1,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: PRIMARY_COLOR,
  },
  statsSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  statItem: {
    alignItems: "center",
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: "center",
  },
  searchContainer: {
    marginBottom: 20,
  },
  searchInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 15,
    paddingHorizontal: 15,
    paddingVertical: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
    color: COLORS.text,
  },
  listContainer: {
    paddingBottom: 100,
  },
  workerCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    marginBottom: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  workerHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  workerAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: `${PRIMARY_COLOR}15`,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 15,
  },
  workerInfo: {
    flex: 1,
  },
  workerName: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 4,
  },
  workerEmail: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  phoneContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  workerPhone: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginLeft: 4,
  },
  availabilityBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  availabilityText: {
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 4,
  },
  locationContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  locationText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginLeft: 4,
    flex: 1,
  },
  skillsContainer: {
    marginBottom: 12,
  },
  skillsTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 8,
  },
  skillsWrapper: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  skillChip: {
    backgroundColor: `${COLORS.info}15`,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 4,
  },
  skillText: {
    fontSize: 12,
    color: COLORS.info,
    fontWeight: "500",
  },
  experienceContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  experienceText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginLeft: 4,
    flex: 1,
    lineHeight: 20,
  },
  actionsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  profileButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: PRIMARY_COLOR,
    borderRadius: 20,
    backgroundColor: "#fff",
    flex: 1,
    marginRight: 8,
    justifyContent: "center",
  },
  profileButtonText: {
    fontSize: 14,
    color: PRIMARY_COLOR,
    fontWeight: "600",
    marginLeft: 6,
  },
  contactButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: COLORS.primary,
    borderRadius: 20,
    flex: 1,
    marginLeft: 8,
    justifyContent: "center",
  },
  contactButtonText: {
    fontSize: 14,
    color: "#fff",
    fontWeight: "600",
    marginLeft: 6,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
    marginTop: 60,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: `${COLORS.border}30`,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 8,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 30,
  },
  clearSearchButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.info,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
  },
  clearSearchText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
    marginLeft: 8,
  },
  // Error state styles
  errorContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
    marginTop: 60,
  },
  errorIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: `${COLORS.error}20`,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.error,
    marginBottom: 8,
    textAlign: "center",
  },
  errorSubtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 30,
  },
  retryButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.error,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    marginBottom: 20,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
    marginLeft: 8,
  },
  debugContainer: {
    backgroundColor: "#f5f5f5",
    padding: 15,
    borderRadius: 8,
    width: "100%",
    marginTop: 10,
  },
  debugText: {
    fontSize: 12,
    color: "#666",
    marginBottom: 4,
    fontFamily: "monospace",
  },
  loadingMore: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
  },
  loadingMoreText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginLeft: 8,
  },
  // Modal styles
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  filtersModalContainer: {
    backgroundColor: "#fff",
    borderRadius: 20,
    width: "100%",
    maxWidth: 400,
    maxHeight: "85%",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 16,
      },
      android: {
        elevation: 15,
      },
    }),
  },
  filtersScrollView: {
    maxHeight: 400,
    paddingHorizontal: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: PRIMARY_COLOR,
  },
  modalCloseButton: {
    padding: 4,
    borderRadius: 12,
    backgroundColor: "#F8F9FA",
  },
  filterSection: {
    marginBottom: 25,
    marginTop: 15,
  },
  filterTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 12,
  },
  filterOptions: {
    gap: 8,
  },
  filterOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  filterRadio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: COLORS.border,
    marginRight: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  filterRadioSelected: {
    borderColor: PRIMARY_COLOR,
  },
  filterRadioDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: PRIMARY_COLOR,
  },
  filterOptionText: {
    fontSize: 15,
    color: COLORS.textSecondary,
    fontWeight: "500",
  },
  filterOptionTextSelected: {
    color: PRIMARY_COLOR,
    fontWeight: "600",
  },
  skillsFilterContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  skillFilterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: "#fff",
  },
  skillFilterChipSelected: {
    backgroundColor: COLORS.info,
    borderColor: COLORS.info,
  },
  skillFilterText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: "500",
  },
  skillFilterTextSelected: {
    color: "#fff",
    fontWeight: "600",
  },
  modalActions: {
    flexDirection: "row",
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: 12,
  },
  clearFiltersButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.textSecondary,
    alignItems: "center",
    backgroundColor: "#fff",
  },
  clearFiltersText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    fontWeight: "600",
  },
  applyFiltersButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: PRIMARY_COLOR,
    alignItems: "center",
  },
  applyFiltersText: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "600",
  },
});

export default WorkerSearch;