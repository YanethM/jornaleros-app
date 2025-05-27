import React, { useState, useEffect } from "react";
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
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import CustomHeaderNoAuth from "../../components/CustomHeaderNoAuth";
import { SignupNavigationProp } from "../../navigation/types";
import {
  getCountries,
  getDepartmentsByCountry,
  getMunicipalitiesByDepartment,
  getVillagesByMunicipality,
} from "../../services/locationService";
import { getRoles } from "../../services/rolesService";
import PhoneInput from "../../components/PhoneInput";
import {
  register,
  verifyCode,
  resendVerificationCode,
} from "../../services/authService";
import Icon from "react-native-vector-icons/MaterialIcons";

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

interface LocationOption {
  id: string;
  name: string;
  value: string;
  label: string;
}

interface RoleOption {
  value: string;
  title: string;
}

const RegisterScreen: React.FC<RegisterScreenProps> = ({ navigation }) => {
  const handleLoginPress = () => {
    navigation.navigate("Login");
  };
  const [name, setName] = useState("");
  const [lastname, setLastname] = useState("");
  const [email, setEmail] = useState("");
  const [documentType, setDocumentType] = useState("");
  const [documentNumber, setDocumentNumber] = useState("");
  const [countryCode, setCountryCode] = useState("CO");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [availableCountries, setAvailableCountries] = useState<
    LocationOption[]
  >([]);
  const [availableVillages, setAvailableVillages] = useState<LocationOption[]>(
    []
  );
  const [village, setVillage] = useState("");
  const [nationality, setNationality] = useState("");
  const [role, setRole] = useState("");
  const [availableDepartments, setAvailableDepartments] = useState<
    LocationOption[]
  >([]);
  const [availableMunicipalities, setAvailableMunicipalities] = useState<
    LocationOption[]
  >([]);
  const [availableRoles, setAvailableRoles] = useState<RoleOption[]>([]);
  const [isLoadingDepartments, setIsLoadingDepartments] = useState(false);
  const [isLoadingMunicipalities, setIsLoadingMunicipalities] = useState(false);
  const [isLoadingRoles, setIsLoadingRoles] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [organization, setOrganization] = useState("");
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState("");
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);

  const [countryId, setCountryId] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [cityId, setCityId] = useState("");

  useEffect(() => {
    const fetchCountries = async () => {
      try {
        const response = await getCountries();
        console.log("Countries API response:", response);

        // Check if the response has the expected structure
        if (response && response.success && Array.isArray(response.data)) {
          // Extract the actual countries array from the nested structure
          const countriesArray = response.data;

          const countryOptions = countriesArray.map((c) => ({
            id: c.id,
            value: c.id,
            label: c.name,
            name: c.name,
          }));

          console.log("Mapped country options:", countryOptions);
          setAvailableCountries(countryOptions);
        } else {
          console.error("Unexpected countries response format:", response);
          Alert.alert(
            "Error",
            "Formato de respuesta inesperado al cargar países"
          );
        }
      } catch (error) {
        console.error("Error fetching countries:", error);
        Alert.alert("Error", "No se pudieron cargar los países");
      }
    };
    fetchCountries();
  }, []);

  // Improved useEffect for fetching departments
  useEffect(() => {
    let isMounted = true; // Flag to prevent state updates after unmount

    const fetchDepartments = async () => {
      console.log("fetchDepartments called with countryId:", countryId);
      console.log("Type of countryId in useEffect:", typeof countryId);

      if (!countryId) {
        console.log("No countryId provided, clearing departments");
        if (isMounted) {
          setAvailableDepartments([]);
        }
        return;
      }

      if (isMounted) {
        setIsLoadingDepartments(true);
      }

      try {
        console.log(
          "Making API call to fetch departments for countryId:",
          countryId
        );

        // Make sure we're passing a string
        const cleanCountryId = String(countryId).trim();
        console.log("Cleaned countryId for API call:", cleanCountryId);

        const response = await getDepartmentsByCountry(cleanCountryId);
        console.log(
          "Departments API response for countryId",
          cleanCountryId,
          ":",
          response
        );

        // Break early if component unmounted
        if (!isMounted) return;

        if (response && response.success && Array.isArray(response.data)) {
          // Extract the actual departments array from the nested structure
          const departmentsArray = response.data;

          console.log(
            "Raw departments data array length:",
            departmentsArray.length
          );
          console.log(
            "Sample department (first item):",
            departmentsArray.length > 0 ? departmentsArray[0] : "No departments"
          );

          const departmentOptions = departmentsArray.map((d) => ({
            id: d.id || d._id || "",
            value: d.id || d._id || "",
            label: d.name || d.nombre || String(d),
            name: d.name || d.nombre || String(d),
          }));

          console.log("Mapped department options:", departmentOptions);

          if (isMounted) {
            setAvailableDepartments(departmentOptions);
          }
        } else {
          console.error("Unexpected departments response format:", response);

          if (isMounted) {
            setAvailableDepartments([]);

            // Show an alert if there's an error message
            if (response && response.message) {
              Alert.alert("Error", response.message);
            }
          }
        }
      } catch (error) {
        console.error("Error fetching departments:", error);

        // More detailed error logging
        if (error.response) {
          console.error("Error response status:", error.response.status);
          console.error("Error response data:", error.response.data);
        }

        if (isMounted) {
          Alert.alert(
            "Error",
            `No se pudieron cargar los departamentos. ${error.message || ""}`
          );
        }
      } finally {
        if (isMounted) {
          setIsLoadingDepartments(false);
        }
      }
    };

    fetchDepartments();

    // Cleanup function
    return () => {
      isMounted = false;
    };
  }, [countryId]);

  useEffect(() => {
    const fetchMunicipalities = async () => {
      if (!departmentId) {
        setAvailableMunicipalities([]);
        return;
      }
      setIsLoadingMunicipalities(true);
      try {
        const response = await getMunicipalitiesByDepartment(departmentId);
        console.log("Municipalities API response:", response);

        // Check if the response has the expected structure
        if (response && response.success && Array.isArray(response.data)) {
          // Extract the actual municipalities array from the nested structure
          const municipalitiesArray = response.data;

          const municipalityOptions = municipalitiesArray.map((m) => ({
            id: m.id || m._id || "",
            value: m.id || m._id || "",
            label: m.name || m.nombre || String(m),
            name: m.name || m.nombre || String(m),
          }));

          console.log("Mapped municipality options:", municipalityOptions);
          setAvailableMunicipalities(municipalityOptions);
        } else {
          console.error("Unexpected municipalities response format:", response);
          setAvailableMunicipalities([]);
        }
      } catch (error) {
        console.error("Error fetching municipalities:", error);
        Alert.alert("Error", "No se pudieron cargar los municipios");
      } finally {
        setIsLoadingMunicipalities(false);
      }
    };
    fetchMunicipalities();
  }, [departmentId]);

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

  // Parte 1: Modificar la función loadRoles con mejor manejo y logging

  const loadRoles = async () => {
    setIsLoadingRoles(true);
    try {
      const rolesData = await getRoles();
      if (rolesData) {
        setAvailableRoles(rolesData);
      } else {
        console.error("No roles data received");
        Alert.alert("Error", "No se pudieron cargar los roles");
      }
    } catch (error) {
      console.error("Error loading roles:", error);
      Alert.alert("Error", "No se pudieron cargar los roles");
    } finally {
      setIsLoadingRoles(false);
    }
  };

  const shouldShowOrganizationSelector = (selectedRole) => {
    if (!selectedRole || !availableRoles || availableRoles.length === 0) return false;
    
    const selectedRoleObj = availableRoles.find(r => r.value === selectedRole);
    if (!selectedRoleObj) return false;
    
    // Obtener el título del rol (en minúsculas para comparación)
    const roleTitle = selectedRoleObj.title?.toLowerCase() || '';
    
    // Verificar si el rol es "productor" o "trabajador"
    return roleTitle === 'productor';
  };
  
  const handleRegister = async () => {
    // Check all required fields
    if (
      !name ||
      !lastname ||
      !email ||
      !documentType ||
      !documentNumber ||
      !phoneNumber ||
      !password ||
      !confirmPassword ||
      !countryId ||
      !departmentId ||
      !cityId ||
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
    const selectedCountry = COUNTRY_CODES.find((c) => c.id === countryCode);
    if (selectedCountry && phoneNumber.length !== selectedCountry.phoneLength) {
      Alert.alert(
        "Error",
        `El número de teléfono debe tener ${selectedCountry.phoneLength} dígitos para ${selectedCountry.name}`
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
      // Get the selected department and municipality objects with their properties
      const selectedDepartment = availableDepartments.find(
        (d) => d.id === departmentId
      );
      const selectedMunicipality = availableMunicipalities.find(
        (m) => m.id === cityId
      );

      console.log("Selected department:", selectedDepartment);
      console.log("Selected municipality:", selectedMunicipality);

      // Map nationality to the expected format
      const nationalityMapping = {
        "Colombiano(a)": "COLOMBIANO",
        "Venezolano(a)": "VENEZOLANO",
        "ColomboVenezolano(a)": "COLOMBOVENEZOLANO",
        Otro: "Otra",
      };

      // Get nationality based on selected country
      let nationalityValue = nationality;
      if (!nationalityValue) {
        const selectedCountry = availableCountries.find(
          (c) => c.id === countryId
        );
        if (selectedCountry) {
          if (selectedCountry.name === "Colombia") {
            nationalityValue = "Colombiano(a)";
          } else if (selectedCountry.name === "Venezuela") {
            nationalityValue = "Venezolano(a)";
          } else if (selectedCountry.name === "Colombovenezuela") {
            nationalityValue = "ColomboVenezolano(a)";
          } else {
            nationalityValue = "Otro";
          }
        } else {
          nationalityValue = "Otro";
        }
      }

      // Map to the expected backend format
      const backendNationality = nationalityMapping[nationalityValue] || "Otra";

      // Based on the API response, municipalities have a 'value' field that is lowercase
      const registerData = {
        name,
        lastname,
        email,
        documentId: documentNumber,
        documentType,
        nationality: backendNationality, // Use the mapped value
        phone: phoneNumber,
        password,
        roleId: role,
        // Use the 'value' property which is lowercase in the API response
        city:
          selectedMunicipality?.value ||
          selectedMunicipality?.name?.toLowerCase() ||
          cityId,
        state:
          selectedDepartment?.value ||
          selectedDepartment?.name?.toLowerCase() ||
          departmentId,
        // Include organization if selected
        ...(organization && { organization }),
      };

      console.log("Registration data:", JSON.stringify(registerData, null, 2));

      const response = await register(registerData);
      console.log("Registration response:", JSON.stringify(response, null, 2));

      if (response.success) {
        setRegisteredEmail(email);
        setShowVerificationModal(true);
      } else {
        // API returned a non-success response
        const message = response?.message || "Error desconocido al registrarse";
        Alert.alert("Error", message);
      }
    } catch (error) {
      console.error("Error en registro:", error);

      // Enhanced error handling with detailed logging
      if (error.response) {
        console.log("Error response:", JSON.stringify(error.response, null, 2));

        // Try to extract error messages from different response formats
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

        Alert.alert("Éxito", "Cuenta verificada correctamente", [
          {
            text: "OK",
            onPress: () => navigation.navigate("Login"),
          },
        ]);
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

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Tipo de documento</Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={documentType}
                    onValueChange={setDocumentType}
                    style={styles.picker}>
                    <Picker.Item
                      label="Selecciona tipo de documento"
                      value=""
                    />
                    {DOCUMENT_TYPES.map((type) => (
                      <Picker.Item
                        key={type.id}
                        label={type.nombre}
                        value={type.id}
                      />
                    ))}
                  </Picker>
                </View>
              </View>

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
                countryCode={countryCode}
                phoneNumber={phoneNumber}
                onCountryChange={setCountryCode}
                onPhoneChange={setPhoneNumber}
                countries={COUNTRY_CODES}
              />

              <View style={styles.inputContainer}>
                <Text style={styles.label}>País*</Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={countryId}
                    onValueChange={(itemValue) => {
                      console.log("Country selected with ID:", itemValue);
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

              <View style={styles.inputContainer}>
                <Text style={styles.label}>{getDepartmentLabel()}*</Text>
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
                  <ActivityIndicator size="small" color="#284F66" />
                )}
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>{getMunicipalityLabel()}*</Text>
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
                  <ActivityIndicator size="small" color="#284F66" />
                )}
              </View>

              {/* Selector de Vereda (condicional) */}
              {availableVillages.length > 0 && (
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Vereda</Text>
                  <View style={styles.pickerContainer}>
                    <Picker
                      selectedValue={village}
                      onValueChange={(itemValue) => setVillage(itemValue)}
                      style={styles.picker}
                      dropdownIconColor="#284F66">
                      <Picker.Item
                        label="Selecciona una vereda"
                        value=""
                        style={styles.pickerItem}
                      />
                      {availableVillages.map((v) => (
                        <Picker.Item
                          key={v.id}
                          label={v.label}
                          value={v.value}
                          style={styles.pickerItem}
                        />
                      ))}
                    </Picker>
                  </View>
                </View>
              )}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Contraseña</Text>
                <TextInput
                  style={styles.input}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="********"
                  secureTextEntry
                  placeholderTextColor="#999"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Confirmar contraseña</Text>
                <TextInput
                  style={styles.input}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="********"
                  secureTextEntry
                  placeholderTextColor="#999"
                />
              </View>

              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={role}
                  onValueChange={(itemValue) => {
                    console.log("Rol seleccionado:", itemValue);
                    setRole(itemValue);
                  }}
                  style={styles.picker}
                  dropdownIconColor="#284F66">
                  <Picker.Item
                    label="Selecciona tu perfil"
                    value=""
                    style={styles.pickerPlaceholder}
                  />
                  {availableRoles.map((roleItem, index) => (
                    <Picker.Item
                      key={roleItem.value || `role-${index}`}
                      label={roleItem.title || `Perfil ${index + 1}`}
                      value={roleItem.value || `role-${index}`}
                      style={styles.pickerItem}
                    />
                  ))}
                </Picker>
              </View>

              {shouldShowOrganizationSelector(role) && (
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Organización</Text>
                  <View style={styles.pickerContainer}>
                    <Picker
                      selectedValue={organization}
                      onValueChange={(itemValue) => setOrganization(itemValue)}
                      style={styles.picker}
                      dropdownIconColor="#284F66">
                      <Picker.Item
                        label="Selecciona una organización"
                        value=""
                        style={styles.pickerItem}
                      />
                      {ORGANIZATION_OPTIONS.map((org) => (
                        <Picker.Item
                          key={org.value}
                          label={org.title}
                          value={org.value}
                          style={styles.pickerItem}
                        />
                      ))}
                    </Picker>
                  </View>
                </View>
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

              <View style={styles.dividerContainer}>
                <View style={styles.divider} />
                <Text style={styles.dividerText}>O</Text>
                <View style={styles.divider} />
              </View>

              <TouchableOpacity style={styles.googleButton}>
                <Image
                  source={require("../../../assets/google-icon.webp")}
                  style={styles.googleIcon}
                />
                <Text style={styles.googleButtonText}>
                  Registrarse con Google
                </Text>
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

        <Modal
          visible={showVerificationModal}
          animationType="fade"
          transparent={true}
          statusBarTranslucent={true}
          onRequestClose={() => setShowVerificationModal(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              {/* Header with brand-colored icon */}
              <View style={{ alignItems: "center", marginBottom: 16 }}>
                <Icon name="verified-user" size={48} color="#284F66" />
              </View>

              <Text style={styles.modalTitle}>Verifica tu cuenta</Text>

              <Text style={styles.modalDescription}>
                Hemos enviado un código de 6 dígitos a tu correo electrónico:
              </Text>

              <Text style={styles.modalEmail}>{registeredEmail}</Text>

              {/* Enhanced code input */}
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

              {/* Timer indicator for code expiration */}
              <Text style={{ color: "#777", fontSize: 12, marginTop: 8 }}>
                El código expirará en 15 minutos
              </Text>
            </View>
          </View>
        </Modal>
      </KeyboardAvoidingView>
      <Modal
        animationType="slide"
        transparent={true}
        visible={showTermsModal}
        onRequestClose={() => setShowTermsModal(false)}>
        <View style={styles.modalContainer}>
          <View style={styles.termsModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.termsModalTitle}>Términos de servicio</Text>
              <TouchableOpacity
                onPress={() => setShowTermsModal(false)}
                style={styles.closeButton}>
                <Icon name="close" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalScroll}>
              <Text style={styles.modalText}>
                {`1. Aceptación de los términos

Al acceder y utilizar esta aplicación, aceptas estar sujeto a estos términos de servicio.

2. Uso de la aplicación

La aplicación está diseñada para la gestión de fincas y empleados agrícolas.

3. Cuenta de usuario

Eres responsable de mantener la confidencialidad de tu cuenta y contraseña.

4. Contenido del usuario

Eres el único responsable del contenido que publicas a través de la aplicación.

5. Privacidad

Tu uso de nuestra aplicación está también regido por nuestra Política de Privacidad.

6. Modificaciones

Nos reservamos el derecho de modificar estos términos en cualquier momento.

7. Terminación

Podemos terminar o suspender tu cuenta en cualquier momento.

8. Limitación de responsabilidad

La aplicación se proporciona "tal cual" sin garantías de ningún tipo.

9. Ley aplicable

Estos términos se regirán por las leyes de Colombia.

10. Contacto

Si tienes preguntas sobre estos términos, contáctanos en info@agroapp.com`}
              </Text>
            </ScrollView>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => setShowTermsModal(false)}>
              <Text style={styles.modalButtonText}>Aceptar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        animationType="slide"
        transparent={true}
        visible={showPrivacyModal}
        onRequestClose={() => setShowPrivacyModal(false)}>
        <View style={styles.modalContainer}>
          <View style={styles.termsModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.termsModalTitle}>Política de privacidad</Text>
              <TouchableOpacity
                onPress={() => setShowPrivacyModal(false)}
                style={styles.closeButton}>
                <Icon name="close" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalScroll}>
              <Text style={styles.modalText}>
                {`1. Información que recopilamos

Recopilamos información que nos proporcionas directamente, como tu nombre, email, y datos de la finca.

2. Cómo usamos la información

Utilizamos la información para:
- Proporcionar y mantener nuestros servicios
- Comunicarnos contigo
- Mejorar nuestros servicios

3. Compartir información

No vendemos ni alquilamos tu información personal a terceros.

4. Seguridad de los datos

Implementamos medidas de seguridad para proteger tu información.

5. Retención de datos

Conservamos tu información mientras tu cuenta esté activa.

6. Tus derechos

Tienes derecho a acceder, actualizar o eliminar tu información personal.

7. Cookies

Utilizamos cookies para mejorar tu experiencia en la aplicación.

8. Cambios en la política

Podemos actualizar esta política periódicamente.

9. Menores de edad

No recopilamos intencionalmente información de menores de 13 años.

10. Contacto

Si tienes preguntas sobre esta política, contáctanos en privacy@agroapp.com`}
              </Text>
            </ScrollView>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => setShowPrivacyModal(false)}>
              <Text style={styles.modalButtonText}>Aceptar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 30,
  },
  headerContainer: {
    marginBottom: 30,
    alignItems: "center",
  },
  title: {
    fontSize: 30,
    fontWeight: "bold",
    color: "#284F66",
    marginBottom: 8,
    alignItems: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#284F66",
    alignItems: "center",
  },
  formContainer: {
    flex: 1,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: "#333",
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 8,
    overflow: "hidden",
  },
  picker: {
    height: 50,
    paddingHorizontal: 10,
  },
  phoneContainer: {
    flexDirection: "row",
    gap: 10,
  },
  countryCodePicker: {
    width: 140,
  },
  phoneInput: {
    flex: 1,
  },
  helperText: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
    marginLeft: 4,
  },
  loader: {
    paddingVertical: 15,
  },
  registerButton: {
    backgroundColor: "#284F66",
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 20,
    marginTop: 10,
  },
  registerButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 20,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: "#E0E0E0",
  },
  dividerText: {
    marginHorizontal: 10,
    color: "#666",
    fontSize: 14,
  },
  googleButton: {
    borderWidth: 1,
    borderColor: "#E0E0E0",
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 30,
    flexDirection: "row",
    justifyContent: "center",
  },
  googleIcon: {
    width: 20,
    height: 20,
    marginRight: 10,
  },
  googleButtonText: {
    color: "#333",
    fontSize: 16,
    fontWeight: "500",
  },
  loginContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 20,
  },
  loginText: {
    color: "#666",
    fontSize: 14,
  },
  loginLink: {
    color: "#2196F3",
    fontSize: 14,
    fontWeight: "bold",
  },
  termsContainer: {
    marginBottom: 30,
  },
  termsText: {
    textAlign: "center",
    color: "#284F66",
    fontSize: 12,
    lineHeight: 18,
  },
  termsLink: {
    color: "#284F66",
    textDecorationLine: "underline",
    fontWeight: "bold",
  },

  signupText: {
    color: "#284F66",
    fontSize: 14,
  },
  signupLink: {
    color: "#284F66",
    fontWeight: "bold",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },

  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.65)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 28,
    width: "90%",
    maxWidth: 400,
    alignItems: "center",
    shadowColor: "#284F66",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 12,
  },
  modalTitle: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#284F66",
    marginBottom: 16,
    textAlign: "center",
  },
  modalDescription: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 12,
    lineHeight: 24,
  },
  modalEmail: {
    fontSize: 18,
    color: "#284F66",
    fontWeight: "bold",
    marginBottom: 28,
    textAlign: "center",
  },
  codeInput: {
    borderWidth: 2,
    borderColor: "#284F66",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 28,
    fontWeight: "bold",
    color: "#333",
    width: "100%",
    textAlign: "center",
    letterSpacing: 16,
    marginBottom: 28,
    backgroundColor: "#f8f9fa",
  },
  modalButtons: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 20,
    width: "100%",
  },
  verifyButton: {
    backgroundColor: "#284F66",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 10,
    flex: 1,
    alignItems: "center",
    shadowColor: "#284F66",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 5,
  },
  verifyButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  cancelButton: {
    backgroundColor: "#f0f0f0",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 10,
    flex: 1,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  cancelButtonText: {
    color: "#555",
    fontSize: 16,
    fontWeight: "500",
  },
  disabledButton: {
    opacity: 0.6,
  },
  resendButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginTop: 8,
  },
  resendButtonText: {
    color: "#284F66",
    fontSize: 14,
    fontWeight: "500",
    textDecorationLine: "underline",
  },
  closeButton: {
    padding: 5,
  },
  modalScroll: {
    maxHeight: 400,
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  modalText: {
    fontSize: 14,
    color: "#333",
    lineHeight: 22,
  },
  modalButton: {
    backgroundColor: "#284F66",
    marginHorizontal: 20,
    marginVertical: 15,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  modalButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default RegisterScreen;
