import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
  Dimensions,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import ScreenLayout from "../../components/ScreenLayout";
import CustomTabBar from "../../components/CustomTabBar";
import { getWorkerById } from "../../services/workerService";
import ApiClient from "../../utils/api";
import { useAuth } from "../../context/AuthContext";

const { width } = Dimensions.get("window");
const PRIMARY_COLOR = "#274F66";
const SECONDARY_COLOR = "#B6883E";

const COLORS = {
  primary: PRIMARY_COLOR,
  secondary: SECONDARY_COLOR,
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
  muted: "#EDF2F7",
};

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

const WorkerProfileApplication = ({ navigation, route }) => {
  const { user } = useAuth();
  const {
    workerId,
    jobOfferId,
    applicationId,
    applicationStatus,
    showApplicationActions = false,
  } = route?.params || {};
  const [skill, setSkill] = useState(null);
  const [worker, setWorker] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processingStatus, setProcessingStatus] = useState(false);
  const [currentApplicationStatus, setCurrentApplicationStatus] =
    useState(applicationStatus);

  useEffect(() => {
    if (workerId) {
      loadWorkerProfile();
    } else {
      setError("ID del trabajador no proporcionado");
      setLoading(false);
    }
  }, [workerId]);

  const loadWorkerProfile = async () => {
    try {
      setLoading(true);
      setError(null);

      const workerData = await getWorkerById(workerId);

      const mappedData = {
        id: workerData.id,
        availability: workerData.availability ?? true,
        averageRating: workerData.averageRating || workerData.rating || 0,
        totalReviews: workerData.totalReviews || 0,
        completedJobs: workerData.completedJobs || 0,
        experience: workerData.experience || "", // Add this line
        skills: workerData.skills || [],
        interests: workerData.interests || [],
        qualifications: workerData.qualifications || [],
        workerSkills: workerData.workerSkills || [],

        user: {
          id: workerData.user?.id || workerData.userId || workerId,
          name: workerData.user?.name || workerData.name || "Sin nombre",
          lastname: workerData.user?.lastname || workerData.lastname || "",
          email: workerData.user?.email || workerData.email || "Sin email",
          phone: workerData.user?.phone || workerData.phone || "",
          city:
            workerData.user?.location?.city ||
            workerData.user?.city ||
            "Sin ciudad",
          departmentState:
            workerData.user?.location?.department ||
            workerData.user?.departmentState ||
            "Sin departamento",
          country: workerData.user?.location?.country || "Colombia", // Add country
          isVerified: workerData.user?.isVerified || false,
        },
      };

      setWorker(mappedData);
    } catch (error) {
      let errorMessage = "Error al cargar el perfil del trabajador";

      if (error.status === 404) {
        errorMessage = "Trabajador no encontrado";
      } else if (error.status === 403) {
        errorMessage = "No tienes permisos para ver este perfil";
      } else if (error.message) {
        errorMessage = error.message;
      }

      setError(errorMessage);

      Alert.alert("Error", errorMessage, [
        { text: "Cerrar", style: "cancel" },
        {
          text: "Reintentar",
          onPress: () => loadWorkerProfile(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateApplicationStatus = async (newStatus) => {
    if (!applicationId) {
      Alert.alert("Error", "No se puede actualizar el estado de la aplicación");
      return;
    }

    try {
      setProcessingStatus(true);

      const response = await ApiClient.put(
        `/application/${applicationId}/status`,
        {
          status: newStatus,
        }
      );

      if (response.success || response.data) {
        setCurrentApplicationStatus(newStatus);

        const statusText = APPLICATION_STATUSES[newStatus]?.label || newStatus;
        Alert.alert(
          "Éxito",
          `La postulación ha sido ${statusText.toLowerCase()}`,
          [
            {
              text: "Continuar",
              onPress: () => navigation.goBack(),
            },
          ]
        );
      } else {
        throw new Error("Error updating application status");
      }
    } catch (error) {
      console.error("Error updating application status:", error);
      Alert.alert("Error", "No se pudo actualizar el estado de la postulación");
    } finally {
      setProcessingStatus(false);
    }
  };

  const showApplicationStatusDialog = () => {
    const currentStatus = currentApplicationStatus;
    const options = Object.entries(APPLICATION_STATUSES)
      .filter(([status]) => status !== currentStatus)
      .map(([status, config]) => ({
        text: config.label,
        onPress: () => handleUpdateApplicationStatus(status),
      }));

    options.push({
      text: "Cancelar",
      onPress: () => {},
      style: "cancel",
    });

    Alert.alert(
      "Cambiar estado de la postulación",
      `Estado actual: ${
        APPLICATION_STATUSES[currentStatus]?.label || currentStatus
      }\n\n¿Qué acción deseas realizar?`,
      options
    );
  };

  const handleCallWorker = (phoneNumber) => {
    if (phoneNumber && phoneNumber !== "Sin teléfono") {
      Linking.openURL(`tel:${phoneNumber}`);
    } else {
      Alert.alert("Info", "Este trabajador no tiene teléfono registrado");
    }
  };

  const handleEmailWorker = (email) => {
    if (email && email !== "Sin email") {
      Linking.openURL(`mailto:${email}`);
    } else {
      Alert.alert("Info", "Este trabajador no tiene email registrado");
    }
  };

  const getWorkerFullName = (worker: Worker) => {
    return `${worker.user.name || ""} ${worker.user.lastname || ""}`.trim();
  };

  const getLocationText = (worker: Worker) => {
    const cityName =
      typeof worker.user.city === "string"
        ? worker.user.city
        : worker.user.city?.name || "No especificado";

    const stateName =
      typeof worker.user.departmentState === "string"
        ? worker.user.departmentState
        : worker.user.departmentState?.name || worker.user.state?.name || "";

    return stateName ? `${cityName}, ${stateName}` : cityName;
  };
  
  const handleContactWorker = () => {
    if (!worker) return;
    const workerFullName = getWorkerFullName(worker);

    navigation.navigate("AddMessage", {
      // Para evitar confusión, pasamos todos los datos que necesitamos:
      receiverId: worker.user.id, // ← User ID para enviar mensaje
      workerName: workerFullName,
      workerEmail: worker.user?.email,
      workerPhone: worker.user?.phone,

      // Datos completos del worker para mostrar en la UI
      workerProfile: {
        id: worker.id, // WorkerProfile ID
        user: worker.user, // Datos del usuario
        skills: worker.skills || [],
        availability: worker.availability,
        experience: worker.experience,
        applicationStatus: worker.applicationStatus,
        location: getLocationText(worker),
      },
    });
  };

  const renderStarRating = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(
          <Icon key={i} name="star" size={16} color={COLORS.warning} />
        );
      } else if (i === fullStars && hasHalfStar) {
        stars.push(
          <Icon key={i} name="star-half" size={16} color={COLORS.warning} />
        );
      } else {
        stars.push(
          <Icon key={i} name="star-border" size={16} color={COLORS.textLight} />
        );
      }
    }

    return <View style={styles.starContainer}>{stars}</View>;
  };

  const renderApplicationStatusCard = () => {
    if (!showApplicationActions || !currentApplicationStatus) {
      return null;
    }

    const statusConfig = APPLICATION_STATUSES[currentApplicationStatus] || {
      label: currentApplicationStatus,
      color: "#757575",
      icon: "help",
      bgColor: "#F5F5F5",
    };

    return (
      <View style={styles.applicationStatusCard}>
        <View style={styles.sectionHeader}>
          <Icon name="assignment" size={24} color={PRIMARY_COLOR} />
          <Text style={styles.sectionTitle}>Estado de la Postulación</Text>
        </View>

        <View style={styles.currentStatusContainer}>
          <View
            style={[
              styles.statusBadgeLarge,
              { backgroundColor: statusConfig.bgColor },
            ]}>
            <Icon
              name={statusConfig.icon}
              size={24}
              color={statusConfig.color}
            />
            <Text
              style={[styles.statusTextLarge, { color: statusConfig.color }]}>
              {statusConfig.label}
            </Text>
          </View>
        </View>

        {currentApplicationStatus === "Pendiente" && (
          <View style={styles.actionButtonsContainer}>
            <TouchableOpacity
              style={[styles.actionButton, styles.acceptButton]}
              onPress={() => handleUpdateApplicationStatus("Aceptada")}
              disabled={processingStatus}>
              {processingStatus ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Icon name="check-circle" size={20} color="#fff" />
                  <Text style={styles.actionButtonText}>Aceptar</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.rejectButton]}
              onPress={() => handleUpdateApplicationStatus("Rechazada")}
              disabled={processingStatus}>
              {processingStatus ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Icon name="cancel" size={20} color="#fff" />
                  <Text style={styles.actionButtonText}>Rechazar</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        {currentApplicationStatus !== "Pendiente" && (
          <TouchableOpacity
            style={styles.changeStatusButton}
            onPress={showApplicationStatusDialog}
            disabled={processingStatus}>
            <Icon name="edit" size={20} color={PRIMARY_COLOR} />
            <Text style={styles.changeStatusButtonText}>Cambiar Estado</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderPersonalInfo = () => {
    if (!worker?.user) return null;

    const { user } = worker;

    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Icon name="person" size={24} color={PRIMARY_COLOR} />
          <Text style={styles.sectionTitle}>Información Personal</Text>
        </View>

        <View style={styles.profileHeader}>
          <View style={styles.profileAvatar}>
            <Text style={styles.avatarText}>
              {user.name.charAt(0).toUpperCase()}
              {user.lastname?.charAt(0).toUpperCase() || ""}
            </Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>
              {user.name} {user.lastname}
            </Text>
            <View style={styles.ratingContainer}>
              {renderStarRating(worker.averageRating || 0)}
              <Text style={styles.ratingText}>
                {worker.averageRating?.toFixed(1) || "0.0"} (
                {worker.totalReviews || 0} reseñas)
              </Text>
            </View>
            <View style={styles.badgeContainer}>
              <View
                style={[
                  styles.availabilityBadge,
                  {
                    backgroundColor: worker.availability
                      ? `${COLORS.success}15`
                      : `${COLORS.error}15`,
                  },
                ]}>
                <Icon
                  name={worker.availability ? "check-circle" : "cancel"}
                  size={16}
                  color={worker.availability ? COLORS.success : COLORS.error}
                />
                <Text
                  style={[
                    styles.availabilityText,
                    {
                      color: worker.availability
                        ? COLORS.success
                        : COLORS.error,
                    },
                  ]}>
                  {worker.availability ? "Disponible" : "No disponible"}
                </Text>
              </View>
              {user.isVerified && (
                <View style={styles.verifiedBadge}>
                  <Icon name="verified" size={16} color={COLORS.info} />
                  <Text style={styles.verifiedText}>Verificado</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {worker.bio && (
          <View style={styles.bioContainer}>
            <Text style={styles.bioText}>{worker.bio}</Text>
          </View>
        )}

        <View style={styles.contactInfoSection}>
          <View style={styles.contactInfoGrid}>
            <TouchableOpacity
              style={styles.contactInfoCard}
              onPress={() => handleEmailWorker(user.email)}
              disabled={!user.email || user.email === "Sin email"}>
              <View
                style={[
                  styles.contactInfoIconContainer,
                  { backgroundColor: `${COLORS.info}15` },
                ]}>
                <Icon name="email" size={24} color={COLORS.info} />
              </View>
              <View style={styles.contactInfoContent}>
                <Text style={styles.contactInfoLabel}>Correo Electrónico</Text>
                <Text
                  style={[
                    styles.contactInfoValue,
                    user.email && user.email !== "Sin email"
                      ? styles.linkText
                      : styles.disabledText,
                  ]}
                  numberOfLines={2}>
                  {user.email || "No disponible"}
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.contactInfoCard}
              onPress={() => handleCallWorker(user.phone)}
              disabled={!user.phone || user.phone === "Sin teléfono"}>
              <View
                style={[
                  styles.contactInfoIconContainer,
                  { backgroundColor: `${COLORS.success}15` },
                ]}>
                <Icon name="phone" size={24} color={COLORS.success} />
              </View>
              <View style={styles.contactInfoContent}>
                <Text style={styles.contactInfoLabel}>Teléfono</Text>
                <Text
                  style={[
                    styles.contactInfoValue,
                    user.phone && user.phone !== "Sin teléfono"
                      ? styles.linkText
                      : styles.disabledText,
                  ]}>
                  {user.phone || "No disponible"}
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.locationSection}>
          <View style={styles.locationCard}>
            <View style={styles.locationIconContainer}>
              <Icon name="location-on" size={32} color={COLORS.error} />
            </View>
            <View style={styles.locationContent}>
              {user.city && user.city !== "Sin ciudad" && (
                <View style={styles.locationItem}>
                  <Icon
                    name="location-city"
                    size={16}
                    color={COLORS.textSecondary}
                  />
                  <Text style={styles.locationLabel}>Ciudad:</Text>
                  <Text style={styles.locationValue}>{user.city}</Text>
                </View>
              )}
              {user.departmentState &&
                user.departmentState !== "Sin departamento" && (
                  <View style={styles.locationItem}>
                    <Icon name="map" size={16} color={COLORS.textSecondary} />
                    <Text style={styles.locationLabel}>Departamento:</Text>
                    <Text style={styles.locationValue}>
                      {user.departmentState}
                    </Text>
                  </View>
                )}
              {user.country && (
                <View style={styles.locationItem}>
                  <Icon name="public" size={16} color={COLORS.textSecondary} />
                  <Text style={styles.locationLabel}>País:</Text>
                  <Text style={styles.locationValue}>{user.country}</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {worker.experience && (
          <View style={styles.experienceContainer}>
            <View style={styles.sectionHeader}>
              <Icon name="work-outline" size={24} color={PRIMARY_COLOR} />
              <Text style={styles.sectionTitle}>Experiencia General</Text>
            </View>
            <Text style={styles.experienceText}>{worker.experience}</Text>
          </View>
        )}
      </View>
    );
  };

  const renderWorkStats = () => {
    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Icon name="trending-up" size={24} color={PRIMARY_COLOR} />
          <Text style={styles.sectionTitle}>Estadísticas de Trabajo</Text>
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <View
              style={[
                styles.statIconContainer,
                { backgroundColor: `${COLORS.info}15` },
              ]}>
              <Icon name="work" size={24} color={COLORS.info} />
            </View>
            <Text style={styles.statValue}>{worker.completedJobs || 0}</Text>
            <Text style={styles.statLabel}>Trabajos Completados</Text>
          </View>

          <View style={styles.statItem}>
            <View
              style={[
                styles.statIconContainer,
                { backgroundColor: `${COLORS.accent}15` },
              ]}>
              <Icon name="assignment" size={24} color={COLORS.accent} />
            </View>
            <Text style={styles.statValue}>{worker.totalJobs || 0}</Text>
            <Text style={styles.statLabel}>Total de Trabajos</Text>
          </View>

          <View style={styles.statItem}>
            <View
              style={[
                styles.statIconContainer,
                { backgroundColor: `${COLORS.warning}15` },
              ]}>
              <Icon name="rate-review" size={24} color={COLORS.warning} />
            </View>
            <Text style={styles.statValue}>{worker.totalReviews || 0}</Text>
            <Text style={styles.statLabel}>Total Reseñas</Text>
          </View>
        </View>
      </View>
    );
  };

  const renderSkillsAndExperience = () => {
    const workerSkills = worker?.workerSkills || [];
    const generalSkills = worker?.skills || [];
  
    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Icon name="stars" size={24} color={PRIMARY_COLOR} />
          <Text style={styles.sectionTitle}>Competencias Profesionales</Text>
        </View>
  
        {/* Habilidades Especializadas */}
        {workerSkills.length > 0 && (
          <View style={styles.subsection}>
            <View style={styles.subsectionHeader}>
              <Icon name="agriculture" size={20} color={SECONDARY_COLOR} />
              <Text style={styles.subsectionTitle}>Especializaciones</Text>
            </View>
            
            <View style={styles.skillsCarousel}>
              {workerSkills.map((skill) => (
                <View key={skill.id} style={styles.skillCard}>
                  <View style={styles.skillHeader}>
                    <View style={styles.skillIcon}>
                      <Icon name="spa" size={24} color="#4CAF50" />
                    </View>
                    <View style={styles.skillTitleContainer}>
                      <Text style={styles.skillName}>
                        {skill.cropType || "Cultivo"}
                      </Text>
                      {skill.certified && (
                        <View style={styles.certifiedBadge}>
                          <Icon name="verified" size={12} color="#fff" />
                          <Text style={styles.certifiedText}>Certificado</Text>
                        </View>
                      )}
                    </View>
                  </View>
  
                  <View style={styles.skillProgress}>
                    <View style={styles.progressBarContainer}>
                      <Text style={styles.progressLabel}>Experiencia</Text>
                      <View style={styles.progressBar}>
                        <View style={[
                          styles.progressFill, 
                          { 
                            width: `${Math.min(skill.yearsOfExperience * 20, 100)}%`,
                            backgroundColor: getExperienceColor(skill.yearsOfExperience)
                          }
                        ]} />
                      </View>
                      <Text style={styles.progressValue}>
                        {skill.yearsOfExperience} año(s) - {skill.experienceLevel}
                      </Text>
                    </View>
                  </View>
  
                  {skill.notes && (
                    <View style={styles.notesContainer}>
                      <Icon name="notes" size={16} color={COLORS.textSecondary} />
                      <Text style={styles.skillNotes}>{skill.notes}</Text>
                    </View>
                  )}
                </View>
              ))}
            </View>
          </View>
        )}
  
        {/* Habilidades Generales */}
        {generalSkills.length > 0 && (
          <View style={styles.subsection}>
            <View style={styles.subsectionHeader}>
              <Icon name="handyman" size={20} color={SECONDARY_COLOR} />
              <Text style={styles.subsectionTitle}>Habilidades Técnicas</Text>
            </View>
            
            <View style={styles.skillsCloud}>
              {generalSkills.map((skill, index) => (
                <View key={`general-${index}`} style={[
                  styles.skillPill,
                  { backgroundColor: getRandomPillColor(index) }
                ]}>
                  <Text style={styles.skillPillText}>{skill}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
  
        {/* Estado vacío */}
        {workerSkills.length === 0 && generalSkills.length === 0 && (
          <View style={styles.emptyState}>
            <Icon name="info-outline" size={40} color={COLORS.textLight} />
            <Text style={styles.emptyStateText}>
              Este profesional aún no ha registrado sus habilidades
            </Text>
          </View>
        )}
      </View>
    );
  };
  
  // Función auxiliar para colores de experiencia
  const getExperienceColor = (years) => {
    if (years >= 5) return '#2E7D32'; // Verde oscuro para expertos
    if (years >= 3) return '#689F38'; // Verde intermedio
    return '#9E9E9E'; // Gris para principiantes
  };
  
  // Función para colores aleatorios de pastillas
  const getRandomPillColor = (index) => {
    const colors = [
      '#E3F2FD', '#E8F5E9', '#FFF8E1', '#F3E5F5', 
      '#E0F7FA', '#FBE9E7', '#EDE7F6', '#E8EAF6'
    ];
    return colors[index % colors.length];
  };

  const renderQualificationsAndInterests = () => {
    const qualifications = worker?.qualifications || [];
    const interests = worker?.interests || [];

    if (qualifications.length === 0 && interests.length === 0) {
      return null;
    }

    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Icon name="school" size={24} color={PRIMARY_COLOR} />
          <Text style={styles.sectionTitle}>Calificaciones e Intereses</Text>
        </View>

        {qualifications.length > 0 && (
          <View style={styles.subsection}>
            <Text style={styles.subsectionTitle}>Calificaciones</Text>
            <View style={styles.listContainer}>
              {qualifications.map((qualification, index) => (
                <View key={index} style={styles.listItem}>
                  <Icon
                    name="fiber-manual-record"
                    size={8}
                    color={COLORS.textSecondary}
                  />
                  <Text style={styles.listItemText}>{qualification}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {interests.length > 0 && (
          <View style={styles.subsection}>
            <Text style={styles.subsectionTitle}>Intereses</Text>
            <View style={styles.listContainer}>
              {interests.map((interest, index) => (
                <View key={index} style={styles.listItem}>
                  <Icon
                    name="fiber-manual-record"
                    size={8}
                    color={COLORS.textSecondary}
                  />
                  <Text style={styles.listItemText}>{interest}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </View>
    );
  };

  const renderContactActions = () => {
    if (!worker?.user) return null;

    return (
      <View style={styles.contactSection}>
        <Text style={styles.contactTitle}>
          ¿Deseas contactar a {worker.user.name}?
        </Text>

        <View style={styles.contactActions}>
          <TouchableOpacity
            style={styles.contactButton}
            onPress={handleContactWorker}>
            <Icon name="message" size={20} color="#fff" />
            <Text style={styles.contactButtonText}>Enviar Mensaje</Text>
          </TouchableOpacity>

          <View style={styles.secondaryActions}>
            {worker.user.phone && worker.user.phone !== "Sin teléfono" && (
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => handleCallWorker(worker.user.phone)}>
                <Icon name="phone" size={20} color={PRIMARY_COLOR} />
                <Text style={styles.secondaryButtonText}>Llamar</Text>
              </TouchableOpacity>
            )}

            {worker.user.email && worker.user.email !== "Sin email" && (
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => handleEmailWorker(worker.user.email)}>
                <Icon name="email" size={20} color={PRIMARY_COLOR} />
                <Text style={styles.secondaryButtonText}>Email</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    );
  };

  const renderErrorState = () => (
    <View style={styles.errorContainer}>
      <View style={styles.errorIconContainer}>
        <Icon name="error-outline" size={80} color={COLORS.error} />
      </View>
      <Text style={styles.errorTitle}>Error al Cargar Perfil</Text>
      <Text style={styles.errorSubtitle}>{error}</Text>
      <TouchableOpacity style={styles.retryButton} onPress={loadWorkerProfile}>
        <Icon name="refresh" size={20} color="#fff" />
        <Text style={styles.retryButtonText}>Reintentar</Text>
      </TouchableOpacity>
    </View>
  );

  const renderLoadingState = () => (
    <View style={styles.loadingContainer}>
      <View style={styles.loadingCard}>
        <ActivityIndicator size="large" color={PRIMARY_COLOR} />
        <Text style={styles.loadingText}>Cargando perfil...</Text>
      </View>
    </View>
  );

  return (
    <ScreenLayout navigation={navigation}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>
            {showApplicationActions
              ? "Revisar Postulación"
              : "Perfil del Trabajador"}
          </Text>
        </View>
        <View style={styles.headerIcon} />
      </View>

      {loading ? (
        renderLoadingState()
      ) : error ? (
        renderErrorState()
      ) : (
        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}>
          {renderApplicationStatusCard()}
          {renderPersonalInfo()}
          {renderSkillsAndExperience()}
          {renderWorkStats()}
          {renderQualificationsAndInterests()}
          {renderContactActions()}
        </ScrollView>
      )}

      <CustomTabBar
        navigation={navigation}
        currentRoute="WorkerProfileApplication"
      />
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  // Header Styles
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: PRIMARY_COLOR,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: PRIMARY_COLOR,
    marginLeft: 12,
  },
  subsection: {
    marginBottom: 20,
  },
  subsectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  subsectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginLeft: 8,
  },
  skillsCarousel: {
    gap: 12,
  },
  skillCard: {
    backgroundColor: '#FAFAFA',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: PRIMARY_COLOR,
  },
  skillHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  skillIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  skillTitleContainer: {
    flex: 1,
  },
  skillName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  certifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 4,
    alignSelf: 'flex-start',
  },
  certifiedText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 4,
  },
  skillProgress: {
    marginVertical: 8,
  },
  progressBarContainer: {
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#E0E0E0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressValue: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  notesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
  },
  skillNotes: {
    fontSize: 14,
    color: COLORS.text,
    marginLeft: 8,
    flex: 1,
  },
  skillsCloud: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  skillPill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
  },
  skillPillText: {
    fontSize: 14,
    color: COLORS.text,
  },
  emptyState: {
    alignItems: 'center',
    padding: 20,
  },
  emptyStateText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 8,
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
    fontSize: 14,
    color: "rgba(255,255,255,0.9)",
    marginTop: 4,
  },
  headerIcon: {
    width: 40,
  },

  // Content Styles
  content: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 120,
  },

  // Loading & Error States
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
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  loadingText: {
    marginTop: 20,
    fontSize: 18,
    fontWeight: "600",
    color: PRIMARY_COLOR,
  },
  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  errorIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: `${COLORS.error}15`,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.error,
    marginBottom: 8,
    textAlign: "center",
  },
  errorSubtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 30,
  },
  retryButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.error,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
    marginLeft: 8,
  },

  experienceContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  experienceText: {
    fontSize: 15,
    color: COLORS.text,
    lineHeight: 22,
    paddingHorizontal: 8,
  },
  applicationStatusCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 1.5,
    borderColor: `${PRIMARY_COLOR}20`,
  },
  currentStatusContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  statusBadgeLarge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
  },
  statusTextLarge: {
    fontSize: 18,
    fontWeight: "700",
    marginLeft: 12,
  },
  actionButtonsContainer: {
    flexDirection: "row",
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  acceptButton: {
    backgroundColor: COLORS.success,
  },
  rejectButton: {
    backgroundColor: COLORS.error,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
    marginLeft: 8,
  },
  changeStatusButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderWidth: 1.5,
    borderColor: PRIMARY_COLOR,
    borderRadius: 12,
  },
  changeStatusButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: PRIMARY_COLOR,
    marginLeft: 8,
  },

  // Profile Header
  profileHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  profileAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: PRIMARY_COLOR,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: "700",
    color: "#fff",
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 22,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 8,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  starContainer: {
    flexDirection: "row",
    marginRight: 8,
  },
  ratingText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  badgeContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 8,
  },
  availabilityBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: "flex-start",
  },
  availabilityText: {
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 4,
  },
  verifiedBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: `${COLORS.info}15`,
    alignSelf: "flex-start",
  },
  verifiedText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.info,
    marginLeft: 4,
  },

  // Bio Section
  bioContainer: {
    marginBottom: 20,
    padding: 16,
    backgroundColor: COLORS.muted,
    borderRadius: 12,
  },
  bioText: {
    fontSize: 15,
    color: COLORS.text,
    lineHeight: 22,
  },

  // Contact Info Section
  contactInfoSection: {
    marginBottom: 20,
  },
  contactInfoGrid: {
    gap: 12,
  },
  contactInfoCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  contactInfoIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  contactInfoContent: {
    flex: 1,
  },
  contactInfoLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textTransform: "uppercase",
    fontWeight: "600",
    marginBottom: 4,
  },
  contactInfoValue: {
    fontSize: 16,
    color: COLORS.text,
    fontWeight: "500",
  },
  linkText: {
    color: COLORS.info,
    textDecorationLine: "underline",
  },
  disabledText: {
    color: COLORS.textLight,
    fontStyle: "italic",
  },

  // Location Section
  locationSection: {
    marginBottom: 20,
  },
  locationCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: `${COLORS.error}05`,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: `${COLORS.error}20`,
  },
  locationIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: `${COLORS.error}15`,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  locationContent: {
    flex: 1,
    gap: 8,
  },
  locationItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  locationLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: "500",
    minWidth: 100,
  },
  locationValue: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: "600",
    flex: 1,
  },

  // Stats Section
  statsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
    padding: 16,
    backgroundColor: COLORS.muted,
    borderRadius: 12,
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  statValue: {
    fontSize: 22,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: "center",
  },
  skillsGrid: {
    gap: 12,
  },
 
  skillDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  experienceYears: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.success,
  },
  experienceLabel: {
    fontSize: 12,
    fontWeight: "500",
    color: COLORS.success,
  },
  levelContainer: {
    flex: 1,
    alignItems: "flex-end",
  },
  skillDetail: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: "500",
  },
  skillsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  skillTag: {
    backgroundColor: `${COLORS.secondary}15`,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: `${COLORS.secondary}30`,
  },
  skillTagText: {
    fontSize: 14,
    color: COLORS.secondary,
    fontWeight: "500",
  },

  // List Styles
  listContainer: {
    gap: 8,
  },
  listItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 4,
  },
  listItemText: {
    fontSize: 16,
    color: COLORS.text,
    marginLeft: 12,
    flex: 1,
  },
  noDataText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontStyle: "italic",
    textAlign: "center",
    padding: 20,
  },

  // Contact Section
  contactSection: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  contactTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: PRIMARY_COLOR,
    marginBottom: 16,
    textAlign: "center",
  },
  contactActions: {
    gap: 12,
  },
  contactButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: PRIMARY_COLOR,
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: PRIMARY_COLOR,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  contactButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
    marginLeft: 8,
  },
  secondaryActions: {
    flexDirection: "row",
    gap: 12,
  },
  secondaryButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: PRIMARY_COLOR,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: PRIMARY_COLOR,
    marginLeft: 8,
  },
});

export default WorkerProfileApplication;
