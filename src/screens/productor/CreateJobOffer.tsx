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

const PRIMARY_COLOR = "#284F66";
const SECONDARY_COLOR = "#4A7C94";

const CreateJobOfferScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [farms, setFarms] = useState([]);
  const [loadingFarmInfo, setLoadingFarmInfo] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    farmId: "",
    cropTypeId: "", // Se obtendrá de la finca seleccionada
    phaseId: "", // Se obtendrá de la finca seleccionada
    startDate: new Date(),
    endDate: new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000),
    duration: "",
    salary: "",
    requirements: "",
    paymentType: "Por_dia",
    paymentMode: "Efectivo",
    laborType: "",
    pricePerUnit: "",
    includesFood: false,
    foodCost: "0",
    includesLodging: false,
    lodgingCost: "0",
    status: "Activo",
  });

  const [selectedFarmInfo, setSelectedFarmInfo] = useState(null);

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

  // Función para obtener el phaseId de la finca seleccionada
  const extractPhaseIdFromFarm = (selectedFarm) => {
    // Opción 1: Si phase está disponible directamente con ID
    if (selectedFarm.phase?.id) {
      return selectedFarm.phase.id;
    }

    // Opción 2: Si hay un campo directo phaseId
    if (selectedFarm.phaseId) {
      return selectedFarm.phaseId;
    }

    // Opción 3: Si hay información de phases en array
    if (selectedFarm.phases && selectedFarm.phases.length > 0) {
      const phase = selectedFarm.phases[0];
      if (phase.phaseId) {
        return phase.phaseId;
      }
      if (phase.phase?.id) {
        return phase.phase.id;
      }
    }

    return null;
  };

  // Función para obtener el cropTypeId de la finca seleccionada
  const extractCropTypeIdFromFarm = (selectedFarm) => {
    // Opción 1: Si cropTypesInfo está disponible
    if (selectedFarm.cropTypesInfo && selectedFarm.cropTypesInfo.length > 0) {
      return selectedFarm.cropTypesInfo[0].id;
    }

    // Opción 2: Si cropTypes está disponible con cropTypeId
    if (selectedFarm.cropTypes && selectedFarm.cropTypes.length > 0) {
      const cropType = selectedFarm.cropTypes[0];
      if (cropType.cropTypeId) {
        return cropType.cropTypeId;
      }
      if (cropType.cropType?.id) {
        return cropType.cropType.id;
      }
    }

    // Opción 3: Si hay un campo directo cropTypeId
    if (selectedFarm.cropTypeId) {
      return selectedFarm.cropTypeId;
    }

    return null;
  };

  const loadInitialData = async () => {
    setLoading(true);
    try {
      await loadFarms();
    } catch (error) {
      console.error("Error cargando datos iniciales:", error);
      setError("Error al cargar los datos necesarios");
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
        setError(
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

  const handleFarmSelection = async (farmId) => {
    if (!farmId) {
      setSelectedFarmInfo(null);
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

      // Extraer cropTypeId y phaseId de la finca seleccionada
      const cropTypeId = extractCropTypeIdFromFarm(selectedFarm);
      const phaseId = extractPhaseIdFromFarm(selectedFarm);

      setFormData((prev) => ({
        ...prev,
        farmId,
        cropTypeId: cropTypeId || "",
        phaseId: phaseId || "",
      }));

      // Get crop type name para mostrar
      let cropTypeName = "No especificado";
      if (selectedFarm.cropTypesInfo && selectedFarm.cropTypesInfo.length > 0) {
        cropTypeName = selectedFarm.cropTypesInfo[0].name;
      } else if (selectedFarm.cropTypes && selectedFarm.cropTypes.length > 0) {
        const cropType =
          selectedFarm.cropTypes[0].cropType ||
          (selectedFarm.cropTypes[0].cropTypeId
            ? await fetchCropType(selectedFarm.cropTypes[0].cropTypeId)
            : null);
        cropTypeName = cropType?.name || "No especificado";
      }

      setSelectedFarmInfo({
        ...selectedFarm,
        name: selectedFarm.name,
        cropType: cropTypeName,
        cropTypeId: cropTypeId, // Guardar también el ID
        phaseId: phaseId, // Guardar también el phaseId
        phase: selectedFarm.phase?.name || "No especificada",
        village: getLocationValueForFarm("village", selectedFarm),
        city: getLocationValueForFarm("city", selectedFarm),
        department: getLocationValueForFarm("department", selectedFarm),
        country: getLocationValueForFarm("country", selectedFarm),
        plantCount: selectedFarm.plantCount || 0,
        size: selectedFarm.size || 0,
      });

      // Log para debug
      console.log("Finca seleccionada:", selectedFarm.name);
      console.log("CropTypeId extraído:", cropTypeId);
      console.log("PhaseId extraído:", phaseId);
    } catch (error) {
      console.error("Error al cargar detalles de la finca:", error);
      Alert.alert("Error", "No se pudieron cargar los detalles de la finca");
    } finally {
      setLoadingFarmInfo(false);
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

  const fetchCropType = async (cropTypeId) => {
    try {
      const response = await ApiClient.get(`/crop-type/${cropTypeId}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching crop type:", error);
      return null;
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
        if (!formData.cropTypeId)
          return "La finca seleccionada debe tener un tipo de cultivo asociado";
        if (!formData.phaseId)
          return "La finca seleccionada debe tener una fase de cultivo asociada";
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
          isNaN(parseFloat(formData.salary)) ||
          parseFloat(formData.salary) <= 0
        )
          return "El salario debe ser un número positivo";
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
          return "El precio por unidad debe ser un número positivo";
        }
        if (formData.paymentMode === "Mixto") {
          if (!formData.includesFood)
            return "En modo de pago mixto, debe incluir alimentación";
          if (!formData.includesLodging)
            return "En modo de pago mixto, debe incluir alojamiento";
          if (
            formData.includesFood &&
            (isNaN(parseFloat(formData.foodCost)) ||
              parseFloat(formData.foodCost) < 0)
          ) {
            return "El costo de alimentación debe ser un número no negativo";
          }
          if (
            formData.includesLodging &&
            (isNaN(parseFloat(formData.lodgingCost)) ||
              parseFloat(formData.lodgingCost) < 0)
          ) {
            return "El costo de alojamiento debe ser un número no negativo";
          }
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
        cropTypeId: formData.cropTypeId, // Incluir cropTypeId en el request
        phaseId: formData.phaseId, // Incluir phaseId en el request
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
        includesFood: formData.includesFood,
        foodCost: parseFloat(formData.foodCost) || 0,
        includesLodging: formData.includesLodging,
        lodgingCost: parseFloat(formData.lodgingCost) || 0,
      };

      console.log("Enviando datos:", dataToSend); // Para debug
      console.log("CropTypeId que se envía:", dataToSend.cropTypeId); // Debug específico para cropTypeId
      console.log("PhaseId que se envía:", dataToSend.phaseId); // Debug específico para phaseId

      const result = await ApiClient.post("/job-offer/create", dataToSend);

      if (result.success !== false) {
        Alert.alert(
          "Éxito",
          "La oferta de trabajo se ha creado correctamente",
          [
            {
              text: "OK",
              onPress: () => navigation.navigate("JobOffers"),
            },
          ]
        );
      } else {
        throw new Error(
          result.message || "Error al crear la oferta de trabajo"
        );
      }
    } catch (error) {
      console.error("Error creando la oferta de trabajo:", error);
      Alert.alert(
        "Error",
        error.response?.data?.message ||
          error.message ||
          "No se pudo crear la oferta de trabajo"
      );
    } finally {
      setSubmitting(false);
    }
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
              </View>

              {selectedFarmInfo && (
                <FarmInfoCard
                  farmInfo={selectedFarmInfo}
                  loading={loadingFarmInfo}
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
                      <Picker.Item label="Por día" value="Por_dia" />
                      <Picker.Item label="Por labor" value="Por_labor" />
                    </Picker>
                  </View>
                </View>
              </View>

              {formData.paymentType === "Por_labor" && (
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
                      placeholder="Ej: Recolección por kilo"
                      placeholderTextColor="#999"
                    />
                  </View>
                </View>
              )}

              <View style={styles.inputContainer}>
                <Text style={styles.label}>
                  {formData.paymentType === "Por_dia"
                    ? "Salario diario ($) *"
                    : "Precio por unidad ($) *"}
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

                {formData.includesFood && (
                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>Costo de alimentación ($)</Text>
                    <View style={styles.inputWrapper}>
                      <Icon
                        name="attach-money"
                        size={20}
                        color={PRIMARY_COLOR}
                        style={styles.inputIcon}
                      />
                      <TextInput
                        style={styles.input}
                        value={formData.foodCost}
                        onChangeText={(text) =>
                          handleInputChange("foodCost", text)
                        }
                        placeholder="0"
                        placeholderTextColor="#999"
                        keyboardType="numeric"
                      />
                    </View>
                  </View>
                )}

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

                {formData.includesLodging && (
                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>Costo de alojamiento ($)</Text>
                    <View style={styles.inputWrapper}>
                      <Icon
                        name="attach-money"
                        size={20}
                        color={PRIMARY_COLOR}
                        style={styles.inputIcon}
                      />
                      <TextInput
                        style={styles.input}
                        value={formData.lodgingCost}
                        onChangeText={(text) =>
                          handleInputChange("lodgingCost", text)
                        }
                        placeholder="0"
                        placeholderTextColor="#999"
                        keyboardType="numeric"
                      />
                    </View>
                  </View>
                )}
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
                    {selectedFarmInfo?.cropType || "No especificado"}
                  </Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Fase de cultivo:</Text>
                  <Text style={styles.summaryValue}>
                    {selectedFarmInfo?.phase || "No especificada"}
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
                  <Text style={styles.summaryLabel}>Tipo de pago:</Text>
                  <Text style={styles.summaryValue}>
                    {formData.paymentType === "Por_dia"
                      ? "Por día"
                      : "Por labor"}
                  </Text>
                </View>
                {formData.paymentType === "Por_labor" && (
                  <View style={styles.summaryItem}>
                    <Text style={styles.summaryLabel}>Tipo de labor:</Text>
                    <Text style={styles.summaryValue}>
                      {formData.laborType}
                    </Text>
                  </View>
                )}
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>
                    {formData.paymentType === "Por_dia"
                      ? "Salario diario:"
                      : "Precio por unidad:"}
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
                  <Text style={styles.summaryValue}>
                    {formData.includesFood
                      ? `Sí ($${formData.foodCost})`
                      : "No"}
                  </Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Incluye alojamiento:</Text>
                  <Text style={styles.summaryValue}>
                    {formData.includesLodging
                      ? `Sí ($${formData.lodgingCost})`
                      : "No"}
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
            {currentStep === 1 && "Define el título y selecciona la finca"}
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
    </ScreenLayout>
  );
};

// Componente FarmInfoCard (mantener el mismo que tenías)
const FarmInfoCard = ({ farmInfo, loading }) => {
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
      </View>

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

      {/* Card de Cultivo */}
      <View style={styles.farmInfoCard}>
        <View style={styles.farmInfoSection}>
          <Icon name="spa" size={20} color={SECONDARY_COLOR} />
          <Text style={styles.farmInfoSectionTitle}>
            Información del Cultivo
          </Text>
        </View>

        <View style={styles.cultivationGrid}>
          <View style={styles.cultivationItem}>
            <Text style={styles.cultivationLabel}>Tipo de cultivo</Text>
            <Text style={styles.cultivationValue}>
              {farmInfo.cropType || "No especificado"}
            </Text>
          </View>

          <View style={styles.cultivationItem}>
            <Text style={styles.cultivationLabel}>Fase actual</Text>
            <Text style={styles.cultivationValue}>
              {farmInfo.phase || "No especificada"}
            </Text>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Icon name="grass" size={20} color={SECONDARY_COLOR} />
              <Text style={styles.statValue}>{farmInfo.plantCount || 0}</Text>
              <Text style={styles.statLabel}>Plantas</Text>
            </View>

            <View style={styles.statItem}>
              <Icon name="square-foot" size={20} color={SECONDARY_COLOR} />
              <Text style={styles.statValue}>{farmInfo.size || 0}</Text>
              <Text style={styles.statLabel}>Hectáreas</Text>
            </View>
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
  // Estilos de FarmInfoCard
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
  farmInfoCard: {
    backgroundColor: "white",
    borderRadius: 8,
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
  cultivationGrid: {
    marginTop: 4,
  },
  cultivationItem: {
    marginBottom: 12,
  },
  cultivationLabel: {
    fontSize: 12,
    color: "#666",
    marginBottom: 4,
  },
  cultivationValue: {
    fontSize: 15,
    color: "#333",
    fontWeight: "500",
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  statItem: {
    alignItems: "center",
  },
  statValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: PRIMARY_COLOR,
    marginTop: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
});

export default CreateJobOfferScreen;
