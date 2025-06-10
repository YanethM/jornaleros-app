import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  FlatList,
  Animated,
  Platform,
  TextInput,
  Modal,
  StatusBar,
} from "react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import CustomHeaderNoAuth from "../../components/CustomHeaderNoAuth";
import { getAvailableJobOffersNoAuth } from "../../services/jobOffers";
import { getCropType } from "../../services/cropTypeService";
import { RootStackParamList } from "../../navigation/types";
import { MaterialIcons, Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

// Importar imágenes específicas para cada cultivo
import sachaInchiImage from "../../../assets/onboarding/slide3.png";
import cacaoImage from "../../../assets/onboarding/slide1.png";
import mielImage from "../../../assets/onboarding/slide2.jpg";
import cafeImage from "../../../assets/onboarding/slide1.png";
import defaultImage from "../../../assets/onboarding/slide1.png";
import employerAvatar from "../../../assets/onboarding/slide1.png";

const { width, height } = Dimensions.get("window");
const CARD_WIDTH = width * 0.85;
const CARD_SPACING = 16;

// Colores principales del tema
const COLORS = {
  primary: "#284E66", // Azul oscuro principal
  secondary: "#B5883F", // Dorado/Bronce secundario
  background: "#f8f9fa",
  white: "#fff",
  text: "#2c3e50",
  textLight: "#7f8c8d",
  border: "#e0e0e0",
  success: "#27ae60",
  error: "#e74c3c",
};

type PublicHomeNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "PublicHome"
>;

interface PublicHomeProps {
  navigation: PublicHomeNavigationProp;
}

interface JobOfferData {
  id: string;
  title: string;
  description: string;
  salary: number;
  city: string;
  state: string;
  country: string;
  village: string;
  employer: {
    id: string;
    organization: string;
    city: string;
    state: string;
    user: any;
  };
  farm: {
    id: string;
    name: string;
  };
  cropType: {
    id: string;
    name: string;
  };
  phase: {
    id: string;
    name: string;
  };
  displayLocation: {
    city: string;
    country: string;
    department: string;
    state: string;
    village: string;
  };
  status: string;
  startDate: string;
  endDate: string;
  duration: string;
  paymentType: string;
  paymentMode: string;
  includesFood: boolean;
  includesLodging: boolean;
  applicationsCount: number;
  createdAt?: string;
}

interface JobCategory {
  id: string;
  name: string;
  image: any; // Cambiar de string a any para imágenes locales
  count: string;
  gradient: string[];
}

interface CropType {
  id: string;
  name: string;
  description?: string;
}

const PublicHome: React.FC<PublicHomeProps> = ({ navigation }) => {
  const [jobOffers, setJobOffers] = useState<JobOfferData[]>([]);
  const [filteredOffers, setFilteredOffers] = useState<JobOfferData[]>([]);
  const [categories, setCategories] = useState<JobCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"available" | "nearby">(
    "available"
  );
  const [selectedCountry, setSelectedCountry] = useState<string>("");
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Función para calcular distancia estimada
  const getDistance = (city: string): number => {
    if (!city) return 999;
    return cityDistances[city] || 999;
  };

  // Función para obtener ofertas cercanas con lógica inteligente
  const getNearbyOffers = () => {
    let nearbyOffers = [...filteredOffers];
    
    // Filtrar por país seleccionado en tab cercanas
    if (selectedCountry) {
      nearbyOffers = nearbyOffers.filter(
        (offer) => offer.displayLocation?.country === selectedCountry
      );
    }
    
    return nearbyOffers
      .map(offer => ({
        ...offer,
        distance: getDistance(offer.displayLocation?.city || ""),
        nearbyScore: calculateNearbyScore(offer)
      }))
      .sort((a, b) => b.nearbyScore - a.nearbyScore)
      .slice(0, Math.min(nearbyOffers.length, 15)); // Máximo 15 ofertas cercanas
  };

  // Calcular puntaje de relevancia para ofertas cercanas
  const calculateNearbyScore = (offer: JobOfferData): number => {
    let score = 0;
    const distance = getDistance(offer.displayLocation?.city || "");
    
    // Puntuación por distancia (más cerca = más puntos)
    if (distance <= 100) score += 100;
    else if (distance <= 200) score += 80;
    else if (distance <= 300) score += 60;
    else if (distance <= 400) score += 40;
    else score += 20;
    
    // Bonus por alojamiento incluido (muy importante para trabajadores que viajan)
    if (offer.includesLodging) score += 50;
    
    // Bonus por alimentación incluida
    if (offer.includesFood) score += 30;
    
    // Bonus por salario alto
    if (offer.salary >= 50000) score += 30;
    else if (offer.salary >= 40000) score += 20;
    else if (offer.salary >= 30000) score += 10;
    
    // Bonus por pocas aplicaciones (más oportunidad)
    if (offer.applicationsCount <= 2) score += 25;
    else if (offer.applicationsCount <= 5) score += 15;
    
    // Bonus por duración corta (menos compromiso)
    if (parseInt(offer.duration) <= 7) score += 15;
    else if (parseInt(offer.duration) <= 14) score += 10;
    
    return score;
  };

  const scrollX = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  // Países disponibles
  const countries = ["Colombia", "Venezuela"];
  
  // Ubicación base simulada para ofertas cercanas
  const userBaseLocation = "Bogotá"; // Simulamos que el usuario está en Bogotá
  
  // Distancias estimadas desde Bogotá (en km)
  const cityDistances = {
    // Colombia
    "Bogotá": 0,
    "Medellín": 240,
    "Cali": 250,
    "Barranquilla": 470,
    "Cartagena": 550,
    "Bucaramanga": 220,
    "Pereira": 200,
    "Manizales": 180,
    "Armenia": 210,
    "Ibagué": 120,
    "Santa Marta": 480,
    "Villavicencio": 90,
    "Pasto": 380,
    "Montería": 320,
    "Sincelejo": 360,
    "Valledupar": 350,
    "Riohacha": 520,
    "Tunja": 80,
    "Popayán": 290,
    "Neiva": 180,
    "Florencia": 220,
    "Yopal": 200,
    "Arauca": 300,
    "Fortul": 320,
    "Saravena": 310,
    "Arauquita": 330,
    // Venezuela (distancias aproximadas)
    "Caracas": 680,
    "Maracaibo": 590,
    "Valencia": 720,
    "Barquisimeto": 650,
    "Maracay": 700,
    "San Cristóbal": 380,
    "Ciudad Bolívar": 580,
    "Maturín": 520,
  };

  useEffect(() => {
    loadInitialData();
    animateEntry();
  }, []);

  useEffect(() => {
    filterOffers();
  }, [jobOffers, activeTab, selectedCountry, searchQuery]);

  const animateEntry = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const offers = await loadJobOffers();
      await loadCropTypes(offers);
    } catch (error) {
      console.error("Error loading initial data:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadJobOffers = async (): Promise<JobOfferData[]> => {
    try {
      const response = await getAvailableJobOffersNoAuth();
      let offers: JobOfferData[] = [];

      if (Array.isArray(response)) {
        offers = response;
      } else if (response && response.jobOffers) {
        offers = response.jobOffers;
      }

      setJobOffers(offers);
      return offers;
    } catch (error) {
      console.error("Error loading job offers:", error);
      setJobOffers([]);
      return [];
    }
  };

  const filterOffers = () => {
    let filtered = [...jobOffers];

    // Filtro por búsqueda (aplica en ambos tabs)
    if (searchQuery.trim()) {
      filtered = filtered.filter(
        (offer) =>
          offer.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          offer.cropType?.name
            .toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          offer.displayLocation?.city
            .toLowerCase()
            .includes(searchQuery.toLowerCase())
      );
    }

    // Filtro por país solo en tab "disponibles" si no hay país seleccionado
    // En tab "cercanas" el filtro se maneja en getNearbyOffers
    if (activeTab === "available") {
      // No aplicar filtros de país en ofertas disponibles
      setFilteredOffers(filtered);
    } else {
      // Para ofertas cercanas, establecer todas las ofertas filtradas por búsqueda
      setFilteredOffers(filtered);
    }
  };

  const loadCropTypes = async (offers: JobOfferData[]) => {
    try {
      const cropTypesResponse = await getCropType();
      let cropTypes: CropType[] = [];

      if (Array.isArray(cropTypesResponse)) {
        cropTypes = cropTypesResponse;
      } else if (cropTypesResponse && cropTypesResponse.cropTypes) {
        cropTypes = cropTypesResponse.cropTypes;
      } else if (cropTypesResponse && cropTypesResponse.data) {
        cropTypes = cropTypesResponse.data;
      }

      const cropCounts = countOffersByCropType(offers);
      const dynamicCategories: JobCategory[] = cropTypes.map((cropType) => ({
        id: cropType.id,
        name: cropType.name,
        image: getCropImage(cropType.name), // Ahora retorna la imagen local
        count:
          cropCounts[cropType.name] > 0 ? `${cropCounts[cropType.name]}` : "0",
        gradient: getCropGradient(cropType.name),
      }));

      setCategories(dynamicCategories);
    } catch (error) {
      console.error("Error loading crop types:", error);
      setCategories([]);
    }
  };

  const countOffersByCropType = (
    offers: JobOfferData[]
  ): { [key: string]: number } => {
    const counts: { [key: string]: number } = {};
    offers.forEach((offer) => {
      if (offer.cropType && offer.cropType.name) {
        const cropName = offer.cropType.name;
        counts[cropName] = (counts[cropName] || 0) + 1;
      }
    });
    return counts;
  };

  // Función modificada para retornar imágenes locales en lugar de strings
  const getCropImage = (cropName: string): any => {
    if (!cropName) return defaultImage;

    const cropName_lower = cropName.toLowerCase();

    if (cropName_lower.includes("sacha") || cropName_lower.includes("inchi")) {
      return sachaInchiImage;
    }
    if (cropName_lower.includes("cacao")) {
      return cacaoImage;
    }
    if (cropName_lower.includes("miel") || cropName_lower.includes("honey")) {
      return mielImage;
    }
    if (cropName_lower.includes("café") || cropName_lower.includes("coffee")) {
      return cafeImage;
    }
    return defaultImage;
  };

  const getCropGradient = (cropName: string): string[] => {
    const cropName_lower = cropName.toLowerCase();

    if (cropName_lower.includes("sacha")) return ["#4CAF50", "#2E7D32"];
    if (cropName_lower.includes("cacao")) return ["#8D4E2A", "#5D2E1A"];
    if (cropName_lower.includes("café")) return [COLORS.secondary, "#8B6914"];
    if (cropName_lower.includes("miel")) return [COLORS.secondary, "#8B6914"];
    return [COLORS.primary, "#1A3A4D"];
  };

  const getEmployerName = (employer: any) => {
    return employer?.organization || "Empleador";
  };

  const formatSalary = (salary: number) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
    }).format(salary);
  };

  // Función modificada para retornar imagen local
  const getJobImage = (offer: JobOfferData): any => {
    return getCropImage(offer.cropType?.name || "");
  };

  // Obtener las 5 ofertas más recientes
  const getRecentOffers = () => {
    return [...filteredOffers]
      .sort((a, b) => {
        // Si no hay fecha de creación, usar la fecha de inicio
        const dateA = new Date(a.createdAt || a.startDate);
        const dateB = new Date(b.createdAt || b.startDate);
        return dateB.getTime() - dateA.getTime();
      })
      .slice(0, 5);
  };

  const renderTabBar = () => (
    <View style={styles.tabBar}>
      <TouchableOpacity
        style={[styles.tab, activeTab === "available" && styles.activeTab]}
        onPress={() => {
          setActiveTab("available");
          // Limpiar filtro de país al cambiar a ofertas disponibles
          setSelectedCountry("");
        }}>
        <Ionicons
          name="list-outline"
          size={20}
          color={activeTab === "available" ? "#fff" : "#666"}
        />
        <Text
          style={[
            styles.tabText,
            activeTab === "available" && styles.activeTabText,
          ]}>
          Ofertas disponibles
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.tab, activeTab === "nearby" && styles.activeTab]}
        onPress={() => setActiveTab("nearby")}>
        <Ionicons
          name="location-outline"
          size={20}
          color={activeTab === "nearby" ? "#fff" : "#666"}
        />
        <Text
          style={[
            styles.tabText,
            activeTab === "nearby" && styles.activeTabText,
          ]}>
          Ofertas cercanas
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderSearchAndFilters = () => (
    <View style={styles.searchContainer}>
      <View style={styles.searchBar}>
        <Ionicons
          name="search-outline"
          size={20}
          color="#666"
          style={styles.searchIcon}
        />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar ofertas o cultivos..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#999"
        />
        {/* Solo mostrar filtro en tab de ofertas cercanas */}
        {activeTab === "nearby" && (
          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => setShowFilters(true)}>
            <Ionicons name="options-outline" size={20} color={COLORS.primary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Solo mostrar filtros activos en tab cercanas */}
      {activeTab === "nearby" && selectedCountry && (
        <View style={styles.activeFilters}>
          <View style={styles.filterChip}>
            <Text style={styles.filterChipText}>{selectedCountry}</Text>
            <TouchableOpacity onPress={() => setSelectedCountry("")}>
              <Ionicons name="close" size={16} color="#666" />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Mensaje informativo para ofertas cercanas sin país seleccionado */}
      {activeTab === "nearby" && !selectedCountry && (
        <View style={styles.countryPrompt}>
          <Ionicons name="flag-outline" size={16} color={COLORS.secondary} />
          <Text style={styles.countryPromptText}>
            Selecciona un país para ver ofertas cercanas
          </Text>
          <TouchableOpacity
            style={styles.selectCountryButton}
            onPress={() => setShowFilters(true)}>
            <Text style={styles.selectCountryButtonText}>Seleccionar</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  const renderFilterModal = () => (
    <Modal
      visible={showFilters}
      transparent={true}
      animationType="slide"
      statusBarTranslucent={true}
      onRequestClose={() => setShowFilters(false)}>
      <View style={styles.modalOverlay}>
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setShowFilters(false)}
        />
        <View style={styles.filterModal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Seleccionar país</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowFilters(false)}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.modalContent}
            showsVerticalScrollIndicator={false}>
            <Text style={styles.filterLabel}>Elige tu país de interés</Text>
            <View style={styles.filterOptions}>
              {countries.map((country) => (
                <TouchableOpacity
                  key={country}
                  style={[
                    styles.filterOption,
                    selectedCountry === country && styles.selectedFilterOption,
                  ]}
                  onPress={() => {
                    setSelectedCountry(
                      country === selectedCountry ? "" : country
                    );
                  }}>
                  <Text
                    style={[
                      styles.filterOptionText,
                      selectedCountry === country &&
                        styles.selectedFilterOptionText,
                    ]}>
                    {country}
                  </Text>
                  {selectedCountry === country && (
                    <Ionicons name="checkmark" size={16} color="#fff" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          <View style={styles.modalActions}>
            <TouchableOpacity
              style={styles.clearFiltersButton}
              onPress={() => {
                setSelectedCountry("");
              }}>
              <Text style={styles.clearFiltersText}>Limpiar filtros</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.applyFiltersButton}
              onPress={() => setShowFilters(false)}>
              <Text style={styles.applyFiltersText}>Aplicar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const renderStatsCard = () => (
    <View style={styles.statsCard}>
      <View style={styles.statItem}>
        <Text style={styles.statNumber}>{filteredOffers.length}</Text>
        <Text style={styles.statLabel}>Ofertas activas</Text>
      </View>
      <View style={styles.statDivider} />
      <View style={styles.statItem}>
        <Text style={styles.statNumber}>{categories.length}</Text>
        <Text style={styles.statLabel}>Tipos de cultivo</Text>
      </View>
      <View style={styles.statDivider} />
      <View style={styles.statItem}>
        <Text style={styles.statNumber}>
          {filteredOffers.filter((offer) => offer.includesLodging).length}
        </Text>
        <Text style={styles.statLabel}>Con alojamiento</Text>
      </View>
    </View>
  );

  // Renderizado mejorado del slide de ofertas recientes
  const renderRecentOffer = ({ item, index }) => {
    const inputRange = [
      (index - 1) * CARD_WIDTH,
      index * CARD_WIDTH,
      (index + 1) * CARD_WIDTH,
    ];

    const scale = scrollX.interpolate({
      inputRange,
      outputRange: [0.92, 1, 0.92],
      extrapolate: "clamp",
    });

    const opacity = scrollX.interpolate({
      inputRange,
      outputRange: [0.8, 1, 0.8],
      extrapolate: "clamp",
    });

    // Formatear salario
    const formatSalaryForCard = (salary) => {
      if (!salary) return "Salario por consultar";
      return new Intl.NumberFormat("es-CO", {
        style: "currency",
        currency: "COP",
        minimumFractionDigits: 0,
      }).format(salary);
    };

    // Obtener ubicación completa
    const getLocationText = () => {
      const location = item.displayLocation;
      if (!location) return "Ubicación por confirmar";
      
      const parts = [location.city, location.department || location.state].filter(Boolean);
      return parts.join(", ");
    };

    // Obtener el status correcto
    const getStatusInfo = () => {
      if (item.status === "Activo") {
        return {
          text: "Disponible",
          color: "rgba(76, 175, 80, 0.9)"
        };
      }
      return {
        text: "En proceso",
        color: "rgba(255, 152, 0, 0.9)"
      };
    };

    const statusInfo = getStatusInfo();

    return (
      <Animated.View
        style={[styles.recentCard, { transform: [{ scale }], opacity }]}>
        <TouchableOpacity
          onPress={() =>
            navigation.navigate("WorkerJobOfferDetailNoAuth", {
              jobId: item.id, // Corregido: jobId en lugar de jobOfferId
              fromPublic: true,
            })
          }
          activeOpacity={0.9}>
          
          {/* Imagen de fondo del cultivo */}
          <Image source={getJobImage(item)} style={styles.recentImage} />

          {/* Badge de estado */}
          <View style={[styles.offeringBadge, { backgroundColor: statusInfo.color }]}>
            <Text style={styles.offeringBadgeText}>{statusInfo.text}</Text>
          </View>

          {/* Badge de cultivo */}
          {item.cropType?.name && (
            <View style={styles.cropTypeBadge}>
              <Text style={styles.cropTypeBadgeText}>{item.cropType.name}</Text>
            </View>
          )}

          {/* Badges de beneficios */}
          <View style={styles.benefitsBadges}>
            {item.includesFood && (
              <View style={styles.benefitBadge}>
                <Ionicons name="restaurant" size={12} color="#fff" />
              </View>
            )}
            {item.includesLodging && (
              <View style={styles.benefitBadge}>
                <Ionicons name="home" size={12} color="#fff" />
              </View>
            )}
          </View>

          {/* Gradiente para mejorar legibilidad */}
          <LinearGradient
            colors={["transparent", "rgba(0,0,0,0.8)"]}
            style={styles.recentGradient}
          />

          {/* Contenido principal */}
          <View style={styles.recentContent}>
            <View style={styles.recentMainInfo}>
              {/* Título de la oferta */}
              <Text style={styles.recentTitle} numberOfLines={2}>
                {item.title}
              </Text>
              
              {/* Información de la finca y empleador */}
              <View style={styles.recentEmployerRow}>
                <View style={styles.recentEmployerAvatar}>
                  <Text style={styles.recentEmployerInitial}>
                    {getEmployerName(item.employer).charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.recentEmployerInfo}>
                  <Text style={styles.recentFarmName} numberOfLines={1}>
                    {item.farm?.name || "Finca no especificada"}
                  </Text>
                  <Text style={styles.recentEmployerName} numberOfLines={1}>
                    {getEmployerName(item.employer)}
                  </Text>
                </View>
              </View>

              {/* Ubicación */}
              <View style={styles.recentLocationRow}>
                <Ionicons name="location-outline" size={14} color="rgba(255,255,255,0.9)" />
                <Text style={styles.recentLocationText} numberOfLines={1}>
                  {getLocationText()}
                </Text>
              </View>

              {/* Información de trabajo */}
              <View style={styles.recentWorkInfo}>
                <View style={styles.recentWorkItem}>
                  <Ionicons name="calendar-outline" size={14} color="rgba(255,255,255,0.8)" />
                  <Text style={styles.recentWorkText}>
                    {item.duration ? `${item.duration} días` : "Duración por consultar"}
                  </Text>
                </View>
                <View style={styles.recentWorkItem}>
                  <Ionicons name="people-outline" size={14} color="rgba(255,255,255,0.8)" />
                  <Text style={styles.recentWorkText}>
                    {item.workersNeeded || 1} {(item.workersNeeded || 1) === 1 ? "persona" : "personas"}
                  </Text>
                </View>
              </View>

              {/* Salario destacado */}
              <View style={styles.recentSalaryContainer}>
                <Text style={styles.recentSalaryAmount}>
                  {formatSalaryForCard(item.salary)}
                </Text>
                <Text style={styles.recentSalaryPeriod}>
                  {item.paymentType === "Por_dia" ? "por día" : 
                   item.paymentType === "Por_labor" ? "por trabajo" : "a consultar"}
                </Text>
              </View>
            </View>

            {/* Botón de acción */}
            <TouchableOpacity 
              style={styles.recentActionButton}
              onPress={() =>
                navigation.navigate("WorkerJobOfferDetailNoAuth", {
                  jobId: item.id,
                  fromPublic: true,
                })
              }>
              <Text style={styles.recentActionText}>Ver detalles</Text>
              <Ionicons name="arrow-forward" size={16} color="#fff" />
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const renderJobCard = (item: JobOfferData, index: number) => {
    const distance = getDistance(item.displayLocation?.city || "");
    const isNearbyTab = activeTab === "nearby";
    
    return (
      <TouchableOpacity
        key={item.id}
        style={[
          styles.jobCard,
          { marginBottom: index === (isNearbyTab ? getNearbyOffers() : filteredOffers).length - 1 ? 20 : 16 },
        ]}
        onPress={() =>
          navigation.navigate("WorkerJobOfferDetailNoAuth", {
            jobId: item.id,
            fromPublic: true
          })
        }
        activeOpacity={0.95}>
        
        <Image source={getJobImage(item)} style={styles.jobImage} />

        {/* Badge de distancia para ofertas cercanas */}
        {isNearbyTab && (
          <View style={styles.distanceBadge}>
            <Ionicons name="location" size={12} color="#fff" />
            <Text style={styles.distanceText}>
              {distance === 0 ? "Tu ciudad" : `${distance} km`}
            </Text>
          </View>
        )}

        <View style={styles.jobContent}>
          <View style={styles.jobHeader}>
            <Text style={styles.jobTitle} numberOfLines={2}>
              {item.title}
            </Text>
          </View>

          <Text style={styles.jobCompany}>
            {getEmployerName(item.employer)} • {item.farm?.name}
          </Text>

          <View style={styles.jobLocation}>
            <Ionicons name="location-outline" size={14} color="#666" />
            <Text style={styles.jobLocationText}>
              {item.displayLocation?.city}, {item.displayLocation?.state}
            </Text>
            {isNearbyTab && distance > 0 && (
              <Text style={styles.jobDistanceText}>• {distance} km</Text>
            )}
          </View>

          <View style={styles.jobTags}>
            <View style={styles.jobTag}>
              <Text style={styles.jobTagText}>{item.cropType?.name}</Text>
            </View>
            <View style={styles.jobTag}>
              <Text style={styles.jobTagText}>{item.phase?.name}</Text>
            </View>
            {/* Tags especiales para ofertas cercanas */}
            {isNearbyTab && item.includesLodging && (
              <View style={[styles.jobTag, styles.nearbySpecialTag]}>
                <Text style={styles.nearbySpecialTagText}>Incluye alojamiento</Text>
              </View>
            )}
          </View>

          <View style={styles.jobFooter}>
            <Text style={styles.jobSalary}>
              {formatSalary(item.salary)} / día
            </Text>
            <View style={styles.jobPerks}>
              {item.includesFood && (
                <View style={styles.perkBadge}>
                  <Ionicons name="restaurant" size={12} color="#4CAF50" />
                </View>
              )}
              {item.includesLodging && (
                <View style={styles.perkBadge}>
                  <Ionicons name="home" size={12} color="#4CAF50" />
                </View>
              )}
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderCategoryCard = (item: JobCategory) => (
    <TouchableOpacity
      key={item.id}
      style={styles.categoryCard}
      onPress={() =>
        navigation.navigate("CategoryJobs", { category: item.name })
      }
      activeOpacity={0.9}>
      {/* Cambiar de { uri: item.image } a source directo */}
      <Image source={item.image} style={styles.categoryImage} />

      {parseInt(item.count) > 0 && (
        <View style={styles.statusBadge}>
          <Text style={styles.statusBadgeText}>Disponible</Text>
        </View>
      )}

      <LinearGradient
        colors={["transparent", "rgba(0,0,0,0.8)"]}
        style={styles.categoryGradient}
      />

      <View style={styles.categoryContent}>
        <View style={styles.categoryInfo}>
          <Text style={styles.categoryTitle}>{item.name}</Text>
          <Text style={styles.categoryLocation}>Región: Nacional</Text>
          <Text style={styles.categoryCount}>{item.count} ofertas</Text>
        </View>

        <TouchableOpacity style={styles.categoryButton}>
          <Text style={styles.categoryButtonText}>Ver más</Text>
          <Ionicons name="arrow-forward" size={14} color="#fff" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const recentOffers = getRecentOffers();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      <CustomHeaderNoAuth navigation={navigation} />

      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}>
        <ScrollView
          style={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContainer}>
          {/* Tabs */}
          {renderTabBar()}

          {/* Search and Filters */}
          {renderSearchAndFilters()}

          {/* Stats Card */}
          {renderStatsCard()}

          {/* Slide de ofertas más recientes */}
          {recentOffers.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Ofertas más recientes</Text>
                <TouchableOpacity
                  onPress={() => navigation.navigate("AllJobs")}>
                  <Text style={styles.seeAllLink}>Ver todas</Text>
                </TouchableOpacity>
              </View>

              <Animated.FlatList
                data={recentOffers}
                renderItem={renderRecentOffer}
                keyExtractor={(item) => item.id}
                horizontal
                showsHorizontalScrollIndicator={false}
                snapToInterval={CARD_WIDTH + CARD_SPACING}
                decelerationRate="fast"
                contentContainerStyle={styles.recentList}
                onScroll={Animated.event(
                  [{ nativeEvent: { contentOffset: { x: scrollX } } }],
                  { useNativeDriver: true }
                )}
                scrollEventThrottle={16}
              />
            </View>
          )}

          {/* Categories Section - Solo en tab de ofertas disponibles */}
          {activeTab === "available" && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>
                  Encuentra tu cadena de interés
                </Text>
                <Text style={styles.sectionSubtitle}>
                  {categories.length} categorías disponibles
                </Text>
              </View>

              {categories.length > 0 ? (
                <View style={styles.categoriesContainer}>
                  {categories.map(renderCategoryCard)}
                </View>
              ) : (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>
                    No hay categorías disponibles
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Todas las ofertas */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                {activeTab === "nearby"
                  ? selectedCountry 
                    ? `Ofertas cercanas en ${selectedCountry}`
                    : "Ofertas cercanas"
                  : "Todas las ofertas"}
              </Text>
              <Text style={styles.resultsCount}>
                {activeTab === "nearby" 
                  ? selectedCountry
                    ? `${getNearbyOffers().length} resultado${getNearbyOffers().length !== 1 ? "s" : ""}`
                    : "Selecciona un país"
                  : `${filteredOffers.length} resultado${filteredOffers.length !== 1 ? "s" : ""}`
                }
              </Text>
            </View>

            {/* Explicación para ofertas cercanas */}
            {activeTab === "nearby" && selectedCountry && (
              <View style={styles.nearbyExplanation}>
                <Ionicons name="information-circle-outline" size={16} color={COLORS.primary} />
                <Text style={styles.nearbyExplanationText}>
                  Ofertas ordenadas por distancia y beneficios desde Bogotá
                </Text>
              </View>
            )}

            {loading ? (
              <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Cargando ofertas...</Text>
              </View>
            ) : activeTab === "nearby" && !selectedCountry ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="flag-outline" size={48} color="#bdc3c7" />
                <Text style={styles.emptyText}>Selecciona un país</Text>
                <Text style={styles.emptySubtext}>
                  Elige Colombia o Venezuela para ver ofertas cercanas
                </Text>
                <TouchableOpacity
                  style={styles.selectCountryButtonLarge}
                  onPress={() => setShowFilters(true)}>
                  <Text style={styles.selectCountryButtonLargeText}>
                    Seleccionar país
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (activeTab === "nearby" ? getNearbyOffers() : filteredOffers).length > 0 ? (
              <View style={styles.jobsList}>
                {(activeTab === "nearby" ? getNearbyOffers() : filteredOffers).map((offer, index) =>
                  renderJobCard(offer, index)
                )}
              </View>
            ) : (
              <View style={styles.emptyContainer}>
                <Ionicons 
                  name={activeTab === "nearby" ? "location-outline" : "search-outline"} 
                  size={48} 
                  color="#bdc3c7" 
                />
                <Text style={styles.emptyText}>
                  {activeTab === "nearby" 
                    ? `No hay ofertas cercanas en ${selectedCountry}`
                    : "No se encontraron ofertas"
                  }
                </Text>
                <Text style={styles.emptySubtext}>
                  {activeTab === "nearby"
                    ? "Intenta seleccionar otro país o revisa las ofertas disponibles"
                    : "Intenta ajustar tu búsqueda"
                  }
                </Text>
              </View>
            )}
          </View>
        </ScrollView>
      </Animated.View>

      {renderFilterModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    flex: 1,
  },
  scrollContainer: {
    paddingBottom: 24,
  },
  authSection: {
    backgroundColor: COLORS.white,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  welcomeText: {
    fontSize: 22,
    fontWeight: "700",
    color: COLORS.text,
    textAlign: "center",
    marginBottom: 8,
  },
  subtitleText: {
    fontSize: 14,
    color: COLORS.textLight,
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 20,
  },
  authContainer: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  subtleLoginButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ecf0f1",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    gap: 8,
  },
  subtleLoginText: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "600",
  },
  subtleRegisterButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    gap: 8,
  },
  subtleRegisterText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: "600",
  },
  tabBar: {
    flexDirection: "row",
    backgroundColor: COLORS.white,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    padding: 4,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  activeTab: {
    backgroundColor: COLORS.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#666",
  },
  activeTabText: {
    color: COLORS.white,
    fontWeight: "600",
  },
  searchContainer: {
    paddingHorizontal: 16,
    marginTop: 16,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 48,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#333",
  },
  filterButton: {
    padding: 8,
  },
  activeFilters: {
    flexDirection: "row",
    marginTop: 12,
    gap: 8,
  },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#e3f2fd",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  filterChipText: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: "500",
  },
  countryPrompt: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: `${COLORS.secondary}10`,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    marginTop: 12,
    gap: 8,
  },
  countryPromptText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.secondary,
    fontWeight: "500",
  },
  selectCountryButton: {
    backgroundColor: COLORS.secondary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  selectCountryButtonText: {
    fontSize: 12,
    color: COLORS.white,
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  modalBackdrop: {
    flex: 1,
  },
  filterModal: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: height * 0.8,
    minHeight: height * 0.5,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.text,
  },
  closeButton: {
    padding: 4,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 12,
    marginTop: 16,
  },
  filterOptions: {
    gap: 8,
  },
  filterOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
  },
  selectedFilterOption: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterOptionText: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  selectedFilterOptionText: {
    color: COLORS.white,
    fontWeight: "600",
  },
  modalActions: {
    flexDirection: "row",
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    backgroundColor: COLORS.white,
  },
  clearFiltersButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
  },
  clearFiltersText: {
    fontSize: 16,
    color: "#666",
    fontWeight: "600",
  },
  applyFiltersButton: {
    flex: 1,
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  applyFiltersText: {
    fontSize: 16,
    color: COLORS.white,
    fontWeight: "700",
  },
  statsCard: {
    flexDirection: "row",
    backgroundColor: COLORS.white,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    padding: 20,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "700",
    color: COLORS.primary,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textLight,
    marginTop: 4,
    textAlign: "center",
  },
  statDivider: {
    width: 1,
    backgroundColor: "#ecf0f1",
    marginHorizontal: 20,
  },
  section: {
    paddingHorizontal: 16,
    marginTop: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.text,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: COLORS.textLight,
  },
  resultsCount: {
    fontSize: 14,
    color: COLORS.textLight,
  },
  seeAllLink: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: "600",
  },
  nearbyExplanation: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: `${COLORS.primary}10`,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 16,
    gap: 8,
  },
  nearbyExplanationText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: "500",
  },
  // Estilos mejorados para el slide de ofertas recientes
  recentList: {
    paddingHorizontal: 8,
  },
  recentCard: {
    width: CARD_WIDTH,
    height: 320,
    marginHorizontal: CARD_SPACING / 2,
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: COLORS.white,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.25,
        shadowRadius: 20,
      },
      android: {
        elevation: 12,
      },
    }),
  },
  recentImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  offeringBadge: {
    position: "absolute",
    top: 16,
    right: 16,
    backgroundColor: `${COLORS.secondary}E6`,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    zIndex: 3,
  },
  offeringBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.white,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  cropTypeBadge: {
    position: "absolute",
    top: 16,
    left: 16,
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    zIndex: 3,
  },
  cropTypeBadgeText: {
    fontSize: 11,
    fontWeight: "600",
    color: COLORS.white,
  },
  benefitsBadges: {
    position: "absolute",
    top: 60,
    right: 16,
    flexDirection: "column",
    gap: 6,
    zIndex: 3,
  },
  benefitBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(76, 175, 80, 0.8)",
    alignItems: "center",
    justifyContent: "center",
  },
  recentGradient: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: "70%",
  },
  recentContent: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    gap: 16,
  },
  recentMainInfo: {
    gap: 12,
  },
  recentTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: COLORS.white,
    lineHeight: 26,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: {width: 0, height: 1},
    textShadowRadius: 3,
  },
  recentEmployerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  recentEmployerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: `${COLORS.primary}CC`,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.3)",
  },
  recentEmployerInitial: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.white,
  },
  recentEmployerInfo: {
    flex: 1,
  },
  recentFarmName: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.white,
    marginBottom: 2,
  },
  recentEmployerName: {
    fontSize: 12,
    color: "rgba(255,255,255,0.8)",
  },
  recentLocationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  recentLocationText: {
    fontSize: 13,
    color: "rgba(255,255,255,0.9)",
    fontWeight: "500",
  },
  recentWorkInfo: {
    flexDirection: "row",
    gap: 16,
  },
  recentWorkItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  recentWorkText: {
    fontSize: 12,
    color: "rgba(255,255,255,0.8)",
    fontWeight: "500",
  },
  recentSalaryContainer: {
    alignItems: "flex-start",
    backgroundColor: "rgba(255,255,255,0.1)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    alignSelf: "flex-start",
  },
  recentSalaryAmount: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.white,
    marginBottom: 2,
  },
  recentSalaryPeriod: {
    fontSize: 11,
    color: "rgba(255,255,255,0.8)",
    fontWeight: "500",
  },
  recentActionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: `${COLORS.secondary}E6`,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    gap: 8,
    alignSelf: "stretch",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  recentActionText: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.white,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  jobsList: {
    gap: 16,
  },
  jobCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  jobImage: {
    width: "100%",
    height: 160,
    resizeMode: "cover",
  },
  distanceBadge: {
    position: "absolute",
    top: 12,
    left: 12,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(40, 78, 102, 0.9)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
    zIndex: 2,
  },
  distanceText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#fff",
  },
  jobContent: {
    padding: 16,
  },
  jobHeader: {
    marginBottom: 8,
  },
  jobTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.text,
    lineHeight: 22,
  },
  jobCompany: {
    fontSize: 13,
    color: COLORS.textLight,
    marginBottom: 8,
  },
  jobLocation: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 12,
  },
  jobLocationText: {
    fontSize: 12,
    color: "#666",
  },
  jobDistanceText: {
    fontSize: 11,
    color: COLORS.primary,
    fontWeight: "600",
    marginLeft: 4,
  },
  jobTags: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  jobTag: {
    backgroundColor: `${COLORS.primary}20`,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  jobTagText: {
    fontSize: 11,
    color: COLORS.primary,
    fontWeight: "500",
  },
  nearbySpecialTag: {
    backgroundColor: `${COLORS.success}20`,
  },
  nearbySpecialTagText: {
    fontSize: 10,
    color: COLORS.success,
    fontWeight: "600",
  },
  jobFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  jobSalary: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.success,
  },
  jobPerks: {
    flexDirection: "row",
    gap: 6,
  },
  perkBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#e8f5e8",
    alignItems: "center",
    justifyContent: "center",
  },
  categoriesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginTop: 16,
  },
  categoryCard: {
    width: (width - 44) / 2,
    height: 180,
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 12,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  categoryImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  statusBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    backgroundColor: "rgba(76, 175, 80, 0.9)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 2,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: "600",
    color: COLORS.white,
    textTransform: "uppercase",
  },
  categoryGradient: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: "70%",
  },
  categoryContent: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
  },
  categoryInfo: {
    marginBottom: 10,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.white,
    marginBottom: 4,
  },
  categoryLocation: {
    fontSize: 11,
    color: "rgba(255,255,255,0.8)",
    marginBottom: 2,
  },
  categoryCount: {
    fontSize: 11,
    color: "rgba(255,255,255,0.9)",
    fontWeight: "600",
  },
  categoryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
    gap: 4,
  },
  categoryButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.white,
  },
  loadingContainer: {
    paddingVertical: 48,
    alignItems: "center",
  },
  loadingText: {
    fontSize: 16,
    color: COLORS.textLight,
  },
  emptyContainer: {
    paddingVertical: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.textLight,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#95a5a6",
    textAlign: "center",
  },
  selectCountryButtonLarge: {
    backgroundColor: COLORS.secondary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 16,
  },
  selectCountryButtonLargeText: {
    fontSize: 14,
    color: COLORS.white,
    fontWeight: "600",
  },
});

export default PublicHome;