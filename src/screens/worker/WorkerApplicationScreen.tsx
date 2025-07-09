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
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import ScreenLayoutWorker from "../../components/ScreenLayoutWorker";
import { useAuth } from "../../context/AuthContext";
import { getMyApplications } from "../../services/workerService";
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
  purple: "#8B5CF6",
};

export default function WorkerApplicationsScreen({ navigation }) {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [activeTab, setActiveTab] = useState("active"); // "active" o "history"
  const [selectedStatusFilter, setSelectedStatusFilter] = useState("todos");
  const [showFilters, setShowFilters] = useState(false);
  const { user } = useAuth();

  // 🔥 ACTUALIZADO - Estados basados en la respuesta real del backend
  const applicationStatuses = [
    {
      id: "Solicitado",
      label: "Pendiente",
      icon: "time-outline",
      color: COLORS.warning,
      bgColor: "#FEF3C7",
      textColor: "#92400E",
      gradient: ["#FEF3C7", "#FDE68A"],
      category: "active"
    },
    {
      id: "En_revision",
      label: "En Revisión",
      icon: "eye-outline",
      color: COLORS.info,
      bgColor: "#DBEAFE",
      textColor: "#1E40AF",
      gradient: ["#DBEAFE", "#BFDBFE"],
      category: "active"
    },
    {
      id: "Aceptado",
      label: "Aceptada",
      icon: "checkmark-circle",
      color: COLORS.success,
      bgColor: "#D1FAE5",
      textColor: "#065F46",
      gradient: ["#D1FAE5", "#A7F3D0"],
      category: "active"
    },
    {
      id: "Aceptada", // 🔥 NUEVO - Estado adicional del backend
      label: "Aceptada",
      icon: "checkmark-circle",
      color: COLORS.success,
      bgColor: "#D1FAE5",
      textColor: "#065F46",
      gradient: ["#D1FAE5", "#A7F3D0"],
      category: "active"
    },
    {
      id: "Completado",
      label: "Completada",
      icon: "trophy",
      color: COLORS.purple,
      bgColor: "#EDE9FE",
      textColor: "#5B21B6",
      gradient: ["#EDE9FE", "#DDD6FE"],
      category: "active"
    },
    {
      id: "Cancelada",
      label: "Cancelada",
      icon: "close-circle-outline",
      color: COLORS.textLight,
      bgColor: "#F3F4F6",
      textColor: "#374151",
      gradient: ["#F3F4F6", "#E5E7EB"],
      category: "history"
    },
    {
      id: "Rechazada",
      label: "Rechazada",
      icon: "close-circle",
      color: COLORS.error,
      bgColor: "#FEE2E2",
      textColor: "#991B1B",
      gradient: ["#FEE2E2", "#FECACA"],
      category: "history"
    },
  ];

  // 🔥 ACTUALIZADO - Cargar aplicaciones usando la nueva API
  const loadApplications = async () => {
    try {
      setLoading(true);
      
      console.log("🔄 Loading applications...");
      const response = await getMyApplications();
      
      console.log("📋 Raw API response:", response);
      
      // La respuesta tiene la estructura: { total: X, applications: [...] }
      const applicationsData = response?.applications || [];
      
      console.log("📋 Applications loaded:", applicationsData.length);
      console.log("📋 First application:", applicationsData[0]);
      
      setApplications(applicationsData);
    } catch (error) {
      console.error("❌ Error cargando aplicaciones:", error);
      Alert.alert("Error", "No se pudieron cargar las postulaciones");
      setApplications([]);
    } finally {
      setLoading(false);
    }
  };

  // 🔥 ACTUALIZADO - Obtener estados únicos de las aplicaciones
  const getAvailableStatuses = () => {
    const statuses = applications.map(app => app.status?.name).filter(Boolean);
    const uniqueStatuses = [...new Set(statuses)];
    
    console.log("📊 Available statuses:", uniqueStatuses);
    
    return uniqueStatuses.map(statusName => {
      const config = applicationStatuses.find(s => s.id === statusName) || {
        id: statusName,
        label: statusName,
        icon: "help-circle",
        color: COLORS.textSecondary,
        category: "active"
      };
      return config;
    });
  };

  // 🔥 ACTUALIZADO - Función de filtrado mejorada
  const getFilteredApplications = () => {
    let filtered = applications;

    // Filtrar por categoría (active/history)
    if (activeTab === "active") {
      filtered = filtered.filter(app => {
        const status = app.status?.name;
        return ['Solicitado', 'En_revision', 'Aceptado', 'Aceptada', 'Completado'].includes(status);
      });
    } else {
      filtered = filtered.filter(app => {
        const status = app.status?.name;
        return ['Cancelada', 'Rechazada'].includes(status);
      });
    }

    // Filtrar por estado específico
    if (selectedStatusFilter !== "todos") {
      filtered = filtered.filter(app => app.status?.name === selectedStatusFilter);
    }

    console.log(`📊 Filtered applications (${activeTab}, ${selectedStatusFilter}):`, filtered.length);
    return filtered;
  };

  const currentApplications = getFilteredApplications();

  // 🔥 ACTUALIZADO - Componente de filtros de estado
  const StatusFilters = () => {
    const availableStatuses = getAvailableStatuses();
    const statusesForCurrentTab = availableStatuses.filter(status => {
      if (activeTab === "active") {
        return ['Solicitado', 'En_revision', 'Aceptado', 'Aceptada', 'Completado'].includes(status.id);
      } else {
        return ['Cancelada', 'Rechazada'].includes(status.id);
      }
    });

    if (statusesForCurrentTab.length === 0) return null;

    return (
      <View style={styles.filtersContainer}>
        <TouchableOpacity
          style={styles.filterToggle}
          onPress={() => setShowFilters(!showFilters)}
        >
          <Ionicons name="filter" size={16} color={COLORS.primary} />
          <Text style={styles.filterToggleText}>Filtrar por estado</Text>
          <Ionicons 
            name={showFilters ? "chevron-up" : "chevron-down"} 
            size={16} 
            color={COLORS.primary} 
          />
        </TouchableOpacity>

        {showFilters && (
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.statusFiltersScroll}
            contentContainerStyle={styles.statusFiltersContainer}
          >
            <TouchableOpacity
              style={[
                styles.statusFilterChip,
                selectedStatusFilter === "todos" && styles.statusFilterChipActive
              ]}
              onPress={() => setSelectedStatusFilter("todos")}
            >
              <Ionicons 
                name="apps" 
                size={14} 
                color={selectedStatusFilter === "todos" ? "#FFFFFF" : COLORS.textSecondary} 
              />
              <Text style={[
                styles.statusFilterChipText,
                selectedStatusFilter === "todos" && styles.statusFilterChipTextActive
              ]}>
                Todos
              </Text>
            </TouchableOpacity>

            {statusesForCurrentTab.map((statusConfig) => (
              <TouchableOpacity
                key={statusConfig.id}
                style={[
                  styles.statusFilterChip,
                  selectedStatusFilter === statusConfig.id && styles.statusFilterChipActive,
                  selectedStatusFilter === statusConfig.id && { backgroundColor: statusConfig.color }
                ]}
                onPress={() => setSelectedStatusFilter(statusConfig.id)}
              >
                <Ionicons 
                  name={statusConfig.icon as keyof typeof Ionicons.glyphMap} 
                  size={14} 
                  color={selectedStatusFilter === statusConfig.id ? "#FFFFFF" : statusConfig.color} 
                />
                <Text style={[
                  styles.statusFilterChipText,
                  selectedStatusFilter === statusConfig.id && styles.statusFilterChipTextActive
                ]}>
                  {statusConfig.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>
    );
  };

  // 🔥 ACTUALIZADO - Componente de tabs mejorado
  const TabSelector = () => {
    const activeApplications = applications.filter(app => {
      const status = app.status?.name;
      return ['Solicitado', 'En_revision', 'Aceptado', 'Aceptada', 'Completado'].includes(status);
    });

    const historyApplications = applications.filter(app => {
      const status = app.status?.name;
      return ['Cancelada', 'Rechazada'].includes(status);
    });

    return (
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === "active" && styles.activeTab
          ]}
          onPress={() => {
            setActiveTab("active");
            setSelectedStatusFilter("todos");
          }}
        >
          <Ionicons 
            name="briefcase" 
            size={20} 
            color={activeTab === "active" ? "#FFFFFF" : COLORS.textSecondary} 
          />
          <Text style={[
            styles.tabText,
            activeTab === "active" && styles.activeTabText
          ]}>
            Activas
          </Text>
          <View style={styles.tabBadge}>
            <Text style={[
              styles.tabBadgeText,
              activeTab === "active" && styles.activeTabBadgeText
            ]}>
              {activeApplications.length}
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === "history" && styles.activeTab
          ]}
          onPress={() => {
            setActiveTab("history");
            setSelectedStatusFilter("todos");
          }}
        >
          <Ionicons 
            name="archive" 
            size={20} 
            color={activeTab === "history" ? "#FFFFFF" : COLORS.textSecondary} 
          />
          <Text style={[
            styles.tabText,
            activeTab === "history" && styles.activeTabText
          ]}>
            Historial
          </Text>
          <View style={styles.tabBadge}>
            <Text style={[
              styles.tabBadgeText,
              activeTab === "history" && styles.activeTabBadgeText
            ]}>
              {historyApplications.length}
            </Text>
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  // Handler para cancelar aplicación
  const handleCancelApplication = (applicationId) => {
    Alert.alert(
      "Cancelar Postulación",
      "¿Estás seguro de que quieres cancelar esta postulación? Esta acción no se puede deshacer.",
      [
        {
          text: "No",
          style: "cancel",
        },
        {
          text: "Sí, cancelar",
          style: "destructive",
          onPress: async () => {
            try {
              console.log("🚫 Canceling application:", applicationId);
              await cancelApplication(applicationId);
              
              Alert.alert(
                "✅ Éxito", 
                "La postulación ha sido cancelada exitosamente",
                [
                  {
                    text: "OK",
                    onPress: () => {
                      loadApplications();
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
                    onPress: () => handleCancelApplication(applicationId)
                  },
                  {
                    text: "Cancelar",
                    style: "cancel"
                  }
                ]
              );
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

  // 🔥 ACTUALIZADO - Función para obtener configuración del estado
  const getStatusConfig = (statusName) => {
    return applicationStatuses.find((s) => s.id === statusName) || {
      id: statusName,
      label: statusName,
      icon: "help-circle",
      color: COLORS.textSecondary,
      bgColor: "#F3F4F6",
      textColor: "#374151",
      gradient: ["#F3F4F6", "#E5E7EB"],
      category: "active"
    };
  };

  // 🔥 ACTUALIZADO - Componente de tarjeta de aplicación
  const ApplicationCard = ({ item, index }) => {
    const statusConfig = getStatusConfig(item.status?.name);
    const canCancel = ["Solicitado", "En_revision"].includes(item.status?.name);
    const isHistory = statusConfig.category === "history";

    const cardOpacity = isHistory ? 0.7 : 1;
    const cardScale = isHistory ? 0.98 : 1;

    return (
      <Animated.View
        style={[
          styles.applicationCard,
          { 
            opacity: cardOpacity,
            transform: [{ scale: cardScale }]
          },
          isHistory && styles.historyCard
        ]}
      >
        <TouchableOpacity
          onPress={() => viewApplicationDetails(item)}
          activeOpacity={0.7}
        >
          <View 
            style={[
              styles.statusIndicator, 
              { backgroundColor: statusConfig.color }
            ]} 
          />

          <View style={styles.cardContent}>
            <View style={styles.applicationHeader}>
              <View style={styles.applicationTitleContainer}>
                <Text style={styles.applicationTitle} numberOfLines={2}>
                  {item.jobOffer?.title || "Trabajo"}
                </Text>
                <Text style={styles.employerName}>
                  {item.jobOffer?.employer?.user?.name} {item.jobOffer?.employer?.user?.lastname || ""}
                </Text>
              </View>
              
              <View
                style={[
                  styles.statusBadge,
                  { 
                    backgroundColor: statusConfig.bgColor,
                    borderColor: statusConfig.color,
                  }
                ]}>
                <Ionicons 
                  name={statusConfig.icon as keyof typeof Ionicons.glyphMap} 
                  size={14} 
                  color={statusConfig.color} 
                />
                <Text style={[
                  styles.statusText, 
                  { color: statusConfig.textColor }
                ]}>
                  {statusConfig.label}
                </Text>
              </View>
            </View>

            <View style={styles.applicationDetails}>
              <View style={styles.detailRow}>
                <View style={styles.detailItem}>
                  <Ionicons name="location" size={16} color={COLORS.textSecondary} />
                  <Text style={styles.detailText} numberOfLines={1}>
                    {item.jobOffer?.location?.city || "N/A"}, {" "}
                    {item.jobOffer?.location?.state || "N/A"}
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
              <Text style={styles.applicationDate}>
                Postulado: {new Date(item.createdAt).toLocaleDateString("es-CO", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric"
                })}
              </Text>
              
              <View style={styles.applicationActions}>
                <TouchableOpacity
                  style={styles.detailsButton}
                  onPress={() => viewApplicationDetails(item)}>
                  <Ionicons name="eye" size={14} color={COLORS.primary} />
                  <Text style={styles.detailsButtonText}>Detalles</Text>
                </TouchableOpacity>
                
                {canCancel && (
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => handleCancelApplication(item.id)}>
                    <Ionicons name="close" size={14} color={COLORS.error} />
                    <Text style={styles.cancelButtonText}>Cancelar</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  // 🔥 ACTUALIZADO - Modal de detalles
  const ApplicationDetailModal = () => {
    if (!selectedApplication) return null;

    const statusConfig = getStatusConfig(selectedApplication.status?.name);

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

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              {/* Estado actual */}
              <View style={styles.statusSection}>
                <View
                  style={[
                    styles.statusBadgeLarge,
                    { 
                      backgroundColor: statusConfig.bgColor,
                      borderColor: statusConfig.color,
                    }
                  ]}>
                  <Ionicons 
                    name={statusConfig.icon as keyof typeof Ionicons.glyphMap} 
                    size={24} 
                    color={statusConfig.color} 
                  />
                  <Text
                    style={[
                      styles.statusTextLarge, 
                      { color: statusConfig.textColor }
                    ]}>
                    {statusConfig.label}
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
                  {selectedApplication.jobOffer?.employer?.user?.name} {selectedApplication.jobOffer?.employer?.user?.lastname || ""}
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
                      {selectedApplication.jobOffer?.location?.city},{" "}
                      {selectedApplication.jobOffer?.location?.state}
                      {selectedApplication.jobOffer?.location?.village && 
                        `, ${selectedApplication.jobOffer.location.village}`
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
                      {selectedApplication.jobOffer?.cropType?.name || "General"}
                    </Text>
                  </View>

                  {selectedApplication.jobOffer?.phase?.name && (
                    <View style={styles.jobDetailItem}>
                      <Ionicons name="trending-up" size={18} color={COLORS.info} />
                      <Text style={styles.jobDetailLabel}>Fase</Text>
                      <Text style={styles.jobDetailValue}>
                        {selectedApplication.jobOffer.phase.name}
                      </Text>
                    </View>
                  )}
                </View>

                {selectedApplication.jobOffer?.requirements && (
                  <View style={styles.descriptionContainer}>
                    <Text style={styles.descriptionLabel}>Requisitos</Text>
                    <Text style={styles.descriptionText}>
                      {selectedApplication.jobOffer.requirements}
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
                  {selectedApplication.updatedAt !== selectedApplication.createdAt && (
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Última actualización:</Text>
                      <Text style={styles.infoValue}>
                        {new Date(
                          selectedApplication.updatedAt
                        ).toLocaleDateString("es-CO", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </Text>
                    </View>
                  )}
                </View>
              </View>

              {/* Información de contacto del empleador */}
              {(selectedApplication.status?.name === "Aceptado" || selectedApplication.status?.name === "Aceptada") && (
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
                        {selectedApplication.jobOffer?.employer?.user?.name} {selectedApplication.jobOffer?.employer?.user?.lastname || ""}
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
                  navigation.navigate("WorkerJobOfferDetail", {
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
            {applications.length} postulaciones totales
          </Text>
        </View>

        {/* Selector de tabs */}
        <TabSelector />

        {/* Filtros de estado */}
        <StatusFilters />

        <FlatList
          data={currentApplications}
          renderItem={({ item, index }) => <ApplicationCard item={item} index={index} />}
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
            currentApplications.length === 0 && styles.emptyListContainer,
          ]}
          ListEmptyComponent={() => (
            <View style={styles.emptyStateContainer}>
              <Ionicons
                name={activeTab === "active" ? "briefcase-outline" : "archive-outline"}
                size={64}
                color={COLORS.textLight}
              />
              <Text style={styles.emptyStateText}>
                {selectedStatusFilter !== "todos" 
                  ? `No hay postulaciones con estado "${getStatusConfig(selectedStatusFilter).label}"`
                  : activeTab === "active"
                    ? "No tienes postulaciones activas"
                    : "No hay postulaciones en el historial"
                }
              </Text>
              <Text style={styles.emptyStateSubtext}>
                {selectedStatusFilter !== "todos"
                  ? "Cambia el filtro para ver otras postulaciones"
                  : activeTab === "active"
                    ? "Busca ofertas de trabajo y postúlate"
                    : "Las postulaciones canceladas y rechazadas aparecerán aquí"
                }
              </Text>
              {activeTab === "active" && selectedStatusFilter === "todos" && (
                <TouchableOpacity
                  style={styles.searchJobsButton}
                  onPress={() => navigation.navigate("WorkerJobs")}>
                  <Text style={styles.searchJobsButtonText}>Buscar Trabajos</Text>
                </TouchableOpacity>
              )}
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
  
  // Estilos para tabs
  tabContainer: {
    flexDirection: "row",
    backgroundColor: COLORS.surface,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginRight: 8,
    borderRadius: 12,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  activeTab: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.textSecondary,
    marginLeft: 8,
    marginRight: 8,
  },
  activeTabText: {
    color: "#FFFFFF",
  },
  tabBadge: {
    backgroundColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: "center",
  },
  tabBadgeText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: "600",
  },
  activeTabBadgeText: {
    color: "#FFFFFF",
  },

  // Estilos para filtros
  filtersContainer: {
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  filterToggle: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 8,
  },
  filterToggleText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: "500",
    flex: 1,
  },
  statusFiltersScroll: {
    maxHeight: 60,
  },
  statusFiltersContainer: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    gap: 8,
  },
  statusFilterChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginRight: 8,
    gap: 6,
  },
  statusFilterChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  statusFilterChipText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: "500",
  },
  statusFilterChipTextActive: {
    color: "#FFFFFF",
    fontWeight: "600",
  },

  applicationsList: {
    padding: 20,
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
  historyCard: {
    borderColor: COLORS.textLight,
    backgroundColor: "#FAFAFA",
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
  applicationDate: {
    fontSize: 12,
    color: COLORS.textLight,
    fontWeight: "500",
  },
  applicationActions: {
    flexDirection: "row",
    gap: 8,
  },
  detailsButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: `${COLORS.primary}15`,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
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
    borderRadius: 8,
    gap: 4,
  },
  cancelButtonText: {
    color: COLORS.error,
    fontSize: 12,
    fontWeight: "600",
  },
  
  // Estados vacíos
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
  emptyListContainer: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  // Estilos del modal
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
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 2,
    gap: 10,
  },
  statusTextLarge: {
    fontSize: 16,
    fontWeight: "700",
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
});