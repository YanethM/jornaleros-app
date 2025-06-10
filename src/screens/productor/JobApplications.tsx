import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
  FlatList,
  RefreshControl,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/MaterialIcons";
import {
  useNavigation,
  useRoute,
  RouteProp,
  useFocusEffect,
} from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import ScreenLayout from "../../components/ScreenLayout";
import CustomTabBar from "../../components/CustomTabBar";
import ApiClient from "../../utils/api";

const PRIMARY_COLOR = "#284F66";
const SECONDARY_COLOR = "#4A7C94";

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

// Type definitions
interface Worker {
  id: string;
  user: {
    id: string;
    name: string;
    lastname?: string;
    email: string;
    phone?: string;
  };
  experience?: string;
  skills?: string;
  location?: string;
}

interface JobOffer {
  id: string;
  title: string;
  cropType?: {
    name: string;
  };
}

interface ApplicationStatus {
  id: string;
  name: string;
}

interface Application {
  id: string;
  createdAt: string;
  status: ApplicationStatus;
  message?: string;
  worker: Worker;
  jobOffer?: JobOffer;
}

interface ApplicationStats {
  total: number;
  pending: number;
  accepted: number;
  rejected: number;
}

// Define application statuses with their configurations
const APPLICATION_STATUSES = {
  Pendiente: {
    label: "Pendiente",
    color: "#FF9800",
    icon: "schedule",
    bgColor: "#FFF3E0",
  },
  Aceptada: {
    label: "Aceptada",
    color: "#4CAF50",
    icon: "check-circle",
    bgColor: "#E8F5E9",
  },
  Rechazada: {
    label: "Rechazada",
    color: "#F44336",
    icon: "cancel",
    bgColor: "#FFEBEE",
  },
};

// Navigation types
type RootStackParamList = {
  JobApplications: { jobOfferId: string };
  JobOfferDetail: { jobOfferId: string };
  WorkerProfileApplication: { 
    workerId: string; 
    jobOfferId?: string;
    applicationId?: string;
    applicationStatus?: string;
    showApplicationActions?: boolean;
  };
  WorkerSearch: { jobOfferId?: string };
};

type JobApplicationsNavigationProp = StackNavigationProp<
  RootStackParamList,
  "JobApplications"
>;
type JobApplicationsRouteProp = RouteProp<
  RootStackParamList,
  "JobApplications"
>;

const JobApplications: React.FC = () => {
  const navigation = useNavigation<JobApplicationsNavigationProp>();
  const route = useRoute<JobApplicationsRouteProp>();
  const { jobOfferId } = route.params;

  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [applications, setApplications] = useState<Application[]>([]);
  const [filteredApplications, setFilteredApplications] = useState<
    Application[]
  >([]);
  const [jobOffer, setJobOffer] = useState<JobOffer | null>(null);
  const [stats, setStats] = useState<ApplicationStats>({
    total: 0,
    pending: 0,
    accepted: 0,
    rejected: 0,
  });
  const [selectedFilter, setSelectedFilter] = useState<string>("all");
  const [showFilterModal, setShowFilterModal] = useState<boolean>(false);
  const [processingApplication, setProcessingApplication] = useState<
    string | null
  >(null);

  // Filter options
  const filterOptions = [
    { id: "all", label: "Todas", count: stats.total },
    { id: "Pendiente", label: "Pendientes", count: stats.pending },
    { id: "Aceptada", label: "Aceptadas", count: stats.accepted },
    { id: "Rechazada", label: "Rechazadas", count: stats.rejected },
  ];

  useEffect(() => {
    loadApplications();
  }, [jobOfferId]);

  useEffect(() => {
    applyFilter();
  }, [applications, selectedFilter]);

  useFocusEffect(
    useCallback(() => {
      loadApplications();
    }, [jobOfferId])
  );

  const loadApplications = async (isRefreshing = false): Promise<void> => {
    try {
      if (!isRefreshing) {
        setLoading(true);
      }

      console.log("Loading applications for job offer:", jobOfferId);

      // Load job offer details
      try {
        const jobOfferResponse = await ApiClient.get(
          `/job-offer/${jobOfferId}`
        );
        console.log("Job offer response:", jobOfferResponse);

        if (
          jobOfferResponse &&
          (jobOfferResponse.success || jobOfferResponse.data)
        ) {
          const jobOfferData = jobOfferResponse.data || jobOfferResponse;
          setJobOffer(jobOfferData);
        }
      } catch (jobOfferError) {
        console.warn("Error loading job offer details:", jobOfferError);
      }

      // Load applications
      const applicationsResponse = await ApiClient.get(
        `/job-offer/${jobOfferId}/applications`
      );
      console.log("Applications response:", applicationsResponse);

      let applicationsList: Application[] = [];

      if (
        applicationsResponse &&
        applicationsResponse.success &&
        Array.isArray(applicationsResponse.data)
      ) {
        applicationsList = applicationsResponse.data;
      } else if (
        applicationsResponse &&
        Array.isArray(applicationsResponse.data)
      ) {
        applicationsList = applicationsResponse.data;
      } else if (Array.isArray(applicationsResponse)) {
        applicationsList = applicationsResponse;
      } else if (
        applicationsResponse &&
        applicationsResponse.data &&
        Array.isArray(applicationsResponse.data.data)
      ) {
        applicationsList = applicationsResponse.data.data;
      } else {
        console.warn(
          "Unexpected applications response structure:",
          applicationsResponse
        );
        applicationsList = [];
      }

      if (!Array.isArray(applicationsList)) {
        console.error("Applications list is not an array:", applicationsList);
        applicationsList = [];
      }

      setApplications(applicationsList);
      calculateStats(applicationsList);
    } catch (error) {
      console.error("Error loading applications:", error);

      let errorMessage = "No se pudieron cargar las postulaciones";
      if (error instanceof Error) {
        errorMessage += `: ${error.message}`;
      }

      Alert.alert("Error", errorMessage);
      setApplications([]);
      calculateStats([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const calculateStats = (applicationsList: Application[]): void => {
    if (!Array.isArray(applicationsList)) {
      console.error("calculateStats received non-array:", applicationsList);
      applicationsList = [];
    }

    const newStats = {
      total: applicationsList.length,
      pending: applicationsList.filter(
        (app) => app.status?.name === "Pendiente"
      ).length,
      accepted: applicationsList.filter(
        (app) => app.status?.name === "Aceptada"
      ).length,
      rejected: applicationsList.filter(
        (app) => app.status?.name === "Rechazada"
      ).length,
    };
    setStats(newStats);
  };

  const applyFilter = (): void => {
    if (!Array.isArray(applications)) {
      console.error("applyFilter: applications is not an array:", applications);
      setFilteredApplications([]);
      return;
    }

    if (selectedFilter === "all") {
      setFilteredApplications(applications);
    } else {
      setFilteredApplications(
        applications.filter((app) => app.status?.name === selectedFilter)
      );
    }
  };

  const onRefresh = (): void => {
    setRefreshing(true);
    loadApplications(true);
  };

  const handleUpdateApplicationStatus = async (
    applicationId: string,
    newStatus: string
  ): Promise<void> => {
    try {
      setProcessingApplication(applicationId);

      const response = await ApiClient.put(
        `/application/${applicationId}/status`,
        {
          status: newStatus,
        }
      );

      if (response.success || response.data) {
        // Update local state
        setApplications((prev) =>
          prev.map((app) =>
            app.id === applicationId
              ? { ...app, status: { id: "", name: newStatus } }
              : app
          )
        );

        const statusText =
          APPLICATION_STATUSES[newStatus as keyof typeof APPLICATION_STATUSES]
            ?.label || newStatus;
        Alert.alert(
          "Éxito",
          `La postulación ha sido ${statusText.toLowerCase()}`
        );

        // Reload applications to get updated data
        loadApplications();
      } else {
        throw new Error("Error updating application status");
      }
    } catch (error) {
      console.error("Error updating application status:", error);
      Alert.alert("Error", "No se pudo actualizar el estado de la postulación");
    } finally {
      setProcessingApplication(null);
    }
  };

  const showStatusUpdateDialog = (application: Application): void => {
    const currentStatus = application.status.name;
    const options = Object.entries(APPLICATION_STATUSES)
      .filter(([status]) => status !== currentStatus)
      .map(([status, config]) => ({
        text: config.label,
        onPress: () => handleUpdateApplicationStatus(application.id, status),
      }));

    options.push({
      text: "Cancelar",
      onPress: () => {},
      style: "cancel" as any,
    });

    Alert.alert(
      "Cambiar estado",
      `¿Qué acción deseas realizar con la postulación de ${application.worker.user.name}?`,
      options
    );
  };

  const handleViewWorkerProfile = (application: Application): void => {
    navigation.navigate("WorkerProfileByEmployer", {
      workerId: application.worker.id,
      jobOfferId: jobOfferId,
      applicationId: application.id,
      applicationStatus: application.status?.name,
      showApplicationActions: true,
    });
  };

  const handleSearchWorkers = (): void => {
    navigation.navigate("WorkerSearch", { jobOfferId });
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusConfig = (status: string) => {
    return (
      APPLICATION_STATUSES[status as keyof typeof APPLICATION_STATUSES] || {
        label: status,
        color: "#757575",
        icon: "help",
        bgColor: "#F5F5F5",
      }
    );
  };

  const renderFilterModal = () => (
    <Modal
      visible={showFilterModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowFilterModal(false)}>
      <View style={styles.modalOverlay}>
        <View style={styles.filterModalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Filtrar por estado</Text>
            <TouchableOpacity onPress={() => setShowFilterModal(false)}>
              <Icon name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          <View style={styles.filterOptionsContainer}>
            {filterOptions.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.filterOption,
                  selectedFilter === option.id && styles.filterOptionSelected,
                ]}
                onPress={() => {
                  setSelectedFilter(option.id);
                  setShowFilterModal(false);
                }}>
                <View style={styles.filterOptionContent}>
                  <Text
                    style={[
                      styles.filterOptionLabel,
                      selectedFilter === option.id &&
                        styles.filterOptionLabelSelected,
                    ]}>
                    {option.label}
                  </Text>
                  <Text
                    style={[
                      styles.filterOptionCount,
                      selectedFilter === option.id &&
                        styles.filterOptionCountSelected,
                    ]}>
                    ({option.count})
                  </Text>
                </View>
                {selectedFilter === option.id && (
                  <Icon name="check" size={20} color={PRIMARY_COLOR} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );

  const renderStatsCard = () => (
    <View style={styles.statsCard}>
      <View style={styles.statsHeader}>
        <View style={styles.statsIconContainer}>
          <Icon name="analytics" size={24} color={PRIMARY_COLOR} />
        </View>
        <Text style={styles.statsTitle}>Resumen de Postulaciones</Text>
      </View>
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <View
            style={[
              styles.statIconContainer,
              { backgroundColor: `${COLORS.info}15` },
            ]}>
            <Icon name="people" size={20} color={COLORS.info} />
          </View>
          <Text style={[styles.statValue, { color: COLORS.info }]}>
            {stats.total}
          </Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statItem}>
          <View
            style={[
              styles.statIconContainer,
              { backgroundColor: `${APPLICATION_STATUSES.Pendiente.color}15` },
            ]}>
            <Icon
              name={APPLICATION_STATUSES.Pendiente.icon}
              size={20}
              color={APPLICATION_STATUSES.Pendiente.color}
            />
          </View>
          <Text
            style={[
              styles.statValue,
              { color: APPLICATION_STATUSES.Pendiente.color },
            ]}>
            {stats.pending}
          </Text>
          <Text style={styles.statLabel}>Pendientes</Text>
        </View>
        <View style={styles.statItem}>
          <View
            style={[
              styles.statIconContainer,
              { backgroundColor: `${APPLICATION_STATUSES.Aceptada.color}15` },
            ]}>
            <Icon
              name={APPLICATION_STATUSES.Aceptada.icon}
              size={20}
              color={APPLICATION_STATUSES.Aceptada.color}
            />
          </View>
          <Text
            style={[
              styles.statValue,
              { color: APPLICATION_STATUSES.Aceptada.color },
            ]}>
            {stats.accepted}
          </Text>
          <Text style={styles.statLabel}>Aceptadas</Text>
        </View>
        <View style={styles.statItem}>
          <View
            style={[
              styles.statIconContainer,
              { backgroundColor: `${APPLICATION_STATUSES.Rechazada.color}15` },
            ]}>
            <Icon
              name={APPLICATION_STATUSES.Rechazada.icon}
              size={20}
              color={APPLICATION_STATUSES.Rechazada.color}
            />
          </View>
          <Text
            style={[
              styles.statValue,
              { color: APPLICATION_STATUSES.Rechazada.color },
            ]}>
            {stats.rejected}
          </Text>
          <Text style={styles.statLabel}>Rechazadas</Text>
        </View>
      </View>
    </View>
  );

  const renderApplicationItem = ({ item }: { item: Application }) => {
    if (!item || !item.worker || !item.worker.user) {
      console.warn("Invalid application item:", item);
      return null;
    }

    const statusConfig = getStatusConfig(item.status?.name || "Pendiente");
    const isProcessing = processingApplication === item.id;

    return (
      <TouchableOpacity 
        style={styles.applicationCard}
        onPress={() => handleViewWorkerProfile(item)}
        activeOpacity={0.7}
      >
        <View style={styles.applicationHeader}>
          <View style={styles.workerInfo}>
            <View style={styles.workerAvatar}>
              <Text style={styles.avatarText}>
                {item.worker.user.name.charAt(0).toUpperCase()}
                {item.worker.user.lastname?.charAt(0).toUpperCase() || ''}
              </Text>
            </View>
            <View style={styles.workerDetails}>
              <Text style={styles.workerName}>
                {item.worker.user.name} {item.worker.user.lastname || ''}
              </Text>
              <Text style={styles.workerEmail}>{item.worker.user.email}</Text>
              {item.worker.user.phone && (
                <Text style={styles.workerPhone}>{item.worker.user.phone}</Text>
              )}
            </View>
          </View>

          <View
            style={[
              styles.statusBadge,
              { backgroundColor: statusConfig.bgColor },
            ]}>
            <Icon
              name={statusConfig.icon}
              size={16}
              color={statusConfig.color}
            />
            <Text style={[styles.statusText, { color: statusConfig.color }]}>
              {statusConfig.label}
            </Text>
          </View>
        </View>

        <View style={styles.applicationBody}>
          <View style={styles.applicationInfo}>
            <View style={styles.infoRow}>
              <Icon name="schedule" size={16} color="#757575" />
              <Text style={styles.infoText}>
                Postulado el {formatDate(item.createdAt)}
              </Text>
            </View>

            {item.worker.experience && (
              <View style={styles.infoRow}>
                <Icon name="work" size={16} color="#757575" />
                <Text style={styles.infoText}>
                  {item.worker.experience} de experiencia
                </Text>
              </View>
            )}

            {item.worker.location && (
              <View style={styles.infoRow}>
                <Icon name="location-on" size={16} color="#757575" />
                <Text style={styles.infoText}>{item.worker.location}</Text>
              </View>
            )}
          </View>

          {item.message && (
            <View style={styles.messageContainer}>
              <Text style={styles.messageLabel}>Mensaje del postulante:</Text>
              <Text style={styles.messageText}>{item.message}</Text>
            </View>
          )}
        </View>

        <View style={styles.applicationFooter}>
          <View style={styles.viewProfileContainer}>
            <Icon name="person" size={16} color={PRIMARY_COLOR} />
            <Text style={styles.viewProfileText}>Ver perfil completo</Text>
            <Icon name="chevron-right" size={20} color={PRIMARY_COLOR} />
          </View>

          {item.status?.name === "Pendiente" && (
            <TouchableOpacity
              style={[
                styles.quickActionButton,
                isProcessing && styles.actionButtonDisabled,
              ]}
              onPress={(e) => {
                e.stopPropagation();
                showStatusUpdateDialog(item);
              }}
              disabled={isProcessing}>
              {isProcessing ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Icon name="edit" size={16} color="#fff" />
                  <Text style={styles.quickActionButtonText}>Gestionar</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconContainer}>
        <Icon name="people-outline" size={80} color="#E2E8F0" />
      </View>

      <Text style={styles.emptyTitle}>
        {selectedFilter === "all"
          ? "No hay postulaciones aún"
          : `No hay postulaciones ${filterOptions
              .find((f) => f.id === selectedFilter)
              ?.label.toLowerCase()}`}
      </Text>

      <Text style={styles.emptySubtitle}>
        {selectedFilter === "all"
          ? "Cuando alguien se postule a esta oferta, aparecerá aquí"
          : "Intenta cambiar el filtro para ver otras postulaciones"}
      </Text>

      {selectedFilter === "all" && stats.total === 0 && (
        <View style={styles.searchWorkersContainer}>
          <Text style={styles.searchWorkersTitle}>
            ¿Necesitas encontrar trabajadores?
          </Text>
          <Text style={styles.searchWorkersSubtitle}>
            Puedes buscar trabajadores activamente y contactarlos directamente
          </Text>
          <TouchableOpacity
            style={styles.searchWorkersButton}
            onPress={handleSearchWorkers}>
            <Icon name="search" size={20} color="#fff" />
            <Text style={styles.searchWorkersButtonText}>
              Buscar Trabajadores
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color={PRIMARY_COLOR} />
            <Text style={styles.loadingText}>Cargando postulaciones...</Text>
            <Text style={styles.loadingSubtext}>Preparando información</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <ScreenLayout navigation={navigation}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Postulaciones</Text>
          {jobOffer && (
            <Text style={styles.headerSubtitle} numberOfLines={1}>
              {jobOffer.title}
            </Text>
          )}
        </View>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowFilterModal(true)}>
          <Icon name="filter-list" size={24} color="#fff" />
          {selectedFilter !== "all" && (
            <View style={styles.filterIndicatorDot} />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[PRIMARY_COLOR]}
            tintColor={PRIMARY_COLOR}
          />
        }>
        {renderStatsCard()}

        {selectedFilter !== "all" && (
          <View style={styles.filterIndicator}>
            <View style={styles.filterIndicatorContent}>
              <Icon name="filter-alt" size={16} color={COLORS.info} />
              <Text style={styles.filterIndicatorText}>
                Mostrando:{" "}
                {filterOptions.find((f) => f.id === selectedFilter)?.label}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => setSelectedFilter("all")}
              style={styles.clearFilterButton}>
              <Icon name="clear" size={16} color={COLORS.info} />
              <Text style={styles.clearFilterText}>Limpiar</Text>
            </TouchableOpacity>
          </View>
        )}

        <FlatList
          data={filteredApplications}
          renderItem={renderApplicationItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={renderEmptyState}
          scrollEnabled={false}
        />
      </ScrollView>

      {renderFilterModal()}

      <CustomTabBar navigation={navigation} currentRoute="JobOffers" />
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
  statsCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    ...Platform.select({
      ios: {
        shadowColor: PRIMARY_COLOR,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 15,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  statsHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    paddingBottom: 10,
    borderBottomWidth: 2,
    borderBottomColor: "#f1f5f9",
  },
  statsIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${PRIMARY_COLOR}15`,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: PRIMARY_COLOR,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  statItem: {
    alignItems: "center",
    flex: 1,
  },
  statIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "#757575",
    textAlign: "center",
  },
  filterIndicator: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    padding: 12,
    backgroundColor: `${COLORS.info}10`,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: `${COLORS.info}30`,
  },
  filterIndicatorContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  filterIndicatorText: {
    fontSize: 14,
    color: COLORS.info,
    fontWeight: "500",
    marginLeft: 8,
  },
  clearFilterButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: `${COLORS.info}30`,
  },
  clearFilterText: {
    fontSize: 12,
    color: COLORS.info,
    fontWeight: "600",
    marginLeft: 4,
  },
  listContainer: {
    paddingBottom: 120,
  },
  applicationCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    marginBottom: 16,
    padding: 16,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  applicationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  workerInfo: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  workerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: `${PRIMARY_COLOR}15`,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: "700",
    color: PRIMARY_COLOR,
  },
  workerDetails: {
    flex: 1,
  },
  workerName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 2,
  },
  workerEmail: {
    fontSize: 14,
    color: "#757575",
    marginBottom: 2,
  },
  workerPhone: {
    fontSize: 14,
    color: "#757575",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 4,
  },
  applicationBody: {
    marginBottom: 12,
  },
  applicationInfo: {
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  infoText: {
    fontSize: 14,
    color: "#666",
    marginLeft: 8,
  },
  messageContainer: {
    backgroundColor: "#F8F9FA",
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: PRIMARY_COLOR,
  },
  messageLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  messageText: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
  },
  applicationFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
  },
  viewProfileContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  viewProfileText: {
    fontSize: 14,
    color: PRIMARY_COLOR,
    fontWeight: "600",
    marginLeft: 6,
    marginRight: 4,
  },
  quickActionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: PRIMARY_COLOR,
    borderRadius: 20,
  },
  actionButtonDisabled: {
    opacity: 0.7,
  },
  quickActionButtonText: {
    fontSize: 14,
    color: "#fff",
    fontWeight: "600",
    marginLeft: 6,
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
  searchWorkersContainer: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    marginTop: 20,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  searchWorkersTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: PRIMARY_COLOR,
    marginBottom: 8,
    textAlign: "center",
  },
  searchWorkersSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 20,
  },
  searchWorkersButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    ...Platform.select({
      ios: {
        shadowColor: COLORS.success,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  searchWorkersButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  filterModalContainer: {
    backgroundColor: "#fff",
    borderRadius: 20,
    margin: 20,
    width: "85%",
    maxHeight: "60%",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 16,
      },
      android: {
        elevation: 12,
      },
    }),
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: PRIMARY_COLOR,
  },
  filterOptionsContainer: {
    padding: 8,
  },
  filterOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    marginVertical: 4,
  },
  filterOptionSelected: {
    backgroundColor: `${PRIMARY_COLOR}10`,
    borderWidth: 1,
    borderColor: `${PRIMARY_COLOR}30`,
  },
  filterOptionContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  filterOptionLabel: {
    fontSize: 16,
    color: "#333",
    fontWeight: "500",
  },
  filterOptionLabelSelected: {
    color: PRIMARY_COLOR,
    fontWeight: "600",
  },
  filterOptionCount: {
    fontSize: 14,
    color: "#757575",
    marginLeft: 8,
  },
  filterOptionCountSelected: {
    color: PRIMARY_COLOR,
  },
});

export default JobApplications;
