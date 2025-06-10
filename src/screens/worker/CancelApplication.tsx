import React, { useState, useEffect } from "react";
import {
  Text,
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Modal,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import ScreenLayoutWorker from "../../components/ScreenLayoutWorker";
import CustomTabBarWorker from "../../components/CustomTabBarWorker";
import { useAuth } from "../../context/AuthContext";
import { getWorkerApplications } from "../../services/workerService";
import { cancelApplication } from "../../services/applicationService";

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
  info: "#3B82F6",
};

const CancelApplication = ({ navigation }) => {
  const [applications, setApplications] = useState([]);
  const [cancelableApplications, setCancelableApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [cancelingId, setCancelingId] = useState(null);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const { user } = useAuth();

  // Estados que pueden ser cancelados
  const CANCELABLE_STATUSES = ["Solicitado", "En_revision"];

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

  // Cargar aplicaciones cancelables
  const loadCancelableApplications = async () => {
    try {
      setLoading(true);
      const workerId = await getWorkerId();
      const response = await getWorkerApplications(workerId);

      const applicationsData = Array.isArray(response)
        ? response
        : response?.applications || response?.data || [];

      console.log("📋 All applications loaded:", applicationsData.length);
      setApplications(applicationsData);

      // Filtrar solo aplicaciones cancelables
      const cancelable = applicationsData.filter(app => 
        CANCELABLE_STATUSES.includes(app.status?.name)
      );

      console.log("🚫 Cancelable applications:", cancelable.length);
      setCancelableApplications(cancelable);
    } catch (error) {
      console.error("Error cargando aplicaciones:", error);
      Alert.alert("Error", "No se pudieron cargar las postulaciones");
      setApplications([]);
      setCancelableApplications([]);
    } finally {
      setLoading(false);
    }
  };

  // Función para mostrar modal de confirmación
  const showCancelConfirmation = (application) => {
    setSelectedApplication(application);
    setConfirmModalVisible(true);
  };

  // Función para cancelar aplicación
  const handleCancelApplication = async () => {
    if (!selectedApplication) return;

    try {
      setCancelingId(selectedApplication.id);
      setConfirmModalVisible(false);
      
      console.log("🚫 Canceling application:", selectedApplication.id);
      await cancelApplication(selectedApplication.id);
      
      Alert.alert(
        "✅ Postulación Cancelada", 
        "Tu postulación ha sido cancelada exitosamente.",
        [
          {
            text: "OK",
            onPress: () => {
              // Recargar lista para mostrar cambios
              loadCancelableApplications();
            }
          }
        ]
      );
      
    } catch (error) {
      console.error("❌ Error cancelando aplicación:", error);
      const errorMessage = error.message || "No se pudo cancelar la postulación. Intenta de nuevo.";
      
      Alert.alert(
        "❌ Error", 
        errorMessage,
        [
          {
            text: "Reintentar",
            onPress: () => handleCancelApplication()
          },
          {
            text: "Cancelar",
            style: "cancel"
          }
        ]
      );
    } finally {
      setCancelingId(null);
      setSelectedApplication(null);
    }
  };

  // Refrescar datos
  const onRefresh = async () => {
    setRefreshing(true);
    await loadCancelableApplications();
    setRefreshing(false);
  };

  // Cargar datos iniciales
  useEffect(() => {
    loadCancelableApplications();
  }, []);

  // Función para obtener color del estado
  const getStatusColor = (statusName) => {
    switch (statusName) {
      case "Solicitado":
        return COLORS.warning;
      case "En_revision":
        return COLORS.info;
      default:
        return COLORS.textLight;
    }
  };

  // Función para obtener ícono del estado
  const getStatusIcon = (statusName) => {
    switch (statusName) {
      case "Solicitado":
        return "time-outline";
      case "En_revision":
        return "eye-outline";
      default:
        return "help-circle";
    }
  };

  // Componente de tarjeta de aplicación
  const ApplicationCard = ({ item }) => {
    const statusColor = getStatusColor(item.status?.name);
    const statusIcon = getStatusIcon(item.status?.name);
    const isCanceling = cancelingId === item.id;

    return (
      <View style={styles.applicationCard}>
        {/* Indicador de estado lateral */}
        <View 
          style={[
            styles.statusIndicator, 
            { backgroundColor: statusColor }
          ]} 
        />

        <View style={styles.cardContent}>
          <View style={styles.applicationHeader}>
            <View style={styles.applicationTitleContainer}>
              <Text style={styles.applicationTitle} numberOfLines={2}>
                {item.jobOffer?.title || "Trabajo"}
              </Text>
              <Text style={styles.employerName}>
                {item.jobOffer?.employer?.user?.name || "Empleador"}
              </Text>
            </View>
            
            <View
              style={[
                styles.statusBadge,
                { 
                  backgroundColor: `${statusColor}15`,
                  borderColor: statusColor,
                }
              ]}>
              <Ionicons 
                name={statusIcon} 
                size={14} 
                color={statusColor} 
              />
              <Text style={[
                styles.statusText, 
                { color: statusColor }
              ]}>
                {item.status?.name === "Solicitado" ? "Pendiente" : "En Revisión"}
              </Text>
            </View>
          </View>

          <View style={styles.applicationDetails}>
            <View style={styles.detailRow}>
              <View style={styles.detailItem}>
                <Ionicons name="location" size={16} color={COLORS.textSecondary} />
                <Text style={styles.detailText} numberOfLines={1}>
                  {item.jobOffer?.displayLocation?.city || item.jobOffer?.city || "N/A"}, {" "}
                  {item.jobOffer?.displayLocation?.department || item.jobOffer?.state || "N/A"}
                </Text>
              </View>
              
              <View style={styles.detailItem}>
                <Ionicons name="cash" size={16} color={COLORS.secondary} />
                <Text style={styles.detailText}>
                  ${new Intl.NumberFormat("es-CO").format(item.jobOffer?.salary || 0)}/día
                </Text>
              </View>
            </View>

            <View style={styles.detailRow}>
              <View style={styles.detailItem}>
                <Ionicons name="leaf" size={16} color={COLORS.success} />
                <Text style={styles.detailText} numberOfLines={1}>
                  {item.jobOffer?.cropType?.name || "General"}
                </Text>
              </View>
              
              <View style={styles.detailItem}>
                <Ionicons name="calendar" size={16} color={COLORS.textSecondary} />
                <Text style={styles.detailText}>
                  {item.jobOffer?.duration || 0} días
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.applicationFooter}>
            <View style={styles.dateContainer}>
              <Ionicons name="calendar" size={14} color={COLORS.textLight} />
              <Text style={styles.dateText}>
                Postulado: {new Date(item.createdAt).toLocaleDateString("es-CO", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric"
                })}
              </Text>
            </View>
            
            <TouchableOpacity
              style={[
                styles.cancelButton,
                isCanceling && styles.cancelButtonDisabled
              ]}
              onPress={() => showCancelConfirmation(item)}
              disabled={isCanceling}
            >
              {isCanceling ? (
                <ActivityIndicator size="small" color={COLORS.error} />
              ) : (
                <>
                  <Ionicons name="close-circle" size={16} color={COLORS.error} />
                  <Text style={styles.cancelButtonText}>Cancelar</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  // Modal de confirmación
  const ConfirmationModal = () => (
    <Modal
      animationType="fade"
      transparent={true}
      visible={confirmModalVisible}
      onRequestClose={() => setConfirmModalVisible(false)}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Ionicons name="warning" size={48} color={COLORS.warning} />
            <Text style={styles.modalTitle}>Cancelar Postulación</Text>
          </View>

          {selectedApplication && (
            <View style={styles.modalBody}>
              <Text style={styles.modalText}>
                ¿Estás seguro de que quieres cancelar tu postulación para:
              </Text>
              <Text style={styles.modalJobTitle}>
                "{selectedApplication.jobOffer?.title}"
              </Text>
              <Text style={styles.modalEmployer}>
                en {selectedApplication.jobOffer?.employer?.user?.name}
              </Text>
              <Text style={styles.modalWarning}>
                Esta acción no se puede deshacer.
              </Text>
            </View>
          )}

          <View style={styles.modalActions}>
            <TouchableOpacity
              style={styles.modalCancelButton}
              onPress={() => setConfirmModalVisible(false)}
            >
              <Text style={styles.modalCancelText}>No, mantener</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.modalConfirmButton}
              onPress={handleCancelApplication}
            >
              <Ionicons name="close-circle" size={18} color="#FFFFFF" />
              <Text style={styles.modalConfirmText}>Sí, cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  if (loading) {
    return (
      <ScreenLayoutWorker navigation={navigation}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Cargando postulaciones...</Text>
        </View>
        <CustomTabBarWorker
          navigation={navigation}
          currentRoute="CancelApplication"
        />
      </ScreenLayoutWorker>
    );
  }

  return (
    <ScreenLayoutWorker navigation={navigation}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Cancelar Postulaciones</Text>
          <Text style={styles.headerSubtitle}>
            {cancelableApplications.length} postulaciones pueden ser canceladas
          </Text>
        </View>

        {/* Lista de aplicaciones cancelables */}
        <FlatList
          data={cancelableApplications}
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
            cancelableApplications.length === 0 && styles.emptyListContainer,
          ]}
          ListEmptyComponent={() => (
            <View style={styles.emptyStateContainer}>
              <View style={styles.emptyIconContainer}>
                <Ionicons
                  name="checkmark-circle-outline"
                  size={64}
                  color={COLORS.success}
                />
              </View>
              <Text style={styles.emptyStateText}>
                No tienes postulaciones para cancelar
              </Text>
              <Text style={styles.emptyStateSubtext}>
                Todas tus postulaciones están en estados que no permiten cancelación o ya han sido procesadas.
              </Text>
              <TouchableOpacity
                style={styles.viewAllButton}
                onPress={() => navigation.navigate("WorkerApplications")}>
                <Ionicons name="list" size={18} color={COLORS.primary} />
                <Text style={styles.viewAllButtonText}>Ver Todas las Postulaciones</Text>
              </TouchableOpacity>
            </View>
          )}
        />
        <ConfirmationModal />
      </View>
      
      <CustomTabBarWorker
        navigation={navigation}
        currentRoute="CancelApplication"
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
    marginTop: 12,
    fontSize: 16,
    color: COLORS.textSecondary,
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
  applicationsList: {
    padding: 20,
  },
  emptyListContainer: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  
  // Estilos de tarjeta
  applicationCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: "hidden",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  statusIndicator: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    zIndex: 1,
  },
  cardContent: {
    padding: 20,
    paddingLeft: 24,
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
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  
  // Detalles de aplicación
  applicationDetails: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: "row",
    marginBottom: 8,
  },
  detailItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginRight: 8,
  },
  detailText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    flex: 1,
    fontWeight: "500",
  },
  
  applicationFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dateContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  dateText: {
    fontSize: 12,
    color: COLORS.textLight,
    fontWeight: "500",
  },
  cancelButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: `${COLORS.error}15`,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: `${COLORS.error}30`,
    gap: 6,
  },
  cancelButtonDisabled: {
    opacity: 0.6,
  },
  cancelButtonText: {
    color: COLORS.error,
    fontSize: 14,
    fontWeight: "600",
  },
  
  // Estados vacíos
  emptyStateContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: `${COLORS.success}15`,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  emptyStateText: {
    fontSize: 20,
    color: COLORS.text,
    marginBottom: 12,
    fontWeight: "600",
    textAlign: "center",
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: COLORS.textLight,
    marginBottom: 24,
    textAlign: "center",
    lineHeight: 20,
  },
  viewAllButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: `${COLORS.primary}15`,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: `${COLORS.primary}30`,
    gap: 8,
  },
  viewAllButtonText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: "600",
  },

  // Estilos del modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  modalContent: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 24,
    width: "100%",
    maxWidth: 400,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  modalHeader: {
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.text,
    marginTop: 12,
  },
  modalBody: {
    marginBottom: 24,
  },
  modalText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 12,
  },
  modalJobTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.text,
    textAlign: "center",
    marginBottom: 4,
  },
  modalEmployer: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: "center",
    marginBottom: 16,
  },
  modalWarning: {
    fontSize: 14,
    color: COLORS.warning,
    textAlign: "center",
    fontWeight: "600",
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
  },
  modalCancelText: {
    color: COLORS.textSecondary,
    fontSize: 16,
    fontWeight: "600",
  },
  modalConfirmButton: {
    flex: 1,
    flexDirection: "row",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: COLORS.error,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  modalConfirmText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default CancelApplication;