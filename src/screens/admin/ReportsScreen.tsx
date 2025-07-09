import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Dimensions,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Icon from "react-native-vector-icons/MaterialIcons";
import { useAuth } from "../../context/AuthContext";
import ScreenLayoutAdmin from "../../components/ScreenLayoutAdmin";
import CustomTabBarAdmin from "../../components/CustomTabBarAdmin";
import {
  getGeneralStats,
  getApplicationsReport,
  getFarmsReport,
  getWorkersReport,
  getCropsReport,
  getLowRatedWorkersReport,
  exportReport
} from "../../services/adminService";

const COLORS = {
  primary: "#274F66",
  primaryLight: "#3D6B85",
  primaryDark: "#1A3A4A",
  secondary: "#F59E0B",
  accent: "#EC4899",
  background: "#F8FAFC",
  surface: "#FFFFFF",
  text: "#0F172A",
  textSecondary: "#475569",
  textLight: "#64748B",
  textInverse: "#FFFFFF",
  success: "#10B981",
  warning: "#F59E0B",
  error: "#EF4444",
  border: "#E2E8F0",
  info: "#3B82F6",
  purple: "#8B5CF6",
  orange: "#F97316",
  teal: "#14B8A6",
};

const { width: screenWidth } = Dimensions.get("window");

const ReportsScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [quickStats, setQuickStats] = useState([]);

  const reportTypes = [
    {
      id: "applications",
      title: "Reporte de Postulaciones",
      subtitle: "Análisis de postulaciones aceptadas y rechazadas",
      icon: "people-outline",
      color: COLORS.primary,
      gradient: [COLORS.primary, COLORS.primaryLight],
      description: "Estadísticas completas de postulaciones, tiempos de respuesta y estado actual",
      serviceFunction: getApplicationsReport,
    },
    {
      id: "farms",
      title: "Gestión de Fincas",
      subtitle: "Estado y productividad de fincas",
      icon: "leaf-outline",
      color: COLORS.success,
      gradient: [COLORS.success, COLORS.teal],
      description: "Análisis de fincas activas, distribución por tamaño y productividad",
      serviceFunction: getFarmsReport,
    },
    {
      id: "workers",
      title: "Rendimiento de Personal",
      subtitle: "Productividad y desempeño de trabajadores",
      icon: "person-outline",
      color: COLORS.info,
      gradient: [COLORS.info, COLORS.purple],
      description: "Evaluación del rendimiento, asistencia y eficiencia del personal",
      serviceFunction: getWorkersReport,
    },
    {
      id: "crops",
      title: "Análisis de Cultivos",
      subtitle: "Rendimiento y temporadas de cosecha",
      icon: "leaf-outline",
      color: COLORS.success,
      gradient: [COLORS.success, COLORS.warning],
      description: "Seguimiento de cultivos, rendimiento por hectárea y análisis estacional",
      serviceFunction: getCropsReport,
    },
    {
      id: "low-rated-workers",
      title: "Reporte Peores Calificados",
      subtitle: "Calificaciones de desempeño por debajo de 3",
      icon: "trending-down-outline",
      color: COLORS.orange,
      gradient: [COLORS.orange, COLORS.warning],
      description: "Análisis de trabajadores con calificaciones bajas y recomendaciones de mejora",
      serviceFunction: getLowRatedWorkersReport,
    },
  ];

  const loadReportData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Cargar estadísticas generales
      const statsResponse = await getGeneralStats();
      
      if (statsResponse.success) {
        const stats = statsResponse.data;
        
        // Formatear las estadísticas para mostrar en el UI
        const formattedStats = [
          {
            title: "Postulaciones",
            value: stats.totalApplications?.toString() || "0",
            subtitle: stats.month || "Este mes",
            color: COLORS.primary,
            icon: "people",
          },
          {
            title: "Fincas Activas",
            value: stats.activeFarms?.toString() || "0",
            subtitle: "Operando",
            color: COLORS.success,
            icon: "eco",
          },
          {
            title: "Trabajadores",
            value: stats.activeWorkers?.toString() || "0",
            subtitle: "Activos",
            color: COLORS.info,
            icon: "person",
          },
          {
            title: "Productividad",
            value: `${stats.averageProductivity || 0}%`,
            subtitle: "Promedio",
            color: COLORS.orange,
            icon: "trending-up",
          },
        ];
        
        setQuickStats(formattedStats);
      }
      
      setReportData({
        loaded: true,
        lastUpdate: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Error loading report data:", error);
      Alert.alert("Error", "No se pudieron cargar los datos del reporte");
      
      // Fallback a datos por defecto en caso de error
      setQuickStats([
        {
          title: "Postulaciones",
          value: "0",
          subtitle: "Este mes",
          color: COLORS.primary,
          icon: "people",
        },
        {
          title: "Fincas Activas",
          value: "0",
          subtitle: "Operando",
          color: COLORS.success,
          icon: "eco",
        },
        {
          title: "Trabajadores",
          value: "0",
          subtitle: "Activos",
          color: COLORS.info,
          icon: "person",
        },
        {
          title: "Productividad",
          value: "0%",
          subtitle: "Promedio",
          color: COLORS.orange,
          icon: "trending-up",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadReportData();
    setRefreshing(false);
  }, [loadReportData]);

  useEffect(() => {
    loadReportData();
  }, [loadReportData]);

  const handleGenerateReport = async (reportType) => {
    Alert.alert(
      "Generar Reporte",
      `¿Deseas generar el reporte de ${reportType.title}?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Generar",
          onPress: async () => {
            try {
              setLoading(true);
              
              // Llamar a la función específica del servicio
              const reportResponse = await reportType.serviceFunction();
              
              if (reportResponse.success) {
                setLoading(false);
                Alert.alert(
                  "Reporte Generado",
                  `El reporte de ${reportType.title} ha sido generado exitosamente.`,
                  [
                    { 
                      text: "Ver Reporte", 
                      onPress: () => navigateToReport(reportType, reportResponse.data) 
                    },
                    { text: "Cerrar" },
                  ]
                );
              } else {
                throw new Error(reportResponse.message || "Error al generar el reporte");
              }
            } catch (error) {
              setLoading(false);
              console.error(`Error generando reporte ${reportType.id}:`, error);
              Alert.alert(
                "Error",
                `No se pudo generar el reporte de ${reportType.title}. Por favor, intenta nuevamente.`
              );
            }
          },
        },
      ]
    );
  };

  const navigateToReport = (reportType, reportData) => {
    // Navegación a pantalla específica del reporte con datos
    navigation.navigate("ReportDetail", { 
      reportId: reportType.id,
      reportTitle: reportType.title,
      reportData: reportData
    });
  };

  const handleExportData = () => {
    Alert.alert(
      "Exportar Datos",
      "Selecciona el formato de exportación:",
      [
        { text: "Cancelar", style: "cancel" },
        { text: "PDF", onPress: () => handleExportReport("pdf") },
        { text: "Excel", onPress: () => handleExportReport("excel") },
        { text: "CSV", onPress: () => handleExportReport("csv") },
      ]
    );
  };

  const handleExportReport = async (format) => {
    try {
      setLoading(true);
      
      const exportData = {
        reportType: "general",
        format: format,
        data: reportData,
        generatedBy: user.id,
        timestamp: new Date().toISOString()
      };
      
      const exportResponse = await exportReport(exportData);
      
      if (exportResponse.success) {
        Alert.alert(
          "Exportación Exitosa",
          `Tu reporte se ha exportado exitosamente en formato ${format.toUpperCase()}.`,
          [
            { text: "OK" }
          ]
        );
      } else {
        throw new Error(exportResponse.message || "Error al exportar");
      }
    } catch (error) {
      console.error("Error exportando reporte:", error);
      Alert.alert(
        "Error de Exportación",
        `No se pudo exportar el reporte en formato ${format.toUpperCase()}. Por favor, intenta nuevamente.`
      );
    } finally {
      setLoading(false);
    }
  };

  const renderReportCard = (report) => (
    <TouchableOpacity
      key={report.id}
      style={styles.reportCard}
      onPress={() => handleGenerateReport(report)}
      activeOpacity={0.7}
    >
      <View style={styles.reportCardContent}>
        <View style={[styles.reportIcon, { backgroundColor: `${report.color}15` }]}>
          <Ionicons name={report.icon} size={32} color={report.color} />
        </View>
        <View style={styles.reportInfo}>
          <Text style={styles.reportTitle}>{report.title}</Text>
          <Text style={styles.reportSubtitle}>{report.subtitle}</Text>
          <Text style={styles.reportDescription}>{report.description}</Text>
        </View>
        <View style={styles.reportAction}>
          <Icon name="arrow-forward-ios" size={16} color={COLORS.textLight} />
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <ScreenLayoutAdmin navigation={navigation}>
      <View style={styles.container}>
        <ScrollView
          style={styles.scrollView}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={COLORS.primary}
            />
          }
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.headerTitle}>Reportes Agrícolas</Text>
              <Text style={styles.headerSubtitle}>
                Análisis completo de tu operación agrícola
              </Text>
            </View>
            <TouchableOpacity
              style={styles.exportButton}
              onPress={handleExportData}
            >
              <Icon name="file-download" size={24} color={COLORS.primary} />
            </TouchableOpacity>
          </View>

          {/* Quick Stats */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Resumen General</Text>
            <Text style={styles.sectionSubtitle}>
              Indicadores clave de tu operación
            </Text>
            
            {quickStats.length > 0 ? (
              <View style={styles.statsGrid}>
                {quickStats.map((stat, index) => (
                  <View key={index} style={styles.statCard}>
                    <View style={styles.statHeader}>
                      <View style={[styles.statIcon, { backgroundColor: `${stat.color}15` }]}>
                        <Icon name={stat.icon} size={20} color={stat.color} />
                      </View>
                    </View>
                    <Text style={styles.statValue}>{stat.value}</Text>
                    <Text style={styles.statLabel}>{stat.title}</Text>
                    <Text style={styles.statSubtitle}>{stat.subtitle}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={styles.loadingText}>Cargando estadísticas...</Text>
              </View>
            )}
          </View>

          {/* Reports List */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Reportes Detallados</Text>
            <Text style={styles.sectionSubtitle}>
              Selecciona el tipo de análisis que deseas generar
            </Text>
            
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={styles.loadingText}>Cargando datos...</Text>
              </View>
            ) : (
              <View style={styles.reportsContainer}>
                {reportTypes.map(renderReportCard)}
              </View>
            )}
          </View>

          {/* Recent Reports */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Reportes Recientes</Text>
              <TouchableOpacity>
                <Text style={styles.viewAllText}>Ver todos</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.recentReportsContainer}>
              <View style={styles.recentReportItem}>
                <View style={styles.recentReportInfo}>
                  <Icon name="people" size={20} color={COLORS.primary} />
                  <View style={styles.recentReportText}>
                    <Text style={styles.recentReportTitle}>Postulaciones</Text>
                    <Text style={styles.recentReportDate}>
                      {quickStats[0]?.value || "0"} aplicaciones este mes
                    </Text>
                  </View>
                </View>
                <TouchableOpacity style={styles.downloadButton}>
                  <Icon name="download" size={16} color={COLORS.textLight} />
                </TouchableOpacity>
              </View>

              <View style={styles.recentReportItem}>
                <View style={styles.recentReportInfo}>
                  <Icon name="eco" size={20} color={COLORS.success} />
                  <View style={styles.recentReportText}>
                    <Text style={styles.recentReportTitle}>Productividad Fincas</Text>
                    <Text style={styles.recentReportDate}>
                      {quickStats[1]?.value || "0"} fincas analizadas
                    </Text>
                  </View>
                </View>
                <TouchableOpacity style={styles.downloadButton}>
                  <Icon name="download" size={16} color={COLORS.textLight} />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Bottom Spacing */}
          <View style={styles.bottomSpacing} />
        </ScrollView>
        <CustomTabBarAdmin 
          navigation={navigation} 
          state={{
            index: -1, // Ningún tab activo (Reports no está en la lista)
            routes: [
              { name: 'AdminHome' },
              { name: 'CropTypes' },
              { name: 'UsersApp' },
              { name: 'QualificationQuestions' }
            ]
          }}
        />
      </View>
    </ScreenLayoutAdmin>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.text,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  exportButton: {
    padding: 12,
    backgroundColor: `${COLORS.primary}10`,
    borderRadius: 12,
  },
  section: {
    padding: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.text,
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 16,
  },
  viewAllText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: "500",
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  statCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    width: (screenWidth - 64) / 2,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  statValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.text,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: COLORS.text,
    marginBottom: 2,
  },
  statSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  reportsContainer: {
    gap: 12,
  },
  reportCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  reportCardContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
  },
  reportIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  reportInfo: {
    flex: 1,
  },
  reportTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.text,
    marginBottom: 4,
  },
  reportSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  reportDescription: {
    fontSize: 12,
    color: COLORS.textLight,
    lineHeight: 16,
  },
  reportAction: {
    padding: 8,
  },
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  loadingText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginTop: 12,
  },
  recentReportsContainer: {
    gap: 12,
  },
  recentReportItem: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  recentReportInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  recentReportText: {
    marginLeft: 12,
    flex: 1,
  },
  recentReportTitle: {
    fontSize: 14,
    fontWeight: "500",
    color: COLORS.text,
    marginBottom: 4,
  },
  recentReportDate: {
    fontSize: 12,
    color: COLORS.textLight,
  },
  downloadButton: {
    padding: 8,
  },
  bottomSpacing: {
    height: 100,
  },
});

export default ReportsScreen;