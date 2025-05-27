import React from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import { Picker } from "@react-native-picker/picker";

const PRIMARY_COLOR = "#284F66";

const SubLocationPicker = ({
  value,
  onChange,
  isLoading = false,
  items = [],
  nationality = "Colombiano(a)",
  parentLocation = "",
  label,
  style = {},
}) => {
  // Establecer la etiqueta basada en la nacionalidad si no se proporciona
  const pickerLabel = label || 
    (nationality === "Venezolano(a)" ? "Municipio*" : "Ciudad*");

  return (
    <View style={[styles.inputContainer, style]}>
      <Text style={styles.label}>{pickerLabel}</Text>
      {isLoading ? (
        <ActivityIndicator size="small" color={PRIMARY_COLOR} />
      ) : (
        <View style={styles.pickerContainer}>
          {!Array.isArray(items) || items.length === 0 ? (
            <Text style={styles.noDataText}>
              {parentLocation
                ? "No hay opciones disponibles para esta ubicación"
                : `Seleccione primero un ${
                    nationality === "Venezolano(a)" ? "estado" : "departamento"
                  }`}
            </Text>
          ) : (
            <Picker
              selectedValue={value}
              style={styles.picker}
              onValueChange={(itemValue) => onChange(itemValue)}
            >
              {items.map((item) => (
                <Picker.Item
                  key={item.value}
                  label={item.label || "Sin nombre"}
                  value={item.value || ""}
                />
              ))}
            </Picker>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  inputContainer: {
    marginBottom: 15,
  },
  label: {
    fontSize: 15,
    color: "#333",
    marginBottom: 5,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 4,
    backgroundColor: "#fff",
  },
  picker: {
    height: 50,
  },
  noDataText: {
    padding: 10,
    color: "#999",
    fontStyle: "italic",
  },
});

export default SubLocationPicker;