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
    plantCount: "", // NUEVO: Número de plantas
    workType: "", // NUEVO: Tipo de trabajo
    workersNeeded: "1", // NUEVO: Número de trabajadores necesarios
    includesFood: false,
    includesLodging: false,
    status: "Activo",
  });

  const [selectedFarmInfo, setSelectedFarmInfo] = useState(null);
  const [farmCropTypes, setFarmCropTypes] = useState([]);
  const [availablePhasesForSelectedCrop, setAvailablePhasesForSelectedCrop] =
    useState([]);

  const calculateDaysBetweenDates = (startDate, endDate) => {
    const oneDay = 24 * 60 * 60 * 1000;
    const start = new Date(startDate);
    const end = new Date(endDate);
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);
    const diffDays = Math.round(Math.abs((end - start) / oneDay)) + 1;
    return diffDays.toString();
  };

  // Función para calcular el salario total cuando es por planta
  const calculateTotalSalary = () => {
    if (formData.paymentType === "Por_labor" && formData.plantCount && formData.pricePerUnit) {
      const total = parseFloat(formData.plantCount) * parseFloat(formData.pricePerUnit);
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


  // Función para obtener fases del cultivo específico desde el backend
  const fetchPhasesForCropType = async (cropTypeId) => {
    try {
      console.log("Consultando fases del backend para cropType:", cropTypeId);
      const response = await ApiClient.get(`/phase/by-crop/${cropTypeId}`);

      console.log("Respuesta completa del backend:", response);

      // Manejar ambos formatos de respuesta (con y sin estructura success/data)
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
          fromFarm: false, // Marcador para indicar que viene del backend específico
        }));

        console.log("Fases obtenidas del backend:", phases);
        return phases;
      }

      return [];
    } catch (error) {
      console.error("Error consultando fases del backend:", error);
      // Mostrar detalles del error para debug
      if (error.response) {
        console.error("Error response:", error.response.data);
        console.error("Error status:", error.response.status);
      }
      return [];
    }
  };

  // Función mejorada para extraer TODOS los tipos de cultivo de una finca
  const extractAllCropTypesFromFarm = (selectedFarm) => {
    const cropTypes = [];

    // Opción 1: Si cropTypesInfo está disponible (parece ser la más completa)
    if (selectedFarm.cropTypesInfo && selectedFarm.cropTypesInfo.length > 0) {
      selectedFarm.cropTypesInfo.forEach((cropTypeInfo) => {
        cropTypes.push({
          id: cropTypeInfo.id,
          name: cropTypeInfo.name,
          phases: cropTypeInfo.phases || [],
        });
      });
    }

    // Opción 2: Si cropTypes está disponible con estructura diferente
    if (selectedFarm.cropTypes && selectedFarm.cropTypes.length > 0) {
      selectedFarm.cropTypes.forEach((cropTypeData) => {
        const cropType = cropTypeData.cropType || cropTypeData;
        if (cropType && cropType.id) {
          // Verificar si ya existe este cropType
          const existingCropType = cropTypes.find(
            (ct) => ct.id === cropType.id
          );
          if (!existingCropType) {
            cropTypes.push({
              id: cropType.id,
              name: cropType.name,
              phases: cropType.phases || cropTypeData.phases || [],
            });
          }
        }
      });
    }

    return cropTypes;
  };

  const loadInitialData = async () => {
    setLoading(true);
    try {
      // Cargar la oferta existente y las fincas en paralelo
      const [jobOfferData, farmsData] = await Promise.all([
        loadJobOffer(),
        loadFarms(),
      ]);

      if (jobOfferData) {
        await populateFormWithJobOffer(jobOfferData, farmsData);
      }
    } catch (error) {
      console.error("Error cargando datos iniciales:", error);
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
      console.log("Cargando oferta con ID:", jobOfferId);
      const jobOfferData = await getJobOfferById(jobOfferId);

      if (!jobOfferData) {
        throw new Error("No se encontró la oferta de trabajo");
      }

      setOriginalJobOffer(jobOfferData);
      return jobOfferData;
    } catch (error) {
      console.error("Error cargando oferta:", error);
      throw error;
    }
  };

  const loadFarms = async () => {
    try {
      const userData = await getUserData();
      if (!userData || !userData.employerProfile) {
        throw new Error("No se encontró el perfil de empleador");
      }

      const farmsResult = await getFarmByemployerId(
        userData.employerProfile.id
      );
      const farmsData = Array.isArray(farmsResult)
        ? farmsResult
        : farmsResult.data && Array.isArray(farmsResult.data)
        ? farmsResult.data
        : [];

      if (!farmsData || farmsData.length === 0) {
        setError("No tienes fincas registradas.");
        setFarms([]);
      } else {
        setFarms(farmsData);
      }

      return farmsData;
    } catch (error) {
      console.error("Error cargando fincas:", error);
      throw error;
    }
  };

  // Función modificada para poblar el formulario y establecer datos originales
  const populateFormWithJobOffer = async (jobOffer, farmsData) => {
    try {
      console.log("Poblando formulario con oferta:", jobOffer);

      // Convertir fechas
      const startDate = jobOffer.startDate
        ? new Date(jobOffer.startDate)
        : new Date();
      const endDate = jobOffer.endDate
        ? new Date(jobOffer.endDate)
        : new Date();

      let phaseIdToUse = "";
      if (jobOffer.phase && jobOffer.phase.id) {
        phaseIdToUse = jobOffer.phase.id;
      } else if (jobOffer.phaseId) {
        phaseIdToUse = jobOffer.phaseId;
      }

      // Establecer información original de finca y cultivo (NO MODIFICABLES)
      const originalFarmId = jobOffer.farmId || jobOffer.farm?.id || "";
      const originalCropTypeId =
        jobOffer.cropTypeId || jobOffer.cropType?.id || "";

      // Buscar y guardar la información original de la finca
      const originalFarm = farmsData.find((farm) => farm.id === originalFarmId);
      if (originalFarm) {
        setOriginalFarmInfo(originalFarm);
        // Extraer tipos de cultivo de la finca original
        const cropTypesFromFarm = extractAllCropTypesFromFarm(originalFarm);
        setFarmCropTypes(cropTypesFromFarm);

        // Buscar y guardar el tipo de cultivo original
        const originalCrop = cropTypesFromFarm.find(
          (ct) => ct.id === originalCropTypeId
        );
        if (originalCrop) {
          setOriginalCropType(originalCrop);
        }
      }

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
        plantCount: jobOffer.plantCount?.toString() || "", // NUEVO
        workType: jobOffer.workType || "", // NUEVO
        workersNeeded: jobOffer.workersNeeded?.toString() || "1", // NUEVO
        includesFood: jobOffer.includesFood || false,
        includesLodging: jobOffer.includesLodging || false,
        status: jobOffer.status || "Activo",
      };

      setFormData(newFormData);

      // Cargar información de la finca y cultivo originales - USANDO farmsData directamente
      if (originalFarmId && originalCropTypeId && originalFarm) {
        await loadOriginalFarmAndCropInfoImmediate(
          originalFarm,
          originalCropTypeId,
          phaseIdToUse
        );
      }

      console.log("Formulario poblado con datos:", newFormData);
      console.log("PhaseId usado:", phaseIdToUse);
    } catch (error) {
      console.error("Error poblando formulario:", error);
      throw error;
    }
  };

  // Nueva función para cargar información original de finca y cultivo usando datos inmediatos
  const loadOriginalFarmAndCropInfoImmediate = async (
    selectedFarm,
    cropTypeId,
    initialPhaseId = null
  ) => {
    try {
      setLoadingFarmInfo(true);

      console.log("=== CARGANDO INFO ORIGINAL INMEDIATA ===");
      console.log("Finca:", selectedFarm.name);
      console.log("CropTypeId:", cropTypeId);

      // Extraer tipos de cultivo de la finca
      const allCropTypes = extractAllCropTypesFromFarm(selectedFarm);
      setFarmCropTypes(allCropTypes);

      // Establecer información de la finca
      setSelectedFarmInfo({
        ...selectedFarm,
        name: selectedFarm.name,
        village: getLocationValueForFarm("village", selectedFarm),
        city: getLocationValueForFarm("city", selectedFarm),
        department: getLocationValueForFarm("department", selectedFarm),
        country: getLocationValueForFarm("country", selectedFarm),
        plantCount: selectedFarm.plantCount || 0,
        size: selectedFarm.size || 0,
        totalCropTypes: allCropTypes.length,
      });

      // Cargar fases específicas para el cultivo original usando datos directos
      await loadPhasesForOriginalCropImmediate(
        selectedFarm,
        cropTypeId,
        initialPhaseId
      );

      console.log("Información original cargada - Finca:", selectedFarm.name);
      console.log("Número de tipos de cultivo:", allCropTypes.length);
    } catch (error) {
      console.error("Error al cargar información original inmediata:", error);
    } finally {
      setLoadingFarmInfo(false);
    }
  };

  // Nueva función para cargar fases del cultivo original usando datos directos
  const loadPhasesForOriginalCropImmediate = async (
    selectedFarm,
    cropTypeId,
    initialPhaseId = null
  ) => {
    if (!cropTypeId || !selectedFarm) {
      setAvailablePhasesForSelectedCrop([]);
      return;
    }

    try {
      console.log("=== CARGANDO FASES DEL CULTIVO ORIGINAL (INMEDIATO) ===");
      console.log("CropTypeId:", cropTypeId);
      console.log("Finca:", selectedFarm.name);

      // PRIORIDAD 1: Intentar obtener fases específicas del cultivo desde el backend
      let phases = await fetchPhasesForCropType(cropTypeId);
      console.log("Fases del backend:", phases.length);

      // PRIORIDAD 2: Si el backend no devuelve fases específicas, usar las fases de la finca
      if (phases.length === 0) {
        console.log(
          "Backend no devolvió fases específicas, usando fases de la finca"
        );

        if (
          selectedFarm.activePhasesInfo &&
          selectedFarm.activePhasesInfo.length > 0
        ) {
          phases = selectedFarm.activePhasesInfo.map((activePhase) => ({
            id: activePhase.farmPhaseId || activePhase.id, // ID del FarmPhase
            cultivationPhaseId: activePhase.id, // ID del CultivationPhase
            name: activePhase.name,
            description: activePhase.description || "",
            estimatedDuration: activePhase.duration || null,
            order: activePhase.order || null,
            isActive: activePhase.isActive,
            fromFarm: true, // Marcador para indicar que viene de la finca
          }));

          console.log("Fases extraídas de activePhasesInfo:", phases);
        }

        // Si no hay activePhasesInfo, intentar con otras propiedades de la finca
        if (
          phases.length === 0 &&
          selectedFarm.phases &&
          selectedFarm.phases.length > 0
        ) {
          phases = selectedFarm.phases.map((phase) => ({
            id: phase.id,
            cultivationPhaseId: phase.id,
            name: phase.name,
            description: phase.description || "",
            estimatedDuration: phase.duration || null,
            order: phase.order || null,
            isActive: true,
            fromFarm: true,
          }));

          console.log("Fases extraídas de phases:", phases);
        }

        // Si aún no hay fases, intentar desde cropTypesInfo
        if (phases.length === 0) {
          console.log("Intentando extraer fases desde cropTypesInfo");
          const allCropTypes = extractAllCropTypesFromFarm(selectedFarm);
          const targetCropType = allCropTypes.find(
            (ct) => ct.id === cropTypeId
          );

          if (
            targetCropType &&
            targetCropType.phases &&
            targetCropType.phases.length > 0
          ) {
            phases = targetCropType.phases.map((phase) => ({
              id: phase.id,
              cultivationPhaseId: phase.id,
              name: phase.name,
              description: phase.description || "",
              estimatedDuration: phase.duration || null,
              order: phase.order || null,
              isActive: true,
              fromFarm: true,
            }));

            console.log("Fases extraídas de cropTypesInfo:", phases);
          }
        }

        // Ordenar las fases por número en el nombre
        phases = phases
          .filter((phase) => phase.name && phase.name.trim() !== "")
          .sort((a, b) => {
            const getOrderFromName = (name) => {
              const match = name.match(/(\d+)\./);
              return match ? parseInt(match[1]) : 999;
            };
            return getOrderFromName(a.name) - getOrderFromName(b.name);
          });

        console.log("Fases de la finca (ordenadas):", phases);
      }

      setAvailablePhasesForSelectedCrop(phases);

      console.log("=== RESULTADO FINAL (INMEDIATO) ===");
      console.log("Cultivo original:", cropTypeId);
      console.log("Total de fases disponibles:", phases.length);
      console.log(
        "Fuente de las fases:",
        phases.length > 0 && phases[0].fromFarm ? "Finca" : "Backend"
      );

      if (phases.length === 0) {
        console.warn(
          "⚠️ NO SE ENCONTRARON FASES - Revisar estructura de datos de la finca"
        );
        console.log("Estructura de la finca:", {
          activePhasesInfo: selectedFarm.activePhasesInfo
            ? selectedFarm.activePhasesInfo.length
            : "undefined",
          phases: selectedFarm.phases
            ? selectedFarm.phases.length
            : "undefined",
          cropTypesInfo: selectedFarm.cropTypesInfo
            ? selectedFarm.cropTypesInfo.length
            : "undefined",
          keys: Object.keys(selectedFarm),
        });
      }
    } catch (error) {
      console.error("Error en loadPhasesForOriginalCropImmediate:", error);

      // Fallback: usar cualquier fase disponible en la finca
      let phases = [];

      if (
        selectedFarm.activePhasesInfo &&
        selectedFarm.activePhasesInfo.length > 0
      ) {
        phases = selectedFarm.activePhasesInfo.map((activePhase) => ({
          id: activePhase.farmPhaseId || activePhase.id,
          cultivationPhaseId: activePhase.id,
          name: activePhase.name,
          description: activePhase.description || "",
          estimatedDuration: activePhase.duration || null,
          order: activePhase.order || null,
          isActive: activePhase.isActive,
          fromFarm: true,
        }));
      }

      setAvailablePhasesForSelectedCrop(phases);
      console.log("Fallback - fases cargadas:", phases.length);
    }
  };

  // Función modificada para manejar cambio de fase (única modificación permitida)
  const handlePhaseSelection = (phaseId) => {
    console.log("=== SELECCIONANDO FASE ===");
    console.log("PhaseId recibido:", phaseId);
    console.log("Fases disponibles:", availablePhasesForSelectedCrop);

    if (!phaseId || phaseId === "") {
      setFormData((prev) => ({
        ...prev,
        phaseId: "",
      }));
      console.log("Fase deseleccionada");
      return;
    }

    // Buscar la fase seleccionada
    const selectedPhase = availablePhasesForSelectedCrop.find(
      (phase) => phase.id === phaseId
    );
    console.log("Fase encontrada:", selectedPhase);

    // Determinar qué ID usar para el backend
    let backendPhaseId = phaseId;
    if (selectedPhase) {
      // Si la fase viene de la finca, usar cultivationPhaseId
      // Si viene del backend, usar el ID directo
      backendPhaseId = selectedPhase.fromFarm
        ? selectedPhase.cultivationPhaseId
        : selectedPhase.id;
    }

    setFormData((prev) => ({
      ...prev,
      phaseId: backendPhaseId, // Usar el ID correcto para el backend
    }));

    console.log("Fase seleccionada - ID original:", phaseId);
    console.log("Fase seleccionada - ID para backend:", backendPhaseId);
    console.log("Fase seleccionada - Nombre:", selectedPhase?.name);
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

  // Validación actualizada para incluir campos Por_labor
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
        
        if (isNaN(parseFloat(formData.workersNeeded)) || parseFloat(formData.workersNeeded) <= 0)
          return "El número de trabajadores debe ser un número positivo";
        
        if (formData.paymentType === "Por_dia") {
          if (isNaN(parseFloat(formData.salary)) || parseFloat(formData.salary) <= 0)
            return "El salario diario debe ser un número positivo";
        }
        
        if (formData.paymentType === "Por_labor") {
          if (!formData.workType.trim()) return "El tipo de trabajo es requerido";
          if (isNaN(parseFloat(formData.plantCount)) || parseFloat(formData.plantCount) <= 0)
            return "El número de plantas debe ser un número positivo";
          if (isNaN(parseFloat(formData.pricePerUnit)) || parseFloat(formData.pricePerUnit) <= 0)
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

  // Función de envío actualizada
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
        workersNeeded: parseInt(formData.workersNeeded), // NUEVO
        includesFood: formData.includesFood,
        includesLodging: formData.includesLodging,
      };

      // Campos específicos según el tipo de pago
      if (formData.paymentType === "Por_dia") {
        dataToSend.salary = parseFloat(formData.salary);
        dataToSend.laborType = null;
        dataToSend.pricePerUnit = null;
        dataToSend.plantCount = null;
        dataToSend.workType = null;
      } else if (formData.paymentType === "Por_labor") {
        dataToSend.salary = calculateTotalSalary(); // Calcular automáticamente
        dataToSend.laborType = formData.laborType || null;
        dataToSend.pricePerUnit = parseFloat(formData.pricePerUnit);
        dataToSend.plantCount = parseInt(formData.plantCount);
        dataToSend.workType = formData.workType;
      }

      console.log("Actualizando oferta con datos:", dataToSend);

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
      console.error("Error actualizando la oferta de trabajo:", error);
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

  const getSelectedCropTypeName = () => {
    if (!originalCropType) return "No especificado";
    return originalCropType.name;
  };

  const getSelectedPhaseName = () => {
    if (!formData.phaseId) return "No seleccionada";

    console.log("=== OBTENIENDO NOMBRE DE FASE ===");
    console.log("FormData.phaseId:", formData.phaseId);
    console.log("Fases disponibles:", availablePhasesForSelectedCrop);

    // Buscar por el ID que está en formData.phaseId
    // Puede ser cultivationPhaseId o el ID directo dependiendo del origen
    const selectedPhase = availablePhasesForSelectedCrop.find((phase) => {
      const match =
        phase.cultivationPhaseId === formData.phaseId ||
        phase.id === formData.phaseId;

      if (match) {
        console.log("Fase encontrada:", {
          id: phase.id,
          cultivationPhaseId: phase.cultivationPhaseId,
          name: phase.name,
          fromFarm: phase.fromFarm,
        });
      }

      return match;
    });

    if (selectedPhase) {
      const displayName = selectedPhase.order
        ? `${selectedPhase.order}. ${selectedPhase.name}`
        : selectedPhase.name;
      console.log("Nombre a mostrar:", displayName);
      return displayName;
    }

    console.log("⚠️ Fase no encontrada para ID:", formData.phaseId);
    return "No encontrada";
  };

  // Función para obtener el nombre del tipo de trabajo
  const getWorkTypeName = (workType) => {
    const workTypeNames = {
      Podar: "Podar",
      Injertar: "Injertar", 
      Podar_Injertar: "Podar e Injertar",
      Otro: "Otro"
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
              {availablePhasesForSelectedCrop.length > 0 && (
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
                          // Encontrar el ID del picker que corresponde al formData.phaseId
                          const phase = availablePhasesForSelectedCrop.find(
                            (p) =>
                              p.cultivationPhaseId === formData.phaseId ||
                              p.id === formData.phaseId
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
                            label={`${phase.order ? `${phase.order}. ` : ""}${
                              phase.name
                            }`}
                            value={phase.id}
                          />
                        ))}
                      </Picker>
                    </View>
                  </View>
                </View>
              )}

              {selectedFarmInfo && (
                <EnhancedFarmInfoCard
                  farmInfo={selectedFarmInfo}
                  farmCropTypes={farmCropTypes}
                  selectedCropTypeId={formData.cropTypeId}
                  availablePhasesForSelectedCrop={
                    availablePhasesForSelectedCrop
                  }
                  selectedPhaseId={formData.phaseId}
                  loading={loadingFarmInfo}
                  isEditMode={true}
                  originalCropType={originalCropType}
                />
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
                <Text style={styles.label}>Número de trabajadores necesarios *</Text>
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
                    onChangeText={(text) => handleInputChange("workersNeeded", text)}
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
                        // Limpiar campos específicos cuando cambia el tipo
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

              {/* Campos para pago por jornal */}
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

              {/* Campos para pago por planta */}
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
                          <Picker.Item label="Seleccione el tipo de trabajo..." value="" />
                          <Picker.Item label="Podar" value="Podar" />
                          <Picker.Item label="Injertar" value="Injertar" />
                          <Picker.Item label="Podar e Injertar" value="Podar_Injertar" />
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
                        onChangeText={(text) => handleInputChange("plantCount", text)}
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
                        onChangeText={(text) => handleInputChange("pricePerUnit", text)}
                        placeholder="0"
                        placeholderTextColor="#999"
                        keyboardType="numeric"
                      />
                    </View>
                  </View>

                  {/* Mostrar cálculo del salario total */}
                  {formData.plantCount && formData.pricePerUnit && (
                    <View style={styles.totalSalaryContainer}>
                      <Icon name="calculate" size={20} color={COLORS.success} />
                      <View style={styles.totalSalaryContent}>
                        <Text style={styles.totalSalaryLabel}>Salario total calculado:</Text>
                        <Text style={styles.totalSalaryValue}>
                          ${calculateTotalSalary().toLocaleString()}
                        </Text>
                        <Text style={styles.calculationDetail}>
                          {formData.plantCount} plantas × ${formData.pricePerUnit} = ${calculateTotalSalary().toLocaleString()}
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

              {/* Aviso sobre restricciones */}
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
                  <Text style={styles.summaryLabel}>Trabajadores necesarios:</Text>
                  <Text style={styles.summaryValue}>{formData.workersNeeded}</Text>
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
                      <Text style={styles.summaryValue}>{getWorkTypeName(formData.workType)}</Text>
                    </View>
                    <View style={styles.summaryItem}>
                      <Text style={styles.summaryLabel}>Número de plantas:</Text>
                      <Text style={styles.summaryValue}>{formData.plantCount}</Text>
                    </View>
                    <View style={styles.summaryItem}>
                      <Text style={styles.summaryLabel}>Precio por planta:</Text>
                      <Text style={styles.summaryValue}>${formData.pricePerUnit}</Text>
                    </View>
                    <View style={styles.summaryItem}>
                      <Text style={styles.summaryLabel}>Salario total:</Text>
                      <Text style={[styles.summaryValue, styles.totalSalaryHighlight]}>
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
    <SafeAreaView style={styles.container}>
      {/* Header mejorado */}
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
        {/* Steps indicator mejorado */}
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

        {/* Botones de navegación mejorados */}
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
    </SafeAreaView>
  );
};

// Componente mejorado para mostrar información de la finca en modo edición
const EnhancedFarmInfoCard = ({
  farmInfo,
  farmCropTypes,
  selectedCropTypeId,
  availablePhasesForSelectedCrop,
  selectedPhaseId,
  loading,
  isEditMode = false,
  originalCropType,
}) => {
  if (loading) {
    return (
      <View style={styles.farmInfoContainer}>
        <ActivityIndicator size="small" color={PRIMARY_COLOR} />
        <Text style={styles.loadingText}>
          Cargando información de la finca...
        </Text>
      </View>
    );
  }

  if (!farmInfo || !farmInfo.name) {
    return null;
  }

  const getLocationValue = (field) => {
    if (!farmInfo) return "No especificado";

    const directValue = farmInfo[field];
    if (typeof directValue === "string") return directValue;
    if (directValue?.name) return directValue.name;

    const locationValue = farmInfo.locationInfo?.[field];
    if (typeof locationValue === "string") return locationValue;
    if (locationValue?.name) return locationValue.name;

    return "No especificado";
  };

  const villageName = farmInfo.village || getLocationValue("village");
  const cityName = getLocationValue("city");
  const departmentName = getLocationValue("department");
  const countryName = getLocationValue("country");


  return (
    <View style={styles.farmInfoContainer}>
      <View style={styles.farmInfoHeader}>
        <Icon name="agriculture" size={24} color={PRIMARY_COLOR} />
        <Text style={styles.farmInfoTitle}>{farmInfo.name}</Text>
        {isEditMode && (
          <View style={styles.editModeBadge}>
            <Text style={styles.editModeBadgeText}>Modo Edición</Text>
          </View>
        )}
      </View>

      {/* Restricción de edición */}
      {isEditMode && (
        <View style={styles.editRestrictionCard}>
          <Icon name="lock" size={20} color={COLORS.warning} />
          <View style={styles.editRestrictionContent}>
            <Text style={styles.editRestrictionTitle}>
              Restricciones de Edición
            </Text>
            <Text style={styles.editRestrictionText}>
              • La finca no se puede cambiar{"\n"}• El tipo de cultivo está fijo
              {"\n"}• Solo se puede modificar la fase del cultivo
            </Text>
          </View>
        </View>
      )}

      {/* Card de Ubicación */}
      <View style={styles.farmInfoCard}>
        <View style={styles.farmInfoSection}>
          <Icon name="location-on" size={20} color={SECONDARY_COLOR} />
          <Text style={styles.farmInfoSectionTitle}>Ubicación</Text>
        </View>

        <View style={styles.locationGrid}>
          <View style={styles.locationItem}>
            <Icon name="public" size={16} color="#666" />
            <View style={styles.locationTextContainer}>
              <Text style={styles.locationLabel}>País</Text>
              <Text style={styles.locationValue}>{countryName}</Text>
            </View>
          </View>

          <View style={styles.locationItem}>
            <Icon name="map" size={16} color="#666" />
            <View style={styles.locationTextContainer}>
              <Text style={styles.locationLabel}>Departamento</Text>
              <Text style={styles.locationValue}>{departmentName}</Text>
            </View>
          </View>

          <View style={styles.locationItem}>
            <Icon name="location-city" size={16} color="#666" />
            <View style={styles.locationTextContainer}>
              <Text style={styles.locationLabel}>Ciudad</Text>
              <Text style={styles.locationValue}>{cityName}</Text>
            </View>
          </View>

          <View style={styles.locationItem}>
            <Icon name="home" size={16} color="#666" />
            <View style={styles.locationTextContainer}>
              <Text style={styles.locationLabel}>Vereda</Text>
              <Text style={styles.locationValue}>{villageName}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Card del Cultivo Asignado */}
      {originalCropType && (
        <View style={styles.farmInfoCard}>
          <View style={styles.farmInfoSection}>
            <Icon name="eco" size={20} color={SECONDARY_COLOR} />
            <Text style={styles.farmInfoSectionTitle}>Cultivo Asignado</Text>
            <Icon
              name="lock"
              size={16}
              color="#666"
              style={{ marginLeft: 8 }}
            />
          </View>

          <View style={styles.assignedCropCard}>
            <View style={styles.assignedCropHeader}>
              <Icon name="grass" size={20} color={PRIMARY_COLOR} />
              <Text style={styles.assignedCropName}>
                {originalCropType.name}
              </Text>
              <View style={styles.fixedBadge}>
                <Text style={styles.fixedBadgeText}>FIJO</Text>
              </View>
            </View>
            <Text style={styles.assignedCropNote}>
              Este cultivo no se puede modificar en modo edición
            </Text>
          </View>
        </View>
      )}

      {/* Card de Fases Disponibles */}
      {availablePhasesForSelectedCrop.length > 0 && (
        <View style={styles.farmInfoCard}>
          <View style={styles.farmInfoSection}>
            <Icon name="timeline" size={20} color={SECONDARY_COLOR} />
            <Text style={styles.farmInfoSectionTitle}>
              Fases Disponibles para {originalCropType?.name}
            </Text>
            <Icon
              name="edit"
              size={16}
              color={COLORS.success}
              style={{ marginLeft: 8 }}
            />
          </View>

          <View style={styles.phaseInfoNote}>
            <Icon name="info" size={16} color={COLORS.info} />
            <Text style={styles.phaseInfoNoteText}>
              {availablePhasesForSelectedCrop.length > 0 &&
              availablePhasesForSelectedCrop[0].fromFarm
                ? `Se muestran todas las fases disponibles en la finca para el cultivo ${originalCropType?.name}. Puede seleccionar cualquier fase.`
                : `Fases específicas del cultivo ${originalCropType?.name}. Seleccione la fase deseada.`}
            </Text>
          </View>

          <View style={styles.phasesContainer}>
            {availablePhasesForSelectedCrop.map((phase, index) => {
              // Determinar si esta fase está seleccionada
              const isSelected =
                phase.cultivationPhaseId === selectedPhaseId ||
                phase.id === selectedPhaseId;

              return (
                <View
                  key={phase.id}
                  style={[
                    styles.phaseCard,
                    isSelected && styles.selectedPhaseCard,
                  ]}>
                  <View style={styles.phaseCardHeader}>
                    <View
                      style={[
                        styles.phaseCircle,
                        isSelected && styles.selectedPhaseCircle,
                      ]}>
                      <Text
                        style={[
                          styles.phaseNumber,
                          isSelected && styles.selectedPhaseNumber,
                        ]}>
                        {index + 1}
                      </Text>
                    </View>
                    <View style={styles.phaseInfo}>
                      <Text
                        style={[
                          styles.phaseName,
                          isSelected && styles.selectedPhaseName,
                        ]}>
                        {phase.name}
                      </Text>
                      {phase.description && (
                        <Text style={styles.phaseDescription}>
                          {phase.description}
                        </Text>
                      )}
                      {phase.estimatedDuration && (
                        <Text style={styles.phaseDuration}>
                          Duración estimada: {phase.estimatedDuration} días
                        </Text>
                      )}
                      {phase.fromFarm && (
                        <Text style={styles.phaseSource}>
                          📍 Fase de la finca
                        </Text>
                      )}
                    </View>
                    {isSelected && (
                      <View style={styles.selectedIndicator}>
                        <Icon
                          name="check-circle"
                          size={20}
                          color={PRIMARY_COLOR}
                        />
                        <Text style={styles.selectedText}>Seleccionada</Text>
                      </View>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      )}

      {/* Card de Estadísticas de la Finca */}
      <View style={styles.farmInfoCard}>
        <View style={styles.farmInfoSection}>
          <Icon name="assessment" size={20} color={SECONDARY_COLOR} />
          <Text style={styles.farmInfoSectionTitle}>Estadísticas</Text>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Icon name="grass" size={20} color={SECONDARY_COLOR} />
            <Text style={styles.statValue}>{farmInfo.plantCount || 0}</Text>
            <Text style={styles.statLabel}>Plantas Total</Text>
          </View>

          <View style={styles.statItem}>
            <Icon name="square-foot" size={20} color={SECONDARY_COLOR} />
            <Text style={styles.statValue}>{farmInfo.size || 0}</Text>
            <Text style={styles.statLabel}>Hectáreas</Text>
          </View>

          <View style={styles.statItem}>
            <Icon name="spa" size={20} color={SECONDARY_COLOR} />
            <Text style={styles.statValue}>{farmCropTypes.length}</Text>
            <Text style={styles.statLabel}>
              Tipo{farmCropTypes.length !== 1 ? "s" : ""} de Cultivo
            </Text>
          </View>
        </View>
      </View>
    </View>
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
  // Nuevos estilos para campos de solo lectura
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
  // Hint para campos editables
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
  // Estilos para la sección de salario total
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
  // Nuevos estilos para el resumen
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
    marginBottom: 30,
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
  // Estilos mejorados de FarmInfoCard para modo edición
  farmInfoContainer: {
    marginTop: 10,
  },
  farmInfoHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e1e8ed",
  },
  farmInfoTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: PRIMARY_COLOR,
    marginLeft: 8,
    flex: 1,
  },
  editModeBadge: {
    backgroundColor: `${COLORS.warning}20`,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: `${COLORS.warning}50`,
  },
  editModeBadgeText: {
    fontSize: 12,
    color: COLORS.warning,
    fontWeight: "600",
  },
  // Card de restricción de edición
  editRestrictionCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: `${COLORS.warning}10`,
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: `${COLORS.warning}30`,
  },
  editRestrictionContent: {
    marginLeft: 12,
    flex: 1,
  },
  editRestrictionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.warning,
    marginBottom: 4,
  },
  editRestrictionText: {
    fontSize: 13,
    color: COLORS.warning,
    lineHeight: 18,
  },
  farmInfoCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e1e8ed",
  },
  farmInfoSection: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  farmInfoSectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: SECONDARY_COLOR,
    marginLeft: 8,
  },
  locationGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -6,
  },
  locationItem: {
    flexDirection: "row",
    alignItems: "center",
    width: "50%",
    paddingHorizontal: 6,
    marginBottom: 12,
  },
  locationTextContainer: {
    marginLeft: 8,
    flex: 1,
  },
  locationLabel: {
    fontSize: 12,
    color: "#666",
    marginBottom: 2,
  },
  locationValue: {
    fontSize: 14,
    color: "#333",
    fontWeight: "500",
  },
  // Estilos para el cultivo asignado
  assignedCropCard: {
    backgroundColor: "#f8fafc",
    borderRadius: 10,
    padding: 16,
    borderWidth: 2,
    borderColor: "#e2e8f0",
    borderStyle: "dashed",
  },
  assignedCropHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  assignedCropName: {
    fontSize: 16,
    fontWeight: "600",
    color: PRIMARY_COLOR,
    marginLeft: 8,
    flex: 1,
  },
  fixedBadge: {
    backgroundColor: "#6b7280",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  fixedBadgeText: {
    fontSize: 10,
    color: "#fff",
    fontWeight: "bold",
  },
  assignedCropNote: {
    fontSize: 12,
    color: "#6b7280",
    fontStyle: "italic",
  },
  // Estilos para fases
  phasesContainer: {
    gap: 10,
  },
  phaseInfoNote: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: `${COLORS.info}10`,
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: `${COLORS.info}30`,
  },
  phaseInfoNoteText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.info,
    lineHeight: 18,
  },
  phaseCard: {
    backgroundColor: "#f8fafc",
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  selectedPhaseCard: {
    backgroundColor: `${PRIMARY_COLOR}10`,
    borderColor: PRIMARY_COLOR,
    borderWidth: 2,
  },
  phaseCardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  phaseCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#e2e8f0",
    justifyContent: "center",
    alignItems: "center",
  },
  selectedPhaseCircle: {
    backgroundColor: PRIMARY_COLOR,
  },
  phaseNumber: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#666",
  },
  selectedPhaseNumber: {
    color: "#fff",
  },
  phaseInfo: {
    flex: 1,
  },
  phaseName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 4,
  },
  selectedPhaseName: {
    color: PRIMARY_COLOR,
  },
  phaseDescription: {
    fontSize: 13,
    color: "#6b7280",
    lineHeight: 18,
    marginBottom: 4,
  },
  phaseDuration: {
    fontSize: 12,
    color: "#9ca3af",
    fontStyle: "italic",
  },
  phaseSource: {
    fontSize: 11,
    color: "#8b5cf6",
    fontWeight: "500",
    marginTop: 2,
  },
  selectedIndicator: {
    alignItems: "center",
  },
  selectedText: {
    fontSize: 10,
    color: PRIMARY_COLOR,
    fontWeight: "600",
    marginTop: 2,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 8,
  },
  statItem: {
    alignItems: "center",
    flex: 1,
  },
  statValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: PRIMARY_COLOR,
    marginTop: 4,
  },
  statLabel: {
    fontSize: 11,
    color: "#666",
    marginTop: 2,
    textAlign: "center",
  },
});

export default EditJobOfferScreen;