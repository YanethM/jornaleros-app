import React, { useState, useEffect, useCallback } from "react";
import {
  Text,
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Image,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import ScreenLayoutWorker from "../../components/ScreenLayoutWorker";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { getUserData } from "../../services/userService";
import { useAuth } from "../../context/AuthContext";
import { getAvailableJobOffers } from "../../services/jobOffers";
import { getWorkerApplications } from "../../services/workerService";
import { createApplication, getApplicationsByUser } from "../../services/applicationService";
import SuccessModal from "../../components/SuccessModal";

const { width } = Dimensions.get("window");

// Paleta de colores
const COLORS = {
  primary: "#274F66",
  primaryLight: "#3A6B85",
  secondary: "#B6883E",
  background: "#F8FAFC",
  surface: "#FFFFFF",
  text: "#274E66",
  textSecondary: "#4A5568",
  textLight: "#718096",
  success: "#10B981",
  warning: "#F59E0B",
  error: "#EF4444",
  border: "#E2E8F0",
};

// Imágenes por defecto para diferentes tipos de cultivos
const DEFAULT_JOB_IMAGES = {
  cafe: require("../../../assets/onboarding/slide1.png"),
  maiz: require("../../../assets/onboarding/slide1.png"),
  arroz: require("../../../assets/onboarding/slide1.png"),
  platano: require("../../../assets/onboarding/slide1.png"),
  default: require("../../../assets/onboarding/slide1.png"),
};

export default function WorkerHomeScreen({ navigation }) {
  // Estados principales
  const { user, hasWorkerProfile } = useAuth();
  const [userData, setUserData] = useState(null);
  const [recommendedJobs, setRecommendedJobs] = useState([]);
  const [myApplications, setMyApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successModalData, setSuccessModalData] = useState(null);

  // ✅ Estado para prevenir doble postulación
  const [applyingJobs, setApplyingJobs] = useState(new Set());

  // Estados para estadísticas del dashboard
  const [dashboardStats, setDashboardStats] = useState({
    totalApplications: 0,
    activeApplications: 0,
    completedJobs: 0,
    averageRating: 0,
    monthlyEarnings: 0,
  });

  // Función para obtener el nombre amigable del status
  const getStatusDisplayName = (status) => {
    const statusMap = {
      Solicitado: "Enviada",
      En_revision: "En Revisión",
      Completado: "Completada",
      Rechazado: "Rechazada",
      Cancelado: "Cancelada",
    };
    return statusMap[status] || status || "Desconocido";
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case "Completado":
        return { backgroundColor: COLORS.success };
      case "En_revision":
        return { backgroundColor: COLORS.warning };
      case "Rechazado":
        return { backgroundColor: COLORS.error };
      default:
        return { backgroundColor: COLORS.primary };
    }
  };

  // Función para determinar el rol del usuario
  const getUserRole = () => {
    if (!user?.role) return "sin-rol";
    if (typeof user.role === "string") {
      return user.role.toLowerCase();
    } else if (user.role && user.role.name) {
      return user.role.name.toLowerCase();
    }
    return "sin-rol";
  };

  const isWorker = getUserRole() === "trabajador";

  const getWelcomeMessage = () => {
    const name = user?.name || "Usuario";
    return `¡Hola ${name}! Bienvenido`;
  };

  const getJobImage = (cropType) => {
    if (!cropType) return DEFAULT_JOB_IMAGES.default;

    const cropKey = cropType.name.toLowerCase();
    const imageSource =
      DEFAULT_JOB_IMAGES[cropKey] || DEFAULT_JOB_IMAGES.default;
    if (typeof imageSource === "number" || imageSource?.uri === undefined) {
      return imageSource;
    }
    return { uri: imageSource.uri };
  };

  // ✅ Función fetchUserData
  const fetchUserData = useCallback(async () => {
    try {
      if (!user || !user.id) {
        throw new Error("No hay usuario autenticado");
      }

      const userData = await getUserData();
      setUserData(userData);
      await AsyncStorage.setItem("@user_data", JSON.stringify(userData));
      return userData;
    } catch (error) {
      console.error("Error obteniendo datos del usuario:", error);
      try {
        const storedUserData = await AsyncStorage.getItem("@user_data");
        if (storedUserData) {
          const parsedData = JSON.parse(storedUserData);
          setUserData(parsedData);
          return parsedData;
        }
      } catch (parseError) {
        console.error("Error parsing stored user data:", parseError);
      }
      throw error;
    }
  }, [user]);

  // Función segura para obtener ID del trabajador
  const getWorkerId = async () => {
    try {
      let workerData = userData;
      if (!workerData) {
        workerData = await fetchUserData();
      }

      if (!workerData.workerProfile) {
        throw new Error("El usuario no tiene perfil de trabajador");
      }

      return workerData.workerProfile.id;
    } catch (error) {
      console.error("Error obteniendo ID del trabajador:", error);
      throw error;
    }
  };

  const hasAppliedToJob = (jobOfferId) => {
    if (!myApplications || myApplications.length === 0) {
      return false;
    }
    return myApplications.some(
      (application) => application.jobOffer?.id === jobOfferId
    );
  };

  const getApplicationStatus = (jobOfferId) => {
    if (!myApplications || myApplications.length === 0) {
      return null;
    }
    const application = myApplications.find(
      (app) => app.jobOffer?.id === jobOfferId
    );
    return application ? application.status?.name : null;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Completado":
        return COLORS.success;
      case "En_revision":
        return COLORS.warning;
      case "Rechazado":
        return COLORS.error;
      case "Solicitado":
        return COLORS.primary;
      default:
        return COLORS.primary;
    }
  };

  // ✅ ACTUALIZADA: Cargar ofertas recomendadas - FILTRAR ofertas ya postuladas
  const loadRecommendedJobs = async () => {
    try {
      const availableJobsData = await getAvailableJobOffers();
      
      if (!availableJobsData || availableJobsData.length === 0) {
        setRecommendedJobs([]);
        return;
      }

      // ✅ Filtrar ofertas excluyendo aquellas a las que ya se ha postulado
      const filteredJobs = availableJobsData.filter(job => {
        // Si no hay aplicaciones aún, mostrar todas las ofertas
        if (!myApplications || myApplications.length === 0) {
          return true;
        }
        
        // Verificar si ya se postuló a esta oferta
        const hasApplied = myApplications.some(
          application => application.jobOffer?.id === job.id
        );
        
        // Solo incluir ofertas a las que NO se ha postulado
        return !hasApplied;
      });

      // ✅ Tomar solo las 5 más recientes de las ofertas filtradas
      const recommended = filteredJobs
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)) // Ordenar por más recientes
        .slice(0, 5);
      
      console.log(`[DEBUG] Ofertas disponibles: ${availableJobsData.length}, Ofertas filtradas: ${filteredJobs.length}, Recomendadas: ${recommended.length}`);
      
      setRecommendedJobs(recommended);
    } catch (error) {
      console.error("Error cargando ofertas recomendadas:", error);
      setRecommendedJobs([]);
    }
  };

  const loadMyApplications = async () => {
    try {
      if (hasWorkerProfile === false) {
        console.log(
          "Usuario no tiene perfil de trabajador, omitiendo carga de aplicaciones"
        );
        setMyApplications([]);
        setDashboardStats({
          totalApplications: 0,
          activeApplications: 0,
          completedJobs: 0,
          averageRating: 0,
          monthlyEarnings: 0,
        });
        return;
      }
  
      if (!user?.id) {
        throw new Error("No hay usuario autenticado");
      }
  
      console.log("🔍 Cargando aplicaciones para usuario:", user.id);
      
      // ✅ Usar la función corregida del applicationService
      const response = await getWorkerApplications(user.workerProfile.id);
      const applicationsData = response?.applications || [];
      
      console.log("✅ Aplicaciones cargadas exitosamente:", {
        count: applicationsData.length,
        applications: applicationsData.map(app => ({
          id: app.id,
          jobTitle: app.jobOffer?.title,
          status: app.status?.name,
          createdAt: app.createdAt
        }))
      });
  
      setMyApplications(applicationsData);
  
      // Calcular estadísticas
      const totalApplications = applicationsData.length;
      const activeApplications = applicationsData.filter((app) =>
        ["Solicitado", "En_revision"].includes(app.status?.name)
      ).length;
      const completedJobs = applicationsData.filter(
        (app) => app.status?.name === "Completado"
      ).length;
  
      const averageRating = userData?.workerProfile?.rating || 0;
      const monthlyEarnings = completedJobs * 50000;
  
      setDashboardStats({
        totalApplications,
        activeApplications,
        completedJobs,
        averageRating,
        monthlyEarnings,
      });
      
      console.log("📊 Estadísticas actualizadas:", {
        totalApplications,
        activeApplications,
        completedJobs,
        averageRating,
        monthlyEarnings
      });
  
    } catch (error) {
      console.error("❌ Error cargando aplicaciones:", error);
      
      // Mostrar más información sobre el error para debugging
      if (error.status) {
        console.error("📋 Error details:", {
          status: error.status,
          message: error.message,
          data: error.data
        });
      }
      
      setMyApplications([]);
      setDashboardStats({
        totalApplications: 0,
        activeApplications: 0,
        completedJobs: 0,
        averageRating: 0,
        monthlyEarnings: 0,
      });
    }
  };
  
  const applyToJob = useCallback(async (jobOfferId) => {
    try {
      if (hasWorkerProfile === false) {
        Alert.alert(
          "Perfil requerido",
          "Necesitas crear un perfil de trabajador para aplicar a ofertas de trabajo.",
          [
            { text: "Cancelar", style: "cancel" },
            {
              text: "Crear Perfil",
              onPress: () => navigation.navigate("CreateWorkerProfile"),
            },
          ]
        );
        return;
      }
  
      // ✅ Verificar si ya se postuló a esta oferta
      if (hasAppliedToJob(jobOfferId)) {
        const status = getApplicationStatus(jobOfferId);
        const statusDisplayName = getStatusDisplayName(status);
  
        Alert.alert(
          "🔄 Ya Postulado",
          `Ya te has postulado a esta oferta.\n\n📋 Estado actual: ${statusDisplayName}`,
          [
            {
              text: "Ver Mis Postulaciones",
              onPress: () => setActiveTab("applications"),
              style: "default",
            },
            { text: "Entendido", style: "cancel" },
          ]
        );
        return;
      }
  
      // ✅ Prevenir múltiples clics
      if (applyingJobs.has(jobOfferId)) {
        console.log(`[DEBUG] Ya aplicando a job ${jobOfferId}`);
        return;
      }
  
      console.log(`[DEBUG] Marcando como aplicando job ${jobOfferId}`);
      setApplyingJobs(prev => new Set([...prev, jobOfferId]));
  
      const selectedJob = recommendedJobs.find((job) => job.id === jobOfferId);
      const jobTitle = selectedJob?.title || "Trabajo agrícola";
      const farmName = selectedJob?.farm?.name || "Finca no especificada";
      const employerName =
        selectedJob?.employer?.user?.name ||
        selectedJob?.employer?.name ||
        "el productor";
  
      console.log(`[DEBUG] Llamando createApplication para job ${jobOfferId}`);
      
      // ✅ Usar createApplication del applicationService
      await createApplication(jobOfferId, { 
        userId: user.id
      });
  
      console.log(`[DEBUG] Aplicación exitosa para job ${jobOfferId}`);
  
      // ✅ Remover del estado de aplicando
      setApplyingJobs(prev => {
        const newSet = new Set(prev);
        newSet.delete(jobOfferId);
        return newSet;
      });
  
      setSuccessModalData({
        jobTitle,
        farmName,
        employerName,
      });
      setShowSuccessModal(true);
  
      // ✅ Recargar TODOS los datos para actualizar tanto aplicaciones como ofertas recomendadas
      await loadAllData();
      
    } catch (error) {
      console.error(`[DEBUG] Error aplicando a job ${jobOfferId}:`, error);
      
      // ✅ Remover del estado de aplicando en caso de error
      setApplyingJobs(prev => {
        const newSet = new Set(prev);
        newSet.delete(jobOfferId);
        return newSet;
      });
  
      Alert.alert(
        "❌ Error en la Postulación",
        "No se pudo enviar tu postulación. Por favor, verifica tu conexión e intenta nuevamente.",
        [
          { text: "Reintentar", onPress: () => applyToJob(jobOfferId) },
          { text: "Cancelar", style: "cancel" },
        ]
      );
    }
  }, [hasWorkerProfile, hasAppliedToJob, getApplicationStatus, getStatusDisplayName, 
      setActiveTab, applyingJobs, recommendedJobs, user.id, navigation, loadAllData]);
  

  // ✅ ACTUALIZADA: Función principal para cargar todos los datos en el orden correcto
  const loadAllData = async (isRefreshing = false) => {
    try {
      if (!isRefreshing) {
        setLoading(true);
      }

      // ✅ Primero cargar aplicaciones, luego ofertas recomendadas (para filtrarlas)
      await loadMyApplications();
      await loadRecommendedJobs();
      
    } catch (error) {
      console.error("Error cargando datos:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Función para refrescar los datos
  const onRefresh = () => {
    setRefreshing(true);
    loadAllData(true);
  };

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        await fetchUserData();
        await loadAllData();
      } catch (error) {
        console.error("Error cargando datos iniciales:", error);
        setLoading(false);
      }
    };

    if (user?.id) {
      loadInitialData();
    }
  }, [user?.id, fetchUserData]);

  // ✅ useEffect para recargar ofertas cuando cambian las aplicaciones
  useEffect(() => {
    if (myApplications.length >= 0) {
      loadRecommendedJobs();
    }
  }, [myApplications.length]);

  // ✅ Funciones para manejar el modal
  const handleCloseSuccessModal = useCallback(() => {
    setShowSuccessModal(false);
    setSuccessModalData(null);
  }, []);

  const handleViewApplications = useCallback(() => {
    setActiveTab("applications");
  }, []);

  // Componente Dashboard (mismo código que antes...)
  const WorkerDashboardSection = () => (
    <View style={styles.dashboardContainer}>
      <Text style={styles.sectionTitle}>Mi Panel</Text>

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <LinearGradient
            colors={["#274F66", "#3A6B85"]}
            style={styles.statCardGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}>
            <View style={styles.statIconContainer}>
              <View style={styles.statIcon}>
                <Ionicons name="paper-plane" size={24} color="#FFFFFF" />
              </View>
            </View>
            <Text style={styles.statNumberWhite}>
              {dashboardStats.totalApplications}
            </Text>
            <Text style={styles.statLabelWhite}>Postulaciones</Text>
          </LinearGradient>
        </View>

        <View style={styles.statCard}>
          <LinearGradient
            colors={["#F59E0B", "#FBBF24"]}
            style={styles.statCardGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}>
            <View style={styles.statIconContainer}>
              <View style={styles.statIcon}>
                <Ionicons name="time" size={24} color="#FFFFFF" />
              </View>
            </View>
            <Text style={styles.statNumberWhite}>
              {dashboardStats.activeApplications}
            </Text>
            <Text style={styles.statLabelWhite}>En Proceso</Text>
          </LinearGradient>
        </View>

        <View style={styles.statCard}>
          <LinearGradient
            colors={["#10B981", "#34D399"]}
            style={styles.statCardGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}>
            <View style={styles.statIconContainer}>
              <View style={styles.statIcon}>
                <Ionicons name="checkmark-circle" size={24} color="#FFFFFF" />
              </View>
            </View>
            <Text style={styles.statNumberWhite}>
              {dashboardStats.completedJobs}
            </Text>
            <Text style={styles.statLabelWhite}>Completados</Text>
          </LinearGradient>
        </View>

        <View style={styles.statCard}>
          <LinearGradient
            colors={["#B6883E", "#D4A55C"]}
            style={styles.statCardGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}>
            <View style={styles.statIconContainer}>
              <View style={styles.statIcon}>
                <Ionicons name="star" size={24} color="#FFFFFF" />
              </View>
            </View>
            <Text style={styles.statNumberWhite}>
              {dashboardStats.averageRating.toFixed(1)}
            </Text>
            <Text style={styles.statLabelWhite}>Calificación</Text>
          </LinearGradient>
        </View>
      </View>

      {/* Banner para usuarios sin perfil de trabajador */}
      {hasWorkerProfile === false && (
        <View style={styles.noWorkerProfileBanner}>
          <LinearGradient
            colors={["#F59E0B", "#FBBF24"]}
            style={styles.bannerGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}>
            <View style={styles.bannerContent}>
              <View style={styles.bannerIconContainer}>
                <Ionicons name="information-circle" size={28} color="#FFFFFF" />
              </View>
              <View style={styles.bannerTextContainer}>
                <Text style={styles.bannerTitle}>¡Completa tu perfil!</Text>
                <Text style={styles.bannerSubtitle}>
                  Crea tu perfil de trabajador para acceder a todas las ofertas
                </Text>
              </View>
              <TouchableOpacity
                style={styles.bannerButton}
                onPress={() => navigation.navigate("CreateWorkerProfile")}>
                <Text style={styles.bannerButtonText}>Crear</Text>
                <Ionicons name="arrow-forward" size={16} color="#F59E0B" />
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>
      )}

      {/* Acciones rápidas */}
      <View style={styles.quickActions}>
        <Text style={styles.quickActionsTitle}>Acciones Rápidas</Text>
        <View style={styles.quickActionsGrid}>
          <TouchableOpacity
            style={[styles.quickActionButton, styles.primaryQuickAction]}
            onPress={() => setActiveTab("jobs")}>
            <View style={styles.quickActionIconContainer}>
              <Ionicons name="search" size={28} color={COLORS.primary} />
            </View>
            <Text
              style={[styles.quickActionText, styles.primaryQuickActionText]}>
              Buscar Trabajos
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.quickActionButton,
              styles.secondaryQuickAction,
              !isWorker && styles.quickActionButtonDisabled,
            ]}
            onPress={() => {
              if (isWorker) {
                setActiveTab("applications");
              } else {
                Alert.alert(
                  "Perfil requerido",
                  "Necesitas crear un perfil de trabajador para ver tus postulaciones."
                );
              }
            }}>
            <View style={styles.quickActionIconContainer}>
              <Ionicons
                name="list"
                size={28}
                color={isWorker ? COLORS.secondary : COLORS.textLight}
              />
            </View>
            <Text
              style={[
                styles.quickActionText,
                styles.secondaryQuickActionText,
                !isWorker && styles.quickActionTextDisabled,
              ]}>
              Mis Postulaciones
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Card de ingresos */}
      {isWorker && (
        <View style={styles.earningsCard}>
          <LinearGradient
            colors={["#274E66", "#3A6B85"]}
            style={styles.earningsGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}>
            <View style={styles.earningsContent}>
              <View style={styles.earningsHeader}>
                <View style={styles.earningsIconContainer}>
                  <Ionicons name="wallet" size={28} color="#FFFFFF" />
                </View>
                <Text style={styles.earningsTitleWhite}>Ingresos Este Mes</Text>
              </View>
              <Text style={styles.earningsAmountWhite}>
                $
                {new Intl.NumberFormat("es-CO").format(
                  dashboardStats.monthlyEarnings
                )}
              </Text>
              <Text style={styles.earningsSubtextWhite}>
                Basado en {dashboardStats.completedJobs} trabajos completados
              </Text>
            </View>
          </LinearGradient>
        </View>
      )}
    </View>
  );
  
  // ✅ ACTUALIZADA: RecommendedJobsSection simplificada - ahora las ofertas ya vienen filtradas
  const RecommendedJobsSection = () => (
    <View style={styles.recommendedJobsContainer}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Nuevas Oportunidades</Text>
        <TouchableOpacity
          style={styles.seeAllButton}
          onPress={() => setActiveTab("jobs")}>
          <Text style={styles.seeAllText}>Ver todas</Text>
          <Ionicons name="arrow-forward" size={16} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      {recommendedJobs.length > 0 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {recommendedJobs.map((job, index) => {
            // ✅ Estados simplificados ya que las ofertas ya vienen filtradas
            const isApplying = applyingJobs.has(job.id);
            
            return (
              <TouchableOpacity
                key={job.id}
                style={[
                  styles.recommendedJobCard,
                  index === 0 && styles.firstJobCard,
                ]}
                onPress={() =>
                  navigation.navigate("JobOfferDetail", { jobOfferId: job.id })
                }>
                <View style={styles.jobCardContainer}>
                  {/* Header con tipo de cultivo y valor */}
                  <View style={styles.jobHeader}>
                    <View style={styles.cropTypeBadge}>
                      <Ionicons name="leaf" size={16} color="#FFFFFF" />
                      <Text style={styles.cropTypeText}>
                        {job.cropType?.name || "Cultivo"}
                      </Text>
                    </View>
                    <View style={styles.salaryContainer}>
                      <Text style={styles.salaryText}>
                        ${new Intl.NumberFormat("es-CO").format(job.salary || 0)}
                      </Text>
                      <Text style={styles.paymentTypeText}>
                        {job.paymentType === "Por_dia" ? "por día" : "por tarea"}
                      </Text>
                    </View>
                  </View>

                  {/* Imagen del trabajo */}
                  <View style={styles.jobImageContainer}>
                    <Image
                      source={getJobImage(job.cropType)}
                      style={styles.jobImage}
                      resizeMode="cover"
                    />
                  </View>

                  {/* Información principal */}
                  <View style={styles.jobMainInfo}>
                    <Text style={styles.jobTitle} numberOfLines={2}>
                      {job.title || "Trabajo agrícola"}
                    </Text>
                    <View style={styles.farmInfoContainer}>
                      <Ionicons
                        name="business"
                        size={16}
                        color={COLORS.textSecondary}
                      />
                      <Text style={styles.farmName}>
                        {job.farm?.name || "Finca no especificada"}
                      </Text>
                    </View>
                  </View>

                  {/* Ubicación */}
                  <View style={styles.locationContainer}>
                    <Ionicons name="location" size={16} color={COLORS.error} />
                    <View style={styles.locationTextContainer}>
                      <Text style={styles.locationText}>
                        {[job.village, job.city, job.state, job.country]
                          .filter(Boolean)
                          .join(", ")}
                      </Text>
                    </View>
                  </View>

                  {/* Beneficios */}
                  <View style={styles.benefitsContainer}>
                    <View style={styles.benefitItem}>
                      <Ionicons
                        name="restaurant"
                        size={16}
                        color={
                          job.includesFood ? COLORS.success : COLORS.textSecondary
                        }
                      />
                      <Text
                        style={[
                          styles.benefitText,
                          !job.includesFood && styles.benefitTextDisabled,
                        ]}>
                        {job.includesFood ? "Incluye comida" : "Sin comida"}
                      </Text>
                    </View>

                    <View style={styles.benefitItem}>
                      <Ionicons
                        name="bed"
                        size={16}
                        color={
                          job.includesLodging
                            ? COLORS.success
                            : COLORS.textSecondary
                        }
                      />
                      <Text
                        style={[
                          styles.benefitText,
                          !job.includesLodging && styles.benefitTextDisabled,
                        ]}>
                        {job.includesLodging
                          ? "Incluye alojamiento"
                          : "Sin alojamiento"}
                      </Text>
                    </View>
                  </View>

                  {/* Duración y forma de pago */}
                  <View style={styles.metaInfoContainer}>
                    <View style={styles.metaItem}>
                      <Ionicons
                        name="time"
                        size={14}
                        color={COLORS.textSecondary}
                      />
                      <Text style={styles.metaText}>
                        {job.duration || 1} días
                      </Text>
                    </View>

                    <View style={styles.metaItem}>
                      <Ionicons
                        name="cash"
                        size={14}
                        color={COLORS.textSecondary}
                      />
                      <Text style={styles.metaText}>
                        {job.paymentMode === "Efectivo"
                          ? "Efectivo"
                          : "Transferencia"}
                      </Text>
                    </View>
                  </View>

                  {/* ✅ BOTÓN DE POSTULACIÓN SIMPLIFICADO */}
                  <TouchableOpacity
                    style={[
                      styles.applyButton,
                      (!isWorker || isApplying) && styles.applyButtonDisabled,
                    ]}
                    onPress={() => applyToJob(job.id)}
                    disabled={!isWorker || isApplying}
                    activeOpacity={0.8}>
                    <LinearGradient
                      colors={
                        !isWorker
                          ? ["#718096", "#718096"]
                          : isApplying 
                          ? ["#F59E0B", "#FBBF24"]
                          : ["#274F66", "#3A6B85"]
                      }
                      style={styles.applyButtonGradient}>
                      
                      {/* ✅ Mostrar loading cuando se está aplicando */}
                      {isApplying ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <Ionicons
                          name={!isWorker ? "person-add" : "paper-plane"}
                          size={16}
                          color="#FFFFFF"
                        />
                      )}
                      
                      <Text style={styles.applyButtonTextWhite}>
                        {!isWorker
                          ? "Crear Perfil"
                          : isApplying
                          ? "Aplicando..."
                          : "Postularme"}
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      ) : (
        <View style={styles.emptyState}>
          <View style={styles.emptyIconContainer}>
            <Ionicons
              name="briefcase-outline"
              size={48}
              color={COLORS.primary}
            />
          </View>
          <Text style={styles.emptyStateTitle}>
            {myApplications.length > 0 ? 
              "¡Has visto todas las ofertas!" : 
              "No hay ofertas disponibles"}
          </Text>
          <Text style={styles.emptyStateSubtitle}>
            {myApplications.length > 0 ? 
              "Te notificaremos cuando haya nuevas oportunidades" :
              "Te notificaremos cuando haya nuevas oportunidades"}
          </Text>
        </View>
      )}
    </View>
  );

  if (loading) {
    return (
      <ScreenLayoutWorker navigation={navigation}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Cargando oportunidades...</Text>
        </View>
      </ScreenLayoutWorker>
    );
  }

  return (
    <ScreenLayoutWorker navigation={navigation}>
      <View style={styles.container}>
        {/* Header con bienvenida */}
        <View style={styles.header}>
          <Text style={styles.welcomeText}>{getWelcomeMessage()}</Text>
        </View>

        {/* Navegación por tabs */}
        <View style={styles.tabNavigation}>
          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === "dashboard" && styles.activeTabButton,
            ]}
            onPress={() => setActiveTab("dashboard")}>
            <Ionicons
              name="home"
              size={20}
              color={
                activeTab === "dashboard" ? COLORS.primary : COLORS.textLight
              }
            />
            <Text
              style={[
                styles.tabText,
                activeTab === "dashboard" && styles.activeTabText,
              ]}>
              Inicio
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === "applications" && styles.activeTabButton,
            ]}
            onPress={() => {
              if (isWorker) {
                setActiveTab("applications");
              } else {
                Alert.alert(
                  "Perfil requerido",
                  "Necesitas crear un perfil de trabajador para ver tus postulaciones."
                );
              }
            }}>
            <Ionicons
              name="paper-plane"
              size={20}
              color={
                activeTab === "applications" ? COLORS.primary : COLORS.textLight
              }
            />
            <Text
              style={[
                styles.tabText,
                activeTab === "applications" && styles.activeTabText,
              ]}>
              Mis Solicitudes
            </Text>
          </TouchableOpacity>
        </View>

        {/* Contenido principal */}
        <ScrollView
          style={styles.content}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[COLORS.primary]}
            />
          }
          showsVerticalScrollIndicator={false}>
          {activeTab === "dashboard" && (
            <>
              <WorkerDashboardSection />
              <RecommendedJobsSection />
            </>
          )}

          {activeTab === "applications" && isWorker && (
            <View style={styles.applicationsContainer}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Mis Postulaciones</Text>
                <View style={styles.applicationsCounter}>
                  <Text style={styles.counterText}>
                    {myApplications.length}
                  </Text>
                </View>
              </View>

              {myApplications.length > 0 ? (
                <View style={styles.applicationsList}>
                  {myApplications.map((application, index) => (
                    <TouchableOpacity
                      key={application.id}
                      style={[
                        styles.applicationCard,
                        index === myApplications.length - 1 &&
                          styles.lastApplicationCard,
                      ]}
                      onPress={() => {
                        navigation.navigate("ApplicationDetail", {
                          applicationId: application.id,
                        });
                      }}>
                      <View style={styles.applicationHeader}>
                        <View style={styles.jobInfo}>
                          <Text style={styles.jobTitleApp} numberOfLines={2}>
                            {application.jobOffer?.title ||
                              "Trabajo sin título"}
                          </Text>
                          <Text style={styles.employerName}>
                            {application.jobOffer?.employer?.user?.name ||
                              application.jobOffer?.employer?.name ||
                              "Empleador no disponible"}
                          </Text>
                        </View>

                        <View
                          style={[
                            styles.statusBadge,
                            getStatusStyle(application.status?.name),
                          ]}>
                          <Text style={styles.statusText}>
                            {getStatusDisplayName(application.status?.name)}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.applicationDetails}>
                        <View style={styles.detailRow}>
                          <Ionicons
                            name="location-outline"
                            size={16}
                            color={COLORS.textLight}
                          />
                          <Text style={styles.detailText}>
                            {application.jobOffer?.city || "Ciudad"},{" "}
                            {application.jobOffer?.state || "Departamento"}
                          </Text>
                        </View>

                        <View style={styles.detailRow}>
                          <Ionicons
                            name="leaf-outline"
                            size={16}
                            color={COLORS.textLight}
                          />
                          <Text style={styles.detailText}>
                            {application.jobOffer?.cropType?.name ||
                              "Cultivo general"}
                          </Text>
                        </View>

                        <View style={styles.detailRow}>
                          <Ionicons
                            name="cash-outline"
                            size={16}
                            color={COLORS.textLight}
                          />
                          <Text style={styles.detailText}>
                            $
                            {new Intl.NumberFormat("es-CO").format(
                              application.jobOffer?.salary || 0
                            )}
                            /día
                          </Text>
                        </View>
                      </View>

                      <View style={styles.applicationFooter}>
                        <View style={styles.dateContainer}>
                          <Ionicons
                            name="calendar-outline"
                            size={14}
                            color={COLORS.textLight}
                          />
                          <Text style={styles.applicationDate}>
                            Postulado el{" "}
                            {new Date(application.createdAt).toLocaleDateString(
                              "es-ES",
                              {
                                day: "2-digit",
                                month: "2-digit",
                                year: "numeric",
                              }
                            )}
                          </Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              ) : (
                <View style={styles.emptyApplicationsContainer}>
                  <View style={styles.emptyIconContainer}>
                    <Ionicons
                      name="document-text-outline"
                      size={64}
                      color={COLORS.textLight}
                    />
                  </View>
                  <Text style={styles.emptyTitle}>
                    No tienes postulaciones aún
                  </Text>
                  <Text style={styles.emptySubtitle}>
                    Explora las ofertas disponibles y postúlate a trabajos que
                    coincidan con tus habilidades
                  </Text>
                  <TouchableOpacity
                    style={styles.exploreJobsButton}
                    onPress={() => setActiveTab("jobs")}>
                    <Ionicons
                      name="search-outline"
                      size={20}
                      color={COLORS.surface}
                    />
                    <Text style={styles.exploreJobsText}>
                      Explorar Trabajos
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}
        </ScrollView>
      </View>
      
      {/* ✅ SuccessModal */}
      <SuccessModal
        visible={showSuccessModal}
        successData={successModalData}
        onClose={handleCloseSuccessModal}
        onViewApplications={handleViewApplications}
      />
    </ScreenLayoutWorker>
  );
}

// Estilos (mantén los mismos estilos que tenías antes)
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    backgroundColor: COLORS.surface,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  welcomeText: {
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 12,
    color: COLORS.text,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loadingText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginTop: 12,
  },
  tabNavigation: {
    flexDirection: "row",
    backgroundColor: COLORS.surface,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  tabButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 6,
  },
  activeTabButton: {
    backgroundColor: `${COLORS.primary}10`,
  },
  tabText: {
    fontSize: 14,
    color: COLORS.textLight,
    fontWeight: "500",
  },
  activeTabText: {
    color: COLORS.primary,
    fontWeight: "600",
  },
  content: {
    flex: 1,
  },
  dashboardContainer: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    minWidth: (width - 60) / 2,
    borderRadius: 20,
    overflow: "hidden",
    elevation: 8,
    shadowColor: "#274F66",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  statCardGradient: {
    padding: 20,
    alignItems: "center",
    minHeight: 140,
    justifyContent: "center",
  },
  statIconContainer: {
    position: "relative",
    marginBottom: 12,
  },
  statIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  statNumberWhite: {
    fontSize: 28,
    fontWeight: "800",
    color: "#FFFFFF",
    marginBottom: 4,
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  statLabelWhite: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.9)",
    textAlign: "center",
    fontWeight: "600",
  },
  noWorkerProfileBanner: {
    borderRadius: 16,
    marginBottom: 24,
    overflow: "hidden",
    elevation: 4,
    shadowColor: "#F59E0B",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  bannerGradient: {
    padding: 20,
  },
  bannerContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  bannerIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  bannerTextContainer: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  bannerSubtitle: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.9)",
    lineHeight: 18,
  },
  bannerButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 6,
  },
  bannerButtonText: {
    color: "#F59E0B",
    fontSize: 14,
    fontWeight: "700",
  },
  quickActions: {
    marginTop: 8,
  },
  quickActionsTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 16,
  },
  quickActionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  quickActionButton: {
    flex: 1,
    minWidth: (width - 60) / 2,
    borderRadius: 10,
    padding: 20,
    alignItems: "center",
  },
  primaryQuickAction: {
    backgroundColor: `${COLORS.primary}08`,
  },
  secondaryQuickAction: {
    backgroundColor: `${COLORS.secondary}08`,
  },
  quickActionIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  quickActionText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 8,
    textAlign: "center",
    fontWeight: "500",
  },
  primaryQuickActionText: {
    color: COLORS.primary,
    fontWeight: "600",
  },
  secondaryQuickActionText: {
    color: COLORS.secondary,
    fontWeight: "600",
  },
  quickActionButtonDisabled: {
    opacity: 0.5,
  },
  quickActionTextDisabled: {
    color: COLORS.textLight,
  },
  earningsCard: {
    borderRadius: 20,
    marginTop: 16,
    overflow: "hidden",
    elevation: 8,
    shadowColor: "#274F66",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  earningsGradient: {
    padding: 24,
  },
  earningsContent: {
    alignItems: "center",
  },
  earningsHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  earningsIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  earningsTitleWhite: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  earningsAmountWhite: {
    fontSize: 36,
    fontWeight: "800",
    color: "#FFFFFF",
    marginBottom: 8,
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  earningsSubtextWhite: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.8)",
    marginBottom: 16,
  },
  recommendedJobsContainer: {
    padding: 20,
    paddingTop: 0,
  },
  seeAllButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: `${COLORS.primary}10`,
  },
  seeAllText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: "600",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    marginHorizontal: 4,
    borderWidth: 2,
    borderColor: `${COLORS.primary}10`,
    borderStyle: "dashed",
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: `${COLORS.primary}15`,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 8,
    textAlign: "center",
  },
  emptyStateSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 20,
  },
  applicationsContainer: {
    padding: 20,
  },
  applicationsCounter: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 24,
    alignItems: "center",
  },
  counterText: {
    color: COLORS.surface,
    fontSize: 14,
    fontWeight: "600",
  },
  applicationsList: {
    gap: 16,
  },
  lastApplicationCard: {
    marginBottom: 20,
  },
  applicationCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  applicationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  jobInfo: {
    flex: 1,
    marginRight: 12,
  },
  jobTitleApp: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 6,
    lineHeight: 22,
  },
  employerName: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 2,
    fontWeight: "500",
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: "flex-start",
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.surface,
  },
  applicationDetails: {
    gap: 8,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
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
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  dateContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    flex: 1,
  },
  applicationDate: {
    fontSize: 12,
    color: COLORS.textLight,
  },
  emptyApplicationsContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 8,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 32,
  },
  exploreJobsButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  exploreJobsText: {
    color: COLORS.surface,
    fontSize: 16,
    fontWeight: "600",
  },
  recommendedJobCard: {
    width: 280,
    marginRight: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  firstJobCard: {
    marginLeft: 16,
  },
  jobCardContainer: {
    paddingBottom: 16,
  },
  jobHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    backgroundColor: "#F8FAFC",
  },
  cropTypeBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.primary,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  cropTypeText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 4,
  },
  salaryContainer: {
    alignItems: "flex-end",
  },
  salaryText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#2D3748",
  },
  paymentTypeText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  jobImageContainer: {
    height: 120,
    width: "100%",
  },
  jobImage: {
    height: "100%",
    width: "100%",
  },
  jobMainInfo: {
    paddingHorizontal: 12,
    paddingTop: 12,
  },
  jobTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1A202C",
    marginBottom: 8,
  },
  farmInfoContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  farmName: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginLeft: 4,
  },
  locationContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  locationTextContainer: {
    flex: 1,
    marginLeft: 4,
  },
  locationText: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  benefitsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  benefitItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  benefitText: {
    fontSize: 12,
    color: "#2D3748",
    marginLeft: 4,
  },
  benefitTextDisabled: {
    color: COLORS.textSecondary,
  },
  metaInfoContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  metaText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginLeft: 4,
  },
  applyButton: {
    marginHorizontal: 12,
    borderRadius: 6,
    overflow: "hidden",
  },
  applyButtonGradient: {
    paddingVertical: 10,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  applyButtonTextWhite: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  applyButtonDisabled: {
    opacity: 0.9,
  },
});