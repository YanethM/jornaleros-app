import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  Modal,
  FlatList,
  Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/MaterialIcons";
import { useAuth } from "../../context/AuthContext";
import {
  getCountries,
  getDepartmentsByCountry,
  getMunicipalitiesByDepartment,
  getVillagesByMunicipality,
} from "../../services/locationService";
import { createFarm } from "../../services/farmService";
import { getCropType } from "../../services/cropTypeService";
import { getCultivationPhasesByCropId } from "../../services/cultivationPhaseService";

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

export default function AddTerrainScreen({ navigation }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [employerInfo, setEmployerInfo] = useState(null);
  
  // Estados de ubicación
  const [countries, setCountries] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [municipalities, setMunicipalities] = useState([]);
  const [villages, setVillages] = useState([]);
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [selectedMunicipality, setSelectedMunicipality] = useState(null);
  const [selectedVillage, setSelectedVillage] = useState(null);
  
  // Estados de modales
  const [showCountryModal, setShowCountryModal] = useState(false);
  const [showDepartmentModal, setShowDepartmentModal] = useState(false);
  const [showMunicipalityModal, setShowMunicipalityModal] = useState(false);
  const [showVillageModal, setShowVillageModal] = useState(false);
  const [showCropModal, setShowCropModal] = useState(false);
  
  // Estados de animación y carga
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const [loadingLocationData, setLoadingLocationData] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    cropTypeIds: [],
    size: "",
    state: "",
    city: "",
    village: "",
    phaseIds: [],
    status: "ACTIVA",
    plantCount: "",
  });

  const [cropTypes, setCropTypes] = useState([]);
  const [phasesByCropType, setPhasesByCropType] = useState({});

  useEffect(() => {
    if (user?.employerProfile) {
      const profile = user.employerProfile;
      setEmployerInfo({
        organization: profile.organization,
        employerCity: profile.city,
        employerState: profile.state,
        employerProfileId: profile.id,
      });

      console.log("Employer profile extracted:", profile);
    }
  }, [user]);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const countriesResponse = await getCountries();
        let countriesData = [];
        if (countriesResponse?.data) {
          countriesData = countriesResponse.data;
        } else if (countriesResponse && Array.isArray(countriesResponse)) {
          countriesData = countriesResponse;
        }
        setCountries(countriesData);
      } catch (error) {
        console.error("Error loading initial data:", error);
        Alert.alert("Error", "No se pudieron cargar los datos iniciales");
      } finally {
        setLoading(false);
      }
    };

    loadData();
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

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoadingData(true);
        await Promise.all([loadCropTypes()]);
      } catch (error) {
        console.error("Error loading initial data:", error);
        Alert.alert("Error", "No se pudieron cargar los datos necesarios");
      } finally {
        setLoadingData(false);
      }
    };

    loadInitialData();
  }, []);

  useEffect(() => {
    if (formData.cropTypeIds.length > 0) {
      loadPhasesForSelectedCropTypes();
    } else {
      setPhasesByCropType({});
      setFormData((prev) => ({ ...prev, phaseIds: [] }));
    }
  }, [formData.cropTypeIds]);

  useEffect(() => {
    // Actualizar formData con las ubicaciones seleccionadas (usar IDs, no nombres)
    setFormData((prev) => ({
      ...prev,
      state: selectedDepartment?.id || "",
      city: selectedMunicipality?.id || "",
      village: selectedVillage?.id || "",
    }));
  }, [selectedDepartment, selectedMunicipality, selectedVillage]);

  const handleLocationSelect = async (type, item) => {
    setHasChanges(true);

    switch (type) {
      case "country":
        setSelectedCountry(item);
        setSelectedDepartment(null);
        setSelectedMunicipality(null);
        setSelectedVillage(null);
        setDepartments([]);
        setMunicipalities([]);
        setVillages([]);
        setShowCountryModal(false);

        if (item.id) {
          await loadDepartments(item.id);
        }
        break;

      case "department":
        setSelectedDepartment(item);
        setSelectedMunicipality(null);
        setSelectedVillage(null);
        setMunicipalities([]);
        setVillages([]);
        setShowDepartmentModal(false);

        if (item.id) {
          await loadMunicipalities(item.id);
        }
        break;

      case "municipality":
        setSelectedMunicipality(item);
        setSelectedVillage(null);
        setVillages([]);
        setShowMunicipalityModal(false);

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

  const loadCropTypes = async () => {
    try {
      const data = await getCropType();
      console.log("Crop Types API response:", JSON.stringify(data));
      if (data && data.success && Array.isArray(data.data)) {
        setCropTypes(data.data);
      } else if (data && data.cropTypes && Array.isArray(data.cropTypes)) {
        setCropTypes(data.cropTypes);
      } else if (Array.isArray(data)) {
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

  const loadPhasesForSelectedCropTypes = async () => {
    try {
      const phasesData = {};
      for (const cropTypeId of formData.cropTypeIds) {
        try {
          const response = await getCultivationPhasesByCropId(cropTypeId);
          let phases = [];

          if (response && response.success && Array.isArray(response.data)) {
            phases = response.data;
          } else if (Array.isArray(response)) {
            phases = response;
          }

          if (phases.length > 0) {
            phasesData[cropTypeId] = phases;
            console.log(
              `Loaded ${phases.length} phases for crop ${cropTypeId}`
            );
          } else {
            console.log(`No phases found for crop ${cropTypeId}`);
          }
        } catch (error) {
          console.error(
            `Error loading phases for crop type ${cropTypeId}:`,
            error
          );
        }
      }

      setPhasesByCropType(phasesData);
      setFormData((prev) => ({
        ...prev,
        phaseIds: prev.phaseIds.filter((phaseId) =>
          Object.values(phasesData).some((phases) =>
            phases.some((phase) => phase.id === phaseId)
          )
        ),
      }));
    } catch (error) {
      console.error("Error loading phases:", error);
      Alert.alert("Error", "No se pudieron cargar las fases del cultivo");
      setPhasesByCropType({});
    }
  };

  const loadDepartments = async (countryId) => {
    try {
      setLoadingLocationData(true);
      const response = await getDepartmentsByCountry(countryId);

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

  const loadMunicipalities = async (departmentId) => {
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

  const loadVillages = async (municipalityId) => {
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
          <ScrollView
            style={styles.modalList}
            showsVerticalScrollIndicator={false}>
            {loading ? (
              <View style={styles.loadingModalState}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={styles.loadingModalText}>
                  Cargando opciones...
                </Text>
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
                <Text style={styles.emptyStateText}>
                  No hay opciones disponibles
                </Text>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  const handleCreateFarm = async () => {
    if (!formData.name.trim()) {
      Alert.alert("Error", "El nombre del terreno es requerido");
      return;
    }

    if (!formData.size || parseFloat(formData.size) <= 0) {
      Alert.alert("Error", "El número de hectáreas debe ser mayor a 0");
      return;
    }

    if (formData.cropTypeIds.length === 0) {
      Alert.alert("Error", "Debes seleccionar al menos un tipo de cultivo");
      return;
    }

    if (!selectedDepartment) {
      Alert.alert("Error", "Debes seleccionar un departamento");
      return;
    }

    if (!selectedMunicipality) {
      Alert.alert("Error", "Debes seleccionar un municipio");
      return;
    }

    if (!formData.phaseIds.length) {
      Alert.alert("Error", "Debes seleccionar al menos una fase de cultivo");
      return;
    }

    try {
      setLoading(true);
      const farmData = {
        name: formData.name.trim(),
        size: parseFloat(formData.size),
        cropTypeIds: formData.cropTypeIds,
        phaseIds: formData.phaseIds,
        status: formData.status === "ACTIVA",
        city: selectedMunicipality.id,        // Enviar ID del municipio
        state: selectedDepartment.id,         // Enviar ID del departamento
        plantCount: parseInt(formData.plantCount) || 0,
        ...(employerInfo && {
          organization: employerInfo.organization,
          employerCity: employerInfo.employerCity,
          employerState: employerInfo.employerState,
          employerProfileId: employerInfo.employerProfileId,
          userId: user.id,
        }),
        // Solo incluir village si está seleccionado
        ...(selectedVillage && { village: selectedVillage.id }),
      };

      console.log("Farm data to send:", JSON.stringify(farmData, null, 2));

      await createFarm(farmData);
      Alert.alert("Éxito", "Terreno creado exitosamente", [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      console.error("Error creating farm:", error);
      Alert.alert("Error", error.message || "No se pudo crear el terreno");
    } finally {
      setLoading(false);
    }
  };

  const toggleCropType = (cropTypeId) => {
    setFormData((prev) => {
      const newCropTypeIds = prev.cropTypeIds.includes(cropTypeId)
        ? prev.cropTypeIds.filter((id) => id !== cropTypeId)
        : [...prev.cropTypeIds, cropTypeId];

      return {
        ...prev,
        cropTypeIds: newCropTypeIds,
      };
    });
  };

  const togglePhase = (phaseId) => {
    setFormData((prev) => ({
      ...prev,
      phaseIds: prev.phaseIds.includes(phaseId)
        ? prev.phaseIds.filter((id) => id !== phaseId)
        : [...prev.phaseIds, phaseId],
    }));
  };

  const getCropTypeColors = () => {
    const colors = [
      "#284F66",
      "#10B981",
      "#F59E0B",
      "#EF4444",
      "#8B5CF6",
      "#06B6D4",
      "#F97316",
      "#84CC16",
      "#EC4899",
      "#6366F1",
    ];
    return colors;
  };

  const renderPhaseSelector = () => {
    const cropTypeColors = getCropTypeColors();
    const hasPhasesToShow = Object.keys(phasesByCropType).length > 0;

    if (!hasPhasesToShow || formData.cropTypeIds.length === 0) return null;

    return (
      <View style={styles.phasesSelectorContainer}>
        <View style={styles.sectionHeader}>
          <Icon name="timeline" size={20} color="#284F66" />
          <Text style={styles.sectionTitle}>Fases de Cultivo</Text>
        </View>
        <Text style={styles.phasesSubtitle}>
          Selecciona las fases para cada tipo de cultivo
        </Text>

        {Object.entries(phasesByCropType).map(
          ([cropTypeId, phases], cropIndex) => {
            const cropType = cropTypes.find((ct) => ct.id === cropTypeId);
            const cropColor = cropTypeColors[cropIndex % cropTypeColors.length];

            return (
              <View key={cropTypeId} style={styles.cropPhaseGroup}>
                <View
                  style={[
                    styles.cropTypeHeader,
                    { backgroundColor: `${cropColor}15` },
                  ]}>
                  <View
                    style={[
                      styles.cropTypeIndicator,
                      { backgroundColor: cropColor },
                    ]}
                  />
                  <Icon name="eco" size={18} color={cropColor} />
                  <Text style={[styles.cropTypeName, { color: cropColor }]}>
                    {cropType?.name || "Cultivo"}
                  </Text>
                  <Text style={styles.phaseCount}>
                    {phases.length} {phases.length === 1 ? "fase" : "fases"}
                  </Text>
                </View>

                <View style={styles.phasesGrid}>
                  {phases.map((phase) => {
                    const isSelected = formData.phaseIds.includes(phase.id);
                    return (
                      <TouchableOpacity
                        key={phase.id}
                        style={[
                          styles.phaseChip,
                          isSelected && styles.selectedPhaseChip,
                          { borderColor: cropColor },
                          isSelected && { backgroundColor: cropColor },
                        ]}
                        onPress={() => togglePhase(phase.id)}>
                        <Icon
                          name={
                            isSelected
                              ? "check-circle"
                              : "radio-button-unchecked"
                          }
                          size={16}
                          color={isSelected ? "#fff" : cropColor}
                        />
                        <Text
                          style={[
                            styles.phaseChipText,
                            { color: isSelected ? "#fff" : cropColor },
                          ]}>
                          {phase.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            );
          }
        )}

        <View style={styles.selectedPhasesInfo}>
          <Icon name="info" size={16} color="#6b7280" />
          <Text style={styles.selectedPhasesText}>
            {formData.phaseIds.length}{" "}
            {formData.phaseIds.length === 1
              ? "fase seleccionada"
              : "fases seleccionadas"}
          </Text>
        </View>
      </View>
    );
  };

  const getSelectedCropTypesText = () => {
    if (formData.cropTypeIds.length === 0) return "";
    const selectedCrops = cropTypes.filter((ct) =>
      formData.cropTypeIds.includes(ct.id)
    );
    return selectedCrops.map((ct) => ct.name).join(", ");
  };

  if (loadingData) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color="#284F66" />
            <Text style={styles.loadingText}>Cargando datos...</Text>
            <Text style={styles.loadingSubtext}>Preparando formulario</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header mejorado */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Añadir Terreno</Text>
          <Text style={styles.headerSubtitle}>Registra tu nueva finca</Text>
        </View>
        <View style={styles.headerIcon}>
          <Icon name="agriculture" size={24} color="#fff" />
        </View>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        {/* Card principal del formulario */}
        <View style={styles.formCard}>
          {/* Sección de información básica */}
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <Icon name="info" size={20} color="#284F66" />
              <Text style={styles.sectionTitle}>Información Básica</Text>
            </View>

            {/* Nombre del terreno */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Nombre del Terreno/Finca *</Text>
              <View style={styles.inputWrapper}>
                <Icon
                  name="home"
                  size={20}
                  color="#284F66"
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Ej: Finca La Esperanza"
                  placeholderTextColor="#999"
                  value={formData.name}
                  onChangeText={(text) =>
                    setFormData({ ...formData, name: text })
                  }
                />
              </View>
            </View>

            {/* Tipo de cultivo */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Tipo de cultivo *</Text>
              <TouchableOpacity
                style={styles.selectContainer}
                onPress={() => setShowCropModal(true)}>
                <Icon
                  name="nature"
                  size={20}
                  color="#284F66"
                  style={styles.inputIcon}
                />
                <Text
                  style={[
                    styles.selectText,
                    !getSelectedCropTypesText() && styles.placeholderText,
                  ]}>
                  {getSelectedCropTypesText() ||
                    "Selecciona el tipo de cultivo"}
                </Text>
                <Icon name="keyboard-arrow-down" size={24} color="#284F66" />
              </TouchableOpacity>
            </View>

            {renderPhaseSelector()}

            {/* Fila de números */}
            <View style={styles.rowContainer}>
              <View style={[styles.inputContainer, styles.halfWidth]}>
                <Text style={styles.label}>Hectáreas *</Text>
                <View style={styles.inputWrapper}>
                  <Icon
                    name="straighten"
                    size={20}
                    color="#284F66"
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="0.0"
                    placeholderTextColor="#999"
                    value={formData.size}
                    onChangeText={(text) =>
                      setFormData({ ...formData, size: text })
                    }
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <View style={[styles.inputContainer, styles.halfWidth]}>
                <Text style={styles.label}>Cantidad de plantas</Text>
                <View style={styles.inputWrapper}>
                  <Icon
                    name="filter-vintage"
                    size={20}
                    color="#284F66"
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="0"
                    placeholderTextColor="#999"
                    value={formData.plantCount}
                    onChangeText={(text) =>
                      setFormData({ ...formData, plantCount: text })
                    }
                    keyboardType="numeric"
                  />
                </View>
              </View>
            </View>
          </View>

          {/* Sección de ubicación - CORREGIDA */}
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <Icon name="location-on" size={20} color="#284F66" />
              <Text style={styles.sectionTitle}>Ubicación</Text>
            </View>

            {/* País */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>País *</Text>
              <TouchableOpacity
                style={styles.selectContainer}
                onPress={() => setShowCountryModal(true)}>
                <Icon
                  name="public"
                  size={20}
                  color="#284F66"
                  style={styles.inputIcon}
                />
                <Text
                  style={[
                    styles.selectText,
                    !selectedCountry && styles.placeholderText,
                  ]}>
                  {selectedCountry?.name || "Selecciona un país"}
                </Text>
                <Icon name="keyboard-arrow-down" size={24} color="#284F66" />
              </TouchableOpacity>
            </View>

            {/* Departamento */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Departamento *</Text>
              <TouchableOpacity
                style={[
                  styles.selectContainer,
                  !selectedCountry && styles.disabledContainer,
                ]}
                onPress={() => {
                  if (selectedCountry) {
                    setShowDepartmentModal(true);
                  }
                }}
                disabled={!selectedCountry}>
                <Icon
                  name="map"
                  size={20}
                  color={selectedCountry ? "#284F66" : "#999"}
                  style={styles.inputIcon}
                />
                <Text
                  style={[
                    styles.selectText,
                    !selectedDepartment && styles.placeholderText,
                    !selectedCountry && styles.disabledText,
                  ]}>
                  {selectedDepartment?.name || 
                   (!selectedCountry 
                     ? "Primero selecciona un país" 
                     : "Selecciona un departamento")}
                </Text>
                <Icon 
                  name="keyboard-arrow-down" 
                  size={24} 
                  color={selectedCountry ? "#284F66" : "#999"} 
                />
              </TouchableOpacity>
            </View>

            {/* Municipio */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Municipio *</Text>
              <TouchableOpacity
                style={[
                  styles.selectContainer,
                  !selectedDepartment && styles.disabledContainer,
                ]}
                onPress={() => {
                  if (selectedDepartment) {
                    setShowMunicipalityModal(true);
                  }
                }}
                disabled={!selectedDepartment}>
                <Icon
                  name="location-city"
                  size={20}
                  color={selectedDepartment ? "#284F66" : "#999"}
                  style={styles.inputIcon}
                />
                <Text
                  style={[
                    styles.selectText,
                    !selectedMunicipality && styles.placeholderText,
                    !selectedDepartment && styles.disabledText,
                  ]}>
                  {selectedMunicipality?.name || 
                   (!selectedDepartment 
                     ? "Primero selecciona un departamento" 
                     : "Selecciona un municipio")}
                </Text>
                <Icon 
                  name="keyboard-arrow-down" 
                  size={24} 
                  color={selectedDepartment ? "#284F66" : "#999"} 
                />
              </TouchableOpacity>
            </View>

            {/* Vereda (Opcional) */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Vereda (Opcional)</Text>
              <TouchableOpacity
                style={[
                  styles.selectContainer,
                  !selectedMunicipality && styles.disabledContainer,
                ]}
                onPress={() => {
                  if (selectedMunicipality) {
                    setShowVillageModal(true);
                  }
                }}
                disabled={!selectedMunicipality}>
                <Icon
                  name="nature-people"
                  size={20}
                  color={selectedMunicipality ? "#284F66" : "#999"}
                  style={styles.inputIcon}
                />
                <Text
                  style={[
                    styles.selectText,
                    !selectedVillage && styles.placeholderText,
                    !selectedMunicipality && styles.disabledText,
                  ]}>
                  {selectedVillage?.name || 
                   (!selectedMunicipality 
                     ? "Primero selecciona un municipio" 
                     : "Selecciona una vereda")}
                </Text>
                <Icon 
                  name="keyboard-arrow-down" 
                  size={24} 
                  color={selectedMunicipality ? "#284F66" : "#999"} 
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Botón crear */}
        <TouchableOpacity
          style={[styles.createButton, loading && styles.disabledButton]}
          onPress={handleCreateFarm}
          disabled={loading}>
          <View style={styles.buttonContent}>
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Icon
                  name="add-circle"
                  size={20}
                  color="#fff"
                  style={styles.buttonIcon}
                />
                <Text style={styles.createButtonText}>Crear Terreno</Text>
              </>
            )}
          </View>
        </TouchableOpacity>
      </ScrollView>

      {/* Modales de ubicación */}
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

      {/* Modal de tipos de cultivo mejorado */}
      <Modal
        visible={showCropModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowCropModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <View style={styles.modalTitleContainer}>
                  <Icon name="nature" size={24} color="#284F66" />
                  <Text style={styles.modalTitle}>Tipos de Cultivo</Text>
                </View>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setShowCropModal(false)}>
                  <Icon name="close" size={24} color="#666" />
                </TouchableOpacity>
              </View>

              <FlatList
                data={cropTypes}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.modalItem,
                      formData.cropTypeIds.includes(item.id) &&
                        styles.selectedModalItem,
                    ]}
                    onPress={() => toggleCropType(item.id)}>
                    <View style={styles.modalItemContent}>
                      <Icon
                        name="eco"
                        size={20}
                        color={
                          formData.cropTypeIds.includes(item.id)
                            ? "#284F66"
                            : "#999"
                        }
                      />
                      <Text
                        style={[
                          styles.modalItemText,
                          formData.cropTypeIds.includes(item.id) &&
                            styles.selectedModalItemText,
                        ]}>
                        {item.name}
                      </Text>
                    </View>
                    {formData.cropTypeIds.includes(item.id) && (
                      <Icon name="check-circle" size={24} color="#284F66" />
                    )}
                  </TouchableOpacity>
                )}
              />
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
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
    shadowColor: "#284F66",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  loadingText: {
    marginTop: 20,
    fontSize: 18,
    fontWeight: "600",
    color: "#284F66",
  },
  loadingSubtext: {
    marginTop: 8,
    fontSize: 14,
    color: "#666",
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
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    flex: 1,
    padding: 20,
  },
  formCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#284F66",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 8,
  },
  sectionContainer: {
    marginBottom: 30,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    paddingBottom: 10,
    borderBottomWidth: 2,
    borderBottomColor: "#f1f5f9",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#284F66",
    marginLeft: 10,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    borderWidth: 2,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 4,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: "#1f2937",
  },
  selectContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    borderWidth: 2,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 15,
  },
  disabledContainer: {
    backgroundColor: "#f1f5f9",
    borderColor: "#d1d5db",
    opacity: 0.6,
  },
  selectedModalItemText: {
    color: "#284F66",
  },
  selectText: {
    flex: 1,
    fontSize: 16,
    color: "#1f2937",
    marginLeft: 12,
  },
  placeholderText: {
    color: "#9ca3af",
  },
  disabledText: {
    color: "#9ca3af",
    fontStyle: "italic",
  },
  rowContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 15,
  },
  halfWidth: {
    flex: 1,
  },
  createButton: {
    backgroundColor: "#284F66",
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 30,
    marginBottom: 30,
    shadowColor: "#284F66",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
  },
  disabledButton: {
    opacity: 0.7,
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  buttonIcon: {
    marginRight: 8,
  },
  createButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    maxHeight: "85%",
    minHeight: 400,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 15,
  },
  modalContent: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 25,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
    backgroundColor: "#f8fafc",
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
  },
  modalTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#284F66",
    marginLeft: 10,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#e5e7eb",
    alignItems: "center",
    justifyContent: "center",
  },
  modalItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 18,
    paddingHorizontal: 25,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  selectedModalItem: {
    backgroundColor: "#f0f9ff",
    borderLeftWidth: 4,
    borderLeftColor: "#284F66",
  },
  modalItemContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  modalItemText: {
    fontSize: 16,
    color: "#374151",
    marginLeft: 12,
    fontWeight: "500",
  },
  phasesSelectorContainer: {
    marginTop: 20,
  },
  phasesSubtitle: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 20,
    fontStyle: "italic",
  },
  cropPhaseGroup: {
    marginBottom: 25,
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    overflow: "hidden",
  },
  cropTypeHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  cropTypeIndicator: {
    width: 4,
    height: 20,
    borderRadius: 2,
    marginRight: 12,
  },
  cropTypeName: {
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
    flex: 1,
  },
  phaseCount: {
    fontSize: 12,
    color: "#6b7280",
    backgroundColor: "#f3f4f6",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    fontWeight: "500",
  },
  phasesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    padding: 15,
    gap: 10,
  },
  phaseChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    backgroundColor: "#fff",
    marginBottom: 5,
  },
  selectedPhaseChip: {
    shadowColor: "#284F66",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  phaseChipText: {
    fontSize: 14,
    fontWeight: "500",
    marginLeft: 6,
  },
  selectedPhasesInfo: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    padding: 12,
    borderRadius: 8,
    marginTop: 10,
  },
  selectedPhasesText: {
    fontSize: 14,
    color: "#6b7280",
    marginLeft: 6,
    fontWeight: "500",
  },
  locationModalContent: {
    backgroundColor: COLORS.background.secondary,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "80%",
    minHeight: "50%",
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
});