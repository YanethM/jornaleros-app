import React, { createContext, useState, useContext, useEffect } from "react";
import {
  getCountries,
  getDepartmentsByCountry,
  getMunicipalitiesByDepartment,
  getVillagesByMunicipality,
} from "../services/locationService";

const LocationContext = createContext();
export const useLocation = () => useContext(LocationContext);

export const LocationProvider = ({ children }) => {
  // Estados
  const [countries, setCountries] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [municipalities, setMunicipalities] = useState([]);
  const [villages, setVillages] = useState([]);

  // Selecciones
  const [selectedCountry, setSelectedCountry] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [selectedMunicipality, setSelectedMunicipality] = useState("");
  const [selectedVillage, setSelectedVillage] = useState("");

  // Estados de carga
  const [isLoadingCountries, setIsLoadingCountries] = useState(false);
  const [isLoadingDepartments, setIsLoadingDepartments] = useState(false);
  const [isLoadingMunicipalities, setIsLoadingMunicipalities] = useState(false);
  const [isLoadingVillages, setIsLoadingVillages] = useState(false);

  // Cargar países al iniciar
  useEffect(() => {
    const fetchCountries = async () => {
      setIsLoadingCountries(true);
      try {
        const data = await getCountries();
        setCountries(data);
        if (data.length > 0) setSelectedCountry(data[0].id);
      } catch (err) {
        console.error("Error cargando países", err);
      } finally {
        setIsLoadingCountries(false);
      }
    };

    fetchCountries();
  }, []);

  // Cargar departamentos cuando se selecciona un país
  useEffect(() => {
    const fetchDepartments = async () => {
      if (!selectedCountry) return;
      setIsLoadingDepartments(true);
      try {
        const data = await getDepartmentsByCountry(selectedCountry);
        setDepartments(data);
        setMunicipalities([]);
        setVillages([]);
        setSelectedDepartment(data[0]?.id || "");
      } catch (err) {
        console.error("Error cargando departamentos", err);
      } finally {
        setIsLoadingDepartments(false);
      }
    };

    fetchDepartments();
  }, [selectedCountry]);

  // Cargar municipios cuando se selecciona un departamento
  useEffect(() => {
    const fetchMunicipalities = async () => {
      if (!selectedDepartment) return;
      setIsLoadingMunicipalities(true);
      try {
        const data = await getMunicipalitiesByDepartment(selectedDepartment);
        setMunicipalities(data);
        setVillages([]);
        setSelectedMunicipality(data[0]?.id || "");
      } catch (err) {
        console.error("Error cargando municipios", err);
      } finally {
        setIsLoadingMunicipalities(false);
      }
    };

    fetchMunicipalities();
  }, [selectedDepartment]);

  // Cargar veredas cuando se selecciona un municipio
  useEffect(() => {
    const fetchVillages = async () => {
      if (!selectedMunicipality) return;
      setIsLoadingVillages(true);
      try {
        const data = await getVillagesByMunicipality(selectedMunicipality);
        setVillages(data);
        setSelectedVillage(data[0]?.id || "");
      } catch (err) {
        console.error("Error cargando veredas", err);
      } finally {
        setIsLoadingVillages(false);
      }
    };

    fetchVillages();
  }, [selectedMunicipality]);

  return (
    <LocationContext.Provider
      value={{
        countries,
        departments,
        municipalities,
        villages,
        selectedCountry,
        setSelectedCountry,
        selectedDepartment,
        setSelectedDepartment,
        selectedMunicipality,
        setSelectedMunicipality,
        selectedVillage,
        setSelectedVillage,
        isLoadingCountries,
        isLoadingDepartments,
        isLoadingMunicipalities,
        isLoadingVillages,
      }}
    >
      {children}
    </LocationContext.Provider>
  );
};