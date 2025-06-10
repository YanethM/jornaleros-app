import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  StyleSheet,
  ActivityIndicator,
  Text,
  Alert,
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
  id?: string;
}

interface LocationSelectorProps {
  onCountryChange: (value: string) => void;
  onDepartmentChange: (value: string) => void;
  onMunicipalityChange: (value: string) => void;
  selectedCountry: string;
  selectedDepartment: string;
  selectedMunicipality: string;
  countryLabel?: string;
  departmentLabel?: string;
  municipalityLabel?: string;
  disabled?: boolean;
  showErrors?: boolean;
  style?: ViewStyle;
}

const LocationSelector: React.FC<LocationSelectorProps> = ({
  onCountryChange,
  onDepartmentChange,
  onMunicipalityChange,
  selectedCountry,
  selectedDepartment,
  selectedMunicipality,
  countryLabel = "País*",
  departmentLabel = "Departamento*",
  municipalityLabel = "Municipio*",
  disabled = false,
  showErrors = true,
  style,
}) => {
  const [countries, setCountries] = useState<LocationOption[]>([]);
  const [departments, setDepartments] = useState<LocationOption[]>([]);
  const [municipalities, setMunicipalities] = useState<LocationOption[]>([]);

  const [loadingCountries, setLoadingCountries] = useState<boolean>(true);
  const [loadingDepartments, setLoadingDepartments] = useState<boolean>(false);
  const [loadingMunicipalities, setLoadingMunicipalities] = useState<boolean>(false);

  const [errors, setErrors] = useState({
    countries: null as string | null,
    departments: null as string | null,
    municipalities: null as string | null,
  });

  const mapApiResponse = useCallback((items: any[], type: string): LocationOption[] => {
    if (!Array.isArray(items)) {
      console.warn(`Invalid ${type} data:`, items);
      return [];
    }

    return items.map((item, index) => {
      const id = item.id || item._id || `${type}-${index}`;
      const label = item.name || item.nombre || item.label || `${type} ${index + 1}`;
      
      console.log(`Mapping ${type}:`, {
        original: item,
        mapped: { id, label, value: id }
      });
      
      return {
        id: String(id),
        label: String(label),
        value: String(id), // ✅ USAR ID COMO VALUE, NO item.value
      };
    });
  }, []);

  useEffect(() => {
    const fetchCountries = async () => {
      setLoadingCountries(true);
      setErrors(prev => ({ ...prev, countries: null }));
      
      try {
        const response = await getCountries();
        console.log("Countries API response:", response);

        let countriesData = [];
        if (response && response.success && Array.isArray(response.data)) {
          countriesData = response.data;
        } else if (Array.isArray(response)) {
          countriesData = response;
        } else {
          throw new Error("Invalid response format");
        }

        const mappedCountries = mapApiResponse(countriesData, 'country');
        console.log("Mapped countries:", mappedCountries);
        
        setCountries(mappedCountries);
        
        if (mappedCountries.length === 0) {
          setErrors(prev => ({ ...prev, countries: "No countries found" }));
        }
      } catch (error) {
        console.error("Error loading countries:", error);
        const errorMessage = error instanceof Error ? error.message : "Error loading countries";
        setErrors(prev => ({ ...prev, countries: errorMessage }));
        
        if (showErrors) {
          Alert.alert("Error", `Could not load countries: ${errorMessage}`);
        }
        setCountries([]);
      } finally {
        setLoadingCountries(false);
      }
    };

    fetchCountries();
  }, [mapApiResponse, showErrors]);

  useEffect(() => {
    if (!selectedCountry) {
      console.log("🏛️ No country selected, clearing departments and municipalities");
      setDepartments([]);
      setMunicipalities([]);
      setErrors(prev => ({ ...prev, departments: null, municipalities: null }));
      return;
    }

    const fetchDepartments = async () => {
      setLoadingDepartments(true);
      setErrors(prev => ({ ...prev, departments: null }));
      
      try {
        console.log("🏛️ Fetching departments for country:", selectedCountry);
        
        const response = await getDepartmentsByCountry(selectedCountry);
        console.log("🏛️ Departments API response:", response);

        let departmentsData = [];
        if (response && response.success && Array.isArray(response.data)) {
          departmentsData = response.data;
        } else if (Array.isArray(response)) {
          departmentsData = response;
        } else {
          throw new Error("Invalid response format");
        }

        const mappedDepartments = mapApiResponse(departmentsData, 'department');
        console.log("🏛️ Mapped departments:", mappedDepartments);
        
        setDepartments(mappedDepartments);
        setMunicipalities([]); // Clear municipalities when departments change
        
        if (mappedDepartments.length === 0) {
          setErrors(prev => ({ ...prev, departments: "No departments found for this country" }));
        }
      } catch (error) {
        console.error("🏛️ Error loading departments:", error);
        const errorMessage = error instanceof Error ? error.message : "Error loading departments";
        setErrors(prev => ({ ...prev, departments: errorMessage }));
        
        if (showErrors) {
          Alert.alert("Error", `Could not load departments: ${errorMessage}`);
        }
        setDepartments([]);
      } finally {
        setLoadingDepartments(false);
      }
    };

    fetchDepartments();
  }, [selectedCountry, mapApiResponse, showErrors]);

  // ✅ Fetch municipalities when department changes
  useEffect(() => {
    if (!selectedDepartment) {
      console.log("🏘️ No department selected, clearing municipalities");
      setMunicipalities([]);
      setErrors(prev => ({ ...prev, municipalities: null }));
      return;
    }

    const fetchMunicipalities = async () => {
      setLoadingMunicipalities(true);
      setErrors(prev => ({ ...prev, municipalities: null }));
      
      try {
        console.log("🏘️ Fetching municipalities for department:", selectedDepartment);
        
        const response = await getMunicipalitiesByDepartment(selectedDepartment);
        console.log("🏘️ Municipalities API response:", response);

        let municipalitiesData = [];
        if (response && response.success && Array.isArray(response.data)) {
          municipalitiesData = response.data;
        } else if (Array.isArray(response)) {
          municipalitiesData = response;
        } else {
          throw new Error("Invalid response format");
        }

        const mappedMunicipalities = mapApiResponse(municipalitiesData, 'municipality');
        console.log("🏘️ Mapped municipalities:", mappedMunicipalities);
        
        setMunicipalities(mappedMunicipalities);
        
        if (mappedMunicipalities.length === 0) {
          setErrors(prev => ({ ...prev, municipalities: "No municipalities found for this department" }));
        }
      } catch (error) {
        console.error("🏘️ Error loading municipalities:", error);
        const errorMessage = error instanceof Error ? error.message : "Error loading municipalities";
        setErrors(prev => ({ ...prev, municipalities: errorMessage }));
        
        if (showErrors) {
          Alert.alert("Error", `Could not load municipalities: ${errorMessage}`);
        }
        setMunicipalities([]);
      } finally {
        setLoadingMunicipalities(false);
      }
    };

    fetchMunicipalities();
  }, [selectedDepartment, mapApiResponse, showErrors]);

  // ✅ Enhanced handlers with logging
  const handleCountryChange = (value: string) => {
    console.log("🌍 Country changed:", value);
    onCountryChange(value);
    // Clear dependent selections when country changes
    onDepartmentChange("");
    onMunicipalityChange("");
  };

  const handleDepartmentChange = (value: string) => {
    console.log("🏛️ Department changed:", value);
    onDepartmentChange(value);
    // Clear municipality when department changes
    onMunicipalityChange("");
  };

  const handleMunicipalityChange = (value: string) => {
    console.log("🏘️ Municipality changed:", value);
    onMunicipalityChange(value);
  };

  // Initial loading state
  if (loadingCountries) {
    return (
      <View style={[styles.loadingContainer, style]}>
        <ActivityIndicator size="large" color="#284F66" />
        <Text style={styles.loadingText}>Cargando países...</Text>
      </View>
    );
  }

  // Critical error handling
  if (errors.countries && countries.length === 0) {
    return (
      <View style={[styles.errorContainer, style]}>
        <Text style={styles.errorText}>❌ {errors.countries}</Text>
        <Text style={styles.errorHint}>Por favor verifica tu conexión e intenta nuevamente</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, style, disabled && styles.disabledContainer]}>
      
      {/* Country Picker */}
      <LocationPicker
        testID="country-picker"
        label={countryLabel}
        value={selectedCountry}
        onChange={handleCountryChange}
        isLoading={loadingCountries}
        items={countries}
        placeholder="Seleccione un país"
        disabled={disabled}
      />

      {/* Department Picker - Only show if country is selected */}
      {selectedCountry && (
        <LocationPicker
          testID="department-picker"
          label={departmentLabel}
          value={selectedDepartment}
          onChange={handleDepartmentChange}
          isLoading={loadingDepartments}
          items={departments}
          placeholder={
            departments.length === 0 && !loadingDepartments
              ? "No hay departamentos disponibles"
              : "Seleccione un departamento"
          }
          disabled={disabled || loadingDepartments || departments.length === 0}
        />
      )}

      {/* Municipality Picker - Only show if department is selected */}
      {selectedDepartment && (
        <LocationPicker
          testID="municipality-picker"
          label={municipalityLabel}
          value={selectedMunicipality}
          onChange={handleMunicipalityChange}
          isLoading={loadingMunicipalities}
          items={municipalities}
          placeholder={
            municipalities.length === 0 && !loadingMunicipalities
              ? "No hay municipios disponibles"
              : "Seleccione un municipio"
          }
          disabled={disabled || loadingMunicipalities || municipalities.length === 0}
        />
      )}

      {/* Error Messages */}
      {errors.departments && (
        <Text style={styles.fieldErrorText}>⚠️ {errors.departments}</Text>
      )}
      {errors.municipalities && (
        <Text style={styles.fieldErrorText}>⚠️ {errors.municipalities}</Text>
      )}
    </View>
  );
};

// Styles
const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
    width: "100%",
  },
  disabledContainer: {
    opacity: 0.6,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    minHeight: 150,
  },
  loadingText: {
    marginTop: 10,
    color: "#284F66",
    fontSize: 16,
  },
  errorContainer: {
    padding: 20,
    backgroundColor: "#FFF5F5",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#FFE6E6",
    alignItems: "center",
  },
  errorText: {
    color: "#FF3B30",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 8,
  },
  errorHint: {
    color: "#666",
    fontSize: 14,
    textAlign: "center",
  },
  fieldErrorText: {
    color: "#FF3B30",
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
});

export default LocationSelector;