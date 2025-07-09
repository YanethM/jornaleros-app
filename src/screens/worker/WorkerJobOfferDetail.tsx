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
  getJobOfferById,
} from "../../services/jobOffers";
import {
  createApplication,
  getApplicationByUser,
  cancelApplication,
  checkUserApplicationForJob
} from "../../services/applicationService";
import CustomTabBarWorker from "../../components/CustomTabBarWorker";
import ScreenLayoutWorker from "../../components/ScreenLayoutWorker";

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
  plant: "#059669",
  phase: "#8B5CF6",
};

// ... (todos los componentes anteriores se mantienen igual: HeroSection, EnhancedFarmInfoCard, WorkPhaseCard, PaymentAndBenefitsCard, LocationDetailCard, AdditionalDetailsCard, EmployerCard)

// Componente Hero con información principal mejorado
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
        return COLORS.textLight;
    }
  };

  // Obtener la fase específica de la oferta
  const getCurrentPhase = () => {
    if (!jobOffer?.phaseId || !jobOffer?.availablePhasesForCrop) return null;
    return jobOffer.availablePhasesForCrop.find(phase => phase.id === jobOffer.phaseId);
  };

  const currentPhase = getCurrentPhase();

  return (
    <View style={styles.heroSection}>
      <View style={styles.heroGradient}>
        <View style={styles.heroContent}>
          <View style={styles.heroHeader}>
            <View style={styles.statusContainer}>
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: `${getStatusColor(jobOffer?.status)}20` },
                ]}>
                <View
                  style={[
                    styles.statusDot,
                    { backgroundColor: getStatusColor(jobOffer?.status) },
                  ]}
                />
                <Text
                  style={[
                    styles.statusText,
                    { color: getStatusColor(jobOffer?.status) },
                  ]}>
                  {jobOffer?.status || "Estado desconocido"}
                </Text>
              </View>
            </View>

            {/* Trabajadores requeridos prominente */}
            {jobOffer?.workersNeeded && (
              <View style={styles.workersNeededBadge}>
                <Icon name="groups" size={18} color={COLORS.secondary} />
                <Text style={styles.workersNeededText}>
                  Se necesitan {jobOffer.workersNeeded} {jobOffer.workersNeeded === 1 ? 'trabajador' : 'trabajadores'}
                </Text>
              </View>
            )}

            <Text style={styles.heroTitle}>{jobOffer?.title}</Text>
            
            {/* Información del cultivo y fase específica */}
            <View style={styles.cropPhaseInfo}>
              <View style={styles.cropInfo}>
                <Icon name="eco" size={16} color="rgba(255,255,255,0.8)" />
                <Text style={styles.cropName}>
                  {jobOffer?.cropType?.name || "Cultivo no especificado"}
                </Text>
              </View>
              {currentPhase && (
                <View style={styles.phaseInfo}>
                  <Icon name="timeline" size={16} color="rgba(255,255,255,0.8)" />
                  <Text style={styles.phaseName}>
                    {currentPhase.name.replace(/^[🌾🌱🌿🌼🌰🧺🍫♻️]\s*\d+\.\s*/, "")}
                  </Text>
                </View>
              )}
            </View>
          </View>

          <View style={styles.heroStats}>
            <View style={styles.heroPrimaryCard}>
              <Text style={styles.salaryAmount}>
                {formatCurrency(jobOffer?.salary)}
              </Text>
              <Text style={styles.salaryPeriod}>
                {jobOffer?.paymentType === "Por_dia" ? "por día" : "por trabajo completo"}
              </Text>
            </View>

            <View style={styles.heroMetrics}>
              <View style={styles.metricItem}>
                <Icon name="people" size={20} color={COLORS.success} />
                <Text style={styles.metricValue}>
                  {jobOffer?.applicationsCount || 0}
                </Text>
                <Text style={styles.metricLabel}>Postulantes</Text>
              </View>
              <View style={styles.metricItem}>
                <Icon name="schedule" size={20} color={COLORS.secondary} />
                <Text style={styles.metricValue}>
                  {jobOffer?.duration || 0}
                </Text>
                <Text style={styles.metricLabel}>Días</Text>
              </View>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
};

// Componente mejorado de información de la finca
const EnhancedFarmInfoCard = ({ jobOffer }) => {
  const farmInfo = jobOffer?.farmInfo || jobOffer?.farm;

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
        <View style={styles.farmDetailGrid}>
          <View style={styles.farmDetailItem}>
            <View style={styles.farmDetailIcon}>
              <Icon name="business" size={18} color={COLORS.primary} />
            </View>
            <View style={styles.farmDetailContent}>
              <Text style={styles.farmDetailLabel}>Nombre de la Finca</Text>
              <Text style={styles.farmDetailValue}>
                {farmInfo?.name || "Sin nombre especificado"}
              </Text>
            </View>
          </View>

          <View style={styles.farmDetailItem}>
            <View style={styles.farmDetailIcon}>
              <Icon name="eco" size={18} color={COLORS.success} />
            </View>
            <View style={styles.farmDetailContent}>
              <Text style={styles.farmDetailLabel}>Tipo de Cultivo</Text>
              <Text style={styles.farmDetailValue}>
                {jobOffer?.cropType?.name || "No especificado"}
              </Text>
            </View>
          </View>

          <View style={styles.farmDetailItem}>
            <View style={styles.farmDetailIcon}>
              <Icon name="nature" size={18} color={COLORS.accent} />
            </View>
            <View style={styles.farmDetailContent}>
              <Text style={styles.farmDetailLabel}>Plantas en la Finca</Text>
              <Text style={styles.farmDetailValue}>
                {farmInfo?.plantCount
                  ? `${farmInfo.plantCount.toLocaleString()} plantas`
                  : "No especificado"}
              </Text>
            </View>
          </View>

          <View style={styles.farmDetailItem}>
            <View style={styles.farmDetailIcon}>
              <Icon name="straighten" size={18} color={COLORS.warning} />
            </View>
            <View style={styles.farmDetailContent}>
              <Text style={styles.farmDetailLabel}>Tamaño de la Finca</Text>
              <Text style={styles.farmDetailValue}>
                {farmInfo?.size
                  ? `${farmInfo.size} hectáreas`
                  : "No especificado"}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
};

// Componente especializado para mostrar la fase específica de trabajo
const WorkPhaseCard = ({ jobOffer }) => {
  // Obtener la fase específica de la oferta
  const getCurrentPhase = () => {
    if (!jobOffer?.phaseId || !jobOffer?.availablePhasesForCrop) return null;
    return jobOffer.availablePhasesForCrop.find(phase => phase.id === jobOffer.phaseId);
  };

  // Obtener orden de la fase desde el nombre
  const getPhaseOrder = (phaseName) => {
    const match = phaseName?.match(/(\d+)\./);
    return match ? parseInt(match[1]) : 0;
  };

  // Limpiar nombre de la fase removiendo emoji y número
  const getCleanPhaseName = (phaseName) => {
    return phaseName?.replace(/^[🌾🌱🌿🌼🌰🧺🍫♻️]\s*\d+\.\s*/, "") || "";
  };

  // Obtener emoji de la fase
  const getPhaseEmoji = (phaseName) => {
    const match = phaseName?.match(/^([🌾🌱🌿🌼🌰🧺🍫♻️])/);
    return match ? match[1] : "🌱";
  };

  const currentPhase = getCurrentPhase();
  const availablePhases = jobOffer?.availablePhasesForCrop || [];

  if (!currentPhase) {
    return (
      <View style={styles.infoCard}>
        <View style={styles.cardHeader}>
          <View style={[styles.cardIcon, { backgroundColor: COLORS.phase }]}>
            <Icon name="timeline" size={24} color="#FFFFFF" />
          </View>
          <View style={styles.cardHeaderText}>
            <Text style={styles.cardTitle}>Fase del Cultivo</Text>
            <Text style={styles.cardSubtitle}>No se pudo identificar la fase</Text>
          </View>
        </View>
      </View>
    );
  }

  const phaseOrder = getPhaseOrder(currentPhase.name);
  const phaseEmoji = getPhaseEmoji(currentPhase.name);
  const cleanPhaseName = getCleanPhaseName(currentPhase.name);

  // Ordenar todas las fases disponibles
  const sortedPhases = [...availablePhases].sort((a, b) => 
    getPhaseOrder(a.name) - getPhaseOrder(b.name)
  );

  return (
    <View style={styles.infoCard}>
      <View style={styles.cardHeader}>
        <View style={[styles.cardIcon, { backgroundColor: COLORS.phase }]}>
          <Text style={styles.phaseEmoji}>{phaseEmoji}</Text>
        </View>
        <View style={styles.cardHeaderText}>
          <Text style={styles.cardTitle}>Fase de Trabajo Específica</Text>
          <Text style={styles.cardSubtitle}>
            Etapa del cultivo {jobOffer?.cropType?.name}
          </Text>
        </View>
      </View>

      <View style={styles.cardContent}>
        {/* Fase actual destacada */}
        <View style={styles.currentWorkPhaseCard}>
          <View style={styles.currentPhaseHeader}>
            <View style={styles.currentPhaseNumber}>
              <Text style={styles.currentPhaseNumberText}>{phaseOrder}</Text>
            </View>
            <View style={styles.currentPhaseInfo}>
              <Text style={styles.currentPhaseTitle}>Trabajo a Realizar</Text>
              <Text style={styles.currentPhaseNameText}>{cleanPhaseName}</Text>
              {currentPhase.description && (
                <Text style={styles.currentPhaseDescription}>
                  {currentPhase.description}
                </Text>
              )}
              {currentPhase.duration && (
                <View style={styles.phaseDurationBadge}>
                  <Icon name="schedule" size={14} color={COLORS.phase} />
                  <Text style={styles.phaseDurationText}>
                    Duración estimada: {currentPhase.duration} días
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </View>
    </View>
  );
};

// Componente detallado de pago y beneficios mejorado para mostrar pago por planta
const PaymentAndBenefitsCard = ({ jobOffer = {} }) => {
  const formatCurrency = (amount) => {
    if (!amount) return "No especificado";
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getPaymentTypeText = (type) => {
    switch (type) {
      case "Por_dia":
        return "Por día trabajado";
      case "Por_labor":
        return "Por plantas trabajadas";
      default:
        return "No especificado";
    }
  };

  const getWorkTypeText = (workType) => {
    switch (workType) {
      case "Podar":
        return "Poda de plantas";
      case "Injertar":
        return "Injerto de plantas";
      case "Podar_Injertar":
        return "Poda e injerto";
      case "Otro":
        return "Trabajo especializado";
      default:
        return workType || "No especificado";
    }
  };

  const isPlantPayment = jobOffer.paymentType === "Por_labor";

  return (
    <View style={styles.infoCard}>
      <View style={styles.cardHeader}>
        <View style={[styles.cardIcon, { backgroundColor: COLORS.secondary }]}>
          <Icon name="payments" size={24} color="#FFFFFF" />
        </View>
        <View style={styles.cardHeaderText}>
          <Text style={styles.cardTitle}>Pago y Beneficios</Text>
          <Text style={styles.cardSubtitle}>
            {isPlantPayment ? "Trabajo por plantas" : "Trabajo por jornada"}
          </Text>
        </View>
      </View>

      <View style={styles.cardContent}>
        <View style={styles.paymentGrid}>
          {/* Tarjeta principal de salario */}
          <View style={styles.paymentMainCard}>
            <View style={styles.paymentMainHeader}>
              <Icon 
                name={isPlantPayment ? "local-florist" : "schedule"} 
                size={20} 
                color={COLORS.success} 
              />
              <Text style={styles.paymentMainTitle}>
                {isPlantPayment ? "Pago Total por Trabajo" : "Salario Diario"}
              </Text>
            </View>
            <Text style={styles.paymentMainAmount}>
              {formatCurrency(jobOffer.salary)}
            </Text>
            <Text style={styles.paymentMainType}>
              {getPaymentTypeText(jobOffer.paymentType)}
            </Text>
          </View>

          {/* Detalles específicos para pago por planta */}
          {isPlantPayment && (
            <View style={styles.plantPaymentDetails}>
              <Text style={styles.plantPaymentTitle}>Detalles del Trabajo por Plantas</Text>
              
              <View style={styles.plantDetailsGrid}>
                {jobOffer.plantCount && (
                  <View style={styles.plantDetailItem}>
                    <View style={styles.plantDetailIcon}>
                      <Icon name="nature" size={20} color={COLORS.plant} />
                    </View>
                    <View style={styles.plantDetailContent}>
                      <Text style={styles.plantDetailLabel}>Cantidad de Plantas</Text>
                      <Text style={styles.plantDetailValue}>
                        {parseInt(jobOffer.plantCount).toLocaleString()} plantas
                      </Text>
                    </View>
                  </View>
                )}

                {jobOffer.pricePerUnit && (
                  <View style={styles.plantDetailItem}>
                    <View style={styles.plantDetailIcon}>
                      <Icon name="attach-money" size={20} color={COLORS.plant} />
                    </View>
                    <View style={styles.plantDetailContent}>
                      <Text style={styles.plantDetailLabel}>Precio por Planta</Text>
                      <Text style={styles.plantDetailValue}>
                        {formatCurrency(jobOffer.pricePerUnit)}
                      </Text>
                    </View>
                  </View>
                )}

                {jobOffer.workType && (
                  <View style={styles.plantDetailItem}>
                    <View style={styles.plantDetailIcon}>
                      <Icon name="build" size={20} color={COLORS.plant} />
                    </View>
                    <View style={styles.plantDetailContent}>
                      <Text style={styles.plantDetailLabel}>Tipo de Trabajo</Text>
                      <Text style={styles.plantDetailValue}>
                        {getWorkTypeText(jobOffer.workType)}
                      </Text>
                    </View>
                  </View>
                )}
              </View>

              {/* Cálculo visual si tenemos los datos */}
              {jobOffer.plantCount && jobOffer.pricePerUnit && (
                <View style={styles.paymentCalculation}>
                  <Text style={styles.calculationTitle}>Cálculo del Pago Total</Text>
                  <View style={styles.calculationBreakdown}>
                    <View style={styles.calculationRow}>
                      <Text style={styles.calculationText}>
                        {parseInt(jobOffer.plantCount).toLocaleString()} plantas
                      </Text>
                      <Text style={styles.calculationOperator}>×</Text>
                      <Text style={styles.calculationText}>
                        {formatCurrency(jobOffer.pricePerUnit)}
                      </Text>
                      <Text style={styles.calculationOperator}>=</Text>
                      <Text style={styles.calculationResult}>
                        {formatCurrency(jobOffer.salary)}
                      </Text>
                    </View>
                  </View>
                </View>
              )}
            </View>
          )}

          {/* Información general de pago */}
          <View style={styles.paymentDetailsGrid}>
            <View style={styles.paymentDetailItem}>
              <Icon name="payment" size={20} color={COLORS.primary} />
              <View style={styles.paymentDetailContent}>
                <Text style={styles.paymentDetailLabel}>Método de Pago</Text>
                <Text style={styles.paymentDetailValue}>
                  {jobOffer.paymentMode || "Efectivo"}
                </Text>
              </View>
            </View>

            <View style={styles.paymentDetailItem}>
              <Icon name="schedule" size={20} color={COLORS.accent} />
              <View style={styles.paymentDetailContent}>
                <Text style={styles.paymentDetailLabel}>Duración</Text>
                <Text style={styles.paymentDetailValue}>
                  {jobOffer.duration
                    ? `${jobOffer.duration} días`
                    : "No especificado"}
                </Text>
              </View>
            </View>
          </View>

          {/* Información de tipo de labor para pagos por planta */}
          {jobOffer.laborType && isPlantPayment && (
            <View style={styles.laborTypeCard}>
              <Icon name="work-outline" size={20} color={COLORS.info} />
              <View style={styles.laborTypeContent}>
                <Text style={styles.laborTypeLabel}>Descripción del Trabajo</Text>
                <Text style={styles.laborTypeValue}>{jobOffer.laborType}</Text>
              </View>
            </View>
          )}
        </View>

        {/* Beneficios adicionales */}
        <View style={styles.benefitsSection}>
          <Text style={styles.benefitsSectionTitle}>Beneficios Incluidos</Text>
          <View style={styles.benefitsGrid}>
            <View
              style={[
                styles.benefitItem,
                jobOffer.includesFood
                  ? styles.benefitIncluded
                  : styles.benefitNotIncluded,
              ]}>
              <Icon
                name={jobOffer.includesFood ? "restaurant" : "no-meals"}
                size={20}
                color={
                  jobOffer.includesFood ? COLORS.success : COLORS.textLight
                }
              />
              <Text
                style={[
                  styles.benefitText,
                  jobOffer.includesFood
                    ? styles.benefitIncludedText
                    : styles.benefitNotIncludedText,
                ]}>
                Alimentación
              </Text>
              {jobOffer.includesFood && (
                <Icon name="check-circle" size={16} color={COLORS.success} />
              )}
            </View>

            <View
              style={[
                styles.benefitItem,
                jobOffer.includesLodging
                  ? styles.benefitIncluded
                  : styles.benefitNotIncluded,
              ]}>
              <Icon
                name={jobOffer.includesLodging ? "hotel" : "no-meeting-room"}
                size={20}
                color={
                  jobOffer.includesLodging ? COLORS.success : COLORS.textLight
                }
              />
              <Text
                style={[
                  styles.benefitText,
                  jobOffer.includesLodging
                    ? styles.benefitIncludedText
                    : styles.benefitNotIncludedText,
                ]}>
                Alojamiento
              </Text>
              {jobOffer.includesLodging && (
                <Icon name="check-circle" size={16} color={COLORS.success} />
              )}
            </View>
          </View>
        </View>
      </View>
    </View>
  );
};

// Componente mejorado de ubicación completa
const LocationDetailCard = ({ jobOffer }) => {
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
    <View style={styles.infoCard}>
      <View style={styles.cardHeader}>
        <View style={[styles.cardIcon, { backgroundColor: COLORS.info }]}>
          <Icon name="place" size={24} color="#FFFFFF" />
        </View>
        <View style={styles.cardHeaderText}>
          <Text style={styles.cardTitle}>Ubicación de la Finca</Text>
          <Text style={styles.cardSubtitle}>
            Dirección completa del trabajo
          </Text>
        </View>
      </View>

      <View style={styles.cardContent}>
        <View style={styles.locationDetailContainer}>
          <View style={styles.locationItem}>
            <Icon name="location-on" size={20} color={COLORS.primary} />
            <View style={styles.locationContent}>
              <Text style={styles.locationLabel}>Dirección Completa</Text>
              <Text style={styles.locationValue}>{getCompleteLocation()}</Text>
            </View>
          </View>

          {location?.country && (
            <View style={styles.locationItem}>
              <Icon name="public" size={20} color={COLORS.success} />
              <View style={styles.locationContent}>
                <Text style={styles.locationLabel}>País</Text>
                <Text style={styles.locationValue}>{location.country}</Text>
              </View>
            </View>
          )}

          {location?.department && (
            <View style={styles.locationItem}>
              <Icon name="map" size={20} color={COLORS.secondary} />
              <View style={styles.locationContent}>
                <Text style={styles.locationLabel}>Departamento</Text>
                <Text style={styles.locationValue}>{location.department}</Text>
              </View>
            </View>
          )}

          {location?.city && (
            <View style={styles.locationItem}>
              <Icon name="location-city" size={20} color={COLORS.accent} />
              <View style={styles.locationContent}>
                <Text style={styles.locationLabel}>Ciudad/Municipio</Text>
                <Text style={styles.locationValue}>{location.city}</Text>
              </View>
            </View>
          )}

          {location?.village && (
            <View style={styles.locationItem}>
              <Icon name="landscape" size={20} color={COLORS.warning} />
              <View style={styles.locationContent}>
                <Text style={styles.locationLabel}>Vereda</Text>
                <Text style={styles.locationValue}>{location.village}</Text>
              </View>
            </View>
          )}
        </View>
      </View>
    </View>
  );
};

// Componente de detalles adicionales mejorado
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
    <View style={styles.infoCard}>
      <View style={styles.cardHeader}>
        <View style={[styles.cardIcon, { backgroundColor: COLORS.accent }]}>
          <Icon name="info" size={24} color="#FFFFFF" />
        </View>
        <View style={styles.cardHeaderText}>
          <Text style={styles.cardTitle}>Detalles Adicionales</Text>
          <Text style={styles.cardSubtitle}>
            Información complementaria importante
          </Text>
        </View>
      </View>

      <View style={styles.cardContent}>
        <View style={styles.additionalDetailsGrid}>
          <View style={styles.detailSection}>
            <Text style={styles.detailSectionTitle}>Fechas del Trabajo</Text>
            <View style={styles.detailRow}>
              <View style={styles.detailItem}>
                <Icon name="event" size={20} color={COLORS.success} />
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Fecha de inicio</Text>
                  <Text style={styles.detailValue}>
                    {formatDate(jobOffer?.startDate)}
                  </Text>
                </View>
              </View>

              <View style={styles.detailItem}>
                <Icon name="event-busy" size={20} color={COLORS.error} />
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Fecha de fin</Text>
                  <Text style={styles.detailValue}>
                    {formatDate(jobOffer?.endDate)}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.detailSection}>
            <Text style={styles.detailSectionTitle}>
              Condiciones de Trabajo
            </Text>
            <View style={styles.detailRow}>
              <View style={styles.detailItem}>
                <Icon name="schedule" size={20} color={COLORS.primary} />
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Horario de trabajo</Text>
                  <Text style={styles.detailValue}>
                    {jobOffer?.workSchedule ||
                      "Horario estándar (6:00 AM - 2:00 PM)"}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.detailRow}>
              <View style={styles.detailItem}>
                <Icon name="groups" size={20} color={COLORS.secondary} />
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>
                    Trabajadores requeridos
                  </Text>
                  <Text style={styles.detailValue}>
                    {jobOffer?.workersNeeded 
                      ? `${jobOffer.workersNeeded} ${jobOffer.workersNeeded === 1 ? 'persona' : 'personas'}`
                      : "No especificado"
                    }
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Sección de Requerimientos */}
          {jobOffer?.requirements && (
            <View style={styles.detailSection}>
              <Text style={styles.detailSectionTitle}>
                Requisitos de la Oferta
              </Text>
              <View style={styles.requirementsContainer}>
                <View style={styles.requirementItem}>
                  <Icon name="checklist" size={18} color={COLORS.info} />
                  <Text style={styles.requirementText}>
                    {jobOffer.requirements}
                  </Text>
                </View>
              </View>
            </View>
          )}
        </View>
      </View>
    </View>
  );
};

// Información del empleador/productor mejorada
const EmployerCard = ({ jobOffer }) => {
  const employer = jobOffer?.employer;
  const user = employer?.user;

  return (
    <View style={styles.infoCard}>
      <View style={styles.cardHeader}>
        <View style={[styles.cardIcon, { backgroundColor: COLORS.primary }]}>
          <Icon name="person" size={24} color="#FFFFFF" />
        </View>
        <View style={styles.cardHeaderText}>
          <Text style={styles.cardTitle}>Información del Productor</Text>
          <Text style={styles.cardSubtitle}>
            Empleador de la oferta de trabajo
          </Text>
        </View>
      </View>

      <View style={styles.cardContent}>
        <View style={styles.employerHeader}>
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
              <Icon name="place" size={14} color={COLORS.textLight} />
              <Text style={styles.employerLocationText}>
                {employer?.city}, {employer?.state}
              </Text>
            </View>
          </View>
          <View style={styles.employerStats}>
            <Text style={styles.employerStatsNumber}>
              {employer?.farms?.length || 0}
            </Text>
            <Text style={styles.employerStatsLabel}>Fincas</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

// Componente principal
const WorkerJobOfferDetail = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { jobOfferId } = route.params;
  const { user } = useAuth();

  const [jobOffer, setJobOffer] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Estados para la postulación
  const [userApplication, setUserApplication] = useState(null); // Objeto completo de la aplicación
  const [applicationLoading, setApplicationLoading] = useState(false);
  const [checkingApplicationStatus, setCheckingApplicationStatus] = useState(false);

  const loadJobOfferDetails = useCallback(async () => {
    try {
      setLoading(true);
      const jobOfferData = await getJobOfferById(jobOfferId);

      console.log("Job offer response:", jobOfferData);

      if (jobOfferData) {
        setJobOffer(jobOfferData);
        // Verificar el estado de postulación después de cargar la oferta
        await checkUserApplicationStatus();
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

  const checkUserApplicationStatus = useCallback(async () => {
    if (!user?.id || !jobOfferId) return;
    
    try {
      setCheckingApplicationStatus(true);
      
      // Usar la función específica para trabajadores
      const existingApplication = await checkUserApplicationForJob(user, jobOfferId);
      
      console.log("Application check completed:", existingApplication);
      
      setUserApplication(existingApplication);
    } catch (error) {
      console.error("Error verificando estado de postulación:", error);
      setUserApplication(null);
    } finally {
      setCheckingApplicationStatus(false);
    }
  }, [jobOfferId, user]);

  useEffect(() => {
    loadJobOfferDetails();
  }, [loadJobOfferDetails]);

  useFocusEffect(
    useCallback(() => {
      loadJobOfferDetails();
    }, [loadJobOfferDetails])
  );

  const handleApplyToJob = async () => {
    if (!user?.id || !jobOfferId) {
      Alert.alert("Error", "Debes estar autenticado para postularte");
      return;
    }

    // Verificar si la oferta está activa
    if (jobOffer?.status !== "Activo") {
      Alert.alert("Oferta no disponible", "Esta oferta ya no está activa para postulaciones");
      return;
    }

    Alert.alert(
      "Confirmar Postulación",
      `¿Estás seguro de que quieres postularte para el trabajo "${jobOffer?.title}"?`,
      [
        {
          text: "Cancelar",
          style: "cancel",
        },
        {
          text: "Postularme",
          style: "default",
          onPress: async () => {
            try {
              setApplicationLoading(true);
              
              // Verificar que el usuario tenga WorkerProfile
              if (!user.workerProfile?.id) {
                Alert.alert(
                  "Perfil Incompleto", 
                  "Necesitas completar tu perfil de trabajador para postularte a ofertas de trabajo."
                );
                return;
              }

              // Crear la aplicación usando el servicio existente
              const applicationData = {
                userId: user.id,
                // Usar el ID del WorkerProfile como workerId
                workerId: user.workerProfile.id,
                coverLetter: null, // Podría expandirse para incluir carta de presentación
                additionalInfo: null,
              };
              
              console.log("Creating application with data:", applicationData);
              console.log("User object:", user);
              console.log("WorkerProfile ID:", user.workerProfile.id);
              const result = await createApplication(jobOfferId, applicationData);
              
              console.log("Application created successfully:", result);
              
              // Actualizar el estado local
              setUserApplication(result);
              
              Alert.alert(
                "¡Postulación Exitosa!",
                "Te has postulado correctamente a esta oferta de trabajo. El empleador será notificado.",
                [{ text: "Entendido" }]
              );
              
              // Recargar los detalles para actualizar el contador de postulantes
              await loadJobOfferDetails();
            } catch (error) {
              console.error("Error al postularse:", error);
              Alert.alert(
                "Error",
                error.response?.data?.message || 
                error.message || 
                "No se pudo completar la postulación. Inténtalo nuevamente."
              );
            } finally {
              setApplicationLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleWithdrawApplication = async () => {
    if (!userApplication?.id) {
      Alert.alert("Error", "No se encontró la postulación para retirar");
      return;
    }

    Alert.alert(
      "Retirar Postulación",
      "¿Estás seguro de que quieres retirar tu postulación?",
      [
        {
          text: "Cancelar",
          style: "cancel",
        },
        {
          text: "Retirar",
          style: "destructive",
          onPress: async () => {
            try {
              setApplicationLoading(true);
              
              // Llamar al servicio para cancelar/eliminar la postulación
              console.log("Canceling application with ID:", userApplication.id);
              const result = await cancelApplication(userApplication.id);
              
              console.log("Application canceled successfully:", result);
              
              // Limpiar el estado local
              setUserApplication(null);
              
              Alert.alert(
                "Postulación Retirada",
                "Has retirado tu postulación exitosamente.",
                [{ text: "Entendido" }]
              );
              
              // Recargar los detalles para actualizar el contador de postulantes
              await loadJobOfferDetails();
            } catch (error) {
              console.error("Error al retirar postulación:", error);
              Alert.alert(
                "Error",
                error.response?.data?.message || 
                error.message || 
                "No se pudo retirar la postulación. Inténtalo nuevamente."
              );
            } finally {
              setApplicationLoading(false);
            }
          },
        },
      ]
    );
  };

  const getApplicationButtonConfig = () => {
    const isJobActive = jobOffer?.status === "Activo";
    const isOwnJob = jobOffer?.employer?.user?.id === user?.id;
    const hasWorkerProfile = !!user?.workerProfile?.id;
    
    if (isOwnJob) {
      return {
        disabled: true,
        text: "Tu propia oferta",
        backgroundColor: COLORS.textLight,
        icon: "business",
      };
    }

    if (!hasWorkerProfile) {
      return {
        disabled: true,
        text: "Completa tu perfil",
        backgroundColor: COLORS.warning,
        icon: "person-add",
      };
    }

    if (!isJobActive) {
      return {
        disabled: true,
        text: "Oferta no activa",
        backgroundColor: COLORS.textLight,
        icon: "block",
      };
    }

    // Si ya existe una aplicación
    if (userApplication) {
      const status = userApplication.status;
      
      switch (status) {
        case 'accepted':
        case 'Aceptada':
          return {
            disabled: true,
            text: "Postulación Aceptada",
            backgroundColor: COLORS.success,
            icon: "check-circle",
          };
        case 'rejected':
        case 'Rechazada':
          return {
            disabled: true,
            text: "Postulación Rechazada",
            backgroundColor: COLORS.error,
            icon: "cancel",
          };
        default:
          // Estados como 'pending', 'applied', 'En_proceso', etc.
          return {
            disabled: false,
            text: "Retirar Postulación",
            backgroundColor: COLORS.error,
            icon: "remove-circle",
            onPress: handleWithdrawApplication,
          };
      }
    }

    // Si no hay aplicación, mostrar botón para postularse
    return {
      disabled: false,
      text: "Postularme",
      backgroundColor: COLORS.primary,
      icon: "work",
      onPress: handleApplyToJob,
    };
  };

  const handleShare = async () => {
    if (!jobOffer) return;

    const location = jobOffer?.farmInfo?.location || jobOffer?.displayLocation || {};
    const getCurrentPhase = () => {
      if (!jobOffer?.phaseId || !jobOffer?.availablePhasesForCrop) return null;
      return jobOffer.availablePhasesForCrop.find(phase => phase.id === jobOffer.phaseId);
    };

    const currentPhase = getCurrentPhase();
    const cleanPhaseName = currentPhase?.name?.replace(/^[🌾🌱🌿🌼🌰🧺🍫♻️]\s*\d+\.\s*/, "") || "No especificada";

    const fullLocation = [
      location?.village && `Vereda ${location.village}`,
      location?.city,
      location?.department,
      location?.country,
    ]
      .filter(Boolean)
      .join(", ");

    const includesFood = jobOffer.includesFood
      ? "✔ Alimentación incluida"
      : "✘ Sin alimentación";
    const includesLodging = jobOffer.includesLodging
      ? "✔ Alojamiento incluido"
      : "✘ Sin alojamiento";
    const cropType = jobOffer?.cropType?.name || "No especificado";

    const formattedSalary = jobOffer.salary
      ? new Intl.NumberFormat("es-CO", {
          style: "currency",
          currency: "COP",
          maximumFractionDigits: 0,
        }).format(jobOffer.salary)
      : "No especificado";

    const workersNeeded = jobOffer?.workersNeeded 
      ? `\n🔹 *Trabajadores requeridos:* ${jobOffer.workersNeeded} ${jobOffer.workersNeeded === 1 ? 'persona' : 'personas'}`
      : '';

    const phaseInfo = `\n🔹 *Fase del cultivo:* ${cleanPhaseName}`;

    const paymentDetails = jobOffer.paymentType === "Por_labor" && jobOffer.plantCount
      ? `\n🔹 *Plantas a trabajar:* ${parseInt(jobOffer.plantCount).toLocaleString()} plantas`
      : '';

    const requirements = jobOffer?.requirements 
      ? `\n🔹 *Requisitos:* ${jobOffer.requirements}`
      : '';

    const message = `📢 *Nueva oportunidad laboral disponible*\n
🔹 *Cargo:* ${jobOffer.title}
🔹 *Ubicación:* ${fullLocation}
🔹 *Tipo de cultivo:* ${cropType}${phaseInfo}
🔹 *Remuneración:* ${formattedSalary} (${
      jobOffer.paymentType === "Por_dia"
        ? "por día trabajado"
        : "por trabajo completo"
    })${paymentDetails}${workersNeeded}
🔹 *Beneficios:*
  - ${includesFood}
  - ${includesLodging}${requirements}

📲 Conoce más detalles descargando la app *Jornaleros*.`;

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

  const buttonConfig = getApplicationButtonConfig();

  return (
    <ScreenLayoutWorker navigation={navigation}>
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

        {/* Mensaje para usuarios sin WorkerProfile */}
        {user && !user.workerProfile?.id && (
          <View style={styles.infoCard}>
            <View style={styles.cardHeader}>
              <View style={[styles.cardIcon, { backgroundColor: COLORS.warning }]}>
                <Icon name="person-add" size={24} color="#FFFFFF" />
              </View>
              <View style={styles.cardHeaderText}>
                <Text style={styles.cardTitle}>Completa tu Perfil</Text>
                <Text style={styles.cardSubtitle}>Para postularte a ofertas de trabajo</Text>
              </View>
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.descriptionText}>
                Para postularte a ofertas de trabajo necesitas completar tu perfil de trabajador. 
                Esto incluye información sobre tus habilidades, experiencia y disponibilidad.
              </Text>
              <TouchableOpacity 
                style={[styles.actionButton, { backgroundColor: COLORS.warning, marginTop: 16 }]}
                onPress={() => navigation.navigate("WorkerProfile")}
              >
                <Icon name="person-add" size={20} color="#FFFFFF" />
                <Text style={styles.actionButtonText}>Completar Perfil</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}>
          {/* Hero Section */}
          <HeroSection jobOffer={jobOffer} />

          {/* Ubicación Detallada */}
          <LocationDetailCard jobOffer={jobOffer} />

          {/* Información Mejorada de la Finca */}
          <EnhancedFarmInfoCard jobOffer={jobOffer} />

          {/* Fase específica de trabajo */}
          <WorkPhaseCard jobOffer={jobOffer} />

          {/* Pago y Beneficios Mejorado */}
          <PaymentAndBenefitsCard jobOffer={jobOffer} />
          
          {/* Detalles Adicionales */}
          <AdditionalDetailsCard jobOffer={jobOffer} />
          
          {/* Descripción */}
          {jobOffer?.description && (
            <View style={styles.infoCard}>
              <View style={styles.cardHeader}>
                <View
                  style={[styles.cardIcon, { backgroundColor: COLORS.accent }]}>
                  <Icon name="description" size={24} color="#FFFFFF" />
                </View>
                <View style={styles.cardHeaderText}>
                  <Text style={styles.cardTitle}>Descripción del Trabajo</Text>
                </View>
              </View>
              <View style={styles.cardContent}>
                <Text style={styles.descriptionText}>
                  {jobOffer.description}
                </Text>
              </View>
            </View>
          )}
          
          {/* Información del Empleador */}
          <EmployerCard jobOffer={jobOffer} />
        </ScrollView>

        {/* Barra de acción con botón de postulación - Solo si tiene WorkerProfile */}
        {user?.workerProfile?.id && (
          <View style={styles.actionBar}>
            <TouchableOpacity
              style={[
                styles.actionButton,
                { 
                  backgroundColor: buttonConfig.backgroundColor,
                  opacity: buttonConfig.disabled ? 0.6 : 1,
                }
              ]}
              onPress={buttonConfig.onPress}
              disabled={buttonConfig.disabled || applicationLoading}
              activeOpacity={0.8}>
              {applicationLoading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Icon name={buttonConfig.icon} size={20} color="#FFFFFF" />
              )}
              <Text style={styles.actionButtonText}>
                {applicationLoading ? "Procesando..." : buttonConfig.text}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
      <CustomTabBarWorker 
  navigation={navigation} 
  currentRoute="WorkerJobs" // Cambiar a la ruta correcta del tab
  state={{
    index: 1, // Índice para WorkerJobs (0=Dashboard, 1=Jobs, 2=Applications, 3=Profile)
    routes: [
      { name: 'WorkerDashboard' },
      { name: 'WorkerJobs' },
      { name: 'WorkerApplications' },
      { name: 'WorkerProfile' }
    ]
  }}
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
    paddingBottom: 100, // Espacio para la barra de acción
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
  // Estilos para trabajadores requeridos en Hero
  workersNeededBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.25)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: "flex-start",
    marginBottom: 16,
    gap: 8,
  },
  workersNeededText: {
    fontSize: 14,
    color: "#FFFFFF",
    fontWeight: "600",
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 12,
    lineHeight: 34,
  },
  // Nuevos estilos para cultivo y fase
  cropPhaseInfo: {
    gap: 8,
  },
  cropInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  cropName: {
    fontSize: 16,
    color: "rgba(255,255,255,0.9)",
    fontWeight: "600",
  },
  phaseInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  phaseName: {
    fontSize: 14,
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
    gap: 10,
  },
  metricItem: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.1)",
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 12,
    minWidth: 65,
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
  // Estilos para fase específica de trabajo
  phaseEmoji: {
    fontSize: 20,
  },
  currentWorkPhaseCard: {
    backgroundColor: `${COLORS.phase}10`,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: `${COLORS.phase}30`,
  },
  currentPhaseHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 16,
  },
  currentPhaseNumber: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.phase,
    justifyContent: "center",
    alignItems: "center",
  },
  currentPhaseNumberText: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  currentPhaseInfo: {
    flex: 1,
  },
  currentPhaseTitle: {
    fontSize: 12,
    color: COLORS.phase,
    fontWeight: "600",
    marginBottom: 4,
    textTransform: "uppercase",
  },
  currentPhaseNameText: {
    fontSize: 18,
    color: COLORS.text,
    fontWeight: "700",
    marginBottom: 8,
  },
  currentPhaseDescription: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
    marginBottom: 8,
  },
  phaseDurationBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: `${COLORS.phase}20`,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: "flex-start",
    gap: 6,
  },
  phaseDurationText: {
    fontSize: 12,
    color: COLORS.phase,
    fontWeight: "500",
  },
  // Location Detail Styles
  locationDetailContainer: {
    gap: 16,
  },
  locationItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  locationContent: {
    flex: 1,
  },
  locationLabel: {
    fontSize: 12,
    color: COLORS.textLight,
    fontWeight: "500",
    marginBottom: 4,
  },
  locationValue: {
    fontSize: 15,
    color: COLORS.text,
    fontWeight: "600",
    lineHeight: 22,
  },
  // Enhanced Farm Info Styles
  farmDetailGrid: {
    gap: 20,
  },
  farmDetailItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  farmDetailIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: `${COLORS.primary}10`,
    justifyContent: "center",
    alignItems: "center",
  },
  farmDetailContent: {
    flex: 1,
  },
  farmDetailLabel: {
    fontSize: 12,
    color: COLORS.textLight,
    fontWeight: "500",
    marginBottom: 2,
  },
  farmDetailValue: {
    fontSize: 15,
    color: COLORS.text,
    fontWeight: "600",
  },
  // Payment and Benefits Styles Mejorados
  paymentGrid: {
    marginBottom: 24,
  },
  paymentMainCard: {
    backgroundColor: `${COLORS.success}10`,
    padding: 20,
    borderRadius: 16,
    alignItems: "center",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: `${COLORS.success}30`,
  },
  paymentMainHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 8,
  },
  paymentMainTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.text,
  },
  paymentMainAmount: {
    fontSize: 28,
    fontWeight: "700",
    color: COLORS.success,
    marginBottom: 4,
  },
  paymentMainType: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: "500",
  },
  // Estilos específicos para pago por planta
  plantPaymentDetails: {
    backgroundColor: `${COLORS.plant}10`,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: `${COLORS.plant}30`,
  },
  plantPaymentTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.plant,
    marginBottom: 16,
    textAlign: "center",
  },
  plantDetailsGrid: {
    gap: 12,
    marginBottom: 16,
  },
  plantDetailItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    padding: 12,
    borderRadius: 12,
    gap: 12,
  },
  plantDetailIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: `${COLORS.plant}20`,
    justifyContent: "center",
    alignItems: "center",
  },
  plantDetailContent: {
    flex: 1,
  },
  plantDetailLabel: {
    fontSize: 12,
    color: COLORS.textLight,
    fontWeight: "500",
    marginBottom: 2,
  },
  plantDetailValue: {
    fontSize: 15,
    color: COLORS.text,
    fontWeight: "600",
  },
  // Cálculo de pago
  paymentCalculation: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
  },
  calculationTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.textSecondary,
    marginBottom: 12,
    textAlign: "center",
  },
  calculationBreakdown: {
    alignItems: "center",
  },
  calculationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  calculationText: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: "500",
  },
  calculationOperator: {
    fontSize: 16,
    color: COLORS.plant,
    fontWeight: "700",
  },
  calculationResult: {
    fontSize: 16,
    color: COLORS.plant,
    fontWeight: "700",
  },
  paymentDetailsGrid: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 16,
  },
  paymentDetailItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.background,
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  paymentDetailContent: {
    flex: 1,
  },
  paymentDetailLabel: {
    fontSize: 12,
    color: COLORS.textLight,
    fontWeight: "500",
    marginBottom: 2,
  },
  paymentDetailValue: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: "600",
  },
  laborTypeCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: `${COLORS.info}10`,
    padding: 16,
    borderRadius: 12,
    gap: 12,
    borderWidth: 1,
    borderColor: `${COLORS.info}30`,
  },
  laborTypeContent: {
    flex: 1,
  },
  laborTypeLabel: {
    fontSize: 12,
    color: COLORS.info,
    fontWeight: "500",
    marginBottom: 2,
  },
  laborTypeValue: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: "600",
  },
  benefitsSection: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 20,
  },
  benefitsSectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 16,
  },
  benefitsGrid: {
    gap: 12,
  },
  benefitItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
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
    fontWeight: "500",
  },
  benefitIncludedText: {
    color: COLORS.text,
  },
  benefitNotIncludedText: {
    color: COLORS.textLight,
  },
  // Additional Details Styles
  additionalDetailsGrid: {
    gap: 24,
  },
  detailSection: {
    gap: 12,
  },
  detailSectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 8,
  },
  detailRow: {
    flexDirection: "row",
    gap: 16,
  },
  detailItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    backgroundColor: COLORS.background,
    padding: 16,
    borderRadius: 12,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: COLORS.textLight,
    fontWeight: "500",
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: "600",
    lineHeight: 20,
  },
  // Estilos para sección de requerimientos
  requirementsContainer: {
    backgroundColor: `${COLORS.info}10`,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: `${COLORS.info}30`,
  },
  requirementItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    backgroundColor: COLORS.background,
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  requirementText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 20,
  },
  // Employer Card Styles
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
  descriptionText: {
    fontSize: 15,
    color: COLORS.text,
    lineHeight: 24,
  },
  // Action Bar Styles Mejorados
  actionBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.surface,
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingBottom: Platform.OS === "ios" ? 34 : 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    minHeight: 52,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
});

export default WorkerJobOfferDetail;