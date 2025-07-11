import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
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

// Importar imágenes
import sachaInchiImage from "../../../assets/onboarding/slide3.png";
import cacaoImage from "../../../assets/onboarding/slide1.png";
import mielImage from "../../../assets/onboarding/slide2.jpg";
import cafeImage from "../../../assets/onboarding/slide1.png";
import defaultImage from "../../../assets/onboarding/slide1.png";

// Constants - CORREGIDAS
const { width, height } = Dimensions.get("window");
const CARD_WIDTH = width - 40;  // Cambiado de width * 0.85
const CARD_SPACING = 20;        // Cambiado de 16

// 🎨 NUEVA PALETA DE COLORES
const COLORS = {
  gray50: "#FAFAFA",
  gray100: "#F5F5F5",
  gray200: "#EEEEEE",
  gray300: "#E0E0E0",
  gray400: "#BDBDBD",
  gray500: "#9E9E9E",
  gray600: "#757575",
  gray700: "#616161",
  gray800: "#424242",
  gray900: "#212121",

  // Nueva paleta principal
  primary: "#274F66", // Azul oscuro principal
  accent: "#3A7DC1", // Azul medio para acentos
  success: "#B5883E", // Dorado para éxitos/salarios
  warning: "#FF9500",
  error: "#FF3B30",

  background: "#FFFFFF",
  surface: "#FFFFFF",
  card: "#FFFFFF",
  text: "#000000",
  textSecondary: "#6B6B6B",
  textTertiary: "#999999",
  overlay: "rgba(0,0,0,0.3)",
  border: "#F0F0F0",
} as const;

const TYPOGRAPHY = {
  largeTitle: { fontSize: 34, fontWeight: "700" as const, lineHeight: 40 },
  title1: { fontSize: 28, fontWeight: "700" as const, lineHeight: 34 },
  title2: { fontSize: 22, fontWeight: "600" as const, lineHeight: 28 },
  title3: { fontSize: 20, fontWeight: "600" as const, lineHeight: 24 },
  headline: { fontSize: 17, fontWeight: "600" as const, lineHeight: 22 },
  body: { fontSize: 17, fontWeight: "400" as const, lineHeight: 22 },
  callout: { fontSize: 16, fontWeight: "400" as const, lineHeight: 21 },
  subhead: { fontSize: 15, fontWeight: "400" as const, lineHeight: 20 },
  footnote: { fontSize: 13, fontWeight: "400" as const, lineHeight: 18 },
  caption1: { fontSize: 12, fontWeight: "400" as const, lineHeight: 16 },
  caption2: { fontSize: 11, fontWeight: "600" as const, lineHeight: 13 },
} as const;

// 🎨 CONFIGURACIÓN DE CULTIVOS CON NUEVA PALETA
const CROP_CONFIG = {
  "sacha inchi": {
    color: "#274F66", // Azul oscuro principal
    emoji: "🌱",
    title: "Sacha Inchi",
    description: "Superalimento amazónico",
    gradient: ["#274F66", "#3A7DC1"],
  },
  cacao: {
    color: "#B5883E", // Dorado
    emoji: "🍫",
    title: "Cacao",
    description: "Cultivo tradicional",
    gradient: ["#B5883E", "#D4A574"],
  },
  café: {
    color: "#3A7DC1", // Azul medio
    emoji: "☕",
    title: "Café",
    description: "Granos premium",
    gradient: ["#3A7DC1", "#5B9BD5"],
  },
  coffee: {
    color: "#3A7DC1", // Azul medio
    emoji: "☕",
    title: "Coffee",
    description: "Premium beans",
    gradient: ["#3A7DC1", "#5B9BD5"],
  },
  miel: {
    color: "#B5883E", // Dorado
    emoji: "🍯",
    title: "Miel",
    description: "Miel pura",
    gradient: ["#B5883E", "#F4D03F"],
  },
  honey: {
    color: "#B5883E", // Dorado
    emoji: "🍯",
    title: "Honey",
    description: "Pure honey",
    gradient: ["#B5883E", "#F4D03F"],
  },
  default: {
    color: "#274F66", // Azul oscuro como default
    emoji: "🌱",
    title: "Cultivo",
    description: "Agricultura sostenible",
    gradient: ["#274F66", "#3A7DC1"],
  },
} as const;

// City distances from Bogotá (in km)
const CITY_DISTANCES = {
  Bogotá: 0,
  Medellín: 240,
  Cali: 250,
  Barranquilla: 470,
  Cartagena: 550,
  Bucaramanga: 220,
  Pereira: 200,
  Manizales: 180,
  Armenia: 210,
  Ibagué: 120,
  "Santa Marta": 480,
  Villavicencio: 90,
  Pasto: 380,
  Montería: 320,
  Sincelejo: 360,
  Valledupar: 350,
  Riohacha: 520,
  Tunja: 80,
  Popayán: 290,
  Neiva: 180,
  Florencia: 220,
  Yopal: 200,
  Arauca: 300,
  Fortul: 320,
  Saravena: 310,
  Arauquita: 330,
  Caracas: 680,
  Maracaibo: 590,
  Valencia: 720,
  Barquisimeto: 650,
  Maracay: 700,
  "San Cristóbal": 380,
  "Ciudad Bolívar": 580,
  Maturín: 520,
} as const;

const COUNTRIES = ["Colombia", "Venezuela"] as const;

// Types
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
  workersNeeded?: number;
}

interface JobCategory {
  id: string;
  name: string;
  image: any;
  count: string;
  gradient: string[];
  config: any;
  stats?: {
    averageSalary: number;
    cities: string[];
    totalWorkers: number;
    recentOffers: number;
  };
}

interface CropType {
  id: string;
  name: string;
  description?: string;
}

// Utility functions
const getCropConfig = (cropName: string) => {
  if (!cropName) return CROP_CONFIG.default;
  const cropLower = cropName.toLowerCase();
  for (const [key, config] of Object.entries(CROP_CONFIG)) {
    if (cropLower.includes(key)) {
      return config;
    }
  }
  return CROP_CONFIG.default;
};

const getDistance = (city: string): number => {
  if (!city) return 999;
  return CITY_DISTANCES[city as keyof typeof CITY_DISTANCES] || 999;
};

const formatSalary = (salary: number) => {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
  }).format(salary);
};

const formatSalaryCompact = (salary: number) => {
  if (!salary) return "Por consultar";
  if (salary >= 1000000) {
    return `$${(salary / 1000000).toFixed(1)}M`;
  }
  if (salary >= 1000) {
    return `$${(salary / 1000).toFixed(0)}K`;
  }
  return `$${salary}`;
};

const getInitials = (name: string) => {
  if (!name) return "EM";
  const names = name.split(" ");
  let initials = names[0].substring(0, 1).toUpperCase();
  if (names.length > 1) {
    initials += names[names.length - 1].substring(0, 1).toUpperCase();
  }
  return initials;
};

const getEmployerName = (employer: any) => {
  return employer?.organization || "Empleador";
};

const getCropImage = (cropName: string): any => {
  if (!cropName) return defaultImage;
  const cropNameLower = cropName.toLowerCase();

  if (cropNameLower.includes("sacha") || cropNameLower.includes("inchi")) {
    return sachaInchiImage;
  }
  if (cropNameLower.includes("cacao")) {
    return cacaoImage;
  }
  if (cropNameLower.includes("miel") || cropNameLower.includes("honey")) {
    return mielImage;
  }
  if (cropNameLower.includes("café") || cropNameLower.includes("coffee")) {
    return cafeImage;
  }

  return defaultImage;
};

const getLocationText = (offer: JobOfferData): string => {
  const { displayLocation } = offer;
  if (!displayLocation) return "Ubicación no disponible";

  const parts = [
    displayLocation.city,
    displayLocation.state || displayLocation.department,
    displayLocation.country,
  ].filter(Boolean);

  return parts.join(", ");
};

const formatTimeAgo = (dateString: string) => {
  if (!dateString) return "Fecha no disponible";

  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return "Hace unos segundos";
  if (diffInSeconds < 3600) return `Hace ${Math.floor(diffInSeconds / 60)} min`;
  if (diffInSeconds < 86400)
    return `Hace ${Math.floor(diffInSeconds / 3600)} h`;
  if (diffInSeconds < 2592000)
    return `Hace ${Math.floor(diffInSeconds / 86400)} días`;

  return date.toLocaleDateString("es-CO", { day: "numeric", month: "short" });
};

const calculateNearbyScore = (offer: JobOfferData): number => {
  let score = 0;
  const distance = getDistance(offer.displayLocation?.city || "");

  if (distance <= 100) score += 100;
  else if (distance <= 200) score += 80;
  else if (distance <= 300) score += 60;
  else if (distance <= 400) score += 40;
  else score += 20;

  if (offer.includesLodging) score += 50;
  if (offer.includesFood) score += 30;

  if (offer.salary >= 50000) score += 30;
  else if (offer.salary >= 40000) score += 20;
  else if (offer.salary >= 30000) score += 10;

  if (offer.applicationsCount <= 2) score += 25;
  else if (offer.applicationsCount <= 5) score += 15;

  if (parseInt(offer.duration) <= 7) score += 15;
  else if (parseInt(offer.duration) <= 14) score += 10;

  return score;
};

// Main Component - CORREGIDO
const PublicHome: React.FC<PublicHomeProps> = ({ navigation }) => {
  // State
  const [jobOffers, setJobOffers] = useState<JobOfferData[]>([]);
  const [filteredOffers, setFilteredOffers] = useState<JobOfferData[]>([]);
  const [categories, setCategories] = useState<JobCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"available" | "nearby">("available");
  const [selectedCountry, setSelectedCountry] = useState<string>("");
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // NUEVOS ESTADOS PARA EL MODAL DE CATEGORÍAS
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<JobCategory | null>(null);
  const [categoryOffers, setCategoryOffers] = useState<JobOfferData[]>([]);
  const [modalSortBy, setModalSortBy] = useState<"recent" | "salary" | "distance">("recent");

  // Refs for animations
  const scrollX = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const modalSlideAnim = useRef(new Animated.Value(height)).current;
  const [currentSlide, setCurrentSlide] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  // Memoized values - MOVIDOS ANTES de las funciones que los usan
  const featuredOffers = useMemo(() => {
    return [...filteredOffers]
      .sort((a, b) => {
        const dateA = new Date(a.createdAt || a.startDate);
        const dateB = new Date(b.createdAt || b.startDate);
        return dateB.getTime() - dateA.getTime();
      })
      .slice(0, 6);
  }, [filteredOffers]);

  const nearbyOffers = useMemo(() => {
    let nearby = [...filteredOffers];
    if (selectedCountry) {
      nearby = nearby.filter(
        (offer) => offer.displayLocation?.country === selectedCountry
      );
    }
    return nearby
      .map((offer) => ({
        ...offer,
        distance: getDistance(offer.displayLocation?.city || ""),
        nearbyScore: calculateNearbyScore(offer),
      }))
      .sort((a, b) => b.nearbyScore - a.nearbyScore)
      .slice(0, Math.min(nearby.length, 15));
  }, [filteredOffers, selectedCountry]);

  // MEMOIZED SORTED CATEGORY OFFERS
  const sortedCategoryOffers = useMemo(() => {
    let sorted = [...categoryOffers];
    
    switch (modalSortBy) {
      case "recent":
        sorted.sort((a, b) => {
          const dateA = new Date(a.createdAt || a.startDate);
          const dateB = new Date(b.createdAt || b.startDate);
          return dateB.getTime() - dateA.getTime();
        });
        break;
      case "salary":
        sorted.sort((a, b) => (b.salary || 0) - (a.salary || 0));
        break;
      case "distance":
        sorted.sort((a, b) => {
          const distanceA = getDistance(a.displayLocation?.city || "");
          const distanceB = getDistance(b.displayLocation?.city || "");
          return distanceA - distanceB;
        });
        break;
    }
    
    return sorted;
  }, [categoryOffers, modalSortBy]);

  // NUEVA FUNCIÓN PARA CALCULAR ESTADÍSTICAS DE CATEGORÍAS
  const calculateCategoryStats = useCallback((categoryName: string, offers: JobOfferData[]) => {
    const categoryOffers = offers.filter(
      (offer) => offer.cropType?.name.toLowerCase() === categoryName.toLowerCase()
    );

    if (categoryOffers.length === 0) {
      return {
        averageSalary: 0,
        cities: [],
        totalWorkers: 0,
        recentOffers: 0,
      };
    }

    const validSalaries = categoryOffers.filter(offer => offer.salary > 0);
    const averageSalary = validSalaries.length > 0 
      ? validSalaries.reduce((sum, offer) => sum + offer.salary, 0) / validSalaries.length 
      : 0;

    const cities = [...new Set(categoryOffers.map(offer => offer.displayLocation?.city).filter(Boolean))];
    
    const totalWorkers = categoryOffers.reduce((sum, offer) => sum + (offer.workersNeeded || 1), 0);
    
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const recentOffers = categoryOffers.filter(offer => {
      const offerDate = new Date(offer.createdAt || offer.startDate);
      return offerDate >= oneWeekAgo;
    }).length;

    return {
      averageSalary,
      cities: cities.slice(0, 3), // Top 3 ciudades
      totalWorkers,
      recentOffers,
    };
  }, []);

  // NUEVA FUNCIÓN PARA MANEJAR LA SELECCIÓN DE CATEGORÍA CON ANIMACIÓN
  const handleCategoryPress = useCallback((category: JobCategory) => {
    const hasOffers = parseInt(category.count) > 0;
    if (!hasOffers) return;

    // Filtrar ofertas por categoría
    const categoryJobOffers = jobOffers.filter(
      (offer) => offer.cropType?.name.toLowerCase() === category.name.toLowerCase()
    );

    setSelectedCategory(category);
    setCategoryOffers(categoryJobOffers);
    setModalSortBy("recent");
    setShowCategoryModal(true);

    // Animar entrada del modal
    Animated.spring(modalSlideAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start();
  }, [jobOffers, modalSlideAnim]);

  // FUNCIÓN PARA CERRAR EL MODAL CON ANIMACIÓN
  const closeCategoryModal = useCallback(() => {
    Animated.timing(modalSlideAnim, {
      toValue: height,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setShowCategoryModal(false);
      setSelectedCategory(null);
      setCategoryOffers([]);
    });
  }, [modalSlideAnim]);

  // Función para manejar el cambio de slide - CORREGIDA
  const onSlideChange = useCallback((event: any) => {
    if (!featuredOffers || featuredOffers.length === 0) return;
    
    const slide = Math.ceil(event.nativeEvent.contentOffset.x / (CARD_WIDTH + CARD_SPACING));
    if (slide !== currentSlide && slide >= 0 && slide < featuredOffers.length) {
      setCurrentSlide(slide);
    }
  }, [currentSlide, featuredOffers]);

  // Callbacks
  const animateEntry = useCallback(() => {
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
  }, [fadeAnim, slideAnim]);

  const loadJobOffers = useCallback(async (): Promise<JobOfferData[]> => {
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
  }, []);

  const loadCropTypes = useCallback(async (offers: JobOfferData[]) => {
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

      // Calculate crop counts locally within this function
      const counts: { [key: string]: number } = {};
      offers.forEach((offer) => {
        if (offer.cropType && offer.cropType.name) {
          const cropName = offer.cropType.name;
          counts[cropName] = (counts[cropName] || 0) + 1;
        }
      });

      const dynamicCategories: JobCategory[] = cropTypes.map((cropType) => {
        const config = getCropConfig(cropType.name);
        const stats = calculateCategoryStats(cropType.name, offers);
        return {
          id: cropType.id,
          name: cropType.name,
          image: getCropImage(cropType.name),
          count: counts[cropType.name] > 0 ? `${counts[cropType.name]}` : "0",
          gradient: config.gradient,
          config: config,
          stats,
        };
      });

      setCategories(dynamicCategories);
    } catch (error) {
      console.error("Error loading crop types:", error);
      setCategories([]);
    }
  }, [calculateCategoryStats]);

  const filterOffers = useCallback(() => {
    let filtered = [...jobOffers];

    if (searchQuery.trim()) {
      filtered = filtered.filter(
        (offer) =>
          offer.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          offer.cropType?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          offer.displayLocation?.city.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredOffers(filtered);
  }, [jobOffers, searchQuery]);

  const loadInitialData = useCallback(async () => {
    try {
      setLoading(true);
      const offers = await loadJobOffers();
      await loadCropTypes(offers);
    } catch (error) {
      console.error("Error loading initial data:", error);
    } finally {
      setLoading(false);
    }
  }, [loadJobOffers, loadCropTypes]);

  // Effects
  useEffect(() => {
    loadInitialData();
    animateEntry();
  }, [loadInitialData, animateEntry]);

  useEffect(() => {
    filterOffers();
  }, [filterOffers]);

  // Auto-scroll effect - CORREGIDO
  useEffect(() => {
    if (featuredOffers && featuredOffers.length > 1) {
      const timer = setInterval(() => {
        const nextIndex = (currentSlide + 1) % featuredOffers.length;
        flatListRef.current?.scrollToOffset({ 
          offset: nextIndex * (CARD_WIDTH + CARD_SPACING),
          animated: true 
        });
      }, 5000);
  
      return () => clearInterval(timer);
    }
  }, [currentSlide, featuredOffers]);

  // Reset modal animation when modal is closed
  useEffect(() => {
    if (!showCategoryModal) {
      modalSlideAnim.setValue(height);
    }
  }, [showCategoryModal, modalSlideAnim]);

  // Función para renderizar dots de paginación - CORREGIDA
  const renderPaginationDots = () => (
    <View style={styles.paginationContainer}>
      {featuredOffers && featuredOffers.map((_, index) => (
        <TouchableOpacity
          key={index}
          style={[
            styles.paginationDot,
            index === currentSlide && styles.paginationDotActive,
          ]}
          onPress={() => {
            flatListRef.current?.scrollToOffset({ 
              offset: index * (CARD_WIDTH + CARD_SPACING),
              animated: true 
            });
            setCurrentSlide(index);
          }}
        />
      ))}
    </View>
  );

  // 🎨 COMPONENTE BENEFITS INDICATOR CON NUEVOS COLORES
  const BenefitsIndicator = ({
    includesFood,
    includesLodging,
    style = "compact",
  }) => {
    if (style === "compact") {
      return (
        <View style={styles.benefitsCompact}>
          {includesFood && (
            <View style={[styles.benefitIcon, { backgroundColor: "#B5883E" }]}>
              <Ionicons name="restaurant" size={12} color="#FFFFFF" />
            </View>
          )}
          {includesLodging && (
            <View style={[styles.benefitIcon, { backgroundColor: "#3A7DC1" }]}>
              <Ionicons name="home" size={12} color="#FFFFFF" />
            </View>
          )}
        </View>
      );
    }

    if (style === "detailed") {
      return (
        <View style={styles.benefitsDetailed}>
          <View style={styles.benefitRow}>
            <Ionicons
              name="restaurant"
              size={16}
              color={includesFood ? "#B5883E" : COLORS.gray400}
            />
            <Text
              style={[
                styles.benefitText,
                { color: includesFood ? "#B5883E" : COLORS.gray400 },
              ]}>
              Alimentación {includesFood ? "incluida" : "no incluida"}
            </Text>
          </View>

          <View style={styles.benefitRow}>
            <Ionicons
              name="home"
              size={16}
              color={includesLodging ? "#3A7DC1" : COLORS.gray400}
            />
            <Text
              style={[
                styles.benefitText,
                { color: includesLodging ? "#3A7DC1" : COLORS.gray400 },
              ]}>
              Alojamiento {includesLodging ? "incluido" : "no incluido"}
            </Text>
          </View>
        </View>
      );
    }

    // Style "badges"
    return (
      <View style={styles.benefitsBadges}>
        {includesFood && (
          <View style={[styles.benefitBadge, { backgroundColor: "#B5883E" }]}>
            <Ionicons name="restaurant" size={14} color="#FFFFFF" />
            <Text style={styles.benefitBadgeText}>Comida</Text>
          </View>
        )}
        {includesLodging && (
          <View style={[styles.benefitBadge, { backgroundColor: "#3A7DC1" }]}>
            <Ionicons name="home" size={14} color="#FFFFFF" />
            <Text style={styles.benefitBadgeText}>Alojamiento</Text>
          </View>
        )}

        {!includesFood && !includesLodging && (
          <View
            style={[styles.benefitBadge, { backgroundColor: COLORS.gray400 }]}>
            <Ionicons name="close-circle" size={14} color="#FFFFFF" />
            <Text style={styles.benefitBadgeText}>Sin beneficios</Text>
          </View>
        )}
      </View>
    );
  };

  // Render functions
  const renderFloatingNavigation = () => (
    <View style={styles.simpleNavigationContainer}>
      <View style={styles.simpleNavigationTabs}>
        <TouchableOpacity
          style={[
            styles.simpleNavTab,
            activeTab === "available" && styles.simpleNavTabActive,
          ]}
          onPress={() => {
            setActiveTab("available");
            setSelectedCountry("");
          }}>
          <Text
            style={[
              styles.simpleNavTabText,
              activeTab === "available" && styles.simpleNavTabTextActive,
            ]}>
            Ofertas disponibles
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.simpleNavTab,
            activeTab === "nearby" && styles.simpleNavTabActive,
          ]}
          onPress={() => setActiveTab("nearby")}>
          <Text
            style={[
              styles.simpleNavTabText,
              activeTab === "nearby" && styles.simpleNavTabTextActive,
            ]}>
            Ofertas cercanas
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderJobCard = (item: JobOfferData, index: number) => {
    const cropConfig = getCropConfig(item.cropType?.name || "");
    const distance = getDistance(item.displayLocation?.city || "");
    const isNearbyTab = activeTab === "nearby";
    const employerName = getEmployerName(item.employer);
    const initials = getInitials(employerName);

    return (
      <View key={item.id} style={styles.modernJobCard}>
        <TouchableOpacity
          onPress={() =>
            navigation.navigate("WorkerJobOfferDetailNoAuth", {
              jobId: item.id,
              fromPublic: true,
            })
          }
          activeOpacity={0.95}
          style={styles.cardTouchable}>
          
          {/* Card Container with gradient border */}
          <View style={styles.cardContainer}>
            <LinearGradient
              colors={["#FFFFFF", "#FAFAFA"]}
              style={styles.cardBackground}>
              
              {/* Header con badges mejorados */}
              <View style={styles.cardHeader}>
                <View style={styles.timeAndDistance}>
                  <View style={styles.timeBadge}>
                    <Ionicons
                      name="time-outline"
                      size={12}
                      color={COLORS.textSecondary}
                    />
                    <Text style={styles.timeBadgeText}>
                      {formatTimeAgo(item.createdAt || item.startDate)}
                    </Text>
                  </View>

                  {isNearbyTab && distance < 500 && (
                    <View style={styles.distanceBadge}>
                      <Ionicons
                        name="location-outline"
                        size={12}
                        color={COLORS.accent}
                      />
                      <Text style={styles.distanceBadgeText}>{distance}km</Text>
                    </View>
                  )}
                </View>

                {/* Status indicator */}
                <View
                  style={[
                    styles.statusIndicator,
                    { backgroundColor: cropConfig.color },
                  ]}>
                  <View style={styles.statusDot} />
                </View>
              </View>

              {/* Main Content */}
              <View style={styles.cardMainContent}>
                {/* Job Title with crop icon */}
                <View style={styles.titleSection}>
                  <View
                    style={[
                      styles.cropIconContainer,
                      { backgroundColor: `${cropConfig.color}15` },
                    ]}>
                    <Text style={styles.cropEmoji}>{cropConfig.emoji}</Text>
                  </View>
                  <View style={styles.titleContainer}>
                    <Text style={styles.jobTitle} numberOfLines={2}>
                      {item.title}
                    </Text>
                    <View style={styles.cropTypeContainer}>
                      <Text
                        style={[styles.cropType, { color: cropConfig.color }]}>
                        {item.cropType?.name || "N/A"}
                      </Text>
                      {item.phase?.name && (
                        <>
                          <View style={styles.phaseSeparator} />
                          <Text style={styles.phaseText}>
                            {item.phase.name}
                          </Text>
                        </>
                      )}
                    </View>
                  </View>
                </View>

                {/* Location */}
                <View style={styles.locationSection}>
                  <View style={styles.locationIcon}>
                    <Ionicons name="location" size={16} color={COLORS.accent} />
                  </View>
                  <Text style={styles.locationText} numberOfLines={1}>
                    {item.displayLocation?.city}, {item.displayLocation?.state}
                  </Text>
                  {item.displayLocation?.country && (
                    <View style={styles.countryFlag}>
                      <Text style={styles.countryFlagText}>
                        {item.displayLocation.country === "Colombia"
                          ? "🇨🇴"
                          : "🇻🇪"}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Benefits with improved design */}
                <View style={styles.benefitsSection}>
                  <Text style={styles.benefitsLabel}>
                    Beneficios incluidos:
                  </Text>
                  <View style={styles.benefitsContainer}>
                    <View
                      style={[
                        styles.benefitChip,
                        {
                          backgroundColor: item.includesFood
                            ? "#E8F5E8"
                            : "#F5F5F5",
                          borderColor: item.includesFood
                            ? "#4CAF50"
                            : "#E0E0E0",
                        },
                      ]}>
                      <Ionicons
                        name={item.includesFood ? "checkmark" : "close"}
                        size={14}
                        color={item.includesFood ? "#4CAF50" : "#9E9E9E"}
                      />
                      <Text
                        style={[
                          styles.benefitChipText,
                          {
                            color: item.includesFood ? "#2E7D32" : "#757575",
                          },
                        ]}>
                        Alimentación
                      </Text>
                    </View>

                    <View
                      style={[
                        styles.benefitChip,
                        {
                          backgroundColor: item.includesLodging
                            ? "#E3F2FD"
                            : "#F5F5F5",
                          borderColor: item.includesLodging
                            ? "#2196F3"
                            : "#E0E0E0",
                        },
                      ]}>
                      <Ionicons
                        name={item.includesLodging ? "checkmark" : "close"}
                        size={14}
                        color={item.includesLodging ? "#2196F3" : "#9E9E9E"}
                      />
                      <Text
                        style={[
                          styles.benefitChipText,
                          {
                            color: item.includesLodging ? "#1565C0" : "#757575",
                          },
                        ]}>
                        Alojamiento
                      </Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* Footer mejorado */}
              <View style={styles.cardFooter}>
                <View style={styles.employerSection}>
                  <View
                    style={[
                      styles.employerAvatar,
                      { backgroundColor: cropConfig.color },
                    ]}>
                    <Text style={styles.employerInitials}>{initials}</Text>
                  </View>
                  <View style={styles.employerInfo}>
                    <Text style={styles.employerName} numberOfLines={1}>
                      {employerName}
                    </Text>
                    <View style={styles.farmInfo}>
                      <Ionicons
                        name="business-outline"
                        size={12}
                        color={COLORS.textSecondary}
                      />
                      <Text style={styles.farmName} numberOfLines={1}>
                        {item.farm?.name || "Finca"}
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={styles.salarySection}>
                  <Text style={styles.salaryAmount}>
                    {formatSalaryCompact(item.salary)}
                  </Text>
                  <Text style={styles.salaryPeriod}>
                    {item.paymentType === "Por_dia" ? "por día" : "por trabajo"}
                  </Text>
                </View>
              </View>

              {/* Action button floating */}
              <TouchableOpacity
                style={[
                  styles.actionButton,
                  { backgroundColor: cropConfig.color },
                ]}
                onPress={() =>
                  navigation.navigate("WorkerJobOfferDetailNoAuth", {
                    jobId: item.id,
                    fromPublic: true,
                  })
                }>
                <Text style={styles.actionButtonText}>Ver detalles</Text>
                <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
              </TouchableOpacity>

              {/* Applications count badge */}
              {item.applicationsCount > 0 && (
                <View style={styles.applicationsBadge}>
                  <Ionicons
                    name="people-outline"
                    size={12}
                    color={COLORS.textSecondary}
                  />
                  <Text style={styles.applicationsBadgeText}>
                    {item.applicationsCount} aplicantes
                  </Text>
                </View>
              )}
            </LinearGradient>
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  const renderFeaturedOffer = ({ item }: { item: JobOfferData }) => {
    const cropConfig = getCropConfig(item.cropType?.name || "");
    const employerName = getEmployerName(item.employer);
    const initials = getInitials(employerName);
    const locationText = getLocationText(item);
  
    return (
      <View style={styles.featuredCard}>
        <TouchableOpacity
          onPress={() =>
            navigation.navigate("WorkerJobOfferDetailNoAuth", {
              jobId: item.id,
              fromPublic: true,
            })
          }
          activeOpacity={0.9}>
          <View style={styles.featuredContainer}>
            <Image
              source={getCropImage(item.cropType?.name || "")}
              style={styles.featuredImage}
            />
  
            {/* Gradient overlay mejorado - solo en la parte inferior */}
            <LinearGradient
              colors={[
                'transparent',
                'transparent', 
                'rgba(0,0,0,0.4)',
                'rgba(0,0,0,0.8)',
                'rgba(0,0,0,0.95)'
              ]}
              locations={[0, 0.3, 0.6, 0.8, 1]}
              style={styles.featuredOverlay}
            />
  
            {/* Content overlay reorganizado */}
            <View style={styles.featuredContent}>
              {/* Header badges - solo en la parte superior */}
              <View style={styles.featuredHeader}>
                <View style={styles.featuredBadges}>
                  <View style={styles.featuredStatusBadge}>
                    <Text style={styles.featuredStatusText}>✨ Destacado</Text>
                  </View>
                  <View style={styles.featuredTimeBadge}>
                    <Text style={styles.featuredTimeText}>
                      {formatTimeAgo(item.createdAt || item.startDate)}
                    </Text>
                  </View>
                </View>
              </View>
  
              {/* Espaciador para empujar contenido hacia abajo */}
              <View style={styles.featuredSpacer} />
  
              {/* Todo el contenido principal en la parte inferior */}
              <View style={styles.featuredBottomContent}>
                {/* Información rápida arriba del título */}
                <View style={styles.featuredQuickInfoTop}>
                  <View style={styles.featuredInfoBadge}>
                    <Text style={styles.featuredCropType}>{item.cropType?.name}</Text>
                    <Text style={styles.featuredSeparator}>•</Text>
                    <Text style={styles.featuredLocation}>{item.displayLocation?.city}</Text>
                  </View>
                </View>
  
                {/* Título principal */}
                <View style={styles.featuredTitleSection}>
                  <Text style={styles.featuredTitle}>{item.title}</Text>
                </View>
  
                {/* Información adicional */}
                <View style={styles.featuredDetailsGrid}>
                  <View style={styles.featuredDetailItem}>
                    <Ionicons name="business-outline" size={14} color="rgba(255,255,255,0.8)" />
                    <Text style={styles.featuredDetailText}>{item.farm?.name || 'Finca'}</Text>
                  </View>
                  <View style={styles.featuredDetailItem}>
                    <Ionicons name="time-outline" size={14} color="rgba(255,255,255,0.8)" />
                    <Text style={styles.featuredDetailText}>{item.duration} días</Text>
                  </View>
                </View>
  
                {/* Footer con empleador y botón */}
                <View style={styles.featuredFooter}>
                  <View style={styles.featuredEmployerSection}>
                    <View style={[styles.featuredEmployerAvatar, { backgroundColor: cropConfig.color }]}>
                      <Text style={styles.featuredEmployerInitials}>{initials}</Text>
                    </View>
                    <View style={styles.featuredEmployerInfo}>
                      <Text style={styles.featuredEmployerName}>{employerName}</Text>
                      <Text style={styles.featuredSalary}>
                        {formatSalaryCompact(item.salary)} {item.paymentType === "Por_dia" ? "/día" : "/trabajo"}
                      </Text>
                    </View>
                  </View>
  
                  <TouchableOpacity style={styles.featuredActionButton}>
                    <Text style={styles.featuredActionText}>Ver oferta</Text>
                    <Ionicons name="arrow-forward" size={16} color="#000000" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </TouchableOpacity>
      </View>
    );
  };
  
  // MEJORADO CATEGORY CARD CON MÁS INFORMACIÓN Y MEJOR DISEÑO
  const renderCategoryCard = (item: JobCategory) => {
    const hasOffers = parseInt(item.count) > 0;
    const stats = item.stats;

    return (
      <TouchableOpacity
        key={item.id}
        style={[styles.enhancedCategoryCard, !hasOffers && styles.categoryCardDisabled]}
        onPress={() => handleCategoryPress(item)}
        activeOpacity={0.8}>
        
        {/* Background Image */}
        <Image source={item.image} style={styles.categoryBackgroundImage} />
        
        {/* Gradient Overlay */}
        <LinearGradient
          colors={item.config.gradient || [item.config.color, `${item.config.color}DD`]}
          style={styles.categoryGradientOverlay}
        />
        
        {/* Content Container */}
        <View style={styles.categoryCardContent}>
          {/* Header con emoji y ofertas count */}
          <View style={styles.categoryCardHeader}>
            <View style={styles.categoryEmojiContainer}>
              <Text style={styles.categoryEmoji}>{item.config.emoji}</Text>
            </View>
            <View style={styles.categoryOffersCount}>
              <Text style={styles.categoryOffersCountText}>{item.count}</Text>
              <Text style={styles.categoryOffersLabel}>ofertas</Text>
            </View>
          </View>

          {/* Spacer */}
          <View style={styles.categorySpacer} />

          {/* Bottom Content */}
          <View style={styles.categoryBottomContent}>
            {/* Title */}
            <Text style={styles.categoryTitle}>{item.config.title}</Text>
            <Text style={styles.categoryDescription}>{item.config.description}</Text>

            {/* Stats Row */}
            {hasOffers && stats && (
              <View style={styles.categoryStatsContainer}>
                <View style={styles.categoryStats}>
                  {/* Salary */}
                  {stats.averageSalary > 0 && (
                    <View style={styles.categoryStat}>
                      <Ionicons name="cash-outline" size={12} color="rgba(255,255,255,0.9)" />
                      <Text style={styles.categoryStatText}>
                        {formatSalaryCompact(stats.averageSalary)}
                      </Text>
                    </View>
                  )}
                  
                  {/* Cities */}
                  {stats.cities.length > 0 && (
                    <View style={styles.categoryStat}>
                      <Ionicons name="location-outline" size={12} color="rgba(255,255,255,0.9)" />
                      <Text style={styles.categoryStatText}>
                        {stats.cities.length} ciudades
                      </Text>
                    </View>
                  )}

                  {/* Recent offers */}
                  {stats.recentOffers > 0 && (
                    <View style={styles.categoryStat}>
                      <Ionicons name="time-outline" size={12} color="rgba(255,255,255,0.9)" />
                      <Text style={styles.categoryStatText}>
                        {stats.recentOffers} nuevas
                      </Text>
                    </View>
                  )}
                </View>

                {/* Action indicator */}
                <View style={styles.categoryAction}>
                  <Ionicons name="arrow-forward" size={16} color="rgba(255,255,255,0.8)" />
                </View>
              </View>
            )}

            {/* No offers state */}
            {!hasOffers && (
              <View style={styles.categoryNoOffers}>
                <Text style={styles.categoryNoOffersText}>Sin ofertas disponibles</Text>
              </View>
            )}
          </View>
        </View>

        {/* Trending indicator for categories with recent offers */}
        {hasOffers && stats && stats.recentOffers > 0 && (
          <View style={styles.categoryTrendingBadge}>
            <Ionicons name="trending-up" size={12} color="#FFFFFF" />
            <Text style={styles.categoryTrendingText}>Tendencia</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderFilterModal = () => (
    <Modal
      visible={showFilters}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setShowFilters(false)}>
      <View style={styles.modalOverlay}>
        <TouchableOpacity
          style={styles.modalBackdrop}
          onPress={() => setShowFilters(false)}
        />
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Seleccionar país</Text>
            <TouchableOpacity onPress={() => setShowFilters(false)}>
              <Ionicons name="close" size={24} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            {COUNTRIES.map((country) => (
              <TouchableOpacity
                key={country}
                style={[
                  styles.countryOption,
                  selectedCountry === country && styles.countryOptionSelected,
                ]}
                onPress={() =>
                  setSelectedCountry(country === selectedCountry ? "" : country)
                }>
                <Text
                  style={[
                    styles.countryOptionText,
                    selectedCountry === country &&
                      styles.countryOptionTextSelected,
                  ]}>
                  {country}
                </Text>
                {selectedCountry === country && (
                  <Ionicons name="checkmark" size={20} color={COLORS.accent} />
                )}
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.modalActions}>
            <TouchableOpacity
              style={styles.modalButtonSecondary}
              onPress={() => setSelectedCountry("")}>
              <Text style={styles.modalButtonSecondaryText}>Limpiar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modalButtonPrimary}
              onPress={() => setShowFilters(false)}>
              <Text style={styles.modalButtonPrimaryText}>Aplicar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  // MEJORADO MODAL DE CATEGORÍAS CON MUCHO MEJOR DISEÑO Y FUNCIONALIDAD
  const renderCategoryModal = () => (
    <Modal
      visible={showCategoryModal}
      transparent={true}
      animationType="none"
      onRequestClose={closeCategoryModal}>
      <View style={styles.enhancedModalOverlay}>
        <TouchableOpacity 
          style={styles.enhancedModalBackdrop}
          activeOpacity={1}
          onPress={closeCategoryModal}
        />
        
        <Animated.View 
          style={[
            styles.enhancedModalContainer,
            {
              transform: [{ translateY: modalSlideAnim }]
            }
          ]}>
          
          {/* Modal Header Mejorado */}
          <LinearGradient
            colors={selectedCategory?.config?.gradient || [COLORS.primary, COLORS.accent]}
            style={styles.enhancedModalHeader}>
            
            {/* Background Pattern */}
            <View style={styles.modalHeaderPattern}>
              <Ionicons name="leaf-outline" size={120} color="rgba(255,255,255,0.1)" />
            </View>
            
            <View style={styles.modalHeaderContent}>
              <View style={styles.modalHeaderTop}>
                <TouchableOpacity 
                  style={styles.enhancedModalCloseButton}
                  onPress={closeCategoryModal}>
                  <Ionicons name="close" size={24} color="#FFFFFF" />
                </TouchableOpacity>
              </View>

              <View style={styles.modalHeaderMain}>
                <View style={styles.modalHeaderInfo}>
                  <View style={styles.modalEmojiContainer}>
                    <Text style={styles.modalEmoji}>
                      {selectedCategory?.config?.emoji || "🌱"}
                    </Text>
                  </View>
                  
                  <View style={styles.modalTitleContainer}>
                    <Text style={styles.modalMainTitle}>
                      {selectedCategory?.config?.title || "Categoría"}
                    </Text>
                    <Text style={styles.modalSubtitle}>
                      {selectedCategory?.config?.description || "Descripción"}
                    </Text>
                  </View>
                </View>

                {/* Stats Cards */}
                <View style={styles.modalStatsGrid}>
                  <View style={styles.modalStatCard}>
                    <Text style={styles.modalStatNumber}>{categoryOffers.length}</Text>
                    <Text style={styles.modalStatLabel}>Ofertas</Text>
                  </View>
                  
                  {selectedCategory?.stats?.averageSalary > 0 && (
                    <View style={styles.modalStatCard}>
                      <Text style={styles.modalStatNumber}>
                        {formatSalaryCompact(selectedCategory.stats.averageSalary)}
                      </Text>
                      <Text style={styles.modalStatLabel}>Promedio</Text>
                    </View>
                  )}
                  
                  {selectedCategory?.stats?.cities.length > 0 && (
                    <View style={styles.modalStatCard}>
                      <Text style={styles.modalStatNumber}>
                        {selectedCategory.stats.cities.length}
                      </Text>
                      <Text style={styles.modalStatLabel}>Ciudades</Text>
                    </View>
                  )}
                </View>
              </View>
            </View>
          </LinearGradient>

          {/* Controls Section */}
          <View style={styles.modalControlsSection}>
            <View style={styles.modalControlsHeader}>
              <Text style={styles.modalControlsTitle}>Ordenar por:</Text>
              <View style={styles.modalSortControls}>
                {[
                  { key: "recent", label: "Recientes", icon: "time-outline" },
                  { key: "salary", label: "Salario", icon: "cash-outline" },
                  { key: "distance", label: "Distancia", icon: "location-outline" }
                ].map((sort) => (
                  <TouchableOpacity
                    key={sort.key}
                    style={[
                      styles.modalSortButton,
                      modalSortBy === sort.key && styles.modalSortButtonActive
                    ]}
                    onPress={() => setModalSortBy(sort.key)}>
                    <Ionicons 
                      name={sort.icon} 
                      size={14} 
                      color={modalSortBy === sort.key ? "#FFFFFF" : COLORS.textSecondary}
                    />
                    <Text style={[
                      styles.modalSortButtonText,
                      modalSortBy === sort.key && styles.modalSortButtonTextActive
                    ]}>
                      {sort.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          {/* Lista de ofertas mejorada */}
          <ScrollView 
            style={styles.enhancedModalContent}
            showsVerticalScrollIndicator={false}>
            {sortedCategoryOffers.length > 0 ? (
              <View style={styles.enhancedOffersList}>
                {sortedCategoryOffers.map((offer, index) => (
                  <View key={offer.id} style={styles.enhancedOfferCard}>
                    <TouchableOpacity
                      onPress={() => {
                        closeCategoryModal();
                        navigation.navigate("WorkerJobOfferDetailNoAuth", {
                          jobId: offer.id,
                          fromPublic: true,
                        });
                      }}
                      style={styles.enhancedOfferTouchable}
                      activeOpacity={0.7}>
                      
                      {/* Card Header */}
                      <View style={styles.enhancedOfferHeader}>
                        <View style={styles.enhancedOfferBadges}>
                          <View style={styles.enhancedOfferTimeBadge}>
                            <Ionicons name="time-outline" size={10} color={COLORS.textSecondary} />
                            <Text style={styles.enhancedOfferTimeText}>
                              {formatTimeAgo(offer.createdAt || offer.startDate)}
                            </Text>
                          </View>
                          
                          {offer.displayLocation?.city && (
                            <View style={styles.enhancedOfferLocationBadge}>
                              <Ionicons name="location" size={10} color={COLORS.accent} />
                              <Text style={styles.enhancedOfferLocationText}>
                                {offer.displayLocation.city}
                              </Text>
                            </View>
                          )}

                          {modalSortBy === "distance" && (
                            <View style={styles.enhancedOfferDistanceBadge}>
                              <Text style={styles.enhancedOfferDistanceText}>
                                {getDistance(offer.displayLocation?.city || "")}km
                              </Text>
                            </View>
                          )}
                        </View>

                        <View style={[
                          styles.enhancedOfferStatusDot,
                          { backgroundColor: selectedCategory?.config?.color || COLORS.primary }
                        ]} />
                      </View>

                      {/* Main Content */}
                      <View style={styles.enhancedOfferMain}>
                        <Text style={styles.enhancedOfferTitle} numberOfLines={2}>
                          {offer.title}
                        </Text>
                        
                        {offer.phase?.name && (
                          <Text style={styles.enhancedOfferPhase}>
                            {offer.phase.name}
                          </Text>
                        )}

                        <View style={styles.enhancedOfferDetails}>
                          <View style={styles.enhancedOfferDetailItem}>
                            <Ionicons name="business" size={12} color={COLORS.textSecondary} />
                            <Text style={styles.enhancedOfferDetailText}>
                              {offer.farm?.name || "Finca"}
                            </Text>
                          </View>
                          <View style={styles.enhancedOfferDetailItem}>
                            <Ionicons name="calendar" size={12} color={COLORS.textSecondary} />
                            <Text style={styles.enhancedOfferDetailText}>
                              {offer.duration} días
                            </Text>
                          </View>
                          {offer.workersNeeded && (
                            <View style={styles.enhancedOfferDetailItem}>
                              <Ionicons name="people" size={12} color={COLORS.textSecondary} />
                              <Text style={styles.enhancedOfferDetailText}>
                                {offer.workersNeeded} trabajadores
                              </Text>
                            </View>
                          )}
                        </View>

                        {/* Benefits Enhanced */}
                        {(offer.includesFood || offer.includesLodging) && (
                          <View style={styles.enhancedOfferBenefits}>
                            {offer.includesFood && (
                              <View style={styles.enhancedOfferBenefit}>
                                <Ionicons name="restaurant" size={11} color="#4CAF50" />
                                <Text style={styles.enhancedOfferBenefitText}>Alimentación</Text>
                              </View>
                            )}
                            {offer.includesLodging && (
                              <View style={styles.enhancedOfferBenefit}>
                                <Ionicons name="home" size={11} color="#2196F3" />
                                <Text style={styles.enhancedOfferBenefitText}>Alojamiento</Text>
                              </View>
                            )}
                          </View>
                        )}
                      </View>

                      {/* Footer Enhanced */}
                      <View style={styles.enhancedOfferFooter}>
                        <View style={styles.enhancedOfferEmployer}>
                          <View style={[
                            styles.enhancedOfferEmployerAvatar,
                            { backgroundColor: selectedCategory?.config?.color || COLORS.primary }
                          ]}>
                            <Text style={styles.enhancedOfferEmployerInitials}>
                              {getInitials(getEmployerName(offer.employer))}
                            </Text>
                          </View>
                          <View style={styles.enhancedOfferEmployerInfo}>
                            <Text style={styles.enhancedOfferEmployerName} numberOfLines={1}>
                              {getEmployerName(offer.employer)}
                            </Text>
                            <Text style={styles.enhancedOfferEmployerLocation} numberOfLines={1}>
                              {offer.displayLocation?.state}
                            </Text>
                          </View>
                        </View>
                        
                        <View style={styles.enhancedOfferSalaryContainer}>
                          <Text style={styles.enhancedOfferSalaryAmount}>
                            {formatSalaryCompact(offer.salary)}
                          </Text>
                          <Text style={styles.enhancedOfferSalaryPeriod}>
                            {offer.paymentType === "Por_dia" ? "/día" : "/trabajo"}
                          </Text>
                        </View>
                      </View>

                      {/* Applications count */}
                      {offer.applicationsCount > 0 && (
                        <View style={styles.enhancedOfferApplications}>
                          <Ionicons name="people" size={11} color={COLORS.textSecondary} />
                          <Text style={styles.enhancedOfferApplicationsText}>
                            {offer.applicationsCount} {offer.applicationsCount === 1 ? 'aplicante' : 'aplicantes'}
                          </Text>
                        </View>
                      )}

                      {/* Call to action arrow */}
                      <View style={styles.enhancedOfferCTA}>
                        <Ionicons name="arrow-forward" size={16} color={selectedCategory?.config?.color || COLORS.primary} />
                      </View>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.enhancedModalEmpty}>
                <Ionicons name="search-outline" size={48} color={COLORS.textTertiary} />
                <Text style={styles.enhancedModalEmptyTitle}>
                  No hay ofertas disponibles
                </Text>
                <Text style={styles.enhancedModalEmptyText}>
                  Esta categoría no tiene ofertas laborales en este momento.
                  Te notificaremos cuando hayan nuevas oportunidades.
                </Text>
              </View>
            )}
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );

  const displayOffers = activeTab === "nearby" ? nearbyOffers : filteredOffers;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      <CustomHeaderNoAuth navigation={navigation} />

      <Animated.View
        style={[
          styles.content,
          { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
        ]}>
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}>
          {renderFloatingNavigation()}

          {/* Featured Offers Section - CORREGIDA */}
          {featuredOffers && featuredOffers.length > 0 && (
            <View style={styles.heroSection}>
              <View style={styles.heroHeader}>
                <Text style={styles.heroSectionTitle}>Ofertas Destacadas</Text>
                <View style={styles.heroCounter}>
                  <Text style={styles.heroCounterText}>
                    {currentSlide + 1} de {featuredOffers.length}
                  </Text>
                </View>
              </View>

              <Animated.FlatList
                ref={flatListRef}
                data={featuredOffers}
                renderItem={renderFeaturedOffer}
                keyExtractor={(item) => item.id}
                horizontal
                showsHorizontalScrollIndicator={false}
                pagingEnabled
                snapToInterval={CARD_WIDTH + CARD_SPACING} // Card width + spacing
                snapToAlignment="start"
                decelerationRate="fast"
                ItemSeparatorComponent={() => (
                  <View style={{ width: CARD_SPACING }} />
                )}
                contentContainerStyle={styles.heroListContainer}
                onScroll={Animated.event(
                  [{ nativeEvent: { contentOffset: { x: scrollX } } }],
                  {
                    useNativeDriver: true,
                    listener: onSlideChange,
                  }
                )}
                scrollEventThrottle={16}
                onScrollToIndexFailed={(info) => {
                  setTimeout(() => {
                    flatListRef.current?.scrollToIndex({
                      index: info.index,
                      animated: true,
                    });
                  }, 100);
                }}
              />
              {featuredOffers.length > 1 && renderPaginationDots()}
            </View>
          )}

          {/* Categories Section Mejorada */}
          {activeTab === "available" && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>
                  Explora por categoría
                </Text>
                <Text style={styles.sectionSubtitle}>
                  Encuentra oportunidades en tu área de interés
                </Text>
              </View>

              {categories.length > 0 ? (
                <View style={styles.enhancedCategoriesGrid}>
                  {categories.slice(0, 6).map(renderCategoryCard)}
                </View>
              ) : (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyDescription}>
                    No hay categorías disponibles
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* All Offers Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                {activeTab === "nearby"
                  ? selectedCountry
                    ? `Ofertas cercanas en ${selectedCountry}`
                    : "Ofertas cercanas"
                  : "Todas las ofertas"}
              </Text>
            </View>

            {loading ? (
              <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Cargando ofertas...</Text>
              </View>
            ) : activeTab === "nearby" && !selectedCountry ? (
              <View style={styles.emptyState}>
                <Ionicons
                  name="flag-outline"
                  size={48}
                  color={COLORS.textTertiary}
                />
                <Text style={styles.emptyTitle}>Selecciona un país</Text>
                <Text style={styles.emptyDescription}>
                  Elige Colombia o Venezuela para descubrir ofertas cercanas
                </Text>
                <TouchableOpacity
                  style={styles.emptyAction}
                  onPress={() => setShowFilters(true)}>
                  <Text style={styles.emptyActionText}>Seleccionar país</Text>
                </TouchableOpacity>
              </View>
            ) : displayOffers.length > 0 ? (
              <View style={styles.jobsList}>
                {displayOffers.map((offer, index) =>
                  renderJobCard(offer, index)
                )}
              </View>
            ) : (
              <View style={styles.emptyState}>
                <Ionicons
                  name="search-outline"
                  size={48}
                  color={COLORS.textTertiary}
                />
                <Text style={styles.emptyTitle}>
                  {activeTab === "nearby"
                    ? `No hay ofertas cercanas en ${selectedCountry}`
                    : "No se encontraron ofertas"}
                </Text>
                <Text style={styles.emptyDescription}>
                  {activeTab === "nearby"
                    ? "Intenta seleccionar otro país o explora las ofertas disponibles"
                    : "Intenta ajustar tu búsqueda o explora otras categorías"}
                </Text>
              </View>
            )}
          </View>
        </ScrollView>
      </Animated.View>

      {renderFilterModal()}
      {renderCategoryModal()} {/* MODAL MEJORADO */}
    </View>
  );
};

// 🎨 STYLESHEET MEJORADO CON NUEVOS ESTILOS
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
  },
  featuredContent: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    padding: 20,
    justifyContent: "space-between",
  },
  
  featuredHeader: {
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "flex-start",
  },
  
  featuredBadges: {
    flexDirection: "row",
    gap: 8,
  },
  
  featuredStatusBadge: {
    backgroundColor: "rgba(255,215,0,0.95)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  
  featuredStatusText: {
    color: "#8B4513",
    fontSize: 12,
    fontWeight: "700",
  },
  
  featuredTimeBadge: {
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  
  featuredTimeText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },
  
  featuredSpacer: {
    flex: 1,
  },
  
  featuredBottomContent: {
    gap: 16,
    paddingTop: 20,
  },
  
  featuredQuickInfoTop: {
    marginBottom: 8,
  },
  
  featuredInfoBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.4)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: "flex-start",
    gap: 6,
  },
  
  featuredCropType: {
    fontSize: 14,
    color: "#FFFFFF",
    fontWeight: "600",
  },
  
  featuredSeparator: {
    fontSize: 14,
    color: "rgba(255,255,255,0.6)",
  },
  
  featuredLocation: {
    fontSize: 14,
    color: "#FFFFFF",
    fontWeight: "500",
  },
  
  featuredTitleSection: {
    marginBottom: 8,
  },
  
  featuredTitle: {
    fontSize: 24,
    color: "#FFFFFF",
    fontWeight: "800",
    lineHeight: 30,
    textShadowColor: "rgba(0,0,0,0.7)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  
  featuredDetailsGrid: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 8,
  },
  
  featuredDetailItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(0,0,0,0.3)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  
  featuredDetailText: {
    fontSize: 13,
    color: "rgba(255,255,255,0.9)",
    fontWeight: "500",
  },
  
  featuredFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.1)",
  },
  
  featuredEmployerSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  
  featuredEmployerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  
  featuredEmployerInitials: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  
  featuredEmployerInfo: {
    flex: 1,
  },
  
  featuredEmployerName: {
    fontSize: 15,
    color: "#FFFFFF",
    fontWeight: "600",
    marginBottom: 2,
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  
  featuredSalary: {
    fontSize: 18,
    color: "#FFFFFF",
    fontWeight: "700",
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  
  featuredActionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 25,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  
  featuredActionText: {
    fontSize: 14,
    color: "#000000",
    fontWeight: "700",
  },
  heroSection: {
    marginTop: 20,
  },
  heroHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  heroSectionTitle: {
    ...TYPOGRAPHY.title3,
    color: COLORS.text,
    fontWeight: "700",
  },
  heroCounter: {
    backgroundColor: COLORS.gray100,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  heroCounterText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: "600",
  },
  heroListContainer: {
    paddingHorizontal: 20,
    paddingRight: 40, // Padding extra al final
  },

  // Pagination - CORREGIDOS
  paginationContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 20,
    paddingBottom: 10,
    gap: 8,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.gray300,
  },
  paginationDotActive: {
    backgroundColor: COLORS.primary,
    width: 24, // Dot activo más ancho
  },

  // Featured Card - CORREGIDO
  featuredCard: {
    width: CARD_WIDTH,
    height: 380,
    borderRadius: 24,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
    // No marginRight aquí, se maneja con ItemSeparatorComponent
  },
  
  modernJobCard: {
    marginBottom: 20,
  },

  cardTouchable: {
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },

  cardContainer: {
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },

  cardBackground: {
    padding: 20,
  },

  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },

  timeAndDistance: {
    flexDirection: "row",
    gap: 8,
  },

  timeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#F8F9FA",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },

  timeBadgeText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: "500",
  },

  distanceBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#E3F2FD",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },

  distanceBadgeText: {
    fontSize: 12,
    color: COLORS.accent,
    fontWeight: "600",
  },

  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },

  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#FFFFFF",
  },

  cardMainContent: {
    gap: 16,
  },

  titleSection: {
    flexDirection: "row",
    gap: 12,
  },

  cropIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },

  cropEmoji: {
    fontSize: 20,
  },

  titleContainer: {
    flex: 1,
  },

  jobTitle: {
    ...TYPOGRAPHY.title3,
    color: COLORS.text,
    fontWeight: "700",
    marginBottom: 4,
  },

  cropTypeContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  cropType: {
    fontSize: 14,
    fontWeight: "600",
  },

  phaseSeparator: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.gray400,
  },

  phaseText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: "500",
  },

  locationSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  locationIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#E3F2FD",
    alignItems: "center",
    justifyContent: "center",
  },

  locationText: {
    flex: 1,
    fontSize: 15,
    color: COLORS.textSecondary,
    fontWeight: "500",
  },

  countryFlag: {
    padding: 4,
  },

  countryFlagText: {
    fontSize: 16,
  },

  benefitsSection: {
    gap: 8,
  },

  benefitsLabel: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  benefitsContainer: {
    flexDirection: "row",
    gap: 8,
  },

  benefitChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },

  benefitChipText: {
    fontSize: 13,
    fontWeight: "500",
  },

  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#F5F5F5",
  },

  employerSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },

  employerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },

  employerInitials: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },

  employerInfo: {
    flex: 1,
  },

  employerName: {
    fontSize: 15,
    color: COLORS.text,
    fontWeight: "600",
    marginBottom: 2,
  },

  farmInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },

  farmName: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },

  salarySection: {
    alignItems: "flex-end",
  },

  salaryAmount: {
    fontSize: 18,
    color: COLORS.success,
    fontWeight: "700",
  },

  salaryPeriod: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: "500",
  },

  actionButton: {
    position: "absolute",
    top: 16,
    right: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },

  actionButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "600",
  },

  applicationsBadge: {
    position: "absolute",
    bottom: 16,
    right: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255,255,255,0.9)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },

  applicationsBadgeText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: "500",
  },

  featuredContainer: {
    width: "100%",
    height: "100%",
    position: "relative",
  },

  featuredImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },

  featuredOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },

  featuredMainContent: {
    gap: 16,
  },

  featuredSubtitle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },


  featuredQuickInfo: {
    gap: 12,
  },

  featuredInfoItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  featuredInfoText: {
    fontSize: 15,
    color: "rgba(255,255,255,0.9)",
    fontWeight: "500",
  },

  scrollView: {
    flex: 1,
  },

  // Benefits Styles con nueva paleta
  benefitsCompact: {
    flexDirection: "row",
    gap: 4,
  },

  benefitIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },

  benefitsDetailed: {
    gap: 8,
    marginVertical: 12,
  },

  benefitRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  benefitText: {
    ...TYPOGRAPHY.footnote,
    fontWeight: "500",
  },

  benefitsBadges: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 8,
  },

  benefitBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },

  benefitBadgeText: {
    ...TYPOGRAPHY.caption1,
    color: "#FFFFFF",
    fontWeight: "600",
  },

  benefitDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },

  // Simple Navigation con nueva paleta
  simpleNavigationContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  simpleNavigationTabs: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  simpleNavTab: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 8,
  },
  simpleNavTabActive: {
    borderBottomWidth: 2,
    borderBottomColor: COLORS.primary,
  },
  simpleNavTabText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    fontWeight: "400",
  },
  simpleNavTabTextActive: {
    color: COLORS.primary,
    fontWeight: "600",
  },

  // NUEVOS ESTILOS PARA CATEGORÍAS MEJORADAS
  enhancedCategoriesGrid: {
    paddingHorizontal: 20,
    gap: 16,
  },

  enhancedCategoryCard: {
    height: 200,
    borderRadius: 20,
    overflow: "hidden",
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
  },

  categoryBackgroundImage: {
    position: "absolute",
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },

  categoryGradientOverlay: {
    position: "absolute",
    width: "100%",
    height: "100%",
    opacity: 0.85,
  },

  categoryCardContent: {
    flex: 1,
    padding: 20,
    justifyContent: "space-between",
  },

  categoryCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },

  categoryEmojiContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
  },

  categoryEmoji: {
    fontSize: 24,
  },

  categoryOffersCount: {
    alignItems: "flex-end",
    backgroundColor: "rgba(255,255,255,0.15)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },

  categoryOffersCountText: {
    fontSize: 20,
    color: "#FFFFFF",
    fontWeight: "800",
    lineHeight: 22,
  },

  categoryOffersLabel: {
    fontSize: 11,
    color: "rgba(255,255,255,0.9)",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  categorySpacer: {
    flex: 1,
  },

  categoryBottomContent: {
    gap: 12,
  },

  categoryTitle: {
    fontSize: 22,
    color: "#FFFFFF",
    fontWeight: "800",
    lineHeight: 26,
    textShadowColor: "rgba(0,0,0,0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },

  categoryDescription: {
    fontSize: 14,
    color: "rgba(255,255,255,0.9)",
    fontWeight: "500",
    textShadowColor: "rgba(0,0,0,0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },

  categoryStatsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 8,
  },

  categoryStats: {
    flexDirection: "row",
    gap: 16,
    flex: 1,
  },

  categoryStat: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },

  categoryStatText: {
    fontSize: 12,
    color: "rgba(255,255,255,0.9)",
    fontWeight: "600",
  },

  categoryAction: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },

  categoryNoOffers: {
    alignItems: "center",
    paddingVertical: 8,
  },

  categoryNoOffersText: {
    fontSize: 13,
    color: "rgba(255,255,255,0.7)",
    fontWeight: "500",
  },

  categoryTrendingBadge: {
    position: "absolute",
    top: 16,
    right: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#FF6B35",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },

  categoryTrendingText: {
    fontSize: 10,
    color: "#FFFFFF",
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  categoryCardDisabled: {
    opacity: 0.5,
  },

  // Interest Cards (fallback si no se usan las enhanced)
  interestGrid: {
    paddingHorizontal: 20,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  interestCard: {
    width: (width - 56) / 2,
    height: 160,
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  interestImageContainer: {
    width: "100%",
    height: "100%",
    position: "relative",
  },
  interestImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  interestOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  interestContent: {
    position: "absolute",
    bottom: 60,
    left: 16,
    right: 16,
  },
  interestTitle: {
    ...TYPOGRAPHY.headline,
    color: "#FFFFFF",
    fontWeight: "700",
  },
  avatarsContainer: {
    position: "absolute",
    bottom: 16,
    left: 16,
    right: 16,
  },
  avatarStack: {
    flexDirection: "row",
    alignItems: "center",
    height: 32,
  },
  miniAvatar: {
    position: "absolute",
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  miniAvatarText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "bold",
  },
  countBadge: {
    position: "absolute",
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  countBadgeText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "600",
  },

  // Sections mejoradas
  section: {
    marginTop: 40,
  },
  sectionHeader: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    ...TYPOGRAPHY.title2,
    color: COLORS.text,
    fontWeight: "700",
    marginBottom: 4,
  },
  sectionSubtitle: {
    ...TYPOGRAPHY.subhead,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  sectionAction: {
    ...TYPOGRAPHY.callout,
    color: COLORS.accent,
    fontWeight: "500",
  },

  // Job Cards
  jobsList: {
    paddingHorizontal: 20,
    gap: 16,
  },

  // Modal con nueva paleta
  modalOverlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: "flex-end",
  },
  modalBackdrop: {
    flex: 1,
  },
  modal: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: height * 0.7,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    ...TYPOGRAPHY.headline,
    color: COLORS.text,
  },
  modalContent: {
    padding: 20,
  },
  countryOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  countryOptionSelected: {
    backgroundColor: COLORS.gray100,
  },
  countryOptionText: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
  },
  countryOptionTextSelected: {
    fontWeight: "600",
  },
  modalActions: {
    flexDirection: "row",
    padding: 20,
    gap: 12,
  },
  modalButtonSecondary: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    backgroundColor: COLORS.gray100,
  },
  modalButtonSecondaryText: {
    ...TYPOGRAPHY.callout,
    color: COLORS.text,
    fontWeight: "500",
  },
  modalButtonPrimary: {
    flex: 1,
    backgroundColor: COLORS.accent,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  modalButtonPrimaryText: {
    ...TYPOGRAPHY.callout,
    color: COLORS.background,
    fontWeight: "600",
  },

  // ESTILOS PARA EL MODAL MEJORADO DE CATEGORÍAS
  enhancedModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },

  enhancedModalBackdrop: {
    flex: 1,
  },

  enhancedModalContainer: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    maxHeight: height * 0.9,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 20,
  },

  enhancedModalHeader: {
    paddingTop: 20,
    paddingBottom: 30,
    position: "relative",
    overflow: "hidden",
  },

  modalHeaderPattern: {
    position: "absolute",
    top: -20,
    right: -20,
    opacity: 0.1,
  },

  modalHeaderContent: {
    paddingHorizontal: 24,
    zIndex: 1,
  },

  modalHeaderTop: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginBottom: 20,
  },

  enhancedModalCloseButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
  },

  modalHeaderMain: {
    gap: 20,
  },

  modalHeaderInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },

  modalEmojiContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.3)",
  },

  modalEmoji: {
    fontSize: 28,
  },

  modalTitleContainer: {
    flex: 1,
  },

  modalMainTitle: {
    fontSize: 28,
    color: "#FFFFFF",
    fontWeight: "800",
    lineHeight: 32,
    textShadowColor: "rgba(0,0,0,0.3)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },

  modalSubtitle: {
    fontSize: 16,
    color: "rgba(255,255,255,0.9)",
    fontWeight: "500",
    marginTop: 4,
    textShadowColor: "rgba(0,0,0,0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },

  modalStatsGrid: {
    flexDirection: "row",
    gap: 12,
  },

  modalStatCard: {
    backgroundColor: "rgba(255,255,255,0.15)",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    minWidth: 80,
  },

  modalStatNumber: {
    fontSize: 18,
    color: "#FFFFFF",
    fontWeight: "800",
    lineHeight: 20,
  },

  modalStatLabel: {
    fontSize: 11,
    color: "rgba(255,255,255,0.8)",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginTop: 2,
  },

  modalControlsSection: {
    backgroundColor: COLORS.gray50,
    paddingVertical: 20,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },

  modalControlsHeader: {
    gap: 12,
  },

  modalControlsTitle: {
    fontSize: 16,
    color: COLORS.text,
    fontWeight: "600",
  },

  modalSortControls: {
    flexDirection: "row",
    gap: 8,
  },

  modalSortButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  modalSortButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },

  modalSortButtonText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: "500",
  },

  modalSortButtonTextActive: {
    color: "#FFFFFF",
    fontWeight: "600",
  },

  enhancedModalContent: {
    flex: 1,
  },

  enhancedOffersList: {
    padding: 20,
    gap: 16,
  },

  enhancedOfferCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },

  enhancedOfferTouchable: {
    padding: 20,
    position: "relative",
  },

  enhancedOfferHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },

  enhancedOfferBadges: {
    flexDirection: "row",
    gap: 6,
  },

  enhancedOfferTimeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: COLORS.gray100,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },

  enhancedOfferTimeText: {
    fontSize: 10,
    color: COLORS.textSecondary,
    fontWeight: "500",
  },

  enhancedOfferLocationBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "#E3F2FD",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },

  enhancedOfferLocationText: {
    fontSize: 10,
    color: COLORS.accent,
    fontWeight: "600",
  },

  enhancedOfferDistanceBadge: {
    backgroundColor: "#FFF3E0",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },

  enhancedOfferDistanceText: {
    fontSize: 10,
    color: "#F57C00",
    fontWeight: "600",
  },

  enhancedOfferStatusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },

  enhancedOfferMain: {
    gap: 12,
  },

  enhancedOfferTitle: {
    fontSize: 18,
    color: COLORS.text,
    fontWeight: "700",
    lineHeight: 24,
  },

  enhancedOfferPhase: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: "500",
    backgroundColor: COLORS.gray100,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: "flex-start",
  },

  enhancedOfferDetails: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },

  enhancedOfferDetailItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },

  enhancedOfferDetailText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: "500",
  },

  enhancedOfferBenefits: {
    flexDirection: "row",
    gap: 8,
  },

  enhancedOfferBenefit: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: COLORS.gray100,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },

  enhancedOfferBenefitText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: "500",
  },

  enhancedOfferFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray200,
    marginTop: 16,
  },

  enhancedOfferEmployer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },

  enhancedOfferEmployerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },

  enhancedOfferEmployerInitials: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },

  enhancedOfferEmployerInfo: {
    flex: 1,
  },

  enhancedOfferEmployerName: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: "600",
    lineHeight: 18,
  },

  enhancedOfferEmployerLocation: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: "500",
    marginTop: 1,
  },

  enhancedOfferSalaryContainer: {
    alignItems: "flex-end",
  },

  enhancedOfferSalaryAmount: {
    fontSize: 18,
    color: COLORS.success,
    fontWeight: "800",
    lineHeight: 20,
  },

  enhancedOfferSalaryPeriod: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: "500",
    marginTop: 1,
  },

  enhancedOfferApplications: {
    position: "absolute",
    top: 16,
    right: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "rgba(255,255,255,0.95)",
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  enhancedOfferApplicationsText: {
    fontSize: 9,
    color: COLORS.textSecondary,
    fontWeight: "500",
  },

  enhancedOfferCTA: {
    position: "absolute",
    top: 20,
    right: 20,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.gray100,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },

  enhancedModalEmpty: {
    padding: 60,
    alignItems: "center",
  },

  enhancedModalEmptyTitle: {
    fontSize: 20,
    color: COLORS.text,
    fontWeight: "700",
    marginTop: 20,
    marginBottom: 8,
    textAlign: "center",
  },

  enhancedModalEmptyText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 24,
  },

  // States
  loadingContainer: {
    paddingVertical: 40,
    alignItems: "center",
  },
  loadingText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
  },
  emptyState: {
    paddingVertical: 60,
    paddingHorizontal: 40,
    alignItems: "center",
  },
  emptyTitle: {
    ...TYPOGRAPHY.title3,
    color: COLORS.text,
    marginTop: 16,
    marginBottom: 8,
    textAlign: "center",
  },
  emptyDescription: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 22,
  },
  emptyAction: {
    backgroundColor: COLORS.accent,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 20,
  },
  emptyActionText: {
    ...TYPOGRAPHY.callout,
    color: COLORS.background,
    fontWeight: "600",
  },
});

export default PublicHome;