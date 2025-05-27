import React, { useState, useEffect, useRef } from "react";
import {
  Text,
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Platform,
  ActivityIndicator,
  Alert,
  TextInput,
  Modal,
  KeyboardAvoidingView,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import { useAuth } from "../../context/AuthContext";
import { getFarmById, updateFarm } from "../../services/farmService";
import {
  getCountries,
  getDepartmentsByCountry,
  getMunicipalitiesByDepartment,
  getVillagesByMunicipality,
} from "../../services/locationService";
import ScreenLayout from "../../components/ScreenLayout";

interface EditTerrainProps {
  navigation: any;
  route: any;
}

// Paleta de colores consistente
const COLORS = {
  primary: "#2C5F7B",
  primaryLight: "#E8F1F5",
  primaryDark: "#1A3B4A",
  secondary: "#C49B61",
  secondaryLight: "#F7F2E8",
  tertiary: "#0F52A0",
  tertiaryLight: "#E6EDF8",
  success: "#22C55E",
  successLight: "#DCFCE7",
  warning: "#F59E0B",
  warningLight: "#FEF3C7",
  error: "#E35353",
  errorLight: "#FEF2F2",
  text: {
    primary: "#1F2937",
    secondary: "#6B7280",
    tertiary: "#9CA3AF",
    white: "#FFFFFF",
  },
  background: {
    primary: "#F9FAFB",
    secondary: "#FFFFFF",
    tertiary: "#F3F4F6",
  },
  border: {
    light: "#E5E7EB",
    medium: "#D1D5DB",
    dark: "#9CA3AF",
  },
};

interface LocationOption {
  id: string;
  name: string;
  value: string;
  label: string;
}

const EditTerrain: React.FC<EditTerrainProps> = ({ navigation, route }) => {
  const { farmId } = route.params;
  const { user } = useAuth();

  // Estados principales
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [farm, setFarm] = useState<any>(null);
  const [isEditingLocation, setIsEditingLocation] = useState(false);
  const [loadingLocationData, setLoadingLocationData] = useState(false);

  // Estados del formulario
  const [formData, setFormData] = useState({
    name: "",
    size: "",
    plantCount: "",
    specificLocation: "",
    status: true,
  });

  // Estados de ubicación
  const [countries, setCountries] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [municipalities, setMunicipalities] = useState<any[]>([]);
  const [villages, setVillages] = useState<any[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<any>(null);
  const [selectedDepartment, setSelectedDepartment] = useState<any>(null);
  const [selectedMunicipality, setSelectedMunicipality] = useState<any>(null);
  const [selectedVillage, setSelectedVillage] = useState<any>(null);

  // Estados de modales
  const [showCountryModal, setShowCountryModal] = useState(false);
  const [showDepartmentModal, setShowDepartmentModal] = useState(false);
  const [showMunicipalityModal, setShowMunicipalityModal] = useState(false);
  const [showVillageModal, setShowVillageModal] = useState(false);
  const [showConfirmExit, setShowConfirmExit] = useState(false);

  // Estados de validación
  const [errors, setErrors] = useState<any>({});
  const [hasChanges, setHasChanges] = useState(false);

  // Animaciones
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    const loadData = async () => {
      // Primero cargar países y esperar a que se actualice el estado
      const countriesResponse = await getCountries();
      let countriesData = [];
      if (countriesResponse?.data) {
        countriesData = countriesResponse.data;
      } else if (countriesResponse && Array.isArray(countriesResponse)) {
        countriesData = countriesResponse;
      }
      
      setCountries(countriesData);
      
      // Luego cargar la finca con los países ya disponibles
      await loadFarmData(countriesData);
    };
    loadData();

    // Animación de entrada
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const loadFarmData = async (countriesData?: any[]) => {
    try {
      setLoading(true);
      const response = await getFarmById(farmId);
      let farmData;

      if (response?.data) {
        farmData = response.data;
      } else if (response && typeof response === "object" && response.id) {
        farmData = response;
      } else {
        throw new Error("Formato de respuesta inválido");
      }

      console.log("Farm data loaded:", farmData);
      setFarm(farmData);
      
      setFormData({
        name: farmData.name || "",
        size: farmData.size?.toString() || "",
        plantCount: farmData.plantCount?.toString() || "",
        specificLocation: farmData.specificLocation || "",
        status: farmData.status !== false,
      });

      // Cargar ubicación actual si existe, pasando los países como parámetro
      if (farmData.countryId) {
        await loadExistingLocation(farmData, countriesData || countries);
      }
    } catch (error) {
      console.error("Error loading farm:", error);
      Alert.alert("Error", "No se pudo cargar la información de la finca", [
        { text: "Volver", onPress: () => navigation.goBack() },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prevData) => ({
      ...prevData,
      [field]: value,
    }));
    setHasChanges(true);
  };

  // FUNCIÓN FALTANTE: handleLocationSelect
  const handleLocationSelect = async (type: string, item: any) => {
    setHasChanges(true);
    
    switch (type) {
      case "country":
        setSelectedCountry(item);
        // Limpiar selecciones dependientes
        setSelectedDepartment(null);
        setSelectedMunicipality(null);
        setSelectedVillage(null);
        setDepartments([]);
        setMunicipalities([]);
        setVillages([]);
        setShowCountryModal(false);
        
        // Cargar departamentos del país seleccionado
        if (item.id) {
          await loadDepartments(item.id);
        }
        break;
        
      case "department":
        setSelectedDepartment(item);
        // Limpiar selecciones dependientes
        setSelectedMunicipality(null);
        setSelectedVillage(null);
        setMunicipalities([]);
        setVillages([]);
        setShowDepartmentModal(false);
        
        // Cargar municipios del departamento seleccionado
        if (item.id) {
          await loadMunicipalities(item.id);
        }
        break;
        
      case "municipality":
        setSelectedMunicipality(item);
        // Limpiar selecciones dependientes
        setSelectedVillage(null);
        setVillages([]);
        setShowMunicipalityModal(false);
        
        // Cargar veredas del municipio seleccionado
        if (item.id) {
          await loadVillages(item.id);
        }
        break;
        
      case "village":
        setSelectedVillage(item);
        setShowVillageModal(false);
        break;
    }
  };

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    setErrors({});

    try {
      // Validación del formulario
      const newErrors: any = {};
      if (!formData.name.trim()) {
        newErrors.name = "El nombre de la finca es obligatorio.";
      }
      if (!formData.size || isNaN(Number(formData.size)) || Number(formData.size) <= 0) {
        newErrors.size = "El tamaño debe ser un número positivo.";
      }
      if (!formData.plantCount || isNaN(Number(formData.plantCount)) || Number(formData.plantCount) <= 0) {
        newErrors.plantCount = "El número de plantas debe ser un número positivo.";
      }
      if (!selectedCountry) {
        newErrors.location = "Debe seleccionar un país.";
      }

      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        setSaving(false);
        return;
      }

      // Preparar datos para guardar
      const updatedFarmData = {
        ...formData,
        countryId: selectedCountry?.id,
        departmentId: selectedDepartment?.id,
        municipalityId: selectedMunicipality?.id,
        villageId: selectedVillage?.id,
        specificLocation: formData.specificLocation.trim(),
      };

      // Actualizar finca
      const response = await updateFarm(farmId, updatedFarmData);
      console.log("Farm updated response:", response);

      Alert.alert("Éxito", "Finca actualizada correctamente", [
        { text: "Aceptar", onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      console.error("Error updating farm:", error);
      Alert.alert("Error", "No se pudo actualizar la finca. Inténtalo de nuevo.");
    } finally {
      setSaving(false);
    }
  };

  const loadExistingLocation = async (farmData: any, countriesData: any[]) => {
    try {
      console.log("Loading existing location for farm:", farmData);
      
      // Extraer IDs de ubicación
      const countryId = farmData.countryId || farmData.country?.id;
      const departmentId = farmData.departmentId || farmData.department?.id;
      const municipalityId = farmData.cityId || farmData.municipalityId || farmData.city?.id || farmData.municipality?.id;
      const villageId = farmData.villageId || farmData.village?.id;

      console.log("Extracted location IDs:", {
        countryId,
        departmentId,
        municipalityId,
        villageId,
      });

      if (!countryId) return;

      // Buscar país seleccionado en los datos pasados como parámetro
      const countryOption = countriesData.find((c) => c.id === countryId);
      if (!countryOption) {
        console.log("Country not found in:", countriesData);
        return;
      }

      setSelectedCountry(countryOption);
      console.log("Selected country:", countryOption);

      if (departmentId) {
        // Cargar departamentos
        const deptResponse = await getDepartmentsByCountry(countryId);
        let departmentsData = [];
        if (deptResponse?.data) {
          departmentsData = deptResponse.data;
        } else if (Array.isArray(deptResponse)) {
          departmentsData = deptResponse;
        }
        setDepartments(departmentsData);

        const departmentOption = departmentsData.find((d) => d.id === departmentId);
        if (departmentOption) {
          setSelectedDepartment(departmentOption);
          console.log("Selected department:", departmentOption);

          if (municipalityId) {
            // Cargar municipios
            const muniResponse = await getMunicipalitiesByDepartment(departmentId);
            let municipalitiesData = [];
            if (muniResponse?.data) {
              municipalitiesData = muniResponse.data;
            } else if (Array.isArray(muniResponse)) {
              municipalitiesData = muniResponse;
            }
            setMunicipalities(municipalitiesData);

            const municipalityOption = municipalitiesData.find((m) => m.id === municipalityId);
            if (municipalityOption) {
              setSelectedMunicipality(municipalityOption);
              console.log("Selected municipality:", municipalityOption);

              if (villageId) {
                // Cargar veredas
                const villageResponse = await getVillagesByMunicipality(municipalityId);
                let villagesData = [];
                if (villageResponse?.data) {
                  villagesData = villageResponse.data;
                } else if (Array.isArray(villageResponse)) {
                  villagesData = villageResponse;
                }
                setVillages(villagesData);

                const villageOption = villagesData.find((v) => v.id === villageId);
                if (villageOption) {
                  setSelectedVillage(villageOption);
                  console.log("Selected village:", villageOption);
                }
              }
            }
          }
        }
      }
    } catch (error) {
      console.error("Error loading existing location:", error);
    }
  };

  const handleCancel = () => {
    if (hasChanges) {
      setShowConfirmExit(true);
    } else {
      navigation.goBack();
    }
  };

  const loadCountries = async () => {
    try {
      const response = await getCountries();
      console.log("Countries API response:", response);
      
      let countriesData = [];
      if (response?.data) {
        countriesData = response.data;
      } else if (response && Array.isArray(response)) {
        countriesData = response;
      }
      
      setCountries(countriesData);
      return countriesData;
    } catch (error) {
      console.warn("Error loading countries:", error);
      return [];
    }
  };

  const loadDepartments = async (countryId: string) => {
    try {
      setLoadingLocationData(true);
      console.log("getDepartmentsByCountry called with:", countryId);
      console.log("Making API request to: /locations/department-states/" + countryId);
      
      const response = await getDepartmentsByCountry(countryId);
      console.log("Departments API response data:", response);
      
      let departmentsData = [];
      if (response?.data) {
        departmentsData = response.data;
      } else if (Array.isArray(response)) {
        departmentsData = response;
      }
      
      setDepartments(departmentsData);
    } catch (error) {
      console.warn("Error loading departments:", error);
    } finally {
      setLoadingLocationData(false);
    }
  };

  const loadMunicipalities = async (departmentId: string) => {
    try {
      setLoadingLocationData(true);
      const response = await getMunicipalitiesByDepartment(departmentId);
      let municipalitiesData = [];
      if (response?.data) {
        municipalitiesData = response.data;
      } else if (Array.isArray(response)) {
        municipalitiesData = response;
      }
      setMunicipalities(municipalitiesData);
    } catch (error) {
      console.warn("Error loading municipalities:", error);
    } finally {
      setLoadingLocationData(false);
    }
  };

  const loadVillages = async (municipalityId: string) => {
    try {
      setLoadingLocationData(true);
      const response = await getVillagesByMunicipality(municipalityId);
      let villagesData = [];
      if (response?.data) {
        villagesData = response.data;
      } else if (Array.isArray(response)) {
        villagesData = response;
      }
      setVillages(villagesData);
    } catch (error) {
      console.warn("Error loading villages:", error);
    } finally {
      setLoadingLocationData(false);
    }
  };

  const LocationModal = ({
    visible,
    onClose,
    title,
    data,
    onSelect,
    loading,
  }: {
    visible: boolean;
    onClose: () => void;
    title: string;
    data: any[];
    onSelect: (item: any) => void;
    loading?: boolean;
  }) => (
    <Modal
      animationType="slide"
      transparent
      visible={visible}
      onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.locationModalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{title}</Text>
            <TouchableOpacity onPress={onClose} style={styles.modalCloseButton}>
              <Icon name="close" size={20} color={COLORS.text.secondary} />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalList} showsVerticalScrollIndicator={false}>
            {loading ? (
              <View style={styles.loadingModalState}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={styles.loadingModalText}>Cargando opciones...</Text>
              </View>
            ) : data && data.length > 0 ? (
              data.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.modalItem}
                  onPress={() => onSelect(item)}
                  activeOpacity={0.7}>
                  <Text style={styles.modalItemText}>{item.name}</Text>
                  <Icon
                    name="chevron-right"
                    size={20}
                    color={COLORS.text.tertiary}
                  />
                </TouchableOpacity>
              ))
            ) : (
              <View style={styles.emptyState}>
                <Icon name="info" size={48} color={COLORS.text.tertiary} />
                <Text style={styles.emptyStateText}>No hay opciones disponibles</Text>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  const ConfirmExitModal = () => (
    <Modal
      animationType="fade"
      transparent
      visible={showConfirmExit}
      onRequestClose={() => setShowConfirmExit(false)}>
      <View style={styles.modalOverlay}>
        <View style={styles.confirmModalContent}>
          <View style={styles.confirmModalHeader}>
            <Icon name="warning" size={32} color={COLORS.warning} />
            <Text style={styles.confirmModalTitle}>¿Descartar cambios?</Text>
          </View>
          <Text style={styles.confirmModalText}>
            Tienes cambios sin guardar. ¿Estás seguro de que deseas salir sin guardar?
          </Text>
          <View style={styles.confirmModalButtons}>
            <TouchableOpacity
              style={[styles.confirmButton, styles.cancelButton]}
              onPress={() => setShowConfirmExit(false)}>
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.confirmButton, styles.discardButton]}
              onPress={() => {
                setShowConfirmExit(false);
                navigation.goBack();
              }}>
              <Text style={styles.discardButtonText}>Descartar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  if (loading) {
    return (
      <ScreenLayout navigation={navigation}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Cargando información...</Text>
        </View>
      </ScreenLayout>
    );
  }

  return (
    <ScreenLayout navigation={navigation}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleCancel}>
            <Icon name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>Editar Finca</Text>
            <Text style={styles.headerSubtitle}>{farm?.name}</Text>
          </View>
          <TouchableOpacity
            style={styles.saveHeaderButton}
            onPress={handleSave}
            disabled={saving}>
            {saving ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Icon name="check" size={24} color="#fff" />
            )}
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}>
          <Animated.View
            style={[
              styles.content,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}>

            {/* NUEVA SECCIÓN: Tipos de Cultivo y Fases */}
            {farm?.cropTypesInfo && farm.cropTypesInfo.length > 0 && (
              <View style={styles.card}>
                <View style={styles.sectionHeader}>
                  <Icon name="eco" size={24} color={COLORS.success} />
                  <Text style={styles.sectionTitle}>Cultivos y Fases</Text>
                </View>
                
                {/* Tipos de Cultivo */}
                <View style={styles.subsection}>
                  <Text style={styles.subsectionTitle}>Tipos de Cultivo</Text>
                  {farm.cropTypesInfo.map((cropType: any, index: number) => (
                    <View key={cropType.id || index} style={styles.infoItem}>
                      <Icon name="grass" size={20} color={COLORS.success} />
                      <Text style={styles.infoText}>{cropType.name}</Text>
                    </View>
                  ))}
                </View>

                {/* Fases Activas */}
                {farm?.activePhasesInfo && farm.activePhasesInfo.length > 0 && (
                  <View style={styles.subsection}>
                    <Text style={styles.subsectionTitle}>Fases Activas</Text>
                    {farm.activePhasesInfo.map((phase: any, index: number) => (
                      <View key={phase.id || index} style={styles.infoItem}>
                        <Icon name="schedule" size={20} color={COLORS.tertiary} />
                        <Text style={styles.infoText}>{phase.name}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* Fase Principal */}
                {farm?.primaryPhaseInfo && (
                  <View style={styles.subsection}>
                    <Text style={styles.subsectionTitle}>Fase Principal</Text>
                    <View style={styles.primaryPhaseCard}>
                      <Icon name="star" size={20} color={COLORS.warning} />
                      <Text style={styles.primaryPhaseText}>{farm.primaryPhaseInfo.name}</Text>
                    </View>
                  </View>
                )}
              </View>
            )}

            {/* Información básica */}
            <View style={styles.card}>
              <View style={styles.sectionHeader}>
                <Icon name="info" size={24} color={COLORS.primary} />
                <Text style={styles.sectionTitle}>Información Básica</Text>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Nombre de la finca *</Text>
                <TextInput
                  style={[styles.textInput, errors.name && styles.inputError]}
                  value={formData.name}
                  onChangeText={(value) => handleInputChange("name", value)}
                  placeholder="Ingrese el nombre de la finca"
                  placeholderTextColor={COLORS.text.tertiary}
                />
                {errors.name && (
                  <Text style={styles.errorText}>{errors.name}</Text>
                )}
              </View>

              <View style={styles.inputRow}>
                <View style={[styles.inputGroup, styles.halfWidth]}>
                  <Text style={styles.inputLabel}>Tamaño (hectáreas) *</Text>
                  <TextInput
                    style={[styles.textInput, errors.size && styles.inputError]}
                    value={formData.size}
                    onChangeText={(value) => handleInputChange("size", value)}
                    placeholder="0"
                    keyboardType="numeric"
                    placeholderTextColor={COLORS.text.tertiary}
                  />
                  {errors.size && (
                    <Text style={styles.errorText}>{errors.size}</Text>
                  )}
                </View>

                <View style={[styles.inputGroup, styles.halfWidth]}>
                  <Text style={styles.inputLabel}>Número de plantas *</Text>
                  <TextInput
                    style={[
                      styles.textInput,
                      errors.plantCount && styles.inputError,
                    ]}
                    value={formData.plantCount}
                    onChangeText={(value) =>
                      handleInputChange("plantCount", value)
                    }
                    placeholder="0"
                    keyboardType="numeric"
                    placeholderTextColor={COLORS.text.tertiary}
                  />
                  {errors.plantCount && (
                    <Text style={styles.errorText}>{errors.plantCount}</Text>
                  )}
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Ubicación específica (opcional)</Text>
                <TextInput
                  style={styles.textInput}
                  value={formData.specificLocation}
                  onChangeText={(value) => handleInputChange("specificLocation", value)}
                  placeholder="Descripción adicional de la ubicación"
                  placeholderTextColor={COLORS.text.tertiary}
                  multiline
                  numberOfLines={3}
                />
              </View>
            </View>

            {/* Ubicación geográfica */}
            <View style={styles.card}>
              <View style={styles.sectionHeader}>
                <Icon name="location-on" size={24} color={COLORS.primary} />
                <Text style={styles.sectionTitle}>Ubicación Geográfica</Text>
                {!isEditingLocation && (
                  <TouchableOpacity
                    style={styles.editButton}
                    onPress={() => setIsEditingLocation(true)}>
                    <Icon name="edit" size={18} color={COLORS.primary} />
                  </TouchableOpacity>
                )}
              </View>

              {errors.location && (
                <Text style={styles.errorText}>{errors.location}</Text>
              )}

              {!isEditingLocation ? (
                // Vista de solo lectura
                <View style={styles.locationView}>
                  <View style={styles.locationItem}>
                    <Icon name="public" size={20} color={COLORS.text.secondary} />
                    <Text style={styles.locationText}>
                      País: {selectedCountry?.name || "No especificado"}
                    </Text>
                  </View>
                  {selectedDepartment && (
                    <View style={styles.locationItem}>
                      <Icon name="map" size={20} color={COLORS.text.secondary} />
                      <Text style={styles.locationText}>
                        Departamento: {selectedDepartment.name}
                      </Text>
                    </View>
                  )}
                  {selectedMunicipality && (
                    <View style={styles.locationItem}>
                      <Icon name="location-city" size={20} color={COLORS.text.secondary} />
                      <Text style={styles.locationText}>
                        Municipio: {selectedMunicipality.name}
                      </Text>
                    </View>
                  )}
                  {selectedVillage && (
                    <View style={styles.locationItem}>
                      <Icon name="home" size={20} color={COLORS.text.secondary} />
                      <Text style={styles.locationText}>
                        Vereda: {selectedVillage.name}
                      </Text>
                    </View>
                  )}
                </View>
              ) : (
                // Vista de edición
                <>
                  <TouchableOpacity
                    style={styles.selectButton}
                    onPress={() => setShowCountryModal(true)}>
                    <View style={styles.selectButtonContent}>
                      <Icon name="public" size={20} color={COLORS.text.secondary} />
                      <View style={styles.selectButtonText}>
                        <Text style={styles.selectLabel}>País *</Text>
                        <Text style={styles.selectValue}>
                          {selectedCountry?.name || "Seleccionar país"}
                        </Text>
                      </View>
                    </View>
                    <Icon
                      name="chevron-right"
                      size={20}
                      color={COLORS.text.tertiary}
                    />
                  </TouchableOpacity>

                  {selectedCountry && (
                    <TouchableOpacity
                      style={styles.selectButton}
                      onPress={() => setShowDepartmentModal(true)}>
                      <View style={styles.selectButtonContent}>
                        <Icon name="map" size={20} color={COLORS.text.secondary} />
                        <View style={styles.selectButtonText}>
                          <Text style={styles.selectLabel}>Departamento</Text>
                          <Text style={styles.selectValue}>
                            {selectedDepartment?.name || "Seleccionar departamento"}
                          </Text>
                        </View>
                      </View>
                      <Icon
                        name="chevron-right"
                        size={20}
                        color={COLORS.text.tertiary}
                      />
                    </TouchableOpacity>
                  )}

                  {selectedDepartment && (
                    <TouchableOpacity
                      style={styles.selectButton}
                      onPress={() => setShowMunicipalityModal(true)}>
                      <View style={styles.selectButtonContent}>
                        <Icon
                          name="location-city"
                          size={20}
                          color={COLORS.text.secondary}
                        />
                        <View style={styles.selectButtonText}>
                          <Text style={styles.selectLabel}>Municipio</Text>
                          <Text style={styles.selectValue}>
                            {selectedMunicipality?.name || "Seleccionar municipio"}
                          </Text>
                        </View>
                      </View>
                      <Icon
                        name="chevron-right"
                        size={20}
                        color={COLORS.text.tertiary}
                      />
                    </TouchableOpacity>
                  )}

                  {selectedMunicipality && (
                    <TouchableOpacity
                      style={styles.selectButton}
                      onPress={() => setShowVillageModal(true)}>
                      <View style={styles.selectButtonContent}>
                        <Icon name="home" size={20} color={COLORS.text.secondary} />
                        <View style={styles.selectButtonText}>
                          <Text style={styles.selectLabel}>Vereda (opcional)</Text>
                          <Text style={styles.selectValue}>
                            {selectedVillage?.name || "Seleccionar vereda"}
                          </Text>
                        </View>
                      </View>
                      <Icon
                        name="chevron-right"
                        size={20}
                        color={COLORS.text.tertiary}
                      />
                    </TouchableOpacity>
                  )}

                  <View style={styles.editButtonsContainer}>
                    <TouchableOpacity
                      style={[styles.editActionButton, styles.cancelEditButton]}
                      onPress={() => setIsEditingLocation(false)}>
                      <Text style={styles.cancelEditButtonText}>Cancelar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.editActionButton, styles.confirmEditButton]}
                      onPress={() => {
                        setIsEditingLocation(false);
                        setHasChanges(true);
                      }}>
                      <Text style={styles.editButtonText}>Confirmar</Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </View>

          </Animated.View>
        </ScrollView>

        {/* Modales */}
        <LocationModal
          visible={showCountryModal}
          onClose={() => setShowCountryModal(false)}
          title="Seleccionar País"
          data={countries}
          onSelect={(item) => handleLocationSelect("country", item)}
          loading={false}
        />

        <LocationModal
          visible={showDepartmentModal}
          onClose={() => setShowDepartmentModal(false)}
          title="Seleccionar Departamento"
          data={departments}
          onSelect={(item) => handleLocationSelect("department", item)}
          loading={loadingLocationData}
        />

        <LocationModal
          visible={showMunicipalityModal}
          onClose={() => setShowMunicipalityModal(false)}
          title="Seleccionar Municipio"
          data={municipalities}
          onSelect={(item) => handleLocationSelect("municipality", item)}
          loading={loadingLocationData}
        />

        <LocationModal
          visible={showVillageModal}
          onClose={() => setShowVillageModal(false)}
          title="Seleccionar Vereda"
          data={villages}
          onSelect={(item) => handleLocationSelect("village", item)}
          loading={loadingLocationData}
        />

        <ConfirmExitModal />
      </KeyboardAvoidingView>
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background.primary,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: "#284F66",
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: "#284F66",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
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
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#fff",
  },
  headerSubtitle: {
    fontSize: 12,
    color: "rgba(255,255,255,0.8)",
    marginTop: 2,
  },
  saveHeaderButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingTop: 20,
    paddingBottom: 100,
  },
  card: {
    backgroundColor: COLORS.background.secondary,
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 24,
    borderRadius: 16,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.text.primary,
    marginLeft: 8,
    flex: 1,
  },
  // NUEVOS ESTILOS para cultivos y fases
  subsection: {
    marginBottom: 16,
  },
  subsectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.text.primary,
    marginBottom: 12,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: COLORS.background.primary,
    borderRadius: 8,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: COLORS.text.primary,
    marginLeft: 12,
    flex: 1,
  },
  primaryPhaseCard: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: COLORS.warningLight,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.warning,
  },
  primaryPhaseText: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.text.primary,
    marginLeft: 12,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputRow: {
    flexDirection: "row",
    gap: 12,
  },
  halfWidth: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.text.primary,
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: COLORS.background.primary,
    borderWidth: 1,
    borderColor: COLORS.border.light,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: COLORS.text.primary,
    minHeight: 48,
  },
  inputError: {
    borderColor: COLORS.error,
    backgroundColor: COLORS.errorLight,
  },
  errorText: {
    fontSize: 12,
    color: COLORS.error,
    marginTop: 4,
    marginLeft: 4,
  },
  selectButton: {
    backgroundColor: COLORS.background.primary,
    borderWidth: 1,
    borderColor: COLORS.border.light,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  selectButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  selectButtonText: {
    marginLeft: 12,
    flex: 1,
  },
  selectLabel: {
    fontSize: 12,
    color: COLORS.text.secondary,
    marginBottom: 2,
  },
  selectValue: {
    fontSize: 16,
    color: COLORS.text.primary,
    fontWeight: "500",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.background.primary,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.text.secondary,
    fontWeight: "500",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  locationModalContent: {
    backgroundColor: COLORS.background.secondary,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "80%",
    minHeight: "50%",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border.light,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.text.primary,
  },
  modalCloseButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: COLORS.background.tertiary,
  },
  modalList: {
    flex: 1,
    paddingBottom: 20,
  },
  modalItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border.light,
    minHeight: 60,
  },
  modalItemText: {
    fontSize: 16,
    color: COLORS.text.primary,
    fontWeight: "500",
    flex: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 16,
    color: COLORS.text.tertiary,
    marginTop: 16,
    textAlign: "center",
  },
  loadingModalState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  loadingModalText: {
    fontSize: 16,
    color: COLORS.text.secondary,
    marginTop: 16,
    textAlign: "center",
  },
  confirmModalContent: {
    backgroundColor: COLORS.background.secondary,
    margin: 20,
    borderRadius: 20,
    padding: 24,
  },
  confirmModalHeader: {
    alignItems: "center",
    marginBottom: 16,
  },
  confirmModalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.text.primary,
    marginTop: 12,
    textAlign: "center",
  },
  confirmModalText: {
    fontSize: 14,
    color: COLORS.text.secondary,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 24,
  },
  confirmModalButtons: {
    flexDirection: "row",
    gap: 12,
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: COLORS.background.tertiary,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.text.primary,
  },
  discardButton: {
    backgroundColor: COLORS.error,
  },
  discardButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.text.white,
  },
  editButton: {
    marginLeft: 'auto',
    padding: 8,
  },
  locationView: {
    marginTop: 8,
  },
  locationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border.light,
  },
  locationText: {
    fontSize: 16,
    color: COLORS.text.primary,
    marginLeft: 12,
  },
  editButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    gap: 12,
  },
  editActionButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelEditButton: {
    backgroundColor: COLORS.background.tertiary,
    borderWidth: 1,
    borderColor: COLORS.border.medium,
  },
  cancelEditButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  confirmEditButton: {
    backgroundColor: COLORS.primary,
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text.white,
  },
});

export default EditTerrain;