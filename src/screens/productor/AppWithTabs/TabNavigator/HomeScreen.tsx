import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useReducer,
  useRef,
} from "react";
import {
  Text,
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Alert,
  SafeAreaView,
  StatusBar,
  Animated,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

// Services imports
import { getUserData } from "../../../../services/userService";
import { useAuth } from "../../../../context/AuthContext";
import {
  getJobOffersByEmployerId,
  getActiveJobOffersByLoggedEmployerId,
} from "../../../../services/jobOffers";
import { getAvailableWorkers } from "../../../../services/workerService";
import { getFarmByemployerId } from "../../../../services/farmService";
import { getCropType } from "../../../../services/cropTypeService";

import ScreenLayout from "../../../../components/ScreenLayout";
import { getMyRatingStatsService } from "../../../../services/qualifitionService";

const { width, height } = Dimensions.get("window");

// Enhanced Design System (igual que antes...)
const DESIGN_SYSTEM = {
  colors: {
    primary: {
      50: "#f0f4f7",
      100: "#dae4ea",
      500: "#284F66",
      600: "#1e3d52",
      700: "#162d3d",
      900: "#0d1a24",
    },
    secondary: {
      50: "#faf8f3",
      100: "#f2ebe0",
      500: "#B5883E",
      600: "#a07635",
      700: "#7d5c2a",
      900: "#4a3719",
    },
    accent: {
      50: "#fef7ed",
      100: "#fed7aa",
      500: "#f97316",
      600: "#ea580c",
      700: "#c2410c",
    },
    gray: {
      50: "#f8fafc",
      100: "#f1f5f9",
      200: "#e2e8f0",
      300: "#cbd5e1",
      400: "#94a3b8",
      500: "#64748b",
      600: "#475569",
      700: "#334155",
      800: "#1e293b",
      900: "#0f172a",
    },
    success: {
      50: "#f0fdf4",
      100: "#dcfce7",
      500: "#22c55e",
      600: "#16a34a",
      700: "#15803d",
    },
    warning: {
      50: "#faf8f3",
      100: "#fef3c7",
      500: "#B5883E",
      600: "#a07635",
    },
    error: {
      50: "#fef2f2",
      100: "#fee2e2",
      500: "#ef4444",
      600: "#dc2626",
    },
    white: "#ffffff",
    black: "#000000",
    overlay: "rgba(0,0,0,0.1)",
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  borderRadius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    full: 9999,
  },
  shadows: {
    sm: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 2,
    },
    md: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
    },
    lg: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 12,
      elevation: 8,
    },
    xl: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.2,
      shadowRadius: 16,
      elevation: 12,
    },
  },
  typography: {
    h1: { fontSize: 32, fontWeight: "700", lineHeight: 40 },
    h2: { fontSize: 24, fontWeight: "600", lineHeight: 32 },
    h3: { fontSize: 20, fontWeight: "600", lineHeight: 28 },
    h4: { fontSize: 18, fontWeight: "600", lineHeight: 24 },
    body: { fontSize: 16, fontWeight: "400", lineHeight: 24 },
    bodyMedium: { fontSize: 14, fontWeight: "500", lineHeight: 20 },
    caption: { fontSize: 12, fontWeight: "400", lineHeight: 16 },
    captionMedium: { fontSize: 12, fontWeight: "500", lineHeight: 16 },
  },
};

// Enhanced crop type configurations (igual que antes...)
const CROP_CONFIGS = {
  Cacao: {
    gradient: ["#8B4513", "#A0522D"],
    icon: "leaf-outline",
    lightColor: "#F5E6D3",
    darkColor: "#8B4513",
  },
  Café: {
    gradient: ["#6B4423", "#8B4513"],
    icon: "cafe-outline",
    lightColor: "#F0E6D2",
    darkColor: "#6B4423",
  },
  Aguacate: {
    gradient: ["#228B22", "#32CD32"],
    icon: "nutrition-outline",
    lightColor: "#F0FFF0",
    darkColor: "#228B22",
  },
  Plátano: {
    gradient: ["#FFD700", "#FFA500"],
    icon: "flower-outline",
    lightColor: "#FFFACD",
    darkColor: "#FFD700",
  },
  Maíz: {
    gradient: ["#DAA520", "#FFD700"],
    icon: "storefront-outline",
    lightColor: "#FFFACD",
    darkColor: "#DAA520",
  },
  Arroz: {
    gradient: ["#F5DEB3", "#D2B48C"],
    icon: "grain-outline",
    lightColor: "#FFF8DC",
    darkColor: "#D2B48C",
  },
};

const TABS = {
  DASHBOARD: "dashboard",
  OFFERS: "offers",
};

// ✅ ACTUALIZAR STATE INICIAL PARA INCLUIR DATOS DE EVALUACIÓN
const initialState = {
  userData: null,
  myJobOffers: [],
  allJobOffers: [],
  availableWorkers: [],
  farmsData: [],
  cropTypes: [],
  // ✅ NUEVO: Estado para evaluaciones
  ratingData: {
    hasRatings: false,
    averageRating: 0,
    totalRatings: 0,
    roleType: null,
    loading: true,
  },
  dashboardStats: {
    employerRating: 0, // ✅ CAMBIAR: Ahora será dinámico
    totalOffers: 0,
    activeOffers: 0,
    totalApplications: 0,
    totalFarms: 0,
    totalHectares: 0,
    totalPlants: 0,
    workersPerFarm: 0,
    offersPerFarm: 0,
    monthlyOffers: 0,
  },
  loading: true,
  refreshing: false,
  error: null,
};

const actionTypes = {
  SET_LOADING: "SET_LOADING",
  SET_REFRESHING: "SET_REFRESHING",
  SET_ERROR: "SET_ERROR",
  SET_USER_DATA: "SET_USER_DATA",
  SET_JOB_OFFERS: "SET_JOB_OFFERS",
  SET_ALL_JOB_OFFERS: "SET_ALL_JOB_OFFERS",
  SET_FARMS_DATA: "SET_FARMS_DATA",
  SET_CROP_TYPES: "SET_CROP_TYPES",
  SET_AVAILABLE_WORKERS: "SET_AVAILABLE_WORKERS",
  SET_DASHBOARD_STATS: "SET_DASHBOARD_STATS",
  // ✅ NUEVO: Acción para datos de evaluación
  SET_RATING_DATA: "SET_RATING_DATA",
  RESET_STATE: "RESET_STATE",
};

function dashboardReducer(state, action) {
  switch (action.type) {
    case actionTypes.SET_LOADING:
      return { ...state, loading: action.payload };
    case actionTypes.SET_REFRESHING:
      return { ...state, refreshing: action.payload };
    case actionTypes.SET_ERROR:
      return { ...state, error: action.payload };
    case actionTypes.SET_USER_DATA:
      return { ...state, userData: action.payload };
    case actionTypes.SET_JOB_OFFERS:
      return { ...state, myJobOffers: action.payload };
    case actionTypes.SET_ALL_JOB_OFFERS:
      return { ...state, allJobOffers: action.payload };
    case actionTypes.SET_FARMS_DATA:
      return { ...state, farmsData: action.payload };
    case actionTypes.SET_CROP_TYPES:
      return { ...state, cropTypes: action.payload };
    case actionTypes.SET_AVAILABLE_WORKERS:
      return { ...state, availableWorkers: action.payload };
    case actionTypes.SET_DASHBOARD_STATS:
      return { ...state, dashboardStats: action.payload };
    // ✅ NUEVO: Reducer para datos de evaluación
    case actionTypes.SET_RATING_DATA:
      return { ...state, ratingData: action.payload };
    case actionTypes.RESET_STATE:
      return initialState;
    default:
      return state;
  }
}

// Enhanced Components (mismos que antes, pero actualizar EnhancedRatingCard)

const ModernHeader = React.memo(({ user, onProfilePress }) => (
  <View style={styles.header}>
    <StatusBar
      barStyle="dark-content"
      backgroundColor={DESIGN_SYSTEM.colors.white}
    />
    <LinearGradient
      colors={[DESIGN_SYSTEM.colors.white, DESIGN_SYSTEM.colors.gray[50]]}
      style={styles.headerGradient}>
      <View style={styles.headerContent}>
        <View style={styles.headerLeft}>
          <Text style={styles.greetingText}>
            Hola,{" "}
            <Text style={styles.userName}>{user?.name || "Productor"}</Text>
          </Text>
          <Text style={styles.roleText}>
            <Ionicons
              name="shield-checkmark"
              size={14}
              color={DESIGN_SYSTEM.colors.success[600]}
            />{" "}
            {user?.role?.name || "Empleador"} • Panel de Control
          </Text>
        </View>
        <TouchableOpacity style={styles.profileButton} onPress={onProfilePress}>
          <LinearGradient
            colors={[
              DESIGN_SYSTEM.colors.primary[500],
              DESIGN_SYSTEM.colors.primary[600],
            ]}
            style={styles.profileAvatar}>
            <Text style={styles.profileInitial}>
              {user?.name?.charAt(0)?.toUpperCase() || "P"}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  </View>
));

const ModernTabs = React.memo(({ activeTab, setActiveTab }) => (
  <View style={styles.tabsContainer}>
    <View style={styles.tabsWrapper}>
      {Object.values(TABS).map((tab) => {
        const isActive = activeTab === tab;
        return (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, isActive && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
            activeOpacity={0.7}>
            {isActive && <View style={styles.tabActiveIndicator} />}
            <Ionicons
              name={tab === TABS.DASHBOARD ? "home" : "briefcase"}
              size={18}
              color={
                isActive
                  ? DESIGN_SYSTEM.colors.primary[600]
                  : DESIGN_SYSTEM.colors.gray[500]
              }
            />
            <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
              {tab === TABS.DASHBOARD ? "Dashboard" : "Ofertas"}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  </View>
));

const EnhancedStatsCard = React.memo(
  ({ title, value, subtitle, icon, color, trend }) => (
    <View style={styles.enhancedStatsCard}>
      <View style={styles.statsCardGradient}>
        <View style={styles.statsCardHeader}>
          <View
            style={[
              styles.statsIconContainer,
              { backgroundColor: color + "15" },
            ]}>
            <LinearGradient
              colors={[color + "20", color + "10"]}
              style={styles.statsIconGradient}>
              <Ionicons name={icon} size={24} color={color} />
            </LinearGradient>
          </View>
          <View style={styles.statsInfo}>
            <Text style={styles.statsValue}>{value}</Text>
            <Text style={styles.statsTitle}>{title}</Text>
          </View>
        </View>

        {subtitle && <Text style={styles.statsSubtitle}>{subtitle}</Text>}

        {trend && (
          <View style={styles.statsTrend}>
            <View
              style={[
                styles.trendIndicator,
                {
                  backgroundColor:
                    trend.direction === "up"
                      ? DESIGN_SYSTEM.colors.success[50]
                      : DESIGN_SYSTEM.colors.error[50],
                },
              ]}>
              <Ionicons
                name={
                  trend.direction === "up" ? "trending-up" : "trending-down"
                }
                size={12}
                color={
                  trend.direction === "up"
                    ? DESIGN_SYSTEM.colors.success[600]
                    : DESIGN_SYSTEM.colors.error[600]
                }
              />
            </View>
            <Text
              style={[
                styles.statsTrendText,
                {
                  color:
                    trend.direction === "up"
                      ? DESIGN_SYSTEM.colors.success[600]
                      : DESIGN_SYSTEM.colors.error[600],
                },
              ]}>
              {trend.text}
            </Text>
          </View>
        )}
      </View>
    </View>
  )
);

// ✅ ACTUALIZAR EnhancedRatingCard para usar datos reales
const EnhancedRatingCard = React.memo(({ ratingData }) => {
  const { hasRatings, averageRating, totalRatings, loading, roleType } = ratingData;

  if (loading) {
    return (
      <View style={styles.enhancedRatingCard}>
        <LinearGradient
          colors={[
            DESIGN_SYSTEM.colors.secondary[500],
            DESIGN_SYSTEM.colors.secondary[600],
            DESIGN_SYSTEM.colors.secondary[700],
          ]}
          style={styles.ratingGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}>
          <View style={styles.ratingOverlay}>
            <View style={styles.ratingContent}>
              <ActivityIndicator 
                size="small" 
                color={DESIGN_SYSTEM.colors.white} 
              />
              <Text style={styles.ratingLoadingText}>
                Cargando calificaciones...
              </Text>
            </View>
          </View>
        </LinearGradient>
      </View>
    );
  }

  return (
    <View style={styles.enhancedRatingCard}>
      <LinearGradient
        colors={[
          DESIGN_SYSTEM.colors.secondary[500],
          DESIGN_SYSTEM.colors.secondary[600],
          DESIGN_SYSTEM.colors.secondary[700],
        ]}
        style={styles.ratingGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}>
        <View style={styles.ratingOverlay}>
          <View style={styles.ratingContent}>
            <View style={styles.ratingHeader}>
              <View style={styles.ratingIconContainer}>
                <Ionicons
                  name="star"
                  size={28}
                  color={DESIGN_SYSTEM.colors.white}
                />
              </View>
              <Text style={styles.ratingTitle}>Mi Calificación</Text>
            </View>

            {hasRatings ? (
              <>
                <View style={styles.ratingScore}>
                  <Text style={styles.ratingNumber}>{averageRating.toFixed(1)}</Text>
                  <View style={styles.ratingStars}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <View key={star} style={styles.starContainer}>
                        <Ionicons
                          name={star <= Math.floor(averageRating) ? "star" : "star-outline"}
                          size={18}
                          color={DESIGN_SYSTEM.colors.white}
                          style={{ opacity: star <= Math.floor(averageRating) ? 1 : 0.6 }}
                        />
                      </View>
                    ))}
                  </View>
                </View>

                <Text style={styles.ratingSubtext}>
                  Basado en {totalRatings} evaluación{totalRatings !== 1 ? 'es' : ''} 
                  {roleType === 'Productor' ? ' de trabajadores' : ' de empleadores'}
                </Text>
              </>
            ) : (
              <>
                <View style={styles.ratingScore}>
                  <Text style={styles.ratingNumber}>--</Text>
                  <View style={styles.ratingStars}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <View key={star} style={styles.starContainer}>
                        <Ionicons
                          name="star-outline"
                          size={18}
                          color={DESIGN_SYSTEM.colors.white}
                          style={{ opacity: 0.6 }}
                        />
                      </View>
                    ))}
                  </View>
                </View>

                <Text style={styles.ratingSubtext}>
                  Aún no has recibido evaluaciones
                </Text>
              </>
            )}
          </View>
        </View>
      </LinearGradient>
    </View>
  );
});

// Resto de componentes igual...
const EnhancedQuickActionButton = React.memo(
  ({ title, icon, color, onPress }) => (
    <TouchableOpacity
      style={styles.enhancedQuickActionButton}
      onPress={onPress}
      activeOpacity={0.8}>
      <LinearGradient
        colors={[color, color + "DD", color + "BB"]}
        style={styles.quickActionGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}>
        <View style={styles.quickActionIconContainer}>
          <Ionicons name={icon} size={28} color={DESIGN_SYSTEM.colors.white} />
        </View>
        <Text style={styles.quickActionText}>{title}</Text>
        <View style={styles.quickActionArrow}>
          <Ionicons
            name="arrow-forward"
            size={16}
            color={DESIGN_SYSTEM.colors.white}
          />
        </View>
      </LinearGradient>
    </TouchableOpacity>
  )
);

// Enhanced Offer Card (igual que antes...)
const EnhancedOfferCard = React.memo(
  ({ offer, onPress, isMyOffer = false }) => {
    const cropConfig = CROP_CONFIGS[offer.cropType?.name || offer.cropType] || {
      gradient: [
        DESIGN_SYSTEM.colors.primary[500],
        DESIGN_SYSTEM.colors.primary[600],
      ],
      icon: "leaf-outline",
      lightColor: DESIGN_SYSTEM.colors.primary[50],
      darkColor: DESIGN_SYSTEM.colors.primary[500],
    };

    const animatedValue = useRef(new Animated.Value(0)).current;

    useEffect(() => {
      Animated.timing(animatedValue, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }, []);

    return (
      <Animated.View
        style={[
          styles.enhancedOfferCard,
          isMyOffer && styles.myOfferCard,
          {
            opacity: animatedValue,
            transform: [
              {
                translateY: animatedValue.interpolate({
                  inputRange: [0, 1],
                  outputRange: [20, 0],
                }),
              },
            ],
          },
        ]}>
        <TouchableOpacity
          onPress={onPress}
          activeOpacity={0.9}
          style={styles.offerCardTouchable}>
          <LinearGradient
            colors={[
              DESIGN_SYSTEM.colors.white,
              DESIGN_SYSTEM.colors.gray[25] || "#fefefe",
            ]}
            style={styles.offerCardBackground}>
            <View style={styles.enhancedOfferHeader}>
              <LinearGradient
                colors={cropConfig.gradient}
                style={styles.cropTypeHeader}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}>
                <View style={styles.cropTypeContent}>
                  <View style={styles.cropIconContainer}>
                    <Ionicons
                      name={cropConfig.icon}
                      size={20}
                      color={DESIGN_SYSTEM.colors.white}
                    />
                  </View>
                  <Text style={styles.cropTypeText}>
                    {offer.cropType?.name || offer.cropType}
                  </Text>
                </View>
                {isMyOffer && (
                  <View style={styles.myOfferBadgeHeader}>
                    <Ionicons
                      name="checkmark-circle"
                      size={16}
                      color={DESIGN_SYSTEM.colors.white}
                    />
                    <Text style={styles.myOfferBadgeHeaderText}>Mi Oferta</Text>
                  </View>
                )}
              </LinearGradient>
            </View>

            <View style={styles.enhancedOfferContent}>
              <Text style={styles.enhancedOfferTitle} numberOfLines={2}>
                {offer.title}
              </Text>

              <View style={styles.enhancedOfferLocation}>
                <View style={styles.locationIconContainer}>
                  <Ionicons
                    name="location"
                    size={16}
                    color={cropConfig.darkColor}
                  />
                </View>
                <Text style={styles.enhancedLocationText}>
                  {offer.displayLocation?.city || offer.city},{" "}
                  {offer.displayLocation?.department || offer.state}
                </Text>
              </View>

              <View style={styles.enhancedOfferDetails}>
                <View style={styles.offerDetailItem}>
                  <Ionicons
                    name="calendar-outline"
                    size={16}
                    color={DESIGN_SYSTEM.colors.gray[500]}
                  />
                  <Text style={styles.offerDetailText}>
                    {offer.duration} días
                  </Text>
                </View>

                <View style={styles.offerDetailItem}>
                  <Ionicons
                    name="cash-outline"
                    size={16}
                    color={DESIGN_SYSTEM.colors.gray[500]}
                  />
                  <Text style={styles.offerDetailText}>
                    ${offer.salary?.toLocaleString()}/día
                  </Text>
                </View>

                {isMyOffer && (
                  <View style={styles.offerDetailItem}>
                    <Ionicons
                      name="people-outline"
                      size={16}
                      color={DESIGN_SYSTEM.colors.gray[500]}
                    />
                    <Text style={styles.offerDetailText}>
                      {offer.applicationsCount || 0} aplicaciones
                    </Text>
                  </View>
                )}
              </View>

              {(offer.includesFood || offer.includesLodging) && (
                <View style={styles.enhancedOfferBenefits}>
                  <Text style={styles.benefitsTitle}>
                    Beneficios incluidos:
                  </Text>
                  <View style={styles.benefitsContainer}>
                    {offer.includesFood && (
                      <View style={styles.enhancedBenefitBadge}>
                        <LinearGradient
                          colors={[
                            DESIGN_SYSTEM.colors.success[500],
                            DESIGN_SYSTEM.colors.success[600],
                          ]}
                          style={styles.benefitBadgeGradient}>
                          <Ionicons
                            name="restaurant"
                            size={14}
                            color={DESIGN_SYSTEM.colors.white}
                          />
                          <Text style={styles.enhancedBenefitText}>Comida</Text>
                        </LinearGradient>
                      </View>
                    )}
                    {offer.includesLodging && (
                      <View style={styles.enhancedBenefitBadge}>
                        <LinearGradient
                          colors={[
                            DESIGN_SYSTEM.colors.primary[500],
                            DESIGN_SYSTEM.colors.primary[600],
                          ]}
                          style={styles.benefitBadgeGradient}>
                          <Ionicons
                            name="home"
                            size={14}
                            color={DESIGN_SYSTEM.colors.white}
                          />
                          <Text style={styles.enhancedBenefitText}>
                            Hospedaje
                          </Text>
                        </LinearGradient>
                      </View>
                    )}
                  </View>
                </View>
              )}

              <View style={styles.offerCardFooter}>
                <Text style={styles.offerTimeAgo}>Publicado hace 2 días</Text>
                <View style={styles.actionIndicator}>
                  <Text style={styles.actionText}>Ver detalles</Text>
                  <Ionicons
                    name="arrow-forward"
                    size={16}
                    color={cropConfig.darkColor}
                  />
                </View>
              </View>
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    );
  }
);

// Enhanced Search Bar y Filter Chip (iguales que antes...)
const EnhancedSearchBar = React.memo(({ value, onChangeText, placeholder }) => (
  <View style={styles.enhancedSearchContainer}>
    <LinearGradient
      colors={[DESIGN_SYSTEM.colors.white, DESIGN_SYSTEM.colors.gray[50]]}
      style={styles.searchGradient}>
      <View style={styles.searchIconContainer}>
        <Ionicons
          name="search"
          size={20}
          color={DESIGN_SYSTEM.colors.primary[600]}
        />
      </View>
      <TextInput
        style={styles.enhancedSearchInput}
        placeholder={placeholder}
        value={value}
        onChangeText={onChangeText}
        placeholderTextColor={DESIGN_SYSTEM.colors.gray[400]}
      />
      {value ? (
        <TouchableOpacity
          onPress={() => onChangeText("")}
          style={styles.clearButton}>
          <Ionicons
            name="close-circle"
            size={20}
            color={DESIGN_SYSTEM.colors.gray[400]}
          />
        </TouchableOpacity>
      ) : null}
    </LinearGradient>
  </View>
));

const EnhancedFilterChip = React.memo(({ title, isActive, onPress }) => (
  <TouchableOpacity
    style={styles.enhancedFilterChip}
    onPress={onPress}
    activeOpacity={0.7}>
    <LinearGradient
      colors={
        isActive
          ? [
              DESIGN_SYSTEM.colors.primary[500],
              DESIGN_SYSTEM.colors.primary[600],
            ]
          : [DESIGN_SYSTEM.colors.white, DESIGN_SYSTEM.colors.gray[50]]
      }
      style={styles.filterChipGradient}>
      <Text
        style={[
          styles.enhancedFilterChipText,
          isActive && styles.filterChipTextActive,
        ]}>
        {title}
      </Text>
      {isActive && (
        <Ionicons
          name="checkmark"
          size={16}
          color={DESIGN_SYSTEM.colors.white}
        />
      )}
    </LinearGradient>
  </TouchableOpacity>
));

// ✅ ACTUALIZAR Custom Hook para incluir carga de evaluaciones
const useEmployerData = (user) => {
  const [state, dispatch] = useReducer(dashboardReducer, initialState);
  const isInitializedRef = useRef(false);
  const userIdRef = useRef(user?.id);

  useEffect(() => {
    userIdRef.current = user?.id;
  }, [user?.id]);

  // ✅ NUEVA FUNCIÓN: Cargar evaluaciones del usuario
  const loadMyRatings = useCallback(async () => {
    try {
      dispatch({
        type: actionTypes.SET_RATING_DATA,
        payload: { ...state.ratingData, loading: true },
      });

      const response = await getMyRatingStatsService();
      
      if (response.success) {
        dispatch({
          type: actionTypes.SET_RATING_DATA,
          payload: {
            ...response.data,
            loading: false,
          },
        });
      } else {
        // Si no hay datos, establecer valores por defecto
        dispatch({
          type: actionTypes.SET_RATING_DATA,
          payload: {
            hasRatings: false,
            averageRating: 0,
            totalRatings: 0,
            roleType: user?.role?.name || null,
            loading: false,
          },
        });
      }
    } catch (error) {
      console.error("Error cargando evaluaciones:", error);
      // En caso de error, establecer valores por defecto
      dispatch({
        type: actionTypes.SET_RATING_DATA,
        payload: {
          hasRatings: false,
          averageRating: 0,
          totalRatings: 0,
          roleType: user?.role?.name || null,
          loading: false,
        },
      });
    }
  }, [user?.role?.name]);

  // Resto de funciones igual que antes...
  const fetchUserData = useCallback(async () => {
    try {
      if (!userIdRef.current) {
        throw new Error("No hay usuario autenticado");
      }
      const userData = await getUserData(userIdRef.current);
      dispatch({ type: actionTypes.SET_USER_DATA, payload: userData });
      await AsyncStorage.setItem("@user_data", JSON.stringify(userData));
      return userData;
    } catch (error) {
      console.error("Error obteniendo datos del usuario:", error);
      const storedUserData = await AsyncStorage.getItem("@user_data");
      if (storedUserData) {
        const parsedData = JSON.parse(storedUserData);
        dispatch({ type: actionTypes.SET_USER_DATA, payload: parsedData });
        return parsedData;
      }
      throw error;
    }
  }, []);

  const getEmployerId = useCallback(
    async (userData = null) => {
      try {
        let employerData = userData || state.userData;
        if (!employerData) {
          employerData = await fetchUserData();
        }
        if (!employerData?.employerProfile) {
          throw new Error("El usuario no tiene perfil de empleador");
        }
        return employerData.employerProfile.id;
      } catch (error) {
        console.error("Error obteniendo ID del empleador:", error);
        throw error;
      }
    },
    [state.userData, fetchUserData]
  );

  const loadEmployerFarms = useCallback(
    async (userData = null) => {
      try {
        const employerId = await getEmployerId(userData);
        try {
          const farmsResponse = await getFarmByemployerId(employerId);
          dispatch({
            type: actionTypes.SET_FARMS_DATA,
            payload: farmsResponse?.data || [],
          });
        } catch (apiError) {
          const simulatedFarms = [
            {
              id: "1",
              name: "Finca La Esperanza",
              size: 25.5,
              plantCount: 1200,
              workers: 8,
              offers: 3,
              cropTypesInfo: [{ name: "Cacao" }],
              locationString: "Fortul, Arauca, Colombia",
            },
            {
              id: "2",
              name: "Finca El Progreso",
              size: 18.2,
              plantCount: 850,
              workers: 6,
              offers: 2,
              cropTypesInfo: [{ name: "Café" }],
              locationString: "Tame, Arauca, Colombia",
            },
          ];
          dispatch({
            type: actionTypes.SET_FARMS_DATA,
            payload: simulatedFarms,
          });
        }
      } catch (error) {
        console.error("Error cargando fincas del empleador:", error);
        dispatch({ type: actionTypes.SET_FARMS_DATA, payload: [] });
      }
    },
    [getEmployerId]
  );

  const loadMyJobOffers = useCallback(
    async (userData = null) => {
      try {
        const employerId = await getEmployerId(userData);
        const jobOffersData = await getJobOffersByEmployerId(employerId);
        dispatch({
          type: actionTypes.SET_JOB_OFFERS,
          payload: jobOffersData || [],
        });
      } catch (error) {
        console.error("Error cargando mis ofertas:", error);
        dispatch({ type: actionTypes.SET_ERROR, payload: error.message });
      }
    },
    [getEmployerId]
  );

  const loadAllJobOffers = useCallback(async () => {
    try {
      let allOffersData = [];
      try {
        allOffersData = await getActiveJobOffersByLoggedEmployerId();
      } catch (error) {
        console.error("Error cargando todas las ofertas:", error);
        allOffersData = [
          {
            id: "1",
            title: "Recolección de Cacao en Finca La Esperanza",
            cropType: "Cacao",
            city: "Fortul",
            state: "Arauca",
            duration: 15,
            salary: 50000,
            includesFood: true,
            includesLodging: false,
            applicationsCount: 5,
            createdAt: new Date().toISOString(),
          },
          {
            id: "2",
            title: "Cosecha de Café Orgánico",
            cropType: "Café",
            city: "Tame",
            state: "Arauca",
            duration: 20,
            salary: 60000,
            includesFood: true,
            includesLodging: true,
            applicationsCount: 8,
            createdAt: new Date().toISOString(),
          },
          {
            id: "3",
            title: "Mantenimiento de Cultivo de Aguacate",
            cropType: "Aguacate",
            city: "Saravena",
            state: "Arauca",
            duration: 10,
            salary: 45000,
            includesFood: false,
            includesLodging: false,
            applicationsCount: 3,
            createdAt: new Date().toISOString(),
          },
        ];
      }
      dispatch({
        type: actionTypes.SET_ALL_JOB_OFFERS,
        payload: allOffersData || [],
      });
    } catch (error) {
      console.error("Error cargando todas las ofertas:", error);
      dispatch({ type: actionTypes.SET_ALL_JOB_OFFERS, payload: [] });
    }
  }, []);

  const loadCropTypes = useCallback(async () => {
    try {
      const data = await getCropType();
      let cropTypesData = [];

      if (data?.success && Array.isArray(data.data)) {
        cropTypesData = data.data;
      } else if (data?.cropTypes && Array.isArray(data.cropTypes)) {
        cropTypesData = data.cropTypes;
      } else if (Array.isArray(data)) {
        cropTypesData = data;
      }

      dispatch({ type: actionTypes.SET_CROP_TYPES, payload: cropTypesData });
    } catch (error) {
      console.error("Error loading crop types:", error);
      dispatch({ type: actionTypes.SET_CROP_TYPES, payload: [] });
    }
  }, []);

  const loadAvailableWorkers = useCallback(async () => {
    try {
      const workers = await getAvailableWorkers();
      dispatch({
        type: actionTypes.SET_AVAILABLE_WORKERS,
        payload: workers || [],
      });
    } catch (error) {
      console.error("Error cargando trabajadores:", error);
    }
  }, []);

  // ✅ ACTUALIZAR loadAllData para incluir carga de evaluaciones
  const loadAllData = useCallback(
    async (isRefreshing = false) => {
      try {
        if (!isRefreshing) {
          dispatch({ type: actionTypes.SET_LOADING, payload: true });
        }
        dispatch({ type: actionTypes.SET_ERROR, payload: null });

        const userData = await fetchUserData();
        await loadEmployerFarms(userData);
        
        // ✅ AGREGAR carga de evaluaciones
        await Promise.all([
          loadAvailableWorkers(),
          loadCropTypes(),
          loadMyJobOffers(userData),
          loadAllJobOffers(),
          loadMyRatings(), // ← NUEVA FUNCIÓN
        ]);
      } catch (error) {
        console.error("Error cargando datos:", error);
        dispatch({
          type: actionTypes.SET_ERROR,
          payload: error.message || "Error al cargar los datos",
        });
      } finally {
        dispatch({ type: actionTypes.SET_LOADING, payload: false });
        dispatch({ type: actionTypes.SET_REFRESHING, payload: false });
      }
    },
    [
      fetchUserData,
      loadEmployerFarms,
      loadAvailableWorkers,
      loadCropTypes,
      loadMyJobOffers,
      loadAllJobOffers,
      loadMyRatings, // ← NUEVA DEPENDENCIA
    ]
  );

  // ✅ ACTUALIZAR cálculo de stats para usar evaluación real
  useEffect(() => {
    if (
      state.myJobOffers &&
      state.farmsData &&
      state.userData &&
      state.availableWorkers &&
      state.ratingData
    ) {
      const calculateDashboardStats = (
        jobOffers,
        farms,
        userData,
        availableWorkers,
        ratingData
      ) => {
        const offersArray = Array.isArray(jobOffers) ? jobOffers : [];
        const farmsArray = Array.isArray(farms) ? farms : [];
        const availableWorkersArray = Array.isArray(availableWorkers)
          ? availableWorkers
          : [];

        const totalOffers = offersArray.length;
        const activeOffers = offersArray.filter(
          (offer) => offer.status === "Activo" || offer.status === "activo"
        ).length;
        const totalApplications = offersArray.reduce(
          (sum, offer) => sum + (offer.applicationsCount || 0),
          0
        );

        const currentMonth = new Date().getMonth();
        const monthlyOffers = offersArray.filter((offer) => {
          if (!offer.createdAt) return false;
          const offerMonth = new Date(offer.createdAt).getMonth();
          return offerMonth === currentMonth;
        }).length;

        const totalFarms = farmsArray.length;
        const totalHectares = farmsArray.reduce(
          (sum, farm) => sum + (farm.size || 0),
          0
        );
        const totalPlants = farmsArray.reduce(
          (sum, farm) => sum + (farm.plantCount || 0),
          0
        );

        const totalWorkers = availableWorkersArray.length;

        const farmOffers = offersArray.filter((offer) => offer.farmId);
        const offersPerFarm =
          totalFarms > 0 ? Math.round(farmOffers.length / totalFarms) : 0;
        const workersPerFarm =
          totalFarms > 0 ? Math.round(totalWorkers / totalFarms) : 0;

        return {
          // ✅ USAR evaluación real en lugar de hardcodeada
          employerRating: ratingData.hasRatings ? ratingData.averageRating : 0,
          totalOffers,
          activeOffers,
          totalApplications,
          totalFarms,
          totalHectares,
          totalPlants,
          totalWorkers,
          workersPerFarm,
          offersPerFarm,
          monthlyOffers,
        };
      };
      
      const newStats = calculateDashboardStats(
        state.myJobOffers,
        state.farmsData,
        state.userData,
        state.availableWorkers,
        state.ratingData // ← NUEVO parámetro
      );
      dispatch({ type: actionTypes.SET_DASHBOARD_STATS, payload: newStats });
    }
  }, [
    state.myJobOffers,
    state.farmsData,
    state.userData,
    state.availableWorkers,
    state.ratingData, // ← NUEVA DEPENDENCIA
  ]);

  useEffect(() => {
    if (userIdRef.current && !isInitializedRef.current) {
      isInitializedRef.current = true;
      loadAllData().catch((error) => {
        console.error("Error cargando datos iniciales:", error);
        dispatch({
          type: actionTypes.SET_ERROR,
          payload: "Error al cargar los datos. Por favor, intenta de nuevo.",
        });
        dispatch({ type: actionTypes.SET_LOADING, payload: false });
        isInitializedRef.current = false;
      });
    }
  }, [loadAllData]);

  const onRefresh = useCallback(() => {
    dispatch({ type: actionTypes.SET_REFRESHING, payload: true });
    loadAllData(true);
  }, [loadAllData]);

  return { state, dispatch, onRefresh };
};

// Main Component
export default function HomeScreen({ navigation }) {
  const { user } = useAuth();
  const { state, onRefresh } = useEmployerData(user);
  const [activeTab, setActiveTab] = useState(TABS.DASHBOARD);
  const [selectedCropType, setSelectedCropType] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const handleQuickActionPress = useCallback(
    (action) => {
      if (action.params) {
        navigation.navigate(action.route, action.params);
      } else {
        navigation.navigate(action.route);
      }
    },
    [navigation]
  );

  // Resto de useMemo igual que antes...
  const combinedOffers = useMemo(() => {
    const myOffers = Array.isArray(state.myJobOffers) ? state.myJobOffers : [];
    const allOffers = Array.isArray(state.allJobOffers)
      ? state.allJobOffers
      : [];

    const myOfferIds = new Set(myOffers.map((offer) => offer.id));

    const processedOffers = allOffers.map((offer) => ({
      ...offer,
      isMyOffer: myOfferIds.has(offer.id),
    }));

    myOffers.forEach((myOffer) => {
      if (!allOffers.some((offer) => offer.id === myOffer.id)) {
        processedOffers.push({
          ...myOffer,
          isMyOffer: true,
        });
      }
    });

    return processedOffers;
  }, [state.myJobOffers, state.allJobOffers]);

  const filteredOffers = useMemo(() => {
    const offers = Array.isArray(combinedOffers) ? combinedOffers : [];
    let filtered = [...offers];

    if (searchQuery) {
      filtered = filtered.filter(
        (offer) =>
          offer.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          offer.cropType?.name
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          offer.cropType?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedCropType) {
      filtered = filtered.filter(
        (offer) =>
          offer.cropType?.name === selectedCropType ||
          offer.cropType === selectedCropType
      );
    }

    if (selectedLocation) {
      filtered = filtered.filter(
        (offer) =>
          offer.displayLocation?.city
            ?.toLowerCase()
            .includes(selectedLocation.toLowerCase()) ||
          offer.city?.toLowerCase().includes(selectedLocation.toLowerCase()) ||
          offer.displayLocation?.department
            ?.toLowerCase()
            .includes(selectedLocation.toLowerCase()) ||
          offer.state?.toLowerCase().includes(selectedLocation.toLowerCase())
      );
    }

    return filtered.sort((a, b) => {
      if (a.isMyOffer && !b.isMyOffer) return -1;
      if (!a.isMyOffer && b.isMyOffer) return 1;
      return 0;
    });
  }, [combinedOffers, selectedCropType, selectedLocation, searchQuery]);

  const quickActions = useMemo(
    () => [
      {
        title: "Agregar Finca",
        icon: "map",
        color: DESIGN_SYSTEM.colors.success[600],
        route: "AddTerrain",
      },
      {
        title: "Nueva Oferta",
        icon: "add-circle",
        color: DESIGN_SYSTEM.colors.primary[600],
        route: "CreateJobOffer",
      },
      {
        title: "Trabajadores",
        icon: "people",
        color: DESIGN_SYSTEM.colors.accent[600],
        route: "WorkerList",
      },
    ],
    [state.userData]
  );

  const statsData = useMemo(
    () => [
      {
        title: "Ofertas Totales",
        value: state.dashboardStats.totalOffers,
        subtitle: `${state.dashboardStats.activeOffers} activas`,
        icon: "briefcase",
        color: DESIGN_SYSTEM.colors.primary[600],
        trend: {
          direction: "up",
          text: `+${state.dashboardStats.monthlyOffers} este mes`,
        },
      },
      {
        title: "Fincas",
        value: state.dashboardStats.totalFarms,
        subtitle: `${state.dashboardStats.totalHectares.toFixed(1)} hectáreas`,
        icon: "leaf",
        color: DESIGN_SYSTEM.colors.success[600],
      },
      {
        title: "Postulados",
        value:
          state.dashboardStats.totalApplications > 999
            ? `${(state.dashboardStats.totalApplications / 1000).toFixed(1)}K`
            : state.dashboardStats.totalApplications,
        subtitle: "Total recibidos",
        icon: "document-text",
        color: DESIGN_SYSTEM.colors.secondary[600],
      },
      {
        title: "Trabajadores",
        value: state.dashboardStats.totalWorkers,
        subtitle: "Disponibles",
        icon: "people",
        color: DESIGN_SYSTEM.colors.accent[600],
      },
    ],
    [state.dashboardStats]
  );

  const cropTypeFilters = useMemo(() => {
    const offers = Array.isArray(combinedOffers) ? combinedOffers : [];
    const cropTypes = [
      ...new Set(offers.map((offer) => offer.cropType?.name || offer.cropType)),
    ];
    return cropTypes.filter(Boolean);
  }, [combinedOffers]);

  if (state.loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <LinearGradient
          colors={[
            DESIGN_SYSTEM.colors.primary[50],
            DESIGN_SYSTEM.colors.white,
          ]}
          style={styles.loadingGradient}>
          <ActivityIndicator
            size="large"
            color={DESIGN_SYSTEM.colors.primary[600]}
          />
          <Text style={styles.loadingText}>Cargando dashboard...</Text>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  function DashboardContent() {
    return (
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={state.refreshing}
            onRefresh={onRefresh}
            colors={[DESIGN_SYSTEM.colors.primary[600]]}
            tintColor={DESIGN_SYSTEM.colors.primary[600]}
          />
        }>
        {/* ✅ ACTUALIZAR para usar datos reales */}
        <EnhancedRatingCard ratingData={state.ratingData} />

        <View style={styles.statsGrid}>
          {Array.isArray(statsData) &&
            statsData.map((stat, index) => (
              <EnhancedStatsCard key={index} {...stat} />
            ))}
        </View>

        <View style={styles.quickActionsSection}>
          <Text style={styles.sectionTitle}>Acciones Rápidas</Text>
          <View style={styles.quickActionsGrid}>
            {Array.isArray(quickActions) &&
              quickActions.map((action, index) => (
                <EnhancedQuickActionButton
                  key={index}
                  title={action.title}
                  icon={action.icon}
                  color={action.color}
                  onPress={() => handleQuickActionPress(action)}
                />
              ))}
          </View>
        </View>
      </ScrollView>
    );
  }

  function OffersContent() {
    return (
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={state.refreshing}
            onRefresh={onRefresh}
            colors={[DESIGN_SYSTEM.colors.primary[600]]}
            tintColor={DESIGN_SYSTEM.colors.primary[600]}
          />
        }>
        <View style={styles.enhancedFiltersSection}>
          <EnhancedSearchBar
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Buscar ofertas por título o cultivo..."
          />

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.chipScroll}
            contentContainerStyle={styles.chipsContainer}>
            <EnhancedFilterChip
              title="Todos"
              isActive={!selectedCropType}
              onPress={() => setSelectedCropType("")}
            />
            {cropTypeFilters.map((cropType) => (
              <EnhancedFilterChip
                key={cropType}
                title={cropType}
                isActive={selectedCropType === cropType}
                onPress={() =>
                  setSelectedCropType(
                    selectedCropType === cropType ? "" : cropType
                  )
                }
              />
            ))}
          </ScrollView>
        </View>

        <View style={styles.offersSection}>
          <Text style={styles.offersCount}>
            {Array.isArray(filteredOffers) ? filteredOffers.length : 0} ofertas
            disponibles
          </Text>

          {Array.isArray(filteredOffers) &&
            filteredOffers.map((offer) => (
              <EnhancedOfferCard
                key={offer.id}
                offer={offer}
                isMyOffer={offer.isMyOffer}
                onPress={() =>
                  navigation.navigate("JobOfferDetail", { jobOfferId: offer.id })
                }
              />
            ))}

          {(!Array.isArray(filteredOffers) || filteredOffers.length === 0) && (
            <View style={styles.enhancedEmptyState}>
              <LinearGradient
                colors={[
                  DESIGN_SYSTEM.colors.gray[50],
                  DESIGN_SYSTEM.colors.white,
                ]}
                style={styles.emptyStateGradient}>
                <View style={styles.emptyStateIconContainer}>
                  <Ionicons
                    name="search-outline"
                    size={48}
                    color={DESIGN_SYSTEM.colors.gray[400]}
                  />
                </View>
                <Text style={styles.emptyStateTitle}>
                  No se encontraron ofertas
                </Text>
                <Text style={styles.emptyStateSubtitle}>
                  Intenta cambiar los filtros de búsqueda o crea una nueva oferta
                </Text>
                <TouchableOpacity
                  style={styles.emptyStateButton}
                  onPress={() => navigation.navigate("CreateJobOffer")}>
                  <LinearGradient
                    colors={[
                      DESIGN_SYSTEM.colors.primary[500],
                      DESIGN_SYSTEM.colors.primary[600],
                    ]}
                    style={styles.emptyStateButtonGradient}>
                    <Ionicons
                      name="add"
                      size={20}
                      color={DESIGN_SYSTEM.colors.white}
                    />
                    <Text style={styles.emptyStateButtonText}>
                      Crear Nueva Oferta
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </LinearGradient>
            </View>
          )}
        </View>
      </ScrollView>
    );
  }

  return (
    <ScreenLayout navigation={navigation}>
      <SafeAreaView style={styles.container}>
        <ModernHeader
          user={state.userData}
          onProfilePress={() => navigation.navigate("Profile")}
        />

        <ModernTabs activeTab={activeTab} setActiveTab={setActiveTab} />

        {activeTab === TABS.DASHBOARD ? (
          <DashboardContent />
        ) : (
          <OffersContent />
        )}
      </SafeAreaView>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DESIGN_SYSTEM.colors.gray[50],
  },

  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: DESIGN_SYSTEM.spacing.lg,
    gap: DESIGN_SYSTEM.spacing.md,
  },
  enhancedStatsCard: {
    flex: 1,
    minWidth: (width - DESIGN_SYSTEM.spacing.lg * 3) / 2,
    borderRadius: DESIGN_SYSTEM.borderRadius.lg,
    backgroundColor: DESIGN_SYSTEM.colors.white, // Fondo sólido blanco
    // Sombra más sutil y sin sombra gris debajo
    shadowColor: DESIGN_SYSTEM.colors.gray[900],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    // Borde sutil para definición
    borderWidth: 1,
    borderColor: DESIGN_SYSTEM.colors.gray[100],
  },
  statsCardGradient: {
    padding: DESIGN_SYSTEM.spacing.lg,
    borderRadius: DESIGN_SYSTEM.borderRadius.lg,
    // Removemos cualquier borde o gradiente que cause sombras
  },
  statsCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: DESIGN_SYSTEM.spacing.md,
    marginBottom: DESIGN_SYSTEM.spacing.md,
  },
  statsIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: "hidden",
  },
  statsIconGradient: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  statsInfo: {
    flex: 1,
  },
  statsValue: {
    ...DESIGN_SYSTEM.typography.h3,
    color: DESIGN_SYSTEM.colors.gray[900],
    fontWeight: "700",
    fontSize: 24, // Asegurar tamaño consistente
  },
  statsTitle: {
    ...DESIGN_SYSTEM.typography.bodyMedium,
    color: DESIGN_SYSTEM.colors.gray[600],
    marginTop: DESIGN_SYSTEM.spacing.xs,
    fontSize: 14,
  },
  statsSubtitle: {
    ...DESIGN_SYSTEM.typography.caption,
    color: DESIGN_SYSTEM.colors.gray[500],
    marginBottom: DESIGN_SYSTEM.spacing.sm,
    fontSize: 12,
  },
  statsTrend: {
    flexDirection: "row",
    alignItems: "center",
    gap: DESIGN_SYSTEM.spacing.sm,
  },
  trendIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  statsTrendText: {
    ...DESIGN_SYSTEM.typography.caption,
    fontWeight: "600",
    fontSize: 11,
  },
  loadingContainer: {
    flex: 1,
  },
  loadingGradient: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: DESIGN_SYSTEM.spacing.md,
    ...DESIGN_SYSTEM.typography.bodyMedium,
    color: DESIGN_SYSTEM.colors.gray[600],
  },

  // Enhanced Header
  header: {
    backgroundColor: DESIGN_SYSTEM.colors.white,
    ...DESIGN_SYSTEM.shadows.md,
  },
  headerGradient: {
    paddingTop: DESIGN_SYSTEM.spacing.lg,
    paddingHorizontal: DESIGN_SYSTEM.spacing.lg,
    paddingBottom: DESIGN_SYSTEM.spacing.md,
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerLeft: {
    flex: 1,
  },
  greetingText: {
    ...DESIGN_SYSTEM.typography.h3,
    color: DESIGN_SYSTEM.colors.gray[900],
  },
  userName: {
    color: DESIGN_SYSTEM.colors.primary[600],
    fontWeight: "700",
  },
  roleText: {
    ...DESIGN_SYSTEM.typography.bodyMedium,
    color: DESIGN_SYSTEM.colors.gray[600],
    marginTop: DESIGN_SYSTEM.spacing.xs,
    flexDirection: "row",
    alignItems: "center",
  },
  profileButton: {
    marginLeft: DESIGN_SYSTEM.spacing.md,
  },
  profileAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    ...DESIGN_SYSTEM.shadows.md,
  },
  profileInitial: {
    ...DESIGN_SYSTEM.typography.h4,
    color: DESIGN_SYSTEM.colors.white,
    fontWeight: "700",
  },

  // Enhanced Tabs
  tabsContainer: {
    backgroundColor: DESIGN_SYSTEM.colors.white,
    paddingHorizontal: DESIGN_SYSTEM.spacing.lg,
    paddingBottom: DESIGN_SYSTEM.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: DESIGN_SYSTEM.colors.gray[100],
  },
  tabsWrapper: {
    flexDirection: "row",
    backgroundColor: DESIGN_SYSTEM.colors.gray[100],
    borderRadius: DESIGN_SYSTEM.borderRadius.md,
    padding: DESIGN_SYSTEM.spacing.xs,
    position: "relative",
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: DESIGN_SYSTEM.spacing.md,
    borderRadius: DESIGN_SYSTEM.borderRadius.sm,
    gap: DESIGN_SYSTEM.spacing.xs,
    position: "relative",
  },
  tabActive: {
    backgroundColor: DESIGN_SYSTEM.colors.white,
    ...DESIGN_SYSTEM.shadows.sm,
  },
  tabActiveIndicator: {
    position: "absolute",
    bottom: -2,
    left: "25%",
    right: "25%",
    height: 3,
    backgroundColor: DESIGN_SYSTEM.colors.primary[600],
    borderRadius: DESIGN_SYSTEM.borderRadius.full,
  },
  tabTextActive: {
    color: DESIGN_SYSTEM.colors.primary[600],
    fontWeight: "600",
  },

  scrollView: {
    flex: 1,
  },

  // Enhanced Rating Card
  enhancedRatingCard: {
    margin: DESIGN_SYSTEM.spacing.lg,
    borderRadius: DESIGN_SYSTEM.borderRadius.xl,
    overflow: "hidden",
    ...DESIGN_SYSTEM.shadows.lg,
  },
  ratingGradient: {
    position: "relative",
  },
  ratingOverlay: {
    padding: DESIGN_SYSTEM.spacing.xl,
    backgroundColor: "rgba(0,0,0,0.1)",
  },
  ratingContent: {
    alignItems: "center",
  },
  ratingHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: DESIGN_SYSTEM.spacing.md,
    marginBottom: DESIGN_SYSTEM.spacing.lg,
  },
  ratingIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  ratingTitle: {
    ...DESIGN_SYSTEM.typography.h3,
    color: DESIGN_SYSTEM.colors.white,
    fontWeight: "600",
  },
  ratingScore: {
    alignItems: "center",
    marginBottom: DESIGN_SYSTEM.spacing.lg,
  },
  ratingNumber: {
    ...DESIGN_SYSTEM.typography.h1,
    fontSize: 42,
    color: DESIGN_SYSTEM.colors.white,
    fontWeight: "700",
    textShadowColor: "rgba(0,0,0,0.3)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  ratingStars: {
    flexDirection: "row",
    gap: DESIGN_SYSTEM.spacing.sm,
    marginTop: DESIGN_SYSTEM.spacing.md,
  },
  starContainer: {
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: DESIGN_SYSTEM.borderRadius.full,
    padding: DESIGN_SYSTEM.spacing.xs,
  },
  ratingSubtext: {
    ...DESIGN_SYSTEM.typography.bodyMedium,
    color: DESIGN_SYSTEM.colors.white,
    opacity: 0.9,
    textAlign: "center",
  },
  quickActionsSection: {
    paddingHorizontal: DESIGN_SYSTEM.spacing.lg,
    paddingVertical: DESIGN_SYSTEM.spacing.lg,
  },
  sectionTitle: {
    ...DESIGN_SYSTEM.typography.h3,
    color: DESIGN_SYSTEM.colors.gray[900],
    marginBottom: DESIGN_SYSTEM.spacing.lg,
  },
  quickActionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: DESIGN_SYSTEM.spacing.md,
  },
  enhancedQuickActionButton: {
    flex: 1,
    minWidth: (width - DESIGN_SYSTEM.spacing.lg * 3) / 2,
    borderRadius: DESIGN_SYSTEM.borderRadius.lg,
    overflow: "hidden",
    ...DESIGN_SYSTEM.shadows.lg,
  },
  quickActionGradient: {
    padding: DESIGN_SYSTEM.spacing.lg,
    alignItems: "center",
    gap: DESIGN_SYSTEM.spacing.sm,
    position: "relative",
  },
  quickActionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: DESIGN_SYSTEM.spacing.sm,
  },
  quickActionText: {
    ...DESIGN_SYSTEM.typography.bodyMedium,
    color: DESIGN_SYSTEM.colors.white,
    fontWeight: "600",
    textAlign: "center",
  },
  quickActionArrow: {
    position: "absolute",
    top: DESIGN_SYSTEM.spacing.md,
    right: DESIGN_SYSTEM.spacing.md,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },

  // Enhanced Filters
  enhancedFiltersSection: {
    paddingHorizontal: DESIGN_SYSTEM.spacing.lg,
    paddingVertical: DESIGN_SYSTEM.spacing.lg,
    gap: DESIGN_SYSTEM.spacing.md,
  },
  enhancedSearchContainer: {
    borderRadius: DESIGN_SYSTEM.borderRadius.lg,
    overflow: "hidden",
    ...DESIGN_SYSTEM.shadows.sm,
  },
  searchGradient: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: DESIGN_SYSTEM.spacing.md,
    paddingVertical: DESIGN_SYSTEM.spacing.md,
    borderWidth: 1,
    borderColor: DESIGN_SYSTEM.colors.gray[200],
  },
  searchIconContainer: {
    marginRight: DESIGN_SYSTEM.spacing.sm,
  },
  enhancedSearchInput: {
    flex: 1,
    ...DESIGN_SYSTEM.typography.bodyMedium,
    color: DESIGN_SYSTEM.colors.gray[900],
  },
  clearButton: {
    marginLeft: DESIGN_SYSTEM.spacing.sm,
  },
  chipScroll: {
    marginBottom: DESIGN_SYSTEM.spacing.md,
  },
  chipsContainer: {
    flexDirection: "row",
    gap: DESIGN_SYSTEM.spacing.sm,
    paddingRight: DESIGN_SYSTEM.spacing.lg,
  },
  enhancedFilterChip: {
    borderRadius: DESIGN_SYSTEM.borderRadius.full,
    overflow: "hidden",
    ...DESIGN_SYSTEM.shadows.sm,
  },
  filterChipGradient: {
    paddingHorizontal: DESIGN_SYSTEM.spacing.lg,
    paddingVertical: DESIGN_SYSTEM.spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    gap: DESIGN_SYSTEM.spacing.xs,
    borderWidth: 1,
    borderColor: DESIGN_SYSTEM.colors.gray[200],
  },
  enhancedFilterChipText: {
    ...DESIGN_SYSTEM.typography.bodyMedium,
    color: DESIGN_SYSTEM.colors.gray[700],
    fontWeight: "500",
  },
  filterChipTextActive: {
    color: DESIGN_SYSTEM.colors.white,
  },

  // Enhanced Offer Cards
  enhancedOfferCard: {
    marginBottom: DESIGN_SYSTEM.spacing.lg,
    borderRadius: DESIGN_SYSTEM.borderRadius.xl,
    overflow: "hidden",
    ...DESIGN_SYSTEM.shadows.lg,
  },
  myOfferCard: {
    borderWidth: 2,
    borderColor: DESIGN_SYSTEM.colors.success[300],
  },
  offerCardTouchable: {
    borderRadius: DESIGN_SYSTEM.borderRadius.xl,
    overflow: "hidden",
  },
  offerCardBackground: {
    borderRadius: DESIGN_SYSTEM.borderRadius.xl,
  },
  enhancedOfferHeader: {
    borderTopLeftRadius: DESIGN_SYSTEM.borderRadius.xl,
    borderTopRightRadius: DESIGN_SYSTEM.borderRadius.xl,
    overflow: "hidden",
  },
  cropTypeHeader: {
    paddingHorizontal: DESIGN_SYSTEM.spacing.lg,
    paddingVertical: DESIGN_SYSTEM.spacing.md,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cropTypeContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: DESIGN_SYSTEM.spacing.md,
  },
  cropIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  cropTypeText: {
    ...DESIGN_SYSTEM.typography.h4,
    color: DESIGN_SYSTEM.colors.white,
    fontWeight: "600",
  },
  myOfferBadgeHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: DESIGN_SYSTEM.spacing.xs,
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: DESIGN_SYSTEM.spacing.md,
    paddingVertical: DESIGN_SYSTEM.spacing.xs,
    borderRadius: DESIGN_SYSTEM.borderRadius.full,
  },
  myOfferBadgeHeaderText: {
    ...DESIGN_SYSTEM.typography.captionMedium,
    color: DESIGN_SYSTEM.colors.white,
    fontWeight: "600",
  },
  enhancedOfferContent: {
    padding: DESIGN_SYSTEM.spacing.lg,
  },
  enhancedOfferTitle: {
    ...DESIGN_SYSTEM.typography.h4,
    color: DESIGN_SYSTEM.colors.gray[900],
    marginBottom: DESIGN_SYSTEM.spacing.md,
    lineHeight: 26,
  },
  enhancedOfferLocation: {
    flexDirection: "row",
    alignItems: "center",
    gap: DESIGN_SYSTEM.spacing.sm,
    marginBottom: DESIGN_SYSTEM.spacing.lg,
  },
  locationIconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: DESIGN_SYSTEM.colors.gray[100],
    justifyContent: "center",
    alignItems: "center",
  },
  enhancedLocationText: {
    ...DESIGN_SYSTEM.typography.bodyMedium,
    color: DESIGN_SYSTEM.colors.gray[600],
  },
  enhancedOfferDetails: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: DESIGN_SYSTEM.spacing.lg,
    marginBottom: DESIGN_SYSTEM.spacing.lg,
  },
  offerDetailItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: DESIGN_SYSTEM.spacing.sm,
  },
  offerDetailText: {
    ...DESIGN_SYSTEM.typography.bodyMedium,
    color: DESIGN_SYSTEM.colors.gray[700],
    fontWeight: "500",
  },
  enhancedOfferBenefits: {
    marginBottom: DESIGN_SYSTEM.spacing.lg,
  },
  benefitsTitle: {
    ...DESIGN_SYSTEM.typography.captionMedium,
    color: DESIGN_SYSTEM.colors.gray[600],
    marginBottom: DESIGN_SYSTEM.spacing.sm,
  },
  benefitsContainer: {
    flexDirection: "row",
    gap: DESIGN_SYSTEM.spacing.sm,
  },
  enhancedBenefitBadge: {
    borderRadius: DESIGN_SYSTEM.borderRadius.full,
    overflow: "hidden",
    ...DESIGN_SYSTEM.shadows.sm,
  },
  benefitBadgeGradient: {
    flexDirection: "row",
    alignItems: "center",
    gap: DESIGN_SYSTEM.spacing.xs,
    paddingHorizontal: DESIGN_SYSTEM.spacing.md,
    paddingVertical: DESIGN_SYSTEM.spacing.sm,
  },
  enhancedBenefitText: {
    ...DESIGN_SYSTEM.typography.captionMedium,
    color: DESIGN_SYSTEM.colors.white,
    fontWeight: "600",
  },
  offerCardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: DESIGN_SYSTEM.spacing.md,
    borderTopWidth: 1,
    borderTopColor: DESIGN_SYSTEM.colors.gray[100],
  },
  offerTimeAgo: {
    ...DESIGN_SYSTEM.typography.caption,
    color: DESIGN_SYSTEM.colors.gray[500],
  },
  actionIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: DESIGN_SYSTEM.spacing.xs,
  },
  actionText: {
    ...DESIGN_SYSTEM.typography.captionMedium,
    color: DESIGN_SYSTEM.colors.primary[600],
    fontWeight: "600",
  },

  // Enhanced Offers Section
  offersSection: {
    paddingHorizontal: DESIGN_SYSTEM.spacing.lg,
    paddingBottom: DESIGN_SYSTEM.spacing.xxl,
  },
  offersCount: {
    ...DESIGN_SYSTEM.typography.h4,
    color: DESIGN_SYSTEM.colors.gray[900],
    marginBottom: DESIGN_SYSTEM.spacing.lg,
    fontWeight: "600",
  },

  // Enhanced Empty State
  enhancedEmptyState: {
    marginTop: DESIGN_SYSTEM.spacing.xl,
    borderRadius: DESIGN_SYSTEM.borderRadius.xl,
    overflow: "hidden",
    ...DESIGN_SYSTEM.shadows.md,
  },
  emptyStateGradient: {
    alignItems: "center",
    padding: DESIGN_SYSTEM.spacing.xxl,
  },
  emptyStateIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: DESIGN_SYSTEM.colors.gray[100],
    justifyContent: "center",
    alignItems: "center",
    marginBottom: DESIGN_SYSTEM.spacing.lg,
  },
  emptyStateTitle: {
    ...DESIGN_SYSTEM.typography.h4,
    color: DESIGN_SYSTEM.colors.gray[700],
    marginBottom: DESIGN_SYSTEM.spacing.md,
    textAlign: "center",
  },
  emptyStateSubtitle: {
    ...DESIGN_SYSTEM.typography.bodyMedium,
    color: DESIGN_SYSTEM.colors.gray[500],
    textAlign: "center",
    marginBottom: DESIGN_SYSTEM.spacing.xl,
    lineHeight: 22,
  },
  emptyStateButton: {
    borderRadius: DESIGN_SYSTEM.borderRadius.full,
    overflow: "hidden",
    ...DESIGN_SYSTEM.shadows.md,
  },
  emptyStateButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    gap: DESIGN_SYSTEM.spacing.sm,
    paddingHorizontal: DESIGN_SYSTEM.spacing.xl,
    paddingVertical: DESIGN_SYSTEM.spacing.md,
  },
  emptyStateButtonText: {
    ...DESIGN_SYSTEM.typography.bodyMedium,
    color: DESIGN_SYSTEM.colors.white,
    fontWeight: "600",
  },
});
