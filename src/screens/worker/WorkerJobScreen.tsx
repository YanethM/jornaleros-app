// 🔥 NUEVO - UseEffeimport React, { useState, useEffect, useMemo, useCallback } from "react";
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
  Modal,
  Dimensions,
  SectionList,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import ScreenLayoutWorker from "../../components/ScreenLayoutWorker";
import { useAuth } from "../../context/AuthContext";
import { getAvailableJobOffers } from "../../services/jobOffers";
import { createApplication } from "../../services/applicationService";
import { getCropType } from "../../services/cropTypeService";
import {
  getWorkerApplications,
  getWorkerApplicationsSafe,
} from "../../services/workerService";
import React, { useCallback, useEffect, useMemo, useState } from "react";

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
  const [appliedJobs, setAppliedJobs] = useState(new Set());
  const [applyingJobs, setApplyingJobs] = useState(new Set());

  const { user, isLoading: authLoading, hasWorkerProfile } = useAuth();

  // Estados para filtros - CORREGIDOS
  const [selectedCrop, setSelectedCrop] = useState(null);
  const [salaryRange, setSalaryRange] = useState({ min: "", max: "" });
  const [selectedDuration, setSelectedDuration] = useState(null);
  const [sortBy, setSortBy] = useState("newest");
  const [cropTypes, setCropTypes] = useState([]);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

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

  const loadWorkerApplications = async () => {
    try {
      console.log("📋 Loading worker applications for user:", user?.id);
      console.log("👤 User has worker profile:", hasWorkerProfile);
      console.log("🏷️ Worker profile ID:", user?.workerProfile?.id);

      if (!hasWorkerProfile || !user?.workerProfile?.id) {
        console.log("⚠️ No worker profile found, skipping applications load");
        setAppliedJobs(new Set());
        return;
      }

      let applications = [];

      try {
        const workerId = user.workerProfile.id;
        console.log(
          "🔍 Method 1: Fetching applications for worker ID:",
          workerId
        );

        const response = await getWorkerApplications(workerId);
        console.log("📊 Method 1 response:", response);

        if (Array.isArray(response)) {
          applications = response;
        } else if (response && Array.isArray(response.applications)) {
          applications = response.applications;
        } else if (response && Array.isArray(response.data)) {
          applications = response.data;
        } else if (
          response &&
          response.success &&
          Array.isArray(response.data)
        ) {
          applications = response.data;
        } else {
          console.log(
            "⚠️ Method 1 returned unexpected structure, trying method 2"
          );
          throw new Error("Unexpected response structure");
        }

        console.log(
          "✅ Method 1 successful, found",
          applications.length,
          "applications"
        );
      } catch (method1Error) {
        console.log("⚠️ Method 1 failed, trying method 2 (safe method)");
        console.error("Method 1 error:", method1Error);

        try {
          applications = await getWorkerApplicationsSafe(user);
          console.log(
            "✅ Method 2 successful, found",
            applications.length,
            "applications"
          );
        } catch (method2Error) {
          console.error("❌ Method 2 also failed:", method2Error);
          applications = [];
        }
      }

      console.log("📋 Final processed applications:", applications.length);

      // 🔥 CORREGIDO - Solo incluir aplicaciones ACTIVAS (no canceladas)
      const activeApplications = applications.filter((app) => {
        const status = app.status?.name || app.status;
        const isActive = status && !["Cancelada", "Rechazada"].includes(status);
        console.log(
          `📋 App ${app.id}: status="${status}", isActive=${isActive}`
        );
        return isActive;
      });

      console.log(
        "✅ Active applications:",
        activeApplications.length,
        "of",
        applications.length
      );

      const appliedIds = new Set(
        activeApplications
          .map((app) => app.jobOffer?.id || app.jobOfferId)
          .filter(Boolean)
      );

      console.log("✅ Active applied job IDs:", Array.from(appliedIds));
      setAppliedJobs(appliedIds);
    } catch (error) {
      console.error("❌ Error loading worker applications:", error);
      console.error("❌ Error details:", {
        status: error.status,
        message: error.message,
        data: error.data,
      });

      setAppliedJobs(new Set());
    }
  };

  // CORREGIDA - Función para cargar ofertas de trabajo
  const loadJobOffers = async () => {
    try {
      setLoading(true);
      console.log("🔄 Starting to load job offers...");

      // Cargar tipos de cultivo
      await loadCropTypes();

      // Cargar ofertas de trabajo primero
      const response = await getAvailableJobOffers();
      console.log("📡 Raw job offers API response:", response);

      let jobsData = [];
      if (Array.isArray(response)) {
        jobsData = response;
      } else if (response?.jobOffers && Array.isArray(response.jobOffers)) {
        jobsData = response.jobOffers;
      } else {
        console.warn("⚠️ Unexpected response format:", response);
        jobsData = [];
      }

      // 🔥 CORREGIDO - Siempre guardar TODAS las ofertas disponibles
      console.log("✅ All available jobs:", jobsData.length);
      setJobOffers(jobsData);

      // Cargar aplicaciones del trabajador después de tener las ofertas
      if (user && hasWorkerProfile) {
        await loadWorkerApplications();
      } else {
        console.log(
          "⚠️ User doesn't have worker profile, skipping applications"
        );
        setAppliedJobs(new Set());
        // Si no tiene perfil, mostrar todas las ofertas
        setFilteredJobs(jobsData);
      }
    } catch (error) {
      console.error("❌ Error cargando ofertas:", error);
      Alert.alert("Error", "No se pudieron cargar las ofertas de trabajo");
      setJobOffers([]);
      setFilteredJobs([]);
    } finally {
      setLoading(false);
    }
  };

  // CORREGIDA - Aplicar filtros y búsqueda (incluye filtro de trabajos aplicados)
  const applyFiltersAndSearch = useCallback(() => {
    console.log("🔍 Applying filters and search with:", {
      searchTerm,
      selectedCrop: selectedCrop?.name,
      salaryRange,
      selectedDuration,
      sortBy,
      appliedJobsCount: appliedJobs.size,
      hasWorkerProfile,
    });

    let filtered = [...jobOffers];
    console.log("📊 Starting with", filtered.length, "jobs");

    // 🔥 NUEVO - Filtro por trabajos ya aplicados (solo si tiene perfil de trabajador)
    if (hasWorkerProfile && appliedJobs.size > 0) {
      const beforeFilter = filtered.length;
      filtered = filtered.filter((job) => !appliedJobs.has(job.id));
      console.log(
        `👤 After applied jobs filter: ${filtered.length} jobs (removed ${
          beforeFilter - filtered.length
        } applied jobs)`
      );
    }

    // Filtro por búsqueda
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (job) =>
          job.title?.toLowerCase().includes(searchLower) ||
          job.description?.toLowerCase().includes(searchLower) ||
          job.employer?.user?.name?.toLowerCase().includes(searchLower) ||
          job.city?.toLowerCase().includes(searchLower) ||
          job.state?.toLowerCase().includes(searchLower)
      );
      console.log("📝 After search filter:", filtered.length, "jobs");
    }

    // Filtro por tipo de cultivo - CORREGIDO
    if (selectedCrop && selectedCrop.id) {
      filtered = filtered.filter((job) => job.cropType?.id === selectedCrop.id);
      console.log("🌱 After crop filter:", filtered.length, "jobs");
    }

    // Filtro por rango salarial - CORREGIDO
    if (salaryRange.min || salaryRange.max) {
      filtered = filtered.filter((job) => {
        const salary = parseInt(job.salary) || 0;
        const min = salaryRange.min ? parseInt(salaryRange.min) : 0;
        const max = salaryRange.max ? parseInt(salaryRange.max) : Infinity;
        const passesFilter = salary >= min && salary <= max;
        return passesFilter;
      });
      console.log("💰 After salary filter:", filtered.length, "jobs");
    }

    // Filtro por duración - CORREGIDO
    if (selectedDuration) {
      filtered = filtered.filter((job) => {
        const duration = parseInt(job.duration) || 0;
        const passesFilter =
          duration >= selectedDuration.min && duration <= selectedDuration.max;
        return passesFilter;
      });
      console.log("📅 After duration filter:", filtered.length, "jobs");
    }

    // Ordenamiento - CORREGIDO
    switch (sortBy) {
      case "salary_high":
        filtered.sort(
          (a, b) => (parseInt(b.salary) || 0) - (parseInt(a.salary) || 0)
        );
        console.log("📊 Sorted by salary (high to low)");
        break;
      case "salary_low":
        filtered.sort(
          (a, b) => (parseInt(a.salary) || 0) - (parseInt(b.salary) || 0)
        );
        console.log("📊 Sorted by salary (low to high)");
        break;
      case "duration":
        filtered.sort(
          (a, b) => (parseInt(a.duration) || 0) - (parseInt(b.duration) || 0)
        );
        console.log("📊 Sorted by duration");
        break;
      case "newest":
      default:
        filtered.sort(
          (a, b) =>
            new Date(b.createdAt || 0).getTime() -
            new Date(a.createdAt || 0).getTime()
        );
        console.log("📊 Sorted by newest");
        break;
    }

    console.log("✅ Final filtered jobs:", filtered.length);
    setFilteredJobs(filtered);
  }, [
    jobOffers,
    searchTerm,
    selectedCrop,
    salaryRange,
    selectedDuration,
    sortBy,
    appliedJobs,
    hasWorkerProfile,
  ]);

  // CORREGIDA - Función para postularse (no remueve de jobOffers)
  const applyToJob = useCallback(
    async (jobOfferId) => {
      try {
        if (!hasWorkerProfile) {
          Alert.alert(
            "Perfil requerido",
            "Necesitas tener un perfil de trabajador para postularte a ofertas de trabajo"
          );
          return;
        }

        if (appliedJobs.has(jobOfferId)) {
          Alert.alert("Información", "Ya te has postulado a esta oferta");
          return;
        }

        if (applyingJobs.has(jobOfferId)) {
          return;
        }

        setApplyingJobs((prev) => new Set([...prev, jobOfferId]));

        const workerId = user.workerProfile.id;
        await createApplication(jobOfferId, {
          userId: user.id,
          workerId: workerId,
        });

        // 🔥 CORREGIDO - Solo actualizar appliedJobs, no remover de jobOffers
        // El filtrado se manejará automáticamente en applyFiltersAndSearch
        setAppliedJobs((prev) => new Set([...prev, jobOfferId]));

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

        Alert.alert("Error", "No se pudo enviar la postulación");
        console.error("❌ Error aplicando a trabajo:", error);
      }
    },
    [appliedJobs, applyingJobs, user, hasWorkerProfile]
  );

  // CORREGIDA - Función para limpiar filtros
  const clearAllFilters = useCallback(() => {
    console.log("🧹 Clearing all filters");
    setSearchTerm("");
    setSelectedCrop(null);
    setSalaryRange({ min: "", max: "" });
    setSelectedDuration(null);
    setSortBy("newest");
    setShowAdvancedFilters(false);
  }, []);

  // 🔥 NUEVA - Función para refrescar solo las aplicaciones del trabajador
  const refreshWorkerApplications = useCallback(async () => {
    if (user && hasWorkerProfile) {
      console.log("🔄 Refreshing worker applications...");
      await loadWorkerApplications();
    }
  }, [user, hasWorkerProfile]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadJobOffers();
    setRefreshing(false);
  };

  useEffect(() => {
    console.log("🔄 WorkerJobsScreen useEffect triggered:", {
      authLoading,
      hasUser: !!user,
      hasWorkerProfile,
    });

    if (!authLoading && user) {
      loadJobOffers();
    }
  }, [authLoading, user, hasWorkerProfile]);

  // CORREGIDO - UseEffect para aplicar filtros inmediatamente
  useEffect(() => {
    console.log("🔄 Filter useEffect triggered");
    applyFiltersAndSearch();
  }, [applyFiltersAndSearch]);

  // 🔥 NUEVO - UseEffect para re-aplicar filtros cuando appliedJobs cambie
  useEffect(() => {
    console.log(
      "🔄 Applied jobs changed, re-applying filters. Applied jobs count:",
      appliedJobs.size
    );
    if (jobOffers.length > 0) {
      applyFiltersAndSearch();
    }
  }, [appliedJobs]);

  // 🔥 NUEVO - UseEffect para re-aplicar filtros cuando appliedJobs cambie
  useEffect(() => {
    console.log(
      "🔄 Applied jobs changed, re-applying filters. Applied jobs count:",
      appliedJobs.size
    );
    if (jobOffers.length > 0) {
      applyFiltersAndSearch();
    }
  }, [appliedJobs]);

  // CORREGIDO - Componente de pestañas de categorías
  const CategoryTabs = React.memo(() => (
    <View style={styles.filtersSection}>
      <Text style={styles.filtersSectionTitle}>Categorías</Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryTabsContainer}
        style={styles.categoryTabsScroll}>
        <TouchableOpacity
          style={[
            styles.categoryTab,
            !selectedCrop && styles.activeCategoryTab,
          ]}
          onPress={() => {
            console.log("🏷️ Selected category: All");
            setSelectedCrop(null);
          }}
          activeOpacity={0.7}>
          <View style={styles.categoryTabContent}>
            <Ionicons
              name="apps-outline"
              size={16}
              color={!selectedCrop ? "#FFFFFF" : COLORS.textSecondary}
              style={styles.categoryTabIcon}
            />
            <Text
              style={[
                styles.categoryTabText,
                !selectedCrop && styles.activeCategoryTabText,
              ]}>
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
              onPress={() => {
                console.log("🏷️ Selected category:", crop.name);
                setSelectedCrop(crop);
              }}
              activeOpacity={0.7}>
              <View style={styles.categoryTabContent}>
                <Ionicons
                  name="leaf-outline"
                  size={16}
                  color={isActive ? "#FFFFFF" : COLORS.success}
                  style={styles.categoryTabIcon}
                />
                <Text
                  style={[
                    styles.categoryTabText,
                    isActive && styles.activeCategoryTabText,
                  ]}>
                  {crop.name}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* CORREGIDO - Filtros adicionales */}
      <View style={styles.additionalFilters}>
        <Text style={styles.additionalFiltersTitle}>Filtros rápidos</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.quickFiltersContainer}>
          {/* Filtro de ordenamiento - CORREGIDO */}
          <TouchableOpacity
            style={[
              styles.quickFilterButton,
              sortBy !== "newest" && styles.quickFilterButtonActive,
            ]}
            onPress={() => {
              console.log("🔄 Current sortBy:", sortBy);
              const sortOptions = [
                "newest",
                "salary_high",
                "salary_low",
                "duration",
              ];
              const currentIndex = sortOptions.indexOf(sortBy);
              const nextIndex = (currentIndex + 1) % sortOptions.length;
              const nextSort = sortOptions[nextIndex];
              console.log("🔄 Setting sortBy to:", nextSort);
              setSortBy(nextSort);
            }}>
            <Ionicons
              name="swap-vertical-outline"
              size={16}
              color={sortBy !== "newest" ? "#FFFFFF" : COLORS.textSecondary}
            />
            <Text
              style={[
                styles.quickFilterText,
                sortBy !== "newest" && styles.quickFilterTextActive,
              ]}>
              {sortBy === "salary_high"
                ? "Salario ↓"
                : sortBy === "salary_low"
                ? "Salario ↑"
                : sortBy === "duration"
                ? "Duración"
                : "Recientes"}
            </Text>
          </TouchableOpacity>

          {/* Filtro de rango salarial rápido - CORREGIDO */}
          <TouchableOpacity
            style={[
              styles.quickFilterButton,
              (salaryRange.min || salaryRange.max) &&
                styles.quickFilterButtonActive,
            ]}
            onPress={() => {
              console.log("💰 Current salary range:", salaryRange);
              if (salaryRange.min || salaryRange.max) {
                console.log("💰 Clearing salary range");
                setSalaryRange({ min: "", max: "" });
              } else {
                console.log("💰 Setting salary range: 43000-50000");
                setSalaryRange({ min: "43000", max: "50000" });
              }
            }}>
            <Ionicons
              name="cash-outline"
              size={16}
              color={
                salaryRange.min || salaryRange.max
                  ? "#FFFFFF"
                  : COLORS.textSecondary
              }
            />
            <Text
              style={[
                styles.quickFilterText,
                (salaryRange.min || salaryRange.max) &&
                  styles.quickFilterTextActive,
              ]}>
              {salaryRange.min || salaryRange.max
                ? "Salario filtrado"
                : "43k-50k"}
            </Text>
          </TouchableOpacity>

          {/* Filtro de duración - CORREGIDO */}
          <TouchableOpacity
            style={[
              styles.quickFilterButton,
              selectedDuration && styles.quickFilterButtonActive,
            ]}
            onPress={() => {
              console.log("📅 Current duration:", selectedDuration);
              if (selectedDuration) {
                console.log("📅 Clearing duration filter");
                setSelectedDuration(null);
              } else {
                console.log("📅 Setting duration filter: 1-30 days");
                setSelectedDuration({ min: 1, max: 30 });
              }
            }}>
            <Ionicons
              name="calendar-outline"
              size={16}
              color={selectedDuration ? "#FFFFFF" : COLORS.textSecondary}
            />
            <Text
              style={[
                styles.quickFilterText,
                selectedDuration && styles.quickFilterTextActive,
              ]}>
              {selectedDuration ? "Corta duración" : "Duración"}
            </Text>
          </TouchableOpacity>

          {/* Botón de filtros avanzados */}
          <TouchableOpacity
            style={[
              styles.quickFilterButton,
              showAdvancedFilters && styles.quickFilterButtonActive,
            ]}
            onPress={() => {
              console.log(
                "⚙️ Toggling advanced filters:",
                !showAdvancedFilters
              );
              setShowAdvancedFilters(!showAdvancedFilters);
            }}>
            <Ionicons
              name="options-outline"
              size={16}
              color={showAdvancedFilters ? "#FFFFFF" : COLORS.textSecondary}
            />
            <Text
              style={[
                styles.quickFilterText,
                showAdvancedFilters && styles.quickFilterTextActive,
              ]}>
              Más filtros
            </Text>
          </TouchableOpacity>

          {/* Botón para limpiar filtros - MEJORADO */}
          {(searchTerm ||
            selectedCrop ||
            salaryRange.min ||
            salaryRange.max ||
            selectedDuration ||
            sortBy !== "newest") && (
            <TouchableOpacity
              style={styles.clearFiltersQuickButton}
              onPress={clearAllFilters}>
              <Ionicons name="refresh-outline" size={16} color={COLORS.error} />
              <Text style={styles.clearFiltersQuickText}>Limpiar</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </View>

      {/* CORREGIDO - Filtros avanzados expandibles */}
      {showAdvancedFilters && (
        <View style={styles.advancedFiltersContainer}>
          <View style={styles.advancedFilterRow}>
            <Text style={styles.advancedFilterLabel}>
              Rango salarial personalizado (COP):
            </Text>
            <View style={styles.salaryRangeContainer}>
              <TextInput
                style={styles.salaryInput}
                placeholder="Mínimo"
                value={salaryRange.min}
                onChangeText={(text) => {
                  console.log("💰 Setting salary min:", text);
                  setSalaryRange((prev) => ({ ...prev, min: text }));
                }}
                keyboardType="numeric"
                placeholderTextColor={COLORS.textLight}
              />
              <Text style={styles.salaryRangeSeparator}>-</Text>
              <TextInput
                style={styles.salaryInput}
                placeholder="Máximo"
                value={salaryRange.max}
                onChangeText={(text) => {
                  console.log("💰 Setting salary max:", text);
                  setSalaryRange((prev) => ({ ...prev, max: text }));
                }}
                keyboardType="numeric"
                placeholderTextColor={COLORS.textLight}
              />
            </View>
          </View>

          <View style={styles.advancedFilterRow}>
            <Text style={styles.advancedFilterLabel}>
              Duración del trabajo:
            </Text>
            <View style={styles.durationButtonsContainer}>
              <TouchableOpacity
                style={[
                  styles.durationButton,
                  !selectedDuration && styles.durationButtonActive,
                ]}
                onPress={() => {
                  console.log("📅 Setting duration: any");
                  setSelectedDuration(null);
                }}>
                <Text
                  style={[
                    styles.durationButtonText,
                    !selectedDuration && styles.durationButtonTextActive,
                  ]}>
                  Cualquiera
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.durationButton,
                  selectedDuration?.min === 1 &&
                    selectedDuration?.max === 7 &&
                    styles.durationButtonActive,
                ]}
                onPress={() => {
                  console.log("📅 Setting duration: 1-7 days");
                  setSelectedDuration({ min: 1, max: 7 });
                }}>
                <Text
                  style={[
                    styles.durationButtonText,
                    selectedDuration?.min === 1 &&
                      selectedDuration?.max === 7 &&
                      styles.durationButtonTextActive,
                  ]}>
                  1-7 días
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.durationButton,
                  selectedDuration?.min === 8 &&
                    selectedDuration?.max === 30 &&
                    styles.durationButtonActive,
                ]}
                onPress={() => {
                  console.log("📅 Setting duration: 8-30 days");
                  setSelectedDuration({ min: 8, max: 30 });
                }}>
                <Text
                  style={[
                    styles.durationButtonText,
                    selectedDuration?.min === 8 &&
                      selectedDuration?.max === 30 &&
                      styles.durationButtonTextActive,
                  ]}>
                  1-4 semanas
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.durationButton,
                  selectedDuration?.min === 31 && styles.durationButtonActive,
                ]}
                onPress={() => {
                  console.log("📅 Setting duration: 31+ days");
                  setSelectedDuration({ min: 31, max: 365 });
                }}>
                <Text
                  style={[
                    styles.durationButtonText,
                    selectedDuration?.min === 31 &&
                      styles.durationButtonTextActive,
                  ]}>
                  +1 mes
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.advancedFilterActions}>
            <TouchableOpacity
              style={styles.applyFiltersButton}
              onPress={() => {
                console.log("✅ Closing advanced filters panel");
                setShowAdvancedFilters(false);
              }}>
              <Ionicons name="checkmark" size={16} color="#FFFFFF" />
              <Text style={styles.applyFiltersButtonText}>Aplicar</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  ));

  // JobCard component
  const JobCard = React.memo(({ item }) => {
    const isApplied = useMemo(() => appliedJobs.has(item.id), [item.id]);
    const isApplying = useMemo(() => applyingJobs.has(item.id), [item.id]);

    const handleApply = useCallback(() => {
      applyToJob(item.id);
    }, [item.id]);

    const handleNavigate = useCallback(() => {
      navigation.navigate("WorkerJobOfferDetail", { jobOfferId: item.id });
    }, [item.id]);

    const daysAgo = useMemo(() => {
      return Math.max(
        1,
        Math.floor(
          (new Date().getTime() -
            new Date(item.createdAt || new Date()).getTime()) /
            (1000 * 60 * 60 * 24)
        )
      );
    }, [item.createdAt]);

    return (
      <TouchableOpacity
        style={styles.jobCard}
        onPress={handleNavigate}
        activeOpacity={0.7}>
        <View style={styles.jobCardHeader}>
          <View style={styles.jobCardTitleContainer}>
            <Text style={styles.jobCardTitle} numberOfLines={2}>
              {item.title || "Trabajo agrícola"}
            </Text>
            <Text style={styles.jobCardEmployer}>
              {item.employer?.user?.name || "Empleador"}
            </Text>
          </View>
          <View style={styles.jobCardSalary}>
            <Text style={styles.salaryAmount}>
              ${new Intl.NumberFormat("es-CO").format(item.salary || 0)}
            </Text>
            <Text style={styles.salaryPeriod}>por día</Text>
          </View>
        </View>

        <View style={styles.jobCardDetails}>
          <View style={styles.jobDetailItem}>
            <Ionicons name="location" size={16} color={COLORS.textSecondary} />
            <Text style={styles.jobDetailText}>
              {item.displayLocation?.city || item.city || "Ciudad"},{" "}
              {item.displayLocation?.department || item.state || "Departamento"}
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
              (isApplied || isApplying) && styles.appliedButton,
              !hasWorkerProfile && styles.disabledButton,
            ]}
            onPress={handleApply}
            disabled={isApplied || isApplying || !hasWorkerProfile}
            activeOpacity={0.8}>
            {isApplying ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text
                style={[
                  styles.applyButtonText,
                  isApplied && styles.appliedButtonText,
                  !hasWorkerProfile && styles.disabledButtonText,
                ]}>
                {!hasWorkerProfile
                  ? "Perfil requerido"
                  : isApplied
                  ? "Postulado"
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
      keyExtractor={(item, index) =>
        item.id ? `job-${item.id}` : `job-index-${index}`
      }
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
            No se encontraron ofertas de trabajo
          </Text>
          <Text style={styles.emptyStateSubtext}>
            Intenta ajustar tus filtros de búsqueda
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
      <ScreenLayoutWorker navigation={navigation}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Verificando autenticación...</Text>
        </View>
      </ScreenLayoutWorker>
    );
  }

  if (loading) {
    return (
      <ScreenLayoutWorker navigation={navigation}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Cargando ofertas de trabajo...</Text>
        </View>
      </ScreenLayoutWorker>
    );
  }

  return (
    <ScreenLayoutWorker navigation={navigation}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Buscar Trabajos</Text>
          <View style={styles.headerSubtitleContainer}>
            <Text style={styles.headerSubtitle}>
              {filteredJobs.length} ofertas disponibles
            </Text>
            {/* Indicador de filtros activos */}
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
          {!hasWorkerProfile && (
            <Text style={styles.warningText}>
              ⚠️ Necesitas completar tu perfil de trabajador para postularte
            </Text>
          )}
        </View>
        <CategoryTabs />
        <JobsList />
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
  warningText: {
    fontSize: 12,
    color: COLORS.warning,
    marginTop: 4,
    fontWeight: "500",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    margin: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: COLORS.text,
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
  filtersSectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.text,
    marginHorizontal: 20,
    marginBottom: 12,
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
  additionalFilters: {
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  additionalFiltersTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.text,
    marginHorizontal: 20,
    marginBottom: 8,
  },
  quickFiltersContainer: {
    paddingHorizontal: 16,
    paddingRight: 32,
  },
  quickFilterButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    minHeight: 36,
  },
  quickFilterButtonActive: {
    backgroundColor: COLORS.secondary,
    borderColor: COLORS.secondary,
  },
  quickFilterText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginLeft: 6,
    fontWeight: "500",
  },
  quickFilterTextActive: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  clearFiltersQuickButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: `${COLORS.error}15`,
    borderWidth: 1,
    borderColor: COLORS.error,
    minHeight: 36,
  },
  clearFiltersQuickText: {
    fontSize: 12,
    color: COLORS.error,
    marginLeft: 6,
    fontWeight: "600",
  },
  advancedFiltersContainer: {
    backgroundColor: COLORS.background,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  advancedFilterRow: {
    marginBottom: 16,
  },
  advancedFilterLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 8,
  },
  salaryRangeContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  salaryInput: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  salaryRangeSeparator: {
    marginHorizontal: 12,
    fontSize: 16,
    color: COLORS.textSecondary,
    fontWeight: "500",
  },
  durationButtonsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  durationButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    minWidth: 80,
  },
  durationButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  durationButtonText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: "center",
    fontWeight: "500",
  },
  durationButtonTextActive: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  advancedFilterActions: {
    alignItems: "center",
    marginTop: 8,
  },
  applyFiltersButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.success,
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  applyFiltersButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 8,
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
  appliedButton: {
    backgroundColor: COLORS.success,
  },
  disabledButton: {
    backgroundColor: COLORS.textLight,
  },
  applyButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  appliedButtonText: {
    color: "#FFFFFF",
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
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: COLORS.textLight,
    marginTop: 8,
    textAlign: "center",
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
