import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  Platform,
  Modal,
  TouchableWithoutFeedback,
  ScrollView,
  Animated,
  Alert,
  RefreshControl,
  Dimensions,
  Pressable,
  TextInput,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import { LinearGradient } from "expo-linear-gradient";
import {
  getAllDeletionRequests,
  getPendingDeletionRequests,
  manageDeletionRequestEnhanced,
  getDeletionRequestsStats,
  formatDeletionRequestsForDisplay,
} from "../../services/farmService";
import ScreenLayoutAdmin from "../../components/ScreenLayoutAdmin";
import CustomTabBarAdmin from "../../components/CustomTabBarAdmin";

// ✅ Constantes
const CONSTANTS = {
  ANIMATION_DURATION: 250,
  CARD_MARGIN: 12,
  BORDER_RADIUS: 16,
  ICON_SIZE: 20,
  AVATAR_SIZE: 40,
};

// ✅ Colores (mismo esquema del header)
const COLORS = {
  primary: "#284F66",
  primaryLight: "#3A6B87",
  primaryDark: "#1A3B4D",
  secondary: "#B6883E",
  secondaryLight: "#D4A45C",

  gray50: "#FAFBFC",
  gray100: "#F4F6F8",
  gray200: "#E5E8EB",
  gray300: "#D1D6DB",
  gray400: "#9DA4AE",
  gray500: "#6B7280",
  gray600: "#4B5563",
  gray700: "#374151",
  gray800: "#1F2937",
  gray900: "#111827",

  success: "#10B981",
  warning: "#F59E0B",
  error: "#EF4444",
  info: "#3B82F6",

  white: "#FFFFFF",
  surface: "#FEFEFE",
  overlay: "rgba(15, 23, 42, 0.6)",
  backdrop: "rgba(0, 0, 0, 0.4)",
  cardShadow: "rgba(0, 0, 0, 0.08)",
};

// ✅ Componente de Loading
const LoadingState = React.memo(() => {
  const pulseAnim = useMemo(() => new Animated.Value(0), []);

  useEffect(() => {
    const startPulse = () => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 0,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start();
    };
    startPulse();
  }, [pulseAnim]);

  return (
    <View style={styles.loadingContainer}>
      <Animated.View
        style={[
          styles.loadingDot,
          {
            opacity: pulseAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0.3, 1],
            }),
          },
        ]}
      />
      <Text style={styles.loadingText}>Cargando solicitudes...</Text>
    </View>
  );
});

// ✅ Componente de Error
const ErrorState = React.memo(({ error, onRetry }) => (
  <View style={styles.errorContainer}>
    <Icon name="error-outline" size={48} color={COLORS.error} />
    <Text style={styles.errorTitle}>Error al cargar</Text>
    <Text style={styles.errorMessage}>{error}</Text>
    <Pressable style={styles.retryButton} onPress={onRetry}>
      <Icon name="refresh" size={20} color={COLORS.white} />
      <Text style={styles.retryButtonText}>Reintentar</Text>
    </Pressable>
  </View>
));

// ✅ Componente de Estado Vacío
const EmptyState = React.memo(({ filter }) => (
  <View style={styles.emptyContainer}>
    <Icon name="inbox" size={48} color={COLORS.gray300} />
    <Text style={styles.emptyTitle}>
      {filter === "pending"
        ? "No hay solicitudes pendientes"
        : filter === "all"
        ? "No hay solicitudes"
        : `No hay solicitudes ${filter}`}
    </Text>
    <Text style={styles.emptySubtitle}>
      Las nuevas solicitudes aparecerán aquí
    </Text>
  </View>
));

// ✅ Componente de Estadísticas
const StatsCard = React.memo(({ stats }) => (
  <View style={styles.statsContainer}>
    <Text style={styles.statsTitle}>Resumen de Solicitudes</Text>
    <View style={styles.statsRow}>
      <View
        style={[styles.statItem, { backgroundColor: `${COLORS.warning}15` }]}>
        <Icon name="pending" size={24} color={COLORS.warning} />
        <Text style={styles.statNumber}>{stats.pending}</Text>
        <Text style={styles.statLabel}>Pendientes</Text>
      </View>
      <View
        style={[styles.statItem, { backgroundColor: `${COLORS.success}15` }]}>
        <Icon name="check-circle" size={24} color={COLORS.success} />
        <Text style={styles.statNumber}>{stats.approved}</Text>
        <Text style={styles.statLabel}>Aprobadas</Text>
      </View>
      <View style={[styles.statItem, { backgroundColor: `${COLORS.error}15` }]}>
        <Icon name="cancel" size={24} color={COLORS.error} />
        <Text style={styles.statNumber}>{stats.rejected}</Text>
        <Text style={styles.statLabel}>Rechazadas</Text>
      </View>
    </View>
  </View>
));

// ✅ Componente de Filtros
const FilterButtons = React.memo(({ currentFilter, onFilterChange }) => {
  const filters = [
    { key: "all", label: "Todas", icon: "list" },
    { key: "pending", label: "Pendientes", icon: "pending" },
    { key: "approved", label: "Aprobadas", icon: "check-circle" },
    { key: "rejected", label: "Rechazadas", icon: "cancel" },
  ];

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.filterContainer}
      contentContainerStyle={styles.filterContent}>
      {filters.map((filter) => (
        <Pressable
          key={filter.key}
          style={[
            styles.filterButton,
            currentFilter === filter.key && styles.filterButtonActive,
          ]}
          onPress={() => onFilterChange(filter.key)}>
          <Icon
            name={filter.icon}
            size={12}
            color={currentFilter === filter.key ? COLORS.white : COLORS.gray600}
          />
          <Text
            style={[
              styles.filterButtonText,
              currentFilter === filter.key && styles.filterButtonTextActive,
            ]}>
            {filter.label}
          </Text>
        </Pressable>
      ))}
    </ScrollView>
  );
});

// ✅ Componente de Tarjeta de Solicitud
const RequestCard = React.memo(({ request, onAction, onViewDetails }) => {
  const [isProcessing, setIsProcessing] = useState(false);

  const getStatusConfig = (status) => {
    const configs = {
      pending: {
        color: COLORS.warning,
        bg: `${COLORS.warning}15`,
        label: "Pendiente",
      },
      approved: {
        color: COLORS.success,
        bg: `${COLORS.success}15`,
        label: "Aprobada",
      },
      rejected: {
        color: COLORS.error,
        bg: `${COLORS.error}15`,
        label: "Rechazada",
      },
      cancelled: {
        color: COLORS.gray500,
        bg: `${COLORS.gray500}15`,
        label: "Cancelada",
      },
    };
    return configs[status] || configs.pending;
  };

  const statusConfig = getStatusConfig(request.status);

  const handleAction = async (action) => {
    if (isProcessing) return;

    setIsProcessing(true);
    try {
      await onAction(request.id, action);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Pressable
      style={styles.requestCard}
      onPress={() => onViewDetails(request)}>
      <View style={styles.requestHeader}>
        <View style={styles.requestMainInfo}>
          <Text style={styles.farmName} numberOfLines={1}>
            {request.farmName}
          </Text>
          <Text style={styles.userName} numberOfLines={1}>
            {request.userName}
          </Text>
          <Text style={styles.userEmail} numberOfLines={1}>
            {request.userEmail}
          </Text>
        </View>

        <View style={styles.requestMeta}>
          <View
            style={[styles.statusBadge, { backgroundColor: statusConfig.bg }]}>
            <Text style={[styles.statusText, { color: statusConfig.color }]}>
              {statusConfig.label}
            </Text>
          </View>
          <Text style={styles.timeAgo}>{request.timeAgo}</Text>
        </View>
      </View>

      {request.reason && (
        <View style={styles.reasonContainer}>
          <Icon name="message" size={16} color={COLORS.gray400} />
          <Text style={styles.reasonText} numberOfLines={2}>
            {request.reason}
          </Text>
        </View>
      )}

      <View style={styles.farmDetails}>
        <View style={styles.farmDetailItem}>
          <Icon name="landscape" size={16} color={COLORS.gray400} />
          <Text style={styles.farmDetailText}>
            {request.farmSize} hectáreas
          </Text>
        </View>
        <View style={styles.farmDetailItem}>
          <Icon name="event" size={16} color={COLORS.gray400} />
          <Text style={styles.farmDetailText}>
            {new Date(request.createdAt).toLocaleDateString()}
          </Text>
        </View>
      </View>

      {request.canBeProcessed && (
        <View style={styles.actionButtons}>
          <Pressable
            style={[
              styles.actionButton,
              styles.approveButton,
              isProcessing && styles.actionButtonDisabled,
            ]}
            onPress={() => handleAction("approve")}
            disabled={isProcessing}>
            <Icon name="check" size={18} color={COLORS.white} />
            <Text style={styles.actionButtonText}>Aprobar</Text>
          </Pressable>

          <Pressable
            style={[
              styles.actionButton,
              styles.rejectButton,
              isProcessing && styles.actionButtonDisabled,
            ]}
            onPress={() => handleAction("reject")}
            disabled={isProcessing}>
            <Icon name="close" size={18} color={COLORS.white} />
            <Text style={styles.actionButtonText}>Rechazar</Text>
          </Pressable>
        </View>
      )}
    </Pressable>
  );
});

// ✅ Modal de Detalles
const RequestDetailsModal = React.memo(
  ({ visible, request, onClose, onAction }) => {
    const [adminNotes, setAdminNotes] = useState("");
    const [isProcessing, setIsProcessing] = useState(false);

    if (!request) return null;

    const handleAction = async (action) => {
      if (isProcessing) return;

      const notes = adminNotes.trim() || null;

      Alert.alert(
        action === "approve" ? "Aprobar Solicitud" : "Rechazar Solicitud",
        `¿Estás seguro que deseas ${
          action === "approve" ? "aprobar" : "rechazar"
        } esta solicitud?`,
        [
          { text: "Cancelar", style: "cancel" },
          {
            text: action === "approve" ? "Aprobar" : "Rechazar",
            style: action === "approve" ? "default" : "destructive",
            onPress: async () => {
              setIsProcessing(true);
              try {
                await onAction(request.id, action, notes);
                onClose();
              } finally {
                setIsProcessing(false);
              }
            },
          },
        ]
      );
    };

    return (
      <Modal
        animationType="slide"
        transparent={true}
        visible={visible}
        onRequestClose={onClose}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Detalles de la Solicitud</Text>
              <Pressable style={styles.closeButton} onPress={onClose}>
                <Icon name="close" size={24} color={COLORS.gray600} />
              </Pressable>
            </View>

            <ScrollView
              style={styles.modalBody}
              showsVerticalScrollIndicator={false}>
              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>Finca</Text>
                <Text style={styles.detailValue}>{request.farmName}</Text>
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>Propietario</Text>
                <Text style={styles.detailValue}>{request.userName}</Text>
                <Text style={styles.detailSubValue}>{request.userEmail}</Text>
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>Tamaño de la finca</Text>
                <Text style={styles.detailValue}>
                  {request.farmSize} hectáreas
                </Text>
              </View>

              {request.reason && (
                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>Razón de eliminación</Text>
                  <Text style={styles.detailValue}>{request.reason}</Text>
                </View>
              )}

              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>Fecha de solicitud</Text>
                <Text style={styles.detailValue}>
                  {new Date(request.createdAt).toLocaleString()}
                </Text>
              </View>

              {request.canBeProcessed && (
                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>
                    Notas del administrador (opcional)
                  </Text>
                  <TextInput
                    style={styles.notesInput}
                    multiline
                    numberOfLines={4}
                    placeholder="Agregar notas sobre la decisión..."
                    value={adminNotes}
                    onChangeText={setAdminNotes}
                  />
                </View>
              )}
            </ScrollView>

            {request.canBeProcessed && (
              <View style={styles.modalActions}>
                <Pressable
                  style={[
                    styles.modalActionButton,
                    styles.approveButton,
                    isProcessing && styles.actionButtonDisabled,
                  ]}
                  onPress={() => handleAction("approve")}
                  disabled={isProcessing}>
                  <Icon name="check" size={18} color={COLORS.white} />
                  <Text style={styles.actionButtonText}>Aprobar</Text>
                </Pressable>

                <Pressable
                  style={[
                    styles.modalActionButton,
                    styles.rejectButton,
                    isProcessing && styles.actionButtonDisabled,
                  ]}
                  onPress={() => handleAction("reject")}
                  disabled={isProcessing}>
                  <Icon name="close" size={18} color={COLORS.white} />
                  <Text style={styles.actionButtonText}>Rechazar</Text>
                </Pressable>
              </View>
            )}
          </View>
        </View>
      </Modal>
    );
  }
);

// ✅ Componente Principal
const AdminDeletionRequests = ({ navigation }) => {
  // Estados
  const [requests, setRequests] = useState([]);
  const [stats, setStats] = useState({
    pending: 0,
    approved: 0,
    rejected: 0,
    total: 0,
  });
  const [currentFilter, setCurrentFilter] = useState("pending");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // ✅ Cargar datos iniciales
  useEffect(() => {
    loadInitialData();
  }, []);

  // ✅ Recargar cuando cambia el filtro
  useEffect(() => {
    if (!loading) {
      loadRequests();
    }
  }, [currentFilter]);

  const loadInitialData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [requestsResponse, statsResponse] = await Promise.allSettled([
        currentFilter === "all"
          ? getAllDeletionRequests()
          : currentFilter === "pending"
          ? getPendingDeletionRequests()
          : getAllDeletionRequests({ status: currentFilter }),
        getDeletionRequestsStats(),
      ]);

      if (requestsResponse.status === "fulfilled") {
        const formattedRequests = formatDeletionRequestsForDisplay(
          requestsResponse.value.data?.requests || []
        );
        setRequests(formattedRequests);
      }

      if (statsResponse.status === "fulfilled") {
        setStats(
          statsResponse.value.data || {
            pending: 0,
            approved: 0,
            rejected: 0,
            total: 0,
          }
        );
      }
    } catch (err) {
      console.error("Error loading initial data:", err);
      setError(err.message || "Error al cargar datos");
    } finally {
      setLoading(false);
    }
  }, [currentFilter]);

  const loadRequests = useCallback(async () => {
    try {
      setError(null);

      let response;
      if (currentFilter === "all") {
        response = await getAllDeletionRequests();
      } else if (currentFilter === "pending") {
        response = await getPendingDeletionRequests();
      } else {
        response = await getAllDeletionRequests({ status: currentFilter });
      }

      const formattedRequests = formatDeletionRequestsForDisplay(
        response.data?.requests || []
      );
      setRequests(formattedRequests);
    } catch (err) {
      console.error("Error loading requests:", err);
      setError(err.message || "Error al cargar solicitudes");
    }
  }, [currentFilter]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([loadRequests(), loadStats()]);
    } finally {
      setRefreshing(false);
    }
  }, [loadRequests]);

  const loadStats = useCallback(async () => {
    try {
      const response = await getDeletionRequestsStats();
      setStats(
        response.data || { pending: 0, approved: 0, rejected: 0, total: 0 }
      );
    } catch (err) {
      console.error("Error loading stats:", err);
    }
  }, []);

  const handleAction = useCallback(
    async (requestId, action, adminNotes = null) => {
      try {
        await manageDeletionRequestEnhanced(requestId, action, adminNotes);

        Alert.alert(
          "Éxito",
          `Solicitud ${
            action === "approve" ? "aprobada" : "rechazada"
          } correctamente`,
          [{ text: "OK" }]
        );

        // Recargar datos
        await Promise.all([loadRequests(), loadStats()]);
      } catch (err) {
        console.error("Error managing request:", err);
        Alert.alert("Error", err.message || "Error al procesar solicitud");
      }
    },
    [loadRequests, loadStats]
  );

  const handleViewDetails = useCallback((request) => {
    setSelectedRequest(request);
    setShowDetailsModal(true);
  }, []);

  const handleFilterChange = useCallback((filter) => {
    setCurrentFilter(filter);
  }, []);

  // ✅ Renderizado principal
  if (loading) {
    return (
      <View style={styles.container}>
        <LoadingState />
      </View>
    );
  }

  if (error && !refreshing) {
    return (
      <View style={styles.container}>
        <ErrorState error={error} onRetry={loadInitialData} />
      </View>
    );
  }

  return (
    <ScreenLayoutAdmin navigation={navigation}>
      <View style={styles.container}>
        {/* Header */}
        <LinearGradient
          colors={[COLORS.primary, COLORS.primaryLight]}
          style={styles.header}>
          <View style={styles.headerContent}>
            <Pressable
              style={styles.backButton}
              onPress={() => navigation.goBack()}>
              <Icon name="arrow-back" size={24} color={COLORS.white} />
            </Pressable>
            <Text style={styles.headerTitle}>Solicitudes de Eliminación</Text>
            <Pressable style={styles.refreshButton} onPress={handleRefresh}>
              <Icon name="refresh" size={24} color={COLORS.white} />
            </Pressable>
          </View>
        </LinearGradient>

        {/* Estadísticas */}
        <StatsCard stats={stats} />

        {/* Filtros */}
        <FilterButtons
          currentFilter={currentFilter}
          onFilterChange={handleFilterChange}
        />

        {/* Lista de solicitudes */}
        <ScrollView
          style={styles.requestsList}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
          showsVerticalScrollIndicator={false}>
          {requests.length === 0 ? (
            <EmptyState filter={currentFilter} />
          ) : (
            requests.map((request) => (
              <RequestCard
                key={request.id}
                request={request}
                onAction={handleAction}
                onViewDetails={handleViewDetails}
              />
            ))
          )}
        </ScrollView>

        {/* Modal de detalles */}
        <RequestDetailsModal
          visible={showDetailsModal}
          request={selectedRequest}
          onClose={() => setShowDetailsModal(false)}
          onAction={handleAction}
        />
      </View>
      <CustomTabBarAdmin
        state={{ index: 0, routes: [] }}
        navigation={navigation}
      />
    </ScreenLayoutAdmin>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.gray50,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 10,
    marginTop: 6,
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: COLORS.white,
    flex: 1,
    textAlign: "center",
    marginHorizontal: 16,
  },
  refreshButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },

  // Estados
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.primary,
    marginRight: 12,
  },
  loadingText: {
    fontSize: 16,
    color: COLORS.gray600,
    fontWeight: "500",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.gray800,
    marginTop: 16,
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 16,
    color: COLORS.gray600,
    textAlign: "center",
    marginBottom: 24,
  },
  retryButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
    paddingVertical: 48,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.gray700,
    marginTop: 12,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    color: COLORS.gray500,
    textAlign: "center",
  },

  statsContainer: {
    margin: 12,           // Cambiado de 5 a 12
    marginTop: 8,         // Añadir margen superior específico  
    marginBottom: 8,      // Cambiado de 0 a 8
    padding: 12,          // Cambiado de 5 a 12
    backgroundColor: COLORS.white,
    borderRadius: 12,
    ...Platform.select({
      ios: {
        shadowColor: COLORS.cardShadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  
  // 2. Filtros - Reducir altura y márgenes
  filterContainer: {
    marginBottom: 4,      // Cambiado de 8 a 4
    marginTop: 4,         // Añadir margen superior pequeño
    height: 28,           // Cambiado de 32 a 28
  },
  
  filterContent: {
    paddingHorizontal: 16,
    paddingVertical: 5,
    alignItems: "center",
  },
  
  // 3. Lista de solicitudes - Reducir padding superior
  requestsList: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 5,        // Cambiado de 4 a 0
  },
  
  // 4. Header - Reducir padding inferior
  header: {
    paddingTop: Platform.OS === "ios" ? 44 : 24,
    paddingBottom: 8,     // Cambiado de 15 a 8
  },
  
  // 5. Cards de solicitudes - Reducir margen inferior
  requestCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,      // Cambiado de 10 a 8
    ...Platform.select({
      ios: {
        shadowColor: COLORS.cardShadow,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  
  // 6. Estadísticas - Reducir padding interno
  statsTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.gray800,
    marginBottom: 8,      // Cambiado de 12 a 8
  },
  
  statItem: {
    flex: 1,
    alignItems: "center",
    padding: 8,           // Cambiado de 12 a 8
    borderRadius: 8,
    marginHorizontal: 2,
  },
  
  // 7. Filtros - Reducir altura de botones
  filterButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 3,   // Cambiado de 4 a 3
    marginRight: 6,
    borderRadius: 12,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.gray200,
    minWidth: 60,
    justifyContent: "center",
    height: 24,           // Cambiado de 28 a 24
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  statNumber: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.gray800,
    marginTop: 4,
  },
  statLabel: {
    fontSize: 11,
    color: COLORS.gray600,
    marginTop: 2,
    fontWeight: "500",
  },
  filterButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterButtonText: {
    fontSize: 11,
    fontWeight: "600",
    color: COLORS.gray600,
    marginLeft: 3,
  },
  filterButtonTextActive: {
    color: COLORS.white,
  },
  requestHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  requestMainInfo: {
    flex: 1,
    marginRight: 12,
  },
  farmName: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.gray800,
    marginBottom: 4,
  },
  userName: {
    fontSize: 14,
    fontWeight: "500",
    color: COLORS.gray600,
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 12,
    color: COLORS.gray500,
  },
  requestMeta: {
    alignItems: "flex-end",
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  timeAgo: {
    fontSize: 11,
    color: COLORS.gray400,
  },
  reasonContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: COLORS.gray50,
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  reasonText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.gray600,
    marginLeft: 8,
  },
  farmDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  farmDetailItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  farmDetailText: {
    fontSize: 12,
    color: COLORS.gray500,
    marginLeft: 4,
  },

  // Botones de acción
  actionButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  actionButtonDisabled: {
    opacity: 0.6,
  },
  approveButton: {
    backgroundColor: COLORS.success,
  },
  rejectButton: {
    backgroundColor: COLORS.error,
  },
  actionButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 6,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: COLORS.backdrop,
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "90%",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray200,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.gray800,
  },
  closeButton: {
    padding: 8,
  },
  modalBody: {
    padding: 20,
  },
  detailSection: {
    marginBottom: 20,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.gray600,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    color: COLORS.gray800,
  },
  detailSubValue: {
    fontSize: 14,
    color: COLORS.gray500,
    marginTop: 2,
  },
  notesInput: {
    borderWidth: 1,
    borderColor: COLORS.gray200,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: COLORS.gray800,
    textAlignVertical: "top",
    marginTop: 8,
  },
  modalActions: {
    flexDirection: "row",
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray200,
  },
  modalActionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 12,
    marginHorizontal: 6,
  },
});

export default React.memo(AdminDeletionRequests);
