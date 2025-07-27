import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
  memo,
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
  ActivityIndicator,
  Alert,
  BackHandler,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useFocusEffect } from "@react-navigation/native";
import CustomHeaderNoAuth from "../../components/CustomHeaderNoAuth";
import { getAvailableJobOffersNoAuth } from "../../services/jobOffers";
import { getCropType } from "../../services/cropTypeService";
import { RootStackParamList } from "../../navigation/types";
import { MaterialIcons, Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

// Importar imágenes usando require() para mejor compatibilidad
const CROP_IMAGES = {
  sachaInchi: require("../../../assets/onboarding/slide3.png"),
  cacao: require("../../../assets/onboarding/slide1.png"), 
  miel: require("../../../assets/onboarding/slide2.png"),
  default: require("../../../assets/onboarding/slide1.png"),
};

// Constants
const { width, height } = Dimensions.get("window");
const CARD_WIDTH = width - 40;
const CARD_SPACING = 20;
const FEATURED_HEIGHT = 380;
const AUTO_SCROLL_INTERVAL = 5000;

// 🎨 PALETA DE COLORES MEJORADA
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

  primary: "#274F66",
  accent: "#3A7DC1",
  success: "#B5883E",
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

const CROP_CONFIG = {
  "Sacha Inchi": {
    color: "#274F66",
    emoji: "🌱",
    title: "Sacha Inchi",
    description: "Superalimento amazónico",
    gradient: ["#274F66", "#3A7DC1"],
  },
  "Cacao": {
    color: "#B5883E",
    emoji: "🍫",
    title: "Cacao",
    description: "Cultivo tradicional",
    gradient: ["#B5883E", "#D4A574"],
  },
  "Café": {
    color: "#3A7DC1",
    emoji: "☕",
    title: "Café",
    description: "Granos premium",
    gradient: ["#3A7DC1", "#5B9BD5"],
  },
  // ADD THIS DEFAULT PROPERTY
  default: {
    color: "#274F66",
    emoji: "🌾",
    title: "Cultivo",
    description: "Producto agrícola",
    gradient: ["#274F66", "#3A7DC1"],
  }
} as const;


// Distancias de ciudades desde Bogotá (en km)
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

// 📱 INTERFACES
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

interface LoadingState {
  offers: boolean;
  categories: boolean;
  modal: boolean;
}

interface ErrorState {
  offers: string | null;
  categories: string | null;
  general: string | null;
}

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


const getCropConfig = (cropName: string) => {
  if (!cropName) return CROP_CONFIG.default;
  
  const cropLower = cropName.toLowerCase().trim();
  
  // Buscar coincidencia exacta primero
  const exactMatch = Object.entries(CROP_CONFIG).find(([key]) => 
    key !== 'default' && cropLower === key.toLowerCase()
  );
  
  if (exactMatch) return exactMatch[1];
  
  // Si no hay coincidencia exacta, buscar parcial
  for (const [key, config] of Object.entries(CROP_CONFIG)) {
    if (key !== 'default' && cropLower.includes(key.toLowerCase())) {
      return config;
    }
  }
  
  // Always return the default config as fallback
  return CROP_CONFIG.default;
};

// 🔧 IMPROVED getCropImage function with better error handling
const getCropImage = (cropName: string): any => {
  if (!cropName) return CROP_IMAGES.default;
  
  try {
    const cropNameLower = cropName.toLowerCase();

    if (cropNameLower.includes("sacha") || cropNameLower.includes("inchi")) {
      return CROP_IMAGES.sachaInchi;
    }
    if (cropNameLower.includes("cacao")) {
      return CROP_IMAGES.cacao;
    }
    if (cropNameLower.includes("miel") || cropNameLower.includes("honey")) {
      return CROP_IMAGES.miel;
    }
    if (cropNameLower.includes("café") || cropNameLower.includes("coffee")) {
      return CROP_IMAGES.cafe; // Now this property exists
    }

    return CROP_IMAGES.default;
  } catch (error) {
    console.warn("Error loading crop image:", error);
    return CROP_IMAGES.default;
  }
};

const formatTimeAgo = (dateString: string) => {
  if (!dateString) return "Fecha no disponible";

  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return "Hace unos segundos";
  if (diffInSeconds < 3600) return `Hace ${Math.floor(diffInSeconds / 60)} min`;
  if (diffInSeconds < 86400) return `Hace ${Math.floor(diffInSeconds / 3600)} h`;
  if (diffInSeconds < 2592000) return `Hace ${Math.floor(diffInSeconds / 86400)} días`;

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

// 🔄 ERROR HANDLING UTILITIES
const handleAsyncError = (error: any, context: string) => {
  console.error(`Error in ${context}:`, error);
  const message =
    error?.response?.data?.message || error?.message || `Error en ${context}`;
  return message;
};

// 🎭 COMPONENTE DE IMAGEN OPTIMIZADA
const OptimizedImage = memo(({ source, style, accessible = false }: { 
  source: any; 
  style: any; 
  accessible?: boolean;
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  return (
    <View style={style}>
      <Image
        source={source}
        style={[style, { opacity: imageLoaded && !imageError ? 1 : 0 }]}
        accessible={accessible}
        resizeMode="cover"
        onLoad={() => setImageLoaded(true)}
        onError={() => {
          console.warn("Error loading image:", source);
          setImageError(true);
          setImageLoaded(true);
        }}
        // Optimizaciones de rendimiento
        fadeDuration={300}
        loadingIndicatorSource={undefined}
      />
      
      {/* Placeholder mientras carga */}
      {(!imageLoaded || imageError) && (
        <View style={[
          style, 
          {
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: COLORS.gray200,
            justifyContent: 'center',
            alignItems: 'center'
          }
        ]}>
          {!imageError ? (
            <ActivityIndicator size="small" color={COLORS.primary} />
          ) : (
            <Ionicons name="image-outline" size={32} color={COLORS.gray400} />
          )}
        </View>
      )}
    </View>
  );
});

// 🎭 COMPONENTES AUXILIARES MEMOIZADOS
const LoadingSpinner = memo(() => (
  <View
    style={styles.loadingContainer}
    accessible={true}
    accessibilityLabel="Cargando contenido">
    <ActivityIndicator size="large" color={COLORS.primary} />
    <Text style={styles.loadingText}>Cargando ofertas...</Text>
  </View>
));

const EmptyState = memo(
  ({
    title,
    description,
    actionText,
    onAction,
  }: {
    title: string;
    description: string;
    actionText?: string;
    onAction?: () => void;
  }) => (
    <View style={styles.emptyState} accessible={true}>
      <Ionicons name="search-outline" size={48} color={COLORS.textTertiary} />
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyDescription}>{description}</Text>
      {actionText && onAction && (
        <TouchableOpacity
          style={styles.emptyAction}
          onPress={onAction}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel={actionText}>
          <Text style={styles.emptyActionText}>{actionText}</Text>
        </TouchableOpacity>
      )}
    </View>
  )
);

const ErrorBoundary = memo(
  ({ error, onRetry }: { error: string; onRetry: () => void }) => (
    <View style={styles.errorContainer} accessible={true}>
      <Ionicons name="alert-circle-outline" size={48} color={COLORS.error} />
      <Text style={styles.errorTitle}>Oops, algo salió mal</Text>
      <Text style={styles.errorText}>{error}</Text>
      <TouchableOpacity
        style={styles.retryButton}
        onPress={onRetry}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel="Reintentar carga">
        <Text style={styles.retryButtonText}>Reintentar</Text>
      </TouchableOpacity>
    </View>
  )
);

// 🏠 COMPONENTE PRINCIPAL
const PublicHome: React.FC<PublicHomeProps> = ({ navigation }) => {
  // 📊 ESTADO CONSOLIDADO
  const [jobOffers, setJobOffers] = useState<JobOfferData[]>([]);
  const [filteredOffers, setFilteredOffers] = useState<JobOfferData[]>([]);
  const [categories, setCategories] = useState<JobCategory[]>([]);
  const [loading, setLoading] = useState<LoadingState>({
    offers: true,
    categories: true,
    modal: false,
  });
  const [errors, setErrors] = useState<ErrorState>({
    offers: null,
    categories: null,
    general: null,
  });
  const [activeTab, setActiveTab] = useState<"available" | "nearby">(
    "available"
  );
  const [selectedCountry, setSelectedCountry] = useState<string>("");
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // MODAL STATES
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<JobCategory | null>(
    null
  );
  const [categoryOffers, setCategoryOffers] = useState<JobOfferData[]>([]);
  const [modalSortBy, setModalSortBy] = useState<
    "recent" | "salary" | "distance"
  >("recent");

  // 🎭 ANIMACIONES
  const scrollX = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const modalSlideAnim = useRef(new Animated.Value(height)).current;
  const [currentSlide, setCurrentSlide] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const autoScrollRef = useRef<NodeJS.Timeout>();

  // 🔄 CLEANUP
  useEffect(() => {
    return () => {
      if (autoScrollRef.current) {
        clearInterval(autoScrollRef.current);
      }
    };
  }, []);

  // 📱 BACK HANDLER
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        if (showCategoryModal) {
          closeCategoryModal();
          return true;
        }
        if (showFilters) {
          setShowFilters(false);
          return true;
        }
        return false;
      };

      const subscription = BackHandler.addEventListener(
        "hardwareBackPress",
        onBackPress
      );
      return () => subscription.remove();
    }, [showCategoryModal, showFilters])
  );

  // 🎯 MEMOIZED VALUES
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

  const displayOffers = useMemo(
    () => (activeTab === "nearby" ? nearbyOffers : filteredOffers),
    [activeTab, nearbyOffers, filteredOffers]
  );

  // 📊 ESTADÍSTICAS DE CATEGORÍAS
  const calculateCategoryStats = useCallback(
    (categoryName: string, offers: JobOfferData[]) => {
      const categoryOffers = offers.filter(
        (offer) =>
          offer.cropType?.name.toLowerCase() === categoryName.toLowerCase()
      );

      if (categoryOffers.length === 0) {
        return {
          averageSalary: 0,
          cities: [],
          totalWorkers: 0,
          recentOffers: 0,
        };
      }

      const validSalaries = categoryOffers.filter((offer) => offer.salary > 0);
      const averageSalary =
        validSalaries.length > 0
          ? validSalaries.reduce((sum, offer) => sum + offer.salary, 0) /
            validSalaries.length
          : 0;

      const cities = [
        ...new Set(
          categoryOffers
            .map((offer) => offer.displayLocation?.city)
            .filter(Boolean)
        ),
      ];

      const totalWorkers = categoryOffers.reduce(
        (sum, offer) => sum + (offer.workersNeeded || 1),
        0
      );

      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      const recentOffers = categoryOffers.filter((offer) => {
        const offerDate = new Date(offer.createdAt || offer.startDate);
        return offerDate >= oneWeekAgo;
      }).length;

      return {
        averageSalary,
        cities: cities.slice(0, 3),
        totalWorkers,
        recentOffers,
      };
    },
    []
  );

  // 🎭 ANIMACIONES Y HANDLERS
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

  const onSlideChange = useCallback(
    (event: any) => {
      if (!featuredOffers || featuredOffers.length === 0) return;

      const slide = Math.ceil(
        event.nativeEvent.contentOffset.x / (CARD_WIDTH + CARD_SPACING)
      );
      if (
        slide !== currentSlide &&
        slide >= 0 &&
        slide < featuredOffers.length
      ) {
        setCurrentSlide(slide);
      }
    },
    [currentSlide, featuredOffers]
  );

  const handleCategoryPress = useCallback(
    (category: JobCategory) => {
      const hasOffers = parseInt(category.count) > 0;
      if (!hasOffers) return;

      const categoryJobOffers = jobOffers.filter(
        (offer) =>
          offer.cropType?.name.toLowerCase() === category.name.toLowerCase()
      );

      setSelectedCategory(category);
      setCategoryOffers(categoryJobOffers);
      setModalSortBy("recent");
      setShowCategoryModal(true);

      Animated.spring(modalSlideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }).start();
    },
    [jobOffers, modalSlideAnim]
  );

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

  // 📡 DATA LOADING MEJORADO
  const loadJobOffers = useCallback(async (): Promise<JobOfferData[]> => {
    try {
      setErrors((prev) => ({ ...prev, offers: null }));
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
      const errorMessage = handleAsyncError(error, "carga de ofertas");
      setErrors((prev) => ({ ...prev, offers: errorMessage }));
      setJobOffers([]);
      return [];
    }
  }, []);

  const loadCropTypes = useCallback(
    async (offers: JobOfferData[]) => {
      try {
        setErrors((prev) => ({ ...prev, categories: null }));
        const cropTypesResponse = await getCropType();
        let cropTypes: CropType[] = [];

        if (Array.isArray(cropTypesResponse)) {
          cropTypes = cropTypesResponse;
        } else if (cropTypesResponse && cropTypesResponse.cropTypes) {
          cropTypes = cropTypesResponse.cropTypes;
        } else if (cropTypesResponse && cropTypesResponse.data) {
          cropTypes = cropTypesResponse.data;
        }

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
        const errorMessage = handleAsyncError(error, "carga de categorías");
        setErrors((prev) => ({ ...prev, categories: errorMessage }));
        setCategories([]);
      }
    },
    [calculateCategoryStats]
  );

  const filterOffers = useCallback(() => {
    let filtered = [...jobOffers];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (offer) =>
          offer.title.toLowerCase().includes(query) ||
          offer.cropType?.name.toLowerCase().includes(query) ||
          offer.displayLocation?.city.toLowerCase().includes(query)
      );
    }

    setFilteredOffers(filtered);
  }, [jobOffers, searchQuery]);

  const loadInitialData = useCallback(async () => {
    try {
      setLoading({ offers: true, categories: true, modal: false });
      setErrors({ offers: null, categories: null, general: null });

      const offers = await loadJobOffers();
      await loadCropTypes(offers);
    } catch (error) {
      const errorMessage = handleAsyncError(error, "carga inicial");
      setErrors((prev) => ({ ...prev, general: errorMessage }));
    } finally {
      setLoading({ offers: false, categories: false, modal: false });
    }
  }, [loadJobOffers, loadCropTypes]);

  const retryLoad = useCallback(() => {
    loadInitialData();
  }, [loadInitialData]);

  // 🔄 EFFECTS
  useEffect(() => {
    loadInitialData();
    animateEntry();
  }, []);

  useEffect(() => {
    filterOffers();
  }, [filterOffers]);

  // Auto-scroll effect mejorado
  useEffect(() => {
    if (featuredOffers && featuredOffers.length > 1) {
      autoScrollRef.current = setInterval(() => {
        const nextIndex = (currentSlide + 1) % featuredOffers.length;
        flatListRef.current?.scrollToOffset({
          offset: nextIndex * (CARD_WIDTH + CARD_SPACING),
          animated: true,
        });
      }, AUTO_SCROLL_INTERVAL);

      return () => {
        if (autoScrollRef.current) {
          clearInterval(autoScrollRef.current);
        }
      };
    }
  }, [currentSlide, featuredOffers]);

  useEffect(() => {
    if (!showCategoryModal) {
      modalSlideAnim.setValue(height);
    }
  }, [showCategoryModal, modalSlideAnim]);

  // 🎨 RENDER FUNCTIONS
  const renderPaginationDots = useCallback(
    () => (
      <View style={styles.paginationContainer}>
        {featuredOffers &&
          featuredOffers.map((_, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.paginationDot,
                index === currentSlide && styles.paginationDotActive,
              ]}
              onPress={() => {
                flatListRef.current?.scrollToOffset({
                  offset: index * (CARD_WIDTH + CARD_SPACING),
                  animated: true,
                });
                setCurrentSlide(index);
              }}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel={`Ir a la oferta ${index + 1} de ${
                featuredOffers.length
              }`}
            />
          ))}
      </View>
    ),
    [featuredOffers, currentSlide]
  );

  const renderFloatingNavigation = useCallback(
    () => (
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
            }}
            accessible={true}
            accessibilityRole="tab"
            accessibilityState={{ selected: activeTab === "available" }}>
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
            onPress={() => setActiveTab("nearby")}
            accessible={true}
            accessibilityRole="tab"
            accessibilityState={{ selected: activeTab === "nearby" }}>
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
    ),
    [activeTab]
  );

  // 🎨 NUEVO COMPONENTE DE CATEGORÍAS COMPACTAS
  const renderCompactCategories = useCallback(() => {
    const visibleCategories = categories.filter(cat => parseInt(cat.count) > 0);
    
    return (
      <View style={styles.compactCategoriesSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Explora por categoría</Text>
          <Text style={styles.sectionSubtitle}>
            Encuentra oportunidades en tu área de interés
          </Text>
        </View>

        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.compactCategoriesScrollContainer}
          style={styles.compactCategoriesScroll}>
          {visibleCategories.map((category) => (
            <TouchableOpacity
              key={category.id}
              style={styles.compactCategoryChip}
              onPress={() => handleCategoryPress(category)}
              activeOpacity={0.8}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel={`Categoría ${category.config.title} con ${category.count} ofertas`}>
              
              <LinearGradient
                colors={category.config.gradient}
                style={styles.compactCategoryGradient}
                start={{x: 0, y: 0}}
                end={{x: 1, y: 1}}>
                
                <View style={styles.compactCategoryContent}>
                  <View style={styles.compactCategoryIconContainer}>
                    <Text style={styles.compactCategoryEmoji}>
                      {category.config.emoji}
                    </Text>
                  </View>
                  
                  <View style={styles.compactCategoryTextContainer}>
                    <Text style={styles.compactCategoryTitle}>
                      {category.config.title}
                    </Text>
                    <Text style={styles.compactCategoryCount}>
                      {category.count} ofertas
                    </Text>
                  </View>
                  
                  <View style={styles.compactCategoryArrow}>
                    <Ionicons 
                      name="chevron-forward" 
                      size={16} 
                      color="rgba(255,255,255,0.8)" 
                    />
                  </View>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  }, [categories, handleCategoryPress]);

  // 🎨 NUEVO COMPONENTE DE CARDS MEJORADOS
  const renderVisualJobCard = useCallback(
    (item: JobOfferData, index: number) => {
      const cropConfig = getCropConfig(item.cropType?.name || "");
      const distance = getDistance(item.displayLocation?.city || "");
      const isNearbyTab = activeTab === "nearby";
      const employerName = getEmployerName(item.employer);
      const initials = getInitials(employerName);

      return (
        <TouchableOpacity
          key={item.id}
          style={styles.visualJobCard}
          onPress={() =>
            navigation.navigate("WorkerJobOfferDetailNoAuth", {
              jobId: item.id,
              fromPublic: true,
            })
          }
          activeOpacity={0.95}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel={`Ver detalles de la oferta: ${item.title}`}>
          
          <View style={styles.visualCardContainer}>
            {/* Imagen de fondo optimizada con overlay */}
            <OptimizedImage
              source={getCropImage(item.cropType?.name || "")}
              style={styles.visualCardImage}
              accessible={false}
            />

            <LinearGradient
              colors={[
                "transparent",
                "transparent", 
                "rgba(0,0,0,0.3)",
                "rgba(0,0,0,0.7)",
                "rgba(0,0,0,0.9)"
              ]}
              locations={[0, 0.2, 0.5, 0.8, 1]}
              style={styles.visualCardOverlay}
            />

            {/* Contenido superpuesto */}
            <View style={styles.visualCardContent}>
              {/* Header con badges */}
              <View style={styles.visualCardHeader}>
                <View style={styles.visualCardBadges}>
                  <View style={[styles.visualCropBadge, { backgroundColor: cropConfig.color }]}>
                    <Text style={styles.visualCropBadgeText}>
                      {cropConfig.emoji} {item.cropType?.name}
                    </Text>
                  </View>
                  
                  {isNearbyTab && distance < 500 && (
                    <View style={styles.visualDistanceBadge}>
                      <Ionicons name="location" size={12} color="#FFFFFF" />
                      <Text style={styles.visualDistanceBadgeText}>
                        {distance}km
                      </Text>
                    </View>
                  )}
                </View>

                <TouchableOpacity style={styles.visualFavoriteButton}>
                  <Ionicons name="heart-outline" size={20} color="rgba(255,255,255,0.8)" />
                </TouchableOpacity>
              </View>

              {/* Espaciador */}
              <View style={styles.visualCardSpacer} />

              {/* Contenido principal */}
              <View style={styles.visualCardMainContent}>
                <View style={styles.visualLocationContainer}>
                  <Ionicons name="location" size={14} color="rgba(255,255,255,0.8)" />
                  <Text style={styles.visualLocationText} numberOfLines={1}>
                    {item.displayLocation?.city}, {item.displayLocation?.state}
                  </Text>
                  <Text style={styles.visualCountryFlag}>
                    {item.displayLocation?.country === "Colombia" ? "🇨🇴" : "🇻🇪"}
                  </Text>
                </View>

                <Text style={styles.visualJobTitle} numberOfLines={2}>
                  {item.title}
                </Text>

                <View style={styles.visualJobDetails}>
                  <View style={styles.visualDetailItem}>
                    <Ionicons name="business-outline" size={14} color="rgba(255,255,255,0.8)" />
                    <Text style={styles.visualDetailText} numberOfLines={1}>
                      {item.farm?.name || "Finca"}
                    </Text>
                  </View>
                  
                  <View style={styles.visualDetailItem}>
                    <Ionicons name="time-outline" size={14} color="rgba(255,255,255,0.8)" />
                    <Text style={styles.visualDetailText}>
                      {item.duration} días
                    </Text>
                  </View>
                </View>

                {/* Footer con empleador y salario */}
                <View style={styles.visualCardFooter}>
                  <View style={styles.visualEmployerSection}>
                    <View style={[styles.visualEmployerAvatar, { backgroundColor: cropConfig.color }]}>
                      <Text style={styles.visualEmployerInitials}>{initials}</Text>
                    </View>
                    <View style={styles.visualEmployerInfo}>
                      <Text style={styles.visualEmployerName} numberOfLines={1}>
                        {employerName}
                      </Text>
                      <View style={styles.visualBenefitsRow}>
                        {item.includesFood && (
                          <View style={styles.visualBenefitIcon}>
                            <Ionicons name="restaurant" size={12} color="rgba(255,255,255,0.8)" />
                          </View>
                        )}
                        {item.includesLodging && (
                          <View style={styles.visualBenefitIcon}>
                            <Ionicons name="home" size={12} color="rgba(255,255,255,0.8)" />
                          </View>
                        )}
                      </View>
                    </View>
                  </View>

                  <View style={styles.visualSalarySection}>
                    <Text style={styles.visualSalaryAmount}>
                      {formatSalaryCompact(item.salary)}
                    </Text>
                    <Text style={styles.visualSalaryPeriod}>
                      {item.paymentType === "Por_dia" ? "por día" : "por trabajo"}
                    </Text>
                  </View>
                </View>

                {/* Botón de acción */}
                <TouchableOpacity style={styles.visualActionButton}>
                  <Text style={styles.visualActionButtonText}>Ver detalles</Text>
                  <Ionicons name="arrow-forward" size={16} color="#000000" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Badge de rating/tiempo */}
            <View style={styles.visualRatingBadge}>
              <Ionicons name="star" size={12} color="#FFD700" />
              <Text style={styles.visualRatingText}>5.0</Text>
            </View>

            {/* Badge de aplicantes si hay */}
            {item.applicationsCount > 0 && (
              <View style={styles.visualApplicationsBadge}>
                <Text style={styles.visualApplicationsText}>
                  {item.applicationsCount} aplicantes
                </Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      );
    },
    [activeTab, navigation]
  );

  const renderFeaturedOffer = useCallback(
    ({ item }: { item: JobOfferData }) => {
      const cropConfig = getCropConfig(item.cropType?.name || "");
      const employerName = getEmployerName(item.employer);
      const initials = getInitials(employerName);

      return (
        <View style={styles.featuredCard}>
          <TouchableOpacity
            onPress={() =>
              navigation.navigate("WorkerJobOfferDetailNoAuth", {
                jobId: item.id,
                fromPublic: true,
              })
            }
            activeOpacity={0.9}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={`Oferta destacada: ${item.title}`}>
            <View style={styles.featuredContainer}>
              <OptimizedImage
                source={getCropImage(item.cropType?.name || "")}
                style={styles.featuredImage}
                accessible={false}
              />

              <LinearGradient
                colors={[
                  "transparent",
                  "transparent",
                  "rgba(0,0,0,0.4)",
                  "rgba(0,0,0,0.8)",
                  "rgba(0,0,0,0.95)",
                ]}
                locations={[0, 0.3, 0.6, 0.8, 1]}
                style={styles.featuredOverlay}
              />

              <View style={styles.featuredContent}>
                <View style={styles.featuredHeader}>
                  <View style={styles.featuredBadges}>
                    <View style={styles.featuredStatusBadge}>
                      <Text style={styles.featuredStatusText}>
                        ✨ Destacado
                      </Text>
                    </View>
                    <View style={styles.featuredTimeBadge}>
                      <Text style={styles.featuredTimeText}>
                        {formatTimeAgo(item.createdAt || item.startDate)}
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={styles.featuredSpacer} />

                <View style={styles.featuredBottomContent}>
                  <View style={styles.featuredQuickInfoTop}>
                    <View style={styles.featuredInfoBadge}>
                      <Text style={styles.featuredCropType}>
                        {item.cropType?.name}
                      </Text>
                      <Text style={styles.featuredSeparator}>•</Text>
                      <Text style={styles.featuredLocation}>
                        {item.displayLocation?.city}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.featuredTitleSection}>
                    <Text style={styles.featuredTitle}>{item.title}</Text>
                  </View>

                  <View style={styles.featuredDetailsGrid}>
                    <View style={styles.featuredDetailItem}>
                      <Ionicons
                        name="business-outline"
                        size={14}
                        color="rgba(255,255,255,0.8)"
                      />
                      <Text style={styles.featuredDetailText}>
                        {item.farm?.name || "Finca"}
                      </Text>
                    </View>
                    <View style={styles.featuredDetailItem}>
                      <Ionicons
                        name="time-outline"
                        size={14}
                        color="rgba(255,255,255,0.8)"
                      />
                      <Text style={styles.featuredDetailText}>
                        {item.duration} días
                      </Text>
                    </View>
                  </View>

                  <View style={styles.featuredFooter}>
                    <View style={styles.featuredEmployerSection}>
                      <View
                        style={[
                          styles.featuredEmployerAvatar,
                          { backgroundColor: cropConfig.color },
                        ]}>
                        <Text style={styles.featuredEmployerInitials}>
                          {initials}
                        </Text>
                      </View>
                      <View style={styles.featuredEmployerInfo}>
                        <Text style={styles.featuredEmployerName}>
                          {employerName}
                        </Text>
                        <Text style={styles.featuredSalary}>
                          {formatSalaryCompact(item.salary)}{" "}
                          {item.paymentType === "Por_dia" ? "/día" : "/trabajo"}
                        </Text>
                      </View>
                    </View>

                    <TouchableOpacity
                      style={styles.featuredActionButton}
                      accessible={true}
                      accessibilityRole="button"
                      accessibilityLabel="Ver oferta destacada">
                      <Text style={styles.featuredActionText}>Ver oferta</Text>
                      <Ionicons
                        name="arrow-forward"
                        size={16}
                        color="#000000"
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>
          </TouchableOpacity>
        </View>
      );
    },
    [navigation]
  );

  // 🎭 RENDER PRINCIPAL
  if (errors.general) {
    return (
      <SafeAreaView style={styles.container}>
        <CustomHeaderNoAuth navigation={navigation} />
        <ErrorBoundary error={errors.general} onRetry={retryLoad} />
      </SafeAreaView>
    );
  }

  if (loading.offers && loading.categories) {
    return (
      <SafeAreaView style={styles.container}>
        <CustomHeaderNoAuth navigation={navigation} />
        <LoadingSpinner />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      <CustomHeaderNoAuth navigation={navigation} />

      <Animated.View
        style={[
          styles.content,
          { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
        ]}>
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          accessible={true}>
          {renderFloatingNavigation()}

          {/* Featured Offers Section */}
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
                snapToInterval={CARD_WIDTH + CARD_SPACING}
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
                accessible={true}
                accessibilityLabel="Lista de ofertas destacadas"
              />
              {featuredOffers.length > 1 && renderPaginationDots()}
            </View>
          )}

          {/* Compact Categories Section */}
          {activeTab === "available" && (
            <>
              {errors.categories ? (
                <ErrorBoundary
                  error={errors.categories}
                  onRetry={() => loadCropTypes(jobOffers)}
                />
              ) : loading.categories ? (
                <LoadingSpinner />
              ) : categories.length > 0 ? (
                renderCompactCategories()
              ) : (
                <EmptyState
                  title="Sin categorías"
                  description="No hay categorías disponibles en este momento"
                />
              )}
            </>
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

            {errors.offers ? (
              <ErrorBoundary error={errors.offers} onRetry={loadJobOffers} />
            ) : activeTab === "nearby" && !selectedCountry ? (
              <EmptyState
                title="Selecciona un país"
                description="Elige Colombia o Venezuela para descubrir ofertas cercanas"
                actionText="Seleccionar país"
                onAction={() => setShowFilters(true)}
              />
            ) : displayOffers.length > 0 ? (
              <View style={styles.visualJobsList}>
                {displayOffers.map((offer, index) =>
                  renderVisualJobCard(offer, index)
                )}
              </View>
            ) : (
              <EmptyState
                title={
                  activeTab === "nearby"
                    ? `No hay ofertas cercanas en ${selectedCountry}`
                    : "No se encontraron ofertas"
                }
                description={
                  activeTab === "nearby"
                    ? "Intenta seleccionar otro país o explora las ofertas disponibles"
                    : "Intenta ajustar tu búsqueda o explora otras categorías"
                }
              />
            )}
          </View>
        </ScrollView>
      </Animated.View>

      {/* Filter Modal */}
      <Modal
        visible={showFilters}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowFilters(false)}
        accessible={true}>
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            onPress={() => setShowFilters(false)}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Cerrar modal"
          />
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Seleccionar país</Text>
              <TouchableOpacity
                onPress={() => setShowFilters(false)}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="Cerrar">
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
                    setSelectedCountry(
                      country === selectedCountry ? "" : country
                    )
                  }
                  accessible={true}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: selectedCountry === country }}>
                  <Text
                    style={[
                      styles.countryOptionText,
                      selectedCountry === country &&
                        styles.countryOptionTextSelected,
                    ]}>
                    {country}
                  </Text>
                  {selectedCountry === country && (
                    <Ionicons
                      name="checkmark"
                      size={20}
                      color={COLORS.accent}
                    />
                  )}
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalButtonSecondary}
                onPress={() => setSelectedCountry("")}
                accessible={true}
                accessibilityRole="button">
                <Text style={styles.modalButtonSecondaryText}>Limpiar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalButtonPrimary}
                onPress={() => setShowFilters(false)}
                accessible={true}
                accessibilityRole="button">
                <Text style={styles.modalButtonPrimaryText}>Aplicar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Category Modal - Simplified for this example */}
      {showCategoryModal && selectedCategory && (
        <Modal
          visible={showCategoryModal}
          transparent={true}
          animationType="none"
          onRequestClose={closeCategoryModal}
          accessible={true}>
          <View style={styles.enhancedModalOverlay}>
            <TouchableOpacity
              style={styles.enhancedModalBackdrop}
              activeOpacity={1}
              onPress={closeCategoryModal}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Cerrar modal de categoría"
            />

            <Animated.View
              style={[
                styles.enhancedModalContainer,
                { transform: [{ translateY: modalSlideAnim }] },
              ]}>
              <LinearGradient
                colors={
                  selectedCategory.config.gradient || [
                    COLORS.primary,
                    COLORS.accent,
                  ]
                }
                style={styles.enhancedModalHeader}>
                <View style={styles.modalHeaderContent}>
                  <View style={styles.modalHeaderTop}>
                    <TouchableOpacity
                      style={styles.enhancedModalCloseButton}
                      onPress={closeCategoryModal}
                      accessible={true}
                      accessibilityRole="button"
                      accessibilityLabel="Cerrar">
                      <Ionicons name="close" size={24} color="#FFFFFF" />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.modalHeaderMain}>
                    <View style={styles.modalHeaderInfo}>
                      <View style={styles.modalEmojiContainer}>
                        <Text style={styles.modalEmoji}>
                          {selectedCategory.config.emoji}
                        </Text>
                      </View>

                      <View style={styles.modalTitleContainer}>
                        <Text style={styles.modalMainTitle}>
                          {selectedCategory.config.title}
                        </Text>
                        <Text style={styles.modalSubtitle}>
                          {selectedCategory.config.description}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.modalStatsGrid}>
                      <View style={styles.modalStatCard}>
                        <Text style={styles.modalStatNumber}>
                          {categoryOffers.length}
                        </Text>
                        <Text style={styles.modalStatLabel}>Ofertas</Text>
                      </View>

                      {selectedCategory.stats?.averageSalary > 0 && (
                        <View style={styles.modalStatCard}>
                          <Text style={styles.modalStatNumber}>
                            {formatSalaryCompact(
                              selectedCategory.stats.averageSalary
                            )}
                          </Text>
                          <Text style={styles.modalStatLabel}>Promedio</Text>
                        </View>
                      )}
                    </View>
                  </View>
                </View>
              </LinearGradient>

              <ScrollView
                style={styles.enhancedModalContent}
                showsVerticalScrollIndicator={false}>
                {sortedCategoryOffers.length > 0 ? (
                  <View style={styles.enhancedOffersList}>
                    {sortedCategoryOffers.slice(0, 10).map((offer) => (
                      <TouchableOpacity
                        key={offer.id}
                        style={styles.modalOfferCard}
                        onPress={() => {
                          closeCategoryModal();
                          navigation.navigate("WorkerJobOfferDetailNoAuth", {
                            jobId: offer.id,
                            fromPublic: true,
                          });
                        }}
                        accessible={true}
                        accessibilityRole="button"
                        accessibilityLabel={`Ver oferta: ${offer.title}`}>
                        <Text style={styles.modalOfferTitle}>
                          {offer.title}
                        </Text>
                        <Text style={styles.modalOfferSalary}>
                          {formatSalaryCompact(offer.salary)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                ) : (
                  <EmptyState
                    title="Sin ofertas"
                    description="Esta categoría no tiene ofertas disponibles"
                  />
                )}
              </ScrollView>
            </Animated.View>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
};

// 🎨 STYLESHEET OPTIMIZADO
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },

  // Loading y Error States
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  loadingText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  errorTitle: {
    ...TYPOGRAPHY.title3,
    color: COLORS.error,
    marginTop: 16,
    marginBottom: 8,
    textAlign: "center",
  },
  errorText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: COLORS.error,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryButtonText: {
    ...TYPOGRAPHY.callout,
    color: COLORS.background,
    fontWeight: "600",
  },

  // Empty States
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

  // Navigation
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

  // Hero Section
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
    paddingRight: 40,
  },

  // Pagination
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
    width: 24,
  },

  // Featured Cards
  featuredCard: {
    width: CARD_WIDTH,
    height: FEATURED_HEIGHT,
    borderRadius: 24,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
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
    backgroundColor: COLORS.gray200,
  },
  featuredOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
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

  // 🎨 NUEVOS ESTILOS PARA CATEGORÍAS COMPACTAS
  compactCategoriesSection: {
    marginTop: 30,
    marginBottom: 20,
  },
  compactCategoriesScroll: {
    marginTop: 16,
  },
  compactCategoriesScrollContainer: {
    paddingHorizontal: 20,
    paddingRight: 40,
  },
  compactCategoryChip: {
    width: 160,
    height: 80,
    borderRadius: 16,
    marginRight: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  compactCategoryGradient: {
    flex: 1,
    padding: 16,
    justifyContent: "center",
  },
  compactCategoryContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  compactCategoryIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
  },
  compactCategoryEmoji: {
    fontSize: 16,
  },
  compactCategoryTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  compactCategoryTitle: {
    fontSize: 14,
    color: "#FFFFFF",
    fontWeight: "700",
    marginBottom: 2,
  },
  compactCategoryCount: {
    fontSize: 11,
    color: "rgba(255,255,255,0.8)",
    fontWeight: "500",
  },
  compactCategoryArrow: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },

  // 🎨 NUEVOS ESTILOS PARA CARDS VISUALES
  visualJobsList: {
    paddingHorizontal: 20,
    gap: 16,
  },
  visualJobCard: {
    marginBottom: 16,
  },
  visualCardContainer: {
    height: 320,
    borderRadius: 24,
    overflow: "hidden",
    position: "relative",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  visualCardImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
    // Optimizaciones para mejorar rendimiento
    backgroundColor: COLORS.gray200,
  },
  visualCardOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  visualCardContent: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    padding: 20,
    justifyContent: "space-between",
  },
  visualCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  visualCardBadges: {
    flexDirection: "row",
    gap: 8,
    flex: 1,
  },
  visualCropBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  visualCropBadgeText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  visualDistanceBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  visualDistanceBadgeText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "600",
  },
  visualFavoriteButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.4)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  visualCardSpacer: {
    flex: 1,
  },
  visualCardMainContent: {
    gap: 16,
  },
  visualLocationContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(0,0,0,0.4)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: "flex-start",
  },
  visualLocationText: {
    fontSize: 13,
    color: "rgba(255,255,255,0.9)",
    fontWeight: "500",
    flex: 1,
  },
  visualCountryFlag: {
    fontSize: 14,
  },
  visualJobTitle: {
    fontSize: 22,
    color: "#FFFFFF",
    fontWeight: "800",
    lineHeight: 28,
    textShadowColor: "rgba(0,0,0,0.7)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  visualJobDetails: {
    flexDirection: "row",
    gap: 12,
  },
  visualDetailItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(0,0,0,0.3)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  visualDetailText: {
    fontSize: 12,
    color: "rgba(255,255,255,0.9)",
    fontWeight: "500",
  },
  visualCardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.1)",
  },
  visualEmployerSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  visualEmployerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  visualEmployerInitials: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  visualEmployerInfo: {
    flex: 1,
  },
  visualEmployerName: {
    fontSize: 14,
    color: "#FFFFFF",
    fontWeight: "600",
    marginBottom: 4,
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  visualBenefitsRow: {
    flexDirection: "row",
    gap: 6,
  },
  visualBenefitIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  visualSalarySection: {
    alignItems: "flex-end",
  },
  visualSalaryAmount: {
    fontSize: 16,
    color: "#FFFFFF",
    fontWeight: "700",
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  visualSalaryPeriod: {
    fontSize: 11,
    color: "rgba(255,255,255,0.8)",
    fontWeight: "500",
  },
  visualActionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#FFFFFF",
    paddingVertical: 12,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  visualActionButtonText: {
    fontSize: 14,
    color: "#000000",
    fontWeight: "700",
  },
  visualRatingBadge: {
    position: "absolute",
    top: 16,
    right: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(0,0,0,0.7)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  visualRatingText: {
    fontSize: 11,
    color: "#FFFFFF",
    fontWeight: "600",
  },
  visualApplicationsBadge: {
    position: "absolute",
    bottom: 16,
    left: 20,
    backgroundColor: "rgba(255,255,255,0.9)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  visualApplicationsText: {
    fontSize: 10,
    color: "#000000",
    fontWeight: "600",
  },

  // Sections
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

  // Modals
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

  // Enhanced Category Modal
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
  },
  modalStatsGrid: {
    flexDirection: "row",
    gap: 20,
  },
  modalStatCard: {
    alignItems: "center",
  },
  modalStatNumber: {
    fontSize: 20,
    color: "#FFFFFF",
    fontWeight: "800",
    textShadowColor: "rgba(0,0,0,0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  modalStatLabel: {
    fontSize: 12,
    color: "rgba(255,255,255,0.8)",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  enhancedModalContent: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  enhancedOffersList: {
    padding: 20,
    gap: 12,
  },
  modalOfferCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: COLORS.gray50,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  modalOfferTitle: {
    fontSize: 16,
    color: COLORS.text,
    fontWeight: "600",
    flex: 1,
    marginRight: 16,
  },
  modalOfferSalary: {
    fontSize: 14,
    color: COLORS.success,
    fontWeight: "700",
  },
});

export default PublicHome;