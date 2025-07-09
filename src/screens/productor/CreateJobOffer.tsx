import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  ActivityIndicator,
  Modal,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/MaterialIcons";
import ScreenLayout from "../../components/ScreenLayout";
import { useAuth } from "../../context/AuthContext";
import ApiClient from "../../utils/api";
import { getUserData } from "../../services/userService";
import CustomDatePicker from "../../components/CustomDatePicker";
import {
  getFarmByemployerId,
  getFarmPhasesByCrop,
} from "../../services/farmService";
import { getCultivationPhasesByCropId } from "../../services/cultivationPhaseService";
import CustomTabBar from "../../components/CustomTabBar";
import { extractCropTypesFromOptimizedResponse } from "../../services/cropTypeService";
import EnhancedFarmInfoCard from "./EnhancedFarmInfoCard";

const PRIMARY_COLOR = "#284F66";
const SECONDARY_COLOR = "#4A7C94";
const COLORS = {
  primary: PRIMARY_COLOR,
  secondary: SECONDARY_COLOR,
  background: "#F5F5F5",
  text: "#333",
  placeholder: "#999",
  info: "#2563eb",
  success: "#059669",
  error: "#DC2626",
  warning: "#D97706",
};

const CustomAlert = ({
  visible,
  type = "info",
  title,
  message,
  buttons = [],
  onDismiss,
}) => {
  const getAlertConfig = () => {
    switch (type) {
      case "success":
        return {
          backgroundColor: `${COLORS.background}`,
          borderColor: `${PRIMARY_COLOR}30`,
          iconName: "check-circle",
          iconColor: PRIMARY_COLOR,
          titleColor: PRIMARY_COLOR,
        };
      case "error":
        return {
          backgroundColor: `${COLORS.background}`,
          borderColor: "#fecaca",
          iconName: "error",
          iconColor: COLORS.error,
          titleColor: COLORS.error,
        };
      case "warning":
        return {
          backgroundColor: "#fffbeb",
          borderColor: "#fed7aa",
          iconName: "warning",
          iconColor: COLORS.warning,
          titleColor: COLORS.warning,
        };
      default:
        return {
          backgroundColor: `${PRIMARY_COLOR}08`,
          borderColor: `${PRIMARY_COLOR}30`,
          iconName: "info",
          iconColor: PRIMARY_COLOR,
          titleColor: PRIMARY_COLOR,
        };
    }
  };

  const config = getAlertConfig();

  return (
    <Modal
      transparent={true}
      visible={visible}
      animationType="fade"
      onRequestClose={onDismiss}>
      <View style={customAlertStyles.overlay}>
        <View style={customAlertStyles.container}>
          <View
            style={[
              customAlertStyles.content,
              {
                backgroundColor: config.backgroundColor,
                borderColor: config.borderColor,
              },
            ]}>
            <View style={customAlertStyles.header}>
              <View
                style={[
                  customAlertStyles.iconContainer,
                  { backgroundColor: `${config.iconColor}20` },
                ]}>
                <Icon
                  name={config.iconName}
                  size={32}
                  color={config.iconColor}
                />
              </View>
              <Text
                style={[customAlertStyles.title, { color: config.titleColor }]}>
                {title}
              </Text>
            </View>

            <Text style={customAlertStyles.message}>{message}</Text>

            <View style={customAlertStyles.buttonsContainer}>
              {buttons.map((button, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    customAlertStyles.button,
                    button.style === "primary"
                      ? { backgroundColor: PRIMARY_COLOR }
                      : button.style === "success"
                      ? { backgroundColor: COLORS.success }
                      : {
                          backgroundColor: "#fff",
                          borderWidth: 1,
                          borderColor: "#d1d5db",
                        },
                  ]}
                  onPress={button.onPress}>
                  {button.icon && (
                    <Icon
                      name={button.icon}
                      size={18}
                      color={
                        button.style === "primary" || button.style === "success"
                          ? "#fff"
                          : "#6b7280"
                      }
                      style={{ marginRight: 8 }}
                    />
                  )}
                  <Text
                    style={[
                      customAlertStyles.buttonText,
                      {
                        color:
                          button.style === "primary" ||
                          button.style === "success"
                            ? "#fff"
                            : "#6b7280",
                      },
                    ]}>
                    {button.text}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const CreateJobOfferScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [farms, setFarms] = useState([]);
  const [loadingFarmInfo, setLoadingFarmInfo] = useState(false);
  const [loadingPhases, setLoadingPhases] = useState(false);
  const [farmPhasesData, setFarmPhasesData] = useState(null);
  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    type: "info",
    title: "",
    message: "",
    buttons: [],
  });

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
    includesFood: false,
    includesLodging: false,
    workersNeeded: "",
    status: "Activo",
  });

  const [selectedFarmInfo, setSelectedFarmInfo] = useState(null);
  const [farmCropTypes, setFarmCropTypes] = useState([]);
  const [availablePhasesForSelectedCrop, setAvailablePhasesForSelectedCrop] =
    useState([]);

  // Helper functions
  const showCustomAlert = (type, title, message, buttons = []) => {
    setAlertConfig({
      visible: true,
      type,
      title,
      message,
      buttons:
        buttons.length > 0
          ? buttons
          : [
              {
                text: "OK",
                style: "primary",
                onPress: () => hideCustomAlert(),
              },
            ],
    });
  };

  const hideCustomAlert = () => {
    setAlertConfig((prev) => ({ ...prev, visible: false }));
  };

  const showSuccessAlert = (title, message, onSuccess) => {
    showCustomAlert("success", title, message, [
      {
        text: "Ver Ofertas",
        style: "primary",
        icon: "visibility",
        onPress: () => {
          hideCustomAlert();
          onSuccess && onSuccess();
        },
      },
    ]);
  };

  const showErrorAlert = (title, message) => {
    showCustomAlert("error", title, message, [
      {
        text: "Entendido",
        style: "primary",
        icon: "close",
        onPress: () => hideCustomAlert(),
      },
    ]);
  };

  const showValidationAlert = (message) => {
    showCustomAlert("warning", "Campos Requeridos", message, [
      {
        text: "Revisar",
        style: "primary",
        icon: "edit",
        onPress: () => hideCustomAlert(),
      },
    ]);
  };

  const calculateDaysBetweenDates = (startDate, endDate) => {
    const oneDay = 24 * 60 * 60 * 1000;
    const start = new Date(startDate);
    const end = new Date(endDate);
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);
    const diffDays =
      Math.round(Math.abs((end.getTime() - start.getTime()) / oneDay)) + 1;
    return diffDays.toString();
  };

  // Data loading
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

  useEffect(() => {
    if (
      formData.paymentType === "Por_labor" &&
      formData.pricePerUnit &&
      formData.plantCount &&
      !isNaN(parseFloat(formData.pricePerUnit)) &&
      !isNaN(parseInt(formData.plantCount))
    ) {
      const pricePerPlant = parseFloat(formData.pricePerUnit);
      const plantCount = parseInt(formData.plantCount);
      const calculatedDailySalary = pricePerPlant * plantCount;

      setFormData((prev) => ({
        ...prev,
        salary: calculatedDailySalary.toString(),
      }));
    }
  }, [formData.paymentType, formData.pricePerUnit, formData.plantCount]);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      await loadFarms();
    } catch (error) {
      console.error("Error cargando datos iniciales:", error);
      showErrorAlert("Error", "Error al cargar los datos necesarios");
    } finally {
      setLoading(false);
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
        showErrorAlert(
          "Sin fincas",
          "No tienes fincas registradas. Debes crear una finca primero."
        );
        setFarms([]);
      } else {
        setFarms(farmsData);
      }
    } catch (error) {
      console.error("Error cargando fincas:", error);
      throw error;
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

  const handleCropTypeSelection = async (cropTypeId) => {
    console.log("🌾 Selecting crop type:", cropTypeId);

    if (!cropTypeId || !farmPhasesData) {
      console.log("❌ No crop type selected or no farm phases data");
      setAvailablePhasesForSelectedCrop([]);
      setFormData((prev) => ({
        ...prev,
        cropTypeId: "",
        phaseId: "",
      }));
      return;
    }

    try {
      setLoadingPhases(true);
      const selectedCropType = farmCropTypes.find((ct) => ct.id === cropTypeId);

      if (!selectedCropType) {
        console.warn("⚠️ Selected crop type not found in farmCropTypes");
        setAvailablePhasesForSelectedCrop([]);
        setFormData((prev) => ({ ...prev, cropTypeId, phaseId: "" }));
        return;
      }

      console.log("✅ Found selected crop type:", selectedCropType);

      // USAR las fases activas de los datos del backend (ya filtradas)
      let phasesForCrop = [];

      if (farmPhasesData.cultivos) {
        const cultivoOptimizado = farmPhasesData.cultivos.find(
          ({ cultivo }) => cultivo.id === cropTypeId
        );

        console.log("🔍 Found optimized crop data:", cultivoOptimizado);

        // ❌ ANTES: cultivoOptimizado.fases
        // ✅ AHORA: cultivoOptimizado.fasesActivas
        if (cultivoOptimizado && cultivoOptimizado.fasesActivas) {
          // ❌ ANTES: fasesActivas.map (variable indefinida)
          // ✅ AHORA: cultivoOptimizado.fasesActivas.map
          phasesForCrop = cultivoOptimizado.fasesActivas.map((fase, index) => ({
            id: fase.id,
            cultivationPhaseId: fase.id,
            farmPhaseId: fase.farmPhaseId, // ✅ NUEVO: ID específico de la fase en la finca
            // ❌ ANTES: fase.nombre
            // ✅ AHORA: fase.name
            name: fase.name,
            // ❌ ANTES: fase.descripcion
            // ✅ AHORA: fase.description
            description: fase.description || "",
            // ❌ ANTES: fase.duracion
            // ✅ AHORA: fase.estimatedDuration (si existe) o null
            estimatedDuration: fase.estimatedDuration || null,
            // ❌ ANTES: fase.orden
            // ✅ AHORA: fase.order
            order: fase.order || index + 1,
            isActive: true, // Ya están filtradas por el backend
            cropType: { id: cropTypeId, name: selectedCropType.name },
            cropTypeId: cropTypeId,
            cropTypeName: selectedCropType.name,
            source: "backend-activas", // ✅ CAMBIADO: indicar que vienen del backend
            // ❌ ANTES: fase.requerida
            // ✅ AHORA: fase.required (si existe)
            isRequired: fase.required || false,
            // Información adicional de la finca (si existe)
            plantasEnFase: fase.plantasEnFase || fase.plantCount || 0,
            fechaInicio: fase.fechaInicio || fase.startDate || null,
            progreso: fase.progreso || fase.progress || 0,
            // ✅ NUEVO: Datos originales para debug
            originalData: { ...fase },
          }));

          console.log(
            `📋 Active phases for ${selectedCropType.name}:`,
            phasesForCrop.length,
            phasesForCrop
          );
        }
      }

      // Si no hay fases activas en la finca, mostrar mensaje informativo
      if (phasesForCrop.length === 0) {
        console.warn(
          `❌ No active phases found for crop ${selectedCropType.name}`
        );
        setAvailablePhasesForSelectedCrop([]);

        // Mostrar alerta informativa
        showCustomAlert(
          "warning", // ✅ CAMBIADO: de "info" a "warning"
          "Sin Fases Activas",
          `El cultivo "${selectedCropType.name}" no tiene fases activas disponibles en esta finca en este momento. Esto puede deberse a que todas las fases están completadas o no han sido iniciadas aún.`,
          [
            {
              text: "Entendido",
              style: "primary",
              onPress: () => hideCustomAlert(),
            },
          ]
        );
      } else {
        // Ordenar las fases por orden o por nombre
        phasesForCrop.sort((a, b) => {
          if (a.order && b.order) return a.order - b.order;
          return a.name.localeCompare(b.name);
        });

        setAvailablePhasesForSelectedCrop(phasesForCrop);
        console.log("✅ Successfully set available phases for selected crop");
      }

      setFormData((prev) => ({
        ...prev,
        cropTypeId,
        phaseId: "",
      }));
    } catch (error) {
      console.error("❌ Error loading active phases for crop:", error);
      setAvailablePhasesForSelectedCrop([]);
      setFormData((prev) => ({ ...prev, cropTypeId, phaseId: "" }));
      showErrorAlert(
        "Error",
        "No se pudieron cargar las fases activas del cultivo seleccionado"
      );
    } finally {
      setLoadingPhases(false);
    }
  };

  const extractActiveCropTypesFromOptimizedResponse = (optimizedData) => {
    console.log(
      "🔍 Processing optimized data:",
      JSON.stringify(optimizedData, null, 2)
    );

    if (!optimizedData || !optimizedData.cultivos) {
      console.warn("❌ No optimized data or cultivos found");
      return [];
    }

    const activeCropTypes = optimizedData.cultivos
      .map(({ cultivo, fasesActivas, totalFases }) => {
        console.log(`🌱 Processing crop: ${cultivo?.name}`, {
          cultivo,
          fasesActivasLength: fasesActivas?.length || 0,
          totalFases,
        });

        // Verificar que tenemos cultivo y fasesActivas válidas
        if (!cultivo || !fasesActivas || !Array.isArray(fasesActivas)) {
          console.warn(
            `⚠️ Invalid crop or fasesActivas data for ${
              cultivo?.name || "unknown"
            }`
          );
          return null;
        }

        // El backend ya envía solo las fases activas, no necesitamos filtrar
        console.log(
          `  ✅ Active phases for ${cultivo.name}: ${fasesActivas.length}/${totalFases}`
        );

        // Solo incluir el cultivo si tiene al menos una fase activa
        if (fasesActivas.length === 0) {
          console.warn(`  ⚠️ No active phases found for crop ${cultivo.name}`);
          return null;
        }

        return {
          id: cultivo.id,
          name: cultivo.name, // Backend usa 'name', no 'nombre'
          description: cultivo.description || "",
          fasesActivas: fasesActivas.length,
          totalFases: totalFases,
          fases: fasesActivas, // Usamos fasesActivas directamente
        };
      })
      .filter(Boolean); // Remover nulls

    console.log(
      `🎯 Final active crop types: ${activeCropTypes.length}`,
      activeCropTypes.map((ct) => ({
        id: ct.id,
        name: ct.name,
        activePhasesCount: ct.fasesActivas,
      }))
    );

    return activeCropTypes;
  };
  // Modifica la función handleFarmSelection para usar la nueva función de extracción
  const handleFarmSelection = async (farmId) => {
    if (!farmId) {
      setSelectedFarmInfo(null);
      setFarmCropTypes([]);
      setAvailablePhasesForSelectedCrop([]);
      setFarmPhasesData(null);
      setFormData((prev) => ({
        ...prev,
        farmId: "",
        cropTypeId: "",
        phaseId: "",
      }));
      return;
    }

    try {
      setLoadingFarmInfo(true);
      const selectedFarm = farms.find((farm) => farm.id === farmId);
      if (!selectedFarm) {
        console.warn("No se encontró la finca con ID:", farmId);
        return;
      }

      // Load farm phases data
      const phasesResponse = await getFarmPhasesByCrop(farmId);

      if (phasesResponse.success && phasesResponse.data) {
        // Usar la nueva función que solo extrae cultivos con fases activas
        const extractedActiveCropTypes =
          extractActiveCropTypesFromOptimizedResponse(phasesResponse.data);

        setFarmPhasesData(phasesResponse.data);
        setFarmCropTypes(extractedActiveCropTypes);
        setSelectedFarmInfo({
          ...selectedFarm,
          name: selectedFarm.name,
          village: getLocationValueForFarm("village", selectedFarm),
          city: getLocationValueForFarm("city", selectedFarm),
          department: getLocationValueForFarm("department", selectedFarm),
          country: getLocationValueForFarm("country", selectedFarm),
          plantCount: selectedFarm.plantCount || 0,
          size: selectedFarm.size || 0,
          totalCropTypes: extractedActiveCropTypes.length,
          optimizedData: phasesResponse.data,
        });

        setFormData((prev) => ({
          ...prev,
          farmId,
          cropTypeId: "",
          phaseId: "",
        }));

        // Mostrar mensaje informativo si no hay cultivos activos
        if (extractedActiveCropTypes.length === 0) {
          showCustomAlert(
            "warning",
            "Sin Cultivos Activos",
            "Esta finca no tiene cultivos con fases activas disponibles en este momento.",
            [
              {
                text: "Entendido",
                style: "primary",
                onPress: () => hideCustomAlert(),
              },
            ]
          );
        }
      } else {
        throw new Error(
          phasesResponse.message || "Error al cargar los datos de la finca"
        );
      }
    } catch (error) {
      console.error("Error al cargar detalles de la finca:", error);
      showErrorAlert(
        "Error de Carga",
        "No se pudieron cargar los detalles de la finca seleccionada. Por favor, intente nuevamente."
      );
    } finally {
      setLoadingFarmInfo(false);
    }
  };

  // Actualiza el texto del helper para las fases
  const phaseHelperText = () => {
    const activePhasesCount = availablePhasesForSelectedCrop.length;
    const selectedCropName = getSelectedCropTypeName();

    if (activePhasesCount === 0) {
      return `No hay fases activas disponibles para ${selectedCropName} en esta finca`;
    }

    return `${activePhasesCount} fase${
      activePhasesCount !== 1 ? "s" : ""
    } activa${activePhasesCount !== 1 ? "s" : ""} disponible${
      activePhasesCount !== 1 ? "s" : ""
    } para ${selectedCropName}`;
  };

  const handlePhaseSelection = (selectedPhaseId) => {
    const selectedPhase = availablePhasesForSelectedCrop.find(
      (phase) => phase.id === selectedPhaseId
    );

    if (selectedPhase) {
      const phaseIdForBackend =
        selectedPhase.cultivationPhaseId || selectedPhase.id;
      setFormData((prev) => ({
        ...prev,
        phaseId: phaseIdForBackend,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        phaseId: selectedPhaseId,
      }));
    }
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
        if (!formData.farmId) return "Debe seleccionar una finca";
        if (!formData.cropTypeId) return "Debe seleccionar un tipo de cultivo";
        if (!formData.phaseId) return "Debe seleccionar una fase del cultivo";
        if (!formData.workersNeeded || parseInt(formData.workersNeeded) <= 0) {
          return "Debe especificar un número válido de trabajadores (mayor a 0)";
        }
        break;
      case 2:
        if (!formData.startDate) return "La fecha de inicio es requerida";
        if (!formData.endDate) return "La fecha de finalización es requerida";
        if (formData.endDate < formData.startDate) {
          return "La fecha de finalización debe ser posterior a la fecha de inicio";
        }
        break;
      case 3:
        if (!formData.paymentType) return "El tipo de pago es requerido";
        if (!formData.paymentMode) return "El modo de pago es requerido";

        if (formData.paymentType === "Por_dia") {
          if (
            isNaN(parseFloat(formData.salary)) ||
            parseFloat(formData.salary) <= 0
          ) {
            return "El salario debe ser un número positivo";
          }
        }

        if (
          formData.paymentType === "Por_labor" &&
          !formData.laborType.trim()
        ) {
          return "El tipo de labor es requerido";
        }
        if (
          formData.paymentType === "Por_labor" &&
          (isNaN(parseFloat(formData.pricePerUnit)) ||
            parseFloat(formData.pricePerUnit) <= 0)
        ) {
          return "El precio por planta debe ser un número positivo";
        }
        if (
          formData.paymentType === "Por_labor" &&
          (!formData.plantCount || parseInt(formData.plantCount) <= 0)
        ) {
          return "Debe especificar un número válido de plantas (mayor a 0)";
        }
        if (formData.paymentType === "Por_labor" && !formData.workType.trim()) {
          return "Debe especificar el tipo de trabajo a realizar";
        }
        break;
    }
    return null;
  };

  const handleNext = () => {
    const error = validateCurrentStep();
    if (error) {
      showValidationAlert(error);
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
      showValidationAlert(error);
      return;
    }

    setSubmitting(true);
    try {
      const dataToSend = {
        title: formData.title,
        description: formData.description,
        farmId: formData.farmId,
        cropTypeId: formData.cropTypeId,
        phaseId: formData.phaseId,
        startDate: formData.startDate.toISOString(),
        endDate: formData.endDate.toISOString(),
        duration: String(formData.duration),
        salary: parseFloat(formData.salary),
        requirements: formData.requirements,
        status: formData.status,
        paymentType: formData.paymentType,
        paymentMode: formData.paymentMode,
        laborType: formData.laborType || null,
        pricePerUnit:
          formData.paymentType === "Por_labor"
            ? parseFloat(formData.pricePerUnit)
            : null,
        workersNeeded: parseInt(formData.workersNeeded),
        plantCount:
          formData.paymentType === "Por_labor"
            ? parseInt(formData.plantCount)
            : null,
        workType:
          formData.paymentType === "Por_labor" ? formData.workType : null,
        includesFood: formData.includesFood,
        includesLodging: formData.includesLodging,
      };

      const result = await ApiClient.post("/job-offer/create", dataToSend);

      if (result.success !== false) {
        showSuccessAlert(
          "¡Oferta Creada Exitosamente!",
          `Tu oferta "${formData.title}" ha sido publicada correctamente y ya está disponible para los trabajadores. Podrás gestionar las aplicaciones desde el panel de ofertas.`,
          () => navigation.navigate("JobOffers")
        );
      } else {
        throw new Error(
          result.message || "Error al crear la oferta de trabajo"
        );
      }
    } catch (error) {
      console.error("Error creando la oferta de trabajo:", error);
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "No se pudo crear la oferta de trabajo";
      showErrorAlert(
        "Error al Crear Oferta",
        `Ocurrió un problema al publicar tu oferta: ${errorMessage}. Por favor, verifica la información e intenta nuevamente.`
      );
    } finally {
      setSubmitting(false);
    }
  };

  const getSelectedCropTypeName = () => {
    if (!formData.cropTypeId) return "No seleccionado";
    const selectedCropType = farmCropTypes.find(
      (ct) => ct.id === formData.cropTypeId
    );
    return selectedCropType ? selectedCropType.name : "No encontrado";
  };

  const getSelectedPhaseName = () => {
    if (!formData.phaseId) return "No seleccionada";
    const selectedPhase = availablePhasesForSelectedCrop.find(
      (phase) =>
        phase.cultivationPhaseId === formData.phaseId ||
        phase.id === formData.phaseId
    );
    return selectedPhase ? selectedPhase.name : "No encontrada";
  };

  // Render functions
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

              {/* Título de la oferta */}
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

              {/* Descripción */}
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

              {/* Número de trabajadores */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>
                  Número de trabajadores requeridos *
                </Text>
                <View style={styles.inputWrapper}>
                  <Icon
                    name="groups"
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
                    placeholder="Ej: 5"
                    placeholderTextColor="#999"
                    keyboardType="numeric"
                  />
                </View>
                <Text style={styles.helperText}>
                  Especifique cuántas personas necesita para este trabajo
                </Text>
              </View>

              {/* Selector de finca */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Seleccione una finca *</Text>
                {farms.length === 0 ? (
                  <View style={styles.noDataContainer}>
                    <Icon name="warning" size={24} color="#FF9800" />
                    <Text style={styles.noDataText}>
                      No hay fincas disponibles. Debe crear una finca primero.
                    </Text>
                  </View>
                ) : (
                  <View style={styles.pickerWrapper}>
                    <Icon
                      name="agriculture"
                      size={20}
                      color={PRIMARY_COLOR}
                      style={styles.inputIcon}
                    />
                    <View style={styles.pickerContainer}>
                      <Picker
                        selectedValue={formData.farmId}
                        style={styles.picker}
                        onValueChange={handleFarmSelection}
                        dropdownIconColor={PRIMARY_COLOR}>
                        <Picker.Item label="Seleccione una finca..." value="" />
                        {farms.map((farm) => (
                          <Picker.Item
                            key={farm.id}
                            label={farm.name}
                            value={farm.id}
                          />
                        ))}
                      </Picker>
                    </View>
                  </View>
                )}
                {loadingFarmInfo && (
                  <View style={styles.simpleLoadingContainer}>
                    <ActivityIndicator size="small" color={PRIMARY_COLOR} />
                    <Text style={styles.simpleLoadingText}>
                      Cargando cultivos...
                    </Text>
                  </View>
                )}
              </View>

              {/* Selector de cultivo */}
              {farmCropTypes.length > 0 && !loadingFarmInfo && (
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>
                    Seleccione el tipo de cultivo *
                  </Text>
                  <View style={styles.pickerWrapper}>
                    <Icon
                      name="eco"
                      size={20}
                      color={PRIMARY_COLOR}
                      style={styles.inputIcon}
                    />
                    <View style={styles.pickerContainer}>
                      <Picker
                        selectedValue={formData.cropTypeId}
                        style={styles.picker}
                        onValueChange={handleCropTypeSelection}
                        dropdownIconColor={PRIMARY_COLOR}>
                        <Picker.Item
                          label="Seleccione un cultivo..."
                          value=""
                        />
                        {farmCropTypes.map((cropType) => (
                          <Picker.Item
                            key={cropType.id}
                            label={cropType.name}
                            value={cropType.id}
                          />
                        ))}
                      </Picker>
                    </View>
                  </View>
                  <Text style={styles.helperText}>
                    {farmCropTypes.length} cultivo
                    {farmCropTypes.length !== 1 ? "s" : ""} disponible
                    {farmCropTypes.length !== 1 ? "s" : ""}
                  </Text>
                </View>
              )}

              {/* Mensaje cuando no hay cultivos activos */}
              {formData.farmId &&
                !loadingFarmInfo &&
                farmCropTypes.length === 0 && (
                  <View style={styles.inputContainer}>
                    <View style={styles.warningContainer}>
                      <Icon name="info" size={20} color={COLORS.warning} />
                      <Text style={styles.warningText}>
                        Esta finca no tiene cultivos con fases activas
                        disponibles.
                      </Text>
                    </View>
                  </View>
                )}

              {/* Selector de fase */}
              {formData.cropTypeId && !loadingFarmInfo && (
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>
                    Seleccione la fase del cultivo *
                  </Text>
                  {loadingPhases ? (
                    <View style={styles.simpleLoadingContainer}>
                      <ActivityIndicator size="small" color={PRIMARY_COLOR} />
                      <Text style={styles.simpleLoadingText}>
                        Cargando fases...
                      </Text>
                    </View>
                  ) : availablePhasesForSelectedCrop.length > 0 ? (
                    <>
                      <View style={styles.pickerWrapper}>
                        <Icon
                          name="timeline"
                          size={20}
                          color={PRIMARY_COLOR}
                          style={styles.inputIcon}
                        />
                        <View style={styles.pickerContainer}>
                          <Picker
                            selectedValue={formData.phaseId}
                            style={styles.picker}
                            onValueChange={handlePhaseSelection}
                            dropdownIconColor={PRIMARY_COLOR}>
                            <Picker.Item
                              label="Seleccione una fase..."
                              value=""
                            />
                            {availablePhasesForSelectedCrop.map((phase) => (
                              <Picker.Item
                                key={phase.id}
                                label={phase.name}
                                value={phase.id}
                              />
                            ))}
                          </Picker>
                        </View>
                      </View>
                      <Text style={styles.helperText}>
                        {availablePhasesForSelectedCrop.length} fase
                        {availablePhasesForSelectedCrop.length !== 1 ? "s" : ""}{" "}
                        activa
                        {availablePhasesForSelectedCrop.length !== 1 ? "s" : ""}{" "}
                        disponible
                        {availablePhasesForSelectedCrop.length !== 1 ? "s" : ""}
                      </Text>
                    </>
                  ) : (
                    <View style={styles.warningContainer}>
                      <Icon name="info" size={20} color={COLORS.warning} />
                      <Text style={styles.warningText}>
                        No hay fases activas para {getSelectedCropTypeName()} en
                        esta finca.
                      </Text>
                    </View>
                  )}
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
                      onValueChange={(itemValue) =>
                        handleInputChange("paymentType", itemValue)
                      }
                      dropdownIconColor={PRIMARY_COLOR}>
                      <Picker.Item label="Por Jornal" value="Por_dia" />
                      <Picker.Item label="Por Planta" value="Por_labor" />
                    </Picker>
                  </View>
                </View>
              </View>

              {formData.paymentType === "Por_labor" && (
                <>
                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>Tipo de labor *</Text>
                    <View style={styles.inputWrapper}>
                      <Icon
                        name="work-outline"
                        size={20}
                        color={PRIMARY_COLOR}
                        style={styles.inputIcon}
                      />
                      <TextInput
                        style={styles.input}
                        value={formData.laborType}
                        onChangeText={(text) =>
                          handleInputChange("laborType", text)
                        }
                        placeholder="Ej: Recolección por planta"
                        placeholderTextColor="#999"
                      />
                    </View>
                  </View>

                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>Número de plantas *</Text>
                    <View style={styles.inputWrapper}>
                      <Icon
                        name="local-florist"
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
                        placeholder="Ej: 100"
                        placeholderTextColor="#999"
                        keyboardType="numeric"
                      />
                    </View>
                    <Text style={styles.helperText}>
                      Especifique el número total de plantas a trabajar
                    </Text>
                  </View>

                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>Tipo de trabajo realizar *</Text>
                    <View style={styles.pickerWrapper}>
                      <Icon
                        name="build"
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
                    <Text style={styles.helperText}>
                      Seleccione el tipo de trabajo específico que se realizará
                      en las plantas
                    </Text>
                  </View>
                </>
              )}

              <View style={styles.inputContainer}>
                <Text style={styles.label}>
                  {formData.paymentType === "Por_dia"
                    ? "Salario diario ($) *"
                    : "Precio por planta ($) *"}
                </Text>
                <View style={styles.inputWrapper}>
                  <Icon
                    name="money"
                    size={20}
                    color={PRIMARY_COLOR}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    value={
                      formData.paymentType === "Por_dia"
                        ? formData.salary
                        : formData.pricePerUnit
                    }
                    onChangeText={(text) =>
                      handleInputChange(
                        formData.paymentType === "Por_dia"
                          ? "salary"
                          : "pricePerUnit",
                        text
                      )
                    }
                    placeholder="0"
                    placeholderTextColor="#999"
                    keyboardType="numeric"
                  />
                </View>
              </View>

              {/* Cálculo automático del salario diario para "Por Planta" */}
              {formData.paymentType === "Por_labor" &&
                formData.pricePerUnit &&
                formData.plantCount &&
                !isNaN(parseFloat(formData.pricePerUnit)) &&
                !isNaN(parseInt(formData.plantCount)) && (
                  <View style={styles.salaryCalculationContainer}>
                    <View style={styles.salaryCalculationHeader}>
                      <Icon name="calculate" size={20} color="#059669" />
                      <Text style={styles.salaryCalculationTitle}>
                        Cálculo del Salario Diario
                      </Text>
                    </View>
                    <View style={styles.calculationBreakdown}>
                      <View style={styles.calculationRow}>
                        <Text style={styles.calculationLabel}>
                          Precio por planta:
                        </Text>
                        <Text style={styles.calculationValue}>
                          ${parseFloat(formData.pricePerUnit).toFixed(2)}
                        </Text>
                      </View>
                      <View style={styles.calculationRow}>
                        <Text style={styles.calculationLabel}>
                          Número de plantas:
                        </Text>
                        <Text style={styles.calculationValue}>
                          {parseInt(formData.plantCount)} plantas
                        </Text>
                      </View>
                      <View style={styles.calculationDivider} />
                      <View style={styles.calculationRow}>
                        <Text style={styles.calculationTotalLabel}>
                          Salario diario total:
                        </Text>
                        <Text style={styles.calculationTotalValue}>
                          $
                          {(
                            parseFloat(formData.pricePerUnit) *
                            parseInt(formData.plantCount)
                          ).toFixed(2)}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.calculationNote}>
                      💡 Este valor se calcula automáticamente y representa el
                      ingreso diario total por el trabajo en todas las plantas.
                    </Text>
                  </View>
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

              {/* Sección de Beneficios Simplificada */}
              <View style={styles.benefitsSection}>
                <View style={styles.benefitsSectionHeader}>
                  <Icon name="card-giftcard" size={20} color={PRIMARY_COLOR} />
                  <Text style={styles.benefitsSectionTitle}>
                    Beneficios Incluidos
                  </Text>
                </View>

                <View style={styles.benefitItem}>
                  <View style={styles.benefitContent}>
                    <View style={styles.benefitIconContainer}>
                      <Icon name="restaurant" size={24} color={PRIMARY_COLOR} />
                    </View>
                    <View style={styles.benefitInfo}>
                      <Text style={styles.benefitLabel}>Alimentación</Text>
                      <Text style={styles.benefitDescription}>
                        Incluye comidas durante la jornada laboral
                      </Text>
                    </View>
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
                  <View style={styles.benefitContent}>
                    <View style={styles.benefitIconContainer}>
                      <Icon name="hotel" size={24} color={PRIMARY_COLOR} />
                    </View>
                    <View style={styles.benefitInfo}>
                      <Text style={styles.benefitLabel}>Alojamiento</Text>
                      <Text style={styles.benefitDescription}>
                        Incluye hospedaje durante el periodo de trabajo
                      </Text>
                    </View>
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
                <Text style={styles.sectionTitle}>Resumen de la Oferta</Text>
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
                  <Text style={styles.summaryValue}>
                    {selectedFarmInfo?.name || "No especificada"}
                  </Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Tipo de cultivo:</Text>
                  <Text style={styles.summaryValue}>
                    {getSelectedCropTypeName()}
                  </Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Fase de cultivo:</Text>
                  <Text style={styles.summaryValue}>
                    {getSelectedPhaseName()}
                  </Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>
                    Trabajadores requeridos:
                  </Text>
                  <Text style={[styles.summaryValue, styles.workerCountValue]}>
                    {formData.workersNeeded}{" "}
                    {parseInt(formData.workersNeeded) === 1
                      ? "persona"
                      : "personas"}
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
                  Pago y Beneficios
                </Text>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Tipo de pago:</Text>
                  <Text style={styles.summaryValue}>
                    {formData.paymentType === "Por_dia"
                      ? "Por día"
                      : "Por planta"}
                  </Text>
                </View>
                {formData.paymentType === "Por_labor" && (
                  <>
                    <View style={styles.summaryItem}>
                      <Text style={styles.summaryLabel}>Tipo de labor:</Text>
                      <Text style={styles.summaryValue}>
                        {formData.laborType}
                      </Text>
                    </View>
                    <View style={styles.summaryItem}>
                      <Text style={styles.summaryLabel}>
                        Número de plantas:
                      </Text>
                      <Text
                        style={[styles.summaryValue, styles.plantCountValue]}>
                        {formData.plantCount} plantas
                      </Text>
                    </View>
                    <View style={styles.summaryItem}>
                      <Text style={styles.summaryLabel}>Tipo de trabajo:</Text>
                      <Text style={[styles.summaryValue, styles.workTypeValue]}>
                        {formData.workType === "Podar_Injertar"
                          ? "Podar e Injertar"
                          : formData.workType}
                      </Text>
                    </View>
                  </>
                )}
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>
                    {formData.paymentType === "Por_dia"
                      ? "Salario diario:"
                      : "Precio por planta:"}
                  </Text>
                  <Text style={styles.summaryValue}>
                    $
                    {formData.paymentType === "Por_dia"
                      ? formData.salary
                      : formData.pricePerUnit}
                  </Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Modo de pago:</Text>
                  <Text style={styles.summaryValue}>
                    {formData.paymentMode}
                  </Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Incluye alimentación:</Text>
                  <Text
                    style={[
                      styles.summaryValue,
                      formData.includesFood && styles.benefitIncluded,
                    ]}>
                    {formData.includesFood ? "Sí" : "No"}
                  </Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Incluye alojamiento:</Text>
                  <Text
                    style={[
                      styles.summaryValue,
                      formData.includesLodging && styles.benefitIncluded,
                    ]}>
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
            <Text style={styles.loadingText}>Cargando datos...</Text>
            <Text style={styles.loadingSubtext}>Preparando formulario</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <ScreenLayout navigation={navigation}>
      {/* Componente de Alerta Personalizada */}
      <CustomAlert
        visible={alertConfig.visible}
        type={alertConfig.type}
        title={alertConfig.title}
        message={alertConfig.message}
        buttons={alertConfig.buttons}
        onDismiss={hideCustomAlert}
      />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handlePrevious}>
          <Icon name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Crear Oferta de Trabajo</Text>
          <Text style={styles.headerSubtitle}>Paso {currentStep} de 4</Text>
        </View>
        <View style={styles.headerIcon}>
          <Icon name="work" size={24} color="#fff" />
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
            {currentStep === 4 && "Confirmar Oferta"}
          </Text>
          <Text style={styles.stepDescription}>
            {currentStep === 1 &&
              "Define el título y selecciona el cultivo específico"}
            {currentStep === 2 && "Establece las fechas de trabajo"}
            {currentStep === 3 && "Configura el pago y beneficios"}
            {currentStep === 4 && "Revisa y confirma tu oferta"}
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
                  <Text style={styles.primaryButtonText}>Publicar Oferta</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
      <CustomTabBar navigation={navigation} currentRoute="CreateJobOffer" />
    </ScreenLayout>
  );
};

// Estilos para alertas personalizadas
const customAlertStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  container: {
    width: "100%",
    maxWidth: 400,
  },
  content: {
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  header: {
    alignItems: "center",
    marginBottom: 20,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
  },
  message: {
    fontSize: 16,
    color: "#6b7280",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 24,
  },
  buttonsContainer: {
    flexDirection: "row",
    gap: 12,
  },
  // Agregar estos estilos dentro de StyleSheet.create({...})
  simpleLoadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    backgroundColor: "#f8f9fa",
    borderRadius: 6,
    marginTop: 8,
  },
  simpleLoadingText: {
    marginLeft: 8,
    color: PRIMARY_COLOR,
    fontSize: 14,
  },
  warningContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    backgroundColor: "#fff3cd",
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#ffeaa7",
    gap: 8,
  },
  warningText: {
    flex: 1,
    fontSize: 14,
    color: "#856404",
    lineHeight: 18,
  },
  noDataContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    backgroundColor: "#fff3cd",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ffeaa7",
    gap: 12,
  },
  noDataText: {
    fontSize: 14,
    color: "#856404",
    textAlign: "center",
    flex: 1,
  },
  helperText: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 6,
    fontStyle: "italic",
  },
  button: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
  },
});

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
  helperText: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 4,
    fontStyle: "italic",
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
  // Nuevos estilos para carga de fases
  loadingPhasesContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0f9ff",
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#0ea5e9",
  },
  loadingPhasesText: {
    marginLeft: 10,
    fontSize: 14,
    color: "#0284c7",
    fontStyle: "italic",
  },
  noPhasesContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF3E0",
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#FFB74D",
  },
  noPhasesText: {
    marginLeft: 10,
    flex: 1,
    fontSize: 14,
    color: "#E65100",
  },
  phaseSourceInfo: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: `${COLORS.info}10`,
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
    gap: 6,
  },
  phaseSourceText: {
    flex: 1,
    fontSize: 12,
    color: COLORS.info,
    fontWeight: "500",
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
  // Estilos rediseñados para la sección de beneficios
  benefitsSection: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
  },
  benefitsSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  benefitsSectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: PRIMARY_COLOR,
    marginLeft: 8,
  },
  benefitItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  benefitContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  benefitIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: `${PRIMARY_COLOR}15`,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  benefitInfo: {
    flex: 1,
  },
  benefitLabel: {
    fontSize: 16,
    color: "#374151",
    fontWeight: "600",
    marginBottom: 2,
  },
  benefitDescription: {
    fontSize: 13,
    color: "#6b7280",
    lineHeight: 18,
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
  workerCountValue: {
    color: PRIMARY_COLOR,
    fontWeight: "600",
  },
  plantCountValue: {
    color: "#059669",
    fontWeight: "600",
  },
  workTypeValue: {
    color: "#7c3aed",
    fontWeight: "600",
  },
  benefitIncluded: {
    color: "#059669",
    fontWeight: "600",
  },
  // Estilos para cálculo automático de salario
  salaryCalculationContainer: {
    backgroundColor: "#f0fdf4",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#bbf7d0",
  },
  salaryCalculationHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  salaryCalculationTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#059669",
    marginLeft: 8,
  },
  calculationBreakdown: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
  },
  calculationRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 4,
  },
  calculationLabel: {
    fontSize: 14,
    color: "#374151",
  },
  calculationValue: {
    fontSize: 14,
    fontWeight: "500",
    color: "#1f2937",
  },
  calculationDivider: {
    height: 1,
    backgroundColor: "#e5e7eb",
    marginVertical: 8,
  },
  calculationTotalLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#059669",
  },
  calculationTotalValue: {
    fontSize: 16,
    fontWeight: "700",
    color: "#059669",
  },
  calculationNote: {
    fontSize: 12,
    color: "#6b7280",
    fontStyle: "italic",
    lineHeight: 16,
  },
  calculatedSalaryValue: {
    color: "#059669",
    fontWeight: "600",
  },
  calculationFormula: {
    fontSize: 12,
    color: "#6b7280",
    fontWeight: "400",
    fontStyle: "italic",
  },
  buttonsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 15,
    marginBottom: 30,
    paddingBottom: 80,
    paddingHorizontal: 0,
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
  // Estilos mejorados de FarmInfoCard
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
  farmInfoBadge: {
    backgroundColor: `${PRIMARY_COLOR}20`,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  farmInfoBadgeText: {
    fontSize: 12,
    color: PRIMARY_COLOR,
    fontWeight: "600",
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
  // Estilos para múltiples cultivos
  cropTypesContainer: {
    gap: 12,
  },
  cropTypeCard: {
    backgroundColor: "#f8fafc",
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  selectedCropTypeCard: {
    backgroundColor: `${PRIMARY_COLOR}10`,
    borderColor: PRIMARY_COLOR,
    borderWidth: 2,
  },
  cropTypeHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  cropTypeName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#374151",
    flex: 1,
  },
  selectedCropTypeName: {
    color: PRIMARY_COLOR,
  },
  phasesPreview: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
  },
  phasesPreviewText: {
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
    marginBottom: 2,
  },
  phaseSource: {
    fontSize: 11,
    color: "#8b5cf6",
    fontWeight: "500",
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

export default CreateJobOfferScreen;
