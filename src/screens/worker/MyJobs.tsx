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
import { getMyAcceptedApplications } from "../../services/workerService";
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
  const [cropTypeFilters, setCropTypeFilters] = useState([]);
  const [backendStats, setBackendStats] = useState(null);

  // 🔥 CORREGIDO - Estados basados en la respuesta real del backend
  const getJobStatusDisplayName = (status) => {
    const statusMap = {
      Aceptado: "En Progreso",
      Aceptada: "En Progreso", // 🔥 NUEVO - Estado del backend
      Completado: "Completado",
      Finalizado: "Completado",
    };
    return statusMap[status] || status || "Desconocido";
  };

  // 🔥 CORREGIDO - Estilos basados en estados reales
  const getJobStatusStyle = (status) => {
    switch (status) {
      case "Completado":
      case "Finalizado":
        return { backgroundColor: COLORS.success };
      case "Aceptado":
      case "Aceptada": // 🔥 NUEVO
        return { backgroundColor: COLORS.info };
      case "En_curso":
        return { backgroundColor: COLORS.warning };
      default:
        return { backgroundColor: COLORS.textLight };
    }
  };

  const getJobStatusIcon = (status) => {
    switch (status) {
      case "Completado":
      case "Finalizado":
        return "checkmark-circle";
      case "Aceptado":
      case "Aceptada": // 🔥 NUEVO
        return "play-circle";
      case "En_curso":
        return "refresh-circle";
      default:
        return "help-circle";
    }
  };

  // 🔥 CORREGIDO - Cargar trabajos aceptados sin workerId
  const loadAcceptedJobs = async () => {
    try {
      console.log("🔄 Loading accepted jobs...");

      // 🔥 CORREGIDO - No pasar workerId (la API usa el token)
      const response = await getMyAcceptedApplications();

      console.log("📋 API Response:", response);

      // 🔥 CORREGIDO - Usar la estructura real del backend
      const applicationsData = response?.applications || [];
      const statsData = {
        total: response?.total || 0,
        statusCounts: response?.statusCounts || {},
        acceptedStatuses: response?.acceptedStatuses || [],
      };

      console.log("📊 Backend Stats:", statsData);
      console.log("📋 Applications loaded:", applicationsData.length);

      setAllApplications(applicationsData);
      setBackendStats(statsData);

      // 🔥 CORREGIDO - Los trabajos ya vienen filtrados del backend (solo aceptados)
      const sortedJobs = applicationsData.sort((a, b) => {
        const dateA = new Date(a.createdAt || 0).getTime();
        const dateB = new Date(b.createdAt || 0).getTime();
        return dateB - dateA;
      });

      setAcceptedJobs(sortedJobs);

      // Generar filtros de tipos de cultivo dinámicamente
      generateCropTypeFilters(sortedJobs);

      // Aplicar filtro actual
      filterJobsByCropType(sortedJobs, activeFilter);
    } catch (error) {
      console.error("❌ Error cargando trabajos:", error);
      Alert.alert("Error", "No se pudieron cargar tus trabajos");
      setAcceptedJobs([]);
      setFilteredJobs([]);
      setBackendStats(null);
    }
  };

  // 🔥 CORREGIDO - Filtros basados en estados reales del backend
  const generateCropTypeFilters = (jobs) => {
    const cropTypes = new Map();

    jobs.forEach((job) => {
      const cropType = job.jobOffer?.cropType;
      if (cropType) {
        cropTypes.set(cropType.id, {
          id: cropType.id,
          name: cropType.name,
          icon: "leaf",
        });
      }
    });

    // 🔥 CORREGIDO - Estados basados en la respuesta real
    const filters = [
      { id: "all", name: "Todos los Trabajos", icon: "apps" },
      { id: "aceptado", name: "En Progreso (Aceptado)", icon: "play-circle" },
      { id: "aceptada", name: "En Progreso (Aceptada)", icon: "play-circle" },
      // Solo incluir "completed" si hay trabajos completados
      ...(jobs.some((job) =>
        ["Completado", "Finalizado"].includes(job.status?.name)
      )
        ? [{ id: "completed", name: "Completados", icon: "checkmark-circle" }]
        : []),
      ...Array.from(cropTypes.values()),
    ];

    setCropTypeFilters(filters);
  };

  // 🔥 CORREGIDO - Filtrar por estados reales
  const filterJobsByCropType = (jobs, filterId) => {
    let filtered = [];

    switch (filterId) {
      case "all":
        filtered = jobs;
        break;
      case "aceptado":
        filtered = jobs.filter((job) => job.status?.name === "Aceptado");
        break;
      case "aceptada":
        filtered = jobs.filter((job) => job.status?.name === "Aceptada");
        break;
      case "completed":
        filtered = jobs.filter((job) =>
          ["Completado", "Finalizado"].includes(job.status?.name)
        );
        break;
      default:
        // Filtrar por tipo de cultivo específico
        filtered = jobs.filter(
          (job) => job.jobOffer?.cropType?.id === filterId
        );
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

  // 🔥 CORREGIDO - Estadísticas basadas en datos reales del backend
  const getJobStats = () => {
    if (!backendStats) {
      return {
        total: 0,
        aceptado: 0,
        aceptada: 0,
        completed: 0,
        totalEarnings: 0,
      };
    }

    const total = backendStats.total;
    const aceptado = backendStats.statusCounts["Aceptado"] || 0;
    const aceptada = backendStats.statusCounts["Aceptada"] || 0;
    const completed =
      (backendStats.statusCounts["Completado"] || 0) +
      (backendStats.statusCounts["Finalizado"] || 0);

    // 🔥 CORREGIDO - Calcular ganancias solo de trabajos completados
    const totalEarnings = acceptedJobs
      .filter((job) => ["Completado", "Finalizado"].includes(job.status?.name))
      .reduce((sum, job) => {
        const salary = job.jobOffer?.salary || 0;
        const duration = parseInt(job.jobOffer?.duration) || 1;
        return sum + salary * duration;
      }, 0);

    return { total, aceptado, aceptada, completed, totalEarnings };
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
        {/* 🔥 CORREGIDO - Estadísticas basadas en datos reales */}
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

              {/* 🔥 NUEVO - Estadística para "Aceptado" */}
              <View style={styles.statCard}>
                <LinearGradient
                  colors={[COLORS.info, "#60A5FA"]}
                  style={styles.statGradient}>
                  <Ionicons name="play-circle" size={24} color="#FFFFFF" />
                  <Text style={styles.statNumber}>{stats.aceptado}</Text>
                  <Text style={styles.statLabel}>Aceptado</Text>
                </LinearGradient>
              </View>

              {/* 🔥 NUEVO - Estadística para "Aceptada" */}
              <View style={styles.statCard}>
                <LinearGradient
                  colors={[COLORS.info, "#60A5FA"]}
                  style={styles.statGradient}>
                  <Ionicons name="play-circle" size={24} color="#FFFFFF" />
                  <Text style={styles.statNumber}>{stats.aceptada}</Text>
                  <Text style={styles.statLabel}>Aceptada</Text>
                </LinearGradient>
              </View>

              {/* Solo mostrar completados si existen */}
              {stats.completed > 0 && (
                <View style={styles.statCard}>
                  <LinearGradient
                    colors={[COLORS.success, "#34D399"]}
                    style={styles.statGradient}>
                    <Ionicons
                      name="checkmark-circle"
                      size={24}
                      color="#FFFFFF"
                    />
                    <Text style={styles.statNumber}>{stats.completed}</Text>
                    <Text style={styles.statLabel}>Completados</Text>
                  </LinearGradient>
                </View>
              )}

              {/* Solo mostrar ganancias si hay trabajos completados */}
              {stats.totalEarnings > 0 && (
                <View style={styles.statCard}>
                  <LinearGradient
                    colors={[COLORS.secondary, "#FBBF24"]}
                    style={styles.statGradient}>
                    <Ionicons name="cash" size={24} color="#FFFFFF" />
                    <Text style={styles.statNumber}>
                      $
                      {new Intl.NumberFormat("es-CO", {
                        notation: "compact",
                        maximumFractionDigits: 1,
                      }).format(stats.totalEarnings)}
                    </Text>
                    <Text style={styles.statLabel}>Ganado Total</Text>
                  </LinearGradient>
                </View>
              )}
            </View>
          </ScrollView>
        </View>

        {/* Filtros por tipo de cultivo y estado */}
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

        {/* Lista de trabajos */}
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
                      getJobStatusStyle(job.status?.name),
                    ]}
                  />

                  <View style={styles.jobCardContent}>
                    <View style={styles.jobCardHeader}>
                      <View style={styles.jobInfo}>
                        <Text style={styles.jobTitle} numberOfLines={2}>
                          {job.jobOffer?.title || "Trabajo sin título"}
                        </Text>
                        <Text style={styles.employerName}>
                          {job.jobOffer?.employer?.user?.name}{" "}
                          {job.jobOffer?.employer?.user?.lastname || ""}
                        </Text>
                        {/* 🔥 CORREGIDO - Fase del cultivo en lugar de finca */}
                        <Text style={styles.farmName}>
                          {job.jobOffer?.phase?.name || "Fase no especificada"}
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
                      {/* 🔥 CORREGIDO - Estructura de ubicación */}
                      <View style={styles.detailRow}>
                        <Ionicons
                          name="location"
                          size={16}
                          color={COLORS.textLight}
                        />
                        <Text style={styles.detailText}>
                          {job.jobOffer?.location?.city || "Ciudad"},{" "}
                          {job.jobOffer?.location?.state || "Estado"}
                          {job.jobOffer?.location?.village &&
                            `, ${job.jobOffer.location.village}`}
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

                    {/* 🔥 CORREGIDO - Solo mostrar ganancias para trabajos completados */}
                    {["Completado", "Finalizado"].includes(
                      job.status?.name
                    ) && (
                      <View style={styles.earningsContainer}>
                        <View style={styles.earningsBox}>
                          <Ionicons
                            name="cash"
                            size={18}
                            color={COLORS.success}
                          />
                          <Text style={styles.earningsLabel}>
                            Total Ganado:
                          </Text>
                          <Text style={styles.earningsAmount}>
                            $
                            {new Intl.NumberFormat("es-CO").format(
                              (job.jobOffer?.salary || 0) *
                                (parseInt(job.jobOffer?.duration) || 1)
                            )}
                          </Text>
                        </View>
                      </View>
                    )}

                    {/* 🔥 CONDICIONAL - Solo mostrar beneficios si existen */}
                    {(job.jobOffer?.includesFood !== undefined ||
                      job.jobOffer?.includesLodging !== undefined) && (
                      <View style={styles.benefitsContainer}>
                        {job.jobOffer?.includesFood !== undefined && (
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
                        )}

                        {job.jobOffer?.includesLodging !== undefined && (
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
                        )}
                      </View>
                    )}

                    <View style={styles.jobFooter}>
                      <View style={styles.dateContainer}>
                        <Ionicons
                          name="calendar"
                          size={14}
                          color={COLORS.textLight}
                        />
                        <Text style={styles.dateText}>
                          Aceptado el{" "}
                          {job.updatedAt
                            ? new Date(job.updatedAt).toLocaleDateString(
                                "es-ES",
                                {
                                  day: "2-digit",
                                  month: "2-digit",
                                  year: "numeric",
                                }
                              )
                            : "Fecha no disponible"}
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

                    {/* 🔥 NUEVO - Información de contacto para trabajos aceptados */}
                    {["Aceptado", "Aceptada"].includes(job.status?.name) && (
                      <View style={styles.contactContainer}>
                        <Text style={styles.contactTitle}>
                          Contacto del empleador:
                        </Text>
                        <View style={styles.contactInfo}>
                          <View style={styles.contactRow}>
                            <Ionicons
                              name="person"
                              size={16}
                              color={COLORS.primary}
                            />
                            <Text style={styles.contactText}>
                              {job.jobOffer?.employer?.user?.name}{" "}
                              {job.jobOffer?.employer?.user?.lastname}
                            </Text>
                          </View>
                          {job.jobOffer?.employer?.user?.phone && (
                            <View style={styles.contactRow}>
                              <Ionicons
                                name="call"
                                size={16}
                                color={COLORS.primary}
                              />
                              <Text style={styles.contactText}>
                                {job.jobOffer?.employer?.user?.phone}
                              </Text>
                            </View>
                          )}
                          {job.jobOffer?.employer?.user?.email && (
                            <View style={styles.contactRow}>
                              <Ionicons
                                name="mail"
                                size={16}
                                color={COLORS.primary}
                              />
                              <Text style={styles.contactText}>
                                {job.jobOffer?.employer?.user?.email}
                              </Text>
                            </View>
                          )}
                        </View>
                      </View>
                    )}
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
                  ? "No tienes trabajos aceptados aún"
                  : `No tienes trabajos de ${cropTypeFilters
                      .find((f) => f.id === activeFilter)
                      ?.name.toLowerCase()}`}
              </Text>
              <Text style={styles.emptySubtitle}>
                {activeFilter === "all"
                  ? "Cuando te acepten para un trabajo, aparecerá aquí"
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

      <CustomTabBarWorker
        state={{ index: 1, routes: [] }}
        navigation={navigation}
      />
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
  // 🔥 NUEVO - Estilos para información de contacto
  contactContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  contactTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 8,
  },
  contactInfo: {
    gap: 6,
  },
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  contactText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: "500",
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
