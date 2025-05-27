import React, { useState, useEffect } from "react";
import {
  Text,
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Alert,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { getUserData } from "../../../../services/userService";
import { useAuth } from "../../../../context/AuthContext";
import {
  getJobOffersByEmployerId,
  getActiveJobOffersByLoggedEmployerId,
} from "../../../../services/jobOffers";
import { getAvailableWorkers } from "../../../../services/workerService";
import { getFarmByemployerId } from "../../../../services/farmService";
import { getCropType } from "../../../../services/cropTypeService";
import ScreenLayout from "../../../../components/ScreenLayout";

const { width } = Dimensions.get("window");

const COLORS = {
  background: "#FFFFFF",
  cardBackground: "#FFFFFF",
  surface: "#F8FAFC",
  primary: "#284E66",
  secondary: "#B6883E",
  accent: "#009AB3",
  success: "#51CF66",
  warning: "#F59E0B",
  error: "#EF4444",
  text: "#1A202C",
  textSecondary: "#4A5568",
  textLight: "#718096",
  border: "#E2E8F0",
  shadow: "#000000",
  lightBlue: "#E8F1F5",
  lightGold: "#F5F1E8",
  lightTurquoise: "#E6F7F9",
  cream: "#F3F0E8",
};

export default function ModernProducerDashboard({ navigation }) {
  // Estados existentes
  const [userData, setUserData] = useState(null);
  const [myJobOffers, setMyJobOffers] = useState([]);
  const [activeJobOffers, setActiveJobOffers] = useState([]);
  const [availableWorkers, setAvailableWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  // Estados para el sistema de tabs
  const [activeTab, setActiveTab] = useState("dashboard");

  // Estados para estadísticas del dashboard
  const [dashboardStats, setDashboardStats] = useState({
    employerRating: 4.5,
    totalOffers: 0,
    activeOffers: 0,
    totalApplications: 0,
    totalFarms: 0,
    totalHectares: 0,
    totalPlants: 0,
    workersPerFarm: 0,
    offersPerFarm: 0,
    monthlyOffers: 0,
  });

  // Estado para datos de fincas
  const [farmsData, setFarmsData] = useState([]);

  // Estados para explorar ofertas
  const [cropTypes, setCropTypes] = useState([]);
  const [allJobOffers, setAllJobOffers] = useState([]);
  const [filteredOffers, setFilteredOffers] = useState([]);
  const [selectedCropType, setSelectedCropType] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("");
  const [showMyOffers, setShowMyOffers] = useState(true);

  const fetchUserData = async () => {
    try {
      if (!user || !user.id) {
        throw new Error("No hay usuario autenticado");
      }
      const userData = await getUserData(user.id);
      setUserData(userData);
      await AsyncStorage.setItem("@user_data", JSON.stringify(userData));
      return userData;
    } catch (error) {
      console.error("Error obteniendo datos del usuario:", error);
      const storedUserData = await AsyncStorage.getItem("@user_data");
      if (storedUserData) {
        const parsedData = JSON.parse(storedUserData);
        setUserData(parsedData);
      }
      throw error;
    }
  };

  const getEmployerId = async () => {
    try {
      let employerData = userData;
      if (!employerData) {
        employerData = await fetchUserData();
      }
      if (!employerData.employerProfile) {
        throw new Error("El usuario no tiene perfil de empleador");
      }
      return employerData.employerProfile.id;
    } catch (error) {
      console.error("Error obteniendo ID del empleador:", error);
      throw error;
    }
  };

  const loadEmployerFarms = async () => {
    try {
      const employerId = await getEmployerId();
      try {
        const farmsResponse = await getFarmByemployerId(employerId);
        setFarmsData(farmsResponse?.data || []);
      } catch (apiError) {
        console.log("Using simulated farms data (API not available)");
        const simulatedFarms = [
          {
            id: "1",
            name: "Finca La Esperanza",
            size: 25.5,
            plantCount: 1200,
            workers: 8,
            offers: 3,
            cropTypesInfo: [{ name: "Cacao" }],
            locationString: "Fortul, Arauca, Colombia",
          },
          {
            id: "2",
            name: "Finca El Progreso",
            size: 18.2,
            plantCount: 850,
            workers: 6,
            offers: 2,
            cropTypesInfo: [{ name: "Café" }],
            locationString: "Tame, Arauca, Colombia",
          },
        ];
        setFarmsData(simulatedFarms);
      }
    } catch (error) {
      console.error("Error cargando fincas del empleador:", error);
      setFarmsData([]);
    }
  };

  const loadCropTypes = async () => {
    try {
      const data = await getCropType();
      console.log("Crop Types API response:", JSON.stringify(data));
      if (data && data.success && Array.isArray(data.data)) {
        setCropTypes(data.data);
      } else if (data && data.cropTypes && Array.isArray(data.cropTypes)) {
        // Format with cropTypes property
        setCropTypes(data.cropTypes);
      } else if (Array.isArray(data)) {
        // Direct array format
        setCropTypes(data);
      } else {
        console.error("Unexpected crop types response format:", data);
        setCropTypes([]);
      }
    } catch (error) {
      console.error("Error loading crop types:", error);
      Alert.alert("Error", "No se pudieron cargar los tipos de cultivo");
      setCropTypes([]);
    }
  };

  const loadAllJobOffers = async () => {
    try {
      // Simulación - reemplazar con endpoint real
      const employerId = await getEmployerId();
      // Filtrar ofertas del usuario actual en datos reales
      setAllJobOffers([]);
      setFilteredOffers([]);
    } catch (error) {
      console.error("Error cargando ofertas de otros productores:", error);
      setAllJobOffers([]);
      setFilteredOffers([]);
    }
  };

  const filterOffers = () => {
    let filtered = showMyOffers ? [...myJobOffers] : [...allJobOffers];

    if (selectedCropType) {
      filtered = filtered.filter(
        (offer) =>
          offer.cropType?.name === selectedCropType ||
          offer.cropType === selectedCropType
      );
    }

    if (selectedLocation) {
      filtered = filtered.filter(
        (offer) =>
          offer.displayLocation?.city
            ?.toLowerCase()
            .includes(selectedLocation.toLowerCase()) ||
          offer.city?.toLowerCase().includes(selectedLocation.toLowerCase()) ||
          offer.displayLocation?.department
            ?.toLowerCase()
            .includes(selectedLocation.toLowerCase()) ||
          offer.state?.toLowerCase().includes(selectedLocation.toLowerCase())
      );
    }

    setFilteredOffers(filtered);
  };

  const loadAvailableWorkers = async () => {
    try {
      const workers = await getAvailableWorkers();
      setAvailableWorkers(workers || []);
    } catch (error) {
      console.error("Error cargando trabajadores:", error);
    }
  };

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
        setError("Error al cargar los datos. Por favor, intenta de nuevo.");
        setLoading(false);
      }
    };

    if (user?.id) {
      loadInitialData();
    }
  }, [user]);

  useEffect(() => {
    filterOffers();
  }, [
    selectedCropType,
    selectedLocation,
    allJobOffers,
    myJobOffers,
    showMyOffers,
  ]);

  // Componente de navegación por tabs
  const TabNavigation = () => (
    <View style={styles.tabContainer}>
      <TouchableOpacity
        style={[
          styles.tabButton,
          activeTab === "dashboard" && styles.tabButtonActive,
        ]}
        onPress={() => setActiveTab("dashboard")}>
        <Ionicons
          name="home"
          size={20}
          color={activeTab === "dashboard" ? COLORS.primary : COLORS.textLight}
        />
        <Text
          style={[
            styles.tabButtonText,
            activeTab === "dashboard" && styles.tabButtonTextActive,
          ]}>
          Dashboard
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.tabButton,
          activeTab === "offers" && styles.tabButtonActive,
        ]}
        onPress={() => setActiveTab("offers")}>
        <Ionicons
          name="briefcase"
          size={20}
          color={activeTab === "offers" ? COLORS.primary : COLORS.textLight}
        />
        <Text
          style={[
            styles.tabButtonText,
            activeTab === "offers" && styles.tabButtonTextActive,
          ]}>
          Ofertas
        </Text>
      </TouchableOpacity>
    </View>
  );

  // Componentes del dashboard (mantener todos los componentes existentes)
  const EmployerRating = () => (
    <View style={styles.ratingCardCompact}>
      <View style={styles.ratingHeaderCompact}>
        <View style={styles.ratingInfo}>
          <Text style={styles.ratingTitle}>Mi Calificación</Text>
          <View style={styles.ratingStarsCompact}>
            {[1, 2, 3, 4, 5].map((star) => (
              <Ionicons
                key={star}
                name={
                  star <= Math.floor(dashboardStats.employerRating)
                    ? "star"
                    : "star-outline"
                }
                size={18}
                color={
                  star <= Math.floor(dashboardStats.employerRating)
                    ? COLORS.warning
                    : COLORS.border
                }
              />
            ))}
          </View>
        </View>
        <View style={styles.ratingBadgeCompact}>
          <Text style={styles.ratingTextCompact}>
            {dashboardStats.employerRating.toFixed(1)}
          </Text>
        </View>
      </View>
      <Text style={styles.ratingSubtextCompact}>
        {dashboardStats.totalApplications} evaluaciones
      </Text>
    </View>
  );

  const MainMetrics = () => (
    <View style={styles.metricsGrid}>
      {/* Card de Ofertas */}
      <View style={styles.metricCard}>
        <View style={styles.metricCardDecorationOffers} />
        <View style={styles.metricCardHeader}>
          <View style={[styles.metricIcon, { backgroundColor: "#4F46E5" }]}>
            <Ionicons name="briefcase" size={28} color="#FFFFFF" />
          </View>
          <View
            style={[
              styles.metricBadge,
              {
                backgroundColor: "#4F46E5" + "15",
                borderColor: "#4F46E5" + "30",
              },
            ]}>
            <Text style={[styles.metricBadgeText, { color: "#4F46E5" }]}>
              {dashboardStats.activeOffers} activas
            </Text>
          </View>
        </View>
        <Text style={styles.metricNumber}>{dashboardStats.totalOffers}</Text>
        <Text style={styles.metricLabel}>Total Ofertas</Text>
        <View style={styles.metricProgress}>
          <View
            style={[
              styles.metricProgressBar,
              {
                width: `${Math.min(
                  (dashboardStats.activeOffers /
                    Math.max(dashboardStats.totalOffers, 1)) *
                    100,
                  100
                )}%`,
                backgroundColor: "#4F46E5",
              },
            ]}
          />
        </View>
        <View style={styles.metricFooter}>
          <Ionicons name="trending-up" size={16} color="#4F46E5" />
          <Text style={[styles.metricFooterText, { color: "#4F46E5" }]}>
            Este mes: {dashboardStats.monthlyOffers}
          </Text>
        </View>
      </View>

      {/* Card de Fincas */}
      <View style={styles.metricCard}>
        <View style={styles.metricCardDecorationFarms} />
        <View style={styles.metricCardHeader}>
          <View style={[styles.metricIcon, { backgroundColor: "#10B981" }]}>
            <Ionicons name="leaf" size={28} color="#FFFFFF" />
          </View>
          <View
            style={[
              styles.metricBadge,
              {
                backgroundColor: "#10B981" + "15",
                borderColor: "#10B981" + "30",
              },
            ]}>
            <Text style={[styles.metricBadgeText, { color: "#10B981" }]}>
              {dashboardStats.totalHectares.toFixed(1)} ha
            </Text>
          </View>
        </View>
        <Text style={styles.metricNumber}>{dashboardStats.totalFarms}</Text>
        <Text style={styles.metricLabel}>Fincas</Text>
        <View style={styles.metricProgress}>
          <View
            style={[
              styles.metricProgressBar,
              {
                width: dashboardStats.totalFarms > 0 ? "100%" : "0%",
                backgroundColor: "#10B981",
              },
            ]}
          />
        </View>
        <View style={styles.metricFooter}>
          <Ionicons name="stats-chart" size={16} color="#10B981" />
          <Text style={[styles.metricFooterText, { color: "#10B981" }]}>
            Promedio:{" "}
            {dashboardStats.totalFarms > 0
              ? (
                  dashboardStats.totalHectares / dashboardStats.totalFarms
                ).toFixed(1)
              : 0}{" "}
            ha/finca
          </Text>
        </View>
      </View>

      {/* Card de Plantas */}
      <View style={styles.metricCard}>
        <View style={styles.metricCardDecorationPlants} />
        <View style={styles.metricCardHeader}>
          <View style={[styles.metricIcon, { backgroundColor: "#F59E0B" }]}>
            <Ionicons name="flower" size={28} color="#FFFFFF" />
          </View>
          <View
            style={[
              styles.metricBadge,
              {
                backgroundColor: "#F59E0B" + "15",
                borderColor: "#F59E0B" + "30",
              },
            ]}>
            <Text style={[styles.metricBadgeText, { color: "#F59E0B" }]}>
              TOTAL
            </Text>
          </View>
        </View>
        <Text style={styles.metricNumber}>
          {dashboardStats.totalPlants > 999
            ? `${(dashboardStats.totalPlants / 1000).toFixed(1)}K`
            : dashboardStats.totalPlants.toLocaleString()}
        </Text>
        <Text style={styles.metricLabel}>Plantas</Text>
        <View style={styles.metricProgress}>
          <View
            style={[
              styles.metricProgressBar,
              {
                width: dashboardStats.totalPlants > 0 ? "100%" : "0%",
                backgroundColor: "#F59E0B",
              },
            ]}
          />
        </View>
        <View style={styles.metricFooter}>
          <Ionicons name="leaf-outline" size={16} color="#F59E0B" />
          <Text style={[styles.metricFooterText, { color: "#F59E0B" }]}>
            {dashboardStats.totalFarms > 0
              ? Math.round(
                  dashboardStats.totalPlants / dashboardStats.totalFarms
                ).toLocaleString()
              : 0}{" "}
            por finca
          </Text>
        </View>
      </View>

      {/* Card de Trabajadores */}
      <View style={styles.metricCard}>
        <View style={styles.metricCardDecorationWorkers} />
        <View style={styles.metricCardHeader}>
          <View style={[styles.metricIcon, { backgroundColor: "#8B5CF6" }]}>
            <Ionicons name="people" size={28} color="#FFFFFF" />
          </View>
          <View
            style={[
              styles.metricBadge,
              {
                backgroundColor: "#8B5CF6" + "15",
                borderColor: "#8B5CF6" + "30",
              },
            ]}>
            <Text style={[styles.metricBadgeText, { color: "#8B5CF6" }]}>
              PROMEDIO
            </Text>
          </View>
        </View>
        <Text style={styles.metricNumber}>{dashboardStats.workersPerFarm}</Text>
        <Text style={styles.metricLabel}>Trabajadores</Text>
        <View style={styles.metricProgress}>
          <View
            style={[
              styles.metricProgressBar,
              {
                width:
                  dashboardStats.workersPerFarm > 0
                    ? `${Math.min(dashboardStats.workersPerFarm * 10, 100)}%`
                    : "0%",
                backgroundColor: "#8B5CF6",
              },
            ]}
          />
        </View>
        <View style={styles.metricFooter}>
          <Ionicons name="person-add" size={16} color="#8B5CF6" />
          <Text style={[styles.metricFooterText, { color: "#8B5CF6" }]}>
            Por finca activa
          </Text>
        </View>
      </View>
    </View>
  );

  const calculateDashboardStats = (jobOffers, farms, userData) => {
    const totalOffers = jobOffers?.length || 0;
    const activeOffers =
      jobOffers?.filter(
        (offer) => offer.status === "Activo" || offer.status === "activo"
      ).length || 0;
    const totalApplications =
      jobOffers?.reduce(
        (sum, offer) => sum + (offer.applicationsCount || 0),
        0
      ) || 0;

    const currentMonth = new Date().getMonth();
    const monthlyOffers =
      jobOffers?.filter((offer) => {
        if (!offer.createdAt) return false;
        const offerMonth = new Date(offer.createdAt).getMonth();
        return offerMonth === currentMonth;
      }).length || 0;

    const farmsArray = Array.isArray(farms) ? farms : [];
    const totalFarms = farmsArray.length;
    const totalHectares = farmsArray.reduce(
      (sum, farm) => sum + (farm.size || 0),
      0
    );
    const totalPlants = farmsArray.reduce(
      (sum, farm) => sum + (farm.plantCount || 0),
      0
    );
    const totalWorkers = farmsArray.reduce(
      (sum, farm) => sum + (farm.workers || 0),
      0
    );

    const farmOffers = jobOffers?.filter((offer) => offer.farmId) || [];
    const offersPerFarm =
      totalFarms > 0 ? Math.round(farmOffers.length / totalFarms) : 0;
    const workersPerFarm =
      totalFarms > 0 ? Math.round(totalWorkers / totalFarms) : 0;

    return {
      employerRating: userData?.employerProfile?.rating || 4.5,
      totalOffers,
      activeOffers,
      totalApplications,
      totalFarms,
      totalHectares,
      totalPlants,
      workersPerFarm,
      offersPerFarm,
      monthlyOffers,
    };
  };

  // useEffect para recalcular estadísticas (agregar al componente principal)
  useEffect(() => {
    if (myJobOffers.length >= 0 && farmsData.length >= 0) {
      const newStats = calculateDashboardStats(
        myJobOffers,
        farmsData,
        userData
      );
      setDashboardStats(newStats);
    }
  }, [myJobOffers, farmsData, userData]);

  const loadMyJobOffers = async () => {
    try {
      const employerId = await getEmployerId();
      const jobOffersData = await getJobOffersByEmployerId(employerId);
      setMyJobOffers(jobOffersData || []);
    } catch (error) {
      console.error("Error cargando mis ofertas:", error);
      setError(error.message);
    }
  };

  // Modificar loadAllData para cargar en secuencia
  const loadAllData = async (isRefreshing = false) => {
    try {
      if (!isRefreshing) {
        setLoading(true);
      }
      setError(null);

      // Primero cargamos las fincas
      await loadEmployerFarms();

      // Luego cargamos en paralelo el resto
      await Promise.all([
        loadAvailableWorkers(),
        loadCropTypes(),
        loadAllJobOffers(),
      ]);

      // Finalmente cargamos las ofertas (que dependen de farmsData)
      await loadMyJobOffers();
    } catch (error) {
      console.error("Error cargando datos:", error);
      setError(error.message || "Error al cargar los datos");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const AdvancedStats = () => (
    <View style={styles.statsContainer}>
      <Text style={styles.sectionTitle}>Estadísticas Detalladas</Text>

      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <View style={styles.statIconContainer}>
            <Ionicons name="trending-up" size={20} color={COLORS.accent} />
          </View>
          <View style={styles.statContent}>
            <Text style={styles.statValue}>{dashboardStats.offersPerFarm}</Text>
            <Text style={styles.statLabel}>Ofertas por finca</Text>
          </View>
        </View>

        <View style={styles.statItem}>
          <View style={styles.statIconContainer}>
            <Ionicons name="calendar" size={20} color={COLORS.primary} />
          </View>
          <View style={styles.statContent}>
            <Text style={styles.statValue}>{dashboardStats.monthlyOffers}</Text>
            <Text style={styles.statLabel}>Ofertas este mes</Text>
          </View>
        </View>
      </View>
    </View>
  );

  const getCropColor = (cropType) => {
    const colors = {
      Cacao: COLORS.secondary,
      Café: "#8B4513",
      Aguacate: COLORS.accent,
      Plátano: COLORS.warning,
      Maíz: "#FFD700",
      Arroz: "#F5F5DC",
    };
    return colors[cropType] || COLORS.primary;
  };

  const QuickActions = () => (
    <View style={styles.quickActionsContainer}>
      <Text style={styles.sectionTitle}>Acciones Rápidas</Text>
      <View style={styles.actionsGrid}>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: COLORS.primary }]}
          onPress={() => navigation.navigate("CreateJobOffer")}>
          <Ionicons name="add-circle" size={28} color="#FFFFFF" />
          <Text style={styles.actionButtonText}>Nueva Oferta</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: COLORS.accent }]}
          onPress={() => navigation.navigate("AddTerrain")}>
          <Ionicons name="add" size={28} color="#FFFFFF" />
          <Text style={styles.actionButtonText}>Agregar Finca</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: COLORS.primary }]}
          onPress={() => navigation.navigate("WorkerList")}>
          <Ionicons name="search" size={28} color="#FFFFFF" />
          <Text style={styles.actionButtonText}>Buscar Trabajadores</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: COLORS.primary }]}
          onPress={() => navigation.navigate("JobApplications")}>
          <Ionicons name="mail" size={28} color="#FFFFFF" />
          <Text style={styles.actionButtonText}>Ver Aplicaciones</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // Nuevo componente para el tab de ofertas
  const OffersTab = () => (
    <ScrollView
      style={styles.scrollContainer}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={[COLORS.primary]}
          tintColor={COLORS.primary}
        />
      }
      showsVerticalScrollIndicator={false}>
      {/* Toggle para mis ofertas vs todas las ofertas */}
      <View style={styles.offersToggleContainer}>
        <View style={styles.toggleButtons}>
          <TouchableOpacity
            style={[
              styles.toggleButton,
              showMyOffers && styles.toggleButtonActive,
            ]}
            onPress={() => setShowMyOffers(true)}>
            <Text
              style={[
                styles.toggleButtonText,
                showMyOffers && styles.toggleButtonTextActive,
              ]}>
              Mis Ofertas
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.toggleButton,
              !showMyOffers && styles.toggleButtonActive,
            ]}
            onPress={() => setShowMyOffers(false)}>
            <Text
              style={[
                styles.toggleButtonText,
                !showMyOffers && styles.toggleButtonTextActive,
              ]}>
              Explorar Ofertas
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Filtros */}
      <View style={styles.filtersContainer}>
        <View style={styles.filterRow}>
          <View style={styles.filterItem}>
            <Text style={styles.filterLabel}>Tipo de Cultivo</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.cropTypeFilters}>
                <TouchableOpacity
                  style={[
                    styles.cropTypeFilter,
                    selectedCropType === "" && styles.cropTypeFilterActive,
                  ]}
                  onPress={() => setSelectedCropType("")}>
                  <Text
                    style={[
                      styles.cropTypeFilterText,
                      selectedCropType === "" &&
                        styles.cropTypeFilterTextActive,
                    ]}>
                    Todos
                  </Text>
                </TouchableOpacity>
                {cropTypes.map((cropType) => (
                  <TouchableOpacity
                    key={cropType.id}
                    style={[
                      styles.cropTypeFilter,
                      selectedCropType === cropType.name &&
                        styles.cropTypeFilterActive,
                    ]}
                    onPress={() => setSelectedCropType(cropType.name)}>
                    <Text
                      style={[
                        styles.cropTypeFilterText,
                        selectedCropType === cropType.name &&
                          styles.cropTypeFilterTextActive,
                      ]}>
                      {cropType.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
        </View>

        <View style={styles.searchContainer}>
          <Ionicons
            name="search"
            size={20}
            color={COLORS.textLight}
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar por ciudad o departamento..."
            value={selectedLocation}
            onChangeText={setSelectedLocation}
            placeholderTextColor={COLORS.textLight}
          />
        </View>
      </View>

      {/* Lista de ofertas */}
      <View style={styles.offersListContainer}>
        <Text style={styles.offersCountText}>
          {filteredOffers.length} ofertas encontradas
        </Text>

        {filteredOffers.map((offer) => (
          <TouchableOpacity
            key={offer.id}
            style={styles.exploreOfferCard}
            onPress={() =>
              navigation.navigate("JobOfferDetail", { jobOfferId: offer.id })
            }>
            <View style={styles.exploreOfferHeader}>
              <Text style={styles.exploreOfferTitle}>{offer.title}</Text>
              <View
                style={[
                  styles.exploreStatusBadge,
                  {
                    backgroundColor: getCropColor(
                      offer.cropType?.name || offer.cropType
                    ),
                  },
                ]}>
                <Text style={styles.exploreStatusText}>
                  {offer.cropType?.name || offer.cropType}
                </Text>
              </View>
            </View>

            <Text style={styles.exploreOfferLocation}>
              📍 {offer.displayLocation?.city || offer.city},{" "}
              {offer.displayLocation?.department || offer.state}
            </Text>

            <View style={styles.exploreOfferDetails}>
              <View style={styles.exploreOfferDetailItem}>
                <Ionicons
                  name="calendar-outline"
                  size={16}
                  color={COLORS.textSecondary}
                />
                <Text style={styles.exploreOfferDetailText}>
                  {offer.duration} días
                </Text>
              </View>
              <View style={styles.exploreOfferDetailItem}>
                <Ionicons
                  name="cash-outline"
                  size={16}
                  color={COLORS.textSecondary}
                />
                <Text style={styles.exploreOfferDetailText}>
                  ${offer.salary?.toLocaleString()}/día
                </Text>
              </View>
              {showMyOffers && (
                <View style={styles.exploreOfferDetailItem}>
                  <Ionicons
                    name="people-outline"
                    size={16}
                    color={COLORS.textSecondary}
                  />
                  <Text style={styles.exploreOfferDetailText}>
                    {offer.applicationsCount || 0} aplicaciones
                  </Text>
                </View>
              )}
              {!showMyOffers && (
                <View style={styles.exploreOfferDetailItem}>
                  <Ionicons
                    name="business-outline"
                    size={16}
                    color={COLORS.textSecondary}
                  />
                  <Text style={styles.exploreOfferDetailText}>
                    {offer.employer?.user?.name || "Empleador"}
                  </Text>
                </View>
              )}
            </View>

            {(offer.includesFood || offer.includesLodging) && (
              <View style={styles.exploreOfferBenefits}>
                {offer.includesFood && (
                  <View style={styles.benefitBadge}>
                    <Ionicons
                      name="restaurant"
                      size={12}
                      color={COLORS.success}
                    />
                    <Text style={styles.benefitText}>Comida</Text>
                  </View>
                )}
                {offer.includesLodging && (
                  <View style={styles.benefitBadge}>
                    <Ionicons name="home" size={12} color={COLORS.accent} />
                    <Text style={styles.benefitText}>Hospedaje</Text>
                  </View>
                )}
              </View>
            )}
          </TouchableOpacity>
        ))}

        {filteredOffers.length === 0 && (
          <View style={styles.noOffersContainer}>
            <Ionicons
              name="search-outline"
              size={48}
              color={COLORS.textLight}
            />
            <Text style={styles.noOffersText}>
              {showMyOffers
                ? "No tienes ofertas que coincidan con los filtros"
                : "No se encontraron ofertas con los filtros seleccionados"}
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Cargando dashboard...</Text>
      </View>
    );
  }

  return (
    <ScreenLayout navigation={navigation}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.welcomeText}>
              ¡Hola, {userData?.name || "Productor"}!
            </Text>
            <Text style={styles.roleText}>
              Panel de Control • {userData?.role?.name || "Empleador"}
            </Text>
          </View>
        </View>

        {/* Navegación por tabs */}
        <TabNavigation />

        {/* Contenido según tab activo */}
        {activeTab === "dashboard" ? (
          <ScrollView
            style={styles.scrollContainer}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[COLORS.primary]}
                tintColor={COLORS.primary}
              />
            }
            showsVerticalScrollIndicator={false}>
            <EmployerRating />
            <MainMetrics />
            <AdvancedStats />
            <QuickActions />
          </ScrollView>
        ) : (
          <OffersTab />
        )}
      </View>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAFAFA",
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 20,
    paddingTop: 50,
    backgroundColor: COLORS.background,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 4,
  },
  roleText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: "500",
  },
  profileButton: {
    padding: 4,
  },

  // Navegación por tabs
  tabContainer: {
    flexDirection: "row",
    backgroundColor: COLORS.background,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  tabButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginHorizontal: 4,
    gap: 8,
  },
  tabButtonActive: {
    backgroundColor: COLORS.lightBlue,
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: COLORS.textLight,
  },
  tabButtonTextActive: {
    color: COLORS.primary,
    fontWeight: "600",
  },

  scrollContainer: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 16,
  },

  // Card de calificación compacto
  ratingCardCompact: {
    backgroundColor: COLORS.background,
    margin: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  ratingHeaderCompact: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  ratingInfo: {
    flex: 1,
  },
  ratingTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 6,
  },
  ratingStarsCompact: {
    flexDirection: "row",
    gap: 4,
  },
  ratingBadgeCompact: {
    backgroundColor: COLORS.lightGold,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.warning + "20",
  },
  ratingTextCompact: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.warning,
  },
  ratingSubtextCompact: {
    fontSize: 11,
    color: COLORS.textLight,
    textAlign: "center",
  },

  // Métricas principales
  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 20,
  },
  metricCard: {
    flex: 1,
    minWidth: (width - 48) / 2,
    padding: 16,
    borderRadius: 16,
    alignItems: "center",
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 4,
  },
  metricIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  metricNumber: {
    fontSize: 24,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  metricSubtext: {
    fontSize: 12,
    color: COLORS.textLight,
  },

  // Estadísticas avanzadas
  statsContainer: {
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 12,
  },
  statItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.background,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 12,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 3,
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statContent: {
    flex: 1,
  },
  statValue: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.text,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },

  // Fincas
  farmsContainer: {
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  farmsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  seeAllText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: "600",
  },
  farmCard: {
    width: 240,
    backgroundColor: COLORS.background,
    borderRadius: 16,
    padding: 16,
    marginRight: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  farmHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  farmName: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.text,
    flex: 1,
    marginRight: 8,
  },
  cropBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  cropText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  farmLocation: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 12,
  },
  farmStats: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  farmStatItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  farmStatText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  emptyFarmsContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
    backgroundColor: COLORS.background,
    borderRadius: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 4,
  },
  emptyFarmsText: {
    fontSize: 16,
    color: COLORS.textLight,
    textAlign: "center",
    marginTop: 12,
    marginBottom: 16,
  },
  addFarmButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  addFarmButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },

  // Acciones rápidas
  quickActionsContainer: {
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  actionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  actionButton: {
    flex: 1,
    minWidth: (width - 48) / 2,
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    gap: 8,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#FFFFFF",
    textAlign: "center",
  },

  // Tab de ofertas
  offersToggleContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  toggleButtons: {
    flexDirection: "row",
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    padding: 4,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: "center",
  },
  toggleButtonActive: {
    backgroundColor: COLORS.background,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  toggleButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: COLORS.textLight,
  },
  toggleButtonTextActive: {
    color: COLORS.primary,
    fontWeight: "600",
  },

  // Filtros
  filtersContainer: {
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  filterRow: {
    marginBottom: 12,
  },
  filterItem: {
    marginBottom: 8,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 8,
  },
  cropTypeFilters: {
    flexDirection: "row",
    gap: 8,
  },
  cropTypeFilter: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cropTypeFilterActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  cropTypeFilterText: {
    fontSize: 12,
    fontWeight: "500",
    color: COLORS.textSecondary,
  },
  cropTypeFilterTextActive: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text,
  },

  // Lista de ofertas
  offersListContainer: {
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  offersCountText: {
    fontSize: 14,
    fontWeight: "500",
    color: COLORS.textSecondary,
    marginBottom: 12,
  },
  exploreOfferCard: {
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  exploreOfferHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  exploreOfferTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.text,
    flex: 1,
    marginRight: 8,
  },
  exploreStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  exploreStatusText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  exploreOfferLocation: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 12,
  },
  exploreOfferDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  exploreOfferDetailItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  exploreOfferDetailText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  exploreOfferBenefits: {
    flexDirection: "row",
    gap: 8,
    marginTop: 8,
  },
  benefitBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: COLORS.surface,
    borderRadius: 6,
  },
  benefitText: {
    fontSize: 10,
    color: COLORS.textSecondary,
  },
  noOffersContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  noOffersText: {
    fontSize: 14,
    color: COLORS.textLight,
    textAlign: "center",
    marginTop: 12,
  },
});
