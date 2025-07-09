import React, { useState, useEffect } from "react";
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
  FlatList,
  SafeAreaView,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import { exportReport } from "../../services/adminService";

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

const ReportDetailScreen = ({ route, navigation }) => {
  const { reportId, reportTitle, reportData } = route.params;
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const handleExportReport = (format) => {
    Alert.alert(
      `Exportar en ${format.toUpperCase()}`,
      `¿Deseas exportar el reporte "${reportTitle}" en formato ${format.toUpperCase()}?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Exportar",
          onPress: async () => {
            try {
              setLoading(true);
              const exportData = {
                reportType: reportId,
                format: format,
                title: reportTitle,
                data: reportData,
                timestamp: new Date().toISOString()
              };
              
              const response = await exportReport(exportData);
              
              if (response.success) {
                Alert.alert(
                  "Exportación Exitosa",
                  `El reporte ha sido exportado en formato ${format.toUpperCase()}.`
                );
              }
            } catch (error) {
              Alert.alert("Error", "No se pudo exportar el reporte");
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleExportOptions = () => {
    Alert.alert(
      "Exportar Reporte",
      "Selecciona el formato de exportación:",
      [
        { text: "Cancelar", style: "cancel" },
        { text: "PDF", onPress: () => handleExportReport("pdf") },
        { text: "Excel", onPress: () => handleExportReport("excel") },
        { text: "CSV", onPress: () => handleExportReport("csv") },
      ]
    );
  };

  const renderSummaryCard = (title, data) => (
    <View style={styles.summaryCard}>
      <Text style={styles.summaryTitle}>{title}</Text>
      <View style={styles.summaryGrid}>
        {Object.entries(data).map(([key, value], index) => (
          <View key={index} style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>
              {key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}
            </Text>
            <Text style={styles.summaryValue}>{value}</Text>
          </View>
        ))}
      </View>
    </View>
  );

  const renderApplicationsReport = () => {
    if (!reportData.summary) return null;

    return (
      <View>
        {renderSummaryCard("Resumen de Postulaciones", {
          total: reportData.summary.total,
          aceptadas: reportData.summary.accepted,
          rechazadas: reportData.summary.rejected,
          pendientes: reportData.summary.pending,
          tiempoRespuesta: `${reportData.summary.averageResponseTime} días`,
        })}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Distribución por Estado</Text>
          <View style={styles.statusGrid}>
            {Object.entries(reportData.statusBreakdown || {}).map(([status, count]) => (
              <View key={status} style={styles.statusCard}>
                <View style={[
                  styles.statusIcon,
                  { backgroundColor: status === 'Aceptada' ? COLORS.success + '15' : 
                    status === 'Rechazada' ? COLORS.error + '15' : COLORS.warning + '15' }
                ]}>
                  <Icon 
                    name={status === 'Aceptada' ? 'check-circle' : 
                          status === 'Rechazada' ? 'cancel' : 'schedule'} 
                    size={24} 
                    color={status === 'Aceptada' ? COLORS.success : 
                           status === 'Rechazada' ? COLORS.error : COLORS.warning} 
                  />
                </View>
                <Text style={styles.statusCount}>{count}</Text>
                <Text style={styles.statusLabel}>{status}</Text>
              </View>
            ))}
          </View>
        </View>

        {reportData.applications && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Postulaciones Recientes</Text>
            {reportData.applications.slice(0, 5).map((app, index) => (
              <View key={index} style={styles.listItem}>
                <View style={styles.listItemInfo}>
                  <Text style={styles.listItemTitle}>{app.workerName}</Text>
                  <Text style={styles.listItemSubtitle}>{app.jobTitle}</Text>
                  <Text style={styles.listItemDetail}>{app.cropType}</Text>
                </View>
                <View style={[
                  styles.statusBadge,
                  { backgroundColor: app.status === 'Aceptada' ? COLORS.success : 
                    app.status === 'Rechazada' ? COLORS.error : COLORS.warning }
                ]}>
                  <Text style={styles.statusBadgeText}>{app.status}</Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  const renderFarmsReport = () => {
    if (!reportData.summary) return null;

    return (
      <View>
        {renderSummaryCard("Resumen de Fincas", {
          total: reportData.summary.total,
          activas: reportData.summary.active,
          inactivas: reportData.summary.inactive,
          hectareas: `${reportData.summary.totalHectares} ha`,
          tamanoPromedio: `${reportData.summary.averageSize} ha`,
        })}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Distribución por Tamaño</Text>
          <View style={styles.distributionGrid}>
            {Object.entries(reportData.distributions?.bySize || {}).map(([size, count]) => (
              <View key={size} style={styles.distributionCard}>
                <Icon 
                  name="landscape" 
                  size={24} 
                  color={size === 'small' ? COLORS.info : 
                         size === 'medium' ? COLORS.warning : COLORS.success} 
                />
                <Text style={styles.distributionCount}>{count}</Text>
                <Text style={styles.distributionLabel}>
                  {size === 'small' ? 'Pequeñas' : 
                   size === 'medium' ? 'Medianas' : 'Grandes'}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {reportData.farms && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Fincas Registradas</Text>
            {reportData.farms.slice(0, 5).map((farm, index) => (
              <View key={index} style={styles.listItem}>
                <View style={styles.listItemInfo}>
                  <Text style={styles.listItemTitle}>{farm.name}</Text>
                  <Text style={styles.listItemSubtitle}>{farm.owner}</Text>
                  <Text style={styles.listItemDetail}>
                    {farm.size} ha • {farm.location}
                  </Text>
                </View>
                <View style={[
                  styles.statusDot,
                  { backgroundColor: farm.status ? COLORS.success : COLORS.error }
                ]} />
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  const renderWorkersReport = () => {
    if (!reportData.summary) return null;

    return (
      <View>
        {renderSummaryCard("Resumen de Personal", {
          total: reportData.summary.total,
          activos: reportData.summary.active,
          inactivos: reportData.summary.inactive,
          tasaAceptacion: `${reportData.summary.averageAcceptanceRate}%`,
          calificacion: `${reportData.summary.averageRating}/5`,
        })}

        {reportData.workers && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Trabajadores Destacados</Text>
            {reportData.workers
              .filter(worker => worker.performance.averageRating >= 4)
              .slice(0, 5)
              .map((worker, index) => (
              <View key={index} style={styles.listItem}>
                <View style={styles.listItemInfo}>
                  <Text style={styles.listItemTitle}>{worker.name}</Text>
                  <Text style={styles.listItemSubtitle}>{worker.specialty}</Text>
                  <Text style={styles.listItemDetail}>
                    {worker.applications.total} postulaciones • {worker.applications.acceptanceRate}% aceptación
                  </Text>
                </View>
                <View style={styles.ratingContainer}>
                  <Icon name="star" size={16} color={COLORS.warning} />
                  <Text style={styles.ratingText}>{worker.performance.averageRating}</Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  const renderCropsReport = () => {
    if (!reportData.summary) return null;

    return (
      <View>
        {renderSummaryCard("Resumen de Cultivos", {
          tipos: reportData.summary.totalCropTypes,
          masDemandado: reportData.summary.mostDemanded,
          ofertas: reportData.summary.totalJobs,
          fincas: reportData.summary.totalFarmsInvolved,
          hectareas: `${reportData.summary.totalHectares} ha`,
        })}

        {reportData.trends && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Cultivos Más Demandados</Text>
            {reportData.trends.topCropsByDemand.map((crop, index) => (
              <View key={index} style={styles.listItem}>
                <View style={styles.rankContainer}>
                  <Text style={styles.rankNumber}>{index + 1}</Text>
                </View>
                <View style={styles.listItemInfo}>
                  <Text style={styles.listItemTitle}>{crop.name}</Text>
                  <Text style={styles.listItemSubtitle}>
                    {crop.jobOffers} ofertas de trabajo
                  </Text>
                  <Text style={styles.listItemDetail}>
                    {crop.farms} fincas involucradas
                  </Text>
                </View>
                <Icon name="trending-up" size={20} color={COLORS.success} />
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  const renderLowRatedWorkersReport = () => {
    if (!reportData.summary) return null;

    return (
      <View>
        {renderSummaryCard("Resumen de Calificaciones Bajas", {
          total: reportData.summary.total,
          calificacion: `${reportData.summary.averageRating}/5`,
          umbral: `< ${reportData.summary.threshold}`,
          necesitanEntrenamiento: reportData.recommendations?.requireTraining || 0,
          necesitanSupervision: reportData.recommendations?.needSupervision || 0,
        })}

        {reportData.summary.commonIssues && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Problemas Más Comunes</Text>
            {reportData.summary.commonIssues.map((issue, index) => (
              <View key={index} style={styles.issueItem}>
                <View style={styles.issueInfo}>
                  <Text style={styles.issueTitle}>{issue.issue}</Text>
                  <Text style={styles.issueCount}>{issue.count} menciones</Text>
                </View>
                <View style={styles.issueBar}>
                  <View 
                    style={[
                      styles.issueProgress,
                      { 
                        width: `${(issue.count / Math.max(...reportData.summary.commonIssues.map(i => i.count))) * 100}%`,
                        backgroundColor: COLORS.error 
                      }
                    ]} 
                  />
                </View>
              </View>
            ))}
          </View>
        )}

        {reportData.workers && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Trabajadores con Calificaciones Bajas</Text>
            {reportData.workers.slice(0, 5).map((worker, index) => (
              <View key={index} style={styles.listItem}>
                <View style={styles.listItemInfo}>
                  <Text style={styles.listItemTitle}>{worker.name}</Text>
                  <Text style={styles.listItemSubtitle}>{worker.specialty}</Text>
                  <Text style={styles.listItemDetail}>
                    {worker.performance.acceptanceRate}% aceptación
                  </Text>
                </View>
                <View style={styles.lowRatingContainer}>
                  <Icon name="warning" size={16} color={COLORS.error} />
                  <Text style={styles.lowRatingText}>{worker.ratings.overall}</Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  const renderReportContent = () => {
    switch (reportId) {
      case 'applications':
        return renderApplicationsReport();
      case 'farms':
        return renderFarmsReport();
      case 'workers':
        return renderWorkersReport();
      case 'crops':
        return renderCropsReport();
      case 'low-rated-workers':
        return renderLowRatedWorkersReport();
      default:
        return (
          <View style={styles.emptyContainer}>
            <Icon name="description" size={80} color={COLORS.textLight} />
            <Text style={styles.emptyTitle}>Reporte no disponible</Text>
            <Text style={styles.emptyDescription}>
              El tipo de reporte solicitado no está disponible
            </Text>
          </View>
        );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        
        <View style={styles.headerTitle}>
          <Text style={styles.headerTitleText}>{reportTitle}</Text>
          <Text style={styles.headerSubtitle}>
            Generado el {new Date().toLocaleDateString('es-ES')}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.exportButton}
          onPress={handleExportOptions}
        >
          <Icon name="file-download" size={24} color="white" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              setTimeout(() => setRefreshing(false), 1000);
            }}
            tintColor={COLORS.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Procesando reporte...</Text>
          </View>
        ) : (
          renderReportContent()
        )}

        <View style={styles.bottomSpacing} />
      </ScrollView>
    </SafeAreaView>
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
    alignItems: "center",
    justifyContent: "space-between",
    padding: 20,
    backgroundColor: COLORS.primary,
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
  headerTitleText: {
    fontSize: 18,
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
  exportButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.text,
    marginBottom: 16,
  },
  summaryCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 20,
    margin: 20,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.text,
    marginBottom: 16,
  },
  summaryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },
  summaryItem: {
    width: (screenWidth - 80) / 2,
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.text,
  },
  statusGrid: {
    flexDirection: "row",
    gap: 12,
  },
  statusCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    elevation: 1,
  },
  statusIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  statusCount: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.text,
    marginBottom: 4,
  },
  statusLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: "center",
  },
  distributionGrid: {
    flexDirection: "row",
    gap: 12,
  },
  distributionCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    elevation: 1,
  },
  distributionCount: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.text,
    marginTop: 8,
    marginBottom: 4,
  },
  distributionLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: "center",
  },
  listItem: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    elevation: 1,
  },
  listItemInfo: {
    flex: 1,
  },
  listItemTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.text,
    marginBottom: 4,
  },
  listItemSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  listItemDetail: {
    fontSize: 12,
    color: COLORS.textLight,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusBadgeText: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  rankContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  rankNumber: {
    color: "white",
    fontSize: 14,
    fontWeight: "bold",
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: "bold",
    color: COLORS.text,
  },
  lowRatingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  lowRatingText: {
    fontSize: 14,
    fontWeight: "bold",
    color: COLORS.error,
  },
  issueItem: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 1,
  },
  issueInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  issueTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.text,
    textTransform: "capitalize",
  },
  issueCount: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  issueBar: {
    height: 4,
    backgroundColor: COLORS.border,
    borderRadius: 2,
    overflow: "hidden",
  },
  issueProgress: {
    height: "100%",
    borderRadius: 2,
  },
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 60,
  },
  loadingText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginTop: 16,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: COLORS.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 22,
  },
  bottomSpacing: {
    height: 40,
  },
});

export default ReportDetailScreen;