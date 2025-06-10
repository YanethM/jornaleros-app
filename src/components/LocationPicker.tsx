import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from "react-native";
import { Picker } from "@react-native-picker/picker";

interface LocationOption {
  label: string;
  value: string;
  id?: string;
}

interface LocationPickerProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  isLoading: boolean;
  items: LocationOption[];
  placeholder: string;
  style?: ViewStyle;
  disabled?: boolean;
  testID?: string;
}

const LocationPicker: React.FC<LocationPickerProps> = ({
  label,
  value,
  onChange,
  isLoading,
  items,
  placeholder,
  style,
  disabled = false,
  testID,
}) => {
  // ✅ Handler mejorado con debug detallado
  const handleValueChange = (selectedValue: string) => {
    console.log(`📍 [${label}] Value change:`, {
      from: value,
      to: selectedValue,
      availableOptions: items.map(item => ({ label: item.label, value: item.value })),
      isValidOption: items.some(item => item.value === selectedValue) || selectedValue === ""
    });
    
    // Solo llamar onChange si el valor realmente cambió
    if (selectedValue !== value) {
      onChange(selectedValue);
    }
  };

  // ✅ Validar que el valor actual existe en las opciones
  const isValueValid = !value || value === "" || items.some(item => item.value === value);

  return (
    <View style={[styles.container, style]} testID={testID}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.pickerWrapper, style, disabled && styles.disabled]}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#284F66" />
            <Text style={styles.loadingText}>Cargando...</Text>
          </View>
        ) : (
          <Picker
            selectedValue={value}
            onValueChange={handleValueChange}
            style={styles.picker}
            enabled={!disabled && items.length > 0}
            dropdownIconColor="#284F66"
          >
            <Picker.Item label={placeholder} value="" color="#999" />
            {items.map((item) => (
              <Picker.Item
                key={item.id || item.value}
                label={item.label}
                value={item.value}
                color="#333"
              />
            ))}
          </Picker>
        )}
      </View>
      
      {/* ✅ Warning para valores inválidos */}
      {!isValueValid && (
        <Text style={styles.warningText}>
          ⚠️ Valor seleccionado no válido: "{value}"
        </Text>
      )}
      
      {/* ✅ Debug info */}
      {__DEV__ && (
        <Text style={styles.debugText}>
          Debug: value="{value}" | items={items.length} | valid={isValueValid}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
    fontWeight: "500",
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 8,
    backgroundColor: "#FFF",
    overflow: "hidden",
  },
  picker: {
    height: 50,
    paddingHorizontal: 16,
  },
  loadingContainer: {
    height: 50,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  loadingText: {
    marginLeft: 8,
    color: "#284F66",
    fontSize: 14,
  },
  disabled: {
    backgroundColor: "#F5F5F5",
    opacity: 0.6,
  },
  warningText: {
    color: "#FF9500",
    fontSize: 12,
    marginTop: 4,
    fontWeight: "500",
  },
  debugText: {
    color: "#007AFF",
    fontSize: 10,
    marginTop: 4,
    backgroundColor: "#F0F8FF",
    padding: 4,
    borderRadius: 4,
  },
});

export default LocationPicker;