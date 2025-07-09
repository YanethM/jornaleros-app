// import React, { useState, useEffect, useRef } from "react";
// import {
//   View,
//   Text,
//   StyleSheet,
//   ScrollView,
//   TouchableOpacity,
//   Image,
//   Dimensions,
//   FlatList,
//   Animated,
//   Platform,
//   TextInput,
//   Modal,
//   StatusBar,
// } from "react-native";
// import { NativeStackNavigationProp } from "@react-navigation/native-stack";
// import CustomHeaderNoAuth from "../../components/CustomHeaderNoAuth";
// import { getAvailableJobOffersNoAuth } from "../../services/jobOffers";
// import { getCropType } from "../../services/cropTypeService";
// import { RootStackParamList } from "../../navigation/types";
// import { MaterialIcons, Ionicons } from "@expo/vector-icons";
// import { LinearGradient } from "expo-linear-gradient";

// // Importar imágenes específicas para cada cultivo
// import sachaInchiImage from "../../../assets/onboarding/slide3.png";
// import cacaoImage from "../../../assets/onboarding/slide1.png";
// import mielImage from "../../../assets/onboarding/slide2.jpg";
// import cafeImage from "../../../assets/onboarding/slide1.png";
// import defaultImage from "../../../assets/onboarding/slide1.png";
// import employerAvatar from "../../../assets/onboarding/slide1.png";

// const { width, height } = Dimensions.get("window");
// const CARD_WIDTH = width * 0.85;
// const CARD_SPACING = 16;

// // Paleta de colores minimalista y moderna
// const COLORS = {
//   // Grises neutros
//   gray50: "#FAFAFA",
//   gray100: "#F5F5F5",
//   gray200: "#EEEEEE",
//   gray300: "#E0E0E0",
//   gray400: "#BDBDBD",
//   gray500: "#9E9E9E",
//   gray600: "#757575",
//   gray700: "#616161",
//   gray800: "#424242",
//   gray900: "#212121",

//   // Colores principales
//   primary: "#000000",
//   accent: "#007AFF",
//   success: "#34C759",
//   warning: "#FF9500",
//   error: "#FF3B30",

//   // Backgrounds
//   background: "#FFFFFF",
//   surface: "#FFFFFF",
//   card: "#FFFFFF",

//   // Texto
//   text: "#000000",
//   textSecondary: "#6B6B6B",
//   textTertiary: "#999999",

//   // Overlays minimalistas
//   overlay: "rgba(0,0,0,0.3)",
//   border: "#F0F0F0",
// };

// // Tipografía simplificada
// const TYPOGRAPHY = {
//   largeTitle: {
//     fontSize: 34,
//     fontWeight: "700",
//     lineHeight: 40,
//   },
//   title1: {
//     fontSize: 28,
//     fontWeight: "700",
//     lineHeight: 34,
//   },
//   title2: {
//     fontSize: 22,
//     fontWeight: "600",
//     lineHeight: 28,
//   },
//   title3: {
//     fontSize: 20,
//     fontWeight: "600",
//     lineHeight: 24,
//   },
//   headline: {
//     fontSize: 17,
//     fontWeight: "600",
//     lineHeight: 22,
//   },
//   body: {
//     fontSize: 17,
//     fontWeight: "400",
//     lineHeight: 22,
//   },
//   callout: {
//     fontSize: 16,
//     fontWeight: "400",
//     lineHeight: 21,
//   },
//   subhead: {
//     fontSize: 15,
//     fontWeight: "400",
//     lineHeight: 20,
//   },
//   footnote: {
//     fontSize: 13,
//     fontWeight: "400",
//     lineHeight: 18,
//   },
//   caption1: {
//     fontSize: 12,
//     fontWeight: "400",
//     lineHeight: 16,
//   },
//   caption2: {
//     fontSize: 11,
//     fontWeight: "600",
//     lineHeight: 13,
//   },
// };

// const CROP_CONFIG = {
//   'sacha inchi': {
//     color: '#284F66',  // Color predominante
//     emoji: '🌱',       // Icono unificado
//     title: 'Sacha Inchi',
//     description: 'Superalimento amazónico',
//   },
//   'cacao': {
//     color: '#5D4037',  // Marrón profesional
//     emoji: '🌱',
//     title: 'Cacao',
//     description: 'Cultivo tradicional',
//   },
//   'café': {
//     color: '#4E342E',  // Marrón oscuro
//     emoji: '🌱',
//     title: 'Café',
//     description: 'Granos premium',
//   },
//   'coffee': {
//     color: '#4E342E',
//     emoji: '🌱',
//     title: 'Coffee',
//     description: 'Premium beans',
//   },
//   'miel': {
//     color: '#F57C00',  // Naranja oscuro
//     emoji: '🌱',
//     title: 'Miel',
//     description: 'Miel pura',
//   },
//   'honey': {
//     color: '#F57C00',
//     emoji: '🌱',
//     title: 'Honey',
//     description: 'Pure honey',
//   },
//   'default': {
//     color: '#284F66',  // Color predominante
//     emoji: '🌱',
//     title: 'Cultivo',
//     description: 'Agricultura sostenible',
//   }
// };

// type PublicHomeNavigationProp = NativeStackNavigationProp<
//   RootStackParamList,
//   "PublicHome"
// >;

// interface PublicHomeProps {
//   navigation: PublicHomeNavigationProp;
// }

// interface JobOfferData {
//   id: string;
//   title: string;
//   description: string;
//   salary: number;
//   city: string;
//   state: string;
//   country: string;
//   village: string;
//   employer: {
//     id: string;
//     organization: string;
//     city: string;
//     state: string;
//     user: any;
//   };
//   farm: {
//     id: string;
//     name: string;
//   };
//   cropType: {
//     id: string;
//     name: string;
//   };
//   phase: {
//     id: string;
//     name: string;
//   };
//   displayLocation: {
//     city: string;
//     country: string;
//     department: string;
//     state: string;
//     village: string;
//   };
//   status: string;
//   startDate: string;
//   endDate: string;
//   duration: string;
//   paymentType: string;
//   paymentMode: string;
//   includesFood: boolean;
//   includesLodging: boolean;
//   applicationsCount: number;
//   createdAt?: string;
//   workersNeeded?: number;
// }

// interface JobCategory {
//   id: string;
//   name: string;
//   image: any;
//   count: string;
//   gradient: string[];
//   config: any;
// }

// interface CropType {
//   id: string;
//   name: string;
//   description?: string;
// }

// const PublicHome: React.FC<PublicHomeProps> = ({ navigation }) => {
//   const [jobOffers, setJobOffers] = useState<JobOfferData[]>([]);
//   const [filteredOffers, setFilteredOffers] = useState<JobOfferData[]>([]);
//   const [categories, setCategories] = useState<JobCategory[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [activeTab, setActiveTab] = useState<"available" | "nearby">(
//     "available"
//   );
//   const [selectedCountry, setSelectedCountry] = useState<string>("");
//   const [showFilters, setShowFilters] = useState(false);
//   const [searchQuery, setSearchQuery] = useState("");

//   // Función para obtener configuración de cultivo
//   const getCropConfig = (cropName: string) => {
//     if (!cropName) return CROP_CONFIG.default;
//     const cropLower = cropName.toLowerCase();
//     for (const [key, config] of Object.entries(CROP_CONFIG)) {
//       if (cropLower.includes(key)) {
//         return config;
//       }
//     }
//     return CROP_CONFIG.default;
//   };

//   // Función para calcular distancia estimada
//   const getDistance = (city: string): number => {
//     if (!city) return 999;
//     return cityDistances[city] || 999;
//   };

//   // Función para obtener ofertas cercanas con lógica inteligente
//   const getNearbyOffers = () => {
//     let nearbyOffers = [...filteredOffers];
//     if (selectedCountry) {
//       nearbyOffers = nearbyOffers.filter(
//         (offer) => offer.displayLocation?.country === selectedCountry
//       );
//     }
//     return nearbyOffers
//       .map((offer) => ({
//         ...offer,
//         distance: getDistance(offer.displayLocation?.city || ""),
//         nearbyScore: calculateNearbyScore(offer),
//       }))
//       .sort((a, b) => b.nearbyScore - a.nearbyScore)
//       .slice(0, Math.min(nearbyOffers.length, 15));
//   };

//   // Calcular puntaje de relevancia para ofertas cercanas
//   const calculateNearbyScore = (offer: JobOfferData): number => {
//     let score = 0;
//     const distance = getDistance(offer.displayLocation?.city || "");

//     if (distance <= 100) score += 100;
//     else if (distance <= 200) score += 80;
//     else if (distance <= 300) score += 60;
//     else if (distance <= 400) score += 40;
//     else score += 20;

//     if (offer.includesLodging) score += 50;
//     if (offer.includesFood) score += 30;

//     if (offer.salary >= 50000) score += 30;
//     else if (offer.salary >= 40000) score += 20;
//     else if (offer.salary >= 30000) score += 10;

//     if (offer.applicationsCount <= 2) score += 25;
//     else if (offer.applicationsCount <= 5) score += 15;

//     if (parseInt(offer.duration) <= 7) score += 15;
//     else if (parseInt(offer.duration) <= 14) score += 10;

//     return score;
//   };

//   const scrollX = useRef(new Animated.Value(0)).current;
//   const fadeAnim = useRef(new Animated.Value(0)).current;
//   const slideAnim = useRef(new Animated.Value(50)).current;

//   // Países disponibles
//   const countries = ["Colombia", "Venezuela"];

//   // Distancias estimadas desde Bogotá (en km)
//   const cityDistances = {
//     Bogotá: 0,
//     Medellín: 240,
//     Cali: 250,
//     Barranquilla: 470,
//     Cartagena: 550,
//     Bucaramanga: 220,
//     Pereira: 200,
//     Manizales: 180,
//     Armenia: 210,
//     Ibagué: 120,
//     "Santa Marta": 480,
//     Villavicencio: 90,
//     Pasto: 380,
//     Montería: 320,
//     Sincelejo: 360,
//     Valledupar: 350,
//     Riohacha: 520,
//     Tunja: 80,
//     Popayán: 290,
//     Neiva: 180,
//     Florencia: 220,
//     Yopal: 200,
//     Arauca: 300,
//     Fortul: 320,
//     Saravena: 310,
//     Arauquita: 330,
//     Caracas: 680,
//     Maracaibo: 590,
//     Valencia: 720,
//     Barquisimeto: 650,
//     Maracay: 700,
//     "San Cristóbal": 380,
//     "Ciudad Bolívar": 580,
//     Maturín: 520,
//   };

//   useEffect(() => {
//     loadInitialData();
//     animateEntry();
//   }, []);

//   useEffect(() => {
//     filterOffers();
//   }, [jobOffers, activeTab, selectedCountry, searchQuery]);

//   const animateEntry = () => {
//     Animated.parallel([
//       Animated.timing(fadeAnim, {
//         toValue: 1,
//         duration: 800,
//         useNativeDriver: true,
//       }),
//       Animated.timing(slideAnim, {
//         toValue: 0,
//         duration: 600,
//         useNativeDriver: true,
//       }),
//     ]).start();
//   };

//   const loadInitialData = async () => {
//     try {
//       setLoading(true);
//       const offers = await loadJobOffers();
//       await loadCropTypes(offers);
//     } catch (error) {
//       console.error("Error loading initial data:", error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const loadJobOffers = async (): Promise<JobOfferData[]> => {
//     try {
//       const response = await getAvailableJobOffersNoAuth();
//       let offers: JobOfferData[] = [];

//       if (Array.isArray(response)) {
//         offers = response;
//       } else if (response && response.jobOffers) {
//         offers = response.jobOffers;
//       }

//       setJobOffers(offers);
//       return offers;
//     } catch (error) {
//       console.error("Error loading job offers:", error);
//       setJobOffers([]);
//       return [];
//     }
//   };

//   const filterOffers = () => {
//     let filtered = [...jobOffers];

//     if (searchQuery.trim()) {
//       filtered = filtered.filter(
//         (offer) =>
//           offer.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
//           offer.cropType?.name
//             .toLowerCase()
//             .includes(searchQuery.toLowerCase()) ||
//           offer.displayLocation?.city
//             .toLowerCase()
//             .includes(searchQuery.toLowerCase())
//       );
//     }

//     if (activeTab === "available") {
//       setFilteredOffers(filtered);
//     } else {
//       setFilteredOffers(filtered);
//     }
//   };

//   const loadCropTypes = async (offers: JobOfferData[]) => {
//     try {
//       const cropTypesResponse = await getCropType();
//       let cropTypes: CropType[] = [];

//       if (Array.isArray(cropTypesResponse)) {
//         cropTypes = cropTypesResponse;
//       } else if (cropTypesResponse && cropTypesResponse.cropTypes) {
//         cropTypes = cropTypesResponse.cropTypes;
//       } else if (cropTypesResponse && cropTypesResponse.data) {
//         cropTypes = cropTypesResponse.data;
//       }

//       const cropCounts = countOffersByCropType(offers);

//       const dynamicCategories: JobCategory[] = cropTypes.map((cropType) => {
//         const config = getCropConfig(cropType.name);
//         return {
//           id: cropType.id,
//           name: cropType.name,
//           image: getCropImage(cropType.name),
//           count:
//             cropCounts[cropType.name] > 0
//               ? `${cropCounts[cropType.name]}`
//               : "0",
//           gradient: [config.color],
//           config: config,
//         };
//       });

//       setCategories(dynamicCategories);
//     } catch (error) {
//       console.error("Error loading crop types:", error);
//       setCategories([]);
//     }
//   };

//   const countOffersByCropType = (
//     offers: JobOfferData[]
//   ): { [key: string]: number } => {
//     const counts: { [key: string]: number } = {};
//     offers.forEach((offer) => {
//       if (offer.cropType && offer.cropType.name) {
//         const cropName = offer.cropType.name;
//         counts[cropName] = (counts[cropName] || 0) + 1;
//       }
//     });
//     return counts;
//   };

//   const getCropImage = (cropName: string): any => {
//     if (!cropName) return defaultImage;
//     const cropName_lower = cropName.toLowerCase();

//     if (cropName_lower.includes("sacha") || cropName_lower.includes("inchi")) {
//       return sachaInchiImage;
//     }
//     if (cropName_lower.includes("cacao")) {
//       return cacaoImage;
//     }
//     if (cropName_lower.includes("miel") || cropName_lower.includes("honey")) {
//       return mielImage;
//     }
//     if (cropName_lower.includes("café") || cropName_lower.includes("coffee")) {
//       return cafeImage;
//     }

//     return defaultImage;
//   };

//   const getEmployerName = (employer: any) => {
//     return employer?.organization || "Empleador";
//   };

//   const formatSalary = (salary: number) => {
//     return new Intl.NumberFormat("es-CO", {
//       style: "currency",
//       currency: "COP",
//       minimumFractionDigits: 0,
//     }).format(salary);
//   };

//   const getInitials = (name: string) => {
//     if (!name) return 'EM';
//     const names = name.split(' ');
//     let initials = names[0].substring(0, 1).toUpperCase();
//     if (names.length > 1) {
//       initials += names[names.length - 1].substring(0, 1).toUpperCase();
//     }
//     return initials;
//   };

//   const formatSalaryCompact = (salary: number) => {
//     if (!salary) return "Por consultar";
//     if (salary >= 1000000) {
//       return `$${(salary / 1000000).toFixed(1)}M`;
//     }
//     if (salary >= 1000) {
//       return `$${(salary / 1000).toFixed(0)}K`;
//     }
//     return `$${salary}`;
//   };

//   const getJobImage = (offer: JobOfferData): any => {
//     return getCropImage(offer.cropType?.name || "");
//   };

//   const getRecentOffers = () => {
//     return [...filteredOffers]
//       .sort((a, b) => {
//         const dateA = new Date(a.createdAt || a.startDate);
//         const dateB = new Date(b.createdAt || b.startDate);
//         return dateB.getTime() - dateA.getTime();
//       })
//       .slice(0, 6);
//   };

//   const formatTimeAgo = (dateString: string) => {
//     if (!dateString) return "Fecha no disponible";

//     const date = new Date(dateString);
//     const now = new Date();
//     const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

//     if (diffInSeconds < 60) return "Hace unos segundos";
//     if (diffInSeconds < 3600)
//       return `Hace ${Math.floor(diffInSeconds / 60)} min`;
//     if (diffInSeconds < 86400)
//       return `Hace ${Math.floor(diffInSeconds / 3600)} h`;
//     if (diffInSeconds < 2592000)
//       return `Hace ${Math.floor(diffInSeconds / 86400)} días`;

//     return date.toLocaleDateString("es-CO", { day: "numeric", month: "short" });
//   };
//   // Componente de navegación simplificado
//   const renderFloatingNavigation = () => (
//     <View style={styles.navigationContainer}>
//       <View style={styles.navigationTabs}>
//         <TouchableOpacity
//           style={[
//             styles.navTab,
//             activeTab === "available" && styles.navTabActive,
//           ]}
//           onPress={() => {
//             setActiveTab("available");
//             setSelectedCountry("");
//           }}>
//           <Text
//             style={[
//               styles.navTabText,
//               activeTab === "available" && styles.navTabTextActive,
//             ]}>
//             Disponibles
//           </Text>
//         </TouchableOpacity>

//         <TouchableOpacity
//           style={[styles.navTab, activeTab === "nearby" && styles.navTabActive]}
//           onPress={() => setActiveTab("nearby")}>
//           <Text
//             style={[
//               styles.navTabText,
//               activeTab === "nearby" && styles.navTabTextActive,
//             ]}>
//             Cercanas
//           </Text>
//         </TouchableOpacity>
//       </View>
//     </View>
//   );

//   // Búsqueda simplificada
//   const renderSearchSection = () => (
//     <View style={styles.searchContainer}>
//       <View style={styles.searchInput}>
//         <Ionicons name="search" size={20} color={COLORS.textTertiary} />
//         <TextInput
//           style={styles.searchField}
//           placeholder="Buscar ofertas..."
//           value={searchQuery}
//           onChangeText={setSearchQuery}
//           placeholderTextColor={COLORS.textTertiary}
//         />
//         {activeTab === "nearby" && (
//           <TouchableOpacity onPress={() => setShowFilters(true)}>
//             <Ionicons
//               name="options-outline"
//               size={20}
//               color={COLORS.textSecondary}
//             />
//           </TouchableOpacity>
//         )}
//       </View>

//       {activeTab === "nearby" && selectedCountry && (
//         <View style={styles.filterChip}>
//           <Text style={styles.filterChipText}>{selectedCountry}</Text>
//           <TouchableOpacity onPress={() => setSelectedCountry("")}>
//             <Ionicons name="close" size={16} color={COLORS.background} />
//           </TouchableOpacity>
//         </View>
//       )}

//       {activeTab === "nearby" && !selectedCountry && (
//         <View style={styles.countryPrompt}>
//           <Ionicons name="flag-outline" size={20} color={COLORS.accent} />
//           <View style={styles.promptContent}>
//             <Text style={styles.promptTitle}>Selecciona tu país</Text>
//             <Text style={styles.promptSubtitle}>Para ver ofertas cercanas</Text>
//           </View>
//           <TouchableOpacity
//             style={styles.promptButton}
//             onPress={() => setShowFilters(true)}>
//             <Text style={styles.promptButtonText}>Seleccionar</Text>
//           </TouchableOpacity>
//         </View>
//       )}
//     </View>
//   );

//   // Stats minimalistas
//   const renderStatsCard = () => (
//     <View style={styles.statsContainer}>
//       <View style={styles.statItem}>
//         <Text style={styles.statNumber}>{filteredOffers.length}</Text>
//         <Text style={styles.statLabel}>Ofertas</Text>
//       </View>
//       <View style={styles.statDivider} />
//       <View style={styles.statItem}>
//         <Text style={styles.statNumber}>{categories.length}</Text>
//         <Text style={styles.statLabel}>Cultivos</Text>
//       </View>
//       <View style={styles.statDivider} />
//       <View style={styles.statItem}>
//         <Text style={styles.statNumber}>
//           {filteredOffers.filter((offer) => offer.includesLodging).length}
//         </Text>
//         <Text style={styles.statLabel}>Con alojamiento</Text>
//       </View>
//     </View>
//   );

//   // Tarjeta de oferta destacada simplificada
//   // const renderFeaturedOffer = ({ item, index }) => {
//   //   const cropConfig = getCropConfig(item.cropType?.name || "");

//   //   const getLocationText = () => {
//   //     const location = item.displayLocation;
//   //     if (!location) return "Ubicación por confirmar";
//   //     return `${location.city || ""}, ${
//   //       location.department || location.state || ""
//   //     }`
//   //       .replace(", ,", ",")
//   //       .replace(/^,|,$/g, "");
//   //   };

//   //   return (
//   //     <View style={styles.featuredCard}>
//   //       <TouchableOpacity
//   //         onPress={() =>
//   //           navigation.navigate("WorkerJobOfferDetailNoAuth", {
//   //             jobId: item.id,
//   //             fromPublic: true,
//   //           })
//   //         }
//   //         activeOpacity={0.9}>
//   //         <View style={styles.featuredImageContainer}>
//   //           <Image source={getJobImage(item)} style={styles.featuredImage} />
//   //           <View style={styles.featuredOverlay} />

//   //           <View style={styles.featuredBadge}>
//   //             <Text style={styles.featuredBadgeText}>
//   //               {cropConfig.emoji} {cropConfig.title}
//   //             </Text>
//   //           </View>

//   //           {(item.includesFood || item.includesLodging) && (
//   //             <View style={styles.featuredTopBenefits}>
//   //               {item.includesFood && (
//   //                 <View style={styles.benefitIcon}>
//   //                   <Ionicons
//   //                     name="restaurant"
//   //                     size={12}
//   //                     color={COLORS.success}
//   //                   />
//   //                 </View>
//   //               )}
//   //               {item.includesLodging && (
//   //                 <View style={styles.benefitIcon}>
//   //                   <Ionicons name="home" size={12} color={COLORS.accent} />
//   //                 </View>
//   //               )}
//   //             </View>
//   //           )}
//   //         </View>

//   //         <View style={styles.featuredContent}>
//   //           <Text style={styles.featuredTitle} numberOfLines={2}>
//   //             {item.title}
//   //           </Text>
//   //           <Text style={styles.featuredSubtitle} numberOfLines={1}>
//   //             {getEmployerName(item.employer)} • {item.farm?.name || "Finca"}
//   //           </Text>

//   //           <View style={styles.featuredLocation}>
//   //             <Ionicons
//   //               name="location-outline"
//   //               size={14}
//   //               color={COLORS.textTertiary}
//   //             />
//   //             <Text style={styles.featuredLocationText}>
//   //               {getLocationText()}
//   //             </Text>
//   //           </View>

//   //           <View style={styles.featuredMeta}>
//   //             <View style={styles.metaItem}>
//   //               <Ionicons
//   //                 name="calendar-outline"
//   //                 size={12}
//   //                 color={COLORS.textTertiary}
//   //               />
//   //               <Text style={styles.metaText}>
//   //                 {item.duration ? `${item.duration} días` : "Consultar"}
//   //               </Text>
//   //             </View>
//   //             <View style={styles.metaItem}>
//   //               <Ionicons
//   //                 name="time-outline"
//   //                 size={12}
//   //                 color={COLORS.textTertiary}
//   //               />
//   //               <Text style={styles.metaText}>
//   //                 {formatTimeAgo(item.createdAt)}
//   //               </Text>
//   //             </View>
//   //             {item.workersNeeded && (
//   //               <View style={styles.metaItem}>
//   //                 <Ionicons
//   //                   name="people-outline"
//   //                   size={12}
//   //                   color={COLORS.textTertiary}
//   //                 />
//   //                 <Text style={styles.metaText}>
//   //                   {item.workersNeeded} persona
//   //                   {item.workersNeeded !== 1 ? "s" : ""}
//   //                 </Text>
//   //               </View>
//   //             )}
//   //           </View>
//   //           <View style={styles.featuredFooter}>
//   //             <Text style={styles.featuredSalary}>
//   //               {formatSalaryCompact(item.salary)}
//   //               <Text style={styles.featuredSalaryPeriod}>
//   //                 {item.paymentType === "Por_dia" ? "/día" : "/trabajo"}
//   //               </Text>
//   //             </Text>
//   //             <View style={styles.featuredBenefits}>
//   //               {item.includesFood && (
//   //                 <View
//   //                   style={[
//   //                     styles.benefitDot,
//   //                     { backgroundColor: COLORS.success },
//   //                   ]}
//   //                 />
//   //               )}
//   //               {item.includesLodging && (
//   //                 <View
//   //                   style={[
//   //                     styles.benefitDot,
//   //                     { backgroundColor: COLORS.accent },
//   //                   ]}
//   //                 />
//   //               )}
//   //             </View>
//   //           </View>
//   //         </View>
//   //       </TouchableOpacity>
//   //     </View>
//   //   );
//   // };

//   const renderFeaturedOffer = ({ item, index }) => {
//     const cropConfig = getCropConfig(item.cropType?.name || "");
//     const employerName = getEmployerName(item.employer);
//     const initials = getInitials(employerName);
  
//     return (
//       <View style={styles.featuredCard}>
//         <TouchableOpacity
//           onPress={() =>
//             navigation.navigate("WorkerJobOfferDetailNoAuth", {
//               jobId: item.id,
//               fromPublic: true,
//             })
//           }
//           activeOpacity={0.9}>
          
//           <View style={styles.featuredImageContainer}>
//             <Image source={getJobImage(item)} style={styles.featuredImage} />
//             <View style={styles.featuredOverlay} />
            
//             {/* Avatar del productor */}
//             <View style={[styles.employerAvatar, { backgroundColor: cropConfig.color }]}>
//               <Text style={styles.avatarText}>{initials}</Text>
//             </View>
  
//             {/* Badge del cultivo */}
//             <View style={[styles.featuredBadge, { backgroundColor: `${cropConfig.color}15` }]}>
//               <Text style={[styles.featuredBadgeText, { color: cropConfig.color }]}>
//                 {cropConfig.title}
//               </Text>
//             </View>
  
//             {/* Beneficios */}
//             {(item.includesFood || item.includesLodging) && (
//               <View style={styles.featuredTopBenefits}>
//                 {item.includesFood && (
//                   <View style={[styles.benefitIcon, { backgroundColor: 'rgba(255,255,255,0.9)' }]}>
//                     <Ionicons name="restaurant" size={14} color={COLORS.text} />
//                   </View>
//                 )}
//                 {item.includesLodging && (
//                   <View style={[styles.benefitIcon, { backgroundColor: 'rgba(255,255,255,0.9)' }]}>
//                     <Ionicons name="home" size={14} color={COLORS.text} />
//                   </View>
//                 )}
//               </View>
//             )}
//           </View>
  
//           {/* Resto del contenido... */}
//         </TouchableOpacity>
//       </View>
//     );
//   };
//   // Tarjeta de trabajo simplificada
//   const renderJobCard = (item: JobOfferData, index: number) => {
//     const cropConfig = getCropConfig(item.cropType?.name || "");
//     const distance = getDistance(item.displayLocation?.city || "");
//     const isNearbyTab = activeTab === "nearby";

//     return (
//       <View key={item.id} style={styles.jobCard}>
//         <TouchableOpacity
//           onPress={() =>
//             navigation.navigate("WorkerJobOfferDetailNoAuth", {
//               jobId: item.id,
//               fromPublic: true,
//             })
//           }
//           activeOpacity={0.9}>
//           <View style={styles.jobHeader}>
//             <View
//               style={[
//                 styles.jobCropIndicator,
//                 { backgroundColor: `${cropConfig.color}15` },
//               ]}>
//               <Text style={styles.jobCropEmoji}>{cropConfig.emoji}</Text>
//             </View>
//             <View style={styles.jobHeaderContent}>
//               <Text style={styles.jobTitle} numberOfLines={2}>
//                 {item.title}
//               </Text>
//               <Text style={styles.jobCompany} numberOfLines={1}>
//                 {getEmployerName(item.employer)}
//               </Text>
//               {item.farm?.name && (
//                 <Text style={styles.jobFarm} numberOfLines={1}>
//                   {item.farm.name}
//                 </Text>
//               )}
//             </View>
//             {isNearbyTab && (
//               <View style={styles.distanceBadge}>
//                 <Text style={styles.distanceText}>
//                   {distance === 0 ? "Tu ciudad" : `${distance} km`}
//                 </Text>
//               </View>
//             )}
//           </View>

//           <View style={styles.jobInfo}>
//             <View style={styles.jobLocation}>
//               <Ionicons
//                 name="location-outline"
//                 size={14}
//                 color={COLORS.textTertiary}
//               />
//               <Text style={styles.jobLocationText}>
//                 {item.displayLocation?.city}, {item.displayLocation?.state}
//               </Text>
//               <Text style={styles.jobDate}>
//                 • {formatTimeAgo(item.createdAt)}
//               </Text>
//             </View>

//             <View style={styles.jobTags}>
//               <View
//                 style={[
//                   styles.cropTag,
//                   { backgroundColor: `${cropConfig.color}15` },
//                 ]}>
//                 <Text style={[styles.cropTagText, { color: cropConfig.color }]}>
//                   {cropConfig.title}
//                 </Text>
//               </View>
//               {item.phase?.name && (
//                 <View style={styles.phaseTag}>
//                   <Text style={styles.phaseTagText}>{item.phase.name}</Text>
//                 </View>
//               )}
//             </View>
//           </View>
//           <View style={styles.jobFooter}>
//             <Text style={styles.jobSalary}>
//               {formatSalaryCompact(item.salary)}/día
//             </Text>
//             <View style={styles.jobBenefits}>
//               {item.includesFood && (
//                 <View
//                   style={[
//                     styles.benefitDot,
//                     { backgroundColor: COLORS.success },
//                   ]}
//                 />
//               )}
//               {item.includesLodging && (
//                 <View
//                   style={[
//                     styles.benefitDot,
//                     { backgroundColor: COLORS.accent },
//                   ]}
//                 />
//               )}
//               <Text style={styles.applicationsText}>
//                 {item.applicationsCount || 0} aplicaciones
//               </Text>
//             </View>
//           </View>
//         </TouchableOpacity>
//       </View>
//     );
//   };

//   // Tarjeta de categoría simplificada
//   const renderCategoryCard = (item: JobCategory) => {
//     const hasOffers = parseInt(item.count) > 0;

//     return (
//       <TouchableOpacity
//         key={item.id}
//         style={[styles.categoryCard, !hasOffers && styles.categoryCardDisabled]}
//         onPress={() =>
//           hasOffers &&
//           navigation.navigate("CategoryJobs", { category: item.name })
//         }
//         activeOpacity={0.8}>
//         <View
//           style={[
//             styles.categoryIcon,
//             { backgroundColor: `${item.config.color}15` },
//           ]}>
//           <Text style={styles.categoryEmoji}>{item.config.emoji}</Text>
//         </View>

//         <Text style={styles.categoryTitle}>{item.config.title}</Text>
//         <Text style={styles.categoryDescription} numberOfLines={2}>
//           {item.config.description}
//         </Text>

//         <Text style={[styles.categoryCount, { color: item.config.color }]}>
//           {item.count} oferta{parseInt(item.count) !== 1 ? "s" : ""}
//         </Text>
//       </TouchableOpacity>
//     );
//   };

//   // Modal simplificado
//   const renderFilterModal = () => (
//     <Modal
//       visible={showFilters}
//       transparent={true}
//       animationType="slide"
//       onRequestClose={() => setShowFilters(false)}>
//       <View style={styles.modalOverlay}>
//         <TouchableOpacity
//           style={styles.modalBackdrop}
//           onPress={() => setShowFilters(false)}
//         />
//         <View style={styles.modal}>
//           <View style={styles.modalHeader}>
//             <Text style={styles.modalTitle}>Seleccionar país</Text>
//             <TouchableOpacity onPress={() => setShowFilters(false)}>
//               <Ionicons name="close" size={24} color={COLORS.textSecondary} />
//             </TouchableOpacity>
//           </View>

//           <View style={styles.modalContent}>
//             {countries.map((country) => (
//               <TouchableOpacity
//                 key={country}
//                 style={[
//                   styles.countryOption,
//                   selectedCountry === country && styles.countryOptionSelected,
//                 ]}
//                 onPress={() =>
//                   setSelectedCountry(country === selectedCountry ? "" : country)
//                 }>
//                 <Text
//                   style={[
//                     styles.countryOptionText,
//                     selectedCountry === country &&
//                       styles.countryOptionTextSelected,
//                   ]}>
//                   {country}
//                 </Text>
//                 {selectedCountry === country && (
//                   <Ionicons name="checkmark" size={20} color={COLORS.accent} />
//                 )}
//               </TouchableOpacity>
//             ))}
//           </View>

//           <View style={styles.modalActions}>
//             <TouchableOpacity
//               style={styles.modalButtonSecondary}
//               onPress={() => setSelectedCountry("")}>
//               <Text style={styles.modalButtonSecondaryText}>Limpiar</Text>
//             </TouchableOpacity>
//             <TouchableOpacity
//               style={styles.modalButtonPrimary}
//               onPress={() => setShowFilters(false)}>
//               <Text style={styles.modalButtonPrimaryText}>Aplicar</Text>
//             </TouchableOpacity>
//           </View>
//         </View>
//       </View>
//     </Modal>
//   );

//   const featuredOffers = getRecentOffers();

//   return (
//     <View style={styles.container}>
//       <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
//       <CustomHeaderNoAuth navigation={navigation} />

//       <Animated.View
//         style={[
//           styles.content,
//           { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
//         ]}>
//         <ScrollView
//           style={styles.scrollView}
//           showsVerticalScrollIndicator={false}>
//           {/* Navegación */}
//           {renderFloatingNavigation()}

//           {/* Búsqueda */}
//           {renderSearchSection()}

//           {/* Estadísticas */}
//           {renderStatsCard()}

//           {/* Ofertas destacadas */}
//           {featuredOffers.length > 0 && (
//             <View style={styles.section}>
//               <View style={styles.sectionHeader}>
//                 <Text style={styles.sectionTitle}>Ofertas destacadas</Text>
//                 <TouchableOpacity
//                   onPress={() => navigation.navigate("AllJobs")}>
//                   <Text style={styles.sectionAction}>Ver todas</Text>
//                 </TouchableOpacity>
//               </View>

//               <Animated.FlatList
//                 data={featuredOffers}
//                 renderItem={renderFeaturedOffer}
//                 keyExtractor={(item) => item.id}
//                 horizontal
//                 showsHorizontalScrollIndicator={false}
//                 contentContainerStyle={styles.featuredList}
//                 onScroll={Animated.event(
//                   [{ nativeEvent: { contentOffset: { x: scrollX } } }],
//                   { useNativeDriver: true }
//                 )}
//                 scrollEventThrottle={16}
//               />
//             </View>
//           )}

//           {/* Categorías */}
//           {activeTab === "available" && (
//             <View style={styles.section}>
//               <View style={styles.sectionHeader}>
//                 <Text style={styles.sectionTitle}>Explorar por cultivo</Text>
//               </View>

//               {categories.length > 0 ? (
//                 <View style={styles.categoriesGrid}>
//                   {categories.map(renderCategoryCard)}
//                 </View>
//               ) : (
//                 <View style={styles.emptyState}>
//                   <Text style={styles.emptyDescription}>
//                     No hay categorías disponibles
//                   </Text>
//                 </View>
//               )}
//             </View>
//           )}

//           {/* Todas las ofertas */}
//           <View style={styles.section}>
//             <View style={styles.sectionHeader}>
//               <Text style={styles.sectionTitle}>
//                 {activeTab === "nearby"
//                   ? selectedCountry
//                     ? `Ofertas cercanas en ${selectedCountry}`
//                     : "Ofertas cercanas"
//                   : "Todas las ofertas"}
//               </Text>
//             </View>

//             {loading ? (
//               <View style={styles.loadingContainer}>
//                 <Text style={styles.loadingText}>Cargando ofertas...</Text>
//               </View>
//             ) : activeTab === "nearby" && !selectedCountry ? (
//               <View style={styles.emptyState}>
//                 <Ionicons
//                   name="flag-outline"
//                   size={48}
//                   color={COLORS.textTertiary}
//                 />
//                 <Text style={styles.emptyTitle}>Selecciona un país</Text>
//                 <Text style={styles.emptyDescription}>
//                   Elige Colombia o Venezuela para descubrir ofertas cercanas
//                 </Text>
//                 <TouchableOpacity
//                   style={styles.emptyAction}
//                   onPress={() => setShowFilters(true)}>
//                   <Text style={styles.emptyActionText}>Seleccionar país</Text>
//                 </TouchableOpacity>
//               </View>
//             ) : (activeTab === "nearby" ? getNearbyOffers() : filteredOffers)
//                 .length > 0 ? (
//               <View style={styles.jobsList}>
//                 {(activeTab === "nearby"
//                   ? getNearbyOffers()
//                   : filteredOffers
//                 ).map((offer, index) => renderJobCard(offer, index))}
//               </View>
//             ) : (
//               <View style={styles.emptyState}>
//                 <Ionicons
//                   name="search-outline"
//                   size={48}
//                   color={COLORS.textTertiary}
//                 />
//                 <Text style={styles.emptyTitle}>
//                   {activeTab === "nearby"
//                     ? `No hay ofertas cercanas en ${selectedCountry}`
//                     : "No se encontraron ofertas"}
//                 </Text>
//                 <Text style={styles.emptyDescription}>
//                   {activeTab === "nearby"
//                     ? "Intenta seleccionar otro país o explora las ofertas disponibles"
//                     : "Intenta ajustar tu búsqueda o explora otras categorías"}
//                 </Text>
//               </View>
//             )}
//           </View>
//         </ScrollView>
//       </Animated.View>

//       {renderFilterModal()}
//     </View>
//   );
// };

// // Estilos modernos y minimalistas
// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: COLORS.background,
//   },
//   content: {
//     flex: 1,
//   },
//   scrollView: {
//     flex: 1,
//   },
//   featuredCard: {
//     width: CARD_WIDTH,
//     backgroundColor: COLORS.background,
//     borderRadius: 16,
//     marginHorizontal: 8,
//     borderWidth: 1,
//     borderColor: COLORS.border,
//     overflow: "hidden",
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 4,
//     elevation: 3,
//   },
  
//   employerAvatar: {
//     position: 'absolute',
//     top: 12,
//     left: 12,
//     width: 40,
//     height: 40,
//     borderRadius: 20,
//     alignItems: 'center',
//     justifyContent: 'center',
//     zIndex: 2,
//   },
  
//   avatarText: {
//     color: '#FFFFFF',
//     fontSize: 16,
//     fontWeight: 'bold',
//   },
  
//   featuredBadge: {
//     position: "absolute",
//     top: 60,
//     left: 12,
//     backgroundColor: COLORS.background,
//     paddingHorizontal: 10,
//     paddingVertical: 6,
//     borderRadius: 12,
//     borderWidth: 1,
//     borderColor: COLORS.border,
//   },
  
//   featuredBadgeText: {
//     ...TYPOGRAPHY.caption1,
//     fontWeight: "600",
//   },
  
//   featuredTopBenefits: {
//     position: "absolute",
//     top: 12,
//     right: 12,
//     flexDirection: "row",
//     gap: 6,
//   },
  
//   benefitIcon: {
//     width: 32,
//     height: 32,
//     borderRadius: 16,
//     backgroundColor: "rgba(255,255,255,0.9)",
//     alignItems: "center",
//     justifyContent: "center",
//     borderWidth: 1,
//     borderColor: COLORS.border,
//   },
//   jobLocation: {
//     flexDirection: "row",
//     alignItems: "center",
//     gap: 4,
//     marginBottom: 12,
//     flexWrap: "wrap",
//   },
//   jobLocationText: {
//     ...TYPOGRAPHY.footnote,
//     color: COLORS.textTertiary,
//   },
//   jobDate: {
//     ...TYPOGRAPHY.caption1,
//     color: COLORS.textTertiary,
//     marginLeft: 4,
//   },
//   featuredMeta: {
//     flexDirection: "row",
//     gap: 16,
//     marginBottom: 12,
//     flexWrap: "wrap",
//   },
//   metaItem: {
//     flexDirection: "row",
//     alignItems: "center",
//     gap: 4,
//   },
//   metaText: {
//     ...TYPOGRAPHY.caption1,
//     color: COLORS.textTertiary,
//   },
//   navigationContainer: {
//     paddingHorizontal: 20,
//     paddingTop: 20,
//   },
//   navigationTabs: {
//     flexDirection: "row",
//     backgroundColor: COLORS.gray100,
//     borderRadius: 12,
//     padding: 4,
//   },
//   navTab: {
//     flex: 1,
//     paddingVertical: 12,
//     alignItems: "center",
//     borderRadius: 8,
//   },
//   navTabActive: {
//     backgroundColor: COLORS.background,
//     ...Platform.select({
//       ios: {
//         shadowColor: "#000",
//         shadowOffset: { width: 0, height: 2 },
//         shadowOpacity: 0.1,
//         shadowRadius: 4,
//       },
//       android: {
//         elevation: 2,
//       },
//     }),
//   },
//   navTabText: {
//     ...TYPOGRAPHY.callout,
//     color: COLORS.textSecondary,
//     fontWeight: "500",
//   },
//   navTabTextActive: {
//     color: COLORS.text,
//     fontWeight: "600",
//   },

//   // ========== BÚSQUEDA ==========
//   searchContainer: {
//     paddingHorizontal: 20,
//     paddingTop: 24,
//   },
//   searchInput: {
//     flexDirection: "row",
//     alignItems: "center",
//     backgroundColor: COLORS.gray100,
//     borderRadius: 12,
//     paddingHorizontal: 16,
//     paddingVertical: 12,
//     gap: 12,
//   },
//   searchField: {
//     flex: 1,
//     ...TYPOGRAPHY.body,
//     color: COLORS.text,
//   },
//   filterChip: {
//     flexDirection: "row",
//     alignItems: "center",
//     backgroundColor: COLORS.accent,
//     paddingHorizontal: 12,
//     paddingVertical: 6,
//     borderRadius: 16,
//     gap: 6,
//     marginTop: 12,
//     alignSelf: "flex-start",
//   },
//   filterChipText: {
//     ...TYPOGRAPHY.footnote,
//     color: COLORS.background,
//     fontWeight: "500",
//   },
//   countryPrompt: {
//     flexDirection: "row",
//     alignItems: "center",
//     backgroundColor: COLORS.gray50,
//     paddingHorizontal: 16,
//     paddingVertical: 16,
//     borderRadius: 12,
//     marginTop: 12,
//     gap: 12,
//   },
//   promptContent: {
//     flex: 1,
//   },
//   promptTitle: {
//     ...TYPOGRAPHY.callout,
//     color: COLORS.text,
//     fontWeight: "500",
//     marginBottom: 2,
//   },
//   promptButton: {
//     backgroundColor: COLORS.accent,
//     paddingHorizontal: 16,
//     paddingVertical: 8,
//     borderRadius: 8,
//   },
//   promptButtonText: {
//     ...TYPOGRAPHY.footnote,
//     color: COLORS.background,
//     fontWeight: "600",
//   },

//   // ========== ESTADÍSTICAS ==========
//   statsContainer: {
//     flexDirection: "row",
//     backgroundColor: COLORS.background,
//     marginHorizontal: 20,
//     marginTop: 24,
//     paddingVertical: 20,
//     borderRadius: 16,
//     borderWidth: 1,
//     borderColor: COLORS.border,
//   },
//   statItem: {
//     flex: 1,
//     alignItems: "center",
//   },
//   statNumber: {
//     ...TYPOGRAPHY.title2,
//     color: COLORS.text,
//     marginBottom: 4,
//   },
//   statDivider: {
//     width: 1,
//     backgroundColor: COLORS.border,
//   },

//   // ========== SECCIONES ==========
//   section: {
//     marginTop: 40,
//   },
//   sectionHeader: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "center",
//     paddingHorizontal: 20,
//     marginBottom: 20,
//   },
//   sectionAction: {
//     ...TYPOGRAPHY.callout,
//     color: COLORS.accent,
//     fontWeight: "500",
//   },

//   // ========== OFERTAS DESTACADAS ==========
//   featuredList: {
//     paddingHorizontal: 12,
//   },
//   featuredImageContainer: {
//     height: 200,
//     position: "relative",
//   },
//   featuredImage: {
//     width: "100%",
//     height: "100%",
//     resizeMode: "cover",
//   },
//   featuredOverlay: {
//     position: "absolute",
//     top: 0,
//     left: 0,
//     right: 0,
//     bottom: 0,
//     backgroundColor: "rgba(0,0,0,0.1)",
//   },
//   featuredContent: {
//     padding: 16,
//   },
//   featuredTitle: {
//     ...TYPOGRAPHY.headline,
//     color: COLORS.text,
//     marginBottom: 6,
//   },
//   featuredSubtitle: {
//     ...TYPOGRAPHY.subhead,
//     color: COLORS.textSecondary,
//     marginBottom: 8,
//   },
//   featuredLocation: {
//     flexDirection: "row",
//     alignItems: "center",
//     gap: 4,
//     marginBottom: 12,
//   },
//   featuredFooter: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "center",
//   },
//   featuredSalary: {
//     ...TYPOGRAPHY.headline,
//     color: COLORS.success,
//     fontWeight: "600",
//   },
//   featuredSalaryPeriod: {
//     ...TYPOGRAPHY.footnote,
//     color: COLORS.textSecondary,
//     fontWeight: "400",
//   },
//   featuredBenefits: {
//     flexDirection: "row",
//     gap: 6,
//   },
//   benefitDot: {
//     width: 8,
//     height: 8,
//     borderRadius: 4,
//   },

//   // ========== TARJETAS DE TRABAJO ==========
//   jobsList: {
//     paddingHorizontal: 20,
//     gap: 16,
//   },
//   jobCard: {
//     backgroundColor: COLORS.background,
//     borderRadius: 16,
//     padding: 16,
//     borderWidth: 1,
//     borderColor: COLORS.border,
//   },
//   jobHeader: {
//     flexDirection: "row",
//     alignItems: "flex-start",
//     gap: 12,
//     marginBottom: 12,
//   },
//   jobCropIndicator: {
//     width: 40,
//     height: 40,
//     borderRadius: 20,
//     alignItems: "center",
//     justifyContent: "center",
//   },
//   jobCropEmoji: {
//     fontSize: 18,
//   },
//   jobHeaderContent: {
//     flex: 1,
//   },
//   jobTitle: {
//     ...TYPOGRAPHY.headline,
//     color: COLORS.text,
//     marginBottom: 4,
//   },
//   jobCompany: {
//     ...TYPOGRAPHY.subhead,
//     color: COLORS.textSecondary,
//     marginBottom: 2,
//   },
//   jobFarm: {
//     ...TYPOGRAPHY.footnote,
//     color: COLORS.textTertiary,
//   },
//   distanceBadge: {
//     backgroundColor: COLORS.gray100,
//     paddingHorizontal: 8,
//     paddingVertical: 4,
//     borderRadius: 8,
//   },
//   distanceText: {
//     ...TYPOGRAPHY.caption1,
//     color: COLORS.textSecondary,
//     fontWeight: "500",
//   },
//   jobInfo: {
//     marginBottom: 12,
//   },
//   jobTags: {
//     flexDirection: "row",
//     gap: 8,
//     flexWrap: "wrap",
//   },
//   cropTag: {
//     paddingHorizontal: 10,
//     paddingVertical: 4,
//     borderRadius: 8,
//   },
//   cropTagText: {
//     ...TYPOGRAPHY.caption1,
//     fontWeight: "600",
//   },
//   phaseTag: {
//     backgroundColor: COLORS.gray100,
//     paddingHorizontal: 10,
//     paddingVertical: 4,
//     borderRadius: 8,
//   },
//   phaseTagText: {
//     ...TYPOGRAPHY.caption1,
//     color: COLORS.textSecondary,
//     fontWeight: "500",
//   },
//   jobFooter: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "center",
//   },
//   jobSalary: {
//     ...TYPOGRAPHY.headline,
//     color: COLORS.success,
//     fontWeight: "600",
//   },
//   jobBenefits: {
//     flexDirection: "row",
//     alignItems: "center",
//     gap: 8,
//   },
//   categoriesGrid: {
//     paddingHorizontal: 20,
//     flexDirection: "row",
//     flexWrap: "wrap",
//     gap: 16,
//   },
//   categoryCard: {
//     width: (width - 56) / 2,
//     backgroundColor: COLORS.background,
//     borderRadius: 16,
//     padding: 16,
//     borderWidth: 1,
//     borderColor: COLORS.border,
//     alignItems: "center",
//   },
//   categoryCardDisabled: {
//     opacity: 0.5,
//   },
//   categoryIcon: {
//     width: 48,
//     height: 48,
//     borderRadius: 24,
//     alignItems: "center",
//     justifyContent: "center",
//     marginBottom: 12,
//   },
//   categoryEmoji: {
//     fontSize: 20,
//   },
//   categoryTitle: {
//     ...TYPOGRAPHY.headline,
//     color: COLORS.text,
//     textAlign: "center",
//     marginBottom: 6,
//   },
//   categoryDescription: {
//     ...TYPOGRAPHY.footnote,
//     color: COLORS.textSecondary,
//     textAlign: "center",
//     marginBottom: 12,
//   },
//   categoryCount: {
//     ...TYPOGRAPHY.callout,
//     fontWeight: "600",
//   },

//   // ========== MODAL ==========
//   modalOverlay: {
//     flex: 1,
//     backgroundColor: COLORS.overlay,
//     justifyContent: "flex-end",
//   },
//   modalBackdrop: {
//     flex: 1,
//   },
//   modal: {
//     backgroundColor: COLORS.background,
//     borderTopLeftRadius: 20,
//     borderTopRightRadius: 20,
//     maxHeight: height * 0.7,
//   },
//   modalHeader: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "center",
//     padding: 20,
//     borderBottomWidth: 1,
//     borderBottomColor: COLORS.border,
//   },
//   modalContent: {
//     padding: 20,
//   },
//   countryOption: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "center",
//     paddingVertical: 16,
//     paddingHorizontal: 16,
//     borderRadius: 12,
//     marginBottom: 8,
//   },
//   countryOptionSelected: {
//     backgroundColor: COLORS.gray100,
//   },
//   countryOptionTextSelected: {
//     fontWeight: "600",
//   },
//   modalActions: {
//     flexDirection: "row",
//     padding: 20,
//     gap: 12,
//   },
//   modalButtonSecondary: {
//     flex: 1,
//     paddingVertical: 16,
//     borderRadius: 12,
//     alignItems: "center",
//     backgroundColor: COLORS.gray100,
//   },
//   modalButtonSecondaryText: {
//     ...TYPOGRAPHY.callout,
//     color: COLORS.text,
//     fontWeight: "500",
//   },
//   modalButtonPrimary: {
//     flex: 1,
//     backgroundColor: COLORS.accent,
//     paddingVertical: 16,
//     borderRadius: 12,
//     alignItems: "center",
//   },
//   modalButtonPrimaryText: {
//     ...TYPOGRAPHY.callout,
//     color: COLORS.background,
//     fontWeight: "600",
//   },

//   // ========== ESTADOS ==========
//   loadingContainer: {
//     paddingVertical: 40,
//     alignItems: "center",
//   },
//   emptyState: {
//     paddingVertical: 60,
//     paddingHorizontal: 40,
//     alignItems: "center",
//   },
//   emptyTitle: {
//     ...TYPOGRAPHY.title3,
//     color: COLORS.text,
//     marginTop: 16,
//     marginBottom: 8,
//     textAlign: "center",
//   },
//   emptyAction: {
//     backgroundColor: COLORS.accent,
//     paddingHorizontal: 24,
//     paddingVertical: 12,
//     borderRadius: 12,
//     marginTop: 20,
//   },
//   emptyActionText: {
//     ...TYPOGRAPHY.callout,
//     color: COLORS.background,
//     fontWeight: "600",
//   },
// });

// export default PublicHome;
import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
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

// Constants
const { width, height } = Dimensions.get("window");
const CARD_WIDTH = width * 0.85;
const CARD_SPACING = 16;

// Theme configuration
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
  primary: "#000000",
  accent: "#007AFF",
  success: "#34C759",
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
  'sacha inchi': {
    color: '#284F66',
    emoji: '🌱',
    title: 'Sacha Inchi',
    description: 'Superalimento amazónico',
  },
  'cacao': {
    color: '#5D4037',
    emoji: '🌱',
    title: 'Cacao',
    description: 'Cultivo tradicional',
  },
  'café': {
    color: '#4E342E',
    emoji: '🌱',
    title: 'Café',
    description: 'Granos premium',
  },
  'coffee': {
    color: '#4E342E',
    emoji: '🌱',
    title: 'Coffee',
    description: 'Premium beans',
  },
  'miel': {
    color: '#F57C00',
    emoji: '🌱',
    title: 'Miel',
    description: 'Miel pura',
  },
  'honey': {
    color: '#F57C00',
    emoji: '🌱',
    title: 'Honey',
    description: 'Pure honey',
  },
  'default': {
    color: '#284F66',
    emoji: '🌱',
    title: 'Cultivo',
    description: 'Agricultura sostenible',
  }
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
type PublicHomeNavigationProp = NativeStackNavigationProp<RootStackParamList, "PublicHome">;

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
  if (!name) return 'EM';
  const names = name.split(' ');
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
    displayLocation.country
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

// Main Component
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

  // Refs for animations
  const scrollX = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  // Memoized values
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
        return {
          id: cropType.id,
          name: cropType.name,
          image: getCropImage(cropType.name),
          count: counts[cropType.name] > 0 ? `${counts[cropType.name]}` : "0",
          gradient: [config.color],
          config: config,
        };
      });

      setCategories(dynamicCategories);
    } catch (error) {
      console.error("Error loading crop types:", error);
      setCategories([]);
    }
  }, []);

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

  // Memoized values (moved after callbacks to avoid dependency issues)
  const cropCounts = useMemo(() => {
    const counts: { [key: string]: number } = {};
    jobOffers.forEach((offer) => {
      if (offer.cropType && offer.cropType.name) {
        const cropName = offer.cropType.name;
        counts[cropName] = (counts[cropName] || 0) + 1;
      }
    });
    return counts;
  }, [jobOffers]);

  // Effects
  useEffect(() => {
    loadInitialData();
    animateEntry();
  }, [loadInitialData, animateEntry]);

  useEffect(() => {
    filterOffers();
  }, [filterOffers]);

  // Render functions (extracted to improve readability)
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
          style={[styles.simpleNavTab, activeTab === "nearby" && styles.simpleNavTabActive]}
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

  const renderSearchSection = () => (
    <View style={styles.searchContainer}>
      <View style={styles.searchInput}>
        <Ionicons name="search" size={20} color={COLORS.textTertiary} />
        <TextInput
          style={styles.searchField}
          placeholder="Buscar ofertas..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor={COLORS.textTertiary}
        />
        {activeTab === "nearby" && (
          <TouchableOpacity onPress={() => setShowFilters(true)}>
            <Ionicons name="options-outline" size={20} color={COLORS.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {activeTab === "nearby" && selectedCountry && (
        <View style={styles.filterChip}>
          <Text style={styles.filterChipText}>{selectedCountry}</Text>
          <TouchableOpacity onPress={() => setSelectedCountry("")}>
            <Ionicons name="close" size={16} color={COLORS.background} />
          </TouchableOpacity>
        </View>
      )}

      {activeTab === "nearby" && !selectedCountry && (
        <View style={styles.countryPrompt}>
          <Ionicons name="flag-outline" size={20} color={COLORS.accent} />
          <View style={styles.promptContent}>
            <Text style={styles.promptTitle}>Selecciona tu país</Text>
            <Text style={styles.promptSubtitle}>Para ver ofertas cercanas</Text>
          </View>
          <TouchableOpacity
            style={styles.promptButton}
            onPress={() => setShowFilters(true)}>
            <Text style={styles.promptButtonText}>Seleccionar</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  const renderStatsCard = () => (
    <View style={styles.statsContainer}>
      <View style={styles.statItem}>
        <Text style={styles.statNumber}>{filteredOffers.length}</Text>
        <Text style={styles.statLabel}>Ofertas</Text>
      </View>
      <View style={styles.statDivider} />
      <View style={styles.statItem}>
        <Text style={styles.statNumber}>{categories.length}</Text>
        <Text style={styles.statLabel}>Cultivos</Text>
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

  const renderFeaturedOffer = ({ item }: { item: JobOfferData }) => {
    const cropConfig = getCropConfig(item.cropType?.name || "");
    const employerName = getEmployerName(item.employer);
    const initials = getInitials(employerName);
    const locationText = getLocationText(item);

    return (
      <View style={styles.heroCard}>
        <TouchableOpacity
          onPress={() =>
            navigation.navigate("WorkerJobOfferDetailNoAuth", {
              jobId: item.id,
              fromPublic: true,
            })
          }
          activeOpacity={0.9}>
          
          <View style={styles.heroImageContainer}>
            <Image source={getCropImage(item.cropType?.name || "")} style={styles.heroImage} />
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.7)']}
              style={styles.heroOverlay}
            />
            
            {/* Status Badge */}
            <View style={styles.statusBadge}>
              <Text style={styles.statusBadgeText}>Ofertando</Text>
            </View>

            {/* Employer Avatar - Reposicionado */}
            <View style={[styles.heroAvatar, { backgroundColor: cropConfig.color }]}>
              <Text style={styles.heroAvatarText}>{initials}</Text>
            </View>

            {/* Content Overlay with translucent background */}
            <View style={styles.heroContentContainer}>
              <View style={styles.heroContentBackground}>
                <Text style={styles.heroTitle}>{item.title}</Text>
                <View style={styles.heroTitleUnderline} />
                
                <Text style={styles.heroDetail}>
                  Sector: {item.farm?.name || 'Finca'}
                </Text>
                <Text style={styles.heroDetail}>
                  Municipio: {item.displayLocation?.city || locationText}
                </Text>
                <Text style={styles.heroDetail}>
                  Cultivo: {item.cropType?.name || 'N/A'}
                </Text>
                <Text style={styles.heroDetail}>
                  Fase: {item.phase?.name || 'N/A'}
                </Text>
              </View>
            </View>

            {/* Ver más button */}
            <TouchableOpacity style={styles.viewMoreButton}>
              <Text style={styles.viewMoreText}>Ver más</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  const renderJobCard = (item: JobOfferData, index: number) => {
    const cropConfig = getCropConfig(item.cropType?.name || "");
    const distance = getDistance(item.displayLocation?.city || "");
    const isNearbyTab = activeTab === "nearby";

    return (
      <View key={item.id} style={styles.jobCard}>
        <TouchableOpacity
          onPress={() =>
            navigation.navigate("WorkerJobOfferDetailNoAuth", {
              jobId: item.id,
              fromPublic: true,
            })
          }
          activeOpacity={0.9}>
          <View style={styles.jobHeader}>
            <View
              style={[
                styles.jobCropIndicator,
                { backgroundColor: `${cropConfig.color}15` },
              ]}>
              <Text style={styles.jobCropEmoji}>{cropConfig.emoji}</Text>
            </View>
            <View style={styles.jobHeaderContent}>
              <Text style={styles.jobTitle} numberOfLines={2}>
                {item.title}
              </Text>
              <Text style={styles.jobCompany} numberOfLines={1}>
                {getEmployerName(item.employer)}
              </Text>
              {item.farm?.name && (
                <Text style={styles.jobFarm} numberOfLines={1}>
                  {item.farm.name}
                </Text>
              )}
            </View>
            {isNearbyTab && (
              <View style={styles.distanceBadge}>
                <Text style={styles.distanceText}>
                  {distance === 0 ? "Tu ciudad" : `${distance} km`}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.jobInfo}>
            <View style={styles.jobLocation}>
              <Ionicons name="location-outline" size={14} color={COLORS.textTertiary} />
              <Text style={styles.jobLocationText}>
                {item.displayLocation?.city}, {item.displayLocation?.state}
              </Text>
              <Text style={styles.jobDate}>
                • {formatTimeAgo(item.createdAt)}
              </Text>
            </View>

            <View style={styles.jobTags}>
              <View style={[styles.cropTag, { backgroundColor: `${cropConfig.color}15` }]}>
                <Text style={[styles.cropTagText, { color: cropConfig.color }]}>
                  {cropConfig.title}
                </Text>
              </View>
              {item.phase?.name && (
                <View style={styles.phaseTag}>
                  <Text style={styles.phaseTagText}>{item.phase.name}</Text>
                </View>
              )}
            </View>
          </View>

          <View style={styles.jobFooter}>
            <Text style={styles.jobSalary}>
              {formatSalaryCompact(item.salary)}/día
            </Text>
            <View style={styles.jobBenefits}>
              {item.includesFood && (
                <View style={[styles.benefitDot, { backgroundColor: COLORS.success }]} />
              )}
              {item.includesLodging && (
                <View style={[styles.benefitDot, { backgroundColor: COLORS.accent }]} />
              )}
              <Text style={styles.applicationsText}>
                {item.applicationsCount || 0} aplicaciones
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  const renderCategoryCard = (item: JobCategory) => {
    const hasOffers = parseInt(item.count) > 0;

    return (
      <TouchableOpacity
        key={item.id}
        style={[styles.interestCard, !hasOffers && styles.categoryCardDisabled]}
        onPress={() =>
          hasOffers && navigation.navigate("CategoryJobs", { category: item.name })
        }
        activeOpacity={0.8}>
        
        <View style={styles.interestImageContainer}>
          <Image source={item.image} style={styles.interestImage} />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.8)']}
            style={styles.interestOverlay}
          />
          
          {/* Category Title */}
          <View style={styles.interestContent}>
            <Text style={styles.interestTitle}>{item.config.title}</Text>
          </View>

          {/* Avatars */}
          <View style={styles.avatarsContainer}>
            <View style={styles.avatarStack}>
              <View style={[styles.miniAvatar, { backgroundColor: '#FF6B6B', zIndex: 3, left: 0 }]}>
                <Text style={styles.miniAvatarText}>A</Text>
              </View>
              <View style={[styles.miniAvatar, { backgroundColor: '#4ECDC4', zIndex: 2, left: 16 }]}>
                <Text style={styles.miniAvatarText}>B</Text>
              </View>
              <View style={[styles.miniAvatar, { backgroundColor: '#45B7D1', zIndex: 1, left: 32 }]}>
                <Text style={styles.miniAvatarText}>C</Text>
              </View>
              <View style={[styles.countBadge, { left: 48 }]}>
                <Text style={styles.countBadgeText}>+{item.count}</Text>
              </View>
            </View>
          </View>
        </View>
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
                    selectedCountry === country && styles.countryOptionTextSelected,
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
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {renderFloatingNavigation()}

          {/* Featured Offers Section */}
          {featuredOffers.length > 0 && (
            <View style={styles.heroSection}>
              <Animated.FlatList
                data={featuredOffers.slice(0, 1)} // Only show first offer as hero
                renderItem={renderFeaturedOffer}
                keyExtractor={(item) => item.id}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.heroList}
                onScroll={Animated.event(
                  [{ nativeEvent: { contentOffset: { x: scrollX } } }],
                  { useNativeDriver: true }
                )}
                scrollEventThrottle={16}
              />
            </View>
          )}

          {/* Categories Section */}
          {activeTab === "available" && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Encuentra tu cadena de interés</Text>
              </View>

              {categories.length > 0 ? (
                <View style={styles.interestGrid}>
                  {categories.slice(0, 3).map(renderCategoryCard)}
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
                <Ionicons name="flag-outline" size={48} color={COLORS.textTertiary} />
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
                {displayOffers.map((offer, index) => renderJobCard(offer, index))}
              </View>
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="search-outline" size={48} color={COLORS.textTertiary} />
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
    </View>
  );
};

// Styles (optimized and organized)
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

  // Simple Navigation
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
    borderBottomColor: COLORS.text,
  },
  simpleNavTabText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    fontWeight: "400",
  },
  simpleNavTabTextActive: {
    color: COLORS.text,
    fontWeight: "600",
  },

  // Hero Section
  heroSection: {
    marginTop: 20,
  },
  heroList: {
    paddingHorizontal: 20,
  },
  heroCard: {
    width: width - 40,
    height: 320,
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  heroImageContainer: {
    width: "100%",
    height: "100%",
    position: "relative",
  },
  heroImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  heroOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  statusBadge: {
    position: "absolute",
    top: 20,
    right: 20,
    backgroundColor: "rgba(139, 69, 19, 0.9)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  statusBadgeText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "500",
  },
  heroAvatar: {
    position: "absolute",
    top: 16,
    left: 16,
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "#FFFFFF",
    zIndex: 3,
  },
  heroAvatarText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
  },
  heroContentContainer: {
    position: "absolute",
    bottom: 16,
    left: 16,
    right: 100,
  },
  heroContentBackground: {
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    backdropFilter: "blur(10px)",
  },
  heroTitle: {
    ...TYPOGRAPHY.title2,
    color: "#FFFFFF",
    fontWeight: "700",
    marginBottom: 6,
  },
  heroTitleUnderline: {
    width: 40,
    height: 2,
    backgroundColor: "#FFFFFF",
    marginBottom: 12,
  },
  heroDetail: {
    ...TYPOGRAPHY.callout,
    color: "#FFFFFF",
    marginBottom: 4,
    opacity: 0.9,
  },
  viewMoreButton: {
    position: "absolute",
    bottom: 20,
    right: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  viewMoreText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "500",
  },

  // Interest Cards
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
  categoryCardDisabled: {
    opacity: 0.5,
  },

  // Sections
  section: {
    marginTop: 40,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    ...TYPOGRAPHY.title3,
    color: COLORS.text,
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
  jobCard: {
    backgroundColor: COLORS.background,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  jobHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 12,
  },
  jobCropIndicator: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  jobCropEmoji: {
    fontSize: 18,
  },
  jobHeaderContent: {
    flex: 1,
  },
  jobTitle: {
    ...TYPOGRAPHY.headline,
    color: COLORS.text,
    marginBottom: 4,
  },
  jobCompany: {
    ...TYPOGRAPHY.subhead,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  jobFarm: {
    ...TYPOGRAPHY.footnote,
    color: COLORS.textTertiary,
  },
  distanceBadge: {
    backgroundColor: COLORS.gray100,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  distanceText: {
    ...TYPOGRAPHY.caption1,
    color: COLORS.textSecondary,
    fontWeight: "500",
  },
  jobInfo: {
    marginBottom: 12,
  },
  jobLocation: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 12,
    flexWrap: "wrap",
  },
  jobLocationText: {
    ...TYPOGRAPHY.footnote,
    color: COLORS.textTertiary,
  },
  jobDate: {
    ...TYPOGRAPHY.caption1,
    color: COLORS.textTertiary,
    marginLeft: 4,
  },
  jobTags: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  cropTag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  cropTagText: {
    ...TYPOGRAPHY.caption1,
    fontWeight: "600",
  },
  phaseTag: {
    backgroundColor: COLORS.gray100,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  phaseTagText: {
    ...TYPOGRAPHY.caption1,
    color: COLORS.textSecondary,
    fontWeight: "500",
  },
  jobFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  jobSalary: {
    ...TYPOGRAPHY.headline,
    color: COLORS.success,
    fontWeight: "600",
  },
  jobBenefits: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  benefitDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  applicationsText: {
    ...TYPOGRAPHY.caption1,
    color: COLORS.textSecondary,
  },

  // Modal
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