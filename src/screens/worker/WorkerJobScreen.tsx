// src/screens/worker/WorkerJobScreen.js
import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Text,
  View,
  StyleSheet,
  ScrollView,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// ✅ AGREGAR: Importar el header personalizado
import CustomHeaderWorker from "../../components/CustomHeaderWorker";

import { useAuth } from "../../context/AuthContext";
import { getAvailableJobOffersForWorker } from "../../services/jobOffers";
import { createApplication } from "../../services/applicationService";
import { getCropType } from "../../services/cropTypeService";

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

export default function WorkerJobsScreen({ navigation }) {
  const [jobOffers, setJobOffers] = useState([]);
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  
  const [applyingJobs, setApplyingJobs] = useState(new Set());

  const { user, isLoading: authLoading, hasWorkerProfile } = useAuth();

  // Estados para filtros
  const [selectedCrop, setSelectedCrop] = useState(null);
  const [salaryRange, setSalaryRange] = useState({ min: "", max: "" });
  const [selectedDuration, setSelectedDuration] = useState(null);
  const [sortBy, setSortBy] = useState("newest");
  const [cropTypes, setCropTypes] = useState([]);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Estados para paginación y manejo de respuesta del backend
  const [pagination, setPagination] = useState(null);
  const [totalOffers, setTotalOffers] = useState(0);
  const [backendMessage, setBackendMessage] = useState("");

  // Cargar tipos de cultivo
  const loadCropTypes = async () => {
    try {
      const response = await getCropType();
      console.log("🌱 Crop types loaded:", response?.length || 0);
      setCropTypes(response || []);
    } catch (error) {
      console.error("❌ Error loading crop types:", error);
    }
  };

  // 🔥 FUNCIÓN SIMPLIFICADA - Solo usa getAvailableJobOffersForWorker
  const loadJobOffers = async (additionalFilters = {}) => {
    try {
      setLoading(true);
      await loadCropTypes();

      console.log("🔍 Cargando ofertas de trabajo...");
      
      const backendFilters = {
        simple: "true",
        ...additionalFilters,
      };

      if (selectedCrop?.id) {
        backendFilters.cropType = selectedCrop.name;
      }
      
      if (salaryRange.min) {
        backendFilters.minSalary = salaryRange.min;
      }
      
      if (salaryRange.max) {
        backendFilters.maxSalary = salaryRange.max;
      }

      const response = await getAvailableJobOffersForWorker(backendFilters);
      
      console.log("📦 Respuesta completa del backend:", {
        success: response.success,
        dataLength: response.data?.length,
        message: response.message,
        pagination: response.pagination
      });

      let jobsData = [];
      let responseInfo = null;

      // 🔥 MANEJO DE RESPUESTA: Usar response.data
      if (response.success && response.data) {
        jobsData = response.data;
        responseInfo = {
          total: response.pagination?.total || response.data.length,
          message: response.message || "",
          pagination: response.pagination,
        };
        
        console.log("✅ Ofertas cargadas exitosamente:", {
          count: jobsData.length,
          total: responseInfo.total,
          message: responseInfo.message
        });
      } else {
        console.warn("⚠️ Estructura de respuesta inesperada:", response);
        jobsData = [];
        responseInfo = {
          total: 0,
          message: "No se encontraron ofertas",
          pagination: null,
        };
      }

      // 🔥 VALIDACIÓN: Asegurar que jobsData sea un array
      if (!Array.isArray(jobsData)) {
        console.warn("⚠️ jobsData no es un array:", typeof jobsData);
        jobsData = [];
      }

      setJobOffers(jobsData);
      setTotalOffers(responseInfo.total);
      setBackendMessage(responseInfo.message);
      setPagination(responseInfo.pagination);

      console.log(`📊 Resumen de carga:`, {
        ofertas: jobsData.length,
        total: responseInfo.total,
        userId: user?.id,
        message: responseInfo.message
      });

    } catch (error) {
      console.error("❌ Error cargando ofertas:", error);
      Alert.alert("Error", "No se pudieron cargar las ofertas de trabajo");
      setJobOffers([]);
      setFilteredJobs([]);
      setTotalOffers(0);
      setBackendMessage("Error cargando ofertas");
    } finally {
      setLoading(false);
    }
  };

  // Función de filtrado local simplificada
  const applyFiltersAndSearch = useCallback(() => {
    let filtered = [...jobOffers];

    // Filtro por búsqueda de texto
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (job) =>
          job.title?.toLowerCase().includes(searchLower) ||
          job.description?.toLowerCase().includes(searchLower) ||
          job.employer?.user?.name?.toLowerCase().includes(searchLower) ||
          job.city?.toLowerCase().includes(searchLower) ||
          job.state?.toLowerCase().includes(searchLower) ||
          job.displayLocation?.city?.toLowerCase().includes(searchLower) ||
          job.displayLocation?.department?.toLowerCase().includes(searchLower)
      );
    }

    // Filtro por duración (solo frontend)
    if (selectedDuration) {
      filtered = filtered.filter((job) => {
        const duration = parseInt(job.duration) || 0;
        return duration >= selectedDuration.min && duration <= selectedDuration.max;
      });
    }

    // Ordenamiento (solo frontend)
    switch (sortBy) {
      case "salary_high":
        filtered.sort((a, b) => (parseInt(b.salary) || 0) - (parseInt(a.salary) || 0));
        break;
      case "salary_low":
        filtered.sort((a, b) => (parseInt(a.salary) || 0) - (parseInt(b.salary) || 0));
        break;
      case "duration":
        filtered.sort((a, b) => (parseInt(a.duration) || 0) - (parseInt(b.duration) || 0));
        break;
      case "newest":
      default:
        filtered.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
        break;
    }

    setFilteredJobs(filtered);
  }, [jobOffers, searchTerm, selectedDuration, sortBy]);

  // Función para aplicar a trabajo
  const applyToJob = useCallback(async (jobOfferId) => {
    try {
      if (!user?.workerProfile?.id) {
        Alert.alert(
          "Perfil requerido", 
          "Necesitas tener un perfil de trabajador para postularte",
          [
            { text: "Cancelar", style: "cancel" },
            { 
              text: "Crear Perfil", 
              onPress: () => navigation.navigate("CreateWorkerProfile") 
            }
          ]
        );
        return;
      }

      if (applyingJobs.has(jobOfferId)) {
        console.log("🔄 Ya aplicando a esta oferta");
        return;
      }

      setApplyingJobs((prev) => new Set([...prev, jobOfferId]));

      const workerId = user.workerProfile.id;
      await createApplication(jobOfferId, {
        userId: user.id,
        workerId: workerId,
      });

      await loadJobOffers();

      setApplyingJobs((prev) => {
        const newSet = new Set(prev);
        newSet.delete(jobOfferId);
        return newSet;
      });

      Alert.alert("¡Éxito!", "Te has postulado exitosamente a esta oferta");
    } catch (error) {
      setApplyingJobs((prev) => {
        const newSet = new Set(prev);
        newSet.delete(jobOfferId);
        return newSet;
      });
      
      const errorMessage = error.response?.data?.message || error.message || "No se pudo enviar la postulación";
      Alert.alert("Error", errorMessage);
      console.error("❌ Error aplicando a trabajo:", error);
    }
  }, [applyingJobs, user, navigation]);

  // Función para limpiar filtros y recargar
  const clearAllFilters = useCallback(async () => {
    setSearchTerm("");
    setSelectedCrop(null);
    setSalaryRange({ min: "", max: "" });
    setSelectedDuration(null);
    setSortBy("newest");
    setShowAdvancedFilters(false);
    
    await loadJobOffers();
  }, []);

  // Función para aplicar filtros backend y recargar
  const applyBackendFilters = useCallback(async () => {
    console.log("🔄 Aplicando filtros backend...");
    await loadJobOffers();
  }, [selectedCrop, salaryRange]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadJobOffers();
    setRefreshing(false);
  };

  useEffect(() => {
    if (!authLoading && user) {
      loadJobOffers();
    }
  }, [authLoading, user]);

  useEffect(() => {
    applyFiltersAndSearch();
  }, [applyFiltersAndSearch]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (selectedCrop || salaryRange.min || salaryRange.max) {
        applyBackendFilters();
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [selectedCrop, salaryRange.min, salaryRange.max, applyBackendFilters]);

  // 🔥 COMPONENTE DEBUG - Para verificar datos (remover en producción)
  const DebugInfo = () => {
    if (__DEV__) {
      return (
        <View style={styles.debugContainer}>
          <Text style={styles.debugText}>
            🐛 Debug: {jobOffers.length} ofertas | Filtered: {filteredJobs.length} | Backend: {backendMessage}
          </Text>
        </View>
      );
    }
    return null;
  };

  // Componente de categorías
  const CategoryTabs = React.memo(() => (
    <View style={styles.filtersSection}>
      <View style={styles.filtersSectionHeader}>
        <Text style={styles.filtersSectionTitle}>Categorías</Text>
        <Text style={styles.filtersSectionSubtitle}>
          {backendMessage || `${totalOffers} ofertas disponibles`}
        </Text>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryTabsContainer}
        style={styles.categoryTabsScroll}>
        <TouchableOpacity
          style={[styles.categoryTab, !selectedCrop && styles.activeCategoryTab]}
          onPress={() => setSelectedCrop(null)}
          activeOpacity={0.7}>
          <View style={styles.categoryTabContent}>
            <Ionicons
              name="apps-outline"
              size={16}
              color={!selectedCrop ? "#FFFFFF" : COLORS.textSecondary}
              style={styles.categoryTabIcon}
            />
            <Text style={[styles.categoryTabText, !selectedCrop && styles.activeCategoryTabText]}>
              Todos
            </Text>
          </View>
        </TouchableOpacity>

        {cropTypes.map((crop) => {
          const isActive = selectedCrop?.id === crop.id;
          return (
            <TouchableOpacity
              key={crop.id}
              style={[styles.categoryTab, isActive && styles.activeCategoryTab]}
              onPress={() => setSelectedCrop(crop)}
              activeOpacity={0.7}>
              <View style={styles.categoryTabContent}>
                <Ionicons
                  name="leaf-outline"
                  size={16}
                  color={isActive ? "#FFFFFF" : COLORS.success}
                  style={styles.categoryTabIcon}
                />
                <Text style={[styles.categoryTabText, isActive && styles.activeCategoryTabText]}>
                  {crop.name}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
      
      {(() => {
        const activeFiltersCount = [
          searchTerm.trim(),
          selectedCrop,
          salaryRange.min,
          salaryRange.max,
          selectedDuration,
          sortBy !== "newest",
        ].filter(Boolean).length;

        return activeFiltersCount > 0 ? (
          <View style={styles.activeFiltersContainer}>
            <View style={styles.activeFiltersBadge}>
              <Ionicons name="funnel" size={14} color={COLORS.primary} />
              <Text style={styles.activeFiltersCountText}>
                {activeFiltersCount} filtro{activeFiltersCount > 1 ? 's' : ''} activo{activeFiltersCount > 1 ? 's' : ''}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.clearFiltersSmallButton}
              onPress={clearAllFilters}>
              <Text style={styles.clearFiltersSmallButtonText}>Limpiar</Text>
            </TouchableOpacity>
          </View>
        ) : null;
      })()}
    </View>
  ));

  // Componente de tarjeta de trabajo
  const JobCard = React.memo(({ item }) => {
    const isApplying = useMemo(() => applyingJobs.has(item.id), [item.id]);

    const handleApply = useCallback(() => {
      applyToJob(item.id);
    }, [item.id]);

    const handleNavigate = useCallback(() => {
      navigation.navigate("WorkerJobOfferDetail", { jobOfferId: item.id });
    }, [item.id]);

    const daysAgo = useMemo(() => {
      return Math.max(1, Math.floor((new Date().getTime() - new Date(item.createdAt || new Date()).getTime()) / (1000 * 60 * 60 * 24)));
    }, [item.createdAt]);

    const getLocationDisplay = () => {
      if (item.displayLocation) {
        return `${item.displayLocation.city || 'Ciudad'}, ${item.displayLocation.department || item.displayLocation.state || 'Departamento'}`;
      }
      return `${item.city || 'Ciudad'}, ${item.state || 'Departamento'}`;
    };

    return (
      <TouchableOpacity style={styles.jobCard} onPress={handleNavigate} activeOpacity={0.7}>
        <View style={styles.jobCardHeader}>
          <View style={styles.jobCardTitleContainer}>
            <Text style={styles.jobCardTitle} numberOfLines={2}>
              {item.title || "Trabajo agrícola"}
            </Text>
            <Text style={styles.jobCardEmployer}>
              {item.employer?.user?.name || item.employerInfo?.name || "Empleador"}
            </Text>
          </View>
          <View style={styles.jobCardSalary}>
            <Text style={styles.salaryAmount}>
              ${new Intl.NumberFormat("es-CO").format(item.salary || 0)}
            </Text>
            <Text style={styles.salaryPeriod}>
              {item.paymentType === "Por_dia" ? "por día" : "por tarea"}
            </Text>
          </View>
        </View>

        <View style={styles.jobCardDetails}>
          <View style={styles.jobDetailItem}>
            <Ionicons name="location" size={16} color={COLORS.textSecondary} />
            <Text style={styles.jobDetailText}>
              {getLocationDisplay()}
            </Text>
          </View>
          <View style={styles.jobDetailItem}>
            <Ionicons name="leaf" size={16} color={COLORS.success} />
            <Text style={styles.jobDetailText}>
              {item.cropType?.name || "General"}
            </Text>
          </View>
          <View style={styles.jobDetailItem}>
            <Ionicons name="calendar" size={16} color={COLORS.textSecondary} />
            <Text style={styles.jobDetailText}>{item.duration || 0} días</Text>
          </View>
          <View style={styles.jobDetailItem}>
            <Ionicons name="people" size={16} color={COLORS.textSecondary} />
            <Text style={styles.jobDetailText}>
              {item.applicationsCount || 0} postulaciones
            </Text>
          </View>
        </View>

        {item.description && (
          <Text style={styles.jobDescription} numberOfLines={2}>
            {item.description}
          </Text>
        )}

        <View style={styles.jobCardFooter}>
          <Text style={styles.jobPostedTime}>
            Publicado hace {daysAgo} días
          </Text>
          <TouchableOpacity
            style={[
              styles.applyButton,
              isApplying && styles.applyingButton,
              !user?.workerProfile?.id && styles.disabledButton,
            ]}
            onPress={handleApply}
            disabled={isApplying || !user?.workerProfile?.id}
            activeOpacity={0.8}>
            {isApplying ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text
                style={[
                  styles.applyButtonText,
                  !user?.workerProfile?.id && styles.disabledButtonText,
                ]}>
                {!user?.workerProfile?.id
                  ? "Perfil requerido"
                  : "Postularme"}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  });

  // Lista de trabajos
  const JobsList = React.memo(() => (
    <FlatList
      data={filteredJobs}
      renderItem={({ item }) => <JobCard item={item} />}
      keyExtractor={(item, index) => item.id ? `job-${item.id}` : `job-index-${index}`}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={[COLORS.primary]}
        />
      }
      contentContainerStyle={styles.jobsList}
      ListEmptyComponent={() => (
        <View style={styles.emptyStateContainer}>
          <Ionicons name="search-outline" size={64} color={COLORS.textLight} />
          <Text style={styles.emptyStateText}>
            No hay ofertas disponibles
          </Text>
          <Text style={styles.emptyStateSubtext}>
            Te notificaremos cuando haya nuevas oportunidades que coincidan con tu perfil
          </Text>
          <TouchableOpacity
            style={styles.clearFiltersButton}
            onPress={clearAllFilters}>
            <Text style={styles.clearFiltersButtonText}>Limpiar Filtros</Text>
          </TouchableOpacity>
        </View>
      )}
    />
  ));

  if (authLoading) {
    return (
      <View style={styles.container}>
        <CustomHeaderWorker navigation={navigation} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Verificando autenticación...</Text>
        </View>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <CustomHeaderWorker navigation={navigation} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>
            Cargando ofertas personalizadas...
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CustomHeaderWorker navigation={navigation} />
      
      <View style={styles.contentContainer}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Buscar Trabajos</Text>
          <View style={styles.headerSubtitleContainer}>
            <Text style={styles.headerSubtitle}>
              {filteredJobs.length} ofertas disponibles
            </Text>
            {(() => {
              const activeFiltersCount = [
                searchTerm,
                selectedCrop,
                salaryRange.min || salaryRange.max,
                selectedDuration,
                sortBy !== "newest",
              ].filter(Boolean).length;

              return activeFiltersCount > 0 ? (
                <View style={styles.activeFiltersIndicator}>
                  <Ionicons name="funnel" size={12} color="#FFFFFF" />
                  <Text style={styles.activeFiltersText}>
                    {activeFiltersCount}
                  </Text>
                </View>
              ) : null;
            })()}
          </View>
          <Text style={styles.infoText}>
            ✅ Viendo ofertas personalizadas para tu perfil
          </Text>
        </View>
        
        {/* 🔥 COMPONENTE DEBUG */}
        <DebugInfo />
        
        <CategoryTabs />
        <JobsList />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  contentContainer: {
    flex: 1,
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
  // 🔥 NUEVO: Estilos para debug
  debugContainer: {
    backgroundColor: "#FFF3CD",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#FFC107",
  },
  debugText: {
    fontSize: 11,
    color: "#856404",
    textAlign: "center",
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
  headerSubtitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  activeFiltersIndicator: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  activeFiltersText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 4,
  },
  infoText: {
    fontSize: 12,
    color: COLORS.success,
    marginTop: 4,
    fontWeight: "500",
  },
  filtersSection: {
    backgroundColor: COLORS.surface,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  filtersSectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginHorizontal: 20,
    marginBottom: 12,
  },
  filtersSectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.text,
  },
  filtersSectionSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontStyle: "italic",
  },
  activeFiltersContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginHorizontal: 20,
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: `${COLORS.primary}08`,
    borderRadius: 8,
  },
  activeFiltersBadge: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  activeFiltersCountText: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: "500",
    marginLeft: 6,
  },
  clearFiltersSmallButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: COLORS.primary,
    borderRadius: 4,
  },
  clearFiltersSmallButtonText: {
    fontSize: 10,
    color: "#FFFFFF",
    fontWeight: "600",
  },
  categoryTabsScroll: {
    marginBottom: 12,
  },
  categoryTabsContainer: {
    paddingHorizontal: 16,
    paddingRight: 32,
  },
  categoryTab: {
    flexDirection: "column",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginRight: 8,
    backgroundColor: COLORS.background,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    minWidth: 80,
    minHeight: 60,
  },
  activeCategoryTab: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
    elevation: 3,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  categoryTabContent: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },
  categoryTabIcon: {
    marginBottom: 4,
  },
  categoryTabText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: "500",
    textAlign: "center",
    lineHeight: 14,
  },
  activeCategoryTabText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  jobsList: {
    padding: 20,
  },
  jobCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  jobCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  jobCardTitleContainer: {
    flex: 1,
    marginRight: 12,
  },
  jobCardTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 4,
    lineHeight: 24,
  },
  jobCardEmployer: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: "500",
  },
  jobCardSalary: {
    alignItems: "flex-end",
  },
  salaryAmount: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.secondary,
  },
  salaryPeriod: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  jobCardDetails: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 12,
  },
  jobDetailItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    minWidth: "48%",
  },
  jobDetailText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    flex: 1,
  },
  jobDescription: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
    marginBottom: 16,
  },
  jobCardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  jobPostedTime: {
    fontSize: 12,
    color: COLORS.textLight,
  },
  applyButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  applyingButton: {
    backgroundColor: COLORS.warning,
  },
  disabledButton: {
    backgroundColor: COLORS.textLight,
  },
  applyButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  disabledButtonText: {
    color: "#FFFFFF",
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
    paddingHorizontal: 20,
    lineHeight: 20,
  },
  clearFiltersButton: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  clearFiltersButtonText: {
    color: COLORS.textSecondary,
    fontSize: 16,
    fontWeight: "500",
  },
});