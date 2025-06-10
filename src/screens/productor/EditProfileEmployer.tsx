import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import ScreenLayout from "../../components/ScreenLayout";
import CustomTabBar from "../../components/CustomTabBar";
import { updateEmployerProfile } from "../../services/employerService";
import { useAuth } from "../../context/AuthContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import LocationPicker from "../../components/LocationPicker";

const ORGANIZATION_OPTIONS = [
  { id: "COOMPROCAR", label: "COOMPROCAR", value: "COOMPROCAR" },
  { id: "COOPCACAO", label: "COOPCACAO", value: "COOPCACAO" },
  { id: "FEDECACAO", label: "FEDECACAO", value: "FEDECACAO" },
  { id: "AMECSAR", label: "AMECSAR", value: "AMECSAR" },
  { id: "CCHCV", label: "CCHCV", value: "CCHCV" },
  { id: "AAD234", label: "AAD234", value: "AAD234" },
  { id: "PANALDEMIEL", label: "PANALDEMIEL", value: "PANALDEMIEL" },
  { id: "ASOPIARAUCA", label: "ASOPIARAUCA", value: "ASOPIARAUCA" },
  { id: "EBC", label: "EBC", value: "EBC" },
  { id: "COAGROSAR", label: "COAGROSAR", value: "COAGROSAR" },
  { id: "Ninguna", label: "Ninguna", value: "Ninguna" },
  { id: "Otra", label: "Otra", value: "Otra" },
];

const EditProfileEmployer = ({ navigation }) => {
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Estados solo para los campos editables (sin ubicación)
  const [formData, setFormData] = useState({
    phone: "",
    organization: "",
  });

  useEffect(() => {
    if (user) {
      loadUserProfile();
    } else {
      setLoading(false);
    }
  }, [user]);

  const loadUserProfile = async () => {
    try {
      setLoading(true);
      
      // Cargar solo los datos editables
      setFormData({
        phone: user.phone || "",
        organization: user.employerProfile?.organization || "",
      });

      console.log("=== DATOS CARGADOS PARA EDICIÓN ===");
      console.log("Phone:", user.phone);
      console.log("Organization:", user.employerProfile?.organization);
      console.log("=================================");

    } catch (error) {
      console.error("Error loading user profile:", error);
      Alert.alert("Error", "No se pudo cargar el perfil del usuario");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // 🔥 FUNCIÓN PARA OBTENER LA UBICACIÓN COMPLETA PARA MOSTRAR (solo lectura)
  const getDisplayLocation = () => {
    const locationParts = [];
    
    // Usar las relaciones de ubicación si están disponibles
    if (user?.country?.name) {
      locationParts.push(user.country.name);
    }
    if (user?.departmentState?.name) {
      locationParts.push(user.departmentState.name);
    }
    if (user?.city?.name) {
      locationParts.push(user.city.name);
    }

    return locationParts.length > 0 ? locationParts.join(", ") : "No especificada";
  };

  // Validación simplificada (sin ubicación)
  const validateForm = () => {
    if (!formData.phone.trim()) {
      Alert.alert("Error", "El teléfono es obligatorio");
      return false;
    }
    if (!formData.organization.trim()) {
      Alert.alert("Error", "La organización es obligatoria");
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    try {
      setSaving(true);

      // Solo enviar los campos editables (sin ubicación)
      const updateData = {
        phone: formData.phone.trim(),
        organization: formData.organization.trim(),
      };

      console.log("=== ENVIANDO ACTUALIZACIÓN ===");
      console.log("Datos a enviar:", updateData);
      console.log("===============================");

      const updatedProfile = await updateEmployerProfile(
        user.employerProfile.id,
        updateData
      );

      console.log("=== RESPUESTA DEL BACKEND ===");
      console.log("updatedProfile:", updatedProfile);
      console.log("=============================");

      // Actualizar usuario manteniendo toda la información existente
      const updatedUser = {
        ...user,
        phone: formData.phone.trim(),
        employerProfile: {
          ...user.employerProfile,
          organization: formData.organization.trim(),
          ...updatedProfile,
        },
      };
      
      console.log("=== ACTUALIZANDO CONTEXTO ===");
      console.log("Usuario actualizado:", {
        phone: updatedUser.phone,
        organization: updatedUser.employerProfile?.organization
      });
      console.log("=============================");

      updateUser(updatedUser);
      await AsyncStorage.setItem("userData", JSON.stringify(updatedUser));

      Alert.alert("Éxito", "Perfil actualizado correctamente", [
        {
          text: "OK",
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error) {
      console.error("Error al actualizar perfil:", error);
      Alert.alert(
        "Error",
        error.response?.data?.message || 
        error.response?.data?.msg || 
        "No se pudo actualizar el perfil. Intenta nuevamente."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    Alert.alert(
      "Cancelar",
      "¿Estás seguro de que quieres descartar los cambios?",
      [
        {
          text: "No",
          style: "cancel",
        },
        {
          text: "Sí",
          onPress: () => navigation.goBack(),
        },
      ]
    );
  };

  if (loading) {
    return (
      <ScreenLayout navigation={navigation}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={styles.loadingText}>Cargando perfil...</Text>
        </View>
      </ScreenLayout>
    );
  }

  if (!user) {
    return (
      <ScreenLayout navigation={navigation}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>
            No se encontró información del usuario
          </Text>
        </View>
      </ScreenLayout>
    );
  }

  return (
    <ScreenLayout navigation={navigation}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Editar Perfil de Productor</Text>
          <Text style={styles.subtitle}>
            Actualiza la información de tu perfil
          </Text>
        </View>

        <View style={styles.form}>
          {/* Información del usuario (solo lectura) */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Información Personal</Text>
            <View style={styles.readOnlyField}>
              <Text style={styles.label}>Nombre Completo</Text>
              <Text style={styles.readOnlyValue}>
                {user?.name} {user?.lastname}
              </Text>
            </View>
            <View style={styles.readOnlyField}>
              <Text style={styles.label}>Email</Text>
              <Text style={styles.readOnlyValue}>{user?.email}</Text>
            </View>
            <View style={styles.readOnlyField}>
              <Text style={styles.label}>Documento</Text>
              <Text style={styles.readOnlyValue}>
                {user?.documentType} {user?.documentId}
              </Text>
            </View>
            <View style={styles.readOnlyField}>
              <Text style={styles.label}>Rol</Text>
              <Text style={styles.readOnlyValue}>
                {user?.role?.name || "Sin rol asignado"}
              </Text>
            </View>
            {/* 🔥 UBICACIÓN COMO SOLO LECTURA */}
            <View style={styles.readOnlyField}>
              <Text style={styles.label}>Ubicación</Text>
              <Text style={styles.readOnlyValue}>
                {getDisplayLocation()}
              </Text>
            </View>
          </View>

          {/* Campos editables - Contacto */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Información de Contacto</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Teléfono *</Text>
              <TextInput
                style={styles.input}
                value={formData.phone}
                onChangeText={(value) => handleInputChange("phone", value)}
                placeholder="Ingresa tu número de teléfono"
                placeholderTextColor="#999"
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.inputGroup}>
              <LocationPicker
                testID="organization-picker"
                label="Organización *"
                value={formData.organization}
                onChange={(value) => handleInputChange("organization", value)}
                isLoading={false}
                items={ORGANIZATION_OPTIONS}
                placeholder="Selecciona tu organización"
                disabled={false}
              />
            </View>
          </View>

          {/* 🔥 NOTA INFORMATIVA SOBRE LA UBICACIÓN */}
          <View style={styles.infoSection}>
            <View style={styles.infoContainer}>
              <Text style={styles.infoIcon}>ℹ️</Text>
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoTitle}>Ubicación</Text>
                <Text style={styles.infoText}>
                  La ubicación se establece durante el registro y no puede ser modificada desde aquí. 
                  Si necesitas cambiar tu ubicación, contacta al administrador.
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Botones de acción */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={handleCancel}
            disabled={saving}>
            <Text style={styles.cancelButtonText}>Cancelar</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.saveButton, saving && styles.disabledButton]}
            onPress={handleSave}
            disabled={saving}>
            {saving ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <Text style={styles.saveButtonText}>Guardar Cambios</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
      <CustomTabBar
        navigation={navigation}
        currentRoute="EditProfileEmployer"
      />
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
  },
  header: {
    padding: 20,
    backgroundColor: "#FFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
  },
  form: {
    padding: 20,
  },
  section: {
    backgroundColor: "#FFF",
    borderRadius: 10,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 15,
  },
  readOnlyField: {
    marginBottom: 15,
  },
  readOnlyValue: {
    fontSize: 16,
    color: "#333",
    backgroundColor: "#F8F8F8",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: "#FFF",
    color: "#333",
  },
  // 🔥 NUEVOS ESTILOS PARA LA SECCIÓN INFORMATIVA
  infoSection: {
    backgroundColor: "#E3F2FD",
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: "#2196F3",
  },
  infoContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  infoIcon: {
    fontSize: 18,
    marginRight: 10,
    marginTop: 2,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1976D2",
    marginBottom: 5,
  },
  infoText: {
    fontSize: 14,
    color: "#1565C0",
    lineHeight: 20,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 20,
    paddingTop: 0,
    gap: 15,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: "#FFF",
    borderWidth: 2,
    borderColor: "#E0E0E0",
    borderRadius: 8,
    paddingVertical: 15,
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#666",
  },
  saveButton: {
    flex: 1,
    backgroundColor: "#4CAF50",
    borderRadius: 8,
    paddingVertical: 15,
    alignItems: "center",
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFF",
  },
  disabledButton: {
    backgroundColor: "#A5D6A7",
  },
});

export default EditProfileEmployer;