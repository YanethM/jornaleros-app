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
import Icon from "react-native-vector-icons/MaterialIcons";
import { useNavigation, useRoute, RouteProp, useFocusEffect } from "@react-navigation/native";
import { StackNavigationProp } from '@react-navigation/stack';
import ScreenLayout from "../../components/ScreenLayout";
import CustomTabBar from "../../components/CustomTabBar";
import ApiClient from "../../utils/api";

const PRIMARY_COLOR = "#284F66";

// Type definitions
interface Worker {
  id: string;
  user: {
    id: string;
    name: string;
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
  status: ApplicationStatus; // Es un objeto, no un string
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
    bgColor: "#FFF3E0"
  },
  Aceptada: {
    label: "Aceptada",
    color: "#4CAF50",
    icon: "check-circle",
    bgColor: "#E8F5E9"
  },
  Rechazada: {
    label: "Rechazada",
    color: "#F44336",
    icon: "cancel",
    bgColor: "#FFEBEE"
  }
};

// Navigation types
type RootStackParamList = {
  JobApplications: { jobOfferId: string };
  JobOfferDetail: { jobOfferId: string };
  WorkerProfile: { workerId: string };
};

type JobApplicationsNavigationProp = StackNavigationProp<RootStackParamList, 'JobApplications'>;
type JobApplicationsRouteProp = RouteProp<RootStackParamList, 'JobApplications'>;

const JobApplications: React.FC = () => {
  const navigation = useNavigation<JobApplicationsNavigationProp>();
  const route = useRoute<JobApplicationsRouteProp>();
  const { jobOfferId } = route.params;

  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [applications, setApplications] = useState<Application[]>([]);
  const [filteredApplications, setFilteredApplications] = useState<Application[]>([]);
  const [jobOffer, setJobOffer] = useState<JobOffer | null>(null);
  const [stats, setStats] = useState<ApplicationStats>({ total: 0, pending: 0, accepted: 0, rejected: 0 });
  const [selectedFilter, setSelectedFilter] = useState<string>("all");
  const [showFilterModal, setShowFilterModal] = useState<boolean>(false);
  const [processingApplication, setProcessingApplication] = useState<string | null>(null);

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
        const jobOfferResponse = await ApiClient.get(`/job-offer/${jobOfferId}`);
        console.log("Job offer response:", jobOfferResponse);
        
        if (jobOfferResponse && (jobOfferResponse.success || jobOfferResponse.data)) {
          const jobOfferData = jobOfferResponse.data || jobOfferResponse;
          setJobOffer(jobOfferData);
        }
      } catch (jobOfferError) {
        console.warn("Error loading job offer details:", jobOfferError);
        // Continue even if job offer details fail
      }

      // Load applications
      const applicationsResponse = await ApiClient.get(`/job-offer/${jobOfferId}/applications`);
      console.log("Applications response:", applicationsResponse);
      
      let applicationsList: Application[] = [];
      
      // Handle different response structures
      if (applicationsResponse && applicationsResponse.success && Array.isArray(applicationsResponse.data)) {
        applicationsList = applicationsResponse.data;
      } else if (applicationsResponse && Array.isArray(applicationsResponse.data)) {
        applicationsList = applicationsResponse.data;
      } else if (Array.isArray(applicationsResponse)) {
        applicationsList = applicationsResponse;
      } else if (applicationsResponse && applicationsResponse.data && Array.isArray(applicationsResponse.data.data)) {
        applicationsList = applicationsResponse.data.data;
      } else {
        console.warn("Unexpected applications response structure:", applicationsResponse);
        applicationsList = [];
      }

      console.log("Processed applications list:", applicationsList);
      
      // Ensure applicationsList is an array
      if (!Array.isArray(applicationsList)) {
        console.error("Applications list is not an array:", applicationsList);
        applicationsList = [];
      }

      setApplications(applicationsList);
      calculateStats(applicationsList);

    } catch (error) {
      console.error("Error loading applications:", error);
      
      // Provide more detailed error information
      let errorMessage = "No se pudieron cargar las postulaciones";
      if (error instanceof Error) {
        errorMessage += `: ${error.message}`;
      }
      
      Alert.alert("Error", errorMessage);
      
      // Set empty arrays to prevent further errors
      setApplications([]);
      calculateStats([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const calculateStats = (applicationsList: Application[]): void => {
    // Ensure applicationsList is an array
    if (!Array.isArray(applicationsList)) {
      console.error("calculateStats received non-array:", applicationsList);
      applicationsList = [];
    }

    const newStats = {
      total: applicationsList.length,
      pending: applicationsList.filter(app => app.status?.name === "Pendiente").length,
      accepted: applicationsList.filter(app => app.status?.name === "Aceptada").length,
      rejected: applicationsList.filter(app => app.status?.name === "Rechazada").length,
    };
    setStats(newStats);
  };

  const applyFilter = (): void => {
    // Ensure applications is an array
    if (!Array.isArray(applications)) {
      console.error("applyFilter: applications is not an array:", applications);
      setFilteredApplications([]);
      return;
    }

    if (selectedFilter === "all") {
      setFilteredApplications(applications);
    } else {
      setFilteredApplications(applications.filter(app => app.status?.name === selectedFilter));
    }
  };

  const onRefresh = (): void => {
    setRefreshing(true);
    loadApplications(true);
  };

  const handleUpdateApplicationStatus = async (applicationId: string, newStatus: string): Promise<void> => {
    try {
      setProcessingApplication(applicationId);

      const response = await ApiClient.put(`/application/${applicationId}/status`, {
        status: newStatus
      });

      if (response.success || response.data) {
        // Update local state
        setApplications(prev => 
          prev.map(app => 
            app.id === applicationId 
              ? { ...app, status: { id: '', name: newStatus } }
              : app
          )
        );

        const statusText = APPLICATION_STATUSES[newStatus as keyof typeof APPLICATION_STATUSES]?.label || newStatus;
        Alert.alert("Éxito", `La postulación ha sido ${statusText.toLowerCase()}`);
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
        onPress: () => handleUpdateApplicationStatus(application.id, status)
      }));

    options.push({ text: "Cancelar", onPress: () => {}, style: "cancel" as any });

    Alert.alert(
      "Cambiar estado",
      `¿Qué acción deseas realizar con la postulación de ${application.worker.user.name}?`,
      options
    );
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const getStatusConfig = (status: string) => {
    return APPLICATION_STATUSES[status as keyof typeof APPLICATION_STATUSES] || {
      label: status,
      color: "#757575",
      icon: "help",
      bgColor: "#F5F5F5"
    };
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
                  selectedFilter === option.id && styles.filterOptionSelected
                ]}
                onPress={() => {
                  setSelectedFilter(option.id);
                  setShowFilterModal(false);
                }}>
                <View style={styles.filterOptionContent}>
                  <Text style={[
                    styles.filterOptionLabel,
                    selectedFilter === option.id && styles.filterOptionLabelSelected
                  ]}>
                    {option.label}
                  </Text>
                  <Text style={[
                    styles.filterOptionCount,
                    selectedFilter === option.id && styles.filterOptionCountSelected
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
      <Text style={styles.statsTitle}>Resumen de postulaciones</Text>
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats.total}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: APPLICATION_STATUSES.Pendiente.color }]}>
            {stats.pending}
          </Text>
          <Text style={styles.statLabel}>Pendientes</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: APPLICATION_STATUSES.Aceptada.color }]}>
            {stats.accepted}
          </Text>
          <Text style={styles.statLabel}>Aceptadas</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: APPLICATION_STATUSES.Rechazada.color }]}>
            {stats.rejected}
          </Text>
          <Text style={styles.statLabel}>Rechazadas</Text>
        </View>
      </View>
    </View>
  );

  const renderApplicationItem = ({ item }: { item: Application }) => {
    // Validate item structure
    if (!item || !item.worker || !item.worker.user) {
      console.warn("Invalid application item:", item);
      return null;
    }

    const statusConfig = getStatusConfig(item.status?.name || "Pendiente");
    const isProcessing = processingApplication === item.id;

    return (
      <View style={styles.applicationCard}>
        <View style={styles.applicationHeader}>
          <View style={styles.workerInfo}>
            <View style={styles.workerAvatar}>
              <Icon name="person" size={24} color={PRIMARY_COLOR} />
            </View>
            <View style={styles.workerDetails}>
              <Text style={styles.workerName}>{item.worker.user.name}</Text>
              <Text style={styles.workerEmail}>{item.worker.user.email}</Text>
              {item.worker.user.phone && (
                <Text style={styles.workerPhone}>{item.worker.user.phone}</Text>
              )}
            </View>
          </View>
          
          <View style={[styles.statusBadge, { backgroundColor: statusConfig.bgColor }]}>
            <Icon name={statusConfig.icon} size={16} color={statusConfig.color} />
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
          <TouchableOpacity
            style={styles.profileButton}
            onPress={() => navigation.navigate("WorkerProfile", { workerId: item.worker.id })}>
            <Icon name="person" size={16} color={PRIMARY_COLOR} />
            <Text style={styles.profileButtonText}>Ver perfil</Text>
          </TouchableOpacity>

          {item.status?.name === "Pendiente" && (
            <TouchableOpacity
              style={[styles.actionButton, isProcessing && styles.actionButtonDisabled]}
              onPress={() => showStatusUpdateDialog(item)}
              disabled={isProcessing}>
              {isProcessing ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Icon name="edit" size={16} color="#fff" />
                  <Text style={styles.actionButtonText}>Gestionar</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Icon name="people-outline" size={80} color="#ccc" />
      <Text style={styles.emptyTitle}>
        {selectedFilter === "all" 
          ? "No hay postulaciones aún"
          : `No hay postulaciones ${filterOptions.find(f => f.id === selectedFilter)?.label.toLowerCase()}`
        }
      </Text>
      <Text style={styles.emptySubtitle}>
        {selectedFilter === "all"
          ? "Cuando alguien se postule a esta oferta, aparecerá aquí"
          : "Intenta cambiar el filtro para ver otras postulaciones"
        }
      </Text>
    </View>
  );

  if (loading) {
    return (
      <ScreenLayout navigation={navigation}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={PRIMARY_COLOR} />
          <Text style={styles.loadingText}>Cargando postulaciones...</Text>
        </View>
      </ScreenLayout>
    );
  }

  return (
    <ScreenLayout navigation={navigation}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}>
            <Icon name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              Postulaciones
            </Text>
            {jobOffer && (
              <Text style={styles.headerSubtitle} numberOfLines={1}>
                {jobOffer.title}
              </Text>
            )}
          </View>
          <TouchableOpacity
            style={styles.filterBtn}
            onPress={() => setShowFilterModal(true)}>
            <Icon name="filter-list" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.content}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[PRIMARY_COLOR]}
              tintColor={PRIMARY_COLOR}
            />
          }>
          
          {/* Stats Card */}
          {renderStatsCard()}

          {/* Filter Indicator */}
          {selectedFilter !== "all" && (
            <View style={styles.filterIndicator}>
              <Text style={styles.filterIndicatorText}>
                Mostrando: {filterOptions.find(f => f.id === selectedFilter)?.label}
              </Text>
              <TouchableOpacity
                onPress={() => setSelectedFilter("all")}
                style={styles.clearFilterButton}>
                <Text style={styles.clearFilterText}>Ver todas</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Applications List */}
          <FlatList
            data={filteredApplications}
            renderItem={renderApplicationItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContainer}
            ListEmptyComponent={renderEmptyState}
            scrollEnabled={false}
          />
        </ScrollView>

        {/* Filter Modal */}
        {renderFilterModal()}
      </View>
      <CustomTabBar navigation={navigation} currentRoute="JobOffers" />
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  header: {
    backgroundColor: PRIMARY_COLOR,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    height: 64,
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "ios" ? 44 : 24,
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTextContainer: {
    flex: 1,
    alignItems: "center",
    marginHorizontal: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
  },
  headerSubtitle: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.8)",
    marginTop: 2,
  },
  filterBtn: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loadingText: {
    fontSize: 16,
    color: "#666",
    marginTop: 16,
  },
  statsCard: {
    backgroundColor: "#fff",
    margin: 16,
    padding: 16,
    borderRadius: 12,
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
  statsTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  statItem: {
    alignItems: "center",
  },
  statValue: {
    fontSize: 24,
    fontWeight: "700",
    color: "#333",
  },
  statLabel: {
    fontSize: 12,
    color: "#757575",
    marginTop: 4,
  },
  filterIndicator: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 12,
    backgroundColor: "#E3F2FD",
    borderRadius: 8,
  },
  filterIndicatorText: {
    fontSize: 14,
    color: "#1976D2",
    fontWeight: "500",
  },
  clearFilterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#fff",
    borderRadius: 16,
  },
  clearFilterText: {
    fontSize: 12,
    color: "#1976D2",
    fontWeight: "600",
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 120,
  },
  applicationCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 16,
    padding: 16,
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
    backgroundColor: "#F5F5F5",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
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
  profileButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: PRIMARY_COLOR,
    borderRadius: 20,
    backgroundColor: "#fff",
  },
  profileButtonText: {
    fontSize: 14,
    color: PRIMARY_COLOR,
    fontWeight: "600",
    marginLeft: 6,
  },
  actionButton: {
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
  actionButtonText: {
    fontSize: 14,
    color: "#fff",
    fontWeight: "600",
    marginLeft: 6,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
    marginTop: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#666",
    marginTop: 16,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
    marginTop: 8,
    lineHeight: 20,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  filterModalContainer: {
    backgroundColor: "#fff",
    borderRadius: 16,
    margin: 20,
    width: "80%",
    maxHeight: "60%",
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
    fontWeight: "600",
    color: "#333",
  },
  filterOptionsContainer: {
    padding: 8,
  },
  filterOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderRadius: 8,
    marginVertical: 4,
  },
  filterOptionSelected: {
    backgroundColor: "#F0F7FF",
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