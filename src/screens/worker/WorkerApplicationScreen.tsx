import React, { useState, useEffect } from "react";
import {
  Text,
  View,
  StyleSheet,
  ScrollView,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Modal,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import ScreenLayoutWorker from "../../components/ScreenLayoutWorker";
import { useAuth } from "../../context/AuthContext";
import { getWorkerApplications } from "../../services/workerService";
import { cancelApplication } from "../../services/applicationService";

const { width } = Dimensions.get("window");

// Paleta de colores moderna
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
};

export default function WorkerApplicationsScreen({ navigation }) {
  const [applications, setApplications] = useState([]);
  const [filteredApplications, setFilteredApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const { user } = useAuth();

  // Estados de aplicación disponibles
  const applicationStatuses = [
    { id: "all", label: "Todas", icon: "list", color: COLORS.textSecondary },
    {
      id: "Solicitado",
      label: "Pendientes",
      icon: "time",
      color: COLORS.warning,
    },
    {
      id: "En_revision",
      label: "En Revisión",
      icon: "eye",
      color: COLORS.secondary,
    },
    {
      id: "Aceptado",
      label: "Aceptadas",
      icon: "checkmark-circle",
      color: COLORS.success,
    },
    {
      id: "Rechazada",
      label: "Rechazadas",
      icon: "close-circle",
      color: COLORS.error,
    },
    {
      id: "Completado",
      label: "Completadas",
      icon: "trophy",
      color: COLORS.primary,
    },
  ];

  // Función para obtener el ID del trabajador
  const getWorkerId = async () => {
    try {
      if (!user?.workerProfile?.id) {
        throw new Error("El usuario no tiene perfil de trabajador");
      }
      return user.workerProfile.id;
    } catch (error) {
      console.error("Error obteniendo ID del trabajador:", error);
      throw error;
    }
  };

  // Cargar aplicaciones del trabajador - Versión corregida
  const loadApplications = async () => {
    try {
      setLoading(true);
      const workerId = await getWorkerId();
      const response = await getWorkerApplications(workerId);

      // Asegurarnos de que siempre trabajamos con un array
      const applicationsData = Array.isArray(response)
        ? response
        : response?.applications || response?.data || [];

      setApplications(applicationsData);
      setFilteredApplications(applicationsData);
    } catch (error) {
      console.error("Error cargando aplicaciones:", error);
      Alert.alert("Error", "No se pudieron cargar las postulaciones");
      setApplications([]);
      setFilteredApplications([]);
    } finally {
      setLoading(false);
    }
  };

  // Componente StatusFilters corregido
  const StatusFilters = () => {
    // Asegurarnos de que applications siempre es un array
    const safeApplications = Array.isArray(applications) ? applications : [];

    return (
      <View style={styles.statusFiltersContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersScrollContent}>
          {applicationStatuses.map((status) => {
            const count =
              status.id === "all"
                ? safeApplications.length
                : safeApplications.filter(
                    (app) => app?.status?.name === status.id
                  ).length;

            return (
              <TouchableOpacity
                key={status.id}
                style={[
                  styles.statusFilter,
                  selectedStatus === status.id && styles.activeStatusFilter,
                ]}
                onPress={() => filterApplicationsByStatus(status.id)}>
                <Ionicons
                  name={status.icon as keyof typeof Ionicons.glyphMap}
                  size={16}
                  color={
                    selectedStatus === status.id ? "#FFFFFF" : status.color
                  }
                />
                <Text
                  style={[
                    styles.statusFilterText,
                    selectedStatus === status.id &&
                      styles.activeStatusFilterText,
                  ]}>
                  {status.label}
                </Text>
                <View
                  style={[
                    styles.statusCount,
                    selectedStatus === status.id && styles.activeStatusCount,
                  ]}>
                  <Text
                    style={[
                      styles.statusCountText,
                      selectedStatus === status.id &&
                        styles.activeStatusCountText,
                    ]}>
                    {count}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    );
  };

  // Filtrar aplicaciones por estado
  const filterApplicationsByStatus = (status) => {
    setSelectedStatus(status);
    if (status === "all") {
      setFilteredApplications(applications);
    } else {
      const filtered = applications.filter(
        (app) => app.status?.name === status
      );
      setFilteredApplications(filtered);
    }
  };

  // Cancelar aplicación
  const handleCancelApplication = (applicationId) => {
    Alert.alert(
      "Cancelar Postulación",
      "¿Estás seguro de que quieres cancelar esta postulación? Esta acción no se puede deshacer.",
      [
        {
          text: "Cancelar",
          style: "cancel",
        },
        {
          text: "Confirmar",
          style: "destructive",
          onPress: async () => {
            try {
              await cancelApplication(applicationId);
              Alert.alert("Éxito", "La postulación ha sido cancelada");
              loadApplications(); // Recargar lista
            } catch (error) {
              Alert.alert("Error", "No se pudo cancelar la postulación");
              console.error("Error cancelando aplicación:", error);
            }
          },
        },
      ]
    );
  };

  // Ver detalles de aplicación
  const viewApplicationDetails = async (application) => {
    try {
      setSelectedApplication(application);
      setDetailModalVisible(true);
    } catch (error) {
      Alert.alert("Error", "No se pudieron cargar los detalles");
    }
  };

  // Refrescar datos
  const onRefresh = async () => {
    setRefreshing(true);
    await loadApplications();
    setRefreshing(false);
  };

  // Efectos
  useEffect(() => {
    loadApplications();
  }, []);

  // Función para obtener el color del estado
  const getStatusColor = (statusName) => {
    const status = applicationStatuses.find((s) => s.id === statusName);
    return status ? status.color : COLORS.textSecondary;
  };

  // Función para obtener el ícono del estado
  const getStatusIcon = (
    statusName: string
  ): keyof typeof Ionicons.glyphMap => {
    const status = applicationStatuses.find((s) => s.id === statusName);
    return status
      ? (status.icon as keyof typeof Ionicons.glyphMap)
      : "help-circle";
  };

  // Componente de tarjeta de aplicación
  const ApplicationCard = ({ item }) => {
    const canCancel = ["Solicitado", "En_revision"].includes(item.status?.name);
    const statusColor = getStatusColor(item.status?.name);
    const statusIcon = getStatusIcon(item.status?.name);

    return (
      <TouchableOpacity
        style={styles.applicationCard}
        onPress={() => viewApplicationDetails(item)}>
        <View style={styles.applicationHeader}>
          <View style={styles.applicationTitleContainer}>
            <Text style={styles.applicationTitle} numberOfLines={2}>
              {item.jobOffer?.title}
            </Text>
            <Text style={styles.employerName}>
              {item.jobOffer?.employer?.user?.name}
            </Text>
          </View>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: `${statusColor}15` },
            ]}>
            <Ionicons name={statusIcon} size={14} color={statusColor} />
            <Text style={[styles.statusText, { color: statusColor }]}>
              {item.status?.name}
            </Text>
          </View>
        </View>

        <View style={styles.applicationDetails}>
          <View style={styles.detailRow}>
            <Ionicons name="location" size={16} color={COLORS.textSecondary} />
            <Text style={styles.detailText}>
              {item.jobOffer?.displayLocation?.city},{" "}
              {item.jobOffer?.displayLocation?.department}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Ionicons name="leaf" size={16} color={COLORS.success} />
            <Text style={styles.detailText}>
              {item.jobOffer?.cropType?.name || "General"}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Ionicons name="cash" size={16} color={COLORS.secondary} />
            <Text style={styles.detailText}>
              ${new Intl.NumberFormat("es-CO").format(item.jobOffer?.salary)}
              /día
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Ionicons name="calendar" size={16} color={COLORS.textSecondary} />
            <Text style={styles.detailText}>
              {item.jobOffer?.duration} días
            </Text>
          </View>
        </View>

        <View style={styles.applicationFooter}>
          <Text style={styles.applicationDate}>
            Postulado el {new Date(item.createdAt).toLocaleDateString("es-CO")}
          </Text>
          <View style={styles.applicationActions}>
            <TouchableOpacity
              style={styles.detailsButton}
              onPress={() => viewApplicationDetails(item)}>
              <Text style={styles.detailsButtonText}>Ver Detalles</Text>
            </TouchableOpacity>
            {canCancel && (
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => handleCancelApplication(item.id)}>
                <Ionicons name="close" size={16} color={COLORS.error} />
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // Modal de detalles de aplicación
  const ApplicationDetailModal = () => {
    if (!selectedApplication) return null;

    const statusColor = getStatusColor(selectedApplication.status?.name);
    const statusIcon = getStatusIcon(selectedApplication.status?.name);

    return (
      <Modal
        animationType="slide"
        transparent={true}
        visible={detailModalVisible}
        onRequestClose={() => setDetailModalVisible(false)}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Detalles de Postulación</Text>
              <TouchableOpacity onPress={() => setDetailModalVisible(false)}>
                <Ionicons name="close" size={24} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {/* Estado actual */}
              <View style={styles.statusSection}>
                <View
                  style={[
                    styles.statusBadgeLarge,
                    { backgroundColor: `${statusColor}15` },
                  ]}>
                  <Ionicons name={statusIcon} size={20} color={statusColor} />
                  <Text
                    style={[styles.statusTextLarge, { color: statusColor }]}>
                    {selectedApplication.status?.name}
                  </Text>
                </View>
              </View>

              {/* Información del trabajo */}
              <View style={styles.detailSection}>
                <Text style={styles.sectionTitle}>Información del Trabajo</Text>
                <Text style={styles.jobTitleLarge}>
                  {selectedApplication.jobOffer?.title}
                </Text>
                <Text style={styles.employerNameLarge}>
                  {selectedApplication.jobOffer?.employer?.user?.name}
                </Text>

                <View style={styles.jobDetailsGrid}>
                  <View style={styles.jobDetailItem}>
                    <Ionicons
                      name="location"
                      size={18}
                      color={COLORS.textSecondary}
                    />
                    <Text style={styles.jobDetailLabel}>Ubicación</Text>
                    <Text style={styles.jobDetailValue}>
                      {selectedApplication.jobOffer?.displayLocation?.city},{" "}
                      {
                        selectedApplication.jobOffer?.displayLocation
                          ?.department
                      }
                    </Text>
                  </View>

                  <View style={styles.jobDetailItem}>
                    <Ionicons name="cash" size={18} color={COLORS.secondary} />
                    <Text style={styles.jobDetailLabel}>Salario</Text>
                    <Text style={styles.jobDetailValue}>
                      $
                      {new Intl.NumberFormat("es-CO").format(
                        selectedApplication.jobOffer?.salary
                      )}
                      /día
                    </Text>
                  </View>

                  <View style={styles.jobDetailItem}>
                    <Ionicons
                      name="calendar"
                      size={18}
                      color={COLORS.textSecondary}
                    />
                    <Text style={styles.jobDetailLabel}>Duración</Text>
                    <Text style={styles.jobDetailValue}>
                      {selectedApplication.jobOffer?.duration} días
                    </Text>
                  </View>

                  <View style={styles.jobDetailItem}>
                    <Ionicons name="leaf" size={18} color={COLORS.success} />
                    <Text style={styles.jobDetailLabel}>Cultivo</Text>
                    <Text style={styles.jobDetailValue}>
                      {selectedApplication.jobOffer?.cropType?.name ||
                        "General"}
                    </Text>
                  </View>
                </View>

                {selectedApplication.jobOffer?.description && (
                  <View style={styles.descriptionContainer}>
                    <Text style={styles.descriptionLabel}>Descripción</Text>
                    <Text style={styles.descriptionText}>
                      {selectedApplication.jobOffer.description}
                    </Text>
                  </View>
                )}
              </View>

              {/* Información de la postulación */}
              <View style={styles.detailSection}>
                <Text style={styles.sectionTitle}>
                  Información de Postulación
                </Text>
                <View style={styles.applicationInfo}>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Fecha de postulación:</Text>
                    <Text style={styles.infoValue}>
                      {new Date(
                        selectedApplication.createdAt
                      ).toLocaleDateString("es-CO", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>ID de postulación:</Text>
                    <Text style={styles.infoValue}>
                      #{selectedApplication.id.slice(-8)}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Información de contacto del empleador */}
              {selectedApplication.status?.name === "Aceptado" && (
                <View style={styles.detailSection}>
                  <Text style={styles.sectionTitle}>
                    Información de Contacto
                  </Text>
                  <View style={styles.contactInfo}>
                    <View style={styles.contactRow}>
                      <Ionicons
                        name="person"
                        size={18}
                        color={COLORS.primary}
                      />
                      <Text style={styles.contactText}>
                        {selectedApplication.jobOffer?.employer?.user?.name}
                      </Text>
                    </View>
                    {selectedApplication.jobOffer?.employer?.user?.email && (
                      <View style={styles.contactRow}>
                        <Ionicons
                          name="mail"
                          size={18}
                          color={COLORS.primary}
                        />
                        <Text style={styles.contactText}>
                          {selectedApplication.jobOffer.employer.user.email}
                        </Text>
                      </View>
                    )}
                    {selectedApplication.jobOffer?.employer?.user?.phone && (
                      <View style={styles.contactRow}>
                        <Ionicons
                          name="call"
                          size={18}
                          color={COLORS.primary}
                        />
                        <Text style={styles.contactText}>
                          {selectedApplication.jobOffer.employer.user.phone}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              )}
            </ScrollView>

            {/* Acciones del modal */}
            <View style={styles.modalFooter}>
              {["Solicitado", "En_revision"].includes(
                selectedApplication.status?.name
              ) && (
                <TouchableOpacity
                  style={styles.cancelButtonModal}
                  onPress={() => {
                    setDetailModalVisible(false);
                    handleCancelApplication(selectedApplication.id);
                  }}>
                  <Ionicons
                    name="close-circle"
                    size={20}
                    color={COLORS.error}
                  />
                  <Text style={styles.cancelButtonModalText}>
                    Cancelar Postulación
                  </Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={styles.viewJobButton}
                onPress={() => {
                  setDetailModalVisible(false);
                  navigation.navigate("JobOfferDetail", {
                    jobOfferId: selectedApplication.jobOffer?.id,
                  });
                }}>
                <Ionicons name="eye" size={20} color={COLORS.primary} />
                <Text style={styles.viewJobButtonText}>Ver Oferta</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  if (loading) {
    return (
      <ScreenLayoutWorker navigation={navigation}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Cargando postulaciones...</Text>
        </View>
      </ScreenLayoutWorker>
    );
  }

  return (
    <ScreenLayoutWorker navigation={navigation}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Mis Postulaciones</Text>
          <Text style={styles.headerSubtitle}>
            {applications.length} postulaciones realizadas
          </Text>
        </View>

        {/* Filtros de estado */}
        <StatusFilters />

        <FlatList
          data={filteredApplications}
          renderItem={({ item }) => <ApplicationCard item={item} />}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[COLORS.primary]}
            />
          }
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.applicationsList,
            filteredApplications.length === 0 && styles.emptyListContainer,
          ]}
          ListEmptyComponent={() => (
            <View style={styles.emptyStateContainer}>
              <Ionicons
                name="paper-plane-outline"
                size={64}
                color={COLORS.textLight}
              />
              <Text style={styles.emptyStateText}>
                {selectedStatus === "all"
                  ? "No tienes postulaciones aún"
                  : `No tienes postulaciones ${applicationStatuses
                      .find((s) => s.id === selectedStatus)
                      ?.label.toLowerCase()}`}
              </Text>
              <Text style={styles.emptyStateSubtext}>
                {selectedStatus === "all"
                  ? "Busca ofertas de trabajo y postúlate"
                  : "Cambia el filtro para ver otras postulaciones"}
              </Text>
              <TouchableOpacity
                style={styles.searchJobsButton}
                onPress={() => navigation.navigate("WorkerJobs")}>
                <Text style={styles.searchJobsButtonText}>Buscar Trabajos</Text>
              </TouchableOpacity>
            </View>
          )}
        />
        {/* Modal de detalles */}
        <ApplicationDetailModal />
      </View>
    </ScreenLayoutWorker>
  );
}

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
    marginTop: 12,
    fontSize: 16,
    color: COLORS.textSecondary,
  },

  filtersScrollContent: {
    alignItems: "center", // Centrar verticalmente los filtros
  },
  header: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  statusFiltersContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  statusFilter: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    gap: 6,
  },
  activeStatusFilter: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  statusFilterText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: "500",
  },
  activeStatusFilterText: {
    color: "#FFFFFF",
  },
  statusCount: {
    backgroundColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: "center",
  },
  activeStatusCount: {
    backgroundColor: "rgba(255,255,255,0.3)",
  },
  statusCountText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: "600",
  },
  activeStatusCountText: {
    color: "#FFFFFF",
  },
  applicationsList: {
    padding: 20,
  },
  applicationCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  applicationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  applicationTitleContainer: {
    flex: 1,
    marginRight: 12,
  },
  applicationTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 4,
    lineHeight: 24,
  },
  employerName: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: "500",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  applicationDetails: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    minWidth: "48%",
  },
  detailText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    flex: 1,
  },
  applicationFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  applicationDate: {
    fontSize: 12,
    color: COLORS.textLight,
  },
  applicationActions: {
    flexDirection: "row",
    gap: 8,
  },
  detailsButton: {
    backgroundColor: `${COLORS.primary}15`,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  detailsButtonText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: "600",
  },
  cancelButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: `${COLORS.error}15`,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 4,
  },
  cancelButtonText: {
    color: COLORS.error,
    fontSize: 12,
    fontWeight: "600",
  },
  emptyStateContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 18,
    color: COLORS.textSecondary,
    marginTop: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: COLORS.textLight,
    marginTop: 8,
    textAlign: "center",
    marginBottom: 20,
  },
  searchJobsButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  searchJobsButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "90%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: COLORS.text,
  },
  modalBody: {
    flex: 1,
  },
  statusSection: {
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  statusBadgeLarge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 16,
    gap: 8,
  },
  statusTextLarge: {
    fontSize: 16,
    fontWeight: "600",
  },
  detailSection: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 16,
  },
  jobTitleLarge: {
    fontSize: 20,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 4,
  },
  employerNameLarge: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginBottom: 20,
  },
  jobDetailsGrid: {
    gap: 16,
  },
  jobDetailItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  jobDetailLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
    minWidth: 80,
  },
  jobDetailValue: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: "500",
    flex: 1,
  },
  descriptionContainer: {
    marginTop: 16,
  },
  descriptionLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 8,
  },
  descriptionText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  applicationInfo: {
    gap: 12,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  infoLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  infoValue: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: "500",
  },
  contactInfo: {
    gap: 12,
  },
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  contactText: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: "500",
  },
  modalFooter: {
    flexDirection: "row",
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  cancelButtonModal: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: `${COLORS.error}15`,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  cancelButtonModalText: {
    color: COLORS.error,
    fontSize: 16,
    fontWeight: "600",
  },
  viewJobButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: `${COLORS.primary}15`,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  viewJobButtonText: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: "600",
  },
  emptyListContainer: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
