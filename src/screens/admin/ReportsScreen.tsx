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
import ScreenLayout from "../../components/ScreenLayout";
import CustomTabBar from "../../components/CustomTabBar";

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

  const reportTypes = [
    {
      id: "messages",
      title: "Reporte de Mensajes",
      subtitle: "Estadísticas de conversaciones y mensajes",
      icon: "chat-bubble-outline",
      color: COLORS.primary,
      gradient: [COLORS.primary, COLORS.primaryLight],
      description: "Analiza el volumen de mensajes enviados y recibidos",
    },
    {
      id: "activity",
      title: "Actividad de Usuario",
      subtitle: "Patrones de uso y tiempo activo",
      icon: "analytics-outline",
      color: COLORS.success,
      gradient: [COLORS.success, COLORS.teal],
      description: "Visualiza tu actividad diaria y semanal en la app",
    },
    {
      id: "contacts",
      title: "Análisis de Contactos",
      subtitle: "Interacciones con otros usuarios",
      icon: "people-outline",
      color: COLORS.info,
      gradient: [COLORS.info, COLORS.purple],
      description: "Estadísticas de tus contactos más frecuentes",
    },
    {
      id: "performance",
      title: "Rendimiento de Red",
      subtitle: "Velocidad y calidad de conexión",
      icon: "speedometer-outline",
      color: COLORS.orange,
      gradient: [COLORS.orange, COLORS.warning],
      description: "Monitorea la calidad de tu conexión y rendimiento",
    },
    {
      id: "usage",
      title: "Uso de Funciones",
      subtitle: "Características más utilizadas",
      icon: "bar-chart-outline",
      color: COLORS.purple,
      gradient: [COLORS.purple, COLORS.accent],
      description: "Descubre qué funciones de la app usas más",
    },
    {
      id: "timeline",
      title: "Línea de Tiempo",
      subtitle: "Historial de actividades",
      icon: "time-outline",
      color: COLORS.teal,
      gradient: [COLORS.teal, COLORS.success],
      description: "Revisa tu historial cronológico de actividades",
    },
  ];

  const loadReportData = useCallback(async () => {
    try {
      setLoading(true);
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setReportData({
        loaded: true,
        lastUpdate: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Error loading report data:", error);
      Alert.alert("Error", "No se pudieron cargar los datos del reporte");
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

  const handleGenerateReport = (reportType) => {
    Alert.alert(
      "Generar Reporte",
      `¿Deseas generar el reporte de ${reportType.title}?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Generar",
          onPress: () => {
            setLoading(true);
            // Aquí implementarías la lógica para generar el reporte específico
            setTimeout(() => {
              setLoading(false);
              Alert.alert(
                "Reporte Generado",
                `El reporte de ${reportType.title} ha sido generado exitosamente.`,
                [
                  { text: "Ver Reporte", onPress: () => navigateToReport(reportType) },
                  { text: "Cerrar" },
                ]
              );
            }, 2000);
          },
        },
      ]
    );
  };

  const navigateToReport = (reportType) => {
    // Navegación a pantalla específica del reporte
    navigation.navigate("ReportDetail", { 
      reportId: reportType.id,
      reportTitle: reportType.title 
    });
  };

  const handleExportData = () => {
    Alert.alert(
      "Exportar Datos",
      "Selecciona el formato de exportación:",
      [
        { text: "Cancelar", style: "cancel" },
        { text: "PDF", onPress: () => exportReport("pdf") },
        { text: "Excel", onPress: () => exportReport("excel") },
        { text: "CSV", onPress: () => exportReport("csv") },
      ]
    );
  };

  const exportReport = (format) => {
    Alert.alert(
      "Exportando...",
      `Tu reporte se está exportando en formato ${format.toUpperCase()}. Te notificaremos cuando esté listo.`
    );
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
    <ScreenLayout navigation={navigation}>
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
              <Text style={styles.headerTitle}>Reportes y Análisis</Text>
              <Text style={styles.headerSubtitle}>
                Genera informes detallados de tu actividad
              </Text>
            </View>
            <TouchableOpacity
              style={styles.exportButton}
              onPress={handleExportData}
            >
              <Icon name="file-download" size={24} color={COLORS.primary} />
            </TouchableOpacity>
          </View>

          {/* Reports List */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tipos de Reportes</Text>
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
                  <Icon name="description" size={20} color={COLORS.primary} />
                  <View style={styles.recentReportText}>
                    <Text style={styles.recentReportTitle}>Reporte Mensual - Marzo</Text>
                    <Text style={styles.recentReportDate}>Generado hace 2 días</Text>
                  </View>
                </View>
                <TouchableOpacity style={styles.downloadButton}>
                  <Icon name="download" size={16} color={COLORS.textLight} />
                </TouchableOpacity>
              </View>

              <View style={styles.recentReportItem}>
                <View style={styles.recentReportInfo}>
                  <Icon name="analytics" size={20} color={COLORS.success} />
                  <View style={styles.recentReportText}>
                    <Text style={styles.recentReportTitle}>Análisis de Actividad</Text>
                    <Text style={styles.recentReportDate}>Generado hace 1 semana</Text>
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
        <CustomTabBar navigation={navigation} currentRoute="Reports" />

      </View>
    </ScreenLayout>
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
    shadowColor: COLORS.shadow,
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
  statTrend: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  trendText: {
    fontSize: 12,
    fontWeight: "500",
  },
  statValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.text,
    marginBottom: 4,
  },
  statLabel: {
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
    shadowColor: COLORS.shadow,
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