import React, { useEffect, useState } from "react";
import ScreenLayoutAdmin from "../../components/ScreenLayoutAdmin";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  FlatList,
  ActivityIndicator,
  Alert,
  RefreshControl,
  TextInput,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import { useIsFocused } from "@react-navigation/native";
import { getAllFarms } from "../../services/farmService";
import {
  PRIMARY_COLOR,
  SECONDARY_COLOR,
  LIGHT_BACKGROUND,
} from "../../styles/colors";

const SUCCESS_COLOR = "#2ecc71";
const DANGER_COLOR = "#e74c3c";

const AdminFarmsManagement = ({ navigation }) => {
  const [farms, setFarms] = useState([]);
  const [filteredFarms, setFilteredFarms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchText, setSearchText] = useState("");

  const isFocused = useIsFocused();

  const fetchFarms = async () => {
    try {
      setLoading(true);
      const response = await getAllFarms();
      const farmsData = Array.isArray(response) ? response : response.data || [];
      
      setFarms(farmsData);
      filterFarms(farmsData, searchText);
    } catch (error) {
      console.error("❌ Error al obtener fincas:", error);
      Alert.alert("Error", "No se pudieron cargar las fincas");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const filterFarms = (farmsData, searchTerm) => {
    if (!searchTerm.trim()) {
      setFilteredFarms(farmsData);
      return;
    }

    const filtered = farmsData.filter(farm =>
      farm.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredFarms(filtered);
  };

  useEffect(() => {
    if (isFocused) {
      fetchFarms();
    }
  }, [isFocused]);

  // Efecto para filtrar cuando cambia el texto de búsqueda
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      filterFarms(farms, searchText);
    }, 300); // Debounce de 300ms

    return () => clearTimeout(timeoutId);
  }, [searchText, farms]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchFarms();
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const hasActiveFilters = () => {
    return searchText.trim() !== "";
  };

  const clearSearch = () => {
    setSearchText("");
  };

  const getFarmStatusColor = (status) => {
    return status ? SUCCESS_COLOR : DANGER_COLOR;
  };

  const getFarmStatusText = (status) => {
    return status ? "Activa" : "Inactiva";
  };

  const FarmCard = ({ farm }) => (
    <View
      style={[
        styles.farmCard,
        { borderLeftColor: getFarmStatusColor(farm.status) },
      ]}>
      <View style={styles.farmHeader}>
        <View style={styles.farmIconContainer}>
          <Icon name="landscape" size={24} color={PRIMARY_COLOR} />
        </View>

        <View style={styles.farmInfo}>
          <Text style={styles.farmName}>{farm.name}</Text>
          <View style={styles.farmMeta}>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: getFarmStatusColor(farm.status) },
              ]}>
              <Text style={styles.statusText}>
                {getFarmStatusText(farm.status)}
              </Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.farmDetails}>
        <View style={styles.farmDetailItem}>
          <Icon name="straighten" size={16} color={SECONDARY_COLOR} />
          <Text style={styles.farmDetailText}>{farm.size} hectáreas</Text>
        </View>

        <View style={styles.farmDetailItem}>
          <Icon name="eco" size={16} color={SECONDARY_COLOR} />
          <Text style={styles.farmDetailText}>
            {farm.plantCount || 0} plantas
          </Text>
        </View>

        <View style={styles.farmDetailItem}>
          <Icon name="event" size={16} color={SECONDARY_COLOR} />
          <Text style={styles.farmDetailText}>
            Creada: {formatDate(farm.createdAt)}
          </Text>
        </View>
      </View>
    </View>
  );

  return (
    <ScreenLayoutAdmin navigation={navigation}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}>
              <Icon name="arrow-back" size={24} color="white" />
            </TouchableOpacity>

            <View style={styles.headerTitle}>
              <Text style={styles.mainTitle}>Gestión de Fincas</Text>
              <Text style={styles.headerSubtitle}>
                Administra todas las fincas registradas
              </Text>
            </View>

            <View style={styles.placeholder} />
          </View>

          {/* Barra de búsqueda */}
          <View style={styles.searchContainer}>
            <View style={styles.searchInputContainer}>
              <Icon
                name="search"
                size={20}
                color="#9ca3af"
                style={styles.searchIcon}
              />
              <TextInput
                style={styles.searchInput}
                placeholder="Buscar fincas por nombre..."
                placeholderTextColor="#9ca3af"
                value={searchText}
                onChangeText={setSearchText}
              />
              {searchText.length > 0 && (
                <TouchableOpacity
                  onPress={clearSearch}
                  style={styles.clearButton}>
                  <Icon name="close" size={20} color="#9ca3af" />
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>

        {/* Contador de fincas */}
        <View style={styles.counterContainer}>
          <Text style={styles.counterText}>
            {filteredFarms.length} finca{filteredFarms.length !== 1 ? "s" : ""}
            {hasActiveFilters()
              ? " encontrada" + (filteredFarms.length !== 1 ? "s" : "")
              : " registrada" + (filteredFarms.length !== 1 ? "s" : "")}
          </Text>
          {hasActiveFilters() && (
            <TouchableOpacity
              onPress={clearSearch}
              style={styles.clearFiltersButton}>
              <Text style={styles.clearFiltersText}>Limpiar búsqueda</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Lista de fincas */}
        <View style={styles.contentContainer}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={PRIMARY_COLOR} />
              <Text style={styles.loadingText}>Cargando fincas...</Text>
            </View>
          ) : (
            <FlatList
              data={filteredFarms}
              renderItem={({ item }) => <FarmCard farm={item} />}
              keyExtractor={(item) => item.id}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  colors={[PRIMARY_COLOR]}
                />
              }
              showsVerticalScrollIndicator={false}
              contentContainerStyle={
                filteredFarms.length === 0
                  ? styles.emptyListContainer
                  : styles.listContainer
              }
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Icon name="landscape" size={80} color={SECONDARY_COLOR} />
                  <Text style={styles.emptyTitle}>
                    {hasActiveFilters()
                      ? "No se encontraron fincas"
                      : "No hay fincas registradas"}
                  </Text>
                  <Text style={styles.emptyDescription}>
                    {hasActiveFilters()
                      ? "Intenta con otros términos de búsqueda"
                      : "Las fincas registradas aparecerán aquí"}
                  </Text>
                </View>
              }
            />
          )}
        </View>
      </View>
    </ScreenLayoutAdmin>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: LIGHT_BACKGROUND,
  },
  // Header
  header: {
    backgroundColor: PRIMARY_COLOR,
    paddingTop: 16,
    paddingBottom: 20,
    paddingHorizontal: 16,
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    flex: 1,
    alignItems: "center",
    marginHorizontal: 16,
  },
  mainTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "white",
    textAlign: "center",
  },
  headerSubtitle: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.8)",
    textAlign: "center",
    marginTop: 2,
  },
  placeholder: {
    width: 44,
    height: 44,
  },
  searchContainer: {
    paddingHorizontal: 4,
  },
  searchInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 25,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#374151",
    paddingVertical: 0,
  },
  clearButton: {
    padding: 4,
    marginLeft: 8,
  },
  counterContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  counterText: {
    fontSize: 14,
    color: SECONDARY_COLOR,
  },
  clearFiltersButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: DANGER_COLOR,
    borderRadius: 12,
  },
  clearFiltersText: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
  },
  contentContainer: {
    flex: 1,
  },
  listContainer: {
    padding: 16,
  },
  farmCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  farmHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  farmIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#e6f2f8",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  farmInfo: {
    flex: 1,
  },
  farmName: {
    fontSize: 16,
    fontWeight: "600",
    color: PRIMARY_COLOR,
    marginBottom: 4,
  },
  farmMeta: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  statusText: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
  },
  farmDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    flexWrap: "wrap",
  },
  farmDetailItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
    minWidth: "48%",
  },
  farmDetailText: {
    fontSize: 12,
    color: "#64748b",
    marginLeft: 4,
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
  emptyListContainer: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
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
    lineHeight: 22,
  },
});

export default AdminFarmsManagement;