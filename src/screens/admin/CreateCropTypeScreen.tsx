import React, { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
} from "react-native";
import ScreenLayoutAdmin from "../../components/ScreenLayoutAdmin";
import Icon from "react-native-vector-icons/MaterialIcons";
import { createCropType } from "../../services/cropTypeService";
import {
  PRIMARY_COLOR,
  SECONDARY_COLOR,
  LIGHT_BACKGROUND,
} from "../../styles/colors";

const CreateCropTypeScreen = ({ navigation, route }) => {
  const refreshList = route.params?.refreshList;
  const [name, setName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};

    if (!name.trim()) {
      newErrors.name = "El nombre del cultivo es requerido";
    } else if (name.trim().length < 3) {
      newErrors.name = "El nombre debe tener al menos 3 caracteres";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      await createCropType({ name });
      if (refreshList) {
        await refreshList();
      }

      Alert.alert("Éxito", "Tipo de cultivo creado correctamente", [
        {
          text: "OK",
          onPress: () => {
            setName("");
            navigation.goBack();
          },
        },
      ]);
    } catch (error) {
      Alert.alert(
        "Error",
        error.message || "Ocurrió un error al crear el tipo de cultivo"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScreenLayoutAdmin navigation={navigation}>
      <View style={styles.container}>
        {/* Header con diseño nuevo */}
        <View style={styles.newHeader}>
          <View style={styles.headerTop}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => navigation.goBack()}>
              <Icon name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
            
            <View style={styles.headerTitle}>
              <Text style={styles.mainTitle}>Nuevo Tipo de Cultivo</Text>
            </View>
            
            {/* Espacio vacío para mantener centrado el título */}
            <View style={styles.headerSpacer} />
          </View>
        </View>

        <ScrollView style={styles.scrollContainer}>
          <View style={styles.formContainer}>
            <Text style={styles.label}>Nombre del Cultivo</Text>
            <TextInput
              style={[styles.input, errors.name && styles.inputError]}
              placeholder="Ej: Maíz, Tomate, etc."
              value={name}
              onChangeText={setName}
              editable={!isSubmitting}
            />
            {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}

            <TouchableOpacity
              style={[
                styles.submitButton,
                isSubmitting && styles.submitButtonDisabled,
              ]}
              onPress={handleSubmit}
              disabled={isSubmitting}>
              <Text style={styles.submitButtonText}>
                {isSubmitting ? "Creando..." : "Crear Tipo de Cultivo"}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </ScreenLayoutAdmin>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: LIGHT_BACKGROUND,
  },
  // Nuevo diseño del header
  newHeader: {
    backgroundColor: PRIMARY_COLOR,
    paddingTop: 16,
    paddingBottom: 20,
    paddingHorizontal: 16,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 16,
  },
  mainTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: 'white',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginTop: 2,
  },
  headerSpacer: {
    width: 44, // Mismo ancho que el botón de atrás para centrar el título
  },
  scrollContainer: {
    flex: 1,
    padding: 16,
  },
  formContainer: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    color: PRIMARY_COLOR,
    fontWeight: "600",
  },
  input: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
    backgroundColor: "#f8fafc",
    color: PRIMARY_COLOR,
  },
  inputError: {
    borderColor: "#e74c3c",
  },
  errorText: {
    color: "#e74c3c",
    marginBottom: 12,
    fontSize: 14,
  },
  submitButton: {
    backgroundColor: PRIMARY_COLOR,
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: SECONDARY_COLOR,
    opacity: 0.7,
  },
  submitButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default CreateCropTypeScreen;