import React, { useState, useEffect } from "react";
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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import ScreenLayoutWorker from "../../components/ScreenLayoutWorker";
import { useAuth } from "../../context/AuthContext";
import { getAvailableJobOffers } from "../../services/jobOffers";
import { createApplication } from "../../services/applicationService";

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
  const { user } = useAuth();

  // Estados para filtros
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [selectedCrop, setSelectedCrop] = useState(null);
  const [salaryRange, setSalaryRange] = useState({ min: "", max: "" });
  const [selectedDuration, setSelectedDuration] = useState(null);
  const [sortBy, setSortBy] = useState("newest"); // newest, salary_high, salary_low, duration

  // Estados para modales
  const [filtersModalVisible, setFiltersModalVisible] = useState(false);
  const [sortModalVisible, setSortModalVisible] = useState(false);

  const defaultCropTypes = [
    { id: 1, name: "Café" },
    { id: 2, name: "Cacao" },
    { id: 3, name: "Aguacate" },
    { id: 4, name: "Plátano" },
    { id: 5, name: "Maíz" },
    { id: 6, name: "Arroz" },
    { id: 7, name: "Banano" },
    { id: 8, name: "Caña de azúcar" },
  ];

  const locations = [
    { id: 1, name: "Bogotá", department: "Cundinamarca" },
    { id: 2, name: "Medellín", department: "Antioquia" },
    { id: 3, name: "Cali", department: "Valle del Cauca" },
    { id: 4, name: "Manizales", department: "Caldas" },
    { id: 5, name: "Pereira", department: "Risaralda" },
    { id: 6, name: "Armenia", department: "Quindío" },
    { id: 7, name: "Fortul", department: "Arauca" },
    { id: 8, name: "Tame", department: "Arauca" },
    { id: 9, name: "Arauquita", department: "Arauca" },
  ];

  const durationOptions = [
    { id: 1, label: "1-7 días", min: 1, max: 7 },
    { id: 2, label: "1-2 semanas", min: 8, max: 14 },
    { id: 3, label: "2-4 semanas", min: 15, max: 30 },
    { id: 4, label: "1-3 meses", min: 31, max: 90 },
    { id: 5, label: "Más de 3 meses", min: 91, max: 365 },
  ];

  const sortOptions = [
    { id: "newest", label: "Más recientes", icon: "time" },
    { id: "salary_high", label: "Salario mayor", icon: "trending-up" },
    { id: "salary_low", label: "Salario menor", icon: "trending-down" },
    { id: "duration", label: "Duración corta", icon: "calendar" },
  ];

  // ✅ FIXED: Cargar ofertas de trabajo
  const loadJobOffers = async () => {
    try {
      const response = await getAvailableJobOffers();
      console.log('Raw API response:', response);
      
      // ✅ Handle both response formats: direct array or object with jobOffers
      let jobsData = [];
      if (Array.isArray(response)) {
        jobsData = response;
      } else if (response?.jobOffers && Array.isArray(response.jobOffers)) {
        jobsData = response.jobOffers;
      } else {
        console.warn('Unexpected response format:', response);
        jobsData = [];
      }
      
      console.log('Extracted jobs data:', jobsData.length, 'jobs found');
      
      setJobOffers(jobsData);
      setFilteredJobs(jobsData);
    } catch (error) {
      console.error("Error cargando ofertas:", error);
      Alert.alert("Error", "No se pudieron cargar las ofertas de trabajo");
      setJobOffers([]);
      setFilteredJobs([]);
    } finally {
      setLoading(false);
    }
  };

  // Aplicar filtros y búsqueda
  const applyFiltersAndSearch = () => {
    let filtered = [...jobOffers];

    // Filtro por término de búsqueda
    if (searchTerm.trim()) {
      filtered = filtered.filter(
        (job) =>
          job.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          job.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          job.employer?.user?.name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // ✅ FIXED: Filtro por ubicación usando campos correctos
    if (selectedLocation) {
      filtered = filtered.filter(
        (job) =>
          job.city?.toLowerCase() === selectedLocation.name.toLowerCase() ||
          job.displayLocation?.city?.toLowerCase() === selectedLocation.name.toLowerCase()
      );
    }

    // Filtro por tipo de cultivo
    if (selectedCrop) {
      filtered = filtered.filter(
        (job) => job.cropType?.name === selectedCrop.name
      );
    }

    // Filtro por rango salarial
    if (salaryRange.min || salaryRange.max) {
      filtered = filtered.filter((job) => {
        const salary = job.salary || 0;
        const min = salaryRange.min ? parseInt(salaryRange.min) : 0;
        const max = salaryRange.max ? parseInt(salaryRange.max) : Infinity;
        return salary >= min && salary <= max;
      });
    }

    // Filtro por duración
    if (selectedDuration) {
      filtered = filtered.filter(
        (job) => {
          const duration = parseInt(job.duration) || 0;
          return duration >= selectedDuration.min && duration <= selectedDuration.max;
        }
      );
    }

    // Ordenamiento
    switch (sortBy) {
      case "salary_high":
        filtered.sort((a, b) => (b.salary || 0) - (a.salary || 0));
        break;
      case "salary_low":
        filtered.sort((a, b) => (a.salary || 0) - (b.salary || 0));
        break;
      case "duration":
        filtered.sort((a, b) => (parseInt(a.duration) || 0) - (parseInt(b.duration) || 0));
        break;
      case "newest":
      default:
        filtered.sort(
          (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
        );
        break;
    }

    setFilteredJobs(filtered);
  };

  // Postularse a un trabajo
  const applyToJob = async (jobOfferId) => {
    try {
      if (appliedJobs.has(jobOfferId)) {
        Alert.alert("Información", "Ya te has postulado a esta oferta");
        return;
      }

      await createApplication(jobOfferId, { userId: user.id });
      setAppliedJobs(new Set([...appliedJobs, jobOfferId]));
      Alert.alert("¡Éxito!", "Te has postulado exitosamente a esta oferta");
    } catch (error) {
      Alert.alert("Error", "No se pudo enviar la postulación");
      console.error("Error aplicando a trabajo:", error);
    }
  };

  const clearAllFilters = () => {
    setSearchTerm("");
    setSelectedLocation(null);
    setSelectedCrop(null);
    setSalaryRange({ min: "", max: "" });
    setSelectedDuration(null);
    setSortBy("newest");
  };

  // Refrescar datos
  const onRefresh = async () => {
    setRefreshing(true);
    await loadJobOffers();
    setRefreshing(false);
  };

  // Efectos
  useEffect(() => {
    loadJobOffers();
  }, []);

  useEffect(() => {
    applyFiltersAndSearch();
  }, [
    jobOffers,
    searchTerm,
    selectedLocation,
    selectedCrop,
    salaryRange,
    selectedDuration,
    sortBy,
  ]);

  // Componente de barra de búsqueda
  const SearchBar = () => (
    <View style={styles.searchContainer}>
      <Ionicons name="search" size={20} color={COLORS.textLight} />
      <TextInput
        style={styles.searchInput}
        placeholder="Buscar trabajos, empleadores..."
        value={searchTerm}
        onChangeText={setSearchTerm}
        placeholderTextColor={COLORS.textLight}
      />
      {searchTerm ? (
        <TouchableOpacity onPress={() => setSearchTerm("")}>
          <Ionicons name="close-circle" size={20} color={COLORS.textLight} />
        </TouchableOpacity>
      ) : null}
    </View>
  );

  // Componente de filtros rápidos
  const QuickFilters = () => (
    <View style={styles.quickFiltersContainer}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <TouchableOpacity
          style={styles.filterChip}
          onPress={() => setFiltersModalVisible(true)}>
          <Ionicons name="options" size={16} color={COLORS.primary} />
          <Text style={styles.filterChipText}>Filtros</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.filterChip}
          onPress={() => setSortModalVisible(true)}>
          <Ionicons name="swap-vertical" size={16} color={COLORS.primary} />
          <Text style={styles.filterChipText}>
            {sortOptions.find((opt) => opt.id === sortBy)?.label}
          </Text>
        </TouchableOpacity>

        {selectedLocation && (
          <TouchableOpacity
            style={[styles.filterChip, styles.activeFilterChip]}
            onPress={() => setSelectedLocation(null)}>
            <Text style={styles.activeFilterChipText}>
              {selectedLocation.name}
            </Text>
            <Ionicons name="close" size={16} color="#FFFFFF" />
          </TouchableOpacity>
        )}

        {selectedCrop && (
          <TouchableOpacity
            style={[styles.filterChip, styles.activeFilterChip]}
            onPress={() => setSelectedCrop(null)}>
            <Text style={styles.activeFilterChipText}>{selectedCrop.name}</Text>
            <Ionicons name="close" size={16} color="#FFFFFF" />
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );

  // ✅ FIXED: Componente de tarjeta de trabajo
  const JobCard = ({ item }) => {
    const isApplied = appliedJobs.has(item.id);

    return (
      <TouchableOpacity
        style={styles.jobCard}
        onPress={() =>
          navigation.navigate("JobOfferDetail", { jobOfferId: item.id })
        }>
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
              {item.displayLocation?.city || item.city || "Ciudad"}, {item.displayLocation?.department || item.state || "Departamento"}
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
            Publicado hace{" "}
            {Math.max(1, Math.floor(
              (new Date().getTime() - new Date(item.createdAt || new Date()).getTime()) / (1000 * 60 * 60 * 24)
            ))}{" "}
            días
          </Text>
          <TouchableOpacity
            style={[
              styles.applyButton,
              isApplied && styles.appliedButton,
            ]}
            onPress={() => applyToJob(item.id)}
            disabled={isApplied}>
            <Text
              style={[
                styles.applyButtonText,
                isApplied && styles.appliedButtonText,
              ]}>
              {isApplied ? "Postulado" : "Postularme"}
            </Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  // Modal de filtros
  const FiltersModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={filtersModalVisible}
      onRequestClose={() => setFiltersModalVisible(false)}>
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Filtros</Text>
            <TouchableOpacity onPress={() => setFiltersModalVisible(false)}>
              <Ionicons name="close" size={24} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody}>
            {/* Filtro por ubicación */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Ubicación</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {locations.map((location) => (
                  <TouchableOpacity
                    key={location.id}
                    style={[
                      styles.filterOption,
                      selectedLocation?.id === location.id &&
                        styles.selectedFilterOption,
                    ]}
                    onPress={() =>
                      setSelectedLocation(
                        selectedLocation?.id === location.id ? null : location
                      )
                    }>
                    <Text
                      style={[
                        styles.filterOptionText,
                        selectedLocation?.id === location.id &&
                          styles.selectedFilterOptionText,
                      ]}>
                      {location.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Filtro por cultivo */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Tipo de Cultivo</Text>
              <View style={styles.filterOptionsGrid}>
                {defaultCropTypes.map((crop) => (
                  <TouchableOpacity
                    key={crop.id}
                    style={[
                      styles.filterOption,
                      selectedCrop?.id === crop.id &&
                        styles.selectedFilterOption,
                    ]}
                    onPress={() =>
                      setSelectedCrop(
                        selectedCrop?.id === crop.id ? null : crop
                      )
                    }>
                    <Text
                      style={[
                        styles.filterOptionText,
                        selectedCrop?.id === crop.id &&
                          styles.selectedFilterOptionText,
                      ]}>
                      {crop.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Filtro por salario */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Rango Salarial (por día)</Text>
              <View style={styles.salaryRangeContainer}>
                <TextInput
                  style={styles.salaryInput}
                  placeholder="Mín"
                  value={salaryRange.min}
                  onChangeText={(text) =>
                    setSalaryRange({ ...salaryRange, min: text })
                  }
                  keyboardType="numeric"
                  placeholderTextColor={COLORS.textLight}
                />
                <Text style={styles.salaryRangeSeparator}>-</Text>
                <TextInput
                  style={styles.salaryInput}
                  placeholder="Máx"
                  value={salaryRange.max}
                  onChangeText={(text) =>
                    setSalaryRange({ ...salaryRange, max: text })
                  }
                  keyboardType="numeric"
                  placeholderTextColor={COLORS.textLight}
                />
              </View>
            </View>

            {/* Filtro por duración */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Duración del Trabajo</Text>
              <View style={styles.filterOptionsGrid}>
                {durationOptions.map((duration) => (
                  <TouchableOpacity
                    key={duration.id}
                    style={[
                      styles.filterOption,
                      selectedDuration?.id === duration.id &&
                        styles.selectedFilterOption,
                    ]}
                    onPress={() =>
                      setSelectedDuration(
                        selectedDuration?.id === duration.id ? null : duration
                      )
                    }>
                    <Text
                      style={[
                        styles.filterOptionText,
                        selectedDuration?.id === duration.id &&
                          styles.selectedFilterOptionText,
                      ]}>
                      {duration.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.clearFiltersButton}
              onPress={clearAllFilters}>
              <Text style={styles.clearFiltersButtonText}>Limpiar Filtros</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.applyFiltersButton}
              onPress={() => setFiltersModalVisible(false)}>
              <Text style={styles.applyFiltersButtonText}>Aplicar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  // Modal de ordenamiento
  const SortModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={sortModalVisible}
      onRequestClose={() => setSortModalVisible(false)}>
      <View style={styles.modalContainer}>
        <View style={styles.sortModalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Ordenar por</Text>
            <TouchableOpacity onPress={() => setSortModalVisible(false)}>
              <Ionicons name="close" size={24} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          {sortOptions.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={[
                styles.sortOption,
                sortBy === option.id && styles.selectedSortOption,
              ]}
              onPress={() => {
                setSortBy(option.id);
                setSortModalVisible(false);
              }}>
              <Ionicons
                name={option.icon as keyof typeof Ionicons.glyphMap}
                size={20}
                color={
                  sortBy === option.id ? COLORS.primary : COLORS.textSecondary
                }
              />
              <Text
                style={[
                  styles.sortOptionText,
                  sortBy === option.id && styles.selectedSortOptionText,
                ]}>
                {option.label}
              </Text>
              {sortBy === option.id && (
                <Ionicons name="checkmark" size={20} color={COLORS.primary} />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </Modal>
  );

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
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Buscar Trabajos</Text>
          <Text style={styles.headerSubtitle}>
            {filteredJobs.length} ofertas disponibles
          </Text>
        </View>

        {/* Barra de búsqueda */}
        <SearchBar />

        {/* Filtros rápidos */}
        <QuickFilters />

        {/* Lista de trabajos */}
        <FlatList
          data={filteredJobs}
          renderItem={({ item }) => <JobCard item={item} />}
          keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[COLORS.primary]}
            />
          }
          showsVerticalScrollIndicator={false}
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
                <Text style={styles.clearFiltersButtonText}>
                  Limpiar Filtros
                </Text>
              </TouchableOpacity>
            </View>
          )}
        />

        {/* Modales */}
        <FiltersModal />
        <SortModal />
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
  quickFiltersContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    gap: 6,
  },
  activeFilterChip: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterChipText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: "500",
  },
  activeFilterChipText: {
    color: "#FFFFFF",
    fontWeight: "500",
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
  applyButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  appliedButtonText: {
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
  modalContainer: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "80%",
  },
  sortModalContent: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 20,
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
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.text,
  },
  modalBody: {
    maxHeight: 400,
  },
  filterSection: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 12,
  },
  filterOptionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  filterOption: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
  },
  selectedFilterOption: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterOptionText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  selectedFilterOptionText: {
    color: "#FFFFFF",
    fontWeight: "500",
  },
  salaryRangeContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  salaryInput: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: COLORS.text,
  },
  salaryRangeSeparator: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  modalFooter: {
    flexDirection: "row",
    padding: 20,
    gap: 12,
  },
  clearFiltersButton: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  clearFiltersButtonText: {
    color: COLORS.textSecondary,
    fontSize: 16,
    fontWeight: "500",
  },
  applyFiltersButton: {
    flex: 1,
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  applyFiltersButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  sortOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 12,
  },
  selectedSortOption: {
    backgroundColor: `${COLORS.primary}10`,
  },
  sortOptionText: {
    flex: 1,
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  selectedSortOptionText: {
    color: COLORS.primary,
    fontWeight: "500",
  },
});