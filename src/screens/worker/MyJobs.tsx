import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../context/AuthContext';
import { getWorkerApplications } from '../../services/workerService';
import { getUserData } from '../../services/userService';

const { width } = Dimensions.get('window');

// Paleta de colores
const COLORS = {
  primary: '#274F66',
  primaryLight: '#3A6B85',
  secondary: '#B6883E',
  background: '#F8FAFC',
  surface: '#FFFFFF',
  text: '#274E66',
  textSecondary: '#4A5568',
  textLight: '#718096',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  border: '#E2E8F0',
};

interface MyJobsScreenProps {
  navigation: any;
}

interface Application {
  id: string;
  status: {
    name: string;
    id: string;
  };
  jobOffer: {
    id: string;
    title: string;
    salary: number;
    duration: number;
    city: string;
    state: string;
    country: string;
    cropType: {
      name: string;
    };
    farm: {
      name: string;
    };
    employer: {
      name?: string;
      user?: {
        name: string;
      };
    };
    includesFood: boolean;
    includesLodging: boolean;
    paymentMode: string;
    paymentType: string;
  };
  createdAt: string;
  updatedAt: string;
}

const MyJobsScreen: React.FC<MyJobsScreenProps> = ({ navigation }) => {
  const { user } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [filteredApplications, setFilteredApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');
  const [userData, setUserData] = useState<any>(null);

  const filters = [
    { key: 'all', label: 'Todos', icon: 'list' },
    { key: 'Solicitado', label: 'Enviadas', icon: 'paper-plane' },
    { key: 'En_revision', label: 'En Revisión', icon: 'time' },
    { key: 'Completado', label: 'Completadas', icon: 'checkmark-circle' },
    { key: 'Rechazado', label: 'Rechazadas', icon: 'close-circle' },
  ];

  // Función para obtener el nombre amigable del status
  const getStatusDisplayName = (status: string) => {
    const statusMap: { [key: string]: string } = {
      Solicitado: 'Enviada',
      En_revision: 'En Revisión',
      Completado: 'Completada',
      Rechazado: 'Rechazada',
      Cancelado: 'Cancelada',
    };
    return statusMap[status] || status || 'Desconocido';
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'Completado':
        return { backgroundColor: COLORS.success };
      case 'En_revision':
        return { backgroundColor: COLORS.warning };
      case 'Rechazado':
        return { backgroundColor: COLORS.error };
      case 'Solicitado':
        return { backgroundColor: COLORS.primary };
      default:
        return { backgroundColor: COLORS.textLight };
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Completado':
        return 'checkmark-circle';
      case 'En_revision':
        return 'time';
      case 'Rechazado':
        return 'close-circle';
      case 'Solicitado':
        return 'paper-plane';
      default:
        return 'help-circle';
    }
  };

  // Función segura para obtener ID del trabajador
  const getWorkerId = async () => {
    try {
      let workerData = userData;
      if (!workerData) {
        workerData = await getUserData();
        setUserData(workerData);
      }

      if (!workerData.workerProfile) {
        throw new Error('El usuario no tiene perfil de trabajador');
      }

      return workerData.workerProfile.id;
    } catch (error) {
      console.error('Error obteniendo ID del trabajador:', error);
      throw error;
    }
  };

  // Cargar aplicaciones
  const loadApplications = async () => {
    try {
      const workerId = await getWorkerId();
      const response = await getWorkerApplications(workerId);
      const applicationsData = response?.applications || [];
      
      // Ordenar por fecha más reciente
      const sortedApplications = applicationsData.sort((a: Application, b: Application) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      
      setApplications(sortedApplications);
      filterApplications(sortedApplications, activeFilter);
    } catch (error) {
      console.error('Error cargando aplicaciones:', error);
      Alert.alert('Error', 'No se pudieron cargar tus trabajos');
    }
  };

  // Filtrar aplicaciones
  const filterApplications = (apps: Application[], filter: string) => {
    if (filter === 'all') {
      setFilteredApplications(apps);
    } else {
      const filtered = apps.filter(app => app.status?.name === filter);
      setFilteredApplications(filtered);
    }
  };

  // Manejar cambio de filtro
  const handleFilterChange = (filter: string) => {
    setActiveFilter(filter);
    filterApplications(applications, filter);
  };

  // Función para refrescar datos
  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await loadApplications();
    } finally {
      setRefreshing(false);
    }
  };

  // Función para navegar al detalle del trabajo
  const navigateToJobDetail = (application: Application) => {
    navigation.navigate('JobOfferDetail', { 
      jobOfferId: application.jobOffer.id,
      applicationId: application.id 
    });
  };

  // Cargar datos iniciales
  useEffect(() => {
    const initializeData = async () => {
      setLoading(true);
      try {
        await loadApplications();
      } finally {
        setLoading(false);
      }
    };

    if (user?.id) {
      initializeData();
    }
  }, [user]);

  // Calcular estadísticas
  const getStats = () => {
    const total = applications.length;
    const pending = applications.filter(app => 
      ['Solicitado', 'En_revision'].includes(app.status?.name)
    ).length;
    const completed = applications.filter(app => 
      app.status?.name === 'Completado'
    ).length;
    const rejected = applications.filter(app => 
      app.status?.name === 'Rechazado'
    ).length;

    return { total, pending, completed, rejected };
  };

  const stats = getStats();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Cargando tus trabajos...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mis Trabajos</Text>
        <View style={styles.headerRight} />
      </View>

      {/* Estadísticas */}
      <View style={styles.statsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <LinearGradient
                colors={[COLORS.primary, COLORS.primaryLight]}
                style={styles.statGradient}
              >
                <Ionicons name="briefcase" size={24} color="#FFFFFF" />
                <Text style={styles.statNumber}>{stats.total}</Text>
                <Text style={styles.statLabel}>Total</Text>
              </LinearGradient>
            </View>

            <View style={styles.statCard}>
              <LinearGradient
                colors={[COLORS.warning, '#FBBF24']}
                style={styles.statGradient}
              >
                <Ionicons name="time" size={24} color="#FFFFFF" />
                <Text style={styles.statNumber}>{stats.pending}</Text>
                <Text style={styles.statLabel}>Pendientes</Text>
              </LinearGradient>
            </View>

            <View style={styles.statCard}>
              <LinearGradient
                colors={[COLORS.success, '#34D399']}
                style={styles.statGradient}
              >
                <Ionicons name="checkmark-circle" size={24} color="#FFFFFF" />
                <Text style={styles.statNumber}>{stats.completed}</Text>
                <Text style={styles.statLabel}>Completados</Text>
              </LinearGradient>
            </View>

            <View style={styles.statCard}>
              <LinearGradient
                colors={[COLORS.error, '#F87171']}
                style={styles.statGradient}
              >
                <Ionicons name="close-circle" size={24} color="#FFFFFF" />
                <Text style={styles.statNumber}>{stats.rejected}</Text>
                <Text style={styles.statLabel}>Rechazados</Text>
              </LinearGradient>
            </View>
          </View>
        </ScrollView>
      </View>

      {/* Filtros */}
      <View style={styles.filtersContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.filtersRow}>
            {filters.map((filter) => (
              <TouchableOpacity
                key={filter.key}
                style={[
                  styles.filterButton,
                  activeFilter === filter.key && styles.filterButtonActive
                ]}
                onPress={() => handleFilterChange(filter.key)}
              >
                <Ionicons 
                  name={filter.icon as any} 
                  size={16} 
                  color={activeFilter === filter.key ? COLORS.surface : COLORS.textSecondary} 
                />
                <Text style={[
                  styles.filterButtonText,
                  activeFilter === filter.key && styles.filterButtonTextActive
                ]}>
                  {filter.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* Lista de trabajos */}
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[COLORS.primary]}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {filteredApplications.length > 0 ? (
          <View style={styles.jobsList}>
            {filteredApplications.map((application) => (
              <TouchableOpacity
                key={application.id}
                style={styles.jobCard}
                onPress={() => navigateToJobDetail(application)}
              >
                <View style={styles.jobCardHeader}>
                  <View style={styles.jobInfo}>
                    <Text style={styles.jobTitle} numberOfLines={2}>
                      {application.jobOffer?.title || 'Trabajo sin título'}
                    </Text>
                    <Text style={styles.employerName}>
                      {application.jobOffer?.employer?.user?.name ||
                       application.jobOffer?.employer?.name ||
                       'Empleador no disponible'}
                    </Text>
                    <Text style={styles.farmName}>
                      {application.jobOffer?.farm?.name || 'Finca no especificada'}
                    </Text>
                  </View>

                  <View style={[
                    styles.statusBadge,
                    getStatusStyle(application.status?.name)
                  ]}>
                    <Ionicons 
                      name={getStatusIcon(application.status?.name) as any} 
                      size={12} 
                      color="#FFFFFF" 
                    />
                    <Text style={styles.statusText}>
                      {getStatusDisplayName(application.status?.name)}
                    </Text>
                  </View>
                </View>

                <View style={styles.jobDetails}>
                  <View style={styles.detailRow}>
                    <Ionicons name="location" size={16} color={COLORS.textLight} />
                    <Text style={styles.detailText}>
                      {application.jobOffer?.city}, {application.jobOffer?.state}
                    </Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Ionicons name="leaf" size={16} color={COLORS.textLight} />
                    <Text style={styles.detailText}>
                      {application.jobOffer?.cropType?.name || 'Cultivo general'}
                    </Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Ionicons name="cash" size={16} color={COLORS.textLight} />
                    <Text style={styles.detailText}>
                      ${new Intl.NumberFormat('es-CO').format(application.jobOffer?.salary || 0)}
                      {application.jobOffer?.paymentType === 'Por_dia' ? '/día' : '/tarea'}
                    </Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Ionicons name="time" size={16} color={COLORS.textLight} />
                    <Text style={styles.detailText}>
                      {application.jobOffer?.duration || 1} días de duración
                    </Text>
                  </View>
                </View>

                {/* Beneficios */}
                <View style={styles.benefitsContainer}>
                  <View style={styles.benefitItem}>
                    <Ionicons 
                      name="restaurant" 
                      size={14} 
                      color={application.jobOffer?.includesFood ? COLORS.success : COLORS.textLight} 
                    />
                    <Text style={[
                      styles.benefitText,
                      !application.jobOffer?.includesFood && styles.benefitTextDisabled
                    ]}>
                      {application.jobOffer?.includesFood ? 'Incluye comida' : 'Sin comida'}
                    </Text>
                  </View>

                  <View style={styles.benefitItem}>
                    <Ionicons 
                      name="bed" 
                      size={14} 
                      color={application.jobOffer?.includesLodging ? COLORS.success : COLORS.textLight} 
                    />
                    <Text style={[
                      styles.benefitText,
                      !application.jobOffer?.includesLodging && styles.benefitTextDisabled
                    ]}>
                      {application.jobOffer?.includesLodging ? 'Incluye alojamiento' : 'Sin alojamiento'}
                    </Text>
                  </View>
                </View>

                <View style={styles.jobFooter}>
                  <View style={styles.dateContainer}>
                    <Ionicons name="calendar" size={14} color={COLORS.textLight} />
                    <Text style={styles.dateText}>
                      Postulado el {new Date(application.createdAt).toLocaleDateString('es-ES', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric'
                      })}
                    </Text>
                  </View>

                  <TouchableOpacity style={styles.viewDetailsButton}>
                    <Text style={styles.viewDetailsText}>Ver detalles</Text>
                    <Ionicons name="chevron-forward" size={16} color={COLORS.primary} />
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconContainer}>
              <Ionicons name="briefcase-outline" size={64} color={COLORS.textLight} />
            </View>
            <Text style={styles.emptyTitle}>
              {activeFilter === 'all' 
                ? 'No tienes trabajos aún' 
                : `No tienes trabajos ${filters.find(f => f.key === activeFilter)?.label.toLowerCase()}`
              }
            </Text>
            <Text style={styles.emptySubtitle}>
              {activeFilter === 'all'
                ? 'Explora las ofertas disponibles y postúlate a trabajos que coincidan con tus habilidades'
                : 'Prueba cambiando el filtro o revisa otros estados de tus aplicaciones'
              }
            </Text>
            <TouchableOpacity
              style={styles.exploreJobsButton}
              onPress={() => navigation.navigate('WorkerHome')}
            >
              <Ionicons name="search" size={20} color={COLORS.surface} />
              <Text style={styles.exploreJobsText}>Explorar Trabajos</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginTop: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
  },
  headerRight: {
    width: 40,
  },
  statsContainer: {
    backgroundColor: COLORS.surface,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
  },
  statCard: {
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statGradient: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
    minWidth: 90,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '600',
  },
  filtersContainer: {
    backgroundColor: COLORS.surface,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  filtersRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 6,
  },
  filterButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterButtonText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  filterButtonTextActive: {
    color: COLORS.surface,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  jobsList: {
    padding: 20,
    gap: 16,
  },
  jobCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  jobCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  jobInfo: {
    flex: 1,
    marginRight: 12,
  },
  jobTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 6,
    lineHeight: 24,
  },
  employerName: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '500',
    marginBottom: 4,
  },
  farmName: {
    fontSize: 14,
    color: COLORS.textLight,
    fontStyle: 'italic',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.surface,
  },
  jobDetails: {
    gap: 12,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    flex: 1,
    fontWeight: '500',
  },
  benefitsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  benefitText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  benefitTextDisabled: {
    color: COLORS.textLight,
  },
  jobFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dateText: {
    fontSize: 12,
    color: COLORS.textLight,
  },
  viewDetailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewDetailsText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: `${COLORS.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  exploreJobsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  exploreJobsText: {
    color: COLORS.surface,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default MyJobsScreen;