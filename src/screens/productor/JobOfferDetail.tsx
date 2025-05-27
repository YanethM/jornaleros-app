import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Share,
  Platform,
  Dimensions,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import {
  useNavigation,
  useRoute,
  useFocusEffect,
} from "@react-navigation/native";
import { useAuth } from "../../context/AuthContext";
import ScreenLayout from "../../components/ScreenLayout";
import CustomTabBar from "../../components/CustomTabBar";
import {
  changeStatusJobOfferById,
  deleteJobOfferById,
  getJobOfferById,
} from "../../services/jobOffers";

const { width } = Dimensions.get('window');

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
};

// Componente Hero con información principal
const HeroSection = ({ jobOffer }) => {
  const formatCurrency = (amount) => {
    if (!amount) return "No especificado";
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Activo": return COLORS.success;
      case "En_curso": return COLORS.warning;
      case "Finalizado": return COLORS.error;
      default: return COLORS.textLight;
    }
  };

  return (
    <View style={styles.heroSection}>
      <View style={styles.heroGradient}>
        <View style={styles.heroContent}>
          <View style={styles.heroHeader}>
            <View style={styles.statusContainer}>
              <View style={[
                styles.statusBadge, 
                { backgroundColor: `${getStatusColor(jobOffer?.status)}20` }
              ]}>
                <View style={[
                  styles.statusDot, 
                  { backgroundColor: getStatusColor(jobOffer?.status) }
                ]} />
                <Text style={[
                  styles.statusText,
                  { color: getStatusColor(jobOffer?.status) }
                ]}>
                  {jobOffer?.status || 'Estado desconocido'}
                </Text>
              </View>
            </View>
            
            <Text style={styles.heroTitle}>{jobOffer?.title}</Text>
            <Text style={styles.heroSubtitle}>
              {jobOffer?.cropType?.name} • {jobOffer?.phase?.name}
            </Text>
          </View>

          <View style={styles.heroStats}>
            <View style={styles.heroPrimaryCard}>
              <Text style={styles.salaryAmount}>{formatCurrency(jobOffer?.salary)}</Text>
              <Text style={styles.salaryPeriod}>por día</Text>
            </View>
            
            <View style={styles.heroMetrics}>
              <View style={styles.metricItem}>
                <Icon name="people" size={20} color={COLORS.success} />
                <Text style={styles.metricValue}>{jobOffer?.applicationsCount || 0}</Text>
                <Text style={styles.metricLabel}>Postulantes</Text>
              </View>
              <View style={styles.metricItem}>
                <Icon name="schedule" size={20} color={COLORS.secondary} />
                <Text style={styles.metricValue}>{jobOffer?.duration || 0}</Text>
                <Text style={styles.metricLabel}>Días</Text>
              </View>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
};

// Componente de información de la finca
const FarmInfoCard = ({ jobOffer }) => {
  const farmInfo = jobOffer?.farmInfo;
  const location = farmInfo?.location;

  return (
    <View style={styles.infoCard}>
      <View style={styles.cardHeader}>
        <View style={[styles.cardIcon, { backgroundColor: COLORS.success }]}>
          <Icon name="agriculture" size={24} color="#FFFFFF" />
        </View>
        <View style={styles.cardHeaderText}>
          <Text style={styles.cardTitle}>Información de la Finca</Text>
          <Text style={styles.cardSubtitle}>Detalles del lugar de trabajo</Text>
        </View>
      </View>

      <View style={styles.cardContent}>
        <View style={styles.farmNameContainer}>
          <Text style={styles.farmName}>{farmInfo?.name || 'Sin nombre'}</Text>
          <View style={styles.farmMetrics}>
            <View style={styles.farmMetric}>
              <Icon name="straighten" size={16} color={COLORS.textSecondary} />
              <Text style={styles.farmMetricText}>{farmInfo?.size || 0} ha</Text>
            </View>
            <View style={styles.farmMetric}>
              <Icon name="eco" size={16} color={COLORS.success} />
              <Text style={styles.farmMetricText}>{farmInfo?.plantCount || 0} plantas</Text>
            </View>
          </View>
        </View>

        <View style={styles.locationContainer}>
          <View style={styles.locationRow}>
            <Icon name="location-on" size={18} color={COLORS.primary} />
            <Text style={styles.locationText}>
              {[location?.village, location?.city, location?.department, location?.country]
                .filter(Boolean).join(', ')}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
};

// Timeline de fases del cultivo
const CropPhasesTimeline = ({ jobOffer }) => {
  const availablePhases = jobOffer?.availablePhasesForCrop || [];
  const currentPhase = jobOffer?.phase;

  const getCurrentPhaseIndex = () => {
    return availablePhases.findIndex(phase => phase.id === currentPhase?.id);
  };

  const currentIndex = getCurrentPhaseIndex();

  return (
    <View style={styles.infoCard}>
      <View style={styles.cardHeader}>
        <View style={[styles.cardIcon, { backgroundColor: COLORS.secondary }]}>
          <Icon name="timeline" size={24} color="#FFFFFF" />
        </View>
        <View style={styles.cardHeaderText}>
          <Text style={styles.cardTitle}>Fases del Cultivo</Text>
          <Text style={styles.cardSubtitle}>Progreso del {jobOffer?.cropType?.name}</Text>
        </View>
      </View>

      <View style={styles.cardContent}>
        <View style={styles.timelineContainer}>
          {availablePhases.map((phase, index) => {
            const isActive = phase.id === currentPhase?.id;
            const isPast = index < currentIndex;
            const isFuture = index > currentIndex;

            return (
              <View key={phase.id} style={styles.timelineItem}>
                <View style={styles.timelineStep}>
                  <View style={[
                    styles.timelineCircle,
                    isActive && styles.timelineCircleActive,
                    isPast && styles.timelineCirclePast,
                    isFuture && styles.timelineCircleFuture
                  ]}>
                    {isActive && <View style={styles.timelineCircleInner} />}
                    {isPast && <Icon name="check" size={12} color="#FFFFFF" />}
                  </View>
                  {index < availablePhases.length - 1 && (
                    <View style={[
                      styles.timelineLine,
                      isPast && styles.timelineLinePast
                    ]} />
                  )}
                </View>
                <View style={styles.timelineContent}>
                  <Text style={[
                    styles.phaseTitle,
                    isActive && styles.phaseTitleActive
                  ]}>
                    {phase.name}
                  </Text>
                  {isActive && currentPhase?.description && (
                    <Text style={styles.phaseDescription}>
                      {currentPhase.description}
                    </Text>
                  )}
                </View>
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );
};

// Información del empleador
const EmployerCard = ({ jobOffer }) => {
  const employer = jobOffer?.employer;
  const user = employer?.user;

  return (
    <View style={styles.employerCard}>
      <View style={styles.employerHeader}>
        <View style={styles.employerAvatar}>
          <Text style={styles.employerInitial}>
            {user?.name?.charAt(0)?.toUpperCase() || 'E'}
          </Text>
        </View>
        <View style={styles.employerInfo}>
          <Text style={styles.employerName}>
            {user?.name} {user?.lastname}
          </Text>
          <View style={styles.employerLocation}>
            <Icon name="place" size={14} color={COLORS.textLight} />
            <Text style={styles.employerLocationText}>
              {employer?.city}, {employer?.state}
            </Text>
          </View>
        </View>
        <View style={styles.employerStats}>
          <Text style={styles.employerStatsNumber}>
            {jobOffer?.relatedFarms?.length || 0}
          </Text>
          <Text style={styles.employerStatsLabel}>Fincas</Text>
        </View>
      </View>
    </View>
  );
};

// Estadísticas de la operación
const OperationStats = ({ jobOffer }) => {
  const stats = jobOffer?.farmStatistics;

  return (
    <View style={styles.statsGrid}>
      <View style={styles.statCard}>
        <Icon name="landscape" size={24} color={COLORS.primary} />
        <Text style={styles.statNumber}>{stats?.totalFarmSize || 0}</Text>
        <Text style={styles.statLabel}>Hectáreas totales</Text>
      </View>
      
      <View style={styles.statCard}>
        <Icon name="eco" size={24} color={COLORS.success} />
        <Text style={styles.statNumber}>{stats?.totalPlantCount || 0}</Text>
        <Text style={styles.statLabel}>Plantas totales</Text>
      </View>
      
      <View style={styles.statCard}>
        <Icon name="work" size={24} color={COLORS.secondary} />
        <Text style={styles.statNumber}>{stats?.totalActivePhasesAcrossFarms || 0}</Text>
        <Text style={styles.statLabel}>Fases activas</Text>
      </View>
    </View>
  );
};

// Detalles adicionales
const AdditionalDetails = ({ jobOffer }) => {
  const formatDate = (dateString) => {
    if (!dateString) return "No especificado";
    return new Date(dateString).toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  return (
    <View style={styles.detailsContainer}>
      <View style={styles.detailRow}>
        <View style={styles.detailItem}>
          <Icon name="event" size={20} color={COLORS.primary} />
          <View style={styles.detailContent}>
            <Text style={styles.detailLabel}>Fecha de inicio</Text>
            <Text style={styles.detailValue}>{formatDate(jobOffer?.startDate)}</Text>
          </View>
        </View>
        
        <View style={styles.detailItem}>
          <Icon name="event-busy" size={20} color={COLORS.error} />
          <View style={styles.detailContent}>
            <Text style={styles.detailLabel}>Fecha de fin</Text>
            <Text style={styles.detailValue}>{formatDate(jobOffer?.endDate)}</Text>
          </View>
        </View>
      </View>

      <View style={styles.detailRow}>
        <View style={styles.detailItem}>
          <Icon name="payment" size={20} color={COLORS.secondary} />
          <View style={styles.detailContent}>
            <Text style={styles.detailLabel}>Método de pago</Text>
            <Text style={styles.detailValue}>{jobOffer?.paymentMode || 'Efectivo'}</Text>
          </View>
        </View>
        
        <View style={styles.detailItem}>
          <Icon name="today" size={20} color={COLORS.accent} />
          <View style={styles.detailContent}>
            <Text style={styles.detailLabel}>Tipo de pago</Text>
            <Text style={styles.detailValue}>
              {jobOffer?.paymentType === "Por_dia" ? "Por día" : "Por labor"}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
};

// Componente principal
const JobOfferDetail = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { jobOfferId } = route.params;
  const { user } = useAuth();

  const [jobOffer, setJobOffer] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadJobOfferDetails = useCallback(async () => {
    try {
      setLoading(true);
      const jobOfferData = await getJobOfferById(jobOfferId);
      
      console.log("Job offer response:", jobOfferData);
      
      if (jobOfferData) {
        setJobOffer(jobOfferData);
      } else {
        Alert.alert("Error", "No se encontraron datos de la oferta");
      }
    } catch (error) {
      console.error("Error cargando detalles:", error);
      Alert.alert("Error", "No se pudieron cargar los detalles");
    } finally {
      setLoading(false);
    }
  }, [jobOfferId]);

  useEffect(() => {
    loadJobOfferDetails();
  }, [loadJobOfferDetails]);

  useFocusEffect(
    useCallback(() => {
      loadJobOfferDetails();
    }, [loadJobOfferDetails])
  );

  const handleShare = async () => {
    if (!jobOffer) return;
    // Lógica de compartir...
  };

  if (loading) {
    return (
      <ScreenLayout navigation={navigation}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Cargando detalles...</Text>
        </View>
      </ScreenLayout>
    );
  }

  if (!jobOffer) {
    return (
      <ScreenLayout navigation={navigation}>
        <View style={styles.errorContainer}>
          <Icon name="error-outline" size={48} color={COLORS.error} />
          <Text style={styles.errorText}>No se pudo cargar la información</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => navigation.goBack()}>
            <Text style={styles.retryButtonText}>Volver</Text>
          </TouchableOpacity>
        </View>
      </ScreenLayout>
    );
  }

  return (
    <ScreenLayout navigation={navigation}>
      <View style={styles.container}>
        {/* Header minimalista */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => navigation.goBack()}>
            <Icon name="arrow-back" size={24} color={COLORS.primary} />
          </TouchableOpacity>
          
          <Text style={styles.headerTitle}>Detalles de la Oferta</Text>
          
          <TouchableOpacity style={styles.headerButton} onPress={handleShare}>
            <Icon name="share" size={24} color={COLORS.primary} />
          </TouchableOpacity>
        </View>

        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}>
          
          {/* Hero Section */}
          <HeroSection jobOffer={jobOffer} />
          
          {/* Información de la Finca */}
          <FarmInfoCard jobOffer={jobOffer} />
          
          {/* Timeline de Fases */}
          <CropPhasesTimeline jobOffer={jobOffer} />
          
          {/* Información del Empleador */}
          <EmployerCard jobOffer={jobOffer} />
          
          {/* Estadísticas de Operación */}
          <OperationStats jobOffer={jobOffer} />
          
          {/* Detalles Adicionales */}
          <AdditionalDetails jobOffer={jobOffer} />
          
          {/* Descripción */}
          {jobOffer?.description && (
            <View style={styles.infoCard}>
              <View style={styles.cardHeader}>
                <View style={[styles.cardIcon, { backgroundColor: COLORS.accent }]}>
                  <Icon name="description" size={24} color="#FFFFFF" />
                </View>
                <View style={styles.cardHeaderText}>
                  <Text style={styles.cardTitle}>Descripción del Trabajo</Text>
                </View>
              </View>
              <View style={styles.cardContent}>
                <Text style={styles.descriptionText}>{jobOffer.description}</Text>
              </View>
            </View>
          )}
          
        </ScrollView>

        {/* Botones de acción fijos */}
        <View style={styles.actionBar}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: COLORS.primary }]}
            onPress={() => navigation.navigate("EditJobOffer", { jobOfferId: jobOffer.id })}>
            <Icon name="edit" size={18} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>Editar</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: COLORS.secondary }]}
            onPress={() => navigation.navigate("JobApplications", { jobOfferId: jobOffer.id })}>
            <Icon name="people" size={18} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>
              Postulantes ({jobOffer?.applicationsCount || 0})
            </Text>
          </TouchableOpacity>
        </View>
      </View>
      <CustomTabBar navigation={navigation} currentRoute="JobOffers" />
    </ScreenLayout>
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
    fontWeight: "500",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  errorText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: "center",
    marginVertical: 16,
  },
  retryButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: COLORS.surface,
    paddingTop: Platform.OS === "ios" ? 50 : 20,
    paddingBottom: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${COLORS.primary}10`,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.text,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  // Hero Section Styles
  heroSection: {
    backgroundColor: COLORS.surface,
    marginBottom: 16,
  },
  heroGradient: {
    backgroundColor: COLORS.primary,
  },
  heroContent: {
    padding: 24,
  },
  heroHeader: {
    marginBottom: 24,
  },
  statusContainer: {
    marginBottom: 16,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 8,
    lineHeight: 34,
  },
  heroSubtitle: {
    fontSize: 16,
    color: "rgba(255,255,255,0.8)",
    fontWeight: "500",
  },
  heroStats: {
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
  },
  heroPrimaryCard: {
    backgroundColor: "rgba(255,255,255,0.15)",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
    flex: 1,
  },
  salaryAmount: {
    fontSize: 24,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  salaryPeriod: {
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
    fontWeight: "500",
  },
  heroMetrics: {
    flexDirection: "row",
    gap: 16,
  },
  metricItem: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.1)",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    minWidth: 70,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
    marginTop: 4,
    marginBottom: 2,
  },
  metricLabel: {
    fontSize: 11,
    color: "rgba(255,255,255,0.7)",
    fontWeight: "500",
  },
  // Card Styles
  infoCard: {
    backgroundColor: COLORS.surface,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  cardIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  cardHeaderText: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 2,
  },
  cardSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: "500",
  },
  cardContent: {
    padding: 20,
  },
  // Farm Info Styles
  farmNameContainer: {
    marginBottom: 16,
  },
  farmName: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 8,
  },
  farmMetrics: {
    flexDirection: "row",
    gap: 16,
  },
  farmMetric: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  farmMetricText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: "500",
  },
  locationContainer: {
    backgroundColor: COLORS.background,
    padding: 16,
    borderRadius: 12,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  locationText: {
    fontSize: 15,
    color: COLORS.text,
    lineHeight: 22,
    flex: 1,
  },
  // Timeline Styles
  timelineContainer: {
    paddingLeft: 8,
  },
  timelineItem: {
    flexDirection: "row",
    marginBottom: 16,
  },
  timelineStep: {
    alignItems: "center",
    marginRight: 16,
  },
  timelineCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.border,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  timelineCircleActive: {
    backgroundColor: COLORS.secondary,
    borderColor: COLORS.secondary,
  },
  timelineCirclePast: {
    backgroundColor: COLORS.success,
    borderColor: COLORS.success,
  },
  timelineCircleFuture: {
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
  },
  timelineCircleInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#FFFFFF",
  },
  timelineLine: {
    width: 2,
    height: 32,
    backgroundColor: COLORS.border,
    marginTop: 8,
  },
  timelineLinePast: {
    backgroundColor: COLORS.success,
  },
  timelineContent: {
    flex: 1,
    paddingTop: 2,
  },
  phaseTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  phaseTitleActive: {
    color: COLORS.text,
    fontWeight: "700",
  },
  phaseDescription: {
    fontSize: 13,
    color: COLORS.textLight,
    lineHeight: 18,
    fontStyle: "italic",
  },
  // Employer Card Styles
  employerCard: {
    backgroundColor: COLORS.surface,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    padding: 20,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  employerHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  employerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  employerInitial: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  employerInfo: {
    flex: 1,
  },
  employerName: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 4,
  },
  employerLocation: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  employerLocationText: {
    fontSize: 13,
    color: COLORS.textLight,
    fontWeight: "500",
  },
  employerStats: {
    alignItems: "center",
  },
  employerStatsNumber: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.secondary,
  },
  employerStatsLabel: {
    fontSize: 11,
    color: COLORS.textLight,
    fontWeight: "500",
  },
  // Stats Grid Styles
  statsGrid: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginBottom: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  statNumber: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.text,
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: "500",
    textAlign: "center",
  },
  // Details Styles
  detailsContainer: {
    backgroundColor: COLORS.surface,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    padding: 20,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  detailRow: {
    flexDirection: "row",
    marginBottom: 16,
    gap: 16,
  },
  detailItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: COLORS.textLight,
    fontWeight: "500",
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: "600",
  },
  descriptionText: {
    fontSize: 15,
    color: COLORS.text,
    lineHeight: 24,
  },
  // Action Bar Styles
  actionBar: {
    position: "absolute",
    bottom: 16,
    left: 16,
    right: 16,
    flexDirection: "row",
    gap: 12,
    backgroundColor: COLORS.background,
    paddingTop: 16,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  actionButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#FFFFFF",
  },
});

export default JobOfferDetail;