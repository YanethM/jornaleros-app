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
import AsyncStorage from "@react-native-async-storage/async-storage";
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
import { getCropType } from "../../services/cropTypeService"; // ✅ Descomentado
import { getCultivationPhasesByCropId } from "../../services/cultivationPhaseService";
import CustomTabBar from "../../components/CustomTabBar";

interface EditTerrainProps {
  navigation: any;
  route: any;
}

// Paleta de colores para tipos de cultivo
const cropTypeColors = [
  "#22C55E", // Verde
  "#3B82F6", // Azul
  "#F59E0B", // Naranja
  "#8B5CF6", // Púrpura
  "#EF4444", // Rojo
  "#06B6D4", // Cyan
  "#84CC16", // Lima
  "#F97316", // Naranja oscuro
];

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
  const [isEditingCrops, setIsEditingCrops] = useState(false);
  const [loadingLocationData, setLoadingLocationData] = useState(false);
  const [loadingCropData, setLoadingCropData] = useState(false);

  // Estados del formulario
  const [formData, setFormData] = useState({
    name: "",
    size: "",
    plantCount: "",
    specificLocation: "",
    status: true,
    phaseIds: [] as string[], // Array de IDs de fases seleccionadas
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

  // Estados para cultivos y fases
  const [availableCropTypes, setAvailableCropTypes] = useState<any[]>([]);
  const [selectedCropTypes, setSelectedCropTypes] = useState<any[]>([]);
  const [phasesByCropType, setPhasesByCropType] = useState<{[key: string]: any[]}>({});

  // Estados de modales
  const [showCountryModal, setShowCountryModal] = useState(false);
  const [showDepartmentModal, setShowDepartmentModal] = useState(false);
  const [showMunicipalityModal, setShowMunicipalityModal] = useState(false);
  const [showVillageModal, setShowVillageModal] = useState(false);
  const [showConfirmExit, setShowConfirmExit] = useState(false);
  const [showCropTypesModal, setShowCropTypesModal] = useState(false);

  // Estados de validación
  const [errors, setErrors] = useState<any>({});
  const [hasChanges, setHasChanges] = useState(false);

  // Animaciones
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  // ✅ Función simplificada para obtener tipos de cultivo usando el servicio
  const loadCropTypes = async () => {
    try {
      console.log("Loading crop types from service...");
      const response = await getCropType();
      
      let cropTypesData = [];
      if (response?.data) {
        cropTypesData = response.data;
      } else if (Array.isArray(response)) {
        cropTypesData = response;
      }

      console.log("Crop types loaded successfully:", cropTypesData.length);
      setAvailableCropTypes(cropTypesData);
      return cropTypesData;
    } catch (error) {
      console.error("Error loading crop types from service:", error);
      Alert.alert("Error", "No se pudieron cargar los tipos de cultivo");
      return [];
    }
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // ✅ Cargar tipos de cultivo primero y siempre desde el servicio
        const cropTypesData = await loadCropTypes();
        
        // Cargar países
        const countriesResponse = await getCountries();
        let countriesData = [];
        if (countriesResponse?.data) {
          countriesData = countriesResponse.data;
        } else if (countriesResponse && Array.isArray(countriesResponse)) {
          countriesData = countriesResponse;
        }
        setCountries(countriesData);

        // Cargar datos de la finca
        await loadFarmData(countriesData, cropTypesData);

      } catch (error) {
        console.error("Error loading initial data:", error);
        Alert.alert("Error", "No se pudieron cargar los datos iniciales");
      } finally {
        setLoading(false);
      }
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

  // Cargar fases cuando se seleccionen tipos de cultivo
  useEffect(() => {
    const loadPhasesForSelectedCrops = async () => {
      console.log("Loading phases for selected crops:", selectedCropTypes);
      
      if (selectedCropTypes.length > 0) {
        try {
          setLoadingCropData(true);
          const newPhasesByCropType: {[key: string]: any[]} = {};

          // Cargar fases para cada tipo de cultivo seleccionado
          for (const cropType of selectedCropTypes) {
            try {
              console.log(`Loading phases for crop type: ${cropType.name} (${cropType.id})`);
              const phasesResponse = await getCultivationPhasesByCropId(cropType.id);
              let phasesData = [];
              
              if (phasesResponse?.data) {
                phasesData = phasesResponse.data;
              } else if (phasesResponse && Array.isArray(phasesResponse)) {
                phasesData = phasesResponse;
              }

              console.log(`Loaded ${phasesData.length} phases for ${cropType.name}`);
              newPhasesByCropType[cropType.id] = phasesData;
            } catch (error) {
              console.warn(`Error loading phases for crop ${cropType.name}:`, error);
              newPhasesByCropType[cropType.id] = []; // Array vacío si falla
            }
          }

          console.log("All phases loaded:", newPhasesByCropType);
          setPhasesByCropType(newPhasesByCropType);
          const validPhaseIds = Object.values(newPhasesByCropType)
            .flat()
            .map(phase => phase.id);
          
          console.log("Valid phase IDs for selected crop types:", validPhaseIds);
          console.log("Current selected phase IDs:", formData.phaseIds);
          
          // Solo filtrar si hay fases seleccionadas que ya no son válidas
          setFormData(prev => {
            const filteredPhaseIds = prev.phaseIds.filter(phaseId => 
              validPhaseIds.includes(phaseId)
            );
            
            if (filteredPhaseIds.length !== prev.phaseIds.length) {
              console.log("Filtered out invalid phases:", 
                prev.phaseIds.filter(phaseId => !validPhaseIds.includes(phaseId)));
              setHasChanges(true); // Marcar como cambio si se filtran fases
            }
            
            return {
              ...prev,
              phaseIds: filteredPhaseIds
            };
          });
          
        } catch (error) {
          console.error("Error loading phases for selected crops:", error);
        } finally {
          setLoadingCropData(false);
        }
      } else {
        console.log("No crop types selected, clearing phases but preserving selected phases");
        setPhasesByCropType({});
      }
    };

    loadPhasesForSelectedCrops();
  }, [selectedCropTypes]); 

  // Nuevo useEffect para debug de cambios en phaseIds
  useEffect(() => {
    console.log("formData.phaseIds changed:", formData.phaseIds);
  }, [formData.phaseIds]);

  // Nuevo useEffect para debug de cambios en selectedCropTypes
  useEffect(() => {
    console.log("selectedCropTypes changed:", selectedCropTypes.map(ct => ({id: ct.id, name: ct.name})));
  }, [selectedCropTypes]);

  // Función actualizada para cargar datos de la finca
  const loadFarmData = async (countriesData?: any[], cropTypesData?: any[]) => {
    try {
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
        phaseIds: [], // Lo llenaremos después con los datos reales
      });

      // Cargar ubicación actual si existe
      if (farmData.countryId) {
        await loadExistingLocation(farmData, countriesData || countries);
      }

      // ✅ Cargar tipos de cultivo actuales - MEJORADO con fallback consistente
      let currentCropTypes = [];
      if (farmData.cropTypesInfo && Array.isArray(farmData.cropTypesInfo)) {
        currentCropTypes = farmData.cropTypesInfo;
        console.log("Using cropTypesInfo:", currentCropTypes);
      } else if (farmData.cropTypes && Array.isArray(farmData.cropTypes)) {
        currentCropTypes = farmData.cropTypes.map((ct: any) => 
          ct.cropType || ct
        );
        console.log("Using cropTypes:", currentCropTypes);
      }

      // ✅ Fusionar tipos de cultivo de la finca con los disponibles para asegurar que estén todos
      if (cropTypesData && cropTypesData.length > 0) {
        const mergedTypes = [...cropTypesData];
        
        currentCropTypes.forEach((farmType: any) => {
          if (!mergedTypes.find(type => type.id === farmType.id)) {
            console.log(`Adding missing crop type from farm: ${farmType.name}`);
            mergedTypes.push(farmType);
          }
        });
        
        setAvailableCropTypes(mergedTypes);
        console.log(`Total available crop types: ${mergedTypes.length}`);
      } else if (currentCropTypes.length > 0) {
        // Si no tenemos tipos disponibles pero la finca tiene algunos, usarlos como base
        console.log("Using farm crop types as available types fallback");
        setAvailableCropTypes(currentCropTypes);
      }

      setSelectedCropTypes(currentCropTypes);

      // ✅ Cargar fases actuales - MEJORADO con mejor logging
      let currentPhaseIds = [];
      if (farmData.activePhasesInfo && Array.isArray(farmData.activePhasesInfo)) {
        currentPhaseIds = farmData.activePhasesInfo.map((phase: any) => phase.id);
        console.log("Using activePhasesInfo for phase IDs:", currentPhaseIds);
        console.log("activePhasesInfo details:", farmData.activePhasesInfo.map(p => ({id: p.id, name: p.name})));
      } else if (farmData.phases && Array.isArray(farmData.phases)) {
        currentPhaseIds = farmData.phases.map((p: any) => {
          // Manejar diferentes estructuras de datos
          if (p.cultivationPhase?.id) return p.cultivationPhase.id;
          if (p.phaseId) return p.phaseId;
          if (p.id) return p.id;
          return null;
        }).filter(Boolean);
        console.log("Using phases for phase IDs:", currentPhaseIds);
        console.log("phases details:", farmData.phases);
      }
      
      console.log("Final currentPhaseIds to set:", currentPhaseIds);
      
      // ✅ Actualizar el formData con las fases reales DESPUÉS de configurar todo lo demás
      setFormData(prev => {
        const updatedData = {
          ...prev,
          phaseIds: currentPhaseIds
        };
        console.log("Setting formData.phaseIds to:", updatedData.phaseIds);
        return updatedData;
      });

    } catch (error) {
      console.error("Error loading farm:", error);
      Alert.alert("Error", "No se pudo cargar la información de la finca", [
        { text: "Volver", onPress: () => navigation.goBack() },
      ]);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prevData) => ({
      ...prevData,
      [field]: value,
    }));
    setHasChanges(true);
  };

  const handleLocationSelect = async (type: string, item: any) => {
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

  const handleCropTypeToggle = (cropType: any) => {
    console.log("Toggling crop type:", cropType.name, cropType.id);
    setHasChanges(true);
    setSelectedCropTypes(prev => {
      const isSelected = prev.some(ct => ct.id === cropType.id);
      const newSelection = isSelected 
        ? prev.filter(ct => ct.id !== cropType.id)
        : [...prev, cropType];
      
      console.log(`Crop type ${cropType.name} ${isSelected ? 'removed' : 'added'}`);
      console.log("New crop types selection:", newSelection.map(ct => ct.name));
      
      return newSelection;
    });
  };

// Manejar selección de fases
const togglePhase = (phaseId: string) => {
  console.log("Toggling phase:", phaseId);
  setHasChanges(true);
  setFormData(prev => {
    const wasSelected = prev.phaseIds.includes(phaseId);
    const newPhaseIds = wasSelected
      ? prev.phaseIds.filter(id => id !== phaseId)
      : [...prev.phaseIds, phaseId];
    
    console.log(`Phase ${phaseId} ${wasSelected ? 'removed' : 'added'}. New phases:`, newPhaseIds);
    
    return {
      ...prev,
      phaseIds: newPhaseIds
    };
  });
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
      if (!selectedCropTypes || selectedCropTypes.length === 0) {
        newErrors.cropTypes = "Debe seleccionar al menos un tipo de cultivo.";
      }

      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        setSaving(false);
        return;
      }

      const updatedFarmData = {
        ...formData,
        countryId: selectedCountry?.id,
        departmentId: selectedDepartment?.id,
        municipalityId: selectedMunicipality?.id,
        villageId: selectedVillage?.id,
        specificLocation: formData.specificLocation.trim(),
        cropTypeIds: selectedCropTypes.map(ct => ct.id),
        phaseIds: formData.phaseIds, // Enviar array de IDs de fases seleccionadas
        size: Number(formData.size),
        plantCount: Number(formData.plantCount),
        status: formData.status
      };

      console.log("Saving farm with data:", updatedFarmData);

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
      
      const countryId = farmData.countryId || farmData.country?.id;
      const departmentId = farmData.departmentId || farmData.department?.id;
      const municipalityId = farmData.cityId || farmData.municipalityId || farmData.city?.id || farmData.municipality?.id;
      const villageId = farmData.villageId || farmData.village?.id;

      if (!countryId) return;

      const countryOption = countriesData.find((c) => c.id === countryId);
      if (!countryOption) return;

      setSelectedCountry(countryOption);

      if (departmentId) {
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

          if (municipalityId) {
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

              if (villageId) {
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

  const loadDepartments = async (countryId: string) => {
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

  const CropTypesModal = () => (
    <Modal
      animationType="slide"
      transparent
      visible={showCropTypesModal}
      onRequestClose={() => setShowCropTypesModal(false)}>
      <View style={styles.modalOverlay}>
        <View style={styles.locationModalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Seleccionar Tipos de Cultivo</Text>
            <TouchableOpacity 
              onPress={() => setShowCropTypesModal(false)} 
              style={styles.modalCloseButton}>
              <Icon name="close" size={20} color={COLORS.text.secondary} />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalList} showsVerticalScrollIndicator={false}>
            {availableCropTypes && availableCropTypes.length > 0 ? (
              availableCropTypes.map((cropType) => {
                const isSelected = selectedCropTypes.some(ct => ct.id === cropType.id);
                return (
                  <TouchableOpacity
                    key={cropType.id}
                    style={[styles.modalItem, isSelected && styles.selectedModalItem]}
                    onPress={() => handleCropTypeToggle(cropType)}
                    activeOpacity={0.7}>
                    <View style={styles.modalItemContent}>
                      <Icon 
                        name="eco" 
                        size={20} 
                        color={isSelected ? COLORS.success : COLORS.text.secondary} 
                      />
                      <Text style={[
                        styles.modalItemText, 
                        isSelected && styles.selectedModalItemText
                      ]}>
                        {cropType.name}
                      </Text>
                    </View>
                    {isSelected && (
                      <Icon name="check" size={20} color={COLORS.success} />
                    )}
                  </TouchableOpacity>
                );
              })
            ) : (
              <View style={styles.emptyState}>
                <Icon name="eco" size={48} color={COLORS.text.tertiary} />
                <Text style={styles.emptyStateText}>No hay tipos de cultivo disponibles</Text>
                <TouchableOpacity 
                  style={styles.retryButton}
                  onPress={loadCropTypes}>
                  <Icon name="refresh" size={20} color={COLORS.primary} />
                  <Text style={styles.retryButtonText}>Reintentar</Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.modalConfirmButton}
              onPress={() => setShowCropTypesModal(false)}>
              <Text style={styles.modalConfirmButtonText}>
                Confirmar ({selectedCropTypes.length} seleccionados)
              </Text>
            </TouchableOpacity>
          </View>
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

            {/* Sección de Tipos de Cultivo y Fases - Editable */}
            <View style={styles.card}>
              <View style={styles.sectionHeader}>
                <Icon name="eco" size={24} color={COLORS.success} />
                <Text style={styles.sectionTitle}>Cultivos y Fases</Text>
                {!isEditingCrops && (
                  <TouchableOpacity
                    style={styles.editButton}
                    onPress={() => setIsEditingCrops(true)}>
                    <Icon name="edit" size={18} color={COLORS.primary} />
                  </TouchableOpacity>
                )}
              </View>

              {errors.cropTypes && (
                <Text style={styles.errorText}>{errors.cropTypes}</Text>
              )}

              {!isEditingCrops ? (
                // Vista de solo lectura
                <View style={styles.cropsView}>
                  {/* Tipos de Cultivo */}
                  <View style={styles.subsection}>
                    <Text style={styles.subsectionTitle}>Tipos de Cultivo</Text>
                    {selectedCropTypes && selectedCropTypes.length > 0 ? (
                      selectedCropTypes.map((cropType, index) => (
                        <View key={cropType.id || index} style={styles.infoItem}>
                          <Icon name="grass" size={20} color={COLORS.success} />
                          <Text style={styles.infoText}>{cropType.name}</Text>
                        </View>
                      ))
                    ) : (
                      <Text style={styles.emptyStateText}>No hay tipos de cultivo seleccionados</Text>
                    )}
                  </View>

                  {/* Fases Seleccionadas - MEJORADO */}
                  <View style={styles.subsection}>
                    <Text style={styles.subsectionTitle}>Fases Activas</Text>
                    {formData.phaseIds.length > 0 ? (
                      <>
                        {/* Mostrar fases agrupadas por tipo de cultivo si tenemos esa info */}
                        {farm?.activePhasesInfo && farm.activePhasesInfo.length > 0 ? (
                          farm.activePhasesInfo.map((phase: any, index: number) => (
                            <View key={phase.id || index} style={styles.infoItem}>
                              <Icon name="schedule" size={20} color={COLORS.tertiary} />
                              <View style={styles.phaseInfo}>
                                <Text style={styles.infoText}>{phase.name}</Text>
                                {phase.cropType && (
                                  <Text style={styles.phaseSubText}>
                                    Cultivo: {phase.cropType.name}
                                  </Text>
                                )}
                              </View>
                            </View>
                          ))
                        ) : (
                          <View style={styles.selectedPhasesInfo}>
                            <Icon name="info" size={16} color="#6b7280" />
                            <Text style={styles.selectedPhasesText}>
                              {formData.phaseIds.length}{" "}
                              {formData.phaseIds.length === 1 ? "fase seleccionada" : "fases seleccionadas"}
                            </Text>
                          </View>
                        )}
                      </>
                    ) : (
                      <Text style={styles.emptyStateText}>No hay fases seleccionadas</Text>
                    )}
                  </View>
                </View>
              ) : (
                // Vista de edición
                <>
                  {/* Selector de Tipos de Cultivo */}
                  <TouchableOpacity
                    style={styles.selectButton}
                    onPress={() => setShowCropTypesModal(true)}>
                    <View style={styles.selectButtonContent}>
                      <Icon name="eco" size={20} color={COLORS.text.secondary} />
                      <View style={styles.selectButtonText}>
                        <Text style={styles.selectLabel}>Tipos de Cultivo *</Text>
                        <Text style={styles.selectValue}>
                          {selectedCropTypes.length > 0 
                            ? `${selectedCropTypes.length} tipo(s) seleccionado(s)`
                            : "Seleccionar tipos de cultivo"
                          }
                        </Text>
                      </View>
                    </View>
                    <Icon
                      name="chevron-right"
                      size={20}
                      color={COLORS.text.tertiary}
                    />
                  </TouchableOpacity>

                  {/* Mostrar tipos seleccionados */}
                  {selectedCropTypes.length > 0 && (
                    <View style={styles.selectedItemsContainer}>
                      {selectedCropTypes.map((cropType, index) => (
                        <View key={cropType.id || index} style={styles.selectedTag}>
                          <Icon name="grass" size={16} color={COLORS.success} />
                          <Text style={styles.selectedTagText}>{cropType.name}</Text>
                          <TouchableOpacity
                            onPress={() => handleCropTypeToggle(cropType)}
                            style={styles.removeTagButton}>
                            <Icon name="close" size={14} color={COLORS.text.tertiary} />
                          </TouchableOpacity>
                        </View>
                      ))}
                    </View>
                  )}

                  {/* Selector de Fases por Tipo de Cultivo */}
                  {selectedCropTypes.length > 0 && (
                    <View style={styles.phasesSelectorContainer}>
                      <View style={styles.sectionHeader}>
                        <Icon name="timeline" size={20} color="#284F66" />
                        <Text style={styles.sectionTitle}>Fases de Cultivo</Text>
                      </View>
                      <Text style={styles.phasesSubtitle}>
                        Selecciona las fases para cada tipo de cultivo
                      </Text>

                      {loadingCropData ? (
                        <View style={styles.loadingModalState}>
                          <ActivityIndicator size="large" color={COLORS.primary} />
                          <Text style={styles.loadingModalText}>Cargando fases...</Text>
                        </View>
                      ) : (
                        <>
                          {Object.entries(phasesByCropType).map(
                            ([cropTypeId, phases], cropIndex) => {
                              const cropType = selectedCropTypes.find((ct) => ct.id === cropTypeId);
                              const cropColor = cropTypeColors[cropIndex % cropTypeColors.length];
                              
                              // ✅ Debug logging para verificar el estado
                              console.log(`Rendering phases for crop ${cropType?.name}:`, {
                                cropTypeId,
                                phasesCount: phases.length,
                                selectedPhases: formData.phaseIds.filter(phaseId => 
                                  phases.some(phase => phase.id === phaseId)
                                )
                              });
                              
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
                                      
                                      // ✅ Debug para cada fase
                                      if (cropIndex === 0 && phases.indexOf(phase) === 0) {
                                        console.log(`Phase ${phase.name} (${phase.id}) selected:`, isSelected);
                                        console.log("Current formData.phaseIds:", formData.phaseIds);
                                      }
                                      
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
                            {/* ✅ Botón de debug para limpiar fases */}
                            <TouchableOpacity
                              style={styles.debugButton}
                              onPress={() => {
                                console.log("Manual clear phases button pressed");
                                setFormData(prev => ({
                                  ...prev,
                                  phaseIds: []
                                }));
                                setHasChanges(true);
                              }}>
                              <Text style={styles.debugButtonText}>Limpiar</Text>
                            </TouchableOpacity>
                          </View>
                        </>
                      )}
                    </View>
                  )}

                  <View style={styles.editButtonsContainer}>
                    <TouchableOpacity
                      style={[styles.editActionButton, styles.cancelEditButton]}
                      onPress={() => setIsEditingCrops(false)}>
                      <Text style={styles.cancelEditButtonText}>Cancelar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.editActionButton, styles.confirmEditButton]}
                      onPress={() => {
                        setIsEditingCrops(false);
                        setHasChanges(true);
                      }}>
                      <Text style={styles.editButtonText}>Confirmar</Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </View>

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

        <CropTypesModal />
        <ConfirmExitModal />
      </KeyboardAvoidingView>
      <CustomTabBar
        navigation={navigation}
        currentRoute="EditTerrain"
      />
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
  cropsView: {
    marginTop: 8,
  },
  // Nuevos estilos para el selector de fases
  phasesSelectorContainer: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: COLORS.border.light,
  },
  phasesSubtitle: {
    fontSize: 14,
    color: COLORS.text.secondary,
    marginBottom: 16,
    marginTop: -8,
  },
  cropPhaseGroup: {
    marginBottom: 20,
  },
  cropTypeHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  cropTypeIndicator: {
    width: 4,
    height: 20,
    borderRadius: 2,
    marginRight: 8,
  },
  cropTypeName: {
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
    flex: 1,
  },
  phaseCount: {
    fontSize: 12,
    color: COLORS.text.secondary,
    backgroundColor: COLORS.background.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  phasesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  phaseChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    backgroundColor: COLORS.background.secondary,
    marginBottom: 8,
  },
  selectedPhaseChip: {
    borderWidth: 2,
  },
  phaseChipText: {
    fontSize: 12,
    fontWeight: "500",
    marginLeft: 6,
  },
  phaseInfo: {
    flex: 1,
    marginLeft: 12,
  },
  phaseSubText: {
    fontSize: 12,
    color: COLORS.text.secondary,
    marginTop: 2,
  },
  selectedPhasesInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 16,
    padding: 12,
    backgroundColor: COLORS.background.primary,
    borderRadius: 8,
  },
  selectedPhasesText: {
    fontSize: 14,
    color: COLORS.text.secondary,
    marginLeft: 8,
    flex: 1,
  },
  // ✅ Estilos para el botón de debug
  debugButton: {
    backgroundColor: COLORS.warning,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginLeft: 8,
  },
  debugButtonText: {
    fontSize: 12,
    color: COLORS.text.white,
    fontWeight: "600",
  },
  selectedModalItem: {
    backgroundColor: COLORS.primaryLight,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primary,
  },
  selectedModalItemText: {
    fontWeight: "600",
    color: COLORS.primary,
  },
  modalItemContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  modalFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: COLORS.border.light,
  },
  modalConfirmButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  modalConfirmButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.text.white,
  },
  selectedItemsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 12,
    gap: 8,
  },
  selectedTag: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.successLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.success,
  },
  selectedTagText: {
    fontSize: 12,
    color: COLORS.text.primary,
    marginLeft: 6,
    marginRight: 4,
  },
  removeTagButton: {
    padding: 2,
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
    marginLeft: 8,
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
  // ✅ Nuevo estilo para el botón de reintento
  retryButton: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: COLORS.primaryLight,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: "600",
    marginLeft: 8,
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