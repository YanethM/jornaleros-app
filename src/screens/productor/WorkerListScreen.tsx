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
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import CustomTabBar from "../../components/CustomTabBar";
import { useAuth } from "../../context/AuthContext";
import ApiClient from "../../utils/api";

const PRIMARY_COLOR = "#284F66";

interface Worker {
  id: string;
  user: {
    id: string;
    name: string;
    lastname: string;
    email: string;
    phone?: string;
    city?:
      | {
          name: string;
        }
      | string;
    departmentState?:
      | {
          name: string;
        }
      | string;
    state?:
      | {
          name: string;
        }
      | string;
  };
  skills?: Array<{ name: string }> | string[];
  experience?: string;
  availability: boolean;
  applicationStatus: string;
}

interface WorkerListScreenProps {
  navigation: any;
}

const WorkerListScreen: React.FC<WorkerListScreenProps> = ({ navigation }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [unreadMessages, setUnreadMessages] = useState<Record<string, number>>(
    {}
  );

  useEffect(() => {
    loadWorkers();
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      if (workers.length > 0) {
        loadUnreadMessages();
      }
    });

    return unsubscribe;
  }, [navigation, workers]);

  const totalUnreadMessages = Object.values(unreadMessages).reduce(
    (sum, count) => sum + count,
    0
  );

  const getUserData = async () => {
    try {
      const result = await ApiClient.get(`/user/list/${user.id}`);
      if (!result.success || !result.data) {
        throw new Error("Error al obtener datos del usuario");
      }
      return result.data;
    } catch (error) {
      console.error("Error obteniendo datos del usuario:", error);
      throw error;
    }
  };

  const loadWorkers = async (isRefreshing = false) => {
    try {
      if (!isRefreshing) {
        setLoading(true);
      }
      setError(null);

      if (!user?.id) {
        throw new Error("No hay usuario autenticado");
      }

      const fullUserData = await getUserData();

      if (!fullUserData.employerProfile) {
        throw new Error("El usuario no tiene perfil de empleador");
      }

      const employerId = fullUserData.employerProfile.id;
      if (!employerId) {
        throw new Error("No se encontró el ID del empleador");
      }

      const result = await ApiClient.get(`/employer/${employerId}/workers`);
      setWorkers(result.data || []);
    } catch (error) {
      console.error("Error cargando trabajadores:", error);
      setError(error.message || "Error al cargar los trabajadores");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadWorkers(true);
  };

  const handleContactWorker = (worker) => {
    const workerFullName = getWorkerFullName(worker);

    Alert.alert(
      "💬 Contactar Trabajador",
      `Enviar mensaje a ${workerFullName}`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "📱 Enviar Mensaje",
          onPress: () => {
            setUnreadMessages((prev) => ({
              ...prev,
              [worker.id]: 0,
            }));
            
            if (!worker.user?.id) {
              Alert.alert("Error", "No se pudo obtener el ID del usuario");
              return;
            }

            // ✅ NAVEGACIÓN CORREGIDA: Pasar datos completos sin necesidad de cargar desde backend
            navigation.navigate("AddMessage", {
              // Para evitar confusión, pasamos todos los datos que necesitamos:
              receiverId: worker.user.id, // ← User ID para enviar mensaje
              workerName: workerFullName,
              workerEmail: worker.user?.email,
              workerPhone: worker.user?.phone,

              // Datos completos del worker para mostrar en la UI
              workerProfile: {
                id: worker.id, // WorkerProfile ID
                user: worker.user, // Datos del usuario
                skills: worker.skills || [],
                availability: worker.availability,
                experience: worker.experience,
                applicationStatus: worker.applicationStatus,
                location: getLocationText(worker),
              },
            });
          },
        },
      ],
      { cancelable: true }
    );
  };

  const loadUnreadMessages = async () => {
    try {
      // Simular carga de mensajes no leídos por trabajador
      const mockUnread = workers.reduce(
        (acc, worker) => ({
          ...acc,
          [worker.id]: Math.floor(Math.random() * 5), // Ejemplo: 0-4 mensajes no leídos
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
        : worker.user.city?.name || "No especificado";

    const stateName =
      typeof worker.user.departmentState === "string"
        ? worker.user.departmentState
        : worker.user.departmentState?.name || worker.user.state?.name || "";

    return stateName ? `${cityName}, ${stateName}` : cityName;
  };

  const getWorkerFullName = (worker: Worker) => {
    return `${worker.user.name || ""} ${worker.user.lastname || ""}`.trim();
  };

  const getSkillsText = (worker: Worker) => {
    if (!worker.skills || worker.skills.length === 0) {
      return "Sin habilidades especificadas";
    }

    if (typeof worker.skills[0] === "string") {
      return (
        worker.skills.slice(0, 3).join(", ") +
        (worker.skills.length > 3 ? "..." : "")
      );
    }

    return (
      worker.skills
        .slice(0, 3)
        .map((skill) => skill.name || skill)
        .filter(Boolean)
        .join(", ") + (worker.skills.length > 3 ? "..." : "")
    );
  };

  const renderWorkerItem = ({ item }: { item: Worker }) => {
    const unreadCount = unreadMessages[item.id] || 0;

    return (
      <View style={styles.workerCard}>
        <View style={styles.workerImageContainer}>
          <View style={styles.workerAvatar}>
            <Icon name="person" size={30} color="#fff" />
          </View>
        </View>

        <View style={styles.workerInfo}>
          <Text style={styles.workerName}>{getWorkerFullName(item)}</Text>

          <View style={styles.workerDetail}>
            <Icon name="location-on" size={16} color="#666" />
            <Text style={styles.workerDetailText}>{getLocationText(item)}</Text>
          </View>

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
              color={item.availability ? "#4CAF50" : "#F44336"}
            />
            <Text
              style={[
                styles.workerDetailText,
                { color: item.availability ? "#4CAF50" : "#F44336" },
              ]}>
              {item.availability ? "Disponible" : "No disponible"}
            </Text>
          </View>

          <View style={styles.statusContainer}>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: getStatusColor(item.applicationStatus) },
              ]}>
              <Text style={styles.statusText}>
                {getStatusText(item.applicationStatus)}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.actionButtons}>
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
            style={styles.detailButton}
            onPress={() =>
              navigation.navigate("WorkerProfileApplication", {
                workerId: item.id,
              })
            }>
            <Icon name="info" size={20} color={PRIMARY_COLOR} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Aceptada":
      case "Completado":
        return "#4CAF50";
      case "Pendiente":
      case "Solicitado":
      case "En_revision":
        return "#FFC107";
      case "Rechazada":
      case "Rechazado":
        return "#F44336";
      default:
        return "#757575";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "Aceptada":
      case "Completado":
        return "Activo";
      case "Pendiente":
      case "Solicitado":
        return "Pendiente";
      case "En_revision":
        return "En Revisión";
      case "Rechazada":
      case "Rechazado":
        return "Inactivo";
      default:
        return status || "Desconocido";
    }
  };

  const renderEmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <Icon name="people-outline" size={80} color="#ccc" />
      <Text style={styles.emptyText}>No tienes trabajadores asociados</Text>
      <Text style={styles.emptySubText}>
        Los trabajadores aparecerán aquí cuando apliquen a tus ofertas de
        trabajo
      </Text>
      <TouchableOpacity
        style={styles.emptyButton}
        onPress={() => navigation.navigate("JobOffers")}>
        <Text style={styles.emptyButtonText}>Ver Ofertas de Trabajo</Text>
      </TouchableOpacity>
    </View>
  );

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
              <Text style={styles.headerStatsText}>{workers.length} total</Text>
              {totalUnreadMessages > 0 && (
                <View style={styles.headerUnreadBadge}>
                  <Text style={styles.headerUnreadText}>
                    {totalUnreadMessages} sin leer
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>

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
            data={workers}
            renderItem={renderWorkerItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={renderEmptyComponent}
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
    backgroundColor: "#f8f9fa",
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    backgroundColor: PRIMARY_COLOR,
    paddingTop: Platform.OS === "ios" ? 50 : 20,
    paddingBottom: 20,
    paddingHorizontal: 20,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#fff",
    flex: 1,
    textAlign: "center",
    marginLeft: -36,
  },
  headerStats: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  headerStatsText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  headerUnreadBadge: {
    backgroundColor: "#FF3B30",
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  headerUnreadText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  listContent: {
    padding: 16,
    paddingBottom: 120,
  },
  workerCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    marginBottom: 16,
    padding: 16,
    flexDirection: "row",
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
  workerImageContainer: {
    marginRight: 16,
  },
  workerAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: PRIMARY_COLOR,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  workerInfo: {
    flex: 1,
  },
  workerName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333",
    marginBottom: 8,
  },
  workerDetail: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  workerDetailText: {
    fontSize: 14,
    color: "#666",
    marginLeft: 8,
    flex: 1,
    fontWeight: "500",
  },
  statusContainer: {
    flexDirection: "row",
    marginTop: 8,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    color: "#fff",
    fontWeight: "600",
  },
  actionButtons: {
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  contactButton: {
    backgroundColor: PRIMARY_COLOR,
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  detailButton: {
    backgroundColor: "#f0f0f0",
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: PRIMARY_COLOR,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
    marginTop: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#666",
    marginTop: 16,
    textAlign: "center",
  },
  emptySubText: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
    marginTop: 8,
    paddingHorizontal: 20,
    lineHeight: 20,
  },
  emptyButton: {
    backgroundColor: PRIMARY_COLOR,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 20,
  },
  emptyButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
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
  },
  retryButton: {
    marginTop: 24,
    backgroundColor: PRIMARY_COLOR,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  unreadBadge: {
    position: "absolute",
    top: -6,
    right: -6,
    backgroundColor: "#FF3B30",
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  unreadText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
});

const getWorkerSkills = (worker) => {
  if (!worker.skills || worker.skills.length === 0) {
    return [];
  }

  if (typeof worker.skills[0] === "string") {
    return worker.skills;
  }

  return worker.skills.map((skill) => skill.name || skill).filter(Boolean);
};

export default WorkerListScreen;
