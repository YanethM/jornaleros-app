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
import { getJobOfferById } from "../../services/jobOffers";
import { SafeAreaView } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");

const COLORS = {
  primary: "#284E66", // Azul más moderno
  secondary: "#B6883F", // Amber más vibrante
  white: "#FFFFFF",
  lightGray: "#F8FAFC", // Fondo más suave
  darkGray: "#1E293B", // Texto más legible
  mediumGray: "#475569",
  lightText: "#64748B",
  success: "#284E60", // Verde más moderno
  warning: "#F59E0B",
  error: "#EF4444",
  border: "#E2E8F0",
  accent: "#8B5CF6", // Púrpura moderno
  plant: "#059669",
  phase: "#7C3AED",
  background: "#F1F5F9", // Fondo alternativo
  cardShadow: "rgba(0, 0, 0, 0.08)",
};

// Componente Hero con diseño más moderno
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
      case "Activo":
        return COLORS.success;
      case "En_curso":
        return COLORS.warning;
      case "Finalizado":
        return COLORS.error;
      default:
        return COLORS.lightText;
    }
  };

  const getCurrentPhase = () => {
    if (!jobOffer?.phaseId || !jobOffer?.availablePhasesForCrop) return null;
    return jobOffer.availablePhasesForCrop.find(
      (phase) => phase.id === jobOffer.phaseId
    );
  };

  const currentPhase = getCurrentPhase();

  return (
    <View style={styles.heroContainer}>
      {/* Estado con diseño más elegante */}
      <View style={styles.heroHeader}>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(jobOffer?.status) },
          ]}>
          <Text style={styles.statusText}>
            {jobOffer?.status || "Estado desconocido"}
          </Text>
        </View>
      </View>

      {/* Título principal */}
      <Text style={styles.heroTitle}>{jobOffer?.title}</Text>

      {/* Información del cultivo con mejor diseño */}
      <View style={styles.cropInfoContainer}>
        <View style={styles.cropInfoItem}>
          <View style={styles.cropIcon}>
            <Icon name="eco" size={16} color={COLORS.success} />
          </View>
          <Text style={styles.cropInfoText}>
            {jobOffer?.cropType?.name || "Cultivo no especificado"}
          </Text>
        </View>

        {currentPhase && (
          <View style={styles.cropInfoItem}>
            <View style={styles.cropIcon}>
              <Icon name="timeline" size={16} color={COLORS.accent} />
            </View>
            <Text style={styles.cropInfoText}>
              {currentPhase.name.replace(/^[🌾🌱🌿🌼🌰🧺🍫♻️]\s*\d+\.\s*/, "")}
            </Text>
          </View>
        )}
      </View>

      {/* Estadísticas principales con nuevo diseño */}
      <View style={styles.heroStats}>
        <View style={styles.salaryCard}>
          <Text style={styles.salaryLabel}>Salario</Text>
          <Text style={styles.salaryAmount}>
            {formatCurrency(jobOffer?.salary)}
          </Text>
          <Text style={styles.salaryPeriod}>
            {jobOffer?.paymentType === "Por_dia"
              ? "por día"
              : "por trabajo completo"}
          </Text>
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Icon name="people" size={24} color={COLORS.primary} />
            <Text style={styles.statValue}>
              {jobOffer?.applicationsCount || 0}
            </Text>
            <Text style={styles.statLabel}>Postulantes</Text>
          </View>

          <View style={styles.statItem}>
            <Icon name="schedule" size={24} color={COLORS.warning} />
            <Text style={styles.statValue}>{jobOffer?.duration || 0}</Text>
            <Text style={styles.statLabel}>Días</Text>
          </View>

          <View style={styles.statItem}>
            <Icon name="groups" size={24} color={COLORS.success} />
            <Text style={styles.statValue}>{jobOffer?.workersNeeded || 0}</Text>
            <Text style={styles.statLabel}>Necesarios</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

// Tarjeta de información con diseño mejorado
const InfoCard = ({
  icon,
  iconColor,
  title,
  subtitle,
  children,
  highlight = false,
}) => {
  return (
    <View style={[styles.card, highlight && styles.highlightCard]}>
      <View style={styles.cardHeader}>
        <View style={[styles.cardIcon, { backgroundColor: iconColor }]}>
          {typeof icon === "string" ? (
            <Icon name={icon} size={20} color={COLORS.white} />
          ) : (
            icon
          )}
        </View>
        <View style={styles.cardHeaderText}>
          <Text style={styles.cardTitle}>{title}</Text>
          <Text style={styles.cardSubtitle}>{subtitle}</Text>
        </View>
      </View>
      <View style={styles.cardContent}>{children}</View>
    </View>
  );
};

// Componente de información de la finca
const FarmInfoCard = ({ jobOffer }) => {
  const farmInfo = jobOffer?.farmInfo || jobOffer?.farm;

  return (
    <InfoCard
      icon="agriculture"
      iconColor={COLORS.success}
      title="Información de la Finca"
      subtitle="Detalles del lugar de trabajo">
      <View style={styles.detailGrid}>
        <DetailItem
          icon="business"
          iconColor={COLORS.primary}
          label="Nombre de la Finca"
          value={farmInfo?.name || "Sin nombre especificado"}
        />

        <DetailItem
          icon="eco"
          iconColor={COLORS.success}
          label="Tipo de Cultivo"
          value={jobOffer?.cropType?.name || "No especificado"}
        />

        <DetailItem
          icon="nature"
          iconColor={COLORS.plant}
          label="Plantas en la Finca"
          value={
            farmInfo?.plantCount
              ? `${farmInfo.plantCount.toLocaleString()} plantas`
              : "No especificado"
          }
        />

        <DetailItem
          icon="straighten"
          iconColor={COLORS.warning}
          label="Tamaño de la Finca"
          value={
            farmInfo?.size ? `${farmInfo.size} hectáreas` : "No especificado"
          }
        />
      </View>
    </InfoCard>
  );
};

// Componente para mostrar la fase de trabajo
const WorkPhaseCard = ({ jobOffer }) => {
  const getCurrentPhase = () => {
    if (!jobOffer?.phaseId || !jobOffer?.availablePhasesForCrop) return null;
    return jobOffer.availablePhasesForCrop.find(
      (phase) => phase.id === jobOffer.phaseId
    );
  };

  const getPhaseEmoji = (phaseName) => {
    const match = phaseName?.match(/^([🌾🌱🌿🌼🌰🧺🍫♻️])/);
    return match ? match[1] : "🌱";
  };

  const currentPhase = getCurrentPhase();

  if (!currentPhase) return null;

  const phaseEmoji = getPhaseEmoji(currentPhase.name);
  const cleanPhaseName =
    currentPhase.name?.replace(/^[🌾🌱🌿🌼🌰🧺🍫♻️]\s*\d+\.\s*/, "") || "";

  return (
    <InfoCard
      icon={<Text style={styles.phaseEmoji}>{phaseEmoji}</Text>}
      iconColor={COLORS.phase}
      title="Fase de Trabajo"
      subtitle={`Etapa del cultivo ${jobOffer?.cropType?.name}`}
      highlight={true}>
      <View style={styles.phaseCard}>
        <Text style={styles.phaseName}>{cleanPhaseName}</Text>

        {currentPhase.description && (
          <Text style={styles.phaseDescription}>
            {currentPhase.description}
          </Text>
        )}

        {currentPhase.duration && (
          <View style={styles.phaseDuration}>
            <Icon name="schedule" size={16} color={COLORS.phase} />
            <Text style={styles.phaseDurationText}>
              Duración estimada: {currentPhase.duration} días
            </Text>
          </View>
        )}
      </View>
    </InfoCard>
  );
};

// Componente de pago y beneficios
const PaymentCard = ({ jobOffer }) => {
  const formatCurrency = (amount) => {
    if (!amount) return "No especificado";
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const isPlantPayment = jobOffer.paymentType === "Por_labor";

  return (
    <InfoCard
      icon="payments"
      iconColor={COLORS.secondary}
      title="Pago y Beneficios"
      subtitle={isPlantPayment ? "Trabajo por plantas" : "Trabajo por jornada"}
      highlight={true}>
      <View style={styles.paymentMainCard}>
        <View style={styles.paymentHeader}>
          <Icon
            name={isPlantPayment ? "local-florist" : "schedule"}
            size={24}
            color={COLORS.secondary}
          />
          <Text style={styles.paymentTitle}>
            {isPlantPayment ? "Pago Total por Trabajo" : "Salario Diario"}
          </Text>
        </View>
        <Text style={styles.paymentAmount}>
          {formatCurrency(jobOffer.salary)}
        </Text>
      </View>

      {/* Detalles específicos para pago por planta */}
      {isPlantPayment && jobOffer.plantCount && (
        <View style={styles.plantDetails}>
          <DetailItem
            icon="nature"
            iconColor={COLORS.plant}
            label="Plantas a trabajar"
            value={`${parseInt(jobOffer.plantCount).toLocaleString()} plantas`}
          />

          {jobOffer.pricePerUnit && (
            <DetailItem
              icon="attach-money"
              iconColor={COLORS.plant}
              label="Precio por planta"
              value={formatCurrency(jobOffer.pricePerUnit)}
            />
          )}
        </View>
      )}

      {/* Beneficios */}
      <View style={styles.benefitsSection}>
        <Text style={styles.sectionTitle}>Beneficios Incluidos</Text>
        <View style={styles.benefitsGrid}>
          <BenefitItem
            included={jobOffer.includesFood}
            icon={jobOffer.includesFood ? "restaurant" : "no-meals"}
            label="Alimentación"
          />
          <BenefitItem
            included={jobOffer.includesLodging}
            icon={jobOffer.includesLodging ? "hotel" : "no-meeting-room"}
            label="Alojamiento"
          />
        </View>
      </View>
    </InfoCard>
  );
};

// Componente de ubicación
const LocationCard = ({ jobOffer }) => {
  const location = jobOffer?.farmInfo?.location || jobOffer?.displayLocation;

  const getCompleteLocation = () => {
    const parts = [
      location?.village && `Vereda ${location.village}`,
      location?.city,
      location?.department,
      location?.country,
    ].filter(Boolean);
    return parts.length > 0 ? parts.join(", ") : "Ubicación no especificada";
  };

  return (
    <InfoCard
      icon="place"
      iconColor={COLORS.accent}
      title="Ubicación de la Finca"
      subtitle="Dirección completa del trabajo">
      <View style={styles.locationMain}>
        <Icon name="location-on" size={24} color={COLORS.accent} />
        <Text style={styles.locationText}>{getCompleteLocation()}</Text>
      </View>

      <View style={styles.locationDetails}>
        {location?.country && (
          <DetailItem
            icon="public"
            iconColor={COLORS.success}
            label="País"
            value={location.country}
          />
        )}

        {location?.department && (
          <DetailItem
            icon="map"
            iconColor={COLORS.secondary}
            label="Departamento"
            value={location.department}
          />
        )}

        {location?.city && (
          <DetailItem
            icon="location-city"
            iconColor={COLORS.accent}
            label="Ciudad/Municipio"
            value={location.city}
          />
        )}
      </View>
    </InfoCard>
  );
};

// Componente de detalles adicionales
const AdditionalDetailsCard = ({ jobOffer }) => {
  const formatDate = (dateString) => {
    if (!dateString) return "No especificado";
    return new Date(dateString).toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  return (
    <InfoCard
      icon="info"
      iconColor={COLORS.primary}
      title="Detalles Adicionales"
      subtitle="Información complementaria importante">
      <View style={styles.detailsGrid}>
        <DetailItem
          icon="event"
          iconColor={COLORS.success}
          label="Fecha de inicio"
          value={formatDate(jobOffer?.startDate)}
        />

        <DetailItem
          icon="event-busy"
          iconColor={COLORS.error}
          label="Fecha de fin"
          value={formatDate(jobOffer?.endDate)}
        />

        <DetailItem
          icon="schedule"
          iconColor={COLORS.primary}
          label="Horario de trabajo"
          value={
            jobOffer?.workSchedule || "Horario estándar (6:00 AM - 2:00 PM)"
          }
        />

        {jobOffer?.requirements && (
          <DetailItem
            icon="checklist"
            iconColor={COLORS.accent}
            label="Requisitos"
            value={jobOffer.requirements}
          />
        )}
      </View>
    </InfoCard>
  );
};

// Componente de información del empleador
const EmployerCard = ({ jobOffer }) => {
  const employer = jobOffer?.employer;
  const user = employer?.user;

  return (
    <InfoCard
      icon="person"
      iconColor={COLORS.primary}
      title="Información del Productor"
      subtitle="Empleador de la oferta de trabajo">
      <View style={styles.employerContainer}>
        <View style={styles.employerAvatar}>
          <Text style={styles.employerInitial}>
            {user?.name?.charAt(0)?.toUpperCase() || "P"}
          </Text>
        </View>

        <View style={styles.employerInfo}>
          <Text style={styles.employerName}>
            {user?.name} {user?.lastname}
          </Text>

          <View style={styles.employerLocation}>
            <Icon name="place" size={14} color={COLORS.mediumGray} />
            <Text style={styles.employerLocationText}>
              {employer?.city}, {employer?.state}
            </Text>
          </View>

          <View style={styles.employerContact}>
            <Icon name="business" size={14} color={COLORS.primary} />
            <Text style={styles.employerContactText}>
              {employer?.farms?.length || 0} fincas registradas
            </Text>
          </View>
        </View>
      </View>
    </InfoCard>
  );
};

// Componente reutilizable para ítems de detalle
const DetailItem = ({ icon, iconColor, label, value }) => (
  <View style={styles.detailItem}>
    <View style={[styles.detailIcon, { backgroundColor: `${iconColor}15` }]}>
      <Icon name={icon} size={16} color={iconColor} />
    </View>
    <View style={styles.detailContent}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  </View>
);

// Componente reutilizable para beneficios
const BenefitItem = ({ included, icon, label }) => (
  <View
    style={[
      styles.benefitItem,
      included ? styles.benefitIncluded : styles.benefitNotIncluded,
    ]}>
    <Icon
      name={icon}
      size={20}
      color={included ? COLORS.success : COLORS.mediumGray}
    />
    <Text
      style={[
        styles.benefitText,
        included ? styles.benefitIncludedText : styles.benefitNotIncludedText,
      ]}>
      {label}
    </Text>
    {included && <Icon name="check-circle" size={16} color={COLORS.success} />}
  </View>
);

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

    const location =
      jobOffer?.farmInfo?.location || jobOffer?.displayLocation || {};
    const currentPhase = jobOffer?.availablePhasesForCrop?.find(
      (phase) => phase.id === jobOffer.phaseId
    );

    const fullLocation = [
      location?.village && `Vereda ${location.village}`,
      location?.city,
      location?.department,
      location?.country,
    ]
      .filter(Boolean)
      .join(", ");

    const message = `📢 *Oportunidad laboral en ${
      jobOffer?.cropType?.name || "agricultura"
    }*\n
🔹 *Cargo:* ${jobOffer.title}
🔹 *Ubicación:* ${fullLocation}
🔹 *Salario:* ${new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      maximumFractionDigits: 0,
    }).format(jobOffer.salary)}
🔹 *Duración:* ${jobOffer.duration || "No especificado"} días
🔹 *Postulantes:* ${jobOffer.applicationsCount || 0}

📲 Más detalles en la app *Jornaleros*.`;

    try {
      await Share.share({
        title: `Oferta laboral: ${jobOffer.title}`,
        message,
      });
    } catch (error) {
      console.error("Error al compartir:", error);
      Alert.alert("Error", "No se pudo compartir la oferta.");
    }
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
        {/* Header mejorado */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}>
            <Icon name="arrow-back" size={24} color={COLORS.primary} />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Detalles de la Oferta</Text>

          <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
            <Icon name="share" size={20} color={COLORS.primary} />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}>
          {/* Sección Hero */}
          <HeroSection jobOffer={jobOffer} />

          {/* Tarjetas de información */}
          <LocationCard jobOffer={jobOffer} />
          <PaymentCard jobOffer={jobOffer} />
          <WorkPhaseCard jobOffer={jobOffer} />
          <FarmInfoCard jobOffer={jobOffer} />
          <AdditionalDetailsCard jobOffer={jobOffer} />

          {/* Descripción */}
          {jobOffer?.description && (
            <InfoCard
              icon="description"
              iconColor={COLORS.accent}
              title="Descripción del Trabajo"
              subtitle="Detalles adicionales sobre la oferta">
              <Text style={styles.descriptionText}>{jobOffer.description}</Text>
            </InfoCard>
          )}

          {/* Información del empleador */}
          <EmployerCard jobOffer={jobOffer} />

          {/* Botones de acción - AHORA DENTRO DEL SCROLL */}
          <View style={styles.actionSection}>
            <TouchableOpacity
              style={[styles.actionButton, styles.editButton]}
              onPress={() =>
                navigation.navigate("EditJobOffer", {
                  jobOfferId: jobOffer.id,
                })
              }>
              <Icon name="edit" size={20} color={COLORS.white} />
              <Text style={styles.actionButtonText}>Editar Oferta</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.applicantsButton]}
              onPress={() =>
                navigation.navigate("JobApplications", {
                  jobOfferId: jobOffer.id,
                })
              }>
              <Icon name="people" size={20} color={COLORS.white} />
              <Text style={styles.actionButtonText}>
                Ver Postulantes ({jobOffer?.applicationsCount || 0})
              </Text>
            </TouchableOpacity>
          </View>
          <View style={styles.bottomSpacing} />
        </ScrollView>
      </View>
      <CustomTabBar navigation={navigation} currentRoute="JobOfferDetail" />
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.lightGray,
  },

  // Header styles mejorados
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    shadowColor: COLORS.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: `${COLORS.primary}10`,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.darkGray,
  },
  shareButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: `${COLORS.primary}10`,
  },

  // Scroll view
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },

  // Loading and error states
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.lightGray,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.mediumGray,
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
    color: COLORS.mediumGray,
    textAlign: "center",
    marginVertical: 16,
  },
  retryButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "600",
  },

  // Hero section mejorada
  heroContainer: {
    backgroundColor: COLORS.white,
    margin: 16,
    borderRadius: 20,
    padding: 24,
    shadowColor: COLORS.cardShadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  heroHeader: {
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
    marginBottom: 16,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.white,
    textTransform: "uppercase",
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: COLORS.darkGray,
    marginBottom: 16,
    lineHeight: 30,
  },
  cropInfoContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 20,
  },
  cropInfoItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.background,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
  },
  cropIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.white,
    justifyContent: "center",
    alignItems: "center",
  },
  cropInfoText: {
    fontSize: 14,
    color: COLORS.darkGray,
    fontWeight: "600",
  },

  // Estadísticas del hero
  heroStats: {
    gap: 16,
  },
  salaryCard: {
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    marginBottom: 16,
  },
  salaryLabel: {
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
    fontWeight: "500",
    marginBottom: 4,
  },
  salaryAmount: {
    fontSize: 28,
    fontWeight: "800",
    color: COLORS.white,
    marginBottom: 4,
  },
  salaryPeriod: {
    fontSize: 14,
    color: "rgba(255,255,255,0.9)",
    fontWeight: "500",
  },
  statsGrid: {
    flexDirection: "row",
    gap: 12,
  },
  statItem: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    gap: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "800",
    color: COLORS.darkGray,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.mediumGray,
    fontWeight: "500",
    textAlign: "center",
  },

  // Card styles mejorados
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    shadowColor: COLORS.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  highlightCard: {
    borderWidth: 2,
    borderColor: `${COLORS.primary}20`,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  cardIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  cardHeaderText: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.darkGray,
    marginBottom: 2,
  },
  cardSubtitle: {
    fontSize: 13,
    color: COLORS.mediumGray,
    fontWeight: "500",
  },
  cardContent: {
    padding: 20,
  },

  // Detail items mejorados
  detailGrid: {
    gap: 16,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  detailIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 2,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 13,
    color: COLORS.mediumGray,
    fontWeight: "600",
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 15,
    color: COLORS.darkGray,
    fontWeight: "600",
    lineHeight: 20,
  },

  // Location específicos
  locationMain: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    backgroundColor: COLORS.background,
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  locationText: {
    flex: 1,
    fontSize: 15,
    color: COLORS.darkGray,
    fontWeight: "600",
    lineHeight: 22,
  },
  locationDetails: {
    gap: 12,
  },

  // Phase card mejorada
  phaseCard: {
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: 16,
  },
  phaseEmoji: {
    fontSize: 20,
  },
  phaseName: {
    fontSize: 18,
    fontWeight: "800",
    color: COLORS.darkGray,
    marginBottom: 8,
  },
  phaseDescription: {
    fontSize: 15,
    color: COLORS.mediumGray,
    lineHeight: 22,
    marginBottom: 12,
  },
  phaseDuration: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  phaseDurationText: {
    fontSize: 14,
    color: COLORS.phase,
    fontWeight: "600",
  },

  // Payment card mejorada
  paymentMainCard: {
    backgroundColor: `${COLORS.secondary}10`,
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: `${COLORS.secondary}20`,
  },
  paymentHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  paymentTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.darkGray,
  },
  paymentAmount: {
    fontSize: 24,
    fontWeight: "800",
    color: COLORS.secondary,
  },
  plantDetails: {
    gap: 12,
    marginBottom: 16,
  },

  // Benefits section mejorada
  benefitsSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.darkGray,
    marginBottom: 12,
  },
  benefitsGrid: {
    gap: 8,
  },
  benefitItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 8,
    gap: 12,
  },
  benefitIncluded: {
    backgroundColor: `${COLORS.success}10`,
    borderWidth: 1,
    borderColor: `${COLORS.success}30`,
  },
  benefitNotIncluded: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  benefitText: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
  },
  benefitIncludedText: {
    color: COLORS.darkGray,
  },
  benefitNotIncludedText: {
    color: COLORS.mediumGray,
  },

  // Employer card mejorada
  employerContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  employerAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  employerInitial: {
    fontSize: 24,
    fontWeight: "700",
    color: COLORS.white,
  },
  employerInfo: {
    flex: 1,
    gap: 4,
  },
  employerName: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.darkGray,
  },
  employerLocation: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  employerLocationText: {
    fontSize: 13,
    color: COLORS.mediumGray,
    fontWeight: "500",
  },
  employerContact: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  employerContactText: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: "500",
  },

  // Description
  descriptionText: {
    fontSize: 15,
    color: COLORS.darkGray,
    lineHeight: 24,
  },

  // Action section - NUEVA SECCIÓN DENTRO DEL SCROLL
  actionSection: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 16,
    gap: 12,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    shadowColor: COLORS.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  editButton: {
    backgroundColor: COLORS.primary,
  },
  applicantsButton: {
    backgroundColor: COLORS.secondary,
    marginBottom: 40,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.white,
  },

  // Bottom spacing para CustomTabBar
  bottomSpacing: {
    height: 20,
  },

  // Details grid
  detailsGrid: {
    gap: 16,
  },
});

export default JobOfferDetail;
