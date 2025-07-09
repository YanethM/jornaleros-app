import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator,
  Modal,
  Image,
  FlatList,
} from "react-native";
import CustomHeaderNoAuth from "../../components/CustomHeaderNoAuth";
import { SignupNavigationProp } from "../../navigation/types";
import { getRoles } from "../../services/rolesService";
import PhoneInput from "../../components/PhoneInput";
import {
  register,
  verifyCode,
  resendVerificationCode,
} from "../../services/authService";
import Icon from "react-native-vector-icons/MaterialIcons";
import { 
  getCountries, 
  getDepartmentsByCountry, 
  getMunicipalitiesByDepartment, 
  getVillagesByMunicipality 
} from "../../services/locationService";
import { Animated } from "react-native";

interface RegisterScreenProps {
  navigation: SignupNavigationProp;
}

const DOCUMENT_TYPES = [
  { id: "CC", nombre: "Cédula de Ciudadanía" },
  { id: "TI", nombre: "Tarjeta de Identidad" },
  { id: "Pasaporte", nombre: "Pasaporte" },
  { id: "CE", nombre: "Cédula de Extranjería" },
  { id: "PPT", nombre: "Permiso de Protección Temporal" },
  { id: "PEP", nombre: "Permiso Especial de Permanencia" },
  { id: "Otro", nombre: "Otro" },
];

const COUNTRY_CODES = [
  { id: "CO", code: "+57", name: "Colombia", phoneLength: 10, flag: "🇨🇴" },
  { id: "VE", code: "+58", name: "Venezuela", phoneLength: 11, flag: "🇻🇪" },
];

const ORGANIZATION_OPTIONS = [
  { title: "COOMPROCAR", value: "COOMPROCAR" },
  { title: "COOPCACAO", value: "COOPCACAO" },
  { title: "FEDECACAO", value: "FEDECACAO" },
  { title: "AMECSAR", value: "AMECSAR" },
  { title: "CCHCV", value: "CCHCV" },
  { title: "AAD234", value: "AAD234" },
  { title: "PANALDEMIEL", value: "PANALDEMIEL" },
  { title: "ASOPIARAUCA", value: "ASOPIARAUCA" },
  { title: "EBC", value: "EBC" },
  { title: "COAGROSAR", value: "COAGROSAR" },
  { title: "Ninguna", value: "Ninguna" },
  { title: "Otra", value: "Otra" },
];

interface RoleOption {
  value: string;
  title: string;
}

// Componente CustomPicker
const CustomPicker = ({
  selectedValue,
  onValueChange,
  options,
  placeholder,
  label,
}) => {
  const [modalVisible, setModalVisible] = useState(false);

  const getSelectedLabel = () => {
    const selected = options.find(
      (option) => option.value === selectedValue || option.id === selectedValue
    );
    return selected ? selected.nombre || selected.title : placeholder;
  };

  const handleSelect = (value) => {
    onValueChange(value);
    setModalVisible(false);
  };

  return (
    <View style={styles.inputContainer}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity
        style={styles.customPickerButton}
        onPress={() => setModalVisible(true)}>
        <Text
          style={[
            styles.customPickerText,
            !selectedValue && styles.placeholderText,
          ]}>
          {getSelectedLabel()}
        </Text>
        <Icon name="keyboard-arrow-down" size={24} color="#666" />
      </TouchableOpacity>

      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}>
        <View style={styles.pickerModalOverlay}>
          <View style={styles.pickerModalContent}>
            <View style={styles.pickerModalHeader}>
              <Text style={styles.pickerModalTitle}>{label}</Text>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={styles.pickerCloseButton}>
                <Icon name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <FlatList
              data={options}
              keyExtractor={(item) => item.id || item.value}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.pickerOption,
                    (selectedValue === item.id ||
                      selectedValue === item.value) &&
                      styles.selectedOption,
                  ]}
                  onPress={() => handleSelect(item.id || item.value)}>
                  <Text
                    style={[
                      styles.pickerOptionText,
                      (selectedValue === item.id ||
                        selectedValue === item.value) &&
                        styles.selectedOptionText,
                    ]}>
                    {item.nombre || item.title}
                  </Text>
                  {(selectedValue === item.id ||
                    selectedValue === item.value) && (
                    <Icon name="check" size={20} color="#284F66" />
                  )}
                </TouchableOpacity>
              )}
              showsVerticalScrollIndicator={false}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};

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

const RegisterScreen: React.FC<RegisterScreenProps> = ({ navigation }) => {
  const handleLoginPress = () => {
    navigation.navigate("Login");
  };

  // Estados básicos del formulario
  const [name, setName] = useState("");
  const [lastname, setLastname] = useState("");
  const [email, setEmail] = useState("");
  const [documentType, setDocumentType] = useState("");
  const [documentNumber, setDocumentNumber] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState("");
  const [organization, setOrganization] = useState("");

  // Estados para teléfono
  const [phoneCountryCode, setPhoneCountryCode] = useState("CO");
  const [phoneNumber, setPhoneNumber] = useState("");
  
  // Estados de UI
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  // Estados para ubicación
  const [countries, setCountries] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [municipalities, setMunicipalities] = useState([]);
  const [villages, setVillages] = useState([]);
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [selectedMunicipality, setSelectedMunicipality] = useState(null);
  const [selectedVillage, setSelectedVillage] = useState(null);
  
  // Estados de carga y modales
  const [loadingLocationData, setLoadingLocationData] = useState(false);
  const [availableRoles, setAvailableRoles] = useState<RoleOption[]>([]);
  const [isLoadingRoles, setIsLoadingRoles] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loading, setLoading] = useState(false);

  // Estados para modales de ubicación
  const [showCountryModal, setShowCountryModal] = useState(false);
  const [showDepartmentModal, setShowDepartmentModal] = useState(false);
  const [showMunicipalityModal, setShowMunicipalityModal] = useState(false);
  const [showVillageModal, setShowVillageModal] = useState(false);

  // Estados para verificación
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState("");
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // ✅ AGREGADO: Estado formData que faltaba
  const [formData, setFormData] = useState({
    country: "",
    state: "",
    city: "",
    village: "",
  });

  useEffect(() => {
    const loadRoles = async () => {
      setIsLoadingRoles(true);
      try {
        const rolesData = await getRoles();
        if (rolesData) {
          setAvailableRoles(rolesData);
        }
      } catch (error) {
        console.error("Error loading roles:", error);
        Alert.alert("Error", "No se pudieron cargar los roles");
      } finally {
        setIsLoadingRoles(false);
      }
    };
    loadRoles();
  }, []);

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

  // ✅ CORREGIDO: useEffect para actualizar formData
  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      country: selectedCountry?.id || "",
      state: selectedDepartment?.id || "",
      city: selectedMunicipality?.id || "",
      village: selectedVillage?.id || "",
    }));
  }, [selectedCountry, selectedDepartment, selectedMunicipality, selectedVillage]);

  const shouldShowOrganizationSelector = (selectedRole) => {
    if (!selectedRole || !availableRoles || availableRoles.length === 0)
      return false;
    const selectedRoleObj = availableRoles.find(
      (r) => r.value === selectedRole
    );
    if (!selectedRoleObj) return false;
    const roleTitle = selectedRoleObj.title?.toLowerCase() || "";
    return roleTitle === "productor";
  };

  const handlePhoneCountryChange = (countryCode: string) => {
    console.log("Phone country changed to:", countryCode);
    setPhoneCountryCode(countryCode);
  };

  const handlePhoneNumberChange = (number: string) => {
    console.log("Phone number changed to:", number);
    setPhoneNumber(number);
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
      onRequestClose={onClose}
      statusBarTranslucent={true}>
      <View style={styles.locationModalOverlay}>
        <View style={styles.locationModalContainer}>
          {/* Indicador visual superior */}
          <View style={styles.modalHandleContainer}>
            <View style={styles.modalHandle} />
          </View>
          
          {/* Header mejorado */}
          <View style={styles.locationModalHeader}>
            <View style={styles.locationModalHeaderContent}>
              <Icon name="location-on" size={24} color="#284F66" style={styles.locationHeaderIcon} />
              <Text style={styles.locationModalTitle}>{title}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.locationModalCloseButton}>
              <Icon name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <View style={styles.locationModalContent}>
            {loading ? (
              <View style={styles.locationLoadingState}>
                <View style={styles.loadingIndicatorContainer}>
                  <ActivityIndicator size="large" color="#284F66" />
                </View>
                <Text style={styles.locationLoadingText}>
                  Cargando opciones...
                </Text>
                <Text style={styles.locationLoadingSubtext}>
                  Por favor espera un momento
                </Text>
              </View>
            ) : data && data.length > 0 ? (
              <ScrollView
                style={styles.locationModalList}
                showsVerticalScrollIndicator={false}
                bounces={true}>
                {data.map((item, index) => (
                  <TouchableOpacity
                    key={item.id}
                    style={[
                      styles.locationModalItem,
                      index === data.length - 1 && styles.locationModalItemLast
                    ]}
                    onPress={() => onSelect(item)}
                    activeOpacity={0.6}
                    onPressIn={() => {}}
                    onPressOut={() => {}}>
                    <View style={styles.locationModalItemContent}>
                      <View style={styles.locationModalItemIcon}>
                        <Icon name="place" size={20} color="#284F66" />
                      </View>
                      <Text style={styles.locationModalItemText}>{item.name}</Text>
                    </View>
                    <View style={styles.locationModalItemArrow}>
                      <Icon
                        name="arrow-forward-ios"
                        size={16}
                        color="#999"
                      />
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            ) : (
              <View style={styles.locationEmptyState}>
                <View style={styles.emptyStateIconContainer}>
                  <Icon name="location-off" size={64} color="#ccc" />
                </View>
                <Text style={styles.locationEmptyStateTitle}>
                  No hay opciones disponibles
                </Text>
                <Text style={styles.locationEmptyStateText}>
                  No se encontraron ubicaciones para mostrar en este momento.
                </Text>
                <TouchableOpacity style={styles.retryButton} onPress={onClose}>
                  <Text style={styles.retryButtonText}>Intentar de nuevo</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );

  const handleLocationSelect = async (type, item) => {
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

  const handleRegister = async () => {
    // ✅ CORREGIDO: Validaciones usando los estados correctos
    if (
      !name ||
      !lastname ||
      !email ||
      !documentType ||
      !documentNumber ||
      !phoneNumber ||
      !password ||
      !confirmPassword ||
      !selectedCountry ||
      !selectedDepartment ||
      !selectedMunicipality ||
      !role
    ) {
      Alert.alert("Error", "Por favor completa todos los campos obligatorios");
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert("Error", "Por favor ingresa un correo electrónico válido");
      return;
    }

    // Phone validation
    const selectedPhoneCountry = COUNTRY_CODES.find(
      (c) => c.id === phoneCountryCode
    );
    if (
      selectedPhoneCountry &&
      phoneNumber.length !== selectedPhoneCountry.phoneLength
    ) {
      Alert.alert(
        "Error",
        `El número de teléfono debe tener ${selectedPhoneCountry.phoneLength} dígitos para ${selectedPhoneCountry.name}`
      );
      return;
    }

    if (!/^\d+$/.test(phoneNumber)) {
      Alert.alert("Error", "El número de teléfono solo debe contener dígitos");
      return;
    }

    // Password validation
    if (password !== confirmPassword) {
      Alert.alert("Error", "Las contraseñas no coinciden");
      return;
    }

    if (password.length < 6) {
      Alert.alert("Error", "La contraseña debe tener al menos 6 caracteres");
      return;
    }

    setIsLoading(true);

    try {
      // ✅ CORREGIDO: Usar los IDs correctos de los estados seleccionados
      const registerData = {
        name,
        lastname,
        email,
        documentId: documentNumber,
        documentType,
        nationality: "COLOMBIANO",
        phone: phoneNumber,
        password,
        roleId: role,
        city: selectedMunicipality.id,
        state: selectedDepartment.id,
        country: selectedCountry.id,
        ...(organization && { organization }),
      };

      console.log("Registration data:", JSON.stringify(registerData, null, 2));

      const response = await register(registerData);
      console.log("Registration response:", JSON.stringify(response, null, 2));

      if (response.success) {
        setRegisteredEmail(email);
        setShowVerificationModal(true);
      } else {
        const message = response?.message || "Error desconocido al registrarse";
        Alert.alert("Error", message);
      }
    } catch (error) {
      console.error("Error en registro:", error);

      if (error.response) {
        console.log("Error response:", JSON.stringify(error.response, null, 2));

        if (error.response.data) {
          console.log(
            "Error response data:",
            JSON.stringify(error.response.data, null, 2)
          );

          if (error.response.data.fields && error.response.data.msg) {
            Alert.alert(
              "Error",
              `${
                error.response.data.msg
              }\nCampos: ${error.response.data.fields.join(", ")}`
            );
          } else if (error.response.data.message) {
            Alert.alert("Error", error.response.data.message);
          } else if (typeof error.response.data === "string") {
            Alert.alert("Error", error.response.data);
          } else {
            Alert.alert(
              "Error",
              "Error al registrarse. Por favor verifica todos los campos."
            );
          }
        } else if (error.message) {
          Alert.alert("Error", error.message);
        } else {
          Alert.alert("Error", "Error al registrarse");
        }
      } else if (error.message) {
        Alert.alert("Error", `Error: ${error.message}`);
      } else {
        Alert.alert("Error", "Error de conexión. Por favor intenta de nuevo.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      Alert.alert("Error", "Por favor ingresa un código de 6 dígitos");
      return;
    }

    setIsVerifying(true);

    try {
      const verifyResponse = await verifyCode({
        email: registeredEmail,
        code: verificationCode,
      });

      if (verifyResponse.success) {
        setShowVerificationModal(false);
        setVerificationCode("");
        setShowSuccessModal(true);
      } else {
        Alert.alert("Error", verifyResponse.message || "Código inválido");
      }
    } catch (error) {
      console.error("Error verificando código:", error);
      Alert.alert("Error", "Error al verificar el código");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendCode = async () => {
    try {
      const response = await resendVerificationCode(registeredEmail);

      if (response.success) {
        Alert.alert(
          "Código reenviado",
          "Se ha enviado un nuevo código a tu correo electrónico."
        );
      } else {
        Alert.alert(
          "Error",
          response.message || "No se pudo reenviar el código"
        );
      }
    } catch (error) {
      Alert.alert("Error", "No se pudo reenviar el código");
    }
  };

  
  return (
    <View style={styles.container}>
      <CustomHeaderNoAuth navigation={navigation} />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled">
          <View style={styles.content}>
            <View style={styles.headerContainer}>
              <Text style={styles.title}>Crea tu cuenta</Text>
              <Text style={styles.subtitle}>Regístrate para comenzar</Text>
            </View>

            <View style={styles.formContainer}>
              {/* Campos básicos */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Nombre(s)</Text>
                <TextInput
                  style={styles.input}
                  value={name}
                  onChangeText={setName}
                  placeholder="Juan Pérez"
                  placeholderTextColor="#999"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Apellido(s)</Text>
                <TextInput
                  style={styles.input}
                  value={lastname}
                  onChangeText={setLastname}
                  placeholder="Pérez"
                  placeholderTextColor="#999"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Correo electrónico</Text>
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="ejemplo@correo.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  placeholderTextColor="#999"
                />
              </View>

              <CustomPicker
                selectedValue={documentType}
                onValueChange={setDocumentType}
                options={DOCUMENT_TYPES}
                placeholder="Selecciona tipo de documento"
                label="Tipo de documento"
              />

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Número de documento</Text>
                <TextInput
                  style={styles.input}
                  value={documentNumber}
                  onChangeText={setDocumentNumber}
                  placeholder="12345678"
                  keyboardType="numeric"
                  placeholderTextColor="#999"
                />
              </View>

              <PhoneInput
                label="Número de celular"
                countryCode={phoneCountryCode}
                phoneNumber={phoneNumber}
                onCountryChange={handlePhoneCountryChange}
                onPhoneChange={handlePhoneNumberChange}
                countries={COUNTRY_CODES}
              />

              {/* ✅ AGREGADO: Botones para seleccionar ubicación */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>País*</Text>
                <TouchableOpacity
                  style={styles.locationButton}
                  onPress={() => setShowCountryModal(true)}>
                  <Text style={[
                    styles.locationButtonText,
                    !selectedCountry && styles.placeholderText
                  ]}>
                    {selectedCountry ? selectedCountry.name : "Seleccionar país"}
                  </Text>
                  <Icon name="keyboard-arrow-down" size={24} color="#666" />
                </TouchableOpacity>
              </View>

              {selectedCountry && (
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Departamento / Estado*</Text>
                  <TouchableOpacity
                    style={styles.locationButton}
                    onPress={() => setShowDepartmentModal(true)}
                    disabled={departments.length === 0}>
                    <Text style={[
                      styles.locationButtonText,
                      !selectedDepartment && styles.placeholderText
                    ]}>
                      {selectedDepartment ? selectedDepartment.name : "Seleccionar departamento"}
                    </Text>
                    <Icon name="keyboard-arrow-down" size={24} color="#666" />
                  </TouchableOpacity>
                </View>
              )}

              {selectedDepartment && (
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Municipio / Ciudad*</Text>
                  <TouchableOpacity
                    style={styles.locationButton}
                    onPress={() => setShowMunicipalityModal(true)}
                    disabled={municipalities.length === 0}>
                    <Text style={[
                      styles.locationButtonText,
                      !selectedMunicipality && styles.placeholderText
                    ]}>
                      {selectedMunicipality ? selectedMunicipality.name : "Seleccionar municipio"}
                    </Text>
                    <Icon name="keyboard-arrow-down" size={24} color="#666" />
                  </TouchableOpacity>
                </View>
              )}

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Contraseña</Text>
                <View style={styles.passwordInputContainer}>
                  <TextInput
                    style={styles.passwordInput}
                    value={password}
                    onChangeText={setPassword}
                    placeholder="********"
                    secureTextEntry={!showPassword}
                    placeholderTextColor="#999"
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.passwordToggle}>
                    <Icon
                      name={showPassword ? "visibility-off" : "visibility"}
                      size={24}
                      color="#666"
                    />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Confirmar contraseña</Text>
                <View style={styles.passwordInputContainer}>
                  <TextInput
                    style={styles.passwordInput}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    placeholder="********"
                    secureTextEntry={!showConfirmPassword}
                    placeholderTextColor="#999"
                  />
                  <TouchableOpacity
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={styles.passwordToggle}>
                    <Icon
                      name={
                        showConfirmPassword ? "visibility-off" : "visibility"
                      }
                      size={24}
                      color="#666"
                    />
                  </TouchableOpacity>
                </View>
              </View>

              <CustomPicker
                selectedValue={role}
                onValueChange={setRole}
                options={availableRoles}
                placeholder="Selecciona tu perfil"
                label="Perfil*"
              />

              {shouldShowOrganizationSelector(role) && (
                <CustomPicker
                  selectedValue={organization}
                  onValueChange={setOrganization}
                  options={ORGANIZATION_OPTIONS}
                  placeholder="Selecciona una organización"
                  label="Organización"
                />
              )}

              <TouchableOpacity
                style={[
                  styles.registerButton,
                  isLoading && styles.disabledButton,
                ]}
                onPress={handleRegister}
                disabled={isLoading}>
                {isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.registerButtonText}>Registrarse</Text>
                )}
              </TouchableOpacity>


              <View style={styles.loginContainer}>
                <TouchableOpacity onPress={handleLoginPress}>
                  <Text style={styles.signupText}>
                    ¿Ya tienes cuenta?{" "}
                    <Text style={styles.signupLink}>Inicia sesión</Text>
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.termsContainer}>
                <Text style={styles.termsText}>
                  Al registrarte, aceptas nuestros{" "}
                  <Text
                    style={styles.termsLink}
                    onPress={() => setShowTermsModal(true)}>
                    Términos de servicio
                  </Text>{" "}
                  y{" "}
                  <Text
                    style={styles.termsLink}
                    onPress={() => setShowPrivacyModal(true)}>
                    Política de privacidad
                  </Text>
                </Text>
              </View>
            </View>
          </View>
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

        {/* Modal de verificación */}
        <Modal
          visible={showVerificationModal}
          animationType="fade"
          transparent={true}
          statusBarTranslucent={true}
          onRequestClose={() => setShowVerificationModal(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={{ alignItems: "center", marginBottom: 16 }}>
                <Icon name="verified-user" size={48} color="#284F66" />
              </View>

              <Text style={styles.modalTitle}>Verifica tu cuenta</Text>

              <Text style={styles.modalDescription}>
                Hemos enviado un código de 6 dígitos a tu correo electrónico:
              </Text>

              <Text style={styles.modalEmail}>{registeredEmail}</Text>

              <TextInput
                style={styles.codeInput}
                value={verificationCode}
                onChangeText={setVerificationCode}
                placeholder="000000"
                keyboardType="numeric"
                maxLength={6}
                autoFocus
                textAlign="center"
              />

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[
                    styles.verifyButton,
                    isVerifying && styles.disabledButton,
                  ]}
                  onPress={handleVerifyCode}
                  disabled={isVerifying || verificationCode.length !== 6}>
                  {isVerifying ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.verifyButtonText}>Verificar</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setShowVerificationModal(false)}
                  disabled={isVerifying}>
                  <Text style={styles.cancelButtonText}>Cancelar</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={styles.resendButton}
                onPress={handleResendCode}
                disabled={isVerifying}>
                <Text style={styles.resendButtonText}>
                  ¿No recibiste el código? Reenviar
                </Text>
              </TouchableOpacity>

              <Text style={{ color: "#777", fontSize: 12, marginTop: 8 }}>
                El código expirará en 15 minutos
              </Text>
            </View>
          </View>
        </Modal>

        {/* Modal de términos */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={showTermsModal}
          onRequestClose={() => setShowTermsModal(false)}>
          <View style={styles.fullScreenModal}>
            <View style={styles.newModalContainer}>
              <View style={styles.newModalHeader}>
                <View style={styles.headerTitleContainer}>
                  <Icon
                    name="agriculture"
                    size={24}
                    color="#fff"
                    style={styles.headerIcon}
                  />
                  <Text style={styles.newModalTitle}>
                    Términos y Condiciones
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => setShowTermsModal(false)}
                  style={styles.newCloseButton}>
                  <Icon name="close" size={24} color="#fff" />
                </TouchableOpacity>
              </View>

              <ScrollView
                style={styles.newModalScroll}
                showsVerticalScrollIndicator={false}>
                <View style={styles.documentContainer}>
                  <Text style={styles.documentTitle}>
                    TÉRMINOS Y CONDICIONES DE USO
                  </Text>

                  <Text style={styles.lastUpdated}>
                    Última actualización: 29 de mayo, 2025
                  </Text>

                  <Text style={styles.documentIntro}>
                    Bienvenido a{" "}
                    <Text style={styles.brandName}>Jornaleando</Text>, una
                    plataforma digital que conecta a{" "}
                    <Text style={styles.highlight}>productores agrícolas</Text>{" "}
                    y <Text style={styles.highlight}>trabajadores rurales</Text>{" "}
                    para facilitar la oferta y demanda de trabajo en cultivos
                    como sacha inchi, miel y cacao.
                  </Text>

                  <Text style={styles.sectionTitle}>1. Aceptación</Text>
                  <Text style={styles.sectionContent}>
                    Al registrarte y utilizar la aplicación, aceptas los
                    presentes Términos y Condiciones. Si no estás de acuerdo con
                    ellos, no utilices la plataforma.
                  </Text>

                  <Text style={styles.sectionTitle}>
                    2. Uso de la Plataforma
                  </Text>
                  <Text style={styles.bulletPoint}>
                    • <Text style={styles.highlight}>Productores</Text> pueden
                    crear publicaciones para contratar jornaleros.
                  </Text>
                  <Text style={styles.bulletPoint}>
                    • <Text style={styles.highlight}>Trabajadores</Text> pueden
                    postular a trabajos disponibles en su zona.
                  </Text>
                  <Text style={styles.bulletPoint}>
                    • La app solo se debe usar para fines lícitos y relacionados
                    con el objetivo de Jornaleando.
                  </Text>

                  <Text style={styles.sectionTitle}>
                    3. Registro de Usuario
                  </Text>
                  <Text style={styles.bulletPoint}>
                    • Debes proporcionar información veraz, actualizada y
                    completa.
                  </Text>
                  <Text style={styles.bulletPoint}>
                    • Jornaleando se reserva el derecho de suspender o eliminar
                    cuentas que incumplan las normas.
                  </Text>

                  <Text style={styles.sectionTitle}>
                    4. Responsabilidad de las Partes
                  </Text>
                  <Text style={styles.bulletPoint}>
                    • Jornaleando actúa como{" "}
                    <Text style={styles.highlight}>intermediario</Text> entre
                    las partes, pero no garantiza la contratación ni la calidad
                    del servicio entre productor y trabajador.
                  </Text>
                  <Text style={styles.bulletPoint}>
                    • Los acuerdos laborales y pagos son responsabilidad directa
                    entre ambas partes.
                  </Text>

                  <Text style={styles.sectionTitle}>
                    5. Comportamiento Prohibido
                  </Text>
                  <Text style={styles.sectionContent}>Está prohibido:</Text>
                  <Text style={styles.bulletPoint}>
                    • Usar datos falsos o suplantar identidad.
                  </Text>
                  <Text style={styles.bulletPoint}>
                    • Publicar contenido ofensivo o discriminatorio.
                  </Text>
                  <Text style={styles.bulletPoint}>
                    • Utilizar la plataforma con fines ajenos al trabajo
                    agrícola.
                  </Text>

                  <Text style={styles.sectionTitle}>
                    6. Suspensión y Terminación
                  </Text>
                  <Text style={styles.sectionContent}>
                    Podemos suspender o eliminar cuentas que infrinjan estos
                    términos, sin previo aviso.
                  </Text>

                  <Text style={styles.sectionTitle}>
                    7. Cambios a los Términos
                  </Text>
                  <Text style={styles.sectionContent}>
                    Podemos modificar estos términos en cualquier momento. Te
                    notificaremos por la app o correo electrónico.
                  </Text>
                </View>
              </ScrollView>

              <View style={styles.newModalFooter}>
                <TouchableOpacity
                  style={styles.newAcceptButton}
                  onPress={() => setShowTermsModal(false)}>
                  <Text style={styles.newAcceptButtonText}>
                    Aceptar y Continuar
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Modal de privacidad */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={showPrivacyModal}
          onRequestClose={() => setShowPrivacyModal(false)}>
          <View style={styles.fullScreenModal}>
            <View style={styles.newModalContainer}>
              <View style={styles.newModalHeader}>
                <View style={styles.headerTitleContainer}>
                  <Icon
                    name="security"
                    size={24}
                    color="#fff"
                    style={styles.headerIcon}
                  />
                  <Text style={styles.newModalTitle}>
                    Política de Privacidad
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => setShowPrivacyModal(false)}
                  style={styles.newCloseButton}>
                  <Icon name="close" size={24} color="#fff" />
                </TouchableOpacity>
              </View>

              <ScrollView
                style={styles.newModalScroll}
                showsVerticalScrollIndicator={false}>
                <View style={styles.documentContainer}>
                  <Text style={styles.documentTitle}>
                    POLÍTICA DE PRIVACIDAD
                  </Text>

                  <Text style={styles.lastUpdated}>
                    Última actualización: 29 de mayo, 2025
                  </Text>

                  <Text style={styles.documentIntro}>
                    En <Text style={styles.brandName}>Jornaleando</Text>, tu
                    privacidad es muy importante para nosotros. Esta política
                    explica qué datos recolectamos y cómo los usamos.
                  </Text>

                  <Text style={styles.sectionTitle}>
                    1. Información que recopilamos
                  </Text>
                  <Text style={styles.sectionContent}>
                    Recopilamos información como:
                  </Text>
                  <Text style={styles.bulletPoint}>
                    • Datos personales (nombre, DNI, ubicación, correo, número
                    de celular)
                  </Text>
                  <Text style={styles.bulletPoint}>
                    • Información del perfil (tipo de usuario: productor o
                    trabajador)
                  </Text>
                  <Text style={styles.bulletPoint}>
                    • Ubicación geográfica (para mostrar trabajos cercanos)
                  </Text>
                  <Text style={styles.bulletPoint}>
                    • Actividad en la app (postulaciones, publicaciones,
                    calificaciones)
                  </Text>

                  <Text style={styles.sectionTitle}>
                    2. Uso de la información
                  </Text>
                  <Text style={styles.sectionContent}>
                    Utilizamos los datos para:
                  </Text>
                  <Text style={styles.bulletPoint}>
                    • Facilitar la conexión entre productores y trabajadores.
                  </Text>
                  <Text style={styles.bulletPoint}>
                    • Mejorar el funcionamiento de la app.
                  </Text>
                  <Text style={styles.bulletPoint}>
                    • Enviar notificaciones importantes sobre tu actividad.
                  </Text>

                  <Text style={styles.sectionTitle}>
                    3. Compartición de datos
                  </Text>
                  <Text style={styles.sectionContent}>
                    No vendemos tus datos. Solo los compartimos cuando es
                    necesario para el funcionamiento del servicio (por ejemplo,
                    mostrar tu perfil en una oferta laboral).
                  </Text>

                  <Text style={styles.sectionTitle}>4. Seguridad</Text>
                  <Text style={styles.sectionContent}>
                    Implementamos medidas técnicas y organizativas para proteger
                    tu información.
                  </Text>

                  <Text style={styles.sectionTitle}>
                    5. Derechos del usuario
                  </Text>
                  <Text style={styles.sectionContent}>Tienes derecho a:</Text>
                  <Text style={styles.bulletPoint}>
                    • Acceder, actualizar o eliminar tu información personal.
                  </Text>
                  <Text style={styles.bulletPoint}>
                    • Retirar tu consentimiento y cerrar tu cuenta en cualquier
                    momento.
                  </Text>

                  <Text style={styles.sectionTitle}>6. Contacto</Text>
                  <Text style={styles.sectionContent}>
                    Para consultas sobre privacidad, puedes escribirnos a:{" "}
                    <Text style={styles.highlight}>
                      jornaleando.arauca@gmail.com
                    </Text>
                  </Text>
                </View>
              </ScrollView>

              <View style={styles.newModalFooter}>
                <TouchableOpacity
                  style={styles.newAcceptButton}
                  onPress={() => setShowPrivacyModal(false)}>
                  <Text style={styles.newAcceptButtonText}>
                    Aceptar y Continuar
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Modal de éxito */}
        <Modal
          visible={showSuccessModal}
          animationType="fade"
          transparent={true}
          statusBarTranslucent={true}
          onRequestClose={() => setShowSuccessModal(false)}>
          <View style={styles.successModalOverlay}>
            <View style={styles.successModalContent}>
              <View style={styles.successIconContainer}>
                <View style={styles.successIconCircle}>
                  <Icon name="check" size={40} color="#fff" />
                </View>
                <View style={[styles.decorativeCircle, styles.circle1]} />
                <View style={[styles.decorativeCircle, styles.circle2]} />
                <View style={[styles.decorativeCircle, styles.circle3]} />
              </View>

              <Text style={styles.successTitle}>¡Cuenta Verificada!</Text>
              <Text style={styles.successMessage}>
                Tu cuenta ha sido verificada exitosamente.{"\n"}
                Ya puedes iniciar sesión y comenzar a usar Jornaleando.
              </Text>

              <View style={styles.benefitsContainer}>
                <View style={styles.benefitItem}>
                  <Icon name="work" size={24} color="#284F66" />
                  <Text style={styles.benefitText}>Encuentra trabajo</Text>
                </View>
                <View style={styles.benefitItem}>
                  <Icon name="people" size={24} color="#284F66" />
                  <Text style={styles.benefitText}>Conecta con otros</Text>
                </View>
                <View style={styles.benefitItem}>
                  <Icon name="star" size={24} color="#284F66" />
                  <Text style={styles.benefitText}>Califica y opina</Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.continueButton}
                onPress={() => {
                  setShowSuccessModal(false);
                  navigation.navigate("Login");
                }}>
                <Text style={styles.continueButtonText}>Continuar a Login</Text>
                <Icon
                  name="arrow-forward"
                  size={20}
                  color="#fff"
                  style={{ marginLeft: 8 }}
                />
              </TouchableOpacity>

              <Text style={styles.welcomeText}>
                ¡Bienvenido a la comunidad de Jornaleando!
              </Text>
            </View>
          </View>
        </Modal>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center', // Centrado vertical
    paddingBottom: 40, // Espacio inferior
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 20,
    maxWidth: 420, // Ancho máximo para pantallas grandes
    alignSelf: 'center', // Centrado horizontal
    width: '100%',
  },
  headerContainer: {
    marginBottom: 32,
    alignItems: "center",
    paddingTop: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#284F66",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
  },
  formContainer: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: 20,
    width: '100%',
  },
  label: {
    fontSize: 14,
    color: "#374151",
    marginBottom: 8,
    fontWeight: "600",
  },
  input: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: "#111827",
    backgroundColor: "#FAFBFC",
    width: '100%',
    // Sombra sutil
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    // Focus state
    borderWidth: 1,
  },
  inputFocused: {
    borderColor: "#284F66",
    backgroundColor: "#fff",
    shadowColor: "#284F66",
    shadowOpacity: 0.15,
  },
  passwordInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    backgroundColor: "#FAFBFC",
    overflow: "hidden",
    width: '100%',
    // Sombra sutil
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: "#111827",
  },
  passwordToggle: {
    paddingHorizontal: 12,
    paddingVertical: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  customPickerButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "#FAFBFC",
    minHeight: 50,
    width: '100%',
    // Sombra sutil
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  customPickerText: {
    fontSize: 16,
    color: "#111827",
    flex: 1,
  },
  placeholderText: {
    color: "#9CA3AF",
  },
  locationButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "#FAFBFC",
    minHeight: 50,
    width: '100%',
    // Sombra sutil
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  locationButtonText: {
    fontSize: 16,
    color: "#111827",
    flex: 1,
  },
  
  // Sección mejorada para pickers/modales
  pickerModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  pickerModalContent: {
    backgroundColor: "#fff",
    borderRadius: 20,
    maxHeight: "75%",
    width: "100%",
    maxWidth: 400,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 15 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 15,
  },
  pickerModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 20,
    backgroundColor: "#F8FAFC",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  pickerModalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#284F66",
  },
  pickerCloseButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: "#E5E7EB",
  },
  pickerOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  selectedOption: {
    backgroundColor: "#EBF4FF",
    borderLeftWidth: 4,
    borderLeftColor: "#284F66",
  },
  pickerOptionText: {
    fontSize: 16,
    color: "#374151",
    flex: 1,
  },
  selectedOptionText: {
    color: "#284F66",
    fontWeight: "600",
  },
  
  // Botones mejorados
  registerButton: {
    backgroundColor: "#284F66",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 24,
    marginBottom: 20,
    width: '100%',
    // Sombra más prominente
    shadowColor: "#284F66",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  registerButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  disabledButton: {
    opacity: 0.7,
  },
  
  // Enlaces centrados
  loginContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 20,
    alignItems: 'center',
  },
  termsContainer: {
    marginBottom: 30,
    paddingHorizontal: 16,
  },
  termsText: {
    textAlign: "center",
    color: "#6B7280",
    fontSize: 13,
    lineHeight: 20,
  },
  termsLink: {
    color: "#284F66",
    textDecorationLine: "underline",
    fontWeight: "600",
  },
  signupText: {
    color: "#6B7280",
    fontSize: 14,
    textAlign: 'center',
  },
  signupLink: {
    color: "#284F66",
    fontWeight: "600",
  },
  
  // Modales de pantalla completa mejorados
  fullScreenModal: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.85)",
  },
  newModalContainer: {
    flex: 1,
    backgroundColor: "#fff",
    marginTop: 60,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 16,
  },
  newModalHeader: {
    backgroundColor: "#284F66",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  headerTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  headerIcon: {
    marginRight: 12,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    padding: 8,
    borderRadius: 8,
  },
  newModalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
  },
  newCloseButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
  newModalScroll: {
    flex: 1,
    backgroundColor: "#FAFBFC",
  },
  documentContainer: {
    padding: 24,
    backgroundColor: "#fff",
    margin: 16,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  documentTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#284F66",
    textAlign: "center",
    marginBottom: 16,
  },
  lastUpdated: {
    fontSize: 12,
    color: "#9CA3AF",
    fontStyle: "italic",
    textAlign: "center",
    marginBottom: 24,
  },
  documentIntro: {
    fontSize: 16,
    color: "#374151",
    lineHeight: 26,
    marginBottom: 28,
    textAlign: "justify",
  },
  brandName: {
    fontWeight: "bold",
    color: "#284F66",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#284F66",
    marginTop: 24,
    marginBottom: 12,
  },
  sectionContent: {
    fontSize: 16,
    color: "#374151",
    lineHeight: 24,
    marginBottom: 12,
  },
  bulletPoint: {
    fontSize: 16,
    color: "#374151",
    lineHeight: 24,
    marginBottom: 10,
    marginLeft: 12,
  },
  highlight: {
    fontWeight: "600",
    color: "#284F66",
  },
  newModalFooter: {
    backgroundColor: "#fff",
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 4,
  },
  newAcceptButton: {
    backgroundColor: "#284F66",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: "#284F66",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  newAcceptButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  
  // Modal de verificación mejorado
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 32,
    width: "100%",
    maxWidth: 420,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 15 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 15,
  },
  modalTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#284F66",
    marginBottom: 16,
    textAlign: "center",
  },
  modalDescription: {
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 12,
    lineHeight: 26,
  },
  modalEmail: {
    fontSize: 18,
    color: "#284F66",
    fontWeight: "bold",
    marginBottom: 32,
    textAlign: "center",
  },
  codeInput: {
    borderWidth: 2,
    borderColor: "#284F66",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 32,
    fontWeight: "bold",
    color: "#111827",
    width: "100%",
    textAlign: "center",
    letterSpacing: 16,
    marginBottom: 32,
    backgroundColor: "#F8FAFC",
    shadowColor: "#284F66",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  modalButtons: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 20,
    width: "100%",
  },
  verifyButton: {
    backgroundColor: "#284F66",
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    flex: 1,
    alignItems: "center",
    shadowColor: "#284F66",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  verifyButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  cancelButton: {
    backgroundColor: "#F3F4F6",
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    flex: 1,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  cancelButtonText: {
    color: "#6B7280",
    fontSize: 16,
    fontWeight: "600",
  },
  resendButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginTop: 8,
  },
  resendButtonText: {
    color: "#284F66",
    fontSize: 14,
    fontWeight: "600",
    textDecorationLine: "underline",
  },
  
  // Modal de éxito mejorado
  successModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.85)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  successModalContent: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 36,
    width: "100%",
    maxWidth: 420,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.3,
    shadowRadius: 25,
    elevation: 20,
  },
  successIconContainer: {
    position: "relative",
    marginBottom: 28,
    alignItems: "center",
    justifyContent: "center",
    width: 120,
    height: 120,
  },
  successIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#284F66",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#284F66",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
    zIndex: 2,
  },
  decorativeCircle: {
    position: "absolute",
    borderRadius: 50,
    opacity: 0.3,
  },
  circle1: {
    width: 30,
    height: 30,
    backgroundColor: "#284F66",
    top: 10,
    right: 5,
    zIndex: 1,
  },
  circle2: {
    width: 20,
    height: 20,
    backgroundColor: "#284F54",
    bottom: 15,
    left: 10,
    zIndex: 1,
  },
  circle3: {
    width: 25,
    height: 25,
    backgroundColor: "#284F80",
    top: 30,
    left: -5,
    zIndex: 1,
  },
  successTitle: {
    fontSize: 30,
    fontWeight: "bold",
    color: "#284F66",
    marginBottom: 16,
    textAlign: "center",
  },
  successMessage: {
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 26,
    marginBottom: 28,
  },
  benefitsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    marginBottom: 32,
    paddingHorizontal: 12,
  },
  benefitItem: {
    alignItems: "center",
    flex: 1,
  },
  benefitText: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 6,
    textAlign: "center",
    fontWeight: "600",
  },
  continueButton: {
    backgroundColor: "#284F66",
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 28,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    minWidth: 220,
    shadowColor: "#284F66",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
  },
  continueButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  welcomeText: {
    fontSize: 14,
    color: "#284F66",
    fontWeight: "600",
    textAlign: "center",
  },
  
  // Modales de ubicación mejorados
  locationModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.65)",
    justifyContent: "flex-end",
  },
  locationModalContainer: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: "85%",
    minHeight: "50%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 16,
  },
  modalHandleContainer: {
    alignItems: "center",
    paddingVertical: 12,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: "#D1D5DB",
    borderRadius: 2,
  },
  locationModalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
    backgroundColor: "#fff",
  },
  locationModalHeaderContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  locationHeaderIcon: {
    marginRight: 12,
    backgroundColor: "#EBF4FF",
    padding: 10,
    borderRadius: 12,
  },
  locationModalTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#284F66",
    flex: 1,
  },
  locationModalCloseButton: {
    padding: 10,
    borderRadius: 24,
    backgroundColor: "#F8F9FA",
    borderWidth: 1,
    borderColor: "#E9ECEF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  locationModalContent: {
    flex: 1,
    backgroundColor: "#FAFBFC",
  },
  locationModalList: {
    flex: 1,
    paddingHorizontal: 6,
    paddingTop: 8,
  },
  locationModalItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 18,
    paddingHorizontal: 20,
    marginHorizontal: 12,
    marginVertical: 3,
    borderRadius: 16,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#F1F5F9",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  locationModalItemLast: {
    marginBottom: 24,
  },
  locationModalItemContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  locationModalItemIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#EBF4FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  locationModalItemText: {
    fontSize: 16,
    color: "#111827",
    fontWeight: "500",
    flex: 1,
  },
  locationModalItemArrow: {
    padding: 6,
  },
  
  // Estados de carga mejorados
  locationLoadingState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  loadingIndicatorContainer: {
    marginBottom: 28,
  },
  locationLoadingText: {
    fontSize: 20,
    color: "#284F66",
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 8,
  },
  locationLoadingSubtext: {
    fontSize: 15,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 22,
  },
  locationEmptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyStateIconContainer: {
    marginBottom: 28,
    opacity: 0.7,
  },
  locationEmptyStateTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#374151",
    textAlign: "center",
    marginBottom: 8,
  },
  locationEmptyStateText: {
    fontSize: 15,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 28,
  },
  retryButton: {
    backgroundColor: "#284F66",
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 12,
    shadowColor: "#284F66",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  retryButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
});

export default RegisterScreen;