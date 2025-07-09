import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import ScreenLayout from "../../components/ScreenLayout";
import CustomTabBar from "../../components/CustomTabBar";
import { getJobOffersWithApplications } from "../../services/jobOffers";
import Icon from "react-native-vector-icons/MaterialIcons";

const { width } = Dimensions.get('window');

// 🎨 COLORES PRINCIPALES ACTUALIZADOS
const COLORS = {
  primary: '#274F66',      // Azul oscuro principal
  secondary: '#B5883E',    // Dorado/mostaza secundario
  success: '#4CAF50',      // Verde para aceptadas
  warning: '#FF9800',      // Naranja para en revisión
  error: '#F44336',        // Rojo para canceladas
  info: '#2196F3',         // Azul para solicitadas
  gray: '#666',
  lightGray: '#f8f9fa',
  white: '#fff',
  black: '#333',
};

const JobOfferWithApplication = ({ navigation }) => {
  const [jobOffers, setJobOffers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(true);
  const [totalItems, setTotalItems] = useState(0);

  useEffect(() => {
    fetchJobOffersWithApplications(true);
  }, []);

  const fetchJobOffersWithApplications = async (reset = false) => {
    if (loading || loadingMore) return;

    try {
      const currentPage = reset ? 1 : page;
      reset ? setLoading(true) : setLoadingMore(true);

      const data = await getJobOffersWithApplications({
        page: currentPage,
        limit: 10,
        status: 'Activo',
        sortBy: 'createdAt',
        sortOrder: 'desc'
      });

      if (reset) {
        setJobOffers(data.jobOffers);
        setPage(2);
      } else {
        setJobOffers(prevOffers => [...prevOffers, ...data.jobOffers]);
        setPage(currentPage + 1);
      }

      setHasNextPage(data.pagination.hasNextPage);
      setTotalItems(data.pagination.totalItems);

    } catch (error) {
      console.error('Error:', error);
      Alert.alert(
        'Error',
        'No se pudieron cargar las ofertas con postulaciones. Inténtalo de nuevo.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchJobOffersWithApplications(true);
  };

  const loadMore = () => {
    if (hasNextPage && !loadingMore) {
      fetchJobOffersWithApplications(false);
    }
  };

  const navigateToJobOfferDetail = (jobOfferId) => {
    navigation.navigate('JobOfferDetail', { jobOfferId });
  };

  const handleRefresh = () => {
    onRefresh();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Activo': return COLORS.success;
      case 'En_curso': return COLORS.warning;
      case 'Finalizado': return COLORS.gray;
      case 'Inactivo': return COLORS.error;
      default: return COLORS.gray;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'Activo': return 'Activa';
      case 'En_curso': return 'En Curso';
      case 'Finalizado': return 'Finalizada';
      case 'Inactivo': return 'Inactiva';
      default: return status;
    }
  };

  const formatSalary = (salary) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(salary);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-CO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const renderJobOfferItem = ({ item }) => {
    const { applicationsStats } = item;
    
    return (
      <TouchableOpacity 
        style={styles.jobOfferCard}
        onPress={() => navigateToJobOfferDetail(item.id)}
        activeOpacity={0.7}
      >
        {/* Header de la oferta */}
        <View style={styles.jobOfferHeader}>
          <View style={styles.titleContainer}>
            <Text style={styles.jobOfferTitle} numberOfLines={2}>
              {item.title}
            </Text>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
              <Text style={styles.statusText}>
                {getStatusText(item.status)}
              </Text>
            </View>
          </View>
        </View>

        {/* Información básica */}
        <View style={styles.jobOfferInfo}>
          <View style={styles.infoRow}>
            <Icon name="location-on" size={16} color={COLORS.gray} />
            <Text style={styles.infoText}>
              {item.city}, {item.state}
            </Text>
          </View>
          
          <View style={styles.infoRow}>
            <Icon name="attach-money" size={16} color={COLORS.gray} />
            <Text style={styles.infoText}>
              {formatSalary(item.salary)}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Icon name="people" size={16} color={COLORS.gray} />
            <Text style={styles.infoText}>
              {item.workersNeeded} trabajador{item.workersNeeded !== 1 ? 'es' : ''}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Icon name="date-range" size={16} color={COLORS.gray} />
            <Text style={styles.infoText}>
              {formatDate(item.startDate)} - {formatDate(item.endDate)}
            </Text>
          </View>
        </View>

        {/* Estadísticas de aplicaciones */}
        <View style={styles.applicationsSection}>
          <Text style={styles.applicationsTitle}>
            Postulaciones ({applicationsStats.total})
          </Text>
          
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <View style={[styles.statDot, { backgroundColor: COLORS.info }]} />
              <Text style={styles.statText}>
                Solicitadas: {applicationsStats.solicitadas}
              </Text>
            </View>

            <View style={styles.statItem}>
              <View style={[styles.statDot, { backgroundColor: COLORS.warning }]} />
              <Text style={styles.statText}>
                En revisión: {applicationsStats.enRevision}
              </Text>
            </View>

            <View style={styles.statItem}>
              <View style={[styles.statDot, { backgroundColor: COLORS.success }]} />
              <Text style={styles.statText}>
                Aceptadas: {applicationsStats.aceptadas}
              </Text>
            </View>

            {applicationsStats.canceladas > 0 && (
              <View style={styles.statItem}>
                <View style={[styles.statDot, { backgroundColor: COLORS.error }]} />
                <Text style={styles.statText}>
                  Canceladas: {applicationsStats.canceladas}
                </Text>
              </View>
            )}
          </View>

          {item.hasMoreApplications && (
            <Text style={styles.moreApplicationsText}>
              + Ver todas las postulaciones
            </Text>
          )}
        </View>

        {/* Footer */}
        <View style={styles.jobOfferFooter}>
          <Text style={styles.cropTypeText}>
            {item.cropType.name} • {item.phase.name}
          </Text>
          
          <View style={styles.viewDetailsButton}>
            <Text style={styles.viewDetailsText}>Ver detalles</Text>
            <Icon name="arrow-forward-ios" size={14} color={COLORS.primary} />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Icon name="work-off" size={80} color="#ccc" />
      <Text style={styles.emptyTitle}>No hay ofertas con postulaciones</Text>
      <Text style={styles.emptyMessage}>
        Cuando publiques ofertas de trabajo y recibas postulaciones, aparecerán aquí.
      </Text>
    </View>
  );

  const renderFooter = () => {
    if (!loadingMore) return null;
    
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={COLORS.primary} />
        <Text style={styles.footerLoaderText}>Cargando más ofertas...</Text>
      </View>
    );
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}>
        <Icon name="arrow-back" size={24} color="#fff" />
      </TouchableOpacity>
      
      <View style={styles.headerTitleContainer}>
        <Text style={styles.headerTitle}>Ofertas con Postulaciones</Text>
        <Text style={styles.headerSubtitle}>
          {totalItems} oferta{totalItems !== 1 ? 's' : ''} activa{totalItems !== 1 ? 's' : ''}
        </Text>
      </View>
      
      <View style={styles.headerActions}>
        <TouchableOpacity
          style={styles.headerIconButton}
          onPress={handleRefresh}
          disabled={refreshing}>
          <Icon 
            name={refreshing ? "hourglass-empty" : "refresh"} 
            size={24} 
            color="#fff" 
          />
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <ScreenLayout navigation={navigation}>
        {/* ✅ HEADER TAMBIÉN EN ESTADO DE LOADING */}
        {renderHeader()}
        
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Cargando ofertas...</Text>
        </View>
        
        <CustomTabBar
          navigation={navigation}
          currentRoute="JobOfferWithApplication"
        />
      </ScreenLayout>
    );
  }

  return (
    <ScreenLayout navigation={navigation}>
      {/* ✅ HEADER FUERA DEL FLATLIST */}
      {renderHeader()}
      
      <FlatList
        data={jobOffers}
        keyExtractor={(item) => item.id}
        renderItem={renderJobOfferItem}
        ListEmptyComponent={renderEmptyState}
        ListFooterComponent={renderFooter}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.1}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />
      
      {/* ✅ TABBAR MOVIDO AL FINAL */}
      <CustomTabBar
        navigation={navigation}
        currentRoute="JobOfferWithApplication"
      />
    </ScreenLayout>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.gray,
    textAlign: 'center',
  },
  listContainer: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingTop: 16, // Espacio después del header
    paddingBottom: 100, // Espacio para el TabBar
  },
  // ✅ NUEVO HEADER ELEGANTE
  header: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 20, // Para el status bar
    paddingBottom: 16,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12, // Espacio entre botones
  },
  headerIconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  jobOfferCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.secondary, // ✅ Acento dorado
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  jobOfferHeader: {
    marginBottom: 12,
  },
  titleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  jobOfferTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primary, // ✅ Color principal
    flex: 1,
    marginRight: 12,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '600',
  },
  jobOfferInfo: {
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoText: {
    marginLeft: 8,
    fontSize: 14,
    color: COLORS.gray,
    flex: 1,
  },
  applicationsSection: {
    backgroundColor: COLORS.lightGray,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.secondary, // ✅ Acento dorado
  },
  applicationsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary, // ✅ Color principal
    marginBottom: 12,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    width: '48%',
  },
  statDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statText: {
    fontSize: 13,
    color: COLORS.gray,
    flex: 1,
  },
  moreApplicationsText: {
    fontSize: 12,
    color: COLORS.primary, // ✅ Color principal
    fontWeight: '500',
    marginTop: 8,
    textAlign: 'center',
  },
  jobOfferFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cropTypeText: {
    fontSize: 13,
    color: COLORS.gray,
    flex: 1,
  },
  viewDetailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewDetailsText: {
    fontSize: 14,
    color: COLORS.primary, // ✅ Color principal
    fontWeight: '500',
    marginRight: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 64,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.primary, // ✅ Color principal
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyMessage: {
    fontSize: 16,
    color: COLORS.gray,
    textAlign: 'center',
    lineHeight: 22,
  },
  footerLoader: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
  },
  footerLoaderText: {
    marginLeft: 8,
    fontSize: 14,
    color: COLORS.gray,
  },
});

export default JobOfferWithApplication;