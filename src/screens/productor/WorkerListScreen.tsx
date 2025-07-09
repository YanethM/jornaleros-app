import React, { useState, useEffect } from "react";
import ScreenLayout from "../../components/ScreenLayout";
import {
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Animated,
  Dimensions,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import CustomTabBar from "../../components/CustomTabBar";
import { useAuth } from "../../context/AuthContext";
import ApiClient from "../../utils/api";
import { getApprovedWorkersByEmployer } from "../../services/employerService";
import { checkWorkerRating } from "../../services/qualifitionService";

const { width } = Dimensions.get('window');
const PRIMARY_COLOR = "#284F66";
const SECONDARY_COLOR = "#B5883E";
const LIGHT_GRAY = "#F8F9FA";
const SUCCESS_COLOR = "#4CAF50";
const WARNING_COLOR = "#FFC107";
const CARD_SHADOW = {
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.1,
  shadowRadius: 12,
  elevation: 6,
};

interface Worker {
  id: string;
  workerId?: string;
  user: {
    id: string;
    name: string;
    lastname: string;
    email: string;
    phone?: string;
    documentId?: string;
    documentType?: string;
    city?: {
      name: string;
    } | string;
    departmentState?: {
      name: string;
    } | string;
    state?: {
      name: string;
    } | string;
    location?: {
      country?: string;
      departmentState?: string;
      city?: string;
    };
  };
  skills?: Array<{ name: string }> | string[];
  experience?: string;
  availability: boolean;
  applicationStatus: string;
  farmName?: string;
  workerProfile?: {
    skills?: string[];
    experience?: string;
    availability?: boolean;
    paymentAmount?: number;
  };
  ratings?: {
    averageRating?: number;
    totalReviews: number;
    totalQualifications: number;
    isRated: boolean;
    latestReviews?: Array<{
      id: string;
      rating: number;
      comment?: string;
      createdAt: string;
      reviewer: {
        name: string;
        lastname: string;
      };
    }>;
    qualifications?: Array<{
      id: string;
      rating: number;
      description?: string;
      createdAt: string;
      question: {
        question: string;
      };
    }>;
  };
  farm?: {
    id: string;
    name: string;
    size: number;
    plantCount?: number;
    specificLocation?: string;
    fullLocation?: string;
    location: {
      country?: string;
      department?: string;
      city?: string;
      village?: string;
    };
  } | null;
  applicationDate?: string;
  acceptedAt?: string;
  employerMessage?: string;
  message?: string;
  jobOffer?: {
    id: string;
    title: string;
    description: string;
    startDate: string;
    endDate: string;
    salary: number;
    paymentType: string;
    cropType?: string;
    phase?: string;
    phaseDescription?: string;
  };
}

interface Stats {
  averageExperience?: number;
  totalApprovedWorkers: number;
  totalJobOffers: number;
  ratingsStatistics?: {
    totalRatedWorkers: number;
    totalUnratedWorkers: number;
    ratingPercentage: number;
    globalAverageRating?: number;
    totalReviews: number;
    totalQualifications: number;
  };
  farmsInfo?: {
    uniqueFarms: Array<{
      id: string;
      name: string;
      size: number;
      fullLocation?: string;
    }>;
    totalFarms: number;
  };
}

interface Pagination {
  currentPage: number;
  hasNext: boolean;
  hasPrev: boolean;
  limit: number;
  totalPages: number;
  totalWorkers: number;
}

interface WorkerListScreenProps {
  navigation: any;
}

type FilterTab = 'all' | 'rated' | 'unrated';

const WorkerListScreen: React.FC<WorkerListScreenProps> = ({ navigation }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [filteredWorkers, setFilteredWorkers] = useState<Worker[]>([]);
  const [ratedWorkers, setRatedWorkers] = useState<Record<string, boolean>>({});
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [stats, setStats] = useState<Stats>({
    averageExperience: 0,
    totalApprovedWorkers: 0,
    totalJobOffers: 0,
    ratingsStatistics: {
      totalRatedWorkers: 0,
      totalUnratedWorkers: 0,
      ratingPercentage: 0,
      totalReviews: 0,
      totalQualifications: 0,
    },
    farmsInfo: {
      uniqueFarms: [],
      totalFarms: 0,
    },
  });
  const [pagination, setPagination] = useState<Pagination>({
    currentPage: 1,
    hasNext: false,
    hasPrev: false,
    limit: 20,
    totalPages: 0,
    totalWorkers: 0,
  });
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [unreadMessages, setUnreadMessages] = useState<Record<string, number>>({});
  const [slideAnim] = useState(new Animated.Value(0));

  const tabs = [
    { key: 'all', title: 'Todos', icon: 'people' },
    { key: 'rated', title: 'Evaluados', icon: 'star' },
    { key: 'unrated', title: 'Sin Evaluar', icon: 'star-border' },
  ];

  useEffect(() => {
    loadWorkers();
    Animated.timing(slideAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      if (workers.length > 0) {
        loadUnreadMessages();
      }
    });
    return unsubscribe;
  }, [navigation, workers]);

  useEffect(() => {
    filterWorkers();
  }, [workers, activeTab]);

  const filterWorkers = () => {
    let filtered = [...workers];
    
    switch (activeTab) {
      case 'rated':
        filtered = workers.filter(worker => worker.ratings?.isRated || ratedWorkers[worker.id]);
        break;
      case 'unrated':
        filtered = workers.filter(worker => !(worker.ratings?.isRated || ratedWorkers[worker.id]));
        break;
      default:
        filtered = workers;
    }
    
    setFilteredWorkers(filtered);
  };

  const totalUnreadMessages = Object.values(unreadMessages).reduce(
    (sum, count) => sum + count,
    0
  );

  const processJobOffers = (jobOffersWithWorkers: any[]) => {
    const workersMap = new Map();
    jobOffersWithWorkers.forEach((jobOfferData) => {
      jobOfferData?.approvedWorkers?.forEach((worker: any) => {
        if (worker && (worker.workerId || worker.id) && !workersMap.has(worker.workerId || worker.id)) {
          const workerId = worker.workerId || worker.id;
          workersMap.set(workerId, {
            id: workerId,
            workerId: workerId,
            user: {
              ...worker.user,
              city: worker.user.location?.city ? { name: worker.user.location.city } : worker.user.city,
              departmentState: worker.user.location?.departmentState ? { name: worker.user.location.departmentState } : worker.user.departmentState,
            },
            workerProfile: worker.workerProfile || {},
            skills: worker.workerProfile?.skills || worker.skills || [],
            experience: worker.workerProfile?.experience || worker.experience || "",
            availability: worker.workerProfile?.availability ?? worker.availability ?? true,
            applicationStatus: "Aceptada",
            farmName: worker.farm?.name || jobOfferData.jobOffer?.farm?.name || "Finca no especificada",
            ratings: worker.ratings || {
              isRated: false,
              totalReviews: 0,
              totalQualifications: 0,
            },
            farm: worker.farm,
            jobOffer: worker.jobOffer || jobOfferData.jobOffer,
            applicationDate: worker.applicationDate,
            acceptedAt: worker.acceptedAt,
            employerMessage: worker.employerMessage,
            message: worker.message,
          });
        }
      });
    });
    return Array.from(workersMap.values());
  };

  const loadWorkers = async (page = 1, search = "", append = false) => {
    try {
      if (page === 1) {
        setRefreshing(true);
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      setError(null);

      if (!user?.id) throw new Error("No hay usuario autenticado");

      const fullUserData = await ApiClient.get(`/user/list/${user.id}`);
      const employerId = fullUserData?.data?.employerProfile?.id;
      
      if (!employerId) throw new Error("El usuario no tiene perfil de empleador");

      const response = await getApprovedWorkersByEmployer(employerId);
      if (!response.success || !response.data) throw new Error(response.message || "Error al obtener datos");

      const jobOffersWithWorkers = response.data.data?.jobOffersWithWorkers || response.data.jobOffersWithWorkers || [];
      const allWorkers = processJobOffers(jobOffersWithWorkers);
      
      const filteredWorkers = search.trim()
        ? allWorkers.filter((w) => 
            w.user.name.toLowerCase().includes(search.toLowerCase()) || 
            w.user.lastname.toLowerCase().includes(search.toLowerCase()) || 
            w.user.email.toLowerCase().includes(search.toLowerCase()) ||
            w.farmName?.toLowerCase().includes(search.toLowerCase())
          )
        : allWorkers;

      // Verificar estado de calificaciones para compatibilidad con versión anterior
      const ratedStatusMap: Record<string, boolean> = {};
      await Promise.all(filteredWorkers.map(async (w) => { 
        try {
          const ratingCheck = await checkWorkerRating(w.id);
          ratedStatusMap[w.id] = ratingCheck?.data?.alreadyRated || false;
        } catch (error) {
          console.error(`Error checking rating for worker ${w.id}:`, error);
          ratedStatusMap[w.id] = false;
        }
      }));
      setRatedWorkers(ratedStatusMap);

      const paginated = filteredWorkers.slice((page - 1) * 20, page * 20);
      setWorkers((prev) => (append ? [...prev, ...paginated] : paginated));

      setPagination({
        currentPage: page,
        hasNext: page * 20 < filteredWorkers.length,
        hasPrev: page > 1,
        limit: 20,
        totalPages: Math.ceil(filteredWorkers.length / 20),
        totalWorkers: filteredWorkers.length,
      });

      // Establecer estadísticas con valores por defecto
      setStats({
        averageExperience: 0,
        totalApprovedWorkers: response.data.totalApprovedWorkers || allWorkers.length,
        totalJobOffers: response.data.totalJobOffers || jobOffersWithWorkers.length,
        ratingsStatistics: response.data.ratingsStatistics || {
          totalRatedWorkers: allWorkers.filter(w => w.ratings?.isRated).length,
          totalUnratedWorkers: allWorkers.filter(w => !w.ratings?.isRated).length,
          ratingPercentage: allWorkers.length > 0 ? Math.round((allWorkers.filter(w => w.ratings?.isRated).length / allWorkers.length) * 100) : 0,
          totalReviews: 0,
          totalQualifications: 0,
        },
        farmsInfo: response.data.farmsInfo || {
          uniqueFarms: [],
          totalFarms: 0,
        },
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  const onRefresh = () => {
    loadWorkers(1, searchTerm, false);
  };

  const loadMoreWorkers = () => {
    if (!loadingMore && pagination.hasNext) {
      loadWorkers(pagination.currentPage + 1, searchTerm, true);
    }
  };

  const handleContactWorker = (worker: Worker) => {
    const workerFullName = getWorkerFullName(worker);

    setUnreadMessages((prev) => ({
      ...prev,
      [worker.id]: 0,
    }));

    if (!worker.user?.id) {
      Alert.alert("Error", "No se pudo obtener el ID del usuario");
      return;
    }

    navigation.navigate("AddMessage", {
      receiverId: worker.user.id,
      workerName: workerFullName,
      workerEmail: worker.user?.email,
      workerPhone: worker.user?.phone,
      workerProfile: {
        id: worker.id,
        user: worker.user,
        skills: worker.skills || [],
        availability: worker.availability,
        experience: worker.experience,
        applicationStatus: worker.applicationStatus,
        location: getLocationText(worker),
        farmName: worker.farmName,
        ratings: worker.ratings,
      },
    });
  };

  const handleRateWorker = (worker: Worker) => {
    const workerFullName = getWorkerFullName(worker);

    navigation.navigate("RateWorker", {
      workerId: worker.id,
      workerName: workerFullName,
      workerEmail: worker.user?.email,
      workerProfile: {
        id: worker.id,
        user: worker.user,
        skills: worker.skills || [],
        availability: worker.availability,
        experience: worker.experience,
        applicationStatus: worker.applicationStatus,
        location: getLocationText(worker),
        farmName: worker.farmName,
        jobOffer: worker.jobOffer,
        ratings: worker.ratings,
      },
    });
  };

  const loadUnreadMessages = async () => {
    try {
      const mockUnread = workers.reduce(
        (acc, worker) => ({
          ...acc,
          [worker.id]: Math.floor(Math.random() * 5),
        }),
        {}
      );
      setUnreadMessages(mockUnread);
    } catch (error) {
      console.error("Error cargando mensajes no leídos:", error);
    }
  };

  const getLocationText = (worker: Worker) => {
    const cityName =
      typeof worker.user.city === "string"
        ? worker.user.city
        : worker.user.city?.name || worker.user.location?.city || "No especificado";

    const stateName =
      typeof worker.user.departmentState === "string"
        ? worker.user.departmentState
        : worker.user.departmentState?.name || worker.user.location?.departmentState || "";

    return stateName ? `${cityName}, ${stateName}` : cityName;
  };

  const getWorkerFullName = (worker: Worker) => {
    return `${worker.user.name || ""} ${worker.user.lastname || ""}`.trim();
  };

  const getSkillsText = (worker: Worker) => {
    const skills = worker.skills || worker.workerProfile?.skills || [];
    if (!skills || skills.length === 0) {
      return "Sin habilidades especificadas";
    }

    if (typeof skills[0] === "string") {
      return skills.slice(0, 3).join(", ") + (skills.length > 3 ? "..." : "");
    }

    return (
      skills
        .slice(0, 3)
        .map((skill: any) => skill.name || skill)
        .filter(Boolean)
        .join(", ") + (skills.length > 3 ? "..." : "")
    );
  };

  const renderRatingStars = (rating?: number, size = 16) => {
    if (!rating) return null;
    
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    
    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <Icon key={`full-${i}`} name="star" size={size} color={SECONDARY_COLOR} />
      );
    }
    
    if (hasHalfStar) {
      stars.push(
        <Icon key="half" name="star-half" size={size} color={SECONDARY_COLOR} />
      );
    }
    
    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <Icon key={`empty-${i}`} name="star-border" size={size} color="#DDD" />
      );
    }
    
    return <View style={styles.starsContainer}>{stars}</View>;
  };

  const renderTabBar = () => (
    <View style={styles.tabContainer}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.key;
        const count = tab.key === 'all' ? workers.length : 
                     tab.key === 'rated' ? workers.filter(w => w.ratings?.isRated || ratedWorkers[w.id]).length :
                     workers.filter(w => !(w.ratings?.isRated || ratedWorkers[w.id])).length;
        
        return (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, isActive && styles.activeTab]}
            onPress={() => setActiveTab(tab.key as FilterTab)}
          >
            <Icon 
              name={tab.icon} 
              size={20} 
              color={isActive ? PRIMARY_COLOR : '#666'} 
            />
            <Text style={[styles.tabText, isActive && styles.activeTabText]}>
              {tab.title}
            </Text>
            <View style={[styles.tabBadge, isActive && styles.activeTabBadge]}>
              <Text style={[styles.tabBadgeText, isActive && styles.activeTabBadgeText]}>
                {count}
              </Text>
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );



  const renderWorkerItem = ({ item, index }: { item: Worker; index: number }) => {
    const unreadCount = unreadMessages[item.id] || 0;
    const isRated = item.ratings?.isRated || ratedWorkers[item.id] || false;
    const averageRating = item.ratings?.averageRating;

    return (
      <Animated.View
        style={[
          styles.workerCard,
          {
            opacity: slideAnim,
            transform: [{
              translateX: slideAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [50, 0],
              }),
            }],
          }
        ]}
      >
        <View style={styles.workerHeader}>
          <View style={styles.workerImageContainer}>
            <View style={[styles.workerAvatar, { backgroundColor: isRated ? SECONDARY_COLOR : PRIMARY_COLOR }]}>
              <Icon name="person" size={32} color="#fff" />
            </View>
            {isRated && (
              <View style={styles.ratedBadge}>
                <Icon name="star" size={16} color="#fff" />
              </View>
            )}
          </View>

          <View style={styles.workerMainInfo}>
            <Text style={styles.workerName}>{getWorkerFullName(item)}</Text>
            
            {/* Rating Display */}
            {averageRating && (
              <View style={styles.ratingContainer}>
                {renderRatingStars(averageRating, 14)}
                <Text style={styles.ratingText}>
                  {averageRating.toFixed(1)} ({(item.ratings?.totalReviews || 0) + (item.ratings?.totalQualifications || 0)} eval.)
                </Text>
              </View>
            )}
            
            {/* Farm Information */}
            {item.farmName && (
              <View style={styles.farmContainer}>
                <Icon name="agriculture" size={16} color={SECONDARY_COLOR} />
                <Text style={styles.farmName}>{item.farmName}</Text>
              </View>
            )}

            <View style={styles.workerDetail}>
              <Icon name="location-on" size={16} color="#666" />
              <Text style={styles.workerDetailText}>{getLocationText(item)}</Text>
            </View>
          </View>

          <View style={styles.statusContainer}>
            <View style={[styles.statusBadge, { backgroundColor: SUCCESS_COLOR }]}>
              <Text style={styles.statusText}>Activo</Text>
            </View>
          </View>
        </View>

        <View style={styles.workerDetails}>
          {item.user.email && (
            <View style={styles.workerDetail}>
              <Icon name="email" size={16} color="#666" />
              <Text style={styles.workerDetailText}>{item.user.email}</Text>
            </View>
          )}

          {item.user.phone && (
            <View style={styles.workerDetail}>
              <Icon name="phone" size={16} color="#666" />
              <Text style={styles.workerDetailText}>{item.user.phone}</Text>
            </View>
          )}

          <View style={styles.workerDetail}>
            <Icon name="construction" size={16} color="#666" />
            <Text style={styles.workerDetailText}>{getSkillsText(item)}</Text>
          </View>

          {item.experience && (
            <View style={styles.workerDetail}>
              <Icon name="work" size={16} color="#666" />
              <Text style={styles.workerDetailText} numberOfLines={2}>
                Exp: {item.experience}
              </Text>
            </View>
          )}

          <View style={styles.workerDetail}>
            <Icon
              name={item.availability ? "check-circle" : "cancel"}
              size={16}
              color={item.availability ? SUCCESS_COLOR : "#F44336"}
            />
            <Text
              style={[
                styles.workerDetailText,
                { color: item.availability ? SUCCESS_COLOR : "#F44336" },
              ]}>
              {item.availability ? "Disponible" : "No disponible"}
            </Text>
          </View>

          {/* Job Offer Information */}
          {item.jobOffer && (
            <View style={styles.jobOfferContainer}>
              <Text style={styles.jobOfferTitle}>Trabajo: {item.jobOffer.title}</Text>
              <Text style={styles.jobOfferDetails}>
                {item.jobOffer.cropType} - {item.jobOffer.phase}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity
            style={styles.contactButton}
            onPress={() => handleContactWorker(item)}>
            <Icon name="chat" size={20} color="#fff" />
            {unreadCount > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadText}>
                  {unreadCount > 9 ? "9+" : unreadCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.rateButton,
              isRated && styles.ratedButton,
            ]}
            disabled={isRated}
            onPress={() => handleRateWorker(item)}>
            <Icon 
              name={isRated ? "star" : "star-border"} 
              size={20} 
              color="#fff" 
            />
          </TouchableOpacity>
        </View>
      </Animated.View>
    );
  };

  const renderLoadMoreButton = () => {
    if (!pagination.hasNext) return null;

    return (
      <TouchableOpacity
        style={styles.loadMoreButton}
        onPress={loadMoreWorkers}
        disabled={loadingMore}>
        {loadingMore ? (
          <ActivityIndicator size="small" color={PRIMARY_COLOR} />
        ) : (
          <>
            <Icon name="expand-more" size={20} color={PRIMARY_COLOR} />
            <Text style={styles.loadMoreText}>
              Cargar más ({pagination.totalWorkers - workers.length} restantes)
            </Text>
          </>
        )}
      </TouchableOpacity>
    );
  };

  const renderEmptyComponent = () => {
    const getEmptyMessage = () => {
      switch (activeTab) {
        case 'rated':
          return {
            icon: 'star-border',
            title: 'No hay trabajadores evaluados',
            subtitle: 'Los trabajadores evaluados aparecerán aquí.',
          };
        case 'unrated':
          return {
            icon: 'people-outline',
            title: 'Todos los trabajadores han sido evaluados',
            subtitle: 'Excelente gestión de tu equipo de trabajo.',
          };
        default:
          return {
            icon: 'people-outline',
            title: 'No tienes trabajadores asociados',
            subtitle: 'Los trabajadores aparecerán aquí cuando apliquen a tus ofertas de trabajo.',
          };
      }
    };

    const emptyData = getEmptyMessage();

    return (
      <View style={styles.emptyContainer}>
        <Icon name={emptyData.icon} size={80} color="#ccc" />
        <Text style={styles.emptyText}>{emptyData.title}</Text>
        <Text style={styles.emptySubText}>
          {emptyData.subtitle}
          {activeTab === 'all' && stats.totalJobOffers > 0 &&
            ` Tienes ${stats.totalJobOffers} ofertas publicadas.`}
        </Text>
        {activeTab === 'all' && (
          <TouchableOpacity
            style={styles.emptyButton}
            onPress={() => navigation.navigate("JobOffers")}>
            <Text style={styles.emptyButtonText}>Ver Ofertas de Trabajo</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <ScreenLayout navigation={navigation}>
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}>
              <Icon name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Empleados</Text>
            <View style={styles.headerStats}>
              <Text style={styles.headerStatsText}>
                {filteredWorkers.length} de {workers.length}
              </Text>
            </View>
          </View>
        </View>
        {renderTabBar()}

        {loading && !refreshing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={PRIMARY_COLOR} />
            <Text style={styles.loadingText}>Cargando trabajadores...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Icon name="error-outline" size={60} color="#999" />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={() => loadWorkers()}>
              <Text style={styles.retryButtonText}>Reintentar</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={filteredWorkers}
            renderItem={renderWorkerItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={renderEmptyComponent}
            ListFooterComponent={renderLoadMoreButton}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[PRIMARY_COLOR]}
                tintColor={PRIMARY_COLOR}
              />
            }
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
      <CustomTabBar navigation={navigation} currentRoute="WorkerList" />
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: LIGHT_GRAY,
  },
  header: {
    backgroundColor: PRIMARY_COLOR,
    paddingTop: Platform.OS === "ios" ? 50 : 20,
    paddingBottom: 20,
    paddingHorizontal: 20,
    ...CARD_SHADOW,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#fff",
    flex: 1,
    textAlign: "center",
    marginLeft: -40,
  },
  headerStats: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
  },
  headerStatsText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  headerUnreadBadge: {
    backgroundColor: "#FF3B30",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  headerUnreadText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
  },
  statsContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: "#fff",
    marginBottom: 16,
    justifyContent: "space-between",
    ...CARD_SHADOW,
  },
  statCard: {
    alignItems: "center",
    flex: 1,
  },
  statIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: LIGHT_GRAY,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "800",
    color: "#333",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
    fontWeight: "600",
    lineHeight: 16,
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#fff",
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 16,
    padding: 4,
    ...CARD_SHADOW,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
    gap: 6,
  },
  activeTab: {
    backgroundColor: LIGHT_GRAY,
  },
  tabText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#666",
  },
  activeTabText: {
    color: PRIMARY_COLOR,
  },
  tabBadge: {
    backgroundColor: "#E0E0E0",
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 20,
  },
  activeTabBadge: {
    backgroundColor: PRIMARY_COLOR,
  },
  tabBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#666",
    textAlign: "center",
  },
  activeTabBadgeText: {
    color: "#fff",
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 120,
  },
  workerCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    marginBottom: 16,
    padding: 20,
    ...CARD_SHADOW,
  },
  workerHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  workerImageContainer: {
    marginRight: 16,
    position: "relative",
  },
  workerAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  ratedBadge: {
    position: "absolute",
    bottom: -4,
    right: -4,
    backgroundColor: SECONDARY_COLOR,
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  workerMainInfo: {
    flex: 1,
  },
  workerName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333",
    marginBottom: 8,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  starsContainer: {
    flexDirection: "row",
    marginRight: 8,
  },
  ratingText: {
    fontSize: 12,
    color: "#666",
    fontWeight: "500",
  },
  farmContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: `${SECONDARY_COLOR}15`,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 8,
    alignSelf: "flex-start",
  },
  farmName: {
    fontSize: 13,
    color: SECONDARY_COLOR,
    fontWeight: "600",
    marginLeft: 6,
  },
  workerDetails: {
    marginBottom: 16,
  },
  workerDetail: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  workerDetailText: {
    fontSize: 14,
    color: "#666",
    marginLeft: 10,
    flex: 1,
    fontWeight: "500",
  },
  jobOfferContainer: {
    backgroundColor: `${PRIMARY_COLOR}08`,
    padding: 12,
    borderRadius: 12,
    marginTop: 8,
  },
  jobOfferTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: PRIMARY_COLOR,
    marginBottom: 4,
  },
  jobOfferDetails: {
    fontSize: 12,
    color: "#666",
  },
  statusContainer: {
    alignItems: "flex-end",
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 12,
    color: "#fff",
    fontWeight: "700",
  },
  actionButtonsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  contactButton: {
    backgroundColor: PRIMARY_COLOR,
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
    flex: 1,
  },
  rateButton: {
    backgroundColor: SECONDARY_COLOR,
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    flex: 1,
  },
  ratedButton: {
    backgroundColor: SUCCESS_COLOR,
  },
  detailButton: {
    backgroundColor: LIGHT_GRAY,
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: PRIMARY_COLOR,
    flex: 1,
  },
  unreadBadge: {
    position: "absolute",
    top: -6,
    right: -6,
    backgroundColor: "#FF3B30",
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  unreadText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "700",
  },
  loadMoreButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginTop: 16,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: PRIMARY_COLOR,
    ...CARD_SHADOW,
  },
  loadMoreText: {
    color: PRIMARY_COLOR,
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
    marginTop: 60,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: "700",
    color: "#666",
    marginTop: 20,
    textAlign: "center",
  },
  emptySubText: {
    fontSize: 15,
    color: "#999",
    textAlign: "center",
    marginTop: 12,
    paddingHorizontal: 20,
    lineHeight: 22,
  },
  emptyButton: {
    backgroundColor: PRIMARY_COLOR,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 16,
    marginTop: 24,
    ...CARD_SHADOW,
  },
  emptyButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loadingText: {
    fontSize: 16,
    color: "#666",
    marginTop: 16,
    fontWeight: "500",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginTop: 16,
    fontWeight: "500",
  },
  retryButton: {
    marginTop: 24,
    backgroundColor: PRIMARY_COLOR,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 16,
    ...CARD_SHADOW,
  },
  retryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
});

export default WorkerListScreen;