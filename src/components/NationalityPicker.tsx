import React from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import { Picker } from "@react-native-picker/picker";

const PRIMARY_COLOR = "#284F66";

const NationalityPicker = ({
  value,
  onChange,
  isLoading = false,
  label = "Nacionalidad*",
  style = {},
}) => {
  return (
    <View style={[styles.inputContainer, style]}>
      <Text style={styles.label}>{label}</Text>
      {isLoading ? (
        <ActivityIndicator size="small" color={PRIMARY_COLOR} />
      ) : (
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={value}
            style={styles.picker}
            onValueChange={(itemValue) => onChange(itemValue)}
          >
            <Picker.Item label="Colombiano(a)" value="Colombiano(a)" />
            <Picker.Item label="Venezolano(a)" value="Venezolano(a)" />
            <Picker.Item
              label="Colombo-Venezolano(a)"
              value="ColomboVenezolano(a)"
            />
          </Picker>
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
});

export default NationalityPicker;