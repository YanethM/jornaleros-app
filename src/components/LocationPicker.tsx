import React, { useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  ActivityIndicator,
  Text,
  ViewStyle,
  TextStyle,
} from "react-native";
import LocationPicker from "./LocationPicker";
import {
  getCountries,
  getDepartmentsByCountry,
  getMunicipalitiesByDepartment,
} from "../services/locationService";

interface LocationOption {
  label: string;
  value: string;
}

interface LocationSelectorProps {
  onCountryChange: (value: string) => void;
  onDepartmentChange: (value: string) => void;
  onMunicipalityChange: (value: string) => void;
  selectedCountry: string;
  selectedDepartment: string;
  selectedMunicipality: string;
}

const LocationSelector: React.FC<LocationSelectorProps> = ({
  onCountryChange,
  onDepartmentChange,
  onMunicipalityChange,
  selectedCountry,
  selectedDepartment,
  selectedMunicipality,
}) => {
  const [countries, setCountries] = useState<LocationOption[]>([]);
  const [departments, setDepartments] = useState<LocationOption[]>([]);
  const [municipalities, setMunicipalities] = useState<LocationOption[]>([]);

  const [loadingCountries, setLoadingCountries] = useState<boolean>(true);
  const [loadingDepartments, setLoadingDepartments] = useState<boolean>(false);
  const [loadingMunicipalities, setLoadingMunicipalities] = useState<boolean>(false);

  useEffect(() => {
    const fetchCountries = async () => {
      setLoadingCountries(true);
      try {
        const response = await getCountries();
        setCountries(
          response.map((c: any) => ({
            label: c.name,
            value: c.id,
          }))
        );
      } catch (error) {
        console.error("Error cargando países", error);
      }
      setLoadingCountries(false);
    };

    fetchCountries();
  }, []);

  useEffect(() => {
    if (!selectedCountry) {
      setDepartments([]);
      setMunicipalities([]);
      return;
    }

    const fetchDepartments = async () => {
      setLoadingDepartments(true);
      try {
        const response = await getDepartmentsByCountry(selectedCountry);
        setDepartments(
          response.map((d: any) => ({
            label: d.name,
            value: d.id,
          }))
        );
        onDepartmentChange("");
        setMunicipalities([]);
        onMunicipalityChange("");
      } catch (error) {
        console.error("Error cargando departamentos", error);
      }
      setLoadingDepartments(false);
    };

    fetchDepartments();
  }, [selectedCountry]);

  useEffect(() => {
    if (!selectedDepartment) {
      setMunicipalities([]);
      return;
    }

    const fetchMunicipalities = async () => {
      setLoadingMunicipalities(true);
      try {
        const response = await getMunicipalitiesByDepartment(selectedDepartment);
        setMunicipalities(
          response.map((m: any) => ({
            label: m.name,
            value: m.id,
          }))
        );
        onMunicipalityChange("");
      } catch (error) {
        console.error("Error cargando municipios", error);
      }
      setLoadingMunicipalities(false);
    };

    fetchMunicipalities();
  }, [selectedDepartment]);

  if (loadingCountries) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#284F66" />
        <Text style={styles.loadingText}>Cargando países...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.pickerContainer}>
        <LocationPicker
          label="País*"
          value={selectedCountry}
          onChange={onCountryChange}
          isLoading={loadingCountries}
          items={countries}
          placeholder="Selecciona un país"
          style={styles.picker}
        />
      </View>

      <View style={styles.pickerContainer}>
        {selectedCountry ? (
          <LocationPicker
            label="Departamento*"
            value={selectedDepartment}
            onChange={onDepartmentChange}
            isLoading={loadingDepartments}
            items={departments}
            placeholder="Selecciona un departamento"
            style={styles.picker}
            disabled={!selectedCountry}
          />
        ) : (
          <View style={styles.disabledPicker}>
            <Text style={styles.disabledText}>Selecciona un país primero</Text>
          </View>
        )}
      </View>

      <View style={styles.pickerContainer}>
        {selectedDepartment ? (
          <LocationPicker
            label="Municipio*"
            value={selectedMunicipality}
            onChange={onMunicipalityChange}
            isLoading={loadingMunicipalities}
            items={municipalities}
            placeholder="Selecciona un municipio"
            style={styles.picker}
            disabled={!selectedDepartment}
          />
        ) : (
          <View style={styles.disabledPicker}>
            <Text style={styles.disabledText}>Selecciona un departamento primero</Text>
          </View>
        )}
      </View>
    </View>
  );
};

interface Style {
  container: ViewStyle;
  pickerContainer: ViewStyle;
  picker: ViewStyle;
  loadingContainer: ViewStyle;
  loadingText: TextStyle;
  disabledPicker: ViewStyle;
  disabledText: TextStyle;
  errorText: TextStyle;
  errorContainer: ViewStyle;
}

const styles = StyleSheet.create<Style>({
  container: {
    marginVertical: 10,
    width: "100%",
  },
  pickerContainer: {
    marginBottom: 20,
  },
  picker: {
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 8,
    paddingHorizontal: 16,
    backgroundColor: "#FFF",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    color: "#284F66",
    fontSize: 16,
  },
  disabledPicker: {
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 8,
    padding: 16,
    backgroundColor: "#F5F5F5",
    alignItems: "center",
  },
  disabledText: {
    color: "#999",
    fontSize: 14,
  },
  errorText: {
    color: "#FF3B30",
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
  errorContainer: {
    borderColor: "#FF3B30",
  },
});

export default LocationSelector;