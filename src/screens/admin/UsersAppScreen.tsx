import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  TextInput,
} from "react-native";
import ScreenLayoutAdmin from "../../components/ScreenLayoutAdmin";
import Icon from "react-native-vector-icons/MaterialIcons";
import { getAllUsers } from "../../services/userService";
import { useIsFocused } from "@react-navigation/native";

const PRIMARY_COLOR = "#284F66";
const SECONDARY_COLOR = "#4A7C94";
const DANGER_COLOR = "#e74c3c";
const SUCCESS_COLOR = "#2ecc71";
const LIGHT_BACKGROUND = "#f8fafc";

// Colores específicos para cada rol
const ROLE_COLORS = {
  PRODUCTOR: "#284F66", // Azul principal
  TRABAJADOR: "#6B8FAB", // Azul más claro (284F66 más claro)
  ADMINISTRADOR: "#9CA3AF" // Gris claro
};

// Constantes para los nombres de roles
const ROLE_NAMES = {
  PRODUCTOR: "Productor",
  TRABAJADOR: "Trabajador",
  ADMINISTRADOR: "Administrador"
};

// Activar para debug
const DEBUG_FILTERS = false;

const UsersAppScreen = ({ navigation }) => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingRoles, setLoadingRoles] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [selectedRoles, setSelectedRoles] = useState([]);
  const isFocused = useIsFocused();

  // Función de debug
  const debugLog = (...args) => {
    if (DEBUG_FILTERS) {
      console.log('[DEBUG]', ...args);
    }
  };

  // Función para obtener las iniciales del nombre
  const getInitials = (name, lastname) => {
    const firstInitial = name ? name.charAt(0).toUpperCase() : '';
    const lastInitial = lastname ? lastname.charAt(0).toUpperCase() : '';
    return firstInitial + lastInitial;
  };

  // Función para calcular el tiempo transcurrido desde el registro
  const getTimeAgo = (dateString) => {
    if (!dateString) return 'Fecha no disponible';
    
    const now = new Date();
    const createdDate = new Date(dateString);
    const diffInMs = now - createdDate;
    
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    const diffInMonths = Math.floor(diffInDays / 30);
    const diffInYears = Math.floor(diffInDays / 365);
    
    if (diffInYears > 0) {
      return `Hace ${diffInYears} año${diffInYears > 1 ? 's' : ''}`;
    } else if (diffInMonths > 0) {
      return `Hace ${diffInMonths} mes${diffInMonths > 1 ? 'es' : ''}`;
    } else if (diffInDays > 0) {
      return `Hace ${diffInDays} día${diffInDays > 1 ? 's' : ''}`;
    } else {
      return 'Hoy';
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      setLoadingRoles(true);
      
      const usersData = await getAllUsers();
      console.log('Users response:', usersData);
      setUsers(usersData);
      setFilteredUsers(usersData);
      
      // Extraer roles únicos de los usuarios
      const uniqueRoles = [...new Set(usersData.map(user => user.role?.name).filter(Boolean))];
      const rolesWithIds = uniqueRoles.map(name => ({ id: name, name }));
      setRoles(rolesWithIds);
      
    } catch (error) {
      console.error("Error al obtener datos:", error);
    } finally {
      setLoading(false);
      setLoadingRoles(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (isFocused) {
      fetchData();
    }
  }, [isFocused]);

  useEffect(() => {
    applyFilters();
  }, [searchText, selectedRoles, users]);

  const applyFilters = () => {
    let result = [...users];
    debugLog('applyFilters iniciado', { searchText, selectedRoles: selectedRoles.length, users: users.length });

    if (searchText) {
      const searchLower = searchText.toLowerCase();
      result = result.filter(user => 
        user.name.toLowerCase().includes(searchLower) || 
        user.lastname.toLowerCase().includes(searchLower) ||
        user.email.toLowerCase().includes(searchLower)
      );
      debugLog('después del filtro de búsqueda:', result.length);
    }

    if (selectedRoles.length > 0) {
      debugLog('selectedRoles antes del filtro:', selectedRoles);
      const beforeFilterCount = result.length;
      
      result = result.filter(user => {
        // Los usuarios tienen role: {name: "Trabajador"} - usar el name del rol
        const userRoleName = user.role?.name || user.role;
        const isIncluded = selectedRoles.includes(userRoleName);
        
        debugLog(`Usuario ${user.name}: roleName=${userRoleName}, incluido=${isIncluded}`);
        return isIncluded;
      });
      
      debugLog(`Filtro de roles: ${beforeFilterCount} -> ${result.length}`);
    }

    debugLog('applyFilters completado, resultado final:', result.length);
    setFilteredUsers(result);
  };

  const toggleRoleFilter = (roleName) => {
    debugLog('toggleRoleFilter llamado', { roleName, tipo: typeof roleName });
    
    setSelectedRoles(prev => {
      debugLog('selectedRoles anterior:', prev);
      
      const exists = prev.includes(roleName);
      
      let newSelected;
      if (exists) {
        newSelected = prev.filter(name => name !== roleName);
        debugLog('Removiendo rol:', roleName);
      } else {
        newSelected = [...prev, roleName];
        debugLog('Agregando rol:', roleName);
      }
      
      debugLog('selectedRoles nuevo:', newSelected);
      return newSelected;
    });
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  // Función para obtener el color del rol
  const getRoleColor = (roleName) => {
    switch(roleName) {
      case ROLE_NAMES.PRODUCTOR:
        return ROLE_COLORS.PRODUCTOR;
      case ROLE_NAMES.ADMINISTRADOR:
        return ROLE_COLORS.ADMINISTRADOR;
      case ROLE_NAMES.TRABAJADOR:
        return ROLE_COLORS.TRABAJADOR;
      default:
        return SECONDARY_COLOR;
    }
  };

  // Función para obtener el color de fondo del card según el rol
  const getCardBackgroundColor = (roleName) => {
    switch(roleName) {
      case ROLE_NAMES.TRABAJADOR:
        return '#f1f5f9'; // Azul muy claro
      case ROLE_NAMES.PRODUCTOR:
        return '#e2e8f0'; // Gris azulado muy claro
      case ROLE_NAMES.ADMINISTRADOR:
        return '#f3f4f6'; // Gris muy claro
      default:
        return '#ffffff';
    }
  };

  // Función para obtener el color del borde del card según el rol
  const getCardBorderColor = (roleName) => {
    switch(roleName) {
      case ROLE_NAMES.TRABAJADOR:
        return '#cbd5e1'; // Azul claro
      case ROLE_NAMES.PRODUCTOR:
        return '#94a3b8'; // Gris azulado
      case ROLE_NAMES.ADMINISTRADOR:
        return '#d1d5db'; // Gris claro
      default:
        return '#e2e8f0';
    }
  };

  // Componente Avatar con iniciales
  const AvatarWithInitials = ({ name, lastname, roleName }) => {
    const initials = getInitials(name, lastname);
    const avatarColor = getRoleColor(roleName);
    
    return (
      <View style={[styles.avatarContainer, { backgroundColor: avatarColor }]}>
        <Text style={styles.avatarText}>{initials}</Text>
      </View>
    );
  };

  const renderUserItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.userCard,
        { 
          backgroundColor: getCardBackgroundColor(item.role.name),
          borderColor: getCardBorderColor(item.role.name)
        }
      ]}
      onPress={() => navigation.navigate("UserDetail", { userId: item.id })}
    >
      <AvatarWithInitials 
        name={item.name} 
        lastname={item.lastname} 
        roleName={item.role.name}
      />
      
      <View style={styles.userInfo}>
        <Text style={styles.userName}>
          {item.name} {item.lastname}
        </Text>
        <Text style={styles.userEmail}>{item.email}</Text>
        
        {/* Tiempo de registro */}
        <Text style={styles.registrationTime}>
          {getTimeAgo(item.createdAt || item.updatedAt)}
        </Text>
        
        <View style={styles.userMeta}>
          <View style={[styles.roleBadge, 
            { backgroundColor: getRoleColor(item.role.name) }]}>
            <Text style={styles.roleText}>{item.role.name}</Text>
          </View>
          
          <View style={styles.verificationBadge}>
            <Icon 
              name={item.isVerified ? "check-circle" : "cancel"} 
              size={16} 
              color={item.isVerified ? SUCCESS_COLOR : DANGER_COLOR} 
            />
            <Text style={[styles.verificationText, 
              { color: item.isVerified ? SUCCESS_COLOR : DANGER_COLOR }]}>
              {item.isVerified ? "Verificado" : "No verificado"}
            </Text>
          </View>
        </View>
      </View>
      
      <Icon name="chevron-right" size={24} color={SECONDARY_COLOR} />
    </TouchableOpacity>
  );

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
              <Text style={styles.mainTitle}>Usuarios de la App</Text>
              <Text style={styles.headerSubtitle}>Gestiona los usuarios registrados</Text>
            </View>
            
            {/* Espacio vacío para mantener centrado el título */}
            <View style={styles.headerSpacer} />
          </View>
          
          {/* Barra de búsqueda */}
          <View style={styles.searchContainer}>
            <View style={styles.searchInputContainer}>
              <Icon name="search" size={20} color="#9ca3af" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Buscar por nombre, apellido o email..."
                placeholderTextColor="#9ca3af"
                value={searchText}
                onChangeText={setSearchText}
              />
              {searchText.length > 0 && (
                <TouchableOpacity 
                  onPress={() => setSearchText("")}
                  style={styles.clearButton}>
                  <Icon name="close" size={20} color="#9ca3af" />
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>

        {/* Contador de usuarios */}
        <View style={styles.counterContainer}>
          <Text style={styles.counterText}>
            {searchText ? filteredUsers.length : users?.length || 0} usuario{((searchText ? filteredUsers.length : users?.length || 0) !== 1) ? 's' : ''} 
            {searchText ? ` encontrado${filteredUsers.length !== 1 ? 's' : ''}` : ' registrado' + ((users?.length || 0) !== 1 ? 's' : '')}
          </Text>
        </View>

        <ScrollView style={styles.scrollContainer}>
          {/* Filtros por rol */}
          {!loadingRoles && (
            <View style={styles.filterContainer}>
              <Text style={styles.filterTitle}>Filtrar por rol:</Text>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.roleFiltersContainer}
              >
                {roles.map((role, index) => {
                  // Verificar si este rol está seleccionado
                  const isSelected = selectedRoles.includes(role.name);
                  
                  return (
                    <TouchableOpacity
                      key={`${role.name}-${index}`} // Usar el nombre + index como key única
                      style={[
                        styles.roleFilter,
                        isSelected && styles.selectedRoleFilter,
                        { 
                          backgroundColor: isSelected ? 
                            getRoleColor(role.name) :
                            "#e2e8f0"
                        }
                      ]}
                      onPress={() => toggleRoleFilter(role.name)}
                    >
                      <Text style={[
                        styles.roleFilterText,
                        { color: isSelected ? "white" : PRIMARY_COLOR }
                      ]}>
                        {role.name}
                      </Text>
                      {isSelected && (
                        <Icon name="check" size={16} color="white" style={styles.roleCheckIcon} />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={PRIMARY_COLOR} />
              <Text style={styles.loadingText}>Cargando usuarios...</Text>
            </View>
          ) : (
            <FlatList
              data={filteredUsers}
              renderItem={renderUserItem}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              refreshing={refreshing}
              onRefresh={handleRefresh}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Icon name="people-outline" size={50} color={SECONDARY_COLOR} />
                  <Text style={styles.emptyText}>
                    {searchText || selectedRoles.length > 0 
                      ? "No hay usuarios que coincidan con los filtros" 
                      : "No hay usuarios registrados"}
                  </Text>
                  {(searchText || selectedRoles.length > 0) && (
                    <TouchableOpacity 
                      style={styles.clearFiltersButton}
                      onPress={() => {
                        setSearchText("");
                        setSelectedRoles([]);
                      }}
                    >
                      <Text style={styles.clearFiltersText}>Limpiar filtros</Text>
                    </TouchableOpacity>
                  )}
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
    marginBottom: 20,
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
  headerSpacer: {
    width: 44, // Mismo ancho que el botón de atrás para centrar el título
  },
  searchContainer: {
    paddingHorizontal: 4,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 25,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000',
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
    color: '#374151',
    paddingVertical: 0,
  },
  clearButton: {
    padding: 4,
    marginLeft: 8,
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
  filterContainer: {
    marginBottom: 16,
  },
  filterTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: PRIMARY_COLOR,
    marginBottom: 8,
  },
  roleFiltersContainer: {
    paddingRight: 16,
  },
  roleFilter: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    marginRight: 8,
  },
  selectedRoleFilter: {
    opacity: 1,
  },
  roleFilterText: {
    fontSize: 12,
    fontWeight: "500",
  },
  roleCheckIcon: {
    marginLeft: 4,
  },
  userCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
  },
  avatarContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: "600",
    color: PRIMARY_COLOR,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: "#64748b",
    marginBottom: 4,
  },
  registrationTime: {
    fontSize: 12,
    color: "#94a3b8",
    fontStyle: 'italic',
    marginBottom: 8,
  },
  userMeta: {
    flexDirection: "row",
    alignItems: "center",
  },
  roleBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    marginRight: 8,
  },
  roleText: {
    color: "white",
    fontSize: 12,
    fontWeight: "500",
  },
  verificationBadge: {
    flexDirection: "row",
    alignItems: "center",
  },
  verificationText: {
    fontSize: 12,
    marginLeft: 4,
    fontWeight: "500",
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
  },
  emptyContainer: {
    alignItems: "center",
    padding: 40,
  },
  emptyText: {
    marginTop: 16,
    color: SECONDARY_COLOR,
    fontSize: 16,
    textAlign: "center",
  },
  clearFiltersButton: {
    marginTop: 16,
    padding: 8,
    backgroundColor: PRIMARY_COLOR,
    borderRadius: 6,
  },
  clearFiltersText: {
    color: "white",
    fontWeight: "500",
  },
});

export default UsersAppScreen;