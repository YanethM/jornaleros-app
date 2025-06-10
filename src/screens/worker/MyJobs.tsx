import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "../../context/AuthContext";
import { getWorkerApplications } from "../../services/workerService";
import { getUserData } from "../../services/userService";
import ScreenLayoutWorker from "../../components/ScreenLayoutWorker";
import CustomTabBarWorker from "../../components/CustomTabBarWorker";

const { width } = Dimensions.get("window");

// Paleta de colores
const COLORS = {
  primary: "#274F66",
  primaryLight: "#3A6B85",
  secondary: "#B6883E",
  background: "#F8FAFC",
  surface: "#FFFFFF",
  text: "#274E66",
  textSecondary: "#4A5568",
  textLight: "#718096",
  success: "#10B981",
  warning: "#F59E0B",
  error: "#EF4444",
  border: "#E2E8F0",
  info: "#3B82F6",
};

const MyJobsScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [allApplications, setAllApplications] = useState([]);
  const [acceptedJobs, setAcceptedJobs] = useState([]);
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState("all");
  const [userData, setUserData] = useState(null);
  const [cropTypeFilters, setCropTypeFilters] = useState([]);

  // 🔥 NUEVO - Función para obtener nombre amigable del estado
  const getJobStatusDisplayName = (status) => {
    const statusMap = {
      Aceptado: "En Progreso",
      Completado: "Completado",
    };
    return statusMap[status] || status || "Desconocido";
  };

  // 🔥 MEJORADO - Estilos de estado para trabajos
  const getJobStatusStyle = (status) => {
    switch (status) {
      case "Completado":
        return { backgroundColor: COLORS.success };
      case "Aceptado":
        return { backgroundColor: COLORS.info };
      default:
        return { backgroundColor: COLORS.textLight };
    }
  };

  const getJobStatusIcon = (status) => {
    switch (status) {
      case "Completado":
        return "checkmark-circle";
      case "Aceptado":
        return "play-circle";
      default:
        return "help-circle";
    }
  };

  // Función segura para obtener ID del trabajador
  const getWorkerId = async () => {
    try {
      let workerData = userData;
      if (!workerData) {
        workerData = await getUserData();
        setUserData(workerData);
      }

      if (!workerData?.workerProfile?.id) {
        throw new Error("El usuario no tiene perfil de trabajador");
      }

      return workerData.workerProfile.id;
    } catch (error) {
      console.error("Error obteniendo ID del trabajador:", error);
      throw error;
    }
  };

  // 🔥 CORREGIDO - Cargar solo trabajos aprobados
  const loadAcceptedJobs = async () => {
    try {
      const workerId = await getWorkerId();
      const response = await getWorkerApplications(workerId);
      
      let applicationsData = [];
      if (Array.isArray(response)) {
        applicationsData = response;
      } else if (response?.applications && Array.isArray(response.applications)) {
        applicationsData = response.applications;
      } else if (response?.data && Array.isArray(response.data)) {
        applicationsData = response.data;
      }

      console.log("📋 All applications loaded:", applicationsData.length);
      setAllApplications(applicationsData);

      // 🔥 FILTRAR solo trabajos aprobados (Aceptado o Completado)
      const approvedJobs = applicationsData.filter(app => 
        ['Aceptado', 'Completado'].includes(app.status?.name)
      );

      console.log("✅ Approved jobs found:", approvedJobs.length);

      // Ordenar por fecha más reciente
      const sortedJobs = approvedJobs.sort((a, b) => {
        const dateA = new Date(a.createdAt || 0).getTime();
        const dateB = new Date(b.createdAt || 0).getTime();
        return dateB - dateA;
      });

      setAcceptedJobs(sortedJobs);
      
      // 🔥 GENERAR filtros de tipos de cultivo dinámicamente
      generateCropTypeFilters(sortedJobs);
      
      // Aplicar filtro actual
      filterJobsByCropType(sortedJobs, activeFilter);
    } catch (error) {
      console.error("Error cargando trabajos:", error);
      Alert.alert("Error", "No se pudieron cargar tus trabajos");
      setAcceptedJobs([]);
      setFilteredJobs([]);
    }
  };

  // 🔥 NUEVO - Generar filtros de tipos de cultivo dinámicamente
  const generateCropTypeFilters = (jobs) => {
    const cropTypes = new Map();
    
    jobs.forEach(job => {
      const cropType = job.jobOffer?.cropType;
      if (cropType) {
        cropTypes.set(cropType.id, {
          id: cropType.id,
          name: cropType.name,
          icon: "leaf"
        });
      }
    });

    const filters = [
      { id: "all", name: "Todos los Cultivos", icon: "apps" },
      { id: "in_progress", name: "En Progreso", icon: "play-circle" },
      { id: "completed", name: "Completados", icon: "checkmark-circle" },
      ...Array.from(cropTypes.values())
    ];

    setCropTypeFilters(filters);
  };

  // 🔥 NUEVO - Filtrar trabajos por tipo de cultivo
  const filterJobsByCropType = (jobs, filterId) => {
    let filtered = [];

    switch (filterId) {
      case "all":
        filtered = jobs;
        break;
      case "in_progress":
        filtered = jobs.filter(job => job.status?.name === "Aceptado");
        break;
      case "completed":
        filtered = jobs.filter(job => job.status?.name === "Completado");
        break;
      default:
        // Filtrar por tipo de cultivo específico
        filtered = jobs.filter(job => job.jobOffer?.cropType?.id === filterId);
        break;
    }

    console.log(`🔍 Filtered jobs for '${filterId}':`, filtered.length);
    setFilteredJobs(filtered);
  };

  // Manejar cambio de filtro
  const handleFilterChange = (filterId) => {
    setActiveFilter(filterId);
    filterJobsByCropType(acceptedJobs, filterId);
  };

  // Función para refrescar datos
  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await loadAcceptedJobs();
    } finally {
      setRefreshing(false);
    }
  };

  // Función para navegar al detalle del trabajo
  const navigateToJobDetail = (job) => {
    try {
      navigation.navigate("WorkerJobOfferDetail", {
        jobOfferId: job.jobOffer?.id,
        applicationId: job.id,
      });
    } catch (error) {
      console.error("Error navegando al detalle:", error);
      Alert.alert("Error", "No se pudo abrir el detalle del trabajo");
    }
  };

  // Cargar datos iniciales
  useEffect(() => {
    const initializeData = async () => {
      setLoading(true);
      try {
        await loadAcceptedJobs();
      } catch (error) {
        console.error("Error inicializando datos:", error);
      } finally {
        setLoading(false);
      }
    };

    if (user?.id) {
      initializeData();
    } else {
      setLoading(false);
      Alert.alert("Error", "Usuario no encontrado");
    }
  }, [user]);

  // 🔥 CORREGIDO - Calcular estadísticas para trabajos aprobados
  const getJobStats = () => {
    const total = acceptedJobs.length;
    const inProgress = acceptedJobs.filter(job => job.status?.name === "Aceptado").length;
    const completed = acceptedJobs.filter(job => job.status?.name === "Completado").length;
    
    // Calcular total ganado (solo trabajos completados)
    const totalEarnings = acceptedJobs
      .filter(job => job.status?.name === "Completado")
      .reduce((sum, job) => {
        const salary = job.jobOffer?.salary || 0;
        const duration = job.jobOffer?.duration || 1;
        return sum + (salary * duration);
      }, 0);

    return { total, inProgress, completed, totalEarnings };
  };

  const stats = getJobStats();

  // Estado de carga
  if (loading) {
    return (
      <ScreenLayoutWorker navigation={navigation}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Cargando tus trabajos...</Text>
        </View>
      </ScreenLayoutWorker>
    );
  }

  return (
    <ScreenLayoutWorker navigation={navigation}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Mis Trabajos</Text>
          <View style={styles.headerRight} />
        </View>

        {/* 🔥 MEJORADO - Estadísticas para trabajos */}
        <View style={styles.statsContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.statsRow}>
              <View style={styles.statCard}>
                <LinearGradient
                  colors={[COLORS.primary, COLORS.primaryLight]}
                  style={styles.statGradient}>
                  <Ionicons name="briefcase" size={24} color="#FFFFFF" />
                  <Text style={styles.statNumber}>{stats.total}</Text>
                  <Text style={styles.statLabel}>Total Trabajos</Text>
                </LinearGradient>
              </View>

              <View style={styles.statCard}>
                <LinearGradient
                  colors={[COLORS.info, "#60A5FA"]}
                  style={styles.statGradient}>
                  <Ionicons name="play-circle" size={24} color="#FFFFFF" />
                  <Text style={styles.statNumber}>{stats.inProgress}</Text>
                  <Text style={styles.statLabel}>En Progreso</Text>
                </LinearGradient>
              </View>

              <View style={styles.statCard}>
                <LinearGradient
                  colors={[COLORS.success, "#34D399"]}
                  style={styles.statGradient}>
                  <Ionicons name="checkmark-circle" size={24} color="#FFFFFF" />
                  <Text style={styles.statNumber}>{stats.completed}</Text>
                  <Text style={styles.statLabel}>Completados</Text>
                </LinearGradient>
              </View>

              <View style={styles.statCard}>
                <LinearGradient
                  colors={[COLORS.secondary, "#FBBF24"]}
                  style={styles.statGradient}>
                  <Ionicons name="cash" size={24} color="#FFFFFF" />
                  <Text style={styles.statNumber}>
                    ${new Intl.NumberFormat("es-CO", {
                      notation: "compact",
                      maximumFractionDigits: 1
                    }).format(stats.totalEarnings)}
                  </Text>
                  <Text style={styles.statLabel}>Ganado Total</Text>
                </LinearGradient>
              </View>
            </View>
          </ScrollView>
        </View>

        {/* 🔥 NUEVO - Filtros por tipo de cultivo */}
        <View style={styles.filtersContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.filtersRow}>
              {cropTypeFilters.map((filter) => (
                <TouchableOpacity
                  key={filter.id}
                  style={[
                    styles.filterButton,
                    activeFilter === filter.id && styles.filterButtonActive,
                  ]}
                  onPress={() => handleFilterChange(filter.id)}>
                  <Ionicons
                    name={filter.icon}
                    size={16}
                    color={
                      activeFilter === filter.id
                        ? COLORS.surface
                        : COLORS.textSecondary
                    }
                  />
                  <Text
                    style={[
                      styles.filterButtonText,
                      activeFilter === filter.id &&
                        styles.filterButtonTextActive,
                    ]}>
                    {filter.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* 🔥 MEJORADO - Lista de trabajos aprobados */}
        <ScrollView
          style={styles.content}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[COLORS.primary]}
            />
          }
          showsVerticalScrollIndicator={false}>
          {filteredJobs.length > 0 ? (
            <View style={styles.jobsList}>
              {filteredJobs.map((job) => (
                <TouchableOpacity
                  key={job.id}
                  style={styles.jobCard}
                  onPress={() => navigateToJobDetail(job)}>
                  
                  {/* Indicador de estado lateral */}
                  <View 
                    style={[
                      styles.statusIndicator, 
                      getJobStatusStyle(job.status?.name)
                    ]} 
                  />

                  <View style={styles.jobCardContent}>
                    <View style={styles.jobCardHeader}>
                      <View style={styles.jobInfo}>
                        <Text style={styles.jobTitle} numberOfLines={2}>
                          {job.jobOffer?.title || "Trabajo sin título"}
                        </Text>
                        <Text style={styles.employerName}>
                          {job.jobOffer?.employer?.user?.name || "Empleador"}
                        </Text>
                        <Text style={styles.farmName}>
                          {job.jobOffer?.farm?.name || "Finca"}
                        </Text>
                      </View>

                      <View
                        style={[
                          styles.statusBadge,
                          getJobStatusStyle(job.status?.name),
                        ]}>
                        <Ionicons
                          name={getJobStatusIcon(job.status?.name)}
                          size={12}
                          color="#FFFFFF"
                        />
                        <Text style={styles.statusText}>
                          {getJobStatusDisplayName(job.status?.name)}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.jobDetails}>
                      <View style={styles.detailRow}>
                        <Ionicons
                          name="location"
                          size={16}
                          color={COLORS.textLight}
                        />
                        <Text style={styles.detailText}>
                          {job.jobOffer?.displayLocation?.city || job.jobOffer?.city || "Ciudad"},{" "}
                          {job.jobOffer?.displayLocation?.department || job.jobOffer?.state || "Estado"}
                        </Text>
                      </View>

                      <View style={styles.detailRow}>
                        <Ionicons
                          name="leaf"
                          size={16}
                          color={COLORS.success}
                        />
                        <Text style={styles.detailText}>
                          {job.jobOffer?.cropType?.name || "Cultivo general"}
                        </Text>
                      </View>

                      <View style={styles.detailRow}>
                        <Ionicons
                          name="cash"
                          size={16}
                          color={COLORS.secondary}
                        />
                        <Text style={styles.detailText}>
                          $
                          {new Intl.NumberFormat("es-CO").format(
                            job.jobOffer?.salary || 0
                          )}
                          /día
                        </Text>
                      </View>

                      <View style={styles.detailRow}>
                        <Ionicons
                          name="time"
                          size={16}
                          color={COLORS.textLight}
                        />
                        <Text style={styles.detailText}>
                          {job.jobOffer?.duration || 1} días de duración
                        </Text>
                      </View>
                    </View>

                    {/* 🔥 NUEVO - Información de ganancias para trabajos completados */}
                    {job.status?.name === "Completado" && (
                      <View style={styles.earningsContainer}>
                        <View style={styles.earningsBox}>
                          <Ionicons name="cash" size={18} color={COLORS.success} />
                          <Text style={styles.earningsLabel}>Total Ganado:</Text>
                          <Text style={styles.earningsAmount}>
                            $
                            {new Intl.NumberFormat("es-CO").format(
                              (job.jobOffer?.salary || 0) * (job.jobOffer?.duration || 1)
                            )}
                          </Text>
                        </View>
                      </View>
                    )}

                    {/* Beneficios */}
                    <View style={styles.benefitsContainer}>
                      <View style={styles.benefitItem}>
                        <Ionicons
                          name="restaurant"
                          size={14}
                          color={
                            job.jobOffer?.includesFood
                              ? COLORS.success
                              : COLORS.textLight
                          }
                        />
                        <Text
                          style={[
                            styles.benefitText,
                            !job.jobOffer?.includesFood &&
                              styles.benefitTextDisabled,
                          ]}>
                          {job.jobOffer?.includesFood
                            ? "Incluye comida"
                            : "Sin comida"}
                        </Text>
                      </View>

                      <View style={styles.benefitItem}>
                        <Ionicons
                          name="bed"
                          size={14}
                          color={
                            job.jobOffer?.includesLodging
                              ? COLORS.success
                              : COLORS.textLight
                          }
                        />
                        <Text
                          style={[
                            styles.benefitText,
                            !job.jobOffer?.includesLodging &&
                              styles.benefitTextDisabled,
                          ]}>
                          {job.jobOffer?.includesLodging
                            ? "Incluye alojamiento"
                            : "Sin alojamiento"}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.jobFooter}>
                      <View style={styles.dateContainer}>
                        <Ionicons
                          name="calendar"
                          size={14}
                          color={COLORS.textLight}
                        />
                        <Text style={styles.dateText}>
                          Iniciado el{" "}
                          {job.createdAt ? new Date(job.createdAt).toLocaleDateString(
                            "es-ES",
                            {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                            }
                          ) : "Fecha no disponible"}
                        </Text>
                      </View>

                      <TouchableOpacity style={styles.viewDetailsButton}>
                        <Text style={styles.viewDetailsText}>Ver detalles</Text>
                        <Ionicons
                          name="chevron-forward"
                          size={16}
                          color={COLORS.primary}
                        />
                      </TouchableOpacity>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconContainer}>
                <Ionicons
                  name="briefcase-outline"
                  size={64}
                  color={COLORS.textLight}
                />
              </View>
              <Text style={styles.emptyTitle}>
                {activeFilter === "all"
                  ? "No tienes trabajos aprobados aún"
                  : `No tienes trabajos de ${cropTypeFilters
                      .find((f) => f.id === activeFilter)
                      ?.name.toLowerCase()}`}
              </Text>
              <Text style={styles.emptySubtitle}>
                {activeFilter === "all"
                  ? "Cuando te aprueben para un trabajo, aparecerá aquí"
                  : "Prueba cambiando el filtro o postúlate a más trabajos"}
              </Text>
              <TouchableOpacity
                style={styles.exploreJobsButton}
                onPress={() => navigation.navigate("WorkerJobs")}>
                <Ionicons name="search" size={20} color={COLORS.surface} />
                <Text style={styles.exploreJobsText}>Buscar Más Trabajos</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </View>
      <CustomTabBarWorker navigation={navigation} currentRoute="MyJobs" />

    </ScreenLayoutWorker>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.background,
  },
  loadingText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginTop: 12,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.text,
  },
  headerRight: {
    width: 40,
  },
  statsContainer: {
    backgroundColor: COLORS.surface,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  statsRow: {
    flexDirection: "row",
    paddingHorizontal: 20,
    gap: 12,
  },
  statCard: {
    borderRadius: 12,
    overflow: "hidden",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statGradient: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: "center",
    minWidth: 90,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: "800",
    color: "#FFFFFF",
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: "rgba(255, 255, 255, 0.9)",
    fontWeight: "600",
    textAlign: "center",
  },
  filtersContainer: {
    backgroundColor: COLORS.surface,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  filtersRow: {
    flexDirection: "row",
    paddingHorizontal: 20,
    gap: 12,
  },
  filterButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 6,
  },
  filterButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterButtonText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: "500",
  },
  filterButtonTextActive: {
    color: COLORS.surface,
    fontWeight: "600",
  },
  content: {
    flex: 1,
  },
  jobsList: {
    padding: 20,
    gap: 16,
  },
  jobCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
    overflow: "hidden",
  },
  statusIndicator: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    zIndex: 1,
  },
  jobCardContent: {
    padding: 16,
    paddingLeft: 20,
  },
  jobCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  jobInfo: {
    flex: 1,
    marginRight: 12,
  },
  jobTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 6,
    lineHeight: 24,
  },
  employerName: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: "500",
    marginBottom: 4,
  },
  farmName: {
    fontSize: 14,
    color: COLORS.textLight,
    fontStyle: "italic",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.surface,
  },
  jobDetails: {
    gap: 12,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    flex: 1,
    fontWeight: "500",
  },
  earningsContainer: {
    marginBottom: 16,
  },
  earningsBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: `${COLORS.success}15`,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: `${COLORS.success}30`,
    gap: 8,
  },
  earningsLabel: {
    fontSize: 14,
    color: COLORS.success,
    fontWeight: "600",
  },
  earningsAmount: {
    fontSize: 16,
    color: COLORS.success,
    fontWeight: "700",
    marginLeft: "auto",
  },
  benefitsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  benefitItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  benefitText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: "500",
  },
  benefitTextDisabled: {
    color: COLORS.textLight,
  },
  jobFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  dateContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  dateText: {
    fontSize: 12,
    color: COLORS.textLight,
  },
  viewDetailsButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  viewDetailsText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: "600",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: `${COLORS.primary}15`,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 12,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 32,
  },
  exploreJobsButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  exploreJobsText: {
    color: COLORS.surface,
    fontSize: 16,
    fontWeight: "600",
  },
});

export default MyJobsScreen;