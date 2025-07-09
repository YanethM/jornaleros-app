import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  Platform,
  Modal,
  TouchableWithoutFeedback,
  ScrollView,
  Animated,
  Alert,
  RefreshControl,
  Dimensions,
  Pressable,
  TextInput,
  FlatList,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import {
  getUsersByRatingRange,
  getUsersRatingQuickStats,
  getUsersBySpecificCategory,
  searchUsersByNameAndRating,
} from "../../services/qualifitionService";
import ScreenLayoutAdmin from "../../components/ScreenLayoutAdmin";
import CustomTabBarAdmin from "../../components/CustomTabBarAdmin";

// 🔍 DEBUG: Verificar imports
console.log("=== AdminUserRating imports loaded ===");

// ✅ Constantes
const CONSTANTS = {
  ANIMATION_DURATION: 250,
  CARD_MARGIN: 12,
  BORDER_RADIUS: 16,
  ICON_SIZE: 20,
  AVATAR_SIZE: 40,
};

// ✅ Colores
const COLORS = {
  primary: "#284F66",
  primaryLight: "#3A6B87",
  primaryDark: "#1A3B4D",
  secondary: "#B6883E",
  secondaryLight: "#D4A45C",

  gray50: "#FAFBFC",
  gray100: "#F4F6F8",
  gray200: "#E5E8EB",
  gray300: "#D1D6DB",
  gray400: "#9DA4AE",
  gray500: "#6B7280",
  gray600: "#4B5563",
  gray700: "#374151",
  gray800: "#1F2937",
  gray900: "#111827",

  success: "#10B981",
  warning: "#F59E0B",
  error: "#EF4444",
  info: "#3B82F6",
  gold: "#FFD700",

  white: "#FFFFFF",
  surface: "#FEFEFE",
  overlay: "rgba(15, 23, 42, 0.6)",
  backdrop: "rgba(0, 0, 0, 0.4)",
  cardShadow: "rgba(0, 0, 0, 0.08)",
};

// ✅ Función utilitaria para remover duplicados
const removeDuplicateUsers = (usersArray) => {
  const seen = new Set();
  return usersArray.filter(user => {
    if (!user.id) {
      console.warn('User without ID found:', user);
      return false; // Skip users without IDs
    }
    
    if (seen.has(user.id)) {
      console.warn('Duplicate user ID found:', user.id);
      return false; // Skip duplicates
    }
    
    seen.add(user.id);
    return true;
  });
};

// ✅ Componentes auxiliares
const LoadingState = React.memo(() => {
  const pulseAnim = useMemo(() => new Animated.Value(0), []);

  useEffect(() => {
    const startPulse = () => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 0,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start();
    };
    startPulse();
  }, [pulseAnim]);

  return (
    <View style={styles.loadingContainer}>
      <Animated.View
        style={[
          styles.loadingDot,
          {
            opacity: pulseAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0.3, 1],
            }),
          },
        ]}
      />
      <Text style={styles.loadingText}>Cargando usuarios...</Text>
    </View>
  );
});

const ErrorState = React.memo(({ error, onRetry }) => (
  <View style={styles.errorContainer}>
    <Icon name="error-outline" size={48} color={COLORS.error} />
    <Text style={styles.errorTitle}>Error al cargar</Text>
    <Text style={styles.errorMessage}>{error}</Text>
    <Pressable style={styles.retryButton} onPress={onRetry}>
      <Icon name="refresh" size={20} color={COLORS.white} />
      <Text style={styles.retryButtonText}>Reintentar</Text>
    </Pressable>
  </View>
));

const EmptyState = React.memo(({ filter, searchTerm }) => (
  <View style={styles.emptyContainer}>
    <Icon name="people-outline" size={48} color={COLORS.gray300} />
    <Text style={styles.emptyTitle}>
      {searchTerm
        ? `No se encontraron usuarios para "${searchTerm}"`
        : filter === "high"
        ? "No hay usuarios con 3+ estrellas"
        : filter === "low"
        ? "No hay usuarios con menos de 3 estrellas"
        : filter === "unrated"
        ? "No hay usuarios sin calificaciones"
        : "No hay usuarios registrados"}
    </Text>
    <Text style={styles.emptySubtitle}>
      {searchTerm
        ? "Intenta con otro término de búsqueda"
        : "Los usuarios aparecerán aquí"}
    </Text>
  </View>
));

const StatsCard = React.memo(({ stats }) => (
  <View style={styles.statsContainer}>
    <Text style={styles.statsTitle}>Resumen de Calificaciones</Text>
    <View style={styles.statsRow}>
      <View style={[styles.statItem, { backgroundColor: `${COLORS.gold}15` }]}>
        <Icon name="star" size={24} color={COLORS.gold} />
        <Text style={styles.statNumber}>{stats.highRatedUsers}</Text>
        <Text style={styles.statLabel}>3+ ⭐</Text>
      </View>
      <View
        style={[styles.statItem, { backgroundColor: `${COLORS.warning}15` }]}>
        <Icon name="star-half" size={24} color={COLORS.warning} />
        <Text style={styles.statNumber}>{stats.lowRatedUsers}</Text>
        <Text style={styles.statLabel}>{"<"} 3 ⭐</Text>
      </View>
      <View
        style={[styles.statItem, { backgroundColor: `${COLORS.gray400}15` }]}>
        <Icon name="star-border" size={24} color={COLORS.gray400} />
        <Text style={styles.statNumber}>{stats.unratedUsers}</Text>
        <Text style={styles.statLabel}>Sin ⭐</Text>
      </View>
    </View>
    <View style={styles.summaryRow}>
      <Text style={styles.summaryText}>
        Total: {stats.totalUsers} usuarios • Promedio:{" "}
        {stats.overallAverageRating} ⭐
      </Text>
      <Text style={styles.percentageText}>
        {stats.percentageHighRated}% bien calificados
      </Text>
    </View>
  </View>
));

const FilterButtons = React.memo(({ currentFilter, onFilterChange }) => {
  const filters = [
    { key: "all", label: "Todos", icon: "people" },
    { key: "high", label: "3+ ⭐", icon: "star" },
    { key: "low", label: "{'<'} 3 ⭐", icon: "star-half" },
    { key: "unrated", label: "Sin ⭐", icon: "star-border" },
  ];

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.filterContainer}
      contentContainerStyle={styles.filterContent}>
      {filters.map((filter) => (
        <Pressable
          key={filter.key}
          style={[
            styles.filterButton,
            currentFilter === filter.key && styles.filterButtonActive,
          ]}
          onPress={() => onFilterChange(filter.key)}>
          <Icon
            name={filter.icon}
            size={14}
            color={currentFilter === filter.key ? COLORS.white : COLORS.gray600}
          />
          <Text
            style={[
              styles.filterButtonText,
              currentFilter === filter.key && styles.filterButtonTextActive,
            ]}>
            {filter.label}
          </Text>
        </Pressable>
      ))}
    </ScrollView>
  );
});

const SearchBar = React.memo(
  ({ searchTerm, onSearchChange, onClearSearch }) => (
    <View style={styles.searchContainer}>
      <View style={styles.searchInputContainer}>
        <Icon name="search" size={20} color={COLORS.gray400} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar por nombre o email..."
          value={searchTerm}
          onChangeText={onSearchChange}
          placeholderTextColor={COLORS.gray400}
        />
        {searchTerm.length > 0 && (
          <Pressable onPress={onClearSearch} style={styles.clearButton}>
            <Icon name="clear" size={20} color={COLORS.gray400} />
          </Pressable>
        )}
      </View>
    </View>
  )
);

const UserCard = React.memo(({ user, onViewDetails }) => {
  const getRatingColor = (rating) => {
    if (rating >= 4.5) return COLORS.success;
    if (rating >= 3.5) return COLORS.gold;
    if (rating >= 2.5) return COLORS.warning;
    return COLORS.error;
  };

  const getRatingIcon = (rating) => {
    if (rating >= 4) return "star";
    if (rating >= 3) return "star-half";
    return "star-border";
  };

  const formatLastRating = (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Hoy";
    if (diffDays === 1) return "Ayer";
    if (diffDays < 7) return `Hace ${diffDays} días`;
    if (diffDays < 30) return `Hace ${Math.floor(diffDays / 7)} semanas`;
    return `Hace ${Math.floor(diffDays / 30)} meses`;
  };

  return (
    <Pressable style={styles.userCard} onPress={() => onViewDetails(user)}>
      <View style={styles.userHeader}>
        <View style={styles.userMainInfo}>
          <View style={styles.userNameRow}>
            <Text style={styles.userName} numberOfLines={1}>
              {user.name}
            </Text>
            <View
              style={[
                styles.userTypeBadge,
                {
                  backgroundColor:
                    user.userType === "Trabajador"
                      ? `${COLORS.info}15`
                      : `${COLORS.secondary}15`,
                },
              ]}>
              <Text
                style={[
                  styles.userTypeText,
                  {
                    color:
                      user.userType === "Trabajador"
                        ? COLORS.info
                        : COLORS.secondary,
                  },
                ]}>
                {user.userType}
              </Text>
            </View>
          </View>
          <Text style={styles.userEmail} numberOfLines={1}>
            {user.email}
          </Text>
        </View>

        <View style={styles.ratingSection}>
          {user.hasRatings ? (
            <>
              <View style={styles.ratingRow}>
                <Icon
                  name={getRatingIcon(user.averageRating)}
                  size={20}
                  color={getRatingColor(user.averageRating)}
                />
                <Text
                  style={[
                    styles.ratingValue,
                    { color: getRatingColor(user.averageRating) },
                  ]}>
                  {user.averageRating}
                </Text>
              </View>
              <Text style={styles.ratingCount}>
                {user.totalRatings} evaluación
                {user.totalRatings !== 1 ? "es" : ""}
              </Text>
              {user.lastRatingDate && (
                <Text style={styles.lastRating}>
                  {formatLastRating(user.lastRatingDate)}
                </Text>
              )}
            </>
          ) : (
            <View style={styles.noRatingContainer}>
              <Icon name="star-border" size={20} color={COLORS.gray300} />
              <Text style={styles.noRatingText}>Sin calificaciones</Text>
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
});

const UserDetailsModal = React.memo(({ visible, user, onClose }) => {
  if (!user) return null;

  const getRatingColor = (rating) => {
    if (rating >= 4.5) return COLORS.success;
    if (rating >= 3.5) return COLORS.gold;
    if (rating >= 2.5) return COLORS.warning;
    return COLORS.error;
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Detalles del Usuario</Text>
            <Pressable style={styles.closeButton} onPress={onClose}>
              <Icon name="close" size={24} color={COLORS.gray600} />
            </Pressable>
          </View>

          <ScrollView
            style={styles.modalBody}
            showsVerticalScrollIndicator={false}>
            <View style={styles.detailSection}>
              <Text style={styles.detailLabel}>Nombre completo</Text>
              <Text style={styles.detailValue}>{user.name}</Text>
            </View>

            <View style={styles.detailSection}>
              <Text style={styles.detailLabel}>Email</Text>
              <Text style={styles.detailValue}>{user.email}</Text>
            </View>

            <View style={styles.detailSection}>
              <Text style={styles.detailLabel}>Tipo de usuario</Text>
              <Text style={styles.detailValue}>{user.userType}</Text>
            </View>

            {user.hasRatings ? (
              <>
                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>Calificación promedio</Text>
                  <View style={styles.ratingDetailRow}>
                    <Text
                      style={[
                        styles.ratingDetailValue,
                        { color: getRatingColor(user.averageRating) },
                      ]}>
                      {user.averageRating} ⭐
                    </Text>
                    <Text style={styles.ratingDetailCount}>
                      ({user.totalRatings} evaluación
                      {user.totalRatings !== 1 ? "es" : ""})
                    </Text>
                  </View>
                </View>

                {user.lastRatingDate && (
                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>Última evaluación</Text>
                    <Text style={styles.detailValue}>
                      {new Date(user.lastRatingDate).toLocaleString()}
                    </Text>
                  </View>
                )}
              </>
            ) : (
              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>Estado de evaluaciones</Text>
                <Text style={[styles.detailValue, { color: COLORS.gray500 }]}>
                  Sin calificaciones
                </Text>
              </View>
            )}

            <View style={styles.detailSection}>
              <Text style={styles.detailLabel}>ID del perfil</Text>
              <Text style={styles.detailValue}>{user.id}</Text>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
});

// ✅ COMPONENTE PRINCIPAL
const AdminUserRating = () => {
  // 🔍 DEBUG: Verificar que el componente se está creando
  console.log("=== AdminUserRating component initializing ===");

  const navigation = useNavigation();

  // Estados
  const [users, setUsers] = useState([]);
  const [allUsersData, setAllUsersData] = useState(null);
  const [stats, setStats] = useState({
    totalUsers: 0,
    highRatedUsers: 0,
    lowRatedUsers: 0,
    unratedUsers: 0,
    overallAverageRating: 0,
    percentageHighRated: 0,
  });
  const [currentFilter, setCurrentFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Effects y funciones
  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (!loading && allUsersData) {
      filterUsers();
    }
  }, [currentFilter, allUsersData]);

  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      if (searchTerm.trim().length > 0) {
        handleSearch();
      } else if (allUsersData) {
        filterUsers();
      }
    }, 500);

    return () => clearTimeout(delayedSearch);
  }, [searchTerm]);

  const loadInitialData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [usersResponse, statsResponse] = await Promise.allSettled([
        getUsersByRatingRange({ limit: 1000, sortBy: "rating", order: "desc" }),
        getUsersRatingQuickStats(),
      ]);

      if (usersResponse.status === "fulfilled" && usersResponse.value.success) {
        setAllUsersData(usersResponse.value.data);
        filterUsersFromData(usersResponse.value.data, currentFilter);
      }

      if (statsResponse.status === "fulfilled" && statsResponse.value.success) {
        setStats(statsResponse.value.data);
      }
    } catch (err) {
      console.error("Error loading initial data:", err);
      setError(err.message || "Error al cargar datos");
    } finally {
      setLoading(false);
    }
  }, [currentFilter]);

  // ✅ FUNCIÓN CORREGIDA: filterUsersFromData
  const filterUsersFromData = (data, filter) => {
    if (!data) return;

    let filteredUsers = [];

    switch (filter) {
      case "high":
        filteredUsers = data.categories.highRated.users;
        break;
      case "low":
        filteredUsers = data.categories.lowRated.users;
        break;
      case "unrated":
        filteredUsers = data.categories.unrated.users;
        break;
      case "all":
      default:
        // Combinar todos los usuarios y remover duplicados
        const allUsers = [
          ...data.categories.highRated.users,
          ...data.categories.lowRated.users,
          ...data.categories.unrated.users,
        ];
        
        // Remover duplicados usando la función utilitaria
        filteredUsers = removeDuplicateUsers(allUsers)
          .sort((a, b) => b.averageRating - a.averageRating);
        break;
    }

    setUsers(filteredUsers);
  };

  const filterUsers = useCallback(() => {
    filterUsersFromData(allUsersData, currentFilter);
  }, [allUsersData, currentFilter]);

  // ✅ FUNCIÓN CORREGIDA: handleSearch
  const handleSearch = useCallback(async () => {
    if (!searchTerm.trim()) {
      filterUsers();
      return;
    }

    try {
      const response = await searchUsersByNameAndRating(searchTerm, {
        sortBy: "rating",
        order: "desc",
      });

      if (response.success) {
        let searchResults = [];

        switch (currentFilter) {
          case "high":
            searchResults = response.data.categories.highRated.users;
            break;
          case "low":
            searchResults = response.data.categories.lowRated.users;
            break;
          case "unrated":
            searchResults = response.data.categories.unrated.users;
            break;
          case "all":
          default:
            // Combinar todos los resultados de búsqueda y remover duplicados
            const allSearchResults = [
              ...response.data.categories.highRated.users,
              ...response.data.categories.lowRated.users,
              ...response.data.categories.unrated.users,
            ];
            
            // Remover duplicados usando la función utilitaria
            searchResults = removeDuplicateUsers(allSearchResults)
              .sort((a, b) => b.averageRating - a.averageRating);
            break;
        }

        setUsers(searchResults);
      }
    } catch (err) {
      console.error("Error searching users:", err);
    }
  }, [searchTerm, currentFilter]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadInitialData();
    } finally {
      setRefreshing(false);
    }
  }, [loadInitialData]);

  const handleFilterChange = useCallback((filter) => {
    setCurrentFilter(filter);
  }, []);

  const handleViewDetails = useCallback((user) => {
    setSelectedUser(user);
    setShowDetailsModal(true);
  }, []);

  const handleSearchChange = useCallback((text) => {
    setSearchTerm(text);
  }, []);

  const handleClearSearch = useCallback(() => {
    setSearchTerm("");
  }, []);

  const handleBackPress = useCallback(() => {
    try {
      if (navigation && navigation.goBack) {
        navigation.goBack();
      } else if (navigation && navigation.navigate) {
        navigation.navigate("AdminDashboard");
      } else {
        Alert.alert("Error", "No se puede navegar hacia atrás");
      }
    } catch (err) {
      console.error("Navigation error:", err);
      Alert.alert("Error", "Error de navegación");
    }
  }, [navigation]);

  // 🔍 DEBUG: Verificar rendering
  console.log("AdminUserRating rendering, loading:", loading, "error:", error);

  if (loading) {
    return (
      <ScreenLayoutAdmin>
        <View style={styles.container}>
          <LoadingState />
        </View>
        <CustomTabBarAdmin
          state={{ index: 0, routes: [] }}
          navigation={navigation}
        />
      </ScreenLayoutAdmin>
    );
  }

  if (error && !refreshing) {
    return (
      <ScreenLayoutAdmin>
        <View style={styles.container}>
          <ErrorState error={error} onRetry={loadInitialData} />
        </View>
        <CustomTabBarAdmin
          state={{ index: 0, routes: [] }}
          navigation={navigation}
        />
      </ScreenLayoutAdmin>
    );
  }

  return (
    <ScreenLayoutAdmin>
      <View style={styles.container}>
        <LinearGradient
          colors={[COLORS.primary, COLORS.primaryLight]}
          style={styles.header}>
          <View style={styles.headerContent}>
            <Pressable style={styles.backButton} onPress={handleBackPress}>
              <Icon name="arrow-back" size={24} color={COLORS.white} />
            </Pressable>
            <Text style={styles.headerTitle}>Usuarios por Calificación</Text>
            <Pressable style={styles.refreshButton} onPress={handleRefresh}>
              <Icon name="refresh" size={24} color={COLORS.white} />
            </Pressable>
          </View>
        </LinearGradient>

        <StatsCard stats={stats} />
        <SearchBar
          searchTerm={searchTerm}
          onSearchChange={handleSearchChange}
          onClearSearch={handleClearSearch}
        />
        <FilterButtons
          currentFilter={currentFilter}
          onFilterChange={handleFilterChange}
        />

        {/* ✅ FlatList CORREGIDO con keyExtractor mejorado */}
        <FlatList
          style={styles.usersList}
          data={users}
          keyExtractor={(item, index) => {
            // Fallback robusto para manejar casos edge
            return item.id ? `user_${item.id}` : `user_index_${index}`;
          }}
          renderItem={({ item }) => (
            <UserCard user={item} onViewDetails={handleViewDetails} />
          )}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <EmptyState filter={currentFilter} searchTerm={searchTerm} />
          }
        />

        <UserDetailsModal
          visible={showDetailsModal}
          user={selectedUser}
          onClose={() => setShowDetailsModal(false)}
        />
      </View>
      <CustomTabBarAdmin
        state={{ index: 0, routes: [] }}
        navigation={navigation}
      />
    </ScreenLayoutAdmin>
  );
};

const styles = StyleSheet.create({
  // Layout Base
  container: {
    flex: 1,
    backgroundColor: COLORS.gray50,
  },

  // Header
  header: {
    paddingTop: Platform.OS === "ios" ? 44 : 24,
    paddingBottom: 8,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 10,
    marginTop: 6,
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: COLORS.white,
    flex: 1,
    textAlign: "center",
    marginHorizontal: 16,
  },
  refreshButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },

  // Estados
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.primary,
    marginBottom: 12,
  },
  loadingText: {
    fontSize: 16,
    color: COLORS.gray600,
    fontWeight: "500",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.gray800,
    marginTop: 16,
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 16,
    color: COLORS.gray600,
    textAlign: "center",
    marginBottom: 24,
  },
  retryButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
    paddingVertical: 48,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.gray700,
    marginTop: 12,
    marginBottom: 6,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 13,
    color: COLORS.gray500,
    textAlign: "center",
  },

  // Estadísticas
  statsContainer: {
    margin: CONSTANTS.CARD_MARGIN,
    marginTop: 8,
    marginBottom: 8,
    padding: CONSTANTS.CARD_MARGIN,
    backgroundColor: COLORS.white,
    borderRadius: CONSTANTS.BORDER_RADIUS,
    ...Platform.select({
      ios: {
        shadowColor: COLORS.cardShadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  statsTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.gray800,
    marginBottom: 8,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
    padding: 8,
    borderRadius: 8,
    marginHorizontal: 2,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.gray800,
    marginTop: 4,
  },
  statLabel: {
    fontSize: 10,
    color: COLORS.gray600,
    marginTop: 2,
    fontWeight: "500",
  },
  summaryRow: {
    alignItems: "center",
  },
  summaryText: {
    fontSize: 12,
    color: COLORS.gray600,
    marginBottom: 2,
  },
  percentageText: {
    fontSize: 12,
    color: COLORS.success,
    fontWeight: "600",
  },

  // Búsqueda y Filtros
  searchContainer: {
    marginHorizontal: CONSTANTS.CARD_MARGIN,
    marginBottom: 4,
  },
  searchInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    borderRadius: CONSTANTS.BORDER_RADIUS,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: COLORS.gray200,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: COLORS.gray800,
    marginLeft: 8,
    marginRight: 8,
  },
  clearButton: {
    padding: 4,
  },
  filterContainer: {
    marginBottom: 4,
    marginTop: 4,
    height: 28,
  },
  filterContent: {
    paddingHorizontal: CONSTANTS.CARD_MARGIN,
    paddingVertical: 0,
    alignItems: "center",
  },
  filterButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 3,
    marginRight: 6,
    borderRadius: 12,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.gray200,
    minWidth: 60,
    justifyContent: "center",
    height: 24,
  },
  filterButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterButtonText: {
    fontSize: 11,
    fontWeight: "600",
    color: COLORS.gray600,
    marginLeft: 3,
  },
  filterButtonTextActive: {
    color: COLORS.white,
  },

  // Lista y Tarjetas de Usuario
  usersList: {
    flex: 1,
    paddingHorizontal: CONSTANTS.CARD_MARGIN,
    paddingTop: 0,
  },
  userCard: {
    backgroundColor: COLORS.white,
    borderRadius: CONSTANTS.BORDER_RADIUS,
    padding: 14,
    marginBottom: 8,
    ...Platform.select({
      ios: {
        shadowColor: COLORS.cardShadow,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  userHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  userMainInfo: {
    flex: 1,
    marginRight: 12,
  },
  userNameRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  userName: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.gray800,
    flex: 1,
    marginRight: 8,
  },
  userTypeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  userTypeText: {
    fontSize: 10,
    fontWeight: "600",
  },
  userEmail: {
    fontSize: 12,
    color: COLORS.gray500,
  },
  ratingSection: {
    alignItems: "flex-end",
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 2,
  },
  ratingValue: {
    fontSize: 16,
    fontWeight: "700",
    marginLeft: 4,
  },
  ratingCount: {
    fontSize: 11,
    color: COLORS.gray500,
  },
  lastRating: {
    fontSize: 10,
    color: COLORS.gray400,
    marginTop: 2,
  },
  noRatingContainer: {
    alignItems: "center",
  },
  noRatingText: {
    fontSize: 11,
    color: COLORS.gray400,
    marginTop: 2,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: COLORS.backdrop,
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray200,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.gray800,
  },
  closeButton: {
    padding: 8,
  },
  modalBody: {
    padding: 20,
  },
  detailSection: {
    marginBottom: 16,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.gray600,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    color: COLORS.gray800,
  },
  ratingDetailRow: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  ratingDetailValue: {
    fontSize: 18,
    fontWeight: "700",
    marginRight: 8,
  },
  ratingDetailCount: {
    fontSize: 14,
    color: COLORS.gray500,
  },
});

export { AdminUserRating };
export default AdminUserRating;