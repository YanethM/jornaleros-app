import React, { useEffect, useState } from "react";
import ScreenLayoutAdmin from "../../components/ScreenLayoutAdmin";
import Icon from "react-native-vector-icons/MaterialIcons";
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  ScrollView,
  Alert,
  Animated,
  Platform,
  ActivityIndicator,
} from "react-native";
import { RectButton, Swipeable } from "react-native-gesture-handler";
import { getCropType, deleteCropType } from "../../services/cropTypeService";
import { useIsFocused } from "@react-navigation/native";

const PRIMARY_COLOR = "#284F66";
const SECONDARY_COLOR = "#4A7C94";
const DANGER_COLOR = "#e74c3c";
const LIGHT_BACKGROUND = "#f8fafc";

const AdminCropTypesScreen = ({ navigation }) => {
  const [cropTypes, setCropTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const isFocused = useIsFocused();

  const fetchCropTypes = async () => {
    try {
      setRefreshing(true);
      const data = await getCropType();
      setCropTypes(data);
    } catch (error) {
      console.error("Error al obtener tipos de cultivo:", error);
      Alert.alert("Error", "No se pudieron cargar los tipos de cultivo");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (isFocused) {
      fetchCropTypes();
    }
  }, [isFocused]);

  const handleRefresh = () => {
    fetchCropTypes();
  };

  const handleDelete = async (cropId, cropName) => {
    Alert.alert(
      "Confirmar eliminación",
      `¿Estás seguro que deseas eliminar el cultivo "${cropName}"?`,
      [
        {
          text: "Cancelar",
          style: "cancel",
        },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteCropType(cropId);
              fetchCropTypes(); // Actualizar la lista después de eliminar
              Alert.alert("Éxito", "El cultivo ha sido eliminado correctamente");
            } catch (error) {
              console.error("Error al eliminar:", error);
              Alert.alert(
                "Error",
                error.message || "No se pudo eliminar el cultivo"
              );
            }
          },
        },
      ]
    );
  };

  const handleViewPhases = (cropType) => {
    // Navegar a la pantalla de fases del cultivo
    navigation.navigate("CropTypePhase", { 
      cropTypeId: cropType.id,
      cropTypeName: cropType.name 
    });
  };

  const renderRightActions = (progress, dragX, item) => {
    const trans = dragX.interpolate({
      inputRange: [0, 50, 100, 101],
      outputRange: [0, 0, 0, 1],
    });

    return (
      <View style={styles.swipeActionsContainer}>
        {/* Botón Ver Fases */}
        <RectButton
          style={[styles.rightAction, { backgroundColor: SECONDARY_COLOR }]}
          onPress={() => handleViewPhases(item)}
        >
          <Animated.View
            style={[
              styles.actionContent,
              {
                transform: [{ translateX: trans }],
              },
            ]}
          >
            <Icon name="visibility" size={20} color="white" />
            <Text style={styles.actionText}>Ver Fases</Text>
          </Animated.View>
        </RectButton>

        {/* Botón Eliminar */}
        <RectButton
          style={[styles.rightAction, { backgroundColor: DANGER_COLOR }]}
          onPress={() => handleDelete(item.id, item.name)}
        >
          <Animated.View
            style={[
              styles.actionContent,
              {
                transform: [{ translateX: trans }],
              },
            ]}
          >
            <Icon name="delete" size={20} color="white" />
            <Text style={styles.actionText}>Borrar</Text>
          </Animated.View>
        </RectButton>
      </View>
    );
  };

  const renderCropType = ({ item }) => (
    <Swipeable
      friction={2}
      rightThreshold={40}
      renderRightActions={(progress, dragX) =>
        renderRightActions(progress, dragX, item)
      }
    >
      <TouchableOpacity 
        style={styles.cropCard}
        onPress={() => handleViewPhases(item)}
        activeOpacity={0.7}
      >
        <View style={styles.cropIconContainer}>
          <Icon name={getCropIcon(item.name)} size={30} color={PRIMARY_COLOR} />
        </View>
        <View style={styles.cropInfo}>
          <Text style={styles.cropName}>{item.name}</Text>
          <Text style={styles.cropDate}>
            Creado: {formatDate(item.createdAt)}
          </Text>
          <Text style={styles.cropPhases}>{item.phases.length} fases</Text>
        </View>
        <View style={styles.cropAction}>
          <Icon name="chevron-right" size={24} color={SECONDARY_COLOR} />
        </View>
      </TouchableOpacity>
    </Swipeable>
  );

  const getCropIcon = (cropName) => {
    switch (cropName.toLowerCase()) {
      case "cacao":
        return "spa";
      case "sacha inchi":
        return "grass";
      case "miel":
        return "emoji-nature";
      default:
        return "local-florist";
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  return (
    <ScreenLayoutAdmin navigation={navigation}>
      <View style={styles.container}>
        {/* Header con diseño nuevo */}
        <View style={styles.newHeader}>
          <View style={styles.headerTop}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => navigation.goBack()}>
              <Icon name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
            
            <View style={styles.headerTitle}>
              <Text style={styles.mainTitle}>Tipos de Cultivos</Text>
              <Text style={styles.headerSubtitle}>Gestiona los tipos de cultivo</Text>
            </View>
            
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() =>
                navigation.navigate("CreateCropType", {
                  refreshList: fetchCropTypes,
                })
              }>
              <Icon name="add" size={24} color="white" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Contador de cultivos */}
        <View style={styles.counterContainer}>
          <Text style={styles.counterText}>
            {cropTypes?.length || 0} tipo{(cropTypes?.length || 0) !== 1 ? 's' : ''} de cultivo registrado{(cropTypes?.length || 0) !== 1 ? 's' : ''}
          </Text>
        </View>

        <ScrollView style={styles.scrollContainer}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={PRIMARY_COLOR} />
              <Text style={styles.loadingText}>Cargando tipos de cultivo...</Text>
            </View>
          ) : (
            <FlatList
              data={cropTypes}
              renderItem={renderCropType}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              refreshing={refreshing}
              onRefresh={handleRefresh}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Icon name="local-florist" size={80} color={SECONDARY_COLOR} />
                  <Text style={styles.emptyTitle}>No hay tipos de cultivo</Text>
                  <Text style={styles.emptyDescription}>
                    Comienza creando tu primer tipo de cultivo
                  </Text>
                  <TouchableOpacity
                    style={styles.emptyButton}
                    onPress={() =>
                      navigation.navigate("CreateCropType", {
                        refreshList: fetchCropTypes,
                      })
                    }>
                    <Icon name="add" size={20} color={PRIMARY_COLOR} />
                    <Text style={styles.emptyButtonText}>Crear Primer Cultivo</Text>
                  </TouchableOpacity>
                </View>
              }
            />
          )}
        </ScrollView>
      </View>
    </ScreenLayoutAdmin>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: LIGHT_BACKGROUND,
  },
  // Nuevo diseño del header
  newHeader: {
    backgroundColor: PRIMARY_COLOR,
    paddingTop: 16,
    paddingBottom: 20,
    paddingHorizontal: 16,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 16,
  },
  mainTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: 'white',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginTop: 2,
  },
  actionButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  counterContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  counterText: {
    fontSize: 14,
    color: SECONDARY_COLOR,
    textAlign: 'center',
  },
  scrollContainer: {
    flex: 1,
    padding: 16,
  },
  cropCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cropIconContainer: {
    backgroundColor: "#e6f2f8",
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  cropInfo: {
    flex: 1,
  },
  cropName: {
    fontSize: 16,
    fontWeight: "600",
    color: PRIMARY_COLOR,
    marginBottom: 4,
  },
  cropDate: {
    fontSize: 12,
    color: "#64748b",
    marginBottom: 4,
  },
  cropPhases: {
    fontSize: 12,
    color: SECONDARY_COLOR,
    fontWeight: "500",
  },
  cropAction: {
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  loadingText: {
    marginTop: 16,
    color: PRIMARY_COLOR,
    fontSize: 16,
  },
  emptyContainer: {
    alignItems: "center",
    padding: 40,
    marginTop: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: PRIMARY_COLOR,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 16,
    color: SECONDARY_COLOR,
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 22,
  },
  emptyButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: PRIMARY_COLOR,
  },
  emptyButtonText: {
    color: PRIMARY_COLOR,
    fontWeight: "600",
    marginLeft: 8,
  },
  swipeActionsContainer: {
    width: 180, // Aumentado para acomodar dos botones
    flexDirection: "row",
    marginBottom: 12,
    borderRadius: 12,
    overflow: Platform.OS === "android" ? "hidden" : "visible",
  },
  rightAction: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 12,
    marginLeft: 4,
  },
  actionContent: {
    flexDirection: "column", // Cambié a columna para mejor distribución
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  actionText: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
    marginTop: 4,
    textAlign: 'center',
  },
});

export default AdminCropTypesScreen;