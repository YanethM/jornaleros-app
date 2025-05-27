import React, { useState, useEffect } from "react";
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
import { Picker } from "@react-native-picker/picker";

interface LocationOption {
  id: string;
  name: string;
  value: string;
  label: string;
}

export default function AddTerrainScreen({ navigation }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [showPhaseModal, setShowPhaseModal] = useState(false);
  const [isLoadingDepartments, setIsLoadingDepartments] = useState(false);
  const [isLoadingMunicipalities, setIsLoadingMunicipalities] = useState(false);
  const [nationality, setNationality] = useState("Colombiano(a)");
  const [password, setPassword] = useState("");
  const [cityId, setCityId] = useState("");
  const [employerInfo, setEmployerInfo] = useState(null);

  // Estado de carga para veredas
  const [isLoadingVillages, setIsLoadingVillages] = useState(false);

  // Estados para manejar la ubicación
  const [countryId, setCountryId] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [availableCountries, setAvailableCountries] = useState<
    LocationOption[]
  >([]);
  const [availableDepartments, setAvailableDepartments] = useState<
    LocationOption[]
  >([]);
  const [availableMunicipalities, setAvailableMunicipalities] = useState<
    LocationOption[]
  >([]);
  const [availableVillages, setAvailableVillages] = useState<LocationOption[]>(
    []
  );

  const [village, setVillage] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    cropTypeIds: [],
    size: "",
    state: "",
    city: "",
    phaseIds: [], // Cambiado de phaseId a phaseIds para múltiples fases
    status: "ACTIVA",
    plantCount: "",
  });

  const [cropTypes, setCropTypes] = useState([]);
  const [phasesByCropType, setPhasesByCropType] = useState({}); // Nuevo estado para fases agrupadas por cultivo
  const [showCropModal, setShowCropModal] = useState(false);
  const [showDepartmentModal, setShowDepartmentModal] = useState(false);
  const [showMunicipalityModal, setShowMunicipalityModal] = useState(false);

  // [Mantener todos los useEffect y funciones existentes sin cambios...]

  // Synchronize cityId with formData.city
  useEffect(() => {
    if (cityId) {
      setFormData((prev) => ({ ...prev, city: cityId }));
    }
  }, [cityId]);

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
    if (departmentId) {
      setFormData((prev) => ({ ...prev, state: departmentId }));
    }
  }, [departmentId]);

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoadingData(true);
        await Promise.all([loadCropTypes(), loadCountries()]);
      } catch (error) {
        console.error("Error loading initial data:", error);
        Alert.alert("Error", "No se pudieron cargar los datos necesarios");
      } finally {
        setLoadingData(false);
      }
    };

    loadInitialData();
  }, []);

  // Cargar fases cuando cambian los tipos de cultivo seleccionados
  useEffect(() => {
    if (formData.cropTypeIds.length > 0) {
      loadPhasesForSelectedCropTypes();
    } else {
      setPhasesByCropType({});
      setFormData((prev) => ({ ...prev, phaseIds: [] }));
    }
  }, [formData.cropTypeIds]);

  // Cargar departamentos cuando cambia el país
  useEffect(() => {
    if (countryId) {
      loadDepartments(countryId);
      setDepartmentId("");
      setCityId("");
      setFormData((prev) => ({ ...prev, state: "", city: "" }));
    } else {
      setAvailableDepartments([]);
      setAvailableMunicipalities([]);
    }
  }, [countryId]);

  // Cargar veredas cuando cambia el municipio
  useEffect(() => {
    if (cityId) {
      console.log("City ID changed, loading villages for city ID:", cityId);
      loadVillages(cityId);
    } else {
      console.log("City ID is empty, clearing villages");
      setAvailableVillages([]);
      setVillage("");
    }
  }, [cityId]);

  // Cargar municipios cuando cambia el departamento
  useEffect(() => {
    if (departmentId) {
      loadMunicipalities(departmentId);
      setCityId("");
      setFormData((prev) => ({ ...prev, city: "" }));
      setAvailableVillages([]);
      setVillage("");
    } else {
      setAvailableMunicipalities([]);
    }
  }, [departmentId]);

  const loadCountries = async () => {
    try {
      const response = await getCountries();
      // The API returns {count, data, success} where data contains the countries array
      if (response && response.success && Array.isArray(response.data)) {
        const countryOptions = response.data.map((c) => ({
          id: c.id,
          value: c.id,
          label: c.name,
          name: c.name,
        }));
        setAvailableCountries(countryOptions);
      } else {
        throw new Error("Formato de respuesta inesperado");
      }
    } catch (error) {
      console.error("Error loading countries:", error);
      Alert.alert("Error", "No se pudieron cargar los países");
    }
  };

  const loadDepartments = async (countryId: string) => {
    try {
      setIsLoadingDepartments(true);
      const response = await getDepartmentsByCountry(countryId);

      // Check for response.data structure similar to countries
      if (response && response.success && Array.isArray(response.data)) {
        const departmentOptions = response.data.map((d) => ({
          id: d.id,
          value: d.id,
          label: d.name,
          name: d.name,
        }));
        setAvailableDepartments(departmentOptions);
      } else if (response && Array.isArray(response)) {
        // Fallback to old structure if needed
        const departmentOptions = response.map((d) => ({
          id: d.id,
          value: d.id,
          label: d.name,
          name: d.name,
        }));
        setAvailableDepartments(departmentOptions);
      } else {
        throw new Error("Formato de respuesta inesperado");
      }
    } catch (error) {
      console.error("Error loading departments:", error);
      Alert.alert("Error", "No se pudieron cargar los departamentos");
    } finally {
      setIsLoadingDepartments(false);
    }
  };

  const loadMunicipalities = async (departmentId: string) => {
    try {
      setIsLoadingMunicipalities(true);
      const response = await getMunicipalitiesByDepartment(departmentId);

      // Check for response.data structure similar to countries
      if (response && response.success && Array.isArray(response.data)) {
        const municipalityOptions = response.data.map((m) => ({
          id: m.id,
          value: m.id,
          label: m.name,
          name: m.name,
        }));
        setAvailableMunicipalities(municipalityOptions);
      } else if (response && Array.isArray(response)) {
        // Fallback to old structure if needed
        const municipalityOptions = response.map((m) => ({
          id: m.id,
          value: m.id,
          label: m.name,
          name: m.name,
        }));
        setAvailableMunicipalities(municipalityOptions);
      } else {
        throw new Error("Formato de respuesta inesperado");
      }
    } catch (error) {
      console.error("Error loading municipalities:", error);
      Alert.alert("Error", "No se pudieron cargar los municipios");
    } finally {
      setIsLoadingMunicipalities(false);
    }
  };

  const loadVillages = async (municipalityId: string) => {
    try {
      setIsLoadingVillages(true);
      console.log("Loading villages for municipality ID:", municipalityId);

      const response = await getVillagesByMunicipality(municipalityId);
      console.log("Villages API response:", JSON.stringify(response));

      // Check for response.data structure similar to countries
      if (response && response.success && Array.isArray(response.data)) {
        const villageOptions = response.data.map((v) => ({
          id: v.id,
          value: v.id,
          label: v.name,
          name: v.name,
        }));
        console.log("Processed village options:", villageOptions);
        setAvailableVillages(villageOptions);
      } else if (response && Array.isArray(response)) {
        // Fallback to old structure if needed
        const villageOptions = response.map((v) => ({
          id: v.id,
          value: v.id,
          label: v.name,
          name: v.name,
        }));
        console.log(
          "Processed village options (array format):",
          villageOptions
        );
        setAvailableVillages(villageOptions);
      } else {
        // If no villages are returned but the response is valid, set empty array
        console.log(
          "No villages found or unexpected format, setting empty array"
        );
        setAvailableVillages([]);
      }
    } catch (error) {
      console.error("Error loading villages:", error);
      Alert.alert("Error", "No se pudieron cargar las veredas");
      setAvailableVillages([]);
    } finally {
      setIsLoadingVillages(false);
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

  const loadPhasesForSelectedCropTypes = async () => {
    try {
      const phasesData = {};

      // Cargar fases para cada tipo de cultivo seleccionado
      for (const cropTypeId of formData.cropTypeIds) {
        try {
          const phases = await getCultivationPhasesByCropId(cropTypeId);
          if (phases && phases.length > 0) {
            phasesData[cropTypeId] = phases;
          }
        } catch (error) {
          console.error(
            `Error loading phases for crop type ${cropTypeId}:`,
            error
          );
        }
      }

      setPhasesByCropType(phasesData);

      // Limpiar fases seleccionadas que ya no pertenecen a los cultivos actuales
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

    if (!formData.state) {
      Alert.alert("Error", "Debes seleccionar un departamento");
      return;
    }

    if (!formData.city) {
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
        city: formData.city,
        state: formData.state,
        plantCount: parseInt(formData.plantCount) || 0,
        // Incluir información del employerProfile
        ...(employerInfo && {
          organization: employerInfo.organization,
          employerCity: employerInfo.employerCity,
          employerState: employerInfo.employerState,
          employerProfileId: employerInfo.employerProfileId,
          userId: user.id, // También incluir el ID del usuario
        }),
        // Include village when selected
        ...(village && { village: village }),
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
                    {(phases as Array<any>).length} {(phases as Array<any>).length === 1 ? "fase" : "fases"}
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

  const getDepartmentLabel = () => {
    if (nationality === "Colombiano(a)") return "Departamento";
    if (nationality === "Venezolano(a)") return "Estado";
    if (nationality === "ColomboVenezolano(a)") return "Departamento / Estado";
    return "Departamento / Estado";
  };

  const getMunicipalityLabel = () => {
    if (nationality === "Colombiano(a)") return "Municipio";
    if (nationality === "Venezolano(a)") return "Municipio";
    if (nationality === "ColomboVenezolano(a)") return "Municipio / Ciudad";
    return "Municipio / Ciudad";
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

          {/* Sección de ubicación */}
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <Icon name="location-on" size={20} color="#284F66" />
              <Text style={styles.sectionTitle}>Ubicación</Text>
            </View>

            {/* País */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>País *</Text>
              <View style={styles.pickerWrapper}>
                <Icon
                  name="public"
                  size={20}
                  color="#284F66"
                  style={styles.inputIcon}
                />
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={countryId}
                    onValueChange={(itemValue) => {
                      setCountryId(itemValue);
                      setDepartmentId("");
                      setCityId("");
                      setVillage("");
                    }}
                    style={styles.picker}
                    dropdownIconColor="#284F66">
                    <Picker.Item
                      label="Selecciona un país"
                      value=""
                      style={styles.pickerItem}
                    />
                    {availableCountries.map((c) => (
                      <Picker.Item
                        key={c.id}
                        label={c.label}
                        value={c.value}
                        style={styles.pickerItem}
                      />
                    ))}
                  </Picker>
                </View>
              </View>
            </View>

            {/* Departamento */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>{getDepartmentLabel()} *</Text>
              <View
                style={[
                  styles.pickerWrapper,
                  !countryId && styles.disabledWrapper,
                ]}>
                <Icon
                  name="map"
                  size={20}
                  color={countryId ? "#284F66" : "#ccc"}
                  style={styles.inputIcon}
                />
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={departmentId}
                    onValueChange={(itemValue) => setDepartmentId(itemValue)}
                    style={styles.picker}
                    dropdownIconColor="#284F66"
                    enabled={!!countryId}>
                    <Picker.Item
                      label={
                        countryId
                          ? `Selecciona ${getDepartmentLabel().toLowerCase()}`
                          : "Selecciona un país primero"
                      }
                      value=""
                      style={styles.pickerItem}
                    />
                    {availableDepartments.map((d) => (
                      <Picker.Item
                        key={d.id || `dep-${Math.random()}`}
                        label={d.label || "Opción sin nombre"}
                        value={d.value || ""}
                        style={styles.pickerItem}
                      />
                    ))}
                  </Picker>
                </View>
                {isLoadingDepartments && (
                  <ActivityIndicator
                    size="small"
                    color="#284F66"
                    style={styles.loadingIndicator}
                  />
                )}
              </View>
            </View>

            {/* Municipio */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>{getMunicipalityLabel()} *</Text>
              <View
                style={[
                  styles.pickerWrapper,
                  !departmentId && styles.disabledWrapper,
                ]}>
                <Icon
                  name="location-city"
                  size={20}
                  color={departmentId ? "#284F66" : "#ccc"}
                  style={styles.inputIcon}
                />
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={cityId}
                    onValueChange={(itemValue) => setCityId(itemValue)}
                    style={styles.picker}
                    dropdownIconColor="#284F66"
                    enabled={!!departmentId}>
                    <Picker.Item
                      label={
                        departmentId
                          ? `Selecciona ${getMunicipalityLabel().toLowerCase()}`
                          : "Selecciona un departamento primero"
                      }
                      value=""
                      style={styles.pickerItem}
                    />
                    {availableMunicipalities.map((m) => (
                      <Picker.Item
                        key={m.id || `mun-${Math.random()}`}
                        label={m.label || "Opción sin nombre"}
                        value={m.value || ""}
                        style={styles.pickerItem}
                      />
                    ))}
                  </Picker>
                </View>
                {isLoadingMunicipalities && (
                  <ActivityIndicator
                    size="small"
                    color="#284F66"
                    style={styles.loadingIndicator}
                  />
                )}
              </View>
            </View>

            {/* Vereda */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Vereda (Opcional)</Text>
              <View
                style={[
                  styles.pickerWrapper,
                  !cityId && styles.disabledWrapper,
                ]}>
                <Icon
                  name="terrain"
                  size={20}
                  color={cityId ? "#284F66" : "#ccc"}
                  style={styles.inputIcon}
                />
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={village}
                    onValueChange={(itemValue) => {
                      console.log("Selected village:", itemValue);
                      setVillage(itemValue);
                    }}
                    style={styles.picker}
                    dropdownIconColor="#284F66"
                    enabled={!!cityId}>
                    <Picker.Item
                      label={
                        cityId
                          ? "Selecciona una vereda"
                          : "Selecciona un municipio primero"
                      }
                      value=""
                      style={styles.pickerItem}
                    />
                    {availableVillages.length > 0 ? (
                      availableVillages.map((v) => (
                        <Picker.Item
                          key={v.id || `ver-${Math.random()}`}
                          label={v.label || "Opción sin nombre"}
                          value={v.value || ""}
                          style={styles.pickerItem}
                        />
                      ))
                    ) : (
                      <Picker.Item
                        label="No hay veredas disponibles"
                        value=""
                        enabled={false}
                        style={styles.pickerItem}
                      />
                    )}
                  </Picker>
                </View>
                {isLoadingVillages && (
                  <ActivityIndicator
                    size="small"
                    color="#284F66"
                    style={styles.loadingIndicator}
                  />
                )}
              </View>
              <Text style={styles.infoText}>
                {availableVillages.length} veredas disponibles
              </Text>
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
  selectedModalItemText:{
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
  rowContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 15,
  },
  halfWidth: {
    flex: 1,
  },
  pickerWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    borderWidth: 2,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    paddingLeft: 15,
  },
  disabledWrapper: {
    backgroundColor: "#f1f5f9",
    opacity: 0.6,
  },
  pickerContainer: {
    flex: 1,
  },
  picker: {
    height: 50,
    color: "#1f2937",
  },
  pickerItem: {
    fontSize: 16,
    color: "#374151",
  },
  loadingIndicator: {
    marginRight: 15,
  },
  infoText: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 5,
    fontStyle: "italic",
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
});
