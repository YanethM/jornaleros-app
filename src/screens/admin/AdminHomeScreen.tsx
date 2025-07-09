import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  ActivityIndicator,
  Alert,
  RefreshControl,
  TouchableOpacity,
} from "react-native";
import ScreenLayoutAdmin from "../../components/ScreenLayoutAdmin";
import Icon from "react-native-vector-icons/MaterialIcons";
import { useIsFocused } from "@react-navigation/native";
import { getAdminDashboardStats } from "../../services/adminService";

const PRIMARY_COLOR = "#284F66";
const SECONDARY_COLOR = "#4A7C94";
const SUCCESS_COLOR = "#2ecc71";
const WARNING_COLOR = "#f39c12";
const INFO_COLOR = "#3498db";
const LIGHT_BACKGROUND = "#f8fafc";

// Aquí debes importar tu servicio para obtener las estadísticas
// import { getAdminDashboardStats } from "../../services/dashboardService";

const AdminDashboardScreen = ({ navigation }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const isFocused = useIsFocused();

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      const response = await getAdminDashboardStats();
      setStats(response.data);
      
    } catch (error) {
      console.error("Error al obtener estadísticas:", error);
      Alert.alert("Error", "No se pudieron cargar las estadísticas del dashboard");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (isFocused) {
      fetchDashboardStats();
    }
  }, [isFocused]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboardStats();
  };

  const StatCard = ({ title, value, icon, color, subtitle, onPress }) => (
    <TouchableOpacity 
      style={[styles.statCard, { borderLeftColor: color }]}
      onPress={onPress}
      activeOpacity={0.7}>
      <View style={styles.statContent}>
        <View style={styles.statInfo}>
          <Text style={styles.statTitle}>{title}</Text>
          <Text style={[styles.statValue, { color }]}>{value}</Text>
          {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
        </View>
        <View style={[styles.statIconContainer, { backgroundColor: color + '20' }]}>
          <Icon name={icon} size={32} color={color} />
        </View>
      </View>
    </TouchableOpacity>
  );

  const QuickActionCard = ({ title, description, icon, color, onPress }) => (
    <TouchableOpacity 
      style={styles.quickActionCard}
      onPress={onPress}
      activeOpacity={0.7}>
      <View style={[styles.quickActionIcon, { backgroundColor: color + '20' }]}>
        <Icon name={icon} size={24} color={color} />
      </View>
      <View style={styles.quickActionContent}>
        <Text style={styles.quickActionTitle}>{title}</Text>
        <Text style={styles.quickActionDescription}>{description}</Text>
      </View>
      <Icon name="chevron-right" size={24} color={SECONDARY_COLOR} />
    </TouchableOpacity>
  );

  return (
    <ScreenLayoutAdmin navigation={navigation}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.newHeader}>
          <View style={styles.headerTop}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => navigation.goBack()}>
              <Icon name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
            
            <View style={styles.headerTitle}>
              <Text style={styles.mainTitle}>Dashboard Administrativo</Text>
              <Text style={styles.headerSubtitle}>Panel de control y estadísticas</Text>
            </View>
            
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={onRefresh}>
              <Icon name="refresh" size={24} color="white" />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView 
          style={styles.scrollContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }>
          
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={PRIMARY_COLOR} />
              <Text style={styles.loadingText}>Cargando estadísticas...</Text>
            </View>
          ) : (
            <>
              {/* Estadísticas Principales */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>📊 Estadísticas Generales</Text>
                
                <View style={styles.statsGrid}>
                  <StatCard
                    title="Fincas Registradas"
                    value={stats?.totalFarms || 0}
                    icon="landscape"
                    color={PRIMARY_COLOR}
                    subtitle="Total en la plataforma"
                    onPress={() => navigation.navigate("FarmsManagement")}
                  />
                  
                  <StatCard
                    title="Usuarios Trabajadores"
                    value={stats?.workerUsers || 0}
                    icon="people"
                    color={PRIMARY_COLOR}
                    subtitle="Registrados activos"
                    onPress={() => navigation.navigate("UsersApp")}
                  />
                  
                  <StatCard
                    title="Usuarios Productores"
                    value={stats?.producerUsers || 0}
                    icon="business"
                    color={PRIMARY_COLOR}
                    subtitle="Empleadores registrados"
                    onPress={() => navigation.navigate("UsersApp")}
                  />
                  
                  <StatCard
                    title="Tipos de Cultivo"
                    value={stats?.totalCropTypes || 0}
                    icon="local-florist"
                    color={PRIMARY_COLOR}
                    subtitle="Cultivos disponibles"
                    onPress={() => navigation.navigate("AdminCropTypes")}
                  />
                </View>
              </View>

              {/* Estadísticas del Mes */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>📅 Actividad de {stats?.month}</Text>
                
                <StatCard
                  title="Ofertas de Trabajo"
                  value={stats?.monthlyJobOffers || 0}
                  icon="work"
                  color="#284F66"
                  subtitle={`Creadas en ${stats?.month}`}
                  onPress={() => navigation.navigate("JobOffers")}
                />
              </View>

              {/* Acciones Rápidas */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>⚡ Acciones Rápidas</Text>
                
                <QuickActionCard
                  title="Preguntas de Evaluación"
                  description="Gestionar preguntas de calificación"
                  icon="quiz"
                  color={WARNING_COLOR}
                  onPress={() => navigation.navigate("QualificationQuestions")}
                />
                
                <QuickActionCard
                  title="Reportes"
                  description="Generar reportes y análisis"
                  icon="assessment"
                  color="#9b59b6"
                  onPress={() => navigation.navigate("Reports")}
                />
              </View>
            </>
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
  // Header
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
    fontSize: 20,
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
  scrollContainer: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: PRIMARY_COLOR,
    marginBottom: 16,
  },
  statsGrid: {
    gap: 12,
  },
  statCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statInfo: {
    flex: 1,
  },
  statTitle: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 2,
  },
  statSubtitle: {
    fontSize: 12,
    color: '#94a3b8',
  },
  statIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickActionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  quickActionContent: {
    flex: 1,
  },
  quickActionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: PRIMARY_COLOR,
    marginBottom: 4,
  },
  quickActionDescription: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    marginTop: 100,
  },
  loadingText: {
    marginTop: 16,
    color: PRIMARY_COLOR,
    fontSize: 16,
  },
});

export default AdminDashboardScreen;