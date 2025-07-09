import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  Platform,
  KeyboardAvoidingView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/MaterialIcons";
import ScreenLayout from "../../components/ScreenLayout";
import { useAuth } from "../../context/AuthContext";
import ApiClient from "../../utils/api";
import { getUserData } from "../../services/userService";
import CustomDatePicker from "../../components/CustomDatePicker";
import { getFarmByemployerId } from "../../services/farmService";
import { editJobOfferById, getJobOfferById } from "../../services/jobOffers";
import CustomTabBar from "../../components/CustomTabBar";
import EnhancedFarmInfoCard from "./EnhancedFarmInfoCard";

const PRIMARY_COLOR = "#284F66";
const SECONDARY_COLOR = "#4A7C94";

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
  accent: "#667EEA",
  info: "#3B82F6",
};

const EditJobOfferScreen = ({ navigation, route }) => {
  const { jobOfferId } = route.params;
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [farms, setFarms] = useState([]);
  const [loadingFarmInfo, setLoadingFarmInfo] = useState(false);
  const [originalJobOffer, setOriginalJobOffer] = useState(null);

  // Estados para los datos originales que no se pueden cambiar
  const [originalFarmInfo, setOriginalFarmInfo] = useState(null);
  const [originalCropType, setOriginalCropType] = useState(null);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    farmId: "",
    cropTypeId: "",
    phaseId: "",
    startDate: new Date(),
    endDate: new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000),
    duration: "",
    salary: "",
    requirements: "",
    paymentType: "Por_dia",
    paymentMode: "Efectivo",
    laborType: "",
    pricePerUnit: "",
    plantCount: "",
    workType: "",
    workersNeeded: "1",
    includesFood: false,
    includesLodging: false,
    status: "Activo",
  });

  const [selectedFarmInfo, setSelectedFarmInfo] = useState(null);
  const [farmCropTypes, setFarmCropTypes] = useState([]);
  const [availablePhasesForSelectedCrop, setAvailablePhasesForSelectedCrop] = useState([]);

  const calculateDaysBetweenDates = (startDate, endDate) => {
    const oneDay = 24 * 60 * 60 * 1000;
    const start = new Date(startDate);
    const end = new Date(endDate);
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);
    const diffDays = Math.round(Math.abs((end - start) / oneDay)) + 1;
    return diffDays.toString();
  };

  const calculateTotalSalary = () => {
    if (
      formData.paymentType === "Por_labor" &&
      formData.plantCount &&
      formData.pricePerUnit
    ) {
      const total =
        parseFloat(formData.plantCount) * parseFloat(formData.pricePerUnit);
      return isNaN(total) ? 0 : total;
    }
    return parseFloat(formData.salary) || 0;
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (formData.startDate && formData.endDate) {
      const initialDuration = calculateDaysBetweenDates(
        formData.startDate,
        formData.endDate
      );
      setFormData((prev) => ({ ...prev, duration: initialDuration }));
    }
  }, [formData.startDate, formData.endDate]);

  // Función mejorada para obtener fases del cultivo específico desde el backend
  const fetchPhasesForCropType = async (cropTypeId) => {
    try {
      console.log("🔍 Consultando fases del backend para cropType:", cropTypeId);
      const response = await ApiClient.get(`/phase/by-crop/${cropTypeId}`);

      console.log("📡 Respuesta completa del backend:", response);

      const phasesData = response.data?.data || response.data;

      if (phasesData && Array.isArray(phasesData)) {
        const phases = phasesData.map((phase) => ({
          id: phase.id,
          cultivationPhaseId: phase.id,
          name: phase.name,
          description: phase.description || "",
          estimatedDuration: phase.duration || null,
          order: phase.order || null,
          isActive: true,
          cropType: phase.cropType,
          source: "backend-api",
        }));

        console.log("✅ Fases obtenidas del backend:", phases);
        return phases;
      }

      return [];
    } catch (error) {
      console.error("❌ Error consultando fases del backend:", error);
      if (error.response) {
        console.error("📄 Error response:", error.response.data);
        console.error("🔢 Error status:", error.response.status);
      }
      return [];
    }
  };

  // Función mejorada para extraer tipos de cultivo de una finca
  const extractAllCropTypesFromFarm = (selectedFarm) => {
    console.log("🌾 Extrayendo tipos de cultivo de la finca:", selectedFarm.name);
    console.log("🔍 Estructura de la finca:", {
      cropTypesInfo: selectedFarm.cropTypesInfo ? selectedFarm.cropTypesInfo.length : "undefined",
      cropTypes: selectedFarm.cropTypes ? selectedFarm.cropTypes.length : "undefined",
      activePhasesInfo: selectedFarm.activePhasesInfo ? selectedFarm.activePhasesInfo.length : "undefined",
    });

    const cropTypes = [];

    // Opción 1: cropTypesInfo (más completa)
    if (selectedFarm.cropTypesInfo && Array.isArray(selectedFarm.cropTypesInfo)) {
      console.log("📋 Usando cropTypesInfo");
      selectedFarm.cropTypesInfo.forEach((cropTypeInfo) => {
        if (cropTypeInfo && cropTypeInfo.id) {
          cropTypes.push({
            id: cropTypeInfo.id,
            name: cropTypeInfo.name,
            phases: cropTypeInfo.phases || [],
            phasesCount: cropTypeInfo.phases ? cropTypeInfo.phases.length : 0,
          });
        }
      });
    }

    // Opción 2: cropTypes con estructura diferente
    if (cropTypes.length === 0 && selectedFarm.cropTypes && Array.isArray(selectedFarm.cropTypes)) {
      console.log("📋 Usando cropTypes");
      selectedFarm.cropTypes.forEach((cropTypeData) => {
        const cropType = cropTypeData.cropType || cropTypeData;
        if (cropType && cropType.id) {
          const existingCropType = cropTypes.find((ct) => ct.id === cropType.id);
          if (!existingCropType) {
            cropTypes.push({
              id: cropType.id,
              name: cropType.name,
              phases: cropType.phases || cropTypeData.phases || [],
              phasesCount: (cropType.phases || cropTypeData.phases || []).length,
            });
          }
        }
      });
    }

    console.log("✅ Tipos de cultivo extraídos:", cropTypes);
    return cropTypes;
  };

  const loadInitialData = async () => {
    setLoading(true);
    try {
      console.log("🚀 Iniciando carga de datos...");
      
      // Cargar la oferta existente y las fincas en paralelo
      const [jobOfferData, farmsData] = await Promise.all([
        loadJobOffer(),
        loadFarms(),
      ]);

      if (jobOfferData) {
        await populateFormWithJobOffer(jobOfferData, farmsData);
      }
    } catch (error) {
      console.error("❌ Error cargando datos iniciales:", error);
      setError("Error al cargar los datos de la oferta");
      Alert.alert("Error", "No se pudieron cargar los datos de la oferta", [
        {
          text: "Volver",
          onPress: () => navigation.goBack(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const loadJobOffer = async () => {
    try {
      console.log("📄 Cargando oferta con ID:", jobOfferId);
      const jobOfferData = await getJobOfferById(jobOfferId);

      if (!jobOfferData) {
        throw new Error("No se encontró la oferta de trabajo");
      }

      console.log("📄 Oferta cargada:", {
        title: jobOfferData.title,
        farmId: jobOfferData.farmId || jobOfferData.farm?.id,
        cropTypeId: jobOfferData.cropTypeId || jobOfferData.cropType?.id,
        phaseId: jobOfferData.phaseId || jobOfferData.phase?.id,
        phase: jobOfferData.phase,
        cropType: jobOfferData.cropType,
        farm: jobOfferData.farm,
      });

      setOriginalJobOffer(jobOfferData);
      return jobOfferData;
    } catch (error) {
      console.error("❌ Error cargando oferta:", error);
      throw error;
    }
  };

  const loadFarms = async () => {
    try {
      console.log("🏡 Cargando fincas...");
      const userData = await getUserData();
      if (!userData || !userData.employerProfile) {
        throw new Error("No se encontró el perfil de empleador");
      }

      const farmsResult = await getFarmByemployerId(userData.employerProfile.id);
      const farmsData = Array.isArray(farmsResult)
        ? farmsResult
        : farmsResult.data && Array.isArray(farmsResult.data)
        ? farmsResult.data
        : [];

      if (!farmsData || farmsData.length === 0) {
        setError("No tienes fincas registradas.");
        setFarms([]);
      } else {
        console.log("🏡 Fincas cargadas:", farmsData.length);
        setFarms(farmsData);
      }

      return farmsData;
    } catch (error) {
      console.error("❌ Error cargando fincas:", error);
      throw error;
    }
  };

  // Función corregida para poblar el formulario
  const populateFormWithJobOffer = async (jobOffer, farmsData) => {
    try {
      console.log("📝 Poblando formulario con oferta:", jobOffer.title);

      // Convertir fechas
      const startDate = jobOffer.startDate ? new Date(jobOffer.startDate) : new Date();
      const endDate = jobOffer.endDate ? new Date(jobOffer.endDate) : new Date();

      // Obtener IDs de la oferta con múltiples fallbacks
      const originalFarmId = jobOffer.farmId || jobOffer.farm?.id || "";
      const originalCropTypeId = jobOffer.cropTypeId || jobOffer.cropType?.id || "";
      
      // Para el phaseId, intentar múltiples fuentes
      let phaseIdToUse = "";
      if (jobOffer.phaseId) {
        phaseIdToUse = jobOffer.phaseId;
      } else if (jobOffer.phase?.id) {
        phaseIdToUse = jobOffer.phase.id;
      } else if (jobOffer.phase?.cultivationPhaseId) {
        phaseIdToUse = jobOffer.phase.cultivationPhaseId;
      }

      console.log("🔍 IDs extraídos:", {
        farmId: originalFarmId,
        cropTypeId: originalCropTypeId,
        phaseId: phaseIdToUse,
        phaseObject: jobOffer.phase,
        cropTypeObject: jobOffer.cropType,
      });

      // Buscar la finca original
      const originalFarm = farmsData.find((farm) => farm.id === originalFarmId);
      if (!originalFarm) {
        throw new Error(`No se encontró la finca con ID: ${originalFarmId}`);
      }

      console.log("🏡 Finca original encontrada:", originalFarm.name);
      setOriginalFarmInfo(originalFarm);

      // Extraer tipos de cultivo de la finca original
      const cropTypesFromFarm = extractAllCropTypesFromFarm(originalFarm);
      setFarmCropTypes(cropTypesFromFarm);

      // Buscar el tipo de cultivo original
      let originalCrop = cropTypesFromFarm.find((ct) => ct.id === originalCropTypeId);
      
      // Si no se encuentra en la finca, crear uno con la información de la oferta
      if (!originalCrop && jobOffer.cropType) {
        console.log("⚠️ Cultivo no encontrado en finca, usando datos de la oferta");
        originalCrop = {
          id: originalCropTypeId,
          name: jobOffer.cropType.name || "Cultivo desconocido",
          phases: [],
          phasesCount: 0,
        };
        cropTypesFromFarm.push(originalCrop);
        setFarmCropTypes(cropTypesFromFarm);
      }

      if (originalCrop) {
        console.log("🌾 Tipo de cultivo original:", originalCrop.name);
        setOriginalCropType(originalCrop);
      } else {
        console.error("❌ No se pudo identificar el tipo de cultivo original");
      }

      // Establecer datos del formulario
      const newFormData = {
        title: jobOffer.title || "",
        description: jobOffer.description || "",
        farmId: originalFarmId,
        cropTypeId: originalCropTypeId,
        phaseId: phaseIdToUse,
        startDate: startDate,
        endDate: endDate,
        duration: jobOffer.duration?.toString() || "",
        salary: jobOffer.salary?.toString() || "",
        requirements: jobOffer.requirements || "",
        paymentType: jobOffer.paymentType || "Por_dia",
        paymentMode: jobOffer.paymentMode || "Efectivo",
        laborType: jobOffer.laborType || "",
        pricePerUnit: jobOffer.pricePerUnit?.toString() || "",
        plantCount: jobOffer.plantCount?.toString() || "",
        workType: jobOffer.workType || "",
        workersNeeded: jobOffer.workersNeeded?.toString() || "1",
        includesFood: jobOffer.includesFood || false,
        includesLodging: jobOffer.includesLodging || false,
        status: jobOffer.status || "Activo",
      };

      setFormData(newFormData);

      // Establecer información de la finca para el componente de visualización
      setSelectedFarmInfo({
        ...originalFarm,
        name: originalFarm.name,
        village: getLocationValueForFarm("village", originalFarm),
        city: getLocationValueForFarm("city", originalFarm),
        department: getLocationValueForFarm("department", originalFarm),
        country: getLocationValueForFarm("country", originalFarm),
        plantCount: originalFarm.plantCount || 0,
        size: originalFarm.size || 0,
        totalCropTypes: cropTypesFromFarm.length,
      });

      // Cargar fases para el cultivo original
      if (originalCropTypeId) {
        await loadPhasesForCropType(originalCropTypeId, phaseIdToUse);
      }

      console.log("✅ Formulario poblado exitosamente");
    } catch (error) {
      console.error("❌ Error poblando formulario:", error);
      throw error;
    }
  };

  // Función corregida para cargar fases del cultivo
  const loadPhasesForCropType = async (cropTypeId, initialPhaseId = null) => {
    if (!cropTypeId) {
      setAvailablePhasesForSelectedCrop([]);
      return;
    }

    try {
      setLoadingFarmInfo(true);
      console.log("🔄 Cargando fases para cultivo:", cropTypeId);

      let phases = [];

      // PRIORIDAD 1: Intentar obtener fases específicas del cultivo desde el backend
      try {
        phases = await fetchPhasesForCropType(cropTypeId);
        console.log("📡 Fases del backend:", phases.length);
      } catch (error) {
        console.warn("⚠️ Error obteniendo fases del backend, usando fases de la finca");
      }

      // PRIORIDAD 2: Si el backend no devuelve fases, usar las fases de la finca
      if (phases.length === 0 && originalFarmInfo) {
        console.log("🏡 Usando fases de la finca");

        // Intentar desde activePhasesInfo
        if (originalFarmInfo.activePhasesInfo && originalFarmInfo.activePhasesInfo.length > 0) {
          phases = originalFarmInfo.activePhasesInfo.map((activePhase) => ({
            id: activePhase.farmPhaseId || activePhase.id,
            cultivationPhaseId: activePhase.cultivationPhaseId || activePhase.id,
            name: activePhase.name,
            description: activePhase.description || "",
            estimatedDuration: activePhase.duration || null,
            order: activePhase.order || null,
            isActive: activePhase.isActive,
            source: "farm-active-phases",
          }));
          console.log("📋 Fases desde activePhasesInfo:", phases.length);
        }

        // Fallback: fases generales de la finca
        if (phases.length === 0 && originalFarmInfo.phases && originalFarmInfo.phases.length > 0) {
          phases = originalFarmInfo.phases.map((phase) => ({
            id: phase.id,
            cultivationPhaseId: phase.id,
            name: phase.name,
            description: phase.description || "",
            estimatedDuration: phase.duration || null,
            order: phase.order || null,
            isActive: true,
            source: "farm-general-phases",
          }));
          console.log("📋 Fases desde phases generales:", phases.length);
        }
      }

      // PRIORIDAD 3: Si aún no hay fases, crear una fase por defecto si tenemos información de la oferta original
      if (phases.length === 0 && originalJobOffer && originalJobOffer.phase) {
        console.log("🆘 Creando fase por defecto desde oferta original");
        phases = [{
          id: originalJobOffer.phase.id || originalJobOffer.phaseId,
          cultivationPhaseId: originalJobOffer.phase.cultivationPhaseId || originalJobOffer.phase.id,
          name: originalJobOffer.phase.name || "Fase actual",
          description: originalJobOffer.phase.description || "",
          estimatedDuration: originalJobOffer.phase.duration || null,
          order: originalJobOffer.phase.order || null,
          isActive: true,
          source: "original-job-offer",
        }];
      }

      // Ordenar las fases
      if (phases.length > 0) {
        phases = phases
          .filter((phase) => phase.name && phase.name.trim() !== "")
          .sort((a, b) => {
            if (a.order && b.order) return a.order - b.order;
            const getOrderFromName = (name) => {
              const match = name.match(/(\d+)\./);
              return match ? parseInt(match[1]) : 999;
            };
            return getOrderFromName(a.name) - getOrderFromName(b.name);
          });
      }

      setAvailablePhasesForSelectedCrop(phases);

      console.log("✅ Fases finales cargadas:", {
        total: phases.length,
        source: phases.length > 0 ? phases[0].source : "none",
        names: phases.map(p => p.name),
      });

      // Si tenemos un phaseId inicial, verificar que esté en las fases cargadas
      if (initialPhaseId && phases.length > 0) {
        const foundPhase = phases.find(p => 
          p.id === initialPhaseId || 
          p.cultivationPhaseId === initialPhaseId
        );
        if (foundPhase) {
          console.log("✅ Fase inicial encontrada:", foundPhase.name);
        } else {
          console.warn("⚠️ Fase inicial no encontrada en las fases cargadas");
        }
      }

    } catch (error) {
      console.error("❌ Error en loadPhasesForCropType:", error);
      setAvailablePhasesForSelectedCrop([]);
    } finally {
      setLoadingFarmInfo(false);
    }
  };

  // Función mejorada para manejar selección de fases
  const handlePhaseSelection = (phaseId) => {
    console.log("🎯 Seleccionando fase:", phaseId);
    
    if (!phaseId || phaseId === "") {
      setFormData((prev) => ({ ...prev, phaseId: "" }));
      console.log("❌ Fase deseleccionada");
      return;
    }

    // Buscar la fase seleccionada
    const selectedPhase = availablePhasesForSelectedCrop.find((phase) => phase.id === phaseId);
    
    if (selectedPhase) {
      console.log("✅ Fase encontrada:", {
        id: selectedPhase.id,
        cultivationPhaseId: selectedPhase.cultivationPhaseId,
        name: selectedPhase.name,
        source: selectedPhase.source,
      });

      // Para el backend, usar cultivationPhaseId si está disponible, sino usar id
      const backendPhaseId = selectedPhase.cultivationPhaseId || selectedPhase.id;
      
      setFormData((prev) => ({
        ...prev,
        phaseId: backendPhaseId,
      }));

      console.log("✅ Phase ID guardado para backend:", backendPhaseId);
    } else {
      console.warn("⚠️ Fase no encontrada con ID:", phaseId);
    }
  };

  const getLocationValueForFarm = (field, farm) => {
    if (!farm) return "No especificado";

    const directValue = farm[field];
    if (typeof directValue === "string") return directValue;
    if (directValue?.name) return directValue.name;

    const locationValue = farm.locationInfo?.[field];
    if (typeof locationValue === "string") return locationValue;
    if (locationValue?.name) return locationValue.name;

    return "No especificado";
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleDateChange = (date, field) => {
    setFormData((prev) => {
      const updatedForm = {
        ...prev,
        [field]: date,
      };

      if (
        (field === "startDate" || field === "endDate") &&
        updatedForm.startDate &&
        updatedForm.endDate
      ) {
        updatedForm.duration = calculateDaysBetweenDates(
          updatedForm.startDate,
          updatedForm.endDate
        );
      }

      return updatedForm;
    });
  };

  const formatDate = (date) => {
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const validateCurrentStep = () => {
    switch (currentStep) {
      case 1:
        if (!formData.title.trim()) return "El título es requerido";
        if (!formData.description.trim()) return "La descripción es requerida";
        if (!formData.phaseId) return "Debe seleccionar una fase del cultivo";
        break;
      case 2:
        if (!formData.startDate) return "La fecha de inicio es requerida";
        if (!formData.endDate) return "La fecha de finalización es requerida";
        if (formData.endDate < formData.startDate)
          return "La fecha de finalización debe ser posterior a la fecha de inicio";
        break;
      case 3:
        if (!formData.paymentType) return "El tipo de pago es requerido";
        if (!formData.paymentMode) return "El modo de pago es requerido";

        if (
          isNaN(parseFloat(formData.workersNeeded)) ||
          parseFloat(formData.workersNeeded) <= 0
        )
          return "El número de trabajadores debe ser un número positivo";

        if (formData.paymentType === "Por_dia") {
          if (
            isNaN(parseFloat(formData.salary)) ||
            parseFloat(formData.salary) <= 0
          )
            return "El salario diario debe ser un número positivo";
        }

        if (formData.paymentType === "Por_labor") {
          if (!formData.workType.trim())
            return "El tipo de trabajo es requerido";
          if (
            isNaN(parseFloat(formData.plantCount)) ||
            parseFloat(formData.plantCount) <= 0
          )
            return "El número de plantas debe ser un número positivo";
          if (
            isNaN(parseFloat(formData.pricePerUnit)) ||
            parseFloat(formData.pricePerUnit) <= 0
          )
            return "El precio por planta debe ser un número positivo";
        }
        break;
    }
    return null;
  };

  const handleNext = () => {
    const error = validateCurrentStep();
    if (error) {
      Alert.alert("Error", error);
      return;
    }
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else {
      navigation.goBack();
    }
  };

  const handleSubmit = async () => {
    const error = validateCurrentStep();
    if (error) {
      Alert.alert("Error", error);
      return;
    }

    setSubmitting(true);
    try {
      let dataToSend = {
        title: formData.title,
        description: formData.description,
        farmId: formData.farmId,
        cropTypeId: formData.cropTypeId,
        phaseId: formData.phaseId,
        startDate: formData.startDate.toISOString(),
        endDate: formData.endDate.toISOString(),
        duration: String(formData.duration),
        requirements: formData.requirements,
        status: formData.status,
        paymentType: formData.paymentType,
        paymentMode: formData.paymentMode,
        workersNeeded: parseInt(formData.workersNeeded),
        includesFood: formData.includesFood,
        includesLodging: formData.includesLodging,
      };

      if (formData.paymentType === "Por_dia") {
        dataToSend.salary = parseFloat(formData.salary);
        dataToSend.laborType = null;
        dataToSend.pricePerUnit = null;
        dataToSend.plantCount = null;
        dataToSend.workType = null;
      } else if (formData.paymentType === "Por_labor") {
        dataToSend.salary = calculateTotalSalary();
        dataToSend.laborType = formData.laborType || null;
        dataToSend.pricePerUnit = parseFloat(formData.pricePerUnit);
        dataToSend.plantCount = parseInt(formData.plantCount);
        dataToSend.workType = formData.workType;
      }

      console.log("💾 Actualizando oferta con datos:", dataToSend);

      const result = await editJobOfferById(jobOfferId, dataToSend);

      if (result.success !== false) {
        Alert.alert(
          "Éxito",
          "La oferta de trabajo se ha actualizado correctamente",
          [
            {
              text: "OK",
              onPress: () =>
                navigation.navigate("JobOfferDetail", { jobOfferId }),
            },
          ]
        );
      } else {
        throw new Error(
          result.message || "Error al actualizar la oferta de trabajo"
        );
      }
    } catch (error) {
      console.error("❌ Error actualizando la oferta de trabajo:", error);
      Alert.alert(
        "Error",
        error.response?.data?.message ||
          error.message ||
          "No se pudo actualizar la oferta de trabajo"
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Función mejorada para obtener el nombre del cultivo
  const getSelectedCropTypeName = () => {
    if (originalCropType) {
      return originalCropType.name;
    }
    
    // Fallback: buscar en farmCropTypes
    if (formData.cropTypeId && farmCropTypes.length > 0) {
      const foundCrop = farmCropTypes.find(ct => ct.id === formData.cropTypeId);
      if (foundCrop) {
        return foundCrop.name;
      }
    }
    
    // Fallback final: usar datos de la oferta original
    if (originalJobOffer && originalJobOffer.cropType) {
      return originalJobOffer.cropType.name;
    }
    
    return "No especificado";
  };

  // Función mejorada para obtener el nombre de la fase
  const getSelectedPhaseName = () => {
    if (!formData.phaseId) return "No seleccionada";

    console.log("🔍 Obteniendo nombre de fase para ID:", formData.phaseId);
    console.log("📋 Fases disponibles:", availablePhasesForSelectedCrop.length);

    // Buscar en las fases disponibles
    const selectedPhase = availablePhasesForSelectedCrop.find((phase) => {
      return (
        phase.id === formData.phaseId ||
        phase.cultivationPhaseId === formData.phaseId
      );
    });

    if (selectedPhase) {
      const displayName = selectedPhase.order
        ? `${selectedPhase.order}. ${selectedPhase.name}`
        : selectedPhase.name;
      console.log("✅ Fase encontrada:", displayName);
      return displayName;
    }

    // Fallback: buscar en la oferta original
    if (originalJobOffer && originalJobOffer.phase && originalJobOffer.phase.id === formData.phaseId) {
      console.log("📄 Usando fase de oferta original");
      return originalJobOffer.phase.name || "Fase de la oferta";
    }

    console.warn("⚠️ Fase no encontrada para ID:", formData.phaseId);
    return "Fase no encontrada";
  };

  const getWorkTypeName = (workType) => {
    const workTypeNames = {
      Podar: "Podar",
      Injertar: "Injertar",
      Podar_Injertar: "Podar e Injertar",
      Otro: "Otro",
    };
    return workTypeNames[workType] || workType;
  };

  const renderFormStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <View style={styles.formCard}>
            <View style={styles.sectionContainer}>
              <View style={styles.sectionHeader}>
                <Icon name="info" size={20} color={PRIMARY_COLOR} />
                <Text style={styles.sectionTitle}>Información Básica</Text>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Título de la oferta *</Text>
                <View style={styles.inputWrapper}>
                  <Icon
                    name="work"
                    size={20}
                    color={PRIMARY_COLOR}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    value={formData.title}
                    onChangeText={(text) => handleInputChange("title", text)}
                    placeholder="Ej: Se necesita recolector de café"
                    placeholderTextColor="#999"
                  />
                </View>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Descripción *</Text>
                <View style={[styles.inputWrapper, styles.textAreaWrapper]}>
                  <Icon
                    name="description"
                    size={20}
                    color={PRIMARY_COLOR}
                    style={[styles.inputIcon, styles.textAreaIcon]}
                  />
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    value={formData.description}
                    onChangeText={(text) =>
                      handleInputChange("description", text)
                    }
                    placeholder="Describa los detalles de la oferta de trabajo"
                    placeholderTextColor="#999"
                    multiline={true}
                    numberOfLines={4}
                  />
                </View>
              </View>

              {/* Campo de finca - SOLO LECTURA */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Finca asignada</Text>
                <View style={styles.readOnlyInfoCard}>
                  <Icon name="lock" size={16} color="#666" />
                  <View style={styles.readOnlyContent}>
                    <Text style={styles.readOnlyLabel}>
                      No se puede modificar en edición
                    </Text>
                    <Text style={styles.readOnlyValue}>
                      {originalFarmInfo?.name || "Cargando..."}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Campo de cultivo - SOLO LECTURA */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Tipo de cultivo asignado</Text>
                <View style={styles.readOnlyInfoCard}>
                  <Icon name="lock" size={16} color="#666" />
                  <View style={styles.readOnlyContent}>
                    <Text style={styles.readOnlyLabel}>
                      No se puede modificar en edición
                    </Text>
                    <Text style={styles.readOnlyValue}>
                      {getSelectedCropTypeName()}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Selector de fase del cultivo - MODIFICABLE */}
              {availablePhasesForSelectedCrop.length > 0 ? (
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>
                    Seleccione la fase del cultivo *
                  </Text>
                  <Text style={styles.editableHint}>
                    ✏️ Solo este campo se puede modificar
                  </Text>
                  <View style={styles.pickerWrapper}>
                    <Icon
                      name="timeline"
                      size={20}
                      color={PRIMARY_COLOR}
                      style={styles.inputIcon}
                    />
                    <View style={styles.pickerContainer}>
                      <Picker
                        selectedValue={(() => {
                          // Buscar el picker value correcto
                          const phase = availablePhasesForSelectedCrop.find(
                            (p) =>
                              p.id === formData.phaseId ||
                              p.cultivationPhaseId === formData.phaseId
                          );
                          return phase ? phase.id : "";
                        })()}
                        style={styles.picker}
                        onValueChange={handlePhaseSelection}
                        dropdownIconColor={PRIMARY_COLOR}>
                        <Picker.Item label="Seleccione una fase..." value="" />
                        {availablePhasesForSelectedCrop.map((phase) => (
                          <Picker.Item
                            key={phase.id}
                            label={`${phase.order ? `${phase.order}. ` : ""}${phase.name}`}
                            value={phase.id}
                          />
                        ))}
                      </Picker>
                    </View>
                  </View>
                </View>
              ) : (
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Fases del cultivo</Text>
                  <View style={styles.noDataContainer}>
                    <Icon name="warning" size={20} color="#FF9800" />
                    <Text style={styles.noDataText}>
                      {loadingFarmInfo 
                        ? "Cargando fases..." 
                        : "No hay fases disponibles para este cultivo"}
                    </Text>
                  </View>
                </View>
              )}
            </View>
          </View>
        );

      case 2:
        return (
          <View style={styles.formCard}>
            <View style={styles.sectionContainer}>
              <View style={styles.sectionHeader}>
                <Icon name="date-range" size={20} color={PRIMARY_COLOR} />
                <Text style={styles.sectionTitle}>Fechas y Duración</Text>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Fecha de inicio *</Text>
                <View style={styles.datePickerWrapper}>
                  <Icon
                    name="event"
                    size={20}
                    color={PRIMARY_COLOR}
                    style={styles.inputIcon}
                  />
                  <CustomDatePicker
                    date={formData.startDate}
                    onDateChange={(date) => handleDateChange(date, "startDate")}
                    minimumDate={new Date()}
                  />
                </View>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Fecha de finalización *</Text>
                <View style={styles.datePickerWrapper}>
                  <Icon
                    name="event"
                    size={20}
                    color={PRIMARY_COLOR}
                    style={styles.inputIcon}
                  />
                  <CustomDatePicker
                    date={formData.endDate}
                    onDateChange={(date) => handleDateChange(date, "endDate")}
                    minimumDate={new Date()}
                  />
                </View>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Duración aproximada (días)</Text>
                <View style={[styles.inputWrapper, styles.disabledWrapper]}>
                  <Icon
                    name="schedule"
                    size={20}
                    color="#999"
                    style={styles.inputIcon}
                  />
                  <View style={styles.durationContent}>
                    <Text style={styles.durationText}>
                      {formData.duration}{" "}
                      {parseInt(formData.duration) === 1 ? "día" : "días"}
                    </Text>
                    <Text style={styles.calculatedText}>
                      (calculado automáticamente)
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        );

      case 3:
        return (
          <View style={styles.formCard}>
            <View style={styles.sectionContainer}>
              <View style={styles.sectionHeader}>
                <Icon name="payments" size={20} color={PRIMARY_COLOR} />
                <Text style={styles.sectionTitle}>Pago y Requisitos</Text>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>
                  Número de trabajadores necesarios *
                </Text>
                <View style={styles.inputWrapper}>
                  <Icon
                    name="group"
                    size={20}
                    color={PRIMARY_COLOR}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    value={formData.workersNeeded}
                    onChangeText={(text) =>
                      handleInputChange("workersNeeded", text)
                    }
                    placeholder="1"
                    placeholderTextColor="#999"
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Tipo de pago *</Text>
                <View style={styles.pickerWrapper}>
                  <Icon
                    name="attach-money"
                    size={20}
                    color={PRIMARY_COLOR}
                    style={styles.inputIcon}
                  />
                  <View style={styles.pickerContainer}>
                    <Picker
                      selectedValue={formData.paymentType}
                      style={styles.picker}
                      onValueChange={(itemValue) => {
                        handleInputChange("paymentType", itemValue);
                        if (itemValue === "Por_dia") {
                          handleInputChange("workType", "");
                          handleInputChange("plantCount", "");
                          handleInputChange("pricePerUnit", "");
                        } else {
                          handleInputChange("salary", "");
                        }
                      }}
                      dropdownIconColor={PRIMARY_COLOR}>
                      <Picker.Item label="Por Jornal" value="Por_dia" />
                      <Picker.Item label="Por Planta" value="Por_labor" />
                    </Picker>
                  </View>
                </View>
              </View>

              {formData.paymentType === "Por_dia" && (
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Salario diario ($) *</Text>
                  <View style={styles.inputWrapper}>
                    <Icon
                      name="money"
                      size={20}
                      color={PRIMARY_COLOR}
                      style={styles.inputIcon}
                    />
                    <TextInput
                      style={styles.input}
                      value={formData.salary}
                      onChangeText={(text) => handleInputChange("salary", text)}
                      placeholder="0"
                      placeholderTextColor="#999"
                      keyboardType="numeric"
                    />
                  </View>
                </View>
              )}

              {formData.paymentType === "Por_labor" && (
                <>
                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>Tipo de trabajo *</Text>
                    <View style={styles.pickerWrapper}>
                      <Icon
                        name="work-outline"
                        size={20}
                        color={PRIMARY_COLOR}
                        style={styles.inputIcon}
                      />
                      <View style={styles.pickerContainer}>
                        <Picker
                          selectedValue={formData.workType}
                          style={styles.picker}
                          onValueChange={(itemValue) =>
                            handleInputChange("workType", itemValue)
                          }
                          dropdownIconColor={PRIMARY_COLOR}>
                          <Picker.Item
                            label="Seleccione el tipo de trabajo..."
                            value=""
                          />
                          <Picker.Item label="Podar" value="Podar" />
                          <Picker.Item label="Injertar" value="Injertar" />
                          <Picker.Item
                            label="Podar e Injertar"
                            value="Podar_Injertar"
                          />
                          <Picker.Item label="Otro" value="Otro" />
                        </Picker>
                      </View>
                    </View>
                  </View>

                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>Número de plantas *</Text>
                    <View style={styles.inputWrapper}>
                      <Icon
                        name="grass"
                        size={20}
                        color={PRIMARY_COLOR}
                        style={styles.inputIcon}
                      />
                      <TextInput
                        style={styles.input}
                        value={formData.plantCount}
                        onChangeText={(text) =>
                          handleInputChange("plantCount", text)
                        }
                        placeholder="0"
                        placeholderTextColor="#999"
                        keyboardType="numeric"
                      />
                    </View>
                  </View>

                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>Precio por planta ($) *</Text>
                    <View style={styles.inputWrapper}>
                      <Icon
                        name="money"
                        size={20}
                        color={PRIMARY_COLOR}
                        style={styles.inputIcon}
                      />
                      <TextInput
                        style={styles.input}
                        value={formData.pricePerUnit}
                        onChangeText={(text) =>
                          handleInputChange("pricePerUnit", text)
                        }
                        placeholder="0"
                        placeholderTextColor="#999"
                        keyboardType="numeric"
                      />
                    </View>
                  </View>

                  {formData.plantCount && formData.pricePerUnit && (
                    <View style={styles.totalSalaryContainer}>
                      <Icon name="calculate" size={20} color={COLORS.success} />
                      <View style={styles.totalSalaryContent}>
                        <Text style={styles.totalSalaryLabel}>
                          Salario total calculado:
                        </Text>
                        <Text style={styles.totalSalaryValue}>
                          ${calculateTotalSalary().toLocaleString()}
                        </Text>
                        <Text style={styles.calculationDetail}>
                          {formData.plantCount} plantas × $
                          {formData.pricePerUnit} = $
                          {calculateTotalSalary().toLocaleString()}
                        </Text>
                      </View>
                    </View>
                  )}
                </>
              )}

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Modo de pago *</Text>
                <View style={styles.pickerWrapper}>
                  <Icon
                    name="account-balance-wallet"
                    size={20}
                    color={PRIMARY_COLOR}
                    style={styles.inputIcon}
                  />
                  <View style={styles.pickerContainer}>
                    <Picker
                      selectedValue={formData.paymentMode}
                      style={styles.picker}
                      onValueChange={(itemValue) =>
                        handleInputChange("paymentMode", itemValue)
                      }
                      dropdownIconColor={PRIMARY_COLOR}>
                      <Picker.Item label="Efectivo" value="Efectivo" />
                      <Picker.Item
                        label="Mixto (Efectivo + Beneficios)"
                        value="Mixto"
                      />
                    </Picker>
                  </View>
                </View>
              </View>

              <View style={styles.benefitsSection}>
                <View style={styles.benefitItem}>
                  <View style={styles.benefitRow}>
                    <Icon name="restaurant" size={20} color={PRIMARY_COLOR} />
                    <Text style={styles.benefitLabel}>
                      Incluye alimentación
                    </Text>
                  </View>
                  <Switch
                    trackColor={{ false: "#E0E0E0", true: "#81C784" }}
                    thumbColor={
                      formData.includesFood ? PRIMARY_COLOR : "#f4f3f4"
                    }
                    ios_backgroundColor="#3e3e3e"
                    onValueChange={(value) =>
                      handleInputChange("includesFood", value)
                    }
                    value={formData.includesFood}
                  />
                </View>

                <View style={styles.benefitItem}>
                  <View style={styles.benefitRow}>
                    <Icon name="hotel" size={20} color={PRIMARY_COLOR} />
                    <Text style={styles.benefitLabel}>Incluye alojamiento</Text>
                  </View>
                  <Switch
                    trackColor={{ false: "#E0E0E0", true: "#81C784" }}
                    thumbColor={
                      formData.includesLodging ? PRIMARY_COLOR : "#f4f3f4"
                    }
                    ios_backgroundColor="#3e3e3e"
                    onValueChange={(value) =>
                      handleInputChange("includesLodging", value)
                    }
                    value={formData.includesLodging}
                  />
                </View>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Requisitos adicionales</Text>
                <View style={[styles.inputWrapper, styles.textAreaWrapper]}>
                  <Icon
                    name="checklist"
                    size={20}
                    color={PRIMARY_COLOR}
                    style={[styles.inputIcon, styles.textAreaIcon]}
                  />
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    value={formData.requirements}
                    onChangeText={(text) =>
                      handleInputChange("requirements", text)
                    }
                    placeholder="Ej: Experiencia previa, habilidades específicas, etc."
                    placeholderTextColor="#999"
                    multiline={true}
                    numberOfLines={3}
                  />
                </View>
              </View>
            </View>
          </View>
        );

      case 4:
        return (
          <View style={styles.formCard}>
            <View style={styles.sectionContainer}>
              <View style={styles.sectionHeader}>
                <Icon name="preview" size={20} color={PRIMARY_COLOR} />
                <Text style={styles.sectionTitle}>Resumen de los Cambios</Text>
              </View>

              <View style={styles.restrictionNotice}>
                <Icon name="info" size={16} color={COLORS.info} />
                <Text style={styles.restrictionText}>
                  En modo edición, la finca y el tipo de cultivo no se pueden
                  modificar. Solo se pueden cambiar otros detalles como la fase,
                  fechas y condiciones de pago.
                </Text>
              </View>

              <View style={styles.summarySection}>
                <Text style={styles.summaryTitle}>
                  <Icon name="info" size={16} color={SECONDARY_COLOR} />{" "}
                  Información Básica
                </Text>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Título:</Text>
                  <Text style={styles.summaryValue}>{formData.title}</Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Descripción:</Text>
                  <Text style={styles.summaryValue}>
                    {formData.description}
                  </Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Finca:</Text>
                  <Text style={[styles.summaryValue, styles.fixedValue]}>
                    {originalFarmInfo?.name || "No especificada"} 🔒
                  </Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Tipo de cultivo:</Text>
                  <Text style={[styles.summaryValue, styles.fixedValue]}>
                    {getSelectedCropTypeName()} 🔒
                  </Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Fase de cultivo:</Text>
                  <Text style={[styles.summaryValue, styles.editableValue]}>
                    {getSelectedPhaseName()} ✏️
                  </Text>
                </View>
              </View>

              <View style={styles.summarySection}>
                <Text style={styles.summaryTitle}>
                  <Icon name="date-range" size={16} color={SECONDARY_COLOR} />{" "}
                  Fechas y Duración
                </Text>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Fecha de inicio:</Text>
                  <Text style={styles.summaryValue}>
                    {formatDate(formData.startDate)}
                  </Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>
                    Fecha de finalización:
                  </Text>
                  <Text style={styles.summaryValue}>
                    {formatDate(formData.endDate)}
                  </Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Duración aproximada:</Text>
                  <Text style={styles.summaryValue}>
                    {formData.duration} días
                  </Text>
                </View>
              </View>

              <View style={styles.summarySection}>
                <Text style={styles.summaryTitle}>
                  <Icon name="payments" size={16} color={SECONDARY_COLOR} />{" "}
                  Pago y Requisitos
                </Text>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>
                    Trabajadores necesarios:
                  </Text>
                  <Text style={styles.summaryValue}>
                    {formData.workersNeeded}
                  </Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Tipo de pago:</Text>
                  <Text style={styles.summaryValue}>
                    {formData.paymentType === "Por_dia"
                      ? "Por Jornal"
                      : "Por Planta"}
                  </Text>
                </View>

                {formData.paymentType === "Por_dia" ? (
                  <View style={styles.summaryItem}>
                    <Text style={styles.summaryLabel}>Salario diario:</Text>
                    <Text style={styles.summaryValue}>${formData.salary}</Text>
                  </View>
                ) : (
                  <>
                    <View style={styles.summaryItem}>
                      <Text style={styles.summaryLabel}>Tipo de trabajo:</Text>
                      <Text style={styles.summaryValue}>
                        {getWorkTypeName(formData.workType)}
                      </Text>
                    </View>
                    <View style={styles.summaryItem}>
                      <Text style={styles.summaryLabel}>
                        Número de plantas:
                      </Text>
                      <Text style={styles.summaryValue}>
                        {formData.plantCount}
                      </Text>
                    </View>
                    <View style={styles.summaryItem}>
                      <Text style={styles.summaryLabel}>
                        Precio por planta:
                      </Text>
                      <Text style={styles.summaryValue}>
                        ${formData.pricePerUnit}
                      </Text>
                    </View>
                    <View style={styles.summaryItem}>
                      <Text style={styles.summaryLabel}>Salario total:</Text>
                      <Text
                        style={[
                          styles.summaryValue,
                          styles.totalSalaryHighlight,
                        ]}>
                        ${calculateTotalSalary().toLocaleString()}
                      </Text>
                    </View>
                  </>
                )}

                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Modo de pago:</Text>
                  <Text style={styles.summaryValue}>
                    {formData.paymentMode}
                  </Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Incluye alimentación:</Text>
                  <Text style={styles.summaryValue}>
                    {formData.includesFood ? "Sí" : "No"}
                  </Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Incluye alojamiento:</Text>
                  <Text style={styles.summaryValue}>
                    {formData.includesLodging ? "Sí" : "No"}
                  </Text>
                </View>
                {formData.requirements && (
                  <View style={styles.summaryItem}>
                    <Text style={styles.summaryLabel}>
                      Requisitos adicionales:
                    </Text>
                    <Text style={styles.summaryValue}>
                      {formData.requirements}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        );
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color={PRIMARY_COLOR} />
            <Text style={styles.loadingText}>Cargando oferta...</Text>
            <Text style={styles.loadingSubtext}>
              Preparando datos para edición
            </Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (error && !originalJobOffer) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Icon name="error-outline" size={64} color="#E57373" />
          <Text style={styles.errorTitle}>Error</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => navigation.goBack()}>
            <Text style={styles.retryButtonText}>Volver</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <ScreenLayout navigation={navigation}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handlePrevious}>
          <Icon name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Editar Oferta de Trabajo</Text>
          <Text style={styles.headerSubtitle}>Paso {currentStep} de 4</Text>
        </View>
        <View style={styles.headerIcon}>
          <Icon name="edit" size={24} color="#fff" />
        </View>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        <View style={styles.stepsContainer}>
          {[1, 2, 3, 4].map((step) => (
            <View key={step} style={styles.stepIndicatorContainer}>
              <View
                style={[
                  styles.stepIndicator,
                  currentStep >= step ? styles.activeStep : styles.inactiveStep,
                ]}>
                <Text
                  style={[
                    styles.stepText,
                    currentStep >= step
                      ? styles.activeStepText
                      : styles.inactiveStepText,
                  ]}>
                  {step}
                </Text>
              </View>
              {step < 4 && (
                <View
                  style={[
                    styles.stepConnector,
                    currentStep > step
                      ? styles.activeConnector
                      : styles.inactiveConnector,
                  ]}
                />
              )}
            </View>
          ))}
        </View>

        <View style={styles.stepTitleContainer}>
          <Text style={styles.stepTitle}>
            {currentStep === 1 && "Información Básica"}
            {currentStep === 2 && "Fechas y Duración"}
            {currentStep === 3 && "Pago y Requisitos"}
            {currentStep === 4 && "Confirmar Cambios"}
          </Text>
          <Text style={styles.stepDescription}>
            {currentStep === 1 &&
              "Actualiza el título y modifica la fase del cultivo"}
            {currentStep === 2 && "Modifica las fechas de trabajo"}
            {currentStep === 3 && "Ajusta el pago y beneficios"}
            {currentStep === 4 && "Revisa y confirma los cambios"}
          </Text>
        </View>

        {renderFormStep()}

        <View style={styles.buttonsContainer}>
          <TouchableOpacity
            style={[styles.button, styles.secondaryButton]}
            onPress={handlePrevious}>
            <Icon name="arrow-back" size={20} color={PRIMARY_COLOR} />
            <Text style={styles.secondaryButtonText}>
              {currentStep === 1 ? "Cancelar" : "Anterior"}
            </Text>
          </TouchableOpacity>

          {currentStep < 4 ? (
            <TouchableOpacity
              style={[styles.button, styles.primaryButton]}
              onPress={handleNext}>
              <Text style={styles.primaryButtonText}>Siguiente</Text>
              <Icon name="arrow-forward" size={20} color="#fff" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[
                styles.button,
                styles.primaryButton,
                submitting && styles.disabledButton,
              ]}
              onPress={handleSubmit}
              disabled={submitting}>
              {submitting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Icon name="check-circle" size={20} color="#fff" />
                  <Text style={styles.primaryButtonText}>Guardar Cambios</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
      <CustomTabBar navigation={navigation} currentRoute="EditJobOffer" />
    </ScreenLayout>
  );
};

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
    shadowColor: PRIMARY_COLOR,
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
  loadingSubtext: {
    marginTop: 8,
    fontSize: 14,
    color: "#666",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#E57373",
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 24,
  },
  retryButton: {
    backgroundColor: PRIMARY_COLOR,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
  },
  retryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: PRIMARY_COLOR,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: PRIMARY_COLOR,
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
  stepsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 30,
  },
  stepIndicatorContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  stepIndicator: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  activeStep: {
    backgroundColor: PRIMARY_COLOR,
  },
  inactiveStep: {
    backgroundColor: "#E0E0E0",
  },
  stepText: {
    fontSize: 16,
    fontWeight: "bold",
  },
  activeStepText: {
    color: "white",
  },
  inactiveStepText: {
    color: "#999",
  },
  stepConnector: {
    height: 3,
    width: 40,
    marginHorizontal: 5,
  },
  activeConnector: {
    backgroundColor: PRIMARY_COLOR,
  },
  inactiveConnector: {
    backgroundColor: "#E0E0E0",
  },
  stepTitleContainer: {
    alignItems: "center",
    marginBottom: 25,
  },
  stepTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: PRIMARY_COLOR,
    marginBottom: 5,
  },
  stepDescription: {
    fontSize: 14,
    color: "#666",
  },
  formCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: PRIMARY_COLOR,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 8,
  },
  sectionContainer: {
    marginBottom: 0,
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
    color: PRIMARY_COLOR,
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
  textAreaWrapper: {
    alignItems: "flex-start",
  },
  textAreaIcon: {
    marginTop: 12,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: "top",
  },
  readOnlyInfoCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f1f5f9",
    borderWidth: 2,
    borderColor: "#d1d5db",
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 16,
    borderStyle: "dashed",
  },
  readOnlyContent: {
    marginLeft: 12,
    flex: 1,
  },
  readOnlyLabel: {
    fontSize: 12,
    color: "#6b7280",
    fontStyle: "italic",
    marginBottom: 4,
  },
  readOnlyValue: {
    fontSize: 16,
    color: "#374151",
    fontWeight: "600",
  },
  editableHint: {
    fontSize: 12,
    color: COLORS.success,
    fontWeight: "500",
    marginBottom: 8,
    fontStyle: "italic",
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
  pickerContainer: {
    flex: 1,
  },
  picker: {
    height: 50,
    color: "#1f2937",
  },
  noDataContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF3E0",
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#FFB74D",
  },
  noDataText: {
    marginLeft: 10,
    flex: 1,
    fontSize: 14,
    color: "#E65100",
  },
  datePickerWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    borderWidth: 2,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    paddingHorizontal: 15,
  },
  disabledWrapper: {
    backgroundColor: "#f1f5f9",
    opacity: 0.8,
  },
  durationContent: {
    flex: 1,
    paddingVertical: 12,
  },
  durationText: {
    fontSize: 16,
    color: "#1f2937",
    fontWeight: "500",
  },
  calculatedText: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 2,
    fontStyle: "italic",
  },
  totalSalaryContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: `${COLORS.success}10`,
    padding: 16,
    borderRadius: 12,
    marginTop: 10,
    borderWidth: 1,
    borderColor: `${COLORS.success}30`,
  },
  totalSalaryContent: {
    marginLeft: 12,
    flex: 1,
  },
  totalSalaryLabel: {
    fontSize: 14,
    color: COLORS.success,
    fontWeight: "600",
    marginBottom: 4,
  },
  totalSalaryValue: {
    fontSize: 20,
    color: COLORS.success,
    fontWeight: "bold",
    marginBottom: 4,
  },
  calculationDetail: {
    fontSize: 12,
    color: COLORS.success,
    fontStyle: "italic",
  },
  benefitsSection: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
  },
  benefitItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 15,
    marginBottom: 10,
  },
  benefitRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  benefitLabel: {
    fontSize: 16,
    color: "#374151",
    fontWeight: "500",
    marginLeft: 10,
  },
  restrictionNotice: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: `${COLORS.info}10`,
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: `${COLORS.info}30`,
  },
  restrictionText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.info,
    lineHeight: 20,
    marginLeft: 12,
  },
  summarySection: {
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: SECONDARY_COLOR,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  summaryItem: {
    flexDirection: "row",
    paddingVertical: 6,
  },
  summaryLabel: {
    flex: 1,
    fontSize: 14,
    color: "#6b7280",
  },
  summaryValue: {
    flex: 2,
    fontSize: 14,
    color: "#1f2937",
    fontWeight: "500",
  },
  fixedValue: {
    color: "#6b7280",
    fontStyle: "italic",
  },
  editableValue: {
    color: COLORS.success,
    fontWeight: "600",
  },
  totalSalaryHighlight: {
    color: COLORS.success,
    fontWeight: "bold",
    fontSize: 16,
  },
  buttonsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 15,
    marginBottom: 100, 
  },
  button: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  primaryButton: {
    backgroundColor: PRIMARY_COLOR,
  },
  secondaryButton: {
    backgroundColor: "#fff",
    borderWidth: 2,
    borderColor: PRIMARY_COLOR,
  },
  primaryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  secondaryButtonText: {
    color: PRIMARY_COLOR,
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  disabledButton: {
    opacity: 0.7,
  },
});
export default EditJobOfferScreen;